const mongoose = require('mongoose');

// Define el esquema con los campos requeridos: nombre, precio, descripción, imagen 
const ProductSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true 
    },
    precio: {
        type: Number,
        required: true,
        min: 0 
    },
    descripcion: {
        type: String,
        required: false 
    },
    // Este campo guardará la ruta o nombre del archivo subido con Multer (Tarea 6)
    imagen: {
        type: String,
        required: false 
    },
    // Puedes añadir campos para la fecha de creación y actualización (buenas prácticas)
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Exporta el modelo para usarlo en los controladores de ruta
module.exports = mongoose.model('Product', ProductSchema);
