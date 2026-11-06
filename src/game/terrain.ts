import * as THREE from 'three';

// Procedural height function for gentle rolling hills with flat starting meadow & palace grounds
export function getTerrainHeight(x: number, z: number): number {
  // Flatten completely under Grand Palace footprint
  if (x >= -23 && x <= 23 && z >= 11 && z <= 52) {
    return 0;
  }

  const distFromCenter = Math.sqrt(x * x + z * z);
  // Flatten center within 15 meters radius for clean starting area
  const centerWeight = Math.min(1, Math.max(0, (distFromCenter - 12) / 25));

  const hill1 = Math.sin(x * 0.035) * Math.cos(z * 0.035) * 3.2;
  const hill2 = Math.sin(x * 0.08 + 1.2) * Math.cos(z * 0.07 - 0.8) * 1.2;
  const hill3 = Math.sin((x + z) * 0.02) * 1.8;

  // Gentle boundary rim to naturally frame the world
  const borderRise = Math.pow(Math.max(0, distFromCenter - 80) / 40, 2) * 8;

  return (hill1 + hill2 + hill3) * centerWeight + borderRise;
}

// Procedural lush grass texture created via HTML5 Canvas
export function createGrassCanvasTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base lush grass gradient
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#3a7d2c');
  grad.addColorStop(0.5, '#4f9438');
  grad.addColorStop(1, '#2d6322');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Micro grass strokes and earthy tone flecks
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const len = 3 + Math.random() * 6;
    const angle = (Math.PI / 2) + (Math.random() - 0.5) * 0.6;
    const hue = 85 + Math.random() * 30; // warm meadow green
    const lightness = 26 + Math.random() * 28;
    ctx.strokeStyle = `hsl(${hue}, 55%, ${lightness}%)`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }

  // Soft moss & soil speckles
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.4 ? 'rgba(78, 140, 48, 0.4)' : 'rgba(50, 75, 30, 0.3)';
    ctx.beginPath();
    ctx.arc(x, y, 1.5 + Math.random() * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(32, 32);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural Tree Builder (Oak / Mediterranean Royal Olive Style)
export function createTree(scale: number = 1.0): THREE.Group {
  const tree = new THREE.Group();

  // Bark trunk material
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x4a3424,
    roughness: 0.9,
    metalness: 0.05,
    flatShading: true,
  });

  // Foliage materials (2 shades of rich green)
  const foliageMat1 = new THREE.MeshStandardMaterial({
    color: 0x3d7e2e,
    roughness: 0.75,
    metalness: 0.0,
    flatShading: true,
  });

  const foliageMat2 = new THREE.MeshStandardMaterial({
    color: 0x589b3d,
    roughness: 0.8,
    metalness: 0.0,
    flatShading: true,
  });

  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.25 * scale, 0.45 * scale, 3.2 * scale, 7);
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = (3.2 * scale) / 2;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  // Root flare
  const rootGeo = new THREE.ConeGeometry(0.6 * scale, 0.8 * scale, 6);
  const root = new THREE.Mesh(rootGeo, trunkMat);
  root.position.y = 0.4 * scale;
  tree.add(root);

  // Foliage canopy - 3 stacked clusters
  const canopyConfigs = [
    { radius: 1.8 * scale, height: 1.8 * scale, y: 3.2 * scale, mat: foliageMat1 },
    { radius: 1.5 * scale, height: 1.6 * scale, y: 4.2 * scale, mat: foliageMat2 },
    { radius: 1.1 * scale, height: 1.4 * scale, y: 5.1 * scale, mat: foliageMat1 },
  ];

  canopyConfigs.forEach((cfg, idx) => {
    const canopyGeo = new THREE.DodecahedronGeometry(cfg.radius, 1);
    const canopy = new THREE.Mesh(canopyGeo, cfg.mat);
    canopy.position.y = cfg.y;
    canopy.scale.set(1.1, 0.85, 1.0);
    canopy.rotation.y = Math.random() * Math.PI;
    // Only middle canopy casts shadow to reduce draw calls
    canopy.castShadow = idx === 0;
    canopy.receiveShadow = true;
    tree.add(canopy);
  });

  return tree;
}

// Procedural Rock
export function createRock(scale: number = 1.0): THREE.Mesh {
  const rockGeo = new THREE.DodecahedronGeometry(scale, 0);
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x7a7d78,
    roughness: 0.95,
    metalness: 0.1,
    flatShading: true,
  });
  const rock = new THREE.Mesh(rockGeo, rockMat);
  rock.scale.set(1.2, 0.7, 1.0);
  rock.rotation.set(Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.4);
  rock.castShadow = false; // lightweight
  rock.receiveShadow = true;
  return rock;
}

// Construct the complete terrain landscape
export function buildLandscape(scene: THREE.Scene): {
  terrainMesh: THREE.Mesh;
  getHeight: (x: number, z: number) => number;
} {
  const worldSize = 220;
  const segments = 80; // Optimized: smooth rolling hills with high frame rate

  const terrainGeo = new THREE.PlaneGeometry(worldSize, worldSize, segments, segments);
  terrainGeo.rotateX(-Math.PI / 2);

  const posAttr = terrainGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vz = posAttr.getZ(i);
    const vy = getTerrainHeight(vx, vz);
    posAttr.setY(i, vy);
  }
  terrainGeo.computeVertexNormals();

  const grassTexture = createGrassCanvasTexture();
  const terrainMat = new THREE.MeshStandardMaterial({
    map: grassTexture,
    roughness: 0.88,
    metalness: 0.05,
    flatShading: false,
  });

  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  scene.add(terrainMesh);

  // Sparse Trees (approx 32 trees spread around hills, none right on start area)
  const treeGroup = new THREE.Group();
  const treePositions: [number, number][] = [];

  for (let i = 0; i < 35; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 18 + Math.random() * 75; // Outside 18m player start zone
    const tx = Math.cos(angle) * dist;
    const tz = Math.sin(angle) * dist;

    // Exclude palace grounds
    if (tx >= -23 && tx <= 23 && tz >= 11 && tz <= 52) continue;

    // Minimum distance check between trees
    const isTooClose = treePositions.some(([px, pz]) => {
      const d = Math.hypot(px - tx, pz - tz);
      return d < 8;
    });

    if (!isTooClose) {
      treePositions.push([tx, tz]);
      const ty = getTerrainHeight(tx, tz);
      const scale = 0.85 + Math.random() * 0.5;
      const tree = createTree(scale);
      tree.position.set(tx, ty, tz);
      tree.rotation.y = Math.random() * Math.PI * 2;
      treeGroup.add(tree);
    }
  }
  scene.add(treeGroup);

  // Decorative field rocks and stones
  const rockGroup = new THREE.Group();
  for (let i = 0; i < 28; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 10 + Math.random() * 80;
    const rx = Math.cos(angle) * dist;
    const rz = Math.sin(angle) * dist;
    if (rx >= -23 && rx <= 23 && rz >= 11 && rz <= 52) continue;
    const ry = getTerrainHeight(rx, rz);
    const rock = createRock(0.4 + Math.random() * 0.7);
    rock.position.set(rx, ry + 0.2, rz);
    rockGroup.add(rock);
  }
  scene.add(rockGroup);

  // Instanced Wildflowers & Grass Clumps
  const flowerCount = 200;
  const flowerGeo = new THREE.ConeGeometry(0.12, 0.35, 4);
  flowerGeo.translate(0, 0.175, 0);
  const flowerMat = new THREE.MeshStandardMaterial({
    color: 0xe6b800, // Golden royal flora
    roughness: 0.6,
  });
  const flowerMesh = new THREE.InstancedMesh(flowerGeo, flowerMat, flowerCount);
  flowerMesh.receiveShadow = true;

  const dummy = new THREE.Object3D();
  let placedFlowers = 0;
  for (let i = 0; i < flowerCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 5 + Math.random() * 55;
    const fx = Math.cos(angle) * dist;
    const fz = Math.sin(angle) * dist;
    if (fx >= -23 && fx <= 23 && fz >= 11 && fz <= 52) {
      dummy.position.set(0, -999, 0);
      dummy.updateMatrix();
      flowerMesh.setMatrixAt(i, dummy.matrix);
      continue;
    }
    const fy = getTerrainHeight(fx, fz);
    dummy.position.set(fx, fy, fz);
    dummy.rotation.y = Math.random() * Math.PI;
    const s = 0.6 + Math.random() * 0.7;
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    flowerMesh.setMatrixAt(i, dummy.matrix);
  }
  flowerMesh.instanceMatrix.needsUpdate = true;
  scene.add(flowerMesh);

  return {
    terrainMesh,
    getHeight: getTerrainHeight,
  };
}
