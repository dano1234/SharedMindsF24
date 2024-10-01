// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase, ref, off, onValue, update, set, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";
import { getAuth, signOut, setPersistence, browserSessionPersistence, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js"
import { initAll } from "./main.js";

let db, auth, app;
let googleAuthProvider;
let appName = "SharedMindsFramesAuthExample";


export function getUser() {
    return auth.currentUser;
}

export function initFirebase() {
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
    auth = getAuth();
    setPersistence(auth, browserSessionPersistence);
    googleAuthProvider = new GoogleAuthProvider();
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in, see docs for a list of available properties
            // https://firebase.google.com/docs/reference/js/auth.user
            const uid = user.uid;
            console.log("userino is signed in", user);
            showLogOutButton(user);
            initAll();
            // ...
        } else {
            console.log("userino is signed out");
            showLoginButtons();
            // User is signed out
            // ...
        }
    });

    return auth.currentUser;
}

export function addNewThingToFirebase(folder, data) {
    //firebase will supply the key,  this will trigger "onChildAdded" below
    const dbRef = ref(db, folder);
    const newKey = push(dbRef, data).key;
    return newKey; //useful for later updating
}

export function updateJSONFieldInFirebase(folder, key, data) {
    console.log(folder + '/' + key)
    const dbRef = ref(db, folder + '/' + key);
    update(dbRef, data);
}

export function deleteFromFirebase(folder, key) {
    console.log("deleting", folder + '/' + key);
    const dbRef = ref(db, folder + '/' + key);
    set(dbRef, null);
}

export function subscribeToData(folder, callback) {
    //get callbacks when there are changes either by you locally or others remotely
    const commentsRef = ref(db, folder + '/');
    onChildAdded(commentsRef, (data) => {
        callback("added", data.val(), data.key);
        //reactToFirebase("added", data.val(), data.key);
    });
    onChildChanged(commentsRef, (data) => {
        callback("changed", data.val(), data.key);
        //reactToFirebase("changed", data.val(), data.key)
    });
    onChildRemoved(commentsRef, (data) => {
        callback("removed", data.val(), data.key);
        //reactToFirebase("removed", data.val(), data.key)
    });
}

export function unSubscribeToData(folder) {
    const oldRef = ref(db, folder + '/');
    console.log("unsubscribing from", folder, oldRef);
    off(oldRef);
}


export function setDataInFirebase(folder, key, data) {
    //if it doesn't exist, it adds (pushes) with you providing the key
    //if it does exist, it overwrites
    const dbRef = ref(db, appName + '/' + folder)
    set(dbRef, data);
}


let authDiv = document.createElement("div");
authDiv.style.position = "absolute";
authDiv.style.top = "10%";
authDiv.style.left = "85%";
//authDiv.style.width = "150px";
//authDiv.style.height = "150px";
authDiv.style.backgroundColor = "lightpink";
authDiv.style.border = "3px solid darkred";
authDiv.style.padding = "10px";
authDiv.style.zIndex = "1000";
authDiv.style.borderRadius = "10px"; // Add this line to set rounded corners
//align elements in the center
authDiv.style.display = "flex";
authDiv.style.flexDirection = "column";
authDiv.style.alignItems = "center";
document.body.appendChild(authDiv);

// Rest of the code...

authDiv.style.zIndex = "1000";
document.body.appendChild(authDiv);


function showLogOutButton(user) {
    authDiv.innerHTML = "";
    let userNameDiv = document.createElement("div");
    if (user.photoURL) {
        console.log("photo url", user.photoURL);
        let userPic = document.createElement("img");
        userPic.style.width = "50px";
        userPic.style.height = "50px";

        userPic.onload = function (img) {
            console.log("loaded", img);
            authDiv.appendChild(userPic);
        }
        userPic.src = user.photoURL;


    }

    if (user.displayName) {
        userNameDiv.innerHTML = user.displayName;
    } else {
        userNameDiv.innerHTML = user.email;
    }
    let logOutButton = document.createElement("button");
    authDiv.appendChild(userNameDiv);
    logOutButton.innerHTML = "Log Out";
    logOutButton.setAttribute("id", "logOut");
    authDiv.appendChild(logOutButton);
    document.getElementById("logOut").addEventListener("click", function () {
        signOut(auth).then(() => {
            // Sign-out successful.
            console.log("signed out");
        }).catch((error) => {
            // An error happened.
            console.log("error signing out");
        });
    });
}

function showLoginButtons() {
    authDiv.innerHTML = "";

    let signUpWithGoogleButton = document.createElement("button");
    signUpWithGoogleButton.innerHTML = "Google Login";
    signUpWithGoogleButton.setAttribute("id", "signInWithGoogle");
    signUpWithGoogleButton.setAttribute("class", "authButton");
    authDiv.appendChild(signUpWithGoogleButton);

    authDiv.appendChild(document.createElement("br"));


    let emailDiv = document.createElement("div");
    emailDiv.innerHTML = "Email";
    authDiv.appendChild(emailDiv);

    //let form = document.createElement("form");
    //authDiv.appendChild(form);

    let emailInput = document.createElement("input");
    emailInput.setAttribute("id", "email");
    emailInput.setAttribute("class", "authInput");
    emailInput.setAttribute("type", "text");
    emailInput.setAttribute("placeholder", "email@email.com");
    authDiv.appendChild(emailInput);

    let passwordInput = document.createElement("input");
    passwordInput.setAttribute("id", "password");
    passwordInput.setAttribute("class", "authInput");
    passwordInput.setAttribute("type", "password");
    passwordInput.setAttribute("suggest", "current-password");
    passwordInput.setAttribute("autocomplete", "on");
    passwordInput.setAttribute("placeholder", "password");

    authDiv.appendChild(passwordInput);
    let buttonSpan = document.createElement("span");
    buttonSpan.style.display = "flex";
    buttonSpan.style.justifyContent = "space-around";
    buttonSpan.style.width = "100%";
    authDiv.appendChild(buttonSpan);

    let signUpWithEmailButton = document.createElement("button");
    signUpWithEmailButton.innerHTML = "SignUp";
    signUpWithEmailButton.setAttribute("id", "signUpWithEmail");
    signUpWithEmailButton.setAttribute("class", "authButton");
    buttonSpan.appendChild(signUpWithEmailButton);

    let signInWithEmailButton = document.createElement("button");
    signInWithEmailButton.innerHTML = "SignIn";
    signInWithEmailButton.setAttribute("id", "signInWithEmail");
    signInWithEmailButton.setAttribute("class", "authButton");
    buttonSpan.appendChild(signInWithEmailButton);


    document.getElementById("signInWithGoogle").addEventListener("click", function () {
        signInWithPopup(auth, googleAuthProvider) //
            .then((result) => {
                // This gives you a Google Access Token. You can use it to access the Google API.
                const credential = GoogleAuthProvider.credentialFromResult(result);
                const token = credential.accessToken;
                // The signed-in user info.
                const user = result.user;
                // IdP data available using getAdditionalUserInfo(result)
                // ...
            }).catch((error) => {
                // Handle Errors here.
                const errorCode = error.code;
                const errorMessage = error.message;
                // The email of the user's account used.
                const email = error.customData.email;
                // The AuthCredential type that was used.
                const credential = GoogleAuthProvider.credentialFromError(error);
                // ...
            });
    });

    document.getElementById("signInWithEmail").addEventListener("click", function () {
        console.log("signed in email", auth);
        let email = document.getElementById("email").value;
        let password = document.getElementById("password").value;
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed in 
                console.log("signed in", userCredential);
                const user = userCredential.user;
                // ...
            })
            .catch((error) => {
                console.log("error signing in", error);
                const errorCode = error.code;
                const errorMessage = error.message;
            });
    });

    document.getElementById("signUpWithEmail").addEventListener("click", function () {
        let email = document.getElementById("email").value;
        let password = document.getElementById("password").value;
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed up 
                const user = userCredential.user;
                console.log(user);
                // ...
            })
            .catch((error) => {
                console.log("error signing up", error);
                const errorCode = error.code;
                const errorMessage = error.message;
                // ..
            });
    });
}




