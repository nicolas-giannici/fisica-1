const EPSILON = 1e-6;

function finite(value, name) {
  value = Number(value);
  if (!Number.isFinite(value)) throw new TypeError(`${name} debe ser finito.`);
  return value;
}

export function calculateImageDistance(focalLength, objectDistance) {
  const f = finite(focalLength, "f"), object = finite(objectDistance, "do");
  if (Math.abs(f) < EPSILON) throw new RangeError("f no puede ser cero.");
  if (object <= 0) throw new RangeError("do debe ser positivo.");
  if (Math.abs(object - f) <= Math.max(.02, Math.abs(f) * .002)) return Infinity;
  const denominator = 1 / f - 1 / object;
  if (Math.abs(denominator) <= EPSILON) return Infinity;
  return 1 / denominator;
}

export function calculateMagnification(imageDistance, objectDistance) {
  const object = finite(objectDistance, "do");
  if (object <= 0) throw new RangeError("do debe ser positivo.");
  if (imageDistance === Infinity || imageDistance === -Infinity) return imageDistance === Infinity ? -Infinity : Infinity;
  return -finite(imageDistance, "di") / object;
}

export function calculateImageHeight(magnification, objectHeight) {
  const height = finite(objectHeight, "ho");
  if (height <= 0) throw new RangeError("ho debe ser positivo.");
  if (!Number.isFinite(magnification)) return magnification;
  return finite(magnification, "m") * height;
}

export function calculateLensPower(focalLengthMeters) {
  const focal = finite(focalLengthMeters, "f");
  if (Math.abs(focal) < EPSILON) throw new RangeError("f no puede ser cero.");
  return 1 / focal;
}

export function calculateFocalLength(powerDiopters) {
  const power = finite(powerDiopters, "P");
  if (Math.abs(power) < EPSILON) throw new RangeError("P no puede ser cero.");
  return 1 / power;
}

export function classifyImage(lensType, focalLength, objectDistance, imageDistance, magnification) {
  if (!['converging', 'diverging'].includes(lensType)) throw new RangeError("Tipo de lente inválido.");
  const f = finite(focalLength, "f"), object = finite(objectDistance, "do");
  const tolerance = Math.max(.02, Math.abs(f) * .002);
  const atInfinity = !Number.isFinite(imageDistance);
  let notableCase, region;
  if (lensType === 'diverging') { notableCase = 'diverging'; region = 'Entre la lente y F'; }
  else if (Math.abs(object - Math.abs(f)) <= tolerance) { notableCase = 'at-f'; region = 'En el infinito'; }
  else if (Math.abs(object - 2 * Math.abs(f)) <= tolerance) { notableCase = 'at-2f'; region = "En 2F′"; }
  else if (object > 2 * Math.abs(f)) { notableCase = 'beyond-2f'; region = "Entre F′ y 2F′"; }
  else if (object > Math.abs(f)) { notableCase = 'between-f-and-2f'; region = "Más allá de 2F′"; }
  else { notableCase = 'inside-f'; region = 'Del lado del objeto'; }
  const absoluteMagnification = Math.abs(magnification);
  return {
    isReal: !atInfinity && imageDistance > 0,
    isVirtual: !atInfinity && imageDistance < 0,
    isUpright: !atInfinity && magnification > 0,
    isInverted: !atInfinity && magnification < 0,
    sizeRelation: atInfinity ? 'undefined' : Math.abs(absoluteMagnification - 1) < .01 ? 'same' : absoluteMagnification > 1 ? 'larger' : 'smaller',
    case: notableCase, region, atInfinity
  };
}

export function calculateLensSystem({ lensType, focalLength, objectDistance, objectHeight }) {
  const expectedSign = lensType === 'converging' ? 1 : -1;
  const focal = Math.abs(finite(focalLength, "f")) * expectedSign;
  const imageDistance = calculateImageDistance(focal, objectDistance);
  const magnification = calculateMagnification(imageDistance, objectDistance);
  const imageHeight = calculateImageHeight(magnification, objectHeight);
  return { lensType, focalLength: focal, objectDistance, imageDistance, objectHeight, imageHeight, magnification, ...classifyImage(lensType, focal, objectDistance, imageDistance, magnification) };
}

export function getPrincipalRays(state) {
  const result = calculateLensSystem(state), xObject = -result.objectDistance, yObject = result.objectHeight, f = result.focalLength;
  if (result.atInfinity) return { result, rays: [
    { id: 'parallel', points: [[xObject,yObject],[0,yObject],[100,0]], parallel: true },
    { id: 'central', points: [[xObject,yObject],[0,0],[100,-100*yObject/xObject]], parallel: true }
  ] };
  const xImage = result.imageDistance, yImage = result.imageHeight;
  return { result, rays: [
    { id: 'parallel', points: [[xObject,yObject],[0,yObject],[xImage,yImage]] },
    { id: 'central', points: [[xObject,yObject],[0,0],[xImage,yImage]] },
    { id: 'focal', points: [[xObject,yObject],[0,yImage],[xImage,yImage]] }
  ] };
}
