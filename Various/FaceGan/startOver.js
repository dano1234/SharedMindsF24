let staticImage;
let maskGraphics;
let masked = false;
let video;
let people = [];
let readyForRequest = true;
let whoseTurn = 0;
const GPUServer = "https://dano.ngrok.dev/";
let flipGraphics;


let bodyPoseOptions = {
    modelType: "MULTIPOSE_LIGHTNING", // "MULTIPOSE_LIGHTNING", "SINGLEPOSE_LIGHTNING", or "SINGLEPOSE_THUNDE"
    enableSmoothing: false,
    minPoseScore: 0.2,
    multiPoseMaxDimension: 256,
    enableTracking: false,
    trackerType: "boundingBox", // "keypoint" or "boundingBox"
    trackerConfig: {},
    modelUrl: undefined,
    flipped: false,
}

function preload() {
    staticImage = loadImage("trump2.png");
    bodyPose = ml5.bodyPose(bodyPoseOptions);

}

function setup() {
    createCanvas(640, 480);
    flipGraphics = createGraphics(width, height);
    video = createCapture(VIDEO);
    video.hide();
    bodyPose.detect(video, bodyPoseVideoResults);
}

function draw() {

    flipGraphics.background(255);
    flipGraphics.tint(255, 15);
    flipGraphics.image(video, 0, 0, width, height);
    //background(255, 255, 255, 50);
    flipGraphics.tint(255, 255);
    doTurnTaking();
    for (let person of people) {
        person.drawMe();
    }
    push();
    scale(-1, 1);
    image(flipGraphics, -width, 0);
    pop();
}

async function doTurnTaking() {
    if (readyForRequest && people.length > 0) {
        whoseTurn++;
        if (whoseTurn >= people.length) {
            whoseTurn = 0;
        }
        readyForRequest = false
        await people[whoseTurn].ask();
        readyForRequest = true;
    }
}


function bodyPoseVideoResults(poses) {

    //make a new person if there is a new person posing
    //console.log("poses", poses.length, "people", people.length);
    if (poses.length > people.length) {
        let person = new Person(null, "live");
        people.push(person);
    } else if (poses.length < people.length) {
        //remove a person if there has not been a pose for a while
        for (let i = people.length - 1; i > poses.length - 1; i--) {
            thisPerson = people[i];
            if (thisPerson.isNotUpdating()) {
                people.splice(i, 1);
            }
        }
    }
    matchPosesToPeople(poses);
    for (let i = people.length - 1; i > poses.length - 1; i--) {
        thisPerson = people[i];
        thisPerson.findClosestPerson(people, i);
    }
    bodyPose.detect(video, bodyPoseVideoResults);

}

function matchPosesToPeople(poses) {

    for (let person of people) {
        person.matched = false;
    }

    for (let poseNum = 0; poseNum < people.length; poseNum++) {
        let thisPose = poses[poseNum];
        if (!thisPose) continue;  //why is this neccessary?
        let thisFrameRect = getRect(thisPose);
        let closestPerson;
        let closestDistance = Infinity;

        for (let person of people) {
            //don't reuse a person
            if (person.matched) continue;
            fill(255, 0, 0);

            let distance = dist(person.underFrameRect.cx, person.underFrameRect.cy, thisPose.nose.x, thisPose.nose.y);
            if (distance < closestDistance) {
                closestPerson = person;
                closestDistance = distance;
            }
        }
        if (closestPerson) {
            //set this person as used
            closestPerson.matched = true;
            //console.log("closestPerson", closestPerson);
            closestPerson.getCropMaskUnderImage(thisFrameRect, video, poseNum);
        }
    }
}

function getRect(pose) {
    let rightEarX = pose.right_ear.x;
    let rightEarY = pose.right_ear.y;
    let leftEarX = pose.left_ear.x;
    let leftEarY = pose.left_ear.y;
    let centerX = pose.nose.x;
    let centerY = pose.nose.y;
    let wDiff = rightEarX - leftEarX;
    let hDiff = rightEarY - leftEarY;
    let faceWidth = int(Math.sqrt(wDiff * wDiff + hDiff * hDiff));

    let top = int(centerY - faceWidth / 2);
    let left = int(centerX - faceWidth / 2);
    let headAngle = Math.atan2(hDiff, wDiff) + PI;

    let faceRect = { left: left, top: top, width: faceWidth, height: faceWidth };
    //do I nee faceRect?  //maybe for inserting face into a face
    const border = faceWidth / 5;
    let frameRect = { border: border, faceRect: faceRect, left: left - border, top: top - border, width: faceWidth + border * 2, height: faceWidth + border * 2, cx: pose.nose.x, cy: pose.nose.y, headAngle: headAngle };
    return frameRect;
}

function gradientMaskIt(inputImg, outputImg) {
    outputImg = inputImg.get();
    maskGraphics = createGraphics(inputImg.width, inputImg.height);
    maskGraphics.noStroke();
    //maskGraphics.clear(0, 0, inputImg.width, inputImg.height);
    //maskGraphics.angleMode(DEGREES);

    const sX = maskGraphics.width / 2;
    const sY = maskGraphics.height / 2;
    const sR = maskGraphics.width / 5;
    const eX = maskGraphics.width / 2;
    const eY = maskGraphics.height / 2;
    const eR = maskGraphics.height / 2;
    const colorS = color(0, 0, 0, 255); //Start color
    const colorE = color(255, 255, 255, 0); //End color
    let gradient = maskGraphics.drawingContext.createRadialGradient(
        sX,
        sY,
        sR,
        eX,
        eY,
        eR
    );
    gradient.addColorStop(0, colorS);
    gradient.addColorStop(1, colorE);
    maskGraphics.drawingContext.fillStyle = gradient;
    //maskGraphics.ellipse(maskGraphics.width / 2, maskGraphics.height / 2, maskGraphics.width, maskGraphics.height);
    maskGraphics.ellipseMode(CENTER);
    maskGraphics.ellipse(maskGraphics.width / 2, maskGraphics.height / 2, maskGraphics.width - 50, maskGraphics.height + 50);
    // maskGraphics.stroke(0, 244, 0);
    maskGraphics.noStroke();
    //maskGraphics.rect(0, 0, maskGraphics.width, maskGraphics.height);
    outputImg.mask(maskGraphics);
    maskGraphics.remove();
    return outputImg;
}

class Person {
    constructor(image, type) {
        this.type = type;
        this.matched = false;
        this.underImage = image;
        this.alterEgoImage = null;
        this.imageWithoutMask = null;
        this.underFrameRect = { left: 0, top: 0, width: 0, height: 0, cx: -9000, cy: -9000, headAngle: 0 };
        this.alterEgoFrameRect = null;
        this.lastUpdate = millis();
        this.closestPerson = null;
    }

    getCropMaskUnderImage(frameRect, incomingImage, poseNum) {
        this.lastUpdate = millis();
        this.underFrameRect = frameRect;
        this.imageWithoutMask = incomingImage.get(frameRect.left, frameRect.top, frameRect.width, frameRect.height);
        this.underImage = gradientMaskIt(this.imageWithoutMask, this.underImage);//better way to get an image from a p5.Graphics?
        this.poseNum = poseNum;
    }

    async dealWithImageFromAI(newImage) {
        this.getCropMaskAlterEgoImage(null, newImage)
        // let thisPose = await bodyPose.detect(newImage, function (poses) {
        //     console.log("poses after inspecting return from AI", poses)
        //     if (poses.length > 0) {
        //         let thisFrameRect = getRect(poses[0]);
        //         console.log("got Frame Rect of image from AI", thisFrameRect)
        //         this.getCropMaskAlterEgoImage(thisFrameRect, newImage);
        //     } else {
        //         console.log("didn't find a bodyPos poses in the image from AI");
        //     }
        // });
    }

    getCropMaskAlterEgoImage(frameRect, incomingImage) {
        console.log("got image from AI", frameRect, incomingImage);
        //this.alterEgoFrameRect = frameRect;

        //this.alterEgoImage = incomingImage.get(frameRect.left, frameRect.top, frameRect.width, frameRect.height);
        //this.alterEgoImage = gradientMaskIt(this.alterEgoImage);//better way to get an image from a p5.Graphics?
        this.alterEgoImage = gradientMaskIt(incomingImage, this.alterEgoImage);//better way to get an image from a p5.Graphics?
    }

    isNotUpdating() {
        return (millis() - this.lastUpdate) > 1000;
    }

    async ask() {
        console.log("asking for person ");
        let imgBase64 = this.imageWithoutMask.canvas.toDataURL("image/jpeg", 1.0);
        imgBase64 = imgBase64.split(",")[1];
        let postData = {
            image: imgBase64,
            faceRect: this.frameRect,
        };

        let url = GPUServer + "locateImage/";
        const options = {
            headers: {
                "Content-Type": `application/json`,
            },
            method: "POST",
            body: JSON.stringify(postData), //p)
        };
        console.log("Locating My Image ");
        try {
            const response = await fetch(url, options);
            const result = await response.json();
            console.log("result", result);
            if (result.error) {
                console.log("Error", result.error);
                return;
            }
            let currentPerson = this;
            currentPerson.latents = result.latents;
            loadImage(result.b64Image, async function (newImage,) {
                currentPerson.dealWithImageFromAI(newImage);
            });
        } catch (e) {
            console.log("error locating face in AI");
        }
    }

    findClosestPerson(people, myIndex) {
        let closestPerson;
        let closestDistance = Infinity;
        for (let i = 0; i < people.length; i++) {
            if (i == myIndex) continue;
            let person = people[i];
            let distance = dist(this.underFrameRect.cx, this.underFrameRect.cy, person.underFrameRect.cx, person.underFrameRect.cy);
            if (distance < closestDistance) {
                closestPerson = person;
                closestDistance = distance;
            }
        }
        if (closestDistance < width / 3) {
            this.closestPerson = closestPerson;
        } else {
            this.closestPerson = null;
        }

    }

    drawMe() {

        if (this.alterEgoImage) {
            let alterEgoGraphics = createGraphics(this.alterEgoImage.width, this.alterEgoImage.width);
            //alterEgoGraphics.push();
            alterEgoGraphics.imageMode(CENTER);
            alterEgoGraphics.clear()
            //this.alterEgoGraphics.translate(this.faceRect.width * faceBorderFactor / 2, this.faceRect.width * faceBorderFactor / 2);
            alterEgoGraphics.translate(alterEgoGraphics.width / 2, alterEgoGraphics.height / 2);
            alterEgoGraphics.rotate(this.underFrameRect.headAngle);

            // this.alterEgoGraphics.tint(255, 210);
            alterEgoGraphics.image(this.alterEgoImage, 0, 0);
            let b = this.underFrameRect.border;
            flipGraphics.image(alterEgoGraphics, this.underFrameRect.left - b, this.underFrameRect.top - 2 * b, this.underFrameRect.width + 2 * b, this.underFrameRect.height + 2 * b);

            //image(alterEgoGraphics, this.alterEgoFrameRect.left, this.alterEgoFrameRect.top, this.alterEgoFrameRect.width, this.alterEgoFrameRect.height);
            alterEgoGraphics.remove();
        } else if (this.underImage) {
            //console.log("drawing under person");
            flipGraphics.image(this.underImage, this.underFrameRect.left, this.underFrameRect.top, this.underFrameRect.width, this.underFrameRect.height);
        }
        flipGraphics.textSize(72);
        flipGraphics.text(this.poseNum, this.underFrameRect.cx, this.underFrameRect.cy);

        if (this.closestPerson)
            flipGraphics.text(this.closestPerson.poseNum, this.underFrameRect.cx, this.underFrameRect.cy + 70);
        //flipGraphics.ellipse(this.underFrameRect.cx, this.underFrameRect.cy, 10, 10);
    }
}

