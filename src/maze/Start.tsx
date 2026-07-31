import * as React from 'react';
import './Maze.css';
type StartProps = {
    className?: string;
};

export const Start = React.memo(function Start({ className = '' }: StartProps): React.ReactElement {
    return <div className={`start ${className}`.trim()} aria-label='Start'>S</div>;
});
