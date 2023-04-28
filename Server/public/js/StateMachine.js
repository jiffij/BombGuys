import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es/dist/cannon-es.js';
import { BombPower } from './config.js';
import { Bomb } from './Bomb.js';
import { socket } from './client.js';
// Define the state machine object
const PLAYER = 1;
const FLOOR = 2;
const BOMB = 3;
const EQUIPMENT = 4;
const RING = 5;

const validTransitions = {
  standing: ['jump', 'walk'],
  jump: ['standing', 'walk'],
  fall: ['standing'],
  walk: ['jump', 'standing'],
  chase: ['chase', 'bomb'],
  bomb: ['chase'],
};

export class stateMachine{

    ring;
    mesh;
    body;
    ringBody;
    destination;
    forcePerUnit = 5;
    onGround = true;
    currentTarget;
    power = 1;
    throwability = true;

    constructor(phy, scene, gameMap){
        this.physicsWorld = phy.physicsWorld;
        this.phy = phy;
        this.scene = scene;
        this.timeToReachDestination = 1000;
        this.maxForce = 50;
        this.finished = true;
        this.destination = new CANNON.Vec3(5,0,5);
        this.currentTarget = this.phy.players[0];
        this.gameMap = gameMap;
        this.init();
    }

    init(){
        const creeperGeometry = new THREE.BoxGeometry(1, 1, 1);
        const creeperMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.mesh = new THREE.Mesh(creeperGeometry, creeperMaterial);
        this.scene.add(this.mesh);

        // Create the sphere shape and body
        const boxShape = new CANNON.Sphere(1);//(new CANNON.Vec3(1,1,1));
        this.body = new CANNON.Body({
           mass: 1, shape: boxShape, fixedRotation: true,
          material: new CANNON.Material({
          friction: 0 // set friction to zero
          }),
        });
        this.body.position.set(0, 1, 0);
        this.body.collisionFilterGroup = PLAYER,
        this.body.collisionFilterMask = FLOOR | PLAYER,
        this.body.allowSleep = true;
        // this.body.addEventListener("collide", function(e){
        //   if(e.body.mass == 0){
        //     this.onGround = true;
        //   }
        // }.bind(this));
        // Add the sphere body to the world
        this.physicsWorld.addBody(this.body);

        // Bind the Three.js mesh to the Cannon.js body
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);

        // Create the ring shape
        const ringShape = new CANNON.Sphere(5);

        // Create the ring body
        this.ringBody = new CANNON.Body({
        mass: 1, // set the mass to 1 (dynamic body)
        shape: ringShape, // assign the ring shape to the body
        collisionResponse: false,
        });

        // Set the position and rotation of the ring body
        this.ringBody.position.set(0, 1, 0);//TODO
        this.ringBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.ringBody.collisionFilterGroup = RING,
        this.ringBody.collisionFilterMask = PLAYER,
        

        // Add the ring body to the world
        this.physicsWorld.addBody(this.ringBody);

        //connect the sphere body with the ring
        const constraint = new CANNON.PointToPointConstraint(
            this.body, new CANNON.Vec3(0, 0, 0), // connection point on sphere
            this.ringBody, new CANNON.Vec3(0, 0, 0), // connection point on ring
          );
        this.physicsWorld.addConstraint(constraint);

        this.ringBody.addEventListener("collide", function(e){
            if(e.body.mass == 5){
                this.currentState = "chase";
                let id = e.body.userData.id;
                // console.log(id);
                var target = this.phy.players.find(function(obj){
                    return obj.playerId === id;
                });
                // var target = this.phy.findPlayer(id);
                // console.log("chasing");
                // this.destination = target.body.position;
                this.currentTarget = target;
                // console.log(this.destination); 
                
                // this.destination = e.contact.bi.position.clone();
            }
        }.bind(this))
        console.log('finish statemachine init')
    }

    getPos(){
      return this.body.position;
    }

    rotate(quarternion){
        this.body.quaternion.copy(quarternion)
    }

    move(x, z){
        this.body.position.x -= x;
        this.body.position.z -= z;
    }

    setPos(pos){
        if (pos.x !==undefined){
            this.body.position.x = pos.x;
            this.body.position.y = pos.y;
            this.body.position.z = pos.z;
        }
    }

    normalize(vec){
      let x = vec.x;
      let z = vec.z;
      const length = Math.sqrt(x * x + z*z); // calculate the length of the vector
      if (length !== 0) { // check if the length is not zero to avoid division by zero
        x /= length; // divide each component by the length
        z /= length;
      }
      return [x, z];
    }
    
    moveTowardDestination(destination, isjumping){
      let currentPosition = this.body.position;
      // console.log(currentPosition);
      let direction = new CANNON.Vec3().copy(destination).vsub(currentPosition);
      const [normalizeX, normalizeZ] = this.normalize(direction);
      // console.log(normalizeX, normalizeZ);
      // console.log(direction);
      // let distanceToDestination = destination.distanceTo(currentPosition);
      // let force = distanceToDestination * this.forcePerUnit;
      // let forceMagnitude = Math.min(distanceToDestination / this.timeToReachDestination, this.maxForce);
      let force;
      if(isjumping){
        force = 10;
      }else{
        force = 40;
      }
      // force = 50;
      let forceVector = new CANNON.Vec3(
        normalizeX * force, //this.maxForce,
        0,
        normalizeZ* force,// this.maxForce,
      );
      // console.log(forceVector);
      // console.log(direction.x, direction.z);
      // this.move(direction.x,direction.z);
      
      this.body.velocity.copy(forceVector);
      setTimeout(() => {
       
        this.body.velocity.copy(new CANNON.Vec3(0,0,0));
      }, 400);
      // this.body.applyImpulse(forceVector, this.body.position);
    }


    // Define the initial state
    currentState = 'standing';
  
    // Define the state transition function
    transition() {
      
      this.finished = false;
      var index = Math.floor(Math.random()*validTransitions[this.currentState].length)
      if (validTransitions[this.currentState][index]) {
        this.currentState = validTransitions[this.currentState][index];
        setTimeout(() => {
          this.finished = true;
        }, 500);
        // console.log(this.currentState);
        return true;
      } else {
        // console.log(this.currentState);
        return false;
      }
    };

    walk(isjumping){
      let xMin = -15;
      let xMax = 15;
      let yMin = 0;
      let yMax = 0;
      let zMin = -15;
      let zMax = 15;
      let dest = new CANNON.Vec3(
        xMin + Math.random() * (xMax - xMin),
        0,
        zMin + Math.random() * (zMax - zMin)
      );
      // console.log('walk');
      this.moveTowardDestination(dest, isjumping);
    }

    plantBomb(){
      if (this.throwability){
          const position = this.mesh.position
          // let r = this.reverse && this.useReverse
          // console.log(this.reverse)
          const quaternion = new THREE.Quaternion();
          quaternion.set(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
          );
          quaternion.normalize();
          const bomb = new Bomb(position, quaternion, this.phy, this.gameMap, false, BombPower[this.power], false)
          socket.emit("plantBomb", {pos:position,quaternion:quaternion,power:this.power, reverse:false})
          this.throwability = false
          setTimeout(function(){
              this.throwability = true
          }.bind(this), 1500)
          return true;
        }
      return false;
    }
  
    // Define the state update function
    update() {

      if(this.finished){
        switch (this.currentState) {
          case 'standing':
            // Player is standing still, do nothing
            // this.body.velocity.set(new CANNON.Vec3(0,0,0));
            // console.log('standing');
            break;
          case 'jump':
            // Player is jumping, apply an upwards force
            if(Math.random() > 0.3){
              this.walk(true);
            }
            this.body.applyImpulse(new CANNON.Vec3(0, 5, 0), this.body.position);
            // setTimeout(() => {
            // }, 200);
            // console.log('jump');
            break;
          case 'bomb':
            // Player is falling, apply a downwards force
            // player.applyForce(new CANNON.Vec3(0, -10, 0), player.position);
            // console.log("bomb");
            this.plantBomb();
            break;
          case 'walk':
            // Player is walking, apply a forward force
            
            this.walk(false);

            // player.applyForce(new CANNON.Vec3(10, 0, 0), player.position);
            break;
          case 'chase':
            // console.log('chase');
            this.destination = this.currentTarget.body.position;
            this.moveTowardDestination(this.destination, false);
            break;
          case 'fall':
            this.body.velocity.x = 0;
            this.body.velocity.y = 0;
            this.body.velocity.z = 0;
            this.body.position.x = 0;
            this.body.position.y = this.currentTarget.body.position.y + 0.5;
            this.body.position.z = 0;
            this.body.velocity.set(0,0,0);
            break;
        }
        this.transition();
        if(this.currentState == 'chase'){
          let currentPosition = this.body.position;
          let distanceToDestination = this.currentTarget.body.position.distanceTo(currentPosition);
          this.currentState = distanceToDestination > 6 ? 'standing' : 'chase';
        }
        if(this.body.position.y < -13.5){
          this.currentState = 'fall';
        }
        if(Math.abs(this.body.position.y - this.currentTarget.body.position.y) > 4.25 ){
          this.currentState = 'fall';
        }
      }
      // Update the Creeper mesh position and rotation to match the sphere body
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
    };
  };