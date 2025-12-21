import React from 'react';

interface Props {
    gameOver?: boolean;
    text: string;
}

const Display: React.FC<Props> = ({ gameOver, text }) => {
    const [pop, setPop] = React.useState(false);

    // text(점수 등)가 바뀔 때 애니메이션 트리거
    React.useEffect(() => {
        setPop(true);
        const timer = setTimeout(() => setPop(false), 300);
        return () => clearTimeout(timer);
    }, [text]);

    return (
        <div className={`display ${gameOver ? 'game-over' : ''} ${pop ? 'pop' : ''}`}>
            {text}
        </div>
    );
};

export default Display;
