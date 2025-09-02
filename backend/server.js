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
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/exercises', require('./src/routes/exercises'));
app.use('/api/workouts', require('./src/routes/workouts'));
app.use('/api/sessions', require('./src/routes/sessions'));

// Test route
app.get('/', (req, res) => res.send('Grove Fitness API Running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));