import { PositionalAudio, AudioLoader, AudioListener, BoxGeometry, SphereGeometry, LinearFilter, AmbientLight, Color, DoubleSide, Texture, PlaneGeometry, Mesh, MeshBasicMaterial, TextureLoader, CylinderGeometry, PerspectiveCamera, Scene, Raycaster, WebGLRenderer, Vector3 } from 'three';
//import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import * as FB from './firebaseStuffFramesAuthUpload.js';
import { initMoveCameraWithMouse, initHTML } from './interaction.js';
import { showAskButtons } from './askButtons.js';

let camera, scene, renderer, listener, in_front_of_you; //notice I had to make a listener in init3D and make it global
let thingsThatNeedSpinning = [];
let texturesThatNeedUpdating = [];  //for updating textures
let myObjectsByThreeID = {}  //for converting from three.js object to my JSON object
let clickableMeshes = []; //for use with raycasting
let myObjectsByFirebaseKey = {}; //for converting from firebase key to my JSON object

let currentFrame = 1;
let exampleName = "SharedMindsExampleSequenceAuthUploadML";
let user = FB.initFirebase();
if (user) initAll();  //don't show much if the have not logged in yet.

export function initAll() {
    //if it doesn't already exist
    if (!document.getElementById("THREEcontainer")) {
        initHTML();
        init3D();
    }
    listenForChangesInNewFrame(null, currentFrame);
    showAskButtons();
}

// Create a new GLTFLoader instance to load the 3D model
//const loader = new GLTFLoader();
const objLoader = new OBJLoader();

export function add3DModelRemote(url, mouse, prompt) {
    //download data from url
    fetch(url).then(res => {
        return res.blob();
    }).then(blob => {
        let directory = exampleName + "/" + document.getElementById("title").value + "/frames/" + currentFrame + "/";
        let filename = prompt + Date.now() + ".obj";
        //uploading blob to firebase storage
        //upload to firebase storage
        FB.uploadFile(directory, blob, filename, (url) => {
            console.log("Uploaded 3D Model", url);
            let title = document.getElementById("title").value;
            const pos = project2DCoordsInto3D(150 - camera.fov, mouse);
            let user = FB.getUser();
            if (!user) return;
            const data = { type: "3DModel", url: url, position: { x: pos.x, y: pos.y, z: pos.z }, userName: getUserName(user), prompt: prompt };
            let folder = exampleName + "/" + title + "/frames/" + currentFrame;
            console.log("Entered 3DModel, Send to Firebase", folder, title, exampleName);
            FB.addNewThingToFirebase(folder, data);//put empty for the key when you are making a new thing.
        });
    }).catch(error => {
        console.error(error);
    });
}

export function nextFrame() {
    let oldFrame = currentFrame;
    currentFrame++;
    let currentFrameDisplay = document.getElementById("currentFrameDisplay");
    currentFrameDisplay.textContent = `Current Frame: ${currentFrame}`;
    listenForChangesInNewFrame(oldFrame, currentFrame);
}

export function previousFrame() {
    let oldFrame = currentFrame;
    if (currentFrame > 1) {
        currentFrame--;
        let currentFrameDisplay = document.getElementById("currentFrameDisplay");
        currentFrameDisplay.textContent = `Current Frame: ${currentFrame}`;
        listenForChangesInNewFrame(oldFrame, currentFrame);
    }
}


export function moveObject(selectedObject, x, y) {
    let pos = project2DCoordsInto3D(100, { x: x, y: y });
    const updates = { position: pos };
    let title = document.getElementById("title").value;
    const dbPath = exampleName + "/" + title + "/frames/" + currentFrame;
    FB.updateJSONFieldInFirebase(dbPath, selectedObject.firebaseKey, updates);
}

function clearLocalScene() {
    for (let key in myObjectsByFirebaseKey) {
        let thisObject = myObjectsByFirebaseKey[key];

        scene.remove(thisObject.mesh);
        console.log("removing", thisObject);
    }

    texturesThatNeedUpdating = [];  //for updating textures
    myObjectsByThreeID = {}  //for converting from three.js object to my JSON object
    clickableMeshes = []; //for use with raycasting
    myObjectsByFirebaseKey = {}; //for converting from firebase key to my JSON object
}


function listenForChangesInNewFrame(oldFrame, currentFrame) {
    let title = document.getElementById("title").value;
    //change frames?
    if (oldFrame) FB.unSubscribeToData(exampleName + "/" + title + "/frames/" + oldFrame);
    clearLocalScene();
    FB.subscribeToData(exampleName + "/" + title + "/frames/" + currentFrame, (reaction, data, key) => {
        if (data) {
            if (reaction === "added") {
                if (data.type === "text") {
                    createNewText(data, key);
                } else if (data.type === "image") {
                    let img = new Image();  //create a new image
                    img.onload = function () {
                        createNewImage(img, data, key);
                    }
                    img.src = data.base64;
                } else if (data.type === "audio") {
                    createNewSound(data, key);
                } else if (data.type === "3DModel") {
                    createNewModel(data, key);
                }
            } else if (reaction === "changed") {
                // console.log("changed", data);
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
                    } else if (data.type === "audio") {
                        thisObject.position = data.position;
                        redrawSound(thisObject);
                    } else if (data.type === "audio") {
                        thisObject.position = data.position;
                        redrawModel(thisObject);
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
        }; //get notified if anything changes in this folder
    });
}



export function addTextRemote(text, mouse) {
    let title = document.getElementById("title").value;
    const pos = project2DCoordsInto3D(150 - camera.fov, mouse);
    let user = FB.getUser();
    if (!user) return;
    const data = { type: "text", position: { x: pos.x, y: pos.y, z: pos.z }, text: text, userID: user.uid, userName: getUserName(user) };
    let folder = exampleName + "/" + title + "/frames/" + currentFrame;
    console.log("Entered Text, Send to Firebase", folder, title, exampleName);
    FB.addNewThingToFirebase(folder, data);//put empty for the key when you are making a new thing.
}

// export function add3DModelRemote(file, mouse, filename) {
//     //  console.log("add3DModelRemote", file);
//     let title = document.getElementById("title").value;
//     let directory = exampleName + "/" + title + "/frames/" + currentFrame + "/";
//     const pos = project2DCoordsInto3D(150 - camera.fov, mouse);
//     FB.uploadFile(directory, file, filename, (url) => {
//         console.log("Uploaded 3D Model");
//         let user = FB.getUser();
//         if (!user) return;
//         const data = { type: "3DModel", url: url, position: { x: pos.x, y: pos.y, z: pos.z }, userName: getUserName(user) };
//         let folder = exampleName + "/" + title + "/frames/" + currentFrame;
//         console.log("Entered 3DModel, Send to Firebase", folder, title, exampleName);
//         FB.addNewThingToFirebase(folder, data);//put empty for the key when you are making a new thing.
//     });
// }

export function addAudioRemote(b64, mouse, url, prompt) {

    let title = document.getElementById("title").value;
    const pos = project2DCoordsInto3D(150 - camera.fov, mouse);
    let user = FB.getUser();
    if (!user) return;
    const data = { type: "audio", position: { x: pos.x, y: pos.y, z: pos.z }, base64: b64, userName: getUserName(user), url: url, prompt: prompt };
    let folder = exampleName + "/" + title + "/frames/" + currentFrame;
    console.log("Entered Image, Send to Firebase", folder, title, exampleName);
    FB.addNewThingToFirebase(folder, data);//put empty for the key when you are making a new thing.
}

export function addImageRemote(b64, mouse, prompt) {
    let title = document.getElementById("title").value;
    const pos = project2DCoordsInto3D(150 - camera.fov, mouse);
    let user = FB.getUser();
    if (!user) return;
    const data = { type: "image", position: { x: pos.x, y: pos.y, z: pos.z }, base64: b64, userName: getUserName(user), prompt: prompt };
    let folder = exampleName + "/" + title + "/frames/" + currentFrame;
    console.log("Entered Image, Send to Firebase", folder, title, exampleName);
    FB.addNewThingToFirebase(folder, data);//put empty for the key when you are making a new thing.
}


function getUserName(user) {
    let userName = user.displayName;
    if (!userName) userName = user.email.split("@")[0];
    userName = userName.split(" ")[0];
    return userName;
}

export function findObjectUnderMouse(x, y) {
    let raycaster = new Raycaster(); // create once
    //var mouse = new Vector2(); // create once
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

export function project2DCoordsInto3D(distance, mouse) {
    let vector = new Vector3();
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

function init3D() {
    scene = new Scene();
    camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.target = new Vector3(0, 0, 0);  //mouse controls move this around and camera looks at it 
    renderer = new WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    ///document.body.appendChild(renderer.domElement);

    //this puts the three.js stuff in a particular div
    document.getElementById('THREEcontainer').appendChild(renderer.domElement)

    let bgGeometery = new SphereGeometry(1000, 60, 40);
    // let bgGeometery = new CylinderGeometry(725, 725, 1000, 10, 10, true)
    bgGeometery.scale(-1, 1, 1);
    // has to be power of 2 like (4096 x 2048) or(8192x4096).  i think it goes upside down because texture is not right size
    let panotexture = new TextureLoader().load("itp.jpg");
    // let material = new MeshBasicMaterial({ map: panotexture, transparent: true,   alphaTest: 0.02,opacity: 0.3});
    let backMaterial = new MeshBasicMaterial({ map: panotexture });
    let back = new Mesh(bgGeometery, backMaterial);
    scene.add(back);

    //just a place holder the follows the camera and marks location to drop incoming  pictures
    //tiny little dot (could be invisible) 
    var geometryFront = new BoxGeometry(1, 1, 1);
    var materialFront = new MeshBasicMaterial({ color: 0x00ff00 });
    in_front_of_you = new Mesh(geometryFront, materialFront);
    in_front_of_you.position.set(0, 0, 200);  //base the the z position on camera field of view
    camera.add(in_front_of_you); // then add in front of the camera (not scene) so it follow it


    //add a listener to the camera
    listener = new AudioListener();
    in_front_of_you.add(listener);  //maybe add it to camera is better?

    let ambientLight = new AmbientLight(new Color('hsl(0, 0%, 100%)'), 0.75);
    scene.add(ambientLight);

    initMoveCameraWithMouse(camera, renderer);

    camera.position.z = 0;
    animate();
}

function animate() {
    for (let i = 0; i < thingsThatNeedSpinning.length; i++) {
        thingsThatNeedSpinning[i].rotation.y += 0.01;
        thingsThatNeedSpinning[i].rotation.x += 0.01;
    }
    for (let i = 0; i < texturesThatNeedUpdating.length; i++) {
        texturesThatNeedUpdating[i].texture.needsUpdate = true;
    }
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}




function createNewImage(img, data, firebaseKey) {

    let canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    let context = canvas.getContext("2d");

    let texture = new Texture(canvas);
    texture.needsUpdate = true;
    let material = new MeshBasicMaterial({ map: texture, transparent: true, side: DoubleSide, alphaTest: 0.5 });
    let geo = new PlaneGeometry(canvas.width / canvas.width, canvas.height / canvas.width);
    let mesh = new Mesh(geo, material);

    mesh.lookAt(0, 0, 0);
    mesh.scale.set(10, 10, 10);
    scene.add(mesh);
    let base64 = canvas.toDataURL();
    let thisObject = {
        type: "image", firebaseKey: firebaseKey, prompt: data.prompt, context: context, texture: texture, img: img, base64: base64, threeID: mesh.uuid, position: data.position, canvas: canvas, mesh: mesh, userName: data.userName, texture: texture
    };
    redrawImage(thisObject);
    clickableMeshes.push(mesh);
    texturesThatNeedUpdating.push(thisObject);
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
    object.context.fillText(object.userName, object.canvas.width / 2, 30);
    object.context.fillText(object.prompt, object.canvas.width / 2, 60);

    object.mesh.position.x = object.position.x;
    object.mesh.position.y = object.position.y;
    object.mesh.position.z = object.position.z;
    object.mesh.lookAt(0, 0, 0);
    object.texture.needsUpdate = true;
}


function createNewText(data, firebaseKey) {
    let text_msg = data.text;
    let posInWorld = data.position;
    let canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;

    let texture = new Texture(canvas);

    let material = new MeshBasicMaterial({ map: texture, transparent: true, side: DoubleSide, alphaTest: 0.5 });
    let geo = new PlaneGeometry(1, 1);
    let mesh = new Mesh(geo, material);
    mesh.lookAt(0, 0, 0);
    mesh.scale.set(10, 10, 10);
    scene.add(mesh);
    let thisObject = { type: "text", firebaseKey: firebaseKey, threeID: mesh.uuid, text: text_msg, position: posInWorld, canvas: canvas, mesh: mesh, texture: texture, userName: data.userName };
    redrawText(thisObject);
    clickableMeshes.push(mesh);
    texturesThatNeedUpdating.push(thisObject);
    myObjectsByThreeID[mesh.uuid] = thisObject;
    myObjectsByFirebaseKey[firebaseKey] = thisObject;
}

function redrawText(thisObject) {
    let canvas = thisObject.canvas;
    let context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    let fontSize = 24;
    context.font = fontSize + "pt Arial";
    context.textAlign = "center";
    context.fillStyle = "red";
    context.fillText(thisObject.userName, canvas.width / 2, canvas.height - 20);
    let words = thisObject.text.split(" ");
    for (let i = 0; i < words.length; i++) {
        context.fillText(words[i], canvas.width / 2, (i + 1) * fontSize);
    }

    thisObject.texture.needsUpdate = true;
    thisObject.mesh.position.x = thisObject.position.x;
    thisObject.mesh.position.y = thisObject.position.y;
    thisObject.mesh.position.z = thisObject.position.z;
    thisObject.mesh.lookAt(0, 0, 0);
}

function createNewSound(data, firebaseKey) {
    let canvas = document.createElement("canvas");
    let context = canvas.getContext("2d");

    let texture = new Texture(canvas);
    texture.minFilter = LinearFilter;  //otherwise lots of power of 2 errors
    let material = new MeshBasicMaterial({ map: texture, transparent: true, side: DoubleSide, alphaTest: 0.5 });
    let geo = new PlaneGeometry(1, 1);
    //let geo = new SphereGeometry(100, 32, 32);
    let mesh = new Mesh(geo, material);

    mesh.scale.set(10, 10, 10);
    scene.add(mesh);

    //ONLY WORKS IF YOU MAKE A LISTENER IN INIT3D
    let sound = new PositionalAudio(listener);
    sound.setVolume(1);
    sound.setRefDistance(10);
    sound.setRolloffFactor(1);
    sound.setDistanceModel('linear');
    sound.setMaxDistance(1000);
    sound.setDirectionalCone(90, 180, 0.1);;

    // load a sound and set it as the PositionalAudio object's buffer
    const audioLoader = new AudioLoader();

    let b64 = data.base64; //"data:audio/wav;base64," + data.b64;
    audioLoader.load(b64, function (buffer) {
        sound.setBuffer(buffer);
        sound.setRefDistance(20);
        sound.play();
        sound.setLoop(true);
    });
    mesh.add(sound);

    //sounds.push(me);
    let thisObject = { type: "audio", sound: sound, firebaseKey: firebaseKey, position: data.position, mesh: mesh, sound: sound, texture: texture, canvas: canvas, context: context, threeID: mesh.uuid, userName: data.userName, prompt: data.prompt };
    redrawSound(thisObject);
    clickableMeshes.push(mesh);
    texturesThatNeedUpdating.push(thisObject);
    myObjectsByThreeID[mesh.uuid] = thisObject;
    myObjectsByFirebaseKey[firebaseKey] = thisObject;

}


function redrawSound(thisObject) {
    let canvas = thisObject.canvas;
    let context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    let fontSize = 14;
    context.font = fontSize + "pt Arial";
    context.textAlign = "center";
    context.fillStyle = "red";
    //context.fillText(thisObject.userName, canvas.width / 2, canvas.height - 20);
    let words = thisObject.prompt.split(" ");
    words.unshift(thisObject.userName + ":");
    words.push("(Double Click Sound)");
    for (let i = 0; i < words.length; i++) {
        context.fillText(words[i], canvas.width / 2, (i + 2) * fontSize);
    }

    thisObject.texture.needsUpdate = true;
    thisObject.mesh.position.x = thisObject.position.x;
    thisObject.mesh.position.y = thisObject.position.y;
    thisObject.mesh.position.z = thisObject.position.z;
    thisObject.mesh.lookAt(0, 0, 0);
}


// Function to load and add a duck to the scene
function createNewModel(data, firebaseKey) {
    let url = data.url;
    let pos = data.position;
    console.log("creatNewModel", url);
    objLoader.load(url,
        function (modelMesh) {
            modelMesh.scale.set(5, 5, 5);
            modelMesh.lookAt(0, 0, 0);
            modelMesh.position.set(pos.x, pos.y, pos.z);
            let singleMesh = modelMesh.children[0];
            thingsThatNeedSpinning.push(modelMesh);
            scene.add(modelMesh);
            thingsThatNeedSpinning.push(modelMesh);
            console.log("clicable", clickableMeshes);
            console.log("singleMesh", singleMesh);

            clickableMeshes.push(singleMesh);

            let thisObject = { type: "3DModel", url: url, firebaseKey: firebaseKey, position: pos, mesh: modelMesh, uuid: modelMesh.uuid };

            myObjectsByThreeID[model.uuid] = thisObject;
            myObjectsByFirebaseKey[firebaseKey] = thisObject;
        },
        function (xhr) {
            //  console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        }, function (error) {
            console.log('An error happened', error);

        });

}

function redrawModel(thisObject) {
    // let canvas = thisObject.canvas;
    // let context = canvas.getContext("2d");
    // context.clearRect(0, 0, canvas.width, canvas.height);
    // let fontSize = 24;
    // context.font = fontSize + "pt Arial";
    // context.textAlign = "center";
    // context.fillStyle = "red";
    // context.fillText(thisObject.userName, canvas.width / 2, canvas.height - 20);
    // let words = thisObject.text.split(" ");
    // for (let i = 0; i < words.length; i++) {
    //     context.fillText(words[i], canvas.width / 2, (i + 1) * fontSize);
    // }

    thisObject.texture.needsUpdate = true;
    thisObject.mesh.position.x = thisObject.position.x;
    thisObject.mesh.position.y = thisObject.position.y;
    thisObject.mesh.position.z = thisObject.position.z;
    thisObject.mesh.lookAt(0, 0, 0);
}








