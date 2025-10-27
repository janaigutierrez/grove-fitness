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
router.get('/', auth, getWorkouts);

// @route   GET /api/workouts/:id
router.get('/:id', auth, getWorkout);

// @route   POST /api/workouts
router.post('/', auth, createWorkout);

// @route   PUT /api/workouts/:id
router.put('/:id', auth, updateWorkout);

// @route   DELETE /api/workouts/:id
router.delete('/:id', auth, deleteWorkout);

// @route   POST /api/workouts/:id/duplicate
router.post('/:id/duplicate', auth, duplicateWorkout);

module.exports = router;