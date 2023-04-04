import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
import { ModelLoader } from './ModelLoader.js';
import { GameMap } from './GameMap.js';
import { Physics } from './physics.js';
import { io } from 'https://cdn.skypack.dev/socket.io-client@4.4.1';
import { Bomb } from './Bomb.js';
import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import { serverIp } from './config.js';


let firstTimeLoad = false

function initialize(){
    // explosion
    explosions = []

    // setup scene and camera
    renderer = new THREE.WebGLRenderer()
    renderer.setSize(window.innerWidth, window.innerHeight)
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth/window.innerHeight,
        0.1,
        1000
    )
    camera.position.set(5,1,1)
    // for player2
    camera2 = new THREE.PerspectiveCamera(
        75,
        window.innerWidth/window.innerHeight,
        0.1,
        1000
    )
    camera2.position.set(5,1,1)

    // orbit control
    orbit = new OrbitControls(camera, renderer.domElement)
    orbit.minDistance = 4
    orbit.maxDistance = 4
    // Disable rotation in the z direction
    orbit.minPolarAngle = Math.PI / 3; // Set minimum vertical rotation to 90 degrees (pointing upwards)
    orbit.maxPolarAngle = Math.PI / 3; // Set maximum vertical rotation to 90 degrees (pointing downwards)
    orbit.update()

    // physics
    phy = new Physics();

    // create map
    gameMap = new GameMap(scene, phy)
    gameMap.setup();
}


function clear(){
    if (renderer !== undefined){
        renderer.setAnimationLoop(null)
    }
    clearInterval(updatePlayerPosEmit)
    clearInterval(updateCameraEmit)
    socket.off("playerStates")
    socket.off("updateCamera")
    socket.off("updatePlayerPos")
    socket.off("plantBomb")
}

// explosion
export let explosions = []

// setup scene and camera
let renderer;
export let scene;
let camera;
let camera2;

// orbit control
let orbit;

// physics
let phy;

// create map
let gameMap;

// setInterval function id
let updatePlayerPosEmit;
let updateCameraEmit;

initialize()

const animations = {}

function loadFBX(url) {
    return new Promise((resolve, reject) => {
      const loader = new FBXLoader();
      loader.setPath("../../models/animation/")
      loader.load(
        url,
        (fbx) => {
          resolve(fbx);
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
}

async function loadAssets() {
    try {
      // Load animations and skins here
      const fbx1 = await loadFBX('idle.fbx');
      const fbx2 = await loadFBX('run.fbx');
      const fbx3 = await loadFBX('jump.fbx');
      animations["idle"] = fbx1
      animations["run"] = fbx2
      animations["jump"] = fbx3
      // Process and store the loaded animations and skins
    } catch (error) {
      console.error('Error loading assets:', error);
    }
}

await loadAssets()
console.log(animations)

let playerId;
let keysPressedFromServer = {}
const socket = io(`http://64.226.64.79`);

socket.on("playerId", (id) => {
    playerId = id;
    console.log(playerId)
})

// Wait for more player
const centeredText = document.createElement('div');
centeredText.textContent = 'Waiting for more players...';
centeredText.classList.add('centered-text');
document.body.appendChild(centeredText);

socket.on("playerNum", num => {
    console.log(num)
    if (num == 2){
        initialize()
        loadModel()
    }
    else {
        let objectsToRemove = []
        // Loop through the children of the scene
        clear()
        if (scene !== undefined){
            scene.traverse((child) => {
                objectsToRemove.push(child);
            });
            objectsToRemove.forEach((object) => {
                scene.remove(object);
            });
            renderer.domElement.remove()
        }
        document.body.appendChild(centeredText);
    }
})

socket.emit("join",0)

// load model and animation
let player
let player2
function loadModel(){
    player = new ModelLoader(scene, "../../models/static/", "mouse.fbx", animations, orbit, camera, phy, gameMap, true, null)
    player.load()
    player2 = new ModelLoader(scene, "../../models/static/", "mouse.fbx", animations, orbit, camera2, phy, gameMap, false, null)
    player2.load()
    setTimeout(main, 2000)
}

const keysPressed = {}

function keyDownEvent(event){
    socket.emit("playerMovementKeyDown", event.key)
    keysPressed[event.key.toLowerCase()] = true
}

function keyUpEvent(event){
    socket.emit("playerMovementKeyUp", event.key)
    if (event.key == "e"){
        let throwable = false;
        throwable = player.plantBomb()
        if (throwable){
            socket.emit("plantBomb", {pos:player.getPos(),quaternion:player.getQuaternion()})
        }
    }
    else {
        keysPressed[event.key.toLowerCase()] = false
    }
}

function playerStatesFunction(players){
    let keys = Object.keys(players)
    if (keys.length == 2){
      if (keys[0] == playerId){
          keysPressedFromServer = players[keys[1]]
      }
      else {
          keysPressedFromServer = players[keys[0]]
      }
    }
}

function updateCameraFunction(cameras){
    let keys = Object.keys(cameras)
    let cameraInfo;
    if (keys.length == 2){
        if (keys[0] == playerId){
            cameraInfo = cameras[keys[1]]
            updateCamera(camera2, cameraInfo)
        }
        else {
            cameraInfo = cameras[keys[0]]
            updateCamera(camera2, cameraInfo)
        }
    }
}

function updatePlayerPosEvent(playerPos){
    let keys = Object.keys(playerPos)
    let pos;
    if (keys.length == 2){
        if (keys[0] == playerId){
            pos = playerPos[keys[1]]
            player2.setBodyPos(pos);
        }
        else {
            pos = playerPos[keys[0]]
            player2.setBodyPos(pos);
        }
    }
}

function plantBombEvent(bombInfo){
    let id = bombInfo.id;
    if (id !== playerId){
        let pos = bombInfo.pos;
        let quaternion = bombInfo.quaternion;
        let bomb = new Bomb(pos, quaternion, phy, gameMap);
    }
}

function main(){

    centeredText.remove()

    document.body.appendChild(renderer.domElement)

    // keyboard event listener
    document.removeEventListener("keydown", keyDownEvent)
    document.removeEventListener("keyup", keyUpEvent)
    document.addEventListener("keydown", keyDownEvent)
    document.addEventListener("keyup", keyUpEvent)
    
    // Listen events from server
    socket.on('playerStates', playerStatesFunction);
    socket.on("updateCamera", updateCameraFunction)
    socket.on("updatePlayerPos", updatePlayerPosEvent)
    socket.on("plantBomb", plantBombEvent)
    
    updatePlayerPosEmit = setInterval(() => {
        socket.emit('updatePlayerPos', player.getBodyPos());
    }, 10);
    
    updateCameraEmit = setInterval(() => {
        socket.emit('updateCamera', ({"pos":camera.position, "rotation":camera.rotation}));
    }, 1);
    
    
    // add light
    var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 ); // color, intensity
    directionalLight.position.set( 1, 1, 1 ); // position
    // Increase the intensity of the directional light
    directionalLight.intensity = 1.3;
    scene.add( directionalLight );
    
    
    // test area
    // const explosionPosition = new THREE.Vector3(0, 0, 0);
    // let explosion = createExplosion(explosionPosition);
    // scene.add(explosion);
    
    
    // animation
    let clock = new THREE.Clock();
    
    function animate() {
        phy.update();
        // phy.movePlayer();
        let updateDelta = clock.getDelta();
        if (player.characterController){
            player.update(updateDelta, keysPressed)
        }
        if (player2.characterController){
            player2.update(updateDelta, keysPressedFromServer)
        }
        orbit.update()
    
    
        for (let i=0;i<explosions.length;i++){
            let explosion = explosions[i]
            const positions = explosion.geometry.attributes.position.array;
            const velocities = explosion.geometry.attributes.velocity.array;
        
            for (let i = 0; i < positions.length; i++) {
              positions[i] += velocities[i];
            }
        
            explosion.life -= 1;
            if (explosion.life <= 0) {
              explosion.geometry.dispose();
              explosion.material.dispose();
              scene.remove(explosion);
              explosions.splice(i, 1)
            } else {
              explosion.geometry.attributes.position.needsUpdate = true;
            }
          }
        
        renderer.render(scene, camera)
    
    }
    renderer.setAnimationLoop(animate)
}

window.addEventListener("resize", function(){
    camera.aspect = window.innerWidth / window.innerHeight,
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
})

// other functions
function updateCamera(camera, cameraInfo){
    camera.position.x = cameraInfo.pos.x
    camera.position.y = cameraInfo.pos.y
    camera.position.z = cameraInfo.pos.z
    camera.rotation._x = cameraInfo.rotation._x
    camera.rotation._y = cameraInfo.rotation._y
    camera.rotation._z = cameraInfo.rotation._z
}
