let dimension = 640;
let button;
let inputBox;
let video; // webcam
let canvas;
let img;
let myLatents;
//let bodyPose;
let faceMesh;
let faces = [];
let faceRect = [0, 0, dimension, (dimension * 3) / 4];
let justFace;
let mode = "live";
let ageSlider;
let smileSlider;
let poseSlider;
let myMask;
let alterEgo;
let center;
let tilt;
let box;
let alterEgoBox;
let headAngle;
let tries = 0;

const GPUServer = "https://dano.ngrok.dev/";

// function preload() {
//     // Load the bodyPose model
//     bodyPose = ml5.bodyPose();
// }

let options = { maxFaces: 1, refineLandmarks: false, flipHorizontal: false };
function preload() {
    // Load the faceMesh model
    faceMesh = ml5.faceMesh(options);
}



function setup() {
    canvas = createCanvas(dimension, (dimension * 3) / 4);
    ageSlider = createSlider(-5, 5, 0);
    ageSlider.position(0, (dimension * 3) / 4); // x and y
    ageSlider.size(400, 20); // width and height
    ageSlider.changed(function (what) {
        vecToImg("age", what.target.value);
    });

    smileSlider = createSlider(-5, 5, 0);
    smileSlider.position(0, (dimension * 3) / 4 + 30); // x and y
    smileSlider.size(400, 20); // width and height
    smileSlider.changed(function (what) {
        vecToImg("smile", what.target.value);
    });

    poseSlider = createSlider(-5, 5, 0);
    poseSlider.position(0, (dimension * 3) / 4 + 60); // x and y
    poseSlider.size(400, 20); // width and height
    poseSlider.changed(function (what) {
        vecToImg("pose", what.target.value);
    });

    button = createButton("Find Me");
    button.mousePressed(ask);
    button.position(530, 40);
    button = createButton("Live Video");
    button.mousePressed(function () {
        video.play();
        mode = "live";
        img = video;
    });

    button.position(530, 70);
    let vecToImgButton = createButton("VecToImg");
    vecToImgButton.position(530, 100);
    vecToImgButton.mousePressed(function () {
        vecToImg("none", 0);
    });

    video = createCapture(VIDEO); //simpler if you don't need to pick between cameras

    video.size(dimension, (dimension * 3) / 4);
    video.hide();
    img = video;
    myMask = createGraphics(width, height);
    faceMesh.detectStart(video, gotFaces);
    //bodyPose.detectStart(video, gotPoses);
    let center = { x: width / 2, y: height / 2 };
    let tilt = 0;
}
function changeAge(what) {

    console.log(what.target.value);
    vecToImg("age", what.target.value);

}
function draw() {
    background(255);
    if (alterEgo) {
        image(video, 0, 0, width, height);
        push();
        //have to make alterego a graphics instead of an image.
        //imageMode(CENTER);
        //translate(alterEgo.width / 2, alterEgo.height / 2);
        ///rotate(headAngle);
        // 
        image(alterEgo, box.xMin, box.yMin, box.width, box.height, alterEgoBox.xMin, alterEgoBox.yMin, alterEgoBox.width, alterEgoBox.height);
        pop();
    } else if (img) {
        img.mask(myMask);
        // push(); // Save the current drawing state
        // translate(img.width, 0); // Move the origin to the right by the width of the image
        // scale(-1, 1); // Flip the image by scaling x by -1

        image(img, 0, 0, img.width, img.height);
        //pop(); // Restore the original drawing state
        // img.mask(myMask);
        // image(img, 0, 0, img.width, img.height);//dimension, (dimension * 3) / 4);

    }

    if (faces.length > 0 && mode == "live") {
        let p = faces[0];
        let faceWidth = p.box.width;
        let faceHeight = p.box.height;

        let xDiff = p.leftEye.centerX - p.rightEye.centerX;
        let yDiff = p.leftEye.centerY - p.rightEye.centerY;
        headAngle = Math.atan2(yDiff, xDiff);

        // let faceWidth = abs(p.left_ear.x - p.right_ear.x);
        center = { x: p.box.xMin + faceWidth / 2, y: p.box.yMin + faceHeight / 2 };
        box = p.box;
        let left = p.box.xMin - faceWidth / 2;
        let right = p.box.xMax + faceWidth / 2;
        let top = p.box.yMin - faceHeight / 2;
        let bottom = p.box.yMax + faceHeight / 2;
        justFace = createGraphics(faceWidth * 2, faceHeight * 2);
        justFace.image(video, 0, 0, faceWidth * 2.3, faceHeight * 2.3, left, top, faceWidth * 2, faceHeight * 2);
        faceRect = [left, top, right, bottom];
        //image(justFace, 0, 0);
        if (faces.length > 0) {

            myMask.clear();
            myMask.noStroke();
            myMask.fill(0, 0, 0, 255);//some nice alphaa in fourth number
            myMask.beginShape();
            // Note: API changed here to have the points in .keypoints
            for (var i = 0; i < faces[0].faceOval.keypoints.length; i++) {
                myMask.curveVertex(faces[0].faceOval.keypoints[i].x, faces[0].faceOval.keypoints[i].y);
            }
            myMask.endShape(CLOSE);
        }
    }
    //image(myMask, 0, 0)

}

async function vecToImg(direction, factor) {
    let postData = {
        latents: myLatents,
        direction: direction,
        factor: factor,
    };
    console.log(postData);
    let url = GPUServer + "latentsToImage/";

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

    loadImage(result.b64Image, function (newImage) {
        //"data:image/png;base64," +
        console.log("image loaded", newImage);
        //image(img, 0, 0);
        img = newImage;
    });
}
async function ask() {
    canvas.loadPixels();

    let imgBase64;
    if (justFace) {
        imgBase64 = justFace.canvas.toDataURL("image/jpeg", 1.0);
        console.log("justFace", justFace);
    } else {
        imgBase64 = canvas.elt.toDataURL("image/jpeg", 1.0);
        console.log("canvas", canvas);
    }
    imgBase64 = imgBase64.split(",")[1];
    let postData = {
        image: imgBase64,
        faceRect: faceRect,
    };

    let url = GPUServer + "locateImage/";
    const options = {
        headers: {
            "Content-Type": `application/json`,
        },
        method: "POST",
        body: JSON.stringify(postData), //p)
    };
    console.log("Asking for My Image ");
    const response = await fetch(url, options);
    //video.pause();
    //mode = "freeze";
    const result = await response.json();
    //console.log("result", result.latents);
    myLatents = result.latents;

    loadImage(result.b64Image, function (newImage) {
        //"data:image/png;base64," +
        //console.log("image loaded", newImage);
        //image(img, 0, 0);
        alterEgo = newImage;
        tries = 0;
        faceMesh.detect(newImage, gotAFace);

    });
}

function gotAFace(results) {
    if (tries > 10) {
        console.log("Too many tries");
        return;
    }
    tries++;
    if (results.length == 0) {
        console.log("No Face Found");
        faceMesh.detect(alterEgo, gotAFace);  // recursive risk?
        return;
    } else if (results[0].faceOval.width < 120 || results[0].faceOval.height < 120) {
        console.log("too small face found");
        faceMesh.detect(alterEgo, gotAFace);  // recursive risk?
        return
    }

    console.log("gotAFace", results);
    firstFace = results[0];
    alterEgoBox = firstFace.box;
    otherMask = createGraphics(alterEgo.width, alterEgo.height);
    otherMask.noStroke();
    otherMask.clear();
    otherMask.noStroke();
    otherMask.fill(0, 0, 0, 255);//some nice alphaa in fourth number
    otherMask.beginShape();
    // Note: API changed here to have the points in .keypoints
    for (var i = 0; i < firstFace.faceOval.keypoints.length; i++) {
        otherMask.curveVertex(firstFace.faceOval.keypoints[i].x, firstFace.faceOval.keypoints[i].y);

    }
    otherMask.endShape(CLOSE);
    alterEgo.mask(otherMask);
}
// Callback function for when bodyPose outputs data
function gotFaces(results) {
    // Save the output to the poses variable
    faces = results;

    // console.log(poses);
}
