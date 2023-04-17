import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { EQUIPMENT } from './config.js';
import { equipmentDisplayManager, rocket, scene, shoes, socket } from './client.js';
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
        this.bootIntervalId;
        this.gloveIntervalId;
        this.jetIntervalId;
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
        else {
            this.equipment = new THREE.Mesh(box, material)
        }
        this.uuid = generateUUID()
        equipmentCollections[this.uuid] = this
        this.place()
        console.log('equipment init');
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

    
    applyEquip(player){

        function keyupQ(e){
            if(e.key.toLocaleLowerCase() == 'q'){
                player.jet = false;
            }
        };

        function keydownQ(e){
            if(e.key.toLocaleLowerCase() == 'q'){
                player.jet = true;
                equipmentDisplayManager.removeJet();
            }
        }; 

        function keydownF(e){
            if(e.key.toLocaleLowerCase() == 'f'){
                player.reverseGravity();
            }
        }

        switch (this.tool) {
            case EQUIPMENT.BOOT:
                player.CharacterController.boost = true;
                clearInterval(this.bootIntervalId)
                this.bootIntervalIt = setTimeout(() => {
                    player.CharacterController.boost = false;
                    console.log('stop boost');
                }, 10000);
                console.log('boosted');
                break;

            case EQUIPMENT.JET:
                document.addEventListener('keydown', keydownQ);
                document.addEventListener('keyup', keyupQ);
                clearInterval(this.jetIntervalId)
                this.jetIntervalId = setTimeout(() => {
                    player.jet = false;
                    document.removeEventListener('keydown', keydownQ);
                    document.removeEventListener('keyup', keyupQ);
                    console.log('stop jet');
                }, 60000);
                console.log('Jet');
                break;
            
            case EQUIPMENT.GLOVE:
                document.addEventListener('keypress', keydownF);
                setTimeout(() => {
                    document.removeEventListener('keypress', keydownF);
                }, 10000);
                break;

            default:
                break;
        }
    }
}