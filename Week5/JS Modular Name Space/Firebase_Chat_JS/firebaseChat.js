
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-analytics.js";
import { getDatabase, ref, onValue, set, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";
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
let nameField;
let name;
init()

function init() {
    console.log("init");
    nameField = document.createElement('input');
    nameField.style.position = "absolute";
    nameField.style.left = window.innerWidth - 50 + "px";
    nameField.style.top = 50 + "px";
    nameField.style.width = "50px";
    nameField.style.height = "20px";
    //let name = localStorage.getItem('fb_name');
    if (!name) {
        name = prompt("Enter Your Name Here");
        //localStorage.setItem('fb_name', name);  //save name
    }
    console.log("name", name);
    if (name) {
        nameField.value = name;
    }
    askForExistingUser(name)


    inputField = document.createElement('input');
    inputField = document.createElement('input');
    inputField.style.position = "absolute";
    inputField.style.left = window.innerWidth / 2 + "px";
    inputField.style.top = window.innerHeight - 30 + "px";
    inputField.style.width = "200px";
    inputField.style.height = "20px";
    inputField.addEventListener('keyup', function (event) {
        if (event.key == "Enter") {
            addToDBList('text/posts/', inputField.value);
        }

    });
    document.body.append(inputField);

    subscribeToPosts()
}

function subscribeToPosts() {
    const db = getDatabase();

    const commentsRef = ref(db, 'text/posts/');
    onChildAdded(commentsRef, (data) => {
        console.log("added", data.key, data.val());
    });

    onChildChanged(commentsRef, (data) => {
        console.log("changed", data.key, data.val());
    });

    onChildRemoved(commentsRef, (data) => {
        console.log("removed", data.key, data.val());
    });
    //get changes to users
    // onValue(usersRef, (snapshot) => {   //onValue is a listener
    //     const data = snapshot.val();
    //     console.log("posts event", data);
    // });
}

function askForExistingUser(name) {
    const db = getDatabase();
    const usersRef = ref(db, 'text/users/' + name);
    console.log("usersRef", usersRef);
    onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            console.log("new user");
            const db = getDatabase();
            set(ref(db, 'text/users/' + name), {
                username: name
            });
        }
        console.log("from database", data);
    });
}

// function setDrawingData(data) {
//     const db = getDatabase();
//     set(ref(db, 'text/users/' + inputField.value), {
//         locations: data
//     });
// }

function addToDBList(address, newText) {
    // Create a new post reference with an auto-generated id
    const db = getDatabase();
    const postListRef = ref(db, address);
    const newPostRef = push(postListRef);
    set(newPostRef, {
        username: nameField.value,
        timestamp: Date.now(),
        text: newText
    });

};



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
