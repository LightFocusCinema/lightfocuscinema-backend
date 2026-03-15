const mongoose = require("mongoose");

const contattoSchema = new mongoose.Schema(
    {
        nome: {
            type: String,
            required: [true, "Il nome è obbligatorio"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "L'email è obbligatoria"],
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, "Inserisci un'email valida"],
        },
        telefono: {
            type: String,
            trim: true,
            default: "",
        },
        descrizione: {
            type: String,
            required: [true, "La descrizione è obbligatoria"],
            trim: true,
        },
        letto: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Contatto", contattoSchema);
