import * as React from 'react';
import './Maze.css';
type PlayerProps = {
    className?: string;
};

export const Player = React.memo(function Player({ className = '' }: PlayerProps): React.ReactElement {
    return <div className={`player ${className}`.trim()}></div>;
});
