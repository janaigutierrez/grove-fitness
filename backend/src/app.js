const express = require('express');
const cors = require('cors');
const workoutRoutes = require('./routes/workoutRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/workouts', workoutRoutes);

module.exports = app;