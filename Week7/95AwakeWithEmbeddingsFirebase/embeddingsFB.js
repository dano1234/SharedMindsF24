import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';
import { UMAP } from 'https://cdn.skypack.dev/umap-js';
import { initFirebase, storeInFirebase } from './firebaseMOD.js';

let distanceFromCenter = 800;

let camera3D, scene, renderer;

const replicateProxy = "https://replicate-api-proxy.glitch.me"
let objects = [];
let hitTestableThings = [];  //things that will be tested for intersection
let in_front_of_you;
var input_image_field;

initWebInterface();
init3D();
initFirebase("3DEmbeddingsFirebase", "imagesAndEmbeddings");

function runUMAP(data) {
    let embeddingsAndPrompts = data.output;
    //comes back with a list of embeddings and prompts, single out the embeddings for UMAP
    let embeddings = [];
    for (let i = 0; i < embeddingsAndPrompts.length; i++) {
        embeddings.push(embeddingsAndPrompts[i].embedding);
    }
    //let fittings = runUMAP(embeddings);
    var myrng = new Math.seedrandom('hello.');
    let umap = new UMAP({
        nNeighbors: 4,
        minDist: .05,
        nComponents: 3,
        random: myrng,  //special library seeded random so it is the same randome numbers every time
        spread: 1,
        //distanceFn: 'cosine',
    });
    let fittings = umap.fit(embeddings);
    fittings = normalize(fittings);  //normalize to 0-1
    for (let i = 0; i < embeddingsAndPrompts.length; i++) {
        placeImage(embeddingsAndPrompts[i].input, fittings[i]);
    }
    //console.log("fitting", fitting);
}

async function askForAll() {
    let all = {}
    let embedding = await askForEmbedding(input_image_field.value);
    all.embedding = embedding;
    all.prompt = input_image_field.value;
    let imageURL = await askForPicture(input_image_field.value);
    let b64 = await convertURLToBase64(imageURL);
    all.image = { base64Image: b64, url: imageURL };
    all.location = getPositionInFrontOfCamera();
    storeInFirebase(all);
}

async function askForEmbedding(p_prompt) {
    //let promptInLines = p_prompt.replace(/,/g,) "\n";  //replace commas with new lines
    p_prompt = p_prompt + "\n"
    let data = {
        version: "75b33f253f7714a281ad3e9b28f63e3232d583716ef6718f2e46641077ea040a",
        input: {
            inputs: p_prompt,
        },
    };
    console.log("Asking for Embedding Similarities From Replicate via Proxy", data);
    let options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };
    const url = replicateProxy + "/create_n_get/";
    let rawResponse = await fetch(url, options)
    let jsonData = await rawResponse.json();
    return jsonData.output[0].embedding;
}

function normalize(arrayOfNumbers) {
    //find max and min in the array
    let max = [0, 0, 0];
    let min = [0, 0, 0];
    for (let i = 0; i < arrayOfNumbers.length; i++) {
        for (let j = 0; j < 3; j++) {
            if (arrayOfNumbers[i][j] > max[j]) {
                max[j] = arrayOfNumbers[i][j];
            }
            if (arrayOfNumbers[i][j] < min[j]) {
                min[j] = arrayOfNumbers[i][j];
            }
        }
    }
    console.log("max", max, "min", min);
    //normalize
    for (let i = 0; i < arrayOfNumbers.length; i++) {
        for (let j = 0; j < 3; j++) {
            arrayOfNumbers[i][j] = (arrayOfNumbers[i][j] - min[j]) / (max[j] - min[j]);
        }
    }
    return arrayOfNumbers;
}

function findObjectByKey(key) {
    for (let i = 0; i < objects.length; i++) {
        if (objects[i].dbKey == key) {
            return objects[i];
        }
    }
    return null;
}

export function updateObject(key, data) {
    let text = data.prompt;
    let embedding = data.embedding;
    let pos = data.location;
    let image = data.image;
    console.log("updateObject", pos);
    let thisObject = findObjectByKey(key);
    if (!thisObject) {
        console.log("could not find object", key);
        return;
    }
    thisObject.text = text;
    thisObject.embedding = embedding;
    thisObject.mesh.position.x = pos.x;
    thisObject.mesh.position.y = pos.y;
    thisObject.mesh.position.z = pos.z;
    thisObject.mesh.lookAt(0, 0, 0);
    if (image) {
        //Loading of the home test image - img1
        var incomingImage = new Image();
        incomingImage.crossOrigin = "anonymous";
        incomingImage.onload = function () {
            thisObject.image = incomingImage;
        };
        incomingImage.src = image.base64Image;
    }
}


export function createObject(key, data) {
    //get stuff from firebase
    let text = data.prompt;
    let embedding = data.embedding;
    let pos = data.location;
    let image = data.image;

    //create a texturem mapped 3D object
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    let size = 128;
    canvas.height = size;
    canvas.width = size;

    //let teture = new THREE.TextureLoader().load(img);
    let texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    var material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    var geo = new THREE.PlaneGeometry(size, size);
    var mesh = new THREE.Mesh(geo, material);
    mesh.position.x = pos.x
    mesh.position.y = pos.y
    mesh.position.z = pos.z
    mesh.lookAt(0, 0, 0);
    scene.add(mesh);
    hitTestableThings.push(mesh);//make a list for the raycaster to check for intersection
    //leave the image null for now
    let thisObject = { "dbKey": key, "embedding": embedding, "mesh": mesh, "uuid": mesh.uuid, "texture": texture, "text": text, "show_text": false, "context": ctx, "image": null, "canvas": canvas };
    objects.push(thisObject);
    if (image) {
        let incomingImage = new Image();
        thisObject.image = incomingImage;
        incomingImage.crossOrigin = "anonymous";
        incomingImage.onload = function () {
            console.log("loaded image", thisObject.text);
        };
        incomingImage.src = image.base64Image;
    }
    return thisObject;
}

function repaintObject(object) {
    let texture = object.texture;
    let text = object.text;
    let image = object.image;
    let ctx = object.context;
    let canvas = object.canvas;

    let textParts = text.split(" ");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (image) {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    } else {
        object.showText = true; //so far only have the text to show
    }
    if (object.showText) {
        ctx.font = '12px Arial';
        ctx.fillStyle = 'white';
        for (let i = 0; i < textParts.length; i++) {
            const metrics = ctx.measureText(textParts[i]);
            ctx.fillText(textParts[i], canvas.width / 2 - metrics.width / 2, 10 + i * 12);
        }
    }
    texture.needsUpdate = true;
}

//mouse can click on objects thanks to the raycaster, this iis 
function getIntersectedObjectUUID(event) {
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera3D);
    var intersects = raycaster.intersectObjects(hitTestableThings);
    let intersectedObjectUUID = -1;   //will never match but go through all the items anyway
    if (intersects.length > 0) {
        intersectedObjectUUID = intersects[0].object.uuid //take the first, closesest, object
    }
    for (let i = 0; i < objects.length; i++) {
        let thisObject = objects[i];
        if (thisObject.uuid == intersectedObjectUUID) {
            thisObject.showText = !thisObject.showText;  //toggle the text
            console.log("clicked On", thisObject.text);
            break;
        }
    }
    return intersectedObjectUUID;
}

async function askForPicture(text) {
    input_image_field.value = "Waiting for reply for:" + text;
    // prompt = inputField.value;
    //inputField.value = "Waiting for reply for:" + prompt;
    let data = {
        "version": "c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316",
        input: {
            "prompt": text,
            "width": 512,
            "height": 512,
        },
    };
    //console.log("Asking for Picture Info From Replicate via Proxy", data);
    let options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };
    const url = replicateProxy + "/create_n_get/"
    //console.log("url", url, "options", options);
    const picture_info = await fetch(url, options);
    //console.log("picture_response", picture_info);
    const proxy_said = await picture_info.json();
    console.log("Proxy Returned", proxy_said);
    if (proxy_said.output.length == 0) {
        alert("Something went wrong, try it again");
    } else {
        input_image_field.value = text;
        return proxy_said.output[0];
    }
}

function init3D() {
    scene = new THREE.Scene();
    camera3D = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("ThreeJSContainer").append(renderer.domElement);


    //just a place holder the follows the camera and marks location to drop incoming  pictures
    //tiny little dot (could be invisible) 
    var geometryFront = new THREE.BoxGeometry(10, 10, 10);
    var materialFront = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    in_front_of_you = new THREE.Mesh(geometryFront, materialFront);
    in_front_of_you.position.set(0, 0, -distanceFromCenter);  //base the the z position on camera field of view
    camera3D.add(in_front_of_you); // then add in front of the camera (not scene) so it follow it
    scene.add(camera3D);
    moveCameraWithMouse();

    camera3D.position.z = 0;
    animate();
}

export function getPositionInFrontOfCamera() {
    const posInWorld = new THREE.Vector3();
    in_front_of_you.position.set(0, 0, -distanceFromCenter);  //base the the z position on camera field of view
    in_front_of_you.getWorldPosition(posInWorld);
    return posInWorld;
}

function initWebInterface() {
    // input_image_field.style.transform = "translate(-50%, -50%)";
    var webInterfaceContainer = document.createElement("div");
    webInterfaceContainer.id = "webInterfaceContainer";

    webInterfaceContainer.style.position = "absolute";
    webInterfaceContainer.style.zIndex = "200";
    webInterfaceContainer.style.top = "15%";
    webInterfaceContainer.style.left = "50%";
    webInterfaceContainer.style.transform = "translate(-50%, -50%)";
    webInterfaceContainer.style.position = "absolute";
    webInterfaceContainer.style.height = "20%";
    //webInterfaceContainer.append(input_image_field);
    document.body.append(webInterfaceContainer);

    let ThreeJSContainer = document.createElement("div");
    ThreeJSContainer.style.zIndex = "1";
    ThreeJSContainer.id = "ThreeJSContainer";
    ThreeJSContainer.style.position = "absolute";
    ThreeJSContainer.style.top = "0px";
    ThreeJSContainer.style.left = "0px";
    ThreeJSContainer.style.width = "100%";
    ThreeJSContainer.style.height = "100%";
    document.body.append(ThreeJSContainer);

    let feedback = document.createElement("div");
    feedback.id = "feedback";
    feedback.style.position = "absolute";
    feedback.style.zIndex = "200";
    feedback.innerHTML = "Ready";
    feedback.style.width = "100%";
    feedback.style.textAlign = "center";
    feedback.style.top = "80%";
    feedback.style.left = "50%";
    feedback.style.transform = "translate(-50%, -50%)";
    feedback.style.fontSize = "20px";
    feedback.style.color = "white";
    webInterfaceContainer.append(feedback);

    input_image_field = document.createElement("input");
    webInterfaceContainer.append(input_image_field);
    input_image_field.type = "text";
    input_image_field.id = "input_image_prompt";
    input_image_field.value = "Nice picture of a dog";
    input_image_field.style.position = "absolute";
    input_image_field.style.fontSize = "20px";
    input_image_field.style.width = "400px";
    input_image_field.style.top = "20%";
    input_image_field.style.left = "50%";
    input_image_field.style.transform = "translate(-50%, -50%)";
    input_image_field.addEventListener("keyup", function (event) {
        if (event.key === "Enter") {
            askForAll();
        }
    });
    //make a button in the upper right corner called "GOD" that will create many new objects\

    let GodButton = document.createElement("GodButton");
    GodButton.innerHTML = "GOD";
    GodButton.style.position = "absolute";
    GodButton.style.top = "50%";
    GodButton.style.right = "10%";
    GodButton.style.zIndex = "200";
    GodButton.style.fontSize = "20px";
    GodButton.style.color = "white";
    GodButton.addEventListener("click", function () {
        createManyObjects();
    });
    webInterfaceContainer.append(GodButton);
    //make a button in the upper right corner called "THANOS" that will remove many new objects
    let ThanosButton = document.createElement("button");
    ThanosButton.innerHTML = "THANOS";
    ThanosButton.style.position = "absolute";
    ThanosButton.style.top = "50%";
    ThanosButton.style.left = "10%";
    ThanosButton.style.zIndex = "200";
    ThanosButton.style.fontSize = "20px";
    ThanosButton.style.color = "white";
    ThanosButton.addEventListener("click", function () {
        removeManyObjects();
    });
    webInterfaceContainer.append(ThanosButton);

}

async function convertURLToBase64(url) {
    var incomingImage = new Image();
    incomingImage.crossOrigin = "anonymous";
    incomingImage.src = url;
    await incomingImage.decode();
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    canvas.height = incomingImage.height;
    canvas.width = incomingImage.width;
    ctx.drawImage(incomingImage, 0, 0, canvas.width, canvas.height);
    let base64 = canvas.toDataURL("image/png", 1.0);
    return base64;
}

function animate() {
    requestAnimationFrame(animate);
    for (let i = 0; i < objects.length; i++) {
        repaintObject(objects[i]);
    }
    renderer.render(scene, camera3D);
}

/////MOUSE STUFF

//var onMouseDownMouseX = 0, onMouseDownMouseY = 0;
var onPointerDownPointerX = 0, onPointerDownPointerY = 0;
var lon = -90, onPointerDownLon = 0;
var lat = 0, onPointerDownLat = 0;
var isUserInteracting = false;


function onDocumentMouseDown(event) {
    let intersectedObjectUUID = getIntersectedObjectUUID(event);
    if (intersectedObjectUUID == -1) { //if no object was intersected, start navigation
        onPointerDownPointerX = event.clientX;
        onPointerDownPointerY = event.clientY;
        onPointerDownLon = lon;
        onPointerDownLat = lat;
        isUserInteracting = true;
    }
}

function moveCameraWithMouse() {
    let ThreeJSContainer = document.getElementById("ThreeJSContainer");
    ThreeJSContainer.addEventListener('keydown', onDocumentKeyDown, false);
    ThreeJSContainer.addEventListener('mousedown', onDocumentMouseDown, false);
    ThreeJSContainer.addEventListener('mousemove', onDocumentMouseMove, false);
    ThreeJSContainer.addEventListener('mouseup', onDocumentMouseUp, false);
    window.addEventListener('wheel', onDocumentMouseWheel, false);
    window.addEventListener('resize', onWindowResize, false);
    camera3D.target = new THREE.Vector3(0, 0, 0);
}

function onDocumentKeyDown(event) {
    //if (event.key == " ") {
    //in case you want to track key presses
    //}
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

