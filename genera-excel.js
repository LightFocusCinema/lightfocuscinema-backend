const ExcelJS = require("exceljs");
const path = require("path");

async function generaExcel() {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Lighthouse Cinema";
    workbook.created = new Date();

    // ==================== COLORI ====================
    const arancione = "FE7F2D";
    const crema = "FFF0D4";
    const scuro = "1A1A1A"; 
    const bianco = "FFFFFF";
    const verde = "2ECC71";
    const rosso = "E74C3C";
    const grigio = "F5F5F5";

    // Stile header
    const headerStyle = {
        font: { bold: true, color: { argb: bianco }, size: 12 },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: arancione } },
        alignment: { horizontal: "center", vertical: "middle" },
        border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
        },
    };

    const cellStyle = {
        alignment: { horizontal: "center", vertical: "middle", wrapText: true },
        border: {
            top: { style: "thin", color: { argb: "DDDDDD" } },
            bottom: { style: "thin", color: { argb: "DDDDDD" } },
            left: { style: "thin", color: { argb: "DDDDDD" } },
            right: { style: "thin", color: { argb: "DDDDDD" } },
        },
    };

    // ==================== FOGLIO 1: MODELLI ====================
    const wsModelli = workbook.addWorksheet("Modelli", {
        properties: { tabColor: { argb: arancione } },
    });

    // Titolo
    wsModelli.mergeCells("A1:E1");
    const titleCell = wsModelli.getCell("A1");
    titleCell.value = "LIGHTHOUSE CINEMA - Schema Modelli Database";
    titleCell.font = { bold: true, size: 16, color: { argb: arancione } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    wsModelli.getRow(1).height = 40;

    wsModelli.mergeCells("A2:E2");
    const subtitleCell = wsModelli.getCell("A2");
    subtitleCell.value = "Struttura identica per: Advertisement, Videoclip, Produzioni Cinematografiche";
    subtitleCell.font = { italic: true, size: 11, color: { argb: "5A5A5A" } };
    subtitleCell.alignment = { horizontal: "center" };
    wsModelli.getRow(2).height = 25;

    // Header tabella
    const modelHeaders = ["Campo", "Tipo", "Obbligatorio", "Descrizione", "Dove viene salvato"];
    wsModelli.columns = [
        { key: "campo", width: 25 },
        { key: "tipo", width: 20 },
        { key: "obbligatorio", width: 15 },
        { key: "descrizione", width: 40 },
        { key: "dove", width: 30 },
    ];

    const headerRow = wsModelli.addRow(modelHeaders);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
        Object.assign(cell, headerStyle);
        cell.font = headerStyle.font;
        cell.fill = headerStyle.fill;
        cell.alignment = headerStyle.alignment;
        cell.border = headerStyle.border;
    });

    const modelData = [
        ["titolo", "String", "SI", "Titolo del progetto", "MongoDB"],
        ["foto.url", "String", "SI", "URL immagine principale", "MongoDB (URL)"],
        ["foto.publicId", "String", "SI", "ID Cloudinary della foto", "MongoDB"],
        ["video.url", "String", "SI", "URL video principale", "MongoDB (URL)"],
        ["video.publicId", "String", "SI", "ID Cloudinary del video", "MongoDB"],
        ["tagGenere", "String", "NO", "Tag/genere del progetto", "MongoDB"],
        ["cliente.nome", "String", "SI", "Nome del cliente", "MongoDB"],
        ["cliente.logo.url", "String", "SI", "URL logo del cliente", "MongoDB (URL)"],
        ["cliente.logo.publicId", "String", "SI", "ID Cloudinary del logo", "MongoDB"],
        ["backstage.url", "String", "NO", "URL video backstage", "MongoDB (URL)"],
        ["backstage.publicId", "String", "NO", "ID Cloudinary del backstage", "MongoDB"],
        ["createdAt", "Date", "Auto", "Data di creazione", "MongoDB (auto)"],
        ["updatedAt", "Date", "Auto", "Data ultima modifica", "MongoDB (auto)"],
    ];

    modelData.forEach((row, i) => {
        const dataRow = wsModelli.addRow(row);
        dataRow.height = 24;
        dataRow.eachCell((cell) => {
            cell.alignment = cellStyle.alignment;
            cell.border = cellStyle.border;
            if (i % 2 === 0) {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: grigio } };
            }
        });
        // Colora SI/NO
        const obbCell = dataRow.getCell(3);
        if (obbCell.value === "SI") {
            obbCell.font = { bold: true, color: { argb: verde } };
        } else if (obbCell.value === "NO") {
            obbCell.font = { color: { argb: rosso } };
        } else {
            obbCell.font = { italic: true, color: { argb: "999999" } };
        }
    });

    // ==================== FOGLIO 2: ENDPOINTS ====================
    const wsEndpoints = workbook.addWorksheet("API Endpoints", {
        properties: { tabColor: { argb: "3498DB" } },
    });

    wsEndpoints.mergeCells("A1:E1");
    const epTitle = wsEndpoints.getCell("A1");
    epTitle.value = "LIGHTHOUSE CINEMA - API REST Endpoints";
    epTitle.font = { bold: true, size: 16, color: { argb: arancione } };
    epTitle.alignment = { horizontal: "center", vertical: "middle" };
    wsEndpoints.getRow(1).height = 40;

    wsEndpoints.columns = [
        { key: "metodo", width: 12 },
        { key: "rotta", width: 40 },
        { key: "azione", width: 30 },
        { key: "body", width: 35 },
        { key: "risposta", width: 30 },
    ];

    const epHeaders = ["Metodo", "Rotta", "Azione", "Body / Form-Data", "Risposta"];
    const epHeaderRow = wsEndpoints.addRow(epHeaders);
    epHeaderRow.height = 30;
    epHeaderRow.eachCell((cell) => {
        cell.font = headerStyle.font;
        cell.fill = headerStyle.fill;
        cell.alignment = headerStyle.alignment;
        cell.border = headerStyle.border;
    });

    const services = [
        { name: "ADVERTISEMENT", base: "/api/advertisement" },
        { name: "VIDEOCLIP", base: "/api/videoclip" },
        { name: "PRODUZIONI", base: "/api/produzioni" },
        { name: "CONTATTI", base: "/api/contatti" },
        { name: "EVENTI", base: "/api/eventi" },
    ];

    services.forEach((svc, svcIndex) => {
        // Riga separatore servizio
        const sepRow = wsEndpoints.addRow([svc.name, "", "", "", ""]);
        sepRow.height = 28;
        sepRow.eachCell((cell) => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: crema } };
            cell.font = { bold: true, size: 11, color: { argb: scuro } };
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.border = cellStyle.border;
        });

        const isContatti = svc.name === "CONTATTI";
        const isEventi = svc.name === "EVENTI";
        let endpoints;
        if (isContatti) {
            endpoints = [
                ["GET", svc.base, "Lista tutti i messaggi", "-", "Array di oggetti"],
                ["GET", `${svc.base}/:id`, "Dettaglio singolo", "-", "Oggetto singolo"],
                ["POST", svc.base, "Invia messaggio", "JSON: nome, email, telefono, descrizione", "Oggetto creato (201)"],
                ["PATCH", `${svc.base}/:id/letto`, "Toggle letto/non letto", "JSON: { letto: Boolean }", "Oggetto aggiornato"],
                ["DELETE", `${svc.base}/:id`, "Elimina messaggio", "-", "Messaggio conferma"],
            ];
        } else if (isEventi) {
            endpoints = [
                ["GET", svc.base, "Lista tutti gli eventi", "-", "Array di oggetti"],
                ["GET", `${svc.base}/:id`, "Dettaglio singolo evento", "-", "Oggetto singolo"],
                ["POST", svc.base, "Crea nuovo evento", "multipart/form-data (foto) + campi testo", "Oggetto creato (201)"],
                ["PUT", `${svc.base}/:id`, "Aggiorna evento", "multipart/form-data (foto) + campi testo", "Oggetto aggiornato"],
                ["PATCH", `${svc.base}/:id/date`, "Gestisci date singole", "JSON: { aggiungi: [...], rimuovi: [...] }", "Oggetto aggiornato"],
                ["DELETE", `${svc.base}/:id`, "Elimina evento + Cloudinary", "-", "Messaggio conferma"],
            ];
        } else {
            endpoints = [
                ["GET", svc.base, "Lista tutti", "-", "Array di oggetti"],
                ["GET", `${svc.base}/:id`, "Dettaglio singolo", "-", "Oggetto singolo"],
                ["POST", svc.base, "Crea nuovo", "multipart/form-data", "Oggetto creato (201)"],
                ["PUT", `${svc.base}/:id`, "Aggiorna", "multipart/form-data", "Oggetto aggiornato"],
                ["DELETE", `${svc.base}/:id`, "Elimina + Cloudinary", "-", "Messaggio conferma"],
            ];
        }

        endpoints.forEach((ep, i) => {
            const row = wsEndpoints.addRow(ep);
            row.height = 24;
            row.eachCell((cell) => {
                cell.alignment = cellStyle.alignment;
                cell.border = cellStyle.border;
            });
            // Colora metodo HTTP
            const metodoCell = row.getCell(1);
            const colors = { GET: "27AE60", POST: "3498DB", PUT: "F39C12", PATCH: "F39C12", DELETE: "E74C3C" };
            metodoCell.font = { bold: true, color: { argb: colors[ep[0]] || scuro } };
        });
    });

    // ==================== FOGLIO 3: FORM-DATA ====================
    const wsFormData = workbook.addWorksheet("Campi Form Upload", {
        properties: { tabColor: { argb: verde } },
    });

    wsFormData.mergeCells("A1:E1");
    const fdTitle = wsFormData.getCell("A1");
    fdTitle.value = "CAMPI FORM-DATA PER UPLOAD (POST / PUT)";
    fdTitle.font = { bold: true, size: 16, color: { argb: arancione } };
    fdTitle.alignment = { horizontal: "center", vertical: "middle" };
    wsFormData.getRow(1).height = 40;

    wsFormData.columns = [
        { key: "campo", width: 20 },
        { key: "tipo", width: 20 },
        { key: "obbligatorio", width: 18 },
        { key: "formati", width: 30 },
        { key: "note", width: 40 },
    ];

    const fdHeaders = ["Nome Campo", "Tipo Input", "Obbligatorio (POST)", "Formati Accettati", "Note"];
    const fdHeaderRow = wsFormData.addRow(fdHeaders);
    fdHeaderRow.height = 30;
    fdHeaderRow.eachCell((cell) => {
        cell.font = headerStyle.font;
        cell.fill = headerStyle.fill;
        cell.alignment = headerStyle.alignment;
        cell.border = headerStyle.border;
    });

    const fdData = [
        ["titolo", "text", "SI", "-", "Titolo del progetto"],
        ["tagGenere", "text", "NO", "-", "Tag genere (es: Fashion, Sport)"],
        ["clienteNome", "text", "SI", "-", "Nome del cliente"],
        ["foto", "file (image)", "SI", "jpg, jpeg, png, webp", "Immagine copertina progetto"],
        ["video", "file (video)", "SI", "mp4, mov, avi, webm", "Video principale progetto"],
        ["clienteLogo", "file (image)", "SI", "jpg, jpeg, png, webp", "Logo/immagine del cliente"],
        ["backstage", "file (video)", "NO", "mp4, mov, avi, webm", "Video backstage (opzionale)"],
    ];

    fdData.forEach((row, i) => {
        const dataRow = wsFormData.addRow(row);
        dataRow.height = 26;
        dataRow.eachCell((cell) => {
            cell.alignment = cellStyle.alignment;
            cell.border = cellStyle.border;
            if (i % 2 === 0) {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: grigio } };
            }
        });
        const obbCell = dataRow.getCell(3);
        if (obbCell.value === "SI") {
            obbCell.font = { bold: true, color: { argb: verde } };
        } else {
            obbCell.font = { color: { argb: rosso } };
        }
    });

    // ==================== FOGLIO 4: MODELLO CONTATTI ====================
    const wsContatti = workbook.addWorksheet("Modello Contatti", {
        properties: { tabColor: { argb: "9B59B6" } },
    });

    wsContatti.mergeCells("A1:E1");
    const ctTitle = wsContatti.getCell("A1");
    ctTitle.value = "LIGHTHOUSE CINEMA - Schema Modello Contatti";
    ctTitle.font = { bold: true, size: 16, color: { argb: arancione } };
    ctTitle.alignment = { horizontal: "center", vertical: "middle" };
    wsContatti.getRow(1).height = 40;

    wsContatti.mergeCells("A2:E2");
    const ctSubtitle = wsContatti.getCell("A2");
    ctSubtitle.value = "Messaggi ricevuti dal form contatti del sito";
    ctSubtitle.font = { italic: true, size: 11, color: { argb: "5A5A5A" } };
    ctSubtitle.alignment = { horizontal: "center" };
    wsContatti.getRow(2).height = 25;

    wsContatti.columns = [
        { key: "campo", width: 25 },
        { key: "tipo", width: 20 },
        { key: "obbligatorio", width: 15 },
        { key: "descrizione", width: 40 },
        { key: "dove", width: 30 },
    ];

    const ctHeaderRow = wsContatti.addRow(modelHeaders);
    ctHeaderRow.height = 30;
    ctHeaderRow.eachCell((cell) => {
        cell.font = headerStyle.font;
        cell.fill = headerStyle.fill;
        cell.alignment = headerStyle.alignment;
        cell.border = headerStyle.border;
    });

    const contattiData = [
        ["nome", "String", "SI", "Nome del mittente", "MongoDB"],
        ["email", "String", "SI", "Email del mittente (validata)", "MongoDB"],
        ["telefono", "String", "NO", "Numero di telefono (opzionale)", "MongoDB"],
        ["descrizione", "String", "SI", "Testo del messaggio", "MongoDB"],
        ["letto", "Boolean", "Auto", "Stato letto/non letto (default: false)", "MongoDB"],
        ["createdAt", "Date", "Auto", "Data di ricezione", "MongoDB (auto)"],
        ["updatedAt", "Date", "Auto", "Data ultima modifica", "MongoDB (auto)"],
    ];

    contattiData.forEach((row, i) => {
        const dataRow = wsContatti.addRow(row);
        dataRow.height = 24;
        dataRow.eachCell((cell) => {
            cell.alignment = cellStyle.alignment;
            cell.border = cellStyle.border;
            if (i % 2 === 0) {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: grigio } };
            }
        });
        const obbCell = dataRow.getCell(3);
        if (obbCell.value === "SI") {
            obbCell.font = { bold: true, color: { argb: verde } };
        } else if (obbCell.value === "NO") {
            obbCell.font = { color: { argb: rosso } };
        } else {
            obbCell.font = { italic: true, color: { argb: "999999" } };
        }
    });

    // ==================== FOGLIO 5: ENDPOINTS CONTATTI ====================
    const wsContattiEp = workbook.addWorksheet("API Contatti", {
        properties: { tabColor: { argb: "9B59B6" } },
    });

    wsContattiEp.mergeCells("A1:E1");
    const ceTitle = wsContattiEp.getCell("A1");
    ceTitle.value = "LIGHTHOUSE CINEMA - API Contatti Endpoints";
    ceTitle.font = { bold: true, size: 16, color: { argb: arancione } };
    ceTitle.alignment = { horizontal: "center", vertical: "middle" };
    wsContattiEp.getRow(1).height = 40;

    wsContattiEp.columns = [
        { key: "metodo", width: 12 },
        { key: "rotta", width: 40 },
        { key: "azione", width: 30 },
        { key: "body", width: 35 },
        { key: "risposta", width: 30 },
    ];

    const ceHeaderRow = wsContattiEp.addRow(epHeaders);
    ceHeaderRow.height = 30;
    ceHeaderRow.eachCell((cell) => {
        cell.font = headerStyle.font;
        cell.fill = headerStyle.fill;
        cell.alignment = headerStyle.alignment;
        cell.border = headerStyle.border;
    });

    const contattiSepRow = wsContattiEp.addRow(["CONTATTI", "", "", "", ""]);
    contattiSepRow.height = 28;
    contattiSepRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: crema } };
        cell.font = { bold: true, size: 11, color: { argb: scuro } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = cellStyle.border;
    });

    const contattiEndpoints = [
        ["GET", "/api/contatti", "Lista tutti i messaggi", "-", "Array di oggetti"],
        ["GET", "/api/contatti/:id", "Dettaglio singolo messaggio", "-", "Oggetto singolo"],
        ["POST", "/api/contatti", "Invia nuovo messaggio", "JSON: nome, email, telefono, descrizione", "Oggetto creato (201)"],
        ["PATCH", "/api/contatti/:id/letto", "Toggle letto/non letto", "JSON: { letto: Boolean }", "Oggetto aggiornato"],
        ["DELETE", "/api/contatti/:id", "Elimina messaggio", "-", "Messaggio conferma"],
    ];

    contattiEndpoints.forEach((ep) => {
        const row = wsContattiEp.addRow(ep);
        row.height = 24;
        row.eachCell((cell) => {
            cell.alignment = cellStyle.alignment;
            cell.border = cellStyle.border;
        });
        const metodoCell = row.getCell(1);
        const colors = { GET: "27AE60", POST: "3498DB", PUT: "F39C12", PATCH: "F39C12", DELETE: "E74C3C" };
        metodoCell.font = { bold: true, color: { argb: colors[ep[0]] || scuro } };
    });

    // ==================== FOGLIO 6: MODELLO EVENTI ====================
    const wsEventi = workbook.addWorksheet("Modello Eventi", {
        properties: { tabColor: { argb: "E67E22" } },
    });

    wsEventi.mergeCells("A1:E1");
    const evTitle = wsEventi.getCell("A1");
    evTitle.value = "LIGHTHOUSE CINEMA - Schema Modello Eventi";
    evTitle.font = { bold: true, size: 16, color: { argb: arancione } };
    evTitle.alignment = { horizontal: "center", vertical: "middle" };
    wsEventi.getRow(1).height = 40;

    wsEventi.mergeCells("A2:E2");
    const evSubtitle = wsEventi.getCell("A2");
    evSubtitle.value = "Gestione eventi e festival";
    evSubtitle.font = { italic: true, size: 11, color: { argb: "5A5A5A" } };
    evSubtitle.alignment = { horizontal: "center" };
    wsEventi.getRow(2).height = 25;

    wsEventi.columns = [
        { key: "campo", width: 25 },
        { key: "tipo", width: 20 },
        { key: "obbligatorio", width: 15 },
        { key: "descrizione", width: 40 },
        { key: "dove", width: 30 },
    ];

    const evHeaderRow = wsEventi.addRow(modelHeaders);
    evHeaderRow.height = 30;
    evHeaderRow.eachCell((cell) => {
        cell.font = headerStyle.font;
        cell.fill = headerStyle.fill;
        cell.alignment = headerStyle.alignment;
        cell.border = headerStyle.border;
    });

    const eventiData = [
        ["titolo", "String", "SI", "Titolo dell'evento", "MongoDB"],
        ["foto.url", "String", "SI", "URL foto copertina", "MongoDB (URL)"],
        ["foto.publicId", "String", "SI", "ID Cloudinary della foto", "MongoDB"],
        ["date", "[Date]", "SI", "Array di date (singola o range multi-giorno)", "MongoDB"],
        ["oraInizio", "String", "SI", "Ora di inizio (es: 18:00)", "MongoDB"],
        ["oraFine", "String", "SI", "Ora di fine (es: 22:00)", "MongoDB"],
        ["descrizione", "String", "SI", "Descrizione dell'evento", "MongoDB"],
        ["partecipanti", "[String]", "NO", "Array nomi partecipanti", "MongoDB"],
        ["moderatori", "[String]", "NO", "Array nomi moderatori", "MongoDB"],
        ["createdAt", "Date", "Auto", "Data di creazione", "MongoDB (auto)"],
        ["updatedAt", "Date", "Auto", "Data ultima modifica", "MongoDB (auto)"],
    ];

    eventiData.forEach((row, i) => {
        const dataRow = wsEventi.addRow(row);
        dataRow.height = 24;
        dataRow.eachCell((cell) => {
            cell.alignment = cellStyle.alignment;
            cell.border = cellStyle.border;
            if (i % 2 === 0) {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: grigio } };
            }
        });
        const obbCell = dataRow.getCell(3);
        if (obbCell.value === "SI") {
            obbCell.font = { bold: true, color: { argb: verde } };
        } else if (obbCell.value === "NO") {
            obbCell.font = { color: { argb: rosso } };
        } else {
            obbCell.font = { italic: true, color: { argb: "999999" } };
        }
    });

    // ==================== SALVA ====================
    const filePath = path.join(__dirname, "..", "Lighthouse_Cinema_API.xlsx");
    await workbook.xlsx.writeFile(filePath);
    console.log(`File Excel creato: ${filePath}`);
}

generaExcel().catch(console.error);
