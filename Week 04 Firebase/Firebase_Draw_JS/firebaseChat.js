
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-analytics.js";
import { getDatabase, ref, onValue, set, query, limitToLast } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
let inputField;
let canvas;
let ctx;
let lastX = 0;
let lastY = 0;
let dragging = false;
let mouseLocations = [];
let name;
init()


function init() {
    console.log("init");
    inputField = document.createElement('input');
    document.body.append(inputField);
    //let name = localStorage.getItem('fb_name');
    if (!name) {
        name = prompt("Enter Your Name Here");
        //localStorage.setItem('fb_name', name);  //save name
    }
    console.log("name", name);
    if (name) {
        inputField.value = name;
    }
    askForExistingUser(name)
    canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    document.body.append(canvas);
    ctx = canvas.getContext('2d');
    listenForDrawing();
    subscribeToUsers()
}

function subscribeToUsers() {
    const db = getDatabase();
    const usersRef = query(ref(db, 'draw/users/'), limitToLast(10)); //get the last 10 users
    //get changes to users
    onValue(usersRef, (snapshot) => {   //onValue is a listener
        const data = snapshot.val();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let user in data) {
            console.log("user", user);
            //if (user != name) {
            console.log("user", user);
            let userLocations = data[user].locations;
            if (userLocations) {
                console.log("userLocations", userLocations);
                ctx.font = "14px serif";
                ctx.fillStyle = "black";
                ctx.fillText(user, userLocations[0].x, userLocations[0].y);
                for (let i = 0; i < userLocations.length; i++) {
                    let thisLoc = userLocations[i];
                    //ctx.fillStyle = myColor;
                    ctx.fillStyle = "red";

                    ctx.fillRect(thisLoc.x, thisLoc.y, 5, 5);
                }
            }
            // }
        }
        console.log("users event", data);
    });
}

function askForExistingUser(name) {
    const db = getDatabase();
    const usersRef = ref(db, 'draw/users/' + name);
    console.log("usersRef", usersRef);
    onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            console.log("new user");
            const db = getDatabase();
            set(ref(db, 'draw/users/' + name), {
                username: name
            });
        }
        console.log("from database", data);
    });
}

function setDrawingData(data) {
    const db = getDatabase();
    set(ref(db, 'draw/users/' + inputField.value), {
        locations: data
    });
}

function listenForDrawing() {
    canvas.addEventListener('mousedown', function () {
        dragging = true;
        mouseLocations = [];
    });
    canvas.addEventListener('mouseup', function () {
        dragging = false
        setDrawingData(mouseLocations);
    });
    canvas.addEventListener('mousemove', function (event) {
        if (dragging) {
            let x = event.pageX - canvas.offsetLeft;
            let y = event.pageY - canvas.offsetTop;
            let dx = x - lastX;
            let dy = y - lastY;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 2) { //if they have moved some distance add to dots
                lastX = x;
                lastY = y;
                console.log("x:" + x + " y:" + y);
                ctx.fillRect(x, y, 5, 5);
                mouseLocations.push({ x: x, y: y });
            }
        }
    });
}

//     onValue(usersRef(snapshot) => {
//         const data = snapshot.val();
//         console.log(data);
//     });
// }



// let sketch = function (p5) {
//     p5.setup = function () {
//         p5.createCanvas(600, 600);
//         p5.ellipse(100, 100, 100, 100);
//     }
//     p5.draw = function () {
//         p5.background(127);
//         p5.ellipse(100, 100, 100, 100);
//     }

//     p5.mouseDragged = function () {

//         if (p5.dist(p5.mouseX, p5.mouseY, p5.pmouseX, p5.pmouseY) > 3) {
//             console.log('mousedragged', mouseX, mouseY);
//         }
//     }
// }

// let myP5App = new p5(sketch);
// document.body.append(myP5App.canvas.elt);

// Initialize Firebase
