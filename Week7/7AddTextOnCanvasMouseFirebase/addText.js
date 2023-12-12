
let camera3D, scene, renderer, cube;
let texts = {};
let in_front_of_you;


init3D();
initFirebase();

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

    //convenience function for getting coordinates

    moveCameraWithMouse();

    camera3D.position.z = 0;
    animate();
}


function animate() {
    requestAnimationFrame(animate);
    //console.log("texts", texts);
    for (var key in texts) {
        texts[key].texture.needsUpdate = true;
    }
    renderer.render(scene, camera3D);
}

var textInput = document.getElementById("text");  //get a hold of something in the DOM
textInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {  //checks whether the pressed key is "Enter"
        const posInWorld = new THREE.Vector3();
        // //remember we attached a tiny to the  front of the camera in init, now we are asking for its position

        in_front_of_you.position.set(0, 0, -(600 - camera3D.fov * 7));  //base the the z position on camera field of view
        in_front_of_you.getWorldPosition(posInWorld);
        createNewText(textInput.value, posInWorld);
    }
});

function createNewText(text_msg, posInWorld, dbKey) {
    console.log("Created New Text");
    var canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    var context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    var fontSize = Math.max(camera3D.fov / 2, 72);
    context.font = fontSize + "pt Arial";
    context.textAlign = "center";
    context.fillStyle = "yellow";
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
    texts[dbKey] = { "object": mesh, "texture": textTexture, "text": text_msg, "position": posInWorld };
}

function onDocumentKeyDown(event) {
    //console.log(event.key);
    // if (event.key == " ") {
    //     
    // }
}



/////MOUSE STUFF

//let onMouseDownMouseX = 0;
//let onMouseDownMouseY = 0;
let onPointerDownPointerX = 0;
let onPointerDownPointerY = 0;
let lon = -90;
let onMouseDownLon = 0;
let lat = 0;
let onMouseDownLat = 0;
let isUserInteracting = false;


function moveCameraWithMouse() {
    //document.addEventListener('keydown', onDocumentKeyDown, false);
    let threeContainer = document.getElementById('container')
    threeContainer.addEventListener('mousedown', onDocumentMouseDown, false);
    threeContainer.addEventListener('mousemove', onDocumentMouseMove, false);
    threeContainer.addEventListener('mouseup', onDocumentMouseUp, false);
    document.addEventListener('wheel', onDocumentMouseWheel, false);
    window.addEventListener('resize', onWindowResize, false);
    camera3D.target = new THREE.Vector3(0, 0, 0);
}


function onDocumentMouseDown(event) {
    onPointerDownPointerX = event.clientX;
    onPointerDownPointerY = event.clientY;
    onPointerDownLon = lon;
    onPointerDownLat = lat;
    if (event.shiftKey == true) {
        let vector = new THREE.Vector3();
        vector.set(
            (event.clientX / window.innerWidth) * 2 - 1,
            - (event.clientY / window.innerHeight) * 2 + 1,
            0.5
        );
        vector.unproject(camera3D);
        vector.multiplyScalar(100)
        let location = { x: vector.x, y: vector.y, z: vector.z };
        sendTextToDB(textInput.value, location)
        //send it to firebase and when it comes back as "added" from firebase, it will be created locally
    } else {
        isUserInteracting = true;
    }
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

