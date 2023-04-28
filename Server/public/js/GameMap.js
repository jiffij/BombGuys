// create the map
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import { bombConfig, floorConfig, life_1, life_2 } from "./config.js";
import {Equipments} from "./equipments.js";
import { metalTexture, player, player2, stoneTexture, woodTexture } from './client.js';

export class GameMap {
    floorPieces = [];
    floorPiecesPos = [];
    floorPiecesLife = [];
    colorSwitch = "color1";
    size = floorConfig.size;
    color1 = floorConfig.color1;
    color2 = floorConfig.color2;
    thickness = floorConfig.thickness;
    layers = floorConfig.layers;
    height = floorConfig.height
    mapSize = floorConfig.mapSize
    layer;

    constructor(scene, physicsWorld, gameMapInfo){
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.gameMapInfo = gameMapInfo
    }

    setup(){
        for (let l=0; l<this.layers;l++){
            let posY = -this.thickness-l*this.height
            let layer = []
            let layerPos = []
            let layerLife = []
            for (let i=0; i<this.mapSize; i++) {
                let row = [];
                let rowPos = [];
                let rowLife = [];
                let posX = (i - Math.round(this.mapSize/2))*this.size
                for (let j=0; j<this.mapSize; j++){
                    let posZ = (j - Math.round(this.mapSize/2))*this.size
                    let color = this.gameMapInfo[l][i][j]["color"]
                    let life = this.gameMapInfo[l][i][j]["life"]
                    rowLife.push(life)
                    const geometry = new THREE.BoxGeometry( this.size, this.thickness, this.size );
                    let material = new THREE.MeshPhongMaterial( {
                        map: metalTexture
                    } );
                    if (life == 1){
                        material = new THREE.MeshPhongMaterial({
                            map: woodTexture
                          });
                    }
                    else if (life == 2){
                        material = new THREE.MeshPhongMaterial({
                            map: stoneTexture
                          });
                    }
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
                layerLife.push(rowLife)
            }
            this.floorPiecesPos.push(layerPos)
            this.floorPieces.push(layer)
            this.floorPiecesLife.push(layerLife)
        }

        // Create the layer
        const layerGeometry = new THREE.CircleGeometry(40, 64);
        const layerMaterial = new THREE.MeshStandardMaterial({
            color: 0xffc0cb,
            roughness: 0.2,
            metalness: 0.5,
            envMapIntensity: 0.2,

            map: generateTexture(),
        });
        this.layer = new THREE.Mesh(layerGeometry, layerMaterial);
        this.layer.rotation.x = -Math.PI / 2;
        this.layer.position.set(0,-25,0)
        this.scene.add(this.layer);
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

    removeFloor(pos, generateByServer, power){
        // affect player
        let pos1 = player.getPos();
        let pos2 = player2.getPos();
        if (Math.sqrt((pos1.x-pos[0])*(pos1.x-pos[0])+(pos1.y-pos[1])*(pos1.y-pos[1])+(pos1.z-pos[2])*(pos1.z-pos[2])) < power){
            player.affectByBomb()
        }
        if (Math.sqrt((pos2.x-pos[0])*(pos2.x-pos[0])+(pos2.y-pos[1])*(pos2.y-pos[1])+(pos2.z-pos[2])*(pos2.z-pos[2])) < power){
            player2.affectByBomb()
        }

        // remove floor
        let checkRemove = this.getRemoveFloorIndex(pos, power);
        let shouldRemove = []
        for (let [floor_l, floor_i, floor_j] of checkRemove){
            if (this.floorPiecesLife[floor_l][floor_i][floor_j] == 1){
                shouldRemove.push([floor_l, floor_i, floor_j])
                const removedPiece = this.floorPieces[floor_l][floor_i][floor_j]
                this.scene.remove(removedPiece);
                this.physicsWorld.removeFloor(removedPiece);
            }
            else {
                const piece = this.floorPieces[floor_l][floor_i][floor_j]
                this.floorPiecesLife[floor_l][floor_i][floor_j] -= 1;
                if (this.floorPiecesLife[floor_l][floor_i][floor_j] == 1){
                    piece.material.map = woodTexture
                    piece.material.needsUpdate = true
                }
                else {
                    piece.material.map = stoneTexture
                    piece.material.needsUpdate = true
                }
            }
        }
        // equipment generation
        if (!generateByServer){
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
                if(Math.random() > 0.1){
                    const randomIndex = Math.floor(Math.random()*possible_positions.length);
                    var p = possible_positions[randomIndex];
                    var mesh = this.floorPieces[p.l][p.i][p.j];
                    console.log(mesh.position, mesh.quaternion);
                    let toolType = 3
                    // let toolType = Math.floor(Math.random()*4)
                    const equip = new Equipments(mesh.position, mesh.quaternion, this.physicsWorld, this, toolType, false);
                }
            }
        }
    }

    getRemoveFloorIndex(pos, power){
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
                    if (piece.checkFallingIn(pos, power)){
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

function generateTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
  
    const context = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY);
  
    const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(255, 191, 207, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 128, 171, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 64, 135, 0)');
  
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
  
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
  
    return texture;
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

    checkFallingIn(pos, power){
        const x = pos[0];
        const y = pos[1];
        const z = pos[2];

        // when multiple layers of floor need to check z
        if (Math.abs(this.y-y)<0.2+bombConfig.radius){
            if (Math.sqrt((x-this.x)**2+(z-this.z)**2) <= power*3/4){
                return true;
            }
        }
        return false;
    }
}
