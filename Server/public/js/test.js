import * as THREE from 'https://cdn.skypack.dev/three@0.134.0';

// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5);
camera.lookAt(new THREE.Vector3(0, 0, 0));

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.setClearColor(0xffffff,1)
document.body.appendChild(renderer.domElement);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 3);
scene.add(ambientLight);
var directionalLight = new THREE.PointLight( 0xffffff, 0.2, 15,2); // color, intensity
directionalLight.position.set( 0, 0, 10 ); // position
// Increase the intensity of the directional light
directionalLight.intensity = 0.5;
scene.add( directionalLight );

// Create the layer
const layerGeometry = new THREE.PlaneGeometry(10, 10, 1, 1);
const layerMaterial = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.2,
    metalness: 0.5,
    envMapIntensity: 0.2,
    map: generateTexture(),
});
const layer = new THREE.Mesh(layerGeometry, layerMaterial);
// layer.rotation.x = -Math.PI / 2;
scene.add(layer);



// Animate the layer
function animate() {
  requestAnimationFrame(animate);
  layer.rotation.z += 0.01;
  renderer.render(scene, camera);
}

animate();

// Function to generate the layer texture
function generateTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;

  const context = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY);

  const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  gradient.addColorStop(0, 'rgba(255, 191, 207, 1)');
  gradient.addColorStop(0.5, 'rgba(255, 128, 171, 0.5)');
  gradient.addColorStop(1, 'rgba(255, 64, 135, 0)');

  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);

  return texture;
}
