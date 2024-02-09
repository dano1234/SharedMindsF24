import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.module.min.js';
import * as FB from './firebaseStuff.js';


let camera, scene, renderer;
let texturesThatNeedUpdating = [];  //for updating textures
let myObjectsByThreeID = {}  //for converting from three.js object to my JSON object
let clickableMeshes = []; //for use with raycasting
let myObjectsByFirebaseKey = {}; //for converting from firebase key to my JSON object


initHTML();
init3D();
recall();



function recall() {
    console.log("recall");
    FB.subscribeToData('objects'); //get notified if anything changes in this folder
}

export function reactToFirebase(reaction, data, key) {
    if (reaction === "added") {
        if (data.type === "text") {
            createNewText(data);
        } else if (data.type === "image") {
            let img = new Image();  //create a new image
            img.onload = function () {
                let posInWorld = data.position;
                createNewImage(img, posInWorld, key);
            }
            img.src = data.base64;
        } else if (data.type === "p5ParticleSystem") {
            createNewP5(data, key);
        }
    } else if (reaction === "changed") {
        console.log("changed", data);
        let thisObject = myObjectsByFirebaseKey[key];
        if (thisObject) {
            if (data.type === "text") {
                thisObject.text = data.text;
                thisObject.position = data.position;
                redrawText(thisObject);
            } else if (data.type === "image") {
                let img = new Image();  //create a new image
                img.onload = function () {
                    thisObject.img = img;
                    thisObject.position = data.position;
                    redrawImage(thisObject);
                }
                img.src = data.base64;
            } else if (data.type === "p5ParticleSystem") {
                thisObject.position = data.position;
                redrawP5(thisObject);
            }
        }
    } else if (reaction === "removed") {
        console.log("removed", data);
        let thisObject = myObjectsByFirebaseKey[key];
        if (thisObject) {
            scene.remove(thisObject.mesh);
            delete myObjectsByThreeID[thisObject.threeID];
        }
    }
}

function init3D() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    ///document.body.appendChild(renderer.domElement);

    //this puts the three.js stuff in a particular div
    document.getElementById('THREEcontainer').appendChild(renderer.domElement)

    let bgGeometery = new THREE.SphereGeometry(1000, 60, 40);
    // let bgGeometery = new THREE.CylinderGeometry(725, 725, 1000, 10, 10, true)
    bgGeometery.scale(-1, 1, 1);
    // has to be power of 2 like (4096 x 2048) or(8192x4096).  i think it goes upside down because texture is not right size
    let panotexture = new THREE.TextureLoader().load("itp.jpg");
    // let material = new THREE.MeshBasicMaterial({ map: panotexture, transparent: true,   alphaTest: 0.02,opacity: 0.3});
    let backMaterial = new THREE.MeshBasicMaterial({ map: panotexture });
    let back = new THREE.Mesh(bgGeometery, backMaterial);
    scene.add(back);

    initMoveCameraWithMouse();

    camera.position.z = 0;
    animate();
}

function animate() {
    for (let i = 0; i < texturesThatNeedUpdating.length; i++) {
        texturesThatNeedUpdating[i].texture.needsUpdate = true;
    }
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function initHTML() {
    const THREEcontainer = document.createElement("div");
    THREEcontainer.setAttribute("id", "THREEcontainer");
    document.body.appendChild(THREEcontainer);
    THREEcontainer.style.position = "absolute";
    THREEcontainer.style.top = "0";
    THREEcontainer.style.left = "0";
    THREEcontainer.style.width = "100%";
    THREEcontainer.style.height = "100%";
    THREEcontainer.style.zIndex = "1";

    const textInput = document.createElement("input");
    textInput.setAttribute("type", "text");
    textInput.setAttribute("id", "textInput");
    textInput.setAttribute("placeholder", "Enter text here");
    document.body.appendChild(textInput);
    textInput.style.position = "absolute";
    textInput.style.top = "50%";
    textInput.style.left = "50%";
    textInput.style.transform = "translate(-50%, -50%)";
    textInput.style.zIndex = "5";

    textInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {  //checks whether the pressed key is "Enter"
            const inputRect = textInput.getBoundingClientRect();

            const mouse = { x: inputRect.left, y: inputRect.top };
            const pos = project2DCoordsInto3D(150 - camera.fov, mouse);
            const data = { type: "text", position: { x: pos.x, y: pos.y, z: pos.z }, text: textInput.value };
            FB.addNewThingToFirebase("objects", data);//put empty for the key when you are making a new thing.
            //don't make it locally until you hear back from firebase
            console.log("Entered Text, Send to Firebase", textInput.value);
        }
    });

    window.addEventListener("dragover", function (e) {
        e.preventDefault();  //prevents browser from opening the file
    }, false);

    window.addEventListener("drop", (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        for (let i = 0; i < files.length; i++) {
            if (!files[i].type.match("image")) continue;
            // Process the dropped image file here
            console.log("Dropped image file:", files[i]);

            const reader = new FileReader();
            reader.onload = function (event) {
                const img = new Image();
                img.onload = function () {
                    let mouse = { x: e.clientX, y: e.clientY };
                    const pos = project2DCoordsInto3D(150 - camera.fov, mouse);
                    const quickCanvas = document.createElement("canvas");
                    const quickContext = quickCanvas.getContext("2d");
                    quickCanvas.width = img.width;
                    quickCanvas.height = img.height;
                    quickContext.drawImage(img, 0, 0);
                    const base64 = quickCanvas.toDataURL();
                    FB.addNewThingToFirebase("objects", { type: "image", position: { x: pos.x, y: pos.y, z: pos.z }, filename: files[i], base64: base64 });
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(files[i]);
        }
    }, true);
}

function project2DCoordsInto3D(distance, mouse) {
    let vector = new THREE.Vector3();
    vector.set(
        (mouse.x / window.innerWidth) * 2 - 1,
        - (mouse.y / window.innerHeight) * 2 + 1,
        0
    );
    //vector.set(0, 0, 0); //would be middle of the screen where input box is
    vector.unproject(camera);
    vector.multiplyScalar(distance)
    return vector;
}


function createNewImage(img, posInWorld, firebaseKey) {

    let canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    let context = canvas.getContext("2d");

    let texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    let material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, alphaTest: 0.5 });
    let geo = new THREE.PlaneGeometry(canvas.width / canvas.width, canvas.height / canvas.width);
    let mesh = new THREE.Mesh(geo, material);

    mesh.lookAt(0, 0, 0);
    mesh.scale.set(10, 10, 10);
    scene.add(mesh);
    let base64 = canvas.toDataURL();
    let thisObject = {
        type: "image", firebaseKey: firebaseKey, position: posInWorld, context: context, texture: texture, img: img, base64: base64, threeID: mesh.uuid, position: posInWorld, canvas: canvas, mesh: mesh, texture: texture
    };
    redrawImage(thisObject);
    clickableMeshes.push(mesh);
    myObjectsByThreeID[mesh.uuid] = thisObject;
    myObjectsByFirebaseKey[firebaseKey] = thisObject;
}

function redrawImage(object) {
    let img = object.img;
    object.context.drawImage(img, 0, 0);
    let fontSize = Math.max(12);
    object.context.font = fontSize + "pt Arial";
    object.context.textAlign = "center";
    object.context.fillStyle = "red";
    object.context.fillText(object.firebaseKey, object.canvas.width / 2, object.canvas.height - 30);
    object.mesh.position.x = object.position.x;
    object.mesh.position.y = object.position.y;
    object.mesh.position.z = object.position.z;
    object.texture.needsUpdate = true;
}


function createNewText(data, firebaseKey) {
    let text_msg = data.text;
    let posInWorld = data.position;
    let canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;

    let texture = new THREE.Texture(canvas);

    let material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, alphaTest: 0.5 });
    let geo = new THREE.PlaneGeometry(1, 1);
    let mesh = new THREE.Mesh(geo, material);
    mesh.lookAt(0, 0, 0);
    mesh.scale.set(10, 10, 10);
    scene.add(mesh);
    let thisObject = { type: "text", firebaseKey: firebaseKey, threeID: mesh.uuid, text: text_msg, position: posInWorld, canvas: canvas, mesh: mesh, texture: texture };
    redrawText(thisObject);
    clickableMeshes.push(mesh);
    myObjectsByThreeID[mesh.uuid] = thisObject;
    myObjectsByFirebaseKey[firebaseKey] = thisObject;

}

function redrawText(thisObject) {
    let canvas = thisObject.canvas;
    let context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    let fontSize = Math.max(camera.fov / 2, 72);
    context.font = fontSize + "pt Arial";
    context.textAlign = "center";
    context.fillStyle = "red";
    context.fillText(thisObject.text, canvas.width / 2, canvas.height / 2);
    thisObject.texture.needsUpdate = true;
    thisObject.mesh.position.x = thisObject.position.x;
    thisObject.mesh.position.y = thisObject.position.y;
    thisObject.mesh.position.z = thisObject.position.z;
    thisObject.mesh.lookAt(0, 0, 0);
    thisObject.texture.needsUpdate = true;
}

function birthP5Object(w, h) {
    let sketch = function (p) {
        let particles = [];
        let myCanvas;
        p.setup = function () {
            myCanvas = p.createCanvas(w, h);

        };
        p.getP5Canvas = function () {
            return myCanvas;
        }

        p.draw = function () {
            p.clear();
            for (let i = 0; i < 5; i++) {
                let p = new Particle();
                particles.push(p);
            }
            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].update();
                particles[i].show();
                if (particles[i].finished()) {
                    // remove this particle
                    particles.splice(i, 1);
                }
            }
        };

        class Particle {
            constructor() {
                this.x = p.width / 2;
                this.y = p.height / 2;
                this.vx = p.random(-1, 1);
                this.vy = p.random(-4, 1);
                this.alpha = 255;
            }
            finished() {
                return this.alpha < 0;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.alpha -= 10;
            }
            show() {
                p.noStroke();
                p.fill(255, 0, 255, this.alpha);
                p.ellipse(this.x, this.y, 5);
            }
        }
    };
    return new p5(sketch);
}

function createNewP5(data, firebaseKey) {  //called from double click
    let newP5 = birthP5Object(200, 200);
    //pull the p5 canvas out of sketch 
    //and then regular (elt) js canvas out of special p5 canvas
    let myCanvas = newP5.getP5Canvas();
    let canvas = myCanvas.elt;
    let texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    let material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, alphaTest: 0.5 });
    let geo = new THREE.PlaneGeometry(canvas.width / canvas.width, canvas.height / canvas.width);
    let mesh = new THREE.Mesh(geo, material);
    mesh.scale.set(10, 10, 10);
    scene.add(mesh);
    let thisObject = { type: "p5ParticleSystem", firebaseKey: firebaseKey, threeID: mesh.uuid, position: data.position, canvas: canvas, mesh: mesh, texture: texture };
    redrawP5(thisObject);
    texturesThatNeedUpdating.push(thisObject);
    //clickableMeshes.push(mesh);
    myObjectsByThreeID[mesh.uuid] = thisObject;
    myObjectsByFirebaseKey[firebaseKey] = thisObject;
}

function redrawP5(thisObject) {
    console.log(thisObject);
    thisObject.position.x = thisObject.position.x;
    thisObject.position.y = thisObject.position.y;
    thisObject.position.z = thisObject.position.z;
    thisObject.mesh.lookAt(0, 0, 0);
    thisObject.texture.needsUpdate = true;
}

function findObjectUnderMouse(x, y) {
    let raycaster = new THREE.Raycaster(); // create once
    //var mouse = new THREE.Vector2(); // create once
    let mouse = {};
    mouse.x = (x / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = - (y / renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    let intersects = raycaster.intersectObjects(clickableMeshes, false);

    // if there is one (or more) intersections
    let hitObject = null;
    if (intersects.length > 0) {
        let hitMesh = intersects[0].object; //closest objec
        hitObject = myObjectsByThreeID[hitMesh.uuid]; //use look up table assoc array

    }
    return hitObject;
    //console.log("Hit ON", hitMesh);
}




/////MOUSE STUFF

let mouseDownX = 0, mouseDownY = 0;
let lon = -90, mouseDownLon = 0;
let lat = 0, mouseDownLat = 0;
let isUserInteracting = false;
let selectedObject = null;


function initMoveCameraWithMouse() {
    //set up event handlers
    const div3D = document.getElementById('THREEcontainer');
    div3D.addEventListener('mousedown', div3DMouseDown, false);
    div3D.addEventListener('mousemove', div3DMouseMove, false);
    window.addEventListener('mouseup', windowMouseUp, false);  //window in case they wander off the div
    div3D.addEventListener('wheel', div3DMouseWheel, { passive: true });
    window.addEventListener('dblclick', div3DDoubleClick, false); // Add double click event listener
    window.addEventListener('resize', onWindowResize, false);
    //document.addEventListener('keydown', onDocumentKeyDown, false);
    camera.target = new THREE.Vector3(0, 0, 0);  //something for the camera to look at
}

function div3DDoubleClick(event) {
    let mouse = { x: event.clientX, y: event.clientY };
    const pos = project2DCoordsInto3D(300 - camera.fov * 3, mouse);
    FB.addNewThingToFirebase("objects", { type: "p5ParticleSystem", position: { x: pos.x, y: pos.y, z: pos.z } });
}

function div3DMouseDown(event) {
    isUserInteracting = true;
    selectedObject = findObjectUnderMouse(event.clientX, event.clientY);
    mouseDownX = event.clientX;
    mouseDownY = event.clientY;
    mouseDownLon = lon;
    mouseDownLat = lat;

}

function div3DMouseMove(event) {
    if (isUserInteracting) {
        lon = (mouseDownX - event.clientX) * 0.1 + mouseDownLon;
        lat = (event.clientY - mouseDownY) * 0.1 + mouseDownLat;
        //either move the selected object or the camera 
        if (selectedObject) {
            let pos = project2DCoordsInto3D(100, { x: event.clientX, y: event.clientY });
            const updates = { position: pos };
            FB.updateJSONFieldInFirebase("objects", selectedObject.firebaseKey, updates);
        } else {
            computeCameraOrientation();
        }
    }
}


function windowMouseUp(event) {
    isUserInteracting = false;

}

function div3DMouseWheel(event) {
    camera.fov += event.deltaY * 0.05;
    camera.fov = Math.max(5, Math.min(100, camera.fov)); //limit zoom
    camera.updateProjectionMatrix();
}

function computeCameraOrientation() {
    lat = Math.max(- 30, Math.min(30, lat));  //restrict movement
    let phi = THREE.MathUtils.degToRad(90 - lat);  //restrict movement
    let theta = THREE.MathUtils.degToRad(lon);
    //move the target that the camera is looking at
    camera.target.x = 100 * Math.sin(phi) * Math.cos(theta);
    camera.target.y = 100 * Math.cos(phi);
    camera.target.z = 100 * Math.sin(phi) * Math.sin(theta);
    camera.lookAt(camera.target);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    console.log('Resized');
}

