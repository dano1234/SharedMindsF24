import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.module.min.js';
import { initMoveCameraWithMouse, initHTML } from './interaction.js';
import * as FB from './firebaseStuffPhotoAuth.js';



let camera, scene, renderer;

let myObjectsByThreeID = {}  //for converting from three.js object to my JSON object
let clickableMeshes = []; //for use with raycasting
let myObjectsByFirebaseKey = {}; //for converting from firebase key to my JSON object


let exampleName = "SharedMindsExampleGroupPhoto";
initHTML();
init3D();
FB.initFirebase();
listenForChanges();


export function moveObject(selectedObject, x, y) {
    let pos = project2DCoordsInto3D(100, { x: x, y: y });
    const updates = { position: pos };
    let title = document.getElementById("title").value;
    const dbPath = exampleName + "/" + "/people/" + FB.getUser().uid;
    FB.updateJSONFieldInFirebase(dbPath, selectedObject.firebaseKey, updates);
}



export function takePicture(mouse, videoCanvas) {

    let user = FB.getUser();
    if (!user) {
        alert("You must be logged in to take a picture");
        console.log("no user");
        return;
    }
    let userName = user.displayName;
    if (!userName) userName = user.email.split("@")[0];
    userName = userName.split(" ")[0];

    const pos = project2DCoordsInto3D(150 - camera.fov, mouse);

    let base64 = videoCanvas.toDataURL();
    const data = { type: "image", position: { x: pos.x, y: pos.y, z: pos.z }, base64: base64, userName: userName };

    //use set instead of add to enforce one picture per user

    const dbPath = exampleName + "/" + "/people/" + user.uid;
    FB.setDataInFirebase(dbPath, data);

}



function listenForChanges() {

    FB.subscribeToData(exampleName + "/" + "/people/", (reaction, data, key) => {
        if (data) {
            if (reaction === "added") {
                let newImage = new Image();
                newImage.onload = function () {
                    createNewFace(newImage, data.position, data.userName, key);
                }
                newImage.src = data.base64;
            } else if (reaction === "changed") {
                console.log("changed", data);
                let newImage = new Image();
                newImage.onload = function () {
                    let thisObject = myObjectsByFirebaseKey[key];
                    thisObject.img = newImage;
                    thisObject.position = data.position;
                    thisObject.userName = data.userName;
                    redrawFace(thisObject);
                }
                newImage.src = data.base64;



            } else if (reaction === "removed") {
                console.log("removed", data);
                let thisObject = myObjectsByFirebaseKey[key];
                if (thisObject) {
                    scene.remove(thisObject.mesh);
                    delete myObjectsByThreeID[thisObject.threeID];
                }
            }
        }; //get notified if anything changes in this folder
    });
}



export function addFaceRemote(b64, mouse) {
    let title = document.getElementById("title").value;
    const pos = project2DCoordsInto3D(150 - camera.fov, mouse);
    let user = FB.getUser();
    if (!user) return;
    let userName = user.displayName;
    if (!userName) userName = user.email.split("@")[0];
    const data = { type: "image", position: { x: pos.x, y: pos.y, z: pos.z }, base64: b64, userName: user.displayName };
    let folder = exampleName + "/" + title + "/frames/" + currentFrame;
    console.log("Entered Image, Send to Firebase", folder, title, exampleName);
    FB.addNewThingToFirebase(folder, data);//put empty for the key when you are making a new thing.
}



export function findObjectUnderMouse(x, y) {
    let raycaster = new THREE.Raycaster(); // create once
    //var mouse = new Vector2(); // create once
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
    // let bgGeometery = new CylinderGeometry(725, 725, 1000, 10, 10, true)
    bgGeometery.scale(-1, 1, 1);
    // has to be power of 2 like (4096 x 2048) or(8192x4096).  i think it goes upside down because texture is not right size
    let panotexture = new THREE.TextureLoader().load("itp.jpg");
    // let material = new MeshBasicMaterial({ map: panotexture, transparent: true,   alphaTest: 0.02,opacity: 0.3});
    let backMaterial = new THREE.MeshBasicMaterial({ map: panotexture });
    let back = new THREE.Mesh(bgGeometery, backMaterial);
    scene.add(back);

    initMoveCameraWithMouse(camera, renderer);

    camera.position.z = 0;
    animate();
}

function animate() {
    for (let key in myObjectsByFirebaseKey) {
        let thisObject = myObjectsByFirebaseKey[key];
        thisObject.texture.needsUpdate = true;
    }
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function createNewFace(img, posInWorld, userName, firebaseKey) {

    let canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    let context = canvas.getContext("2d");
    let texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    let material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, alphaTest: 0.5 });
    let geo = new THREE.PlaneGeometry(canvas.width / canvas.width, canvas.height / canvas.width);
    let mesh = new THREE.Mesh(geo, material);

    mesh.lookAt(0, 0, 0);
    mesh.scale.set(10, 10, 10);
    scene.add(mesh);
    let base64 = canvas.toDataURL();
    let thisObject = {
        type: "image", firebaseKey: firebaseKey, userName: userName, position: posInWorld, context: context, texture: texture, img: img, base64: base64, threeID: mesh.uuid, position: posInWorld, canvas: canvas, mesh: mesh, texture: texture
    };
    redrawFace(thisObject);
    clickableMeshes.push(mesh);
    myObjectsByThreeID[mesh.uuid] = thisObject;
    myObjectsByFirebaseKey[firebaseKey] = thisObject;
}

function redrawFace(object) {

    let img = object.img;
    object.context.drawImage(img, 0, 0);
    let fontSize = Math.max(12);
    object.context.font = fontSize + "pt Arial";
    object.context.textAlign = "center";
    object.context.fillStyle = "red";
    object.context.fillText(object.userName, object.canvas.width / 2, object.canvas.height - 30);
    object.mesh.position.x = object.position.x;
    object.mesh.position.y = object.position.y;
    object.mesh.position.z = object.position.z;
    object.mesh.lookAt(0, 0, 0);
    object.texture.needsUpdate = true;
}


