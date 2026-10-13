import React, { useCallback, useEffect, useRef, useState } from "react";
import "./Dino.css";
import { addHighScore, getUnlockedAchievements, rectanglesOverlap } from "./gameUtils";

const WORLD_WIDTH = 760;
const WORLD_HEIGHT = 280;
const DINO_X = 82;
const DINO_WIDTH = 48;
const DINO_HEIGHT = 52;
const DUCK_HEIGHT = 32;
const GROUND_Y = 240;
const ACHIEVEMENTS = [
  { id: "score-100", title: "Getting Started", detail: "Reach 100 points" },
  { id: "score-500", title: "Desert Runner", detail: "Reach 500 points" },
  { id: "score-1000", title: "Dino Legend", detail: "Reach 1,000 points" },
  { id: "shield-1", title: "Extra Armor", detail: "Collect a shield" },
  { id: "obstacles-10", title: "Quick Feet", detail: "Pass 10 obstacles" },
  { id: "obstacles-50", title: "Unstoppable", detail: "Pass 50 obstacles" },
  { id: "obstacles-100", title: "Dino Marathon", detail: "Pass 100 obstacles" },
];

const readStorage = (key, fallback) => {
  const value = window.localStorage.getItem(key);
  return value ? JSON.parse(value) : fallback;
};

const createSimulation = () => ({
  phase: "ready",
  elapsed: 0,
  score: 0,
  lift: 0,
  jumpVelocity: 0,
  ducking: false,
  shielded: false,
  entities: [],
  nextObstacleIn: 900,
  nextShieldAt: 9000,
  obstaclesPassed: 0,
  nextEntityId: 0,
  lastFrame: 0,
});

function Dino() {
  const simulation = useRef(createSimulation());
  const animationFrame = useRef(null);
  const toastTimeout = useRef(null);
  const unlockedRef = useRef(readStorage("dino-achievements", []));
  const [phase, setPhase] = useState("ready");
  const [view, setView] = useState({ score: 0, entities: [], lift: 0, ducking: false, shielded: false, night: false });
  const [highScores, setHighScores] = useState(() => readStorage("dino-high-scores", []));
  const [unlocked, setUnlocked] = useState(unlockedRef.current);
  const [toast, setToast] = useState("");

  const updateAchievements = useCallback((score, shields, obstacles) => {
    const newlyUnlocked = getUnlockedAchievements(score, shields, obstacles, unlockedRef.current);
    if (newlyUnlocked.length === 0) return;

    unlockedRef.current = [...unlockedRef.current, ...newlyUnlocked];
    window.localStorage.setItem("dino-achievements", JSON.stringify(unlockedRef.current));
    setUnlocked(unlockedRef.current);
    const achievement = ACHIEVEMENTS.find((item) => item.id === newlyUnlocked[0]);
    setToast(`Achievement unlocked: ${achievement.title}`);
    window.clearTimeout(toastTimeout.current);
    toastTimeout.current = window.setTimeout(() => setToast(""), 2600);
  }, []);

  const beginGame = useCallback(() => {
    simulation.current = { ...createSimulation(), phase: "running", lastFrame: performance.now() };
    setView({ score: 0, entities: [], lift: 0, ducking: false, shielded: false, night: false });
    setPhase("running");
  }, []);

  const finishGame = useCallback(() => {
    const game = simulation.current;
    game.phase = "over";
    game.ducking = false;
    const nextHighScores = addHighScore(highScores, game.score);
    if (game.score > 0) {
      window.localStorage.setItem("dino-high-scores", JSON.stringify(nextHighScores));
      setHighScores(nextHighScores);
    }
    setPhase("over");
  }, [highScores]);

  useEffect(() => {
    let lastPaint = 0;

    const frame = (now) => {
      const game = simulation.current;
      animationFrame.current = window.requestAnimationFrame(frame);
      if (game.phase !== "running") return;

      const delta = Math.min((now - game.lastFrame) / 1000 || 0, 0.04);
      game.lastFrame = now;
      game.elapsed += delta * 1000;
      game.score = Math.floor(game.elapsed / 100);
      const speed = 310 + Math.min(game.elapsed * 0.025, 280);
      game.nextObstacleIn -= delta * 1000;

      if (game.nextObstacleIn <= 0) {
        const type = Math.random() < Math.min(0.2 + game.elapsed / 100000, 0.38) ? "pterodactyl" : "cactus";
        game.entities.push({
          id: game.nextEntityId++,
          type,
          x: WORLD_WIDTH + 10,
          y: type === "pterodactyl"
            ? (Math.random() < 0.55 ? 152 + Math.random() * 18 : GROUND_Y - 39)
            : GROUND_Y - 45,
          width: type === "pterodactyl" ? 54 : 26,
          height: type === "pterodactyl" ? 34 : 45,
          passed: false,
        });
        game.nextObstacleIn = Math.max(700, 1450 - game.elapsed * 0.008) + Math.random() * 500;
      }

      if (game.elapsed >= game.nextShieldAt) {
        game.entities.push({
          id: game.nextEntityId++,
          type: "shield",
          x: WORLD_WIDTH + 10,
          y: GROUND_Y - 96,
          width: 32,
          height: 32,
        });
        game.nextShieldAt = game.elapsed + 11000 + Math.random() * 5000;
      }

      if (game.jumpVelocity !== 0 || game.lift > 0) {
        game.lift = Math.max(0, game.lift + game.jumpVelocity * delta);
        game.jumpVelocity -= 1700 * delta;
        if (game.lift === 0) game.jumpVelocity = 0;
      }

      const dinoHeight = game.ducking && game.lift === 0 ? DUCK_HEIGHT : DINO_HEIGHT;
      const dinoRect = {
        x: DINO_X + 7,
        y: GROUND_Y - dinoHeight - game.lift + 5,
        width: DINO_WIDTH - 13,
        height: dinoHeight - 9,
      };

      const remaining = [];
      for (const entity of game.entities) {
        entity.x -= speed * delta;
        if (entity.x + entity.width < 0) continue;

        if (entity.type === "shield") {
          if (
            rectanglesOverlap(dinoRect, {
              x: entity.x + 4,
              y: entity.y + 4,
              width: entity.width - 8,
              height: entity.height - 8,
            })
          ) {
            if (!game.shielded) {
              game.shielded = true;
              updateAchievements(game.score, 1, game.obstaclesPassed);
            }
            continue;
          }
          remaining.push(entity);
          continue;
        }

        const obstacleRect = {
          x: entity.x + 3,
          y: entity.y + 4,
          width: entity.width - 6,
          height: entity.height - 8,
        };
        if (rectanglesOverlap(dinoRect, obstacleRect)) {
          if (game.shielded) {
            game.shielded = false;
            continue;
          }
          finishGame();
          return;
        }
        if (!entity.passed && entity.x + entity.width < DINO_X) {
          entity.passed = true;
          game.obstaclesPassed += 1;
          updateAchievements(game.score, 0, game.obstaclesPassed);
        }
        remaining.push(entity);
      }
      game.entities = remaining;
      updateAchievements(game.score, 0, game.obstaclesPassed);

      if (now - lastPaint > 32) {
        const cycle = (game.elapsed % 24000) / 24000;
        setView({
          score: game.score,
          entities: game.entities.map((entity) => ({ ...entity })),
          lift: game.lift,
          ducking: game.ducking,
          shielded: game.shielded,
          night: Math.sin(cycle * Math.PI * 2) > 0.05,
        });
        lastPaint = now;
      }
    };

    animationFrame.current = window.requestAnimationFrame(frame);
    return () => {
      window.cancelAnimationFrame(animationFrame.current);
      window.clearTimeout(toastTimeout.current);
    };
  }, [finishGame, updateAchievements]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      const game = simulation.current;
      if (event.code === "Space") {
        event.preventDefault();
        if (game.phase === "ready" || game.phase === "over") {
          beginGame();
          return;
        }
        if (game.phase === "running" && game.lift === 0) game.jumpVelocity = 610;
      } else if (event.code === "ArrowDown") {
        event.preventDefault();
        if (game.phase === "running") game.ducking = true;
      } else if (event.key.toLowerCase() === "p") {
        if (game.phase === "running") {
          game.phase = "paused";
          setPhase("paused");
        } else if (game.phase === "paused") {
          game.phase = "running";
          game.lastFrame = performance.now();
          setPhase("running");
        }
      }
    };

    const onKeyUp = (event) => {
      if (event.code === "ArrowDown") simulation.current.ducking = false;
    };
    const onBlur = () => {
      simulation.current.ducking = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [beginGame]);

  const restart = () => beginGame();

  return (
    <main className="dino-app">
      <header className="page-header">
        <h1>Dino Game</h1>
      </header>

      <section className="game-column" aria-label="Dino Game">
        <div className="scorebar">
          <div className="score-current"><span>Score</span><strong>{String(view.score).padStart(5, "0")}</strong></div>
          <div className="score-best"><span>Best</span><strong>{String(highScores[0]?.score || 0).padStart(5, "0")}</strong></div>
          <div className={`shield-status ${view.shielded ? "is-active" : ""}`} aria-live="polite">
            {view.shielded ? "Shield ready" : "No shield"}
          </div>
        </div>

        <div className={`game-world ${view.night ? "is-night" : ""}`} aria-label="Game field">
            <div className="sky-decorations" aria-hidden="true">
              <span className="moon" />
              <span className="stars stars-one">✦　·　✧　　　·　✦</span>
              <span className="stars stars-two">·　✧　　　✦　　·</span>
              <span className="cloud cloud-one"><i /><i /><i /></span>
              <span className="cloud cloud-two"><i /><i /><i /></span>
            </div>
            <div className="distant-hills" aria-hidden="true" />
            <div className="ground" aria-hidden="true"><span /></div>
            <div
              className={`dino-sprite ${view.ducking && view.lift === 0 ? "is-ducking" : ""} ${view.shielded ? "has-shield" : ""}`}
              style={{ left: DINO_X, bottom: WORLD_HEIGHT - GROUND_Y, transform: `translateY(${-view.lift}px)` }}
              aria-label="Dinosaur"
            />
            {view.entities.map((entity) => (
              <div
                key={entity.id}
                className={`game-entity ${entity.type}`}
                style={{
                  left: entity.x,
                  bottom: WORLD_HEIGHT - entity.y - entity.height,
                  width: entity.width,
                  height: entity.height,
                }}
                aria-label={entity.type}
              />
            ))}
            {phase !== "running" && (
              <div className={`game-overlay ${phase === "ready" ? "overlay-ready" : ""}`}>
                <div className="overlay-card">
                  {phase === "ready" && (
                    <>
                      <h2>Ready?</h2>
                      <button className="primary-button" onClick={beginGame}>Start game</button>
                      <p className="keyboard-hint">or press <kbd>SPACE</kbd></p>
                    </>
                  )}
                  {phase === "paused" && (
                    <>
                      <h2>Paused</h2>
                      <button className="primary-button" onClick={() => {
                        simulation.current.phase = "running";
                        simulation.current.lastFrame = performance.now();
                        setPhase("running");
                      }}>Resume</button>
                      <p className="keyboard-hint">or press <kbd>P</kbd></p>
                    </>
                  )}
                  {phase === "over" && (
                    <>
                      <h2>Game over!</h2>
                      <p>Score: <strong>{view.score}</strong></p>
                      <button className="primary-button" onClick={restart}>Play again</button>
                      <p className="keyboard-hint">or press <kbd>SPACE</kbd></p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="controls-strip">
            <span><kbd>SPACE</kbd> Jump / start</span>
            <span><kbd>↓</kbd> Duck</span>
            <span><kbd>P</kbd> Pause / resume</span>
            {phase !== "ready" && <button className="restart-button" onClick={restart} aria-label="Restart game">↻ Restart</button>}
          </div>
          {toast && <p className="achievement-toast" role="status">{toast}</p>}
      </section>

      <details className="achievements-panel">
        <summary>Achievements ({unlocked.length}/{ACHIEVEMENTS.length})</summary>
        <ul className="achievement-list">
          {ACHIEVEMENTS.map((achievement) => {
            const earned = unlocked.includes(achievement.id);
            return (
              <li key={achievement.id} className={earned ? "earned" : ""}>
                <span className="achievement-mark">{earned ? "✓" : "·"}</span>
                <span><strong>{achievement.title}</strong> — {achievement.detail}</span>
              </li>
            );
          })}
        </ul>
      </details>
    </main>
  );
}

export default Dino;
