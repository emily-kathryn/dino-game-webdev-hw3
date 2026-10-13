# Dino Game

A small React endless-runner based on the classic browser dinosaur game. Jump over cacti, duck under flying pterodactyls, and collect shields while the background changes from day to night.

## Features

- Keyboard and on-screen controls to jump, duck, pause, resume, and restart.
- Cactus and pterodactyl obstacles that get faster and more frequent during a run.
- Day/night background cycle with moving clouds, stars, and a moon.
- A collectible shield that protects against one collision.
- Best score and achievement progress saved in browser `localStorage`.
- An expandable achievements panel.

## Controls

| Input | Action |
| --- | --- |
| `Space` | Start a run or jump |
| `↓` Down Arrow | Duck while held |
| `P` | Pause or resume |
| Restart button | Start a fresh run |

## Run locally

You need Node.js and npm installed.

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). The current score and best score appear above the game. Use the achievements panel below the controls to see which milestones have been unlocked.

To run the test suite or create a production build:

```bash
npm test -- --watchAll=false
npm run build
```

The best score and achievement unlocks are kept in the current browser's local storage. Clear the site's local storage to reset this progress.

## Credits

This project builds on the Create React App Dino Game starter project and its original dinosaur and cactus images. The starter was provided for Web Development coursework; the controls, obstacles, shield, day/night cycle, high score, and achievements were added for this version.
