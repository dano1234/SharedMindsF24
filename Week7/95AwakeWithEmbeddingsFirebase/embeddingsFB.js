
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-analytics.js";
import { getDatabase, ref, onValue, set, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";
//umap-js.min.js



// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries



let db;
let appName = "EmbeddingClusters";
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
    webInterfaceContainer.style.height = "10%";
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

    let button = document.createElement("button");
    button.innerHTML = "Load All Prompts";
    button.style.position = "absolute";
    button.style.top = "10%";
    button.style.left = "50%";
    button.style.transform = "translate(-50%, -50%)";
    button.style.fontSize = "20px";
    button.style.zIndex = "200";
    button.addEventListener("click", function () {
        let dataForReplicate = "";
        for (let i = 0; i < myPrompts.length; i++) {
            dataForReplicate += myPrompts[i] + "\n";
        }
        askForEmbeddings(dataForReplicate)
    });
    document.body.append(button);
}

function runUMAP(embeddings) {
    var myrng = new Math.seedrandom('hello.');
    let umap = new UMAP({
        nNeighbors: 4,
        minDist: .05,
        nComponents: 3,
        random: myrng,
        spread: 1,
        //distanceFn: 'cosine',
    });
    const fitting = umap.fit(embeddings);
    console.log("fitting", fitting);
    return fitting;

}

async function askForEmbeddings(p_prompt) {
    let promptInLines = p_prompt.replace(/,/g, "\n");
    let data = {
        version: "75b33f253f7714a281ad3e9b28f63e3232d583716ef6718f2e46641077ea040a",
        input: {
            inputs: promptInLines,
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
            let embeddingsAndPrompts = data.output;
            console.log("embeddingsAndPrompts", embeddingsAndPrompts);
            let embeddings = [];
            for (let i = 0; i < embeddingsAndPrompts.length; i++) {
                embeddings.push(embeddingsAndPrompts[i].embedding);
            }
            let fittings = runUMAP(embeddings);
            fittings = normalize(fittings);

            for (let i = 0; i < embeddingsAndPrompts.length; i++) {
                placeImage(embeddingsAndPrompts[i].input, fittings[i]);
                //embeddingsAndPrompts[i].embedding = fittings[i];
            }
            startLoadingImages();
        });

}



function startLoadingImages() {
    let whichObject = 0;
    setInterval(() => {
        if (!objects[whichObject].image) {
            askForPicture(objects[whichObject]);
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

function placeImage(text, pos) {
    console.log("placeImage", pos);
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    let size = 128;
    canvas.height = size;
    canvas.width = size;
    rePaintObject(ctx, text, null, canvas, true)
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
    objects.push({ "object": mesh, "uuid": mesh.uuid, "texture": texture, "text": text, "context": ctx, "image": null, "canvas": canvas });
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
function onDocumentMouseDown(event) {
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
    if (intersectedObjectUUID == -1) { //if no object was intersected
        onPointerDownPointerX = event.clientX;
        onPointerDownPointerY = event.clientY;
        onPointerDownLon = lon;
        onPointerDownLat = lat;
        isUserInteracting = true;
    }
}

async function askForPicture(object) {
    // prompt = inputField.value;
    //inputField.value = "Waiting for reply for:" + prompt;
    let data = {
        "version": "c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316",
        input: {
            "prompt": object.text,
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
            object.image = incomingImage;
            rePaintObject(object.context, object.text, object.image, object.canvas, false);
            //const ctx = object.context;
            //ctx.drawImage(incomingImage, 0, 0, 128, 128);
            // const base64Image = canvas.toDataURL();
            // sendImageToFirebase(base64Image, prompt);
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

    let bgGeometery = new THREE.SphereGeometry(950, 60, 40);
    // let bgGeometery = new THREE.CylinderGeometry(725, 725, 1000, 10, 10, true)
    bgGeometery.scale(-1, 1, 1);
    // has to be power of 2 like (4096 x 2048) or(8192x4096).  i think it goes upside down because texture is not right size
    let panotexture = new THREE.TextureLoader().load("itp.jpg");
    // var material = new THREE.MeshBasicMaterial({ map: panotexture, transparent: true,   alphaTest: 0.02,opacity: 0.3});
    let backMaterial = new THREE.MeshBasicMaterial({ map: panotexture });

    let back = new THREE.Mesh(bgGeometery, backMaterial);
    //scene.add(back);

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
    in_front_of_you.position.set(0, 0, -distanceFromCenter);  //base the the z position on camera field of view
    in_front_of_you.getWorldPosition(posInWorld);
    return posInWorld;
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

