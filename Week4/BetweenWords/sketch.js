
const NGrokAddress = "https://firm-honeybee-noticeably.ngrok-free.app";
let leftInputs = [];
let rightInputs = [];
let adderLeft;
let adderRight;
let leftImage;
let rightImage;
let middleImage;

function setup() {

  createCanvas(1024, 1024);
  adderLeft = createInput("Add Word");
  adderLeft.position(40, 10);
  adderLeft.size(200, 20);
  adderLeft.changed(function () { addWord(adderLeft.value()); });
  adderRight = createInput("Add Word");
  adderRight.position(width - 40, 10);
  adderRight.size(200, 20);
  adderRight.changed(function () { addWord(adderRight.value()); });
  addWord("A")
  addWord("Picture")
  addWord("Of")
  addWord("A")
  addWord("Dog")
  let prompt = "";
  for (let i = 0; i < leftInputs.length; i++) {
    prompt += leftInputs[i].value() + " ";
  }
  ask(prompt, "leftAndRight");

}

function addWord(word) {
  let newInput = createInput(word);
  newInput.position(40, 10 + leftInputs.length * 30);
  //console.log("newInput", newInput.length);
  newInput.size(200, 20);
  newInput.changed(ask);
  newInput = createInput(word);
  leftInputs.push(newInput);
  newInput.position(width - 40, 10 + rightInputs.length * 30);
  newInput.size(200, 20);
  newInput.changed(ask);
  adderLeft.position(40, 10 + rightInputs.length * 30);
  adderRight.position(width - 40, 10 + rightInputs.length * 30);
  rightInputs.push(newInput);
  adderLeft.value("Add Word");
  adderRight.value("Add Word");
}


function draw() {
  if (leftImage) image(leftImage, leftInputs.length * 30 + 40, 0, 256, 256);
  if (rightImage) image(rightImage, rightInputs.length * 30 + 40, 0, 256, 256);
  if (middleImage) image(middleImage, 256, 0, 256, 256);
}



async function ask(prompt, asker) {

  let postData = {
    input: {
      "prompt": prompt,
      "width": 512,
      "height": 512,
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
  const imageInfo = "data:image/jpeg;base64," + result.b64Image;
  console.log(result.b64Image);

  if (asker == "leftAndRight" || asker == "left") {
    loadImage(imageInfo, function (newImage) {
      console.log("image loaded", newImage);
      leftImage = newImage;
    });
  }
  if (asker == "leftAndRight" || asker == "right") {
    loadImage(imageInfo, function (newImage) {
      console.log("image loaded", newImage);
      rightImage = newImage;
    });
  }
  if (asker == "middle") {
    loadImage(imageInfo, function (newImage) {
      console.log("image loaded", newImage);
      middleImage = newImage;
    });
  }


}
