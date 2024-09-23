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
            this.frameRect = { left: x, top: y, right: 300 + x, bottom: 300 + y, width: 300, height: 300 };
            this.center = { x: this.staticX + this.faceRect.width / 2, y: this.staticY + this.faceRect.height / 2 };
            this.innerBorder = { left: 0, top: 0, right: 0 + x, bottom: 0 + y, width: 0, height: 0 };

            let currentPerson = this;
            // faceMesh.detect(currentPerson.staticImage, function (results) {
            //     //console.log("detected face", currentPerson);
            //     currentPerson.getStaticFaceRect(results);
            // });  // recursive risk?
            this.getFakeFaceRect();
            // this.getMaskAndRect(this.staticImage);
            // bodySegmentation.detect(currentPerson.staticImage, function (results) {
            //     //console.log("detected face", currentPerson);
            //     currentPerson.getAlterEgoFaceMaskFromParts(results);
            // });
        }
        this.lastRefresh = millis();
        this.stage = "actual";
        this.tries = 0;
        this.lastAlterEgoFreshening = millis();
        this.asked = false;
        //this.locateAlterEgo();
    }

    async getFakeFaceRect() {
        let thisPos = await bodyPose.detect(this.staticImage);
        console.log("thisPos", thisPos);
        this.getMaskAndRect(thisPos[0], this.staticImage, "bottom");
        this.center = { x: thisPos[0].nose.x + this.staticX, y: thisPos[0].nose.y + this.staticY };
        console.log("got fake face rect", this.faceRect, this.frameRect);
    }


    async getMaskAndRect(pose, image, layer) {
        this.lastUpdate = millis();
        let g;
        let frameRect = { left: 0, top: 0, width: image.width, height: image.height };
        let faceRect = { left: 0, top: 0, right: image.width, bottom: image.height, width: image.width, height: image.height };

        if (pose) {
            let rightEarX = pose.right_ear.x;
            let rightEarY = pose.right_ear.y;
            let leftEarX = pose.left_ear.x;
            let leftEarY = pose.left_ear.y;
            let centerX = pose.nose.x;
            let centerY = pose.nose.y;
            let earWidth = int(leftEarX - rightEarX);
            let wDiff = rightEarX - leftEarX;
            let hDiff = rightEarY - leftEarY;
            let faceWidth = Math.sqrt(wDiff * wDiff + hDiff * hDiff);

            if (layer == "bottom") {
                g = createGraphics(earWidth * 2, earWidth * 2);
                let top = int(centerY - earWidth);
                let left = int(centerX - earWidth);
                let xDiff = pose.left_eye.x / 2 - pose.right_eye.x / 2;
                let yDiff = pose.left_eye.y / 2 - pose.right_eye.y / 2;
                this.headAngle = Math.atan2(yDiff, xDiff);
                this.center = { x: int(pose.nose.x), y: int(pose.nose.y) };

                frameRect = { left: left, top: top, width: earWidth * 2, height: earWidth * 2 };
                g.image(
                    image,
                    0,
                    0,
                    earWidth * 2,
                    earWidth * 2,
                    left,
                    top,
                    earWidth * 2,
                    earWidth * 2
                );
            } else {
                g = createGraphics(image.width, image.height);
                g.image(image, 0, 0);
                console.log("create graphics for top");
            }

            let faceMask = createGraphics(g.width, g.height);
            faceRect = { left: leftEarY, top: centerY - faceWidth / 2, right: rightEarX, bottom: centerY - faceWidth / 2 };
            //let faceRect = { left: width, top: height, right: 0, bottom: 0 };
            //image(segmentation.mask, 0, 0, width, height);
            faceMask.clear();
            faceMask.loadPixels();
            for (let x = 0; x < g.width; x++) {
                for (let y = 0; y < g.height; y++) {
                    let xDiff = x - centerX;
                    let yDiff = y - centerY;
                    let offset = (y * g.width + x) * 4;
                    let distCenter = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
                    let alpha = 255 - distCenter * 255 / faceWidth;
                    if (distCenter < faceWidth / 2) alpha = 255;
                    else alpha = 0;

                    faceMask.pixels[offset] = 255;
                    faceMask.pixels[offset + 1] = 255;

                    faceMask.pixels[offset + 2] = 255;
                    faceMask.pixels[offset + 3] = 127;
                }
            }



            //frameRect.top = frameRect.top - 15;

            //image(g, 0, 0);
            // for (let j = 0; j < pose.keypoints.length; j++) {
            //     let keypoint = pose.keypoints[j];
            //     // Only draw a circle if the keypoint's confidence is bigger than 0.1
            //     if (keypoint.confidence > 0.1) {
            //         fill(0, 255, 0);
            //         //noStroke();
            //         ellipse(keypoint.x, keypoint.y, 10, 10);
            //     }
            // }
            /*
            let segmentation = await bodySegmentation.detect(g);
            if (segmentation) {
                let faceMask = createGraphics(g.width, g.height);
                let faceRect = { left: width, top: height, right: 0, bottom: 0 };
                //image(segmentation.mask, 0, 0, width, height);
                faceMask.clear();
                faceMask.loadPixels();
                // this.centroid = { x: 0, y: 0 };
                // let total = 0;
    
                for (let i = 0; i < segmentation.data.length; i++) {
                    if (segmentation.data[i] == 1 || segmentation.data[i] == 0) {
                        faceMask.pixels[i * 4] = 0;
                        faceMask.pixels[i * 4 + 1] = 0;
                        faceMask.pixels[i * 4 + 2] = 0;
                        faceMask.pixels[i * 4 + 3] = 255;
                        let x = i % faceMask.width;
                        let y = int(i / faceMask.width);
                        //console.log("x", x, "y", y);
                        // this.centroid.x += x;
                        // this.centroid.y += y;
                        //total++;
                        if (x > faceRect.right) faceRect.right = x;
                        if (y > faceRect.bottom) faceRect.bottom = y;
                        if (x < faceRect.left) faceRect.left = x;
                        if (y < faceRect.top) faceRect.top = y;
                    }
                }
                // this.centroid.x = this.centroid.x / total;
                // this.centroid.y = this.centroid.y / total;
                // console.log("cntroid", this.centroid, "center", this.center);
                */
            faceMask.updatePixels();
            faceRect.width = faceRect.right - faceRect.left;
            faceRect.height = faceRect.bottom - faceRect.top;
            if (layer == "bottom") {
                this.faceMask = faceMask;
                this.frameRect = frameRect;
                this.faceRect = faceRect;
                this.justFace = g;
            } else {
                this.alterEgoMask = faceMask;

                this.alterEgoFrameRect = frameRect;

                this.alterEgoFaceRect = faceRect;
                this.alterEgoGraphics = g;
                this.alterEgoImage.mask(this.alterEgoMask);
                console.log("got alter ego mask and rect");
            }
            g.remove();
        }


        // console.log("got mask and rect", this.faceRect, this.frameRect);
    }

    maybeAskBetween(amount) {
        if (!busyAsking) {

        }
    }

    drawMe(number) {

        //if (this.alterEgoCanvas) image(this.ctx, 0, 0);
        if (this.staticImage) {

            if (this.alterEgoGraphics) {
                //image(this.alterEgoGraphics, this.frameRect.left + this.faceRect.left, this.frameRect.top + this.faceRect.top, this.faceRect.width, this.faceRect.height, this.alterEgoFaceRect.left, this.alterEgoFaceRect.top, this.alterEgoFaceRect.width, this.alterEgoFaceRect.height);
                // console.log(this.faceRect.left, this.staticX);
                image(this.alterEgoImage, this.alterEgoFaceRect.left + this.staticX, this.alterEgoFaceRect.top + this.staticY, this.faceRect.width, this.faceRect.height, this.alterEgoFaceRect.left, this.alterEgoFaceRect.top, this.alterEgoFaceRect.width, this.alterEgoFaceRect.height);
                //image(this.alterEgoMask, this.frameRect.left, this.frameRect.top, this.frameRect.width, this.frameRect.height);
                // image(this.alterEgoGraphics, this.staticX, this.staticY);
                // image(this.alterEgoImage, this.frameRect.left + this.faceRect.left, this.frameRect.top + this.faceRect.top, this.faceRect.width, this.faceRect.height, this.alterEgoFaceRect.left, this.alterEgoFaceRect.top, this.alterEgoFaceRect.width, this.alterEgoFaceRect.height);

            } else {
                image(this.staticImage, this.staticX, this.staticY, 400, 400);
                textSize(14);
                let wordsWidth = textWidth(waitingMessage);
                fill(0, 0, 0);
                //text("Finding Your AI Version", this.frameRect.left + this.frameRect.width / 2 - wordsWidth / 2, this.frameRect.bottom - 30);
                text(waitingMessage, this.frameRect.left + wordsWidth / 2, this.frameRect.top);
                text(waitingMessage, 100, 100);
            }

        } else if (this.alterEgoImage && this.faceRect && this.alterEgoMask && this.frameRect) {

            this.alterEgoGraphics.push();
            this.alterEgoGraphics.imageMode(CENTER);
            this.alterEgoGraphics.clear()
            //this.alterEgoGraphics.translate(this.faceRect.width * faceBorderFactor / 2, this.faceRect.width * faceBorderFactor / 2);
            this.alterEgoGraphics.translate(this.alterEgoGraphics.width / 2, this.alterEgoGraphics.height / 2);
            this.alterEgoGraphics.rotate(this.headAngle);

            // this.alterEgoGraphics.tint(255, 210);
            this.alterEgoGraphics.image(this.alterEgoImage, 0, 0);;

            let newFaceRect = this.faceRect;
            let newFrameRect = this.frameRect;
            let newFaceRec = this.faceRect;
            let lerpAmount = 0.1;

            if (this.lastFrameRect) {
                newFrameRect = { left: lerp(this.lastFrameRect.left, this.frameRect.left, lerpAmount), top: lerp(this.lastFrameRect.top, this.frameRect.top, lerpAmount), right: lerp(this.lastFrameRect.right, this.frameRect.right, lerpAmount), bottom: lerp(this.lastFrameRect.bottom, this.frameRect.bottom, lerpAmount), width: lerp(this.lastFrameRect.width, this.frameRect.width, lerpAmount), height: lerp(this.lastFrameRect.height, this.frameRect.height, lerpAmount) };
            }

            if (this.lastFaceRect) {
                newFaceRect = { left: lerp(this.lastFaceRect.left, this.faceRect.left, lerpAmount), top: lerp(this.lastFaceRect.top, this.faceRect.top, lerpAmount), right: lerp(this.lastFaceRect.right, this.faceRect.right, lerpAmount), bottom: lerp(this.lastFaceRect.bottom, this.faceRect.bottom, lerpAmount), width: lerp(this.lastFaceRect.width, this.faceRect.width, lerpAmount), height: lerp(this.lastFaceRect.height, this.faceRect.height, lerpAmount) };
            }

            image(this.alterEgoGraphics, newFrameRect.left + newFaceRect.left, newFrameRect.top + newFaceRect.top, newFaceRect.width, newFaceRect.height, this.alterEgoFaceRect.left, this.alterEgoFaceRect.top, this.alterEgoFaceRect.width, this.alterEgoFaceRect.height);

            //image(this.alterEgoGraphics, this.frameRect.left + this.faceRect.left, this.frameRect.top + this.faceRect.top, this.faceRect.width, this.faceRect.height, this.alterEgoFaceRect.left, this.alterEgoFaceRect.top, this.alterEgoFaceRect.width, this.alterEgoFaceRect.height);
            this.lastFrameRect = newFrameRect;
            this.lastFaceRect = newFaceRect;
            this.alterEgoGraphics.pop();
            //image(this.alterEgoMask, this.frameRect.left, this.frameRect.top, this.frameRect.width, this.frameRect.height);
        } else if (this.faceRect && this.frameRect) {
            image(this.justFace, this.frameRect.left, this.frameRect.top, this.frameRect.width, this.frameRect.height);
            textSize(14);
            let wordsWidth = textWidth(waitingMessage);
            fill(0, 0, 0);
            //text("Finding Your AI Version", this.frameRect.left + this.frameRect.width / 2 - wordsWidth / 2, this.frameRect.bottom - 30);
            text(waitingMessage, this.frameRect.left + wordsWidth / 2, this.frameRect.top);
            text(waitingMessage, 300, 300);

        }

        if (!this.staticImage && millis() - this.lastAlterEgoFreshening > 5000) {
            this.locateAlterEgo();
            this.lastAlterEgoFreshening = millis();
        }

        // if (this.alterEgoMask) {
        //     if (this.alterEgo) {
        //         //console.log("drawing alter ego");



        //         this.alterEgoGraphics.push();
        //         this.alterEgo.mask(this.alterEgoMask);

        //         this.alterEgoGraphics.imageMode(CENTER);
        //         this.alterEgoGraphics.clear()
        //         //this.alterEgoGraphics.translate(this.faceRect.width * faceBorderFactor / 2, this.faceRect.width * faceBorderFactor / 2);
        //         this.alterEgoGraphics.translate(this.alterEgoGraphics.width / 2, this.alterEgoGraphics.height / 2);
        //         this.alterEgoGraphics.rotate(this.headAngle);

        //         this.alterEgoGraphics.tint(255, 230);
        //         this.alterEgoGraphics.image(this.alterEgo, 0, 0);;
        //         let border = this.faceRect.width / 4 * faceBorderFactor;
        //         let topBorder = this.faceRect.height / 3 * faceBorderFactor;
        //         //let gfactor = 0.0;
        //         //this.alterEgoFaceRect = { left: firstFace.box.xMin - firstFace.box.xMin * gfactor, top: firstFace.box.yMin - firstFace.box.yMin * gfactor, right: firstFace.box.xMax + firstFace.box.xMax * gfactor, bottom: firstFace.box.yMax + firstFace.box.yMax * gfactor, width: firstFace.box.width + firstFace.box.width * gfactor, height: firstFace.box.height + firstFace.box.height * gfactor };

        //         if (this.staticImage) {
        //             //console.log("drawing static image", this.innerBorder);
        //             //image(this.alterEgo, this.faceRect.left, this.faceRect.top, this.faceRect.width, this.faceRect.height, this.alterEgoBox.xMin, this.alterEgoBox.yMin, this.alterEgoBox.width, this.alterEgoBox.height);
        //             image(this.justFace, this.faceRect.left, this.faceRect.top, this.faceRect.width * faceBorderFactor, this.faceRect.height * faceBorderFactor);

        //             image(this.alterEgo, this.innerBorder.left + this.faceRect.left, this.innerBorder.top + this.faceRect.top, this.innerBorder.width, this.innerBorder.height, this.alterEgoBox.xMin, this.alterEgoBox.yMin, this.alterEgoBox.width, this.alterEgoBox.height);

        //         } else {
        //             image(this.alterEgoGraphics, this.faceRect.left + border, this.faceRect.top + topBorder, this.faceRect.width, this.faceRect.height, this.alterEgoBox.xMin, this.alterEgoBox.yMin, this.alterEgoBox.width, this.alterEgoBox.height);
        //         }
        //         this.alterEgoGraphics.pop();

        //     } else {
        //         image(this.justFace, this.frameRect.left, this.frameRect.top, this.frameRect.width, this.frameRect.height);
        //     }



        // }
        if (keyIsDown(SHIFT)) {
            textSize(32);
            text("P " + number, this.frameRect.left, this.frameRect.top);
            noFill();
            rectMode(CORNER);

            stroke(0, 255, 0)
            rect(this.frameRect.left, this.frameRect.top, this.frameRect.width, this.frameRect.height);
            stroke(255, 0, 0)
            rect(this.faceRect.left, this.faceRect.top, this.faceRect.width, this.faceRect.height);

            //rect(this.faceRect.left + this.frameRect.left, this.faceRect.top + this.frameRect.top, this.faceRect.width, this.faceRect.height);
            image(this.faceMask, this.frameRect.left, this.frameRect.top, this.frameRect.width, this.frameRect.height);
            stroke(0, 255, 255)
            //ellipse(this.center.x, this.center.y, 10, 10);
            stroke(0, 255, 255)
            //ellipse(this.centroid.x, this.centroid.y, 10, 10);
            if (this.alterEgoFaceRect) {
                stroke(0, 0, 255)
                rect(this.alterEgoFrameRect.left, this.alterEgoFrameRect.top, this.alterEgoFrameRect.width, this.alterEgoFrameRect.height);
                stroke(255, 255, 255)
                rect(this.alterEgoFaceRect.left + this.alterEgoFrameRect.left, this.alterEgoFaceRect.top + this.alterEgoFrameRect.top, this.alterEgoFaceRect.width, this.alterEgoFaceRect.height);
                image(this.alterEgoMask, this.alterEgoFaceRect.left + this.alterEgoFrameRect.left, this.alterEgoFrameRect.top + this.alterEgoFaceRect.top + this.alterEgoFrameRect.top, this.alterEgoFrameRect.width, this.alterEgoFrameRect.height);
            }
        }
    }

    // async getBodyPixMaskAndRect(image) {
    //     let segmentation = await bodySegmentation.detect(image);
    //     if (segmentation) {
    //         let faceRect = { left: width, top: height, right: 0, bottom: 0 }
    //         //image(segmentation.mask, 0, 0, width, height);
    //         // console.log("len", segmentation.data.length );
    //         faceMask.clear();
    //         faceMask.loadPixels();
    //         for (let i = 0; i < segmentation.data.length; i++) {
    //             if (segmentation.data[i] == 1 || segmentation.data[i] == 0) {
    //                 faceMask.pixels[i * 4] = 0;
    //                 faceMask.pixels[i * 4 + 1] = 0;
    //                 faceMask.pixels[i * 4 + 2] = 0;
    //                 faceMask.pixels[i * 4 + 3] = 255;
    //                 let x = i % width;
    //                 let y = int(i / width);
    //                 if (x > faceRect.right) faceRect.right = x;
    //                 if (y > faceRect.bottom) faceRect.bottom = y;
    //                 if (x < faceRect.left) faceRect.left = x;
    //                 if (y < faceRect.top) faceRect.top = y;
    //             }
    //         }
    //         console.log("faceRect", faceRect);
    //         faceMask.updatePixels();
    //         // console.log(faceRect);
    //         // image(faceMask, 0, 0);
    //     }
    //     this.faceRect = { left: faceRect.left, top: faceRect.top, right: faceRect.right, bottom: faceRect.bottom, width: faceRect.right - faceRect.left, height: faceRect.bottom - faceRect.top };
    // }

    // async getAlterEgoMaskAndLandMarks(image) {
    //     let bodyPixResults = await bodySegmentation.detect(image);
    //     console.log("constructor bodyPixResults", bodyPixResults);
    //     let bodyPoseResults = await bodyPose.detect(image);
    //     console.log("constructor bodyPoseResults", bodyPoseResults);
    // }
    // async getStaticLandmarks(image) {
    //     let bodyPoseResults = await bodyPose.detect(image);
    //     this.faceRect = { left: bodyPoseResults[0].box.xMin, top: bodyPoseResults[0].box.yMin, right: bodyPoseResults[0].box.xMax, bottom: bodyPoseResults[0].box.yMax, width: bodyPoseResults[0].box.width, height: bodyPoseResults[0].box.height };
    //     console.log("constructor bodyPoseResults", bodyPoseResults);
    // }

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
        console.log("Locating My Image ");
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
        //console.log("latents", currentPerson.latents);
        loadImage(result.b64Image, async function (newImage,) {
            //currentPerson.imageLoaded(newImage, result);
            currentPerson.alterEgoImage = newImage;
            console.log("got pose in image load of b64 returned as alter ego");
            currentPerson.getMaskAndRect(null, newImage, "top");
        });
    }



    //don't need?
    async imageLoaded(newImage, result) {
        //console.log("image loaded", newImage);
        // console.log("this during imageLoaded", this);
        let currentPerson = this;
        let pose = await bodyPose.detect(newImage);
        getMaskAndRect(pose[0], newImage, "top");
        //this.alterEgoGraphics = createGraphics(newImage.width, newImage.height);
        //this.alterEgoGraphics.image(newImage, 0, 0);
        // Perform operations with newImage here

        //this.tries = 0;
        // this.alterEgo = newImage;
        // bodySegmentation.detect(newImage, function (results) {
        //     //console.log("detected face", currentPerson);
        //     currentPerson.getAlterEgoFaceMaskFromParts(results);
        // });
        // faceMesh.detect(newImage, function (results) {
        //     //console.log("detected face", currentPerson);
        //     currentPerson.getAlterEgoFaceMaskFromParts(result.segmentation);
        // });

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
    //delete all of this is bodypix works.
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
    getAlterEgoFaceMaskFromParts(segmentation) {
        if (segmentation) {
            // console.log("segmentation", segmentation);
            //image(segmentation.mask, 0, 0, width, height);
            // console.log("len", segmentation.data.length );
            console.log("segmentation", segmentation);
            this.alterEgoMask = createGraphics(this.alterEgo.width, this.alterEgo.height);
            this.alterEgoMask.noStroke();
            this.alterEgoMask.clear();
            this.alterEgoMask.clear();
            this.alterEgoMask.loadPixels();
            let data = segmentation.maskImageData.data;

            for (let i = 0; i < data.length; i++) {
                if (data[i] == 1 || data[i] == 0) {
                    this.alterEgoMask.pixels[i * 4] = 0;
                    this.alterEgoMask.pixels[i * 4 + 1] = 0;
                    this.alterEgoMask.pixels[i * 4 + 2] = 0;
                    this.alterEgoMask.pixels[i * 4 + 3] = 255;
                }
            }
            this.alterEgoMask.updatePixels();
            image(this.alterEgoMask, 0, 0);
            this.alterEgoGraphics = createGraphics(this.alterEgo.width, this.alterEgo.height);
        }

    }

    isGone() {
        return millis() - this.lastUpdate > 5000;
    }







    // updatePosition(liveResults) {

    //     if (this.staticImage) {
    //         return;
    //     }

    //     //  if (this.staticImage && this.justFace) return;
    //     this.lastUpdate = millis();

    //     let z = liveResults.keypoints[0].z;

    //     this.box = liveResults.box;
    //     // this.box.xMin = this.box.xMin / 2;
    //     // this.box.xMax = this.box.xMax / 2;
    //     // this.box.yMin = this.box.yMin / 2;
    //     // this.box.yMax = this.box.yMax / 2;
    //     // this.box.width = this.box.width / 2;
    //     // this.box.height = this.box.height / 2;
    //     //let faceWidth = this.box.width;
    //     //let faceHeight = this.box.height;

    //     let xDiff = liveResults.left_eye.x / 2 - liveResults.right_eye.x / 2;
    //     let yDiff = liveResults.left_eye.y / 2 - liveResults.right_eye.y / 2;
    //     // let xDiff = liveResults.leftEye.centerX / 2 - liveResults.rightEye.centerX / 2;
    //     // let yDiff = liveResults.leftEye.centerY / 2 - liveResults.rightEye.centerY / 2;
    //     this.headAngle = Math.atan2(yDiff, xDiff);
    //     //  console.log("live results", liveResults);
    //     // let faceWidth = abs(p.left_ear.x - p.right_ear.x);
    //     //this.center = { x: this.box.xMin + faceWidth / 2, y: this.box.yMin + faceHeight / 2 };
    //     let faceWidth = liveResults.left_ear.x - liveResults.right_ear.x
    //     let faceHeight = faceWidth
    //     this.center = { x: liveResults.nose.x, y: liveResults.nose.y };

    //     let left = this.center.x - faceWidth;
    //     let right = this.center.x + faceWidth;
    //     let bottom = this.center.y + faceWidth;
    //     let top = this.center.y - faceWidth;
    //     //this.box = { xMin: left, xMax: right, yMin: top, yMax: bottom, width: faceWidth * 4, height: faceWidth * 4 };
    //     this.faceRect = { left: left, top: top, right: right, bottom: bottom, width: faceWidth, height: faceWidth };
    //     //console.log("faceRect", this.faceRect);
    //     //let right = this.box.xMax + faceWidth / 2;
    //     // let top = this.box.yMin - faceHeight / 2;
    //     // let bottom = this.box.yMax + faceHeight / 2;
    //     this.justFace = createGraphics(faceWidth * faceBorderFactor, faceHeight * faceBorderFactor);
    //     this.justFace.image(video, 0, 0, faceWidth * faceBorderFactor, faceHeight * faceBorderFactor, left, top, faceWidth * faceBorderFactor, faceHeight * faceBorderFactor);


    //     if (this.asked == false) {
    //         // this.locateAlterEgo();
    //         this.asked = true;
    //     }
    // }


    // getLiveFaceRect(liveResults) {

    // }
}