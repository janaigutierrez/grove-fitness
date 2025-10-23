const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
    // Info básica
    name: { type: String, required: true }, // "Flexiones"
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null si es predefinido

    // Clasificación
    type: {
        type: String,
        enum: ['reps', 'time', 'cardio'],
        required: true
    },
    category: {
        type: String,
        enum: ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'full_body']
    },

    // Músculos trabajados
    muscle_groups: [{
        type: String,
        enum: ['pectoral', 'dorsal', 'trapecio', 'deltoides', 'biceps', 'triceps',
            'cuadriceps', 'isquios', 'gluteos', 'gemelos', 'abdominales', 'oblicuos']
    }],

    // Equipo necesario
    equipment: [{
        type: String,
        enum: ['bodyweight', 'dumbbells', 'barbell', 'pullup_bar', 'resistance_bands',
            'bench', 'kettlebell', 'machine', 'other']
    }],

    // Valores por defecto (sugerencias)
    default_sets: { type: Number, default: 3 },
    default_reps: { type: Number, default: 10 },
    default_rest_seconds: { type: Number, default: 60 },

    // Para cardio
    default_duration_seconds: Number,
    default_distance_km: Number,

    // Metadata
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'intermediate'
    },
    instructions: String,
    video_url: String,
    is_custom: { type: Boolean, default: true }, // true = creado por user

    // Stats
    times_performed: { type: Number, default: 0 },
    last_performed: Date

}, { timestamps: true });

// Índices
exerciseSchema.index({ user_id: 1, category: 1 });
exerciseSchema.index({ is_custom: 1 });

module.exports = mongoose.model('Exercise', exerciseSchema);