import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es/dist/cannon-es.js';
import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
import { ModelLoader } from './ModelLoader.js';
import { GameMap } from './GameMap.js';
import { Physics } from './physics.js';

// test switch action
let play = ""

// setup scene and camera
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth/window.innerHeight,
    0.1,
    1000
)
camera.position.set(5,1,1)

// orbit control
const orbit = new OrbitControls(camera, renderer.domElement)
orbit.minDistance = 4
orbit.maxDistance = 4
// Disable rotation in the z direction
orbit.minPolarAngle = Math.PI / 7 *2; // Set minimum vertical rotation to 90 degrees (pointing upwards)
orbit.maxPolarAngle = Math.PI / 7 *2; // Set maximum vertical rotation to 90 degrees (pointing downwards)
orbit.update()

// physics

const phy = new Physics();

// create map
const gameMap = new GameMap(scene, phy)
gameMap.setup();

// // const sphere = new THREE.CylinderGeometry(0.3,0.3, 1.5, 20, 1);
// const sphere = new THREE.SphereGeometry(0.3);
// const ma = new THREE.MeshNormalMaterial();
// const mesh = new THREE.Mesh(sphere, ma);
// scene.add(mesh);
// const sphere2 = new THREE.SphereGeometry(0.3);
// const ma2 = new THREE.MeshNormalMaterial();
// const mesh2 = new THREE.Mesh(sphere2, ma2);
// scene.add(mesh2);

// phy.addPlayer(mesh, [0,1,0]);
// phy.addPlayer(mesh2, [7,0,0]);


// load model and animation
const player = new ModelLoader(scene, "../../models/static/", "mouse.fbx", "../../models/animation/",["walk.fbx","idle.fbx","run.fbx","jump.fbx"],[0.007,0.007,0.007], orbit, camera, phy, gameMap)
player.load()


// keyboard event listener
const keysPressed = {}
document.addEventListener("keydown", function(event){
    // console.log(event)
    if (event.shiftKey){
        play = 'walk'
        player.characterController.switchRunToggle();
    }
    else {
        keysPressed[event.key.toLowerCase()] = true
    }
}, false)

document.addEventListener("keyup", function(event){
    if (event.key == " ") {
    }
    if (event.key == "Shift"){
        play = "idle"
    }
    if (event.key == "e"){
        player.plantBomb()
    }
    else {
        keysPressed[event.key.toLowerCase()] = false
    }
}, false)


// add light
var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 ); // color, intensity
directionalLight.position.set( 1, 1, 1 ); // position
// Increase the intensity of the directional light
directionalLight.intensity = 1.3;
scene.add( directionalLight );

// test area



// animation
let clock = new THREE.Clock();

function animate() {
    phy.update();
    // phy.movePlayer();
    let updateDelta = clock.getDelta();
    if (player.characterController){
        player.update(updateDelta, keysPressed)
    }
    orbit.update()
    renderer.render(scene, camera)

}
renderer.setAnimationLoop(animate)


window.addEventListener("resize", function(){
    camera.aspect = window.innerWidth / window.innerHeight,
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)

})