const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Equipment = require("../models/Equipment");
const { uploadMemory, uploadToCloudinary, cloudinary } = require("../middleware/upload");

const FOLDER = "lighthousecinema/rental";
const uploadFields = uploadMemory.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "gallery", maxCount: 20 },
]);

function slugify(input) {
    return String(input)
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function parseJson(value, fallback) {
    if (value === undefined) return fallback;
    if (typeof value !== "string") return value;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

const toBool = (value) => value === true || value === "true" || value === "on";

// Returns every problem found, keyed by field, so the backoffice can show them all at once.
function publishIssues(doc) {
    const fields = {};
    if (!doc.name) fields.name = "Il nome è obbligatorio per pubblicare.";
    if (!doc.slug) fields.slug = "Lo slug è obbligatorio per pubblicare.";
    if (!doc.category) fields.category = "La categoria è obbligatoria per pubblicare.";
    if (!doc.brand) fields.brand = "La marca è obbligatoria per pubblicare.";
    if (!doc.shortDescription) fields.shortDescription = "La descrizione breve è obbligatoria per pubblicare.";
    if (!doc.hasCover) fields.coverImage = "L'immagine di copertina è obbligatoria per pubblicare.";
    if (doc.priceMode === "visible" && doc.priceCents == null) {
        fields.priceCents = "Il prezzo è obbligatorio quando è impostato come visibile.";
    }
    return fields;
}

// Copies the text fields of a multipart body onto the document.
function applyBody(item, body) {
    const strings = ["name", "category", "brand", "model", "shortDescription", "description", "priceMode", "currency", "rentalStatus", "status"];
    strings.forEach((key) => {
        if (body[key] !== undefined) item[key] = body[key];
    });

    // The slug is frozen after the first publication so shared links never break.
    if (!item.firstPublishedAt) {
        item.slug = slugify(body.slug || item.slug || item.name || "");
    }

    if (body.priceCents !== undefined) {
        item.priceCents = body.priceCents === "" || body.priceCents === "null" ? null : Number(body.priceCents);
    }
    if (body.vatIncluded !== undefined) item.vatIncluded = toBool(body.vatIncluded);
    if (body.featured !== undefined) item.featured = toBool(body.featured);
    if (body.sortOrder !== undefined && body.sortOrder !== "") item.sortOrder = Number(body.sortOrder);

    if (body.specs !== undefined) {
        item.specs = parseJson(body.specs, []).filter((s) => s && s.label && s.value);
    }
    if (body.kitContents !== undefined) {
        item.kitContents = parseJson(body.kitContents, []).filter(Boolean);
    }
}

async function uploadImage(file, alt, order) {
    const result = await uploadToCloudinary(file.buffer, { folder: FOLDER, resource_type: "image" });
    return {
        publicId: result.public_id,
        url: result.secure_url,
        alt,
        width: result.width,
        height: result.height,
        order,
    };
}

async function destroyImages(publicIds) {
    await Promise.all(publicIds.map((id) => cloudinary.uploader.destroy(id).catch(() => null)));
}

function errorResponse(res, error) {
    if (error.code === 11000) {
        return res.status(400).json({ message: "Esiste già un'attrezzatura con questo slug.", fields: { slug: "Slug già in uso." } });
    }
    const status = error.name === "ValidationError" || error.name === "CastError" ? 400 : 500;
    res.status(status).json({ message: error.message });
}

// Creates or updates an item: validates everything before uploading, so a refused
// save never leaves orphan files on Cloudinary.
async function saveItem(item, req, res) {
    const { body } = req;
    const files = req.files || {};
    const isNew = item.isNew;

    applyBody(item, body);

    const coverFile = files.coverImage && files.coverImage[0];
    const newGalleryFiles = files.gallery || [];
    const fallbackAlt = item.name || "Attrezzatura";

    const issues = item.status === "published"
        ? publishIssues({ ...item.toObject(), hasCover: Boolean(coverFile || (item.coverImage && item.coverImage.url)) })
        : {};
    if (Object.keys(issues).length > 0) {
        return res.status(400).json({ message: Object.values(issues).join(" "), fields: issues });
    }
    await item.validate();

    const removedIds = [];

    // Existing gallery images to keep, in the order sent by the backoffice.
    if (body.galleryKeep !== undefined) {
        const keep = parseJson(body.galleryKeep, []);
        const current = new Map(item.gallery.map((img) => [img.publicId, img.toObject()]));
        const kept = keep
            .filter((entry) => current.has(entry.publicId))
            .map((entry) => ({ ...current.get(entry.publicId), alt: entry.alt || fallbackAlt }));
        const keptIds = new Set(kept.map((img) => img.publicId));
        item.gallery.forEach((img) => {
            if (!keptIds.has(img.publicId)) removedIds.push(img.publicId);
        });
        item.gallery = kept;
    }

    const newAlts = parseJson(body.galleryNewAlts, []);
    const uploaded = await Promise.all(
        newGalleryFiles.map((file, i) => uploadImage(file, newAlts[i] || fallbackAlt, item.gallery.length + i))
    );
    item.gallery = [...item.gallery.map((img) => (img.toObject ? img.toObject() : img)), ...uploaded]
        .map((img, i) => ({ ...img, order: i }));

    if (coverFile) {
        if (item.coverImage && item.coverImage.publicId) removedIds.push(item.coverImage.publicId);
        item.coverImage = await uploadImage(coverFile, body.coverAlt || fallbackAlt, 0);
    } else if (item.coverImage && item.coverImage.url && body.coverAlt !== undefined) {
        item.coverImage.alt = body.coverAlt || fallbackAlt;
    }

    if (item.status === "published" && !item.firstPublishedAt) {
        item.firstPublishedAt = new Date();
    }

    const saved = await item.save();
    await destroyImages(removedIds);
    res.status(isNew ? 201 : 200).json(saved);
}

// GET - Public list: published and not retired. `?all=1` returns everything (backoffice).
router.get("/", async (req, res) => {
    try {
        const filter = req.query.all === "1" ? {} : { status: "published", rentalStatus: { $ne: "retired" } };
        if (req.query.category) filter.category = req.query.category;
        const items = await Equipment.find(filter).sort({ featured: -1, sortOrder: 1, name: 1 });
        res.json(items);
    } catch (error) {
        errorResponse(res, error);
    }
});

// GET - Single item by id (backoffice) or by slug (public, published only).
router.get("/:idOrSlug", async (req, res) => {
    try {
        const { idOrSlug } = req.params;
        const item = mongoose.isValidObjectId(idOrSlug)
            ? await Equipment.findById(idOrSlug)
            : await Equipment.findOne({ slug: idOrSlug, status: "published" });
        if (!item) return res.status(404).json({ message: "Attrezzatura non trovata" });
        res.json(item);
    } catch (error) {
        errorResponse(res, error);
    }
});

// POST - Create
router.post("/", uploadFields, async (req, res) => {
    try {
        await saveItem(new Equipment(), req, res);
    } catch (error) {
        errorResponse(res, error);
    }
});

// PUT - Update
router.put("/:id", uploadFields, async (req, res) => {
    try {
        const item = await Equipment.findById(req.params.id);
        if (!item) return res.status(404).json({ message: "Attrezzatura non trovata" });
        await saveItem(item, req, res);
    } catch (error) {
        errorResponse(res, error);
    }
});

// DELETE - Remove item and its images
router.delete("/:id", async (req, res) => {
    try {
        const item = await Equipment.findById(req.params.id);
        if (!item) return res.status(404).json({ message: "Attrezzatura non trovata" });

        const ids = item.gallery.map((img) => img.publicId);
        if (item.coverImage && item.coverImage.publicId) ids.push(item.coverImage.publicId);

        await Equipment.findByIdAndDelete(req.params.id);
        await destroyImages(ids);
        res.json({ message: "Attrezzatura eliminata con successo" });
    } catch (error) {
        errorResponse(res, error);
    }
});

module.exports = router;
