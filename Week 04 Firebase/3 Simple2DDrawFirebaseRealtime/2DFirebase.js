import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase, ref, onValue, update, set, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

let isInteracting = false;
let myName = null;
let myKey = null;
let db;
let currentTrail = [];
let lastX = -1;
let lastY = -1;

//make a folder in your firebase for this example
let appName = "SharedMinds2DNamedMoveDrawExample";
let allDrawings = {};

////FIREBASE STUFF
const firebaseConfig = {
    apiKey: "AIzaSyDHOrU4Lrtlmk-Af2svvlP8RiGsGvBLb_Q",
    authDomain: "sharedmindss24.firebaseapp.com",
    databaseURL: "https://sharedmindss24-default-rtdb.firebaseio.com",
    projectId: "sharedmindss24",
    storageBucket: "sharedmindss24.appspot.com",
    messagingSenderId: "1039430447930",
    appId: "1:1039430447930:web:edf98d7d993c21017ad603"
};

login();
initInterface();
initFirebase();

animate();
function animate() {
    drawAll();
    requestAnimationFrame(animate);
}


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
    //put user name in the top right
    ctx.font = '30px Arial';
    ctx.fillStyle = 'blue';
    ctx.fillText("Hello " + myName, ctx.canvas.width - 200, 30);
    for (const key in allDrawings) {
        const drawingInfo = allDrawings[key];
        let thisName = drawingInfo.name;
        if (thisName === myName) myKey = key; //keep track of your key
        ctx.stroke();
        ctx.font = '14px Arial';
        ctx.strokeStyle = 'black';
        ctx.fillText(thisName, drawingInfo.location.x, drawingInfo.location.y);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(drawingInfo.trail[0][0][0], drawingInfo.trail[0][0][1]);
        for (let i = 1; i < drawingInfo.trail.length; i++) {
            ctx.lineTo(drawingInfo.trail[i][0], drawingInfo.trail[i][1]);
        }

    }
    //draw the current trail
    ctx.stroke();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (currentTrail.length > 0) {
        ctx.moveTo(currentTrail[0][0][0], currentTrail[0][0][1]);
        for (let i = 1; i < currentTrail.length; i++) {
            ctx.lineTo(currentTrail[i][0], currentTrail[i][1]);
        }
        console.log("drawing", currentTrail);
    }
    // ctx.stroke();
}

function initFirebase() {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    let folder = 'drawings';
    //get callbacks when there are changes either by you locally or others remotely
    const commentsRef = ref(db, appName + '/' + folder + '/');
    onChildAdded(commentsRef, (data) => {
        allDrawings[data.key] = data.val(); //adds it
        console.log("added", data.key, data.val());
        drawAll();
    });
    onChildChanged(commentsRef, (data) => {
        allDrawings[data.key] = data.val();
        console.log("changed", data.key, data.val());
        drawAll();
    });
    onChildRemoved(commentsRef, (data) => {
        console.log("removed", data.key);
        delete allDrawings[data.key]; //removes it
        drawAll();
    });
}

function setInFirebase(folder, data) {
    //firebase will supply the key,  this will trigger "onChildAdded" below
    if (myKey) {
        const dbRef = ref(db, appName + '/' + folder + '/' + myKey);
        console.log("updating", myKey);
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




    // Add event listener to the document for mouse down event
    document.addEventListener('mousedown', (event) => {
        // Set the location of the input box to the mouse location
        currentTrail = [];
        isInteracting = true;
    });
    document.addEventListener('mousemove', (event) => {
        // Set the location of the input box to the mouse location
        if (isInteracting) {
            let amountMoved = Math.abs(lastX - event.clientX) + Math.abs(lastY - event.clientY);
            if (amountMoved > 2) {
                currentTrail.push([event.clientX, event.clientY]);
                lastX = event.clientX;
                lastY = event.clientY;
            }
        }
    });
    document.addEventListener('mouseup', (event) => {

        setInFirebase('drawings', { name: myName, location: { x: event.clientX, y: event.clientY }, trail: currentTrail });
        currentTrail = [];
        isInteracting = false;
    });

}

