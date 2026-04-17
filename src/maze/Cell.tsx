import * as React from 'react';
import './Maze.css';
type CellProps = {
    className?: string;
};

export function Cell({ className = '' }: CellProps): React.ReactElement {
    return <div className={`cell ${className}`.trim()}></div>;
}
