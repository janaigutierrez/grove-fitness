const mongoose = require('mongoose');

const workoutSessionSchema = new mongoose.Schema({
    // Referencias
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workout_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Workout', required: true },

    // Timing de la sesión
    started_at: { type: Date, required: true },
    completed_at: Date,
    paused_at: Date,
    total_duration_minutes: Number,
    total_rest_time_seconds: Number, // Tiempo total de descanso

    // Ejercicios realizados
    exercises_performed: [{
        exercise_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
        planned_sets: Number, // Cuántas series se planeaban
        completed_sets: Number, // Cuántas se completaron realmente

        sets_completed: [{
            set_number: { type: Number, required: true },
            reps_completed: Number,
            weight_used: String, // "10kg", "corporal"
            duration_seconds: Number, // Para time-based
            rest_after_seconds: Number, // Descanso REAL después de este set
            rpe: { type: Number, min: 1, max: 10 }, // Rate of Perceived Exertion
            completed: { type: Boolean, default: true },
            notes: String,
            timestamp: { type: Date, default: Date.now }
        }],

        // Progreso
        personal_best_achieved: Boolean,
        previous_best: mongoose.Schema.Types.Mixed,
        skipped: Boolean,
        skip_reason: String
    }],

    // Stats de la sesión
    total_volume_kg: Number, // Kg totales movidos
    total_reps: Number,
    completion_percentage: Number, // % del workout completado

    // Feedback del usuario
    perceived_difficulty: { type: Number, min: 1, max: 10 },
    energy_level: { type: Number, min: 1, max: 10 },
    mood_before: { type: String, enum: ['great', 'good', 'okay', 'tired', 'bad'] },
    mood_after: { type: String, enum: ['great', 'good', 'okay', 'tired', 'exhausted', 'bad'] },
    session_rating: { type: Number, min: 1, max: 5 },
    notes: String,

    // Progreso detectado
    improvements: [String], // ["Más peso que la última vez", "Mejor forma"]
    challenges: [String], // ["Cansancio", "Problemas de forma"]

    // Estado
    completed: { type: Boolean, default: false },
    abandoned: { type: Boolean, default: false },
    abandon_reason: String,

    // Coach IA feedback
    ai_feedback: String,
    ai_suggestions: [String]

}, { timestamps: true });

// Índices
workoutSessionSchema.index({ user_id: 1, started_at: -1 });
workoutSessionSchema.index({ user_id: 1, workout_id: 1, started_at: -1 });
workoutSessionSchema.index({ user_id: 1, completed: 1 });

// Método para calcular volumen
// Método para calcular volumen
workoutSessionSchema.methods.calculateTotalVolume = function () {
    let totalVolume = 0;

    this.exercises_performed.forEach(exercise => {
        exercise.sets_completed.forEach(set => {
            if (set.weight_used && set.weight_used !== 'corporal') {
                const weight = parseFloat(set.weight_used.replace(/[^0-9.]/g, ''));
                if (!isNaN(weight) && set.reps_completed) {
                    totalVolume += weight * set.reps_completed;
                }
            }
        });
    });

    return Math.round(totalVolume);
};

module.exports = mongoose.model('WorkoutSession', workoutSessionSchema);