import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
import { Bomb } from './Bomb.js';
import { A, D, DIRECTIONS, S, SPACE, W } from './utils.js'
import {Physics} from './physics.js';

export class CharacterController {
    // state
    toggleRun = true
    currentAction
    jump = false
    finishJump = false

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

    constructor(model,
        mixer, animationsMap,
        orbitControl, camera,
        currentAction, physicsWorld) {
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
        this.updateCameraTarget(0,0);
        this.physicsWorld = physicsWorld;
        this.player = physicsWorld.addPlayer(model, [model.position.x, model.position.y, model.position.z]);
        
    }

    switchRunToggle() {
        this.toggleRun = !this.toggleRun
    }

    plantBomb(scene){
        if (this.throwability){
            const position = this.model.position
            const quaternion = this.model.quaternion
            console.log(this.physicsWorld)
            const bomb = new Bomb(scene, position, quaternion, this.physicsWorld)
            this.throwability = false
            setTimeout(function(){
                this.throwability = true
            }.bind(this), 500)
        }
    }

    update(delta, keysPressed) {
        const directionPressed = DIRECTIONS.some(key => keysPressed[key] == true)
        
        var play = 'idle';
        if (directionPressed && this.toggleRun) {
            play = 'run'
        } else if (directionPressed) {
            play = 'walk'
        } else {
            play = 'idle'
        }

        const current = this.animationsMap.get(this.currentAction)
        let flag = false

        if (this.currentAction != play || keysPressed[SPACE] || this.finishJump) {
            let toPlay;

            if (keysPressed[SPACE]){
                toPlay = this.animationsMap.get("jump")
            }
            else {
                toPlay = this.animationsMap.get(play)
            }
            if (!this.jump){
                // console.log(current)
                current.fadeOut(this.fadeDuration)
                toPlay.reset().fadeIn(this.fadeDuration).play();
                this.currentAction = play
                // console.log(play)
                if (keysPressed[SPACE]) {
                    flag = true
                    this.jump = true
                }
            }
            else {
                this.currentAction = play
            }
            this.finishJump = false
        }

        this.mixer.update(delta)

        if (this.currentAction !== 'idle' && !this.freeze) {
            // calculate towards camera direction
            var angleYCameraDirection = Math.atan2(
                    (this.camera.position.x - this.model.position.x), 
                    (this.camera.position.z - this.model.position.z))
            // diagonal movement angle offset
            var directionOffset = this.directionOffset(keysPressed)

            // rotate model
            this.rotateQuarternion.setFromAxisAngle(this.rotateAngle, angleYCameraDirection + directionOffset)
            this.model.quaternion.rotateTowards(this.rotateQuarternion, 0.2)
            this.player.rotate(this.model.quaternion)

            // calculate direction
            this.camera.getWorldDirection(this.walkDirection)
            this.walkDirection.y = 0
            this.walkDirection.normalize()
            this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset)

            // run/walk velocity
            const velocity = this.currentAction == 'run' ? this.runVelocity : this.walkVelocity

            // move model & camera
            const moveX = this.walkDirection.x * velocity * delta
            const moveZ = this.walkDirection.z * velocity * delta

            this.player.move(moveX, moveZ);
            // this.model.position.x -= moveX
            // this.model.position.z -= moveZ

            this.updateCameraTarget(moveX, moveZ)
        }

        if (flag && !this.freeze){
            this.player.jump()
            setTimeout(this.freezeMove.bind(this), 1250)
        }
    }


    freezeMove(){
        this.freeze = true
        var self = this
        setTimeout(function(){self.freeze = false}, 500)
    }


    updateCameraTarget(moveX, moveZ) {
        // move camera
        this.camera.position.x -= moveX
        this.camera.position.z -= moveZ

        // update camera target
        this.cameraTarget.x = this.model.position.x
        this.cameraTarget.y = this.model.position.y + 1
        this.cameraTarget.z = this.model.position.z
        this.orbitControl.target = this.cameraTarget
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