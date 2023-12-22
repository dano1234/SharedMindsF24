import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';
import { UMAP } from 'https://cdn.skypack.dev/umap-js';
import { initFirebase, storeEmbeddingInFirebase, setImageInFirebase } from './firebaseMOD.js';

let distanceFromCenter = 800;

let camera3D, scene, renderer;

const replicateProxy = "https://replicate-api-proxy.glitch.me"
let objects = [];
let hitTestableThings = [];  //things that will be tested for intersection
let in_front_of_you;
let myPrompts = [];

initWebInterface();
init3D();
initFirebase();

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

async function askForEmbedding(p_prompt) {
    //let promptInLines = p_prompt.replace(/,/g,) "\n";
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
    console.log("url", url, "options", options);
    const raw = fetch(url, options)
        .then(response => response.json())
        .then(data => {
            storeEmbeddingInFirebase(data.output[0].input, data.output[0].embedding, getPositionInFrontOfCamera());
            //runUMAP(data);
            //startLoadingImages();
            console.log("got embedding", data.output);

        });

}

function startLoadingImages() {
    document.getElementById("feedback").innerHTML = "Loading Images...";
    let whichObject = 0;
    setInterval(() => {
        if (!objects[whichObject].image) {
            askForPicture(objects[whichObject]);
        } else {
            document.getElementById("feedback").innerHTML = "Loaded Images";
        }
        whichObject++;
        console.log("whichObject", objects[whichObject]);
    }, 10000);
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

export function placeImage(key, text, embedding, pos, base64Image) {
    console.log("placeImage", pos);
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    let size = 128;
    canvas.height = size;
    canvas.width = size;
    if (base64Image) {
        //Loading of the home test image - img1
        var incomingImage = new Image();
        incomingImage.crossOrigin = "anonymous";
        incomingImage.onload = function () {
            rePaintObject(ctx, text, incomingImage, canvas, false);
        };
        incomingImage.src = base64Image;
    } else {
        askForPicture(text, key);
        rePaintObject(ctx, text, null, canvas, true)
    }
    //ctx.drawImage(img, 0, 0);
    //let teture = new THREE.TextureLoader().load(img);
    let texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    //console.log(img, texture);
    var material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });

    var geo = new THREE.PlaneGeometry(size, size);
    var mesh = new THREE.Mesh(geo, material);
    mesh.position.x = pos[0] * distanceFromCenter - distanceFromCenter / 2;
    mesh.position.y = pos[1] * distanceFromCenter / 4 - distanceFromCenter / 8;  //dont go too high or low
    mesh.position.z = pos[2] * distanceFromCenter - distanceFromCenter / 2;
    //console.log("mesh.position", mesh.position);
    mesh.lookAt(0, 0, 0);
    //mesh.scale.set(10,10, 10);
    scene.add(mesh);
    hitTestableThings.push(mesh);//make a list for the raycaster to check for intersection
    objects.push({ "dbKey": key, "embedding": embedding, "object": mesh, "uuid": mesh.uuid, "texture": texture, "text": text, "context": ctx, "image": null, "canvas": canvas });
}

function rePaintObject(ctx, text, image, canvas, showText) {
    let textParts = text.split(" ");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (image) {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    } else {
        showText = true; //so far only have the text to show
    }
    if (showText) {
        ctx.font = '12px Arial';
        ctx.fillStyle = 'white';
        for (let i = 0; i < textParts.length; i++) {
            const metrics = ctx.measureText(textParts[i]);
            ctx.fillText(textParts[i], canvas.width / 2 - metrics.width / 2, 10 + i * 12);
        }
    }
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
            console.log("clicked On", thisObject.text);
            rePaintObject(thisObject.context, thisObject.text, thisObject.image, thisObject.canvas, true);
            thisObject.texture.needsUpdate = true;
        } else {
            rePaintObject(thisObject.context, thisObject.text, thisObject.image, thisObject.canvas, false);
            thisObject.texture.needsUpdate = true;
        }
    }
    return intersectedObjectUUID;
}

async function askForPicture(text, key) {
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
    console.log("Proxy Returned", proxy_said);
    if (proxy_said.output.length == 0) {
        alert("Something went wrong, try it again");
    } else {
        // inputField.value = prompt;
        //Loading of the home test image - img1
        var incomingImage = new Image();
        incomingImage.crossOrigin = "anonymous";
        incomingImage.onload = function () {

            let object;
            for (let i = 0; i < objects.length; i++) {
                if (objects[i].dbKey == key) {
                    object = objects[i];
                    break;
                }
            }
            if (!object) {
                console.log("could not find object", key);
                return;
            }
            object.image = incomingImage;
            rePaintObject(object.context, object.text, object.image, object.canvas, false);
            setImageInFirebase(key, object.canvas.toDataURL("image/png", 1.0));
        };
        incomingImage.src = proxy_said.output[0];
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
    var geometryFront = new THREE.BoxGeometry(1, 1, 1);
    var materialFront = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    in_front_of_you = new THREE.Mesh(geometryFront, materialFront);
    camera3D.add(in_front_of_you); // then add in front of the camera (not scene) so it follow it

    moveCameraWithMouse();

    camera3D.position.z = 5;
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

    var input_image_field = document.createElement("input");
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
            askForEmbedding(input_image_field.value);
        }
    });
    webInterfaceContainer.append(input_image_field);
}


function animate() {
    requestAnimationFrame(animate);
    for (let i = 0; i < objects.length; i++) {
        objects[i].texture.needsUpdate = true;
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

