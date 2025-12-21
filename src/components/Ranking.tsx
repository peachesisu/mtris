import React, { useEffect, useState } from 'react';

interface Rank {
    nickname: string;
    score: number;
}

const Ranking: React.FC = () => {
    const [ranks, setRanks] = useState<Rank[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRanks = async () => {
        try {
            const response = await fetch('/api/ranks');
            if (response.ok) {
                const data = await response.json();
                setRanks(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch ranks', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRanks();
        // Optional: Polling every 10 seconds due to "real-time" requirement?
        // Or just reload on game over. Let's poll for now or just fetch once.
        // User asked: "show top 20". Let's update intervally.
        const interval = setInterval(fetchRanks, 5000);
        return () => clearInterval(interval);
    }, []);

    const containerStyle: React.CSSProperties = {
        padding: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        border: '1px solid #333',
        borderRadius: '10px',
        color: 'white',
        width: '400px',
        height: '850px',
        overflowY: 'auto',
        fontFamily: "'Orbitron', sans-serif",
    };

    const tableStyle: React.CSSProperties = {
        width: '100%',
        borderCollapse: 'collapse',
    };

    const thStyle: React.CSSProperties = {
        textAlign: 'left',
        borderBottom: '1px solid #555',
        padding: '18px',
        color: '#dfd924', // Neon Yellow
        fontSize: '20px',
    };

    const tdStyle: React.CSSProperties = {
        padding: '5px',
        borderBottom: '1px solid #222',
        fontSize: '25px',
        fontWeight: 'bold',
        textAlign: 'center',
    };

    return (
        <div style={containerStyle}>
            <div style={{ height: '20px' }}></div>
            <h1 style={{ margin: '0 0 10px 0', color: '#50e3e6', textAlign: 'center' }}>RANKING</h1>
            <div style={{ height: '20px' }}></div>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Rank</th>
                            <th style={thStyle}>Name</th>
                            <th style={thStyle}>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ranks.map((rank, index) => (
                            <tr key={index}>
                                <td style={{ ...tdStyle, color: index < 3 ? '#ff00ff' : 'white' }}>{index + 1}</td>
                                <td style={tdStyle}>{rank.nickname}</td>
                                <td style={{ ...tdStyle, textAlign: 'right' }}>{rank.score}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Ranking;
