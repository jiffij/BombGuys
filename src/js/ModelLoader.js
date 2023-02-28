import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';

export class ModelLoader {
    constructor(path, file, animationPath, animations, scale) {
        this.path = path;
        this.file = file;
        this.animations = animations;
        this.animationPath = animationPath
        this.scale = scale;
    }

    addAnimation(animation){
        this.animations.add(animation)
    }

    // load character model
    load(mixers, scene){
        var loader = new FBXLoader();
        loader.setPath(this.path)
        loader.load(this.file, function(fbx) {
            fbx.scale.set(this.scale[0],this.scale[1],this.scale[2])
            if (this.animations.length > 0){
                for (let animation of this.animations){
                    this.loadAnimation(fbx, mixers, animation)
                }
            }
            scene.add(fbx)
        }.bind(this))
    }

    // load animation
    loadAnimation(fbx, mixers, animation) {
        let anim = new FBXLoader()
        anim.setPath(this.animationPath)
        anim.load(animation, (anim) => {
            let m = new THREE.AnimationMixer(fbx)
            mixers.push(m)
            let action = m.clipAction(anim.animations[0])
            action.play()
        })
    }
}