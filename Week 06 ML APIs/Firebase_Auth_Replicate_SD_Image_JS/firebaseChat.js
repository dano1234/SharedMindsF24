
// Import the functions you need from the SDKs you need

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-analytics.js";
import { getDatabase, ref, set, query, orderByChild, equalTo, push, onValue, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

const replicateProxy = "https://replicate-api-proxy.glitch.me"

let name;
let db;
let app;
let myDBID;
let myContainer;
let appName = "authImage";

const firebaseConfig = {
    apiKey: "AIzaSyAvM1vaJ3vcnfycLFeb8RDrTN7O2ToEWzk",
    authDomain: "shared-minds.firebaseapp.com",
    databaseURL: "https://shared-minds-default-rtdb.firebaseio.com",
    projectId: "shared-minds",
    storageBucket: "shared-minds.appspot.com",
    messagingSenderId: "258871453280",
    appId: "1:258871453280:web:4c103da9b230e982544505",
    measurementId: "G-LN0GNWFZQQ"
};


init(); //same as setup but we call it ourselves


function init() {
    console.log("init");
    app = initializeApp(firebaseConfig);
    db = getDatabase();
    const analytics = getAnalytics(app);
    connectToFirebaseAuth()

}


window.addEventListener('mousedown', function (event) {
    console.log("mouse moved", myContainer);
    if (event.shiftKey) {

        let x = event.clientX;
        let y = event.clientY;
        myContainer.style.left = x + "px";
        myContainer.style.top = y + "px";
        set(ref(db, appName + '/users/' + myDBID + "/location"), {
            "x": x,
            "y": y
        });
    }
    return true;
});

function subscribeToUsers() {
    const commentsRef = ref(db, appName + '/users/');
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

function fillContainer(container, key, data) {
    let name = document.getElementById("name_element_" + key);
    let input = document.getElementById("input_element_" + key);
    let image = document.getElementById("image_element_" + key);
    let x = data.val().location.x;
    let y = data.val().location.y;
    container.style.position = "absolute";
    container.style.left = x + "px";
    container.style.top = y + "px";
    name.value = data.val().username;
    input.value = data.val().prompt;
    image.src = data.val().image;
}

function addDiv(key, data) {
    //div holds two things
    let container = document.createElement('div');
    container.style.border = "2px solid black";
    container.style.width = "256px";
    container.style.height = "256px";
    console.log("addDiv", "key", key, "myDBID", myDBID);
    if (key == myDBID) {
        container.style.border = "2px solid red";
        myContainer = container;
    }

    container.id = key;
    let x = Math.random() * window.innerWidth;
    let y = Math.random() * window.innerHeight;
    if (data.val().location) {
        x = data.val().location.x;
        y = data.val().location.y;
    }
    container.style.position = "absolute";
    container.style.left = x + "px";
    container.style.top = y + "px";

    let imageElement = document.createElement('img');
    imageElement.style.width = "256px";
    imageElement.style.height = "256px";
    imageElement.id = "image_element_" + key;

    let nameElement = document.createElement('span');
    nameElement.style.width = "25px";
    nameElement.id = "name_element_" + key;
    nameElement.innerHTML = data.val().username + ": ";

    let inputField = document.createElement('input');
    inputField = document.createElement('input');
    inputField.style.width = "170px";
    inputField.style.height = "20px";
    inputField.id = "input_element_" + key;
    inputField.addEventListener('keyup', function (event) {
        if (event.key == "Enter") {
            askReplicateForImage(key, inputField, imageElement, nameElement, x, y);
        }

    });

    container.append(imageElement);
    container.append(document.createElement('br'));
    container.append(nameElement);
    container.append(inputField);
    document.body.append(container);
    return container;
}




async function askReplicateForImage(key, textField, imageElement, nameField, x, y) {
    prompt = textField.value;
    name = nameField.value;
    textField.value = "waiting: " + textField.value;
    //const imageDiv = document.getElementById("resulting_image");
    //imageDiv.innerHTML = "Waiting for reply from Replicate's Stable Diffusion API...";
    let data = {
        "version": "da77bc59ee60423279fd632efb4795ab731d9e3ca9705ef3341091fb989b7eaf",
        input: {
            "prompt": prompt,
            "width": 512,
            "height": 512,
        },
    };
    console.log("Asking for Picture Info From Replicate via Proxy", data);
    let options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };
    const url = replicateProxy + "/create_n_get/"
    console.log("url", url, "options", options);
    const picture_info = await fetch(url, options);
    //console.log("picture_response", picture_info);
    const proxy_said = await picture_info.json();

    if (proxy_said.output.length == 0) {
        textField.value = "Something went wrong, try it again";
    } else {
        console.log("proxy_said", proxy_said.output[0]);
        let imageURL = proxy_said.output[0];
        imageElement.src = imageURL;
        textField.value = prompt;
        set(ref(db, appName + '/users/' + key), {
            prompt: prompt,
            image: imageURL,
            username: name,
            location: { "x": x, "y": y }
        });

    }
}

/////AUTH STUFF
//the ui for firebase authentication doesn't use the modular syntax
let authUser

let uiConfig;
let loggedIn = false;

let localUserEmail = "no email";

uiConfig = {
    callbacks: {
        signInSuccessWithAuthResult: function (authResult, redirectUrl) {
            authUser = authResult;
            console.log("succesfuly logged in", authResult.user.email);
            if (loggedIn) location.reload(); //reboot if this is a change.
            // User successfully signed in.
            // Return type determines whether we continue the redirect automatically
            // or whether we leave that to developer to handle.
            return false;
        },
        uiShown: function () {
            // The widget is rendered.
            // Hide the loader.
            document.getElementById('loader').style.display = 'none';
        }
    },
    // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
    signInFlow: 'popup',
    // signInSuccessUrl: '<url-to-redirect-to-on-success>',
    signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],
    tosUrl: '<your-tos-url>',
    privacyPolicyUrl: '<your-privacy-policy-url>'
};

function connectToFirebaseAuth() {
    firebase.initializeApp(firebaseConfig);
    //this allowed seperate tabs to have seperate logins
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
    firebase.auth().onAuthStateChanged((firebaseAuthUser) => {
        console.log("my goodness there has been an auth change");
        document.getElementById("signOut").display = "block";
        if (!firebaseAuthUser) {
            document.getElementById("name").display = "none";
            document.getElementById("profile-image").display = "none";
            document.getElementById("signOut").style.display = "none";
            console.log("no valid login, sign in again?");
            var ui = new firebaseui.auth.AuthUI(firebase.auth());
            ui.start('#firebaseui-auth-container', uiConfig);

        } else {
            console.log("we have a user", firebaseAuthUser);
            authUser = firebaseAuthUser

            document.getElementById("signOut").style.display = "block";
            localUserEmail = authUser.multiFactor.user.email;
            myDBID = authUser.multiFactor.user.uid;
            console.log("authUser", authUser, "myDBID", myDBID);
            document.getElementById("name").innerHTML = authUser.multiFactor.user.displayName;
            if (authUser.multiFactor.user.photoURL != null)
                document.getElementById("profile-image").src = authUser.multiFactor.user.photoURL;
            checkForUserInRegularDB(authUser.multiFactor.user);
            subscribeToUsers()
        }
    });
}


//// ALL THE UI AUTH STUFF IS DONE IN THE OLD WEB PAGE NAME SPACE STYLE, NOT MODULAR
document.getElementById("signOut").addEventListener("click", function () {
    firebase.auth().signOut().then(function () {
        console.log("User signed out");
        location.reload();
    }).catch(function (error) {
        console.log("Error:", error);
    });
});


function checkForUserInRegularDB(user) {
    //write a firebase query to do look for a uid in the database
    console.log("checkForUserInDB", user.uid);
    db = getDatabase();
    let UIDRef = ref(db, appName + '/users/' + user.uid + "/");

    onValue(UIDRef, (snapshot) => {
        if (snapshot.exists()) {
            console.log(snapshot.val());
            let data = snapshot.val();

            console.log("someone by that id in db", myDBID, data);
        } else {
            giveAuthUserRegularDBEntry(authUser);
        }
    });

}


function giveAuthUserRegularDBEntry(authUser) {
    let testUserTemplate = {
        email: "dan@example.com",
        displayName: "Test User",
        photoURL: "emptyProfile.png"
    };
    console.log("Authuser but no user info in DB yet", authUser, testUserTemplate);
    if (!authUser.displayName) authUser.displayName = authUser.email.split("@")[0];
    let displayName = authUser.displayName ?? testUserTemplate.displayName;
    let photoURL = authUser.photoURL ?? testUserTemplate.photoURL;
    if (!authUser.displayName) authUser.displayName = testUserTemplate.displayName;
    if (!authUser.photoURL) authUser.photoURL = testUserTemplate.photoURL;

    const db = getDatabase();
    set(ref(db, appName + '/users/' + authUser.uid + "/"), {
        'uid': authUser.uid,
        'email': authUser.email,
        'displayName': displayName,
        'defaultProfileImage': photoURL,
        'onlineStatus': "available",
    });

}


