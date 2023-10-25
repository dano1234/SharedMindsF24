
let camera3D, scene, renderer, cube;
let p5s = [];
let  in_front_of_you;


init3D();

function init3D() {
    scene = new THREE.Scene();
    camera3D = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);


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

    //convenience function for getting coordinates
    
    moveCameraWithMouse();

    camera3D.position.z = 0;
    animate();
}


function animate() {
    requestAnimationFrame(animate);
    for (var i = 0; i < p5s.length; i++){
        p5s[i].texture.needsUpdate = true;
    }
    renderer.render(scene, camera3D);
}



function createP5Instance(which) {
    let sketchInstance = new p5(which);  //this name is in your sketch

    let geo = new THREE.PlaneGeometry(512, 512);
    let p5Texture = new THREE.Texture(sketchInstance.getP5Canvas());  // pull the canvas out of the p5 sketch
    let mat = new THREE.MeshBasicMaterial({ map: p5Texture, transparent: true, opacity: 1, side: THREE.DoubleSide });

    let plane = new THREE.Mesh(geo, mat);
    scene.add(plane);

    const posInWorld = new THREE.Vector3();
    //remember we attached a tiny to the  front of the camera in init, now we are asking for its position

    in_front_of_you.position.set(0,0,-(700-camera3D.fov*5));  //base the the z position on camera field of view
    in_front_of_you.getWorldPosition(posInWorld);
    plane.position.x = posInWorld.x;
    plane.position.y = posInWorld.y;
    plane.position.z = posInWorld.z;
    console.log(posInWorld);
    plane.lookAt(0,0,0);
    p5s.push({"object": plane, "texture":p5Texture, "p5SketchInstance":sketchInstance});

    console.log("textured a plane")
    //plane.scale.set(1, 1, 1);
}

function onDocumentKeyDown(event) {
    console.log(event.key);
    if (event.key == " ") {
        createP5Instance(particleSystemSketch) 
      
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

