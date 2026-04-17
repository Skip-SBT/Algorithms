import * as React from 'react';
import './Maze.css';
type StartProps = {
    className?: string;
};

export function Start({ className = '' }: StartProps): React.ReactElement {
    return <div className={`start ${className}`.trim()}>START</div>;
}
