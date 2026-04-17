import * as React from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Wall } from './Wall';
import { Cell } from './Cell';
import { Finish } from './Finish';
import { Start } from './Start';
import { Player } from './Player';
import { DijkstraInfoPanel } from './DijkstraInfoPanel';
import { PlayerController } from 'movement/userInput/PlayerController';
import './Maze.css';
import { DijkstraMovementController, DijkstraResult } from '../movement/programmatically/Dijkstra/DijkstraMovementController';
import '../types';
import mazeList from './maps/mazeList.json';

type Position = {
    row: number;
    col: number;
};

type DijkstraPhase = 'idle' | 'search' | 'path' | 'done';

const DEFAULT_DELAY_MS = 40;
const MAX_DELAY_MS = 180;
const positionToKey = ({ row, col }: Position): string => `${row}-${col}`;

type MazeOption = {
    label: string;
    value: CellNode[][];
};

export function MazeController(): React.ReactElement {
    const mazeOptions: MazeOption[] = [
        // @ts-ignore
        { label: 'LARGE', value: mazeList.maze1 },
        // @ts-ignore
        { label: '10x10', value: mazeList.maze2 },
        // @ts-ignore
        { label: '15x15', value: mazeList.maze3 },
        // @ts-ignore
        { label: '20x20', value: mazeList.maze4 },
        // @ts-ignore
        { label: '40x40', value: mazeList.maze5 },
    ];

    const [selectedMaze, setSelectedMaze] = useState(mazeOptions[0].value);
    const map: CellNode[][] = selectedMaze;
    const initialPosition: Position = useMemo(() => findStartPosition(map), [map]);
    const [playerPosition, setPlayerPosition] = useState<Position>(initialPosition);

    const [isUserInputMode, setIsUserInputMode] = useState<boolean>(true);
    const playerController = useMemo(() => new PlayerController(map, initialPosition), [map, initialPosition]);
    const dijkstraController = useMemo(() => new DijkstraMovementController(map), [map]);

    const [hasWon, setHasWon] = useState<boolean>(false);
    const [timer, setTimer] = useState<number>(0);
    const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
    const [moveCount, setMoveCount] = useState<number>(0);
    const [start, setStart] = useState<boolean>(false);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [animationDelayMs, setAnimationDelayMs] = useState<number>(DEFAULT_DELAY_MS);

    const [exploredCells, setExploredCells] = useState<Position[]>([]);
    const [frontierCells, setFrontierCells] = useState<Position[]>([]);
    const [pathCells, setPathCells] = useState<Position[]>([]);
    const [shortestFrontierCell, setShortestFrontierCell] = useState<Position | null>(null);

    const [currentDijkstraCell, setCurrentDijkstraCell] = useState<Position | null>(null);
    const [currentDijkstraDistance, setCurrentDijkstraDistance] = useState<number | null>(null);
    const [shortestFrontierDistance, setShortestFrontierDistance] = useState<number | null>(null);
    const [dijkstraStepIndex, setDijkstraStepIndex] = useState<number>(0);
    const [dijkstraTotalSteps, setDijkstraTotalSteps] = useState<number>(0);

    const [dijkstraResult, setDijkstraResult] = useState<DijkstraResult | null>(null);
    const [dijkstraPhase, setDijkstraPhase] = useState<DijkstraPhase>('idle');
    const [searchIndex, setSearchIndex] = useState<number>(0);
    const [pathIndex, setPathIndex] = useState<number>(0);

    const animationTimeouts = useRef<number[]>([]);
    const exploredCellKeys = useMemo(() => new Set(exploredCells.map(positionToKey)), [exploredCells]);
    const frontierCellKeys = useMemo(() => new Set(frontierCells.map(positionToKey)), [frontierCells]);
    const shortestFrontierKey = useMemo(() => (shortestFrontierCell ? positionToKey(shortestFrontierCell) : null), [shortestFrontierCell]);
    const pathCellKeys = useMemo(() => new Set(pathCells.map(positionToKey)), [pathCells]);

    const clearAnimationTimeouts = () => {
        animationTimeouts.current.forEach(timeout => window.clearTimeout(timeout));
        animationTimeouts.current = [];
    };

    const resetDijkstraPlaybackState = () => {
        setDijkstraResult(null);
        setDijkstraPhase('idle');
        setSearchIndex(0);
        setPathIndex(0);
        setIsPaused(false);
        setAnimationDelayMs(DEFAULT_DELAY_MS);
        setExploredCells([]);
        setFrontierCells([]);
        setPathCells([]);
        setShortestFrontierCell(null);
        setCurrentDijkstraCell(null);
        setCurrentDijkstraDistance(null);
        setShortestFrontierDistance(null);
        setDijkstraStepIndex(0);
        setDijkstraTotalSteps(0);
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isTimerRunning) {
            interval = setInterval(() => {
                setTimer(prevTimer => prevTimer + 0.1);
            }, 100);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isTimerRunning]);

    useEffect(() => {
        clearAnimationTimeouts();
        resetGame(setPlayerPosition, initialPosition, playerController, setHasWon, setMoveCount);
        setTimer(0);
        setIsTimerRunning(false);
        setStart(false);
        resetDijkstraPlaybackState();
    }, [initialPosition, playerController]);

    useEffect(() => {
        if (isUserInputMode) {
            return;
        }

        const shouldRunTimer = start && !isPaused && (dijkstraPhase === 'search' || dijkstraPhase === 'path');
        setIsTimerRunning(shouldRunTimer);
    }, [dijkstraPhase, isPaused, isUserInputMode, start]);

    useEffect(() => {
        if (!start || !isUserInputMode) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (!event.key.startsWith('Arrow')) {
                return;
            }

            event.preventDefault();

            if (!isTimerRunning) {
                setIsTimerRunning(true);
            }

            const previousPosition = playerController.getPosition();
            const newPosition = playerController.handleKeyDown(event);
            const hasMoved = previousPosition.row !== newPosition.row || previousPosition.col !== newPosition.col;

            setPlayerPosition(newPosition);

            if (hasMoved) {
                setMoveCount(prevCount => prevCount + 1);
            }

            if (playerController.hasWon()) {
                setHasWon(true);
                setIsTimerRunning(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isTimerRunning, isUserInputMode, playerController, start]);

    useEffect(() => {
        if (!start || isUserInputMode) {
            return;
        }

        clearAnimationTimeouts();
        setHasWon(false);
        setMoveCount(0);
        setTimer(0);
        setIsPaused(false);

        const nextResult = dijkstraController.dijkstra();
        setDijkstraResult(nextResult);
        setDijkstraTotalSteps(nextResult.steps.length);
        setDijkstraPhase('search');
        setSearchIndex(0);
        setPathIndex(0);
        setExploredCells([]);
        setFrontierCells([]);
        setPathCells([]);
        setShortestFrontierCell(null);
        setCurrentDijkstraCell(null);
        setCurrentDijkstraDistance(null);
        setShortestFrontierDistance(null);
        setDijkstraStepIndex(0);
    }, [dijkstraController, isUserInputMode, start]);

    useEffect(() => {
        if (!start || isUserInputMode || isPaused || !dijkstraResult) {
            return;
        }

        if (dijkstraPhase === 'search') {
            if (searchIndex >= dijkstraResult.steps.length) {
                if (!dijkstraResult.path) {
                    setDijkstraPhase('done');
                    setStart(false);
                    setIsTimerRunning(false);
                    setShortestFrontierCell(null);
                    setShortestFrontierDistance(null);
                } else {
                    setDijkstraPhase('path');
                    setPathIndex(0);
                    setFrontierCells([]);
                    setShortestFrontierCell(null);
                    setShortestFrontierDistance(null);
                }
                return;
            }

            const timeout = window.setTimeout(() => {
                const step = dijkstraResult.steps[searchIndex];
                const [row, col] = step.current;
                const currentPosition = { row, col };
                const nextShortestFrontier = step.shortestFrontier
                    ? { row: step.shortestFrontier[0], col: step.shortestFrontier[1] }
                    : null;

                setPlayerPosition(currentPosition);
                setCurrentDijkstraCell(currentPosition);
                setCurrentDijkstraDistance(step.distance);
                setShortestFrontierCell(nextShortestFrontier);
                setShortestFrontierDistance(step.shortestFrontierDistance);
                setDijkstraStepIndex(searchIndex + 1);
                setExploredCells(
                    dijkstraResult.visitedOrder
                        .slice(0, searchIndex + 1)
                        .map(([visitedRow, visitedCol]) => ({ row: visitedRow, col: visitedCol }))
                );
                setFrontierCells(step.frontier.map(([frontierRow, frontierCol]) => ({ row: frontierRow, col: frontierCol })));
                setSearchIndex(prevSearchIndex => prevSearchIndex + 1);
            }, animationDelayMs);

            animationTimeouts.current.push(timeout);
            return () => {
                window.clearTimeout(timeout);
            };
        }

        if (dijkstraPhase === 'path') {
            const path = dijkstraResult.path ?? [];

            if (pathIndex >= path.length) {
                setHasWon(path.length > 0);
                setDijkstraPhase('done');
                setStart(false);
                setCurrentDijkstraDistance(null);
                setShortestFrontierDistance(null);
                return;
            }

            const timeout = window.setTimeout(() => {
                const [row, col] = path[pathIndex];
                const position = { row, col };

                setPlayerPosition(position);
                setCurrentDijkstraCell(position);
                setPathCells(prevCells => (
                    prevCells.some(cell => cell.row === row && cell.col === col) ? prevCells : [...prevCells, position]
                ));
                setMoveCount(Math.max(0, pathIndex));
                setPathIndex(prevPathIndex => prevPathIndex + 1);
            }, animationDelayMs + 15);

            animationTimeouts.current.push(timeout);
            return () => {
                window.clearTimeout(timeout);
            };
        }
    }, [animationDelayMs, dijkstraPhase, dijkstraResult, isPaused, isUserInputMode, pathIndex, searchIndex, start]);

    const resetGameHandler = () => {
        clearAnimationTimeouts();
        resetGame(setPlayerPosition, initialPosition, playerController, setHasWon, setMoveCount);
        setTimer(0);
        setIsTimerRunning(false);
        setStart(false);
        resetDijkstraPlaybackState();
    };

    const toggleStart = () => {
        if (start) {
            clearAnimationTimeouts();
            setIsTimerRunning(false);
            setStart(false);
            setIsPaused(false);
            return;
        }

        if (!isUserInputMode) {
            resetDijkstraPlaybackState();
        }

        setStart(true);
    };

    const togglePause = () => {
        if (!start || isUserInputMode) {
            return;
        }

        setIsPaused(prevPaused => !prevPaused);
    };

    const slowDownDijkstra = () => {
        setAnimationDelayMs(prevDelay => Math.min(MAX_DELAY_MS, prevDelay + 20));
    };

    function switchMode(): void {
        setIsUserInputMode(prevMode => !prevMode);
        resetGameHandler();
    }

    function handleMazeChange(event: React.ChangeEvent<HTMLSelectElement>) {
        const nextMaze = mazeOptions.find(option => option.label === event.target.value)?.value;
        if (!nextMaze) {
            return;
        }

        setSelectedMaze(nextMaze);
        setStart(false);
    }

    const selectedMazeLabel = mazeOptions.find(option => option.value === selectedMaze)?.label ?? mazeOptions[0].label;

    return (
        <>
            <div className='toolbar toolbarCard'>
                <div className='toolbarGroup statsGroup'>
                    <div className='timer'>{timer.toFixed(2)} Seconds</div>
                    <div className='moveCount'>{moveCount} Moves</div>
                </div>

                <div className='toolbarGroup controlsGroup'>
                    <select className='mazeSelector' onChange={handleMazeChange} value={selectedMazeLabel}>
                        {mazeOptions.map(option => (
                            <option key={option.label} value={option.label}>{option.label}</option>
                        ))}
                    </select>
                    {!hasWon && (
                        <button className='resetButton-fixed' onClick={resetGameHandler}>Reset</button>
                    )}
                    <button className='modeButton' onClick={switchMode}>
                        {isUserInputMode ? 'Switch to Dijkstra' : 'Switch to User Input'}
                    </button>
                    <button className='startButton' onClick={toggleStart}>
                        {start ? 'Stop' : 'Start'}
                    </button>
                    {!isUserInputMode && (
                        <>
                            <button className='pauseButton' onClick={togglePause} disabled={!start}>
                                {isPaused ? 'Resume' : 'Pause'}
                            </button>
                            <button className='slowDownButton' onClick={slowDownDijkstra}>
                                Slow Down
                            </button>
                        </>
                    )}
                </div>

                <div className='toolbarGroup modeGroup'>
                    <div className='modeLabel'>Mode: {isUserInputMode ? 'User Input' : 'Dijkstra Visualizer'}</div>
                    {!isUserInputMode && <div className='speedLabel'>Delay: {animationDelayMs}ms</div>}
                </div>
            </div>
            <div className='algorithmLayout'>
                <div className='mazeContainer'>
                    {renderMaze(map, playerPosition, exploredCellKeys, frontierCellKeys, shortestFrontierKey, pathCellKeys)}
                </div>
                {!isUserInputMode && (
                    <DijkstraInfoPanel
                        isRunning={isTimerRunning && start}
                        isPaused={isPaused}
                        hasStarted={dijkstraStepIndex > 0}
                        hasWon={hasWon}
                        stepIndex={dijkstraStepIndex}
                        totalSteps={dijkstraTotalSteps}
                        exploredCount={exploredCells.length}
                        frontierCount={frontierCells.length}
                        pathLength={pathCells.length > 0 ? pathCells.length - 1 : 0}
                        currentCell={currentDijkstraCell}
                        currentDistance={currentDijkstraDistance}
                        shortestFrontierCell={shortestFrontierCell}
                        shortestFrontierDistance={shortestFrontierDistance}
                        playbackDelayMs={animationDelayMs}
                    />
                )}
            </div>
            {hasWon && (
                <div className='winMessage'>
                    <div>Congratulations! You have won!</div>
                    <br />
                    <div>
                        Time needed for completion: {timer.toFixed(2)} Seconds
                    </div>
                    <br />
                    <div>Number of moves: {moveCount}</div>
                    <br />
                    <button className='resetButton' onClick={resetGameHandler}>Reset</button>
                </div>
            )}
        </>
    );
}

function renderMaze(
    map: string[][],
    playerPosition: Position,
    exploredCellKeys: Set<string>,
    frontierCellKeys: Set<string>,
    shortestFrontierKey: string | null,
    pathCellKeys: Set<string>
): React.ReactElement {
    const maze = map.map((row, rowIndex) => (
        <div key={rowIndex} className='mazeRow'>
            {row.map((cell, cellIndex) => {
                const cellKey = `${rowIndex}-${cellIndex}`;

                if (playerPosition.row === rowIndex && playerPosition.col === cellIndex) {
                    return <Player key={`${rowIndex}-${cellIndex}`} />;
                }

                const cellStateClassName = pathCellKeys.has(cellKey)
                    ? 'path'
                    : shortestFrontierKey === cellKey
                        ? 'shortestFrontier'
                        : frontierCellKeys.has(cellKey)
                            ? 'frontier'
                            : exploredCellKeys.has(cellKey)
                                ? 'explored'
                                : '';

                switch (cell.toUpperCase()) {
                case 'W':
                    return <Wall key={`${rowIndex}-${cellIndex}`} />;
                case 'S':
                    return <Start key={`${rowIndex}-${cellIndex}`} className={cellStateClassName} />;
                case 'F':
                    return <Finish key={`${rowIndex}-${cellIndex}`} className={cellStateClassName} />;
                default:
                    return <Cell key={`${rowIndex}-${cellIndex}`} className={cellStateClassName} />;
                }
            })}
        </div>
    ));

    return <div className='maze'>{maze}</div>;
}

function resetGame(
    setPlayerPosition: (arg0: Position) => void,
    initialPosition: Position,
    playerController: PlayerController,
    setHasWon: (state: boolean) => void,
    setMoveCount: (state: number) => void
): void {
    setPlayerPosition(initialPosition);
    playerController.resetGame(initialPosition);
    setHasWon(false);
    setMoveCount(0);
}

function findStartPosition(map: string[][]): Position {
    for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[row].length; col++) {
            if (map[row][col].toUpperCase() === 'S') {
                return { row, col };
            }
        }
    }

    throw new Error('No start position found');
}
