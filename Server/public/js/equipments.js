import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { EQUIPMENT } from './config.js';
import { equipmentDisplayManager, rocket, scene, shoes, socket, star } from './client.js';
import { generateUUID } from './utils.js';
import './client.js';


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
    constructor(position, quaternion, physicsWorld, gameMap, tool, generateByServer){
        this.position = position
        this.quaternion = quaternion
        this.physicsWorld = physicsWorld
        this.gameMap = gameMap
        this.tool = tool; // randomly select an equipment
        this.generateByServer = generateByServer
        this.removed = false
        this.init()

    }
    init(){
        const box = new THREE.BoxGeometry(0.5,0.5,0.5);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        if (this.tool == EQUIPMENT.BOOT){
            this.equipment = shoes;
        }
        else if (this.tool == EQUIPMENT.JET){
            this.equipment = rocket;
        }
        else if (this.tool == EQUIPMENT.POWER){
            this.equipment = star;
        }
        // else if (this.tool == EQUIPMENT.POWER){
        //     this.equipment = star;
        // }
        else {
            this.equipment = new THREE.Mesh(box, material)
        }
        this.equipment.isEquipment = true;
        this.uuid = generateUUID()
        equipmentCollections[this.uuid] = this
        this.place()
        if (!this.generateByServer){
            socket.emit("createEquip", {
                position: this.position,
                quaternion: this.quarternion,
                tool: this.tool,
            })
        }
    }
    place(){
        this.equipment.position.set(this.position.x, this.position.y + 0.5, this.position.z)
        this.physicsWorld.addEquipment(this.equipment, this.quaternion, this.uuid, this.position, this)
        scene.add(this.equipment)
    }
    remove(){
        scene.remove(this.equipment)
        this.physicsWorld.removeEquipment(this.uuid)

        // get position of exploded floors and check if there is other bombs on those floors
        delete equipmentCollections[this.uuid]
        delete this
    }

    
    applyEquip(player){
        switch (this.tool) {
            case EQUIPMENT.BOOT:
                player.CharacterController.boost = true;
                clearTimeout(player.bootTimeoutId)
                player.bootTimeoutId = setTimeout(() => {
                    player.CharacterController.boost = false;
                }, 10000);
                break;

            case EQUIPMENT.JET:
                player.jet = true;
                clearTimeout(player.jetTimeoutId)
                player.jetTimeoutId = setTimeout(() => {
                    player.jet = false;
                }, 10000);
                break;
            
            case EQUIPMENT.POWER:
                player.CharacterController.power = 2;
                clearTimeout(player.powerTimeoutId)
                player.powerTimeoutId = setTimeout(() => {
                    player.CharacterController.power = 1;
                }, 10000);
                break;

            case EQUIPMENT.REVERSE:
                player.CharacterController.reverse = true;
                if (player.reverseTimeoutId !== undefined) {
                    clearTimeout(player.reverseTimeoutId)
                  }
                player.reverseTimeoutId = setTimeout(() => {
                    player.CharacterController.reverse = false;
                }, 15000);
                break;

            default:
                break;
        }
    }
}