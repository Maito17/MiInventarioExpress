const express = require('express');
const router = express.Router();
const Product = require('../models/Product'); 
const { body, validationResult } = require('express-validator'); 
const upload = require('../config/multer');


// 1. RUTA PARA LISTAR PRODUCTOS (READ ALL)
router.get('/', async (req, res) => {
    try {
        // Busca todos los productos en la base de datos
        const products = await Product.find().lean(); 

        // Renderiza la vista 'products/list' y le pasa los datos encontrados
        res.render('products/list', { 
            products: products,
            title: 'Listado de Productos'
        });
    } catch (err) {
        console.error(err);
        // En caso de error, renderiza una vista de error o un mensaje simple
        res.render('error', { message: 'No se pudo obtener el listado de productos.' });
    }
});

// 2. RUTA PARA MOSTRAR FORMULARIO DE CREACIÓN (CREATE - GET)
router.get('/new', (req, res) => {
    // Renderiza la vista del formulario
    res.render('products/new-form', { 
        title: 'Nuevo Producto',
        errors: [] // Inicializa los errores vacíos
    });
});


// 3. RUTA PARA PROCESAR LA CREACIÓN DE PRODUCTO (CREATE - POST)
router.post('/new', upload, [ // Usa 'upload' de Multer y luego las validaciones de express-validator
    // Tarea 8: Validaciones con express-validator
    body('nombre', 'El nombre del producto es obligatorio.').notEmpty().trim(),
    body('precio', 'El precio debe ser un número positivo.').isNumeric().toFloat().isFloat({ min: 0 }),
    body('descripcion', 'La descripción no debe exceder 255 caracteres.').optional().isLength({ max: 255 })

], async (req, res) => {
    
    const errors = validationResult(req); // Verifica los resultados de la validación

    if (!errors.isEmpty()) {
        // Hay errores de validación. Vuelve a mostrar el formulario con los datos y errores.
        // Nota: req.file será null si Multer falló, pero Multer ya maneja algunos errores.
        return res.render('products/new-form', {
            title: 'Nuevo Producto',
            errors: errors.array(), // Pasa los errores a la vista
            product: req.body // Vuelve a llenar el formulario con los datos anteriores
        });
    }

    try {
        const { nombre, precio, descripcion } = req.body;
        
        // Obtiene el nombre del archivo si Multer lo subió correctamente
        const imagenFileName = req.file ? req.file.filename : null; 

        const newProduct = new Product({
            nombre,
            precio,
            descripcion,
            imagen: imagenFileName // Guarda el nombre del archivo en la DB
        });

        await newProduct.save();

        // Redirige al listado después de guardar
        res.redirect('/products');

    } catch (err) {
        console.error(err);
        // Manejo de errores de base de datos
        res.render('products/new-form', {
            title: 'Nuevo Producto',
            errors: [{ msg: 'Error al guardar el producto en la base de datos.' }],
            product: req.body
        });
    }
});

// Tarea 4: Ruta GET para MOSTRAR el formulario de edición de un producto
router.get('/edit/:id', async (req, res) => {
    try {
        // 1. Obtener el ID del producto desde los parámetros de la URL
        const productId = req.params.id;

        // 2. Buscar el producto en MongoDB
        const product = await Product.findById(productId).lean();

        // 3. Verificar si el producto existe
        if (!product) {
            return res.status(404).send('Producto no encontrado');
        }

        // 4. Renderizar la vista de edición (views/products/edit.hbs)
        // Se usa .lean() para convertir el objeto Mongoose a un objeto JavaScript simple, 
        // lo cual es mejor para Handlebars.
        res.render('products/edit-form', { 
            title: 'Editar Producto',
            product: product 
        });

    } catch (error) {
        console.error('Error al cargar la página de edición:', error);
        res.status(500).send('Error interno del servidor');
    }
});


// authMiddleware.js (o dentro de productRoutes.js)

function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next(); // Usuario autenticado, continúa
    }
    // Usuario no autenticado, redirige al login con un mensaje
    req.session.error = 'Debes iniciar sesión para acceder a esta página.';
    res.redirect('/login');
}

// 5. RUTA PARA PROCESAR LA EDICIÓN/ACTUALIZACIÓN DE PRODUCTO (UPDATE - POST)
router.post('/edit/:id', upload, [ // Tarea 6: Usa Multer para procesar la imagen
    // Tarea 8: Validaciones con express-validator
    body('nombre', 'El nombre del producto es obligatorio.').notEmpty().trim(),
    body('precio', 'El precio debe ser un número positivo.').isNumeric().toFloat().isFloat({ min: 0 }),
    body('descripcion', 'La descripción no debe exceder 255 caracteres.').optional().isLength({ max: 255 })
], async (req, res) => {

    const productId = req.params.id;
    const errors = validationResult(req);

    // 1. Manejo de Errores de Validación (Tarea 8)
    if (!errors.isEmpty()) {
        try {
            // Se necesita obtener el producto de nuevo para re-renderizar el formulario
            const product = await Product.findById(productId).lean();
            return res.render('products/edit-form', { // Usamos 'edit-form' para coincidir con tu archivo
                title: 'Editar Producto',
                errors: errors.array(),
                product: { ...product, ...req.body } 
            });
        } catch (error) {
            console.error('Error re-renderizando edición:', error);
            return res.status(500).send('Error de servidor.');
        }
    }
    
    // 2. Procesamiento de la Imagen y Actualización (Tarea 4, 6)
    try {
        const { nombre, precio, descripcion } = req.body;
        let updateData = { nombre, precio, descripcion };

        // Verifica si Multer subió un nuevo archivo
        if (req.file) {
            updateData.imagen = req.file.filename; 
        }

        // Actualizar el Producto en MongoDB
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { $set: updateData },
            { new: true, runValidators: true } 
        );

        if (!updatedProduct) {
            return res.status(404).send('Producto no encontrado para actualizar.');
        }

        // Redirige al listado después de actualizar
        res.redirect('/products');

    } catch (err) {
        console.error('Error al actualizar el producto:', err);
        res.status(500).send('Error interno del servidor al guardar cambios.');
    }
});


// Aplica este middleware a todas las rutas de productRoutes.js que deseas proteger:
// router.get('/', isAuthenticated, async (req, res) => { ... })

// ¡Añadiremos el resto del CRUD aquí!

module.exports = router;
