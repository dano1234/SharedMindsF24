let myCanvas, myVideo;
let people = {};  //make it an associatvie array with each person labeled by network id
let p5lm 

function setup() {
    myCanvas = createCanvas(512, 512);
    myCanvas.hide();
    //let captureConstraints =  allowCameraSelection(myCanvas.width,myCanvas.height) ;
    //myVideo = createCapture(captureConstraints, videoLoaded);
    //below is simpler if you don't need to select Camera because default is okay
    myVideo = createCapture(VIDEO, videoLoaded);
    myVideo.size(myCanvas.width, myCanvas.height);
    myVideo.elt.muted = true;
    myVideo.hide()

    //create the local thing
    creatNewVideoObject(myVideo, "me");
}

function videoLoaded(stream) {
    p5lm = new p5LiveMedia(this, "CAPTURE", stream, "mycrazyroomname")
    p5lm.on('stream', gotStream);
    p5lm.on('data', gotData);
    p5lm.on('disconnect', gotDisconnect);
}

function gotData(data, id) {
    // If it is JSON, parse it
    let d = JSON.parse(data);
    positionOnCircle(d.angleOnCircle, people[id].object);
    if (d.loc.lat != myLoc.lat && d.loc.lng != myLoc.lng){
        console.log("in different places");
    }
}

function gotStream(videoObject, id) {
    //this gets called when there is someone else in the room, new or existing
    videoObject.hide();  //don't want the dom object, will use in p5 and three.js instead
    //get a network id from each person who joins
    creatNewVideoObject(videoObject, id);
}

function gotDisconnect(id) {
    people[id].videoObject.remove(); //dom version
    scene.remove(people[id].object); //three.js version
    delete people[id];  //remove from our variable
}

function creatNewVideoObject(videoObject, id) {  //this is for remote and local
    var videoGeometry = new THREE.PlaneGeometry(512, 512);
    let myTexture = new THREE.Texture(videoObject.elt);  //NOTICE THE .elt  this give the element
    let videoMaterial = new THREE.MeshBasicMaterial({ map: myTexture, side: THREE.DoubleSide });
    videoMaterial.map.minFilter = THREE.LinearFilter;  //otherwise lots of power of 2 errors
    myAvatarObj = new THREE.Mesh(videoGeometry, videoMaterial);

    scene.add(myAvatarObj);

    //they can move that around but we need to put you somewhere to start
    angleOnCircle = positionOnCircle(null, myAvatarObj);

    //remember a bunch of things about each connection in json but we are really only using texture in draw
    //use an named or associate array where each oject is labeled with an ID
    people[id] = { "object": myAvatarObj, "texture": myTexture, "id": id, "videoObject": videoObject, "angleOnCircle": angleOnCircle };

}

function positionOnCircle(angle, thisAvatar) {
    //position it on a circle around the middle
    if (angle == null) { //first time
        angle = random(2*Math.PI); 
    }
      //imagine a circle looking down on the world and do High School math
    let distanceFromCenter = 800;
    x = distanceFromCenter * Math.sin(angle);
    z = distanceFromCenter * Math.cos(angle);
    thisAvatar.position.set(x, 0, z);  //zero up and down
    thisAvatar.lookAt(0, 0, 0);  //oriented towards the camera in the center
    return angle;
}

function draw() {
    //go through all the people an update their texture, animate would be another place for this
    for(id in people){
        let thisPerson = people[id];
        if (thisPerson .videoObject.elt.readyState == thisPerson .videoObject.elt.HAVE_ENOUGH_DATA) {
            //check that the transmission arrived okay
            //then tell three that something has changed.
            thisPerson.texture.needsUpdate = true;
        }
    }
}


///move people around and tell them about 
function keyPressed() {
    let me = people["me"];
    if (keyCode == 37 || key == "a") {
        me.angleOnCircle -= .01;

    } else if (keyCode == 39 || key == "d") {
        me.angleOnCircle += .01;
    

    } else if (keyCode == 38 || key == "w") {

    } else if (keyCode == 40 || key == "s") {

    }
    positionOnCircle(me.angleOnCircle, me.object); //change it locally 
    //send it to others
    let dataToSend = { "angleOnCircle": me.angleOnCircle , "loc":myLoc};
    p5lm.send(JSON.stringify(dataToSend));

}
