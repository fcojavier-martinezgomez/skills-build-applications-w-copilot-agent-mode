import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { name: string; mascot?: string; members: string[] };

type TeamState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; teams: Team[] };

export default function Teams() {
  const [state, setState] = useState<TeamState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then(({ teams }) => {
        if (active) setState({ status: 'loaded', teams });
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to load teams.',
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
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {state.status === 'loading' && <p role="status">Loading teams...</p>}
        {state.status === 'error' && <p role="alert">Unable to load teams: {state.message}</p>}
        {state.status === 'loaded' && state.teams.length === 0 && <p>No teams yet.</p>}
        {state.status === 'loaded' && state.teams.length > 0 && (
          <ul className="list-group">
            {state.teams.map((team) => (
              <li className="list-group-item" key={team.name}>
                <h3 className="h6 mb-1">{team.name}</h3>
                {team.mascot && <span>Mascot: {team.mascot}. </span>}
                {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
                {team.members.length > 0 && <span>: {team.members.join(', ')}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
