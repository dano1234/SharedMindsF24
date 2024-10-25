import { UMAP } from 'https://cdn.skypack.dev/umap-js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-analytics.js";
//import { getFirestore } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-firestore.js"
import { getDatabase, update, ref, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-database.js";


let clusterSize = 6;

const replicateProxy = "https://replicate-api-proxy.glitch.me"
var objects = [];


var input_image_field;
let feedback;
let feature;

initWebInterface();
initFirebase("2DImageEmbeddingsUMAPFirebase", "imagesAndEmbeddings");



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
        nComponents: 2,
        random: repeatableRandomNumberFunction,  //special library seeded random so it is the same randome numbers every time
        spread: .1,
        //distanceFn: 'cosine',
    });
    //umap only wants embeddings, not all the rest of the stuff
    let fittings = umap.fit(embeddings);
    fittings = normalize(fittings);  //normalize to 0-1
    for (let i = 0; i < embeddingsAndPrompts.length; i++) {
        let obj = embeddingsAndPrompts[i];
        let pos = fittings[i];
        let key = obj.key;
        let thisDiv = document.getElementById(key);
        thisDiv.style.left = pos[0] * window.innerWidth + "px";
        thisDiv.style.top = pos[1] * window.innerHeight + "px";
    }
    //console.log("fitting", fitting);
}

async function askForImageEmbedding(prompt, imageURL) {
    //let justBase64 = base64.split(",")[1];
    const data = {
        "version": "0383f62e173dc821ec52663ed22a076d9c970549c209666ac3db181618b7a304",
        "input": {
            "input": imageURL,
            "modality": "vision"
        },
    };


    feedback.innerHTML = "Waiting for reply from API...";
    let url = replicateProxy + "/create_n_get/";
    document.body.style.cursor = "progress";
    console.log("Making a Fetch Request", data);
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: 'application/json',
        },
        body: JSON.stringify(data),
    };
    const raw_response = await fetch(url, options);
    //turn it into json
    const replicateJSON = await raw_response.json();
    document.body.style.cursor = "auto";

    console.log("replicateJSON", replicateJSON);
    return replicateJSON.output;
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


function removeObject(key, data) {
    let div = document.getElementById(key);
    div.remove();
    //remove from local variable
    for (let i = 0; i < objects.length; i++) {
        if (objects[i].key == key) {
            objects.splice(i, 1);
            break;
        }
    }

    if (objects.length > 6) {
        runUMAP(objects)
    }
}


function updateObject(key, data) {

}

export function createObject(key, data) {
    data.key = key;
    //get stuff from firebase
    let text = data.prompt;
    let embedding = data.embedding;
    let image = data.image;


    let divster = document.createElement("div");
    divster.innerHTML = "";
    divster.id = key;
    divster.style.position = "absolute";
    divster.className = "imageDivs";
    divster.style.zIndex = 1;
    divster.style.pointerEvents = "all";
    divster.style.width = "256px";
    divster.style.height = "256px";
    let imageElement = document.createElement("img");
    imageElement.src = image.base64Image;
    imageElement.style.width = "100%";
    imageElement.style.height = "100%";
    divster.append(imageElement);
    document.body.append(divster);


    // divster.addEventListener("mouseover", function () {
    //     console.log("mouseover", this);
    //     this.style.zIndex = 1;
    // });
    // divster.addEventListener("mouseout", function () {
    //     console.log("mouseout", this);
    //     this.style.zIndex = 1000;
    // });

    //FEATURE THIS ONE IN THE CENTER
    divster.addEventListener("click", function (event) {
        console.log("clicked", this.id);
        let obj;
        for (let i = 0; i < objects.length; i++) {
            obj = objects[i];
            if (obj.key == this.id) {
                console.log("found", obj);
                break;
            }
        }
        console.log("obj", obj);
        let image = obj.image;
        feature.innerHTML = "";
        let imageElement = document.createElement("img");
        imageElement.src = image.url;
        feature.append(imageElement);
        let textElement = document.createElement("div");
        textElement.innerHTML = obj.prompt;
        textElement.style.fontSize = "32px";
        textElement.style.position = "absolute";
        textElement.style.color = "white";
        textElement.style.top = "0%";
        textElement.style.left = "0%";
        textElement.style.zIndex = 10;
        textElement.style.pointerEvents = 'none';
        feature.append(textElement);


        //  feature.innerHTML = this.innerHTML;
        feature.style.display = "block";
        feature.style.zIndex = 10;

        feature.style.width = "50%";
        feature.style.height = "50%";
        feature.style.top = "50%";
        feature.style.left = "50%";
        feature.style.transform = "translate(-50%, -50%)";
        feature.style.position = "absolute";
        feature.style.pointerEvents = 'none';
        event.stopPropagation();
    });




    //make a copy of info in local variable
    objects.push(data);

    if (objects.length > 6) {
        runUMAP(objects)
    }

}





async function askGod() {
    let text = "a list with 36 prompts  for stable diffusion image generation organized into 6 themes connect to the phrase '" + input_image_field.value + "' Don't prompt or any other introductory text or text after";
    document.body.style.cursor = "progress";
    // // feedback.html("Waiting for reply from OpenAi...");

    let data = {
        modelURL: "https://api.replicate.com/v1/models/meta/meta-llama-3-70b-instruct/predictions",
        input: {
            "prompt": text,
            "max_tokens": 4000,
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
    const response = await fetch(url, options);
    console.log("words_response", response);
    const got_json = await response.json();
    console.log("got_json", got_json);
    let output = got_json.output;
    let outputJoin = "";

    for (let i = 0; i < output.length; i++) {
        outputJoin += output[i];
    }
    console.log("outputjoin", outputJoin);
    let prompts = [];
    let lines = outputJoin.split("\n");
    //console.log("lines", lines);
    for (let i = 0; i < lines.length; i++) {
        if (isNaN(lines[i].charAt(0))) continue;
        if (lines[i].includes("Theme")) continue;
        if (lines[i].length < 10) continue;
        let prompt = lines[i];
        prompt = prompt.substring(prompt.indexOf(' ') + 1);
        prompts.push(prompt.trim());

    }
    console.log("prompts", prompts);
    //now go and get embedding and images and store in firebase for each prompt
    for (let i = 0; i < prompts.length; i++) {
        let thisPrompt = prompts[i];
        let imageURL = await askForPicture(thisPrompt);
        let b64 = await convertURLToBase64(imageURL);
        let embedding = await askForImageEmbedding(thisPrompt, imageURL);
        //let embedding = await askForEmbedding(thisPrompt);
        let all = {}
        all.embedding = embedding;
        all.prompt = thisPrompt;
        all.image = { base64Image: b64, url: imageURL };
        storeInFirebase(all);
    }

    document.body.style.cursor = "auto";

}

async function askForPicture(text) {
    input_image_field.value = "Waiting for reply for:" + text;
    // prompt = inputField.value;
    //inputField.value = "Waiting for reply for:" + prompt;


    let data = {
        "version": "5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",

        //c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316",
        input: {
            "prompt": text,

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
    //console.log("url", url, "options", options);
    const picture_info = await fetch(url, options);
    //console.log("picture_response", picture_info);
    const proxy_said = await picture_info.json();
    console.log("Proxy Returned", proxy_said);
    if (!proxy_said.output) {
        console.log("Something went wrong, try it again, maybe NSFW" + proxy_said.error);
        return "NSFW.png";
    } else {
        input_image_field.value = text;
        return proxy_said.output[0];
    }
}




function initWebInterface() {

    //something to contain all the web interface elements
    // var webInterfaceContainer = document.createElement("div");
    // webInterfaceContainer.id = "webInterfaceContainer";
    // webInterfaceContainer.style.position = "absolute";
    // webInterfaceContainer.style.zIndex = "2";
    // webInterfaceContainer.style.top = "0%";
    // webInterfaceContainer.style.left = "0%";
    // //webInterfaceContainer.style.transform = "translate(-50%, -50%)";
    // webInterfaceContainer.style.position = "absolute";
    // webInterfaceContainer.style.height = "100%";
    // webInterfaceContainer.style.width = "100%";
    // webInterfaceContainer.style.pointerEvents = "none";
    // document.body.append(webInterfaceContainer);



    //make a feedback div
    feedback = document.createElement("div");
    feedback.id = "feedback";
    feedback.style.position = "absolute";
    feedback.style.zIndex = "2";
    feedback.innerHTML = "Please Wait, Loading images and embeddings from Firebase...";
    feedback.style.width = "100%";
    feedback.style.textAlign = "center";
    feedback.style.top = "95%";
    feedback.style.left = "0%";


    feedback.style.fontSize = "20px";
    feedback.style.color = "white";
    // document.body.append(feedback);

    //show off pictures big when you double click on them
    feature = document.createElement("div");
    feature.id = "feature";

    feature.style.display = "none";
    feature.style.pointerEvents = "none";
    document.body.append(feature);

    // Add event listener to make the feature element disappear when clicked
    document.addEventListener("click", function () {
        feature.style.display = "none";
        console.log("clicked feature");
    });
    //make a button in the upper right corner called "GOD" that will create many new objects\
    let GodButton = document.createElement("button");
    GodButton.innerHTML = "GOD";
    GodButton.style.position = "absolute";
    GodButton.style.top = "90%";
    GodButton.style.right = "20%";
    GodButton.style.zIndex = "2";
    GodButton.style.fontSize = "20px";
    GodButton.style.color = "white";
    GodButton.style.backgroundColor = "black";
    GodButton.style.pointerEvents = "all";
    GodButton.addEventListener("click", function () {
        askGod();
    });
    document.body.append(GodButton);


    //make a button in the upper right corner called "THANOS" that will remove many new objects
    let ThanosButton = document.createElement("button");
    ThanosButton.innerHTML = "THANOS";
    ThanosButton.style.position = "absolute";
    ThanosButton.style.top = "90%";
    ThanosButton.style.left = "20%";
    ThanosButton.style.zIndex = "200";
    ThanosButton.style.fontSize = "20px";
    ThanosButton.style.color = "white";
    ThanosButton.style.backgroundColor = "black";
    ThanosButton.addEventListener("click", function () {
        destroyDatabase();

    });
    ThanosButton.style.pointerEvents = "all";
    document.body.append(ThanosButton);

    //make a text input field
    input_image_field = document.createElement("input");
    input_image_field.type = "text";
    input_image_field.id = "input_image_prompt";
    input_image_field.value = "Beauty will save the world";
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
    document.body.append(input_image_field);

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



// async function askForEmbedding(p_prompt) {
//     //let promptInLines = p_prompt.replace(/,/g,) "\n";  //replace commas with new lines
//     //p_prompt = p_prompt + "\n"
//     const data = {
//         "version": "0383f62e173dc821ec52663ed22a076d9c970549c209666ac3db181618b7a304",
//         // "version": "75b33f253f7714a281ad3e9b28f63e3232d583716ef6718f2e46641077ea040a",
//         "input": {
//             "text_input": p_prompt,
//             "modality": "text"
//         },
//     };
//     // let data = {
//     //     version: "75b33f253f7714a281ad3e9b28f63e3232d583716ef6718f2e46641077ea040a",
//     //     input: {
//     //         inputs: p_prompt,
//     //     },
//     // };
//     console.log("Asking for Embedding Similarities From Replicate via Proxy", data);
//     let options = {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//         },
//         body: JSON.stringify(data),
//     };
//     const url = replicateProxy + "/create_n_get/";
//     let rawResponse = await fetch(url, options)
//     let jsonData = await rawResponse.json();
//     // return jsonData.output[0].embedding;
//     return jsonData.output;
// }

/////FIREBASE STUFF


//use var instead of let in module to make it global
var appName;
var folder
var db;
var localKey;


function initFirebase(_appName, _folder) {
    appName = _appName;
    folder = _folder;

    console.log("init firebase at ", appName, folder);

    const firebaseConfig = {
        apiKey: "AIzaSyDHOrU4Lrtlmk-Af2svvlP8RiGsGvBLb_Q",
        authDomain: "sharedmindss24.firebaseapp.com",
        databaseURL: "https://sharedmindss24-default-rtdb.firebaseio.com",
        projectId: "sharedmindss24",
        storageBucket: "sharedmindss24.appspot.com",
        messagingSenderId: "1039430447930",
        appId: "1:1039430447930:web:edf98d7d993c21017ad603"
    };
    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);
    db = getDatabase();
    //firestoreDB = getFirestore();
    //console.log("firestore", firestoreDB);
    subscribeToFirebase()
}


function subscribeToFirebase() {
    const path = '/' + appName + '/' + folder + '/';
    //console.log("subscribeToFirebase", path);
    const myRef = ref(db, path);

    onChildAdded(myRef, (data) => {
        console.log("added", data.val())
        feedback.innerHTML = "Ready"
        createObject(data.key, data.val());
        // if (newObject.dbKey == localKey && object.image == null) {
        //     askForPicture(text, object.key);
        // }
    });
    onChildChanged(myRef, (data) => {
        console.log("changed", data.key, data);
        updateObject(data.key, data.val());
    });
    onChildRemoved(myRef, (data) => {
        removeObject(data.key, data.val());
        console.log("removed", data.key, data.val());
    });
}

function storeInFirebase(data) {
    const myRef = ref(db, appName + '/' + folder + '/')
    //console.log("storeEmbeddingInFirbase", prompt, embedding);

    console.log("dataToSet", data);
    // push adds something to the database and returns a key
    let gotBack = push(myRef, data);
    localKey = gotBack.key;
    console.log("got back", localKey);
}


function destroyDatabase() {
    const myRef = ref(db, appName + '/' + folder + '/')
    //console.log("storeEmbeddingInFirbase", prompt, embedding);
    const updates = {};
    updates[appName + '/' + folder + '/'] = {};
    update(ref(db), updates);
}

function updateInFirebase(key, data) {
    //just append the image to the existing data
    const updates = {};
    updates[appName + '/' + folder + '/' + key + '/image/'] = data;
    update(ref(db), updates);
}
