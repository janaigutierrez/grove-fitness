const express = require('express');
const router = express.Router();
const {
    getExercises,
    getExercise,
    createExercise,
    updateExercise,
    deleteExercise
} = require('../controllers/exerciseController');
const { validateExercise, validateExerciseUpdate } = require('../middleware/validation');
const auth = require('../middleware/auth');

// @route   GET /api/exercises
router.get('/', auth, getExercises);

// @route   GET /api/exercises/:id
router.get('/:id', auth, getExercise);

// @route   POST /api/exercises
router.post('/', auth, validateExercise, createExercise);

// @route   PUT /api/exercises/:id
router.put('/:id', auth, validateExerciseUpdate, updateExercise);

// @route   DELETE /api/exercises/:id
router.delete('/:id', auth, deleteExercise);

module.exports = router;