const express = require('express');
const router = express.Router();
const {
    getWorkouts,
    getWorkout,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    duplicateWorkout
} = require('../controllers/workoutController');
const auth = require('../middleware/auth');

// @route   GET /api/workouts
// @desc    Get user workouts
router.get('/', auth, getWorkouts);

// @route   GET /api/workouts/:id
// @desc    Get single workout
router.get('/:id', auth, getWorkout);

// @route   POST /api/workouts
// @desc    Create workout
router.post('/', auth, createWorkout);

// @route   PUT /api/workouts/:id
// @desc    Update workout
router.put('/:id', auth, updateWorkout);

// @route   DELETE /api/workouts/:id
// @desc    Delete workout
router.delete('/:id', auth, deleteWorkout);

// @route   POST /api/workouts/:id/duplicate
// @desc    Duplicate workout
router.post('/:id/duplicate', auth, duplicateWorkout);

module.exports = router;