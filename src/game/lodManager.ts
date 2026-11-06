import * as THREE from 'three';

export type LodTier = 'near' | 'medium' | 'far';

export interface LodEntity {
  id: string;
  root: THREE.Group;
  getPosition: () => THREE.Vector3;
  setTier: (tier: LodTier) => void;
  isImportant: boolean; // Important characters (Sultan, Guards) are NEVER culled
}

class LodManager {
  private entities: Map<string, LodEntity> = new Map();

  public register(entity: LodEntity) {
    // Ensure all meshes inside root are NEVER prematurely clipped by Three.js frustum culling
    entity.root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.frustumCulled = false;
      }
    });
    this.entities.set(entity.id, entity);
  }

  public unregister(id: string) {
    this.entities.delete(id);
  }

  // Update LOD tiers based on camera/player distance
  public update(playerPos: THREE.Vector3) {
    for (const entity of this.entities.values()) {
      const pos = entity.getPosition();
      const dist = Math.hypot(pos.x - playerPos.x, pos.z - playerPos.z);

      if (dist < 35) {
        entity.setTier('near');
        entity.root.visible = true;
      } else if (dist < 90) {
        entity.setTier('medium');
        entity.root.visible = true;
      } else {
        entity.setTier('far');
        // Important entities (Sultan, Guards) stay visible even up to the fog edge (220m+)
        if (entity.isImportant) {
          entity.root.visible = dist < 240;
        } else {
          entity.root.visible = dist < 160;
        }
      }
    }
  }

  public clear() {
    this.entities.clear();
  }
}

export const lodManager = new LodManager();
