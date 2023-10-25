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
let typeOfThing = "words";
let db;
let allTextsLocal = {};
let inputBox;
let moveItButton;
let currentKey = -1;
let movedIt = false;

function setup() {
  createCanvas(400, 400);
  connectToFirebase();
  inputBox = createInput("Your Text Here");
  inputBox.changed(sendTextToDB);
  inputBox.mousePressed(inputBoxPressed);

  inputBox.hide();
  moveItButton = createButton("O");
  moveItButton.mouseMoved(buttonDragged);
  moveItButton.hide();
}

function draw() {}

function drawAll() {
  background(255);
  // go through key value pairs
  for (var key in allTextsLocal) {
    let thisText = allTextsLocal[key];
    text(thisText.text, thisText.location.x, thisText.location.y);
  }
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

function connectToFirebase() {
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

//////INTERFACE STUFF FOR TEXT ENTRY BOX

function inputBoxPressed() {
  clickedInInputBox = true;
}
function buttonDragged() {
  if (mouseIsPressed) {
    let w = moveItButton.size().width;
    let h = moveItButton.size().height;
    moveItButton.position(mouseX -w/2, mouseY - h / 2);
    inputBox.position(mouseX +w/2 , mouseY - h / 2);
    movedIt = true;
  }
}


function mousePressed() {
  if (didIJustClickInInterfaceElement() == false) {
    seeIfYouClickedOnExisting();
  }
}

function mouseReleased(){
  if(movedIt){
    sendTextToDB();
    movedIt = false;
  }
}

function didIJustClickInInterfaceElement() {
  let x = inputBox.position().x;
  let y = inputBox.position().y;
  let w = inputBox.size().width;
  let h = inputBox.size().height;
  clickedInInputBox =
    mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
  x = moveItButton.position().x;
  y = moveItButton.position().y;
  w = moveItButton.size().width;
  h = moveItButton.size().height;
  clickedOnMoveButton =
    mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
  return clickedInInputBox || clickedOnMoveButton;
}

function seeIfYouClickedOnExisting() {
  let clickedOnSomething = false;
  for (var key in allTextsLocal) {
    let thisText = allTextsLocal[key];
    let loc = thisText.location;
    let w = textWidth(thisText.text);
    let h = textSize();
    if (
      mouseX > loc.x &&
      mouseX < loc.x + w &&
      mouseY > loc.y - h &&
      mouseY < loc.y
    ) {
      inputBox.position(loc.x, loc.y - h);
      moveItButton.position(loc.x - moveItButton.size().width, loc.y - h);

      inputBox.value(thisText.text);
      currentKey = key;
      //delete allTextsLocal[key];
      drawAll();
      inputBox.show();
      moveItButton.show();
      clickedOnSomething = true;
      break;
    }
  }
  if (clickedOnSomething == false) {
    inputBox.position(mouseX, mouseY - textSize());
    inputBox.value("Your Text Here");
    moveItButton.position(mouseX - moveItButton.size().width, mouseY - textSize());

    currentKey = -1;
    inputBox.show();
    moveItButton.show();
  }
}
