const exerciseService = require('../services/exerciseService');
const serverCache = require('../services/cacheService');

const getExercises = async (req, res, next) => {
    try {
        const { type, category } = req.query;
        const cacheKey = `exercises:${req.user._id}:${type || ''}:${category || ''}`;
        const cached = serverCache.get(cacheKey);
        if (cached) return res.json(cached);

        const exercises = await exerciseService.getExercises(req.user._id, { type, category });
        serverCache.set(cacheKey, exercises, serverCache.TTL.EXERCISES);
        res.json(exercises);
    } catch (error) {
        next(error);
    }
};

const getExercise = async (req, res, next) => {
    try {
        const exercise = await exerciseService.getExerciseById(req.params.id, req.user._id);
        res.json(exercise);
    } catch (error) {
        next(error);
    }
};

const createExercise = async (req, res, next) => {
    try {
        const exercise = await exerciseService.createExercise(req.user._id, req.body);
        serverCache.delByPrefix(`exercises:${req.user._id}:`);
        res.json(exercise);
    } catch (error) {
        next(error);
    }
};

const updateExercise = async (req, res, next) => {
    try {
        const exercise = await exerciseService.updateExercise(req.params.id, req.user._id, req.body);
        serverCache.delByPrefix(`exercises:${req.user._id}:`);
        res.json(exercise);
    } catch (error) {
        next(error);
    }
};

const deleteExercise = async (req, res, next) => {
    try {
        const result = await exerciseService.deleteExercise(req.params.id, req.user._id);
        serverCache.delByPrefix(`exercises:${req.user._id}:`);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getExercises,
    getExercise,
    createExercise,
    updateExercise,
    deleteExercise
};