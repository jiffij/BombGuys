// create the map
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import { floorConfig, mapSize } from "./config.js";
import { FloorPiece } from "./FloorPiece.js";
import { Physics } from './physics.js';

export class GameMap {
    floorPieces = [];
    colorSwitch = "color1";

    constructor(scene, physicsWorld){
        this.scene = scene;
        this.physicsWorld = physicsWorld;
    }

    setup(){
        const size = floorConfig.size;
        const color1 = floorConfig.color1;
        const color2 = floorConfig.color2;
        const thickness = floorConfig.thickness;
    
        let color;
        for (let i=0; i<mapSize; i++) {
            let posX = i - Math.round(mapSize/2)
            if (mapSize % 2 == 0){
                color = this.switchColor(color1, color2)
            }
            for (let j=0; j<mapSize; j++){
                let posY = j - Math.round(mapSize/2)
                const geometry = new THREE.BoxGeometry( size, thickness, size );
                color = this.switchColor(color1, color2)
                const material = new THREE.MeshLambertMaterial( {
                    color: color,
                    aoMapIntensity: 0.5,
                    refractionRatio: 0.5
                } );
                const cube = new THREE.Mesh( geometry, material );
                cube.position.set(posX, -thickness, posY)
                this.floorPieces.push(cube)
                this.scene.add( cube );
                this.physicsWorld.addFloorPiece(cube);
            }
        }
    }

    randomDelete(){
        const length = this.floorPieces.length;
        const randomNum = Math.floor(Math.random()*length);
        const removedPiece = this.floorPieces.splice(randomNum,1)[0]
        this.scene.remove(removedPiece)
        this.physicsWorld.removeFloor();
    }
    
    switchColor(color1, color2){
        if (this.colorSwitch == "color1"){
            this.colorSwitch = "color2"
            return color1
        }
        else {
            this.colorSwitch = "color1"
            return color2
        }
    }
}

