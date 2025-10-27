const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
    // Info básica
    name: { type: String, required: true }, // "LUNES - PUSH"
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: String, // "Pectoral + hombros + tríceps"

    // Ejercicios del workout
    exercises: [{
        exercise_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Exercise',
            required: true
        },
        order: { type: Number, required: true }, // 1, 2, 3...

        // Personalizaciones (override de defaults del Exercise)
        custom_sets: Number, // Si no está, usa default_sets del Exercise
        custom_reps: Number, // Si no está, usa default_reps
        custom_rest_seconds: Number, // Descanso entre series
        custom_weight: String, // "10kg", "corporal", "5kg"

        // Para time-based
        custom_duration_seconds: Number,

        // Para cardio
        custom_distance_km: Number,
        custom_pace: { type: String, enum: ['low', 'moderate', 'high'] },

        notes: String // Notas específicas para este ejercicio en este workout
    }],

    // Timing
    estimated_duration_minutes: Number, // Auto-calculado o manual

    // Clasificación
    workout_type: {
        type: String,
        enum: ['push', 'pull', 'legs', 'full_body', 'cardio', 'upper', 'lower', 'custom'],
        default: 'custom'
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced']
    },

    // Estado
    is_template: { type: Boolean, default: true }, // true = plantilla reutilizable
    is_favorite: { type: Boolean, default: false },

    // IA Generated
    ai_generated: { type: Boolean, default: false },
    ai_prompt: String, // El prompt que usó el user para generarlo

    // Stats
    times_completed: { type: Number, default: 0 },
    last_performed: Date,
    average_rating: Number

}, { timestamps: true });

// Índices
workoutSchema.index({ user_id: 1, workout_type: 1 });
workoutSchema.index({ user_id: 1, is_template: 1 });
workoutSchema.index({ user_id: 1, is_favorite: 1 });

// Método para calcular duración estimada
// Método para calcular duración estimada
workoutSchema.methods.calculateEstimatedDuration = function () {
    let totalMinutes = 0;

    this.exercises.forEach(exercise => {
        const sets = exercise.custom_sets || 3;
        const restSeconds = exercise.custom_rest_seconds || 60;

        // Tiempo promedio por serie: 30 segundos
        const exerciseTime = (sets * 30) + ((sets - 1) * restSeconds);
        totalMinutes += exerciseTime / 60;
    });

    return Math.round(totalMinutes);
};

module.exports = mongoose.model('Workout', workoutSchema);