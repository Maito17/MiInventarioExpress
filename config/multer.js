// config/multer.js

const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: path.join(__dirname, '../uploads'), // Sube un nivel para acceder a /uploads
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});

// Configuración de Multer
const upload = multer({
    storage: storage,
    limits: {
        // Aumentar el límite a 5 MB (5 * 1024 * 1024 bytes)
        fileSize: 5 * 1024 * 1024, 
    },
    fileFilter: (req, file, cb) => {
        // Verifica el tipo de archivo
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb("Error: El archivo debe ser una imagen válida (JPEG o PNG) y menor a 5MB.");
    }
}).single('imagen');

module.exports = upload; // <-- Exportamos la función de middleware
