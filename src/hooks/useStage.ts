import { useState, useEffect } from 'react';
import { createStage } from '../gameHelpers';

export const useStage = (player: any, resetPlayer: () => void) => {
    const [stage, setStage] = useState(createStage());
    const [rowsCleared, setRowsCleared] = useState(0);
    const [scoreDelta, setScoreDelta] = useState(0);
    const [clearedRows, setClearedRows] = useState<number[]>([]);

    useEffect(() => {
        setRowsCleared(0);
        setScoreDelta(0);
        setClearedRows([]);

        const sweepRows = (newStage: any[]) => {
            let currentScoreDelta = 0;
            const rowsToClear: number[] = [];

            const sweptStage = newStage.reduce((ack, row, y) => {
                const isFull = row.findIndex((cell: any) => cell.value === 0) === -1;

                if (isFull) {
                const rowScore = row.reduce(
                    (sum: number, cell: any) => sum + (cell.num || 0),
                    0
                );

                if (rowScore >= 50) {
                    currentScoreDelta += rowScore;
                    rowsToClear.push(y);

                    // 빈 줄 추가
                    ack.unshift(
                    Array.from({ length: newStage[0].length }, () => ({
                        value: 0,
                        status: 'clear',
                        num: 0,
                    }))
                    );
                    return ack;
                }
                }

                ack.push(row);
                return ack;
            }, [] as any[]);

            // ✅ 여기서 "한 번만" set
            setRowsCleared(rowsToClear.length);
            setScoreDelta(currentScoreDelta);
            setClearedRows(rowsToClear);

            return sweptStage;
            };



        const updateStage = (prevStage: any[]) => {
            // First flush the stage from the previous render.
            const newStage = prevStage.map((row) =>
                row.map((cell: any) => (cell.status === 'clear' ? { value: 0, status: 'clear', num: 0 } : cell))
            );

            // Then draw the simplified tetromino
            player.tetromino.forEach((row: any[], y: number) => {
                row.forEach((cell: any, x: number) => {
                    if (cell.value !== 0) {
                        const targetY = y + player.pos.y;
                        const targetX = x + player.pos.x;
                        if (
                            newStage[targetY] &&
                            newStage[targetY][targetX]
                        ) {
                            newStage[targetY][targetX] = {
                                value: cell.value,
                                status: `${player.collided ? 'merged' : 'clear'}`,
                                num: cell.num
                            };
                        }
                    }
                });
            });

            // Then check if it collided
            if (player.collided) {
                resetPlayer();
                return sweepRows(newStage);
            }

            return newStage;
        };

        setStage((prev) => updateStage(prev));
    }, [player, resetPlayer]);

    return [stage, setStage, rowsCleared, scoreDelta, clearedRows] as const;
};
