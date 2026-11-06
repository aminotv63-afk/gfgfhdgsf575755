import * as THREE from 'three';

export interface BoundingBox2D {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
  isActive: boolean;
  name?: string;
}

export interface CylinderCollider {
  id: string;
  x: number;
  z: number;
  radius: number;
  minY: number;
  maxY: number;
  isActive: boolean;
  name?: string;
}

class CollisionSystem {
  private boxes: Map<string, BoundingBox2D> = new Map();
  private cylinders: Map<string, CylinderCollider> = new Map();

  // Register an axis-aligned box collider
  public registerBox(box: BoundingBox2D) {
    this.boxes.set(box.id, box);
  }

  // Register a cylinder collider (columns, braziers, trees)
  public registerCylinder(cyl: CylinderCollider) {
    this.cylinders.set(cyl.id, cyl);
  }

  // Toggle collider active state (e.g. When doors open or close)
  public setColliderActive(id: string, active: boolean) {
    const box = this.boxes.get(id);
    if (box) {
      box.isActive = active;
      return;
    }
    const cyl = this.cylinders.get(id);
    if (cyl) {
      cyl.isActive = active;
    }
  }

  // Remove a collider by id
  public removeCollider(id: string) {
    this.boxes.delete(id);
    this.cylinders.delete(id);
  }

  // Check if a point with character radius collides with any solid obstacle
  public isColliding(x: number, z: number, y: number, radius: number = 0.35): boolean {
    const charMinY = y;
    const charMaxY = y + 1.85; // character height

    // Check box obstacles
    for (const box of this.boxes.values()) {
      if (!box.isActive) continue;

      // Vertical overlap check
      if (charMaxY <= box.minY || charMinY >= box.maxY) continue;

      // Closest point on box
      const closestX = Math.max(box.minX, Math.min(x, box.maxX));
      const closestZ = Math.max(box.minZ, Math.min(z, box.maxZ));

      const distX = x - closestX;
      const distZ = z - closestZ;
      const distSq = distX * distX + distZ * distZ;

      if (distSq < radius * radius) {
        return true;
      }
    }

    // Check cylinder obstacles
    for (const cyl of this.cylinders.values()) {
      if (!cyl.isActive) continue;

      if (charMaxY <= cyl.minY || charMinY >= cyl.maxY) continue;

      const dx = x - cyl.x;
      const dz = z - cyl.z;
      const distSq = dx * dx + dz * dz;
      const minDistance = radius + cyl.radius;

      if (distSq < minDistance * minDistance) {
        return true;
      }
    }

    return false;
  }

  // Slidably resolves character horizontal movement against all colliders
  // Checks X movement and Z movement independently so characters slide along walls smoothly!
  public resolveMovement(
    currentPos: THREE.Vector3,
    deltaX: number,
    deltaZ: number,
    radius: number = 0.35
  ): { x: number; z: number } {
    let newX = currentPos.x;
    let newZ = currentPos.z;
    const y = currentPos.y;

    // Test X motion
    const testX = currentPos.x + deltaX;
    if (!this.isColliding(testX, currentPos.z, y, radius)) {
      newX = testX;
    }

    // Test Z motion
    const testZ = currentPos.z + deltaZ;
    if (!this.isColliding(newX, testZ, y, radius)) {
      newZ = testZ;
    }

    // If both failed together, try sliding by half or smaller increments
    if (newX === currentPos.x && deltaX !== 0) {
      const halfTestX = currentPos.x + deltaX * 0.5;
      if (!this.isColliding(halfTestX, newZ, y, radius)) {
        newX = halfTestX;
      }
    }
    if (newZ === currentPos.z && deltaZ !== 0) {
      const halfTestZ = currentPos.z + deltaZ * 0.5;
      if (!this.isColliding(newX, halfTestZ, y, radius)) {
        newZ = halfTestZ;
      }
    }

    return { x: newX, z: newZ };
  }

  // Ceiling check: returns maximum permissible Y if hitting a ceiling
  public getCeilingY(x: number, z: number, currentY: number): number | null {
    // Palace interior ceiling (Under roof)
    if (x >= -19 && x <= 19 && z >= 14 && z <= 47 && currentY < 6.2) {
      return 6.2; // Head cannot exceed 6.2 inside palace ground floor
    }
    return null;
  }

  // Clear colliders (for reset/dispose)
  public clear() {
    this.boxes.clear();
    this.cylinders.clear();
  }
}

export const collisionSystem = new CollisionSystem();
