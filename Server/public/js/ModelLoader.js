import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import { CharacterController } from './CharacterController.js';
import { bodySphereRadius, characterScale, floorConfig } from './config.js';

export class ModelLoader {
    constructor(scene, skin, animations, orbitControls, camera, physicsWorld, gameMap, isPlayer, pos, playerId) {
        // this.path = path;
        // this.file = file;
        this.model = skin
        this.animations = animations;
        this.scale = characterScale;
        this.animationMap = new Map();
        this.mixer;
        this.currentAction = "idle";
        this.characterController;
        this.orbitControls = orbitControls;
        this.camera = camera;
        this.physicsWorld = physicsWorld;
        this.scene = scene;
        this.gameMap = gameMap;
        this.isPlayer = isPlayer;
        this.playerId = playerId;
        if (pos == null){
            this.pos = this.generateRandPos();
        }
        else {
            this.pos = pos;
        }
    }


    generateRandPos(){
        let x = Math.random()*floorConfig.size*(floorConfig.mapSize-3) - floorConfig.size*(floorConfig.mapSize-3)/2
        let z = Math.random()*floorConfig.size*(floorConfig.mapSize-3) - floorConfig.size*(floorConfig.mapSize-3)/2
        let y = bodySphereRadius;
        return [x,y,z]
    }

    addAnimation(animation){
        this.animations.add(animation)
    }

    // load character model
    load(){
        this.mixer = new THREE.AnimationMixer(this.model);
        this.mixer.addEventListener("finished", ( /*event*/ ) => {
            this.characterController.finishJump = true
            this.characterController.jump = false
        
        } )
        this.model.scale.set(this.scale[0],this.scale[1],this.scale[2])
        this.model.position.set(this.pos[0], this.pos[1], this.pos[2])
        this.loadAnimation(this.animations)     
        this.model.frustumCulled = false               
        this.scene.add(this.model)
    }

    // load animation
    loadAnimation(animation) {
        let keys = Object.keys(animation)
        for (let key of keys){
            let anim = animation[key]
            let action = this.mixer.clipAction(anim.animations[0])

            if (key == "jump"){
                action.setLoop(THREE.LoopOnce);
                action.clampWhenFinished = true;
                action.enable = true;
                this.animationMap.set("jump",action)
            }
            if (key == "run"){
                this.animationMap.set("run",action)
            }
            if (key == "idle"){
                action.play()
                this.animationMap.set("idle",action)
            }
        }

        this.characterController = new CharacterController(this.model, this.mixer, this.animationMap, this.orbitControls, this.camera, "idle", this.physicsWorld, this.gameMap, this.isPlayer, this.playerId)
    }

    affectByBomb(){
        this.characterController.freezeByBomb();
    }

    getPos(){
        if (this.characterController !== undefined){
            return this.model.position;
        }
    }

    getQuaternion(){
        return this.model.quaternion;
    }

    getBodyPos(){
        if (this.characterController !== undefined){
            return this.characterController.player.getPos();
        }
        else {
            return {}
        }
    }

    getPlayer(){
        if (this.characterController !== undefined){
            return this.characterController.player;
        }
    }

    setBodyPos(pos){
        if (this.characterController !== undefined){
            this.characterController.player.setPos(pos);
        }
    }

    update(delta, keysPressed){
        this.characterController.update(delta, keysPressed)
    }

    plantBomb(){
        return this.characterController.plantBomb(this.scene)
    }

    isAlive(){
        return this.characterController.alive
    }
}