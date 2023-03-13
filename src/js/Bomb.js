// the bomb class should be a sphere with proper texture
// character be able to throw a bomb
// bomb is placed at the center of a piece
// after fixed amount of time the bomb will explode

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { bombConfig } from './config.js';


export class Bomb {
    bomb;
    scene;
    position;
    radius;
    timeInterval;
    constructor(scene, position){
        this.scene = scene
        this.position = position
        this.radius = bombConfig.radius
        this.timeInterval = bombConfig.bufferTime
        this.init()
    }
    init(){
        let sphere = new THREE.SphereGeometry(this.radius,45,30);
        let texture = new THREE.MeshBasicMaterial( { color: 0x123421 } );
        this.bomb = new THREE.Mesh(sphere, texture)
        this.place()
    }
    place(){
        this.bomb.position.set(this.position.x, this.position.y + this.radius, this.position.z)
        console.log(this.bomb)
        this.scene.add(this.bomb)
        setTimeout(this.remove.bind(this), this.timeInterval)
    }
    remove(){
        this.scene.remove(this.bomb)
        delete this
    }
}