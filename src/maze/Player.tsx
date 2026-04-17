import * as React from 'react';
import './Maze.css';
type PlayerProps = {
    className?: string;
};

export function Player({ className = '' }: PlayerProps): React.ReactElement {
    return <div className={`player ${className}`.trim()}></div>;
}
