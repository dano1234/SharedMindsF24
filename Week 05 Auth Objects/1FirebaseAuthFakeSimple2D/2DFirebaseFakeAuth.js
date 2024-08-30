import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase, ref, onValue, update, set, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

let isInteracting = false;
let isEditing = false;
let editingObject = null;
let objects = {};

let userName = prompt("Please enter your name", "Harry Potter");

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


        const data = { type: 'text', position: { x: x, y: y }, text: inputValue, userName: userName };
        if (isEditing) {
            console.log("update editing", editingObject.key, data);
            updateJSONFieldInFirebase('texts', editingObject.key, data);
            isEditing = false;
        } else {
            addNewThingToFirebase('texts', data);
        }
        // Clear the input box
        inputBox.value = '';
        //don't draw it locally until you hear back from firebase
    }
});

function redrawAll() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '30px Arial';
    ctx.fillStyle = 'black';
    for (let key in objects) {
        const object = objects[key];
        if (object.type === 'text') {
            ctx.fillText(object.userName + ": " + object.text, object.position.x, object.position.y,);
        }
    }
}

document.addEventListener('keydown', (event) => {

    if (event.key === 'Escape') {
        isEditing = false;
        inputBox.value = "";


    } else if (isEditing && event.shiftKey && (event.key === 'Backspace' || event.key === 'Delete')) {
        console.log("delete");
        deleteFromFirebase('texts', editingObject.key);
    }
});





// Add event listener to the document for mouse down event
document.addEventListener('mousedown', (event) => {
    // Set the location of the input box to the mouse locatio
    isInteracting = true;
    editingObject = findNearbyObjects(event.clientX, event.clientY, 150);
    if (editingObject) {
        isEditing = true
        console.log("editing", isEditing);
        inputBox.value = editingObject.text;
        inputBox.style.left = (editingObject.position.x + 150) + 'px';
        inputBox.style.top = (editingObject.position.y - 10) + 'px';
        inputBox.style.color = "red";

    } else {
        isEditing = false;
        inputBox.style.left = event.clientX + 'px';
        inputBox.style.top = event.clientY + 'px';
        inputBox.style.color = "black";
        inputBox.value = "";
    }
    inputBox.focus();
});
document.addEventListener('mousemove', (event) => {
    // Set the location of the input box to the mouse location
    if (isInteracting && !isEditing) {
        inputBox.style.left = event.clientX + 'px';
        inputBox.style.top = event.clientY + 'px';
    }
});
document.addEventListener('mouseup', (event) => {
    isInteracting = false;
});

////FIREBASE STUFF

let db, app;

let appName = "SharedMinds2DAuthExample";
initFirebase();

function initFirebase() {
    const firebaseConfig = {
        apiKey: "AIzaSyDHOrU4Lrtlmk-Af2svvlP8RiGsGvBLb_Q",
        authDomain: "sharedmindss24.firebaseapp.com",
        databaseURL: "https://sharedmindss24-default-rtdb.firebaseio.com",
        projectId: "sharedmindss24",
        storageBucket: "sharedmindss24.appspot.com",
        messagingSenderId: "1039430447930",
        appId: "1:1039430447930:web:edf98d7d993c21017ad603"
    };
    app = initializeApp(firebaseConfig);
    //make a folder in your firebase for this example


    db = getDatabase();

    subscribeToData('texts');
}

function findNearbyObjects(x, y, radius) {
    let closeObject = null;
    let smallestDistance = Infinity;
    for (let key in objects) {
        const object = objects[key];
        const distance = Math.sqrt((object.position.x - x) ** 2 + (object.position.y - y) ** 2);
        if (distance < radius && distance < smallestDistance) {
            closeObject = object;
            smallestDistance = distance;
        }
    }
    console.log("closest object", closeObject);
    return closeObject;
}





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
        console.log("added", data, data.key, data.val());
        let localData = data.val();
        localData.key = data.key;
        objects[data.key] = localData;
        redrawAll();
    });
    onChildChanged(commentsRef, (data) => {
        console.log("changed", data.key, data.val());
        objects[data.key] = data.val();
        redrawAll();
    });
    onChildRemoved(commentsRef, (data) => {
        console.log("removed", data, data.key, data.val());
        delete objects[data.key];
        isEditing = false;
        inputBox.value = "";
        inputBox.style.color = "black";
        redrawAll();
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




