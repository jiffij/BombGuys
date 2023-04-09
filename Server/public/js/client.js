import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
import { ModelLoader } from './ModelLoader.js';
import { GameMap } from './GameMap.js';
import { Physics } from './physics.js';
import { io } from 'https://cdn.skypack.dev/socket.io-client@4.4.1';
import { Bomb } from './Bomb.js';
import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import { dev, serverIp } from './config.js';


// global variables
let playerId;
let keysPressedFromServer = {}
let socket;

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

// players
let player
let player2

// setInterval function id
let updatePlayerPosEmit;
let updateCameraEmit;

// load skin and animation
const animations = {}
let skin1;
let skin2;

// html components
let startButton;
let centeredText;
let modal;

// in game
let inGame = false;

// game end sentence
let gameEndWords = "Game Over!"

// waiting room id
let waitingRoomId;


// load animations
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

function loadSkin(url) {
    return new Promise((resolve, reject) => {
        const loader = new FBXLoader();
        loader.setPath("../../models/static/")
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
      skin1 = await loadSkin('mouse.fbx');
      skin2 = await loadSkin('mouse.fbx');
      animations["idle"] = fbx1
      animations["run"] = fbx2
      animations["jump"] = fbx3
      // Process and store the loaded animations and skins
    } catch (error) {
      console.error('Error loading assets:', error);
    }
}

await loadAssets()


function createMainPage(){
    console.log("creating main page")
    document.body.style.backgroundImage = "url('../img/background.png')";
    document.body.innerHTML = '';

    let container = document.createElement('div');
    container.setAttribute('class', 'container');
    container.setAttribute('id', 'home');

    let input = document.createElement('input');
    input.setAttribute('type', 'text');
    input.setAttribute('placeholder', 'Room Id / Leave it empty to start now');

    startButton = document.createElement('button');
    startButton.setAttribute('id', 'start_btn');
    startButton.textContent = 'Start now';
    startButton.onclick = enterWaitRoom

    container.appendChild(input);
    container.appendChild(startButton);

    document.body.appendChild(container);
}

createMainPage()

function initialize(){
    // explosion
    explosions = []

    // setup scene and camera
    renderer = new THREE.WebGLRenderer()
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0xffc0cb, 1)
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


initialize()


// should be in waiting room function
function enterWaitRoom(){
    if (dev){
        socket = io(`http://localhost:3000`);
    }
    else {
        socket = io(`http://64.226.64.79`);
    }

    // send request to the server to create a room or to join a room
    socket.emit("joinRoom");

    // Wait for more player
    document.body.innerHTML = '';
    document.body.style.backgroundImage = "url('../img/background.png')";
    centeredText = document.createElement('div');
    centeredText.textContent = 'Waiting for more players...';
    centeredText.classList.add('centered-text');
    document.body.appendChild(centeredText);
    socket.on("playerId", (id) => {
        playerId = id;
        console.log(playerId)
    })
    
    socket.on("playerNum", num => {
        console.log(num)
        if (num == 2){
            initialize()
            loadModel()
            setTimeout(() => {
                document.body.style.backgroundImage = "none"
                main()
                inGame = true
            }, 500)
        }
        else {
            if (inGame) {
                gameEnd()
                inGame = false
            }
        }
    })
    
    socket.emit("join",0)
}

// load model and animation
function loadModel(){
    player = new ModelLoader(scene, skin1, animations, orbit, camera, phy, gameMap, true, null)
    player.load()
    player2 = new ModelLoader(scene, skin2, animations, orbit, camera2, phy, gameMap, false, null)
    player2.load()
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
    document.body.innerHTML = ""
    renderer.domElement.setAttribute('id', 'scene');
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
    }, 30);
    
    updateCameraEmit = setInterval(() => {
        socket.emit('updateCamera', ({"pos":camera.position, "rotation":camera.rotation}));
    }, 10);
    
    
    // add light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    // var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 ); // color, intensity
    // directionalLight.position.set( 1, 1, 1 ); // position
    // // Increase the intensity of the directional light
    // directionalLight.intensity = 1.3;
    // scene.add( directionalLight );
    
    
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

// gameend: go back to start screen or directly join another game
// a window to select
function popupWindow(){
    disconnectFromServer()
        // keyboard event listener
    document.removeEventListener("keydown", keyDownEvent)
    document.removeEventListener("keyup", keyUpEvent)
    document.addEventListener("keydown", keyDownEvent)
    document.addEventListener("keyup", keyUpEvent)

    modal = document.createElement('div');
    modal.setAttribute('id', 'myModal');
    modal.setAttribute('class', 'modal');

    let modalContent = document.createElement('div');
    modalContent.setAttribute('class', 'modal-content');

    let closeModal = document.createElement('span');
    closeModal.setAttribute('id', 'closeModal');
    closeModal.setAttribute('class', 'close');

    closeModal.innerHTML = '&times;';

    let modalText = document.createElement('p');
    modalText.textContent = gameEndWords;

    let replayButton = document.createElement('button');
    replayButton.setAttribute("class", "gameEndButton")
    replayButton.textContent = "replay"
    replayButton.onclick = function(){
        clearScene()
        enterWaitRoom()
    }

    let returnButton = document.createElement('button');
    returnButton.setAttribute("class", "gameEndButton")
    returnButton.textContent = "home"
    returnButton.onclick = function(){
        clearScene()
        createMainPage()
    }

    modalContent.appendChild(closeModal);
    modalContent.appendChild(modalText);
    modalContent.appendChild(replayButton);
    modalContent.appendChild(returnButton);
    modal.appendChild(modalContent);

    document.body.appendChild(modal);
    console.log("game ENDED")
    document.getElementById('closeModal').onclick = function() {
        document.getElementById('myModal').style.display = 'none';
    }
}

function clearScene(){
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
    }
    document.body.innerHTML = '';
}

function gameEnd(){
    popupWindow()
    // check return to start or enter waiting room
}

function disconnectFromServer() {
    socket.emit('disconnect_me');
}

function clearHTML(){
    
}

