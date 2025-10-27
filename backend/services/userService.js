const User = require('../models/User');
const WorkoutSession = require('../models/WorkoutSession');
const Exercise = require('../models/Exercise');

const updateProfile = async (userId, updateData) => {
    // Don't allow password or email updates here
    delete updateData.password;
    delete updateData.email;

    const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true }
    ).select('-password');

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        fitness_level: user.fitness_level,
        weight: user.weight,
        height: user.height,
        age: user.age,
        available_equipment: user.available_equipment,
        workout_location: user.workout_location,
        time_per_session: user.time_per_session,
        days_per_week: user.days_per_week,
        goals: user.goals,
        personality_type: user.personality_type
    };
};

const getStats = async (userId) => {
    // Total workouts completed
    const totalWorkouts = await WorkoutSession.countDocuments({
        user_id: userId,
        completed: true
    });

    // Total exercises created
    const totalExercises = await Exercise.countDocuments({
        user_id: userId
    });

    // This week's workouts
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const thisWeekWorkouts = await WorkoutSession.countDocuments({
        user_id: userId,
        completed: true,
        completed_at: { $gte: weekStart }
    });

    // Recent sessions
    const recentSessions = await WorkoutSession.find({
        user_id: userId,
        completed: true
    })
        .populate('workout_id', 'name workout_type')
        .sort({ completed_at: -1 })
        .limit(5);

    // Transform recent sessions
    const transformedSessions = recentSessions.map(session => ({
        id: session._id.toString(),
        workout_id: session.workout_id ? {
            id: session.workout_id._id.toString(),
            name: session.workout_id.name,
            workout_type: session.workout_id.workout_type
        } : null,
        completed_at: session.completed_at,
        total_duration_minutes: session.total_duration_minutes,
        total_volume_kg: session.total_volume_kg
    }));

    // Calculate streak
    const sessions = await WorkoutSession.find({
        user_id: userId,
        completed: true
    })
        .sort({ completed_at: -1 })
        .select('completed_at');

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let session of sessions) {
        const sessionDate = new Date(session.completed_at);
        sessionDate.setHours(0, 0, 0, 0);

        const dayDiff = Math.floor((currentDate - sessionDate) / (1000 * 60 * 60 * 24));

        if (dayDiff === streak) {
            streak++;
        } else if (dayDiff > streak) {
            break;
        }
    }

    return {
        totalWorkouts,
        totalExercises,
        thisWeekWorkouts,
        currentStreak: streak,
        recentSessions: transformedSessions
    };
};

const updatePreferences = async (userId, preferences) => {
    const { available_equipment, workout_location, time_per_session, days_per_week, goals, personality_type } = preferences;

    const user = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                available_equipment,
                workout_location,
                time_per_session,
                days_per_week,
                goals,
                personality_type
            }
        },
        { new: true }
    ).select('-password');

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        available_equipment: user.available_equipment,
        workout_location: user.workout_location,
        time_per_session: user.time_per_session,
        days_per_week: user.days_per_week,
        goals: user.goals,
        personality_type: user.personality_type
    };
};

module.exports = {
    updateProfile,
    getStats,
    updatePreferences
};