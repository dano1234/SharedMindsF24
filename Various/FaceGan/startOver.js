let staticImage;
let maskGraphics;
let masked = false;
let video;


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
    bodyPose.detectStart(video, bodyPoseResults);
}

function draw() {
    // background(230, 30, 23, 255);
    //if (!masked) gradientMaskIt(staticImage);
    //image(staticImage, 0, 0);
    // gradientMaskIt(video);
    // image(video, 0, 0);
}

function bodyPoseResults(poses) {

    if (poses.length > 0) {
        let pose = poses[0];
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
        // let xDiff = pose.left_eye.x / 2 - pose.right_eye.x / 2;
        // let yDiff = pose.left_eye.y / 2 - pose.right_eye.y / 2;
        this.headAngle = Math.atan2(wDiff, hDiff);
        this.center = { x: int(pose.nose.x), y: int(pose.nose.y) };

        faceRect = { left: left, top: top, width: faceWidth, height: faceWidth };
        //do I nee faceRect?  //maybe for inserting face into a face
        const border = faceWidth / 5;
        frameRect = { left: left - border, top: top - border, width: faceWidth + border * 2, height: faceWidth + border * 2 };
        g = createGraphics(frameRect.width, frameRect.width);

        g.image(
            video,
            0,
            0,
            frameRect.width,
            frameRect.height,
            frameRect.left,
            frameRect.top,
            frameRect.width,
            frameRect.height
        );
        background(255);
        //const outputImg = g.get();
        var outputImg = createImage(g.width, g.height);
        outputImg.copy(g, 0, 0, g.width, g.height, 0, 0, g.width, g.height);
        const maskGraphics = gradientMaskIt(outputImg);//better way to get an image from a p5.Graphics?
        outputImg.mask(maskGraphics);
        maskGraphics.remove();

        image(outputImg, frameRect.left, frameRect.top, frameRect.width, frameRect.height, 0, 0, outputImg.width, outputImg.height);
        g.remove();
        //image(maskGraphics, frameRect.left, frameRect.top, frameRect.width, frameRect.height);
        noFill();
        rect(frameRect.left, frameRect.top, frameRect.width, frameRect.height);

    }
    // bodyPose.detect(video, bodyPoseResults)

}

function gradientMaskIt(img) {

    maskGraphics = createGraphics(img.width, img.height);
    maskGraphics.noStroke();
    //maskGraphics.clear(0, 0, img.width, img.height);
    //maskGraphics.angleMode(DEGREES);

    const sX = maskGraphics.width / 2;
    const sY = maskGraphics.height / 2;
    const sR = maskGraphics.width / 10;
    const eX = maskGraphics.width / 2;
    const eY = maskGraphics.height / 2;
    const eR = maskGraphics.height / 2;
    const colorS = color(0, 0, 0, 255); //Start color
    const colorE = color(250, 255, 255, 0); //End color
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
    maskGraphics.stroke(0, 244, 0);
    maskGraphics.rect(0, 0, maskGraphics.width, maskGraphics.height);

    return maskGraphics;

}
