const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Storage per immagini (foto + logo cliente)
const imageStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "lighthousecinema/images",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ quality: "auto", fetch_format: "auto" }],
    },
});

// Storage per video (video + backstage)
const videoStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "lighthousecinema/videos",
        allowed_formats: ["mp4", "mov", "avi", "webm"],
        resource_type: "video",
    },
});

const uploadImage = multer({ storage: imageStorage });
const uploadVideo = multer({ storage: videoStorage });

// Middleware personalizzato per gestire upload misti (immagini + video)
// Usa multer con memoryStorage e poi carica manualmente su Cloudinary
const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({
    storage: memoryStorage,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB max per file (video possono essere grandi)
    },
});

/**
 * Upload ottimizzato su Cloudinary.
 * - Immagini: quality auto:good, formato auto, max 2000px
 * - Video: quality auto:good, codec auto-ottimizzato
 */
const uploadToCloudinary = (fileBuffer, options) => {
    // Aggiungi trasformazioni di ottimizzazione automatiche
    const resourceType = options.resource_type || "image";

    if (resourceType === "image") {
        options.transformation = [
            { quality: "auto:good", fetch_format: "auto", width: 2000, crop: "limit" },
        ];
    } else if (resourceType === "video") {
        options.eager = [
            { quality: "auto:good", video_codec: "auto", fetch_format: "mp4" },
        ];
        options.eager_async = true; // trasformazione asincrona per non bloccare la risposta
    }

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) reject(error);
            else resolve(result);
        });
        stream.end(fileBuffer);
    });
};

module.exports = {
    uploadImage,
    uploadVideo,
    uploadMemory,
    uploadToCloudinary,
    cloudinary,
};
