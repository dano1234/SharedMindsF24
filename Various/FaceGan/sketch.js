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
let busyAsking = false;
let bodySegmentation;
let pos = 0;
const waitingMessage = "Finding You In AI..."


let bodyPoseOptions = {
    modelType: "MULTIPOSE_LIGHTNING", // "MULTIPOSE_LIGHTNING", "SINGLEPOSE_LIGHTNING", or "SINGLEPOSE_THUNDE"
    enableSmoothing: true,
    minPoseScore: 0.25,
    multiPoseMaxDimension: 256,
    enableTracking: true,
    trackerType: "boundingBox", // "keypoint" or "boundingBox"
    trackerConfig: {},
    modelUrl: undefined,
    flipped: false,
}

let bodyPixOptions = {
    maskType: "parts",
    flipped: false,
}

//let options = { maxFaces: 1, refineLandmarks: false, flipHorizontal: false };
function preload() {
    // Load the faceMesh model
    //faceMesh = ml5.faceMesh(options);
    bodySegmentation = ml5.bodySegmentation("BodyPix", bodyPixOptions);
    bodyPose = ml5.bodyPose(bodyPoseOptions);
    harrisPic = loadImage("harris.png");
    trumpPic = loadImage("trump2.png");
}



function setup() {
    canvas = createCanvas(dimension, (dimension * 3) / 4);
    //imageForFaceMesh = createGraphics(dimension, (dimension * 3) / 4);
    // ageSlider = createSlider(-5, 5, 0);
    // ageSlider.position(0, (dimension * 3) / 4); // x and y
    // ageSlider.size(400, 20); // width and height
    // ageSlider.changed(function (what) {
    //     currentPerson.vecToImg("age", what.target.value);
    // });

    // smileSlider = createSlider(-5, 5, 0);
    // smileSlider.position(0, (dimension * 3) / 4 + 30); // x and y
    // smileSlider.size(400, 20); // width and height
    // smileSlider.changed(function (what) {
    //     currentPerson.vecToImg("smile", what.target.value);
    // });
    trump = new Person(trumpPic, width - 200, height / 2)
    harris = new Person(harrisPic, -100, height / 2)
    trump.locateAlterEgo();
    harris.locateAlterEgo();
    fakePeople.push(trump);
    fakePeople.push(harris);


    pixelDensity(1)
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
    //image(video, 0, 0);
    background(255);
    let numberOfPeople = people.length;

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

    for (let i = 0; i < people.length; i++) {
        people[i].drawMe(i);
    }

    if (people.length == 1) {
        let xDiff = people[0].center.x - trump.center.x;
        let yDiff = people[0].center.y - trump.center.y;
        let trumpDist = int(Math.sqrt(xDiff * xDiff + yDiff * yDiff)) //- (width / 10) / 2;
        xDiff = people[0].center.x - harris.center.x;
        yDiff = people[0].center.y - harris.center.y;
        let harrisDist = int(Math.sqrt(xDiff * xDiff + yDiff * yDiff)) // - (width / 10) / 2;


        // console.log("trumpDist", trumpDist, "harrisDist", harrisDist);
        // if (trumpLeanLevel < harrisLeanLevel) {
        //     if (!busyAsking) {
        //         let percent = trumpLeanLevel / (width / 2)
        //         console.log("asking for trump", percent);
        //         //askBetween(people[0], trump, percent);
        //     }
        // }
        // let harrisChanged = harris.setLean(harrisLeanLevel);
        // if (harrisChanged) {
        //     askBetween(people[0], harris, harrisLeanLevel / 10);
        // }

        // let trumpChanged = trump.setLean(trumpLeanLevel);
        // if (trumpChanged) {
        //     askBetween(people[0], trump, trumpLeanLevel / 10);
        // }
        //console.log(trump.center.x, harris.center.x, "trumpLean", trumpLeanLevel, "harrisLean", harrisLeanLevel);
    }
    //textSize(15);
    //fill(0);
    //text("Number of People: " + numberOfPeople, 30, 30);
    // if (betweenImage) {
    //     image(betweenImage, 0, 0, 160, 120);
    // }
}

function mousePressed() {
    for (let i = 0; i < people.length; i++) {
        let p = people[i];
        if (mouseX > p.frameRect.left && mouseX < p.frameRect.left + p.frameRect.width && mouseY > p.frameRect.top && mouseY < p.frameRect.top + p.frameRect.height) {
            p.locateAlterEgo();
            currentPerson = p;
        }
    }
}

function keyPressed() {
    if (keyCode === LEFT_ARROW) {
        pos--;
    } else if (keyCode === RIGHT_ARROW) {
        pos++;
    }
    pos = constrain(pos, -10, 10);

    let percent = Math.abs(pos / 10);
    console.log("asking for percent", percent);
    if (pos > 0) {
        askBetween(people[0], trump, percent);
    } else if (pos < 0) {
        askBetween(people[0], harris, percent);
    }
}



// Callback function for when bodyPose outputs data
async function gotFaces(results) {

    // Save the output to the poses variable
    poses = results;
    let existingPeople = [];
    for (let i = 0; i < people.length; i++) {
        existingPeople.push(i);
    }
    for (let i = 0; i < results.length; i++) {
        //if (results[i].keypoints.length < 5) continue;
        if (existingPeople.length == 0) {
            let newPerson = new Person();

            people.push(newPerson);
            newPerson.getMaskAndRect(results[i], video, "bottom");


        } else {
            let closest = 100000;
            let closestIndex = -1;
            for (let j = 0; j < existingPeople.length; j++) {
                let thisIndex = existingPeople[j];

                let dist = Math.sqrt((people[thisIndex].center.x - results[i].nose.x) ** 2 + (people[thisIndex].center.y - results[i].nose.y) ** 2);
                // (people[thisIndex].center.x, people[thisIndex].center.y, results[i].box.xMin + (results[i].box.xMax - results[i].box.xMin) / 2, results[i].box.yMin + (results[i].box.yMax - results[i].box.yMin) / 2);
                if (dist < closest) {
                    closest = dist;
                    closestIndex = thisIndex;
                }
            }
            people[closestIndex].getMaskAndRect(results[i], video, "bottom");
            existingPeople.splice(closestIndex, 1);
        }
    }



    //faceMesh.detect(imageForFaceMesh.canvas, gotFaces)
    //bodyPose.detect(video, gotFaces);
}


async function askBetween(person1, person2, amount) {
    busyAsking = true;
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
        people[0].alterEgoImage = betweenImage;

        console.log("got pose in image load of b64 returned as alter ego");
        currentPerson.getMaskAndRect(null, newImage, "top");
        busyAsking = false;
    });
}



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

// //background(255);
// image(video, 0, 0, width, height);
// // image(otherPicture, 0, 0, 300, 300);
// // imageForFaceMesh.image(video, 0, 0);


// if (people.length == 1) {
//     //   console.log("asking for person 1");
//     // push();
//     //imageMode(CENTER);
//     //imageForFaceMesh.image(trumpPic, width - trump.width / 2, height / 2, 300, 300);
//     //imageForFaceMesh.image(harrisPic, 0, height / 2, 300, 300);
//     // pop();
// }
// //image(imageForFaceMesh, 0, 0);
// for (let i = 0; i < people.length; i++) {
//     people[i].drawMe(i);
// }

// // if (people.length == 1) {
// //     let xDiff = people[0].center.x - trump.center.x;
// //     let yDiff = people[0].center.y - trump.center.y;
// //     let trumpLeanLevel = int(Math.sqrt(xDiff * xDiff + yDiff) / (width / 10))// - (width / 10) / 2;
// //     xDiff = people[0].center.x - harris.center.x;
// //     yDiff = people[0].center.y - harris.center.y;
// //     let harrisLeanLevel = int(Math.sqrt(xDiff * xDiff + yDiff) / (width / 10))// - (width / 10) / 2;
// //     let harrisChanged = harris.setLean(harrisLeanLevel);
// //     if (harrisChanged) {
// //         askBetween(people[0], harris, harrisLeanLevel / 10);
// //     }

// //     let trumpChanged = trump.setLean(trumpLeanLevel);
// //     if (trumpChanged) {
// //         askBetween(people[0], trump, trumpLeanLevel / 10);
// //     }
// //     console.log("trumpLean", trumpLeanLevel, "harrisLean", harrisLeanLevel);
// // }

// if (betweenImage) {
//     image(betweenImage, 0, 0, 160, 120);
// }




// // Draw all the tracked landmark points
// for (let i = 0; i < poses.length; i++) {
//     let pose = poses[i];
//     let rightEarX = pose.right_ear.x;
//     let rightEarY = pose.right_ear.y;
//     let leftEarX = pose.left_ear.x;
//     let leftEarY = pose.left_ear.y;
//     let centerX = pose.nose.x;
//     let centerY = pose.nose.y;
//     let earWidth = int(leftEarX - rightEarX);
//     g = createGraphics(earWidth * 2, earWidth * 2);

//     let top = int(centerY - earWidth);
//     let left = int(centerX - earWidth);
//     noFill();
//     stroke(255, 0, 255);
//     rect(left, top, earWidth * 2, earWidth * 2);
//     g.image(
//         video,
//         0,
//         0,
//         earWidth * 2,
//         earWidth * 2,
//         left,
//         top,
//         earWidth * 2,
//         earWidth * 2
//     );
//     image(g, 0, 0);
//     // for (let j = 0; j < pose.keypoints.length; j++) {
//     //     let keypoint = pose.keypoints[j];
//     //     // Only draw a circle if the keypoint's confidence is bigger than 0.1
//     //     if (keypoint.confidence > 0.1) {
//     //         fill(0, 255, 0);
//     //         //noStroke();
//     //         ellipse(keypoint.x, keypoint.y, 10, 10);
//     //     }
//     // }
//     let segmentation = await bodySegmentation.detect(g);
//     if (segmentation) {
//         let faceMask = createGraphics(earWidth * 2, earWidth * 2);
//         let faceRect = { left: width, top: height, right: 0, bottom: 0 };
//         //image(segmentation.mask, 0, 0, width, height);
//         faceMask.clear();
//         faceMask.loadPixels();
//         for (let i = 0; i < segmentation.data.length; i++) {
//             if (segmentation.data[i] == 1 || segmentation.data[i] == 0) {
//                 faceMask.pixels[i * 4] = 0;
//                 faceMask.pixels[i * 4 + 1] = 0;
//                 faceMask.pixels[i * 4 + 2] = 0;
//                 faceMask.pixels[i * 4 + 3] = 255;
//                 let x = i % faceMask.width;
//                 let y = int(i / faceMask.width);
//                 if (x > faceRect.right) faceRect.right = x;
//                 if (y > faceRect.bottom) faceRect.bottom = y;
//                 if (x < faceRect.left) faceRect.left = x;
//                 if (y < faceRect.top) faceRect.top = y;
//             }
//         }

//         stroke(0, 255, 0);
//         noFill();
//         rect(faceRect.left + left, faceRect.top + top, faceRect.right - faceRect.left, faceRect.bottom - faceRect.top);
//         console.log("faceRect", faceRect);
//         //faceMask.updatePixels();
//         image(faceMask, left, top);
//     }





// if (people.length == 1) {

// }

// for (let i = 0; i < fakePeople.length; i++) {
//     fakePeople[i].drawMe(i);

// }