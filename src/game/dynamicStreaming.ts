import * as THREE from 'three';
import { getTerrainHeight } from './terrain';

export interface WorldProp {
  id: string;
  group: THREE.Group;
  chunkKey: string;
  isLoaded: boolean;
}

class DynamicStreamingManager {
  private scene: THREE.Scene | null = null;
  private chunkSize = 40; // 40m x 40m spatial chunks
  private activeChunks: Set<string> = new Set();
  private chunkProps: Map<string, WorldProp[]> = new Map();
  private sharedMaterials: Map<string, THREE.Material> = new Map();
  private sharedGeometries: Map<string, THREE.BufferGeometry> = new Map();
  private initialized = false;

  // Track FPS and performance stats
  public fps = 60;
  public loadedPropsCount = 0;
  public totalPropsCount = 0;
  private frameCount = 0;
  private lastFpsTime = performance.now();

  public init(scene: THREE.Scene) {
    this.scene = scene;
    if (this.initialized) return;
    this.initialized = true;
    this.createSharedAssets();
    this.populateWorldChunks();
  }

  // Create shared geometries and materials to keep memory footprint under 25MB
  private createSharedAssets() {
    // Shared Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.45, 3.2, 6);
    this.sharedGeometries.set('trunk', trunkGeo);

    // Shared Foliage
    const foliageGeo = new THREE.DodecahedronGeometry(1.6, 1);
    this.sharedGeometries.set('foliage', foliageGeo);

    // Shared Rock
    const rockGeo = new THREE.DodecahedronGeometry(1.0, 0);
    this.sharedGeometries.set('rock', rockGeo);

    // Shared Materials
    const barkMat = new THREE.MeshStandardMaterial({
      color: 0x4a3424,
      roughness: 0.9,
      metalness: 0.05,
      flatShading: true,
    });
    this.sharedMaterials.set('bark', barkMat);

    const leafMat1 = new THREE.MeshStandardMaterial({
      color: 0x3d7e2e,
      roughness: 0.8,
      flatShading: true,
    });
    this.sharedMaterials.set('leaf1', leafMat1);

    const leafMat2 = new THREE.MeshStandardMaterial({
      color: 0x589b3d,
      roughness: 0.8,
      flatShading: true,
    });
    this.sharedMaterials.set('leaf2', leafMat2);

    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x7a7d78,
      roughness: 0.95,
      metalness: 0.1,
      flatShading: true,
    });
    this.sharedMaterials.set('rock', rockMat);
  }

  // Generate lightweight procedural props in spatial chunks across the realm
  private populateWorldChunks() {
    const chunkRange = 3; // -3 to 3 chunks (~240m world diameter)

    for (let cx = -chunkRange; cx <= chunkRange; cx++) {
      for (let cz = -chunkRange; cz <= chunkRange; cz++) {
        const chunkKey = `${cx}_${cz}`;
        const props: WorldProp[] = [];

        // Center of this chunk
        const centerX = cx * this.chunkSize;
        const centerZ = cz * this.chunkSize;

        // Skip chunks overlapping the Grand Palace footprint (Palace is permanently loaded)
        if (centerX >= -28 && centerX <= 28 && centerZ >= 8 && centerZ <= 56) {
          continue;
        }

        // Deterministic pseudo-random placement for trees and rocks in each chunk
        const seed = Math.abs(cx * 73856093 ^ cz * 19349663);
        const count = 4 + (seed % 4);

        for (let i = 0; i < count; i++) {
          const offsetX = ((Math.sin(seed + i * 4.3) + 1) / 2) * (this.chunkSize - 6) - (this.chunkSize - 6) / 2;
          const offsetZ = ((Math.cos(seed + i * 2.7) + 1) / 2) * (this.chunkSize - 6) - (this.chunkSize - 6) / 2;

          const worldX = centerX + offsetX;
          const worldZ = centerZ + offsetZ;

          // Don't place in palace yard
          if (worldX >= -24 && worldX <= 24 && worldZ >= 10 && worldZ <= 50) continue;

          const groundY = getTerrainHeight(worldX, worldZ);
          const isTree = i % 2 === 0;

          const propGroup = new THREE.Group();
          propGroup.position.set(worldX, groundY, worldZ);

          if (isTree) {
            // Build tree with shared geometry/materials
            const trunk = new THREE.Mesh(
              this.sharedGeometries.get('trunk')!,
              this.sharedMaterials.get('bark')!
            );
            trunk.position.y = 1.6;
            trunk.castShadow = true;
            trunk.receiveShadow = true;
            propGroup.add(trunk);

            const canopy1 = new THREE.Mesh(
              this.sharedGeometries.get('foliage')!,
              this.sharedMaterials.get('leaf1')!
            );
            canopy1.position.y = 3.6;
            propGroup.add(canopy1);

            const canopy2 = new THREE.Mesh(
              this.sharedGeometries.get('foliage')!,
              this.sharedMaterials.get('leaf2')!
            );
            canopy2.position.set(0.2, 4.6, 0.1);
            canopy2.scale.set(0.75, 0.75, 0.75);
            propGroup.add(canopy2);
          } else {
            // Build rock
            const rock = new THREE.Mesh(
              this.sharedGeometries.get('rock')!,
              this.sharedMaterials.get('rock')!
            );
            rock.position.y = 0.5;
            rock.scale.set(1.4, 0.9, 1.2);
            rock.castShadow = false;
            rock.receiveShadow = true;
            propGroup.add(rock);
          }

          // Mark frustum culling safe
          propGroup.traverse((m) => {
            if ((m as THREE.Mesh).isMesh) m.frustumCulled = false;
          });

          props.push({
            id: `prop_${cx}_${cz}_${i}`,
            group: propGroup,
            chunkKey,
            isLoaded: false,
          });
        }

        this.chunkProps.set(chunkKey, props);
        this.totalPropsCount += props.length;
      }
    }
  }

  // Update dynamic streaming based on Sultan's current position
  public update(playerPos: THREE.Vector3) {
    if (!this.scene) return;

    // Track FPS
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
      this.frameCount = 0;
      this.lastFpsTime = now;
    }

    const currentChunkX = Math.floor((playerPos.x + this.chunkSize / 2) / this.chunkSize);
    const currentChunkZ = Math.floor((playerPos.z + this.chunkSize / 2) / this.chunkSize);

    // Stream radius: Load chunks within 2 chunk radius (~80m-100m)
    const streamRadius = 2;
    const requiredChunks = new Set<string>();

    for (let dx = -streamRadius; dx <= streamRadius; dx++) {
      for (let dz = -streamRadius; dz <= streamRadius; dz++) {
        requiredChunks.add(`${currentChunkX + dx}_${currentChunkZ + dz}`);
      }
    }

    // Load newly required chunks
    for (const chunkKey of requiredChunks) {
      if (!this.activeChunks.has(chunkKey)) {
        const props = this.chunkProps.get(chunkKey);
        if (props) {
          props.forEach((p) => {
            if (!p.isLoaded) {
              this.scene!.add(p.group);
              p.isLoaded = true;
              this.loadedPropsCount++;
            }
          });
        }
        this.activeChunks.add(chunkKey);
      }
    }

    // Unload distant chunks to save RAM and draw calls
    for (const chunkKey of Array.from(this.activeChunks)) {
      if (!requiredChunks.has(chunkKey)) {
        const props = this.chunkProps.get(chunkKey);
        if (props) {
          props.forEach((p) => {
            if (p.isLoaded) {
              this.scene!.remove(p.group);
              p.isLoaded = false;
              this.loadedPropsCount = Math.max(0, this.loadedPropsCount - 1);
            }
          });
        }
        this.activeChunks.delete(chunkKey);
      }
    }
  }

  public dispose() {
    if (this.scene) {
      for (const props of this.chunkProps.values()) {
        props.forEach((p) => {
          if (p.isLoaded) {
            this.scene!.remove(p.group);
          }
        });
      }
    }
    this.sharedMaterials.forEach((m) => m.dispose());
    this.sharedGeometries.forEach((g) => g.dispose());
    this.sharedMaterials.clear();
    this.sharedGeometries.clear();
    this.chunkProps.clear();
    this.activeChunks.clear();
    this.initialized = false;
  }
}

export const dynamicStreaming = new DynamicStreamingManager();
