const Workout = require('../models/Workout');
const Exercise = require('../models/Exercise');

// Get all user workouts
const getWorkouts = async (req, res) => {
    try {
        const { workout_type, is_template } = req.query;

        let filter = { user_id: req.user._id };
        if (workout_type) filter.workout_type = workout_type;
        if (is_template !== undefined) filter.is_template = is_template === 'true';

        const workouts = await Workout.find(filter)
            .populate('exercises.exercise_id', 'name type category')
            .sort({ createdAt: -1 });

        res.json(workouts);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Get single workout
const getWorkout = async (req, res) => {
    try {
        const workout = await Workout.findOne({
            _id: req.params.id,
            user_id: req.user._id
        }).populate('exercises.exercise_id');

        if (!workout) {
            return res.status(404).json({ msg: 'Workout not found' });
        }

        res.json(workout);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Create workout
const createWorkout = async (req, res) => {
    try {
        const { name, exercises, workout_type, difficulty, estimated_duration } = req.body;

        // Validate exercises exist and belong to user
        const exerciseIds = exercises.map(e => e.exercise_id);
        const validExercises = await Exercise.find({
            _id: { $in: exerciseIds },
            user_id: req.user._id
        });

        if (validExercises.length !== exerciseIds.length) {
            return res.status(400).json({ msg: 'Some exercises not found or not accessible' });
        }

        const workout = new Workout({
            name,
            user_id: req.user._id,
            exercises,
            workout_type,
            difficulty,
            estimated_duration
        });

        await workout.save();
        await workout.populate('exercises.exercise_id', 'name type category');

        res.json(workout);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Update workout
const updateWorkout = async (req, res) => {
    try {
        let workout = await Workout.findOne({
            _id: req.params.id,
            user_id: req.user._id
        });

        if (!workout) {
            return res.status(404).json({ msg: 'Workout not found' });
        }

        // If updating exercises, validate them
        if (req.body.exercises) {
            const exerciseIds = req.body.exercises.map(e => e.exercise_id);
            const validExercises = await Exercise.find({
                _id: { $in: exerciseIds },
                user_id: req.user._id
            });

            if (validExercises.length !== exerciseIds.length) {
                return res.status(400).json({ msg: 'Some exercises not found or not accessible' });
            }
        }

        workout = await Workout.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        ).populate('exercises.exercise_id', 'name type category');

        res.json(workout);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Delete workout
const deleteWorkout = async (req, res) => {
    try {
        const workout = await Workout.findOne({
            _id: req.params.id,
            user_id: req.user._id
        });

        if (!workout) {
            return res.status(404).json({ msg: 'Workout not found' });
        }

        await Workout.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Workout removed' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Duplicate workout
const duplicateWorkout = async (req, res) => {
    try {
        const originalWorkout = await Workout.findOne({
            _id: req.params.id,
            user_id: req.user._id
        });

        if (!originalWorkout) {
            return res.status(404).json({ msg: 'Workout not found' });
        }

        const duplicatedWorkout = new Workout({
            name: `${originalWorkout.name} (Copy)`,
            user_id: req.user._id,
            exercises: originalWorkout.exercises,
            workout_type: originalWorkout.workout_type,
            difficulty: originalWorkout.difficulty,
            estimated_duration: originalWorkout.estimated_duration
        });

        await duplicatedWorkout.save();
        await duplicatedWorkout.populate('exercises.exercise_id', 'name type category');

        res.json(duplicatedWorkout);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

module.exports = {
    getWorkouts,
    getWorkout,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    duplicateWorkout
};