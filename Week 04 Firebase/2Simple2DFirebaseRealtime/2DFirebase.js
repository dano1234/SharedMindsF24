import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase, ref, onValue, update, set, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";
//import * as FB from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";


let isInteracting = false;

// Get the input box and the canvas element
const canvas = document.createElement('canvas');
canvas.setAttribute('id', 'myCanvas');
canvas.style.position = 'absolute';
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.left = '0';
canvas.style.top = '0';
canvas.style.width = '100%';
canvas.style.height = '100%';
document.body.appendChild(canvas);
console.log('canvas', canvas.width, canvas.height);


const inputBox = document.createElement('input');
inputBox.setAttribute('type', 'text');
inputBox.setAttribute('id', 'inputBox');
inputBox.setAttribute('placeholder', 'Enter text here');
inputBox.style.position = 'absolute';
inputBox.style.left = '50%';
inputBox.style.top = '50%';
inputBox.style.transform = 'translate(-50%, -50%)';
inputBox.style.zIndex = '100';
inputBox.style.fontSize = '30px';
inputBox.style.fontFamily = 'Arial';
document.body.appendChild(inputBox);

// Add event listener to the input box
inputBox.addEventListener('keydown', function (event) {
    // Check if the Enter key is pressed

    if (event.key === 'Enter') {
        const inputValue = inputBox.value;
        const inputBoxRect = inputBox.getBoundingClientRect();
        const x = inputBoxRect.left;
        const y = inputBoxRect.top;
        // Add the text to the database
        const data = { type: 'text', position: { x: x, y: y }, text: inputValue };
        addNewThingToFirebase('texts', data);
        //don't draw it locally until you hear back from firebase
    }
});

function drawText(x, y, text) {
    const ctx = canvas.getContext('2d');
    ctx.font = '30px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText(text, x, y);
}

// Add event listener to the document for mouse down event
document.addEventListener('mousedown', (event) => {
    // Set the location of the input box to the mouse location
    isInteracting = true;
});
document.addEventListener('mousemove', (event) => {
    // Set the location of the input box to the mouse location
    console.log('mousemove');
    if (isInteracting) {
        inputBox.style.left = event.clientX + 'px';
        inputBox.style.top = event.clientY + 'px';
    }
});
document.addEventListener('mouseup', (event) => {
    isInteracting = false;
});

////FIREBASE STUFF

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
//make a folder in your firebase for this example
let appName = "SharedMinds2DExample";

let db = getDatabase();
subscribeToData('texts');


function addNewThingToFirebase(folder, data) {
    //firebase will supply the key,  this will trigger "onChildAdded" below
    const dbRef = ref(db, appName + '/' + folder);
    const newKey = push(dbRef, data).key;
    return newKey; //useful for later updating
}

function subscribeToData(folder) {
    //get callbacks when there are changes either by you locally or others remotely
    const commentsRef = ref(db, appName + '/' + folder + '/');
    onChildAdded(commentsRef, (data) => {
        drawText(data.val().position.x, data.val().position.y, data.val().text);
    });
    onChildChanged(commentsRef, (data) => {
        reactToFirebase("changed", data.val(), data.key)
    });
    onChildRemoved(commentsRef, (data) => {
        reactToFirebase("removed", data.val(), data.key)
    });
}

////THIS EXAMPLE IS NOT USING THESE FUNCTIONS
function updateJSONFieldInFirebase(folder, key, data) {
    console.log(appName + '/' + folder + '/' + key)
    const dbRef = ref(db, appName + '/' + folder + '/' + key);
    update(dbRef, data);
}

function deleteFromFirebase(folder, key) {
    console.log("deleting", appName + '/' + folder + '/' + key);
    const dbRef = ref(db, appName + '/' + folder + '/' + key);
    set(dbRef, null);
}

function setDataInFirebase(folder, key, data) {
    //if it doesn't exist, it adds (pushes) with you providing the key
    //if it does exist, it overwrites
    const dbRef = ref(db, appName + '/' + folder)
    set(dbRef, data);
}

function getStuffFromFirebase() {
    //make a one time ask, not a subscription
    const dbRef = ref(db, appName + folder);
    onValue(dbRef, (snapshot) => {
        console.log("here is a snapshot of everyting", snapshot.val());
    });
}
