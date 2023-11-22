let myVideo, myMask;
let facemesh;
let outline;
let headAngle = 0;

function initFace() {

    myMask = createGraphics(width, height); //this is for the setting the alpha layer around face
    myMask.fill(0, 0, 0, 255); //opaque to start
    myMask.rect(0, 0, width, height);


    let captureConstraints = allowCameraSelection(myCanvas.width, myCanvas.height);
    myVideo = createCapture(captureConstraints);

    //below is simpler if you don't need to select Camera because default is okay
    //myVideo = createCapture(VIDEO);
    // myVideo.size(myCanvas.width, myCanvas.height);
    myVideo.elt.muted = true;
    myVideo.hide()

    facemesh = ml5.facemesh(myVideo, function () {
        progress = "ML model loaded";
        console.log('face mesh model ready!')
    });
    facemesh.on("predict", gotFaceResults);

}

function gotFaceResults(results) {
    if (results && results.length > 0) {
        progress = "";
        //  console.log(results[0]);
        //DRAW THE ALPHA MASK FROM THE OUTLINE OF MASK

        outline = results[0].annotations.silhouette;
        myMask.clear();
        myMask.noStroke();
        myMask.fill(0, 0, 0, 255);//some nice alphaa in fourth number
        myMask.beginShape();
        for (var i = 0; i < outline.length - 1; i++) {
            myMask.curveVertex(outline[i][0], outline[i][1]);

        }
        myMask.endShape(CLOSE);
        //Get the angle between eyes
        let xDiff = results[0].annotations.leftEyeLower0[0][0] - results[0].annotations.rightEyeLower0[0][0];
        let yDiff = results[0].annotations.leftEyeLower0[0][1] - results[0].annotations.rightEyeLower0[0][1]
        headAngle = Math.atan2(yDiff, xDiff);
        headAngle = THREE.Math.radToDeg(headAngle);
        //console.log(headAngle);
        if (headAngle > 10) {
            //angleOnCircle -= 0.05;
            //positionOnCircle(angleOnCircle, myAvatarObj);
            lon += 0.5;
            computeCameraOrientation();
            let dataToSend = { "angleOnCircle": angleOnCircle };
            // Send it
            p5lm.send(JSON.stringify(dataToSend));
        }
        if (headAngle < -10) {
            //angleOnCircle += 0.05;
            lon -= 0.5;
            computeCameraOrientation();
            //positionOnCircle(angleOnCircle, myAvatarObj);
            // Package as JSON to send

            let dataToSend = { "angleOnCircle": angleOnCircle };
            // Send it
            p5lm.send(JSON.stringify(dataToSend));
        }
    }
}



function allowCameraSelection(w, h) {
    //This whole thing is to build a pulldown menu for selecting between cameras

    //manual alternative to all of this pull down stuff:
    //type this in the console and unfold resulst to find the device id of your preferredwebcam, put in sourced id below
    //navigator.mediaDevices.enumerateDevices()

    //default settings
    let videoOptions = {
        audio: true, video: {
            width: w,
            height: h
        }
    };

    let preferredCam = localStorage.getItem('preferredCam')
    //if you changed it in the past and stored setting
    if (preferredCam) {
        videoOptions = {
            video: {
                width: w,
                height: h,
                sourceId: preferredCam
            }
        };
    }
    //create a pulldown menu for picking source
    navigator.mediaDevices.enumerateDevices().then(function (d) {
        var sel = createSelect();
        sel.position(10, 10);
        for (var i = 0; i < d.length; i++) {
            if (d[i].kind == "videoinput") {
                let label = d[i].label;
                let ending = label.indexOf('(');
                if (ending == -1) ending = label.length;
                label = label.substring(0, ending);
                sel.option(label, d[i].deviceId)
            }
            if (preferredCam) sel.selected(preferredCam);
        }
        sel.changed(function () {
            let item = sel.value();
            //console.log(item);
            localStorage.setItem('preferredCam', item);
            videoOptions = {
                video: {
                    optional: [{
                        sourceId: item
                    }]
                }
            };
            myVideo.remove();
            myVideo = createCapture(videoOptions, VIDEO);
            myVideo.hide();
            console.log("Preferred Camera", videoOptions);
        });
    });
    return videoOptions;
}