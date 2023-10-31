
let camera3D, scene, renderer, cube;
let texts = [];
let hitTestableOjects = [];
let in_front_of_you;
let currentObject;
let handProxy;
let myTimer;
let video;
let p5Canvas;
let p5Texture;
let lastFewHands = [];
let handIsReset = true;

let hands = [];

function preload() {
    handpose = ml5.handpose();
}


function setup() {
    console.log("Model Loaded!");
    video = createCapture(VIDEO);
    video.size(512, 512);
    video.hide();
    p5Canvas = createCanvas(512, 512);
    handpose.detectStart(video, gotHands);
    init3D();
}

function draw() {
    clear();
    // Draw all the tracked hand points
    for (let i = 0; i < hands.length; i++) {
        let hand = hands[i];
        for (let j = 0; j < hand.keypoints.length; j++) {
            let keypoint = hand.keypoints[j];
            fill(0, 255, 0);
            noStroke();
            circle(keypoint.x, keypoint.y, 10);
        }
    }

}


function gotHands(results) {
    hands = results;
    if (hands[1]) {
        lon = lon + .1;
        computeCameraOrientation()
        //if there are two hand move the carmera
    }
    if (hands[0] && hands[0].score > 0.9) {//&& hands[0].handedness == "Left" 
        let indexZ = hands[0].index_finger_tip.z3D;
        let indexX = hands[0].index_finger_tip.x3D;
        let indexY = hands[0].index_finger_tip.y3D;

        let x = map(indexX, 0, 0.07, 64, -64); //turn 0-640 to -320 to 320 
        let y = map(indexY, 0, 0.07, 32, -64); //turn 0-640 to -320 to 320 
        var mouse = { "x": x, "y": y, "z": indexZ };

        mouse = averageLastFewHands(mouse);
        mouse.z = Math.abs(mouse.z);

        if (mouse.z < 0.01) {
            if (handIsReset) {
                console.log("create shape", mouse.z)
                createNewShape();
                handIsReset = false;
            }
        } else {
            handIsReset = true;
        }

        ///hitTest(mouse.x, mouse.y);
        var raycaster = new THREE.Raycaster(); // create once
        raycaster.near = 10;
        raycaster.far = 1000;
        raycaster.setFromCamera(mouse, camera3D);
        var intersects = raycaster.intersectObjects(hitTestableOjects, false);

        // //  console.log( handProxy.position);
        if (intersects.length > 0) {
            console.log("intersetion", intersects[0]);
        }

        //     if (openHand == false) {
        //         console.log(intersects[0]);
        //         var posInWorld = new THREE.Vector3();
        //         handProxy.getWorldPosition(posInWorld);
        //         intersects[0].object.position.x = posInWorld.x;
        //         intersects[0].object.position.y = posInWorld.y;
        //     }
        // }
        //}
    }
}

function averageLastFewHands(mouse) {
    //average last few to smooth it out
    lastFewHands.push(mouse);
    if (lastFewHands.length > 5) {
        lastFewHands.shift();  //remove first
    }
    let xTotal = 0;
    let yTotal = 0;
    let zTotal = 0;
    for (var i = 0; i < lastFewHands.length; i++) {
        xTotal += lastFewHands[i].x;
        yTotal += lastFewHands[i].y;
        zTotal += lastFewHands[i].z;
    }
    mouse.x = xTotal / lastFewHands.length;
    mouse.y = yTotal / lastFewHands.length;
    mouse.z = zTotal / lastFewHands.length;
    handProxy.position.x = mouse.x;
    handProxy.position.y = mouse.y;
    return mouse;
}


function createNewShape() {

    var material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    var geo = new THREE.SphereGeometry(1, 16, 32);
    var mesh = new THREE.Mesh(geo, material);
    mesh.position.x = handProxy.position.x;
    mesh.position.y = handProxy.position.y;
    mesh.position.z = handProxy.position.z;
    // console.log(posInWorld);
    mesh.lookAt(0, 0, 0);
    mesh.scale.set(10, 10, 10);
    scene.add(mesh);
    hitTestableOjects.push(mesh);
}


function init3D() {
    scene = new THREE.Scene();
    camera3D = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    ///document.body.appendChild(renderer.domElement);

    //this puts the three.js stuff in a particular div
    document.getElementById('container').appendChild(renderer.domElement)


    let bgGeometery = new THREE.SphereGeometry(1000, 60, 40);
    // let bgGeometery = new THREE.CylinderGeometry(725, 725, 1000, 10, 10, true)
    bgGeometery.scale(-1, 1, 1);
    // has to be power of 2 like (4096 x 2048) or(8192x4096).  i think it goes upside down because texture is not right size
    let panotexture = new THREE.TextureLoader().load("itp.jpg");
    // var material = new THREE.MeshBasicMaterial({ map: panotexture, transparent: true,   alphaTest: 0.02,opacity: 0.3});
    let backMaterial = new THREE.MeshBasicMaterial({ map: panotexture });
    let back = new THREE.Mesh(bgGeometery, backMaterial);
    scene.add(back);


    //tiny little dot (could be invisible) for placing things in front of you
    // var geometryFront = new THREE.BoxGeometry(1, 1, 1);
    // var materialFront = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    // in_front_of_you = new THREE.Mesh(geometryFront, materialFront);
    // camera3D.add(in_front_of_you); // then add in front of the camera so it follow it
    // in_front_of_you.position.set(0, 0, -600);


    var geometry = new THREE.BoxGeometry(2, 2, 2);
    var material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    handProxy = new THREE.Mesh(geometry, material);
    camera3D.add(handProxy);  //add this relative to the camera
    scene.add(camera3D);  //add the camera to the scene so we can see the dot
    handProxy.position.z = -50;


    var planeGeo = new THREE.PlaneGeometry(512, 512);
    p5Texture = new THREE.Texture(p5Canvas.elt);  // pull the canvas out of the p5 sketch
    let mat = new THREE.MeshBasicMaterial({ map: p5Texture, transparent: true, opacity: 1, side: THREE.DoubleSide });
    let p5OverLay = new THREE.Mesh(planeGeo, mat);
    p5OverLay.lookAt(0, 0, 0);
    p5OverLay.position.z = -450;
    camera3D.add(p5OverLay);

    moveCameraWithMouse();

    camera3D.position.z = 0;
    animate();
}

function hitTest(x, y) {  //called from onDocumentMouseDown()
    let mouser = { "x": 0, "y": 0 };
    var raycaster = new THREE.Raycaster(); // create once
    //var mouse = new THREE.Vector2(); // create once
    mouser.x = (x / renderer.domElement.clientWidth) * 2 - 1;
    mouser.y = - (y / renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouser, camera3D);
    var intersects = raycaster.intersectObjects(hitTestableOjects, false);
    // if there is one (or more) intersections
    currentObject = null;
    if (intersects.length > 0) {
        let hitObj = intersects[0].object; //closest object
        hitObj.material.color.setHex(Math.random() * 0xffffff);
        console.log("hit", hitObjID);
    }
    // console.log(currentObject);

}

function animate() {
    requestAnimationFrame(animate);
    p5Texture.needsUpdate = true;
    for (var i = 0; i < texts.length; i++) {
        texts[i].texture.needsUpdate = true;
    }
    renderer.render(scene, camera3D);
}




function onDocumentKeyDown(e) {
    clearTimeout(myTimer);
    if (currentObject) {
        if (e.key == "ArrowRight") {
            console.log(e.key);
            currentObject.object.position.x = currentObject.object.position.x + 1;
        } else if (e.key == "ArrowLeft") {
            currentObject.object.position.x = currentObject.object.position.x - 1;
        } else if (e.key == "ArrowUp") {
            currentObject.object.position.y = currentObject.object.position.y - 1;
        } else if (e.key == "ArrowDown") {
            currentObject.object.position.y = currentObject.object.position.y + 1;
        }
        currentObject.location = { "x": currentObject.object.position.x, "y": currentObject.object.position.y, "z": currentObject.object.position.z, "xrot": currentObject.object.rotation.x, "yrot": currentObject.object.rotation.y, "zrot": currentObject.object.rotation.z }
    }

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


function onDocumentMouseDown(event) {
    hitTest(event.clientX, event.clientY);
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
    camera3D.target.x = 100 * Math.sin(phi) * Math.cos(theta);
    camera3D.target.y = 100 * Math.cos(phi);
    camera3D.target.z = 100 * Math.sin(phi) * Math.sin(theta);
    camera3D.lookAt(camera3D.target);
}


function onWindowResize() {
    camera3D.aspect = window.innerWidth / window.innerHeight;
    camera3D.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    console.log('Resized');
}

