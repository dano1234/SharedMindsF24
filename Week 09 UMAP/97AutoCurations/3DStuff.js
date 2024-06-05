import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';
import { hitTestableThings, byUUID, findClosest } from './main.js';
import { updatePhysics, freeFromPhysics } from './expressionClass.js';
let camera3D, renderer;
export let scene;
let in_front_of_you;


export let distanceFromCenter = 500;


function animate() {
    requestAnimationFrame(animate);
    for (let uuid in byUUID) {
        let object = byUUID[uuid];
        object.repaint();
        //console.log("repainting", object.prompt);
    }
    renderer.render(scene, camera3D);
    updatePhysics();


}


//mouse can click on objects thanks to the raycaster, this iis 
export function getIntersectedObject(XYpos) {
    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(XYpos, camera3D);
    var intersects = raycaster.intersectObjects(hitTestableThings);
    let intersectedObjectUUID = -1;   //will never match but go through all the items anyway
    if (intersects.length > 0) {
        intersectedObjectUUID = intersects[0].object.uuid //take the first, closesest, object
        //find the object with that UUID
        let clickedOnObject = byUUID[intersectedObjectUUID];
        return clickedOnObject;
    } else {
        return null;
    }
}

export function init3D() {
    scene = new THREE.Scene();
    camera3D = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("ThreeJSContainer").append(renderer.domElement);


    var radius = 100;
    var latSegments = 9;  // 10° increments
    var longSegments = 18; // 10° increments

    var geometry = new THREE.SphereBufferGeometry(radius, longSegments, latSegments);
    var material = new THREE.MeshBasicMaterial({
        color: 0x444444,
        wireframe: true
    });

    var sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    //just a place holder the follows the camera and marks location to drop incoming  pictures
    //tiny little dot (could be invisible) 
    let geometryFront = new THREE.SphereBufferGeometry(3, 32, 16);
    //var geometryFront = new THREE.BoxGeometry(10, 10, 10);
    var materialFront = new THREE.MeshBasicMaterial({ color: 0xff00ff });
    in_front_of_you = new THREE.Mesh(geometryFront, materialFront);
    in_front_of_you.position.set(0, 0, -distanceFromCenter);  //base the the z position on camera field of view
    camera3D.add(in_front_of_you); // then add in front of the camera (not scene) so it follow it
    setInterval(() => { //blink it
        in_front_of_you.visible = !in_front_of_you.visible;
    }, 400);
    scene.add(camera3D);
    moveCameraWithMouse();

    camera3D.position.z = 0;
    animate();
}

export function getPositionInFrontOfCamera() {
    //use the object you placed in front of the camera in init3D
    const posInWorld = new THREE.Vector3();
    in_front_of_you.position.set(0, 0, -distanceFromCenter / 4);  //base the the z position on camera field of view
    in_front_of_you.getWorldPosition(posInWorld);
    return posInWorld;
}


/////MOUSE STUFF

//var onMouseDownMouseX = 0, onMouseDownMouseY = 0;
var onPointerDownPointerX = 0, onPointerDownPointerY = 0;
var lon = -90, onPointerDownLon = 0;
var lat = 0, onPointerDownLat = 0;
var isUserInteracting = false;


function onMouseDown(event) {
    // let ThreeJSContainer = document.getElementById("ThreeJSContainer");
    // ThreeJSContainer.setCapture();
    feature.style.display = "none"; //lose the featured image
    freeFromPhysics();
    //if (intersectedObjectUUID == -1) { //if no object was intersected, start navigation
    onPointerDownPointerX = event.clientX;
    onPointerDownPointerY = event.clientY;
    onPointerDownLon = lon;
    onPointerDownLat = lat;
    isUserInteracting = true;
    //}
}

function onDoubleClick(event) {
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    let intersectedObject = getIntersectedObject(mouse);
    if (intersectedObject) {
        feature.style.display = "block";
        feature.innerHTML = "";
        let featureClose = document.createElement("button");
        featureClose.innerHTML = "X";
        featureClose.style.zIndex = "5";
        featureClose.style.position = "absolute";
        featureClose.style.top = "0%";
        featureClose.style.left = "90%";
        featureClose.style.color = "white";
        featureClose.style.backgroundColor = "black";
        featureClose.style.pointerEvents = "all";
        featureClose.addEventListener("click", function () {
            feature.style.display = "none";
        }
        );
        feature.append(featureClose);
        feature.append(document.createElement("br"));
        let featureImage = document.createElement("div");
        featureImage.style.position = "absolute";
        featureImage.style.top = "50%";
        featureImage.style.left = "50%";
        featureImage.style.transform = "translate(-50%, -50%)";
        feature.append(featureImage);
        let bigCanvas = document.createElement('canvas');
        let size = 1024;
        bigCanvas.height = size;
        bigCanvas.width = size;
        let ctx = bigCanvas.getContext('2d');
        ctx.drawImage(intersectedObject.image, 0, 0, bigCanvas.width, bigCanvas.height);
        featureImage.append(bigCanvas);
        let featurePrompt = document.createElement("div");
        featurePrompt.innerHTML = intersectedObject.prompt;
        featurePrompt.style.position = "absolute";
        featurePrompt.style.textAlign = "center";
        featurePrompt.style.left = "50%";
        featurePrompt.style.top = "90%";
        featurePrompt.style.transform = "translate(-50%, -50%)";
        featurePrompt.style.fontSize = "20px";
        featurePrompt.style.color = "white";
        featurePrompt.style.backgroundColor = "black";
        featurePrompt.style.pointerEvents = "all";
        feature.append(featurePrompt)
    } else { //if no object was intersected, start navigation
        onPointerDownPointerX = event.clientX;
        onPointerDownPointerY = event.clientY;
        onPointerDownLon = lon;
        onPointerDownLat = lat;
        isUserInteracting = true;
    }
}

export function moveCameraWithMouse() {
    let ThreeJSContainer = document.getElementById("ThreeJSContainer");
    ThreeJSContainer.addEventListener('dblclick', onDoubleClick, false);
    ThreeJSContainer.addEventListener('keydown', onKeyDown, false);
    ThreeJSContainer.addEventListener('mousedown', onMouseDown, false);
    ThreeJSContainer.addEventListener('mousemove', onMouseMove, false);
    ThreeJSContainer.addEventListener('mouseup', onMouseUp, false);
    window.addEventListener('mouseup', onMouseUp, false);
    window.addEventListener('wheel', onMouseWheel, false);
    window.addEventListener('resize', onWindowResize, false);
    camera3D.target = new THREE.Vector3(0, 0, 0);
}

function onKeyDown(event) {
    //if (event.key == " ") {
    //in case you want to track key presses
    //}
}

function onMouseMove(event) {
    if (isUserInteracting) {
        lon = (onPointerDownPointerX - event.clientX) * 0.1 + onPointerDownLon;
        lat = (event.clientY - onPointerDownPointerY) * 0.1 + onPointerDownLat;
        computeCameraOrientation();
    }
}

function onMouseUp(event) {
    isUserInteracting = false;

    var middle = new THREE.Vector2();
    middle.x = (.5) * 2 - 1;
    middle.y = - (.5) * 2 + 1;
    let intersectedObject = getIntersectedObject(middle);
    //console.log("intersectedObject", intersectedObject);

    if (intersectedObject) {
        let closest = findClosest(intersectedObject.mesh.position);
        myCluster.addParticles(closest);
        for (let i = 0; i < closest.length; i++) {
            closest[i].obeyPhysics = true;
        }    
    } else {
        findClosest(getPositionInFrontOfCamera())
    }


    // let ThreeJSContainer = document.getElementById("ThreeJSContainer");
    // ThreeJSContainer.releaseCapture();
}

function onMouseWheel(event) {
    camera3D.fov += event.deltaY * 0.05;
    camera3D.fov = Math.min(120, Math.max(10, camera3D.fov));
    camera3D.updateProjectionMatrix();
    findClosest(getPositionInFrontOfCamera())
}

function computeCameraOrientation() {
    lat = Math.max(- 50, Math.min(50, lat));  //restrict movement
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