const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Importa el Modelo de Usuario
const { body, validationResult } = require('express-validator');

// 1. RUTA: Mostrar formulario de Login (GET)
router.get('/login', (req, res) => {
    // Si el usuario ya está logueado, redirigir al listado de productos
    if (req.session.userId) {
        return res.redirect('/products');
    }
    res.render('auth/login', { title: 'Iniciar Sesión', error: req.session.error });
    req.session.error = null; // Limpiar mensaje de error
});

// 2. RUTA: Procesar Login (POST)
router.post('/login', [
    body('username', 'El nombre de usuario es obligatorio.').notEmpty().trim(),
    body('password', 'La contraseña es obligatoria.').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.render('auth/login', { title: 'Iniciar Sesión', errors: errors.array() });
    }

    const { username, password } = req.body;
    
    try {
        const user = await User.findOne({ username });

        if (!user) {
            req.session.error = 'Usuario o contraseña incorrectos.';
            return res.redirect('/login');
        }

        const isMatch = await user.comparePassword(password); // Usa el método de UserSchema

        if (isMatch) {
            // LOGIN EXITOSO: CREAR SESIÓN
            req.session.userId = user._id; // Guarda el ID del usuario en la sesión
            req.session.username = user.username;
            return res.redirect('/products'); // Redirige al área protegida
        } else {
            req.session.error = 'Usuario o contraseña incorrectos.';
            return res.redirect('/login');
        }
    } catch (err) {
        console.error(err);
        req.session.error = 'Error en el servidor al intentar iniciar sesión.';
        res.redirect('/login');
    }
});

// 3. RUTA: Cerrar Sesión (GET/POST)
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
        }
        res.redirect('/login'); // Redirige al login después de cerrar sesión
    });
});

// RUTA de Registro (Opcional, pero útil para crear el primer usuario)
router.get('/register', (req, res) => {
    res.render('auth/register', { title: 'Registro de Usuario' });
});

router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        // La contraseña se hashea automáticamente en el pre-hook del modelo
        const newUser = new User({ username, password }); 
        await newUser.save();
        req.session.userId = newUser._id;
        res.redirect('/products');
    } catch (err) {
        // Manejar error de usuario duplicado u otros errores de MongoDB
        res.render('auth/register', { error: 'Error al registrar usuario. Inténtalo de nuevo.' });
    }
});
// Middleware de protección:
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next(); // Usuario autenticado
    }
    req.session.error = 'Debes iniciar sesión para acceder al chat.';
    res.redirect('/login');
}

module.exports = router;
