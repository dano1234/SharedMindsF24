import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-analytics.js";
//import { getFirestore } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-firestore.js"
import { getDatabase, update, ref, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-database.js";
import { createObject, removeObject } from "./embeddingsFB.js";


//use var instead of let in module to make it global
var appName;
var folder
var db;
export var localKey;
var firestoreDB;

export function initFirebase(_appName, _folder) {
    appName = _appName;
    folder = _folder;

    console.log("init firebase at ", appName, folder);
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
        apiKey: "AIzaSyDHOrU4Lrtlmk-Af2svvlP8RiGsGvBLb_Q",
        authDomain: "sharedmindss24.firebaseapp.com",
        databaseURL: "https://sharedmindss24-default-rtdb.firebaseio.com",
        projectId: "sharedmindss24",
        storageBucket: "sharedmindss24.appspot.com",
        messagingSenderId: "1039430447930",
        appId: "1:1039430447930:web:edf98d7d993c21017ad603"
    };
    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);
    db = getDatabase();
    //firestoreDB = getFirestore();
    //console.log("firestore", firestoreDB);
    subscribeToFirebase()
}

// export async function saveVectors(objects) {
//     const path = '/' + appName + '/' + folder + '/';
//     const myRef = ref(firestoreDB, path);
//     //const coll = firestoreDB.collection('coffee-beans');

//     for (let object of objects) {
//         await myRef.add({
//             name: "Kahawa coffee beans",
//             description: "Information about the Kahawa coffee beans.",
//             embedding_field: object.embedding //FieldValue.vector([1.0, 2.0, 3.0])
//         });
//     }
// }
function subscribeToFirebase() {
    const path = '/' + appName + '/' + folder + '/';
    //console.log("subscribeToFirebase", path);
    const myRef = ref(db, path);

    onChildAdded(myRef, (data) => {
        console.log("added", data.val())
        feedback.innerHTML = "Ready"
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
        removeObject(data.key, data.val());
        console.log("removed", data.key, data.val());
    });
}

export function storeInFirebase(data) {
    const myRef = ref(db, appName + '/' + folder + '/')
    //console.log("storeEmbeddingInFirbase", prompt, embedding);

    console.log("dataToSet", data);
    // push adds something to the database and returns a key
    let gotBack = push(myRef, data);
    localKey = gotBack.key;
    console.log("got back", localKey);
}


export function destroyDatabase() {
    const myRef = ref(db, appName + '/' + folder + '/')
    //console.log("storeEmbeddingInFirbase", prompt, embedding);
    const updates = {};
    updates[appName + '/' + folder + '/'] = {};
    update(ref(db), updates);
}

export function updateInFirebase(key, data) {
    //just append the image to the existing data
    const updates = {};
    updates[appName + '/' + folder + '/' + key + '/image/'] = data;
    update(ref(db), updates);
}
