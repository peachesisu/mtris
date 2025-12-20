import { useState, useCallback } from 'react';
import { TETROMINOS, randomTetromino, STAGE_WIDTH, checkCollision } from '../gameHelpers';



export const usePlayer = () => {
    const [player, setPlayer] = useState<{
        pos: { x: number; y: number };
        tetromino: any[][]; // using any for shape structure
        collided: boolean;
    }>({
        pos: { x: 0, y: 0 },
        tetromino: TETROMINOS[0].shape,
        collided: false,
    });

    // Add state for Next Piece
    const [nextTetromino, setNextTetromino] = useState(randomTetromino());

    const rotate = (matrix: any[], dir: number) => {
        // Make the rows to become cols (transpose)
        const rotatedTetro = matrix.map((_, index) =>
            matrix.map((col) => col[index])
        );
        // Reverse each row to get a rotated matrix
        if (dir > 0) return rotatedTetro.map((row) => row.reverse());
        return rotatedTetro.reverse();
    };

    const playerRotate = (stage: any[], dir: number) => {
        const clonedPlayer = JSON.parse(JSON.stringify(player));
        clonedPlayer.tetromino = rotate(clonedPlayer.tetromino, dir);

        const pos = clonedPlayer.pos.x;
        let offset = 1;
        while (checkCollision(clonedPlayer, stage, { x: 0, y: 0 })) {
            clonedPlayer.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > clonedPlayer.tetromino[0].length) {
                rotate(clonedPlayer.tetromino, -dir);
                clonedPlayer.pos.x = pos;
                return;
            }
        }
        setPlayer(clonedPlayer);
    };

    const updatePlayerPos = ({ x, y, collided }: { x: number; y: number; collided: boolean }) => {
        setPlayer((prev) => ({
            ...prev,
            pos: { x: prev.pos.x + x, y: prev.pos.y + y },
            collided,
        }));
    };

    const resetPlayer = useCallback(() => {
        setPlayer({
            pos: { x: STAGE_WIDTH / 2 - 2, y: 0 },
            tetromino: nextTetromino.shape,
            collided: false,
        });
        setNextTetromino(randomTetromino());
    }, [nextTetromino]);

    return [player, updatePlayerPos, resetPlayer, playerRotate, nextTetromino] as const;
};
