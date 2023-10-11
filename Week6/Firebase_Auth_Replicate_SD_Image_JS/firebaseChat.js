
// Import the functions you need from the SDKs you need

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-analytics.js";
import { getDatabase, ref, onValue, set, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

const replicateProxy = "https://replicate-api-proxy.glitch.me"



let myContainer;
let name;
let auth;
let db;
let ui;
let authUser
let appName = "authImage";
//let textContainerDiv

const firebaseConfig = {
    apiKey: "AIzaSyAvM1vaJ3vcnfycLFeb8RDrTN7O2ToEWzk",
    authDomain: "shared-minds.firebaseapp.com",
    projectId: "shared-minds",
    storageBucket: "shared-minds.appspot.com",
    messagingSenderId: "258871453280",
    appId: "1:258871453280:web:4c103da9b230e982544505",
    measurementId: "G-LN0GNWFZQQ"
};

var uiConfig = {
    callbacks: {
        signInSuccessWithAuthResult: function (authResult, redirectUrl) {
            authUser = authResult;
            console.log("succesfuly logged in", authResult.user.email);
            if (loggedIn) location.reload(); //reboot if this is a change.
            return false;
        },
        uiShown: function () {
            document.getElementById('loader').style.display = 'none';
        }
    },
    // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
    signInFlow: 'popup',
    // signInSuccessUrl: '<url-to-redirect-to-on-success>',
    signInOptions: [
        // Leave the lines as is for the providers you want to offer your netnauts.
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],
    tosUrl: '<your-tos-url>',
    privacyPolicyUrl: '<your-privacy-policy-url>'
};

function connectToFirebase() {
    const app = initializeApp(firebaseConfig);
    db = getDatabase();
    const analytics = getAnalytics(app);

    firebase.initializeApp(firebaseConfig);
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
    firebase.auth().onAuthStateChanged((firebaseAuthUser) => {
        console.log("my goodness there has been an auth change");
        if (!firebaseAuthUser) {
            $("#name").hide();
            $("#signOut").hide();
            console.log("no valid login, sign in again?");
            var ui = new firebaseui.auth.AuthUI(firebase.auth());
            ui.start('#firebaseui-auth-container', uiConfig);
        } else {
            authUser = firebaseAuthUser
            $("#name").show();
            $("#signOut").show();
            console.log("valid login", firebaseAuthUser.email);
            checkForUserInDB(firebaseAuthUser);
        }
    });

}

document.getElementById("signOut").addEventListener("click", function () {
    firebase.auth().signOut().then(function () {
        console.log("User signed out");
        location.reload();
    }).catch(function (error) {
        console.log("Error:", error);
    });
});

function checkForUserInDB(user) {
    console.log("checkForUserInDB", user);
    const usersRef = ref(db, appName + '/users/').orderByChild("uid").equalTo(user.uid)
    usersRef.once("value", snapshot => {

        //ref(db, appName + '/users/').orderByChild("uid").equalTo(user.uid).once("value", snapshot => {
        if (snapshot.exists()) {
            let data = snapshot.val();
            myDBID = Object.keys(data)[0];
            console.log("someone by that id in db, let's go", myDBID, data);
            $("#name").html(data[myDBID].displayName); // + " " + seed + " " + prompt);

        } else {
            //add to database
            giveAuthUserDatabaseEntry(authUser);
        }

    }).catch(function (error) {
        console.log("tried to get snapshot of existing", error);
    });
}

function giveAuthUserDatabaseEntry(authUser) {
    console.log("Authuser but no user info in DB yet", authUser, testUserTemplate);
    if (!authUser.displayName) authUser.displayName = authUser.email.split("@")[0];
    let displayName = authUser.displayName ?? testUserTemplate.displayName;
    let photoURL = authUser.photoURL ?? testUserTemplate.photoURL;
    if (!authUser.displayName) authUser.displayName = testUserTemplate.displayName;
    if (!authUser.photoURL) authUser.photoURL = testUserTemplate.photoURL;
    let mydata = {
        'uid': authUser.uid,
        'email': authUser.email,
        'displayName': displayName,
        'defaultProfileImage': photoURL,
        'onlineStatus': "available",
    };
    $("#name").html(displayName); // + " " + seed + " " + prompt);
    ref(db, appName + '/users/' + authUser.uid).set(mydata)
    myDBID = authUser.uid;
}

init(); //same as setup but we call it ourselves

function init() {
    console.log("init");
    let nameField = document.createElement('name');
    document.body.append(nameField);
    connectToFirebase()

    //let name = localStorage.getItem('fb_name');

    subscribeToUsers()
    //askForExistingUser(name)

}


// window.addEventListener('mouseup', function (event) {
//     console.log("mouse moved", event);
//     if (!myContainer.contains(event.target)) {
//         let x = event.clientX;
//         let y = event.clientY;
//         myContainer.style.left = x + "px";
//         myContainer.style.top = y + "px";
//         set(ref(db, 'authImage/users/' + name + "/location"), {
//             "x": x,
//             "y": y
//         });
//     }
// });

function subscribeToUsers() {
    const commentsRef = ref(db, 'authImage/users/');
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
    if (key == name) {
        container.style.border = "2px solid red";
        myContainer = container;
    }

    container.id = key;
    let x = data.val().location.x;
    let y = data.val().location.y;
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
            askForImage(key, inputField, imageElement, x, y);
        }

    });

    container.append(imageElement);
    container.append(document.createElement('br'));
    container.append(nameElement);
    container.append(inputField);
    document.body.append(container);
    return container;
}

function askForExistingUser(name) {
    const db = getDatabase();
    const usersRef = ref(db, 'authImage/users/' + name);
    console.log("usersRef", usersRef);
    onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            console.log("new user");
            let newX = Math.random() * window.innerWidth;
            let newY = Math.random() * window.innerHeight;
            set(ref(db, 'authImage/users/' + name), {
                username: name,
                prompt: "",
                image: "",
                location: { "x": newX, "y": newY }
            });
        }
        console.log("from database", data);
    });
}


async function askForImage(key, textField, imageElement, x, y) {
    prompt = textField.value;
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
        set(ref(db, 'authImage/users/' + key), {
            prompt: prompt,
            image: imageURL,
            username: key,
            location: { "x": x, "y": y }
        });

    }
}
