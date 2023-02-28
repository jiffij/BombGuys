import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
import { ModelLoader } from './ModelLoader.js';
import { KeyDisplay } from './utils.js';

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


// mixers contain all animations
let mixers = [];
// load model and animation
const mouseLoader = new ModelLoader("../../models/static/", "mouse.fbx", "../../models/animation/",["walk.fbx"],[0.01,0.01,0.01])
mouseLoader.load(mixers,scene)


// keyboard event listener
const keysPressed = {}
const keyDisplayQueue = new KeyDisplay()
document.addEventListener("keydown", function(event){
  keyDisplayQueue.down(event.key.toLowerCase())
    if (event.shiftKey){
        // run
    }
    else {
        // walk
        keysPressed[event.key.toLowerCase()] = true
    }
}, false)

document.addEventListener("keyup", function(event){
    keyDisplayQueue.up(event.key.toLowerCase())
    if (event.shiftKey){
        // run
    }
    else {
        // walk
        keysPressed[event.key.toLowerCase()] = false
    }
}, false)


scene.background = new THREE.Color(0xFFFFFF)
const light = new THREE.HemisphereLight(0xffffff,0x000000,2)
scene.add(light)
function animate() {
  renderer.render(scene, camera)
  mixers.map(mixer => {mixer.update(0.02)})
}
renderer.setAnimationLoop(animate)
