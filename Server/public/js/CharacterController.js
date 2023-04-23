import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { Bomb } from './Bomb.js';
import { A, D, DIRECTIONS, S, SPACE, W } from './utils.js';
import { BombPower, boostSpeed } from './config.js';

export class CharacterController {
    // state
    toggleRun = true
    currentAction
    isJumping = false
    finishJump = true

    // freeze movement after jump
    freeze = false
    
    // temporary data
    walkDirection = new THREE.Vector3()
    rotateAngle = new THREE.Vector3(0, 1, 0)
    rotateQuarternion = new THREE.Quaternion()
    cameraTarget = new THREE.Vector3()
    
    // constants
    fadeDuration = 0.2
    runVelocity = 4
    walkVelocity = 2
    vAngle = 0

    // able to throw a bomb
    throwability = true

    // alive or not
    alive = true

    // tool
    power = 1
    boost = false

    constructor(model,
        mixer, animationsMap,
        orbitControl, camera,
        currentAction, physicsWorld, gameMap, isPlayer, playerId) {
        this.model = model;
        this.mixer = mixer;
        this.animationsMap = animationsMap;
        this.currentAction = currentAction;
        this.animationsMap.forEach((value, key) => {
            if (key == currentAction) {
                value.play()
            }
        });
        this.orbitControl = orbitControl;
        this.camera = camera;
        if (isPlayer){
            this.updateCameraTarget(0,0);
        }
        this.physicsWorld = physicsWorld;
        this.playerId = playerId;
        this.player = physicsWorld.addPlayer(model, [model.position.x, model.position.y, model.position.z], playerId, this);
        this.gameMap = gameMap;
        this.isPlayer = isPlayer;
        this.destination = this.model.position;
    }

    switchRunToggle() {
        this.toggleRun = !this.toggleRun
    }

    plantBomb(scene){
        if (this.throwability){
            const position = this.model.position
            const quaternion = this.model.quaternion
            const bomb = new Bomb(position, quaternion, this.physicsWorld, this.gameMap, false, BombPower[this.power])
            this.throwability = false
            setTimeout(function(){
                this.throwability = true
            }.bind(this), 500)
            return true;
        }
        return false;
    }

    jump(){
        const verticalVelocity = this.player.getVerticalVelocity();
        const current = this.animationsMap.get(this.currentAction)
        if ( this.finishJump && Math.abs(verticalVelocity) < 0.0001 && !this.freeze){
            let toPlay;
            toPlay = this.animationsMap.get("jump")
            current.fadeOut(this.fadeDuration)
            toPlay.reset().fadeIn(this.fadeDuration).play();
            this.isJumping = true
            this.finishJump = false
            this.player.jump()
            this.currentAction = "idle"
            setTimeout(this.freezeMove.bind(this), 1100)
        }
    }
    
    walkTowards(delta, keysPressed) {        
        var play = 'idle';
        if ((Math.sqrt((this.model.position.x-this.destination.x)*(this.model.position.x-this.destination.x))>0.1 || Math.sqrt((this.model.position.z-this.destination.z)*(this.model.position.z-this.destination.z))>0.1)) {
            play = 'run'
        } else {
            play = 'idle'
        }
        const current = this.animationsMap.get(this.currentAction)

        if ((this.currentAction != play && !this.isJumping) && !this.freeze) {
            let toPlay;
            toPlay = this.animationsMap.get(play)
            current.fadeOut(this.fadeDuration)
            toPlay.reset().fadeIn(this.fadeDuration).play();
            this.currentAction = play
        }

        this.mixer.update(delta)

        if ((play != "idle") && !this.freeze){
            const direction = new THREE.Vector3();
            const rotateAngle = new THREE.Vector3(0, 1, 0);
            const rotateQuarternion = new THREE.Quaternion();
            
            // Calculate the direction vector from the character to the destination
            direction.subVectors(this.destination, this.model.position).normalize();
        
            // Calculate the angle between the character's forward direction and the direction vector
            const angleYCameraDirection = Math.atan2(direction.x, direction.z);
        
            // Rotate the model towards the destination
            rotateQuarternion.setFromAxisAngle(rotateAngle, angleYCameraDirection);
            this.model.quaternion.rotateTowards(rotateQuarternion, 0.2);
        
            // Calculate the walk direction
            this.walkDirection.copy(direction);
            this.walkDirection.y = 0;
        
            // Set the appropriate velocity based on the current action
            let velocity = this.currentAction === 'run' ? this.runVelocity : this.walkVelocity;
        
            // Add boost speed if the boost is active
            if (this.boost) {
                velocity += this.boostSpeed;
            }
            if (this.isJumping){
                velocity += velocity / 2
            }
        
            // Calculate horizontal movement
            const moveX = -this.walkDirection.x * velocity * delta;
            const moveZ = -this.walkDirection.z * velocity * delta;
        
            // Update vertical velocity based on the player's vertical velocity
            const verticalVelocity = this.player.getVerticalVelocity();
            const moveY = verticalVelocity < 0.000000001 ? 0 : verticalVelocity * delta;
        
            // Move the character using the calculated movement vectors
            this.player.move(moveX, moveZ);
        }

        if (this.model.position.y <= -25){
            this.alive = false
        }
    }


    update(delta, keysPressed) {
        let moveX = 0
        let moveZ = 0
        let moveY = 0

        const directionPressed = DIRECTIONS.some(key => keysPressed[key] == true)
        
        var play = 'idle';
        if (directionPressed) {
            play = 'run'
        } else{
            play = 'idle'
        }

        const current = this.animationsMap.get(this.currentAction)

        if ((this.currentAction != play && !this.isJumping) && !this.freeze) {
            let toPlay;
            toPlay = this.animationsMap.get(play)
            current.fadeOut(this.fadeDuration)
            toPlay.reset().fadeIn(this.fadeDuration).play();
            this.currentAction = play
        }

        this.mixer.update(delta)
        

        if (directionPressed && !this.freeze) {
            // calculate towards camera direction
            var angleYCameraDirection = Math.atan2(
                (this.camera.position.x - this.model.position.x), 
                (this.camera.position.z - this.model.position.z))
            // diagonal movement angle offset
            var directionOffset = this.directionOffset(keysPressed)

            // rotate model
            this.rotateQuarternion.setFromAxisAngle(this.rotateAngle, angleYCameraDirection + directionOffset)
            this.model.quaternion.rotateTowards(this.rotateQuarternion, 0.2)

            // calculate direction
            this.camera.getWorldDirection(this.walkDirection)
            this.walkDirection.y = 0
            this.walkDirection.normalize()
            this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset)
            

            // run/walk velocity
            var velocity = this.currentAction == 'run' ? this.runVelocity : this.walkVelocity
            if(this.boost){
                velocity += boostSpeed;
            }
            if (this.isJumping){
                velocity += velocity / 2
            }
            let verticalVelocity = this.player.getVerticalVelocity()
            if (verticalVelocity < 0.000000001){
                verticalVelocity = 0
            }

            // move model & camera
            moveX = this.walkDirection.x * velocity * delta
            moveZ = this.walkDirection.z * velocity * delta
            moveY = verticalVelocity * delta

            this.player.move(moveX, moveZ);
        }

        this.updateCameraTarget(moveX, moveZ, moveY)

        if (this.model.position.y <= -25){
            this.alive = false
        }
    }


    freezeMove(){
        this.freeze = true
        var self = this
        setTimeout(function(){self.freeze = false}, 500)
    }

    freezeByBomb(){
        this.freeze = true
        var self = this
        console.log("being bombed")
        setTimeout(function(){self.freeze = false}, 1000)
    }


    updateCameraTarget(moveX, moveZ, moveY) {
        // move camera
        this.camera.position.x -= moveX
        this.camera.position.z -= moveZ
        this.camera.position.y += 0

        // update camera target
        this.cameraTarget.x = this.model.position.x
        this.cameraTarget.y = this.model.position.y + 0.5
        this.cameraTarget.z = this.model.position.z

        this.camera.updateMatrix();
        this.camera.updateMatrixWorld();
        if (this.isPlayer) {
            this.orbitControl.target = this.cameraTarget;
        }

    }

    directionOffset(keysPressed) {
        var directionOffset = 0 // w

        if (keysPressed[S]) {
            if (keysPressed[D]) {
                directionOffset = Math.PI / 4 // w+a
            } else if (keysPressed[A]) {
                directionOffset = - Math.PI / 4 // w+d
            }
        } else if (keysPressed[W]) {
            if (keysPressed[D]) {
                directionOffset = Math.PI / 4 + Math.PI / 2 // s+a
            } else if (keysPressed[A]) {
                directionOffset = -Math.PI / 4 - Math.PI / 2 // s+d
            } else {
                directionOffset = Math.PI // s
            }
        } else if (keysPressed[D]) {
            directionOffset = Math.PI / 2 // a
        } else if (keysPressed[A]) {
            directionOffset = - Math.PI / 2 // d
        }

        return directionOffset
    }

}