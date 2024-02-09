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

let group = "mySillyRoomName";
let typeOfThing = "strokes"
let db;
let strokeDots = [];
let allStrokesLocal = {};

function setup() {
  createCanvas(400, 400);
  connectToFirebase();
}

function draw() {
 
}

function drawStrokes() {
  background(255);
  // go through key value pairs
  for (var key in allStrokesLocal) {
    let thisStroke = allStrokesLocal[key];
    for (var i = 0; i < thisStroke.locations.length; i++) {
      thisLoc = thisStroke.locations[i];
      ellipse(thisLoc.x, thisLoc.y, 10, 10);
    }
  }
}

function mousePressed() {
  strokeDots = [];
}

function mouseDragged() {
  //if they have moved some distance add to dots
  if (dist(mouseX, mouseY, pmouseX, pmouseY) > 2) {
    strokeDots.push({ x: mouseX, y: mouseY });
    ellipse(mouseX, mouseY, 10, 10);
  }
}

function mouseReleased() {
  addStrokeToDB();
}

function addStrokeToDB() {
  let mydata = {
    locations: strokeDots,
  };
  //add a stroke
  let dbInfo = db.ref("group/" + group + "/" + typeOfThing +"/").push(mydata);
}

function connectToFirebase() {
  const app = firebase.initializeApp(firebaseConfig);
  db = app.database();

  var myRef = db.ref("group/" + group+ "/" + typeOfThing +"/");
  myRef.on("child_added", (data) => {
    console.log("add", data.key, data.val());
    let key = data.key;
    let value = data.val();
    //update our local variable
    allStrokesLocal[key] = value;
    drawStrokes();
    //console.log(allStrokesLocal);
  });

  //not used
  myRef.on("child_changed", (data) => {
    console.log("changed", data.key, data.val());
  });

  //not used
  myRef.on("child_removed", (data) => {
    console.log("removed", data.key);
  });
}
