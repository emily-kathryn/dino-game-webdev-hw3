export function rectanglesOverlap(first, second) {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

export function addHighScore(scores, score) {
  return [...scores, { score, date: new Date().toISOString() }]
    .sort((first, second) => second.score - first.score)
    .slice(0, 5);
}

export function getUnlockedAchievements(score, shieldsCollected, obstaclesPassed, alreadyUnlocked) {
  const earned = [];
  if (score >= 100) earned.push("score-100");
  if (score >= 500) earned.push("score-500");
  if (score >= 1000) earned.push("score-1000");
  if (shieldsCollected > 0) earned.push("shield-1");
  if (obstaclesPassed >= 10) earned.push("obstacles-10");
  if (obstaclesPassed >= 50) earned.push("obstacles-50");
  if (obstaclesPassed >= 100) earned.push("obstacles-100");
  return earned.filter((achievement) => !alreadyUnlocked.includes(achievement));
}
