const NS = 'http://www.w3.org/2000/svg';
const COLORS = ['#c41234','#187f85','#dc9412'];

function element(name, attributes = {}) { const node=document.createElementNS(NS,name);for(const [key,value] of Object.entries(attributes))node.setAttribute(key,value);return node; }

export function createLensDiagram(svg) {
  function render(result, options = {}) {
    const width=svg.clientWidth||1000,height=svg.clientHeight||620,cx=width/2,cy=height/2;
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.replaceChildren();
    const xScale=Math.min(width*.43/85,height*.72/45),yScale=xScale;
    const X=value=>cx+value*xScale,Y=value=>cy-value*yScale;
    const defs=element('defs');
    COLORS.forEach((color,index)=>{const marker=element('marker',{id:`arrow-${index}`,viewBox:'0 0 10 10',refX:'8',refY:'5',markerWidth:'5',markerHeight:'5',orient:'auto'});marker.append(element('path',{d:'M0 0L10 5L0 10Z',fill:color}));defs.append(marker);});svg.append(defs);
    if(options.grid){const grid=element('g',{class:'grid-lines'});for(let x=-80;x<=80;x+=10)grid.append(element('line',{x1:X(x),y1:0,x2:X(x),y2:height}));for(let y=-40;y<=40;y+=5)grid.append(element('line',{x1:0,y1:Y(y),x2:width,y2:Y(y)}));svg.append(grid);}
    const guides=element('g',{class:'guides'});guides.append(element('line',{x1:0,y1:cy,x2:width,y2:cy,class:'axis'}));guides.append(element('line',{x1:cx,y1:20,x2:cx,y2:height-20,class:'plane'}));svg.append(guides);
    const focal=Math.abs(result.focalLength);for(const [position,label] of [[-2*focal,'2F'],[-focal,'F'],[focal,"F′"],[2*focal,"2F′"]]){const g=element('g',{class:'focus'});g.append(element('circle',{cx:X(position),cy,r:4}));const text=element('text',{x:X(position),y:cy+22,'text-anchor':'middle'});text.textContent=label;g.append(text);svg.append(g);}
    const lens=element('path',{class:`lens ${result.lensType}`,d:result.lensType==='converging'?`M${cx} ${cy-105}Q${cx+30} ${cy} ${cx} ${cy+105}Q${cx-30} ${cy} ${cx} ${cy-105}Z`:`M${cx-22} ${cy-105}Q${cx+4} ${cy} ${cx-22} ${cy+105}L${cx+22} ${cy+105}Q${cx-4} ${cy} ${cx+22} ${cy-105}Z`});svg.append(lens);
    const objectX=X(-result.objectDistance),objectY=Y(result.objectHeight);drawArrow(svg,objectX,cy,objectY,'object','Objeto');
    const maxDistance=85,imageVisible=!result.atInfinity&&Math.abs(result.imageDistance)<=maxDistance;
    if(options.rays){drawRays(svg,result,{X,Y,cx,cy,width,height,maxDistance},options);}
    if(result.atInfinity){const text=element('text',{x:width-18,y:45,'text-anchor':'end',class:'infinity'});text.textContent='Imagen en el infinito →';svg.append(text);}
    else if(imageVisible)drawArrow(svg,X(result.imageDistance),cy,Y(result.imageHeight),result.isVirtual?'image virtual-image':'image',result.isVirtual?'Imagen virtual':'Imagen');
    else {const side=result.imageDistance>0?1:-1,x=side>0?width-14:14;const text=element('text',{x,y:cy-16,'text-anchor':side>0?'end':'start',class:'out-frame'});text.textContent=`Imagen fuera del encuadre ${side>0?'→':'←'}`;svg.append(text);}
    drawDimensions(svg,result,{X,Y,cx,cy,width});
    applyStep(svg,options.step ?? 9);
  }
  return { render };
}

function drawArrow(svg,x,baseY,tipY,className,label){const group=element('g',{class:`vertical-arrow ${className}`});group.append(element('line',{x1:x,y1:baseY,x2:x,y2:tipY}));const direction=tipY<baseY?-1:1;group.append(element('path',{d:`M${x} ${tipY}l-7 ${direction*11}h14Z`}));const text=element('text',{x:x+9,y:tipY+(direction<0?-6:17)});text.textContent=label;group.append(text);svg.append(group);}

function drawRays(svg,result,coords,options){const {X,Y,cx,cy,width,maxDistance}=coords,xObject=-result.objectDistance,yObject=result.objectHeight,f=Math.abs(result.focalLength),endX=80;
  const groups=[element('g',{class:'principal-ray step-ray-1'}),element('g',{class:'principal-ray step-ray-2'}),element('g',{class:'principal-ray step-ray-3'})];
  const add=(group,a,b,index,dashed=false)=>group.append(element('line',{x1:X(a[0]),y1:Y(a[1]),x2:X(b[0]),y2:Y(b[1]),stroke:COLORS[index],class:dashed?'virtual-extension':'','marker-end':dashed?'':`url(#arrow-${index})`}));
  add(groups[0],[xObject,yObject],[0,yObject],0);
  add(groups[1],[xObject,yObject],[0,0],1);
  if(result.atInfinity){const slope=-yObject/xObject;add(groups[0],[0,yObject],[endX,yObject+endX*slope],0);add(groups[1],[0,0],[endX,endX*slope],1);}
  else {
    const xTarget=result.isVirtual?endX:Math.max(-maxDistance,Math.min(maxDistance,result.imageDistance));
    const outgoingY=hitY=>hitY+(result.imageHeight-hitY)/result.imageDistance*xTarget;
    add(groups[0],[0,yObject],[xTarget,outgoingY(yObject)],0);add(groups[1],[0,0],[xTarget,outgoingY(0)],1);
    add(groups[2],[xObject,yObject],[0,result.imageHeight],2);add(groups[2],[0,result.imageHeight],[xTarget,outgoingY(result.imageHeight)],2);
    if(result.isVirtual&&options.virtual){for(let i=0;i<3;i++){const hit=i===0?[0,yObject]:i===1?[0,0]:[0,result.imageHeight];add(groups[i],hit,[result.imageDistance,result.imageHeight],i,true);}}
  }
  groups.forEach(group=>svg.append(group));
}

function drawDimensions(svg,result,{X,Y,cx,cy,width}){const group=element('g',{class:'dimensions'}),lineY=cy+Math.min(115,cy*.42);group.append(element('line',{x1:X(-result.objectDistance),y1:lineY,x2:cx,y2:lineY}));const t1=element('text',{x:(X(-result.objectDistance)+cx)/2,y:lineY-7,'text-anchor':'middle'});t1.textContent=`do = ${format(result.objectDistance)} cm`;group.append(t1);if(!result.atInfinity){const imageX=Math.max(10,Math.min(width-10,X(result.imageDistance)));group.append(element('line',{x1:cx,y1:lineY+23,x2:imageX,y2:lineY+23}));const t2=element('text',{x:(cx+imageX)/2,y:lineY+17,'text-anchor':'middle'});t2.textContent=`di = ${format(result.imageDistance)} cm`;group.append(t2);}svg.append(group);}
function format(value){return Number(value).toLocaleString('es-AR',{maximumFractionDigits:1});}
function applyStep(svg,step){svg.querySelectorAll('.focus').forEach(x=>x.style.opacity=step>=2?1:0);svg.querySelector('.object').style.opacity=step>=3?1:0;svg.querySelectorAll('.step-ray-1').forEach(x=>x.style.opacity=step>=4?1:0);svg.querySelectorAll('.step-ray-2').forEach(x=>x.style.opacity=step>=5?1:0);svg.querySelectorAll('.step-ray-3').forEach(x=>x.style.opacity=step>=6?1:0);svg.querySelectorAll('.image').forEach(x=>x.style.opacity=step>=7?1:0);svg.querySelectorAll('.dimensions').forEach(x=>x.style.opacity=step>=8?1:0);}
