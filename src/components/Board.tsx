import React from 'react';
import Cell from './Cell';

// Board 컴포넌트가 받을 props 타입
interface Props {
    stage: any[][];
    clearedRows?: number[]; // indices of cleared rows
}

const CELL_SIZE = 40; // Cell.tsx의 CELL_SIZE와 동일하게 맞추기

// 게임 전체 보드를 렌더링하는 컴포넌트
const Board: React.FC<Props> = ({ stage, clearedRows = [] }) => {
    // 각 행의 8셀 숫자합 계산 (stage 폭이 8이면 그대로 8셀 합)
    const rowSums = React.useMemo(() => {
        return stage.map((row) =>
            row.reduce((sum: number, cell: any) => sum + (cell?.num || 0), 0)
        );
    }, [stage]);

    // 보드 스타일 정의 (CSS Grid 사용)
    const boardStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: `repeat(${stage[0].length}, 1fr)`,
        gridAutoColumns: '1fr',
        gap: '1px',
        gridGap: '1px',
        border: '2px solid #333',
        width: '100%',
        background: '#111',
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
        position: 'relative', // for absolute overlay
        overflow: 'hidden',
    };

    // 보드 + 합계 컬럼을 나란히 배치
    const wrapperStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
    };

    // 오른쪽 합계 컬럼 스타일
    const sumsColStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: '1px', // Board의 grid-gap과 맞춤
    };

    const sumCellStyle: React.CSSProperties = {
        height: `${CELL_SIZE}px`, // 보드의 한 행 높이와 맞추기
        width: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        color: 'rgba(255,255,255,0.85)',
        textShadow: '0 0 2px #000',
        border: '2px solid rgba(40,40,40,0.25)',
        boxSizing: 'border-box',
        background: 'rgba(0,0,0,0.25)',
    };

    const explosionStyle = (y: number): React.CSSProperties => ({
        position: 'absolute',
        // Note: We need to map row index y back to pixel position accurately.
        // Assuming gridGap 1px and CELL_SIZE 40px, but CSS grid is fluid if width 100%.
        // However, we set explicit cell size in Cell, but Board is using grid-template with 1fr.
        // Let's use percentage or row calculation if possible.
        // Safest is to calculate based on row index * height roughly
        // OR better: use a transparent grid overlay.
        // But simplest: `top: calc(y * (40px + 1px))` since we have strict pixel sizes in Cell?
        // Actually Board uses 1fr. If Cells are fixed 40px, then Board should be auto sized.
        // Let's assume standard height:
        top: `${y * (CELL_SIZE + 1)}px`, // approximate (+1 for gap)
        left: 0,
        width: '100%',
        height: `${CELL_SIZE}px`,
        background: 'white',
        zIndex: 100,
        pointerEvents: 'none',
        animation: 'firework 0.5s ease-out forwards',
        boxShadow: '0 0 20px 10px rgba(255, 165, 0, 0.8)',
    });

    return (
        <div style={wrapperStyle}>
            {/* 왼쪽: 보드 */}
            <div className="game-board" style={boardStyle}>

                {/* Render actual board */}
                {stage.map((row, y) => {
                    // 해당 행이 꽉 찼는지 확인
                    const isRowFull = row.every((c: any) => c.value !== 0);
                    // 해당 행의 점수 합계
                    const rowSum = rowSums[y];
                    // 꽉 찼는데 50점이 안 되면 경고 (빨간색 숫자)
                    // *주의: clearedRows 에는 이미 지와진 행 인덱스가 들어있으므로, 
                    // 여기 남은 행 중에서 '꽉 찼는데 안 지워진(점수 미달)' 경우를 식별
                    const isWarning = isRowFull && rowSum < 50;

                    return row.map((cell: any, x: number) => (
                        <Cell
                            key={`${y}-${x}`}
                            type={cell.value}
                            num={cell.num}
                            status={cell.status}
                            isWarning={isWarning}
                        />
                    ));
                })}

                {/* Render explosions for cleared rows */}
                {clearedRows.map((y) => (
                    <div key={`exp-${y}`} className="explosion-overlay" style={{
                        position: 'absolute',
                        top: `${y * (CELL_SIZE + 1)}px`,
                        left: 0,
                        width: '100%',
                        height: `${CELL_SIZE}px`,
                        zIndex: 200,
                    }}>
                        <div className="firework-line"></div>
                    </div>
                ))}

            </div>

            {/* 오른쪽: 행 합계 */}
            <div style={sumsColStyle}>
                {rowSums.map((s, y) => (
                    <div key={y} style={sumCellStyle}>
                        {s}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Board;
