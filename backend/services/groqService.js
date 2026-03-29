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
DADES DE L'USUARI:
- Nom: ${userContext.name}
- Nivell fitness: ${userContext.fitness_level || 'intermedi'}
- Equipament: ${userContext.available_equipment?.join(', ') || 'pes corporal'}
- Objectius: ${userContext.goals?.join(', ') || 'fitness general'}
- Ubicació: ${userContext.workout_location || 'casa'}
- Temps/sessió: ${userContext.time_per_session || 45} min
- Dies/setmana: ${userContext.days_per_week || 3}
${userContext.weight_kg ? `- Pes actual: ${userContext.weight_kg} kg` : ''}
${userContext.height_cm ? `- Alçada: ${userContext.height_cm} cm` : ''}
${userContext.age ? `- Edat: ${userContext.age} anys` : ''}

${userContext.weight_history?.length > 0 ? `HISTORIAL DE PES (últimes entrades):
${userContext.weight_history.slice(0, 5).map(w => `- ${w.weight} kg (${new Date(w.date).toLocaleDateString('ca-ES')})`).join('\n')}
` : ''}

${userContext.recent_sessions?.length > 0 ? `SESSIONS RECENTS:
${userContext.recent_sessions.map(s =>
        `- ${s.workout} (RPE: ${s.difficulty}/10, Energia: ${s.energy}/10, Ànim: ${s.mood})`
    ).join('\n')}
Dificultat mitjana: ${userContext.avg_difficulty}/10
` : ''}

${userContext.top_exercises?.length > 0 ? `EXERCICIS MÉS FETS:
${userContext.top_exercises.map(e => `- ${e.name} (${e.times} vegades)`).join('\n')}
` : ''}

${userContext.existing_workouts?.length > 0 ? `ENTRENAMENTS EXISTENTS:
${userContext.existing_workouts.map(w => `- "${w.name}" (ID: ${w.id})`).join('\n')}
` : ''}
` : '';

    const actionsPrompt = `
ACCIONS QUE POTS FER:
Pots crear entrenaments, actualitzar el planning setmanal, actualitzar dades personals i registrar el pes.

FLUX DE TREBALL OBLIGATORI EN 2 FASES:
FASE 1 - RECOPILAR INFORMACIÓ (MAI incloguis [ACTION] aquí):
  1. Fes preguntes per entendre exactament el que vol l'usuari
  2. Recull tota la informació necessària (nom, exercicis, sèries, temps, etc.)
  3. Presenta un RESUM COMPLET del que faràs
  4. Pregunta: "Vols que ho creï/actualitzi?"

FASE 2 - ACCIÓ (ÚNICAMENT quan l'usuari confirma explícitament):
  - Si l'usuari diu "sí", "d'acord", "endavant", "crea-ho", "confirmo" → inclou l'acció
  - Si ENCARA estàs recopilant informació → MAI incloguis [ACTION]
  - Si no tens TOTA la informació necessària → MAI incloguis [ACTION]

Quan l'usuari confirma, inclou al FINAL del missatge UN ÚNIC bloc d'acció:

[ACTION]{"type":"create_workout","data":{"name":"...","description":"...","workout_type":"push|pull|legs|full_body|cardio|custom","difficulty":"beginner|intermediate|advanced","estimated_duration_minutes":45,"exercises":[{"name":"...","type":"reps|time|cardio","category":"chest|back|legs|shoulders|arms|core|cardio","sets":3,"reps":10,"rest_seconds":60}]}}[/ACTION]

[ACTION]{"type":"update_schedule","data":{"monday":"ID_REAL_DE_ENTRENAMENT_O_null","tuesday":null,"wednesday":"ID_REAL","thursday":null,"friday":"ID_REAL","saturday":null,"sunday":null}}[/ACTION]

[ACTION]{"type":"update_profile","data":{"weight":75,"height":175,"age":28}}[/ACTION]

[ACTION]{"type":"log_weight","data":{"weight":75}}[/ACTION]

VALORS VÀLIDS (OBLIGATORI, SEMPRE en anglès, mai traduïts):
- workout_type: push, pull, legs, full_body, cardio, custom
- difficulty: beginner, intermediate, advanced (MAI "fàcil", "intermedi", "avançat", "mitjà")
- exercise.type: reps, time, cardio
- exercise.category: chest, back, legs, shoulders, arms, core, cardio

REGLES CRÍTIQUES:
- MAI incloguis [ACTION] sense confirmació explícita de l'usuari
- Per update_schedule: usa EXCLUSIVAMENT els IDs numèrics de la llista "ENTRENAMENTS EXISTENTS"
- Si l'usuari vol assignar un entrenament nou (que no existeix), primer crea'l, i en el PROPERE missatge fes update_schedule
- MAI inventes IDs o uses noms com a IDs (ex: "nou_entrenament_abs" NO és vàlid)
- Si no tens IDs reals dels entrenaments, NO facis update_schedule
`;

    return `${basePrompt}

${contextInfo}

${actionsPrompt}

REGLES GENERALS:
1. Respon SEMPRE en l'idioma en què l'usuari t'escriu (català per defecte)
2. Sigues concís però complet
3. Mantén sempre la teva personalitat de coach
4. Si el tema no és fitness, recondueix educadament
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