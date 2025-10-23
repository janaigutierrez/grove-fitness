const mongoose = require('mongoose');
require('dotenv').config();

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ MongoDB Connected');
    seedExercises();
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

// Modelo de Exercise
const exerciseSchema = new mongoose.Schema({
    name: String,
    type: String,
    category: String,
    muscle_groups: [String],
    equipment: [String],
    default_sets: Number,
    default_reps: Number,
    default_rest_seconds: Number,
    default_duration_seconds: Number,
    difficulty: String,
    instructions: String,
    is_custom: Boolean
}, { timestamps: true });

const Exercise = mongoose.model('Exercise', exerciseSchema);

// Ejercicios predefinidos
const predefinedExercises = [
    // PECHO
    {
        name: 'Flexiones',
        type: 'reps',
        category: 'chest',
        muscle_groups: ['pectoral', 'triceps', 'deltoides'],
        equipment: ['bodyweight'],
        default_sets: 3,
        default_reps: 12,
        default_rest_seconds: 60,
        difficulty: 'beginner',
        is_custom: false,
        instructions: 'Mantén el cuerpo recto, baja hasta que el pecho casi toque el suelo.'
    },
    {
        name: 'Flexiones Diamante',
        type: 'reps',
        category: 'chest',
        muscle_groups: ['pectoral', 'triceps'],
        equipment: ['bodyweight'],
        default_sets: 3,
        default_reps: 10,
        default_rest_seconds: 60,
        difficulty: 'intermediate',
        is_custom: false,
        instructions: 'Manos juntas formando un diamante, enfoque en tríceps.'
    },

    // ESPALDA
    {
        name: 'Dominadas',
        type: 'reps',
        category: 'back',
        muscle_groups: ['dorsal', 'biceps'],
        equipment: ['pullup_bar'],
        default_sets: 3,
        default_reps: 8,
        default_rest_seconds: 90,
        difficulty: 'intermediate',
        is_custom: false,
        instructions: 'Agarre prono, subir hasta barbilla sobre la barra.'
    },
    {
        name: 'Remo Invertido',
        type: 'reps',
        category: 'back',
        muscle_groups: ['dorsal', 'trapecio', 'biceps'],
        equipment: ['bodyweight', 'pullup_bar'],
        default_sets: 3,
        default_reps: 12,
        default_rest_seconds: 60,
        difficulty: 'beginner',
        is_custom: false,
        instructions: 'Bajo la barra, tira del pecho hacia la barra.'
    },

    // PIERNAS
    {
        name: 'Sentadillas',
        type: 'reps',
        category: 'legs',
        muscle_groups: ['cuadriceps', 'gluteos'],
        equipment: ['bodyweight'],
        default_sets: 3,
        default_reps: 15,
        default_rest_seconds: 60,
        difficulty: 'beginner',
        is_custom: false,
        instructions: 'Bajar hasta que los muslos estén paralelos al suelo.'
    },
    {
        name: 'Zancadas',
        type: 'reps',
        category: 'legs',
        muscle_groups: ['cuadriceps', 'gluteos'],
        equipment: ['bodyweight'],
        default_sets: 3,
        default_reps: 10,
        default_rest_seconds: 60,
        difficulty: 'beginner',
        is_custom: false,
        instructions: 'Alterna piernas, rodilla trasera casi toca el suelo.'
    },

    // CORE
    {
        name: 'Plancha',
        type: 'time',
        category: 'core',
        muscle_groups: ['abdominales', 'oblicuos'],
        equipment: ['bodyweight'],
        default_sets: 3,
        default_duration_seconds: 30,
        default_rest_seconds: 45,
        difficulty: 'beginner',
        is_custom: false,
        instructions: 'Mantén el cuerpo recto desde cabeza hasta pies.'
    },
    {
        name: 'Crunches',
        type: 'reps',
        category: 'core',
        muscle_groups: ['abdominales'],
        equipment: ['bodyweight'],
        default_sets: 3,
        default_reps: 20,
        default_rest_seconds: 45,
        difficulty: 'beginner',
        is_custom: false,
        instructions: 'Eleva los hombros del suelo, contrae abdomen.'
    },

    // HOMBROS
    {
        name: 'Pike Push-ups',
        type: 'reps',
        category: 'shoulders',
        muscle_groups: ['deltoides', 'triceps'],
        equipment: ['bodyweight'],
        default_sets: 3,
        default_reps: 10,
        default_rest_seconds: 60,
        difficulty: 'intermediate',
        is_custom: false,
        instructions: 'Posición de V invertida, flexiones verticales.'
    },

    // BRAZOS
    {
        name: 'Fondos en Paralelas',
        type: 'reps',
        category: 'arms',
        muscle_groups: ['triceps', 'pectoral'],
        equipment: ['bodyweight'],
        default_sets: 3,
        default_reps: 12,
        default_rest_seconds: 60,
        difficulty: 'intermediate',
        is_custom: false,
        instructions: 'Baja hasta que los codos formen 90 grados.'
    },

    // CARDIO
    {
        name: 'Burpees',
        type: 'reps',
        category: 'cardio',
        muscle_groups: ['cuadriceps', 'pectoral', 'deltoides'],
        equipment: ['bodyweight'],
        default_sets: 3,
        default_reps: 10,
        default_rest_seconds: 60,
        difficulty: 'intermediate',
        is_custom: false,
        instructions: 'Flexión + salto, ejercicio completo de cuerpo.'
    }
];

async function seedExercises() {
    try {
        // Verificar si ya existen
        const count = await Exercise.countDocuments({ is_custom: false });

        if (count > 0) {
            console.log(`⚠️  Ya existen ${count} ejercicios predefinidos`);
            console.log('❌ Seed cancelado para evitar duplicados');
            process.exit(0);
        }

        // Insertar ejercicios
        const created = await Exercise.insertMany(predefinedExercises);

        console.log('✅ Seed completado!');
        console.log(`📦 ${created.length} ejercicios predefinidos creados:`);

        created.forEach(ex => {
            console.log(`   - ${ex.name} (${ex.category})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error en seed:', error);
        process.exit(1);
    }
}