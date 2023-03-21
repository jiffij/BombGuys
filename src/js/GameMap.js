// create the map
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import { bombConfig, floorConfig } from "./config.js";


export class GameMap {
    floorPieces = [];
    // 2d array containing 4 corner coords easier extract neighbor floor pieces
    floorPiecesPos = [];
    colorSwitch = "color1";
    size = floorConfig.size;
    color1 = floorConfig.color1;
    color2 = floorConfig.color2;
    thickness = floorConfig.thickness;
    layers = floorConfig.layers;
    height = floorConfig.height
    mapSize = floorConfig.mapSize

    constructor(scene, physicsWorld){
        this.scene = scene;
        this.physicsWorld = physicsWorld;
    }

    setup(){
        let color;
        for (let l=0; l<this.layers;l++){
            let posY = -this.thickness-l*this.height
            let layer = []
            let layerPos = []
            for (let i=0; i<this.mapSize; i++) {
                let row = [];
                let rowPos = [];
                let posX = (i - Math.round(this.mapSize/2))*this.size
                if (this.mapSize % 2 == 0){
                    color = this.switchColor(this.color1, this.color2)
                }
                for (let j=0; j<this.mapSize; j++){
                    let posZ = (j - Math.round(this.mapSize/2))*this.size
                    const geometry = new THREE.BoxGeometry( this.size, this.thickness, this.size );
                    color = this.switchColor(this.color1, this.color2)
                    const material = new THREE.MeshLambertMaterial( {
                        color: color,
                        aoMapIntensity: 0.5,
                        refractionRatio: 0.5
                    } );
                    const cube = new THREE.Mesh( geometry, material );
                    const coord = this.getFloorCoordFromCenter([posX, posY, posZ]);
                    console.log(coord)
                    rowPos.push(coord);
                    row.push(cube)
                    cube.position.set(posX, posY, posZ)
                    this.scene.add( cube );
                    this.physicsWorld.addFloorPiece(cube);
                }
                layer.push(row)
                layerPos.push(rowPos)
            }
            this.floorPiecesPos.push(layerPos)
            this.floorPieces.push(layer)
        }
    }

    
    switchColor(color1, color2){
        if (this.colorSwitch == "color1"){
            this.colorSwitch = "color2";
            return color1;
        }
        else {
            this.colorSwitch = "color1";
            return color2;
        }
    }

    removeFloor(pos){
        let [floor_l, floor_i, floor_j] = this.getRemoveFloorIndex(pos);
        if (floor_i !== undefined){
            const removedPiece = this.floorPieces[floor_l][floor_i][floor_j]
            this.scene.remove(removedPiece);
            this.physicsWorld.removeFloor(removedPiece);
        }
    }

    getRemoveFloorIndex(pos){
        let floor_i;
        let floor_j;
        let floor_l;
        let found = false
        for (let l=0; l<this.layers;l++){
            let layer = this.floorPiecesPos[l]
            for (let i=0; i<this.mapSize; i++){
                let row = layer[i];
                for (let j=0; j<this.mapSize; j++){
                    let piece = row[j];
                    if (piece.checkFallingIn(pos)){
                       floor_i = i;
                       floor_j = j; 
                       floor_l = l;
                       found = true;
                    }
                    if (found){
                        break;
                    }
                }
                if (found){
                    break;
                }
            }
            if (found){
                break;
            }
        }
        return [floor_l, floor_i, floor_j]

    }

    getFloorCoordFromCenter(pos_center){
        const x = pos_center[0];
        const y = pos_center[1];
        const z = pos_center[2];
        const left = x-this.size/2;
        const right = x+this.size/2;
        const bottom = z-this.size/2;
        const top = z+this.size/2;
        return new Coord(left, right, bottom, top, y);
    }
}


class Coord {
    constructor(left, right, bottom, top, y){
        this.left = left;
        this.right = right;
        this.bottom = bottom;
        this.top = top;
        this.y = y;
    }

    checkFallingIn(pos){
        const x = pos[0];
        const y = pos[1];
        const z = pos[2];

        // when multiple layers of floor need to check z
        if (x>=this.left && x<=this.right && z>=this.bottom && z<=this.top && Math.abs(this.y-y)<0.2+bombConfig.radius){
            console.log(y)
            return true;
        }
        return false;
    }
}
