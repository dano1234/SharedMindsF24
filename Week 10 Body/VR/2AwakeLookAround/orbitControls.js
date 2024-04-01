//using import map, see the html for this
//import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.module.min.js';
import * as THREE from 'three';
//import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';
//for more modern version of orbit control user importmap https://stackoverflow.com/questions/75250424/threejs-orbitcontrol-import-version-from-cdn
import { VRButton } from 'three/addons/webxr/VRButton.js';

let camera3D, scene, renderer, cube;
let hand1, hand2;
let controller1, controller2;
let controllerGrip1, controllerGrip2;


let controls;


function init3D() {
    scene = new THREE.Scene();
    camera3D = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    let bgGeometery = new THREE.SphereGeometry(950, 60, 40);
    // let bgGeometery = new THREE.CylinderGeometry(725, 725, 1000, 10, 10, true)
    bgGeometery.scale(-1, 1, 1);
    // has to be power of 2 like (4096 x 2048) or(8192x4096).  i think it goes upside down because texture is not right size
    let panotexture = new THREE.TextureLoader().load("itp.jpg");
    // var material = new THREE.MeshBasicMaterial({ map: panotexture, transparent: true,   alphaTest: 0.02,opacity: 0.3});
    let backMaterial = new THREE.MeshBasicMaterial({ map: panotexture });

    let back = new THREE.Mesh(bgGeometery, backMaterial);
    scene.add(back);

    controls = new OrbitControls(camera3D, renderer.domElement);
    camera3D.position.z = 25;
    //VR STUFF
    document.body.appendChild(VRButton.createButton(renderer));
    renderer.xr.enabled = true;
    setupControllers();
    animate()
}



function animate() {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    controls.update();  //orbit controls
    renderer.setAnimationLoop(render);
    requestAnimationFrame(animate);
}
function render() {
    renderer.render(scene, camera3D);
}

function setupControllers() {
    // controllers

    controller1 = renderer.xr.getController(0);
    scene.add(controller1);

    controller2 = renderer.xr.getController(1);
    scene.add(controller2);

    const controllerModelFactory = new XRControllerModelFactory();
    const handModelFactory = new XRHandModelFactory();

    // Hand 1
    controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    scene.add(controllerGrip1);

    hand1 = renderer.xr.getHand(0);
    hand1.add(handModelFactory.createHandModel(hand1));

    scene.add(hand1);

    // Hand 2
    controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    scene.add(controllerGrip2);

    hand2 = renderer.xr.getHand(1);
    hand2.add(handModelFactory.createHandModel(hand2));
    scene.add(hand2);

    //
}

init3D();