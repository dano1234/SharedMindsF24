
let camera3D, scene, renderer
let myCanvas, myVideo;
let people = {};  //make it an associatvie array with each person labeled by network id
let p5lm
let landmarks = {};

let myRoomName = "multidimensionalRooom";
let model;
let settlingInterval;
let alterEgo;

function setup() {
    console.log("setup");
    myCanvas = createCanvas(512, 512);
    myCanvas.hide();
    //let captureConstraints =  allowCameraSelection(myCanvas.width,myCanvas.height) ;
    //myVideo = createCapture(captureConstraints, videoLoaded);
    //below is simpler if you don't need to select Camera because default is okay

    myVideo = createCapture(VIDEO);
    myVideo.size(myCanvas.width, myCanvas.height);
    myVideo.elt.muted = true;
    myVideo.hide()


    p5lm = new p5LiveMedia(this, "CANVAS", myCanvas, myRoomName)
    p5lm.on('stream', gotStream);
    p5lm.on('data', gotData);
    p5lm.on('disconnect', gotDisconnect);

    init3D();

    //create the local thing
    creatNewVideoObject(myCanvas, "me");


    model = new rw.HostedModel({
        url: "https://stylegan2-7694fe98.hosted-models.runwayml.cloud/v1/",
        token: "g/YBslj6S5eCne661wNO2Q=="
    });

    startVector = createRandomVector();
    createLandmarkPicture(startVector, 0) ;
    talkToRunway("landmark",  startVector, 0);
    endVector = createRandomVector();
    createLandmarkPicture( endVector, 180) ;
    talkToRunway("landmark",  endVector, 180);
}
function settled() {
    console.log("settled");
    let pos1 = landmarks[0].object.position;
    let pos2 = landmarks[180].object.position;
    let myPos = people["me"].object.position;
    let distanceBetweenLandmarks = dist(pos1.x, pos1.y, pos1.z, pos2.x, pos2.y,pos2.z);
    let distanceBetweenMeAndFirstLandmark = dist(myPos.x, myPos.y, myPos.z, pos1.x,pos1.y,pos1.z);
    let t = distanceBetweenMeAndFirstLandmark/distanceBetweenLandmarks;
    //let t = ((people["me"].angleOnCircle)/4)/Math.PI;

    let v0 = nj.array(startVector);
    let v1 = nj.array(endVector);
    let currentVector =  (v0.multiply(1-t).add(v1.multiply(t))).tolist();  // createRandomVector();

    talkToRunway("myImage", currentVector, null)
}
function talkToRunway(reason, vector, angle) {
    const path = 'http://localhost:8000/query';
    console.log("askit", reason, angle);
    const data = {
        z: vector,
        truncation: 0.7
    };
    //This is code if you spin up a model on runway's server and create a model object here
    model.query(data).then(outputs => {
        const { image } = outputs;
        // use the outputs in your project
        // console.log("Got Image Data", image);
        let runway_img = createImg(image,
            function () {  //this function gets called when it is finished being created
                runway_img.hide();
                if (reason == "landmark") {
                    //change picture of landmark
                    console.log("got landmark angle", angle);
                    updateLandmark(landmarks[angle],runway_img);
                } else {
                    //change your video to resulting picture
                    alterEgo = createGraphics(512, 512);
                    alterEgo.image(runway_img, 0, 0, 512, 512);
                    console.log("got alterEgo");
                }
            }
        );
    });
    //This is the code if you are talking to your local runway
    /*  httpPost(path, 'json', data, 
      function(data){;
           let runway_img = createImg(data.result,
                function () {  //this function gets called when it is finished being created
                runway_img.hide();
                if (reason == "landmark") {
                    //change picture of landmark
                    console.log("got landmark angle", angle, landmarks);
                    updateLandmark(landmarks[angle],runway_img);
                } else {
                    //change your video to resulting picture
                    alterEgo = createGraphics(512, 512);
                    alterEgo.image(runway_img, 0, 0, 512, 512);
                    console.log("got alterEgo", alterEgo);
                }
            }
            }
        );
      }, 
      function(){ 
          onsole.log("error")
        });
      */
}

function createLandmarkPicture(vector, angle) {
    let graphics = createGraphics(512, 512);
    //graphics.image(runway_img, 0, 0, 512, 512);
    graphics.background(127);
    fill(255,0,0);
    graphics.textSize(32);
    graphics.text("Loading...",graphics.width/3,graphics.height/2);
    var myTexture = new THREE.Texture(graphics.elt);
    var material = new THREE.MeshBasicMaterial({ map: myTexture, transparent: false });
    var geo = new THREE.PlaneGeometry(512, 512);
    var mesh = new THREE.Mesh(geo, material);
    scene.add(mesh);

    positionOnCircle(THREE.Math.degToRad(angle), mesh);
    myTexture.needsUpdate = true;
    landmarks[angle] ={ "object": mesh, "texture": myTexture, "canvas": graphics, "vector": vector };
}

function updateLandmark(landmark, img){
    landmark.canvas.image(img, 0, 0, 512, 512);
    landmark.texture.needsUpdate = true;
}

function createRandomVector() {
    const vector = [];
    for (let i = 0; i < 512; i++) {
        vector[i] = random(-1, 1);
    }
    return vector;
}

///move people around and tell them about 
document.addEventListener('keydown', onDocumentKeyDown, false);
function onDocumentKeyDown(e) {
    alterEgo = null;
    clearTimeout(settlingInterval);
    let me = people["me"];
    if (e.key == "ArrowLeft" || e.key == "a") {
        me.angleOnCircle += .05;

    } else if (e.key ==  "ArrowRight" || e.key == "d") {
        me.angleOnCircle -= .05;


    } else if (keyCode == 38 || key == "w") {

    } else if (keyCode == 40 || key == "s") {

    }
    settlingInterval = setTimeout(settled, 3000);
    positionOnCircle(me.angleOnCircle, me.object); //change it locally 
    //send it to others
    let dataToSend = { "angleOnCircle": me.angleOnCircle };
    p5lm.send(JSON.stringify(dataToSend));

}

function draw() {
    //go through all the people an update their texture, animate would be another place for this
    for (id in people) {
        let thisPerson = people[id];
        if (thisPerson.videoObject.elt.readyState == thisPerson.videoObject.elt.HAVE_ENOUGH_DATA) {
            //check that the transmission arrived okay
            //then tell three that something has changed.
            thisPerson.texture.needsUpdate = true;
        }
    }
  // for (let i = 0; i < landmarks.length; i++) {
     //   landmarks[i].texture.needsUpdate = true;
    //}
    //this is what gets sent to other people;
    if (alterEgo) {
        image(alterEgo, 0, 0, myCanvas.width, myCanvas.height);
    } else {
        clear();
        image(myVideo, (myCanvas.width - myVideo.width) / 2, (myCanvas.height - myVideo.height) / 2,myVideo.width,myVideo.height);
      
    }
    people["me"].texture.needsUpdate = true;
}


function gotData(data, id) {
    // If it is JSON, parse it
    let d = JSON.parse(data);
    positionOnCircle(d.angleOnCircle, people[id].object);
}

function gotStream(videoObject, id) {
    //this gets called when there is someone else in the room, new or existing
    videoObject.hide();  //don't want the dom object, will use in p5 and three.js instead
    //get a network id from each person who joins
    creatNewVideoObject(videoObject, id);
}

function gotDisconnect(id) {
    people[id].videoObject.remove(); //dom version
    scene.remove(people[id].object); //three.js version
    delete people[id];  //remove from our variable
}

function creatNewVideoObject(videoObject, id) {  //this is for remote and local
    var videoGeometry = new THREE.PlaneGeometry(512, 512);
    let myTexture = new THREE.Texture(videoObject.elt);  //NOTICE THE .elt  this give the element
    let videoMaterial = new THREE.MeshBasicMaterial({ map: myTexture, side: THREE.DoubleSide });
    videoMaterial.map.minFilter = THREE.LinearFilter;  //otherwise lots of power of 2 errors
    myAvatarObj = new THREE.Mesh(videoGeometry, videoMaterial);

    scene.add(myAvatarObj);

    //they can move that around but we need to put you somewhere to start
    angleOnCircle = positionOnCircle(null, myAvatarObj);

    //remember a bunch of things about each connection in json but we are really only using texture in draw
    //use an named or associate array where each oject is labeled with an ID
    people[id] = { "object": myAvatarObj, "texture": myTexture, "id": id, "videoObject": videoObject, "angleOnCircle": angleOnCircle };

}

function positionOnCircle(angle, thisAvatar) {
    //position it on a circle around the middle
    if (angle == null) { //first time
        angle = random(2 * Math.PI);
    }
    //imagine a circle looking down on the world and do High School math
    let distanceFromCenter = 800;
    x = distanceFromCenter * Math.sin(angle);
    z = distanceFromCenter * Math.cos(angle);
    thisAvatar.position.set(x, 0, z);  //zero up and down
    thisAvatar.lookAt(0, 0, 0);  //oriented towards the camera in the center
    return angle;
}


function init3D() {
    scene = new THREE.Scene();
    camera3D = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    let bgGeometery = new THREE.SphereGeometry(900, 100, 40);
    //let bgGeometery = new THREE.CylinderGeometry(725, 725, 1000, 10, 10, true)
    bgGeometery.scale(-1, 1, 1);
    // has to be power of 2 like (4096 x 2048) or(8192x4096).  i think it goes upside down because texture is not right size
    let panotexture = new THREE.TextureLoader().load("itp.jpg");
    let backMaterial = new THREE.MeshBasicMaterial({ map: panotexture });

    let back = new THREE.Mesh(bgGeometery, backMaterial);
    scene.add(back);

    moveCameraWithMouse();

    camera3D.position.z = 0;
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera3D);
}

/////MOUSE STUFF  ///YOU MIGHT NOT HAVE TO LOOK DOWN BELOW HERE VERY MUCH

var onMouseDownMouseX = 0, onMouseDownMouseY = 0;
var onPointerDownPointerX = 0, onPointerDownPointerY = 0;
var lon = -90, onMouseDownLon = 0; //start at -90 degrees for some reason
var lat = 0, onMouseDownLat = 0;
var isUserInteracting = false;


function moveCameraWithMouse() {
    document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('mouseup', onDocumentMouseUp, false);
    document.addEventListener('wheel', onDocumentMouseWheel, false);
    window.addEventListener('resize', onWindowResize, false);
    camera3D.target = new THREE.Vector3(0, 0, 0);
}


function onDocumentMouseDown(event) {
    onPointerDownPointerX = event.clientX;
    onPointerDownPointerY = event.clientY;
    onPointerDownLon = lon;
    onPointerDownLat = lat;
    isUserInteracting = true;
}

function onDocumentMouseMove(event) {
    if (isUserInteracting) {
        lon = (onPointerDownPointerX - event.clientX) * 0.1 + onPointerDownLon;
        lat = (event.clientY - onPointerDownPointerY) * 0.1 + onPointerDownLat;
        computeCameraOrientation();
    }
}

function onDocumentMouseUp(event) {
    isUserInteracting = false;
}

function onDocumentMouseWheel(event) {
    camera3D.fov += event.deltaY * 0.05;
    camera3D.updateProjectionMatrix();
}

function computeCameraOrientation() {
    lat = Math.max(- 30, Math.min(30, lat));  //restrict movement
    let phi = THREE.Math.degToRad(90 - lat);  //restrict movement
    let theta = THREE.Math.degToRad(lon);
    camera3D.target.x = 10000 * Math.sin(phi) * Math.cos(theta);
    camera3D.target.y = 10000 * Math.cos(phi);
    camera3D.target.z = 10000 * Math.sin(phi) * Math.sin(theta);
    camera3D.lookAt(camera3D.target);
}


function onWindowResize() {
    camera3D.aspect = window.innerWidth / window.innerHeight;
    camera3D.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    console.log('Resized');
}

function allowCameraSelection(w, h) {
    //This whole thing is to build a pulldown menu for selecting between cameras

    //manual alternative to all of this pull down stuff:
    //type this in the console and unfold resulst to find the device id of your preferredwebcam, put in sourced id below
    //navigator.mediaDevices.enumerateDevices()

    //default settings
    let videoOptions = {
        audio: true, video: {
            width: w,
            height: h
        }
    };

    let preferredCam = localStorage.getItem('preferredCam')
    //if you changed it in the past and stored setting
    if (preferredCam) {
        videoOptions = {
            video: {
                width: w,
                height: h,
                sourceId: preferredCam
            }
        };
    }
    //create a pulldown menu for picking source
    navigator.mediaDevices.enumerateDevices().then(function (d) {
        var sel = createSelect();
        sel.position(10, 10);
        for (var i = 0; i < d.length; i++) {
            if (d[i].kind == "videoinput") {
                let label = d[i].label;
                let ending = label.indexOf('(');
                if (ending == -1) ending = label.length;
                label = label.substring(0, ending);
                sel.option(label, d[i].deviceId)
            }
            if (preferredCam) sel.selected(preferredCam);
        }
        sel.changed(function () {
            let item = sel.value();
            //console.log(item);
            localStorage.setItem('preferredCam', item);
            videoOptions = {
                video: {
                    optional: [{
                        sourceId: item
                    }]
                }
            };
            myVideo.remove();
            myVideo = createCapture(videoOptions, VIDEO);
            myVideo.hide();
            console.log("Preferred Camera", videoOptions);
        });
    });
    return videoOptions;
}