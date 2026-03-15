const mongoose = require("mongoose");

const eventoSchema = new mongoose.Schema(
    {
        titolo: {
            type: String,
            required: [true, "Il titolo è obbligatorio"],
            trim: true,
        },
        foto: {
            url: { type: String, required: true },
            publicId: { type: String, required: true },
        },
        // Array di date: supporta data singola o range multi-giorno
        // Ogni data è gestibile individualmente (aggiunta/rimozione)
        date: {
            type: [Date],
            required: [true, "Almeno una data è obbligatoria"],
            validate: {
                validator: (arr) => arr.length > 0,
                message: "Almeno una data è obbligatoria",
            },
        },
        oraInizio: {
            type: String,
            required: [true, "L'ora di inizio è obbligatoria"],
            trim: true,
        },
        oraFine: {
            type: String,
            required: [true, "L'ora di fine è obbligatoria"],
            trim: true,
        },
        descrizione: {
            type: String,
            required: [true, "La descrizione è obbligatoria"],
            trim: true,
        },
        partecipanti: {
            type: [String],
            default: [],
        },
        moderatori: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Evento", eventoSchema);
