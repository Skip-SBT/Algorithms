# Algorithm Visualizer

An interactive algorithm visualizer built with React and TypeScript. The primary focus is **Dijkstra's shortest-path algorithm**, animated step-by-step on configurable grid graphs.

## Features

- **Dijkstra Visualizer** — watch the algorithm explore nodes, maintain its frontier priority queue, and resolve the shortest path in real time
- **Manual mode** — navigate the grid yourself using arrow keys to get a feel for the problem space
- **Multiple grid sizes** — from a compact 10×10 up to a large-scale grid, plus a pre-built complex layout
- **Live metrics panel** — tracks step index, explored-node count, frontier size, path length, current node distance, and calculation time
- **Playback controls** — start, pause/resume, slow down, and reset at any point during the animation
- **Color-coded visualization**
  - 🟣 Explored nodes (shortest distance finalized)
  - 🔵 Frontier nodes (discovered, awaiting processing)
  - 🩵 Shortest-frontier candidate (next node to be processed)
  - 🟡 Final shortest path
  - 🔴 Current node being processed

## Getting Started

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the development server |
| `npm test` | Run the test suite |
| `npm run build` | Create a production build |

## How Dijkstra's Algorithm Works

1. Set the start node's distance to `0` and all others to `∞`.
2. Pick the frontier node with the smallest known distance.
3. Mark it explored — that distance is now final.
4. Relax its neighbours: if a shorter route is found, update the distance and record the predecessor.
5. Repeat until the finish node is explored, then backtrack through predecessors to reconstruct the shortest path.
