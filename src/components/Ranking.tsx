import React, { useEffect, useState } from 'react';

interface Rank {
    nickname: string;
    score: number;
    mode: string;
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
        padding: '10px',
        color: '#dfd924', // Neon Yellow
        fontSize: '18px',
    };

    const tdStyle: React.CSSProperties = {
        padding: '10px 5px',
        borderBottom: '1px solid #222',
        fontSize: '20px',
        fontWeight: 'bold',
        textAlign: 'center',
    };

    const getModeStyle = (mode: string): React.CSSProperties => ({
        fontSize: '10px',
        padding: '2px 6px',
        borderRadius: '4px',
        marginLeft: '5px',
        verticalAlign: 'middle',
        background: mode === 'Normal' ? '#00ff00' : '#ff00ff',
        color: 'black',
        textTransform: 'uppercase'
    });

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
                                <td style={{ ...tdStyle, textAlign: 'left', paddingLeft: '15px' }}>
                                    {rank.nickname}
                                    <span style={getModeStyle(rank.mode)}>{rank.mode}</span>
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'right', color: '#50e3e6' }}>{rank.score.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Ranking;
