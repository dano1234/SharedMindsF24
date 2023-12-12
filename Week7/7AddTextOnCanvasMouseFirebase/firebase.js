let group = "3DRoomTextMouse";
let typeOfThing = "words";
let currentKey = -1;

function initFirebase() {
    console.log("init");
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
        apiKey: "AIzaSyAvM1vaJ3vcnfycLFeb8RDrTN7O2ToEWzk",
        authDomain: "shared-minds.firebaseapp.com",
        projectId: "shared-minds",
        storageBucket: "shared-minds.appspot.com",
        messagingSenderId: "258871453280",
        appId: "1:258871453280:web:4c103da9b230e982544505",
        measurementId: "G-LN0GNWFZQQ"
    };
    const app = firebase.initializeApp(firebaseConfig);
    db = app.database();

    subscribeToFirebase()
}

/////FIREBASE STUFF
function sendTextToDB(inputText, pos) {
    // let pos = inputBox.position();
    let mydata = {
        location: pos,
        text: inputText,
    };
    //add a stroke
    if (currentKey == -1) {
        //new one
        let idOfNew = db.ref("group/" + group + "/" + typeOfThing + "/").push(mydata);
    } else {
        let idOfOld = db.ref("group/" + group + "/" + typeOfThing + "/" + currentKey).update(mydata);
    }
}

function subscribeToFirebase() {
    var myRef = db.ref("group/" + group + "/" + typeOfThing + "/");
    myRef.on("child_added", (data) => {
        //console.log("add", data.key, data.val());
        let key = data.key;
        let value = data.val();
        //update our local variable
        createNewText(value.text, value.location, key);
    });

    myRef.on("child_changed", (data) => {
        console.log("changed", data.key, data.val());
        let key = data.key;
        let value = data.val();
        createNewText(value.text, value.location, key);
    });

    myRef.on("child_removed", (data) => {
        console.log("removed", data.key);
        delete texts[data.key];
    });
}