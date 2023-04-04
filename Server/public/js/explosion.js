import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

export function createExplosion(position, numParticles = 100) {
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array(numParticles * 3);
  const velocities = new Float32Array(numParticles * 3);

  for (let i = 0; i < numParticles * 3; i += 3) {
    vertices[i] = position.x;
    vertices[i + 1] = position.y;
    vertices[i + 2] = position.z;

    velocities[i] = (Math.random() - 0.5) * 0.4;
    velocities[i + 1] = (Math.random() - 0.5) * 0.4;
    velocities[i + 2] = (Math.random() - 0.5) * 0.4;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

  const material = new THREE.PointsMaterial({ color: 0xff9900, size: 0.1 });
  const points = new THREE.Points(geometry, material);
  points.life = 50;

  return points;
}