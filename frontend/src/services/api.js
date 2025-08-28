const BASE_URL = 'http://localhost:4000/api/workouts';

export async function getWorkouts() {
    const res = await fetch(BASE_URL);
    return res.json();
}

export async function createWorkout(workout) {
    const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workout),
    });
    return res.json();
}

export async function deleteWorkout(id) {
    await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
}