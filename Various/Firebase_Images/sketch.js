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
let typeOfThing = "images";
let db;
let allLocal = {};

let video;
let currentKey = -1;
let needsUpdate = false;
let wasMoved = false;

function setup() {
  createCanvas(400, 400);
  connectToFirebase();
  video = createCapture(VIDEO);
  video.size(80, 60);
  video.hide();
}

function draw() {
  //all the work in drawAll
}

function drawAll() {
  background(255);
  // go through key value pairs
  for (var key in allLocal) {
    let thisThing = allLocal[key];
    let img = thisThing.image;
    //load from base64 picture stored in database
    loadImage(thisThing.image, (img) => {
      image(img, thisThing.location.x, thisThing.location.y);
    });
  }
}

/////FIREBASE STUFF
function sendTextToDB() {
  let pos = video.position();
  let vis = video.style("display");
  if (vis == "none" || (pos.x == 0 && pos.y == 0)) {
    console.log(pos, vis);
    return;
  }
  video.loadPixels();
  let base64Image = video.canvas.toDataURL("image/png", 1.0);
  let mydata = {
    location: { x: pos.x, y: pos.y },
    image: base64Image,
  };
  if (currentKey == -1) {
    //new one
    let placeInDB = "group/" + group + "/" + typeOfThing + "/";
    let idOfNew = db.ref(placeInDB).push(mydata);
  } else {
    //update
    let placeInDB = "group/" + group + "/" + typeOfThing + "/" + currentKey;
    let idOfOld = db.ref(placeInDB).update(mydata);
  }
  video.hide();
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

//////INTERFACE STUFF

function mouseDragged() {
  video.position(mouseX - video.width / 2, mouseY - video.height / 2);
  wasMoved = true;
  needsUpdate = false;
}

function keyPressed() {
  if (key == "Backspace") {
    needsUpdate = false;
    if (currentKey != -1) {
      let placeInDB = "group/" + group + "/" + typeOfThing + "/" + currentKey;
      let idOfOld = db.ref(placeInDB).remove();
      video.hide();
    }
  } else if (key == "Escape") {
    needsUpdate = false;
    wasMoved = false;
    video.hide();
  }
}

function mousePressed() {
  if (needsUpdate) {
    console.log("aasking for update");
    needsUpdate = false;
    sendTextToDB();
  }
  seeIfYouClickedOnExisting();
}

function mouseReleased() {
  if (wasMoved) {
    sendTextToDB();
    wasMoved = false;
  }
}

function seeIfYouClickedOnExisting() {
  let clickedOnSomething = false;
  for (var key in allLocal) {
    let thisThing = allLocal[key];
    let loc = thisThing.location;
    let w = video.width;
    let h = video.height;
    if (
      mouseX > loc.x &&
      mouseX < loc.x + w &&
      mouseY > loc.y &&
      mouseY < loc.y + h
    ) {
      video.position(loc.x, loc.y);
      currentKey = key;
      drawAll();
      needsUpdate = true;
      video.show();
      clickedOnSomething = true;
      break;
    }
  }
  if (clickedOnSomething == false) {
    //create new one
    video.position(mouseX, mouseY);
    currentKey = -1;
    needsUpdate = true;
    video.show();
  }
}
