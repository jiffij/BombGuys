import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import { CharacterController } from './characterController.js';
import { bodySphereRadius, characterScale, floorConfig } from './config.js';

export class ModelLoader {
    constructor(scene, path, file, animationPath, animations, orbitControls, camera, physicsWorld, gameMap, isPlayer, pos) {
        this.path = path;
        this.file = file;
        this.animations = animations;
        this.animationPath = animationPath
        this.scale = characterScale;
        this.animationMap = new Map();
        this.mixer;
        this.currentAction;
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
                // console.log("finish")
                // current.fadeOut(this.fadeDuration)
                // let idleAction = this.animationMap.get("idle");
                // idleAction.reset().fadeIn(0.2).play();
                this.characterController.finishJump = true
                this.characterController.jump = false
            
            } )
            fbx.scale.set(this.scale[0],this.scale[1],this.scale[2])
            if (this.animations.length > 0){
                for (let animation of this.animations){
                    this.loadAnimation(fbx, animation)
                }
            }
            console.log(this.pos)
            fbx.position.set(this.pos[0], this.pos[1], this.pos[2])
            this.scene.add(fbx)
        }.bind(this))
    }

    // load animation
    loadAnimation(fbx, animation) {
        let anim = new FBXLoader()
        anim.setPath(this.animationPath)
        anim.load(animation, (anim) => {
            let action = this.mixer.clipAction(anim.animations[0])
            if (animation == "idle.fbx"){
                action.play()
                this.currentAction = "idle"
                this.animationMap.set("idle",action)
            }
            else if (animation == "run.fbx"){
                this.animationMap.set("run",action)
            }
            else if (animation == "jump.fbx"){
                action.setLoop(THREE.LoopOnce);
                action.clampWhenFinished = true;
                action.enable = true;
                
                this.animationMap.set("jump",action)
            }
            else {
                this.animationMap.set("walk",action)
            }

            if (this.animationMap.size == 4) {
                this.characterController = new CharacterController(fbx, this.mixer, this.animationMap, this.orbitControls, this.camera, "idle", this.physicsWorld, this.gameMap, this.isPlayer)
            }

        })
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