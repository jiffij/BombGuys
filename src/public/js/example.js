import * as Three from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';


const renderer = new Three.WebGLRenderer()

renderer.setSize(window.innerWidth, window.innerHeight)

document.body.appendChild(renderer.domElement)

const scene = new Three.Scene();


const camera = new Three.PerspectiveCamera(
    75,
    window.innerWidth/window.innerHeight,
    0.1,
    1000
)

const orbit = new OrbitControls(camera, renderer.domElement)

const axesHelper = new Three.AxesHelper(5)
scene.add(axesHelper)

camera.position.z = 5
camera.position.x = 1
camera.position.y = 1
orbit.update()

const boxGeometry = new Three.BoxGeometry(3,3,3);
const boxMaterial = new Three.MeshBasicMaterial({color: 0x00FF00});
const box = new Three.Mesh(boxGeometry, boxMaterial)
scene.add(box)

const plainGeometry = new Three.PlaneGeometry(30,30);
const plainMaterial = new Three.MeshBasicMaterial(
    {
        color:0xFFFFFF,
        side:Three.DoubleSide
    }
    )
const plain = new Three.Mesh(plainGeometry, plainMaterial)
scene.add(plain)
plain.rotation.x = -0.5*Math.PI

const sphereGeometry = new Three.SphereGeometry(3,10,10);
const sphereMaterial = new Three.MeshBasicMaterial(
    {
        color:0x0000FF,
        wireframe:true
    }
)
const sphere = new Three.Mesh(sphereGeometry, sphereMaterial)
scene.add(sphere)
sphere.position.set(0,0,0)

const gridHelper = new Three.GridHelper(30)
scene.add(gridHelper)

function animate(t) {
    box.rotation.x = t/1000
    box.rotation.y = t/1000
    renderer.render(scene, camera)
}



renderer.setAnimationLoop(animate)


