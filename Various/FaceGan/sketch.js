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

const GPUServer = "https://dano.ngrok.dev/";

function mousePressed() {
    for (let i = 0; i < people.length; i++) {
        let p = people[i];
        if (mouseX > p.box.xMin && mouseX < p.box.xMax && mouseY > p.box.yMin && mouseY < p.box.yMax) {
            p.locateAlterEgo();
            currentPerson = p;
        }
    }
}


let options = { maxFaces: 2, refineLandmarks: false, flipHorizontal: false };
function preload() {
    // Load the faceMesh model
    faceMesh = ml5.faceMesh(options);
    otherPicture = loadImage("obama.png");
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
        if (results[i].keypoints.length < 5) continue;
        if (existingPeople.length == 0) {
            let newPerson = new Person();
            newPerson.updatePosition(results[i]);
            people.push(newPerson);
        } else {
            let closest = 100000;
            let closestIndex = -1;
            for (let j = 0; j < existingPeople.length; j++) {
                let thisIndex = existingPeople[j];
                let dist = Math.abs(people[thisIndex].center.x - results[i].box.xMin) + Math.abs(people[thisIndex].center.y - results[i].box.yMin);
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


class Person {

    constructor() {
        //this.liveMask = createGraphics(width, height);
        this.tries = 0;
        this.lastUpdate = millis();
    }

    updatePosition(liveResults) {
        this.lastUpdate = millis();

        let z = liveResults.keypoints[0].z;
        //console.log("z", z);
        this.box = liveResults.box;
        // this.box.xMin = this.box.xMin / 2;
        // this.box.xMax = this.box.xMax / 2;
        // this.box.yMin = this.box.yMin / 2;
        // this.box.yMax = this.box.yMax / 2;
        // this.box.width = this.box.width / 2;
        // this.box.height = this.box.height / 2;
        let faceWidth = this.box.width;
        let faceHeight = this.box.height;

        let xDiff = liveResults.leftEye.centerX / 2 - liveResults.rightEye.centerX / 2;
        let yDiff = liveResults.leftEye.centerY / 2 - liveResults.rightEye.centerY / 2;
        this.headAngle = Math.atan2(yDiff, xDiff);

        // let faceWidth = abs(p.left_ear.x - p.right_ear.x);
        this.center = { x: this.box.xMin + faceWidth / 2, y: this.box.yMin + faceHeight / 2 };

        let left = this.box.xMin - faceWidth / 2;
        let right = this.box.xMax + faceWidth / 2;
        let top = this.box.yMin - faceHeight / 2;
        let bottom = this.box.yMax + faceHeight / 2;
        this.justFace = createGraphics(faceWidth * 2, faceHeight * 2);
        this.justFace.image(imageForFaceMesh, 0, 0, faceWidth * 2.3, faceHeight * 2.3, left, top, faceWidth * 2, faceHeight * 2);
        this.faceRect = [left, top, right, bottom];
    }




    async locateAlterEgo() {
        let imgBase64 = this.justFace.canvas.toDataURL("image/jpeg", 1.0);
        imgBase64 = imgBase64.split(",")[1];
        let postData = {
            image: imgBase64,
            faceRect: this.faceRect,
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
        const result = await response.json();
        //console.log("result", result);
        if (result.error) {
            console.log("Error", result.error);
            return;
        }
        let currentPerson = this;

        // const newImage = new Image();
        // newImage.onload = function () {
        //     // Image is now loaded and can be usedd
        //     currentPerson.imageLoaded(newImage, result);
        // };
        // newImage.src = result.b64Image;
        currentPerson.latents = result.latents;
        loadImage(result.b64Image, function (newImage,) {
            currentPerson.imageLoaded(newImage, result);
        });
    }

    async vecToImg(direction, factor) {
        let postData = {
            latents: this.latents,
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

        let currentPerson = this;
        loadImage(result.b64Image, function (newImage,) {
            currentPerson.imageLoaded(newImage, result);
        });
    }

    imageLoaded(newImage, result) {
        //console.log("image loaded", newImage);
        // console.log("this during imageLoaded", this);
        let currentPerson = this;
        //this.alterEgoGraphics = createGraphics(newImage.width, newImage.height);
        //this.alterEgoGraphics.image(newImage, 0, 0);
        // Perform operations with newImage here

        //this.tries = 0;
        this.alterEgo = newImage;
        faceMesh.detect(newImage, function (results) {
            //console.log("detected face", currentPerson);
            currentPerson.getAlterEgoFaceRect(results);
        });
    }


    getAlterEgoFaceRect(results) {
        let currentPerson = this;

        if (this.tries > 20) {
            console.log("Too many tries");
            return;
        }
        currentPerson.tries++;
        if (results.length == 0) {
            console.log("No Face Found");
            faceMesh.detect(currentPerson.alterEgo, function (results) {
                //console.log("detected face", currentPerson);
                currentPerson.getAlterEgoFaceRect(results);
            });  // recursive risk?
            return;
        } else if (results[0].faceOval.width < 120 || results[0].faceOval.height < 120) {
            console.log("too small face found");
            faceMesh.detect(currentPerson.alterEgo, function (results) {
                //console.log("detected face", currentPerson);
                currentPerson.getAlterEgoFaceRect(results);
            });  // recursive risk?
            return
        }
        //let newImage = this.alterEgo;
        let firstFace = results[0];
        this.alterEgoBox = firstFace.box;
        //console.log("firstFace", firstFace);
        this.alterEgoMask = createGraphics(this.alterEgo.width, this.alterEgo.height);
        this.alterEgoMask.noStroke();
        this.alterEgoMask.clear();
        this.alterEgoMask.noStroke();
        this.alterEgoMask.fill(0, 0, 0, 255);//some nice alphaa in fourth number
        this.alterEgoMask.beginShape();
        // Note: API changed here to have the points in .keypoints
        for (var i = 0; i < firstFace.faceOval.keypoints.length; i++) {
            this.alterEgoMask.curveVertex(firstFace.faceOval.keypoints[i].x, firstFace.faceOval.keypoints[i].y);

        }
        this.alterEgoMask.endShape(CLOSE);

        this.alterEgoGraphics = createGraphics(this.alterEgo.width, this.alterEgo.height);
    }

    isGone() {
        return millis() - this.lastUpdate > 5000;
    }


    drawMe(number) {
        // console.log("headAngle", headAngle);
        //if (this.alterEgoCanvas) image(this.ctx, 0, 0);

        if (this.box) {
            if (this.alterEgo) {
                //console.log("drawing alter ego");
                this.alterEgoGraphics.push();
                this.alterEgo.mask(this.alterEgoMask);

                this.alterEgoGraphics.imageMode(CENTER);
                this.alterEgoGraphics.clear()
                this.alterEgoGraphics.translate(this.alterEgoGraphics.width / 2, this.alterEgoGraphics.height / 2);
                this.alterEgoGraphics.rotate(this.headAngle);
                this.alterEgoGraphics.tint(255, 230);
                this.alterEgoGraphics.image(this.alterEgo, 0, 0);;

                image(this.alterEgoGraphics, this.box.xMin, this.box.yMin, this.box.width, this.box.height, this.alterEgoBox.xMin, this.alterEgoBox.yMin, this.alterEgoBox.width, this.alterEgoBox.height);
                this.alterEgoGraphics.pop();
            }
            if (keyIsDown(SHIFT)) {
                rectMode(CORNER);
                fill(255, 0, 0)
                textSize(32);
                text("P " + number, this.box.xMin, this.box.yMin);
                noFill();
                rect(this.box.xMin, this.box.yMin, this.box.width, this.box.height);
            }
        }
    }

    // getLiveFaceRect(liveResults) {

    // }
}

function draw() {

    //background(255);
    // image(video, 0, 0, width, height);
    // image(otherPicture, 0, 0, 300, 300);
    imageForFaceMesh.image(video, 0, 0);
    imageForFaceMesh.image(otherPicture, 0, 0, 300, 300);
    image(imageForFaceMesh, 0, 0);
    for (let i = 0; i < people.length; i++) {
        people[i].drawMe(i);
    }
    // for (let i = people.length - 1; i > -1; i--) {
    //     if (people[i].isGone()) {
    //         people.splice(i, 1);
    //         console.log("removing person", i);
    //     }
    // }
    if (betweenImage) {
        image(betweenImage, 0, width / 2);
    }

}

async function askBetween() {
    let postData = {
        v1: people[0].latents,
        v2: people[1].latents,
        percent: 0.5,
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

function setup() {


    canvas = createCanvas(dimension, (dimension * 3) / 4);
    imageForFaceMesh = createGraphics(dimension, (dimension * 3) / 4);
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



    // button = createButton("Find Me");
    // button.mousePressed(function () {
    //     people[0].locateAlterEgo();
    // });
    // button.position(530, 40);
    // button = createButton("Live Video");
    // button.mousePressed(function () {
    //     video.play();
    //     mode = "live";
    //     img = video;
    // });
    // themButton = createButton("Find Them");
    // themButton.mousePressed(function () {
    //     people[1].locateAlterEgo();
    // });
    // themButton.position(530, 70);

    betweenButton = createButton("Between Them");
    betweenButton.mousePressed(function () {
        askBetween();
    });
    betweenButton.position(530, 70);

    // button.position(530, 70);
    // let vecToImgButton = createButton("VecToImg");
    // vecToImgButton.position(530, 100);
    // vecToImgButton.mousePressed(function () {
    //     vecToImg("none", 0);
    // });
    pixelDensity(1)
    video = createCapture(VIDEO); //simpler if you don't need to pick between cameras

    video.size(dimension, dimension * 3 / 4);
    video.hide();
    img = video;
    //myMask = createGraphics(width, height);
    faceMesh.detectStart(imageForFaceMesh.canvas, gotFaces);

    // faceMesh.detect(imageForFaceMesh.canvas, gotFaces)
    //console.log("canvas", canvas);
    //bodyPose.detectStart(video, gotPoses);
    //let center = { x: width / 2, y: height / 2 };
    //let tilt = 0;
    // setTimeout(function () { ask(); }, 3000);
}


// function changeAge(what) {
//     console.log(what.target.value);
//     currentPerson.vecToImg("age", what.target.value);

//}

// this.liveMask.clear();
// this.liveMask.noStroke();
// this.liveMask.fill(0, 0, 0, 255);//some nice alphaa in fourth number
// this.liveMask.beginShape();
// // Note: API changed here to have the points in .keypoints
// for (var i = 0; i < results.faceOval.keypoints.length; i++) {
//     this.liveMask.curveVertex(results.faceOval.keypoints[i].x, results.faceOval.keypoints[i].y);
// }
// this.liveMask.endShape(CLOSE);
//this.getLiveFaceRect(results)

// poseSlider = createSlider(-5, 5, 0);
// poseSlider.position(0, (dimension * 3) / 4 + 60); // x and y
// poseSlider.size(400, 20); // width and height
// poseSlider.changed(function (what) {
//     vecToImg("pose", what.target.value);
// });

//live mask
//alter ego
//alter ego mask


// this.alterEgoCanvas = document.createElement('canvas');
// this.alterEgoCanvas.width = newImage.width;
// this.alterEgoCanvas.height = newImage.height;
// this.ctx = this.alterEgoCanvas.getContext('2d');
// this.ctx.fillStyle = 'white';
// this.ctx.save();
// this.ctx.clearRect(0, 0, this.alterEgoCanvas.width, this.alterEgoCanvas.height);
// this.ctx.fillStyle = 'black';


// this.ctx.beginPath();
// this.ctx.arc(this.alterEgoCanvas.width / 2, this.alterEgoCanvas.height / 2, 70, 0, 2 * Math.PI);
// this.ctx.stroke();
// Clear the canvas
//this.ctx.clearRect(0, 0, canvas.width, canvas.height);

// Set fill style
//ctx.fillStyle = 'rgba(0, 0, 0, 1)'; // Equivalent to fill(0, 0, 0, 255) in p5.js

// Begin path
// this.ctx.beginPath();

// // Draw vertices
// const keypoints = results[0].faceOval.keypoints;
// if (keypoints.length > 0) {
//     this.ctx.moveTo(keypoints[0].x, keypoints[0].y);
//     for (let i = 1; i < keypoints.length; i++) {
//         this.ctx.lineTo(keypoints[i].x, keypoints[i].y);
//     }
// }

// // Close path and fill
// this.ctx.closePath();
// this.ctx.fill();
// this.ctx.clip();
// this.ctx.drawImage(newImage, 0, 0, this.alterEgoCanvas.width, this.alterEgoCanvas.height);
// this.ctx.restore();

//}
//let inputBox;

//let canvas;
////let img;
//let myLatents;
//let theirLatents;
//let bodyPose;
//let faceMesh;
//let faces = [];
//let faceRect = [0, 0, dimension, (dimension * 3) / 4];
//let justFace;
//let mode = "live";

////let myMask;
//let alterEgo;
//let center;
//let tilt;
//let box;
//let alterEgoBox;
//let alterEgoGraphics;
//let headAngle;
//let tries = 0;
//let askingMode = false;

// function preload() {
//     // Load the bodyPose model
//     bodyPose = ml5.bodyPose();
// }
// function olddraw() {
//     background(255);
//     image(video, 0, 0, width, height);
//     if (alterEgo) {

//         // alterEgoGraphics.push();
//         //have to make alterego a graphics instead of an image.
//         //imageMode(CENTER);
//         //translate(alterEgo.width / 2, alterEgo.height / 2);
//         ///rotate(headAngle);
//         //
//         // console.log("headAngle", headAngle);
//         alterEgo.mask(alterEgoMask);
//         alterEgoGraphics = createGraphics(alterEgo.width, alterEgo.height);
//         alterEgoGraphics.imageMode(CENTER);
//         alterEgoGraphics.translate(alterEgo.width / 2, alterEgo.height / 2);
//         alterEgoGraphics.rotate(headAngle);
//         alterEgoGraphics.tint(255, 230);
//         alterEgoGraphics.image(alterEgo, 0, 0);
//         //alterEgoGraphics.pop();

//         image(alterEgoGraphics, box.xMin, box.yMin, box.width, box.height, alterEgoBox.xMin, alterEgoBox.yMin, alterEgoBox.width, alterEgoBox.height);

//     } else if (img) {
//         img.mask(myMask);
//         // push(); // Save the current drawing state
//         // translate(img.width, 0); // Move the origin to the right by the width of the image
//         // scale(-1, 1); // Flip the image by scaling x by -1

//         image(img, 0, 0, img.width, img.height);
//         //pop(); // Restore the original drawing state
//         // img.mask(myMask);
//         // image(img, 0, 0, img.width, img.height);//dimension, (dimension * 3) / 4);

//     }

// if (faces.length > 0 && mode == "live") {
//     let p = faces[0];
//     let z = p.keypoints[0].z;
//     console.log("z", z);
//     let faceWidth = p.box.width;
//     let faceHeight = p.box.height;

//     let xDiff = p.leftEye.centerX - p.rightEye.centerX;
//     let yDiff = p.leftEye.centerY - p.rightEye.centerY;
//     headAngle = Math.atan2(yDiff, xDiff);

//     // let faceWidth = abs(p.left_ear.x - p.right_ear.x);
//     center = { x: p.box.xMin + faceWidth / 2, y: p.box.yMin + faceHeight / 2 };
//     box = p.box;
//     let left = p.box.xMin - faceWidth / 2;
//     let right = p.box.xMax + faceWidth / 2;
//     let top = p.box.yMin - faceHeight / 2;
//     let bottom = p.box.yMax + faceHeight / 2;
//     justFace = createGraphics(faceWidth * 2, faceHeight * 2);
//     justFace.image(video, 0, 0, faceWidth * 2.3, faceHeight * 2.3, left, top, faceWidth * 2, faceHeight * 2);
//     faceRect = [left, top, right, bottom];
//     //image(justFace, 0, 0);
//     if (faces.length > 0) {

//         //             myMask.clear();
//         //             myMask.noStroke();
//         //             myMask.fill(0, 0, 0, 255);//some nice alphaa in fourth number
//         //             myMask.beginShape();
//         //             // Note: API changed here to have the points in .keypoints
//         //             for (var i = 0; i < faces[0].faceOval.keypoints.length; i++) {
//         //                 myMask.curveVertex(faces[0].faceOval.keypoints[i].x, faces[0].faceOval.keypoints[i].y);
//         //             }
//         //             myMask.endShape(CLOSE);
//         //         }
//         //     }
//         //     //image(myMask, 0, 0)

//         // }

//         async function vecToImg(direction, factor) {
//             let postData = {
//                 latents: myLatents,
//                 direction: direction,
//                 factor: factor,
//             };
//             console.log(postData);
//             let url = GPUServer + "latentsToImage/";

//             //     const options = {
//             //         headers: {
//             //             "Content-Type": `application/json`,
//             //         },
//             //         method: "POST",
//             //         body: JSON.stringify(postData), //p)
//             //     };
//             //     console.log("Asking for Picture from Latents ", options);
//             //     const response = await fetch(url, options);
//             //     const result = await response.json();
//             //     console.log("result", result);

//             loadImage(result.b64Image, function (newImage) {
//                 //"data:image/png;base64," +
//                 console.log("image loaded", newImage);
//                 //image(img, 0, 0);
//                 img = newImage;
//             });
//         }
//         async function ask() {
//             askingMode = true;
//             canvas.loadPixels();

//             //     let imgBase64;

//             //     if (justFace) {
//             //         if (who == "them") {
//             //             getFace(1);
//             //         }
//             //         imgBase64 = justFace.canvas.toDataURL("image/jpeg", 1.0);
//             //         console.log("justFace", justFace);
//             //     } else {
//             //         imgBase64 = canvas.elt.toDataURL("image/jpeg", 1.0);
//             //         console.log("canvas", canvas);
//             //     }
//             //     imgBase64 = imgBase64.split(",")[1];
//             //     let postData = {
//             //         image: imgBase64,
//             //         faceRect: faceRect,
//             //     };

//             let url = GPUServer + "locateImage/";
//             const options = {
//                 headers: {
//                     "Content-Type": `application/json`,
//                 },
//                 method: "POST",
//                 body: JSON.stringify(postData), //p)
//             };
//             console.log("Asking for My Image ");
//             const response = await fetch(url, options);
//             //video.pause();
//             //mode = "freeze";
//             const result = await response.json();
//             //console.log("result", result.latents);
//             myLatents = result.latents;
//             // Replace the loadImage call with vanilla JavaScript
//             // const newImage = new Image();
//             // newImage.onload = function () {
//             //     // Image is now loaded and can be used
//             //     console.log("image loaded", newImage);
//             //     // Perform operations with newImage here
//             //     alterEgo = newImage;
//             //     tries = 0;
//             //     // Assuming faceMesh.detect is a function that needs an HTMLImageElement
//             //     faceMesh.detect(newImage, gotAFace);
//             // };
//             // newImage.src = result.b64Image;
//             loadImage(result.b64Image, function (newImage) {
//                 //"data:image/png;base64," +
//                 //console.log("image loaded", newImage);
//                 //image(img, 0, 0);
//                 alterEgo = newImage;
//                 tries = 0;
//                 faceMesh.detect(newImage, gotAFace);

//                 // alterEgoGraphics.clear();
//                 // alterEgoGraphics.noStroke();
//                 // alterEgoGraphics.fill(0, 0, 0, 255);//some nice alphaa in fourth number
//                 askingMode = false;
//                 setTimeout(function () {
//                     ask();
//                 }, 1000);
//             });
//         }

// function gotAFace(results) {

//     if (this.tries > 10) {
//         console.log("Too many tries");
//         return;
//     }
//     this.tries++;
//     if (results.length == 0) {
//         console.log("No Face Found");
//         faceMesh.detect(alterEgo, gotAFace);  // recursive risk?
//         return;
//     } else if (results[0].faceOval.width < 120 || results[0].faceOval.height < 120) {
//         console.log("too small face found");
//         faceMesh.detect(alterEgo, gotAFace);  // recursive risk?
//         return
//     }
//     let firstFace = results[0];
//     alterEgoBox = firstFace.box;
//     console.log("firstFace", firstFace);
//     alterEgoMask = createGraphics(alterEgo.width, alterEgo.height);
//     alterEgoMask.noStroke();
//     alterEgoMask.clear();
//     alterEgoMask.noStroke();
//     alterEgoMask.fill(0, 0, 0, 255);//some nice alphaa in fourth number
//     alterEgoMask.beginShape();
//     // Note: API changed here to have the points in .keypoints
//     for (var i = 0; i < firstFace.faceOval.keypoints.length; i++) {
//         alterEgoMask.curveVertex(firstFace.faceOval.keypoints[i].x, firstFace.faceOval.keypoints[i].y);

//     }
//     alterEgoMask.endShape(CLOSE);

// }

