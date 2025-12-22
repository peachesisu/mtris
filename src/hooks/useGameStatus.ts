import { useState, useEffect } from 'react';

export const useGameStatus = (rowsCleared: number, scoreDelta: number) => {
    const [score, setScore] = useState(0);
    const [rows, setRows] = useState(0);
    const [level, setLevel] = useState(0);

    useEffect(() => {
        if (scoreDelta > 0) {
            // Add the sum of numbers
            setScore((prev) => prev + scoreDelta);
            setRows((prev) => prev + rowsCleared);
        }
    }, [scoreDelta, rowsCleared]);

    useEffect(() => {
        // simple level up for every 10 rows
        setLevel(Math.floor(rows / 10));
    }, [rows]);

    return [score, setScore, rows, setRows, level, setLevel] as const;
};
