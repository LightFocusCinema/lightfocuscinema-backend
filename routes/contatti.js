const express = require("express");
const router = express.Router();
const Contatto = require("../models/Contatto");

// GET - Tutti i contatti (per il pannello admin)
router.get("/", async (req, res) => {
    try {
        const contatti = await Contatto.find().sort({ createdAt: -1 });
        res.json(contatti);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET - Singolo contatto
router.get("/:id", async (req, res) => {
    try {
        const contatto = await Contatto.findById(req.params.id);
        if (!contatto) {
            return res.status(404).json({ message: "Contatto non trovato" });
        }
        res.json(contatto);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST - Nuovo messaggio dal form contatti
router.post("/", async (req, res) => {
    try {
        const { nome, email, telefono, descrizione } = req.body;

        const nuovoContatto = new Contatto({
            nome,
            email,
            telefono: telefono || "",
            descrizione,
        });

        const saved = await nuovoContatto.save();
        res.status(201).json({ message: "Messaggio inviato con successo", id: saved._id });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PATCH - Segna come letto/non letto
router.patch("/:id/letto", async (req, res) => {
    try {
        const contatto = await Contatto.findById(req.params.id);
        if (!contatto) {
            return res.status(404).json({ message: "Contatto non trovato" });
        }

        contatto.letto = !contatto.letto;
        const updated = await contatto.save();
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE - Elimina contatto
router.delete("/:id", async (req, res) => {
    try {
        const contatto = await Contatto.findById(req.params.id);
        if (!contatto) {
            return res.status(404).json({ message: "Contatto non trovato" });
        }

        await Contatto.findByIdAndDelete(req.params.id);
        res.json({ message: "Contatto eliminato con successo" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
