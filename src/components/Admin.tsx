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

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? 'Riswell'; 
// .env에 VITE_ADMIN_PASSWORD=xxxx 넣으면 그걸 사용
// 없으면 기본값 '1234' (원하면 바꾸세요)

const Admin: React.FC = () => {
  const [sessions, setSessions] = useState<{ [key: string]: PlayerParams }>({});

  // ✅ 비번 관련 state
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_ok') === '1';
  });
  const [pw, setPw] = useState('');

  // ✅ 잠금 해제 후에만 소켓 연결
  useEffect(() => {
    if (!unlocked) return;

    const socket = io();

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
  }, [unlocked]);

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



  // ✅ 잠금 화면 UI
  if (!unlocked) {
    return (
      <div style={containerStyle}>
        <h1>SPECTATOR MODE</h1>
        <div style={{ marginTop: '30px', maxWidth: 420 }}>
          <div style={{ marginBottom: '10px', fontSize: 18 }}>
            Admin Password
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (pw === ADMIN_PASSWORD) {
                sessionStorage.setItem('admin_ok', '1');
                setUnlocked(true);
              } else {
                alert('Wrong password');
                setPw('');
              }
            }}
          >
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: 18,
                background: '#111',
                color: 'white',
                border: '1px solid #444',
                borderRadius: 8,
                outline: 'none',
              }}
              autoFocus
            />
            <button
              type="submit"
              style={{
                marginTop: 12,
                width: '100%',
                padding: '14px',
                fontSize: 18,
                cursor: 'pointer',
                background: '#dfd924',
                color: 'black',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: 8,
                fontFamily: "'Orbitron', sans-serif",
              }}
            >
              UNLOCK
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ✅ (선택) 로그아웃 버튼
  const logout = () => {
    sessionStorage.removeItem('admin_ok');
    setUnlocked(false);
    setSessions({});
  };

  return (
    <>
      <div style={{ width: '100px' }} />
      <div style={containerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ margin: 0 }}>SPECTATOR MODE</h1>
          <button
            onClick={logout}
            style={{
              marginLeft: 'auto',
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #444',
              background: '#111',
              color: 'white',
              cursor: 'pointer',
              fontFamily: "'Orbitron', sans-serif",
            }}
          >
            LOCK
          </button>
        </div>

        <div style={{ fontSize: '20px', marginBottom: '30px' }}>
          Active Players: {Object.keys(sessions).length}
        </div>

        <div style={gridStyle}>
          {Object.entries(sessions).map(([id, player]) => (
            <div key={id} style={cardStyle}>
              <h1 style={{ color: '#dfd924' }}>{player.nickname || 'Anonymous'}</h1>
              <div style={{ marginBottom: '10px' }}>
                <Display text={`Score: ${player.score}`} />
              </div>
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
