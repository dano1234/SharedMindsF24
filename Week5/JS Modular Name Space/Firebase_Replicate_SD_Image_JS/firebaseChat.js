
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-analytics.js";
import { getDatabase, ref, onValue, set, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const replicateProxy = "https://replicate-api-proxy.glitch.me"
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
let nameField;
let name;
let lastUnused = 0;
//let textContainerDiv
let db;

init(); //same as setup but we call it ourselves

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

    for (let i = 0; i < 10; i++) {
        let angle = i * (2 * Math.PI) / 10; //room for 10 people
        let x = radius * Math.cos(angle);
        let y = radius * Math.sin(angle);

        let imageElement = document.createElement('image');
        imageElement.style.position = "absolute";
        imageElement.style.left = x + "px";
        imageElement.style.top = y + "px";
        imageElement.style.width = "256px";
        imageElement.id = "image_element_" + i;
        let inputField = document.createElement('input');
        inputField = document.createElement('input');
        inputField.style.position = "absolute";
        inputField.style.left = x + "px";
        inputField.style.top = (y + 20) + "px";
        inputField.style.width = "200px";
        inputField.style.height = "20px";
        inputField.id = "input_element_" + i;
        inputField.addEventListener('keyup', function (event) {
            if (event.key == "Enter") {
                askForImage(inputField.value, imageElement);
            }

        });
        document.body.append(imageElement);
        document.body.append(inputField);
    }
    subscribeToPosts()
}

function subscribeToUsers() {
    const commentsRef = ref(db, 'images/posts/');
    onChildAdded(commentsRef, (data) => {
        //console.log("added", data.key, data.val());
        addTextfield(data.key, data.val());
    });

    onChildChanged(commentsRef, (data) => {
        let inputElement = document.getElementById("input_element_" + data.key);
        if (!inputElement) {
            inputElement = document.getElementById("input_element_" + lastUnused);
            imageElement = document.getElementById("image_element_" + lastUnused);
            inputElement.id = "input_element_" + data.key;
            imageElement.id = "image_element_" + data.key;
            lastUnused++;
        }
        imageElement.src = data.val().image;
        inputElement.value = data.val().prompt;
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
            set(ref(db, 'images/posts/' + key), {
                "username": name,
                "text": content,
            });

        });

        textContainerDiv.append(div);
    }
}



function askForImage(p_prompt, imageElement) {
    async function askForPicture(p_prompt) {
        const imageDiv = document.getElementById("resulting_image");
        imageDiv.innerHTML = "Waiting for reply from Replicate's Stable Diffusion API...";
        let data = {
            "version": "da77bc59ee60423279fd632efb4795ab731d9e3ca9705ef3341091fb989b7eaf",
            input: {
                "prompt": p_prompt,
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
            imageDiv.innerHTML = "Something went wrong, try it again";
        } else {
            //   addToDBList('text/posts/', inputField.value);
            imageElement.src = proxy_said.output[0];
            set(ref(db, 'images/posts/' + imageElement.id), {
                "username": name,
                "image": imageElement.src,
                "prompt": p_prompt,
            });
        }
    }


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
