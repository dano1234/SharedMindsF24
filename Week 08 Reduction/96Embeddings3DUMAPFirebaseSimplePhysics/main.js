import { UMAP } from 'https://cdn.skypack.dev/umap-js';
import { initFirebase, destroyDatabase, localKey } from './firebaseMOD.js';
import { init3D, getPositionInFrontOfCamera, scene, distanceFromCenter } from './3DStuff.js';
import { Expressions, initPhysics, addToPhysics, myCluster } from './expressionClass.js';
import { manufactureFakePrompts } from './makeCreations.js';

let clusterSize = 3;

export let objects = [];  //all the objects by number
let byFirebase = {};  //all the objects by firebase key
export let byUUID = {}; //all the objects by ThreeeJS UUID
export let hitTestableThings = [];  //3D meshes that will be tested for intersection, alt scene.children for all

var input_image_field;
let feedback;
let feature;
//let functionURL = "https://us-central1-sharedmindss24.cloudfunctions.net";
let functionURL = "http://127.0.0.1:5001/sharedmindss24/us-central1/";
export let usePhysics = true;
let useWordEmbeddings = true;

initWebInterface();
initPhysics();
init3D();


initFirebase("3DEmbeddingsUMAPFirebase", "imagesAndEmbeddings");



export function findClosest(toWhere, selectedObject) {
    if (objects.length == 0) return;
    //make a json object with the distance as the name and the object as the value
    let closeness = {};
    for (let j = 0; j < objects.length; j++) {
        let thisObject = objects[j];
        if (thisObject == selectedObject) continue;
        let thisPos = thisObject.mesh.position;
        //let thatEmbedding = thatObject.embedding;
        let distance = Math.sqrt(Math.pow(thisPos.x - toWhere.x, 2) + Math.pow(thisPos.y - toWhere.y, 2) + Math.pow(thisPos.z - toWhere.z, 2));
        closeness[distance] = thisObject;
        thisObject.showText = false;
    }
    //sort by the keys (distances)
    let keys = Object.keys(closeness);
    keys.sort();
    let closest = [];
    for (let i = 0; i < Math.min(keys.length, clusterSize + 1); i++) {
        let closeObject = closeness[keys[i]];
        closeObject.showText = true;
        closest.push(closeObject);
    }
    return closest;
}

export function createLocally(key, data) {
    let newObject = new Expressions(key, data);
    byFirebase[key] = newObject;
    byUUID[newObject.mesh.uuid] = newObject;
    if (newObject.key == localKey && newObject.image == null) {
        askForPicture(data.prompt, newObject.key);
    }
    scene.add(newObject.mesh);
    hitTestableThings.push(newObject.mesh);//make a list for the raycaster to check for intersection
    //leave the image null formesh, "uuid": mesh.uuid, "texture": texture, "text": text, "show_text": false, "context": ctx, "image": null, "canvas": canvas }; now
    objects.push(newObject);
    if (objects.length > 6) {
        runUMAP();
    }
    //add to physics

    //findClosest(getPositionInFrontOfCamera())
}


function runUMAP() {

    // console.log("embeddingsAndPrompts", embeddingsAndPrompts);
    //comes back with a list of embeddings and prompts, single out the embeddings for UMAP
    let embeddings = [];
    if (useWordEmbeddings) {
        for (let i = 0; i < objects.length; i++) {
            embeddings.push(objects[i].embedding);
        }
    } else {
        for (let i = 0; i < objects.length; i++) {
            embeddings.push(objects[i].imageEmbedding);
        }
    }
    //let fittings = runUMAP(embeddings);
    var repeatableRandomNumberFunction = new Math.seedrandom('hello.');

    let umap = new UMAP({
        nNeighbors: clusterSize,
        minDist: .99,
        nComponents: 3,
        random: repeatableRandomNumberFunction,  //special library seeded random so it is the same randome numbers every time
        spread: .01,
    });

    let fittings = umap.fit(embeddings);
    fittings = normalize(fittings);  //normalize to 0-1
    for (let i = 0; i < objects.length; i++) {
        let obj = objects[i];
        let pos = fittings[i];
        obj.UMAPFitting = pos;
        let hAngle = pos[0] * Math.PI * 2;
        let vAngle = pos[1] * Math.PI;
        let distance = pos[2] * distanceFromCenter;
        obj.location.x = distance * Math.sin(vAngle) * Math.cos(hAngle);
        obj.location.y = distance * Math.sin(vAngle) * Math.sin(hAngle);
        obj.location.z = distance;
        //obj.location.x = pos[0] * 3000;// distanceFromCenter * 2 - distanceFromCenter; //- distanceFromCenter / 2;
        //  obj.location.y = pos[1] * distanceFromCenter - distanceFromCenter / 2;  //dont go too high or low
        //obj.location.z = pos[2] * distanceFromCenter;
        obj.mesh.lookAt(0, 0, 0);
    }
    //console.log("fitting", fitting);
}



export function updateLocally(data) {
    let thisExpression = byFirebase[key];
    thisExpression.updateFromFirebase(data);
}

export function removeLocally(key, data) {
    let thisExpression = byFirebase[key];
    scene.remove(thisExpression.mesh);
    delete byUUID[thisExpression.mesh.uuid];
    delete byFirebase[key];
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
    feedback.style.top = "95%";
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
        manufactureFakePrompts();
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

    //make a button in the upper right corner called "THANOS" that will remove many new objects

    let storeInVectorDB = document.createElement("button");
    storeInVectorDB.innerHTML = "Store in Vector DB";
    storeInVectorDB.style.position = "absolute";
    storeInVectorDB.style.top = "20%";
    storeInVectorDB.style.left = "10%";
    storeInVectorDB.style.zIndex = "200";
    storeInVectorDB.style.fontSize = "20px";
    storeInVectorDB.style.color = "white";
    storeInVectorDB.style.backgroundColor = "black";
    storeInVectorDB.addEventListener("click", function () {
        storeInVectorDBFunction();
    });
    storeInVectorDB.style.pointerEvents = "all";
    webInterfaceContainer.append(storeInVectorDB);

    let findNearest = document.createElement("button");
    findNearest.innerHTML = "Find Nearest";
    findNearest.style.position = "absolute";
    findNearest.style.top = "40%";
    findNearest.style.left = "30%";
    findNearest.style.zIndex = "200";
    findNearest.style.fontSize = "20px";
    findNearest.style.color = "white";
    findNearest.style.backgroundColor = "black";
    findNearest.addEventListener("click", function () {
        findNearestFunction();
    });
    findNearest.style.pointerEvents = "all";
    webInterfaceContainer.append(findNearest);





    let PhysicsButton = document.createElement("button");
    if (useWordEmbeddings) {
        PhysicsButton.innerHTML = "Using Word Embeddings";
    } else {
        PhysicsButton.innerHTML = "Using Image Embeddings";
    }
    PhysicsButton.style.position = "absolute";
    PhysicsButton.style.top = "20%";
    PhysicsButton.style.left = "50%";
    PhysicsButton.style.zIndex = "200";
    PhysicsButton.style.fontSize = "20px";
    PhysicsButton.style.color = "white";
    PhysicsButton.style.backgroundColor = "black";
    PhysicsButton.addEventListener("click", function () {
        useWordEmbeddings = !useWordEmbeddings;
        if (useWordEmbeddings) {
            PhysicsButton.innerHTML = "Using Word Embeddings";
        } else {
            PhysicsButton.innerHTML = "Using Image Embeddings";
        }
        runUMAP();
        //usePhysics = !usePhysics;
    });
    PhysicsButton.style.pointerEvents = "all";
    webInterfaceContainer.append(PhysicsButton);

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
    input_image_field.style.top = "90%";
    input_image_field.style.left = "50%";
    input_image_field.style.transform = "translate(-50%, -50%)";
    input_image_field.style.pointerEvents = "all";
    input_image_field.addEventListener("keyup", function (event) {
        if (event.key === "Enter") {
            // askForAll(input_image_field.value);
        }
    });
    webInterfaceContainer.append(input_image_field);
}


async function storeInVectorDBFunction(object) {
    for (let i = 0; i < objects.length; i++) {
        let object = objects[i];
        let data = { keyInRealtimeDB: object.key, embedding: object.embedding, prompt: object.prompt };
        console.log("storeInVectorDB", data, functionURL + "/storeVector");
        let response = await fetch(functionURL + "storeVector", {
            method: "POST",
            // headers: {
            //     "Content-Type": "application/json",
            // },
            body: JSON.stringify(data),
        })
        let json = await response.json();
        console.log("storeInVectorDB", json);

    }

}

async function findNearestFunction() {
    console.log("objects", objects);
    let data = { embedding: objects[0].embedding };
    // console.log("findNearest", data, functionURL + "/findNearest");
    let response = await fetch(functionURL + "findNearest", {
        method: "POST",
        // headers: {
        //     "Content-Type": "application/json",
        // },
        body: JSON.stringify(data),
    })
    let json = await response.json();
    console.log("findNearest", json);

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
    //console.log("max", max, "min", min);
    //normalize
    for (let i = 0; i < arrayOfNumbers.length; i++) {
        for (let j = 0; j < 3; j++) {
            arrayOfNumbers[i][j] = (arrayOfNumbers[i][j] - min[j]) / (max[j] - min[j]);
        }
    }
    return arrayOfNumbers;
}
