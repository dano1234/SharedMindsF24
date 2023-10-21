

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.min.js';
import { CSS3DObject } from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.min.js';
import { CSS3DRenderer } from 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/js/renderers/CSS3DRenderer.js';


let camera3D, scene, renderer;
let texts = [];
let objects = [];
let in_front_of_you;

init3D();

function init3D() {

    camera3D = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
    camera3D.position.z = 3000;

    scene = new THREE.Scene();
    renderer = new CSS3DRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);




    //tiny little dot (could be invisible) for placing things in front of you
    var geometryFront = new THREE.BoxGeometry(1, 1, 1);
    var materialFront = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    in_front_of_you = new THREE.Mesh(geometryFront, materialFront);
    camera3D.add(in_front_of_you); // then add in front of the camera so it follow it
    in_front_of_you.position.set(0, 0, -600);

    //convenience function for getting coordinates

    moveCameraWithMouse();

    camera3D.position.z = 0;
    animate();
}


function animate() {
    requestAnimationFrame(animate);
    for (var i = 0; i < texts.length; i++) {
        texts[i].texture.needsUpdate = true;
    }
    renderer.render(scene, camera3D);
}

var textInput = document.getElementById("text");  //get a hold of something in the DOM
textInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {  //checks whether the pressed key is "Enter"
        createNewText(textInput.value);
    }
});

function createNewText(text_msg) {
    console.log("Created New Text");
    const details = document.createElement('div');
    details.className = 'details';
    details.innerHTML = table[i + 1] + '<br>' + table[i + 2];
    element.appendChild(details);

    const objectCSS = new CSS3DObject(element);


    const posInWorld = new THREE.Vector3();
    //remember we attached a tiny to the  front of the camera in init, now we are asking for its position

    in_front_of_you.position.set(0, 0, -(600 - camera3D.fov * 7));  //base the the z position on camera field of view
    in_front_of_you.getWorldPosition(posInWorld);

    objectCSS.position.x = posInWorld.x;
    objectCSS.position.y = posInWorld.y;
    objectCSS.position.z = posInWorld.z;
    scene.add(objectCSS);

    objects.push(objectCSS);
    //texts.push({ "object": mesh, "texture": textTexture, "text": text_msg });
}

function onDocumentKeyDown(event) {
    //console.log(event.key);
    // if (event.key == " ") {
    //     
    // }
}



/////MOUSE STUFF

var onMouseDownMouseX = 0, onMouseDownMouseY = 0;
var onPointerDownPointerX = 0, onPointerDownPointerY = 0;
var lon = -90, onMouseDownLon = 0;
var lat = 0, onMouseDownLat = 0;
var isUserInteracting = false;


function moveCameraWithMouse() {
    //document.addEventListener('keydown', onDocumentKeyDown, false);
    document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('mouseup', onDocumentMouseUp, false);
    document.addEventListener('wheel', onDocumentMouseWheel, false);
    window.addEventListener('resize', onWindowResize, false);
    camera3D.target = new THREE.Vector3(0, 0, 0);
}


function onDocumentMouseDown(event) {
    onPointerDownPointerX = event.clientX;
    onPointerDownPointerY = event.clientY;
    onPointerDownLon = lon;
    onPointerDownLat = lat;
    isUserInteracting = true;
}

function onDocumentMouseMove(event) {
    if (isUserInteracting) {
        lon = (onPointerDownPointerX - event.clientX) * 0.1 + onPointerDownLon;
        lat = (event.clientY - onPointerDownPointerY) * 0.1 + onPointerDownLat;
        computeCameraOrientation();
    }
}

function onDocumentMouseUp(event) {
    isUserInteracting = false;
}

function onDocumentMouseWheel(event) {
    camera3D.fov += event.deltaY * 0.05;
    camera3D.updateProjectionMatrix();
}

function computeCameraOrientation() {
    lat = Math.max(- 30, Math.min(30, lat));  //restrict movement
    let phi = THREE.Math.degToRad(90 - lat);  //restrict movement
    let theta = THREE.Math.degToRad(lon);
    camera3D.target.x = 100 * Math.sin(phi) * Math.cos(theta);
    camera3D.target.y = 100 * Math.cos(phi);
    camera3D.target.z = 100 * Math.sin(phi) * Math.sin(theta);
    camera3D.lookAt(camera3D.target);
}


function onWindowResize() {
    camera3D.aspect = window.innerWidth / window.innerHeight;
    camera3D.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    console.log('Resized');
}

