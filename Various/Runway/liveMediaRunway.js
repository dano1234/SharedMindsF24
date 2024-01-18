
let camera3D, scene, renderer
let myCanvas, myVideo;
let people = [];
let myRoomName = "mycrazyCanvasRoomName";   //make a different room from classmates
let p5lm;

let textInput;

let runway_img;

function setup() {
    myCanvas = createCanvas(512, 512);
    myCanvas.hide();

    //let captureConstraints = allowCameraSelection(myCanvas.width, myCanvas.height);
    // myVideo = createCapture(captureConstraints);
    //below is simpler if you don't need to select Camera because default is okay
    /* myVideo = createCapture(VIDEO);
     myVideo.size(myCanvas.width, myCanvas.height);
     myVideo.elt.muted = true;
     myVideo.hide()
     */


    p5lm = new p5LiveMedia(this, "CANVAS", myCanvas, myRoomName)
    p5lm.on('stream', gotStream);
    p5lm.on('disconnect', gotDisconnect);

    //ALSO ADD AUDIO STREAM
    //addAudioStream() ;

    init3D();
    talkToRunway();
}

function talkToRunway() {
    const path = 'http://localhost:8000/data';
    //console.log("askit");
    httpGet(path, 'json', false, gotImage, gotError);
}

function gotError(error) {
    console.error(error);
}

function gotImage(data) {
    // console.log("Got Image Data",data);
    runway_img = createImg(data.image, "image generated in runway");
    runway_img.hide();
    talkToRunway();  //get another picture
    //clear();
    //image(runway_img, 0, 0);
}

function draw() {
    //other people
    //go through all the people an update their texture, animate would be another place for this
    for (var i = 0; i < people.length; i++) {
        if (people[i].id == "me") {
            people[i].texture.needsUpdate = true;
        } else if (people[i].videoObject.elt.readyState == people[i].videoObject.elt.HAVE_ENOUGH_DATA) {
            //check that the transmission arrived okay
            people[i].texture.needsUpdate = true;
        }
    }

    //draw the stuff from runway on local canvas to send
    if (runway_img) {
        clear();
        image(runway_img, (myCanvas.width - runway_img.width) / 2, (myCanvas.height - runway_img.height) / 2);
    }
}


function gotStream(videoObject, id) {
    //this gets called when there is someone else in the room, new or existing
    //don't want the dom object, will use in p5 and three.js instead
    //get a network id from each person who joins
    // stream.hide();  //we are using the video in Threejs so hide the DOM version
    creatNewVideoObject(videoObject, id);
}

function creatNewVideoObject(videoObject, id) {  //this is for remote and local

    var videoGeometry = new THREE.PlaneGeometry(width, height);
    myTexture = new THREE.Texture(videoObject.elt);  //NOTICE THE .elt  this give the element
    let videoMaterial = new THREE.MeshBasicMaterial({ map: myTexture , transparent:true});
    videoMaterial.map.minFilter = THREE.LinearFilter;  //otherwise lots of power of 2 errors
    myAvatarObj = new THREE.Mesh(videoGeometry, videoMaterial);

    scene.add(myAvatarObj);

    people.push({ "object": myAvatarObj, "texture": myTexture, "id": id, "videoObject": videoObject });
    positionEveryoneOnACircle();
}


function gotDisconnect(id) {
    for (var i = 0; i < people.length; i++) {
        if (people[i].id == id) {
            people[i].videoObject.remove(); //dom version
            scene.remove(people[i].object); //three.js version
            people.splice(i, 1);  //remove from our variable
            break;
        }
    }
    positionEveryoneOnACircle();    //re space everyone
}

function positionEveryoneOnACircle() {
    //position it on a circle around the middle
    let radiansPerPerson = Math.PI / people.length;  //spread people out over 180 degrees?
    for (var i = 0; i < people.length; i++) {
        let angle = i * radiansPerPerson;
        let thisAvatar = people[i].object;
        let distanceFromCenter = 800;
        //imagine a circle looking down on the world and do High School math
        angle = angle + Math.PI; //for some reason the camera starts point at 180 degrees
        x = distanceFromCenter * Math.sin(angle);
        z = distanceFromCenter * Math.cos(angle);
        thisAvatar.position.set(x, 0, z);  //zero up and down
        thisAvatar.lookAt(0, 0, 0);  //oriented towards the camera in the center
    }
}


function init3D() {
    scene = new THREE.Scene();
    camera3D = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    creatNewVideoObject(myCanvas, "me");

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


function addAudioStream() {
    // Need to use the callback to get at the audio/video stream
    myAudio = createCapture(constraints, function (stream) {
        // Get a stream from the canvas to send
        let canvasStream = myCanvas.elt.captureStream(15);
        // Extract the audio tracks from the stream
        let audioTracks = stream.getAudioTracks();
        // Use the first audio track, add it to the canvas stream
        if (audioTracks.length > 0) {
            canvasStream.addTrack(audioTracks[0]);
        }
        // Give the canvas stream to SimpleSimplePeer as a "CAPTURE" stream
        let p5lm = new p5LiveMedia(this, "CAPTURE", canvasStream, myRoomName + "Audio");
        p5lm.on('stream', gotAudioStream);
    });

    myAudio.elt.muted = true;
    myAudio.hide();
}

function gotAudioStream() {

}
/////MOUSE STUFF  ///YOU MIGHT NOT HAVE TO LOOK DOWN BELOW HERE VERY MUCH

var onMouseDownMouseX = 0, onMouseDownMouseY = 0;
var onPointerDownPointerX = 0, onPointerDownPointerY = 0;
var lon = -90, onMouseDownLon = 0; //start at -90 degrees for some reason
var lat = 0, onMouseDownLat = 0;
var isUserInteracting = false;


function moveCameraWithMouse() {
    document.addEventListener('keydown', onDocumentKeyDown, false);
    document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('mouseup', onDocumentMouseUp, false);
    document.addEventListener('wheel', onDocumentMouseWheel, false);
    window.addEventListener('resize', onWindowResize, false);
    camera3D.target = new THREE.Vector3(0, 0, 0);
}

function onDocumentKeyDown(event) {
    //if (event.key == " ") {
    //in case you want to track key presses
    //}
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