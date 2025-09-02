const User = require('../models/User');
const WorkoutSession = require('../models/WorkoutSession');
const Exercise = require('../models/Exercise');

// Update profile
const updateProfile = async (req, res) => {
    try {
        const updates = req.body;
        delete updates.password; // Don't allow password updates here
        delete updates.email;    // Don't allow email updates here

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Get user stats
const getStats = async (req, res) => {
    try {
        const userId = req.user._id;

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

        res.json({
            totalWorkouts,
            totalExercises,
            thisWeekWorkouts,
            currentStreak: streak,
            recentSessions
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Update preferences
const updatePreferences = async (req, res) => {
    try {
        const { available_equipment, workout_location, time_per_session, days_per_week, goals, personality_type } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user._id,
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

        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

module.exports = {
    updateProfile,
    getStats,
    updatePreferences
};