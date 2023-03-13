import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es/dist/cannon-es.js';
import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
import { ModelLoader } from './ModelLoader.js';
import { KeyDisplay } from './utils.js';
import { GameMap } from './setup.js';
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
orbit.update()

// physics

const phy = new Physics();

// create map
const gameMap = new GameMap(scene, phy)
gameMap.setup();

// const sphere = new THREE.CylinderGeometry(0.3,0.3, 1.5, 20, 1);
const sphere = new THREE.SphereGeometry(0.3);
const ma = new THREE.MeshNormalMaterial();
const mesh = new THREE.Mesh(sphere, ma);
scene.add(mesh);
const sphere2 = new THREE.SphereGeometry(0.3);
const ma2 = new THREE.MeshNormalMaterial();
const mesh2 = new THREE.Mesh(sphere2, ma2);
scene.add(mesh2);

phy.addPlayer(mesh, [0,1,0]);
phy.addPlayer(mesh2, [7,0,0]);


// load model and animation
const mouseLoader = new ModelLoader("../../models/static/", "mouse.fbx", "../../models/animation/",["walk.fbx","idle.fbx","run.fbx","jump.fbx"],[0.01,0.01,0.01], orbit, camera, phy)
mouseLoader.load(scene)


// keyboard event listener
const keysPressed = {}
const keyDisplayQueue = new KeyDisplay()
document.addEventListener("keydown", function(event){
    keyDisplayQueue.down(event.key.toLowerCase())
    if (event.shiftKey){
        play = 'walk'
        mouseLoader.characterController.switchRunToggle();
    }
    else {
        keysPressed[event.key.toLowerCase()] = true
    }
}, false)

document.addEventListener("keyup", function(event){
    keyDisplayQueue.up(event.key.toLowerCase())
    if (event.key == " ") {
        gameMap.randomDelete()
    }
    if (event.key == "Shift"){
        play = "idle"
    }
    if (event.key == "j"){
        console.log("j pressed")
        mouseLoader.characterController.plantBomb(scene)
    }
    else {
        keysPressed[event.key.toLowerCase()] = false
    }
}, false)


// add light
scene.background = new THREE.Color(0xFFFFFF)
const light = new THREE.HemisphereLight(0xffffff,0x000000,2)
scene.add(light)



// test area
// let sphere = new THREE.SphereGeometry(0.4,45,30);
// let texture = new THREE.MeshBasicMaterial( { color: 0x123421 } );
// let bomb = new THREE.Mesh(sphere, texture)
// scene.add(bomb)


// animation
let clock = new THREE.Clock();

function animate() {
    phy.update();
    // phy.movePlayer();
    let updateDelta = clock.getDelta();
    if (mouseLoader.characterController){
        mouseLoader.characterController.update(updateDelta, keysPressed)
    }
    orbit.update()
    renderer.render(scene, camera)

}
renderer.setAnimationLoop(animate)
