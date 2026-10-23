import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

type LeaderboardState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const [state, setState] = useState<LeaderboardState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then(({ leaderboard }) => {
        if (active) setState({ status: 'loaded', leaderboard });
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to load leaderboard.',
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
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {state.status === 'loading' && <p role="status">Loading leaderboard...</p>}
        {state.status === 'error' && <p role="alert">Unable to load leaderboard: {state.message}</p>}
        {state.status === 'loaded' && state.leaderboard.length === 0 && <p>No leaderboard rankings yet.</p>}
        {state.status === 'loaded' && state.leaderboard.length > 0 && (
          <ol className="list-group list-group-numbered">
            {state.leaderboard.map((entry) => (
              <li className="list-group-item d-flex justify-content-between" key={entry.teamName}>
                <span>{entry.teamName}</span>
                <span>{entry.totalPoints} points</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
