import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import Dino from "./Dino";

test("starts, pauses, resumes, and restarts a run", () => {
  render(<Dino />);

  const achievements = screen.getByText(/Achievements \(/).closest("details");
  expect(achievements.open).toBe(false);
  fireEvent.click(screen.getByText(/Achievements \(/));
  expect(achievements.open).toBe(true);

  fireEvent.click(screen.getByRole("button", { name: /start game/i }));
  fireEvent.keyDown(window, { key: "p" });
  expect(screen.getByRole("heading", { name: "Paused" })).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: /resume/i }));
  expect(screen.getByRole("button", { name: /restart game/i })).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: /restart game/i }));
  expect(screen.getAllByText("00000").length).toBeGreaterThan(0);
});
