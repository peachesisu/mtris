import React, { useState, useRef } from 'react';

// 커스텀 훅들: 게임 상태/로직을 역할별로 분리해 둔 것
import { useStage } from '../hooks/useStage';         // 보드(stage) 업데이트, 줄 삭제, 점수 증가량 계산
import { usePlayer } from '../hooks/usePlayer';       // 현재 테트로미노(플레이어) 위치/회전/리셋/다음 블록
import { useInterval } from '../hooks/useInterval';   // setInterval을 React스럽게 쓰기 위한 훅 (dropTime마다 drop 호출)
import { useGameStatus } from '../hooks/useGameStatus'; // 점수/줄/레벨 계산 및 관리

// 테트리스 핵심 유틸 함수들
import { createStage, checkCollision } from '../gameHelpers';

// 화면 구성 컴포넌트들
import Board from './Board';
import Display from './Display';
import StartButton from './StartButton';
import NextPiece from './NextPiece';
import Ranking from './Ranking';

// 타이틀 이미지
import titleImg from '../assets/MP-TETRIS-Title.png';
import tetrisBgm from '../assets/tetrisbgm.mp3';
import GameRules from './GameRules';
import Chat from './Chat';
import { io, Socket } from 'socket.io-client';

const Game: React.FC = () => {
    // 게임 영역 포커스용 ref (키보드 입력을 바로 받기 위함)
    const gameAreaRef = React.useRef<HTMLDivElement>(null);
    const [socket, setSocket] = useState<Socket | null>(null);

    // Initial Nickname State
    const [nickname, setNickname] = useState<string>('');
    const [isNicknameSet, setIsNicknameSet] = useState(false);

    // Socket Connection
    React.useEffect(() => {
        // Connect to local backend (or configurable URL)
        const s = io();
        setSocket(s);
        return () => {
            if (s) {
                s.disconnect();
            }
        };
    }, []);

    /**
     * dropTime: 블록이 자동으로 떨어지는 속도(ms)
     * - number면 그 ms마다 drop() 실행
     * - null이면 자동 드롭 일시정지 (예: 아래키 누르고 있을 때 또는 게임오버)
     */
    const [dropTime, setDropTime] = useState<null | number>(null);

    /**
     * gameOver: 게임 종료 여부
     * - true면 더 이상 이동/드롭이 동작하지 않게 막고, 오버레이를 띄움
     */
    const [gameOver, setGameOver] = useState(false);

    /**
     * usePlayer()가 주는 값들(보통 이런 의미)
     * player: 현재 떨어지는 블록 정보(좌표, 모양, 충돌 여부 등)
     * updatePlayerPos: x/y 이동 및 collided 상태 업데이트
     * resetPlayer: 새 블록을 스폰(초기 위치로 리셋)
     * playerRotate: 회전 시도(벽/충돌 고려)
     * nextTetromino: 다음 블록 정보(Next UI용)
     */
    const [player, updatePlayerPos, resetPlayer, playerRotate, nextTetromino] = usePlayer();

    /**
     * useStage(player, resetPlayer)
     * - player 정보를 stage에 반영(움직이는 블록 표시)
     * - collided가 true가 되면 stage에 합쳐서 고정(merge)하고 다음 블록을 resetPlayer로 스폰
     * - rowsCleared: 이번 프레임에서 지운 줄 수
     * - scoreDelta: 이번 프레임에서 증가할 점수량(줄 수 기반)
     * - clearedRows: 이번에 지워진 줄의 인덱스 목록
     */
    const [stage, setStage, rowsCleared, scoreDelta, clearedRows] = useStage(player, resetPlayer);

    const playerRef = React.useRef(player);
    React.useEffect(() => {
        playerRef.current = player;
    }, [player]);

    const stageRef = React.useRef(stage);
    React.useEffect(() => {
        stageRef.current = stage;
    }, [stage]);

    const audioRef = useRef<HTMLAudioElement | null>(null);


    /**
     * useGameStatus(rowsCleared, scoreDelta)
     * - 점수/줄/레벨 누적 관리
     * - rowsCleared와 scoreDelta를 받아서 score, rows 등을 갱신
     */
    const [score, setScore, rows, setRows, level, setLevel] = useGameStatus(
        rowsCleared,
        scoreDelta
    );

    // Emit state update to server for Spectator Mode
    React.useEffect(() => {
        if (socket && isNicknameSet) {
            socket.emit('update_state', {
                nickname,
                stage,
                score
            });
        }
    }, [stage, score, nickname, isNicknameSet, socket]);

    /**
     * 좌/우 이동
     * dir = -1이면 왼쪽, +1이면 오른쪽
     * 충돌이 없을 때만 이동
     */
    const movePlayer = (dir: number) => {
        const p = playerRef.current;
        const s = stageRef.current;

        if (!checkCollision(p, s, { x: dir, y: 0 })) {
            updatePlayerPos({ x: dir, y: 0, collided: false });
        }
    };

    /**
     * 게임 시작(리셋)
     * - 보드 초기화
     * - 자동 드롭 속도 설정
     * - 플레이어(블록) 리셋
     * - 점수/줄/레벨 초기화
     */
    const startGame = () => {
        setStage(createStage());
        // 드롭속도
        setDropTime(600);   // 0.8초마다 자동으로 한 칸 drop (더 빠르게)
        resetPlayer();
        setGameOver(false);
        setScore(0);
        setRows(0);
        setLevel(0);

        // 게임 시작 시 포커스를 게임 영역으로 이동 (클릭 없이 바로 키보드 사용 가능)
        if (gameAreaRef.current) {
            gameAreaRef.current.focus();
        }

        // audio
        const audio = audioRef.current;
        if (!audio) return;

        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0.5;
        audio.play();
    };


    const overGame = () => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.pause();
        audio.currentTime = 0;
    }
    const CLEAR_THRESHOLD = 60; // "합이 60 이상이면 삭제" 기준과 동일하게 맞추기

    const boom = () => {
        setStage((prev) => {
            if (!prev || prev.length === 0) return prev;

            const height = prev.length;
            const width = prev[0].length;

            // 빈 줄 만들기 (중요: 매 칸 객체 새로 생성)
            type StageCell = (typeof stage)[number][number];

            const emptyRow: StageCell[] = Array.from({ length: width }, () => ({
                value: 0,
                status: 'clear',
                num: 0,
            })) as StageCell[];



            // 깊은 복사(셀 객체까지) - 안전
            const newStage = prev.map((row) => row.map((cell) => ({ ...cell })));

            // 아래에서부터 "빨간 줄" 찾기
            // 조건: (1) 꽉 찼음 (value != 0)
            //      (2) 전부 merged(고정된 블록만)  -> 떨어지는 블록 줄 삭제 방지
            //      (3) num 합 < 60 (빨간 줄)
            let targetIdx = -1;
            for (let y = height - 1; y >= 0; y--) {
                const row = newStage[y];

                const isFull = row.every((c) => c.value !== 0);
                const isMergedRow = row.every((c) => c.status === 'merged');
                if (!isFull || !isMergedRow) continue;

                const rowSum = row.reduce((sum, c) => sum + (c.num || 0), 0);
                if (rowSum < CLEAR_THRESHOLD) {
                    targetIdx = y;
                    break;
                }
            }

            // 빨간 줄이 없으면 그대로
            if (targetIdx === -1) return prev;

            // 해당 줄 제거 + 맨 위에 빈 줄 추가
            newStage.splice(targetIdx, 1);
            newStage.unshift(emptyRow);

            return newStage;
        });
    };




    /**
     * 자동/수동 드롭(한 칸 아래로 내리기) 로직
     * - 일정 줄을 지우면 레벨 상승
     * - 레벨 상승 시 dropTime을 줄여서 속도 증가
     * - 아래로 못 내려가면 collided 처리(=고정/합치기 트리거)
     */


    const drop = () => {
        // 레벨 업 로직 동일
        if (rows > (level + 1) * 10) {
            setLevel((prev) => prev + 1);
            setDropTime(1000 / (level + 1) + 200);
        }

        const p = playerRef.current;
        const s = stageRef.current;

        if (!checkCollision(p, s, { x: 0, y: 1 })) {
            updatePlayerPos({ x: 0, y: 1, collided: false });
        } else {
            // 1. 우선 충돌 상태로 업데이트 (화면에 고정시키기 위함)
            updatePlayerPos({ x: 0, y: 0, collided: true });

            // 2. 그 후 게임오버 체크
            if (p.pos.y < 1) {
                setGameOver(true);
                setDropTime(null);
                overGame();
            }
        }
    };

    /**
     * 하드 드롭(스페이스바)
     * - 충돌 날 때까지 y를 계속 증가시키며 최대 낙하 위치 찾기
     * - 그 위치로 한 번에 이동시키고 collided:true로 즉시 고정
     */
    const hardDrop = () => {
        let tmpY = 0;

        // tmpY + 1로 계속 내려봤을 때 충돌이 아니면 더 내릴 수 있음
        while (!checkCollision(player, stage, { x: 0, y: tmpY + 1 })) {
            tmpY += 1;
        }

        // 최대로 내려갈 수 있는 y만큼 내리고 즉시 고정
        updatePlayerPos({ x: 0, y: tmpY, collided: true });
    };

    /**
     * 키를 뗐을 때 동작
     * 아래키(40)를 떼면 자동 드롭 속도를 원래대로 복귀
     */
    const keyUp = ({ keyCode }: { keyCode: number }) => {
        if (!gameOver) {
            if (keyCode === 40) {
                setDropTime(1000 / (level + 1) + 200);
            }
        }
    };

    /**
     * 아래키로 수동 드롭할 때
     * - 자동 interval을 잠깐 꺼두고(null)
     * - drop()을 1번 실행해서 즉시 한 칸 내려감
     */
    const dropPlayer = () => {
        setDropTime(null);
        drop();
    };

    /**
     * 키 입력 처리
     * - 좌: 37, 우: 39, 하: 40, 상: 38(회전), 스페이스: 32(하드드롭)
     */
    const move = ({ keyCode }: { keyCode: number }) => {
        if (!gameOver) {
            if (keyCode === 37) {
                movePlayer(-1);
            } else if (keyCode === 39) {
                movePlayer(1);
            } else if (keyCode === 40) {
                dropPlayer();
            } else if (keyCode === 38) {
                // 회전 시도 (stage를 넘겨서 벽/충돌 고려)
                playerRotate(stage, 1);
            } else if (keyCode === 32) {
                hardDrop();
            }
            else if (keyCode === 82) { // b/B
                boom();
            }
        }
    };

    /**
     * dropTime이 number일 때만 drop()이 주기적으로 실행됨
     * - 게임 시작하면 dropTime=1000이 되어 자동 낙하 시작
     * - 게임오버 혹은 수동낙하 중에는 dropTime=null로 멈춤
     */
    useInterval(() => {
        drop();
    }, dropTime);

    // Initial Nickname Screen
    if (!isNicknameSet) {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: '100vh', color: 'white', fontFamily: "'Orbitron', sans-serif"
            }}>
                <img src={titleImg} alt="Tetris Title" style={{ width: '600px', marginBottom: '40px' }} />

                <div style={{
                    background: 'rgba(0,0,0,0.8)', padding: '40px', borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                    display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center'
                }}>
                    <h2>ENTER NICKNAME</h2>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (nickname.trim()) setIsNicknameSet(true);
                    }}>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Nickname"
                            maxLength={10}
                            style={{
                                padding: '15px', fontSize: '20px', textAlign: 'center',
                                background: '#333', color: 'white', border: '1px solid #555', borderRadius: '5px',
                                fontFamily: "'Orbitron', sans-serif"
                            }}
                            autoFocus
                        />
                        <div style={{ height: '20px' }}></div>
                        <button type="submit" style={{
                            padding: '15px 40px', fontSize: '20px', cursor: 'pointer',
                            background: '#dfd924', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '5px',
                            fontFamily: "'Orbitron', sans-serif"
                        }}>
                            START
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    /**
     * 화면 렌더링(UI)
     * - 타이틀 이미지
     * - 왼쪽: 점수/줄/레벨 + 시작 버튼
     * - 가운데: Board(테트리스 보드)
     * - 게임오버면 오버레이 띄움
     * - 오른쪽: NextPiece(다음 블록 미리보기)
     */
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            {/* 오디오 */}
            <audio ref={audioRef} src={tetrisBgm} loop />

            <img src={titleImg} alt="Tetris Title" style={{ width: '700px' }} />
            <div style={{ height: '50px' }} />

            {/* 키보드 이벤트를 받기 위해 tabIndex와 onKeyDown/onKeyUp을 붙여둠 */}
            <div
                className="game-wrapper"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => move(e)}
                onKeyUp={keyUp}
                ref={gameAreaRef}
            >
                {/* 게임 룰 */}
                <aside className="game-rules-panel" >
                    <div style={{ height: '20px' }} />
                    <GameRules />
                    <div style={{ height: '20px' }} />
                    <Chat socket={socket} nickname={nickname} />
                </aside>

                <div className="game-container">
                    {/* 왼쪽 패널: 상태 표시 + 시작 버튼 */}
                    <aside className="game-status">
                        <div style={{
                            fontSize: '24px', color: '#dfd924', marginBottom: '20px', textAlign: 'center',
                            textShadow: '0 0 10px rgba(223, 217, 36, 0.5)'
                        }}>
                            {nickname}
                        </div>
                        <div>
                            <Display text={`Score : ${score}`} />
                            <Display text={`Rows : ${rows}`} />
                            {/* <Display text={`Level : ${level}`} /> */}
                        </div>
                        <div style={{ height: '50px' }} />
                        {!gameOver && <StartButton callback={startGame} />}
                    </aside>

                    {/* 가운데: 게임 보드 */}
                    <div className="board-container">
                        {/* Board에 clearedRows 전달 */}
                        <Board stage={stage} clearedRows={clearedRows} />

                        {/* 게임 오버 시 오버레이 */}
                        {gameOver && (
                            <div className="game-over-overlay">
                                <h1>GAME OVER</h1>
                                <h1>{score}</h1>
                                <div style={{ height: '30px' }} />

                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        // Use the session nickname for submission too
                                        if (nickname) {
                                            fetch('/api/ranks', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ nickname, score }),
                                            })
                                                .then(res => res.json())
                                                .then(() => {
                                                    alert('Score Submitted!');
                                                })
                                                .catch(err => console.error(err));
                                        }
                                    }}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}
                                >
                                    {/* Read-only nickname as it is already set */}
                                    <div style={{
                                        fontSize: '24px', color: '#dfd924', marginBottom: '10px'
                                    }}>
                                        {nickname}
                                    </div>
                                    <button
                                        type="submit"
                                        style={{
                                            padding: '10px 20px',
                                            fontSize: '18px',
                                            borderRadius: '5px',
                                            border: 'none',
                                            background: '#dfd924',
                                            color: 'black',
                                            cursor: 'pointer',
                                            fontFamily: "'Orbitron', sans-serif",
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        SUBMIT SCORE
                                    </button>
                                </form>

                                <div style={{ height: '30px' }} />
                                <StartButton callback={startGame} />
                            </div>
                        )}
                    </div>

                    {/* 오른쪽: 다음 블록 미리보기 */}
                    <aside className="game-next-panel">
                        <NextPiece tetromino={nextTetromino} />
                        <div style={{ height: '20px' }} />
                    </aside>
                </div>

                {/* 랭킹 */}
                <aside className="game-ranking-panel">
                    <div style={{ height: '20px' }} />
                    <Ranking />
                </aside>
            </div>
            <div
                style={{
                    position: 'fixed',
                    right: '16px',
                    bottom: '12px',
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '15px',
                    fontFamily: "'Orbitron', sans-serif",
                    zIndex: 9999,
                    userSelect: 'none',
                    pointerEvents: 'none',
                }}
            >
                © 2025 MP TETRIS. All rights reserved. /
                개발자 : 32기 김유경, 25기 김소희
            </div>

        </div>
    );
};

export default Game;
