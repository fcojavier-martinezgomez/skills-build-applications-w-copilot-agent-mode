import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type WorkoutSuggestion = {
  title: string;
  focus: string;
  minutes: number;
  difficulty: string;
  reason: string;
};

type WorkoutState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; suggestions: WorkoutSuggestion[] };

export const suggestedUserEmail = 'mona@example.com';

export default function Workouts() {
  const [state, setState] = useState<WorkoutState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: WorkoutSuggestion[] }>(
      `/api/workouts/suggestions/${encodeURIComponent(suggestedUserEmail)}`,
    )
      .then(({ suggestions }) => {
        if (active) setState({ status: 'loaded', suggestions });
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to load workout suggestions.',
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        {state.status === 'loading' && <p role="status">Loading workout suggestions...</p>}
        {state.status === 'error' && <p role="alert">Unable to load workout suggestions: {state.message}</p>}
        {state.status === 'loaded' && state.suggestions.length === 0 && <p>No workout suggestions yet.</p>}
        {state.status === 'loaded' && state.suggestions.length > 0 && (
          <ul className="list-group">
            {state.suggestions.map((suggestion) => (
              <li className="list-group-item" key={suggestion.title}>
                <h3 className="h6">{suggestion.title}</h3>
                <p className="mb-1">
                  {suggestion.focus} · {suggestion.minutes} minutes · {suggestion.difficulty}
                </p>
                <p className="mb-0">{suggestion.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
