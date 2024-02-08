// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-analytics.js";
import { getDatabase, ref, onValue, set, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";
import { createNewText } from './objectsFB.js';

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
let appName = "SharedMindsExample";

let db;

init(); //same as setup but we call it ourselves


function init() {
    console.log("init");
    let nameField = document.createElement('name');
    document.body.append(nameField);
    db = getDatabase();
}

export function setDataInFirebase(folder, key, data) {
    set(ref(db, appName + '/' + folder + '/' + key), data);
}

export function subscribeToData(folder) {
    const commentsRef = ref(db, appName + '/' + folder + '/');
    onChildAdded(commentsRef, (data) => {
        console.log("added", data.key, data);
        createNewText(data, data.key);
    });

    onChildChanged(commentsRef, (data) => {

        console.log("changed", data.key, data);
    });

    onChildRemoved(commentsRef, (data) => {
        console.log("removed", data.key, data.val());
    });


}