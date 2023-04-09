// create the map
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import { bombConfig, floorConfig } from "./config.js";
import {Equipments} from "./equipments.js";

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
        let shouldRemove = this.getRemoveFloorIndex(pos);
        for (let [floor_l, floor_i, floor_j] of shouldRemove){
            const removedPiece = this.floorPieces[floor_l][floor_i][floor_j]
            this.scene.remove(removedPiece);
            this.physicsWorld.removeFloor(removedPiece);
        }
        const possible_positions = [];
        for (let t = 0; t < shouldRemove.length; t++) {
            const l = shouldRemove[t][0];
            const i = shouldRemove[t][1];
            const j = shouldRemove[t][2];
        
            for (let dx = -1; dx <= 1; dx++) {
              for (let dy = -1; dy <= 1; dy++) {
                // exclude the current position
                if (dx === 0 && dy === 0) {
                  continue;
                }
        
                // calculate the adjacent position
                const adjX = i + dx;
                const adjY = j + dy;
        
                // check if the adjacent position is not already in the group
                const isAdjacent = shouldRemove.some((p) => p[1] === adjX && p[2] === adjY);
                if (!isAdjacent) {
                  // add the adjacent position to the array
                  if(adjX >= 0 && adjX <= floorConfig.mapSize && adjY >= 0 && adjY <= floorConfig.mapSize){
                    possible_positions.push({l: l, i: adjX, j: adjY });
                  }
                }
              }
            }
          }
        if(possible_positions.length > 0){
            console.log(possible_positions);
            if(Math.random() > 0.5){
                const randomIndex = Math.floor(Math.random()*possible_positions.length);
                var p = possible_positions[randomIndex];
                var mesh = this.floorPieces[p.l][p.i][p.j];
                console.log(mesh.position, mesh.quaternion);
                const equip = new Equipments(mesh.position, mesh.quaternion, this.physicsWorld, this);
            }
        }
    }

    getRemoveFloorIndex(pos){
        let floor_i;
        let floor_j;
        let floor_l;
        let shouldRemove = []
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
                       shouldRemove.push([floor_l, floor_i, floor_j])
                    }
                }
            }
        }
        return shouldRemove

    }

    getFloorCoordFromCenter(pos_center){
        const x = pos_center[0];
        const y = pos_center[1];
        const z = pos_center[2];
        const left = x-this.size/2;
        const right = x+this.size/2;
        const bottom = z-this.size/2;
        const top = z+this.size/2;
        return new Coord(left, right, bottom, top, x, y, z);
    }
}


class Coord {
    constructor(left, right, bottom, top, x, y, z){
        this.left = left;
        this.right = right;
        this.bottom = bottom;
        this.top = top;
        this.x = x;
        this.y = y;
        this.z = z;
    }

    checkFallingIn(pos){
        const x = pos[0];
        const y = pos[1];
        const z = pos[2];

        // when multiple layers of floor need to check z
        if (Math.abs(this.y-y)<0.2+bombConfig.radius){
            if (Math.sqrt((x-this.x)**2+(z-this.z)**2) <= floorConfig.size){
                return true;
            }
            // if (x>=this.left && x<=this.right && z>=this.bottom && z<=this.top){
            //     console.log(y)
            //     return true;
            // }
        }
        return false;
    }
}
