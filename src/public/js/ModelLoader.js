import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import { CharacterController } from './CharacterController.js';
import { bodySphereRadius, characterScale, floorConfig } from './config.js';

export class ModelLoader {
    constructor(scene, path, file, animations, orbitControls, camera, physicsWorld, gameMap, isPlayer, pos) {
        this.path = path;
        this.file = file;
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
        this.model;
        this.gameMap = gameMap;
        this.isPlayer = isPlayer;
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
        var loader = new FBXLoader();
        loader.setPath(this.path)
        loader.load(this.file, function(fbx) {
            this.model = fbx
            this.mixer = new THREE.AnimationMixer(fbx);
            this.mixer.addEventListener("finished", ( /*event*/ ) => {
                this.characterController.finishJump = true
                this.characterController.jump = false
            
            } )
            fbx.scale.set(this.scale[0],this.scale[1],this.scale[2])
            fbx.position.set(this.pos[0], this.pos[1], this.pos[2])
            this.loadAnimation(fbx, this.animations)                    
            this.scene.add(fbx)
        }.bind(this))
    }

    // load animation
    loadAnimation(fbx, animation) {
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

        this.characterController = new CharacterController(fbx, this.mixer, this.animationMap, this.orbitControls, this.camera, "idle", this.physicsWorld, this.gameMap, this.isPlayer)
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

}