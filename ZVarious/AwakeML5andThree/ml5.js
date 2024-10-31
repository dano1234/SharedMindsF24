
let camera3D, scene, renderer, cube;
let dir = 0.01;
let myCanvas, myVideo, p5CanvasTexture, poseNet;
let nose, circleMask, angleOnCircle, myAvatarObj;

let videoOptions, preferredCam;


function setup() {
    myCanvas = createCanvas(512, 512);
    circleMask = createGraphics(512, 512);
    myCanvas.hide();
    createPullDownForCameraSelection();
    videoOptions = {
        audio: false, video: {
            width: myCanvas.width,
            height: myCanvas.height,
            sourceId: preferredCam
        }
    }
    myVideo = createCapture(videoOptions);
    myVideo.hide();


    nose = { "x": myVideo.width / 2, "y": myVideo.height / 2 };
    poseNet = ml5.poseNet(myVideo, modelReady);
    poseNet.on("pose", gotPoses);

    init3D();
}

function modelReady() {
    console.log("model ready");
    progress = "loaded";
    poseNet.singlePose(myVideo);
}

// A function that gets called every time there's an update from the model
function gotPoses(results) {
    //console.log(results);
    if (!results[0]) return;
    poses = results;
    progress = "predicting";
    let thisNose = results[0].pose.nose;
    let thisWrist = results[0].pose.rightWrist;

    let handRaised = false;
    if (thisWrist.confidence > .3 && thisWrist.y < height / 2) {
        handRaised = true;
    }
    // console.log(handRaised);
    if (thisNose.confidence > .8) {
        nose.x = thisNose.x;
        nose.y = thisNose.y;

        let xDiff = poses[0].pose.leftEye.x - poses[0].pose.rightEye.x;
        let yDiff = poses[0].pose.leftEye.y - poses[0].pose.rightEye.y;
        headAngle = Math.atan2(yDiff, xDiff);
        headAngle = THREE.Math.radToDeg(headAngle);

        if (headAngle > 15) {
            if (handRaised) {
                //move the camera
                lon -= .5;
                computeCameraOrientation();
            } else {
                //move p5sketch
                angleOnCircle -= 0.005;
                positionOnCircle(angleOnCircle, myAvatarObj);
            }
        }
        if (headAngle < -15) {
            if (handRaised) {
                //move the camera
                lon += .5;
                computeCameraOrientation();
            } else {
                //move p5sketch
                angleOnCircle += 0.005;
                positionOnCircle(angleOnCircle, myAvatarObj);
            }
        }


    }

}

function draw() {
    clear(); //clear the mask
    circleMask.ellipseMode(CENTER);
    circleMask.clear()//clear the mask
    circleMask.fill(0, 0, 0, 255);//set alpha of mask
    circleMask.noStroke();
    circleMask.ellipse(nose.x, nose.y, 150, 150)//use nose pos to draw alpha
    myVideo.mask(circleMask);//use alpha of mask to clip the vido
    image(myVideo, (myCanvas.width - myVideo.width) / 2, (myCanvas.height - myVideo.height) / 2);
}

function init3D() {
    scene = new THREE.Scene();
    camera3D = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);


    var videoGeometry = new THREE.PlaneGeometry(512, 512);
    p5CanvasTexture = new THREE.Texture(myCanvas.elt);  //NOTICE THE .elt  this give the element
    let videoMaterial = new THREE.MeshBasicMaterial({ map: p5CanvasTexture, transparent: true, opacity: 1, side: THREE.DoubleSide });
    myAvatarObj = new THREE.Mesh(videoGeometry, videoMaterial);

    angleOnCircle = Math.PI;
    positionOnCircle(angleOnCircle, myAvatarObj);
    scene.add(myAvatarObj);



    let bgGeometery = new THREE.SphereGeometry(900, 100, 40);
    //let bgGeometery = new THREE.CylinderGeometry(725, 725, 1000, 10, 10, true)
    bgGeometery.scale(-1, 1, 1);
    // has to be power of 2 like (4096 x 2048) or(8192x4096).  i think it goes upside down because texture is not right size
    let panotexture = new THREE.TextureLoader().load("itp.jpg");
    // var material = new THREE.MeshBasicMaterial({ map: panotexture, transparent: true,   alphaTest: 0.02,opacity: 0.3});
    let backMaterial = new THREE.MeshBasicMaterial({ map: panotexture });

    let back = new THREE.Mesh(bgGeometery, backMaterial);
    scene.add(back);

    moveCameraWithMouse();

    camera3D.position.z = 0;
    animate();
}

function positionOnCircle(angle, mesh) {
    //imagine a circle looking down on the world and do High School math
    let distanceFromCenter = 850;
    x = distanceFromCenter * Math.sin(angle);
    z = distanceFromCenter * Math.cos(angle);
    mesh.position.set(x, 0, z);
    mesh.lookAt(0, 0, 0);
}

function animate() {
    requestAnimationFrame(animate);
    p5CanvasTexture.needsUpdate = true;  //tell renderer that P5 canvas is changing
    renderer.render(scene, camera3D);
}

/////MOUSE STUFF

var onMouseDownMouseX = 0, onMouseDownMouseY = 0;
var onPointerDownPointerX = 0, onPointerDownPointerY = 0;
var lon = -90, onMouseDownLon = 0;
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

function createPullDownForCameraSelection() {
    //manual alternative to all of this pull down stuff:
    //type this in the console and unfold resulst to find the device id of your preferredwebcam, put in sourced id below
    //navigator.mediaDevices.enumerateDevices()
    preferredCam = localStorage.getItem('preferredCam')
    if (preferredCam) {
        videoOptions = {
            video: {
                width: myCanvas.width,
                height: myCanvas.height,
                sourceId: preferredCam
            }
        };
    } else {
        videoOptions = {
            audio: true, video: {
                width: myCanvas.width,
                height: myCanvas.height
            }
        };
    }
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
            console.log(item);
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
            console.log(videoOptions);
        });
    });
}