import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

interface ChatMessage {
    nickname: string;
    text: string;
}

interface ChatProps {
    socket: Socket | null;
    nickname: string;
}

const Chat: React.FC<ChatProps> = ({ socket, nickname }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => {
            console.log('Chat socket connected:', socket.id);
            setIsConnected(true);
        };

        const handleDisconnect = () => {
            console.log('Chat socket disconnected');
            setIsConnected(false);
        };

        const handleMessage = (msg: ChatMessage) => {
            console.log('Received chat message:', msg);
            setMessages((prev) => [...prev, msg]);
        };

        setIsConnected(socket.connected);

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('chat_message', handleMessage);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('chat_message', handleMessage);
        };
    }, [socket]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!socket || !inputValue.trim()) return;

        console.log('Sending message:', { nickname, text: inputValue.trim() });
        socket.emit('chat_message', {
            nickname,
            text: inputValue.trim(),
        });

        setInputValue('');
    };

    const containerStyle: React.CSSProperties = {
        padding: '15px',
        background: 'rgba(0, 0, 0, 0.8)',
        border: '1px solid #333',
        borderRadius: '10px',
        color: 'white',
        width: '300px',
        height: '400px',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Orbitron', sans-serif",
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
    };

    const titleStyle: React.CSSProperties = {
        margin: '0 0 10px 0',
        color: '#50e3e6',
        fontSize: '22px',
        borderBottom: '1px solid #333',
        paddingBottom: '5px',
    };

    const messageListStyle: React.CSSProperties = {
        flex: 1,
        overflowY: 'auto',
        marginBottom: '10px',
        fontSize: '16px',
        paddingRight: '5px',
    };

    const inputAreaStyle: React.CSSProperties = {
        display: 'flex',
        gap: '5px',
    };

    const inputStyle: React.CSSProperties = {
        flex: 1,
        padding: '8px',
        background: '#111',
        color: 'white',
        border: '1px solid #444',
        borderRadius: '4px',
        fontSize: '20px',
        outline: 'none',
    };

    const buttonStyle: React.CSSProperties = {
        padding: '8px 12px',
        background: '#dfd924',
        color: 'black',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '15px',
    };

    return (
        <div style={containerStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', marginBottom: '10px', paddingBottom: '5px' }}>
                <h3 style={{ ...titleStyle, borderBottom: 'none', marginBottom: 0 }}>CHAT</h3>
                <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: isConnected ? '#4caf50' : '#f44336',
                    boxShadow: isConnected ? '0 0 5px #4caf50' : '0 0 5px #f44336'
                }} />
            </div>
            <div style={messageListStyle} ref={scrollRef}>
                {messages.map((m, i) => {
                    let color = '#50e3e6'; // Default Cyan
                    if (m.nickname === '관리자') {
                        color = '#4caf50'; // Admin Green
                    } else if (m.nickname === nickname) {
                        color = '#dfd924'; // My Nickname Yellow
                    }

                    return (
                        <div key={i} style={{ marginBottom: '5px', wordBreak: 'break-all' }}>
                            <span style={{ color, fontWeight: 'bold' }}>
                                {m.nickname}:
                            </span>{' '}
                            <span>{m.text}</span>
                        </div>
                    );
                })}
            </div>
            <form style={inputAreaStyle} onSubmit={handleSend}>
                <input
                    style={inputStyle}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type..."
                />
                <button type="submit" style={buttonStyle}>
                    SEND
                </button>
            </form>
        </div>
    );
};

export default Chat;
