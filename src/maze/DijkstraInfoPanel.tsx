import * as React from 'react';

type DijkstraInfoPanelProps = {
    isRunning: boolean;
    isPaused: boolean;
    hasStarted: boolean;
    hasWon: boolean;
    stepIndex: number;
    totalSteps: number;
    exploredCount: number;
    frontierCount: number;
    pathLength: number;
    currentCell: { row: number; col: number } | null;
    currentDistance: number | null;
    shortestFrontierCell: { row: number; col: number } | null;
    shortestFrontierDistance: number | null;
    playbackDelayMs: number;
    calculationTimeMs: number | null;
};

export function DijkstraInfoPanel({
    isRunning,
    isPaused,
    hasStarted,
    hasWon,
    stepIndex,
    totalSteps,
    exploredCount,
    frontierCount,
    pathLength,
    currentCell,
    currentDistance,
    shortestFrontierCell,
    shortestFrontierDistance,
    playbackDelayMs,
    calculationTimeMs,
}: DijkstraInfoPanelProps): React.ReactElement {
    const statusText = isPaused
        ? 'Paused'
        : isRunning
            ? 'Running'
            : hasWon
                ? 'Completed'
                : hasStarted
                    ? 'Stopped'
                    : 'Ready';

    return (
        <aside className='dijkstraPanel'>
            <div className='dijkstraPanelHeader'>
                <h3>Dijkstra Visualizer</h3>
                <div className='dijkstraStatus'>Status: {statusText}</div>
            </div>

            <div className='dijkstraMetrics'>
                <div>Step: {stepIndex}/{totalSteps}</div>
                <div>Explored: {exploredCount}</div>
                <div>Frontier: {frontierCount}</div>
                <div>Path Length: {pathLength}</div>
                <div>Current: {currentCell ? `(${currentCell.row}, ${currentCell.col})` : '-'}</div>
                <div>Distance: {currentDistance ?? '-'}</div>
                <div>Shortest Frontier: {shortestFrontierCell ? `(${shortestFrontierCell.row}, ${shortestFrontierCell.col})` : '-'}</div>
                <div>Frontier Dist: {shortestFrontierDistance ?? '-'}</div>
                <div>Calc Time: {calculationTimeMs === null ? '-' : `${calculationTimeMs.toFixed(3)}ms`}</div>
                <div>Step Delay: {playbackDelayMs}ms</div>
            </div>

            <div className='dijkstraLegend'>
                <h4>Legend</h4>
                <div><span className='legendSwatch legendExplored'></span>Explored (shortest distance fixed)</div>
                <div><span className='legendSwatch legendFrontier'></span>Frontier (discovered, waiting in queue)</div>
                <div><span className='legendSwatch legendShortestFrontier'></span>Shortest frontier (next candidate)</div>
                <div><span className='legendSwatch legendPath'></span>Final shortest path</div>
                <div><span className='legendSwatch legendPlayer'></span>Current node being processed</div>
            </div>

            <div className='dijkstraHowItWorks'>
                <h4>How Dijkstra works</h4>
                <ol>
                    <li>Set start distance to 0 and all others to Infinity.</li>
                    <li>Pick the frontier node with the smallest distance.</li>
                    <li>Mark it explored; that distance is now final.</li>
                    <li>Relax neighbors: if a shorter route is found, update distance and predecessor.</li>
                    <li>Repeat until finish is explored, then backtrack predecessors for the shortest path.</li>
                </ol>
            </div>
        </aside>
    );
}

