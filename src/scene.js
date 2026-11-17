import * as THREE from 'three';

// ==========================================
// ROBLOX SHORTS RENDERER - SCENE V2
// Original characters: PIP AND BOLT
// ==========================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 25, 65);

const camera = new THREE.PerspectiveCamera(
  38, 9 / 16, 0.1, 100
);

camera.position.set(0, 5, 14);
camera.lookAt(0, 1.8, 0);

// RENDERER

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true
});

renderer.setPixelRatio(1);
renderer.setSize(540, 960);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

document.body.style.margin = '0';
document.body.style.overflow = 'hidden';

document.body.appendChild(renderer.domElement);

// ==========================================
// LIGHTING
// ==========================================

scene.add(
  new THREE.HemisphereLight(
    0xdaf2ff,
    0x52613b,
    2.1
  )
);

const sun = new THREE.DirectionalLight(
  0xfff0d6,
  3.2
);

sun.position.set(-7, 12, 9);
sun.castShadow = true;

sun.shadow.mapSize.set(2048, 2048);

sun.shadow.camera.left = -15;
sun.shadow.camera.right = 15;
sun.shadow.camera.top = 15;
sun.shadow.camera.bottom = -15;

scene.add(sun);

// ==========================================
// PROCEDURAL TEXTURES
// ==========================================

function makeTexture(base, dark, light) {

  const canvas = document.createElement('canvas');

  canvas.width = 256;
  canvas.height = 256;

  const ctx = canvas.getContext('2d');

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 1800; i++) {

    const x = Math.random() * 256;
    const y = Math.random() * 256;

    ctx.fillStyle = Math.random() > 0.5
      ? dark
      : light;

    ctx.globalAlpha = Math.random() * 0.15;

    ctx.fillRect(x, y, 2, 2);

  }

  ctx.globalAlpha = 1;

  // Fabric weave

  for (let i = 0; i < 256; i += 6) {

    ctx.strokeStyle = light;
    ctx.globalAlpha = 0.08;

    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();

  }

  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  return texture;
}

const blueFabric = makeTexture(
  '#2775c9',
  '#164c91',
  '#64a7ed'
);

const orangeFabric = makeTexture(
  '#d88b29',
  '#985316',
  '#ffc66b'
);

const jeansFabric = makeTexture(
  '#263c69',
  '#142544',
  '#5476a7'
);

const greenFabric = makeTexture(
  '#456943',
  '#263e2b',
  '#8ca66c'
);

const grassTexture = makeTexture(
  '#55a94b',
  '#307d30',
  '#92ca68'
);

function material(color, options = {}) {

  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.72,
    metalness: 0,
    ...options
  });

}

const skinMaterial = material(0xf3c49d);

const whiteMaterial = material(0xffffff);
const blackMaterial = material(0x171522);

const shoeMaterial = material(0x24252c);

const goldMaterial = material(0xffc43b, {
  metalness: 0.55,
  roughness: 0.3
});

// ==========================================
// OBJECT HELPERS
// ==========================================

function box(
  w, h, d,
  mat,
  x, y, z,
  parent = scene
) {

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    mat
  );

  mesh.position.set(x, y, z);

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  parent.add(mesh);

  return mesh;
}

function sphere(
  radius,
  mat,
  x, y, z,
  parent
) {

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 24, 20),
    mat
  );

  mesh.position.set(x, y, z);

  mesh.castShadow = true;

  parent.add(mesh);

  return mesh;
}

// ==========================================
// GROUND
// ==========================================

const ground = new THREE.Mesh(
  new THREE.BoxGeometry(45, 0.35, 45),
  material(0xffffff, {
    map: grassTexture
  })
);

ground.position.y = -0.2;
ground.receiveShadow = true;

scene.add(ground);

// ROAD

box(
  3.5, 0.07, 30,
  material(0xb6a18b),
  0, 0, 0
);

// ==========================================
// ENVIRONMENT
// ==========================================

// HOUSE

const house = new THREE.Group();

house.position.set(-4, 0, -4);

scene.add(house);

box(
  3.5, 2.6, 3,
  material(0xf1d1a0),
  0, 1.3, 0,
  house
);

const roof = new THREE.Mesh(
  new THREE.ConeGeometry(2.6, 1.8, 4),
  material(0xa93d35)
);

roof.rotation.y = Math.PI / 4;
roof.position.y = 3.45;

roof.castShadow = true;

house.add(roof);

// WINDOWS

for (const x of [-1, 1]) {

  box(
    0.75, 0.8, 0.08,
    material(0x69c5ef, {
      metalness: 0.15
    }),
    x, 1.8, 1.55,
    house
  );

  box(
    0.08, 0.9, 0.1,
    material(0xffffff),
    x, 1.8, 1.61,
    house
  );

}

// DOOR

box(
  0.85, 1.5, 0.1,
  material(0x68432e),
  0, 0.75, 1.58,
  house
);

// TREES

for (let i = 0; i < 8; i++) {

  const x = -9 + i * 2.7;

  const tree = new THREE.Group();

  tree.position.set(
    x,
    0,
    -8 - (i % 3) * 2
  );

  scene.add(tree);

  box(
    0.4, 1.8, 0.4,
    material(0x70452a),
    0, 0.9, 0,
    tree
  );

  for (let j = 0; j < 3; j++) {

    const crown = new THREE.Mesh(
      new THREE.IcosahedronGeometry(
        1.1 - j * 0.12,
        2
      ),
      material(
        j % 2 ? 0x319348 : 0x48aa50
      )
    );

    crown.position.set(
      (j - 1) * 0.25,
      2.1 + j * 0.65,
      0
    );

    crown.castShadow = true;

    tree.add(crown);

  }

}

// CLOUDS

const clouds = [];

for (let i = 0; i < 5; i++) {

  const cloud = new THREE.Group();

  cloud.position.set(
    -8 + i * 4,
    7 + (i % 2),
    -9
  );

  scene.add(cloud);

  for (let j = 0; j < 4; j++) {

    const puff = sphere(
      0.6,
      whiteMaterial,
      (j - 1.5) * 0.6,
      Math.sin(j) * 0.15,
      0,
      cloud
    );

    puff.scale.y = 0.65;

  }

  clouds.push(cloud);

}

// ==========================================
// ANIMATED MOUTH TEXTURES
// ==========================================

function createMouth() {

  const canvas = document.createElement('canvas');

  canvas.width = 128;
  canvas.height = 96;

  const ctx = canvas.getContext('2d');

  const texture = new THREE.CanvasTexture(canvas);

  texture.colorSpace = THREE.SRGBColorSpace;

  function draw(type) {

    ctx.clearRect(0, 0, 128, 96);

    ctx.strokeStyle = '#512b25';
    ctx.fillStyle = '#512b25';

    ctx.lineWidth = 9;
    ctx.lineCap = 'round';

    ctx.beginPath();

    if (type === 'happy' || type === 'laugh') {

      ctx.arc(64, 25, 32, 0.15, Math.PI - 0.15);

      ctx.stroke();

    } else if (type === 'sad') {

      ctx.arc(64, 75, 29, Math.PI + 0.2, -0.2);

      ctx.stroke();

    } else if (type === 'surprised') {

      ctx.beginPath();
      ctx.ellipse(64, 47, 12, 20, 0, 0, Math.PI * 2);
      ctx.fill();

    } else if (type === 'scared') {

      ctx.beginPath();
      ctx.ellipse(64, 53, 17, 23, 0, 0, Math.PI * 2);
      ctx.stroke();

    } else {

      ctx.moveTo(40, 50);
      ctx.lineTo(88, 50);

      ctx.stroke();

    }

    if (type === 'laugh') {

      ctx.fillStyle = '#e98d91';

      ctx.fillRect(48, 35, 32, 12);

    }

    texture.needsUpdate = true;

  }

  draw('happy');

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.35, 0.26),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false
    })
  );

  return {
    mesh,
    draw
  };

}

// ==========================================
// CHARACTER CREATION
// ==========================================

function makeCharacter(
  name,
  shirtTexture,
  pantsTexture,
  x,
  hairColor
) {

  const root = new THREE.Group();

  root.position.set(x, 0, 1);

  scene.add(root);

  // MATERIALS

  const shirt = material(0xffffff, {
    map: shirtTexture
  });

  const pants = material(0xffffff, {
    map: pantsTexture
  });

  const hair = material(hairColor);

  // HEAD PIVOT

  const headPivot = new THREE.Group();

  headPivot.position.y = 2.45;

  root.add(headPivot);

  const head = box(
    0.86, 0.86, 0.76,
    skinMaterial,
    0, 0, 0,
    headPivot
  );

  // HAIR BASE

  box(
    0.9, 0.24, 0.82,
    hair,
    0, 0.39, -0.015,
    headPivot
  );

  // HAIR FRINGE

  for (let i = 0; i < 4; i++) {

    const fringe = box(
      0.22, 0.3, 0.25,
      hair,
      -0.3 + i * 0.2,
      0.25,
      0.35,
      headPivot
    );

    fringe.rotation.z = (i - 1.5) * 0.12;

  }

  // SIDE HAIR

  for (const side of [-1, 1]) {

    box(
      0.16, 0.55, 0.65,
      hair,
      side * 0.43,
      0.03,
      -0.02,
      headPivot
    );

  }

  // EYES

  const eyes = [];
  const brows = [];

  for (const side of [-1, 1]) {

    const eye = new THREE.Group();

    eye.position.set(
      side * 0.19,
      0.03,
      0.385
    );

    headPivot.add(eye);

    // Eye white

    sphere(
      0.115,
      whiteMaterial,
      0, 0, 0,
      eye
    );

    // Iris

    sphere(
      0.068,
      material(0x4a83c8),
      0, -0.005, 0.07,
      eye
    );

    // Pupil

    sphere(
      0.04,
      blackMaterial,
      0, -0.005, 0.115,
      eye
    );

    // Eye shine

    sphere(
      0.018,
      whiteMaterial,
      -0.025, 0.035, 0.15,
      eye
    );

    eyes.push(eye);

    // EYEBROWS

    const brow = box(
      0.2, 0.055, 0.07,
      hair,
      side * 0.19,
      0.22,
      0.42,
      headPivot
    );

    brows.push(brow);

  }

  // MOUTH

  const mouth = createMouth();

  mouth.mesh.position.set(
    0,
    -0.23,
    0.391
  );

  headPivot.add(mouth.mesh);

  // BODY

  const torso = new THREE.Group();

  torso.position.y = 1.55;

  root.add(torso);

  box(
    0.96, 1.05, 0.52,
    shirt,
    0, 0, 0,
    torso
  );

  // COLLAR

  box(
    0.36, 0.14, 0.55,
    skinMaterial,
    0, 0.51, 0,
    torso
  );

  // BUTTONS

  for (let i = 0; i < 3; i++) {

    sphere(
      0.035,
      goldMaterial,
      0, 0.2 - i * 0.17, 0.27,
      torso
    );

  }

  // ARMS

  const arms = [];

  for (const side of [-1, 1]) {

    const pivot = new THREE.Group();

    pivot.position.set(
      side * 0.58,
      0.42,
      0
    );

    torso.add(pivot);

    box(
      0.28, 0.67, 0.32,
      shirt,
      0, -0.3, 0,
      pivot
    );

    // Hands

    const hand = sphere(
      0.16,
      skinMaterial,
      0, -0.7, 0,
      pivot
    );

    arms.push(pivot);

  }

  // LEGS

  const legs = [];

  for (const side of [-1, 1]) {

    const pivot = new THREE.Group();

    pivot.position.set(
      side * 0.24,
      1.02,
      0
    );

    root.add(pivot);

    box(
      0.34, 0.8, 0.38,
      pants,
      0, -0.38, 0,
      pivot
    );

    // SHOES

    box(
      0.39, 0.22, 0.58,
      shoeMaterial,
      0, -0.82, 0.1,
      pivot
    );

    box(
      0.4, 0.06, 0.59,
      whiteMaterial,
      0, -0.91, 0.1,
      pivot
    );

    legs.push(pivot);

  }

  return {
    name,
    root,
    headPivot,
    torso,
    eyes,
    brows,
    mouth,
    arms,
    legs,
    expression: 'happy'
  };

}

// ==========================================
// CREATE CHARACTERS
// ==========================================

const pip = makeCharacter(
  'Pip',
  blueFabric,
  jeansFabric,
  -1.2,
  0x38271f
);

const bolt = makeCharacter(
  'Bolt',
  orangeFabric,
  greenFabric,
  2.8,
  0x5b321c
);

// ==========================================
// FACIAL EXPRESSIONS
// ==========================================

function setExpression(character, type) {

  if (character.expression === type) return;

  character.expression = type;

  character.mouth.draw(type);

  if (type === 'surprised' || type === 'scared') {

    character.eyes.forEach(eye => {
      eye.scale.y = 1.25;
    });

  } else {

    character.eyes.forEach(eye => {
      eye.scale.y = 1;
    });

  }

  character.brows.forEach((brow, i) => {

    if (type === 'angry') {

      brow.rotation.z = i === 0 ? -0.3 : 0.3;

    } else if (type === 'surprised') {

      brow.position.y = 0.27;

    } else {

      brow.rotation.z = 0;
      brow.position.y = 0.22;

    }

  });

}

// ==========================================
// GLOWING MYSTERY CUBE
// ==========================================

const cubeMaterial = new THREE.MeshStandardMaterial({

  color: 0x6cf5ff,

  emissive: 0x16a9d5,

  emissiveIntensity: 2,

  metalness: 0.3,

  roughness: 0.2

});

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(0.8, 0.8, 0.8),
  cubeMaterial
);

cube.position.set(0, 1.25, -2);

cube.castShadow = true;

scene.add(cube);

// CUBE LIGHT

const cubeLight = new THREE.PointLight(
  0x38dfff,
  4,
  7
);

cubeLight.position.set(0, 2, -2);

scene.add(cubeLight);

// PEDESTAL

box(
  1.4, 0.6, 1.4,
  material(0x555c73),
  0, 0.3, -2
);

// ==========================================
// ANIMATION
// ==========================================

window.renderAt = (t) => {

  // BOLT WALKS TOWARDS CUBE

  const walk = Math.min(
    1,
    Math.max(0, t / 2.5)
  );

  bolt.root.position.x = 2.8 - walk * 1.5;

  bolt.root.position.z = 1 + walk * 0.1;

  const walking = t < 2.6 ? 1 : 0;

  bolt.legs[0].rotation.x =
    Math.sin(t * 7) * 0.55 * walking;

  bolt.legs[1].rotation.x =
    -Math.sin(t * 7) * 0.55 * walking;

  // PIP IDLE

  pip.legs[0].rotation.x =
    Math.sin(t * 4) * 0.05;

  pip.legs[1].rotation.x =
    -Math.sin(t * 4) * 0.05;

  // NATURAL HEAD MOVEMENT

  pip.headPivot.rotation.y =
    Math.sin(t * 1.5) * 0.04;

  bolt.headPivot.rotation.y =
    Math.sin(t * 1.8) * 0.06;

  // REACTIONS

  if (t < 3) {

    setExpression(pip, 'happy');
    setExpression(bolt, 'happy');

  } else if (t < 5.5) {

    setExpression(pip, 'surprised');
    setExpression(bolt, 'surprised');

    pip.headPivot.rotation.x =
      -0.12;

    bolt.headPivot.rotation.x =
      -0.12;

    pip.arms[1].rotation.z = -1.1;

    bolt.arms[0].rotation.z = 0.5;

  } else {

    setExpression(pip, 'happy');
    setExpression(bolt, 'laugh');

    pip.arms[1].rotation.z = 0;

    bolt.arms[0].rotation.z =
      Math.sin(t * 5) * 0.6;

    bolt.headPivot.rotation.x =
      Math.sin(t * 7) * 0.08;

  }

  // BLINKING

  const blink =
    Math.sin(t * 2.4) > 0.985;

  if (blink) {

    pip.eyes.forEach(eye => {
      eye.scale.y = 0.08;
    });

    bolt.eyes.forEach(eye => {
      eye.scale.y = 0.08;
    });

  }

  // GLOWING CUBE

  cube.rotation.y = t * 0.8;

  cube.rotation.x = t * 0.3;

  cube.position.y =
    1.25 + Math.sin(t * 3) * 0.12;

  cubeMaterial.emissiveIntensity =
    1.5 + Math.sin(t * 5) * 0.7;

  cubeLight.intensity =
    3 + Math.sin(t * 5) * 1.5;

  // CLOUD MOVEMENT

  clouds.forEach((cloud, i) => {

    cloud.position.x =
      -8 + i * 4 + Math.sin(t * 0.15 + i) * 0.3;

  });

  // CAMERA MOVEMENT

  camera.position.x =
    Math.sin(t * 0.2) * 0.2;

  camera.position.y =
    5 + Math.sin(t * 0.4) * 0.08;

  camera.lookAt(0, 1.8, -0.2);

  renderer.render(scene, camera);

};

// INITIAL FRAME

window.renderAt(0);
