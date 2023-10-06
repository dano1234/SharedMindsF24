
const NGrokAddress = "https://0dd6126a7ee0.ngrok.app";

let promptsSlider;
let slider;
let leftImage;
let rightImage;
let middleImage;
let whichPrompt = "left";

let stepsInput;
let widthOfImageInput;
let heightOfImageInput;
let feedback;

let imagesTopPosition = 30;
let wordsTopPosition = 500;


function setup() {
  createParamInterface();
  createCanvas(1024, 1536);
  //CHECK THE HTML AND CSS FILES FOR WHERE ALL THE ELEMENTS ARE ARE CREATED AND STYLED
  wordsTopPosition = imagesTopPosition + int(heightOfImageInput.value()) + 20;
  document.getElementById("prompt1").addEventListener("mouseup", function () { selectedNewWord("left"); });
  document.getElementById("prompt2").addEventListener("mouseup", function () { selectedNewWord("right"); });
  document.getElementById("prompt1").addEventListener("change", function () { changedPrompt("left"); });
  document.getElementById("prompt2").addEventListener("change", function () { changedPrompt("right"); });
  slider = document.getElementById("betweenWordsSlider");
  slider.style.position = "absolute";
  slider.style.display = "none";  //hide it for now
  slider.addEventListener("mouseup", function () { askBetweenWords(); });
  promptsSlider = document.getElementById("betweenPromptsSlider");
  promptsSlider.addEventListener("mouseup", function () { askBetweenPrompts(); });
  feedback.html("Asking for initial images..");
  let prompt1 = document.getElementById("prompt1").value;
  ask(prompt1, "left");
  let prompt2 = document.getElementById("prompt2").value;
  ask(prompt2, "right");
}

function draw() {
  background(255);
  const w = int(widthOfImageInput.value());
  const h = int(heightOfImageInput.value());
  if (leftImage) image(leftImage, 0, imagesTopPosition, w, h);
  if (rightImage) image(rightImage, width - w, imagesTopPosition, w, h);
  if (middleImage) image(middleImage, width / 2 - w / 2, 650, w, h);
}

function showSlider(leftWord, rightWord, distanceFromTop, whichSide) {
  console.log("showSlider", leftWord, rightWord, distanceFromTop);
  slider.style.display = "block"; //make it visiable
  if (whichSide == "left") {
    slider.value = 0;
  } else {
    slider.value = 1;
  }
  let whichPrompt = whichSide;

}

function changedPrompt(whichSide) {
  console.log("changedWords", whichSide);
  document.getElementById("leftWord").value = "";
  let prompt = "";
  if (whichSide == "left") {
    leftImage = null; //blank out picture
    prompt = document.getElementById("prompt1").value;
  } else {
    rightImage = null; //blank out picture
    prompt = document.getElementById("prompt2").value;
  }
  whichPrompt = whichSide;
  ask(prompt, whichSide);
}

async function askBetweenWords() {
  whichSide = whichPrompt;
  rightWord = document.getElementById("rightWord").value;
  leftWord = document.getElementById("leftWord").value;
  sliderVal = slider.value
  document.body.style.cursor = "progress";
  feedback.html("Asking for image in between...");
  let wordInPrompt = "";
  let otherWord = "";
  if (whichSide == "left") {
    wordInPrompt = leftWord;
    otherWord = rightWord;
    strengthOfOtherWord = float(sliderVal).toFixed(2);
    prompt = document.getElementById("prompt1").value;
  } else {
    wordInPrompt = rightWord;
    otherWord = leftWord;
    strengthOfOtherWord = (1 - float(sliderVal).toFixed(2));
    prompt = document.getElementById("prompt2").value;
  }

  let postData = {
    input: {
      "prompt": prompt,
      "width": int(widthOfImageInput.value()),
      "height": int(heightOfImageInput.value()),
      "steps": int(stepsInput.value()),
      "wordInPrompt": wordInPrompt,
      "otherWord": otherWord,
      "strengthOfOtherWord": float(strengthOfOtherWord),

    },
  };
  console.log("askBetween", postData);

  let url = NGrokAddress + "/betweenWords/";
  const options = {
    headers: {
      "Content-Type": `application/json`,
    },
    method: "POST",
    body: JSON.stringify(postData), //p)
  };
  console.log("Asking for Between Words ", url, postData);
  const response = await fetch(url, options);
  const result = await response.json();
  const imageInfo = "data:image/jpeg;base64," + result.b64Image;
  console.log("Got Between Words");

  feedback.html("Got between image.");
  document.body.style.cursor = "default";
  loadImage(imageInfo, function (newImage) {
    console.log("image loaded", newImage);
    middleImage = newImage;
  });

}
async function ask(prompt, whichSide) {
  document.body.style.cursor = "progress";

  let postData = {
    input: {
      "prompt": prompt,
      "width": int(widthOfImageInput.value()),
      "height": int(heightOfImageInput.value()),
      "steps": int(stepsInput.value()),
    },
  };

  let url = NGrokAddress + "/justImage/";
  const options = {
    headers: {
      "Content-Type": `application/json`,
    },
    method: "POST",
    body: JSON.stringify(postData), //p)
  };
  console.log("Asking for Picture ", url, postData);
  const response = await fetch(url, options);
  const result = await response.json();
  const imageInfo = "data:image/jpeg;base64," + result.b64Image;
  //console.log(result.b64Image);
  console.log(whichSide);
  document.body.style.cursor = "default";
  feedback.html("Got image.");
  if (whichSide == "left") {
    loadImage(imageInfo, function (newImage) {
      console.log("image loaded", newImage);
      leftImage = newImage;
    });
  }
  if (whichSide == "right") {
    loadImage(imageInfo, function (newImage) {
      console.log("image loaded", newImage);
      rightImage = newImage;
    });
  }
  if (whichSide == "middle") {
    loadImage(imageInfo, function (newImage) {
      console.log("image loaded", newImage);
      middleImage = newImage;
    });
  }
}

async function askBetweenPrompts() {

  prompt1 = document.getElementById("prompt1").value;
  prompt2 = document.getElementById("prompt2").value;
  distance = document.getElementById("betweenPromptsSlider").value;
  document.body.style.cursor = "progress";
  feedback.html("Asking for image in between prompts...");

  let postData = {
    input: {
      "prompt1": prompt1,
      "prompt2": prompt2,
      "distance": distance,
    },
  };
  console.log("askBetween", postData);

  let url = NGrokAddress + "/betweenPrompts/";
  const options = {
    headers: {
      "Content-Type": `application/json`,
    },
    method: "POST",
    body: JSON.stringify(postData), //p)
  };
  console.log("Asking for Between Prompts ", url, postData);
  const response = await fetch(url, options);
  const result = await response.json();
  const imageInfo = "data:image/jpeg;base64," + result.b64Image;
  console.log("Got Between Prompts");

  feedback.html("Got between image.");
  document.body.style.cursor = "default";
  loadImage(imageInfo, function (newImage) {
    console.log("image loaded", newImage);
    middleImage = newImage;
  });

}

function selectedNewWord(which) {
  console.log("selected", which);
  let prompt1 = document.getElementById("prompt1");

  word1 = prompt1.value.slice(prompt1.selectionStart, prompt1.selectionEnd).trim();
  document.getElementById("leftWord").value = word1;

  let prompt2 = document.getElementById("prompt2");

  word2 = prompt2.value.slice(prompt2.selectionStart, prompt2.selectionEnd).trim();
  document.getElementById("rightWord").value = word2;


  if (word1 != "" && word2 != "") {
    showSlider(word1, word2, wordsTopPosition + 30, which);
  }
  console.log("selected", word1, word2);
}




function createParamInterface() {
  stepsLabel = createSpan("Steps");
  stepsLabel.position(10, 10);
  stepsInput = createInput("50");
  stepsInput.position(50, 10);
  stepsInput.size(30, 13);
  widthLabel = createSpan("Width");
  widthLabel.position(100, 10);
  widthOfImageInput = createInput("512");
  widthOfImageInput.position(150, 10);
  widthOfImageInput.size(30, 13);
  heightLabel = createSpan("Height");
  heightLabel.position(200, 10);
  heightOfImageInput = createInput("512");
  heightOfImageInput.position(250, 10);
  heightOfImageInput.size(30, 13);
  feedback = createDiv("Feedback");
  feedback.position(300, 10);
  feedback.size(700, 13);
}
// function addWord(word) {
//   const w = int(widthOfImageInput.value());
//   const h = int(heightOfImageInput.value());
//   let leftInput = createInput(word);
//   let distanceFromTop = wordsTopPosition + leftInputs.length * 30;
//   leftInput.position(0, distanceFromTop);
//   leftInput.size(200, 20);
//   leftInput.changed(function () { changedWord(this.value(), "left"); });
//   leftInputs.push(leftInput);
//   let rightInput = createInput(word);
//   rightInput.position(width - w, distanceFromTop);
//   rightInput.size(200, 20);
//   rightInput.changed(function () { changedWord(this.value(), "right"); });
//   rightInputs.push(rightInput);
//   rightInput.mouseClicked(function () { showSlider(leftInput, rightInput, distanceFromTop, "right"); });

//   // adderLeft.position(40, 10 + rightInputs.length * 30);
//   // adderRight.position(width - 40, 10 + rightInputs.length * 30);
//   // adderLeft.value("Add Word");
//   // adderRight.value("Add Word");
// }

// let x = 100
// let y = 100;
// slider.style.width = '200px';
// if (whichSide == "left") {
//   selectedWord = document.getElementById("leftWord");
//   console.log("selectedWord", selectedWord);
//   x = int(selectedWord.getBoundingClientRect().left) + int(slider.style.width);
//   y = selectedWord.getBoundingClientRect().top + (int(slider.style.height));
// } else {
//   selectedWord = document.getElementById("rightWord")
//   x = selectedWord.getBoundingClientRect().left - + int(slider.style.width);
//   y = selectedWord.getBoundingClientRect().top;
// }
// console.log("showSlider", x, y);
// slider.style.left = x + 'px';
// slider.style.top = y + 'px';
// slider.style.display = "block";



// addWord("A")
// addWord("Picture")
// addWord("Of")
// addWord("A")
// addWord("Dog")
// let prompt = "";
// for (let i = 0; i < leftInputs.length; i++) {
//   prompt += leftInputs[i].value() + " ";
// }
/*

*/