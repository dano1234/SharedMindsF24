// import * as THREE from 'three';


let camera3D, scene, renderer
let myCanvas
let in_front_of_you;

let sounds = {};
let mySound = {};
let myRoomName = "mycrazyFaceCanvasRoomName";   //make a different room from classmates

//let angleOnCircle;

let progress = "loading Face ML";
let inputField;
let listener;
let distanceFromCenter = 600;

//let myName; //= prompt("name?");

init();

function init() {
    inputField = document.createElement("input");
    inputField.value = "Grateful Dead meets Hip Hop";
    inputField.style.position = "absolute";
    inputField.style.top = "50px";
    inputField.style.left = "50%";
    inputField.style.transform = "translate(-50%, -50%)";
    inputField.style.width = "300px";
    inputField.style.height = "20px";
    document.body.appendChild(inputField);

    let askButton = document.createElement("button");
    askButton.innerHTML = "Ask";
    askButton.style.position = "absolute";
    askButton.style.top = "80px";
    askButton.style.left = "50%";
    askButton.style.transform = "translate(-50%, -50%)";
    askButton.onclick = function () {
        askForSound(inputField.value);
    }
    document.body.appendChild(askButton);

    let pauseButton = document.createElement("button");
    pauseButton.innerHTML = "Pause";
    pauseButton.style.position = "absolute";
    pauseButton.style.top = "110px";
    pauseButton.style.left = "50%";
    pauseButton.style.transform = "translate(-50%, -50%)";
    pauseButton.onclick = function () {
        if (listener.context.state === 'suspended') {
            listener.context.resume();
        } else {
            listener.context.suspend();
        }
    };
    document.body.appendChild(pauseButton);

    init3D();
    moveCameraWithMouse();
    connectToFirebase();
}

async function askForSound(p_prompt) {
    //inputField.value("Getting Results for: " + p_prompt);
    inputField.value = "Getting Results for: " + p_prompt;
    document.body.style.cursor = "progress";
    const replicateProxy = "https://replicate-api-proxy.glitch.me"

    //const imageDiv = select("#resulting_image");
    //imageDiv.html("Waiting for reply from Replicate's API...");
    let data = {
        //replicate / riffusion / riffusion
        "version": "8cf61ea6c56afd61d8f5b9ffd14d7c216c0a93844ce2d82ac1c9ecc9c7f24e05",
        input: {
            "prompt_a": p_prompt,
        },
    };
    console.log("Asking for Sound Info From Replicate via Proxy", data);
    let options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };
    const url = replicateProxy + "/create_n_get/"
    console.log("url", url, "options", options);
    const picture_info = await fetch(url, options);

    const proxy_said = await picture_info.json();
    console.log("proxy_said", proxy_said.output.audio);

    const ctx = new AudioContext();
    let incomingData = await fetch(proxy_said.output.audio);
    // let arrayBuffer = await incomingData.arrayBuffer();
    // let decodedAudio = await ctx.decodeAudioData(arrayBuffer);
    // const playSound = ctx.createBufferSource();
    // playSound.buffer = decodedAudio;;
    // playSound.connect(ctx.destination);
    // playSound.start(ctx.currentTime);
    //in_front_of_you.position.set(0, 0, -distanceFromCenter);
    const posInWorld = new THREE.Vector3();
    //remember we attached a tiny to the  front of the camera in init, now we are asking for its position

    in_front_of_you.position.set(0, 0, -distanceFromCenter);
    in_front_of_you.getWorldPosition(posInWorld);

    let location = { x: posInWorld.x, y: posInWorld.y, z: posInWorld.z };
    sendToFirebase(p_prompt, location, proxy_said.output.audio);
    document.body.style.cursor = "default";
    inputField.value = p_prompt;
}

function load3DSound(key, data) {
    let thisPerson = sounds[key];
    if (thisPerson == undefined) {//make aa variable and 3D object
        thisPerson = {};  //find me
        thisPerson.canvas = document.createElement("canvas");
        thisPerson.canvas.width = 512;
        thisPerson.canvas.height = 512;
        thisPerson.ctx = thisPerson.canvas.getContext("2d");
        //thisPerson.soundAvatarGraphics = createGraphics(512, 512);
        thisPerson.soundAvatarTexture = new THREE.Texture(thisPerson.canvas);
        thisPerson.soundAvatarTexture.minFilter = THREE.LinearFilter;  //otherwise lots of power of 2 errors
        var material = new THREE.MeshBasicMaterial({ map: thisPerson.soundAvatarTexture, transparent: true });
        var geo = new THREE.PlaneGeometry(512, 512);
        thisPerson.soundAvatar = new THREE.Mesh(geo, material);
        scene.add(thisPerson.soundAvatar); //add to scene
        sounds[data.key] = thisPerson;  //add to overall list
    }
    thisPerson.ctx.textAlign = "center";
    thisPerson.ctx.textBaseline = "middle";
    thisPerson.ctx.font = "32px Arial";
    thisPerson.ctx.fillText(data.prompt, 256, 256);
    thisPerson.ctx.fillStyle = "rgba(255, 0, 255, 0.5)";
    thisPerson.ctx.rect(0, 0, 512, 512);

    let promptParts = data.prompt.split(" ");
    for (var i = 0; i < promptParts.length; i++) {
        thisPerson.ctx.fillText(promptParts[i], 512 / 2, 50 + 50 * i);
    }
    thisPerson.soundAvatarTexture.needsUpdate = true;

    //make a sound
    if (!thisPerson.sound) {
        thisPerson.sound = new THREE.PositionalAudio(listener);
        thisPerson.sound.setVolume(1);
        thisPerson.sound.setRefDistance(10);
        thisPerson.sound.setRolloffFactor(1);
        thisPerson.sound.setDistanceModel('linear');
        thisPerson.sound.setMaxDistance(1000);
        thisPerson.sound.setDirectionalCone(90, 180, 0.1);
        thisPerson.sound.setLoop(true);
        thisPerson.soundAvatar.add(thisPerson.sound);
    }
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(data.sound, function (buffer) {
        thisPerson.sound.setBuffer(buffer);
        //thisPerson.sound.play();
        thisPerson.sound.setLoop(true);
    });

    thisPerson.soundAvatar.position.set(data.location.x, data.location.y, data.z + 10);
    thisPerson.soundAvatar.lookAt(0, 0, 0);

}

function kill3DSound(key, data) {
    if (allLocal[data.key] == undefined) return;
    scene.remove(allLocal[data.key].soundAvatar);
    delete allLocal[data.key];
}


function init3D() {
    scene = new THREE.Scene();
    camera3D = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera3D.position.x = 0;
    camera3D.position.y = 0;
    camera3D.position.z = 0;
    scene.add(camera3D);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);


    let bgGeometery = new THREE.SphereGeometry(900, 100, 40);
    //let bgGeometery = new THREE.CylinderGeometry(725, 725, 1000, 10, 10, true)
    bgGeometery.scale(-1, 1, 1);
    // has to be power of 2 like (4096 x 2048) or(8192x4096).  i think it goes upside down because texture is not right size
    let panotexture = new THREE.TextureLoader().load("itp.jpg");
    let backMaterial = new THREE.MeshBasicMaterial({ map: panotexture });

    var geometryFront = new THREE.BoxGeometry(1, 1, 1);
    var materialFront = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    in_front_of_you = new THREE.Mesh(geometryFront, materialFront);
    camera3D.add(in_front_of_you); // then add in front of the camera (not scene) so it follow it

    let back = new THREE.Mesh(bgGeometery, backMaterial);
    scene.add(back);

    listener = new THREE.AudioListener();
    in_front_of_you.add(listener);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera3D);
}


