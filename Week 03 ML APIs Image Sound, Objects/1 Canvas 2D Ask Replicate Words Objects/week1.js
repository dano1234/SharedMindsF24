
let inputLocationX = window.innerWidth / 2;
let inputLocationY = window.innerHeight / 2;
let inputBoxDirectionX = 1;
let inputBoxDirectionY = 1;

let canvas;
let ctx;
let inputBox;
const url = "https://replicate-api-proxy.glitch.me/create_n_get/";
let responseWords = [];
let promptWords = [];

init();

function init() {

    // Perform initialization logic here
    initInterface();
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < promptWords.length; i++) {
        let thisPromptWord = promptWords[i];
        let word = thisPromptWord.word;
        let location = thisPromptWord.location;
        ctx.font = '30px Arial';
        ctx.fillStyle = 'red';
        let w = ctx.measureText(word).width;
        ctx.fillText(word, location.x - w / 2, location.y);
    }

    for (let i = 0; i < responseWords.length; i++) {
        let thisResponseWord = responseWords[i];
        let word = thisResponseWord.word;
        let location = thisResponseWord.location;
        ctx.font = '24px Arial';
        ctx.fillStyle = 'black';
        let w = ctx.measureText(word).width;
        ctx.fillText(word, location.x - w / 2, location.y);
    }


    requestAnimationFrame(animate);
}




async function askWord(promptWord, location) {
    let thisPromptWord = {
        word: promptWord,
        location: location,
    }
    promptWords.push(thisPromptWord);
    let prompt = "a json list of 5 words related to " + promptWord + " with no extra words or punctuation";
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
    let textResponseJSON = JSON.parse(textResponse);
    let angleIncrements = 2 * Math.PI / textResponseJSON.length;
    let radius = 100;
    for (let i = 0; i < textResponseJSON.length; i++) {
        textResponseJSON[i] = textResponseJSON[i].replace(/[^a-zA-Z ]/g, "");
        console.log(textResponseJSON[i]);
        let angle = i * angleIncrements;
        let xPos = location.x + radius * Math.cos(angle);
        let yPos = location.y + radius * Math.sin(angle);
        let thisWord = {
            word: textResponseJSON[i],
            location: { x: xPos, y: yPos },
            prompt: promptWord,
        }
        responseWords.push(thisWord);
    }
    inputBoxDirectionX = 1;
    inputBoxDirectionY = 1;
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
    ctx = canvas.getContext('2d');
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
            askWord(inputValue, { x: inputLocationX, y: inputLocationY });

        }
    });



    // Add event listener to the document for mouse down event
    document.addEventListener('mousedown', (event) => {
        // Set the location of the input box to the mouse location
        inputLocationX = event.clientX;
        inputLocationY = event.clientY;
        inputBoxDirectionX = 0;
        inputBoxDirectionY = 0;
        for (let i = 0; i < responseWords.length; i++) {
            let thisResponseWord = responseWords[i];
            let location = thisResponseWord.location;
            let dist = Math.sqrt((location.x - inputLocationX) * (location.x - inputLocationX) + (location.y - inputLocationY) * (location.y - inputLocationY));
            if (dist < 50) {
                console.log("Clicked on ", thisResponseWord.word);
                inputBox.value = thisResponseWord.word;
                askWord(thisResponseWord.word, location);
                break;
            }
        }
    });
}


