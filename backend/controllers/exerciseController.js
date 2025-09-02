const Exercise = require('../models/Exercise');

// Get all user exercises
const getExercises = async (req, res) => {
    try {
        const { type, category } = req.query;

        let filter = { user_id: req.user._id };
        if (type) filter.type = type;
        if (category) filter.category = category;

        const exercises = await Exercise.find(filter)
            .sort({ createdAt: -1 });

        res.json(exercises);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Get single exercise
const getExercise = async (req, res) => {
    try {
        const exercise = await Exercise.findOne({
            _id: req.params.id,
            user_id: req.user._id
        });

        if (!exercise) {
            return res.status(404).json({ msg: 'Exercise not found' });
        }

        res.json(exercise);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Create exercise
const createExercise = async (req, res) => {
    try {
        const exerciseData = {
            ...req.body,
            user_id: req.user._id
        };

        const exercise = new Exercise(exerciseData);
        await exercise.save();

        res.json(exercise);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Update exercise
const updateExercise = async (req, res) => {
    try {
        let exercise = await Exercise.findOne({
            _id: req.params.id,
            user_id: req.user._id
        });

        if (!exercise) {
            return res.status(404).json({ msg: 'Exercise not found' });
        }

        exercise = await Exercise.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );

        res.json(exercise);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Delete exercise
const deleteExercise = async (req, res) => {
    try {
        const exercise = await Exercise.findOne({
            _id: req.params.id,
            user_id: req.user._id
        });

        if (!exercise) {
            return res.status(404).json({ msg: 'Exercise not found' });
        }

        await Exercise.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Exercise removed' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

module.exports = {
    getExercises,
    getExercise,
    createExercise,
    updateExercise,
    deleteExercise
};