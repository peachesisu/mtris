import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import Board from './Board';
import Display from './Display';
import Ranking from './Ranking';

// Define the shape of data received from server
interface PlayerParams {
    nickname: string;
    stage: any[][];
    score: number;
}

const Admin: React.FC = () => {
    const [sessions, setSessions] = useState<{ [key: string]: PlayerParams }>({});

    useEffect(() => {
        // Connect to the backend
        // Note: Hardcoded localhost for now. In production, use window.location.hostname
        const socket = io(); // Connect to the same host in production

        socket.on('connect', () => {
            console.log('Connected to admin socket');
        });

        socket.on('session_update', (data) => {
            console.log('Session update:', data);
            setSessions(data);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const containerStyle: React.CSSProperties = {
        padding: '20px',
        color: 'white',
        minHeight: '100vh',
        background: 'black',
        fontFamily: "'Orbitron', sans-serif",
    };

    const gridStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '40px',
    };

    const cardStyle: React.CSSProperties = {
        border: '1px solid #333',
        padding: '10px',
        borderRadius: '10px',
        background: 'rgba(20, 20, 20, 0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    };

    return (
        <>
            <div style={{ width: '100px' }} />
            <div style={containerStyle}>
                <h1>SPECTATOR MODE</h1>
                <div style={{ fontSize: '20px', marginBottom: '30px' }}>Active Players: {Object.keys(sessions).length}</div>

                <div style={gridStyle}>
                    {Object.entries(sessions).map(([id, player]) => (
                        <div key={id} style={cardStyle}>
                            <h1 style={{ color: '#dfd924' }}>{player.nickname || 'Anonymous'}</h1>
                            <div style={{ marginBottom: '10px' }}>
                                <Display text={`Score: ${player.score}`} />
                            </div>
                            {/* Scale down the board to fit */}
                            <div style={{ transform: 'scale(1)', transformOrigin: 'top center', marginBottom: '-250px' }}>
                                {player.stage ? (
                                    <Board stage={player.stage} clearedRows={[]} />
                                ) : (
                                    <div>No Board Data</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* 랭킹 */}
            <aside className="game-ranking-panel">
                <div style={{ height: '20px' }} />
                <Ranking />
            </aside>
        </>
    );
};

export default Admin;
