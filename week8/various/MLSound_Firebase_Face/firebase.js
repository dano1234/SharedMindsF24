// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCIQal3LFcsD_rpMI2Bw1qsscjjq6WvYaM",
    authDomain: "mind-media-8c547.firebaseapp.com",
    databaseURL: "https://mind-media-8c547-default-rtdb.firebaseio.com",
    projectId: "mind-media-8c547",
    storageBucket: "mind-media-8c547.appspot.com",
    messagingSenderId: "531193870122",
    appId: "1:531193870122:web:ab26cb2a8f9c0999029053",
    measurementId: "G-SQ0DKJZEKJ",
};

let group = "mySillyLocalizedMLSoundRoom";
let typeOfThing = "sounds";
let db;

function gotDisconnect(id) {
    for (var i = 0; i < people.length; i++) {
        if (people[i].id == id) {
            people[i].canvas.remove(); //dom version
            scene.remove(people[i].object); //three.js version
            people.splice(i, 1);  //remove from our variable
            break;
        }
    }

}

function gotStream(stream, id) {

    myName = id;
    //this gets called when there is someone else in the room, new or existing
    //don't want the dom object, will use in p5 and three.js instead
    //get a network id from each person who joins

    stream.hide();
    creatNewVideoObject(stream, id);
}

function gotData(data, id) {
    // If it is JSON, parse it
    let d = JSON.parse(data);
    for (var i = 0; i < people.length; i++) {
        if (people[i].id == id) {
            positionOnCircle(d.angleOnCircle, people[i].object);
            break;
        }
    }
}



/////FIREBASE STUFF
function sendTextToDB(thisSound) {
    let pos = thisSound.position();

    video.loadPixels();
    let base64Image = thisSound.toDataURL();
    let mydata = {
        location: { x: pos.x, y: pos.y },
        prompt: thisSound.prompt,
        sound: base64Image,
    };
    if (!thisSound.dbKey) {
        //new one
        let placeInDB = "group/" + group + "/" + typeOfThing + "/";
        thisSound.dbKey = db.ref(placeInDB).push(mydata);
    } else {
        //update
        let placeInDB = "group/" + group + "/" + typeOfThing + "/" + thisSound.dbKey;
        db.ref(placeInDB).update(mydata);
    }
}

function connectToFirebase() {
    const app = firebase.initializeApp(firebaseConfig);
    db = app.database();

    var myRef = db.ref("group/" + group + "/" + typeOfThing + "/");
    myRef.on("child_added", (data) => {
        //console.log("add", data.key, data.val());
        let key = data.key;
        let value = data.val();
        //update our local variable
        allLocal[key] = value;
        drawAll();
    });

    myRef.on("child_changed", (data) => {
        console.log("changed");
        let key = data.key;
        let value = data.val();
        allLocal[key] = value;
        drawAll();
    });

    myRef.on("child_removed", (data) => {
        console.log("removed");
        delete allLocal[data.key];
        drawAll();
    });
}
