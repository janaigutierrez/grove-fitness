const Workout = require('../models/Workout');
const Exercise = require('../models/Exercise');

const getWorkouts = async (userId, filters = {}) => {
    const { workout_type, is_template } = filters;

    let filter = { user_id: userId };
    if (workout_type) filter.workout_type = workout_type;
    if (is_template !== undefined) filter.is_template = is_template === 'true';

    const workouts = await Workout.find(filter)
        .populate('exercises.exercise_id', 'name type category')
        .sort({ createdAt: -1 });

    // Transform with populated exercises
    return workouts.map(workout => ({
        id: workout._id.toString(),
        name: workout.name,
        workout_type: workout.workout_type,
        difficulty: workout.difficulty,
        estimated_duration: workout.estimated_duration,
        is_template: workout.is_template,
        exercises: workout.exercises.map(ex => ({
            exercise_id: ex.exercise_id ? {
                id: ex.exercise_id._id.toString(),
                name: ex.exercise_id.name,
                type: ex.exercise_id.type,
                category: ex.exercise_id.category
            } : null,
            order: ex.order,
            custom_sets: ex.custom_sets,
            custom_reps: ex.custom_reps,
            custom_weight: ex.custom_weight,
            custom_duration: ex.custom_duration,
            notes: ex.notes
        })),
        createdAt: workout.createdAt,
        updatedAt: workout.updatedAt
    }));
};

const getWorkoutById = async (workoutId, userId) => {
    const workout = await Workout.findOne({
        _id: workoutId,
        user_id: userId
    }).populate('exercises.exercise_id');

    if (!workout) {
        const error = new Error('Workout not found');
        error.statusCode = 404;
        throw error;
    }

    return {
        id: workout._id.toString(),
        name: workout.name,
        workout_type: workout.workout_type,
        difficulty: workout.difficulty,
        estimated_duration: workout.estimated_duration,
        is_template: workout.is_template,
        exercises: workout.exercises.map(ex => ({
            exercise_id: ex.exercise_id ? {
                id: ex.exercise_id._id.toString(),
                name: ex.exercise_id.name,
                type: ex.exercise_id.type,
                sets: ex.exercise_id.sets,
                reps: ex.exercise_id.reps,
                weight: ex.exercise_id.weight,
                category: ex.exercise_id.category
            } : null,
            order: ex.order,
            custom_sets: ex.custom_sets,
            custom_reps: ex.custom_reps,
            custom_weight: ex.custom_weight,
            custom_duration: ex.custom_duration,
            notes: ex.notes
        })),
        createdAt: workout.createdAt
    };
};

const createWorkout = async (userId, workoutData) => {
    const { name, exercises, workout_type, difficulty, estimated_duration } = workoutData;

    // Validate exercises exist
    const exerciseIds = exercises.map(e => e.exercise_id);
    const validExercises = await Exercise.find({
        _id: { $in: exerciseIds },
        user_id: userId
    });

    if (validExercises.length !== exerciseIds.length) {
        const error = new Error('Some exercises not found or not accessible');
        error.statusCode = 400;
        throw error;
    }

    const workout = new Workout({
        name,
        user_id: userId,
        exercises,
        workout_type,
        difficulty,
        estimated_duration
    });

    await workout.save();
    await workout.populate('exercises.exercise_id', 'name type category');

    return {
        id: workout._id.toString(),
        name: workout.name,
        workout_type: workout.workout_type,
        difficulty: workout.difficulty,
        estimated_duration: workout.estimated_duration,
        exercises: workout.exercises.map(ex => ({
            exercise_id: {
                id: ex.exercise_id._id.toString(),
                name: ex.exercise_id.name,
                type: ex.exercise_id.type,
                category: ex.exercise_id.category
            },
            order: ex.order,
            custom_sets: ex.custom_sets,
            custom_reps: ex.custom_reps
        })),
        createdAt: workout.createdAt
    };
};

const updateWorkout = async (workoutId, userId, updateData) => {
    let workout = await Workout.findOne({
        _id: workoutId,
        user_id: userId
    });

    if (!workout) {
        const error = new Error('Workout not found');
        error.statusCode = 404;
        throw error;
    }

    // If updating exercises, validate them
    if (updateData.exercises) {
        const exerciseIds = updateData.exercises.map(e => e.exercise_id);
        const validExercises = await Exercise.find({
            _id: { $in: exerciseIds },
            user_id: userId
        });

        if (validExercises.length !== exerciseIds.length) {
            const error = new Error('Some exercises not found or not accessible');
            error.statusCode = 400;
            throw error;
        }
    }

    workout = await Workout.findByIdAndUpdate(
        workoutId,
        { $set: updateData },
        { new: true }
    ).populate('exercises.exercise_id', 'name type category');

    return {
        id: workout._id.toString(),
        name: workout.name,
        workout_type: workout.workout_type,
        difficulty: workout.difficulty,
        estimated_duration: workout.estimated_duration,
        exercises: workout.exercises.map(ex => ({
            exercise_id: {
                id: ex.exercise_id._id.toString(),
                name: ex.exercise_id.name,
                type: ex.exercise_id.type,
                category: ex.exercise_id.category
            },
            order: ex.order,
            custom_sets: ex.custom_sets
        })),
        updatedAt: workout.updatedAt
    };
};

const deleteWorkout = async (workoutId, userId) => {
    const workout = await Workout.findOne({
        _id: workoutId,
        user_id: userId
    });

    if (!workout) {
        const error = new Error('Workout not found');
        error.statusCode = 404;
        throw error;
    }

    await Workout.findByIdAndDelete(workoutId);
    return { message: 'Workout removed' };
};

const duplicateWorkout = async (workoutId, userId) => {
    const originalWorkout = await Workout.findOne({
        _id: workoutId,
        user_id: userId
    });

    if (!originalWorkout) {
        const error = new Error('Workout not found');
        error.statusCode = 404;
        throw error;
    }

    const duplicatedWorkout = new Workout({
        name: `${originalWorkout.name} (Copy)`,
        user_id: userId,
        exercises: originalWorkout.exercises,
        workout_type: originalWorkout.workout_type,
        difficulty: originalWorkout.difficulty,
        estimated_duration: originalWorkout.estimated_duration
    });

    await duplicatedWorkout.save();
    await duplicatedWorkout.populate('exercises.exercise_id', 'name type category');

    return {
        id: duplicatedWorkout._id.toString(),
        name: duplicatedWorkout.name,
        workout_type: duplicatedWorkout.workout_type,
        exercises: duplicatedWorkout.exercises.map(ex => ({
            exercise_id: {
                id: ex.exercise_id._id.toString(),
                name: ex.exercise_id.name,
                type: ex.exercise_id.type
            },
            order: ex.order
        })),
        createdAt: duplicatedWorkout.createdAt
    };
};

module.exports = {
    getWorkouts,
    getWorkoutById,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    duplicateWorkout
};