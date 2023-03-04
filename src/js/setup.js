// create the map
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import { floorConfig, mapSize } from "./config.js";
import { FloorPiece } from "./FloorPiece.js";


export class GameMap {
    floorPieces = [];
    colorSwitch = "color1";

    constructor(scene){
        this.scene = scene
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
                cube.position.set(posX, 0, posY)
                this.floorPieces.push(cube)
                this.scene.add( cube );
            }
        }
    }

    randomDelete(){
        console.log("delete a piece")
        const length = this.floorPieces.length;
        const randomNum = Math.floor(Math.random()*length);
        const removedPiece = this.floorPieces.splice(randomNum,1)[0]
        console.log(removedPiece)
        console.log(randomNum)
        this.scene.remove(removedPiece)
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

