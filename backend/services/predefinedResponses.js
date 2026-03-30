// Predefined responses for common fitness questions
// Used to avoid Groq API calls for predictable queries (~80% of repetitive questions)

const RESPONSES = [
    {
        keywords: ['proteïna', 'proteina', 'protein', 'proteines', 'proteinas'],
        topics: ['quanta', 'quant', 'cuánta', 'how much', 'necessito', 'necesito'],
        answer: `La recomanació general és consumir entre **1.6 i 2.2 g de proteïna per kg de pes corporal** al dia si fas entrenament de força.\n\nExemple: si peses 70 kg → 112–154 g/dia.\n\nFonts recomanades: pit de pollastre, ou, tonyina, llegums, iogurt grec.`,
        answer_es: `La recomendación general es consumir entre **1.6 y 2.2 g de proteína por kg de peso corporal** al día si entrenas fuerza.\n\nEjemplo: si pesas 70 kg → 112–154 g/día.\n\nFuentes: pechuga de pollo, huevo, atún, legumbres, yogur griego.`
    },
    {
        keywords: ['hidrat', 'carbohidrat', 'carbs', 'hidrats', 'carbohidrats', 'carbohidratos'],
        topics: ['quan', 'cuando', 'antes', 'abans', 'entrenar', 'entreno'],
        answer: `Menja carbohidrats **1–2 hores abans** d'entrenar per tenir energia. Opcions: arròs, civada, plàtan, pa integral.\n\nDesprés d'entrenar, els carbohidrats ajuden a recuperar el glucogen muscular.`,
        answer_es: `Come carbohidratos **1–2 horas antes** de entrenar para tener energía. Opciones: arroz, avena, plátano, pan integral.\n\nDespués del entrenamiento, los carbohidratos ayudan a recuperar el glucógeno muscular.`
    },
    {
        keywords: ['dormir', 'son', 'sueño', 'sleep', 'descanso', 'descans', 'recovery', 'recuperació', 'recuperacion'],
        topics: ['hores', 'horas', 'importancia', 'importància', 'necessari', 'necesario'],
        answer: `El **son és fonamental** per al rendiment i la recuperació muscular. El cos repara fibres musculars durant el son profund.\n\nRecomanació: **7–9 hores** per nit. La privació de son redueix força, resistència i augmenta el risc de lesions.`,
        answer_es: `El **sueño es fundamental** para el rendimiento y la recuperación muscular. El cuerpo repara fibras musculares durante el sueño profundo.\n\nRecomendación: **7–9 horas** por noche.`
    },
    {
        keywords: ['cardio', 'córrer', 'correr', 'running', 'aeròbic', 'aerobico'],
        topics: ['perdre greix', 'perder grasa', 'adelgazar', 'aprimar', 'fat loss', 'cremar', 'quemar'],
        answer: `El cardio ajuda a crear un **dèficit calòric**, però la dieta és la clau principal per perdre greix. Per màxima eficiència, combina:\n\n- **Cardio HIIT** (15–20 min, 3x/setmana)\n- **Entrenament de força** per preservar múscul\n- **Dèficit calòric moderat** (~300–500 kcal/dia)`,
        answer_es: `El cardio ayuda a crear un **déficit calórico**, pero la dieta es la clave principal para perder grasa. Para máxima eficiencia combina HIIT, entrenamiento de fuerza y déficit calórico moderado (~300–500 kcal/día).`
    },
    {
        keywords: ['escalfament', 'calentamiento', 'warm up', 'warmup', 'escalfar'],
        topics: ['com', 'cómo', 'how', 'necessari', 'necesario', 'important'],
        answer: `L'escalfament **redueix el risc de lesions** i millora el rendiment. Recomanació (5–10 min):\n\n1. Mobilitat articular (colzes, espatlles, malucs)\n2. Cardio lleuger (salt, trot)\n3. Activació muscular específica (estocades, sentadilles sense pes)\n\nMai saltar l'escalfament abans d'entrenar amb càrregues.`,
        answer_es: `El calentamiento **reduce el riesgo de lesiones** y mejora el rendimiento. Recomendación (5–10 min): movilidad articular, cardio ligero y activación muscular específica.`
    },
    {
        keywords: ['sdom', 'agulletes', 'agujetas', 'doms', 'dolor muscular', 'dolor múscul'],
        topics: ['que es', 'que és', 'per que', 'por que', 'why', 'com treure', 'como quitar'],
        answer: `Les agulletes (**DOMS**) apareixen 24–72h després d'un entrenament intens. Són microdesgarraments musculars normals, indicador d'adaptació.\n\nPer reduir-les:\n- Estiraments suaus\n- Moviment lleuger (caminar, cardio suau)\n- Proteïna adequada\n- Bany fred o contrastat\n\nNo calen per progressar — la intensitat és el que compta.`,
        answer_es: `Las agujetas (DOMS) aparecen 24–72h después de un entrenamiento intenso. Son microdesgarros musculares normales. Para reducirlas: estiramientos suaves, movimiento ligero, proteína adecuada.`
    },
    {
        keywords: ['hipertrofia', 'músculo', 'musculo', 'múscul', 'guanyar múscul', 'ganar músculo', 'muscle gain'],
        topics: ['reps', 'repeticions', 'repeticiones', 'series', 'sets', 'quantes', 'cuántas'],
        answer: `Per **hipertròfia** (guanyar múscul), el rang òptim és:\n\n- **Sèries:** 3–5 per exercici\n- **Reps:** 6–15 per sèrie\n- **Descans:** 60–120 seg\n- **Freqüència:** cada grup muscular 2x/setmana\n\nEl factor més important: **sobrecàrrega progressiva** (augmentar pes o reps cada setmana).`,
        answer_es: `Para **hipertrofia** (ganar músculo), el rango óptimo es: 3–5 series, 6–15 reps, descanso 60–120 seg, frecuencia 2x/semana por grupo muscular. Factor clave: **sobrecarga progresiva**.`
    },
    {
        keywords: ['aigua', 'agua', 'water', 'hidratació', 'hidratacion', 'hidratarse'],
        topics: ['quanta', 'cuánta', 'litres', 'litros', 'beure', 'beber', 'drink'],
        answer: `La recomanació general és **2–3 litres d'aigua** al dia, més si fas exercici intens.\n\nDurant l'entrenament: beu 150–250 ml cada 15–20 min. Si sues molt, considera begudes amb electròlits (sodi, potassi).`,
        answer_es: `La recomendación general es **2–3 litros de agua** al día, más si haces ejercicio intenso. Durante el entrenamiento: bebe 150–250 ml cada 15–20 min.`
    }
];

/**
 * Tries to match a question to a predefined response.
 * Returns null if no match found (should use AI).
 */
const findPredefinedAnswer = (question) => {
    const q = question.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    for (const entry of RESPONSES) {
        const hasKeyword = entry.keywords.some(k =>
            q.includes(k.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
        );
        const hasTopic = entry.topics.some(t =>
            q.includes(t.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
        );

        if (hasKeyword && hasTopic) {
            // Detect language: Spanish keywords
            const isSpanish = /cuánta|cuanta|cómo|como|cuando|cuándo|necesito|necesario|por que|dormir|sueño|agua|músculo|musculo/.test(q);
            return isSpanish ? (entry.answer_es || entry.answer) : entry.answer;
        }
    }

    return null;
};

module.exports = { findPredefinedAnswer };
