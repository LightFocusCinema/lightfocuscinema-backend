const express = require("express");
const router = express.Router();
const Videoclip = require("../models/Videoclip");
const { uploadMemory, uploadToCloudinary, cloudinary } = require("../middleware/upload");

// Campi upload: foto, video, clienteLogo, backstage
const uploadFields = uploadMemory.fields([
    { name: "foto", maxCount: 1 },
    { name: "video", maxCount: 1 },
    { name: "clienteLogo", maxCount: 1 },
    { name: "backstage", maxCount: 1 },
]);

// GET - Tutti i videoclip
router.get("/", async (req, res) => {
    try {
        const items = await Videoclip.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET - Singolo videoclip
router.get("/:id", async (req, res) => {
    try {
        const item = await Videoclip.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: "Videoclip non trovato" });
        }
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST - Crea nuovo videoclip
router.post("/", uploadFields, async (req, res) => {
    try {
        const { titolo, tagGenere, clienteNome } = req.body;

        // Validazione file obbligatori
        if (!req.files.foto || !req.files.video) {
            return res.status(400).json({
                message: "Foto e video sono obbligatori",
            });
        }

        // Upload foto su Cloudinary
        const fotoResult = await uploadToCloudinary(req.files.foto[0].buffer, {
            folder: "lighthousecinema/videoclip/foto",
            resource_type: "image",
        });

        // Upload video su Cloudinary
        const videoResult = await uploadToCloudinary(req.files.video[0].buffer, {
            folder: "lighthousecinema/videoclip/video",
            resource_type: "video",
        });

        // Upload logo cliente (opzionale)
        let logoData = { url: "", publicId: "" };
        if (req.files.clienteLogo && req.files.clienteLogo[0]) {
            const logoResult = await uploadToCloudinary(req.files.clienteLogo[0].buffer, {
                folder: "lighthousecinema/videoclip/loghi",
                resource_type: "image",
            });
            logoData = {
                url: logoResult.secure_url,
                publicId: logoResult.public_id,
            };
        }

        // Upload backstage (opzionale)
        let backstageData = { url: "", publicId: "" };
        if (req.files.backstage && req.files.backstage[0]) {
            const backstageResult = await uploadToCloudinary(req.files.backstage[0].buffer, {
                folder: "lighthousecinema/videoclip/backstage",
                resource_type: "video",
            });
            backstageData = {
                url: backstageResult.secure_url,
                publicId: backstageResult.public_id,
            };
        }

        const newItem = new Videoclip({
            titolo,
            foto: {
                url: fotoResult.secure_url,
                publicId: fotoResult.public_id,
            },
            video: {
                url: videoResult.secure_url,
                publicId: videoResult.public_id,
            },
            tagGenere: tagGenere || "",
            cliente: {
                nome: clienteNome || "",
                logo: logoData,
            },
            backstage: backstageData,
        });

        const saved = await newItem.save();
        res.status(201).json(saved);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT - Aggiorna videoclip
router.put("/:id", uploadFields, async (req, res) => {
    try {
        const item = await Videoclip.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: "Videoclip non trovato" });
        }

        const { titolo, tagGenere, clienteNome } = req.body;

        // Aggiorna campi testo
        if (titolo) item.titolo = titolo;
        if (tagGenere !== undefined) item.tagGenere = tagGenere;
        if (clienteNome !== undefined) item.cliente.nome = clienteNome || "";

        // Aggiorna foto se caricata
        if (req.files.foto && req.files.foto[0]) {
            if (item.foto.publicId) {
                await cloudinary.uploader.destroy(item.foto.publicId);
            }
            const fotoResult = await uploadToCloudinary(req.files.foto[0].buffer, {
                folder: "lighthousecinema/videoclip/foto",
                resource_type: "image",
            });
            item.foto = { url: fotoResult.secure_url, publicId: fotoResult.public_id };
        }

        // Aggiorna video se caricato
        if (req.files.video && req.files.video[0]) {
            if (item.video.publicId) {
                await cloudinary.uploader.destroy(item.video.publicId, { resource_type: "video" });
            }
            const videoResult = await uploadToCloudinary(req.files.video[0].buffer, {
                folder: "lighthousecinema/videoclip/video",
                resource_type: "video",
            });
            item.video = { url: videoResult.secure_url, publicId: videoResult.public_id };
        }

        // Aggiorna logo cliente se caricato
        if (req.files.clienteLogo && req.files.clienteLogo[0]) {
            if (item.cliente && item.cliente.logo && item.cliente.logo.publicId) {
                await cloudinary.uploader.destroy(item.cliente.logo.publicId);
            }
            const logoResult = await uploadToCloudinary(req.files.clienteLogo[0].buffer, {
                folder: "lighthousecinema/videoclip/loghi",
                resource_type: "image",
            });
            item.cliente.logo = { url: logoResult.secure_url, publicId: logoResult.public_id };
        }

        // Aggiorna backstage se caricato
        if (req.files.backstage && req.files.backstage[0]) {
            if (item.backstage.publicId) {
                await cloudinary.uploader.destroy(item.backstage.publicId, { resource_type: "video" });
            }
            const backstageResult = await uploadToCloudinary(req.files.backstage[0].buffer, {
                folder: "lighthousecinema/videoclip/backstage",
                resource_type: "video",
            });
            item.backstage = { url: backstageResult.secure_url, publicId: backstageResult.public_id };
        }

        const updated = await item.save();
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE - Elimina videoclip
router.delete("/:id", async (req, res) => {
    try {
        const item = await Videoclip.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: "Videoclip non trovato" });
        }

        // Elimina file da Cloudinary
        if (item.foto.publicId) {
            await cloudinary.uploader.destroy(item.foto.publicId);
        }
        if (item.video.publicId) {
            await cloudinary.uploader.destroy(item.video.publicId, { resource_type: "video" });
        }
        if (item.cliente && item.cliente.logo && item.cliente.logo.publicId) {
            await cloudinary.uploader.destroy(item.cliente.logo.publicId);
        }
        if (item.backstage.publicId) {
            await cloudinary.uploader.destroy(item.backstage.publicId, { resource_type: "video" });
        }

        await Videoclip.findByIdAndDelete(req.params.id);
        res.json({ message: "Videoclip eliminato con successo" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
