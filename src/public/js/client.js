import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
import { ModelLoader } from './ModelLoader.js';
import { GameMap } from './GameMap.js';
import { Physics } from './physics.js';
import { io } from 'https://cdn.skypack.dev/socket.io-client@4.4.1';
import { Bomb } from './Bomb.js';
import { createExplosion } from './explosion.js';


// explosion
export let explosions = []

// setup scene and camera
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)
export const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth/window.innerHeight,
    0.1,
    1000
)
camera.position.set(5,1,1)
// for player2
const camera2 = new THREE.PerspectiveCamera(
    75,
    window.innerWidth/window.innerHeight,
    0.1,
    1000
)
camera2.position.set(5,1,1)


// orbit control
const orbit = new OrbitControls(camera, renderer.domElement)
orbit.minDistance = 2
orbit.maxDistance = 3
// Disable rotation in the z direction
orbit.minPolarAngle = Math.PI / 7; // Set minimum vertical rotation to 90 degrees (pointing upwards)
orbit.maxPolarAngle = Math.PI / 3; // Set maximum vertical rotation to 90 degrees (pointing downwards)
orbit.update()

// physics
const phy = new Physics();

// create map
const gameMap = new GameMap(scene, phy)
gameMap.setup();


// load model and animation
const player = new ModelLoader(scene, "../../models/static/", "mouse.fbx", "../../models/animation/",["walk.fbx","idle.fbx","run.fbx","jump.fbx"],[0.007,0.007,0.007], orbit, camera, phy, gameMap, true)
player.load()
const player2 = new ModelLoader(scene, "../../models/static/", "mouse.fbx", "../../models/animation/",["walk.fbx","idle.fbx","run.fbx","jump.fbx"],[0.007,0.007,0.007], orbit, camera2, phy, gameMap, false)
player2.load()

setTimeout(main, 3000)

function main(){
    let playerId;
    let keysPressedFromServer = {}
    const socket = io('http://localhost:3000');
    
    socket.on("playerId", (id) => {
        playerId = id;
        console.log(playerId)
    })
    
    setTimeout(function(){
        socket.emit("join",player.getPos())
    }, 1000)
    
    // keyboard event listener
    const keysPressed = {}
    document.addEventListener("keydown", function(event){
        socket.emit("playerMovementKeyDown", event.key)
        if (event.shiftKey){
            play = 'walk'
            player.characterController.switchRunToggle();
        }
        else {
            keysPressed[event.key.toLowerCase()] = true
        }
    }, false)
    
    document.addEventListener("keyup", function(event){
        socket.emit("playerMovementKeyUp", event.key)
        if (event.key == "e"){
            let throwable = false;
            throwable = player.plantBomb()
            console.log(throwable)
            if (throwable){
                socket.emit("plantBomb", {pos:player.getPos(),quaternion:player.getQuaternion()})
            }
        }
        else {
            keysPressed[event.key.toLowerCase()] = false
        }
    }, false)
    
    // Listen events from server
    socket.on('playerStates', (players) => {
        // Update the positions of the players in the game map
        let keys = Object.keys(players)
        if (keys.length == 2){
          if (keys[0] == playerId){
              keysPressedFromServer = players[keys[1]]
          }
          else {
              keysPressedFromServer = players[keys[0]]
          }
        }
      });
    
    socket.on("updateCamera", (cameras) => {
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
    })
    
    socket.on("updatePlayerPos", (playerPos) => {
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
    })
    
    socket.on("plantBomb", (bombInfo) => {
        let id = bombInfo.id;
        if (id !== playerId){
            let pos = bombInfo.pos;
            let quaternion = bombInfo.quaternion;
            let bomb = new Bomb(pos, quaternion, phy, gameMap);
        }
    })
    
    setInterval(() => {
        socket.emit('updatePlayerPos', player.getBodyPos());
    }, 10);
    
    setInterval(() => {
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

    window.addEventListener("resize", function(){
        camera.aspect = window.innerWidth / window.innerHeight,
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
    })
}

// other functions
function updateCamera(camera, cameraInfo){
    camera.position.x = cameraInfo.pos.x
    camera.position.y = cameraInfo.pos.y
    camera.position.z = cameraInfo.pos.z
    camera.rotation._x = cameraInfo.rotation._x
    camera.rotation._y = cameraInfo.rotation._y
    camera.rotation._z = cameraInfo.rotation._z
}
