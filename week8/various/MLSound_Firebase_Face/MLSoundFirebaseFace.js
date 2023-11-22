
let camera3D, scene, renderer
let myCanvas
let myAvatar;
let people = [];
let sounds = [];
let myRoomName = "mycrazyFaceCanvasRoomName";   //make a different room from classmates

let angleOnCircle;

let progress = "loading Face ML";
let inputField;
let listener;
let distanceFromCenter = 600;

let myName; //= prompt("name?");

function setup() {
    myCanvas = createCanvas(512, 512);
    //  document.body.append(myCanvas.elt);
    myCanvas.hide();

    inputField = createInput("Grateful Dead meets Hip Hop");
    inputField.position(windowWidth / 2 - 100, 50);
    inputField.size(200, 20);
    let askButton = createButton("Ask For Sound");
    askButton.position(windowWidth / 2 - 100, 80);
    askButton.mousePressed(function () {
        askForSound(inputField.value());
    });
    let pauseButton = createButton("Pause");
    pauseButton.position(windowWidth / 2 - 100, 110);
    pauseButton.mousePressed(function () {
        if (listener.context.state === 'suspended') {
            listener.context.resume();
        } else
            listener.context.suspend();
    });

    //ALSO ADD AUDIO STREAM
    //addAudioStream() ;

    initFace();

    init3D();
}


async function askForSound(p_prompt) {
    inputField.value("Getting Results for: " + p_prompt);
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
    //console.log("picture_response", picture_info);
    const proxy_said = await picture_info.json();
    console.log("proxy_said", proxy_said.output.audio);
    const ctx = new AudioContext();
    let incomingData = await fetch(proxy_said.output.audio);
    let arrayBuffer = await incomingData.arrayBuffer();
    let decodedAudio = await ctx.decodeAudioData(arrayBuffer);
    const playSound = ctx.createBufferSource();
    playSound.buffer = decodedAudio;;
    playSound.connect(ctx.destination);
    playSound.start(ctx.currentTime);
    console.log("myAvatar", myAvatar.object.position);
    let location = { x: myAvatar.object.position.x, y: myAvatar.object.position.y, z: myAvatar.object.position.z };
    sendToFirebase(p_prompt, location, playSound);
    //weirdly send it to firebase before instantiating it locally.  firebase will send it back to us
    //playSound.play();//
    //playSound.loop = true;
    document.body.style.cursor = "default";
    inputField.value(p_prompt);
}

function place3DSound(prompt, location, url) {

    console.log("placeMySound", prompt, url);
    let me;  //find me
    for (var i = 0; i < people.length; i++) {
        if (people[i].id == "me") {
            me = people[i];
            break;
        }
    }
    if (me.soundAvatar == undefined) {
        me.soundAvatarGraphics = createGraphics(512, 512);
        me.soundAvatarTexture = new THREE.Texture(me.soundAvatarGraphics.elt);
        me.soundAvatarTexture.minFilter = THREE.LinearFilter;  //otherwise lots of power of 2 errors
        var material = new THREE.MeshBasicMaterial({ map: me.soundAvatarTexture, transparent: true });
        var geo = new THREE.PlaneGeometry(512, 512);
        me.soundAvatar = new THREE.Mesh(geo, material);
        scene.add(me.soundAvatar);
    }
    me.soundAvatarGraphics.clear();
    me.soundAvatarGraphics.fill(255, 0, 0);
    me.soundAvatarGraphics.image(myCanvas, 0, 0);
    me.soundAvatarGraphics.textSize(32);
    me.soundAvatarGraphics.text(prompt, 0, 0);


    me.soundAvatar.position.set(location.x, location.y, location.z + 10);
    me.soundAvatar.lookAt(0, 0, 0);

    me.sound = new THREE.PositionalAudio(listener);
    me.sound.setVolume(1);
    me.sound.setRefDistance(20);
    me.sound.setRolloffFactor(1);
    me.sound.setDistanceModel('linear');
    me.sound.setMaxDistance(1000);
    me.sound.setDirectionalCone(90, 180, 0.1);
    me.sound.setLoop(true);

    // load a sound and set it as the PositionalAudio object's buffer
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(url, function (buffer) {
        me.sound.setBuffer(buffer);
        me.sound.setRefDistance(20);
        me.sound.play();
        me.sound.setLoop(true);
    });
    me.soundAvatar.add(me.sound);
    me.soundAvatarTexture.needsUpdate = true;
}

function load3DSound(key, data) {
    if (allLocal[data.key] == undefined) {
        place3DSound(data.prompt, data.location, data.sound);
    } else {
        allLocal[key].soundAvatarGraphics.clear();
        allLocal[key].soundAvatarGraphics.fill(255, 0, 0);
        allLocal[key].soundAvatarGraphics.image(myCanvas, 0, 0);
        allLocal[key].soundAvatarGraphics.textSize(32);
        allLocal[key].soundAvatarGraphics.textMode(CENTER);
        let promptParts = data.prompt.split(" ");
        for (var i = 0; i < promptParts.length; i++) {
            allLocal[key].soundAvatarGraphics.text(promptParts[i], width / 2, 50 + 50 * i);
        }
        allLocal[key].soundAvatarTexture.needsUpdate = true;
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load(data.sound, function (buffer) {
            allLocal[key].setBuffer(buffer);
            allLocal[key].setRefDistance(20);
            allLocal[key].play();
            allLocal[key].setLoop(true);
        });
        me.soundAvatar.position.set(data.location.x, data.location.y, data.z + 10);
        me.soundAvatar.lookAt(0, 0, 0);
    }

}

function kill3DSound(key, data) {
    if (allLocal[data.key] == undefined) return;
    scene.remove(allLocal[data.key].soundAvatar);
    delete allLocal[data.key];
}


function creatNewVideoObject(videoObject, id) {  //this is for remote and local

    var videoGeometry = new THREE.PlaneGeometry(512, 512);
    //usually you can just feed the videoObject to the texture.  We added an extra graphics stage to remove background
    let extraGraphicsStage = createGraphics(width, height)
    let myTexture;
    if (id == "me") {
        myTexture = new THREE.Texture(videoObject.elt);  //NOTICE THE .elt  this give the element
    } else {
        myTexture = new THREE.Texture(extraGraphicsStage.elt);  //NOTICE THE .elt  this give the element
    }
    myTexture.minFilter = THREE.LinearFilter;  //otherwise lots of power of 2 errors
    let videoMaterial = new THREE.MeshBasicMaterial({ map: myTexture, transparent: true });
    //NEED HELP FIGURING THIS OUT. There has to be a way to remove background without the pixel by pixel loop currently in draw
    //instead should be able to use custom blending to do this in the GPU
    //https://threejs.org/docs/#api/en/constants/CustomBlendingEquations
    videoMaterial.map.minFilter = THREE.LinearFilter;  //otherwise lots of power of 2 errors
    myAvatarObj = new THREE.Mesh(videoGeometry, videoMaterial);
    angleOnCircle = Math.random() * Math.PI * 2;
    if (id == "me") {
        camera3D.add(myAvatarObj);
        myAvatarObj.position.set(0, 0, -distanceFromCenter);
        lon = angleOnCircle;
        computeCameraOrientation();
        // myAvatarObj.lookAt(0, 0, 0)
        //scene.add(myAvatarObj);
    } else {
        scene.add(myAvatarObj);
        positionOnCircle(angleOnCircle, myAvatarObj);
        //hopefully they will update quickly
    }
    //position them to start based on how many people but we will let them move around
    //let radiansPerPerson = Math.PI / (people.length + 1);  //spread people out over 180 degrees?
    //angleOnCircle = people.length * radiansPerPerson + Math.PI;
    return { "object": myAvatarObj, "texture": myTexture, "id": id, "videoObject": videoObject, "extraGraphicsStage": extraGraphicsStage };
}


function positionOnCircle(angle, mesh) {
    //imagine a circle looking down on the world and do High School math

    x = distanceFromCenter * Math.sin(angle);
    z = distanceFromCenter * Math.cos(angle);
    mesh.position.set(x, 0, z);
    mesh.lookAt(0, 0, 0);
}

function draw() {
    //other people
    //go through all the people an update their texture, animate would be another place for this
    for (var i = 0; i < people.length; i++) {
        if (people[i].id == "me") {
            people[i].texture.needsUpdate = true;
        } else if (people[i].videoObject.elt.readyState == people[i].videoObject.elt.HAVE_ENOUGH_DATA) {
            //remove background that became black and not transparent  in transmission
            people[i].extraGraphicsStage.image(people[i].videoObject, 0, 0);
            people[i].extraGraphicsStage.loadPixels();
            //ugly way to remove black background
            for (var j = 0; j < people[i].extraGraphicsStage.pixels.length; j += 4) {
                let r = people[i].extraGraphicsStage.pixels[j];
                let g = people[i].extraGraphicsStage.pixels[j + 1];
                let b = people[i].extraGraphicsStage.pixels[j + 2];
                if (r + g + b < 10) {
                    people[i].extraGraphicsStage.pixels[j + 3] = 0;
                } else {
                    // people[i].extraGraphicsStage.pixels[j + 3] = 127;
                }
            }
            people[i].extraGraphicsStage.updatePixels();
            people[i].texture.needsUpdate = true;
        }

    }
    //now daw me on  the canvas I am sending out to the group
    //to justify using a canvas instead  of just sending out the straigh video I will do a little maninpulation
    //myMask was drawn when ML5 face mesh returned the sillouette
    myVideo.mask(myMask);//use alpha of mask to clip the vido

    clear();//for making background transparent on the main picture

    image(myVideo, (myCanvas.width - myVideo.width) / 2, (myCanvas.height - myVideo.height) / 2);
    textSize(32);
    fill(255)
    text(myName, width / 2 - textWidth(myName) / 2, height - 80);
    text(progress, 100, 100);
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

    moveCameraWithMouse();

    myAvatar = creatNewVideoObject(myCanvas, "me");
    //add a listener to the camera
    listener = new THREE.AudioListener();
    myAvatar.object.add(listener);
    camera3D.add(myAvatar.object);
    let bgGeometery = new THREE.SphereGeometry(900, 100, 40);
    //let bgGeometery = new THREE.CylinderGeometry(725, 725, 1000, 10, 10, true)
    bgGeometery.scale(-1, 1, 1);
    // has to be power of 2 like (4096 x 2048) or(8192x4096).  i think it goes upside down because texture is not right size
    let panotexture = new THREE.TextureLoader().load("itp.jpg");
    let backMaterial = new THREE.MeshBasicMaterial({ map: panotexture });

    var geometryFront = new THREE.BoxGeometry(1, 1, 1);
    var materialFront = new THREE.MeshBasicMaterial({ color: 0x00ff00 });


    let back = new THREE.Mesh(bgGeometery, backMaterial);
    scene.add(back);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera3D);
}


