
let camera3D, scene, renderer
let myCanvas, myVideo, myMask;
let people = [];
let myRoomName = "mycrazyFaceCanvasRoomName";   //make a different room from classmates
let faceMesh;
let angleOnCircle;
let p5lm;
let progress = "loading Face ML";

let myName; //= prompt("name?");
function setup() {
    myCanvas = createCanvas(512, 512);
    //  document.body.append(myCanvas.elt);
    myCanvas.hide();
    myMask = createGraphics(width, height); //this is for the setting the alpha layer around face
    myMask.fill(0, 0, 0, 255); //opaque to start
    myMask.rect(0, 0, width, height);

    //myMask.rect(0, 0, width,height);
    let captureConstraints = allowCameraSelection(myCanvas.width, myCanvas.height);
    myVideo = createCapture(captureConstraints);

    //below is simpler if you don't need to select Camera because default is okay
    //myVideo = createCapture(VIDEO);
    // myVideo.size(myCanvas.width, myCanvas.height);
    myVideo.elt.muted = true;
    myVideo.hide()

    p5lm = new p5LiveMedia(this, "CANVAS", myCanvas, myRoomName)
    p5lm.on('stream', gotStream);
    p5lm.on('disconnect', gotDisconnect);
    p5lm.on('data', gotData);


    //ALSO ADD AUDIO STREAM
    //addAudioStream() ;

    facemesh = ml5.facemesh(myVideo, function () {
        progress = "ML model loaded";
        console.log('face mesh model ready!')
    });

    facemesh.on("predict", gotFaceResults);

    init3D();
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

// function gotFaceResults(results) {
//     if (results && results.length > 0) {
//         progress = "";
//         //  console.log(results[0]);
//         //DRAW THE ALPHA MASK FROM THE OUTLINE OF MASK

//         outline = results[0].annotations.silhouette;
//         myMask.clear();
//         myMask.noStroke();
//         myMask.fill(0, 0, 0, 255);//some nice alphaa in fourth number
//         myMask.beginShape();
//         for (var i = 0; i < outline.length - 1; i++) {
//             myMask.curveVertex(outline[i][0], outline[i][1]);

//         }
//         myMask.endShape(CLOSE);
//         //Get the angle between eyes
//         let xDiff = results[0].annotations.leftEyeLower0[0][0] - results[0].annotations.rightEyeLower0[0][0];
//         let yDiff = results[0].annotations.leftEyeLower0[0][1] - results[0].annotations.rightEyeLower0[0][1]
//         headAngle = Math.atan2(yDiff, xDiff);
//         headAngle = THREE.Math.radToDeg(headAngle);
//         //console.log(headAngle);
//         if (headAngle > 12) {
//             angleOnCircle -= 0.05;
//             positionOnCircle(angleOnCircle, myAvatarObj);
//             let dataToSend = { "angleOnCircle": angleOnCircle };
//             // Send it
//             p5lm.send(JSON.stringify(dataToSend));
//         }
//         if (headAngle < -12) {
//             angleOnCircle += 0.05;
//             positionOnCircle(angleOnCircle, myAvatarObj);
//             // Package as JSON to send

//             let dataToSend = { "angleOnCircle": angleOnCircle };
//             // Send it
//             p5lm.send(JSON.stringify(dataToSend));
//         }
//     }
// }
function gotStream(stream, id) {

    myName = id;
    //this gets called when there is someone else in the room, new or existing
    //don't want the dom object, will use in p5 and three.js instead
    //get a network id from each person who joins

    stream.hide();
    creatNewVideoObject(stream, id);
}

function creatNewVideoObject(videoObject, id) {  //this is for remote and local

    var videoGeometry = new THREE.PlaneGeometry(512, 512);
    //usually you can just feed the videoObject to the texture.  We added an extra graphics stage to remove background
    let extraGraphicsStage = createGraphics(width, height)
    let myTexture;
    if (id == "me") {
        myTexture = new THREE.Texture(videoObject.elt);  //NOTICE THE .elt  this give the element
    } else {
        myTexture = new THREE.Texture(extraGraphicsStage.elt);  //NOTICE THE .elt  this give the element
    }
    let videoMaterial = new THREE.MeshBasicMaterial({ map: myTexture, transparent: true });
    //NEED HELP FIGURING THIS OUT. There has to be a way to remove background without the pixel by pixel loop currently in draw
    //instead should be able to use custom blending to do this in the GPU
    //https://threejs.org/docs/#api/en/constants/CustomBlendingEquations
    videoMaterial.map.minFilter = THREE.LinearFilter;  //otherwise lots of power of 2 errors
    myAvatarObj = new THREE.Mesh(videoGeometry, videoMaterial);

    scene.add(myAvatarObj);
    //position them to start based on how many people but we will let them move around
    let radiansPerPerson = Math.PI / (people.length + 1);  //spread people out over 180 degrees?

    angleOnCircle = people.length * radiansPerPerson + Math.PI;
    positionOnCircle(angleOnCircle, myAvatarObj);

    people.push({ "object": myAvatarObj, "texture": myTexture, "id": id, "videoObject": videoObject, "extraGraphicsStage": extraGraphicsStage });
}

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
function positionOnCircle(angle, mesh) {
    //imagine a circle looking down on the world and do High School math
    let distanceFromCenter = 600;
    x = distanceFromCenter * Math.sin(angle);
    z = distanceFromCenter * Math.cos(angle);
    mesh.position.set(x, 0, z);
    mesh.lookAt(0, 0, 0);
}

function draw() {
    //other people
    //go through all the people an update their texture, animate would be another place for this
    for (var i = 0; i < people.length; i++) {
        if (people[i].id == "me") {
            people[i].texture.needsUpdate = true;
        } else if (people[i].videoObject.elt.readyState == people[i].videoObject.elt.HAVE_ENOUGH_DATA) {
            //remove background that became black and not transparent  in transmission
            people[i].extraGraphicsStage.image(people[i].videoObject, 0, 0);
            people[i].extraGraphicsStage.loadPixels();
            for (var j = 0; j < people[i].extraGraphicsStage.pixels.length; j += 4) {
                let r = people[i].extraGraphicsStage.pixels[j];
                let g = people[i].extraGraphicsStage.pixels[j + 1];
                let b = people[i].extraGraphicsStage.pixels[j + 2];
                if (r + g + b < 10) {
                    people[i].extraGraphicsStage.pixels[j + 3] = 0;
                }
            }
            people[i].extraGraphicsStage.updatePixels();
            people[i].texture.needsUpdate = true;
        }

    }
    //now daw me on  the canvas I am sending out to the group
    //to justify using a canvas instead  of just sending out the straigh video I will do a little maninpulation
    //myMask was drawn when ML5 face mesh returned the sillouette
    myVideo.mask(myMask);//use alpha of mask to clip the vido

    clear();//for making background transparent on the main picture

    image(myVideo, (myCanvas.width - myVideo.width) / 2, (myCanvas.height - myVideo.height) / 2);
    textSize(32);
    fill(255)
    text(myName, width / 2 - textWidth(myName) / 2, height - 80);
    text(progress, 100, 100);
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