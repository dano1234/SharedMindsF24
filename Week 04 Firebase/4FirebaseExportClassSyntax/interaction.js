
import * as MAIN from './mainClass.js';
import * as FB from './firebaseStuff.js';
import { MathUtils } from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.module.min.js';


/////MOUSE STUFF
let mouseDownX = 0, mouseDownY = 0;
let lon = -90, mouseDownLon = 0;
let lat = 0, mouseDownLat = 0;
let isUserInteracting = false;
let selectedObject = null;
let camera = null;
let renderer = null;
enableDragDrop();


export function initHTML() {
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
            const pos = MAIN.project2DCoordsInto3D(150 - camera.fov, mouse);
            const data = { type: "text", position: { x: pos.x, y: pos.y, z: pos.z }, text: textInput.value };
            FB.addNewThingToFirebase("objects", data);//put empty for the key when you are making a new thing.
            //don't make it locally until you hear back from firebase
            console.log("Entered Text, Send to Firebase", textInput.value);
        }
    });



}

export function initMoveCameraWithMouse(_camera, _renderer) {
    //set up event handlers
    camera = _camera;
    renderer = _renderer;
    const div3D = document.getElementById('THREEcontainer');
    div3D.addEventListener('mousedown', div3DMouseDown, false);
    div3D.addEventListener('mousemove', div3DMouseMove, false);
    window.addEventListener('mouseup', windowMouseUp, false);  //window in case they wander off the div
    div3D.addEventListener('wheel', div3DMouseWheel, { passive: true });
    window.addEventListener('dblclick', div3DDoubleClick, false); // Add double click event listener
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', div3DKeyDown, false);

}

function div3DKeyDown(event) {

    if (selectedObject) {
        if (event.key === "Backspace" || event.key === "Delete") {

            FB.deleteFromFirebase("objects", selectedObject.firebaseKey);
        }
    }
}

function div3DDoubleClick(event) {
    let mouse = { x: event.clientX, y: event.clientY };
    const pos = project2DCoordsInto3D(300 - camera.fov * 3, mouse);
    FB.addNewThingToFirebase("objects", { type: "p5ParticleSystem", position: { x: pos.x, y: pos.y, z: pos.z } });
}

function div3DMouseDown(event) {
    isUserInteracting = true;
    selectedObject = MAIN.findObjectUnderMouse(event.clientX, event.clientY);
    // if (selectedObject) {
    //     selectedObject.hilite = true;
    // } else {
    //     MAIN.clearAllHilites();
    // }
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
            let pos = MAIN.project2DCoordsInto3D(100, { x: event.clientX, y: event.clientY });
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
    let phi = MathUtils.degToRad(90 - lat);  //restrict movement
    let theta = MathUtils.degToRad(lon);
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


function enableDragDrop() {
    window.addEventListener("dragover", function (e) {
        e.preventDefault();  //prevents browser from opening the file
    }, false);

    window.addEventListener("drop", (e) => {
        e.preventDefault();

        const files = e.dataTransfer.files;

        for (let i = 0; i < files.length; i++) {
            if (files[i].type.match("image")) {
                // Process the dropped image file here
                console.log("Dropped image file:", files[i]);

                const reader = new FileReader();
                reader.onload = function (event) {
                    const img = new Image();
                    img.onload = function () {
                        let mouse = { x: e.clientX, y: e.clientY };
                        const pos = MAIN.project2DCoordsInto3D(150 - camera.fov, mouse);
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
        }
    }, true);

}

