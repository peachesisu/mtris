import React from 'react';

interface Props {
    redlineThreshold?: number;
    gameMode?: 'MP' | 'Normal';
}

const GameRules: React.FC<Props> = ({ redlineThreshold = 60, gameMode = 'MP' }) => {
    const boxStyle: React.CSSProperties = {
        padding: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        border: '1px solid #333',
        borderRadius: '10px',
        color: 'white',
        width: '300px',
        fontFamily: "'Orbitron', sans-serif",
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
    };

    const titleStyle: React.CSSProperties = {
        margin: '0 0 20px 0',
        color: '#dfd924', // Neon Yellow
        textAlign: 'center',
        fontSize: '30px',
        textShadow: '0 0 5px #dfd924',
    };

    const sectionStyle: React.CSSProperties = {
        marginBottom: '20px',
    };

    const subTitleStyle: React.CSSProperties = {
        color: '#50e3e6', // Neon Cyan
        fontSize: '20px',
        marginBottom: '10px',
        borderBottom: '1px solid #333',
        paddingBottom: '5px',
    };

    const keyRowStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
        fontSize: '18px',
    };

    const keyStyle: React.CSSProperties = {
        background: '#333',
        padding: '2px 8px',
        borderRadius: '4px',
        border: '1px solid #555',
        color: '#fff',
        fontWeight: 'bold',
        minWidth: '20px',
        textAlign: 'center',
        boxShadow: '0 2px 0 #000',
    };

    const ruleItemStyle: React.CSSProperties = {
        marginBottom: '8px',
        fontSize: '17px',
        lineHeight: '1.4',
        color: '#aaa',
    };

    return (
        <div style={boxStyle}>
            <h3 style={titleStyle}>HOW TO PLAY</h3>

            <div style={sectionStyle}>
                <h4 style={subTitleStyle}>CONTROLS</h4>
                <div style={keyRowStyle}>
                    <span>Move Left</span>
                    <span style={keyStyle}>←</span>
                </div>
                <div style={keyRowStyle}>
                    <span>Move Right</span>
                    <span style={keyStyle}>→</span>
                </div>
                <div style={keyRowStyle}>
                    <span>Rotate</span>
                    <span style={keyStyle}>↑</span>
                </div>
                <div style={keyRowStyle}>
                    <span>Soft Drop</span>
                    <span style={keyStyle}>↓</span>
                </div>
                <div style={keyRowStyle}>
                    <span>Hard Drop</span>
                    <span style={keyStyle}>SPACE</span>
                </div>
            </div>

            <div style={sectionStyle}>
                <h4 style={subTitleStyle}>RULES ({gameMode})</h4>
                {gameMode === 'MP' ? (
                    <>
                        <div style={ruleItemStyle}>
                            • Complete rows to score.
                        </div>
                        <div style={ruleItemStyle}>
                            • <span style={{ color: '#ff00ff' }}>SUM ≥ {redlineThreshold}</span> to clear a line!
                        </div>
                        <div style={ruleItemStyle}>
                            • <span style={{ color: '#ff0000' }}>RED</span> numbers mean the row is full but sum is too low.
                        </div>
                    </>
                ) : (
                    <>
                        <div style={ruleItemStyle}>
                            • Complete rows to score.
                        </div>
                        <div style={ruleItemStyle}>
                            • Play Free!
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default GameRules;
