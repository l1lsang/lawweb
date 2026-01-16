// src/utils/level.js
export function calcLevel(activityCount) {
  if (activityCount >= 100) return "platinum";
  if (activityCount >= 50) return "gold";
  if (activityCount >= 10) return "silver";
  return "general";
}
