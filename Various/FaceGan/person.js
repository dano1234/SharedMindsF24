
class Person {

    constructor(image, x, y) {
        //this.liveMask = createGraphics(width, height);
        if (image) {
            this.staticImage = image;

            this.staticX = x;
            this.staticY = y;
            this.headAngle = 0;
            this.justFace = createGraphics(300, 300);
            this.justFace.image(this.staticImage, 0, 0, 300, 300);
            this.faceRect = { left: x, top: y, right: 300 + x, bottom: 300 + y, width: 300, height: 300 };
            this.center = { x: this.faceRect.right - this.faceRect.width / 2, y: this.faceRect.bottom - this.faceRect.height / 2 };
            this.innerBorder = { left: 0, top: 0, right: 0 + x, bottom: 0 + y, width: 0, height: 0 };
            let currentPerson = this;
            faceMesh.detect(currentPerson.staticImage, function (results) {
                //console.log("detected face", currentPerson);
                currentPerson.getStaticFaceRect(results);
            });  // recursive risk?
        }
        this.tries = 0;
        this.lastUpdate = millis();
        this.asked = false;
    }

    setLean(leanLevel) {
        if (this.leanLevel != leanLevel && leanLevel > 3) {
            this.leanLevel = leanLevel;
            return true;
        } else {
            return false;
        }
    }

    // setDistanceFromSingle(single) {
    //     let xDiff = single.center.x - this.center.x;
    //     let yDiff = single.center.y - this.center.y;
    //     this.leanLevel = Math.sqrt(xDiff * xDiff + yDiff) / (width / 10) - (width / 10) / 2;
    //     console.log("leanLevel", this.leanLevel);

    // }

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
        console.log("latents", currentPerson.latents);
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
    getStaticFaceRect(results) {
        let currentPerson = this;

        if (this.tries > 20) {
            console.log("Too many tries");
            return;
        }
        currentPerson.tries++;
        if (results.length == 0) {
            console.log("No Face Found");
            faceMesh.detect(this.staticImage, function (results) {
                //console.log("detected face", currentPerson);
                currentPerson.getStaticFaceRect(results);
            });  // recursive risk?
            return;
        } else if (results[0].faceOval.width < 120 || results[0].faceOval.height < 120) {
            console.log("too small face found");
            faceMesh.detect(this.staticImage, function (results) {
                //console.log("detected face", currentPerson);
                currentPerson.getStaticFaceRect(results);
            });  // recursive risk?
            return
        }
        //let newImage = this.alterEgo;
        let firstFace = results[0];
        this.innerBorder = { left: firstFace.box.xMin, top: firstFace.box.yMin, right: firstFace.box.xMax, bottom: firstFace.box.yMax, width: firstFace.box.width, height: firstFace.box.height };

        //

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
        //console.log("alterEgoFaceRect", this.alterEgoFaceRect);
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
        //

    }

    isGone() {
        return millis() - this.lastUpdate > 5000;
    }

    updatePosition(liveResults) {

        if (this.staticImage) {
            return;
        }

        //  if (this.staticImage && this.justFace) return;
        this.lastUpdate = millis();

        let z = liveResults.keypoints[0].z;

        this.box = liveResults.box;
        // this.box.xMin = this.box.xMin / 2;
        // this.box.xMax = this.box.xMax / 2;
        // this.box.yMin = this.box.yMin / 2;
        // this.box.yMax = this.box.yMax / 2;
        // this.box.width = this.box.width / 2;
        // this.box.height = this.box.height / 2;
        //let faceWidth = this.box.width;
        //let faceHeight = this.box.height;

        let xDiff = liveResults.left_eye.x / 2 - liveResults.right_eye.x / 2;
        let yDiff = liveResults.left_eye.y / 2 - liveResults.right_eye.y / 2;
        // let xDiff = liveResults.leftEye.centerX / 2 - liveResults.rightEye.centerX / 2;
        // let yDiff = liveResults.leftEye.centerY / 2 - liveResults.rightEye.centerY / 2;
        this.headAngle = Math.atan2(yDiff, xDiff);
        //  console.log("live results", liveResults);
        // let faceWidth = abs(p.left_ear.x - p.right_ear.x);
        //this.center = { x: this.box.xMin + faceWidth / 2, y: this.box.yMin + faceHeight / 2 };
        let faceWidth = liveResults.left_ear.x - liveResults.right_ear.x
        let faceHeight = faceWidth
        this.center = { x: liveResults.nose.x, y: liveResults.nose.y };

        let left = this.center.x - faceWidth;
        let right = this.center.x + faceWidth;
        let bottom = this.center.y + faceWidth;
        let top = this.center.y - faceWidth;
        //this.box = { xMin: left, xMax: right, yMin: top, yMax: bottom, width: faceWidth * 4, height: faceWidth * 4 };
        this.faceRect = { left: left, top: top, right: right, bottom: bottom, width: faceWidth, height: faceWidth };
        //console.log("faceRect", this.faceRect);
        //let right = this.box.xMax + faceWidth / 2;
        // let top = this.box.yMin - faceHeight / 2;
        // let bottom = this.box.yMax + faceHeight / 2;
        this.justFace = createGraphics(faceWidth * faceBorderFactor, faceHeight * faceBorderFactor);
        this.justFace.image(video, 0, 0, faceWidth * faceBorderFactor, faceHeight * faceBorderFactor, left, top, faceWidth * faceBorderFactor, faceHeight * faceBorderFactor);


        if (this.asked == false) {
            // this.locateAlterEgo();
            this.asked = true;
        }
    }
    drawMe(number) {
        // console.log("headAngle", headAngle);
        //if (this.alterEgoCanvas) image(this.ctx, 0, 0);
        // if (this.staticImage) {
        //     image(this.staticImage, this.staticX, this.staticY, 300, 300);

        // }
        if (this.faceRect) {
            if (this.alterEgo) {
                //console.log("drawing alter ego");



                this.alterEgoGraphics.push();
                this.alterEgo.mask(this.alterEgoMask);

                this.alterEgoGraphics.imageMode(CENTER);
                this.alterEgoGraphics.clear()
                //this.alterEgoGraphics.translate(this.faceRect.width * faceBorderFactor / 2, this.faceRect.width * faceBorderFactor / 2);
                this.alterEgoGraphics.translate(this.alterEgoGraphics.width / 2, this.alterEgoGraphics.height / 2);
                this.alterEgoGraphics.rotate(this.headAngle);

                this.alterEgoGraphics.tint(255, 230);
                this.alterEgoGraphics.image(this.alterEgo, 0, 0);;
                let border = this.faceRect.width / 4 * faceBorderFactor;
                let topBorder = this.faceRect.height / 3 * faceBorderFactor;
                //let gfactor = 0.0;
                //this.alterEgoFaceRect = { left: firstFace.box.xMin - firstFace.box.xMin * gfactor, top: firstFace.box.yMin - firstFace.box.yMin * gfactor, right: firstFace.box.xMax + firstFace.box.xMax * gfactor, bottom: firstFace.box.yMax + firstFace.box.yMax * gfactor, width: firstFace.box.width + firstFace.box.width * gfactor, height: firstFace.box.height + firstFace.box.height * gfactor };

                if (this.staticImage) {
                    //console.log("drawing static image", this.innerBorder);
                    //image(this.alterEgo, this.faceRect.left, this.faceRect.top, this.faceRect.width, this.faceRect.height, this.alterEgoBox.xMin, this.alterEgoBox.yMin, this.alterEgoBox.width, this.alterEgoBox.height);
                    image(this.justFace, this.faceRect.left, this.faceRect.top, this.faceRect.width * faceBorderFactor, this.faceRect.height * faceBorderFactor);

                    image(this.alterEgo, this.innerBorder.left + this.faceRect.left, this.innerBorder.top + this.faceRect.top, this.innerBorder.width, this.innerBorder.height, this.alterEgoBox.xMin, this.alterEgoBox.yMin, this.alterEgoBox.width, this.alterEgoBox.height);

                } else {
                    image(this.alterEgoGraphics, this.faceRect.left + border, this.faceRect.top + topBorder, this.faceRect.width, this.faceRect.height, this.alterEgoBox.xMin, this.alterEgoBox.yMin, this.alterEgoBox.width, this.alterEgoBox.height);
                }
                this.alterEgoGraphics.pop();

            } else {
                image(this.justFace, this.faceRect.left, this.faceRect.top, this.faceRect.width * faceBorderFactor, this.faceRect.height * faceBorderFactor);
            }


            if (keyIsDown(SHIFT)) {
                rectMode(CORNER);
                fill(255, 0, 0)
                textSize(32);
                text("P " + number, this.faceRect.left, this.faceRect.top);
                noFill();
                console.log("faceRect", this.faceRect, this.center);
                rect(this.faceRect.left, this.faceRect.top, this.faceRect.width, this.faceRect.height);
                ellipse(this.center.x, this.center.y, 10, 10);
            }
        }
    }

    // getLiveFaceRect(liveResults) {

    // }
}
