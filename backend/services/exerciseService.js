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
        category: ex.category,
        muscle_groups: ex.muscle_groups,
        equipment: ex.equipment,
        default_sets: ex.default_sets,
        default_reps: ex.default_reps,
        default_rest_seconds: ex.default_rest_seconds,
        default_duration_seconds: ex.default_duration_seconds,
        default_distance_km: ex.default_distance_km,
        difficulty: ex.difficulty,
        instructions: ex.instructions,
        video_url: ex.video_url,
        is_custom: ex.is_custom,
        times_performed: ex.times_performed,
        last_performed: ex.last_performed,
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

    // ✅ UN SOLO OBJETO - No usar .map()
    return {
        id: exercise._id.toString(),
        name: exercise.name,
        type: exercise.type,
        category: exercise.category,
        muscle_groups: exercise.muscle_groups,
        equipment: exercise.equipment,
        default_sets: exercise.default_sets,
        default_reps: exercise.default_reps,
        default_rest_seconds: exercise.default_rest_seconds,
        default_duration_seconds: exercise.default_duration_seconds,
        default_distance_km: exercise.default_distance_km,
        difficulty: exercise.difficulty,
        instructions: exercise.instructions,
        video_url: exercise.video_url,
        is_custom: exercise.is_custom,
        times_performed: exercise.times_performed,
        last_performed: exercise.last_performed,
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

    // ✅ UN SOLO OBJETO - No usar .map()
    return {
        id: exercise._id.toString(),
        name: exercise.name,
        type: exercise.type,
        category: exercise.category,
        muscle_groups: exercise.muscle_groups,
        equipment: exercise.equipment,
        default_sets: exercise.default_sets,
        default_reps: exercise.default_reps,
        default_rest_seconds: exercise.default_rest_seconds,
        default_duration_seconds: exercise.default_duration_seconds,
        default_distance_km: exercise.default_distance_km,
        difficulty: exercise.difficulty,
        instructions: exercise.instructions,
        video_url: exercise.video_url,
        is_custom: exercise.is_custom,
        times_performed: exercise.times_performed,
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

    // ✅ UN SOLO OBJETO - No usar .map()
    return {
        id: exercise._id.toString(),
        name: exercise.name,
        type: exercise.type,
        category: exercise.category,
        muscle_groups: exercise.muscle_groups,
        equipment: exercise.equipment,
        default_sets: exercise.default_sets,
        default_reps: exercise.default_reps,
        default_rest_seconds: exercise.default_rest_seconds,
        default_duration_seconds: exercise.default_duration_seconds,
        default_distance_km: exercise.default_distance_km,
        difficulty: exercise.difficulty,
        instructions: exercise.instructions,
        video_url: exercise.video_url,
        is_custom: exercise.is_custom,
        times_performed: exercise.times_performed,
        last_performed: exercise.last_performed,
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