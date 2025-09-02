const express = require('express');
const router = express.Router();
const {
    getExercises,
    getExercise,
    createExercise,
    updateExercise,
    deleteExercise
} = require('../controllers/exerciseController');
const { validateExercise } = require('../middleware/validation');
const auth = require('../middleware/auth');

// @route   GET /api/exercises
// @desc    Get user exercises
router.get('/', auth, getExercises);

// @route   GET /api/exercises/:id
// @desc    Get single exercise
router.get('/:id', auth, getExercise);

// @route   POST /api/exercises
// @desc    Create exercise
router.post('/', auth, validateExercise, createExercise);

// @route   PUT /api/exercises/:id
// @desc    Update exercise
router.put('/:id', auth, validateExercise, updateExercise);

// @route   DELETE /api/exercises/:id
// @desc    Delete exercise
router.delete('/:id', auth, deleteExercise);

module.exports = router;