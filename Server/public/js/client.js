import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
import { ModelLoader } from './ModelLoader.js';
import { GameMap } from './GameMap.js';
import { Physics } from './physics.js';
import { io } from 'https://cdn.skypack.dev/socket.io-client@4.4.1';
import { Bomb } from './Bomb.js';
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';
import { BombPower, dev, serverIp } from './config.js';
import { Equipments } from './equipments.js';
import { EquipmentDisplayManager } from './equipmentDisplay.js';
import { SPACE } from './utils.js';
import { stateMachine } from './StateMachine.js';


// global variables
let playerId;
let keysPressedFromServer = {}
export let socket;

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
export let player
export let player2
let machine;

// setInterval function id
let updatePlayerPosEmit;

// load skin and animation
const animations = {}
let skin1;
let skin2;
let fbx1
let fbx2
let fbx3

// Load floor texture
export let stoneTexture;
export let woodTexture;
export let metalTexture;

// Create a material for the bomb using the texture
export let bombMaterial
export let bomb1
export let bomb2

// equipment
export let rocket
export let shoes
export let star

// html components
let startButton;
let centeredText;
let modal;

// in game
let inGame = false;

// game end sentence
let gameEndWords = "Game Over!"

// equipments
export let equipmentDisplayManager;

let posSet = false


// load animations
function loadAnimation(url) {
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

function loadFBX(url) {
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

function loadGLB(url){
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.setPath("../../models/static/")
        loader.load(
          url,
          (glb) => {
            resolve(glb.scene);
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
        const textureLoader = new THREE.TextureLoader();
        [
            fbx1,
            fbx2,
            fbx3,
            skin1,
            skin2,
            stoneTexture,
            woodTexture,
            metalTexture,
            rocket,
            shoes,
            bomb1,
            bomb2,
            star,
        ] = await Promise.all([
            loadAnimation('idle.fbx'),
            loadAnimation('run.fbx'),
            loadAnimation('jump.fbx'),
            loadFBX('mouse.fbx'),
            loadFBX('mouse.fbx'),
            textureLoader.load('../models/textures/stone.jpg'),
            textureLoader.load('../models/textures/wood.jpg'),
            textureLoader.load('../models/textures/metal.jpg'),
            loadFBX('rocket.fbx'),
            loadFBX('cartoonShoes.fbx'),
            loadGLB('bomb1.glb'),
            loadGLB('bomb2.glb'),
            loadGLB('star.glb'),
        ]);
            rocket.scale.set(0.002,0.002,0.002)
            shoes.scale.set(0.3,0.3,0.3)
            bomb1.scale.set(0.025,0.025,0.025)
            bomb2.scale.set(0.005,0.005,0.005)
            star.scale.set(0.3,0.3,0.3)
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
    // // Disable rotation in the z direction
    orbit.minPolarAngle = Math.PI / 6; // Set minimum vertical rotation to 90 degrees (pointing upwards)
    orbit.maxPolarAngle = Math.PI / 2; // Set maximum vertical rotation to 90 degrees (pointing downwards)
    orbit.update()

    // physics
    phy = new Physics();

    // initialize equipment manager
    equipmentDisplayManager = new EquipmentDisplayManager()
}


function clear(){
    if (renderer !== undefined){
        renderer.setAnimationLoop(null)
    }
    clearInterval(updatePlayerPosEmit)
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
    })
    
    socket.on("startGame", ([gameMapInfo,playerInitialPos,id]) => {
        playerId = id;
        initialize()
        // create map
        gameMap = new GameMap(scene, phy, gameMapInfo)
        gameMap.setup();
        loadModel(playerInitialPos)
        main()
    })
    socket.emit("join",0)
}

// load model and animation
function loadModel(playerInitialPos){
    let player1pos;
    let player2pos;
    let keys = Object.keys(playerInitialPos);
    for (let key of keys){
        if (key == playerId){
            player1pos = playerInitialPos[key];
        }
        else {
            player2pos = playerInitialPos[key];
        }
    }
    console.log(playerInitialPos)
    player2 = new ModelLoader(scene, skin2, animations, orbit, camera2, phy, gameMap, false, player2pos, 'enemy')
    player2.load()
    player = new ModelLoader(scene, skin1, animations, orbit, camera, phy, gameMap, true, player1pos, 'myself')
    player.load()
    machine = new stateMachine(phy, scene)
}

const keysPressed = {}

function keyDownEvent(event){
    // socket.emit("playerMovementKeyDown", event.key)
    keysPressed[event.key.toLowerCase()] = true
    if (event.key == SPACE){
        player.jump();
    }
}

function keyUpEvent(event){
    // socket.emit("playerMovementKeyUp", event.key)
    if (event.key == "e"){
        let throwable = false;
        throwable = player.plantBomb()
        if (throwable){
            socket.emit("plantBomb", {pos:player.getPos(),quaternion:player.getQuaternion(),power:player.getPower()})
        }
    }
    else {
        keysPressed[event.key.toLowerCase()] = false
    }
}

function playerJump(playerPos){
    let keys = Object.keys(playerPos)
    let pos;
    if (keys.length == 2){
        if (keys[0] == playerId){
            pos = playerPos[keys[1]]
        }
        else {
            pos = playerPos[keys[0]]
        }

        if (!player2.isJumping()){
            player2.setBodyPos(pos)    
            player2.jump();     
        }
    }
}

function updatePlayerPosEvent(playerPos){
    let keys = Object.keys(playerPos)
    let pos;
    let actualPos = player2.getBodyPos()
    if (keys.length == 2){
        if (keys[0] == playerId){
            pos = playerPos[keys[1]]
        }
        else {
            pos = playerPos[keys[0]]
        }
        if (posSet && (Math.abs(pos.y-actualPos.y)<2)){
            player2.setDestination(pos)
        }
        else {
            player2.setBodyPos(pos)
            posSet = true
        }    
    }
}

function plantBombEvent(bombInfo){
    let pos = bombInfo.pos;
    let quaternion = bombInfo.quaternion;
    let power = bombInfo.power;
    let bomb = new Bomb(pos, quaternion, phy, gameMap, true, BombPower[power]);
}

function makeEquip(equip){
    new Equipments(equip.position, equip.quaternion, phy, gameMap, equip.tool, true);
}

function main(){
    inGame = true
    setTimeout(function (){
        document.body.style.backgroundImage = "none"
        document.body.innerHTML = ""
        renderer.domElement.setAttribute('id', 'scene');
        document.body.appendChild(renderer.domElement)
    }, 3000)

    // keyboard event listener
    document.removeEventListener("keydown", keyDownEvent)
    document.removeEventListener("keyup", keyUpEvent)
    document.addEventListener("keydown", keyDownEvent)
    document.addEventListener("keyup", keyUpEvent)
    
    // Listen events from server
    socket.on("updatePlayerPos", updatePlayerPosEvent)
    socket.on("plantBomb", plantBombEvent)
    socket.on("playerJump", playerJump)
    socket.on("genEquip", makeEquip);
    
    updatePlayerPosEmit = setInterval(() => {
        socket.emit('updatePlayerPos', player.getPos());
    }, 50);
    
    
    // add light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    // Add DirectionalLight
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Set color and intensity
    directionalLight.position.set(1, 1, 1); // Set light position (x, y, z)
    scene.add(directionalLight);

    // Add PointLight
    const pointLight = new THREE.PointLight(0xffffff, 0.8, 100); // Set color, intensity, and distance

    const ambientLightIntensity = 0.6;
    const directionalLightIntensity = 0.3;
    const pointLightIntensity = 0.4;

    ambientLight.intensity = ambientLightIntensity;
    directionalLight.intensity = directionalLightIntensity;
    pointLight.intensity = pointLightIntensity;

    pointLight.position.set(0, 10, 0);
    // Set the PointLight position relative to the camera

    // Add the PointLight to the scene
    scene.add(pointLight);

    // test area
    // const explosionPosition = new THREE.Vector3(0, 0, 0);
    // let explosion = createExplosion(explosionPosition);
    // scene.add(explosion);
    
    // Pre-compile shaders for the scene
    renderer.compile(scene, camera);
    let firstRender = true;
    posSet = false;

    // animation
    let clock = new THREE.Clock();
    
    function animate() {

        pointLight.position.copy(camera.position);
        pointLight.position.y += 10; // Adjust the Y-offset as needed
        pointLight.position.z += 5; // Adjust the Y-offset as needed
        pointLight.position.x += 5; // Adjust the Y-offset as needed

        if (firstRender){
            // let bomb = new Bomb(player.getBodyPos(), player.model.quaternion, phy, gameMap, true)
            // setTimeout(bomb.remove(), 1000)
            let bomb = new Bomb([1000,1000,1000], player.model.quaternion, phy, gameMap, true, BombPower[1])
            let bomb2 = new Bomb([1000,1000,1000], player.model.quaternion, phy, gameMap, true, BombPower[2])
            player2.setBodyPos(player.getBodyPos())
            firstRender = false;
        }
        renderer.render(scene, camera)

        phy.update();
        machine.update();
        let updateDelta = clock.getDelta();
        if (player.characterController){
            player.update(updateDelta, keysPressed)
        }
        if (player2.characterController){
            player2.update(updateDelta, keysPressedFromServer)
        }
        orbit.update()
    
        // check win or lose
        if (player.isAlive() == false){
            if (inGame) {
                gameEndWords = "You Lose!"
                console.log("lose")
                gameEnd()
                inGame = false
            }
        }

        if (player2.isAlive() == false){
            if (inGame) {
                gameEndWords = "You Win!"
                console.log("win")
                gameEnd()
                inGame = false
            }
        }

        // equipment rotate
        scene.traverse((object) => {
            if (object.isEquipment === true){
                object.rotation.y += 1 * updateDelta;
            }
        })

        // explosion
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
        
        gameMap.layer.rotation.z += 0.01;
    }
    renderer.setAnimationLoop(animate)
}

window.addEventListener("resize", function(){
    camera.aspect = window.innerWidth / window.innerHeight,
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
})

// other functions

// gameend: go back to start screen or directly join another game
// a window to select
function popupWindow(){
    disconnectFromServer()
    // keyboard event listener
    document.removeEventListener("keydown", keyDownEvent)
    document.removeEventListener("keyup", keyUpEvent)

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
