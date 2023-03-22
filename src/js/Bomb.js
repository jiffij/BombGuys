// the bomb class should be a sphere with proper texture
// character be able to throw a bomb
// bomb is placed at the center of a piece
// after fixed amount of time the bomb will explode

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { bombConfig } from './config.js';
import { Physics } from './physics.js';
import { generateUUID } from './utils.js';

const bombCollections = {}
const textureLoader = new THREE.TextureLoader();

// Load the bomb texture
const texture = textureLoader.load('../models/textures/bomb.jpg');
// Create a material for the bomb using the texture
const material = new THREE.MeshStandardMaterial({
  map: texture,
});

export class Bomb {
    bomb;
    scene;
    position;
    radius;
    timeInterval;
    uuid;
    quaternion;
    constructor(scene, position, quaternion, physicsWorld, player, gameMap){
        this.scene = scene
        this.position = position
        this.radius = bombConfig.radius
        this.timeInterval = bombConfig.bufferTime
        this.quaternion = quaternion
        this.physicsWorld = physicsWorld
        this.player = player
        this.gameMap = gameMap
        this.init()

    }
    init(){
        let sphere = new THREE.SphereGeometry(this.radius,45,30);
        let texture = new THREE.MeshBasicMaterial( { color: 0x123421 } );
        this.bomb = new THREE.Mesh(sphere, material)
        this.uuid = generateUUID()
        bombCollections[this.uuid] = this
        this.place()
    }
    place(){
        this.bomb.position.set(this.position.x+0.5, this.position.y + this.radius + 0.5, this.position.z + 0.5)
        this.physicsWorld.addBomb(this.bomb, this.quaternion, this.uuid, this.player, this)
        this.scene.add(this.bomb)
        setTimeout(
            function (){
                try {
                    this.remove()
                }
                catch{}
            }.bind(this)
        ,this.timeInterval)
    }
    remove(){
        // try {
            let pos = this.bomb.position
            console.log(this.bomb.position.y)
            let posReconstuct = [pos.x, pos.y, pos.z]
            this.gameMap.removeFloor(posReconstuct)
            this.scene.remove(this.bomb)
            this.physicsWorld.removeBomb(this.uuid)
            // get position of exploded floors and check if there is other bombs on those floors
            delete bombCollections[this.uuid]
            delete this

        // }
        // catch {}
    }
}