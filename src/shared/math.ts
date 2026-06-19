export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampScore(value: number): number {
  return clamp(value, 0, 100);
}

export function round(value: number, precision = 1): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function weightedAverage(
  values: Array<{ value: number; weight: number }>,
): number {
  const totalWeight = values.reduce((sum, item) => sum + item.weight, 0);

  if (totalWeight <= 0) {
    return 0;
  }

  const weightedTotal = values.reduce(
    (sum, item) => sum + clampScore(item.value) * item.weight,
    0,
  );

  return clampScore(weightedTotal / totalWeight);
}

export function scoreLowerIsBetter(
  value: number,
  bands: Array<{ max: number; score: number }>,
  fallbackScore: number,
): number {
  const matchingBand = bands.find((band) => value <= band.max);
  return clampScore(matchingBand?.score ?? fallbackScore);
}

export function scoreHigherIsBetter(
  value: number,
  bands: Array<{ min: number; score: number }>,
  fallbackScore: number,
): number {
  const matchingBand = [...bands]
    .sort((a, b) => b.min - a.min)
    .find((band) => value >= band.min);

  return clampScore(matchingBand?.score ?? fallbackScore);
}

export function haversineDistanceKm(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): number {
  const earthRadiusKm = 6371;
  const deltaLatitude = degreesToRadians(to.latitude - from.latitude);
  const deltaLongitude = degreesToRadians(to.longitude - from.longitude);
  const fromLatitude = degreesToRadians(from.latitude);
  const toLatitude = degreesToRadians(to.latitude);

  const centralAngle =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(deltaLongitude / 2) ** 2;

  return (
    earthRadiusKm *
    2 *
    Math.atan2(Math.sqrt(centralAngle), Math.sqrt(1 - centralAngle))
  );
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}
