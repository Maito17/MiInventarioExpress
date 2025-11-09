// middleware/authMiddleware.js

// Tarea 7: Función para verificar si hay un usuario logueado en la sesión
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        // Usuario autenticado, pasa al siguiente middleware o controlador
        return next(); 
    }
    
    // Usuario no autenticado, redirige al login con un mensaje de error
    req.session.error = 'Debes iniciar sesión para acceder a esta página.';
    res.redirect('/login');
}

module.exports = { 
    isAuthenticated 
};
