import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';
import { UMAP } from 'https://cdn.skypack.dev/umap-js';
import { initFirebase, storeInFirebase, destroyDatabase } from './firebaseMOD.js';

let distanceFromCenter = 800;

let camera3D, scene, renderer;

const replicateProxy = "https://replicate-api-proxy.glitch.me"
var objects = [];

let hitTestableThings = [];  //things that will be tested for intersection
let in_front_of_you;
var input_image_field;
let feedback;
let feature;

initWebInterface();
init3D();
initFirebase("3DEmbeddingsFirebase", "imagesAndEmbeddings");


function findClosest(toWhere, clumpSize, all_objects) {
    console.log("findClosest", toWhere);
    //toWhere.z = -toWhere.z;
    let closeness = {};
    for (let j = 0; j < all_objects.length; j++) {
        let thisObject = all_objects[j];
        let thisPos = thisObject.mesh.position;
        //let thatEmbedding = thatObject.embedding;
        let distance = Math.sqrt(Math.pow(thisPos.x - toWhere.x, 2) + Math.pow(thisPos.y - toWhere.y, 2) + Math.pow(thisPos.z - toWhere.z, 2));
        closeness[distance] = thisObject;
        thisObject.showText = false;
    }
    console.log("closeness", closeness);
    let keys = Object.keys(closeness);
    keys.sort();
    for (let i = 0; i < clumpSize; i++) {
        let closeObject = closeness[keys[i]];
        closeObject.showText = true;
    }
    console.log("closest", closeness[keys[0]]);

}

function runUMAP(data) {
    let embeddingsAndPrompts = data;
    //comes back with a list of embeddings and prompts, single out the embeddings for UMAP
    let embeddings = [];
    for (let i = 0; i < embeddingsAndPrompts.length; i++) {
        embeddings.push(embeddingsAndPrompts[i].embedding);
    }
    //let fittings = runUMAP(embeddings);
    var repeatableRandomNumberFunction = new Math.seedrandom('hello.');
    let umap = new UMAP({
        nNeighbors: 6,
        minDist: .5,
        nComponents: 3,
        random: repeatableRandomNumberFunction,  //special library seeded random so it is the same randome numbers every time
        spread: 10,
        //distanceFn: 'cosine',
    });
    let fittings = umap.fit(embeddings);
    fittings = normalize(fittings);  //normalize to 0-1
    for (let i = 0; i < embeddingsAndPrompts.length; i++) {
        let obj = embeddingsAndPrompts[i];
        let pos = fittings[i];
        obj.mesh.position.x = pos[0] * distanceFromCenter - distanceFromCenter / 2;
        obj.mesh.position.y = pos[1] * distanceFromCenter / 4 - distanceFromCenter / 8;  //dont go too high or low
        obj.mesh.position.z = pos[2] * distanceFromCenter - distanceFromCenter / 2;
        obj.mesh.lookAt(0, 0, 0);
    }
    //console.log("fitting", fitting);
}

async function askForAll(thisPrompt) {
    let all = {}
    let embedding = await askForEmbedding(thisPrompt);
    all.embedding = embedding;
    all.prompt = thisPrompt;
    let imageURL = await askForPicture(thisPrompt);
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

export function removeObject(key, data) {
    let thisArrayIndex = findObjectByKey(key);
    scene.remove(objects[thisArrayIndex].mesh);
    objects.splice(thisArrayIndex, 1);
}

function findObjectByKey(key) {
    for (let i = 0; i < objects.length; i++) {
        if (objects[i].dbKey == key) {
            return i;
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
    let thisArrayIndex = findObjectByKey(key);
    if (thisArrayIndex == -1) {
        console.log("could not find object", key);
        return;
    }
    thisObject = objects[thisArrayIndex];
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
    if (objects.length > 6) {
        runUMAP(objects)
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
function getIntersectedObject(XYpos) {
    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(XYpos, camera3D);
    var intersects = raycaster.intersectObjects(hitTestableThings);
    let intersectedObjectUUID = -1;   //will never match but go through all the items anyway
    if (intersects.length > 0) {
        intersectedObjectUUID = intersects[0].object.uuid //take the first, closesest, object
    }
    //find the object with that UUID
    let clickedOnObject;
    for (let i = 0; i < objects.length; i++) {
        let thisObject = objects[i];
        if (thisObject.uuid == intersectedObjectUUID) {
            clickedOnObject = thisObject;
            //thisObject.showText = !thisObject.showText;  //toggle the text
            //console.log("clicked On", thisObject.text);
            break;
        }
    }
    return clickedOnObject;
}

async function askGod() {
    let text = "give me a json object with 36 prompts  for stable diffusion image generation organized into 6 themes"
    document.body.style.cursor = "progress";
    // // feedback.html("Waiting for reply from OpenAi...");
    const data = {
        model: "gpt-3.5-turbo-instruct", //"gpt-3.5-turbo-instruct", //"gpt-4-1106-preview", //"gpt-4-1106-preview",//
        prompt: text,
        temperature: 0,
        max_tokens: 1000,
        // response_format: { "type": "json_object" },
        //  n: 1,
        //  stop: "\n",
    };
    // const data = {
    //     "model": "gpt-4-1106-preview",
    //     "messages": [{ "role": "user", "content": "Say this is a test!" }],
    //     "temperature": 0.7
    // }
    console.log("Asking for Words From OpenAI via Proxy", data);
    let options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(data),
    };
    const openAIProxy = "https://openai-api-proxy.glitch.me";

    const url = openAIProxy + "/AskOpenAI/";  //"/askOpenAIChat/"; // 
    console.log("words url", url, "words options", options);
    const response = await fetch(url, options);
    console.log("words_response", response);
    const openAI_json = await response.json();
    console.log("openAI_json", openAI_json);
    if (openAI_json.choices.length == 0) {
        //feedback.html("Something went wrong, try it again");
        return 0;
    } else {
        let choicesjoin = "";
        for (let i = 0; i < openAI_json.choices.length; i++) {
            choicesjoin += openAI_json.choices[i].text;
        }
        //feedback.html(choicesjoin);
        console.log("open ai returned ", choicesjoin);

        performCreation(choicesjoin)
        //console.log("proxy_said", proxy_said.output.join(""));
    }
    document.body.style.cursor = "auto";

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

    //something to contain all the web interface elements
    var webInterfaceContainer = document.createElement("div");
    webInterfaceContainer.id = "webInterfaceContainer";
    webInterfaceContainer.style.position = "absolute";
    webInterfaceContainer.style.zIndex = "2";
    webInterfaceContainer.style.top = "0%";
    webInterfaceContainer.style.left = "0%";
    //webInterfaceContainer.style.transform = "translate(-50%, -50%)";
    webInterfaceContainer.style.position = "absolute";
    webInterfaceContainer.style.height = "100%";
    webInterfaceContainer.style.width = "100%";
    webInterfaceContainer.style.pointerEvents = "none";
    document.body.append(webInterfaceContainer);

    //something to contain all the 3D stuff (so it can be behind the web interface)
    let ThreeJSContainer = document.createElement("div");
    ThreeJSContainer.style.zIndex = "1";
    ThreeJSContainer.id = "ThreeJSContainer";
    ThreeJSContainer.style.position = "absolute";
    ThreeJSContainer.style.top = "0%";
    ThreeJSContainer.style.left = "0%";
    ThreeJSContainer.style.width = "100%";
    ThreeJSContainer.style.height = "100%";
    document.body.append(ThreeJSContainer);

    //make a feedback div
    feedback = document.createElement("div");
    feedback.id = "feedback";
    feedback.style.position = "absolute";
    feedback.style.zIndex = "2";
    feedback.innerHTML = "Ready";
    feedback.style.width = "100%";
    feedback.style.textAlign = "center";
    feedback.style.top = "50%";
    feedback.style.left = "0%";


    feedback.style.fontSize = "20px";
    feedback.style.color = "white";
    webInterfaceContainer.append(feedback);

    //show off pictures big when you double click on them
    feature = document.createElement("div");
    feature.style.ali
    feature.id = "feature";
    feature.style.zIndex = "5";
    feature.style.width = "512px";
    feature.style.height = "512px";
    feature.style.position = "absolute";
    feature.style.top = "50%";
    feature.style.left = "50%";
    feature.style.transform = "translate(-50%, -50%)";
    feature.style.display = "none";
    webInterfaceContainer.append(feature);



    //make a button in the upper right corner called "GOD" that will create many new objects\
    let GodButton = document.createElement("button");
    GodButton.innerHTML = "GOD";
    GodButton.style.position = "absolute";
    GodButton.style.top = "50%";
    GodButton.style.right = "10%";
    GodButton.style.zIndex = "2";
    GodButton.style.fontSize = "20px";
    GodButton.style.color = "white";
    GodButton.style.backgroundColor = "black";
    GodButton.style.pointerEvents = "all";
    GodButton.addEventListener("click", function () {
        askGod();
        //console.log("result", result);
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
    ThanosButton.style.backgroundColor = "black";
    ThanosButton.addEventListener("click", function () {
        destroyDatabase();
    });
    ThanosButton.style.pointerEvents = "all";
    webInterfaceContainer.append(ThanosButton);

    //make a text input field
    input_image_field = document.createElement("input");
    input_image_field.type = "text";
    input_image_field.id = "input_image_prompt";
    input_image_field.value = "Nice picture of a dog";
    input_image_field.style.position = "absolute";
    input_image_field.style.zIndex = "200";
    input_image_field.style.fontSize = "30px";
    input_image_field.style.height = "30px";
    input_image_field.style.color = "white";
    input_image_field.style.backgroundColor = "black";
    input_image_field.style.textAlign = "center";
    input_image_field.style.width = "50%";
    input_image_field.style.top = "15%";
    input_image_field.style.left = "50%";
    input_image_field.style.transform = "translate(-50%, -50%)";
    input_image_field.style.pointerEvents = "all";
    input_image_field.addEventListener("keyup", function (event) {
        if (event.key === "Enter") {
            askForAll(input_image_field.value);
        }
    });
    webInterfaceContainer.append(input_image_field);

}

async function performCreation(prompts) {
    console.log("prompts", prompts);
    let promptsArray = prompts.split("\n");
    for (let i = 0; i < promptsArray.length; i++) {

        let prompt = promptsArray[i];
        if (prompt.length < 30) {
            continue;
        }
        prompt = prompt.slice(2).trim();
        lon = Math.random() * 360 - 180;
        lat = Math.random() * 60 - 30;
        computeCameraOrientation();
        console.log("prompt created", prompt);
        await askForAll(prompt);
    }
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


function onMouseDown(event) {
    // let ThreeJSContainer = document.getElementById("ThreeJSContainer");
    // ThreeJSContainer.setCapture();


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
        let size = 512;
        bigCanvas.height = size;
        bigCanvas.width = size;
        let ctx = bigCanvas.getContext('2d');
        ctx.drawImage(intersectedObject.image, 0, 0, bigCanvas.width, bigCanvas.height);
        featureImage.append(bigCanvas);
        let featurePrompt = document.createElement("div");
        featurePrompt.innerHTML = intersectedObject.text;
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

function moveCameraWithMouse() {
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
    console.log("intersectedObject", intersectedObject);
    if (intersectedObject) {
        findClosest(intersectedObject.mesh.position, 6, objects)
    }

    // let ThreeJSContainer = document.getElementById("ThreeJSContainer");
    // ThreeJSContainer.releaseCapture();
}

function onMouseWheel(event) {
    camera3D.fov += event.deltaY * 0.05;
    camera3D.fov = Math.min(120, Math.max(10, camera3D.fov));
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