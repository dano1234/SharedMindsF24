import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase, ref, onValue, update, set, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

let isInteracting = false;
let myName = null;
let myKey = null;
let db;

//make a folder in your firebase for this example
let appName = "SharedMinds2DNamedMoveTXExample";
let allText = {};

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

login();
initInterface();
initFirebase();

function login() {
    myName = prompt("What is your name?");
    console.log("myName", myName,);
    if (myName == null || myName == "") {
        const now = new Date();
        myName = now.toLocaleString();
        console.log("sorry did not catch your name", myName);
    }
}

function drawAll(x, y, text) {
    const ctx = document.getElementById('myCanvas').getContext('2d');
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear the canvas
    ctx.font = '30px Arial';
    ctx.fillStyle = 'red';
    ctx.fillText("Hello " + myName, ctx.canvas.width - 200, 30);
    for (const key in allText) {
        const textData = allText[key];
        let thisName = textData.name;
        if (thisName === myName) myKey = key; //keep track of your key
        ctx.font = '24px Arial';
        ctx.fillStyle = 'black';
        ctx.fillText(thisName + ":" + textData.text, textData.position.x, textData.position.y);
    }
}


function initFirebase() {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    let folder = 'texts';
    //get callbacks when there are changes either by you locally or others remotely
    const commentsRef = ref(db, appName + '/' + folder + '/');
    onChildAdded(commentsRef, (data) => {
        allText[data.key] = data.val(); //adds it
        console.log("added", data.key, data.val());
        drawAll();
    });
    onChildChanged(commentsRef, (data) => {
        allText[data.key] = data.val();
        console.log("changed", data.key, data.val());
        drawAll();
    });
    onChildRemoved(commentsRef, (data) => {
        console.log("removed", data.key);
        delete allText[data.key]; //removes it
        drawAll();
    });
}

function setInFirebase(folder, data) {
    //firebase will supply the key,  this will trigger "onChildAdded" below
    if (myKey) {
        const dbRef = ref(db, appName + '/' + folder + '/' + myKey);
        update(dbRef, data);
    } else {
        //if it doesn't exist, it adds (pushes) and collect the key for later updates
        const dbRef = ref(db, appName + '/' + folder + '/');
        myKey = push(dbRef, data).key;
    }
}

function initInterface() {
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
            const data = {
                name: myName,
                type: 'text',
                position: { x: x, y: y },
                text: inputValue
            };
            setInFirebase('texts', data);
            //NOTICE: not changing local json or drawing it locally until you hear back from firebase
        }
    });

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

}

