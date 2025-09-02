const WorkoutSession = require('../models/WorkoutSession');
const Workout = require('../models/Workout');
const User = require('../models/User');

// Get all user sessions
const getSessions = async (req, res) => {
    try {
        const { completed, limit = 50 } = req.query;

        let filter = { user_id: req.user._id };
        if (completed !== undefined) filter.completed = completed === 'true';

        const sessions = await WorkoutSession.find(filter)
            .populate('workout_id', 'name workout_type')
            .populate('exercises_performed.exercise_id', 'name type')
            .sort({ started_at: -1 })
            .limit(parseInt(limit));

        res.json(sessions);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Get single session
const getSession = async (req, res) => {
    try {
        const session = await WorkoutSession.findOne({
            _id: req.params.id,
            user_id: req.user._id
        })
            .populate('workout_id')
            .populate('exercises_performed.exercise_id');

        if (!session) {
            return res.status(404).json({ msg: 'Session not found' });
        }

        res.json(session);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Start workout session
const startSession = async (req, res) => {
    try {
        const { workout_id } = req.body;

        // Validate workout exists and belongs to user
        const workout = await Workout.findOne({
            _id: workout_id,
            user_id: req.user._id
        }).populate('exercises.exercise_id');

        if (!workout) {
            return res.status(404).json({ msg: 'Workout not found' });
        }

        // Check if there's an active session
        const activeSession = await WorkoutSession.findOne({
            user_id: req.user._id,
            completed: false,
            abandoned: false
        });

        if (activeSession) {
            return res.status(400).json({ msg: 'You have an active workout session' });
        }

        // Create new session
        const session = new WorkoutSession({
            user_id: req.user._id,
            workout_id,
            started_at: new Date(),
            exercises_performed: workout.exercises.map(e => ({
                exercise_id: e.exercise_id._id,
                sets_completed: [],
                total_sets: e.custom_sets || e.exercise_id.sets || 1,
                completed_sets: 0
            }))
        });

        await session.save();
        await session.populate('workout_id', 'name workout_type');
        await session.populate('exercises_performed.exercise_id', 'name type');

        res.json(session);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Update session progress
const updateSession = async (req, res) => {
    try {
        const { exercises_performed } = req.body;

        let session = await WorkoutSession.findOne({
            _id: req.params.id,
            user_id: req.user._id,
            completed: false
        });

        if (!session) {
            return res.status(404).json({ msg: 'Active session not found' });
        }

        // Update exercises performed
        if (exercises_performed) {
            session.exercises_performed = exercises_performed;

            // Calculate completion percentage
            const totalSets = session.exercises_performed.reduce((acc, e) => acc + e.total_sets, 0);
            const completedSets = session.exercises_performed.reduce((acc, e) => acc + e.completed_sets, 0);
            session.completion_percentage = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
        }

        await session.save();
        res.json(session);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Complete session
const completeSession = async (req, res) => {
    try {
        const { perceived_difficulty, energy_level, mood_after, notes } = req.body;

        let session = await WorkoutSession.findOne({
            _id: req.params.id,
            user_id: req.user._id,
            completed: false
        });

        if (!session) {
            return res.status(404).json({ msg: 'Active session not found' });
        }

        // Calculate final stats
        const completedAt = new Date();
        const totalDuration = Math.round((completedAt - session.started_at) / (1000 * 60)); // minutes

        // Update session
        session.completed = true;
        session.completed_at = completedAt;
        session.total_duration_minutes = totalDuration;
        session.perceived_difficulty = perceived_difficulty;
        session.energy_level = energy_level;
        session.mood_after = mood_after;
        session.notes = notes;

        // Calculate volume and reps
        let totalVolume = 0;
        let totalReps = 0;

        session.exercises_performed.forEach(exercise => {
            exercise.sets_completed.forEach(set => {
                if (set.weight_used && set.weight_used !== 'corporal') {
                    const weight = parseFloat(set.weight_used.replace(/[^0-9.]/g, ''));
                    if (!isNaN(weight)) {
                        totalVolume += weight * (set.reps_completed || 1);
                    }
                }
                totalReps += set.reps_completed || 0;
            });
        });

        session.total_volume_kg = totalVolume;
        session.total_reps = totalReps;

        await session.save();
        res.json(session);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Abandon session
const abandonSession = async (req, res) => {
    try {
        const { abandon_reason } = req.body;

        let session = await WorkoutSession.findOne({
            _id: req.params.id,
            user_id: req.user._id,
            completed: false
        });

        if (!session) {
            return res.status(404).json({ msg: 'Active session not found' });
        }

        session.abandoned = true;
        session.abandon_reason = abandon_reason;
        session.completed_at = new Date();
        session.total_duration_minutes = Math.round((new Date() - session.started_at) / (1000 * 60));

        await session.save();
        res.json(session);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

module.exports = {
    getSessions,
    getSession,
    startSession,
    updateSession,
    completeSession,
    abandonSession
};