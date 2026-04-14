export function getOccupancyTextClass(occupancy: number) {
  if (occupancy >= 70) return "text-green-600";
  if (occupancy >= 40) return "text-amber-600";
  return "text-red-600";
}
