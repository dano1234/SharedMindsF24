
let appName = "3DEmbeddingsFirebase";
let folder = "embeddings";

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

function subscribeToImages() {
    const commentsRef = ref(db, appName + '/' + folder + '/');
    onChildAdded(commentsRef, (data) => {
        console.log("added", data.val());
        var incomingImage = new Image();
        incomingImage.crossOrigin = "anonymous";
        incomingImage.onload = function () {
            placeImage(incomingImage, data.val().location);
        };
        let b64 = data.val().base64Image;

        incomingImage.src = b64;

    });
    onChildChanged(commentsRef, (data) => {
        console.log("changed", data.key, data);
    });
    onChildRemoved(commentsRef, (data) => {
        console.log("removed", data.key, data.val());
    });
}

function sendImageToFirebase(base64Image, prompt) {
    let pos = getPositionInFrontOfCamera()
    let dataToSet = {
        prompt: prompt,
        base64Image: base64Image,
        location: { "x": pos.x, "y": pos.y, "z": pos.z }
    }
    //console.log("dataToSet", dataToSet);
    push(ref(db, appName + '/' + folder + '/'), dataToSet);
}
