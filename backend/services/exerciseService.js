const Exercise = require('../models/Exercise');

const getExercises = async (userId, filters = {}) => {
    const { type, category } = filters;

    let filter = { user_id: userId };
    if (type) filter.type = type;
    if (category) filter.category = category;

    const exercises = await Exercise.find(filter).sort({ createdAt: -1 });

    // Transform _id to id
    return exercises.map(ex => ({
        id: ex._id.toString(),
        name: ex.name,
        type: ex.type,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        rest_seconds: ex.rest_seconds,
        duration_seconds: ex.duration_seconds,
        distance_km: ex.distance_km,
        pace: ex.pace,
        duration_minutes: ex.duration_minutes,
        category: ex.category,
        difficulty: ex.difficulty,
        notes: ex.notes,
        last_performed: ex.last_performed,
        times_completed: ex.times_completed,
        createdAt: ex.createdAt,
        updatedAt: ex.updatedAt
    }));
};

const getExerciseById = async (exerciseId, userId) => {
    const exercise = await Exercise.findOne({
        _id: exerciseId,
        user_id: userId
    });

    if (!exercise) {
        const error = new Error('Exercise not found');
        error.statusCode = 404;
        throw error;
    }

    return {
        id: exercise._id.toString(),
        name: exercise.name,
        type: exercise.type,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight,
        rest_seconds: exercise.rest_seconds,
        duration_seconds: exercise.duration_seconds,
        distance_km: exercise.distance_km,
        pace: exercise.pace,
        duration_minutes: exercise.duration_minutes,
        category: exercise.category,
        difficulty: exercise.difficulty,
        notes: exercise.notes,
        last_performed: exercise.last_performed,
        times_completed: exercise.times_completed,
        createdAt: exercise.createdAt,
        updatedAt: exercise.updatedAt
    };
};

const createExercise = async (userId, exerciseData) => {
    const exercise = new Exercise({
        ...exerciseData,
        user_id: userId
    });

    await exercise.save();

    return {
        id: exercise._id.toString(),
        name: exercise.name,
        type: exercise.type,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight,
        rest_seconds: exercise.rest_seconds,
        duration_seconds: exercise.duration_seconds,
        distance_km: exercise.distance_km,
        pace: exercise.pace,
        duration_minutes: exercise.duration_minutes,
        category: exercise.category,
        difficulty: exercise.difficulty,
        notes: exercise.notes,
        createdAt: exercise.createdAt
    };
};

const updateExercise = async (exerciseId, userId, updateData) => {
    let exercise = await Exercise.findOne({
        _id: exerciseId,
        user_id: userId
    });

    if (!exercise) {
        const error = new Error('Exercise not found');
        error.statusCode = 404;
        throw error;
    }

    exercise = await Exercise.findByIdAndUpdate(
        exerciseId,
        { $set: updateData },
        { new: true }
    );

    return {
        id: exercise._id.toString(),
        name: exercise.name,
        type: exercise.type,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight,
        rest_seconds: exercise.rest_seconds,
        duration_seconds: exercise.duration_seconds,
        distance_km: exercise.distance_km,
        pace: exercise.pace,
        duration_minutes: exercise.duration_minutes,
        category: exercise.category,
        difficulty: exercise.difficulty,
        notes: exercise.notes,
        updatedAt: exercise.updatedAt
    };
};

const deleteExercise = async (exerciseId, userId) => {
    const exercise = await Exercise.findOne({
        _id: exerciseId,
        user_id: userId
    });

    if (!exercise) {
        const error = new Error('Exercise not found');
        error.statusCode = 404;
        throw error;
    }

    await Exercise.findByIdAndDelete(exerciseId);
    return { message: 'Exercise removed' };
};

module.exports = {
    getExercises,
    getExerciseById,
    createExercise,
    updateExercise,
    deleteExercise
};