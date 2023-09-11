let img;
let button;
let inputBox;
let mask;
let maskBase64 = "";
let canvas;
const replicateProxy = "https://proxy-replicate-stablediffusion-api.glitch.me"


function preload() {
  img = loadImage("jacob.jpeg");
}
function setup() {
  button = createButton("Ask");
  button.mousePressed(ask);
  button.position(530, 40);
  inputBox = createInput("Old Man");
  inputBox.position(530, 10);

  canvas = createCanvas(512, 512);
  mask = createGraphics(512, 512);
  image(img, 0, 0);
}

function draw() {
  // background(220);
  //image(img, 0, 0);

  //image(mask, 0, 0);
}

function mouseDragged() {
  mask.noStroke();
  mask.fill(255, 255, 255);
  mask.ellipse(mouseX, mouseY, 10, 10);
  image(mask, 0, 0);
}
function mouseReleased() {
  maskBase64 = mask.elt.toDataURL();
}

async function ask() {
  let imgBase64 = canvas.elt.toDataURL();
  let maskBase64 = mask.elt.toDataURL();
  //imgBase64 = imgBase64.split(",")[1];
  //maskBase64 = maskBase64.split(",")[1];
  // let postData = {
  // data: [{ image: imgBase64, mask: maskBase64 }, inputBox.value()],
  //};

  let postData = {
    "version": "da77bc59ee60423279fd632efb4795ab731d9e3ca9705ef3341091fb989b7eaf",
    input: {
      "prompt": inputBox.value(),
      "width": 512,
      "height": 512,
      "image": imgBase64,
      "mask": maskBase64,


    },
  };

  let url = replicateProxy + "/create_n_get";
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
  console.log(result.output[0]);
  // imageDiv.innerHTML = "";
  // let img = document.createElement("img");
  //img.src = result.output[0];
  // imageDiv.appendChild(img);
  loadImage(result.output[0], function (newImage) {
    //"data:image/png;base64," +
    console.log("image loaded", newImage);
    // image(img, 0, 0);
    mask = createGraphics(512, 512);
    image(mask, 0, 0);
    img = newImage;
    image(img, 0, 0);
  });

}
