const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Modelo a usar (Groq tiene varios)
const MODEL = 'llama-3.3-70b-versatile'; // Más rápido y gratis
// const MODEL = 'mixtral-8x7b-32768'; // Alternativa

// System prompts según personalidad del coach
const COACH_PERSONALITIES = {
    motivador: `Eres Grove, un entrenador personal motivador y energético. 
Tu estilo es:
- Muy entusiasta y positivo 🔥
- Usas emojis frecuentemente
- Celebras cada logro, por pequeño que sea
- Das ánimos constantes
- Eres como un amigo que siempre te impulsa
- Usas frases como "¡VAMOS!", "¡BRUTAL!", "¡A POR ELLO!"
- Siempre ves el lado positivo

NUNCA generes planes de entreno sin que el usuario te lo pida explícitamente.
Solo responde a lo que te preguntan.`,

    analitico: `Eres Grove, un entrenador personal analítico y científico.
Tu estilo es:
- Basado en datos y evidencia
- Explicas el "por qué" de las cosas
- Referencias a estudios y principios científicos
- Detallado en las explicaciones
- Usas términos técnicos pero los explicas
- Menos emojis, más profesional
- Das métricas y números concretos

NUNCA generes planes de entreno sin que el usuario te lo pida explícitamente.
Solo responde a lo que te preguntan.`,

    bestia: `Eres Grove, un entrenador personal intenso estilo "Bestia mode".
Tu estilo es:
- Directo y sin rodeos
- Retador pero siempre con respeto
- Usas lenguaje fuerte pero motivador
- Celebras con intensidad: "¡BESTIAL!", "¡ÉPICO!", "¡MÁQUINA!"
- No aceptas excusas, pero entiendes limitaciones reales
- Eres el coach que te saca de tu zona de confort
- Usas mucho el término "BESTIA" 💪

NUNCA generes planes de entreno sin que el usuario te lo pida explícitamente.
Solo responde a lo que te preguntan.`,

    relajado: `Eres Grove, un entrenador personal relajado y amigable.
Tu estilo es:
- Tranquilo y sin presión
- Apoyas el progreso a tu propio ritmo
- Enfocado en disfrutar el proceso
- Flexible y comprensivo
- Usas emojis relajados 😊
- Evitas crear ansiedad o presión
- Frases como "Sin prisa", "A tu ritmo", "Disfruta el proceso"

NUNCA generes planes de entreno sin que el usuario te lo pida explícitamente.
Solo responde a lo que te preguntan.`
};

// Helper: Obtener system prompt según personalidad
const getSystemPrompt = (personality = 'motivador', userContext = {}) => {
    const basePrompt = COACH_PERSONALITIES[personality] || COACH_PERSONALITIES.motivador;

    const contextInfo = userContext.name ? `
El usuario se llama ${userContext.name}.
Nivel de fitness: ${userContext.fitness_level || 'intermedio'}
Equipamiento disponible: ${userContext.available_equipment?.join(', ') || 'bodyweight'}
Objetivos: ${userContext.goals?.join(', ') || 'general fitness'}
` : '';

    return `${basePrompt}

${contextInfo}

REGLAS IMPORTANTES:
1. Responde en español (España)
2. Sé conciso pero completo
3. Si te piden generar un plan de entreno, devuelve un JSON estructurado
4. Si es conversación normal, responde en texto natural
5. Siempre mantén tu personalidad de coach
`;
};

// Función principal: Chat con IA
const chat = async (userMessage, conversationHistory = [], personality = 'motivador', userContext = {}) => {
    try {
        const systemPrompt = getSystemPrompt(personality, userContext);

        // Construir mensajes
        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory, // Historial previo
            { role: 'user', content: userMessage }
        ];

        const completion = await groq.chat.completions.create({
            model: MODEL,
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000,
            top_p: 1
        });

        const response = completion.choices[0]?.message?.content || 'No pude generar respuesta';

        return {
            success: true,
            response,
            usage: completion.usage
        };
    } catch (error) {
        console.error('Groq API error:', error);
        return {
            success: false,
            error: error.message,
            response: 'Lo siento, tuve un problema al procesar tu mensaje. ¿Puedes intentarlo de nuevo?'
        };
    }
};

// Función específica: Generar workout con IA
const generateWorkout = async (userPrompt, userContext = {}) => {
    try {
        const systemPrompt = `Eres Grove, un experto en crear planes de entrenamiento personalizados.

INFORMACIÓN DEL USUARIO:
- Nivel: ${userContext.fitness_level || 'intermedio'}
- Equipamiento: ${userContext.available_equipment?.join(', ') || 'bodyweight'}
- Tiempo disponible: ${userContext.time_per_session || '30-45'} minutos
- Días por semana: ${userContext.days_per_week || '4'}
- Objetivos: ${userContext.goals?.join(', ') || 'fitness general'}
- Ubicación: ${userContext.workout_location || 'casa'}

IMPORTANTE: Debes responder SOLO con un JSON válido, sin texto adicional, sin markdown, sin explicaciones.

El JSON debe tener esta estructura EXACTA:
{
  "name": "Nombre del workout",
  "description": "Descripción breve",
  "workout_type": "push|pull|legs|full_body|cardio|custom",
  "difficulty": "beginner|intermediate|advanced",
  "estimated_duration_minutes": número,
  "exercises": [
    {
      "name": "Nombre del ejercicio",
      "type": "reps|time|cardio",
      "category": "chest|back|legs|shoulders|arms|core|cardio",
      "muscle_groups": ["pectoral", "triceps"],
      "equipment": ["bodyweight", "dumbbells"],
      "sets": 3,
      "reps": 12,
      "rest_seconds": 60,
      "notes": "Instrucciones específicas"
    }
  ],
  "ai_notes": "Notas adicionales del coach"
}

REGLAS:
1. Solo ejercicios con el equipamiento disponible
2. Adaptado al nivel del usuario
3. Duración respetando el tiempo disponible
4. Nombre del ejercicio en español
5. SOLO JSON, sin nada más`;

        const completion = await groq.chat.completions.create({
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 3000
        });

        const response = completion.choices[0]?.message?.content || '';

        // Intentar parsear JSON
        try {
            // Limpiar respuesta (por si viene con markdown)
            let cleanedResponse = response.trim();
            cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');

            const workoutData = JSON.parse(cleanedResponse);

            return {
                success: true,
                workout: workoutData,
                raw_response: response
            };
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            return {
                success: false,
                error: 'No pude generar un workout válido. Respuesta de IA no es JSON.',
                raw_response: response
            };
        }
    } catch (error) {
        console.error('Generate workout error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Función: Analizar progreso del usuario
const analyzeProgress = async (userStats, personality = 'motivador') => {
    try {
        const systemPrompt = getSystemPrompt(personality);

        const statsPrompt = `Analiza el progreso de este usuario y da feedback:

ESTADÍSTICAS:
- Total workouts: ${userStats.totalWorkouts || 0}
- Esta semana: ${userStats.thisWeekWorkouts || 0}
- Racha actual: ${userStats.currentStreak || 0} días
- Volumen total levantado: ${userStats.totalVolume || 0} kg
- Mejor ejercicio: ${userStats.bestExercise || 'N/A'}
- Progreso vs mes pasado: ${userStats.progressVsLastMonth || 'N/A'}

Da un feedback motivador de máximo 3 frases, resaltando lo positivo y sugiriendo mejoras.`;

        const completion = await groq.chat.completions.create({
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: statsPrompt }
            ],
            temperature: 0.8,
            max_tokens: 500
        });

        return {
            success: true,
            feedback: completion.choices[0]?.message?.content || ''
        };
    } catch (error) {
        console.error('Analyze progress error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Función: Responder preguntas sobre fitness
const answerFitnessQuestion = async (question, personality = 'motivador') => {
    try {
        const systemPrompt = `${getSystemPrompt(personality)}

Eres un experto en fitness, nutrición y entrenamiento. Responde preguntas con información precisa, científica pero accesible.
Mantén tu personalidad de coach ${personality}.`;

        const completion = await groq.chat.completions.create({
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: question }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        return {
            success: true,
            answer: completion.choices[0]?.message?.content || ''
        };
    } catch (error) {
        console.error('Answer question error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    chat,
    generateWorkout,
    analyzeProgress,
    answerFitnessQuestion
};