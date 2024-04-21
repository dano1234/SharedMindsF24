import { UMAP } from 'https://cdn.skypack.dev/umap-js';
import { initFirebase, destroyDatabase, localKey } from './firebaseMOD.js';
import { Expressions } from './expressionClass.js';
import { Cluster } from './physics.js';
import { init3D, getPositionInFrontOfCamera } from './3DStuff.js';
import { scene, distanceFromCenter } from './3DStuff.js';


let clusterSize = 6;

let objects = [];
let byFirebase = {};
let byUUID = {};
let hitTestableThings = [];  //things that will be tested for intersection

var input_image_field;
let feedback;
let feature;

initWebInterface();
init3D();
initFirebase("3DEmbeddingsUMAPFirebase", "imagesAndEmbeddings");


function findClosest(toWhere, clumpSize) {
    if (objects.length == 0) return;
    let closeness = {};
    for (let j = 0; j < objects.length; j++) {
        let thisObject = objects[j];
        let thisPos = thisObject.mesh.position;
        //let thatEmbedding = thatObject.embedding;
        let distance = Math.sqrt(Math.pow(thisPos.x - toWhere.x, 2) + Math.pow(thisPos.y - toWhere.y, 2) + Math.pow(thisPos.z - toWhere.z, 2));
        closeness[distance] = thisObject;
        thisObject.showText = false;
    }

    let keys = Object.keys(closeness);
    keys.sort();
    let closest = [];
    for (let i = 0; i < clumpSize; i++) {
        let closeObject = closeness[keys[i]];
        console.log("closeObject", closeObject);
        closeObject.showText = true;
        closest.push(closeObject);
    }
    // myCluster = new Cluster(closest);

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
        nNeighbors: clusterSize,
        minDist: .99,
        nComponents: 3,
        random: repeatableRandomNumberFunction,  //special library seeded random so it is the same randome numbers every time
        spread: .1,
        //distanceFn: 'cosine',
    });
    let fittings = umap.fit(embeddings);
    fittings = normalize(fittings);  //normalize to 0-1
    for (let i = 0; i < embeddingsAndPrompts.length; i++) {
        let obj = embeddingsAndPrompts[i];
        let pos = fittings[i];
        obj.UMAPFitting = pos;
        obj.mesh.position.x = pos[0] * distanceFromCenter - distanceFromCenter / 2;
        obj.mesh.position.y = pos[1] * distanceFromCenter / 2 - distanceFromCenter / 4;  //dont go too high or low
        obj.mesh.position.z = pos[2] * distanceFromCenter - distanceFromCenter / 2;
        obj.mesh.lookAt(0, 0, 0);
    }
    //console.log("fitting", fitting);
}

export function createLocally(key, data) {
    let newObject = new Expressions(key, data);
    if (newObject.key == localKey && object.image == null) {
        askForPicture(data.prompt, object.key);
    }
    scene.add(newObject.mesh);
    hitTestableThings.push(newObject.mesh);//make a list for the raycaster to check for intersection
    //leave the image null formesh, "uuid": mesh.uuid, "texture": texture, "text": text, "show_text": false, "context": ctx, "image": null, "canvas": canvas }; now
    objects.push(newObject);
    if (objects.length > 6) {
        runUMAP(objects)
    }
    findClosest(getPositionInFrontOfCamera(), clusterSize)
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
    let PhysicsButton = document.createElement("button");
    PhysicsButton.innerHTML = "Physics";
    PhysicsButton.style.position = "absolute";
    PhysicsButton.style.top = "20%";
    PhysicsButton.style.left = "50%";
    PhysicsButton.style.zIndex = "200";
    PhysicsButton.style.fontSize = "20px";
    PhysicsButton.style.color = "white";
    PhysicsButton.style.backgroundColor = "black";
    PhysicsButton.addEventListener("click", function () {
        applyPhysics();
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






