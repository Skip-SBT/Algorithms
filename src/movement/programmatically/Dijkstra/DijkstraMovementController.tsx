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

type QueueNode = [number, number, number];

class MinPriorityQueue {
    private heap: QueueNode[] = [];

    public get size(): number {
        return this.heap.length;
    }

    public push(node: QueueNode): void {
        this.heap.push(node);
        this.bubbleUp(this.heap.length - 1);
    }

    public pop(): QueueNode | undefined {
        if (this.heap.length === 0) {
            return undefined;
        }

        const top = this.heap[0];
        const last = this.heap.pop()!;

        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.bubbleDown(0);
        }

        return top;
    }

    public peek(): QueueNode | undefined {
        return this.heap[0];
    }

    private bubbleUp(index: number): void {
        let current = index;

        while (current > 0) {
            const parent = Math.floor((current - 1) / 2);
            if (this.heap[parent][2] <= this.heap[current][2]) {
                break;
            }

            [this.heap[parent], this.heap[current]] = [this.heap[current], this.heap[parent]];
            current = parent;
        }
    }

    private bubbleDown(index: number): void {
        let current = index;

        while (true) {
            const left = (current * 2) + 1;
            const right = left + 1;
            let smallest = current;

            if (left < this.heap.length && this.heap[left][2] < this.heap[smallest][2]) {
                smallest = left;
            }

            if (right < this.heap.length && this.heap[right][2] < this.heap[smallest][2]) {
                smallest = right;
            }

            if (smallest === current) {
                break;
            }

            [this.heap[current], this.heap[smallest]] = [this.heap[smallest], this.heap[current]];
            current = smallest;
        }
    }
}

export class DijkstraMovementController {
    private maze: CellNode[][];

    constructor(maze: CellNode[][]) {
        this.maze = maze;
    }

    private toCellId(row: number, col: number, cols: number): number {
        return (row * cols) + col;
    }

    private fromCellId(id: number, cols: number): [number, number] {
        return [Math.floor(id / cols), id % cols];
    }

    private discardStaleTop(queue: MinPriorityQueue, distances: number[][]): void {
        while (queue.size > 0) {
            const top = queue.peek();

            if (!top) {
                return;
            }

            const [row, col, dist] = top;
            if (dist === distances[row][col]) {
                return;
            }

            queue.pop();
        }
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
        const pq = new MinPriorityQueue();
        const visitedOrder: [number, number][] = [];
        const steps: DijkstraStep[] = [];
        const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
        const inFrontier: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
        const frontierIds = new Set<number>();

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
        const startId = this.toCellId(startX, startY, cols);
        inFrontier[startX][startY] = true;
        frontierIds.add(startId);

        while (pq.size > 0) {
            const currentNode = pq.pop();
            if (!currentNode) {
                break;
            }

            const [x, y, dist] = currentNode;

            if (dist !== distances[x][y]) {
                continue;
            }

            const currentId = this.toCellId(x, y, cols);
            inFrontier[x][y] = false;
            frontierIds.delete(currentId);
            visited[x][y] = true;
            visitedOrder.push([x, y]);

            this.getNeighbors(x, y).forEach(([nx, ny]) => {
                if (visited[nx][ny]) {
                    return;
                }

                const newDist = dist + 1;
                if (newDist < distances[nx][ny]) {
                    distances[nx][ny] = newDist;
                    previous[nx][ny] = [x, y];
                    pq.push([nx, ny, newDist]);
                }

                if (distances[nx][ny] !== Infinity && !inFrontier[nx][ny]) {
                    const neighborId = this.toCellId(nx, ny, cols);
                    inFrontier[nx][ny] = true;
                    frontierIds.add(neighborId);
                }
            });

            this.discardStaleTop(pq, distances);
            const shortestFrontier = pq.peek();

            steps.push({
                current: [x, y],
                distance: dist,
                frontier: [...frontierIds].map(id => this.fromCellId(id, cols)),
                shortestFrontier: shortestFrontier ? [shortestFrontier[0], shortestFrontier[1]] : null,
                shortestFrontierDistance: shortestFrontier ? shortestFrontier[2] : null,
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
