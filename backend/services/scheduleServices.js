const User = require('../models/User');
const Workout = require('../models/Workout');

// Obtener calendario semanal del usuario
const getWeeklySchedule = async (userId) => {
    const user = await User.findById(userId)
        .populate('weekly_schedule.monday')
        .populate('weekly_schedule.tuesday')
        .populate('weekly_schedule.wednesday')
        .populate('weekly_schedule.thursday')
        .populate('weekly_schedule.friday')
        .populate('weekly_schedule.saturday')
        .populate('weekly_schedule.sunday')
        .select('weekly_schedule');

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    // Transformar a formato más limpio
    const schedule = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    days.forEach(day => {
        const workout = user.weekly_schedule?.[day];
        schedule[day] = workout ? {
            id: workout._id.toString(),
            name: workout.name,
            workout_type: workout.workout_type,
            difficulty: workout.difficulty,
            estimated_duration: workout.estimated_duration
        } : null;
    });

    return schedule;
};

// Actualizar calendario semanal
const updateWeeklySchedule = async (userId, scheduleData) => {
    // Validar que los workout IDs existen (tanto propios como templates)
    const workoutIds = Object.values(scheduleData.weekly_schedule || scheduleData).filter(id => id !== null);

    if (workoutIds.length > 0) {
        const workouts = await Workout.find({
            _id: { $in: workoutIds },
            $or: [
                { user_id: userId },
                { is_template: true }
            ]
        });

        if (workouts.length !== workoutIds.length) {
            const error = new Error('Some workouts not found or not accessible');
            error.statusCode = 400;
            throw error;
        }
    }

    // Actualizar el calendario (handle both data formats)
    const scheduleToSave = scheduleData.weekly_schedule || scheduleData;
    const user = await User.findByIdAndUpdate(
        userId,
        { $set: { weekly_schedule: scheduleToSave } },
        { new: true }
    )
        .populate('weekly_schedule.monday')
        .populate('weekly_schedule.tuesday')
        .populate('weekly_schedule.wednesday')
        .populate('weekly_schedule.thursday')
        .populate('weekly_schedule.friday')
        .populate('weekly_schedule.saturday')
        .populate('weekly_schedule.sunday');

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    // Transformar respuesta
    const schedule = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    days.forEach(day => {
        const workout = user.weekly_schedule?.[day];
        schedule[day] = workout ? {
            id: workout._id.toString(),
            name: workout.name,
            workout_type: workout.workout_type,
            difficulty: workout.difficulty,
            estimated_duration: workout.estimated_duration
        } : null;
    });

    return schedule;
};

// Obtener workout del día actual
const getTodayWorkout = async (userId) => {
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = daysOfWeek[new Date().getDay()];

    const user = await User.findById(userId)
        .populate(`weekly_schedule.${today}`)
        .select('weekly_schedule');

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    const todayWorkout = user.weekly_schedule?.[today];

    if (!todayWorkout) {
        return {
            message: `No workout scheduled for today (${today})`,
            today: today,
            workout: null
        };
    }

    // Populate completo del workout con ejercicios
    const fullWorkout = await Workout.findById(todayWorkout._id)
        .populate('exercises.exercise_id', 'name type category');

    return {
        today: today,
        workout: {
            id: fullWorkout._id.toString(),
            name: fullWorkout.name,
            workout_type: fullWorkout.workout_type,
            difficulty: fullWorkout.difficulty,
            estimated_duration: fullWorkout.estimated_duration,
            exercises: fullWorkout.exercises.map(ex => ({
                exercise_id: ex.exercise_id ? {
                    id: ex.exercise_id._id.toString(),
                    name: ex.exercise_id.name,
                    type: ex.exercise_id.type,
                    category: ex.exercise_id.category
                } : null,
                order: ex.order,
                custom_sets: ex.custom_sets,
                custom_reps: ex.custom_reps,
                custom_rest_seconds: ex.custom_rest_seconds,
                custom_weight: ex.custom_weight
            }))
        }
    };
};

module.exports = {
    getWeeklySchedule,
    updateWeeklySchedule,
    getTodayWorkout
};