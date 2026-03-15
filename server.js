require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Inizializza server
const server = express();
const PORT = process.env.PORT || 5000;

// Connessione al database
connectDB();

// Middleware
server.use(cors());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Rotte
server.use("/api/advertisement", require("./routes/advertisement"));
server.use("/api/videoclip", require("./routes/videoclip"));
server.use("/api/produzioni", require("./routes/produzioni"));
server.use("/api/contatti", require("./routes/contatti"));
server.use("/api/eventi", require("./routes/eventi"));

// Rotta di test
server.get("/", (req, res) => {
    res.json({ message: "Lighthouse Cinema API è attiva" });
});

// Avvio server
server.listen(PORT, () => {
    console.log(`:D Server attivo su http://localhost:${PORT} :D`);
});
