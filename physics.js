const EPSILON = 1e-10;

export function degreesToRadians(value) {
  return Number(value) * Math.PI / 180;
}

export function radiansToDegrees(value) {
  return Number(value) * 180 / Math.PI;
}

function validateInputs(n1, n2, incidentAngle) {
  const values = [n1, n2, incidentAngle].map(Number);
  if (!values.every(Number.isFinite) || values[0] <= 0 || values[1] <= 0 || values[2] < 0 || values[2] > 90) {
    throw new RangeError("Los índices deben ser positivos y el ángulo debe estar entre 0° y 90°.");
  }
  return values;
}

export function calculateCriticalAngle(n1, n2) {
  [n1, n2] = validateInputs(n1, n2, 0);
  return n1 > n2 ? radiansToDegrees(Math.asin(Math.min(1, n2 / n1))) : null;
}

export function calculateRefraction(n1, n2, incidentAngle) {
  [n1, n2, incidentAngle] = validateInputs(n1, n2, incidentAngle);
  const criticalAngle = calculateCriticalAngle(n1, n2);
  const sinTheta2 = (n1 / n2) * Math.sin(degreesToRadians(incidentAngle));
  const totalInternalReflection = sinTheta2 > 1 + EPSILON;
  const refractedAngle = totalInternalReflection
    ? null
    : radiansToDegrees(Math.asin(Math.max(-1, Math.min(1, sinTheta2))));

  return {
    incidentAngle,
    reflectedAngle: incidentAngle,
    refractedAngle,
    criticalAngle,
    totalInternalReflection,
    bendsTowardNormal: !totalInternalReflection && n2 > n1 && incidentAngle > EPSILON,
    bendsAwayFromNormal: !totalInternalReflection && n2 < n1 && incidentAngle > EPSILON
  };
}
