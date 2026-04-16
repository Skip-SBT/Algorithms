import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Wall } from './Wall';
import { Cell } from './Cell';
import { Finish } from './Finish';
import { Start } from './Start';
import { Player } from './Player';
import { PlayerController } from 'movement/userInput/PlayerController';
import './Maze.css';
import {DijkstraMovementController} from '../movement/programmatically/Dijkstra/DijkstraMovementController';
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
        // Add other mazes here
    ];

    const [selectedMaze, setSelectedMaze] = useState(mazeOptions[0].value);
    let map: CellNode[][] = useMemo(() => selectedMaze, [selectedMaze]);

    let initialPosition: Position = useMemo(() => (findStartPosition(map)), [map]);
    let [playerPosition, setPlayerPosition] = useState<Position>(initialPosition);

    let [isUserInputMode, setIsUserInputMode] = useState<boolean>(true);
    let playerController = useMemo(() => new PlayerController(map, initialPosition), [map, initialPosition]);
    let dijkstraController = useMemo(() => new DijkstraMovementController(map), [map]);

    let [hasWon, setHasWon] = useState<boolean>(false);

    // Timer state
    let [timer, setTimer] = useState<number>(0);
    let [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
    let [moveCount, setMoveCount] = useState<number>(0);

    let [start, setStart] = useState<boolean>(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isTimerRunning) {
            interval = setInterval(() => {
                setTimer(prevTimer => prevTimer + 0.1);
            }, 100);
        }

        return () => {
            if (interval) {clearInterval(interval);}
        };
    }, [isTimerRunning]);

    useEffect(() => {
        if (!start) {return;}
        let handleKeyDown: (event: KeyboardEvent) => void;
        if (isUserInputMode) {
            handleKeyDown = (event: KeyboardEvent) => {
                if (!isTimerRunning) {
                    setIsTimerRunning(true);
                }

                let newPosition = playerController.handleKeyDown(event);
                setPlayerPosition(newPosition);
                setMoveCount(prevCount => prevCount + 1);
                if (playerController.hasWon()) {
                    setHasWon(true);
                    setIsTimerRunning(false);
                }
            };
            window.addEventListener('keydown', handleKeyDown);
        } else {
            let performanceStart = window.performance.now();
            console.time('doSomething');
            const path = dijkstraController.dijkstra();
            console.timeEnd('doSomething');
            let performanceEnd = window.performance.now();
            console.log('Performance time: ', performanceEnd - performanceStart);
            setTimer(performanceEnd - performanceStart);

            if (path) {
                path.forEach(([row, col], index) => {
                    setMoveCount(prevCount => prevCount + 1);

                    setTimeout(() => {
                        setPlayerPosition({ row, col });
                        if (index === path.length - 1) {
                            setHasWon(true);
                        }
                    }, index * 50);
                });
            }
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [dijkstraController, isTimerRunning, isUserInputMode, playerController, start]);

    const resetGameHandler = () => {
        resetGame(setPlayerPosition, initialPosition, playerController, setHasWon, setMoveCount);
        setTimer(0);
        setIsTimerRunning(false);
        setMoveCount(0);
        setStart(false);
    };

    function switchMode(): void {
        setIsUserInputMode(!isUserInputMode);
        resetGameHandler();
    }

    function handleMazeChange(event: React.ChangeEvent<HTMLSelectElement>) {
        const selectedMaze = mazeOptions.find(option => option.label === event.target.value)?.value;
        if (!selectedMaze) {return;}
        setSelectedMaze(selectedMaze);
        resetGameHandler();
    }

    return (
        <>
            <div className='timer'>{timer.toFixed(1)} Seconds</div>
            <div className='moveCount'>{moveCount} Moves</div>
            <select className='mazeSelector' onChange={handleMazeChange}>
                {mazeOptions.map(option => (
                    <option key={option.label} value={option.label}>{option.label}</option>
                ))}
            </select>
            {!hasWon && (
                <button className='resetButton-fixed' onClick={resetGameHandler}>Reset</button>
            )}
            <button className='modeButton' onClick={() => switchMode()}>
                {!isUserInputMode ? 'Dijkstra Mode' : 'User Input Mode'}
            </button>
            <button className='startButton' onClick={() => setStart(!start)}>
                Start
            </button>
            <div className='mazeContainer'>
                {renderMaze(map, playerPosition)}
            </div>
            {hasWon && (
                <>
                    <div className='winMessage'>
                        <div>Congratulations! You have won!</div>
                        <br/>
                        <div>Time needed for
                            completion: {!isUserInputMode ? timer.toFixed(2) : timer.toFixed(1)} Seconds
                        </div>
                        <br/>
                        <div>Number of moves: {moveCount}</div>
                        <br/>
                        <button className='resetButton' onClick={resetGameHandler}>Reset</button>
                    </div>
                </>
            )}
        </>
    );
}

function renderMaze(map: string[][], playerPosition: Position): React.ReactElement {
    const maze = map.map((row, rowIndex) => {
        return (
            <div key={rowIndex} style={{display: 'flex'}}>
                {row.map((cell, cellIndex) => {
                    if (playerPosition.row === rowIndex && playerPosition.col === cellIndex) {
                        return <Player key={`${rowIndex}-${cellIndex}`} />;
                    }
                    switch (cell) {
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
        );
    });

    return <div>{maze}</div>;
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
            if (map[row][col] === 'S') {
                return { row, col };
            }
        }
    }
    throw new Error('No start position found');
}
