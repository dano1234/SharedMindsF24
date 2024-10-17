let dimension = 640;
let button;
let inputBox;
let video; // webcam
let canvas;
let img;
let myLatents;


let mode = "live";
let ageSlider;
let smileSlider;
let poseSlider;

const GPUServer = "https://dano.ngrok.dev/";

function preload() {

}

function setup() {
  console.log("setup");
  canvas = createCanvas(dimension, (dimension * 3) / 4);
  ageSlider = createSlider(-5, 5, 0);
  ageSlider.position(0, (dimension * 3) / 4); // x and y
  ageSlider.size(400, 20); // width and height
  ageSlider.changed(function (what) {
    vecToImg("age", what.target.value);
  });

  smileSlider = createSlider(-5, 5, 0);
  smileSlider.position(0, (dimension * 3) / 4 + 30); // x and y
  smileSlider.size(400, 20); // width and height
  smileSlider.changed(function (what) {
    vecToImg("smile", what.target.value);
  });

  poseSlider = createSlider(-5, 5, 0);
  poseSlider.position(0, (dimension * 3) / 4 + 60); // x and y
  poseSlider.size(400, 20); // width and height
  poseSlider.changed(function (what) {
    vecToImg("pose", what.target.value);
  });

  button = createButton("Find Me");
  button.mousePressed(ask);
  button.position(530, 40);
  let vbutton = createButton("Live Video");
  vbutton.mousePressed(function () {
    video.play();
    mode = "live";
    img = video;
  });

  vbutton.position(530, 70);
  let vecToImgButton = createButton("VecToImg");
  vecToImgButton.position(530, 100);
  vecToImgButton.mousePressed(function () {
    vecToImg("none", 0);
  });

  video = createCapture(VIDEO); //simpler if you don't need to pick between cameras

  video.size(dimension, (dimension * 3) / 4);
  video.hide();
  img = video;
}
function changeAge(what) {

  console.log(what.target.value);
  vecToImg("age", what.target.value);
}
function draw() {
  if (img) {
    image(img, 0, 0, img.width, img.height);//dimension, (dimension * 3) / 4);
  } else {
    image(video, 0, 0);
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


async function ask() {
  video.pause();
  canvas.loadPixels();
  let imgBase64;

  imgBase64 = canvas.elt.toDataURL("image/jpeg", 1.0);

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

  console.log("Asking for My Image ", postData);
  const response = await fetch(url, options);
  video.pause();
  mode = "freeze";
  const result = await response.json();
  if (result.error) {
    console.log("error", result.error);
    return;
  } else {
    //console.log("result", result.latents);
    myLatents = result.latents;

    loadImage(result.b64Image, function (newImage) {
      //"data:image/png;base64," +
      console.log("image loaded", newImage);
      //image(img, 0, 0);
      img = newImage;
    });
  }
}

