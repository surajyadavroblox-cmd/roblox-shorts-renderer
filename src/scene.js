import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8bd5f5);
scene.fog = new THREE.Fog(0x8bd5f5, 22, 55);

const camera = new THREE.PerspectiveCamera(38, 9/16, 0.1, 100);
camera.position.set(0, 5.2, 13);
camera.lookAt(0, 1.6, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(540, 960);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x54704a, 2.0));
const sun = new THREE.DirectionalLight(0xffffff, 2.5);
sun.position.set(-5, 10, 7);
sun.castShadow = true;
scene.add(sun);

const mat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.82 });
const ground = new THREE.Mesh(new THREE.BoxGeometry(40, .3, 40), mat(0x5fba67));
ground.position.y = -.18; ground.receiveShadow = true; scene.add(ground);

function box(w,h,d, material, x,y,z, parent=scene) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), material);
  m.position.set(x,y,z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}

// Simple original block-style set: path, house, trees and clouds.
box(3.2,.06,24,mat(0xc8b28a),0,-.005,0);
const house = new THREE.Group(); house.position.set(-4,0,-3); scene.add(house);
box(3,2.4,2.6,mat(0xf0c77b),0,1.2,0,house);
const roof = new THREE.Mesh(new THREE.ConeGeometry(2.25,1.5,4),mat(0xb84f43));
roof.rotation.y=Math.PI/4; roof.position.set(0,3.05,0); roof.castShadow=true; house.add(roof);
box(.75,1.35,.12,mat(0x69452f),0,.68,1.36,house);
for (const x of [-8,7]) {
  const trunk=box(.35,1.5,.35,mat(0x79502e),x,.65,-2);
  const crown= new THREE.Mesh(new THREE.IcosahedronGeometry(1.2,1),mat(0x2e984e));
  crown.position.set(x,2.1,-2); crown.castShadow=true; scene.add(crown);
}
for (let i=0;i<5;i++) {
  const cloud=new THREE.Group(); cloud.position.set(-7+i*3.5,7+(i%2)*.6,-7); scene.add(cloud);
  for (let j=0;j<3;j++) {
    const puff=new THREE.Mesh(new THREE.SphereGeometry(.55,12,10),mat(0xffffff));
    puff.position.x=(j-1)*.55; puff.scale.y=.65; cloud.add(puff);
  }
}

function makeCharacter(name, shirtColor, pantsColor, x) {
  const root = new THREE.Group(); root.position.set(x,0,1); scene.add(root);
  const shirt=mat(shirtColor), pants=mat(pantsColor), skin=mat(0xf0bd91);
  const head=box(.78,.78,.72,skin,0,2.55,0,root);
  box(.82,.22,.76,mat(0x49372b),0,2.98,0,root); // hair
  box(.18,.12,.035,mat(0x242424),-.18,2.62,.38,root);
  box(.18,.12,.035,mat(0x242424),.18,2.62,.38,root);
  const torso=box(.9,1.05,.48,shirt,0,1.65,0,root);
  const arms=[];
  for (const side of [-1,1]) {
    const pivot=new THREE.Group(); pivot.position.set(side*.57,2.0,0); root.add(pivot);
    box(.28,.85,.3,shirt,0,-.35,0,pivot); arms.push(pivot);
  }
  const legs=[];
  for (const side of [-1,1]) {
    const pivot=new THREE.Group(); pivot.position.set(side*.23,1.12,0); root.add(pivot);
    box(.32,.85,.38,pants,0,-.4,0,pivot); legs.push(pivot);
  }
  return {name,root,head,arms,legs};
}
const pip=makeCharacter('Pip',0x3b83df,0x273a63,-1.15);
const bolt=makeCharacter('Bolt',0xe6a33b,0x405c42,1.25);
bolt.root.rotation.y=-.12;
const cube= new THREE.Mesh(new THREE.BoxGeometry(.75,.75,.75), new THREE.MeshStandardMaterial({color:0x65f4ff,emissive:0x168ca0,emissiveIntensity:1.1}));
cube.position.set(0,1.15,-2); cube.castShadow=true; scene.add(cube);
const pedestal=box(1.25,.55,1.25,mat(0x777c91),0,.28,-2);

window.renderAt = (t) => {
  const walk = Math.min(1, Math.max(0,t/2.5));
  bolt.root.position.x = 2.8 - walk*1.55;
  bolt.root.position.z = 1 + walk*.1;
  bolt.legs[0].rotation.x = Math.sin(t*7)*.55*(t<2.6?1:0);
  bolt.legs[1].rotation.x = -Math.sin(t*7)*.55*(t<2.6?1:0);
  pip.legs[0].rotation.x = Math.sin(t*4)*.08;
  pip.legs[1].rotation.x = -Math.sin(t*4)*.08;
  pip.arms[1].rotation.z = t>3 && t<5 ? -Math.sin((t-3)*Math.PI)*1.5 : 0;
  bolt.arms[0].rotation.z = t>5.5 ? Math.sin(t*4)*.25 : 0;
  cube.rotation.y = t*.7;
  cube.position.y = 1.15 + (t>5.5 ? .12*Math.sin(t*8) : 0);
  camera.position.x = Math.sin(t*.22)*.25;
  camera.lookAt(0,1.65,0);
  renderer.render(scene,camera);
};
window.renderAt(0);