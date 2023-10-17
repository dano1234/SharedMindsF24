
// Import the functions you need from the SDKs you need

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-analytics.js";
import { getDatabase, ref, set, query, orderByChild, equalTo, push, onValue, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";


const replicateProxy = "https://replicate-api-proxy.glitch.me"



let db;
let app;
let myDBID;

let appName = "authUploadInpaintImage";
let img;
let canvas
let mask;
let w = 512;
let h = 512;

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

let myp5 = new p5((p) => {
    p.preload = () => {
        img = p.loadImage('woods.png');
    }
    p.setup = () => {
        canvas = p.createCanvas(w, h);
        mask = p.createGraphics(w, h);

    }
    p.draw = () => {
        p.background(0, 255, 255);
        if (img) {
            p.image(img, 0, 0, w, h);
        }
        p.image(mask, 0, 0, w, h);
    }
    p.mouseDragged = () => {
        mask.fill(255, 255, 255);
        mask.noStroke();
        mask.ellipse(p.mouseX, p.mouseY, 30, 30);
    }
});



function init() {
    console.log("init");
    app = initializeApp(firebaseConfig);
    db = getDatabase();
    const analytics = getAnalytics(app);
    connectToFirebaseAuth()
    let prompter = document.createElement("input");
    prompter.id = "prompter";
    prompter.value = "Pink Dinosaur";
    prompter.style.position = "absolute";
    prompter.style.top = "540px";
    prompter.style.left = "20px";
    prompter.style.width = "480px";
    prompter.style.height = "20px";
    let asker = document.createElement("button");
    asker.id = "asker";
    asker.style.position = "absolute";
    asker.style.top = "540px";
    asker.style.left = "520px";
    asker.innerHTML = "Ask";
    asker.addEventListener("click", askInpaint);
    document.body.appendChild(prompter);
    document.body.appendChild(asker);
    subscribeToImages();
}


function addImage(url) {
    const imagesRef = push(ref(db, appName + '/images/'));
    let newImage = {
        "prompt": prompt,
        "width": w,
        "height": h,
        "prompt_strength": 0.5,
        "image": url
    }
    set(imagesRef, newImage);
}

function setLastQueryForUser(mask, prompt) {
    set(ref(db, appName + '/users/' + myDBID + "/images/"), {
        "mask": mask,
        "prompt": prompt
    });
}



function subscribeToImages() {
    const imagesRef = ref(db, appName + '/images/');
    onChildAdded(imagesRef, (data) => {
        let imageURL = data.val().image;
        myp5.loadImage(imageURL, function (newImage) {
            console.log("image loaded", newImage);
            mask = myp5.createGraphics(w, h);
            img = newImage;
        });
        ///let container = addDiv(data.key, data);
        // fillContainer(container, data.key, data);
        console.log("added", data.key, data);

    });
    onChildChanged(imagesRef, (data) => {

        console.log("changed", data.key, data);
    });

    onChildRemoved(imagesRef, (data) => {
        console.log("removed", data.key, data.val());
    });
}

async function askInpaint() {
    myp5.image(img, 0, 0, w, h);
    canvas.loadPixels();
    mask.loadPixels();
    let maskBase64 = mask.elt.toDataURL();
    let imgBase64 = canvas.elt.toDataURL();

    prompt = document.getElementById("prompter").value;
    let postData = {
        "version": "c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316",
        input: {
            "prompt": prompt,
            "width": w,
            "height": h,
            "num_inference_steps": 25,
            "prompt_strength": 1,
            "guidance_scale": 9.5,
            "image": imgBase64,
            "mask": maskBase64,
            "seed": 32,

        },
    };
    setLastQueryForUser(maskBase64, prompt);
    let url = replicateProxy + "/create_n_get";
    const options = {
        headers: {
            "Content-Type": `application/json`,
        },
        method: "POST",
        body: JSON.stringify(postData), //p)
    };
    console.log("Asking for Picture ", url, options);
    const response = await fetch(url, options);
    const result = await response.json();
    console.log(result.output[0]);
    const imageURL = result.output[0];
    addImage(imageURL);
    myp5.loadImage(imageURL, function (newImage) {
        console.log("image loaded", newImage);
        mask = myp5.createGraphics(w, h);
        img = newImage;
        //storeImageInFirebaseStorage(newImage);
    });

}



function uploadImageToFirebaseStorage() {
    //get the image from the canvas
    canvas.loadPixels();
    let base64Image = canvas.elt.toDataURL("image/png", 1.0);
    //upload it to firebase storage using modular syntax
    const storage = getStorage();
    const storageRef = ref(storage, 'images/' + myDBID + "/" + Date.now() + ".png");
    const uploadTask = uploadString(storageRef, base64Image, 'data_url');
    uploadTask.on('state_changed',
        (snapshot) => {
            // Observe state change events such as progress, pause, and resume
            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded

            let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
            // switch (snapshot.state) {
            //   case 'paused':
            //     console.log('Upload is paused');
            //     break;
            //   case 'running':
            //     console.log('Upload is running');
            //     break;
            // }
        },
        (error) => {
            // Handle unsuccessful uploads
        },
        () => {
            // Handle successful uploads on complete
            // For instance, get the download URL: https://firebasestorage.googleapis.com/...
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                console.log('File available at', downloadURL);
                addImage(downloadURL);
            });
        }
    );
}

function subscribeToUsers() {
    const commentsRef = ref(db, appName + '/users/');
    onChildAdded(commentsRef, (data) => {
        console.log("user added", data.key, data);
    });
    onChildChanged(commentsRef, (data) => {
        console.log("user changed", data.key, data);
    });
    onChildRemoved(commentsRef, (data) => {
        console.log("user removed", data.key, data.val());
    });
}

/////AUTH STUFF////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
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
    // if (!authUser.displayName) authUser.displayName = authUser.email.split("@")[0];
    let displayName = authUser.displayName ?? testUserTemplate.displayName;
    let photoURL = authUser.photoURL ?? testUserTemplate.photoURL;
    if (!authUser.displayName) authUser.displayName = testUserTemplate.displayName;
    if (!authUser.photoURL) authUser.photoURL = testUserTemplate.photoURL;

    const db = getDatabase();
    console.log("authuser", authUser);
    set(ref(db, appName + '/users/' + authUser.uid + "/"), {
        'uid': authUser.uid,
        'email': authUser.email,
        'displayName': displayName,
        'defaultProfileImage': photoURL,
        'onlineStatus': "available",
    });

}


