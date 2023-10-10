let img;
let button;
let inputBox;
let mask1;
let maskBase64 = "";
let canvas;
const NGrokAddress = "https://7d98-34-125-99-80.ngrok.io";

let picture1;
let picture2;
let resultImage;

function preload() {
  img = loadImage("jacob.jpeg");
  img2 = loadImage("woods.jpeg");
}
function setup() {
  button = createButton("Ask");
  button.mousePressed(ask);
  button.position(530, 40);
  inputBox = createInput("Baseball Player in the Woods");
  inputBox.position(530, 10);

  canvas = createCanvas(1024, 1024);
  canvas.position(0, 0);

  // mask1 = createGraphics(512, 512);
  // mask1.fill(0, 0, 0);
  // mask1.noStroke();
  // image(img, 0, 0, 512, 512);

  picture1 = createGraphics(512, 512);
  picture2 = createGraphics(512, 512);
  picture1.image(img, 0, 0, 512, 512);
  picture2.image(img2, 0, 0, 512, 512);

  //canvas2 = createCanvas(512, 100);
  //canvas2.position(600, 0);
  // canvas2.image(img2, 0, 0, 512, 512);

}

function draw() {
  //nothing
  image(picture1, 0, 0, 512, 512);
  image(picture2, 512, 0, 512, 512);
  if (resultImage) image(resultImage, 256, 512, 512, 512);
}

function mouseDragged() {
  // mask1.noStroke();
  // mask1.fill(255, 255, 255);
  // mask1.ellipse(mouseX, mouseY, 10, 10);
  // ellipse(512 + mouseX, mouseY, 10, 10);
  // image(mask1, 0, 0, 512, 512);

}
function mouseReleased() {
  // mask1Base64 = mask1.elt.toDataURL();
}

async function ask() {
  document.body.style.cursor = "progress";
  //image(img, 0, 0, 512, 512);
  //canvas.loadPixels();
  //mask1.loadPixels();
  // let mask1Base64 = mask1.elt.toDataURL();
  // let imgBase64 = canvas.elt.toDataURL();
  picture1.updatePixels();
  picture2.updatePixels();
  let picture1Base64 = picture1.elt.toDataURL("image/jpeg", 1.0);
  let picture2Base64 = picture2.elt.toDataURL("image/jpeg", 1.0);
  picture1Base64 = picture1Base64.split(",")[1];
  picture2Base64 = picture2Base64.split(",")[1];
  let postData = {
    input: {
      "prompt": inputBox.value(),
      "width": 512,
      "height": 512,
      "picture1": picture1Base64,
      "picture2": picture2Base64,

    },
  };

  let url = NGrokAddress + "/generateIt/";
  const options = {
    headers: {
      "Content-Type": `application/json`,
    },
    method: "POST",
    body: JSON.stringify(postData), //p)
  };
  console.log("Asking for Picture ", url, options);
  const response = await fetch(url, options);
  const result = await response.json();
  console.log(result.b64Image);
  document.body.style.cursor = "default";
  loadImage("data:image/jpeg;base64," + result.b64Image, function (newImage) {
    console.log("image loaded", newImage);
    resultImage = newImage;
  });

}
