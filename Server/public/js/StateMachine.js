import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es/dist/cannon-es.js';

// Define the state machine object
const PLAYER = 1;
const FLOOR = 2;
const BOMB = 3;
const EQUIPMENT = 4;
const RING = 5;

export class stateMachine{

    ring;
    mesh;
    body;
    ringBody;

    constructor(physicsWorld, scene){
        this.physicsWorld = physicsWorld;
        this.scene = scene;
        this.init();
    }

    init(){
        const creeperGeometry = new THREE.BoxGeometry(1, 1, 1);
        const creeperMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.mesh = new THREE.Mesh(creeperGeometry, creeperMaterial);
        this.scene.add(this.mesh);

        // Create the sphere shape and body
        const sphereShape = new CANNON.Sphere(1);
        this.body = new CANNON.Body({ mass: 1, shape: sphereShape });
        this.body.position.set(0, 5, 0);
        this.body.collisionFilterGroup = PLAYER,
        this.body.collisionFilterMask = FLOOR,
        // Add the sphere body to the world
        this.physicsWorld.addBody(this.body);

        // Bind the Three.js mesh to the Cannon.js body
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);

        // Create the ring shape
        const ringShape = new CANNON.Cylinder(5, 5, 0.5, 32);

        // Create the ring body
        this.ringBody = new CANNON.Body({
        mass: 1, // set the mass to 1 (dynamic body)
        shape: ringShape, // assign the ring shape to the body
        });

        // Set the position and rotation of the ring body
        this.ringBody.position.set(0, 0, 0);//TODO
        this.ringBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);

        this.ringBody.collisionFilterGroup = RING,
        this.ringBody.collisionFilterMask = RING,

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
                currentState = "chase";
            }
        })
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


    // Define the initial state
    currentState = 'standing';
  
    // Define the state transition function
    transitionTo(newState) {
      const validTransitions = {
        standing: ['jump', 'walk'],
        jump: ['fall'],
        fall: ['standing', 'walk'],
        walk: ['jump', 'fall', 'standing'],
      };
  
      if (validTransitions[this.currentState].includes(newState)) {
        this.currentState = newState;
        return true;
      } else {
        return false;
      }
    };
  
    // Define the state update function
    update(player) {
      switch (this.currentState) {
        case 'standing':
          // Player is standing still, do nothing
          break;
        case 'jump':
          // Player is jumping, apply an upwards force
          player.applyForce(new CANNON.Vec3(0, 100, 0), player.position);
          break;
        case 'fall':
          // Player is falling, apply a downwards force
          player.applyForce(new CANNON.Vec3(0, -10, 0), player.position);
          break;
        case 'walk':
          // Player is walking, apply a forward force
          player.applyForce(new CANNON.Vec3(10, 0, 0), player.position);
          break;
      }
      // Update the Creeper mesh position and rotation to match the sphere body
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
    };
  };