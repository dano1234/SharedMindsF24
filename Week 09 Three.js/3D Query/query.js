
let camera3D, scene, renderer, cube;
let texts = [];
let hitTestableOjects = [];
let in_front_of_you;
let currentObject;
let myTimer;

let group_id = "mySillyQueryRoomName";
let db;

function connectToFirebase() {
    var config = {
        apiKey: "AIzaSyAbJCseU4PrkYSQBdM3NRqWg0UGvb-Fpj4",
        authDomain: "osc-itp-1553359662966.firebaseapp.com",
        databaseURL: "https://osc-itp-1553359662966.firebaseio.com/",
        storageBucket: "gs://osc-itp-1553359662966.appspot.com"
    };
    firebase.initializeApp(config);

    db = firebase.database();



    var myRef = db.ref('group/' + group_id + '/notes/').orderByChild('time');
    myRef.on('child_added', (data) => {
        console.log('child_added', data.key, data.val());
        let key = data.key;
        let thing = data.val();
        createNewText(thing.content, thing.location, key, thing.camera, thing.cameraFOV)
    });

    myRef.on('child_changed', (data) => {
        console.log('child_changed', data.key, data.val());
        for (var i = 0; i < texts.length; i++) {
            let thing = data.val();
            if (texts[i].DBid == data.key) {
                texts[i].text = thing.content;
                texts[i].camera = thing.camera;
                texts[i].cameraFOV = thing.cameraFOV;
                texts[i].text.object.position.x = thing.location.x;
                texts[i].text.object.position.y = thing.location.y;
                texts[i].text.object.position.z = thing.location.z;
                paintText(texts[i].canvas, thing.content)
            }
        }
    });

    myRef.on('child_removed', (data) => {
        console.log('child_removed', data.key);
        for (var i = texts.length; i > -1; i--) {
            if (texts[i].DBid == data.key) {
                texts[i].splice(i, 1);
                break;
            }
        }
    });

    myRef.on('child_moved', (data) => {  // order changed
        console.log('child_moved', data);
        texts.sort(function (a, b) {
            return a.time > b.time;
        });
    });
}



connectToFirebase();
init3D();
organizedDropDownForCloseUps() ;

var slide = document.getElementById('myRange');

slide.onchange = function () {
    console.log(this.value);
    let currentIndex = Math.floor((this.value / 100) * texts.length);
    currentObject = texts[currentIndex];
    console.log(texts.length, currentIndex, currentObject);
    $("#text").val(currentObject.content);
    camera3D.matrix.fromArray(currentObject.camera); // set the camera using saved camera settings
    camera3D.matrix.decompose(camera3D.position, camera3D.quaternion, camera3D.scale);
    camera3D.fov = currentObject.cameraFOV;
    camera3D.updateProjectionMatrix();
}

function organizedDropDownForCloseUps() {
    //MAKE A ONE TIME QUERY
    db.ref('group/' + group_id + '/notes/').orderByChild('cameraFOV').endAt(30).once("value", function (snapshot) {
        console.log("once query", snapshot.val());
    //POPULATE PULL DOWN MENU WITH RESULTS
        let closeUps = snapshot.val();
        var dropdown = $('#closeups');
        dropdown.empty();
        for (key in closeUps) {
            console.log(closeUps[key]);
            dropdown.append(
                $('<option>', {
                    value: key,
                    text: closeUps[key].content
                }, '</option>'))
        }
         //GIVE PULL DOWN AN ACTION
        dropdown.on('change', function () {
            console.log("changed", texts);
            for (var i = 0; i < texts.length; i++) {
                if (texts[i].DBid == this.value) {
                    currentObject = texts[i];
                    $("#text").val(currentObject.content);
                    camera3D.matrix.fromArray(currentObject.camera); // set the camera using saved camera settings
                    camera3D.matrix.decompose(camera3D.position, camera3D.quaternion, camera3D.scale);
                    camera3D.fov = currentObject.cameraFOV;
                    camera3D.updateProjectionMatrix();
                    break;
                }
            }
        });

    });
}

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



function hitTest(x, y) {  //called from onDocumentMouseDown()
    var mouse = { "x": 0, "y": 0 };
    var raycaster = new THREE.Raycaster(); // create once
    //var mouse = new THREE.Vector2(); // create once
    mouse.x = (x / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = - (y / renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera3D);
    var intersects = raycaster.intersectObjects(hitTestableOjects, false);
    // if there is one (or more) intersections
    currentObject = null;
    $("#text").val("");
    $("#text").css({ position: "absolute", left: x, top: y });
    if (intersects.length > 0) {
        let hitObjID = intersects[0].object.uuid; //closest object

        for (var i = 0; i < texts.length; i++) {

            if (texts[i].Threeid == hitObjID) {
                currentObject = texts[i];
                //and put text in input box.
                $("#text").val(texts[i].text);

                //do some hiliting maybe later
                break;
            }
        }
    }
    console.log(currentObject);

}

function animate() {
    requestAnimationFrame(animate);
    for (var i = 0; i < texts.length; i++) {
        texts[i].texture.needsUpdate = true;
    }
    renderer.render(scene, camera3D);
}

var textInput = document.getElementById("text");  //get a hold of something in the DOM
textInput.addEventListener("mousedown", function (e) {
    e.stopImmediatePropagation();
    //don't let it go to the elements under the text box
});



var slider = document.getElementById("myRange");  //get a hold of something in the DOM
slider.addEventListener("mousedown", function (e) {
    e.stopImmediatePropagation();
    //don't let it go to the elements under the slider
});

document.addEventListener("keydown", function (e) {
    if (e.key === "Space") {  //checks whether the pressed key is "Enter"

    }
});


textInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {  //checks whether the pressed key is "Enter"
        if (currentObject) { //hit test returned somethigng
            updateText(textInput.value, currentObject);
            console.log("update text");
        } else {
            createNewText(textInput.value); //don't ghave location and key as parameters when it is local
        }
    }
});

function paintText(canvas, text) {
    var context = canvas.getContext("2d");
    context.fillStyle = "yellow";
    context.fillRect(0, 0, canvas.width, canvas.height);
    //context.clearRect(0, 0, canvas.width, canvas.height);  //this would allow you to use "transparent" in material parameters
    var fontSize = 72; // Math.max(camera3D.fov / 2, 72);
    context.font = fontSize + "pt Arial";
    context.textAlign = "center";
    context.fillStyle = "black";
    context.fillText(text, canvas.width / 2, canvas.height / 2);
}


function createNewText(text_msg, location, key, cameraData, cameraFOV) {
    console.log("Created New Text");
    var canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    paintText(canvas, text_msg);  //do this is function so you can also do it to hilite hit test and update
    var textTexture = new THREE.Texture(canvas);
    textTexture.needsUpdate = true;
    var material = new THREE.MeshBasicMaterial({ map: textTexture, transparent: false });
    var geo = new THREE.PlaneGeometry(1, 1);
    var mesh = new THREE.Mesh(geo, material);
    let DBid = key; //will be null if it did not come in from databaase
    if (location) { //came in from database
        mesh.position.x = location.x;
        mesh.position.y = location.y;
        mesh.position.z = location.z;
    } else { //local and needs location and to be put in the database
        const posInWorld = new THREE.Vector3();
        //remember we attached a tiny to the  front of the camera in init, now we are asking for its position
        in_front_of_you.position.set(0, 0, -(600 - camera3D.fov * 7));  //base the the z position on camera field of view
        in_front_of_you.getWorldPosition(posInWorld);
        mesh.position.x = posInWorld.x;
        mesh.position.y = posInWorld.y;
        mesh.position.z = posInWorld.z;
        //add it to firebase database
        location = { "x": mesh.position.x, "y": mesh.position.y, "z": mesh.position.z, "xrot": mesh.rotation.x, "yrot": mesh.rotation.y, "zrot": mesh.rotation.z }
        var d = new Date();
        var n = d.getTime();
        cameraData = camera3D.matrix.toArray();
        cameraFOV = camera3D.fov;
        let mydata = {
            'location': location,
            'content': text_msg,
            'time': n,
            'camera': cameraData,
            'cameraFOV': cameraFOV
        };
        //insert in the database
        let returnInfo = db.ref('group/' + group_id + '/notes/').push(mydata);
        //get the id that the database uses so you can update it later
        DBid = returnInfo.key;
        // console.log(posInWorld);
    }

    mesh.lookAt(0, 0, 0);

    mesh.scale.set(10, 10, 10);
    scene.add(mesh);
    //two id's one for Three and one for the database
    texts.push({ "object": mesh, "camera": cameraData, "cameraFOV": cameraFOV, "canvas": canvas, "location": location, "texture": textTexture, "text": text_msg, "Threeid": mesh.uuid, "DBid": DBid });

    hitTestableOjects.push(mesh);
}


function updateText(text, note) {
    note.text = text;
    paintText(note.canvas, text)
    var d = new Date();
    var n = d.getTime();
    var cameraData = camera3D.matrix.toArray();
    var cameraFOV = camera3D.fov;
    let mydata = {
        'location': note.location,
        'content': note.text,
        'time': n,
        'camera': cameraData,
        'cameraFOV': cameraFOV
    };
    db.ref('group/' + group_id + '/notes/' + note.DBid).update(mydata);
}




function onDocumentKeyDown(e) {
    clearTimeout(myTimer);
    if (currentObject) {
        if (e.key == "ArrowRight") {
            console.log(e.key);
            currentObject.object.position.x = currentObject.object.position.x + 1;
        } else if (e.key == "ArrowLeft") {
            currentObject.object.position.x = currentObject.object.position.x - 1;
        } else if (e.key == "ArrowUp") {
            currentObject.object.position.y = currentObject.object.position.y - 1;
        } else if (e.key == "ArrowDown") {
            currentObject.object.position.y = currentObject.object.position.y + 1;
        }
        currentObject.location = { "x": currentObject.object.position.x, "y": currentObject.object.position.y, "z": currentObject.object.position.z, "xrot": currentObject.object.rotation.x, "yrot": currentObject.object.rotation.y, "zrot": currentObject.object.rotation.z }

        myTimer = setTimeout(function () {
            var d = new Date();
            var n = d.getTime();
            var cameraData = camera3D.matrix.toArray();
            let mydata = {
                'location': currentObject.location,
                'content': currentObject.text,
                'time': n,
                'camera': cameraData
            };
            console.log("sending");
            db.ref('group/' + group_id + '/notes/' + currentObject.DBid).update(mydata);

        }, 3000);
    }
    //console.log(event.key);
    // if (event.key == " ") {
    //     
    // }
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
    hitTest(event.clientX, event.clientY);
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

