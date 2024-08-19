let dimension = 640;
let people = [];
let button;
let themButton;
let video; // webcam
let ageSlider;
let smileSlider;
let poseSlider;
let myMask;
let alterEgo;
let center;
let tilt;
let box;
let alterEgoBox;
let alterEgoGraphics;
let headAngle;
let tries = 0;
let askingMode = false;
let betweenImage;
let harrisPic;
let trumpPic;
let canvas;
let bodyPose;
const GPUServer = "https://dano.ngrok.dev/";
let fakePeople = [];
let faceBorderFactor = 1.5;
let harris;
let trump;

let bodyPoseOptions = {
    modelType: "MULTIPOSE_LIGHTNING", // "MULTIPOSE_LIGHTNING", "SINGLEPOSE_LIGHTNING", or "SINGLEPOSE_THUNDE"
    enableSmoothing: true,
    minPoseScore: 0.25,
    multiPoseMaxDimension: 256,
    enableTracking: true,
    trackerType: "boundingBox", // "keypoint" or "boundingBox"
    trackerConfig: {},
    modelUrl: undefined,
    flipped: false
}

let options = { maxFaces: 1, refineLandmarks: false, flipHorizontal: false };
function preload() {
    // Load the faceMesh model
    faceMesh = ml5.faceMesh(options);
    bodyPose = ml5.bodyPose(bodyPoseOptions);
    harrisPic = loadImage("harris.png");
    trumpPic = loadImage("trump.png");
}


function setup() {
    canvas = createCanvas(dimension, (dimension * 3) / 4);
    //imageForFaceMesh = createGraphics(dimension, (dimension * 3) / 4);
    ageSlider = createSlider(-5, 5, 0);
    ageSlider.position(0, (dimension * 3) / 4); // x and y
    ageSlider.size(400, 20); // width and height
    ageSlider.changed(function (what) {
        currentPerson.vecToImg("age", what.target.value);
    });

    smileSlider = createSlider(-5, 5, 0);
    smileSlider.position(0, (dimension * 3) / 4 + 30); // x and y
    smileSlider.size(400, 20); // width and height
    smileSlider.changed(function (what) {
        currentPerson.vecToImg("smile", what.target.value);
    });
    trump = new Person(trumpPic, width - 200, height / 2)
    harris = new Person(harrisPic, -100, height / 2)
    trump.locateAlterEgo();
    harris.locateAlterEgo();
    fakePeople.push(trump);
    fakePeople.push(harris);


    // betweenButton = createButton("Between Them");
    // betweenButton.mousePressed(function () {
    //     askBetween();
    // });
    // betweenButton.position(530, 70);

    // button.position(530, 70);
    // let vecToImgButton = createButton("VecToImg");
    // vecToImgButton.position(530, 100);
    // vecToImgButton.mousePressed(function () {
    //     vecToImg("none", 0);
    // });
    //pixelDensity(1)
    video = createCapture(VIDEO); //simpler if you don't need to pick between cameras

    video.size(dimension, dimension * 3 / 4);
    video.hide();
    img = video;
    //myMask = createGraphics(width, height);
    //faceMesh.detectStart(imageForFaceMesh.canvas, gotFaces);
    bodyPose.detectStart(video, gotFaces);

    // faceMesh.detect(imageForFaceMesh.canvas, gotFaces)
    //console.log("canvas", canvas);
    //bodyPose.detectStart(video, gotPoses);
    //let center = { x: width / 2, y: height / 2 };
    //let tilt = 0;
    // setTimeout(function () { ask(); }, 3000);
}

function draw() {

    //background(255);
    image(video, 0, 0, width, height);
    // image(otherPicture, 0, 0, 300, 300);
    // imageForFaceMesh.image(video, 0, 0);


    if (people.length == 1) {
        //   console.log("asking for person 1");
        // push();
        //imageMode(CENTER);
        //imageForFaceMesh.image(trumpPic, width - trump.width / 2, height / 2, 300, 300);
        //imageForFaceMesh.image(harrisPic, 0, height / 2, 300, 300);
        // pop();
    }
    //image(imageForFaceMesh, 0, 0);
    for (let i = 0; i < people.length; i++) {
        people[i].drawMe(i);
    }
    // for (let i = people.length - 1; i > -1; i--) {
    //     if (people[i].isGone()) {
    //         people.splice(i, 1);
    //         console.log("removing person", i);
    //     }
    // }
    for (let i = 0; i < fakePeople.length; i++) {
        fakePeople[i].drawMe(i);
        // if (people.length > 0)
        //     fakePeople[i].setDistanceFromSingle(people[0])
    }
    if (people.length == 1) {
        let xDiff = people[0].center.x - trump.center.x;
        let yDiff = people[0].center.y - trump.center.y;
        let trumpLeanLevel = int(Math.sqrt(xDiff * xDiff + yDiff) / (width / 10))// - (width / 10) / 2;
        xDiff = people[0].center.x - harris.center.x;
        yDiff = people[0].center.y - harris.center.y;
        let harrisLeanLevel = int(Math.sqrt(xDiff * xDiff + yDiff) / (width / 10))// - (width / 10) / 2;
        let harrisChanged = harris.setLean(harrisLeanLevel);
        if (harrisChanged) {
            askBetween(people[0], harris, harrisLeanLevel / 10);
        }

        let trumpChanged = trump.setLean(trumpLeanLevel);
        if (trumpChanged) {
            askBetween(people[0], trump, trumpLeanLevel / 10);
        }
        console.log("trumpLean", trumpLeanLevel, "harrisLean", harrisLeanLevel);
    }

    if (betweenImage) {
        image(betweenImage, 0, 0, 160, 120);
    }


}

function mousePressed() {
    for (let i = 0; i < people.length; i++) {
        let p = people[i];
        if (mouseX > p.box.xMin && mouseX < p.box.xMax && mouseY > p.box.yMin && mouseY < p.box.yMax) {
            p.locateAlterEgo();
            currentPerson = p;
        }
    }
}


// Callback function for when bodyPose outputs data
function gotFaces(results) {
    //console.log("gotFaces", results);
    // Save the output to the poses variable
    //console.log("results", results);
    let existingPeople = [];
    for (let i = 0; i < people.length; i++) {
        existingPeople.push(i);
    }
    for (let i = 0; i < results.length; i++) {
        //if (results[i].keypoints.length < 5) continue;
        if (existingPeople.length == 0) {
            let newPerson = new Person();
            people.push(newPerson);
            newPerson.updatePosition(results[i]);
        } else {
            let closest = 100000;
            let closestIndex = -1;
            for (let j = 0; j < existingPeople.length; j++) {
                let thisIndex = existingPeople[j];
                let dist = Math.sqrt((people[thisIndex].center.x - results[i].box.xMin) ** 2 + (people[thisIndex].center.y - results[i].box.yMin) ** 2);
                // (people[thisIndex].center.x, people[thisIndex].center.y, results[i].box.xMin + (results[i].box.xMax - results[i].box.xMin) / 2, results[i].box.yMin + (results[i].box.yMax - results[i].box.yMin) / 2);
                if (dist < closest) {
                    closest = dist;
                    closestIndex = thisIndex;
                }
            }
            people[closestIndex].updatePosition(results[i]);
            existingPeople.splice(closestIndex, 1);
        }
    }
    //faceMesh.detect(imageForFaceMesh.canvas, gotFaces)
}




async function askBetween(person1, person2, amount) {
    let postData = {
        v1: person1.latents,
        v2: person2.latents,
        percent: amount,
    };
    console.log(postData);
    let url = GPUServer + "getBetween/";

    const options = {
        headers: {
            "Content-Type": `application/json`,
        },
        method: "POST",
        body: JSON.stringify(postData), //p)
    };
    console.log("Asking for Picture from Latents ", options);
    const response = await fetch(url, options);
    const result = await response.json();
    console.log("result", result);

    loadImage(result.b64Image, function (newImage,) {
        betweenImage = newImage;
    });
}
