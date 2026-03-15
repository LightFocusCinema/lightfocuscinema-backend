const express = require("express");
const router = express.Router();
const Evento = require("../models/Evento");
const { uploadMemory, uploadToCloudinary, cloudinary } = require("../middleware/upload");

// Upload solo foto di copertina
const uploadFields = uploadMemory.fields([{ name: "foto", maxCount: 1 }]);

// GET - Tutti gli eventi (ordinati per prima data, i più vicini prima)
router.get("/", async (req, res) => {
    try {
        const items = await Evento.find().sort({ "date.0": 1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET - Singolo evento
router.get("/:id", async (req, res) => {
    try {
        const item = await Evento.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: "Evento non trovato" });
        }
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST - Crea nuovo evento
router.post("/", uploadFields, async (req, res) => {
    try {
        const { titolo, date, oraInizio, oraFine, descrizione, partecipanti, moderatori } = req.body;

        // Validazione foto obbligatoria
        if (!req.files.foto || !req.files.foto[0]) {
            return res.status(400).json({ message: "La foto di copertina è obbligatoria" });
        }

        // Upload foto su Cloudinary
        const fotoResult = await uploadToCloudinary(req.files.foto[0].buffer, {
            folder: "lighthousecinema/eventi/foto",
            resource_type: "image",
        });

        // Parsing date (arriva come JSON string o array)
        let parsedDate = date;
        if (typeof date === "string") {
            try {
                parsedDate = JSON.parse(date);
            } catch {
                // Se non è JSON, trattala come singola data
                parsedDate = [date];
            }
        }
        if (!Array.isArray(parsedDate)) {
            parsedDate = [parsedDate];
        }

        // Parsing partecipanti e moderatori (arrivano come JSON string o array)
        let parsedPartecipanti = partecipanti || [];
        let parsedModeratori = moderatori || [];

        if (typeof parsedPartecipanti === "string") {
            try { parsedPartecipanti = JSON.parse(parsedPartecipanti); } catch { parsedPartecipanti = parsedPartecipanti ? [parsedPartecipanti] : []; }
        }
        if (typeof parsedModeratori === "string") {
            try { parsedModeratori = JSON.parse(parsedModeratori); } catch { parsedModeratori = parsedModeratori ? [parsedModeratori] : []; }
        }

        const newItem = new Evento({
            titolo,
            foto: {
                url: fotoResult.secure_url,
                publicId: fotoResult.public_id,
            },
            date: parsedDate,
            oraInizio,
            oraFine,
            descrizione,
            partecipanti: parsedPartecipanti,
            moderatori: parsedModeratori,
        });

        const saved = await newItem.save();
        res.status(201).json(saved);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT - Aggiorna evento
router.put("/:id", uploadFields, async (req, res) => {
    try {
        const item = await Evento.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: "Evento non trovato" });
        }

        const { titolo, date, oraInizio, oraFine, descrizione, partecipanti, moderatori } = req.body;

        // Aggiorna campi testo
        if (titolo) item.titolo = titolo;
        if (oraInizio) item.oraInizio = oraInizio;
        if (oraFine) item.oraFine = oraFine;
        if (descrizione) item.descrizione = descrizione;

        // Aggiorna date
        if (date) {
            let parsedDate = date;
            if (typeof date === "string") {
                try { parsedDate = JSON.parse(date); } catch { parsedDate = [date]; }
            }
            if (!Array.isArray(parsedDate)) parsedDate = [parsedDate];
            item.date = parsedDate;
        }

        // Aggiorna partecipanti
        if (partecipanti !== undefined) {
            let parsed = partecipanti;
            if (typeof parsed === "string") {
                try { parsed = JSON.parse(parsed); } catch { parsed = parsed ? [parsed] : []; }
            }
            item.partecipanti = parsed;
        }

        // Aggiorna moderatori
        if (moderatori !== undefined) {
            let parsed = moderatori;
            if (typeof parsed === "string") {
                try { parsed = JSON.parse(parsed); } catch { parsed = parsed ? [parsed] : []; }
            }
            item.moderatori = parsed;
        }

        // Aggiorna foto se caricata
        if (req.files.foto && req.files.foto[0]) {
            if (item.foto.publicId) {
                await cloudinary.uploader.destroy(item.foto.publicId);
            }
            const fotoResult = await uploadToCloudinary(req.files.foto[0].buffer, {
                folder: "lighthousecinema/eventi/foto",
                resource_type: "image",
            });
            item.foto = { url: fotoResult.secure_url, publicId: fotoResult.public_id };
        }

        const updated = await item.save();
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PATCH - Aggiungi date singole all'evento
router.patch("/:id/date", async (req, res) => {
    try {
        const item = await Evento.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: "Evento non trovato" });
        }

        const { aggiungi, rimuovi } = req.body;

        // Aggiungi nuove date
        if (aggiungi && Array.isArray(aggiungi)) {
            aggiungi.forEach((d) => {
                const nuovaData = new Date(d);
                // Evita duplicati
                if (!item.date.some((existing) => existing.getTime() === nuovaData.getTime())) {
                    item.date.push(nuovaData);
                }
            });
        }

        // Rimuovi date specifiche
        if (rimuovi && Array.isArray(rimuovi)) {
            const daRimuovere = rimuovi.map((d) => new Date(d).getTime());
            item.date = item.date.filter((d) => !daRimuovere.includes(d.getTime()));
        }

        // Valida che rimanga almeno una data
        if (item.date.length === 0) {
            return res.status(400).json({ message: "L'evento deve avere almeno una data" });
        }

        // Ordina le date
        item.date.sort((a, b) => a - b);

        const updated = await item.save();
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE - Elimina evento
router.delete("/:id", async (req, res) => {
    try {
        const item = await Evento.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: "Evento non trovato" });
        }

        // Elimina foto da Cloudinary
        if (item.foto.publicId) {
            await cloudinary.uploader.destroy(item.foto.publicId);
        }

        await Evento.findByIdAndDelete(req.params.id);
        res.json({ message: "Evento eliminato con successo" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
