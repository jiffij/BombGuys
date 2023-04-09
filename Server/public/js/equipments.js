import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { bombConfig } from './config.js';
import { scene } from './client.js';
import { generateUUID } from './utils.js';


const equipmentCollections = {}
// const textureLoader = new THREE.TextureLoader();

// // Load the bomb texture
// const texture = textureLoader.load('../models/textures/bomb.jpg');
// // Create a material for the bomb using the texture
// const material = new THREE.MeshStandardMaterial({
//   map: texture,
// });

export class Equipments {
    equipment;
    position;
    uuid;
    quaternion;
    constructor(position, quaternion, physicsWorld, gameMap){
        this.position = position
        // this.radius = bombConfig.radius
        // this.timeInterval = bombConfig.bufferTime
        this.quaternion = quaternion
        this.physicsWorld = physicsWorld
        this.gameMap = gameMap

        this.init()

    }
    init(){
        const box = new THREE.BoxGeometry(0.5,0.5,0.5);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.equipment = new THREE.Mesh(box, material)
        this.uuid = generateUUID()
        equipmentCollections[this.uuid] = this
        this.place()
        console.log('equipment init');
    }
    place(){
        this.equipment.position.set(this.position.x, this.position.y + 0.5, this.position.z)
        this.physicsWorld.addEquipment(this.equipment, this.quaternion, this.uuid, this.position, this)
        scene.add(this.equipment)
        // try {
        //     this.remove()
        // }
        // catch{} 
    }
    remove(){
            
            scene.remove(this.equipment)
            this.physicsWorld.removeEquipment(this.uuid)
            // get position of exploded floors and check if there is other bombs on those floors
            delete equipmentCollections[this.uuid]
            delete this

    }
}