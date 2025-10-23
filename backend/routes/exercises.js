const express = require('express');
const router = express.Router();
const {
    getExercises,
    getExercise,
    createExercise,
    updateExercise,
    deleteExercise,
    getByCategory,
    getByMuscleGroup,
    getMostUsed,
    getAvailableEquipment,
    seedExercises
} = require('../controllers/exerciseController');
const { validateExercise } = require('../middleware/validation');
const auth = require('../middleware/auth');

// @route   GET /api/exercises
// @desc    Get exercises (con filtros)
router.get('/', auth, getExercises);

// @route   GET /api/exercises/by-category
// @desc    Get exercises grouped by category
router.get('/by-category', auth, getByCategory);

// @route   GET /api/exercises/by-muscle
// @desc    Get exercises grouped by muscle group
router.get('/by-muscle', auth, getByMuscleGroup);

// @route   GET /api/exercises/most-used
// @desc    Get most used exercises
router.get('/most-used', auth, getMostUsed);

// @route   GET /api/exercises/equipment
// @desc    Get available equipment list
router.get('/equipment', auth, getAvailableEquipment);

// @route   POST /api/exercises/seed
// @desc    Seed predefined exercises (run once)
router.post('/seed', seedExercises);

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