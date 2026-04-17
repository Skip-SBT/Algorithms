import * as React from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Wall } from './Wall';
import { Cell } from './Cell';
import { Finish } from './Finish';
import { Start } from './Start';
import { Player } from './Player';
import { PlayerController } from 'movement/userInput/PlayerController';
import './Maze.css';
import { DijkstraMovementController } from '../movement/programmatically/Dijkstra/DijkstraMovementController';
import '../types';
import mazeList from './maps/mazeList.json';

type Position = {
    row: number;
    col: number;
};

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
    const animationTimeouts = useRef<number[]>([]);

    const clearAnimationTimeouts = () => {
        animationTimeouts.current.forEach(timeout => window.clearTimeout(timeout));
        animationTimeouts.current = [];
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
    }, [initialPosition, playerController]);

    useEffect(() => {
        if (!start) {
            return;
        }

        let handleKeyDown: ((event: KeyboardEvent) => void) | undefined;

        if (isUserInputMode) {
            handleKeyDown = (event: KeyboardEvent) => {
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
        } else {
            clearAnimationTimeouts();
            const performanceStart = window.performance.now();
            const path = dijkstraController.dijkstra();
            const performanceEnd = window.performance.now();
            setTimer((performanceEnd - performanceStart) / 1000);

            if (path) {
                setMoveCount(Math.max(0, path.length - 1));

                path.forEach(([row, col], index) => {
                    const timeout = window.setTimeout(() => {
                        setPlayerPosition({ row, col });

                        if (index === path.length - 1) {
                            setHasWon(true);
                        }
                    }, index * 50);

                    animationTimeouts.current.push(timeout);
                });
            }
        }

        return () => {
            if (handleKeyDown) {
                window.removeEventListener('keydown', handleKeyDown);
            }
            clearAnimationTimeouts();
        };
    }, [dijkstraController, isTimerRunning, isUserInputMode, playerController, start]);

    const resetGameHandler = () => {
        clearAnimationTimeouts();
        resetGame(setPlayerPosition, initialPosition, playerController, setHasWon, setMoveCount);
        setTimer(0);
        setIsTimerRunning(false);
        setStart(false);
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
            <div className='toolbar'>
                <div className='timer'>{timer.toFixed(2)} Seconds</div>
                <div className='moveCount'>{moveCount} Moves</div>
                <select className='mazeSelector' onChange={handleMazeChange} value={selectedMazeLabel}>
                    {mazeOptions.map(option => (
                        <option key={option.label} value={option.label}>{option.label}</option>
                    ))}
                </select>
                {!hasWon && (
                    <button className='resetButton-fixed' onClick={resetGameHandler}>Reset</button>
                )}
                <button className='modeButton' onClick={switchMode}>
                    {!isUserInputMode ? 'Dijkstra Mode' : 'User Input Mode'}
                </button>
                <button className='startButton' onClick={() => setStart(prevStart => !prevStart)}>
                    {start ? 'Stop' : 'Start'}
                </button>
            </div>
            <div className='mazeContainer'>
                {renderMaze(map, playerPosition)}
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

function renderMaze(map: string[][], playerPosition: Position): React.ReactElement {
    const maze = map.map((row, rowIndex) => (
        <div key={rowIndex} style={{ display: 'flex' }}>
            {row.map((cell, cellIndex) => {
                if (playerPosition.row === rowIndex && playerPosition.col === cellIndex) {
                    return <Player key={`${rowIndex}-${cellIndex}`} />;
                }

                switch (cell.toUpperCase()) {
                case 'W':
                    return <Wall key={`${rowIndex}-${cellIndex}`} />;
                case 'S':
                    return <Start key={`${rowIndex}-${cellIndex}`} />;
                case 'F':
                    return <Finish key={`${rowIndex}-${cellIndex}`} />;
                default:
                    return <Cell key={`${rowIndex}-${cellIndex}`} />;
                }
            })}
        </div>
    ));

    return <div className='maze'>{maze}</div>;
}

function resetGame(setPlayerPosition: (arg0: Position) => void, initialPosition: Position, playerController: PlayerController, setHasWon: (state: boolean) => void, setMoveCount: (state: number) => void): void {
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
