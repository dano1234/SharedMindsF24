
import * as MAIN from './main.js';
import * as FB from './firebaseStuffFramesAuthUpload.js';
import { MathUtils } from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.module.min.js';


/////MOUSE STUFF
let mouseDownX = 0, mouseDownY = 0;
let lon = -90, mouseDownLon = 0;
let lat = 0, mouseDownLat = 0;
let isUserInteracting = false;
let selectedObject = null;
let camera = null;
let renderer = null;



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



    // textInput.addEventListener("keydown", function (e) {
    //     if (e.key === "Enter") {  //checks whether the pressed key is "Enter"
    //         const inputRect = textInput.getBoundingClientRect();
    //         const mouse = { x: inputRect.left, y: inputRect.top };
    //         MAIN.addTextRemote(textInput.value, mouse);
    //         //don't make it locally until you hear back from firebase
    //     }
    // });

    const titleBox = document.createElement('input');
    titleBox.setAttribute('type', 'text');
    titleBox.setAttribute('id', 'title');
    titleBox.value = 'War and Peace';
    titleBox.style.position = 'absolute';
    titleBox.style.left = '50%';
    titleBox.style.top = '10%';
    titleBox.style.transform = 'translate(-50%, -50%)';
    titleBox.style.zIndex = '200';
    titleBox.style.fontSize = '20px';
    //override css
    titleBox.style.width = "200px";
    titleBox.style.fontFamily = 'Arial';
    titleBox.style.textAlign = 'center';

    document.body.appendChild(titleBox);

    titleBox.addEventListener('mousedown', function (event) {
        event.stopPropagation();
    });


    const titleLabel = document.createElement('label');
    titleLabel.setAttribute('for', 'title');
    titleLabel.textContent = 'Title:';
    titleLabel.style.position = 'absolute';
    titleLabel.style.left = '50%';
    titleLabel.style.top = '3%';
    titleLabel.style.transform = 'translate(-50%, -50%)';
    titleLabel.style.zIndex = '100';
    titleLabel.style.fontSize = '15px';
    titleLabel.style.fontFamily = 'Arial';

    document.body.appendChild(titleLabel);

    const nextFrameButton = document.createElement('button');
    nextFrameButton.textContent = 'Next Frame';
    nextFrameButton.style.position = 'absolute';
    nextFrameButton.style.left = '60%';
    nextFrameButton.style.top = '95%';
    nextFrameButton.style.transform = 'translate(-50%, -50%)';
    nextFrameButton.style.zIndex = '200';
    nextFrameButton.addEventListener('click', MAIN.nextFrame);

    document.body.appendChild(nextFrameButton);

    const previousFrameButton = document.createElement('button');
    previousFrameButton.textContent = 'Previous Frame';
    previousFrameButton.style.position = 'absolute';
    previousFrameButton.style.left = '40%';
    previousFrameButton.style.top = '95%';
    previousFrameButton.style.transform = 'translate(-50%, -50%)';
    previousFrameButton.style.zIndex = '200';
    previousFrameButton.addEventListener('click', MAIN.previousFrame);

    document.body.appendChild(previousFrameButton);

    const currentFrameDisplay = document.createElement('div');
    currentFrameDisplay.setAttribute('id', 'currentFrameDisplay');
    currentFrameDisplay.textContent = 'Current Frame: 1';
    currentFrameDisplay.style.position = 'absolute';
    currentFrameDisplay.style.left = '50%';
    currentFrameDisplay.style.top = '95%';
    currentFrameDisplay.style.transform = 'translate(-50%, -50%)';
    currentFrameDisplay.style.zIndex = '200';

    document.body.appendChild(currentFrameDisplay);

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
    event.stopPropagation();

}

function div3DDoubleClick(event) {
    if (selectedObject && selectedObject.type === "audio") {
        if (selectedObject.sound.isPlaying) {
            selectedObject.sound.pause();
        } else {
            selectedObject.sound.play();
        }

    }
}

function div3DKeyDown(event) {

    if (selectedObject) {
        if (event.key === "Backspace" || event.key === "Delete") {

            FB.deleteFromFirebase("objects", selectedObject.firebaseKey);
        }
    }
    event.stopPropagation();
}



function div3DMouseDown(event) {
    isUserInteracting = true;

    selectedObject = MAIN.findObjectUnderMouse(event.clientX, event.clientY);
    console.log(selectedObject);
    // if (selectedObject) {
    //     selectedObject.hilite = true;
    // } else {
    //     MAIN.clearAllHilites();
    // }
    mouseDownX = event.clientX;
    mouseDownY = event.clientY;
    mouseDownLon = lon;
    mouseDownLat = lat;
    event.stopPropagation();
}

function div3DMouseMove(event) {
    if (isUserInteracting) {
        lon = (mouseDownX - event.clientX) * 0.1 + mouseDownLon;
        lat = (event.clientY - mouseDownY) * 0.1 + mouseDownLat;
        //either move the selected object or the camera 
        if (selectedObject) {
            MAIN.moveObject(selectedObject, event.clientX, event.clientY);

        } else {
            computeCameraOrientation();
        }
    }
    event.stopPropagation();
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