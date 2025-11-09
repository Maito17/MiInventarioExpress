const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true, // Asegura que no haya usuarios duplicados
        trim: true
    },
    password: {
        type: String,
        required: true
    }
});

// Pre-Hook de Mongoose: Hashear la contraseña antes de guardar
UserSchema.pre('save', async function(next) {
    // Solo hashea si el password ha sido modificado (o es nuevo)
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10); // Genera un "salt"
        this.password = await bcrypt.hash(this.password, salt); // Hashea la contraseña
        next();
    } catch (err) {
        next(err);
    }
});

// Método para comparar contraseñas (uso en el login)
UserSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
