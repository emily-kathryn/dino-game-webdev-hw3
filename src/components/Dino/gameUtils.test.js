import { addHighScore, getUnlockedAchievements, rectanglesOverlap } from "./gameUtils";

describe("game utilities", () => {
  test("detects intersecting rectangles but not rectangles that only touch", () => {
    expect(
      rectanglesOverlap(
        { x: 10, y: 10, width: 20, height: 20 },
        { x: 25, y: 15, width: 20, height: 20 }
      )
    ).toBe(true);
    expect(
      rectanglesOverlap(
        { x: 10, y: 10, width: 20, height: 20 },
        { x: 30, y: 10, width: 20, height: 20 }
      )
    ).toBe(false);
  });

  test("keeps only the five highest scores in descending order", () => {
    const scores = [120, 900, 300, 50, 700, 450].map((score) => ({ score }));
    const result = addHighScore(scores, 600);

    expect(result.map((entry) => entry.score)).toEqual([900, 700, 600, 450, 300]);
  });

  test("unlocks reached milestones once without repeating saved achievements", () => {
    expect(getUnlockedAchievements(500, 1, 10, ["score-100"])).toEqual([
      "score-500",
      "shield-1",
      "obstacles-10",
    ]);
  });
});
