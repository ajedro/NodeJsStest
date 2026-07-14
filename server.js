const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs'); // 1. Importamos el módulo nativo de Node.js para manejar archivos

const app = express();
app.use(express.json());
app.use(express.static(__dirname));


const MONGO_URI = 'mongodb://ajedro11_db_user:1Q2w3er4t5@cluster0-shard-00-00.sabuwds.mongodb.net:27017,cluster0-shard-00-01.sabuwds.mongodb.net:27017,cluster0-shard-00-02.sabuwds.mongodb.net:27017/mi_aplicacion?ssl=true&replicaSet=atlas-sabuwds-shard-0&authSource=admin&retryWrites=true&w=majority';
mongoose.connect(MONGO_URI)
    .then(() => console.log('🚀 Conectado con éxito a MongoDB Atlas'))
    .catch(err => {
        // Formateamos el mensaje de error con la fecha y hora actual
        const fechaActual = new Date().toISOString();
        const mensajeErrorLog = `[${fechaActual}] ❌ Error de conexión a MongoDB:\n${err.stack || err}\n\n=========================================\n\n`;

        // Escribe o añade (append) el error al archivo log.txt de forma asíncrona
        fs.appendFile(path.join(__dirname, 'log.txt'), mensajeErrorLog, (fileErr) => {
            if (fileErr) {
                console.error('No se pudo escribir en log.txt:', fileErr);
            } else {
                console.log('⚠️ El error detallado se ha guardado en log.txt');
            }
        });

        // Seguimos mostrando el error resumido en la terminal
        console.error('❌ Error de conexión:', err.message);
    });

// Modelo de Usuario
const userSchema = new mongoose.Schema({
    correo: { type: String, required: true, unique: true },
    contraseña: { type: String, required: true }
});

// Middleware para encriptar la contraseña antes de guardarla
userSchema.pre('save', async function(next) {
    if (!this.isModified('contraseña')) return next();
    this.contraseña = await bcrypt.hash(this.contraseña, 10);
    next();
});

const User = mongoose.model('User', userSchema);

// RUTA PARA REGISTRAR (Dar de alta)
app.post('/api/register', async (req, res) => {
    try {
        const { correo, contraseña } = req.body;
        const existe = await User.findOne({ correo });
        if (existe) return res.status(400).json({ error: 'El usuario ya existe.' });

        const nuevoUsuario = new User({ correo, contraseña });
        await nuevoUsuario.save();
        res.status(201).json({ mensaje: 'Usuario registrado con éxito.' });
    } catch (err) {
        res.status(500).json({ error: 'Error en el servidor.' });
    }
});

// RUTA PARA INICIAR SESIÓN (Login)
app.post('/api/login', async (req, res) => {
    try {
        const { correo, contraseña } = req.body;
        const usuario = await User.findOne({ correo });
        if (!usuario) return res.status(400).json({ error: 'Usuario no encontrado.' });

        const coincide = await bcrypt.compare(contraseña, usuario.contraseña);
        if (!coincide) return res.status(400).json({ error: 'Contraseña incorrecta.' });

        res.status(200).json({ mensaje: '¡Login exitoso!' });
    } catch (err) {
        res.status(500).json({ error: 'Error en el servidor.' });
    }
});

app.listen(3000, () => console.log('💻 Servidor corriendo en http://localhost:3000'));