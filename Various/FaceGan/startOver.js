let staticImage;
let maskGraphics;
let masked = false;
let video;
let people = [];

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
    // background(230, 30, 23, 255);
    //if (!masked) gradientMaskIt(staticImage);
    //image(staticImage, 0, 0);
    // gradientMaskIt(video);
    // image(video, 0, 0);
    for (let person of people) {
        person.drawMe();
    }
}

function bodyPoseVideoResults(poses) {
    background(255);

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
    const sR = maskGraphics.width / 4;
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
        this.underFrameRect = { left: 0, top: 0, width: 0, height: 0, cx: -9000, cy: -9000, headAngle: 0 };
        this.alterEgoFrameRect = null;
        this.lastUpdate = millis();
    }

    getCropMaskUnderImage(frameRect, incomingImage, poseNum) {
        this.lastUpdate = millis();
        this.underFrameRect = frameRect;
        this.underImage = incomingImage.get(frameRect.left, frameRect.top, frameRect.width, frameRect.height);
        this.underImage = gradientMaskIt(this.underImage);//better way to get an image from a p5.Graphics?
        this.poseNum = poseNum;
    }

    getCropMaskAlterEgoImage(frameRect, incomingImage) {
        this.alterEgoframeRect = frameRect;
        this.alterEgoImage = incomingImage.get(frameRect.left, frameRect.top, frameRect.width, frameRect.height);
        this.alterEgoImage = gradientMaskIt(this.alterEgoImage);//better way to get an image from a p5.Graphics?
    }

    isNotUpdating() {
        return (millis() - this.lastUpdate) > 1000;
    }

    drawMe() {

        if (this.alterEgoImage) {
            console.log("drawing alteregoperson");
            let alterEgoGraphics = createGraphics(this.alterEgoImage.width, this.alterEgoImage.width);
            //alterEgoGraphics.push();
            alterEgoGraphics.imageMode(CENTER);
            alterEgoGraphics.clear()
            //this.alterEgoGraphics.translate(this.faceRect.width * faceBorderFactor / 2, this.faceRect.width * faceBorderFactor / 2);
            alterEgoGraphics.translate(this.alterEgoGraphics.width / 2, this.alterEgoGraphics.height / 2);
            alterEgoGraphics.rotate(this.underFrameRect.headAngle);

            // this.alterEgoGraphics.tint(255, 210);
            alterEgoGraphics.image(this.alterEgoImage, 0, 0);
            image(this.alterEgoGraphics, this.alterEgoFrameRect.left, this.alterEgoFrameRect.top, this.alterEgoFrameRect.width, this.alterEgoFrameRect.height);
            alterEgoGraphics.remove();
        } else if (this.underImage) {
            console.log("drawing under person");
            image(this.underImage, this.underFrameRect.left, this.underFrameRect.top, this.underFrameRect.width, this.underFrameRect.height);
        }
        text(this.poseNum + "-P", this.underFrameRect.cx, this.underFrameRect.cy);
    }
}

