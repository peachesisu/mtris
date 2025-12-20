import React from 'react';
import { TETROMINOS } from '../gameHelpers';

// Cell 컴포넌트가 받을 props 타입 정의
interface Props {
    // 테트로미노 타입 (I, T, O...) 또는 0(빈 칸)
    type: keyof typeof TETROMINOS | 0;

    // 셀 안에 표시할 숫자 (선택 사항)
    num?: number;

    // 셀 상태 (clear | merged) - merged일 때 효과 적용
    status?: string;
}

// 게임 보드의 한 칸을 표현하는 컴포넌트
const Cell: React.FC<Props> = ({ type, num, status }) => {

    // 현재 셀이 테트로미노인지 여부
    const isTetromino = type !== 0;

    // 테트로미노라면 해당 색상 사용, 아니면 검정
    const color = isTetromino
        ? TETROMINOS[type].color
        : '0, 0, 0';

    // 셀 스타일 동적 설정
    const CELL_SIZE = 40;

    const style: React.CSSProperties = {
        boxSizing: 'border-box',
        width: `${CELL_SIZE}px`,
        height: `${CELL_SIZE}px`,

        // 블록이면 색상 적용, 아니면 흐린 배경
        background: isTetromino
            ? `rgba(${color}, 0.8)`
            : 'rgba(0, 0, 0, 0.1)',

        // 테두리 기본
        border: isTetromino
            ? `2px solid rgba(${color}, 1)`
            : '2px solid rgba(40, 40, 40, 0.3)',

        // 입체감을 주기 위한 테두리 색상 조정
        borderBottomColor: isTetromino
            ? `rgba(${color}, 0.1)`
            : 'rgba(40, 40, 40, 0.3)',

        borderRightColor: isTetromino
            ? `rgba(${color}, 1)`
            : 'rgba(40, 40, 40, 0.3)',

        borderTopColor: isTetromino
            ? `rgba(${color}, 1)`
            : 'rgba(40, 40, 40, 0.3)',

        borderLeftColor: isTetromino
            ? `rgba(${color}, 0.3)`
            : 'rgba(40, 40, 40, 0.3)',

        // 블록일 때만 그림자 효과
        boxShadow: isTetromino
            ? `0 0 10px rgba(${color}, 0.5),
               inset 0 0 5px rgba(${color}, 0.5)`
            : 'none',

        // 중앙 정렬 (숫자 표시용)
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',

        fontSize: '22px',
        color: 'rgba(255, 255, 255, 0.8)',
        textShadow: '0 0 2px #000',
        fontWeight: 'bold',
    };

    return (
        <div className={`cell ${status === 'merged' ? 'merged' : ''}`} style={style}>
            {/* 블록이고 num이 있을 때만 숫자 표시 */}
            {isTetromino && num && num > 0 ? num : ''}
        </div>
    );
};

// props가 바뀌지 않으면 리렌더링 방지 (성능 최적화)
export default React.memo(Cell);
