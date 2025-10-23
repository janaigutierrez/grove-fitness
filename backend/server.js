const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
require('dotenv').config();

// Connect Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ extended: false }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/exercises', require('./routes/exercises'));
app.use('/api/workouts', require('./routes/workouts'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/ai', require('./routes/ai')); // 🔥 NUEVA RUTA IA

// Test route
app.get('/', (req, res) => res.send('Grove Fitness API Running 🌱'));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        groq_configured: !!process.env.GROQ_API_KEY
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));