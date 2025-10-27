const workoutService = require('../services/workoutService');

const getWorkouts = async (req, res, next) => {
    try {
        const { workout_type, is_template } = req.query;
        const workouts = await workoutService.getWorkouts(req.user._id, { workout_type, is_template });
        res.json(workouts);
    } catch (error) {
        next(error);
    }
};

const getWorkout = async (req, res, next) => {
    try {
        const workout = await workoutService.getWorkoutById(req.params.id, req.user._id);
        res.json(workout);
    } catch (error) {
        next(error);
    }
};

const createWorkout = async (req, res, next) => {
    try {
        const workout = await workoutService.createWorkout(req.user._id, req.body);
        res.json(workout);
    } catch (error) {
        next(error);
    }
};

const updateWorkout = async (req, res, next) => {
    try {
        const workout = await workoutService.updateWorkout(req.params.id, req.user._id, req.body);
        res.json(workout);
    } catch (error) {
        next(error);
    }
};

const deleteWorkout = async (req, res, next) => {
    try {
        const result = await workoutService.deleteWorkout(req.params.id, req.user._id);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const duplicateWorkout = async (req, res, next) => {
    try {
        const workout = await workoutService.duplicateWorkout(req.params.id, req.user._id);
        res.json(workout);
    } catch (error) {
        next(error);
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