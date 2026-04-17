import * as React from 'react';
import './Maze.css';
type FinishProps = {
    className?: string;
};

export function Finish({ className = '' }: FinishProps): React.ReactElement {
    return <div className={`finish ${className}`.trim()}></div>;
}
