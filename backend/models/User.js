const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // Basics
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // Physical data
    weight: { type: Number },
    height: { type: Number },
    age: { type: Number },
    fitness_level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },

    // Preferences
    available_equipment: [String],
    workout_location: { type: String, enum: ['casa', 'gym'] },
    time_per_session: Number,
    days_per_week: Number,

    // Goals (extracted from onboarding text)
    goals: [String],
    onboarding_text: String, // el text lliure original

    // Progress tracking
    current_weights: { type: Map, of: Number },
    personal_bests: { type: Map, of: mongoose.Schema.Types.Mixed },

    // ============ AI PREFERENCES ============
    ai_personality: {
        type: String,
        enum: ['motivador', 'analitico', 'bestia', 'relajado'],
        default: 'motivador'
    },
    ai_context_history: [{
        role: { type: String, enum: ['user', 'assistant'] },
        content: String,
        timestamp: { type: Date, default: Date.now }
    }],

    // ============ AUTH & SECURITY ============
    // Refresh tokens
    refresh_tokens: [{
        token: String,
        created_at: { type: Date, default: Date.now },
        expires_at: Date,
        device: String // "iPhone 13", "Web"
    }],

    // Blacklist tokens (para logout)
    blacklisted_tokens: [{
        token: String,
        blacklisted_at: { type: Date, default: Date.now }
    }]

}, {
    timestamps: true
});

// Índices
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);