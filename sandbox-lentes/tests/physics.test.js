import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFocalLength, calculateImageDistance, calculateLensPower, calculateLensSystem, calculateMagnification, calculateImageHeight, getPrincipalRays } from '../physics.js';

const close = (a,b,t=1e-6) => assert.ok(Math.abs(a-b)<t, `${a} ≉ ${b}`);
test('converging beyond 2F',()=>{const r=calculateLensSystem({lensType:'converging',focalLength:20,objectDistance:60,objectHeight:10});close(r.imageDistance,30);close(r.magnification,-.5);assert.equal(r.case,'beyond-2f');assert.equal(r.sizeRelation,'smaller');});
test('converging at 2F',()=>{const r=calculateLensSystem({lensType:'converging',focalLength:20,objectDistance:40,objectHeight:10});close(r.imageDistance,40);close(r.imageHeight,-10);assert.equal(r.case,'at-2f');});
test('converging between F and 2F',()=>{const r=calculateLensSystem({lensType:'converging',focalLength:20,objectDistance:30,objectHeight:10});close(r.imageDistance,60);close(r.magnification,-2);assert.equal(r.case,'between-f-and-2f');});
test('converging at and near F is infinity',()=>{assert.equal(calculateLensSystem({lensType:'converging',focalLength:20,objectDistance:20,objectHeight:10}).atInfinity,true);assert.equal(calculateLensSystem({lensType:'converging',focalLength:20,objectDistance:20.001,objectHeight:10}).atInfinity,true);});
test('converging inside F is virtual upright larger',()=>{const r=calculateLensSystem({lensType:'converging',focalLength:20,objectDistance:10,objectHeight:8});close(r.imageDistance,-20);assert.equal(r.isVirtual,true);assert.equal(r.isUpright,true);assert.equal(r.sizeRelation,'larger');});
test('diverging objects are virtual upright smaller',()=>{for(const objectDistance of [10,40,200]){const r=calculateLensSystem({lensType:'diverging',focalLength:-20,objectDistance,objectHeight:10});assert.ok(r.imageDistance<0);assert.ok(r.magnification>0&&r.magnification<1);assert.equal(r.case,'diverging');}});
test('different negative focal lengths',()=>{close(calculateImageDistance(-10,30),-7.5);close(calculateImageDistance(-50,100),-100/3);});
test('magnification and height signs',()=>{close(calculateMagnification(60,30),-2);close(calculateImageHeight(-2,10),-20);});
test('power conversions',()=>{close(calculateLensPower(.25),4);close(calculateLensPower(-.5),-2);close(calculateFocalLength(4),.25);});
test('invalid zero and non finite inputs throw',()=>{assert.throws(()=>calculateImageDistance(0,10));assert.throws(()=>calculateImageDistance(10,0));assert.throws(()=>calculateLensPower(0));assert.throws(()=>calculateFocalLength(0));assert.throws(()=>calculateImageDistance(NaN,10));});
test('extreme values remain finite',()=>{assert.ok(Number.isFinite(calculateImageDistance(1,1e9)));});
test('principal rays share image intersection',()=>{const {result,rays}=getPrincipalRays({lensType:'converging',focalLength:20,objectDistance:30,objectHeight:10});for(const ray of rays)assert.deepEqual(ray.points.at(-1),[result.imageDistance,result.imageHeight]);});
