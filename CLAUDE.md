# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server with HMR (Vite)
npm run build     # Production build → dist/
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
```

No test framework is configured.

## Architecture

React + Vite SPA for interactive Node.js interview preparation. Uses React Router for navigation, Monaco Editor for the code playground, and browser localStorage for all persistence.

### Data Layer

`src/data/topics/` contains the 26 topic definitions split across:
- `fundamentals.js` — Node.js overview, V8, Event Loop
- `async.js` — async patterns, Promises/callbacks
- `remaining.js` — all other 21 topics

`src/data/topics/index.js` exports `allTopics` (array), `topicsById` (id → topic), and `topicsByCategory` (category → topics[]).

Each topic has: `id`, `title`, `category`, `content` (JSX/markdown), `starterCode` (string for playground).

### State Management

`src/context/AppContext.jsx` provides two slices of global state via React Context:

- **progress** (from `useProgress`): tracks visited topic IDs in localStorage, exposes `markVisited(id)` and `percentage`
- **playground** (from `usePlayground`): manages Monaco editor state — `code`, `output`, `run()`, `loadCode()`, `isOpen`, `toggleOpen()`

All localStorage keys are prefixed `njip_` (defined in `src/utils/constants.js`).

### Component Tree

```
App (router)
└── AppLayout (3-column layout)
    ├── Sidebar — topic list with search, collapsible categories
    ├── main (Routes)
    │   └── TopicPage (/topic/:topicId) — reads from topicsById, calls loadCode() on "Try in Playground"
    └── Playground — Monaco editor panel (lazy-loaded), OutputConsole
```

### Code Execution

`src/utils/codeRunner.js` executes user code in the browser via indirect eval. It intercepts `console.log/warn/error`, captures output with timestamps, and catches errors. Note: this runs in browser context — not actual Node.js.

### Key Constants

Category display order and icons are in `src/utils/constants.js`. To add a new topic category, update `CATEGORY_ORDER` there.
