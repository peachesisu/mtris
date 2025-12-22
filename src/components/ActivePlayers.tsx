import React from 'react';

interface PlayerParams {
    nickname: string;
    mode?: string;
    score: number;
}

interface Props {
    sessions: { [key: string]: PlayerParams };
    currentNickname: string;
}

const ActivePlayers: React.FC<Props> = ({ sessions, currentNickname }) => {
    const players = Object.values(sessions);

    const listStyle: React.CSSProperties = {
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxHeight: '190px',
        overflowY: 'auto',
        paddingRight: '5px',
    };

    const itemStyle = (isMe: boolean): React.CSSProperties => ({
        fontSize: '20px',
        color: isMe ? '#dfd924' : '#fff',
        background: isMe ? 'rgba(223, 217, 36, 0.1)' : 'rgba(255, 255, 255, 0.05)',
        padding: '6px 12px',
        borderRadius: '8px',
        border: `1px solid ${isMe ? '#dfd924' : 'rgba(255, 255, 255, 0.1)'}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    });

    const tagStyle = (mode?: string, type: 'mode' | 'score' = 'mode'): React.CSSProperties => ({
        fontSize: '14px',
        padding: '2px 8px',
        borderRadius: '4px',
        fontWeight: 'bold',
        color: type === 'mode' ? 'black' : '#fff',
        background: type === 'mode'
            ? (mode === 'Normal' ? '#00ff00' : '#ff00ff') // Normal: Green, MP: Pink
            : 'rgba(255, 255, 255, 0.1)', // Score background
        marginLeft: type === 'mode' ? '10px' : '5px',
        textTransform: 'uppercase',
        minWidth: type === 'score' ? '100px' : 'auto',
        textAlign: type === 'score' ? 'right' : 'center',
        border: type === 'score' ? '1px solid rgba(255,255,255,0.2)' : 'none',
    });

    return (
        <div style={{
            background: 'rgba(0,0,0,0.5)',
            padding: '15px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.1)',
            width: '410px',
            height: '260px',
            fontFamily: "'Orbitron', sans-serif"
        }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '22px', textAlign: 'center', color: '#dfd924' }}>
                Active Players
            </h3>

            <ul style={listStyle}>
                {players.map((p, i) => (
                    <li key={i} style={itemStyle(p.nickname === currentNickname)}>
                        <span style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '150px'
                        }}>
                            {p.nickname || 'Anonymous'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={tagStyle(p.mode, 'score')}>
                                {p.score?.toLocaleString() || 0}
                            </span>
                            <span style={tagStyle(p.mode, 'mode')}>
                                {p.mode || 'MP'}
                            </span>
                        </div>
                    </li>
                ))}
                {players.length === 0 && (
                    <li style={{ fontSize: '15px', opacity: 0.5, textAlign: 'center' }}>
                        No online players
                    </li>
                )}
            </ul>
        </div>
    );
};

export default ActivePlayers;
