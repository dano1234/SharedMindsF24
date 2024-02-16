import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.module.min.js';
import * as FB from './firebaseStuff.js';
import { initMoveCameraWithMouse, initHTML } from './interaction.js';
import { SharedMindsText } from './TextObjectClass.js';
import { SharedMindsImage } from './ImageObjectClass.js';
import { SharedMindsP5Sketch } from './P5ObjectClass.js';


let camera, scene, renderer;
let texturesThatNeedUpdating = [];  //for updating textures
let myObjectsByThreeID = {}  //for converting from three.js object to my JSON object
let clickableMeshes = []; //for use with raycasting
let myObjectsByFirebaseKey = {}; //for converting from firebase key to my JSON object


initHTML();
init3D();
recall();

function recall() {
    console.log("recall");
    FB.subscribeToData('objects'); //get notified if anything changes in this folder
}

function fileObjectInVariousPlaces(newObject) {
    scene.add(newObject.mesh);
    texturesThatNeedUpdating.push(newObject);
    clickableMeshes.push(newObject.mesh);
    myObjectsByThreeID[newObject.mesh.uuid] = newObject;
    myObjectsByFirebaseKey[newObject.firebaseKey] = newObject;
}

export function reactToFirebase(reaction, data, key) {
    if (reaction === "added") {
        let newObject;
        if (data.type === "text") {
            newObject = new SharedMindsText(data.text, data.position, key);
            fileObjectInVariousPlaces(newObject);
        } else if (data.type === "image") {
            let img = new Image();  //create a new image
            img.onload = function () {
                newObject = new SharedMindsImage(img, data.position, data.base64, key);
                fileObjectInVariousPlaces(newObject);
            }
            console.log("new img", newObject);
            img.src = data.base64;
        } else if (data.type === "p5ParticleSystem") {
            newObject = new SharedMindsP5Sketch(data.position, key);
            fileObjectInVariousPlaces(newObject);
            console.log("new p5", newObject);
        }

    } else if (reaction === "changed") {
        console.log("changed", data);
        let thisObject = myObjectsByFirebaseKey[key];
        if (thisObject) {
            if (data.type === "text") {
                thisObject.text = data.text;
                thisObject.position = data.position;
                thisObject.redraw();
            } else if (data.type === "image") {
                let img = new Image();  //create a new image
                img.onload = function () {
                    thisObject.img = img;
                    thisObject.position = data.position;
                    thisObject.redraw();
                }
                img.src = data.base64;

            } else if (data.type === "p5ParticleSystem") {
                thisObject.position = data.position;
                thisObject.redraw();
            }
        }
    } else if (reaction === "removed") {
        console.log("removed", data);
        let thisObject = myObjectsByFirebaseKey[key];
        if (thisObject) {
            scene.remove(thisObject.mesh);
            delete myObjectsByThreeID[thisObject.threeID];
        }
    }
}



export function findObjectUnderMouse(x, y) {
    let raycaster = new THREE.Raycaster(); // create once
    //var mouse = new THREE.Vector2(); // create once
    let mouse = {};
    mouse.x = (x / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = - (y / renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    let intersects = raycaster.intersectObjects(clickableMeshes, false);

    // if there is one (or more) intersections
    let hitObject = null;
    if (intersects.length > 0) {
        let hitMesh = intersects[0].object; //closest objec
        hitObject = myObjectsByThreeID[hitMesh.uuid]; //use look up table assoc array

    }
    return hitObject;
    //console.log("Hit ON", hitMesh);
}

export function project2DCoordsInto3D(distance, mouse) {
    let vector = new THREE.Vector3();
    vector.set(
        (mouse.x / window.innerWidth) * 2 - 1,
        - (mouse.y / window.innerHeight) * 2 + 1,
        0
    );
    //vector.set(0, 0, 0); //would be middle of the screen where input box is
    vector.unproject(camera);
    vector.multiplyScalar(distance)
    return vector;
}

function init3D() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.target = new THREE.Vector3(0, 0, 0);  //mouse controls move this around and camera looks at it 
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    ///document.body.appendChild(renderer.domElement);

    //this puts the three.js stuff in a particular div
    document.getElementById('THREEcontainer').appendChild(renderer.domElement)

    let bgGeometery = new THREE.SphereGeometry(1000, 60, 40);
    // let bgGeometery = new THREE.CylinderGeometry(725, 725, 1000, 10, 10, true)
    bgGeometery.scale(-1, 1, 1);
    // has to be power of 2 like (4096 x 2048) or(8192x4096).  i think it goes upside down because texture is not right size
    let panotexture = new THREE.TextureLoader().load("itp.jpg");
    // let material = new THREE.MeshBasicMaterial({ map: panotexture, transparent: true,   alphaTest: 0.02,opacity: 0.3});
    let backMaterial = new THREE.MeshBasicMaterial({ map: panotexture });
    let back = new THREE.Mesh(bgGeometery, backMaterial);
    scene.add(back);

    initMoveCameraWithMouse(camera, renderer);

    camera.position.z = 0;
    animate();
}

function animate() {
    for (let i = 0; i < texturesThatNeedUpdating.length; i++) {
        texturesThatNeedUpdating[i].texture.needsUpdate = true;
    }
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}








