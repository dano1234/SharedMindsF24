// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-analytics.js";
import { getDatabase, ref, onValue, set, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

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

let db;

init(); //same as setup but we call it ourselves


function init() {
    console.log("init");
    let nameField = document.createElement('name');
    document.body.append(nameField);
    db = getDatabase();


}

function set(folder, data) {
    set(ref(db, 'image/users/' + folder + "/location"), {
        "x": x,
        "y": y
    });
}

function subscribeToUsers() {
    const commentsRef = ref(db, 'image/users/');
    onChildAdded(commentsRef, (data) => {
        let container = addDiv(data.key, data);
        fillContainer(container, data.key, data);
        console.log("added", data.key, data);
    });

    onChildChanged(commentsRef, (data) => {
        let container = document.getElementById(data.key);
        if (!container) {
            container = addDiv(data.key, data);
        }
        fillContainer(container, data.key, data);
        console.log("changed", data.key, data);
    });

    onChildRemoved(commentsRef, (data) => {
        console.log("removed", data.key, data.val());
    });


}