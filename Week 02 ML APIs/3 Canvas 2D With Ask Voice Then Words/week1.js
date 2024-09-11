
let inputLocationX = window.innerWidth / 2;
let inputLocationY = window.innerHeight / 2;
let inputBoxDirectionX = 1;
let inputBoxDirectionY = 1;

let mediaStream;
let mediaRecorder;
let audioContext;

let canvas;
let inputBox;
const url = "https://replicate-api-proxy.glitch.me/create_n_get/";

init();

function init() {

    // Perform initialization logic here
    setUpRecorder();
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

async function askVoiceThenWord(audio, location) {
    const b64Audio = await convertBlobToBase64(audio);

    let data = {
        fieldToConvertBase64ToURL: "audio",
        fileFormat: "wav",
        version: "4d50797290df275329f202e48c76360b3f22b08d28c196cbc54600319435f8d2",
        input: {
            audio: b64Audio,
        },
    };

    let options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(data),
    };
    let response = await fetch(url, options);
    let response_json = await response.json();
    console.log("audio_response", response_json);
    word = response_json.output.transcription;

    let prompt = "a json list of 5 words related to " + word + "with no extra words or punctuation";
    document.body.style.cursor = "progress";
    data = {
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
    options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: 'application/json',
        },
        body: JSON.stringify(data),
    };
    let raw_response = await fetch(url, options);
    //turn it into json
    json_response = await raw_response.json();
    document.body.style.cursor = "auto";
    let textResponse = json_response.output.join("").trim();
    drawWord(word, textResponse, location);

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
    //console.log('canvas', canvas.width, canvas.height);


    inputBox = document.createElement('input');
    inputBox.setAttribute('type', 'text');

    inputBox.setAttribute('id', 'inputBox');
    inputBox.setAttribute('placeholder', 'X');
    inputBox.style.position = 'absolute';
    inputBox.style.left = '50%';
    inputBox.style.top = '50%';
    inputBox.style.width = '30px';
    inputBox.style.transform = 'translate(-50%, -50%)';
    inputBox.style.zIndex = '100';
    inputBox.style.fontSize = '20px';
    inputBox.style.fontFamily = 'Arial';
    document.body.appendChild(inputBox);

    // Add event listener to the input box
    // inputBox.addEventListener('keydown', function (event) {
    //     // Check if the Enter key is pressed

    //     if (event.key === 'Enter') {
    //         const inputValue = inputBox.value;
    //         askWord(inputValue, { x: inputLocationX, y: inputLocationY });
    //         inputBoxDirectionX = 1;
    //         inputBoxDirectionY = 1;
    //     }
    // });

    // Add event listener to the document for mouse down event
    document.addEventListener('mousedown', (event) => {
        console.log("Recording started");
        // Set the location of the input box to the mouse location
        inputLocationX = event.clientX;
        inputLocationY = event.clientY;
        inputBoxDirectionX = 0;
        inputBoxDirectionY = 0;

        mediaRecorder.start();

        setTimeout(stopRecording, 2000);

    });
}

function stopRecording() {
    mediaRecorder.stop();
    console.log("Recording stopped");
}


async function convertBlobToBase64(audioBlob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function () {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = function (error) {
            reject(error);
        };
        reader.readAsDataURL(audioBlob);
    });
}



async function setUpRecorder() {
    audioContext = new AudioContext();
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    let mrChunks = [];

    // Create a media recorder and start recording
    mediaRecorder = new MediaRecorder(mediaStream);
    mediaRecorder.addEventListener("dataavailable", (event) => {
        mrChunks.push(event.data);
    });
    mediaRecorder.addEventListener("stop", (event) => {
        const recordedData = new Blob(mrChunks, { type: "audio/webm" });
        console.log("Recording stopped", recordedData);

        // let av = document.createElement("VIDEO");
        // var audioURL = window.URL.createObjectURL(recordedData);
        // av.src = audioURL;
        // av.width = 100;
        // av.height = 20;
        // document.body.appendChild(av);
        // av.play();
        // console.log(av);

        askVoiceThenWord(recordedData, { x: inputLocationX, y: inputLocationY });
        mrChunks = [];
    });

}

