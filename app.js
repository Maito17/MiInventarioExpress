// app.js

// 1. IMPORTACIONES BASE DE NODE Y EXPRESS
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path'); 
const mongoose = require('mongoose'); 
const exphbs = require('express-handlebars'); 

// 2. IMPORTACIONES DE MIDDLEWARE Y CONFIGURACIÓN (Modularizado)
const session = require('express-session'); // Tarea 7
const { isAuthenticated } = require('./middleware/authMiddleware'); // Tarea 7
const upload = require('./config/multer'); // Tarea 6 (Middleware de Multer)

// Inicialización de la aplicación
const app = express();
const server = http.createServer(app);
const io = socketIo(server);


// 3. CONEXIÓN A MONGODB (Tarea 4/5)
const MONGODB_URI = 'mongodb://localhost:27017/miinventario_db'; 

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Conectado exitosamente a MongoDB'))
    .catch(err => console.error('❌ Error de conexión a MongoDB:', err));


// 4. CONFIGURACIÓN DEL MOTOR DE VISTAS HANDLEBARS (Tarea 9)
app.set('views', path.join(__dirname, 'views'));

app.engine('.hbs', exphbs.engine({
    defaultLayout: 'main', 
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    extname: '.hbs'
}));
app.set('view engine', '.hbs');


// 5. MIDDLEWARE DE EXPRESS Y SESIONES (Tarea 7)
// Para parsear el body de solicitudes POST (JSON y formularios)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configuración de Sesiones
app.use(session({
    secret: 'CLAVE_SECRETA_MUY_LARGA_Y_COMPLEJA_PARA_PROYECTO', 
    resave: false, 
    saveUninitialized: false, 
    cookie: { secure: false } 
}));

// Middleware para pasar datos de sesión a todas las vistas de Handlebars (Tarea 9)
app.use((req, res, next) => {
    res.locals.sessionUserId = req.session.userId || null;
    res.locals.sessionUsername = req.session.username || 'Invitado';
    // Pasa errores de sesión (útil para el login)
    res.locals.error = req.session.error;
    delete req.session.error; 
    next();
});

// 6. CARPETAS ESTÁTICAS (Tarea 3/6)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 


// 7. CONEXIÓN DE RUTAS
// Rutas de autenticación (Login/Logout)
app.use('/', require('./routes/authRoutes'));

// Rutas protegidas (CRUD y Chat)
app.use('/products', isAuthenticated, require('./routes/productRoutes')); 
app.use('/chat', isAuthenticated, require('./routes/chatRoutes'));

// Ruta de inicio (redirige al login si no está autenticado, o a la lista de productos)
app.get('/', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/products');
    }
    res.redirect('/login');
});


// 8. LÓGICA DE SOCKET.IO (Módulo de Chat - Tarea 10)
io.on('connection', socket => {
    console.log('Cliente conectado para chat:', socket.id);

    // Escucha el evento 'chat:sendMessage'
    socket.on('chat:sendMessage', (data) => {
        const { user, msg } = data;
        
        if (user && msg) {
            console.log(`Mensaje de ${user}: ${msg}`);
            
            // Retransmite el mensaje a *todos* los clientes conectados
            io.emit('chat:message', { 
                user: user, 
                msg: msg 
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado del chat:', socket.id);
    });
});


// 9. INICIAR SERVIDOR
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
