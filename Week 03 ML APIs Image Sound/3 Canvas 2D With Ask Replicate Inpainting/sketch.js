
let inputLocationX = window.innerWidth / 2;
let inputLocationY = window.innerHeight / 2;
let inputBoxDirectionX = 1;
let inputBoxDirectionY = 1;

let canvas;
let inputBox;
const url = "https://replicate-api-proxy.glitch.me/create_n_get/";

init();

function init() {

    // Perform initialization logic here
    initInterface();
    askPictures("the disneyland of my life disagrees with my level of hapieness", { x: 0, y: 0 });
    animate();
}

// Animate loop
function animate() {
    // Perform animation logic here
    inputLocationX = inputLocationX + inputBoxDirectionX;
    inputLocationY = inputLocationY + inputBoxDirectionY;
    if (inputLocationX > window.innerWidth || inputLocationX < 0) {
        inputBoxDirectionX = - inputBoxDirectionX;
    }
    if (inputLocationY > window.innerHeight || inputLocationY < 0) {
        inputBoxDirectionY = - inputBoxDirectionY;
    }

    inputBox.style.left = inputLocationX + 'px';
    inputBox.style.top = inputLocationY + 'px';
    requestAnimationFrame(animate);
}

function drawWord(prompt, response, location) {
    const ctx = canvas.getContext('2d');
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '30px Arial';
    ctx.fillStyle = 'black';
    let responseWidth = ctx.measureText(response).width;
    let promptWidth = ctx.measureText(prompt).width;
    ctx.fillText(response, location.x - responseWidth / 2, location.y);
    ctx.fillText(prompt, location.x - promptWidth / 2, location.y + 50);
}




async function askPictures(word, location) {
    let prompt = "a json list of 5 words related to " + word + " with no extra words or punctuation";
    document.body.style.cursor = "progress";
    const data = {
        //mistral "cf18decbf51c27fed6bbdc3492312c1c903222a56e3fe9ca02d6cbe5198afc10",
        //llama  "2d19859030ff705a87c746f7e96eea03aefb71f166725aee39692f1476566d48"
        //modelURL: "https://api.replicate.com/v1/models/meta/meta-llama-3-70b-instruct/predictions",
        version: "7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",   //stable diffusion
        input: {
            prompt: prompt,
        },
    };
    console.log("Making a Fetch Request", data);
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: 'application/json',
        },
        body: JSON.stringify(data),
    };

    const picture_info = await fetch(url, options);
    //console.log("picture_response", picture_info);
    const proxy_said = await picture_info.json();

    if (proxy_said.output.length == 0) {
        console.log("Something went wrong, try it again");
    } else {

        let img = document.createElement("img");
        img.src = proxy_said.output[0];
        img.onload = function () {
            let ctx = canvas.getContext('2d');
            ctx.drawImage(img, location.x, location.y);
        }
        // document.body.appendChild(img);
        // img.style.position = 'absolute';
        // img.style.left = location.x + 'px';
        // img.style.top = location.y + 'px';
        // img.style.width = '256px';
        // img.style.height = '256px';
        // img.src = proxy_said.output[0];

    }
    document.body.style.cursor = "auto";
    inputBoxDirectionX = 1;
    inputBoxDirectionY = 1;
}


async function askWord(word, location) {
    let prompt = "a json list of 5 words related to " + word + " with no extra words or punctuation";
    document.body.style.cursor = "progress";
    const data = {
        //mistral "cf18decbf51c27fed6bbdc3492312c1c903222a56e3fe9ca02d6cbe5198afc10",
        //llama  "2d19859030ff705a87c746f7e96eea03aefb71f166725aee39692f1476566d48"
        //"version": "2d19859030ff705a87c746f7e96eea03aefb71f166725aee39692f1476566d48",
        modelURL: "https://api.replicate.com/v1/models/meta/meta-llama-3-70b-instruct/predictions",
        input: {
            prompt: prompt,
            max_tokens: 100,
            max_length: 100,
        },
    };
    console.log("Making a Fetch Request", data);
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: 'application/json',
        },
        body: JSON.stringify(data),
    };
    const raw_response = await fetch(url, options);
    //turn it into json
    const json_response = await raw_response.json();
    document.body.style.cursor = "auto";
    let textResponse = json_response.output.join("").trim();
    drawWord(word, textResponse, location);

    console.log("Response", json_response, text, location);
}


function initInterface() {
    // Get the input box and the canvas element
    canvas = document.createElement('canvas');
    canvas.setAttribute('id', 'myCanvas');
    canvas.style.position = 'absolute';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    document.body.appendChild(canvas);
    console.log('canvas', canvas.width, canvas.height);


    inputBox = document.createElement('input');
    inputBox.setAttribute('type', 'text');
    inputBox.setAttribute('id', 'inputBox');
    inputBox.setAttribute('placeholder', 'Enter text here');
    inputBox.style.position = 'absolute';
    inputBox.style.left = '50%';
    inputBox.style.top = '50%';
    inputBox.style.transform = 'translate(-50%, -50%)';
    inputBox.style.zIndex = '100';
    inputBox.style.fontSize = '30px';
    inputBox.style.fontFamily = 'Arial';
    document.body.appendChild(inputBox);
    inputBox.setAttribute('autocomplete', 'off');

    // Add event listener to the input box
    inputBox.addEventListener('keydown', function (event) {
        // Check if the Enter key is pressed

        if (event.key === 'Enter') {
            const inputValue = inputBox.value;
            //askWord(inputValue, { x: inputLocationX, y: inputLocationY });
            askPictures(inputValue, { x: inputLocationX, y: inputLocationY });

        }
    });

    // Add event listener to the document for mouse down event
    document.addEventListener('mousedown', (event) => {
        // Set the location of the input box to the mouse location
        inputLocationX = event.clientX;
        inputLocationY = event.clientY;
        inputBoxDirectionX = 0;
        inputBoxDirectionY = 0;
    });
}



