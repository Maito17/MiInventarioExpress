const express = require('express');
const router = express.Router();
// Tarea 7: Importamos la función para proteger la ruta
const { isAuthenticated } = require('../middleware/authMiddleware'); // <-- ¡LÍNEA AÑADIDA!


// Tarea 10: Ruta para mostrar la vista del chat (protegida)
router.get('/', isAuthenticated, (req, res) => {
    // La variable sessionUsername se hace disponible aquí gracias al middleware 
    // global en app.js (res.locals), pero si quieres asegurarte, puedes pasarla explícitamente:
    res.render('chat', { 
        title: 'Chat de Administradores',
        // Aseguramos que la vista Handlebars obtenga el nombre de usuario
        sessionUsername: req.session.username 
    });
});

module.exports = router;
