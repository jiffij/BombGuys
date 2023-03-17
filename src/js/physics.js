import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es/dist/cannon-es.js';
import { bodySphereRadius, bombConfig, bombForwardImpulse, bombUpImpulse, floorConfig, jumpImpulse, mapSize } from "./config.js";
import { generateUUID } from './utils.js';

let NUM_PLAYERS = 0

export class Player{
    constructor(fbx, position){
        this.body = new CANNON.Body({
            mass: 5,
            // type: CANNON.Body.STATIC,
            shape: new CANNON.Sphere(bodySphereRadius),
            // shape: new CANNON.Cylinder(0.3,0.00001,0,20),
            fixedRotation: true,
            // collisionFilterGroup: "PLAYER",
        });
        this.body.position.set(position[0], position[1], position[2]);
        this.fbx = fbx;
        this.id = NUM_PLAYERS++;
        this.impulse = new CANNON.Vec3(0, jumpImpulse, 0)
    }

    rotate(quarternion){
        this.body.quaternion.copy(quarternion)
    }

    move(x, z){
        this.body.position.x -= x;
        this.body.position.z -= z;
    }

    jump(){
        this.body.applyImpulse(this.impulse, this.body.position);
    }
}

class FloorTile{
    constructor(mesh, body){
        this.mesh = mesh;
        this.body = body;
    }
}

class PhysicsBomb{
    constructor(mesh, body){
        this.mesh = mesh;
        this.body = body;
    }

    delete(){
        delete this.mesh
        delete this.body
        delete this
    }
}


export class Physics{
    constructor() {
        this.physicsWorld = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.81, 0),
        });
        this.players = [];
        this.floorpieces = [];
        this.bombs = {};
        this.bombsShouldRemove = [];
    }

    addPlayer(fbx, position){
        const player = new Player(fbx, position)
        this.players.push(player);
        this.physicsWorld.addBody(player.body);
        return player;       
    }

    addFloorPiece(mesh){
        // const shape = new CANNON.Box(new CANNON.Vec3(floorConfig.shape, floorConfig.thickness, floorConfig.shape));
        const body = new CANNON.Body({
            mass: 0,
            type: CANNON.Body.STATIC,
            shape: new CANNON.Box(new CANNON.Vec3(floorConfig.shape, floorConfig.thickness, floorConfig.shape)),
            collisionFilterGroup: "FLOOR",
        });
        // body.position.set(new CANNON.Vec3(mesh.position.x, mesh.position.y, mesh.position.z));
        body.position.x = mesh.position.x;
        body.position.y = mesh.position.y;
        body.position.z = mesh.position.z;
        // body.quaternion.set(mesh.quaternion.x, mesh.quaternion.y, mesh.quaternion.z, mesh.quaternion.w);
        // body.quaternion.setFromEuler(-Math.PI/2,0,0);
        this.physicsWorld.addBody(body);

        this.floorpieces.push(new FloorTile(mesh, body));
    }

    addBomb(mesh, quaternion, uuid, player){
        const body = new CANNON.Body({
            mass: 1,
            shape: new CANNON.Sphere(bombConfig.radius),
            collisionFilterGroup: "BOMB",
            collisionFilterMask: "FLOOR",
            fixedRotation: true,
        });
        body.position.x = player.body.position.x;
        body.position.y = mesh.position.y + 0.3; // it will touch the player otherwise
        body.position.z = player.body.position.z;
        this.physicsWorld.addBody(body);

        // todo: add up and forward impulse
        const bombUpImpul = new CANNON.Vec3(0,bombUpImpulse,0)
        body.applyImpulse(bombUpImpul, body.position)

        //calculate the direction in physics world
        const euler = new THREE.Euler().setFromQuaternion(quaternion);
        var yRotation = euler.y;
        if(euler.x < -1.5){
            yRotation = -yRotation
            yRotation = yRotation + Math.PI
        } else if (yRotation < 0){
            yRotation = Math.PI * 2 + yRotation
        }
        const length = 10;
        const Z = Math.cos(yRotation) * length;
        const X = Math.sin(yRotation) * length;
        // console.log(X, Z)
      
        const bombForwardImpul = new CANNON.Vec3(X, 0, Z);

        body.applyImpulse(bombForwardImpul, body.position)


        body.addEventListener("collide", function(e){
            console.log("collide")
            console.log(e)
            // console.log(typeof(e.body.shapes[0]))
            if (e.body.mass == 0){
                if (!this.bombsShouldRemove.includes(uuid)){
                    this.bombsShouldRemove.push(uuid)
                }
                // body.mass = 0
                // body.type = CANNON.Body.STATIC
            }
        }.bind(this))

        console.log("plant")
        // need a uuid
        this.bombs[uuid] = new PhysicsBomb(mesh, body);
    }

    remove(body){
        this.physicsWorld.removeBody(body);
    }

    removeBomb(uuid){
        let bomb = this.bombs[uuid]
        this.physicsWorld.removeBody(bomb.body)
        delete this.bombs[uuid]
    }

    removeFloor(){
        for(let i = 0; i < this.floorpieces.length/2; i++){
            this.remove(this.floorpieces[i].body);
            console.log(i);
        }
        
    }

    movePlayer(id, x, z){
        // const speed = 5;
        this.players[id].body.position.x -= x;
        this.players[id].body.position.z -= z;
    }

    update() {
        // Step the Cannon.js simulation forward in time
        // this.world.step(deltaTime);
        this.physicsWorld.fixedStep();
        for (let shouldRemove of this.bombsShouldRemove){
            this.removeBomb(shouldRemove)
        }
        this.bombsShouldRemove = []
        // Update the position of each mesh based on its corresponding body
        for (let i = 0; i < this.players.length; i++) {
            const fbx = this.players[i].fbx;
            const body = this.players[i].body;
            fbx.position.y = body.position.y - bodySphereRadius+0.02
            fbx.position.x = body.position.x
            fbx.position.z = body.position.z
        // fbx.quaternion.copy(body.quaternion);
        }
        const keys = Object.keys(this.bombs)
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i]
            let bomb = this.bombs[key]
            const mesh = bomb.mesh;
            const body = bomb.body;
            mesh.position.y = body.position.y
            mesh.position.x = body.position.x
            mesh.position.z = body.position.z
        }
    }
}

