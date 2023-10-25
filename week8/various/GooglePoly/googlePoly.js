
let camera3D, scene, renderer
var in_front_of_you;  //a place holder object connected to  camera for finding place in front of you
var polyObjects = [];

init3D();


var polyInput = document.getElementById("poly");
polyInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {  //checks whether the pressed key is "Enter"
        searchPoly(polyInput.value);
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

    //add some lights if you want
    var ambient = new THREE.HemisphereLight(0xbbbbff, 0x886666, 0.75);
    ambient.position.set(-0.5, 0.75, -1);
    scene.add(ambient);

    var light = new THREE.DirectionalLight(0xffffff, 0.75);
    light.position.set(1, 0.75, 0.5);
    scene.add(light);


    //tiny little dot (could be invisible) for placing things in front of you
    var geometryFront = new THREE.BoxGeometry(1, 1, 1);
    var materialFront = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    in_front_of_you = new THREE.Mesh(geometryFront, materialFront);
    camera3D.add(in_front_of_you); // then add in front of the camera so it follow it
    in_front_of_you.position.set(0, 0, -50);


    moveCameraWithMouse();
    animate();
}


//convenience function for getting coordinates
function getCoordsInFrontOfCamera() {
    const posInWorld = new THREE.Vector3();
    in_front_of_you.getWorldPosition(posInWorld);
    return posInWorld;
}

function animate() {
    requestAnimationFrame(animate);
    //Move things around just to prove you can
    for (var i = 0; i < polyObjects.length; i++) {
        polyObjects[i].rotation.y += .01;
    }

    renderer.render(scene, camera3D);
}

//this asks poly for a model based on a key
function searchPoly(keywords) {
    console.log("Searching Poly for " + keywords);
    //You get your own api key at the creditial part of https://console.developers.google.com -->
    const API_KEY = 'AIzaSyBi_F0gaMWtXi8Ngerunlwe1vRFkjy8cdI';
    var url = `https://poly.googleapis.com/v1/assets?keywords=${keywords}&format=OBJ&key=${API_KEY}`;
    //THE IS HOW YOU MAKE A NETWORK CALL IN PURE JAVASCRIPT
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.addEventListener('load', function (event) {
        //go looking throught he json that comes back
        var data = JSON.parse(event.target.response);
        var assets = data.assets;

        if (assets) {
            //for ( var i = 0; i < assets.length; i ++ ) {  //POLY GIVES MORE THAN ONE CHOICE
            var asset = assets[0];  //for now just pick the first one
            console.log(asset);
            var OBJFormat = asset.formats.find(format => { return format.formatType === 'OBJ'; });
            if (OBJFormat === undefined) {
                console.log("no OBJ option");
            } else {
                console.log("chosen OBJ assets", OBJFormat );
                var obj = OBJFormat.root;
                var mtl = OBJFormat .resources.find(resource => { return resource.url.endsWith('mtl') });
                mtl = mtl.relativePath;
                var path = obj.url.slice(0, obj.url.indexOf(obj.relativePath));
                obj = obj.relativePath;
                createObject(path, mtl, obj);
            }
        } else {
            results.innerHTML = '<center>NO RESULTS</center>';
        }
    });
    request.send(null);
}

function createObject(path, mtl, obj) {
    console.log("info", path, mtl, obj);
    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setCrossOrigin(true);
    mtlLoader.setPath(path);
    mtlLoader.load(mtl, function (materials) {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setCrossOrigin(true);
        objLoader.setMaterials(materials);
        objLoader.setPath(path);
        objLoader.load(obj, function (object) {

            //scaler
            var box = new THREE.Box3();
            box.setFromObject(object);
            var scaler = new THREE.Group();
            scaler.add(object);
            var boxSize = new THREE.Vector3();
            box.getSize(boxSize);
            scaler.scale.setScalar(30 / boxSize.length());
            //position it
            let front = getCoordsInFrontOfCamera();
            scaler.position.set(front.x, front.y, front.z);
            scene.add(scaler);
            polyObjects.push(scaler);

        });
    });
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
