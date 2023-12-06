
let camera3D, scene, renderer;

const replicateProxy = "https://replicate-api-proxy.glitch.me"
let canvases = {};  //json object that keeps track of all the canvases in the scene by their threejs mesh uuid
let hitTestableThings = [];  //things that will be tested for intersection
let in_front_of_you;
let distanceFromCamera = -800;
let image1;
let image2;


function preload() {
    image1 = loadImage('banksy.jpg');
    image2 = loadImage('hektad.jpg');
}
function setup() {
    //let mainCanvas = createCanvas(512, 512);
    //mainCanvas.hide();
    //placeImage(image1);
    //placeImage(image2);
    init3D();
}

function draw() {
}

function init3D() {
    scene = new THREE.Scene();
    camera3D = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("ThreeJSContainer").append(renderer.domElement);


    //Background
    let bgGeometry = new THREE.SphereGeometry(950, 60, 40);
    // let bgGeometery = new THREE.CylinderGeometry(725, 725, 1000, 10, 10, true)
    bgGeometry.scale(-1, 1, 1);
    // has to be power of 2 like (4096 x 2048) or(8192x4096).  i think it goes upside down because texture is not right size
    let panotexture = new THREE.TextureLoader().load("./itp.jpg");
    // var material = new THREE.MeshBasicMaterial({ map: panotexture, transparent: true,   alphaTest: 0.02,opacity: 0.3});
    let backMaterial = new THREE.MeshBasicMaterial({ map: panotexture });
    let back = new THREE.Mesh(bgGeometry, backMaterial);
    scene.add(back);

    placeImage(image1, 0);
    placeImage(image2, 90);

    moveCameraWithMouse();

    //camera3D.position.z = 0;
    animate();
}

function placeImage(img, degrees) {
    let thisCanvas = createGraphics(512, 512); //make a new p5 canvas
    thisCanvas.image(img, 0, 0, 512, 512); //draw on it

    var texture = new THREE.Texture(thisCanvas.elt);  //turrn p5 thing into a regular canvas
    console.log(img, texture);
    var material = new THREE.MeshBasicMaterial({ map: texture, transparent: false });
    var geo = new THREE.PlaneGeometry(512, 512);
    var mesh = new THREE.Mesh(geo, material);

    //place it 600 units away from the center of the world and 90 degrees to the left
    var posInWorld = new THREE.Vector3(0, 0, distanceFromCamera);
    posInWorld.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.Math.degToRad(degrees));


    mesh.position.x = posInWorld.x;
    mesh.position.y = posInWorld.y;
    mesh.position.z = posInWorld.z;
    console.log(posInWorld);

    //have it face the center
    mesh.lookAt(0, 0, 0);
    //mesh.scale.set(10,10, 10);
    scene.add(mesh);
    //store everything about this in a jsoon object as an associative array with the mesh uuid as the key
    canvases[mesh.uuid] = { "threejs_mesh": mesh, "threejs_texture": texture, "p5_graphics": thisCanvas }  //keep track of the canvas
    hitTestableThings.push(mesh);
}


function animate() {
    requestAnimationFrame(animate);
    //update the textures in case they changed
    for (let key in canvases) {
        canvases[key].threejs_texture.needsUpdate = true;
    }

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


function onDocumentMouseDown(event) {
    /create a raytracer from the camera position and direction/
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera3D);
    var intersects = raycaster.intersectObjects(hitTestableThings);
    if (intersects.length > 0) {
        console.log("intersected", intersects[0].object.uuid);
        for (let key in canvases) {
            if (key == intersects[0].object.uuid) {
                //now do anything you would do in p5 but use the p5_graphics object
                thisCanvas = canvases[key].p5_graphics;
                console.log("found it", key);
                thisCanvas.background(255, 0, 0);
                thisCanvas.textSize(32);
                thisCanvas.text("hello", 100, 100);
                thisCanvas.texture.needsUpdate = true;
            }
        }
    } else {
        onPointerDownPointerX = event.clientX;
        onPointerDownPointerY = event.clientY;
        onPointerDownLon = lon;
        onPointerDownLat = lat;
        isUserInteracting = true;
    }
}

function onDocumentKeyDown(event) {
    //if (event.key == " ") {
    //in case you want to track key presses
    //}
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

