import * as React from 'react';
import './Maze.css';
export const Wall = React.memo(function Wall(): React.ReactElement {
    return <div className='wall'></div>;
});
