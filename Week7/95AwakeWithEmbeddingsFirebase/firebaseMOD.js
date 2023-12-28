import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-analytics.js";
import { getDatabase, update, ref, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-database.js";
import { createObject } from "./embeddingsFB.js";


//use var instead of let in module to make it global
var appName;
var folder;
var db;
export var localKey;

console.log("subscribeToFirebase", appName, folder);
export function initFirebase() {
    appName = "3DEmbeddingsFirebase";
    folder = "embeddings";
    console.log("init firebase");
    //let nameField = document.createElement('name');
    //document.body.append(nameField);
    //
    // //let name = localStorage.getItem('fb_name');
    // if (!name) {
    //     name = prompt("Enter Your Name Here");
    //     //localStorage.setItem('fb_name', name);  //save name
    // }
    // console.log("name", name);
    // if (name) {
    //     nameField.value = name;
    // }
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
    db = getDatabase();
    subscribeToFirebase()
}

function subscribeToFirebase() {
    const path = '/' + appName + '/' + folder + '/';
    const myRef = ref(db, path);
    console.log("myRef", myRef);
    onChildAdded(myRef, (data) => {
        console.log("added", data.val())

        let newObject = createObject(data.key, data.val());
        if (newObject.dbKey == localKey && object.image == null) {
            askForPicture(text, object.key);
        }
    });
    onChildChanged(myRef, (data) => {
        console.log("changed", data.key, data);
        updateObject(data.key, data.val());
    });
    onChildRemoved(myRef, (data) => {
        console.log("removed", data.key, data.val());
    });
}

export function storeEmbeddingInFirebase(prompt, embedding, pos) {
    const myRef = ref(db, appName + '/' + folder + '/')
    //console.log("storeEmbeddingInFirbase", prompt, embedding);
    let dataToSet = {
        embedding: embedding,
        prompt: prompt,
        location: { "x": pos.x, "y": pos.y, "z": pos.z }
    }
    // push adds something to the database and returns a key
    let gotBack = push(myRef, dataToSet);
    localKey = gotBack.key;
    console.log("got back", localKey);
}

export function updateInFirebase(key, base64Image) {
    //just append the image to the existing data
    let dataToSet = {
        base64Image: base64Image,
    }
    const updates = {};
    updates[appName + '/' + folder + '/' + key + '/image/'] = dataToSet;
    update(ref(db), updates);
}
