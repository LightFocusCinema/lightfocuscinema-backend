const mongoose = require("mongoose");

const videoclipSchema = new mongoose.Schema(
    {
        titolo: {
            type: String,
            required: [true, "Il titolo è obbligatorio"],
            trim: true,
        },
        foto: {
            url: {
                type: String,
                required: [true, "La foto è obbligatoria"],
            },
            publicId: {
                type: String,
                required: true,
            },
        },
        video: {
            url: {
                type: String,
                required: [true, "Il video è obbligatorio"],
            },
            publicId: {
                type: String,
                required: true,
            },
        },
        tagGenere: {
            type: String,
            trim: true,
            default: "",
        },
        cliente: {
            nome: {
                type: String,
                trim: true,
                default: "",
            },
            logo: {
                url: {
                    type: String,
                    default: "",
                },
                publicId: {
                    type: String,
                    default: "",
                },
            },
        },
        backstage: {
            url: {
                type: String,
                default: "",
            },
            publicId: {
                type: String,
                default: "",
            },
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Videoclip", videoclipSchema);
