import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es/dist/cannon-es.js';
import { bodySphereRadius, bombConfig, bombForwardImpulse, bombUpImpulse, floorConfig, jumpImpulse, jetImpulse } from "./config.js";

let NUM_PLAYERS = 0
const PLAYER = 1;
const FLOOR = 2;
const BOMB = 3;
const EQUIPMENT = 4;
const RING = 5;

export class Player{
    constructor(fbx, position, playerId, CharacterController){
        this.body = new CANNON.Body({
            mass: 5,
            // type: CANNON.Body.STATIC,
            shape: new CANNON.Sphere(bodySphereRadius),
            // shape: new CANNON.Cylinder(0.3,0.00001,0,20),
            fixedRotation: true,
        });
        this.CharacterController = CharacterController;
        this.playerId = playerId;
        this.body.userData = {id: playerId};
        this.body.position.set(position[0], position[1], position[2]);
        this.body.collisionFilterGroup = PLAYER,
        this.body.collisionFilterMask = FLOOR | EQUIPMENT,
        this.fbx = fbx;
        this.id = NUM_PLAYERS++;
        this.impulse = new CANNON.Vec3(0, jumpImpulse, 0)
        this.jet = false;
        this.jetimpulse = new CANNON.Vec3(0, jetImpulse, 0)
        this.reverse = false;
        // this.boost_speed = 0;
        // this.body.addEventListener("collide", function(e){
        //     if (e.body.mass == 0){
                
        //     }
        // }.bind(this))
    }

    rotate(quarternion){
        this.body.quaternion.copy(quarternion)
    }

    move(x, z){
        this.body.position.x -= x;
        this.body.position.z -= z;
    }

    getPos(){
        return this.body.position;
    }

    setPos(pos){
        if (pos.x !==undefined){
            this.body.position.x = pos.x;
            this.body.position.y = pos.y;
            this.body.position.z = pos.z;
        }
    }

    getVerticalVelocity(){
        return this.body.velocity.y
    }

    reverseGravity(){
        if(this.reverse) return;
        console.log('reverse gravity');
        this.reverse = true;
        this.body.velocity.y += 10;
        setTimeout(() => {
            this.body.velocity.y -= 10;
            this.reverse = false;
        }, 3000);
    }

    jump(){
        if(this.jet){
            this.body.applyImpulse(this.jetimpulse, this.body.position);
        }else{
            this.body.applyImpulse(this.impulse, this.body.position);
        }
        
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

class PhysicsEquipment{
    constructor(mesh, body){
        this.mesh = mesh;
        this.body = body;
    }

    delete(){
        delete this.mesh;
        delete this.body;
        delete this;
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
        this.equipments = {};
    }

    addPlayer(fbx, position, playerId, CharacterController){
        const player = new Player(fbx, position, playerId, CharacterController)
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
        body.collisionFilterGroup = FLOOR;
        body.collisionFilterMask = PLAYER | BOMB | EQUIPMENT;
        // body.position.set(new CANNON.Vec3(mesh.position.x, mesh.position.y, mesh.position.z));
        body.position.x = mesh.position.x;
        body.position.y = mesh.position.y;
        body.position.z = mesh.position.z;
        // body.quaternion.set(mesh.quaternion.x, mesh.quaternion.y, mesh.quaternion.z, mesh.quaternion.w);
        // body.quaternion.setFromEuler(-Math.PI/2,0,0);
        this.physicsWorld.addBody(body);
        this.floorpieces.push(new FloorTile(mesh, body));
    }

    addBomb(mesh, quaternion, uuid, playerBodyPos, bombObject){
        const body = new CANNON.Body({
            mass: 1,
            shape: new CANNON.Sphere(bombConfig.bodyRadious),
            fixedRotation: true,
        });
        body.collisionFilterGroup = BOMB;
        body.collisionFilterMask = FLOOR;
        body.position.x = playerBodyPos.x;
        body.position.y = mesh.position.y + 0.3; // it will touch the player otherwise
        body.position.z = playerBodyPos.z;
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
        const length = bombForwardImpulse;
        const Z = Math.cos(yRotation) * length;
        const X = Math.sin(yRotation) * length;
        // console.log(X, Z)
      
        const bombForwardImpul = new CANNON.Vec3(X, 0, Z);

        body.applyImpulse(bombForwardImpul, body.position)


        body.addEventListener("collide", function(e){
            if (e.body.mass == 0){
                // if (!this.bombsShouldRemove.includes(uuid)){
                //     this.bombsShouldRemove.push(uuid)
                // }
                // body.type = CANNON.Body.STATIC
                body.velocity.set(0, 0, 0);
                setTimeout(
                    function (){
                        try {
                            bombObject.remove()
                        }
                        catch{}
                    }
                ,1500)

            }
        }.bind(this))
        this.bombs[uuid] = new PhysicsBomb(mesh, body);
    }

    addEquipment(mesh, quaternion, uuid, playerBodyPos, Object){
        const body = new CANNON.Body({
            mass: 2,
            shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
            fixedRotation: true,
        });
        body.collisionFilterGroup = EQUIPMENT,
        body.collisionFilterMask = FLOOR | PLAYER,
        body.position.x = mesh.position.x;
        body.position.y = mesh.position.y; // it will touch the player otherwise
        body.position.z = mesh.position.z;
        this.physicsWorld.addBody(body);

        body.addEventListener("collide", function(e){
            if (e.body.mass == 5){
                console.log('equipment collision');
                setTimeout(
                    function (){
                        try {
                            Object.remove()
                        }
                        catch{ print('remove error')}
                        if (e.body.userData !== undefined){
                            if(e.body.userData.id != 'enemy'){
                                console.log('hit equip');
                                var myself = this.players.find(function(obj){
                                    return obj.playerId === 'myself';
                                });
                                Object.applyEquip(myself);
                            }
                        }
                    }.bind(this)
                ,100)

            }
        }.bind(this))
        this.equipments[uuid] = new PhysicsEquipment(mesh, body);
    }

    removeEquipment(uuid){
        let equip = this.equipments[uuid]
        this.remove(equip.body)
        delete this.equipments[uuid]
    }

    remove(body){
        this.physicsWorld.removeBody(body);
    }

    removeBomb(uuid){
        let bomb = this.bombs[uuid]
        this.remove(bomb.body)
        delete this.bombs[uuid]
    }

    removeFloor(mesh){
        let floorPiece;
        for (let piece of this.floorpieces){
            if (piece.mesh == mesh){
                floorPiece = piece
                break;
            }
        }
        this.remove(floorPiece.body)
        // for(let i = 0; i < this.floorpieces.length/2; i++){
        //     this.remove(this.floorpieces[i].body);
        // }        
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
            mesh.position.y = body.position.y + bombConfig.radius
            mesh.position.x = body.position.x
            mesh.position.z = body.position.z 
        }
        const equip_keys = Object.keys(this.equipments);
        for(let i = 0; i < equip_keys.length; i++){
            let key = equip_keys[i]
            let equip = this.equipments[key]
            if(equip != undefined){
            const mesh = equip.mesh;
            const body = equip.body;
            mesh.position.y = body.position.y
            mesh.position.x = body.position.x
            mesh.position.z = body.position.z 
            }
        }
    }
}

