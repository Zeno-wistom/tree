import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
export function createPostOffice(host: HTMLDivElement) {
 const renderer=new T.WebGLRenderer({antialias:true,alpha:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;host.appendChild(renderer.domElement);
 const scene=new T.Scene(); const camera=new T.PerspectiveCamera(31,1,.1,100);camera.position.set(8,6.5,12);camera.lookAt(0,1.8,0);
 const pmrem=new T.PMREMGenerator(renderer);const env=pmrem.fromScene(new RoomEnvironment(),.04);scene.environment=env.texture;
 scene.add(new T.HemisphereLight('#fff5df','#9da693',.65));const sun=new T.DirectionalLight('#fff3dc',2);sun.position.set(-4,9,6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7});sun.shadow.bias=-.001;sun.shadow.normalBias=.025;sun.shadow.radius=5;scene.add(sun);
 const world=new T.Group();scene.add(world);
 function grain(base:string,wood=false){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d')!;ctx.fillStyle=base;ctx.fillRect(0,0,256,256);let seed=37;for(let i=0;i<12000;i++){seed=(seed*16807)%2147483647;const x=seed%256;seed=(seed*16807)%2147483647;const y=seed%256;ctx.fillStyle=i%2?'#ffffff0e':'#372a180a';ctx.fillRect(x,y,wood?1:2,wood?15:1);}const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;return tex;}
 const ceramic=new T.MeshPhysicalMaterial({color:'#537f74',roughness:.28,metalness:.04,clearcoat:.55,clearcoatRoughness:.24});const cream=new T.MeshStandardMaterial({map:grain('#eee1c4'),roughness:.8});const wood=new T.MeshStandardMaterial({map:grain('#b58b60',true),roughness:.62});const coral=new T.MeshPhysicalMaterial({color:'#bf7059',roughness:.35,clearcoat:.3});const brass=new T.MeshStandardMaterial({color:'#b99a62',metalness:.72,roughness:.28});const dark=new T.MeshStandardMaterial({color:'#24483f',roughness:.8});
 function box(w:number,h:number,d:number,r:number,mat:T.Material,parent:T.Object3D=world,x=0,y=0,z=0){const m=new T.Mesh(new RoundedBoxGeometry(w,h,d,5,r),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 function cyl(rt:number,rb:number,h:number,mat:T.Material,parent:T.Object3D=world,x=0,y=0,z=0){const m=new T.Mesh(new T.CylinderGeometry(rt,rb,h,64),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 function text(label:string,w:number,h:number,fg:string,bg:string,size=60){const c=document.createElement('canvas');c.width=1024;c.height=256;const x=c.getContext('2d')!;x.fillStyle=bg;x.fillRect(0,0,1024,256);x.fillStyle=fg;x.font=`600 ${size}px Microsoft YaHei`;x.textAlign='center';x.textBaseline='middle';x.fillText(label,512,128);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map,roughness:.8}));return m;}
 // Turned walnut exhibition plinth, inset terrazzo surface and concentric lip.
 cyl(3.45,3.4,.3,wood,world,0,.15,0);cyl(3.35,3.35,.07,cream,world,0,.335,0);cyl(3.43,3.43,.035,brass,world,0,.075,0);
 // Architectural kiosk: sculpted arched shell extruded with a continuous bevel.
 const shape=new T.Shape();shape.moveTo(-1.45,0);shape.lineTo(1.45,0);shape.lineTo(1.45,2.55);shape.bezierCurveTo(1.45,4.35,-1.45,4.35,-1.45,2.55);shape.closePath();const shell: T.Mesh<T.BufferGeometry,T.MeshPhysicalMaterial>=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:1.55,bevelEnabled:true,bevelSegments:8,steps:1,bevelSize:.16,bevelThickness:.16,curveSegments:40}),ceramic);shell.geometry.deleteAttribute('normal');shell.geometry.deleteAttribute('uv');shell.geometry=mergeVertices(shell.geometry);shell.geometry.computeVertexNormals();shell.position.set(-.6,.48,-.65);shell.castShadow=shell.receiveShadow=true;world.add(shell);
 const kiosk=new T.Group();kiosk.position.x=-.6;world.add(kiosk);
 // Raised enamel roof trim and inset sign, brass fasteners, louvres.
 box(2.65,.12,1.85,.055,brass,kiosk,0,.58,.12);box(2.58,.75,.08,.13,cream,kiosk,0,3.12,1.09);const sign=text('校园来信',2.1,.43,'#365d50','#eee1c4',100);sign.position.set(0,3.15,1.14);kiosk.add(sign);
 for(const x of [-1.12,1.12])for(const y of [2.9,3.36]){const screw=cyl(.032,.032,.035,brass,kiosk,x,y,1.15);screw.rotation.x=Math.PI/2;}
 box(2.5,1.46,.07,.14,dark,kiosk,0,1.82,1.09);box(2.29,1.29,.08,.12,new T.MeshStandardMaterial({color:'#172f29'}),kiosk,0,1.84,1.14);
 const door=new T.Group();door.position.set(0,1.18,1.23);kiosk.add(door);box(2.34,1.3,.13,.12,ceramic,door,0,.65,0);box(1.78,.07,.05,.025,brass,door,0,.94,.09);const doorLabel=text('轻触 · 收取一封校园来信',1.75,.22,'#f2e5c8','#537f74',60);doorLabel.position.set(0,.52,.075);door.add(doorLabel);box(.56,.075,.13,.035,brass,door,0,.22,.13);
 for(const x of [-.85,.85]){const hinge=cyl(.065,.065,.23,brass,kiosk,x,1.18,1.28);hinge.rotation.z=Math.PI/2;}
 for(let i=0;i<4;i++)box(.61,.025,.025,.01,dark,kiosk,.78,.84+i*.09,1.1);
 const badge=text('三校相遇 · 故事发生',1.25,.2,'#eee1c4','#537f74',60);badge.position.set(-.27,3.72,.94);kiosk.add(badge);
 // Thick cotton-paper envelope: folded seams and terracotta wax seal.
 const letter=new T.Group();letter.position.set(-.6,1.7,.9);letter.scale.setScalar(.001);world.add(letter);box(1.85,1.12,.055,.045,cream,letter);const flap=new T.Shape();flap.moveTo(-.86,.48);flap.lineTo(0,-.1);flap.lineTo(.86,.48);const flapMesh=new T.Mesh(new T.ShapeGeometry(flap),new T.MeshStandardMaterial({color:'#e7d6b6',side:T.DoubleSide}));flapMesh.position.z=.031;letter.add(flapMesh);const seal=cyl(.13,.13,.04,coral,letter,0,-.12,.064);seal.rotation.x=Math.PI/2;const mini=text('给爱探索的你',1.1,.17,'#6d765b','#eee1c4',65);mini.position.set(0,-.38,.035);letter.add(mini);
 // Hand-thrown terracotta pots, individually curved leaves with a central ridge.
 const leafMat=new T.MeshPhysicalMaterial({color:'#718d5b',roughness:.55,side:T.DoubleSide});
 function plant(x:number,z:number,scale:number){const g=new T.Group();g.position.set(x,.4,z);g.scale.setScalar(scale);world.add(g);const points=[new T.Vector2(.28,0),new T.Vector2(.35,.08),new T.Vector2(.42,.65),new T.Vector2(.44,.68),new T.Vector2(.44,.76),new T.Vector2(.35,.76),new T.Vector2(.34,.65),new T.Vector2(.27,.13)];const pot=new T.Mesh(new T.LatheGeometry(points,64),coral);pot.castShadow=pot.receiveShadow=true;g.add(pot);cyl(.345,.345,.025,new T.MeshStandardMaterial({color:'#645242'}),g,0,.68,0);
 for(let i=0;i<13;i++){const angle=i*2.4;const len=.62+(i%4)*.15;const curve=new T.CatmullRomCurve3([new T.Vector3(0,.68,0),new T.Vector3(Math.cos(angle)*.22,1.1,Math.sin(angle)*.22),new T.Vector3(Math.cos(angle)*.62,1.15+len*.45,Math.sin(angle)*.62)]);const stem=new T.Mesh(new T.TubeGeometry(curve,12,.012,5,false),leafMat);g.add(stem);const geo=new T.PlaneGeometry(.32,len,6,12);const a=geo.attributes.position;for(let j=0;j<a.count;j++){const u=a.getX(j)/.16;const v=a.getY(j)/len+.5;a.setXYZ(j,a.getX(j)*Math.sin(Math.PI*v),a.getY(j),.09*(1-u*u)*Math.sin(Math.PI*v));}geo.computeVertexNormals();const leaf=new T.Mesh(geo,leafMat);leaf.position.copy(curve.getPoint(1));leaf.rotation.set(.5+Math.sin(angle)*.5,angle,-Math.cos(angle)*.7);leaf.castShadow=true;g.add(leaf);}}
 plant(1.8,-.55,1.3);plant(-2.28,.15,.8);
 // Desk furniture, routed wooden noticeboard and paper notices.
 const board=new T.Group();board.position.set(1.8,.4,1.3);board.rotation.y=-.22;world.add(board);box(.95,.08,.7,.035,wood,board,0,.07,0);box(.1,1.05,.13,.02,wood,board,0,.56,0);box(1.1,.86,.1,.06,wood,board,0,1.04,0);box(.96,.72,.025,.03,cream,board,0,1.04,.064);const notice=text('今日有好事',.84,.23,'#9d5a45','#eee1c4',90);notice.position.set(0,1.23,.082);board.add(notice);for(let i=0;i<3;i++)box(.6-i*.07,.025,.01,.005,coral,board,0,1.05-i*.11,.083);
 // Stepping tiles, fallen leaves and stacked postcards soften the crafted scene.
 for(let i=0;i<4;i++){const tile=box(.72,.065,.43,.13,cream,world,-.6+i*.12,.42,1.68+i*.36);tile.rotation.y=-.1+i*.07;}
 for(let i=0;i<4;i++){const card=box(.8,.025,.51,.025,cream,world,-2,.45+i*.028,1.5);card.rotation.y=.25+i*.13;}box(.1,.13,.62,.015,coral,world,-2,.54,1.5);
 const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({opacity:.13}));floor.rotation.x=-Math.PI/2;floor.position.y=-.025;floor.receiveShadow=true;scene.add(floor);
 let frame=0;const draw=()=>renderer.render(scene,camera);const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();draw();};const observer=new ResizeObserver(resize);observer.observe(host);resize();
 // Render only during interactions, with no perpetual WebGL idle loop.
 function animate(){draw();frame=requestAnimationFrame(animate);}function play(){if(!frame)animate();}function stop(){cancelAnimationFrame(frame);frame=0;draw();}
 return {door,letter,draw,play,stop,dispose(){stop();observer.disconnect();scene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>{const sm=m as T.MeshStandardMaterial;sm.map?.dispose();m.dispose();});}});env.dispose();pmrem.dispose();renderer.dispose();renderer.domElement.remove();}};
}



