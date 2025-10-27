const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Model a utilitzar (Groq en té diversos)
const MODEL = 'llama-3.3-70b-versatile'; // Més ràpid i gratuït
// const MODEL = 'mixtral-8x7b-32768'; // Alternativa

// System prompts segons personalitat del coach
const COACH_PERSONALITIES = {
    motivador: `Ets Grove, un entrenador personal motivador i energètic. 
El teu estil és:
- Molt entusiasta i positiu 🔥
- Uses emojis freqüentment
- Celebres cada assoliment, per petit que sigui
- Dones ànims constants
- Ets com un amic que sempre t'impulsa
- Uses frases com "ANEM!", "BRUTAL!", "A PER AIXÒ!"
- Sempre veus el costat positiu

IMPORTANT: MAI generis plans d'entrenament sense que l'usuari t'ho demani explícitament.
Només respon al que et pregunten.`,

    analitico: `Ets Grove, un entrenador personal analític i científic.
El teu estil és:
- Basat en dades i evidència
- Expliques el "per què" de les coses
- Referències a estudis i principis científics
- Detallat en les explicacions
- Uses termes tècnics però els expliques
- Menys emojis, més professional
- Dones mètriques i números concrets

IMPORTANT: MAI generis plans d'entrenament sense que l'usuari t'ho demani explícitament.
Només respon al que et pregunten.`,

    bestia: `Ets Grove, un entrenador personal intens estil "Mode Bèstia".
El teu estil és:
- Directe i sense embuts
- Retador però sempre amb respecte
- Uses llenguatge fort però motivador
- Celebres amb intensitat: "BESTIAL!", "ÈPIC!", "MÀQUINA!"
- No acceptes excuses, però entens limitacions reals
- Ets el coach que et treu de la teva zona de confort
- Uses molt el terme "BÈSTIA" 💪

IMPORTANT: MAI generis plans d'entrenament sense que l'usuari t'ho demani explícitament.
Només respon al que et pregunten.`,

    relajado: `Ets Grove, un entrenador personal relaxat i amigable.
El teu estil és:
- Tranquil i sense pressió
- Recolzes el progrés al teu propi ritme
- Enfocat en gaudir del procés
- Flexible i comprensiu
- Uses emojis relaxats 😊
- Evites crear ansietat o pressió
- Frases com "Sense pressa", "Al teu ritme", "Gaudeix del procés"

IMPORTANT: MAI generis plans d'entrenament sense que l'usuari t'ho demani explícitament.
Només respon al que et pregunten.`
};

// Helper: Obtenir system prompt segons personalitat
const getSystemPrompt = (personality = 'motivador', userContext = {}) => {
    const basePrompt = COACH_PERSONALITIES[personality] || COACH_PERSONALITIES.motivador;

    const contextInfo = userContext.name ? `
L'usuari es diu ${userContext.name}.
Nivell de fitness: ${userContext.fitness_level || 'intermedi'}
Equipament disponible: ${userContext.available_equipment?.join(', ') || 'pes corporal'}
Objectius: ${userContext.goals?.join(', ') || 'fitness general'}

${userContext.recent_sessions?.length > 0 ? `
HISTORIAL RECENT:
${userContext.recent_sessions.map(s =>
        `- ${s.workout} (Dificultat: ${s.difficulty}/10, Energia: ${s.energy}/10, Humor: ${s.mood})`
    ).join('\n')}

Dificultat mitjana dels últims entrenaments: ${userContext.avg_difficulty}/10
` : ''}

${userContext.top_exercises?.length > 0 ? `
Exercicis favorits (més fets):
${userContext.top_exercises.map(e => `- ${e.name} (${e.times} vegades)`).join('\n')}
` : ''}

IMPORTANT: Tingues en compte aquest històric per adaptar la dificultat i els exercicis.
` : '';

    return `${basePrompt}

${contextInfo}

REGLES IMPORTANTS:
1. Respon SEMPRE en l'idioma en què l'usuari t'escriu (català, castellà, anglès, etc.)
2. Sigues concís però complet
3. Si et demanen generar un pla d'entrenament, retorna un JSON estructurat
4. Si és conversa normal, respon en text natural
5. Mantén sempre la teva personalitat de coach
6. Si els prompts de l'usuari no tenen res a veure amb entrenament, recondueix educadament cap al fitness
`;
};

// Funció principal: Chat amb IA
const chat = async (userMessage, conversationHistory = [], personality = 'motivador', userContext = {}) => {
    try {
        const systemPrompt = getSystemPrompt(personality, userContext);

        // Construir missatges
        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory, // Historial previ
            { role: 'user', content: userMessage }
        ];

        const completion = await groq.chat.completions.create({
            model: MODEL,
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000,
            top_p: 1
        });

        const response = completion.choices[0]?.message?.content || 'No he pogut generar resposta';

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
            response: 'Ho sento, he tingut un problema processant el teu missatge. Pots tornar-ho a intentar?'
        };
    }
};

// Funció específica: Generar workout amb IA
const generateWorkout = async (userPrompt, userContext = {}) => {
    try {
        const systemPrompt = `Ets Grove, un expert en crear plans d'entrenament personalitzats.

INFORMACIÓ DE L'USUARI:
- Nivell: ${userContext.fitness_level || 'intermedi'}
- Equipament: ${userContext.available_equipment?.join(', ') || 'pes corporal'}
- Temps disponible: ${userContext.time_per_session || '30-45'} minuts
- Dies per setmana: ${userContext.days_per_week || '4'}
- Objectius: ${userContext.goals?.join(', ') || 'fitness general'}
- Ubicació: ${userContext.workout_location || 'casa'}

${userContext.recent_sessions?.length > 0 ? `
HISTORIAL RECENT:
${userContext.recent_sessions.map(s =>
            `- ${s.workout} (Dificultat: ${s.difficulty}/10)`
        ).join('\n')}
Dificultat mitjana: ${userContext.avg_difficulty}/10
` : ''}

IMPORTANT: Has de respondre NOMÉS amb un JSON vàlid, sense text addicional, sense markdown, sense explicacions.

El JSON ha de tenir aquesta estructura EXACTA:
{
  "name": "Nom del workout",
  "description": "Descripció breu",
  "workout_type": "push|pull|legs|full_body|cardio|custom",
  "difficulty": "beginner|intermediate|advanced",
  "estimated_duration_minutes": número,
  "exercises": [
    {
      "name": "Nom de l'exercici",
      "type": "reps|time|cardio",
      "category": "chest|back|legs|shoulders|arms|core|cardio",
      "muscle_groups": ["pectoral", "triceps"],
      "equipment": ["bodyweight", "dumbbells"],
      "sets": 3,
      "reps": 12,
      "rest_seconds": 60,
      "notes": "Instruccions específiques"
    }
  ],
  "ai_notes": "Notes addicionals del coach"
}

REGLES:
1. Només exercicis amb l'equipament disponible
2. Adaptat al nivell de l'usuari
3. Durada respectant el temps disponible
4. Tingues en compte la dificultat mitjana de sessions anteriors
5. Nom de l'exercici en l'idioma del prompt de l'usuari
6. NOMÉS JSON, sense res més`;

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

        // Intentar parsejar JSON
        try {
            // Netejar resposta (per si ve amb markdown)
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
                error: 'No he pogut generar un workout vàlid. Resposta de IA no és JSON.',
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

// Funció: Analitzar progrés de l'usuari
const analyzeProgress = async (userStats, personality = 'motivador') => {
    try {
        const systemPrompt = getSystemPrompt(personality);

        const statsPrompt = `Analitza el progrés d'aquest usuari i dona feedback:

ESTADÍSTIQUES:
- Total workouts: ${userStats.totalWorkouts || 0}
- Aquesta setmana: ${userStats.thisWeekWorkouts || 0}
- Ratxa actual: ${userStats.currentStreak || 0} dies
- Volum total aixecat: ${userStats.totalVolume || 0} kg
- Millor exercici: ${userStats.bestExercise || 'N/A'}
- Progrés vs mes passat: ${userStats.progressVsLastMonth || 'N/A'}

Dona un feedback motivador de màxim 3 frases, ressaltant el positiu i suggerint millores.`;

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

// Funció: Respondre preguntes sobre fitness
const answerFitnessQuestion = async (question, personality = 'motivador') => {
    try {
        const systemPrompt = `${getSystemPrompt(personality)}

Ets un expert en fitness, nutrició i entrenament. Respon preguntes amb informació precisa, científica però accessible.
Mantén la teva personalitat de coach ${personality}.
Respon SEMPRE en l'idioma en què et facin la pregunta.`;

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