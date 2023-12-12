let group = "3DRoomTextMouse";
let typeOfThing = "words";


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

    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);
    db = getDatabase();
    subscribeToImages()
}

/////FIREBASE STUFF
function sendTextToDB() {
    let pos = inputBox.position();
    let mydata = {
        location: { x: pos.x, y: pos.y + textSize() },
        text: inputBox.value(),
    };
    //add a stroke
    if (currentKey == -1) {
        //new one
        let idOfNew = db.ref("group/" + group + "/" + typeOfThing + "/").push(mydata);
    } else {
        let idOfOld = db.ref("group/" + group + "/" + typeOfThing + "/" + currentKey).update(mydata);
    }
    inputBox.hide();
    moveItButton.hide();
}

function subscribeToFirebase() {

    const app = firebase.initializeApp(firebaseConfig);
    db = app.database();

    var myRef = db.ref("group/" + group + "/" + typeOfThing + "/");
    myRef.on("child_added", (data) => {
        //console.log("add", data.key, data.val());
        let key = data.key;
        let value = data.val();
        //update our local variable
        allTextsLocal[key] = value;
        drawAll();
    });

    myRef.on("child_changed", (data) => {
        console.log("changed", data.key, data.val());
        let key = data.key;
        let value = data.val();
        allTextsLocal[key] = value;
        drawAll();

    });

    myRef.on("child_removed", (data) => {
        console.log("removed", data.key);
        delete allTextsLocal[data.key];
    });
}