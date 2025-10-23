const express = require('express');
const router = express.Router();
const {
    getWorkouts,
    getWorkout,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    duplicateWorkout,
    reorderExercises,
    toggleFavorite
} = require('../controllers/workoutController');
const auth = require('../middleware/auth');

// @route   GET /api/workouts
// @desc    Get all user workouts
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

// @route   PUT /api/workouts/:id/reorder
// @desc    Reorder exercises in workout
router.put('/:id/reorder', auth, reorderExercises);

// @route   POST /api/workouts/:id/favorite
// @desc    Toggle favorite status
router.post('/:id/favorite', auth, toggleFavorite);

module.exports = router;