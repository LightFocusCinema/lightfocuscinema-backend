const mongoose = require("mongoose");

// publicId identifies the asset on Cloudinary, so it can be replaced or deleted.
const imageSchema = new mongoose.Schema(
    {
        publicId: { type: String, required: true, trim: true },
        url: { type: String, required: true, trim: true },
        alt: { type: String, required: true, trim: true },
        width: Number,
        height: Number,
        order: { type: Number, default: 0 },
    },
    { _id: false }
);

// null means "no price": clearing the field in the backoffice must be allowed.
const integerCents = {
    min: 0,
    validate: {
        validator: (value) => value == null || Number.isInteger(value),
        message: "Il prezzo deve essere un intero in centesimi.",
    },
};

// Free label/value pairs on purpose: a light and a gimbal share no specs.
const specSchema = new mongoose.Schema(
    {
        label: { type: String, required: true, trim: true },
        value: { type: String, required: true, trim: true },
    },
    { _id: false }
);

const CATEGORIES = ["lighting", "cameras", "lenses", "audio", "stabilization", "grip", "accessories"];

const equipmentSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, trim: true },
        category: { type: String, required: true, enum: CATEGORIES },
        brand: { type: String, required: true, trim: true },
        model: { type: String, trim: true },
        shortDescription: { type: String, required: true, trim: true, maxlength: 200 },
        description: { type: String, trim: true },
        // Required to publish, not to save a draft — enforced by the rental route.
        coverImage: imageSchema,
        gallery: [imageSchema],
        specs: [specSchema],
        kitContents: [{ type: String, trim: true }],
        priceMode: { type: String, required: true, enum: ["on_request", "visible"], default: "on_request" },
        priceCents: { type: Number, ...integerCents },
        currency: { type: String, default: "EUR" },
        vatIncluded: { type: Boolean, default: false },
        // Editorial status and rental availability are independent.
        rentalStatus: {
            type: String,
            required: true,
            enum: ["available", "unavailable", "retired"],
            default: "available",
        },
        status: { type: String, required: true, enum: ["draft", "published", "archived"], default: "draft" },
        featured: { type: Boolean, default: false },
        sortOrder: { type: Number, default: 0 },
        // Set once on first publication; the slug is frozen from then on, so that
        // shared links keep working even across an unpublish.
        firstPublishedAt: Date,
    },
    { timestamps: true }
);

equipmentSchema.index({ slug: 1 }, { unique: true });
equipmentSchema.index({ status: 1, category: 1, sortOrder: 1 });

module.exports = mongoose.model("Equipment", equipmentSchema);
module.exports.CATEGORIES = CATEGORIES;
