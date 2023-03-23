import { scene } from "./client";

// Create a particle geometry
const particleGeometry = new THREE.Geometry();

// Create a particle material
const particleMaterial = new THREE.PointsMaterial({
  color: 0xff6600,
  size: 10,
});

// Create particles
for (let i = 0; i < 1000; i++) {
  const particle = new THREE.Vector3(
    Math.random() * 10 - 5,
    Math.random() * 10 - 5,
    Math.random() * 10 - 5
  );
  particleGeometry.vertices.push(particle);
}

// Create a particle system
const particleSystem = new THREE.Points(particleGeometry, particleMaterial);

// Add the particle system to the scene
scene.add(particleSystem);

// Create an explosion function
function createExplosion(x, y, z) {
  // Move particles to explosion center
  for (let i = 0; i < particleSystem.geometry.vertices.length; i++) {
    const particle = particleSystem.geometry.vertices[i];
    particle.x = x;
    particle.y = y;
    particle.z = z;
  }
  particleSystem.geometry.verticesNeedUpdate = true;
}

// Call the explosion function when needed
createExplosion(1, 1, 1);