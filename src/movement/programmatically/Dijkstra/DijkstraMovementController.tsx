export type DijkstraResult = {
    visitedOrder: [number, number][];
    path: [number, number][] | null;
    steps: DijkstraStep[];
};

export type DijkstraStep = {
    current: [number, number];
    distance: number;
    frontier: [number, number][];
    shortestFrontier: [number, number] | null;
    shortestFrontierDistance: number | null;
};

export class DijkstraMovementController {
    private maze: CellNode[][];

    constructor(maze: CellNode[][]) {
        this.maze = maze;
    }

    private toCellKey(row: number, col: number): string {
        return `${row}:${col}`;
    }

    private fromCellKey(key: string): [number, number] {
        const [row, col] = key.split(':').map(value => Number(value));
        return [row, col];
    }

    private getShortestFrontier(
        pq: [number, number, number][],
        distances: number[][]
    ): { cell: [number, number] | null; distance: number | null } {
        let shortestCell: [number, number] | null = null;
        let shortestDistance: number | null = null;

        pq.forEach(([row, col, distance]) => {
            if (distance !== distances[row][col]) {
                return;
            }

            if (shortestDistance === null || distance < shortestDistance) {
                shortestDistance = distance;
                shortestCell = [row, col];
            }
        });

        return { cell: shortestCell, distance: shortestDistance };
    }

    private getNeighbors(x: number, y: number): [number, number][] {
        const neighbors: [number, number][] = [];
        const directions: [number, number][] = [
            [0, 1], [1, 0], [0, -1], [-1, 0],
        ];

        directions.forEach(([dx, dy]) => {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && ny >= 0 && nx < this.maze.length && ny < this.maze[0].length && this.getCell(nx, ny) !== 'W') {
                neighbors.push([nx, ny]);
            }
        });

        return neighbors;
    }

    /**
     * @method dijkstra
     * @description This method implements Dijkstra's algorithm to find the shortest path in a maze from the start point to the finish point.
     * The maze is represented as a 2D array, where 's' represents the start point, 'f' represents the finish point, 'w' represents a wall, and '' represents an open cell.
      * The method returns the nodes visited in order plus the reconstructed shortest path, if one exists.
     */
    public dijkstra(): DijkstraResult {
        const rows = this.maze.length;
        const cols = this.maze[0].length;
        const distances: number[][] = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
        const previous: ([number, number] | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
        const pq: [number, number, number][] = [];
        const visitedOrder: [number, number][] = [];
        const steps: DijkstraStep[] = [];
        const frontierKeys = new Set<string>();
        const visitedKeys = new Set<string>();

        let startX = -1, startY = -1, finishX = -1, finishY = -1;
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (this.getCell(i, j) === 'S') {
                    startX = i;
                    startY = j;
                } else if (this.getCell(i, j) === 'F') {
                    finishX = i;
                    finishY = j;
                }
            }
        }

        if (startX === -1 || startY === -1 || finishX === -1 || finishY === -1) {
            return { visitedOrder, path: null, steps };
        }

        distances[startX][startY] = 0;
        pq.push([startX, startY, 0]);
        frontierKeys.add(this.toCellKey(startX, startY));

        while (pq.length > 0) {
            pq.sort((a, b) => a[2] - b[2]);
            const [x, y, dist] = pq.shift()!;

            if (dist !== distances[x][y]) {
                continue;
            }

            const currentKey = this.toCellKey(x, y);
            frontierKeys.delete(currentKey);
            visitedKeys.add(currentKey);
            visitedOrder.push([x, y]);

            this.getNeighbors(x, y).forEach(([nx, ny]) => {
                const newDist = dist + 1;
                if (newDist < distances[nx][ny]) {
                    distances[nx][ny] = newDist;
                    previous[nx][ny] = [x, y];
                    pq.push([nx, ny, newDist]);
                }

                const neighborKey = this.toCellKey(nx, ny);
                if (!visitedKeys.has(neighborKey) && distances[nx][ny] !== Infinity) {
                    frontierKeys.add(neighborKey);
                }
            });

            const shortestFrontier = this.getShortestFrontier(pq, distances);

            steps.push({
                current: [x, y],
                distance: dist,
                frontier: [...frontierKeys].map(key => this.fromCellKey(key)),
                shortestFrontier: shortestFrontier.cell,
                shortestFrontierDistance: shortestFrontier.distance,
            });

            if (x === finishX && y === finishY) {
                break;
            }
        }

        const path: [number, number][] = [];
        let current: [number, number] | null = [finishX, finishY];
        if (distances[finishX][finishY] === Infinity) {
            return { visitedOrder, path: null, steps };
        }

        while (current) {
            path.unshift(current);
            current = previous[current[0]][current[1]];
        }

        return { visitedOrder, path: path.length > 1 ? path : null, steps };
    }

    private getCell(row: number, col: number): string {
        return this.maze[row][col].toUpperCase();
    }
}
