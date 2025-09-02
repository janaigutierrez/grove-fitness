const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
    // Basic info
    name: { type: String, required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Exercise type
    type: {
        type: String,
        enum: ['reps', 'time', 'cardio'],
        required: true
    },

    // For type: 'reps'
    sets: Number,
    reps: Number,
    weight: String, // "5kg", "corporal", "10kg"
    rest_seconds: { type: Number, default: 60 },

    // For type: 'time'  
    duration_seconds: Number,

    // For type: 'cardio'
    distance_km: Number,
    pace: { type: String, enum: ['baixa', 'moderada', 'alta'] },
    duration_minutes: Number,

    // Metadata
    category: String, // "pectoral", "espalda", "piernas"...
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    notes: String,

    // Progress tracking
    last_performed: Date,
    times_completed: { type: Number, default: 0 }
}, {
    timestamps: true
});

// Index per millorar queries
exerciseSchema.index({ user_id: 1, type: 1 });

module.exports = mongoose.model('Exercise', exerciseSchema);