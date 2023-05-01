// the bomb class should be a sphere with proper texture
// character be able to throw a bomb
// bomb is placed at the center of a piece
// after fixed amount of time the bomb will explode

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { BombPower, bombConfig } from './config.js';
import { bomb1, bomb2, scene } from './client.js';
import { explosions } from './client.js';
import { generateUUID } from './utils.js';
import { createExplosion } from './explosion.js';
import { bombMaterial } from './client.js';

const bombCollections = {}
// const textureLoader = new THREE.TextureLoader();

// // Load the bomb texture
// const texture = textureLoader.load('../models/textures/bomb.jpg');
// // Create a material for the bomb using the texture
// const bombMaterial = new THREE.MeshStandardMaterial({
//   map: texture,
// });

export class Bomb {
    bomb;
    position;
    radius;
    timeInterval;
    uuid;
    quaternion;
    constructor(position, quaternion, physicsWorld, gameMap, generateByServer, power, reverse, byPlayer){
        this.position = position
        this.radius = bombConfig.radius
        this.timeInterval = bombConfig.bufferTime
        this.quaternion = quaternion
        this.physicsWorld = physicsWorld
        this.gameMap = gameMap
        this.exploded = false
        this.generateByServer = generateByServer
        this.power = power
        this.reverse = reverse
        this.byPlayer = byPlayer
        this.init()

    }
    init(){
        if (this.power == BombPower[1]){
            this.bomb = bomb1.clone()
        }
        else if (this.power == BombPower[2]) {
            this.bomb = bomb2.clone()
        }

        // this.bomb.frustumCulled = false;
        this.uuid = generateUUID()
        bombCollections[this.uuid] = this
        this.place()
    }
    place(){
        this.bomb.position.set(this.position.x+0.5, this.position.y + this.radius + 0.5, this.position.z + 0.5)
        this.physicsWorld.addBomb(this.bomb, this.reverse, this.quaternion, this.uuid, this.position, this, this.byPlayer)
        scene.add(this.bomb)
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
        let pos = this.bomb.position
        if (this.exploded == false){
            let explosion = createExplosion(pos)
            explosions.push(explosion)
            scene.add(explosion)
            this.exploded = true
            let posReconstuct = [pos.x, pos.y, pos.z]
            this.gameMap.removeFloor(posReconstuct, this.generateByServer, this.power)
            scene.remove(this.bomb)
            this.physicsWorld.removeBomb(this.uuid)
            // get position of exploded floors and check if there is other bombs on those floors
            delete bombCollections[this.uuid]
            delete this
        }
    }
}