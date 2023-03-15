import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es/dist/cannon-es.js';
import { bodySphereRadius, floorConfig, jumpImpulse, mapSize } from "./config.js";

let NUM_PLAYERS = 0

export class Player{
    constructor(fbx, position){
        this.body = new CANNON.Body({
            mass: 5,
            // type: CANNON.Body.STATIC,
            shape: new CANNON.Sphere(bodySphereRadius),
            // shape: new CANNON.Cylinder(0.3,0.00001,0,20),
            fixedRotation: true,
        });
        this.body.position.set(position[0], position[1], position[2]);
        this.fbx = fbx;
        this.id = NUM_PLAYERS++;
        this.impulse = new CANNON.Vec3(0, jumpImpulse, 0)
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

export class Physics{
    constructor() {
        this.physicsWorld = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.81, 0),
        });
        // this.groundBody = new CANNON.Body({
        //     type: CANNON.Body.STATIC,
        //     shape: new CANNON.Plane(),
        // });
        // this.groundBody.quaternion.setFromEuler(-Math.PI/2,0,0);
        // this.physicsWorld.addBody(this.groundBody);

        // this.physicsWorld.addEventListener('beginContact', event => {
        // const bodyA = event.bodyA;
        // const bodyB = event.bodyB;

        // });
        this.players = [];
        this.floorpieces = [];
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

    remove(body){
        this.physicsWorld.removeBody(body);
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
        // this.players[0].velocity.x = 1;
        // this.players[0].velocity.set(0);
        // if (keyboard['KeyW']) {
        //     body.position.z -= speed * deltaTime;
        // }
        // if (keyboard['KeyS']) {
        //     body.position.z += speed * deltaTime;
        // }
        // if (keyboard['KeyA']) {
        //     body.position.x -= speed * deltaTime;
        // }
        // if (keyboard['KeyD']) {
        //     body.position.x += speed * deltaTime;
        // }
    }

    update() {
        // Step the Cannon.js simulation forward in time
        // this.world.step(deltaTime);
        this.physicsWorld.fixedStep();
        // Update the position of each mesh based on its corresponding body
        for (let i = 0; i < this.players.length; i++) {
        const fbx = this.players[i].fbx;
        const body = this.players[i].body;
        fbx.position.y = body.position.y - bodySphereRadius+0.02
        fbx.position.x = body.position.x
        fbx.position.z = body.position.z
        // fbx.quaternion.copy(body.quaternion);
        }
    }
}

