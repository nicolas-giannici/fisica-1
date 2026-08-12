import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const COLORS = { incident: 0xc41234, reflected: 0xf0b323, refracted: 0x16856b, ink: 0x2f3336 };
const MEDIUM_COLORS = { vacuum: 0xdfe7e7, air: 0xe9eeee, water: 0x83c9cb, ice: 0xcce8e8, glass: 0xb8d7cf, glycerin: 0xd3c9a5, diamond: 0xb8e3dc };

export function createOpticsScene(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf7f8f8);
  const camera2d = new THREE.OrthographicCamera(-8, 8, 5, -5, .1, 100);
  camera2d.position.set(0, 0, 10);
  const camera3d = new THREE.PerspectiveCamera(37, 1, .1, 100);
  camera3d.position.set(8.6, 5.8, 10.5);
  camera3d.lookAt(0, -.2, 0);
  let camera = camera2d;
  let mode = "2d";
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.prepend(renderer.domElement);
  const orbitControls = new OrbitControls(camera3d, renderer.domElement);
  orbitControls.enabled = false;
  orbitControls.target.set(0, -.2, 0);
  orbitControls.enableDamping = false;
  orbitControls.minDistance = 7;
  orbitControls.maxDistance = 24;
  orbitControls.maxPolarAngle = Math.PI * .88;
  orbitControls.addEventListener("change", () => renderer.render(scene, camera));

  const materials = [], geometries = [];
  const geometry = value => (geometries.push(value), value);
  const material = value => (materials.push(value), value);
  function line(group, points, options) {
    const shape = geometry(new THREE.BufferGeometry().setFromPoints(points.map(([x,y,z=0]) => new THREE.Vector3(x,y,z))));
    const mat = options.dashed ? material(new THREE.LineDashedMaterial(options)) : material(new THREE.LineBasicMaterial(options));
    const object = new THREE.Line(shape, mat); if (options.dashed) object.computeLineDistances(); group.add(object); return object;
  }
  const setLine = (object,a,b) => { object.geometry.setFromPoints([new THREE.Vector3(...a),new THREE.Vector3(...b)]); if(object.computeLineDistances)object.computeLineDistances(); };
  const orientBetween = (object,a,b) => { const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),direction=end.clone().sub(start);object.position.copy(start.clone().add(end).multiplyScalar(.5));object.scale.set(1,direction.length(),1);object.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize()); };

  const group2d = new THREE.Group(); scene.add(group2d);
  function plane2d(color,y) { const mesh=new THREE.Mesh(geometry(new THREE.PlaneGeometry(16,5)),material(new THREE.MeshBasicMaterial({color,depthWrite:false})));mesh.position.set(0,y,-2);group2d.add(mesh);return mesh; }
  const topPlane=plane2d(0xdde9e6,2.5),bottomPlane=plane2d(0xffffff,-2.5);
  const grid=new THREE.GridHelper(16,16,0xc9cece,0xdfe3e3);grid.rotation.x=Math.PI/2;grid.position.z=-1;grid.material.opacity=.45;grid.material.transparent=true;materials.push(grid.material);group2d.add(grid);
  line(group2d,[[-8,0],[8,0]],{color:COLORS.ink});line(group2d,[[0,-5],[0,5]],{color:0x727272,dashSize:.18,gapSize:.16,dashed:true});
  const incident=line(group2d,[[0,0],[0,0]],{color:COLORS.incident}),reflected=line(group2d,[[0,0],[0,0]],{color:COLORS.reflected,dashSize:.22,gapSize:.1,dashed:true}),refracted=line(group2d,[[0,0],[0,0]],{color:COLORS.refracted});
  group2d.add(new THREE.Mesh(geometry(new THREE.CircleGeometry(.12,28)),material(new THREE.MeshBasicMaterial({color:COLORS.ink}))));
  function arrow(group,color){const value=new THREE.ArrowHelper(new THREE.Vector3(1,0,0),new THREE.Vector3(),.72,color,.25,.15);group.add(value);return value;}
  const arrowI=arrow(group2d,COLORS.incident),arrowR=arrow(group2d,COLORS.reflected),arrowT=arrow(group2d,COLORS.refracted);
  const source2d=new THREE.Group();source2d.add(new THREE.Mesh(geometry(new THREE.CircleGeometry(.36,32)),material(new THREE.MeshBasicMaterial({color:0xf7c84b,transparent:true,opacity:.28}))));source2d.add(new THREE.Mesh(geometry(new THREE.CircleGeometry(.16,24)),material(new THREE.MeshBasicMaterial({color:0xffdf72}))));
  const housing=geometry(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.25,-.24,0),new THREE.Vector3(.25,-.24,0),new THREE.Vector3(.16,-.48,0),new THREE.Vector3(-.16,-.48,0),new THREE.Vector3(-.25,-.24,0)]));source2d.add(new THREE.Line(housing,material(new THREE.LineBasicMaterial({color:COLORS.ink}))));group2d.add(source2d);
  const setArrow=(object,start,end,fraction)=>{const a=new THREE.Vector3(...start),b=new THREE.Vector3(...end),direction=b.clone().sub(a);object.position.copy(a.clone().lerp(b,fraction));object.setDirection(direction.normalize());};

  const group3d=new THREE.Group();group3d.visible=false;scene.add(group3d);
  scene.add(new THREE.HemisphereLight(0xffffff,0x596067,2.2));
  const key=new THREE.DirectionalLight(0xffffff,4);key.position.set(-4,8,7);key.castShadow=true;scene.add(key);
  const rim=new THREE.PointLight(0xc41234,18,14,2);rim.position.set(-4,-2,2);scene.add(rim);
  const floor=new THREE.Mesh(geometry(new THREE.PlaneGeometry(18,14)),material(new THREE.MeshStandardMaterial({color:0x202427,roughness:.72,metalness:.08})));floor.rotation.x=-Math.PI/2;floor.position.y=-4.55;floor.receiveShadow=true;group3d.add(floor);
  const boxGeometry=geometry(new THREE.BoxGeometry(12,4.2,7));
  function mediumVolume(y,color){const mat=material(new THREE.MeshPhysicalMaterial({color,transparent:true,opacity:.27,roughness:.12,transmission:.28,thickness:1.8,ior:1.33,side:THREE.DoubleSide,depthWrite:false}));const mesh=new THREE.Mesh(boxGeometry,mat);mesh.position.y=y;mesh.renderOrder=1;group3d.add(mesh);return mesh;}
  const upperMedium=mediumVolume(2.12,MEDIUM_COLORS.water),lowerMedium=mediumVolume(-2.12,MEDIUM_COLORS.air);
  const interfaceMesh=new THREE.Mesh(geometry(new THREE.PlaneGeometry(12,7)),material(new THREE.MeshPhysicalMaterial({color:0xffffff,transparent:true,opacity:.24,roughness:.08,side:THREE.DoubleSide})));interfaceMesh.rotation.x=-Math.PI/2;interfaceMesh.position.y=.015;group3d.add(interfaceMesh);
  group3d.add(new THREE.Mesh(geometry(new THREE.CylinderGeometry(.012,.012,8,8)),material(new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.42}))));
  group3d.add(new THREE.Mesh(geometry(new THREE.SphereGeometry(.13,24,16)),material(new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:5}))));
  const beamGeometry=geometry(new THREE.CylinderGeometry(.035,.035,1,16,1,true)),beamGlowGeometry=geometry(new THREE.CylinderGeometry(.105,.105,1,16,1,true));
  function beam(color){const group=new THREE.Group();group.add(new THREE.Mesh(beamGeometry,material(new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:8,roughness:.2}))));group.add(new THREE.Mesh(beamGlowGeometry,material(new THREE.MeshBasicMaterial({color,transparent:true,opacity:.11,depthWrite:false,side:THREE.DoubleSide}))));group3d.add(group);return group;}
  const beamI=beam(COLORS.incident),beamR=beam(COLORS.reflected),beamT=beam(COLORS.refracted);
  function cone(color){const mesh=new THREE.Mesh(geometry(new THREE.ConeGeometry(.12,.3,18)),material(new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:3})));group3d.add(mesh);return mesh;}
  const coneI=cone(COLORS.incident),coneR=cone(COLORS.reflected),coneT=cone(COLORS.refracted);
  function setCone(object,start,end,fraction){const a=new THREE.Vector3(...start),b=new THREE.Vector3(...end),direction=b.clone().sub(a);object.position.copy(a.clone().lerp(b,fraction));object.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());}
  const laser=new THREE.Group();group3d.add(laser);
  const body=new THREE.Mesh(geometry(new THREE.CylinderGeometry(.3,.34,1.25,32)),material(new THREE.MeshStandardMaterial({color:0x24292d,roughness:.22,metalness:.82})));body.castShadow=true;laser.add(body);
  const grip=new THREE.Mesh(geometry(new THREE.CylinderGeometry(.345,.345,.52,32)),material(new THREE.MeshStandardMaterial({color:0x99122e,roughness:.3,metalness:.55})));grip.position.y=-.2;laser.add(grip);
  const lens=new THREE.Mesh(geometry(new THREE.CylinderGeometry(.19,.19,.08,32)),material(new THREE.MeshStandardMaterial({color:0xff294f,emissive:0xff143e,emissiveIntensity:7,roughness:.08})));lens.position.y=.665;laser.add(lens);

  function update(result,names={}) {
    const theta=THREE.MathUtils.degToRad(result.incidentAngle),source=[-Math.sin(theta)*4.2,-Math.cos(theta)*3.8,0],reflectedEnd=[Math.sin(theta)*4.2,-Math.cos(theta)*3.8,0];
    setLine(incident,source,[0,0,0]);setLine(reflected,[0,0,0],reflectedEnd);setArrow(arrowI,source,[0,0,0],.64);setArrow(arrowR,[0,0,0],reflectedEnd,.44);source2d.position.set(...source);
    orientBetween(beamI,source,[0,0,0]);orientBetween(beamR,[0,0,0],reflectedEnd);setCone(coneI,source,[0,0,0],.65);setCone(coneR,[0,0,0],reflectedEnd,.48);
    const start=new THREE.Vector3(...source),direction=new THREE.Vector3().sub(start).normalize();laser.position.copy(start.clone().addScaledVector(direction,-.58));laser.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);
    if(result.totalInternalReflection){refracted.visible=arrowT.visible=beamT.visible=coneT.visible=false;}else{const theta2=THREE.MathUtils.degToRad(result.refractedAngle),end=[Math.sin(theta2)*4.2,Math.cos(theta2)*3.8,0];setLine(refracted,[0,0,0],end);setArrow(arrowT,[0,0,0],end,.5);orientBetween(beamT,[0,0,0],end);setCone(coneT,[0,0,0],end,.52);refracted.visible=arrowT.visible=beamT.visible=coneT.visible=true;}
    topPlane.material.color.set(MEDIUM_COLORS[names.medium2]||0xdde9e6);bottomPlane.material.color.set(MEDIUM_COLORS[names.medium1]||0xfafafa);upperMedium.material.color.set(MEDIUM_COLORS[names.medium2]||MEDIUM_COLORS.water);lowerMedium.material.color.set(MEDIUM_COLORS[names.medium1]||MEDIUM_COLORS.air);
  }
  function render(){renderer.render(scene,camera);}
  function setMode(value){mode=value;group2d.visible=value==="2d";group3d.visible=value==="3d";camera=value==="2d"?camera2d:camera3d;orbitControls.enabled=value==="3d";scene.background.set(value==="2d"?0xf7f8f8:0x111518);resize();}
  function resize(){const width=container.clientWidth,height=container.clientHeight;renderer.setSize(width,height,false);const aspect=width/height,vertical=10;camera2d.left=-vertical*aspect/2;camera2d.right=vertical*aspect/2;camera2d.top=5;camera2d.bottom=-5;camera2d.updateProjectionMatrix();camera3d.aspect=aspect;camera3d.updateProjectionMatrix();render();}
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  return {update,setMode,render,get mode(){return mode;},dispose(){observer.disconnect();orbitControls.dispose();geometries.forEach(x=>x.dispose());materials.forEach(x=>x.dispose());renderer.dispose();renderer.domElement.remove();}};
}
