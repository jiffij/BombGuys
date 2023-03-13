import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es/dist/cannon-es.js';
import { floorConfig, mapSize } from "./config.js";

let NUM_PLAYERS = 0

export class Player{
    constructor(fbx, position){
        this.body = new CANNON.Body({
            mass: 5,
            // type: CANNON.Body.STATIC,
            shape: new CANNON.Sphere(0.3), //CANNON.Cylinder(0.3,0.3,1,20),
            fixedRotation: true,
        });
        this.body.position.set(position[0], position[1], position[2]);
        this.fbx = fbx;
        this.id = NUM_PLAYERS++;
    }

    move(x, z){
        this.body.position.x -= x;
        this.body.position.z -= z;
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
        // const player = new CANNON.Body({
        //     mass: 5,
        //     shape: new CANNON.Sphere(0.3), //CANNON.Cylinder(0.3,0.3,1,20),
        // });
        // player.position.set(position[0], position[1], position[2]);
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
        fbx.position.copy(body.position);
        // fbx.quaternion.copy(body.quaternion);
        }
    }
}

// export class PhysicsWorld {
//     constructor() {
//         // Create a new Cannon.js world
//         this.world = new CANNON.World();

//         // Set the gravity of the world
//         this.world.gravity.set(0, -9.82, 0);

//         // Set up collision detection
//         this.bodies = [];
//     //   this.world.addEventListener('beginContact', event => {
//     //     const bodyA = event.bodyA;
//     //     const bodyB = event.bodyB;
//     //     // Do something when two bodies collide
//     //   });
//     }

//     addBody(mesh, mass = 0) {
//         // Create a new Cannon.js body
//         const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1)); // Example shape
//         const body = new CANNON.Body({
//         mass: mass,
//         shape: shape
//         });
//         body.position.copy(mesh.position);
//         body.quaternion.copy(mesh.quaternion);

//         // Add the body to the world and the bodies array
//         this.world.addBody(body);
//         this.bodies.push({ mesh: mesh, body: body });

//         // Update the mesh position in the animation loop
//         mesh.userData.physicsBody = body;
//     }

    // update(deltaTime) {
    //     // Step the Cannon.js simulation forward in time
    //     this.world.step(deltaTime);

    //     // Update the position of each mesh based on its corresponding body
    //     for (let i = 0; i < this.bodies.length; i++) {
    //     const mesh = this.bodies[i].mesh;
    //     const body = this.bodies[i].body;
    //     mesh.position.copy(body.position);
    //     mesh.quaternion.copy(body.quaternion);
    //     }
    // }
// }
