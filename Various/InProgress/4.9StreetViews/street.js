import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.module.min.js';
let camera, scene, renderer;
let myLoc = { lat: 0, lng: 0 };
let div3D;

initHTML();
init3D();



function init3D() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    ///document.body.appendChild(renderer.domElement);

    //this puts the three.js stuff in a particular div
    div3D = document.getElementById('container');
    div3D.appendChild(renderer.domElement)

    let bgGeometery = new THREE.SphereGeometry(1000, 60, 40);
    // let bgGeometery = new THREE.CylinderGeometry(725, 725, 1000, 10, 10, true)
    bgGeometery.scale(-1, 1, 1);
    // has to be power of 2 like (4096 x 2048) or(8192x4096).  i think it goes upside down because texture is not right size
    let panotexture = new THREE.TextureLoader().load("itp.jpg");
    // var material = new THREE.MeshBasicMaterial({ map: panotexture, transparent: true,   alphaTest: 0.02,opacity: 0.3});
    let backMaterial = new THREE.MeshBasicMaterial({ map: panotexture });
    let back = new THREE.Mesh(bgGeometery, backMaterial);
    scene.add(back);

    moveCameraWithMouse();

    camera.position.z = 0;
    animate();
}

function animate() {
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function initHTML() {

    //interface for entering location
    var street = document.getElementById("street");
    street.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {  //checks whether the pressed key is "Enter"
            askForLatLong(street.value);
        }
    });

    // const THREEcontainer = document.createElement("div");
    // THREEcontainer.setAttribute("id", "THREEcontainer");
    // document.body.appendChild(THREEcontainer);
    // THREEcontainer.style.position = "absolute";
    // THREEcontainer.style.top = "0";
    // THREEcontainer.style.left = "0";
    // THREEcontainer.style.width = "100%";
    // THREEcontainer.style.height = "100%";
    // THREEcontainer.style.zIndex = "1";

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

            let mouse = { x: inputRect.left, y: inputRect.top };
            console.log("Entered Text", mouse.z);
            const pos = find3DCoornatesInFrontOfCamera(150 - camera.fov, mouse);
            createNewText(textInput.value, pos);
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
                    const pos = find3DCoornatesInFrontOfCamera(100, mouse);
                    createNewImage(img, pos, files[i]);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(files[i]);
        }
    }, true);



}

function find3DCoornatesInFrontOfCamera(distance, mouse) {
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

function createNewImage(img, posInWorld, file) {

    console.log("Created New Text", posInWorld);
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    var context = canvas.getContext("2d");
    context.drawImage(img, 0, 0);
    var fontSize = Math.max(12);
    context.font = fontSize + "pt Arial";
    context.textAlign = "center";
    context.fillStyle = "red";
    context.fillText(file.name, canvas.width / 2, canvas.height - 30);
    var textTexture = new THREE.Texture(canvas);
    textTexture.needsUpdate = true;
    var material = new THREE.MeshBasicMaterial({ map: textTexture, transparent: true });
    var geo = new THREE.PlaneGeometry(canvas.width / canvas.width, canvas.height / canvas.width);
    var mesh = new THREE.Mesh(geo, material);

    mesh.position.x = posInWorld.x;
    mesh.position.y = posInWorld.y;
    mesh.position.z = posInWorld.z;

    console.log(posInWorld);
    mesh.lookAt(0, 0, 0);
    mesh.scale.set(10, 10, 10);
    scene.add(mesh);
}

function createNewText(text_msg, posInWorld) {

    console.log("Created New Text", posInWorld);
    var canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    var context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    var fontSize = Math.max(camera.fov / 2, 72);
    context.font = fontSize + "pt Arial";
    context.textAlign = "center";
    context.fillStyle = "red";
    context.fillText(text_msg, canvas.width / 2, canvas.height / 2);
    var textTexture = new THREE.Texture(canvas);
    textTexture.needsUpdate = true;
    var material = new THREE.MeshBasicMaterial({ map: textTexture, transparent: true });
    var geo = new THREE.PlaneGeometry(1, 1);
    var mesh = new THREE.Mesh(geo, material);

    mesh.position.x = posInWorld.x;
    mesh.position.y = posInWorld.y;
    mesh.position.z = posInWorld.z;

    console.log(posInWorld);
    mesh.lookAt(0, 0, 0);
    mesh.scale.set(10, 10, 10);
    scene.add(mesh);
}

async function askForLatLong(query) {
    console.log("Asking for Lat Long thru Glitch Proxy", query);
    let options = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    };
    //due to CORS issues, we have to use a proxy
    //var url = "https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/geocode/json?address=" + query + "&key=" + api_key;
    const url = "https://googlemapapiPROXY.glitch.me" + "/addressToLatLon?address=" + query
    console.log("url", url, "options", options);
    const result = await fetch(url, options);
    //console.log("picture_response", picture_info);
    const data = await result.json();
    console.log(data);
    var lat = data.results[0].geometry.location.lat;
    var lng = data.results[0].geometry.location.lng;
    let newLoc = {};
    newLoc.lat = lat;
    newLoc.lng = lng;
    console.log(newLoc);
    //document.getElementById("loading_feedback").html("Lat:" + lat + " Lon:" + lon);
    initializeGoogleMaps(newLoc);
}


//this gets called from script tag
function initializeGoogleMaps(loc) {

    console.log("load google maps")
    if (!loc) {  //Fenway Park Boston by default
        var loc = { lat: 42.345573, lng: -71.098326 };
    }

    var panorama = new google.maps.StreetViewPanorama(
        document.getElementById('pano'), {
        position: loc,
        pov: {
            heading: 34,
            pitch: 10
        }
    });
    myLoc = loc;
    console.log("okay", loc);
}



/////MOUSE STUFF

let mouseDownX = 0, mouseDownY = 0;
let lon = -90, mouseDownLon = 0;
let lat = 0, mouseDownLat = 0;
let isUserInteracting = false;


function moveCameraWithMouse() {
    //set up event handlers

    div3D.addEventListener('mousedown', div3DMouseDown, false);
    div3D.addEventListener('mousemove', div3DMouseMove, false);
    div3D.addEventListener('mouseup', div3DMouseUp, false);
    div3D.addEventListener('wheel', div3DMouseWheel, { passive: true });
    window.addEventListener('resize', onWindowResize, false);
    //document.addEventListener('keydown', onDocumentKeyDown, false);
    camera.target = new THREE.Vector3(0, 0, 0);  //something for the camera to look at
}

function div3DMouseDown(event) {
    mouseDownX = event.clientX;
    mouseDownY = event.clientY;
    mouseDownLon = lon;
    mouseDownLat = lat;
    isUserInteracting = true;
}

function div3DMouseMove(event) {
    if (isUserInteracting) {
        lon = (mouseDownX - event.clientX) * 0.1 + mouseDownLon;
        lat = (event.clientY - mouseDownY) * 0.1 + mouseDownLat;
        computeCameraOrientation();
    }
}

function div3DMouseUp(event) {
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

