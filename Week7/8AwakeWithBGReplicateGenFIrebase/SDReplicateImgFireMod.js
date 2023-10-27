
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-analytics.js";
import { getDatabase, ref, onValue, set, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries


const firebaseConfig = {
    apiKey: "AIzaSyAvM1vaJ3vcnfycLFeb8RDrTN7O2ToEWzk",
    authDomain: "shared-minds.firebaseapp.com",
    projectId: "shared-minds",
    storageBucket: "shared-minds.appspot.com",
    messagingSenderId: "258871453280",
    appId: "1:258871453280:web:4c103da9b230e982544505",
    measurementId: "G-LN0GNWFZQQ"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
let db;
let appName = "360BGReplicateGenFirebase";

let camera3D, scene, renderer;

const replicateProxy = "https://replicate-api-proxy.glitch.me"
let images = [];
let in_front_of_you;

init3D();

var input_image_field = document.createElement("input");
input_image_field.type = "text";
input_image_field.id = "input_image_prompt";
input_image_field.value = "Nice picture of a dog";
input_image_field.style.position = "absolute";
input_image_field.style.fontSize = "20px";
input_image_field.style.width = "400px";
input_image_field.style.top = "50%";
input_image_field.style.left = "50%";
input_image_field.style.transform = "translate(-50%, -50%)";



document.getElementById("webInterfaceContainer").append(input_image_field);
input_image_field.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        askForPicture(input_image_field);
    }
});



async function askForPicture(inputField) {
    prompt = inputField.value;
    inputField.value = "Waiting for reply for:" + prompt;
    let data = {
        "version": "c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316",
        input: {
            "prompt": prompt,
            "width": 1024,
            "height": 512,
        },
    };
    console.log("Asking for Picture Info From Replicate via Proxy", data);
    let options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };
    const url = replicateProxy + "/create_n_get/"
    console.log("url", url, "options", options);
    const picture_info = await fetch(url, options);
    //console.log("picture_response", picture_info);
    const proxy_said = await picture_info.json();

    if (proxy_said.output.length == 0) {
        alert("Something went wrong, try it again");
    } else {
        inputField.value = prompt;
        //Loading of the home test image - img1
        var incomingImage = new Image();
        incomingImage.crossOrigin = "anonymous";
        incomingImage.onload = function () {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.height = incomingImage.naturalHeight;
            canvas.width = incomingImage.naturalWidth;
            ctx.drawImage(incomingImage, 0, 0);
            const base64Image = canvas.toDataURL();

            sendImageToFirebase(base64Image, prompt);
        };
        incomingImage.src = proxy_said.output[0];
    }
}
init3D();
initFirebase();

function initFirebase() {
    console.log("init");
    let nameField = document.createElement('name');
    document.body.append(nameField);
    db = getDatabase();
    // //let name = localStorage.getItem('fb_name');
    // if (!name) {
    //     name = prompt("Enter Your Name Here");
    //     //localStorage.setItem('fb_name', name);  //save name
    // }
    // console.log("name", name);
    // if (name) {
    //     nameField.value = name;
    // }
    subscribeToImages()
}

function subscribeToImages() {
    const commentsRef = ref(db, appName + '/images/');
    onChildAdded(commentsRef, (data) => {
        // console.log("added", data.key, data.val().image, data.val().location);
        var incomingImage = new Image();
        incomingImage.crossOrigin = "anonymous";
        incomingImage.onload = function () {
            placeImage(incomingImage, data.val().location);
        };
        let b64 = data.val().base64Image; //.split(',')[1];
        console.log("source data.val().base64Image", b64);
        incomingImage.src = b64;

    });
    onChildChanged(commentsRef, (data) => {
        console.log("changed", data.key, data);
    });
    onChildRemoved(commentsRef, (data) => {
        console.log("removed", data.key, data.val());
    });
}

function sendImageToFirebase(base64Image, prompt) {
    let pos = getPositionInFrontOfCamera()
    let dataToSet = {
        prompt: prompt,
        base64Image: base64Image,
        location: { "x": pos.x, "y": pos.y, "z": pos.z }
    }
    console.log("dataToSet", dataToSet);
    push(ref(db, appName + '/images/'), dataToSet);
}

function init3D() {
    scene = new THREE.Scene();
    camera3D = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("ThreeJSContainer").append(renderer.domElement);

    //just a place holder the follows the camera and marks location to drop incoming  pictures
    //tiny little dot (could be invisible) 
    var geometryFront = new THREE.BoxGeometry(1, 1, 1);
    var materialFront = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    in_front_of_you = new THREE.Mesh(geometryFront, materialFront);
    camera3D.add(in_front_of_you); // then add in front of the camera (not scene) so it follow it

    moveCameraWithMouse();

    camera3D.position.z = 5;
    animate();
}

function getPositionInFrontOfCamera() {
    const posInWorld = new THREE.Vector3();
    in_front_of_you.position.set(0, 0, -(600 - camera3D.fov * 3));  //base the the z position on camera field of view
    in_front_of_you.getWorldPosition(posInWorld);
    return posInWorld;
}


function placeImage(img, pos) {
    console.log("placeImage", img, pos);
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    canvas.height = img.height;
    canvas.width = img.width;
    ctx.drawImage(img, 0, 0);
    let texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    console.log(img, texture);
    var material = new THREE.MeshBasicMaterial({ map: texture, transparent: false });

    var geo = new THREE.PlaneGeometry(512, 512);
    var mesh = new THREE.Mesh(geo, material);
    mesh.position.x = pos.x;
    mesh.position.y = pos.y;
    mesh.position.z = pos.z;
    mesh.lookAt(0, 0, 0);
    //mesh.scale.set(10,10, 10);
    scene.add(mesh);
    images.push({ "object": mesh, "texture": texture });
}


function animate() {
    requestAnimationFrame(animate);
    for (var i = 0; i < images.length; i++) {
        images[i].texture.needsUpdate = true;
    }
    renderer.render(scene, camera3D);
}

/////MOUSE STUFF

//var onMouseDownMouseX = 0, onMouseDownMouseY = 0;
var onPointerDownPointerX = 0, onPointerDownPointerY = 0;
var lon = -90, onPointerDownLon = 0;
var lat = 0, onPointerDownLat = 0;
var isUserInteracting = false;


function moveCameraWithMouse() {
    let ThreeJSContainer = document.getElementById("ThreeJSContainer");
    ThreeJSContainer.addEventListener('keydown', onDocumentKeyDown, false);
    ThreeJSContainer.addEventListener('mousedown', onDocumentMouseDown, false);
    ThreeJSContainer.addEventListener('mousemove', onDocumentMouseMove, false);
    ThreeJSContainer.addEventListener('mouseup', onDocumentMouseUp, false);
    ThreeJSContainer.addEventListener('wheel', onDocumentMouseWheel, false);
    window.addEventListener('resize', onWindowResize, false);
    camera3D.target = new THREE.Vector3(0, 0, 0);
}

function onDocumentKeyDown(event) {
    //if (event.key == " ") {
    //in case you want to track key presses
    //}
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
