import { getRecordedData } from "./testFetchMLInputs.js";
import { GoogleGenerativeAI } from 'https://esm.run/@google/generative-ai'

const openAIProxy = "https://openai-api-proxy.glitch.me";
const replicateProxy = "https://replicate-api-proxy.glitch.me";

let feedback = document.createElement("p");
feedback.style.position = "absolute";
feedback.style.top = "0px";
feedback.style.left = "30%";
feedback.style.zIndex = "5";
document.body.appendChild(feedback);

async function myFetch(url, data) {
    document.body.style.cursor = "progress";
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
    return json_response;
}


let outputText = document.createElement("textarea");
outputText.id = "outputText";
outputText.style.position = "absolute";
outputText.style.top = "10px";
outputText.style.left = "60%";
outputText.style.width = "300px";
outputText.style.height = "150px";
document.body.appendChild(outputText);

let outputImage = document.createElement("img");
outputImage.id = "outputImage";
outputImage.style.position = "absolute";
outputImage.style.top = "50%";
outputImage.style.left = "60%";
outputImage.style.width = "512px";
outputImage.style.height = "512px";
document.body.appendChild(outputImage);


let askButtons = document.createElement("div");
askButtons.style.position = "absolute";
askButtons.style.top = "10px";
askButtons.style.left = "30%";
askButtons.style.width = "300px";
askButtons.style.height = "100%";
document.body.appendChild(askButtons);


/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
askButtons.appendChild(document.createElement("br"));
askButtons.appendChild(document.createElement("br"));

let askReplicateTextButton = document.createElement("button");
askReplicateTextButton.textContent = "Replicate Text to Text";
askButtons.appendChild(askReplicateTextButton);
askReplicateTextButton.addEventListener("click", async function () {
    const data = {
        //mistral "cf18decbf51c27fed6bbdc3492312c1c903222a56e3fe9ca02d6cbe5198afc10",
        //llama  "2d19859030ff705a87c746f7e96eea03aefb71f166725aee39692f1476566d48"
        "version": "2d19859030ff705a87c746f7e96eea03aefb71f166725aee39692f1476566d48",

        input: {
            prompt: document.getElementById("textInput").value,
            max_tokens: 100,
            max_length: 100,
        },
    };
    feedback.innerHTML = "Waiting for reply from API...";
    let url = replicateProxy + "/create_n_get/";
    let replicateJSON = await myFetch(url, data);
    if (replicateJSON.output.length == 0) {
        feedback.innerHTML = "Something went wrong, try it again";
    } else {
        feedback.innerHTML = "";
        console.log("proxy_said", replicateJSON.output.join(""));
        let incomingText = replicateJSON.output.join("");
        document.getElementById("outputText").value = incomingText;
    }
});


/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
askButtons.appendChild(document.createElement("br"));
askButtons.appendChild(document.createElement("br"));

let askReplicateImageButton = document.createElement("button");
askReplicateImageButton.textContent = "Replicate Text to Image";
askButtons.appendChild(askReplicateImageButton);
askReplicateImageButton.addEventListener("click", async function () {
    const data = {
        "version": "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        input: {
            prompt: document.getElementById("textInput").value,
            width: 512,
            height: 512,
        },
    };
    feedback.innerHTML = "Waiting for reply from API...";
    let url = replicateProxy + "/create_n_get/";
    let replicateJSON = await myFetch(url, data,);
    if (replicateJSON.output.length == 0) {
        feedback.innerHTML = "Something went wrong, try it again";
    } else {
        let imageURL = replicateJSON.output[0];
        let image = document.getElementById("outputImage");
        image.onload = function (image) {
            console.log("image loaded", image);
        }
        image.src = imageURL;

    }
});

/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
askButtons.appendChild(document.createElement("br"));
askButtons.appendChild(document.createElement("br"));

let askReplicateFastImageButton = document.createElement("button");
askReplicateFastImageButton.textContent = "Replicate Fast Text to Image";
askButtons.appendChild(askReplicateFastImageButton);
askReplicateFastImageButton.addEventListener("click", async function () {
    const data = {
        "version": "727e49a643e999d602a896c774a0658ffefea21465756a6ce24b7ea4165eba6a",
        input: {
            prompt: document.getElementById("textInput").value,
            width: 512,
            height: 512,
        },
    };
    feedback.innerHTML = "Waiting for reply from API...";
    let url = replicateProxy + "/create_n_get/";
    let replicateJSON = await myFetch(url, data);
    if (replicateJSON.output.length == 0) {
        feedback.innerHTML = "Something went wrong, try it again";
    } else {
        let imageURL = replicateJSON.output[0];
        let image = document.getElementById("outputImage");
        image.onload = function (image) {
            console.log("image loaded", image);
        }
        image.src = imageURL;

    }
});


/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
askButtons.appendChild(document.createElement("br"));
askButtons.appendChild(document.createElement("br"));

let askReplicateImageImageButton = document.createElement("button");
askReplicateImageImageButton.textContent = "Replicate Image to Image";
askButtons.appendChild(askReplicateImageImageButton);
askReplicateImageImageButton.addEventListener("click", async function () {
    //get canvas from html image element
    let image = document.getElementById("inputImage");
    let canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    let context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    let imgBase64 = canvas.toDataURL();
    let data = {
        version: "15a3689ee13b0d2616e98820eca31d4c3abcd36672df6afce5cb6feb1d66087d",
        input: {
            prompt: document.getElementById("textInput").value,
            negative_prompt: "",
            // width: 512,
            // height: 512,
            prompt_strength: 0.8,
            image: imgBase64,
        },
    };
    feedback.innerHTML = "Waiting for reply from API...";
    let url = replicateProxy + "/create_n_get/";
    let replicateJSON = await myFetch(url, data);
    if (replicateJSON.output.length == 0) {
        feedback.innerHTML = "Something went wrong, try it again";
    } else {
        let imageURL = replicateJSON.output[0];

        let image = document.getElementById("outputImage");
        image.onload = function (image) {
            console.log("image loaded");
        }
        image.src = imageURL;

    }
});


/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
askButtons.appendChild(document.createElement("br"));
askButtons.appendChild(document.createElement("br"));

let askOpenAIImageButton = document.createElement("button");
askOpenAIImageButton.textContent = "OpenAI Text to Image";
askButtons.appendChild(askOpenAIImageButton);
askOpenAIImageButton.addEventListener("click", async function () {
    const data = {
        prompt: document.getElementById("textInput").value,
        n: 2,
        response_format: "b64_json",
        size: "512x512",
    };
    feedback.innerHTML = "Waiting for reply from API...";
    let url = openAIProxy + "/AskOpenAIImage/"
    let openAI_json = await myFetch(url, data);
    let image = document.getElementById("outputImage");
    image.onload = function (image) {
        console.log("image loaded", image);
    }
    image.src = "data:image/jpeg;base64," + openAI_json.data[0].b64_json;
});

askButtons.appendChild(document.createElement("br"));
askButtons.appendChild(document.createElement("br"));

let askOpenAITranscriptionButton = document.createElement("button");
askOpenAITranscriptionButton.textContent = "OpenAI Transcription";
askButtons.appendChild(askOpenAITranscriptionButton);
askOpenAITranscriptionButton.addEventListener("click", async function () {
    const recordedData = getRecordedData();
    if (!recordedData) {
        alert("Please record audio first");
        return;
    }
    const formData = new FormData();

    formData.append("file", recordedData);
    formData.append("model", "whisper-1");

    feedback.innerHTML = "Waiting for reply from API...";
    const url = openAIProxy + "/askOpenAIAudio/";
    const response = await fetch(url, {
        mode: "cors",
        method: "POST",
        body: formData,
    });
    const openAI_json = await response.json();
    document.getElementById("outputText").value = openAI_json.transcription;
});

/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
askButtons.appendChild(document.createElement("br"));
askButtons.appendChild(document.createElement("br"));

let askGoogleTextButton = document.createElement("button");
askGoogleTextButton.textContent = "Google Text to Text";
askButtons.appendChild(askGoogleTextButton);
askGoogleTextButton.addEventListener("click", async function () {
    document.body.style.cursor = "progress";
    //no proxy needed for google
    //free and they don't use CORS
    // Fetch your API_KEY
    const API_KEY = "AIzaSyBwpIh4hEnpu-VzOFF44dqyOBp71SyRqGM";
    //have to import google library at the top:
    //import { GoogleGenerativeAI } from 'https://esm.run/@google/generative-ai'
    // Access your API key (see "Set up your API key" above)
    const genAI = new GoogleGenerativeAI(API_KEY);

    const model = genAI.getGenerativeModel({ model: "models/gemini-pro" });
    const prompt = document.getElementById("textInput").value;
    const result = await model.generateContent(prompt);
    console.log("result", result);
    const response = await result.response;
    const text = response.text();
    document.getElementById("outputText").value = text;
    document.body.style.cursor = "auto";
});