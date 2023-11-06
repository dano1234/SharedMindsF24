
const openAIProxy = "https://openai-api-proxy.glitch.me"

let img;

function setup() {
    createCanvas(512, 512);
    let input_image_field = createInput("A student trying to learn how use a machine learning API");
    input_image_field.size(600);
    input_image_field.id("input_image_prompt");
    let button1 = createButton("AskPicture");
    button1.mousePressed(() => {
        askForImage(input_image_field.value());
    });
    createElement("br");
    let input_field = createInput("Why should learn to use a machine learning API?");
    input_field.id("input_prompt");
    input_field.size(600);
    let button2 = createButton("AskWords");
    button2.mousePressed(() => {
        askForWords(input_field.value());
    });
    createElement("br");


    setupAudio()
}

function draw() {
    if (img) image(img, 0, 0);
}


async function askForWords(p_prompt) {
    document.body.style.cursor = "progress";
    const textDiv = select("#resulting_text");
    textDiv.html("Waiting for reply from OpenAi...");
    const data = {
        model: "text-davinci-003",
        prompt: p_prompt,
        temperature: 0,
        max_tokens: 1000,
        //  n: 1,
        //  stop: "\n",
    };
    console.log("Asking for Words From OpenAI via Proxy", data);
    let options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: 'application/json',
        },
        body: JSON.stringify(data),
    };
    const url = openAIProxy + "/AskOpenAI/"
    console.log("words url", url, "words options", options);
    const response = await fetch(url, options);
    console.log("words_response", response);
    const openAI_json = await response.json();
    console.log("openAI_json", openAI_json);
    if (openAI_json.choices.length == 0) {
        textDiv.html("Something went wrong, try it again");
    } else {
        let choicesjoin = "";
        for (let i = 0; i < openAI_json.choices.length; i++) {
            choicesjoin += openAI_json.choices[i].text;
        }
        textDiv.html(choicesjoin);
        //console.log("proxy_said", proxy_said.output.join(""));
    }
    document.body.style.cursor = "auto";
}


async function askForImage(p_prompt) {
    document.body.style.cursor = "progress";
    const textDiv = select("#resulting_text");
    textDiv.html("Waiting for reply from OpenAi...");
    const data = {
        "prompt": "A cute baby sea horse",
        "n": 2,
        "response_format": "b64_json",
        "size": "1024x1024"
    };
    console.log("Asking Images From OpenAI via Proxy", data);
    let options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: 'application/json',
        },
        body: JSON.stringify(data),
    };
    const url = openAIProxy + "/AskOpenAIImage/"
    console.log("words url", url, "words options", options);
    const response = await fetch(url, options);
    console.log("words_response", response);
    const openAI_json = await response.json();
    console.log("openAI_json", openAI_json.data[0].b64_json);
    //allow cross origin loading of images



    loadImage("data:image/jpeg;base64," + openAI_json.data[0].b64_json, function (incomingImage) {
        img = incomingImage;
        console.log("img", img);
    });

    // //javascript way of loading images
    // var newImg = new Image;
    // newImg.onload = function (incomingImage) {
    //     img = incomingImage;
    //     console.log("img", img);
    // }
    // newImg.src = openAI_json.data[0].url;


    document.body.style.cursor = "auto";
}


async function askForAudio(audio) {

    document.body.style.cursor = "progress";
    const textDiv = select("#resulting_text");
    textDiv.html("Waiting for reply from OpenAi...");
    //read test.m4a file audio file from disk
    //https://stackoverflow.com/questions/10058814/get-data-from-fs-readfile



    const data = {
        "model": "whisper-1",
        "file": audio,
        // "prompt": "hey there",
        // "response_format": "json",
        // "temperature": 0.5
    };
    console.log("Asking Images From OpenAI via Proxy", data);
    let options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: 'application/json',
        },
        body: JSON.stringify(data),
    };
    const url = openAIProxy + "/askOpenAIAudio/"
    console.log("words url", url, "words options", options);
    const response = await fetch(url, options);
    console.log("words_response", response);
    const openAI_json = await response.json();
    console.log("openAI_json", openAI_json.data[0].b64_json);
    //allow cross origin loading of images



    loadImage("data:image/jpeg;base64," + openAI_json.data[0].b64_json, function (incomingImage) {
        img = incomingImage;
        console.log("img", img);
    });

    // //javascript way of loading images
    // var newImg = new Image;
    // newImg.onload = function (incomingImage) {
    //     img = incomingImage;
    //     console.log("img", img);
    // }
    // newImg.src = openAI_json.data[0].url;


    document.body.style.cursor = "auto";
}


function setupAudio() {
    // Set up the audio context and media stream
    const audioContext = new AudioContext();
    let mediaStream;
    let mediaRecorder;

    // Get the start and stop recording buttons
    const startButton = document.createElement('button');
    startButton.id = 'start-recording';
    startButton.textContent = 'Start Recording';
    document.body.appendChild(startButton);

    const stopButton = document.createElement('button');
    stopButton.id = 'stop-recording';
    stopButton.textContent = 'Stop Recording';
    document.body.appendChild(stopButton);



    // Add a click event listener to the start recording button
    startButton.addEventListener('click', async function () {
        // Request access to the user's microphone
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Create a media recorder and start recording
        mediaRecorder = new MediaRecorder(mediaStream);
        mediaRecorder.start();

        console.log('Recording started');
    });

    // Add a click event listener to the stop recording button
    stopButton.addEventListener('click', async function () {
        // Stop the media recorder and get the recorded data
        mediaRecorder.stop();
        const recordedData = await getRecordedData(mediaRecorder);

        console.log('Recording stopped', recordedData);
        askForAudio(recordedData)


    });

    // Function to get the recorded data from the media recorder
    function getRecordedData(mediaRecorder) {
        return new Promise(resolve => {
            mediaRecorder.addEventListener('dataavailable', event => {
                resolve(event.data);
            });
        });
    }
}