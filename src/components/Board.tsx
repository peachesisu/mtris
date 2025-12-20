import React from 'react';
import Cell from './Cell';

// Board 컴포넌트가 받을 props 타입
interface Props {
  stage: any[][];
}

const CELL_SIZE = 40; // Cell.tsx의 CELL_SIZE와 동일하게 맞추기

// 게임 전체 보드를 렌더링하는 컴포넌트
const Board: React.FC<Props> = ({ stage }) => {
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

  return (
    <div style={wrapperStyle}>
      {/* 왼쪽: 보드 */}
      <div className="game-board" style={boardStyle}>
        {stage.map((row, y) =>
          row.map((cell: any, x: number) => (
            <Cell
              key={`${y}-${x}`}
              type={cell.value}
              num={cell.num}
              status={cell.status}
            />
          ))
        )}
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

