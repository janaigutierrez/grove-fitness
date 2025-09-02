const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
    // Basic info
    name: { type: String, required: true }, // "Push Day", "Lunes Pectoral"
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Workout structure
    exercises: [{
        exercise_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
        order: Number, // ordre dins el workout
        // Override exercise defaults si cal
        custom_sets: Number,
        custom_reps: Number,
        custom_weight: String,
        custom_duration: Number,
        notes: String
    }],

    // Timing
    estimated_duration: Number, // minuts
    actual_duration: Number, // quan es completa

    // Classification
    workout_type: {
        type: String,
        enum: ['push', 'pull', 'legs', 'full_body', 'cardio', 'custom']
    },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },

    // Status
    is_template: { type: Boolean, default: true }, // template vs session
    completed: { type: Boolean, default: false },
    completion_date: Date,

    // Stats (quan es completa)
    total_volume: Number, // kg total moguts
    average_rest: Number, // segons promig descans

}, {
    timestamps: true
});

workoutSchema.index({ user_id: 1, workout_type: 1 });
workoutSchema.index({ user_id: 1, is_template: 1 });

module.exports = mongoose.model('Workout', workoutSchema);