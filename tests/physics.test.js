import test from "node:test";
import assert from "node:assert/strict";
import { calculateCriticalAngle, calculateRefraction, degreesToRadians, radiansToDegrees } from "../physics.js";

const close = (actual, expected, tolerance = 1e-6) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≉ ${expected}`);
test("converts degrees and radians",()=>{close(degreesToRadians(180),Math.PI);close(radiansToDegrees(Math.PI/2),90);});
test("air to water bends toward normal at several angles",()=>{for(const angle of [15,45,75]){const r=calculateRefraction(1.00029,1.33,angle);assert.equal(r.totalInternalReflection,false);assert.ok(r.refractedAngle<angle);assert.equal(r.bendsTowardNormal,true);}});
test("water to air below critical angle",()=>{const r=calculateRefraction(1.33,1.00029,30);assert.equal(r.totalInternalReflection,false);assert.ok(r.refractedAngle>30);});
test("water to air at critical angle is grazing refraction",()=>{const critical=calculateCriticalAngle(1.33,1.00029);const r=calculateRefraction(1.33,1.00029,critical);assert.equal(r.totalInternalReflection,false);close(r.refractedAngle,90,1e-5);});
test("water to air above critical angle has total internal reflection",()=>{const r=calculateRefraction(1.33,1.00029,60);assert.equal(r.totalInternalReflection,true);assert.equal(r.refractedAngle,null);});
test("normal incidence remains normal",()=>{const r=calculateRefraction(1,2.419,0);assert.equal(r.refractedAngle,0);assert.equal(r.reflectedAngle,0);});
test("equal indices preserve angle",()=>{close(calculateRefraction(1.5,1.5,63).refractedAngle,63);});
test("values near 90 degrees remain stable",()=>{const r=calculateRefraction(1,1.5,89.999999);assert.equal(r.totalInternalReflection,false);assert.ok(Number.isFinite(r.refractedAngle));});
test("invalid inputs throw",()=>{for(const args of [[0,1,30],[1,-1,30],[1,1,-1],[1,1,91],[1,1,NaN]])assert.throws(()=>calculateRefraction(...args),RangeError);});
