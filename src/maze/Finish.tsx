import * as React from 'react';
import './Maze.css';
type FinishProps = {
    className?: string;
};

export const Finish = React.memo(function Finish({ className = '' }: FinishProps): React.ReactElement {
    return <div className={`finish ${className}`.trim()}></div>;
});
