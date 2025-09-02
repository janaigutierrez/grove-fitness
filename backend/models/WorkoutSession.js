const mongoose = require('mongoose');

const workoutSessionSchema = new mongoose.Schema({
    // References
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workout_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Workout', required: true },

    // Session timing
    started_at: { type: Date, required: true },
    completed_at: Date,
    total_duration_minutes: Number,

    // Exercise performance
    exercises_performed: [{
        exercise_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
        sets_completed: [{
            set_number: Number,
            reps_completed: Number,
            weight_used: String,
            duration_seconds: Number, // per time-based
            rest_duration: Number,
            completed: { type: Boolean, default: true },
            notes: String
        }],
        total_sets: Number,
        completed_sets: Number,
        exercise_duration: Number, // temps total exercici
        personal_best: Boolean // si ha superat PB
    }],

    // Session stats
    total_volume_kg: Number, // suma tot el pes mogut
    total_reps: Number,
    average_rest: Number,
    completion_percentage: Number, // % workout completat

    // User feedback
    perceived_difficulty: { type: Number, min: 1, max: 10 },
    energy_level: { type: Number, min: 1, max: 10 },
    mood_after: { type: String, enum: ['great', 'good', 'okay', 'tired', 'exhausted'] },
    notes: String,

    // Progress indicators
    improvements: [String], // ["increased weight", "more reps", "better form"]
    challenges: [String], // ["too tired", "form problems"]

    // Status
    completed: { type: Boolean, default: false },
    abandoned: { type: Boolean, default: false },
    abandon_reason: String
}, {
    timestamps: true
});

// Indexes per queries de progress
workoutSessionSchema.index({ user_id: 1, started_at: -1 });
workoutSessionSchema.index({ user_id: 1, workout_id: 1, started_at: -1 });
workoutSessionSchema.index({ user_id: 1, completed: 1 });

module.exports = mongoose.model('WorkoutSession', workoutSessionSchema);