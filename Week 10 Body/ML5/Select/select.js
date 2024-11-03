
let camera3D, scene, renderer, cube;
let texts = [];
let hitTestableOjects = [];
let in_front_of_you;
let currentObject;
let handProxy;
let myTimer;
let video;

let predictions = [];


var line;
var count = 0;
var mouse = new THREE.Vector3();
let raycaster
let selectedObject = null;


//animate();



//FROM EXAMPLE https://jsfiddle.net/wilt/a21ey9y6/
function initLine() {

    // geometry
    var geometry = new THREE.BufferGeometry();
    var MAX_POINTS = 500;
    positions = new Float32Array(MAX_POINTS * 3);
    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));

    // material
    var material = new THREE.LineBasicMaterial({
        color: 0xff0000,
        linewidth: 2
    });

    // line
    line = new THREE.Line(geometry, material);
    scene.add(line);

}

// update line
function updateLine() {
    positions[count * 3 - 3] = mouse.x;
    positions[count * 3 - 2] = mouse.y;
    positions[count * 3 - 1] = mouse.z;
    line.geometry.attributes.position.needsUpdate = true;
}

// mouse move handler
function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    mouse.z = 0;
    mouse.unproject(camera);
    if (count !== 0) {
        updateLine();
    }
}

// add point
function addPoint(event) {
    console.log("point nr " + count + ": " + mouse.x + " " + mouse.y + " " + mouse.z);
    positions[count * 3 + 0] = mouse.x;
    positions[count * 3 + 1] = mouse.y;
    positions[count * 3 + 2] = mouse.z;
    count++;
    line.geometry.setDrawRange(0, count);
    updateLine();
}

// mouse down handler
function onMouseDown(evt) {
    // on first click add an extra point
    if (count === 0) {
        addPoint();
    }
    addPoint();
}
function preload() {
    // Load the handPose model
    handPose = ml5.handPose();
}


function setup() {
    video = createCapture(VIDEO);
    video.size(640, 480);
    video.hide();
    // Create a new handpose method
    //handPose.detectStart(video, gotHands);
    raycaster = new THREE.Raycaster(); // create once
    handPose.detectStart(video, gotHands)
}

function draw() {
    // Draw the video
}


// Listen to new 'predict' events
function gotHands(results) {

    predictions = results;
    // if (results.length > 0) console.log(results[0].confidence);

    if (results.length > 0 && results[0].confidence > 0.5) {
        let indexX = results[0].index_finger_tip.x;
        let indexY = results[0].index_finger_tip.y;
        let thumbX = results[0].thumb_tip.x;
        let thumbY = results[0].thumb_tip.y;
        let distanceBetweenFingers = dist(indexX, indexY, thumbX, thumbY);
        let pinched = false;
        //console.log(distanceBetweenFingers);
        if (distanceBetweenFingers < 50) {
            pinched = true;
        }

        // let left = results[0].boundingBox.topLeft[0];
        // let top = results[0].boundingBox.topLeft[1];
        // let right = results[0].boundingBox.bottomRight[0];
        // let bottom = results[0].boundingBox.bottomRight[1];
        // let centerx = parseInt(left + (right - left) / 2);
        // let centery = parseInt(top + (bottom - top) / 2);
        // let thumbx = results[0].annotations.thumb[3][0];
        // let thumby = results[0].annotations.thumb[3][1];
        // let awayFromCenter = dist(thumbx, thumby, centerx, centery);
        // //let tallerThanWide = (bottom-top)/(right-left);
        // let openHand = false;
        // if (awayFromCenter > 100) openHand = true;

        // let mouse = {};
        // mouse.x = (x / renderer.domElement.clientWidth) * 2 - 1;
        // mouse.y = - (y / renderer.domElement.clientHeight) * 2 + 1;
        // raycaster.setFromCamera(mouse, camera);



        let x = map(indexX, 0, video.width, 1, -1); //turn 0-640 to -320 to 320 
        let y = map(indexY, 0, video.height, 1, -1); //turn 0-640 to -320 to 320 
        var mouse = { "x": x, "y": y };

        handProxy.position.x = x * 100;
        handProxy.position.y = y * 100;
        //  console.log( handProxy.position);
        if (pinched) {
            handProxy.material.color.setHex(0x00ff00);
            if (selectedObject == null) {
                console.log("pinched and cast");
                var mouse = { "x": 0, "y": 0 };
                //mouse.x = (x / renderer.domElement.clientWidth) * 2 - 1;
                //mouse.y = - (y / renderer.domElement.clientHeight) * 2 + 1;
                //raycaster.near = 10;
                //raycaster.far = 1000;
                raycaster.setFromCamera(mouse, camera3D);
                var intersects = raycaster.intersectObjects(hitTestableOjects, false);
                if (intersects.length > 0) {

                    selectedObject = intersects[0].object;
                }
            }

            if (selectedObject) {
                //console.log(intersects[0]);
                var posInWorld = new THREE.Vector3();
                handProxy.getWorldPosition(posInWorld);

                selectedObject.position.x = posInWorld.x;
                selectedObject.position.y = posInWorld.y;
                selectedObject.position.z = posInWorld.z;
                selectedObject.lookAt(0, 0, 0);
            }
        } else {
            handProxy.material.color.setHex(0xff00ff);
            selectedObject = null;
        }

    }

}


window.onload = (event) => {
    let stored = localStorage.getItem("texts");
    //console.log(stored);
    if (stored) {
        let incomingTexts = JSON.parse(stored);
        // console.log(incomingTexts);
        for (var i = 0; i < incomingTexts.length; i++) {
            createNewText(incomingTexts[i].text, incomingTexts[i].location)
            // console.log("new ", incomingTexts[i].text, incomingTexts[i].location);
        }

    }
};

window.onbeforeunload = function () {
    console.log("saved");
    let ouput = JSON.stringify(texts);
    localStorage.setItem("texts", ouput);
}


function createNewText(text_msg, location) {
    console.log("Created New Text");
    var canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    var context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    var fontSize = Math.max(camera3D.fov / 2, 72);
    context.font = fontSize + "pt Arial";
    context.textAlign = "center";
    context.fillStyle = "white";
    context.fillText(text_msg, canvas.width / 2, canvas.height / 2);
    var textTexture = new THREE.Texture(canvas);
    textTexture.needsUpdate = true;
    var material = new THREE.MeshBasicMaterial({ map: textTexture, transparent: false });
    var geo = new THREE.PlaneGeometry(1, 1);
    var mesh = new THREE.Mesh(geo, material);
    if (location) { //came in from database
        mesh.position.x = location.x;
        mesh.position.y = location.y;
        mesh.position.z = location.z;
    } else { //local and needs location and to be put in the database
        const posInWorld = new THREE.Vector3();
        //remember we attached a tiny to the  front of the camera in init, now we are asking for its position
        in_front_of_you.position.set(0, 0, -(600 - camera3D.fov * 7));  //base the the z position on camera field of view
        in_front_of_you.getWorldPosition(posInWorld);
        mesh.position.x = posInWorld.x;
        mesh.position.y = posInWorld.y;
        mesh.position.z = posInWorld.z;
        //add it to firebase database
        location = { "x": mesh.position.x, "y": mesh.position.y, "z": mesh.position.z, "xrot": mesh.rotation.x, "yrot": mesh.rotation.y, "zrot": mesh.rotation.z }

    }
    // console.log(posInWorld);
    mesh.lookAt(0, 0, 0);

    mesh.scale.set(10, 10, 10);
    scene.add(mesh);
    //two id's one for Three and one for the database
    texts.push({ "object": mesh, "canvas": canvas, "location": location, "texture": textTexture, "text": text_msg, "Threeid": mesh.uuid, "location": location });
    hitTestableOjects.push(mesh);
}

function updateText(text, note) {
    note.text = text;
    var context = note.canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    var fontSize = 72; //Math.max(camera3D.fov / 2, 72);
    context.font = fontSize + "pt Arial";
    context.textAlign = "center";
    context.fillStyle = "white";
    context.fillText(text, canvas.width / 2, canvas.height / 2);
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


init3D();

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
    var geometryFront = new THREE.BoxGeometry(1, 1, 1);
    var materialFront = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    in_front_of_you = new THREE.Mesh(geometryFront, materialFront);
    camera3D.add(in_front_of_you); // then add in front of the camera so it follow it
    in_front_of_you.position.set(0, 0, -600);


    var geometry = new THREE.BoxGeometry(2, 2, 2);
    var material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    handProxy = new THREE.Mesh(geometry, material);
    camera3D.add(handProxy);  //add this relative to the camera
    scene.add(camera3D);  //add the camera to the scene so we can see the dot
    handProxy.position.z = -50;

    moveCameraWithMouse();

    camera3D.position.z = 0;
    animate();
}

function hitTest(x, y) {  //called from onDocumentMouseDown()
    var mouse = { "x": 0, "y": 0 };
    var raycaster = new THREE.Raycaster(); // create once
    //var mouse = new THREE.Vector2(); // create once
    mouse.x = (x / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = - (y / renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera3D);

    var intersects = raycaster.intersectObjects(hitTestableOjects, false);
    // if there is one (or more) intersections
    currentObject = null;
    if (intersects.length > 0) {
        let hitObjID = intersects[0].object.uuid; //closest object
        for (var i = 0; i < texts.length; i++) {

            if (texts[i].Threeid == hitObjID) {
                currentObject = texts[i];
                $("#text").val(texts[i].text);

                $("#text").css({ position: "absolute", left: x, top: y });
                //do some hightlighting and put text in input box.
                break;
            }
        }
    }
    console.log(currentObject);

}

function animate() {

    // for (var i = 0; i < texts.length; i++) {
    //     texts[i].texture.needsUpdate = true;
    // }
    renderer.render(scene, camera3D);
    requestAnimationFrame(animate);


}

var textInput = document.getElementById("text");  //get a hold of something in the DOM
textInput.addEventListener("mousedown", function (e) {
    e.stopImmediatePropagation();
    //don't let it go to the elements under the text box
});

textInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {  //checks whether the pressed key is "Enter"
        if (currentObject) { //hit test returned somethigng
            updateText(textInput.value, currentNote);
        } else {
            createNewText(textInput.value);
        }
    }
});




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

