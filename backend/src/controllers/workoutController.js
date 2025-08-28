let workouts = require('../models/workout');

exports.getAllWorkouts = (req, res) => {
    res.json(workouts);
};

exports.createWorkout = (req, res) => {
    const { title, duration, description, level } = req.body;
    const newWorkout = {
        id: workouts.length + 1,
        title,
        duration,
        description,
        level,
    };
    workouts.push(newWorkout);
    res.status(201).json(newWorkout);
};

exports.deleteWorkout = (req, res) => {
    const { id } = req.params;
    workouts = workouts.filter(w => w.id !== parseInt(id));
    res.status(204).end();
};