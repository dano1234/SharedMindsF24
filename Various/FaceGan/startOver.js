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
        console.log(faceWidth);


        g = createGraphics(faceWidth, faceWidth);
        let top = int(centerY - faceWidth / 2);
        let left = int(centerX - faceWidth / 2);
        // let xDiff = pose.left_eye.x / 2 - pose.right_eye.x / 2;
        // let yDiff = pose.left_eye.y / 2 - pose.right_eye.y / 2;
        this.headAngle = Math.atan2(wDiff, hDiff);
        this.center = { x: int(pose.nose.x), y: int(pose.nose.y) };

        faceRect = { left: left, top: top, width: faceWidth, height: faceWidth };
        //console.log(faceRect);
        const border = faceWidth / 5;
        frameRect = { left: left - border, top: top - border, width: faceWidth + border * 2, height: faceWidth + border * 2 };
        g.image(
            video,
            0,
            0,
            faceRect.width,
            faceRect.height,
            faceRect.left,
            faceRect.top,
            faceRect.width,
            faceRect.height
        );
        //gradientMaskIt(g.get());//better way to get an image from a p5.Graphics?
        background(255);
        image(g, left, top);
        noFill();
        rect(frameRect.left, frameRect.top, frameRect.width, frameRect.height);
        g.remove();

    }
    // bodyPose.detect(video, bodyPoseResults)

}

function gradientMaskIt(img) {
    maskGraphics = createGraphics(img.width, img.height);
    maskGraphics.clear(0, 0, img.width, img.height);
    maskGraphics.angleMode(DEGREES);
    maskGraphics.noStroke();
    const sX = img.width / 2;
    const sY = img.height / 2;
    const sR = img.width / 5;
    const eX = img.width / 2;
    const eY = img.height / 2;
    const eR = img.height / 2;
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
    maskGraphics.ellipse(img.width / 2, img.height / 2, img.width, img.height);
    img.mask(maskGraphics);
    // image(img,0,0);
    maskGraphics.remove();
    masked = true;
}
