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
let firebaseApp;

function setup() {
  createCanvas(400, 400);
  firebaseApp = firebase.initializeApp(firebaseConfig);
  fireBaseAuthStuff();
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

function connectToFirebaseDB() {

  db = firebaseApp.database();

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

//AUTHENTICATE


let localUserEmail, localUserDisplayName,      localImage;
let loggedIn = false;

$("#login").click(function (event) {

    var ui = new firebaseui.auth.AuthUI(firebase.auth());
    //  firebase.auth().onAuthStateChanged(function(){ location.reload();});
    ui.start('#firebaseui-auth-container', uiConfig);
 
    //
});
var uiConfig = {
    callbacks: {
        signInSuccessWithAuthResult: function (authResult, redirectUrl) {
            console.log("succesfuly logged in" , authResult.user.email);
            if (loggedIn) location.reload(); //reboot if this is a change.
            localUserEmail = authResult.user.email;
            localUserDisplayName = authResult.user.displayName;
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
        // Leave the lines as is for the providers you want to offer your users.
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        // firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
        // firebase.auth.GithubAuthProvider.PROVIDER_ID,
        // firebase.auth.EmailAuthProvider.PROVIDER_ID,
        // firebase.auth.PhoneAuthProvider.PROVIDER_ID
    ],
    // Terms of service url.
    tosUrl: '<your-tos-url>',
    // Privacy policy url.
    privacyPolicyUrl: '<your-privacy-policy-url>'
};

function fireBaseAuthStuff(){
  firebase.auth().onAuthStateChanged((user) => {

        if (user) {
            $("#login").show();
            // User is signed in, see docs for a list of available properties
            // https://firebase.google.com/docs/reference/js/firebase.User
            localUserEmail = user.email;
            localUserDisplayName = user.displayName;
            localImage =   user.photoURL;
            $("#gProfile").attr("src",user.photoURL);
            if (user.email.endsWith("@nyu.edu") ) { 
               
              
                loggedIn = true;
                connectToFirebaseDB();
               // $("#login").hide();
            }else{
                $("#login").html('Logged In As ' + localUserEmail  +  " Please use an nyu.edu gmail (and refresh page).");
                $("#info").hide();
                console.log("please use your @nyu.edu address");
                return;
            }

            console.log("login still valid", localUserEmail, localUserDisplayName);
            
  
            
        } else {
            // User is signed out
            // ...
            $("#info").hide();
            $("#login").hide();
            console.log("no valid login, sign in again?");
            var ui = new firebaseui.auth.AuthUI(firebase.auth());
            ui.start('#firebaseui-auth-container', uiConfig);
        }
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
