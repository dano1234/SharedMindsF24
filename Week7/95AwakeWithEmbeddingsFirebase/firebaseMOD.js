import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-analytics.js";
import { getDatabase, ref, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-database.js";
import { placeImage, getPositionInFrontOfCamera } from "./embeddingsFB.js";


//use var instead of let in module to make it global
var appName;
var folder;
var db;

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
        console.log("added", data.val());
        placeImage(data.key, data.val().prompt, data.val().location, data.val().embedding, data.val().base64Image);
        // var incomingImage = new Image();
        // incomingImage.crossOrigin = "anonymous";
        // incomingImage.onload = function () {
        //     placeImage(incomingImage, data.val().location);
        // };
        // let b64 = data.val().base64Image;

        // incomingImage.src = b64;

    });
    onChildChanged(myRef, (data) => {
        console.log("changed", data.key, data);
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
    //console.log("dataToSet", dataToSet);
    let gotBack = push(myRef, dataToSet);
    let key = gotBack.key;
}

export function setImageInFirebase(key, image) {
    let base64Image = image.src;
    let dataToSet = {
        base64Image: base64Image,
    }
    //console.log("dataToSet", dataToSet);
    updated(ref(db, appName + '/' + folder + '/' + key), dataToSet);
}
