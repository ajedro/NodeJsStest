require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();

// Middleware
app.use(express.json());
app.use(cors()); // Permite que Netlify se conecte a este backend

// Conexión a MongoDB usando tu variable exacta
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log('Conectado exitosamente a MongoDB'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

// Modelo de Usuario
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

// Ruta de Registro
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const userExists = await User.findOne({ username });
    if (userExists) return res.status(400).json({ error: 'El usuario ya existe' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'Usuario registrado con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Ruta de Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Contraseña incorrecta' });

    // Login exitoso (puedes implementar JWT aquí si lo deseas, por ahora devolvemos éxito)
    res.status(200).json({ message: 'Login correcto', user: user.username });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));