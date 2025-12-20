import React from "react";
import Cell from "./Cell";

const SIZE = 4;
const CELL_SIZE = 40;

// nextTetromino가 어떤 형태로 오든 2D 배열로 정규화
function normalizeToGrid(input: any): any[][] {
  // 1) 이미 2D 배열이면 그대로
  if (Array.isArray(input) && Array.isArray(input[0])) return input;

  // 2) { tetromino: [...] } 형태
  if (input && Array.isArray(input.tetromino) && Array.isArray(input.tetromino[0])) {
    return input.tetromino;
  }

  // 3) { shape: [...] } 형태
  if (input && Array.isArray(input.shape) && Array.isArray(input.shape[0])) {
    return input.shape;
  }

  // 못 찾으면 빈 배열
  return [];
}

function getValue(c: any) {
  if (c && typeof c === "object" && "value" in c) return c.value;
  return c; // 값 자체가 type일 수도 있음
}

function getNum(c: any) {
  if (c && typeof c === "object" && "num" in c) return c.num ?? 0;
  return 0;
}

const NextPiece: React.FC<{ tetromino: any }> = ({ tetromino }) => {
  const shape = normalizeToGrid(tetromino);

  // 4x4 빈 그리드 만들기 (Cell은 type이 0이면 빈칸)
  const grid = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => ({ value: 0 as any, num: 0, status: "clear" }))
  );

  const h = shape.length;
  const w = shape[0]?.length ?? 0;

  // 가운데 정렬 오프셋
  const offY = Math.floor((SIZE - h) / 2);
  const offX = Math.floor((SIZE - w) / 2);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const raw = shape[y][x];
      const v = getValue(raw);
      const n = getNum(raw);

      if (v !== 0) {
        const yy = y + offY;
        const xx = x + offX;
        if (yy >= 0 && yy < SIZE && xx >= 0 && xx < SIZE) {
          grid[yy][xx] = { value: v, num: n, status: "clear" };
        }
      }
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${SIZE}, ${CELL_SIZE}px)`,
        gridTemplateRows: `repeat(${SIZE}, ${CELL_SIZE}px)`,
        width: SIZE * CELL_SIZE,
        height: SIZE * CELL_SIZE,
      }}
    >
      {grid.map((row, y) =>
        row.map((c, x) => (
          <Cell
            key={`${y}-${x}`}
            type={c.value as any}
            num={c.num}
            status={c.status}
          />
        ))
      )}
    </div>
  );
};

export default NextPiece;
