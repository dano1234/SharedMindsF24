let staticImage;
let maskGraphics;
let masked = false;
let video;
let people = [];
let readyForRequest = true;
let whoseTurn = 0;
const GPUServer = "https://dano.ngrok.dev/";

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

function preload() {
    staticImage = loadImage("trump2.png");
    bodyPose = ml5.bodyPose(bodyPoseOptions);

}

function setup() {
    createCanvas(640, 480);
    video = createCapture(VIDEO);
    video.hide();
    bodyPose.detectStart(video, bodyPoseVideoResults);
}

function draw() {
    doTurnTaking();
    for (let person of people) {
        person.drawMe();
    }
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
    background(255, 255, 255, 50);

    //make a new person if there is a new person posing
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

    for (let person of people) {
        person.matched = false;
    }

    for (let poseNum = poses.length - 1; poseNum > -1; poseNum--) {
        let thisPose = poses[poseNum];
        let thisFrameRect = getRect(thisPose);
        let closestPerson;
        let closestDistance = Infinity;

        for (let person of people) {
            //don't reuse a person
            if (person.matched) continue;
            let distance = dist(person.underFrameRect.cx, person.underFrameRect.cy, thisFrameRect.cx, thisFrameRect.cy);
            if (distance < closestDistance) {
                closestPerson = person;
                closestDistance = distance;
            }
        }
        //set this person as used
        closestPerson.matched = true;
        //console.log("closestPerson", closestPerson);
        closestPerson.getCropMaskUnderImage(thisFrameRect, video, poseNum);
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
    let headAngle = Math.atan2(wDiff, hDiff);

    faceRect = { left: left, top: top, width: faceWidth, height: faceWidth };
    //do I nee faceRect?  //maybe for inserting face into a face
    const border = faceWidth / 5;
    frameRect = { left: left - border, top: top - border, width: faceWidth + border * 2, height: faceWidth + border * 2, cx: pose.nose.x, cy: pose.nose.y, headAngle: headAngle };
    return frameRect;
}

function gradientMaskIt(img) {
    maskGraphics = createGraphics(img.width, img.height);
    maskGraphics.noStroke();
    //maskGraphics.clear(0, 0, img.width, img.height);
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
    img.mask(maskGraphics);
    maskGraphics.remove();
    return img;
}

class Person {
    constructor(image, type) {
        this.type = type;
        this.matched = false;
        this.underImage = image;
        this.alterEgoImage = null;
        this.imageForAI = null;
        this.underFrameRect = { left: 0, top: 0, width: 0, height: 0, cx: -9000, cy: -9000, headAngle: 0 };
        this.alterEgoFrameRect = null;
        this.lastUpdate = millis();
    }

    getCropMaskUnderImage(frameRect, incomingImage, poseNum) {
        this.lastUpdate = millis();
        this.underFrameRect = frameRect;
        this.imageForAI = incomingImage.get(frameRect.left, frameRect.top, frameRect.width, frameRect.height);
        this.underImage = gradientMaskIt(this.imageForAI);//better way to get an image from a p5.Graphics?
        this.poseNum = poseNum;
    }

    dealWithImageFromAI(newImage) {
        let thisPose = bodyPose.detect(newImage, function (poses) {
            console.log("poses after inspecting return from AI", poses)
            if (poses.length > 0) {
                let thisFrameRect = getRect(poses[0]);
                console.log("got Frame Rect of image from AI", thisFrameRect)
                currentPerson.getCropMaskAlterEgoImage(thisFrameRect, newImage);
            } else {
                console.log("didn't find a bodyPos poses in the image from AI");
            }
        });
    }

    getCropMaskAlterEgoImage(frameRect, incomingImage) {
        this.alterEgoFrameRect = frameRect;
        this.alterEgoImage = incomingImage.get(frameRect.left, frameRect.top, frameRect.width, frameRect.height);
        this.alterEgoImage = gradientMaskIt(this.alterEgoImage);//better way to get an image from a p5.Graphics?
    }

    isNotUpdating() {
        return (millis() - this.lastUpdate) > 1000;
    }

    async ask() {
        console.log("asking for person ");
        let imgBase64 = this.imageForAI.canvas.toDataURL("image/jpeg", 1.0);
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
            currentPerson.alterEgoImage = newImage;
            dealWithImageFromAI(newImage);
        });
    }

    drawMe() {

        if (this.alterEgoImage) {
            console.log("drawing alteregoperson");
            let alterEgoGraphics = createGraphics(this.alterEgoImage.width, this.alterEgoImage.width);
            //alterEgoGraphics.push();
            alterEgoGraphics.imageMode(CENTER);
            alterEgoGraphics.clear()
            //this.alterEgoGraphics.translate(this.faceRect.width * faceBorderFactor / 2, this.faceRect.width * faceBorderFactor / 2);
            alterEgoGraphics.translate(alterEgoGraphics.width / 2, alterEgoGraphics.height / 2);
            alterEgoGraphics.rotate(this.underFrameRect.headAngle);

            // this.alterEgoGraphics.tint(255, 210);
            alterEgoGraphics.image(this.alterEgoImage, 0, 0);
            image(alterEgoGraphics, this.alterEgoFrameRect.left, this.alterEgoFrameRect.top, this.alterEgoFrameRect.width, this.alterEgoFrameRect.height);
            alterEgoGraphics.remove();
        } else if (this.underImage) {
            //console.log("drawing under person");
            image(this.underImage, this.underFrameRect.left, this.underFrameRect.top, this.underFrameRect.width, this.underFrameRect.height);
        }
        text(this.poseNum + "-P", this.underFrameRect.cx, this.underFrameRect.cy);
    }
}

