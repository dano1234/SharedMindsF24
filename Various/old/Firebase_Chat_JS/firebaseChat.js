
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
let textContainerDiv
let db;

init()

function init() {
    console.log("init");
    db = getDatabase();
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
    inputField.style.left = 50 + "px";
    inputField.style.top = window.innerHeight / 2 + "px";
    inputField.style.width = "200px";
    inputField.style.height = "20px";
    inputField.addEventListener('keyup', function (event) {
        if (event.key == "Enter") {
            addToDBList('text/posts/', inputField.value);
        }

    });

    textContainerDiv = document.createElement('div');
    textContainerDiv.style.position = "absolute";
    textContainerDiv.style.left = window.innerWidth / 2 + "px";
    textContainerDiv.style.top = 10 + "px";
    textContainerDiv.style.width = window.innerWidth / 2 - 50 + "px";;
    textContainerDiv.style.height = window.innerHeight + "px";;
    textContainerDiv.id = "textContainerDiv";
    textContainerDiv.style.border = "2px solid gray";
    document.body.append(textContainerDiv);
    document.body.append(inputField);

    subscribeToPosts()
}

function checkForUserInRegularDB(user) {
    console.log("checkForUserInDB", user);
    const usersRef = ref(db, appName + '/users/').orderByChild("uid").equalTo(user.uid)
    usersRef.once("value", snapshot => {
        //ref(db, appName + '/users/').orderByChild("uid").equalTo(user.uid).once("value", snapshot => {
        if (snapshot.exists()) {
            let data = snapshot.val();
            myDBID = Object.keys(data)[0];
            console.log("someone by that id in db, let's go", myDBID, data);
            //  $("#name").html(data[myDBID].displayName); // + " " + seed + " " + prompt);
        } else {
            //add to database
            giveAuthUserRegularDBEntry(authUser);
        }
    }).catch(function (error) {
        console.log("tried to get snapshot of existing", error);
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
    let mydata = {
        'uid': authUser.uid,
        'email': authUser.email,
        'displayName': displayName,
        'defaultProfileImage': photoURL,
        'onlineStatus': "available",
    };
    // $("#name").html(displayName); // + " " + seed + " " + prompt);
    ref(db, appName + '/users/' + authUser.uid).set(mydata)
    myDBID = authUser.uid;
}



function subscribeToPosts() {


    const commentsRef = ref(db, 'text/posts/');
    onChildAdded(commentsRef, (data) => {
        //console.log("added", data.key, data.val());
        addTextfield(data.key, data.val());
    });

    onChildChanged(commentsRef, (data) => {

        const element = document.getElementById(data.key);
        element.innerHTML = data.val().username + ": " + data.val().text;
        console.log("changed", data.key, data.val(), element);
    });

    onChildRemoved(commentsRef, (data) => {
        console.log("removed", data.key, data.val());
    });

}

function addTextfield(key, data) {
    let changedDiv = document.getElementById(key);
    if (changedDiv) {
        changedDiv.innerHTML = data.username + ": " + data.text;
    } else {
        let div = document.createElement('div');
        div.id = key; //syncing the id with the key in the database
        div.style.overflow = "auto";
        div.style.resize = "both";
        div.style.font = "medium - moz - fixed";
        div.style.border = "2px solid gray";
        div.setAttribute("contenteditable", true);
        div.style.width = "90%";
        div.style.height = "100px";
        div.innerHTML = data.username + ": " + data.text;
        div.addEventListener('blur', function (event) {  //blur is when you click away from the textfield
            let content = event.target.innerHTML.split(":")[1].trim();
            console.log("blur", content);
            set(ref(db, 'text/posts/' + key), {
                "username": name,
                "text": content,
            });
        });
        textContainerDiv.append(div);
    }
}

function writeUserData(userId, name, email, imageUrl) {
    const db = getDatabase();
    set(ref(db, 'users/' + userId), {
        username: name,
        email: email,
        profile_picture: imageUrl
    });
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
