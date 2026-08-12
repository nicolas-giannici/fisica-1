import { MEDIA, PRESETS } from "./media.js";
import { calculateRefraction } from "./physics.js";
import { createOpticsScene } from "./scene.js";

const $ = id => document.getElementById(id);
const controls = { m1: $("medium-1"), m2: $("medium-2"), n1: $("n1"), n2: $("n2"), range: $("angle-range"), angle: $("angle-number") };
const state = { medium1: "water", medium2: "air", n1: MEDIA.water.index, n2: MEDIA.air.index, angle: 40, view: "2d", animating: false, frame: null, animationRun: 0, direction: 1 };
const sceneElement = $("scene");
const opticsScene = createOpticsScene(sceneElement);

for (const [key, medium] of Object.entries(MEDIA)) {
  controls.m1.add(new Option(medium.name, key)); controls.m2.add(new Option(medium.name, key));
}
PRESETS.forEach(([label, a, b]) => { const button = document.createElement("button"); button.type = "button"; button.textContent = label; button.dataset.a = a; button.dataset.b = b; $("presets").append(button); });

function format(value, digits = 1) { return value == null ? "—" : value.toLocaleString("es-AR", { minimumFractionDigits: digits, maximumFractionDigits: digits }); }
function formatIndex(value) { return Number(value).toLocaleString("es-AR", { minimumFractionDigits: 3, maximumFractionDigits: 5 }); }
function mediumName(key, customValue) { return Math.abs(MEDIA[key].index - customValue) < 1e-8 ? MEDIA[key].name : `${MEDIA[key].name} (editado)`; }
function statusFor(result) {
  if (result.totalInternalReflection) return ["Reflexión total interna", "El ángulo supera el crítico: toda la luz se refleja y θ₂ no tiene solución real."];
  if (result.incidentAngle < .05) return ["Incidencia normal", "El rayo atraviesa la interfaz sin cambiar de dirección."];
  if (Math.abs(state.n1 - state.n2) < 1e-10) return ["Sin desviación", "Como ambos índices son iguales, el rayo conserva su dirección."];
  if (result.bendsTowardNormal) return ["Refracción hacia la normal", "Al ingresar al medio de mayor índice, el rayo refractado se acerca a la normal."];
  return ["Refracción alejándose de la normal", "Al ingresar al medio de menor índice, el rayo refractado se aleja de la normal."];
}
function annotationGeometry() {
  const width = sceneElement.clientWidth, height = sceneElement.clientHeight;
  return { width, height, centerX: width / 2, centerY: height / 2, radius: Math.min(68, width * .18, height * .15) };
}
function arcPath(angle, quadrant) {
  const { centerX, centerY, radius } = annotationGeometry(), rad = angle * Math.PI / 180;
  const side = quadrant.includes("left") ? -1 : 1, vertical = quadrant.includes("top") ? -1 : 1;
  const start = [centerX, centerY + vertical * radius];
  const end = [centerX + side * Math.sin(rad) * radius, centerY + vertical * Math.cos(rad) * radius];
  return `M ${centerX} ${centerY} L ${start[0]} ${start[1]} A ${radius} ${radius} 0 0 ${side * vertical < 0 ? 1 : 0} ${end[0]} ${end[1]} Z`;
}
function setLabel(id, angle, quadrant) {
  const { centerX, centerY, radius } = annotationGeometry(), labelRadius = radius + 28;
  const el = $(id), rad = angle * Math.PI / 360, side = quadrant.includes("left") ? -1 : 1, vertical = quadrant.includes("top") ? -1 : 1;
  el.setAttribute("x", centerX + side * Math.sin(rad) * labelRadius); el.setAttribute("y", centerY + vertical * Math.cos(rad) * labelRadius);
}
function updateAnnotations(result) {
  const { width, height, centerY } = annotationGeometry();
  $("annotations").setAttribute("viewBox",`0 0 ${width} ${height}`);
  const paths = [`<path class="angle-arc arc-i" d="${arcPath(result.incidentAngle,"left-bottom")}"/>`,`<path class="angle-arc arc-r" d="${arcPath(result.reflectedAngle,"right-bottom")}"/>`];
  if (!result.totalInternalReflection) paths.push(`<path class="angle-arc arc-2" d="${arcPath(result.refractedAngle,"right-top")}"/>`);
  $("angle-arcs").innerHTML = paths.join(""); setLabel("label-i",result.incidentAngle,"left-bottom"); setLabel("label-r",result.reflectedAngle,"right-bottom");
  $("label-2").style.display = result.totalInternalReflection ? "none" : "block"; if (!result.totalInternalReflection) setLabel("label-2",result.refractedAngle,"right-top");
  const name1 = mediumName(state.medium1,state.n1), name2 = mediumName(state.medium2,state.n2);
  $("medium-top").textContent = `${name2} · n₂ = ${formatIndex(state.n2)}`; $("medium-top").setAttribute("x",16); $("medium-top").setAttribute("y",centerY-14);
  $("medium-bottom").textContent = `${name1} · n₁ = ${formatIndex(state.n1)}`; $("medium-bottom").setAttribute("x",16); $("medium-bottom").setAttribute("y",centerY+25);
}
function update() {
  let result;
  try { result = calculateRefraction(state.n1,state.n2,state.angle); } catch { return; }
  controls.range.value = state.angle; controls.angle.value = Number(state.angle).toFixed(1); controls.range.setAttribute("aria-valuetext",`${format(state.angle)} grados`);
  controls.m1.value = state.medium1; controls.m2.value = state.medium2; controls.n1.value = state.n1; controls.n2.value = state.n2;
  const [status, explanation] = statusFor(result); $("status-text").textContent = status; $("explanation").textContent = explanation;
  $("metric-i").textContent = `${format(result.incidentAngle)}°`; $("metric-r").textContent = `${format(result.reflectedAngle)}°`; $("metric-2").textContent = result.refractedAngle == null ? "Sin solución" : `${format(result.refractedAngle)}°`; $("metric-c").textContent = result.criticalAngle == null ? "No aplica (n₁ ≤ n₂)" : `${format(result.criticalAngle)}°`;
  const criticalMarker = $("critical-marker"), criticalNote = $("critical-note");
  if (result.criticalAngle == null) {
    criticalMarker.hidden = true;
    criticalNote.textContent = "No hay ángulo crítico: debe cumplirse n₁ > n₂.";
  } else {
    criticalMarker.hidden = false;
    criticalMarker.style.left = `${result.criticalAngle / 89.9 * 100}%`;
    criticalNote.innerHTML = `Umbral crítico: <strong>${format(result.criticalAngle)}°</strong>. Por encima hay reflexión total interna.`;
  }
  const right = result.refractedAngle == null ? "sin solución real" : `${formatIndex(state.n2)} · sen(${format(result.refractedAngle)}°)`;
  $("equation-text").textContent = `${formatIndex(state.n1)} · sen(${format(state.angle)}°) = ${right}`;
  $("scene-mode").textContent = result.totalInternalReflection ? "REFLEXIÓN TOTAL INTERNA" : "ARRASTRÁ EL RAYO INCIDENTE";
  $("scene-description").textContent = `${mediumName(state.medium1,state.n1)} hacia ${mediumName(state.medium2,state.n2)}. Ángulo incidente ${format(state.angle)} grados, reflejado ${format(state.angle)} grados, refractado ${result.refractedAngle == null ? "inexistente por reflexión total interna" : format(result.refractedAngle)+" grados"}.`;
  document.querySelectorAll(".presets button").forEach(b => b.classList.toggle("active", b.dataset.a === state.medium1 && b.dataset.b === state.medium2 && state.n1 === MEDIA[b.dataset.a].index && state.n2 === MEDIA[b.dataset.b].index));
  updateAnnotations(result); opticsScene.update(result,{medium1:state.medium1,medium2:state.medium2}); opticsScene.render();
}
function setAngle(value, manual = true) { if (manual) stopAnimation(); state.angle = Math.max(0,Math.min(89.9,Number(value) || 0)); update(); }
function setMedium(which,key) { state[`medium${which}`] = key; state[`n${which}`] = MEDIA[key].index; update(); }
controls.m1.addEventListener("change",e=>setMedium(1,e.target.value)); controls.m2.addEventListener("change",e=>setMedium(2,e.target.value));
controls.n1.addEventListener("input",e=>{if(e.target.validity.valid&&Number(e.target.value)>0){state.n1=Number(e.target.value);update();}}); controls.n2.addEventListener("input",e=>{if(e.target.validity.valid&&Number(e.target.value)>0){state.n2=Number(e.target.value);update();}});
controls.range.addEventListener("input",e=>setAngle(e.target.value)); controls.angle.addEventListener("input",e=>{if(e.target.validity.valid)setAngle(e.target.value);});
controls.range.addEventListener("pointerdown",stopAnimation); controls.angle.addEventListener("focus",stopAnimation);
$("swap").addEventListener("click",()=>{[state.medium1,state.medium2]=[state.medium2,state.medium1];[state.n1,state.n2]=[state.n2,state.n1];update();});
$("reset").addEventListener("click",()=>{stopAnimation();Object.assign(state,{medium1:"water",medium2:"air",n1:MEDIA.water.index,n2:MEDIA.air.index,angle:40,direction:1});update();if(!reducedMotion)startAnimation();});
$("presets").addEventListener("click",e=>{const b=e.target.closest("button");if(b){state.medium1=b.dataset.a;state.medium2=b.dataset.b;state.n1=MEDIA[b.dataset.a].index;state.n2=MEDIA[b.dataset.b].index;update();}});
document.querySelector(".view-toggle").addEventListener("click",e=>{const button=e.target.closest("button");if(!button)return;state.view=button.dataset.view;opticsScene.setMode(state.view);$("annotations").classList.toggle("is-hidden",state.view==="3d");document.querySelectorAll(".view-toggle button").forEach(item=>{const active=item===button;item.classList.toggle("active",active);item.setAttribute("aria-pressed",String(active));});sceneElement.setAttribute("aria-label",state.view==="3d"?"Representación tridimensional del láser y los medios. Use las flechas izquierda y derecha para cambiar el ángulo.":"Diagrama interactivo. Arrastre el rayo o use las flechas izquierda y derecha para cambiar el ángulo.");update();});
function angleFromPointer(event){const rect=sceneElement.getBoundingClientRect(),x=event.clientX-(rect.left+rect.width/2),y=event.clientY-(rect.top+rect.height/2);if(y<0)return;setAngle(Math.atan2(Math.abs(x),Math.max(1,y))*180/Math.PI);}
let pointerId=null; sceneElement.addEventListener("pointerdown",e=>{if(state.view==="3d"||e.button!==0)return;pointerId=e.pointerId;sceneElement.setPointerCapture(pointerId);sceneElement.classList.add("dragging");angleFromPointer(e);});
sceneElement.addEventListener("pointermove",e=>{if(e.pointerId===pointerId){e.preventDefault();angleFromPointer(e);}}); function release(e){if(e.pointerId===pointerId){pointerId=null;sceneElement.classList.remove("dragging");}} sceneElement.addEventListener("pointerup",release);sceneElement.addEventListener("pointercancel",release);
sceneElement.addEventListener("keydown",e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();setAngle(state.angle+(e.key==="ArrowRight"?1:-1));}});
const animateButton=$("animate"); function stopAnimation(){state.animating=false;state.animationRun++;cancelAnimationFrame(state.frame);animateButton.setAttribute("aria-pressed","false");animateButton.lastElementChild.textContent="Iniciar demostración";}
function startAnimation(){state.animating=true;const run=++state.animationRun;animateButton.setAttribute("aria-pressed","true");animateButton.lastElementChild.textContent="Pausar demostración";state.frame=requestAnimationFrame(()=>animate(run));}
function animate(run){if(!state.animating||run!==state.animationRun)return;state.angle+=state.direction*.18;if(state.angle>=82||state.angle<=3)state.direction*=-1;update();state.frame=requestAnimationFrame(()=>animate(run));} animateButton.addEventListener("click",()=>state.animating?stopAnimation():startAnimation());
const fullscreenButton=$("fullscreen"),sceneShell=$("scene-shell");fullscreenButton.addEventListener("click",async()=>{if(document.fullscreenElement)await document.exitFullscreen();else await sceneShell.requestFullscreen();});document.addEventListener("fullscreenchange",()=>{const active=document.fullscreenElement===sceneShell;fullscreenButton.setAttribute("aria-pressed",String(active));fullscreenButton.setAttribute("aria-label",active?"Salir de pantalla completa":"Ver escena en pantalla completa");fullscreenButton.querySelector(".fullscreen-label").textContent=active?"Salir":"Pantalla completa";});
const reducedMotion=matchMedia("(prefers-reduced-motion: reduce)").matches;if(reducedMotion)animateButton.hidden=true;
new ResizeObserver(()=>{let result;try{result=calculateRefraction(state.n1,state.n2,state.angle);}catch{return;}updateAnnotations(result);}).observe(sceneElement);
window.addEventListener("pagehide",()=>{stopAnimation();opticsScene.dispose();},{once:true}); update();if(!reducedMotion)startAnimation();
