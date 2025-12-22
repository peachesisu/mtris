import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Board from './Board';
import Display from './Display';
import Ranking from './Ranking';

interface PlayerParams {
  nickname: string;
  stage: any[][];
  score: number;
}

const Admin: React.FC = () => {
  const [sessions, setSessions] = useState<{ [key: string]: PlayerParams }>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [unlocked, setUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_ok') === '1';
  });
  const [pw, setPw] = useState('');

  const socketRef = useRef<Socket | null>(null);

  const containerStyle: React.CSSProperties = useMemo(() => ({
    padding: '20px',
    color: 'white',
    minHeight: '100vh',
    background: 'black',
    fontFamily: "'Orbitron', sans-serif",
  }), []);

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '40px',
  };

  const cardStyleBase: React.CSSProperties = {
    border: '1px solid #333',
    padding: '10px',
    borderRadius: '10px',
    background: 'rgba(20, 20, 20, 0.9)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
  };

  // ✅ 소켓 연결 (한 번만)
  useEffect(() => {
    const socket = io('http://localhost:3000');
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Admin connected:', socket.id);

      // 이미 unlocked 상태면 자동 인증 시도(새로고침 대비)
      if (sessionStorage.getItem('admin_ok') === '1') {
        const saved = sessionStorage.getItem('admin_pw') || '';
        if (saved) socket.emit('admin_auth', { password: saved });
      }
    });

    socket.on('admin_auth_ok', () => {
      setUnlocked(true);
      sessionStorage.setItem('admin_ok', '1');
    });

    socket.on('admin_auth_fail', () => {
      alert('Wrong password');
      sessionStorage.removeItem('admin_ok');
      sessionStorage.removeItem('admin_pw');
      setUnlocked(false);
      setSessions({});
      setSelectedId(null);
    });

    socket.on('session_update', (data) => {
      setSessions(data || {});
      // 선택된 플레이어가 나갔으면 선택 해제
      if (selectedId && data && !data[selectedId]) setSelectedId(null);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ 관리자 R키로 BOOM
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!unlocked) return;
      if (!selectedId) return;

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        socketRef.current?.emit('admin_boom', { targetId: selectedId });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [unlocked, selectedId]);

  // ✅ 로그아웃
  const logout = () => {
    sessionStorage.removeItem('admin_ok');
    sessionStorage.removeItem('admin_pw');
    setUnlocked(false);
    setSessions({});
    setSelectedId(null);
  };

  // ✅ 잠금 화면
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
              const socket = socketRef.current;
              if (!socket) return;

              sessionStorage.setItem('admin_pw', pw); // 새로고침 대비
              socket.emit('admin_auth', { password: pw });
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

  return (
    <>
      <div style={{ width: '100px' }} />
      <div style={containerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ margin: 0 }}>SPECTATOR MODE</h1>
          <div style={{ marginLeft: 12, opacity: 0.8 }}>
            (카드 선택 후 R키 = BOOM)
          </div>
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
          {Object.entries(sessions).map(([id, player]) => {
            const selected = id === selectedId;
            const cardStyle: React.CSSProperties = {
              ...cardStyleBase,
              border: selected ? '2px solid #dfd924' : '1px solid #333',
              boxShadow: selected ? '0 0 16px rgba(223,217,36,0.25)' : undefined,
            };

            return (
              <div
                key={id}
                style={cardStyle}
                onClick={() => setSelectedId(id)}
                title={selected ? 'Selected' : 'Click to select'}
              >
                <h1 style={{ color: '#dfd924' }}>{player.nickname || 'Anonymous'}</h1>

                <div style={{ marginBottom: '10px' }}>
                  <Display text={`Score: ${player.score}`} />
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(id);
                    socketRef.current?.emit('admin_boom', { targetId: id });
                  }}
                  style={{
                    marginBottom: 12,
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#dfd924',
                    color: 'black',
                    cursor: 'pointer',
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 'bold'
                  }}
                >
                  BOOM (R)
                </button>

                <div style={{ transform: 'scale(1)', transformOrigin: 'top center', marginBottom: '-250px' }}>
                  {player.stage ? (
                    <Board stage={player.stage} clearedRows={[]} />
                  ) : (
                    <div>No Board Data</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <aside className="game-ranking-panel">
        <div style={{ height: '20px' }} />
        <Ranking />
      </aside>
    </>
  );
};

export default Admin;
