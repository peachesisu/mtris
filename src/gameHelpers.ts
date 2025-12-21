export const STAGE_WIDTH = 12;
export const STAGE_HEIGHT = 20;

export type TetrominoKey = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';
export type CellValue = 0 | TetrominoKey;

export type CellStatus = 'clear' | 'merged';

export type TetrominoCell = {
    value: CellValue;
    num: number; // 0이면 빈칸, 블록이면 1~9
};

export type StageCell = {
    value: CellValue;
    status: CellStatus;
    num: number;
};

export type Stage = StageCell[][];

export type Player = {
    pos: { x: number; y: number };
    tetromino: TetrominoCell[][];
};

export const createStageCell = (): StageCell => ({
    value: 0,
    status: 'clear',
    num: 0,
});

export const createStage = (): Stage =>
    Array.from({ length: STAGE_HEIGHT }, () =>
        Array.from({ length: STAGE_WIDTH }, () => createStageCell())
    );

export const checkCollision = (
    player: Player,
    stage: Stage,
    move: { x: number; y: number }
): boolean => {
    const { x: moveX, y: moveY } = move;

    for (let y = 0; y < player.tetromino.length; y++) {
        for (let x = 0; x < player.tetromino[y].length; x++) {
            const cell = player.tetromino[y][x];

            // 실제 블록 셀만 검사
            if (cell.value === 0) continue;

            const nextY = y + player.pos.y + moveY;
            const nextX = x + player.pos.x + moveX;

            // 보드 밖이면 충돌
            if (!stage[nextY] || !stage[nextY][nextX]) return true;

            // 이미 고정(merged)된 블록이면 충돌
            if (stage[nextY][nextX].status === 'merged') return true;
        }
    }

    return false;
};

export const TETROMINOS: Record<TetrominoKey | 0, { shape: TetrominoCell[][]; color: string }> = {
    0: { shape: [[{ value: 0, num: 0 }]], color: '0, 0, 0' },
    I: {
        shape: [
            [{ value: 0, num: 0 }, { value: 'I', num: 0 }, { value: 0, num: 0 }, { value: 0, num: 0 }],
            [{ value: 0, num: 0 }, { value: 'I', num: 0 }, { value: 0, num: 0 }, { value: 0, num: 0 }],
            [{ value: 0, num: 0 }, { value: 'I', num: 0 }, { value: 0, num: 0 }, { value: 0, num: 0 }],
            [{ value: 0, num: 0 }, { value: 'I', num: 0 }, { value: 0, num: 0 }, { value: 0, num: 0 }],
        ],
        color: '80, 227, 230',
    },
    J: {
        shape: [
            [{ value: 0, num: 0 }, { value: 'J', num: 0 }, { value: 0, num: 0 }],
            [{ value: 0, num: 0 }, { value: 'J', num: 0 }, { value: 0, num: 0 }],
            [{ value: 'J', num: 0 }, { value: 'J', num: 0 }, { value: 0, num: 0 }],
        ],
        color: '36, 95, 223',
    },
    L: {
        shape: [
            [{ value: 0, num: 0 }, { value: 'L', num: 0 }, { value: 0, num: 0 }],
            [{ value: 0, num: 0 }, { value: 'L', num: 0 }, { value: 0, num: 0 }],
            [{ value: 0, num: 0 }, { value: 'L', num: 0 }, { value: 'L', num: 0 }],
        ],
        color: '223, 173, 36',
    },
    O: {
        shape: [
            [{ value: 'O', num: 0 }, { value: 'O', num: 0 }],
            [{ value: 'O', num: 0 }, { value: 'O', num: 0 }],
        ],
        color: '223, 217, 36',
    },
    S: {
        shape: [
            [{ value: 0, num: 0 }, { value: 'S', num: 0 }, { value: 'S', num: 0 }],
            [{ value: 'S', num: 0 }, { value: 'S', num: 0 }, { value: 0, num: 0 }],
            [{ value: 0, num: 0 }, { value: 0, num: 0 }, { value: 0, num: 0 }],
        ],
        color: '48, 211, 56',
    },
    T: {
        shape: [
            [{ value: 0, num: 0 }, { value: 0, num: 0 }, { value: 0, num: 0 }],
            [{ value: 'T', num: 0 }, { value: 'T', num: 0 }, { value: 'T', num: 0 }],
            [{ value: 0, num: 0 }, { value: 'T', num: 0 }, { value: 0, num: 0 }],
        ],
        color: '132, 61, 198',
    },
    Z: {
        shape: [
            [{ value: 'Z', num: 0 }, { value: 'Z', num: 0 }, { value: 0, num: 0 }],
            [{ value: 0, num: 0 }, { value: 'Z', num: 0 }, { value: 'Z', num: 0 }],
            [{ value: 0, num: 0 }, { value: 0, num: 0 }, { value: 0, num: 0 }],
        ],
        color: '227, 78, 78',
    },
};

const clone = <T,>(obj: T): T => structuredClone(obj);

export const randomTetromino = (): { shape: TetrominoCell[][]; color: string } => {
    const keys: TetrominoKey[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    const key = keys[Math.floor(Math.random() * keys.length)];

    const shape = clone(TETROMINOS[key].shape);

    // 블록에만 1~9 부여
    for (const row of shape) {
        for (let i = 0; i < row.length; i++) {
            // test : 랜덤
            if (row[i].value !== 0) row[i] = { ...row[i], num: Math.floor(Math.random() * 9) + 1 };
            // if (row[i].value !== 0) row[i] = { ...row[i], num: 1 };

        }
    }

    return { shape, color: TETROMINOS[key].color };
};
