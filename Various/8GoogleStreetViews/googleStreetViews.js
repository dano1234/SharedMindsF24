
let camera3D, scene, renderer
let myLoc = { lat: 0, lng: 0 };


init3D();

//interface for entering location
var street = document.getElementById("street");
street.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {  //checks whether the pressed key is "Enter"
        askForLatLong(street.value);
    }
});



function init3D() {
    scene = new THREE.Scene();
    camera3D = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer({ alpha: true }); //make it so you can see dom elements behind
    renderer.setSize(window.innerWidth, window.innerHeight);
    //document.body.appendChild(renderer.domElement);
    document.getElementById('container').appendChild(renderer.domElement); //add it to an exsiting element that css styling

    camera3D.position.z = 0;


    moveCameraWithMouse();
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera3D);
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
    newLoc = {};
    newLoc.lat = lat;
    newLoc.lng = lng;
    console.log(newLoc);
    $("#loading_feedback").html("Lat:" + lat + " Lon:" + lon);
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
