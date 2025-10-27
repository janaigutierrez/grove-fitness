// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // ============ AUTH & PROFILE ============
    name: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        unique: true,
        sparse: true, // permet nulls però únic si existeix
        trim: true,
        lowercase: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },

    // ============ PHYSICAL DATA ============
    weight: { type: Number },
    height: { type: Number },
    age: { type: Number },
    fitness_level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },

    // ============ PREFERENCES ============
    available_equipment: [String],
    workout_location: {
        type: String,
        enum: ['casa', 'gym']
    },
    time_per_session: Number,
    days_per_week: Number,

    // ============ GOALS ============
    goals: [String],
    onboarding_text: String,

    // ============ PROGRESS TRACKING ============
    current_weights: {
        type: Map,
        of: Number
    },
    personal_bests: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },

    // ============ AI PREFERENCES ============
    ai_personality: {
        type: String,
        enum: ['motivador', 'analitico', 'bestia', 'relajado'],
        default: 'motivador'
    },
    ai_context_history: [{
        role: {
            type: String,
            enum: ['user', 'assistant']
        },
        content: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],

    // ============ AUTH & SECURITY ============
    refresh_tokens: [{
        token: String,
        created_at: {
            type: Date,
            default: Date.now
        },
        expires_at: Date,
        device: String
    }],
    blacklisted_tokens: [{
        token: String,
        blacklisted_at: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// ============ ÍNDEXS ============
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

module.exports = mongoose.model('User', userSchema);