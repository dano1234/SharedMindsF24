let dimension = 640;
let button;
let inputBox;
let video; // webcam
let canvas;
let img;
let myLatents;
let otherLatents;
let otherCanvas;


let mode = "live";
let ageSlider;
let smileSlider;
let poseSlider;
let otherSlider;
let other;
let otherFromAI

const GPUServer = "https://dano.ngrok.dev/";

function preload() {
  other = loadImage("obama.png");
}

function setup() {
  console.log("setup");
  canvas = createCanvas(dimension, (dimension * 3) / 4);


  ageSlider = createSlider(-5, 5, 0);
  ageSlider.position(0, (dimension * 3) / 4 + 30); // x and y
  ageSlider.size(400, 20); // width and height
  ageSlider.changed(function (what) {
    vecToImg("age", what.target.value);
  });

  smileSlider = createSlider(-5, 5, 0);
  smileSlider.position(0, (dimension * 3) / 4 + 60); // x and y
  smileSlider.size(400, 20); // width and height
  smileSlider.changed(function (what) {
    vecToImg("smile", what.target.value);
  });

  poseSlider = createSlider(-5, 5, 0);
  poseSlider.position(0, (dimension * 3) / 4 + 90); // x and y
  poseSlider.size(400, 20); // width and height
  poseSlider.changed(function (what) {
    vecToImg("pose", what.target.value);
  });

  otherSlider = createSlider(1, 99, 50);
  otherSlider.position(width / 2, (dimension * 3) / 4); // x and y
  otherSlider.size(400, 20); // width and height
  otherSlider.changed(function (what) {
    askBetween(what.target.value / 100);
  });


  button = createButton("Find Me");
  button.mousePressed(function () {
    video.pause();
    canvas.loadPixels();
    askForProjectionImageAndLatents(canvas.elt.toDataURL("image/jpeg", 1.0), "me");
  });
  button.position(530, 40);

  let vbutton = createButton("Live Video");
  vbutton.mousePressed(function () {
    video.play();
    mode = "live";
    img = video;
  });
  vbutton.position(530, 70);

  // let vecToImgButton = createButton("VecToImg");
  // vecToImgButton.position(530, 100);
  // vecToImgButton.mousePressed(function () {
  //   vecToImg("none", 0);
  // });

  video = createCapture(VIDEO); //simpler if you don't need to pick between cameras

  video.size(dimension, (dimension * 3) / 4);
  video.hide();
  img = video;


  other.loadPixels();
  askForProjectionImageAndLatents(other.canvas.toDataURL("image/jpeg", 1.0), "other");
  //askForProjectionImageAndLatents(otherB64, "other");
}
function changeAge(what) {

  console.log(what.target.value);
  vecToImg("age", what.target.value);
}
function draw() {
  if (video) {
    image(video, 0, 0);
  }
  if (img) {
    image(img, width - img.width, height - img.height, img.width, img.height);//dimension, (dimension * 3) / 4);
  }
  if (otherFromAI) {
    image(otherFromAI, dimension / 2, 0, dimension / 2, (dimension * 3) / 4);

  }

}

async function vecToImg(direction, factor) {
  let postData = {
    latents: myLatents,
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

  loadImage(result.b64Image, function (newImage) {
    //"data:image/png;base64," +
    console.log("image loaded", newImage);
    //image(img, 0, 0);
    img = newImage;
  });
}

async function askBetween(percent) {
  console.log("Asking for Image between me and other ", percent);
  if (!myLatents && !otherLatents) altert("Press Live Video and Find Me first");

  postData = {
    v1: myLatents,
    v2: otherLatents,
    percent: percent,
  };

  url = GPUServer + "getBetween/";
  const options = {
    headers: {
      "Content-Type": `application/json`,
    },
    method: "POST",
    body: JSON.stringify(postData), //p)
  };

  console.log("between ", postData);
  const response = await fetch(url, options);
  video.pause();
  mode = "freeze";
  const result = await response.json();
  if (result.error) {
    console.log("error", result.error);
    return;
  } else {

    loadImage(result.b64Image, function (newImage) {
      //"data:image/png;base64," +
      console.log("image loaded", newImage);
      //image(img, 0, 0);
      img = newImage;
      img.resize(dimension, (dimension * 3) / 4);
    });
  }

}

async function askForProjectionImageAndLatents(imgBase64, whoIsAsking) {



  imgBase64 = imgBase64.split(",")[1];

  let postData = {
    image: imgBase64,
  };

  let url = GPUServer + "locateImage/";
  const options = {
    headers: {
      "Content-Type": `application/json`,
    },
    method: "POST",
    body: JSON.stringify(postData), //p)
  };

  console.log("Projecting an Image into the space asking for latent and image ", postData);
  const response = await fetch(url, options);

  mode = "freeze";
  const result = await response.json();
  if (result.error) {
    console.log("error", result.error);
    return;
  } else {
    //console.log("result", result.latents);
    if (whoIsAsking == "other") {
      otherLatents = result.latents;
    } else {
      myLatents = result.latents;
    }

    loadImage(result.b64Image, function (newImage) {
      //"data:image/png;base64," +
      console.log("image loaded", newImage);
      //image(img, 0, 0);
      if (whoIsAsking == other) {
        otherFromAI = newImage;
      } else {
        img = newImage;
      }
    });
  }
}

