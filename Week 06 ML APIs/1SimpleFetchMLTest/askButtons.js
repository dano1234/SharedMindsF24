import { getRecordedData } from "./testFetchML.js";

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
askReplicateTextButton.textContent = "Replicate Text";
askButtons.appendChild(askReplicateTextButton);
askReplicateTextButton.addEventListener("click", async function () {
    const data = {
        "version": "35042c9a33ac8fd5e29e27fb3197f33aa483f72c2ce3b0b9d201155c7fd2a287",
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

let askReplicateFastImageButton = document.createElement("button");
askReplicateFastImageButton.textContent = "Replicate Fast Image";
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

let askReplicateImageButton = document.createElement("button");
askReplicateImageButton.textContent = "Replicate Image";
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

let askOpenAIImageButton = document.createElement("button");
askOpenAIImageButton.textContent = "OpenAI Image";
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


// async function askForImage(p_prompt) {
//     document.body.style.cursor = "progress";

//     feedback.html("Waiting for reply from OpenAi...");
//     const data = {
//         prompt: p_prompt,
//         n: 2,
//         response_format: "b64_json",
//         size: "512x512",
//     };
//     console.log("Asking Images From OpenAI via Proxy", data);
//     let options = {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//             Accept: "application/json",
//         },
//         body: JSON.stringify(data),
//     };
//     const url = openAIProxy + "/AskOpenAIImage/";
//     console.log("words url", url, "words options", options);
//     const response = await fetch(url, options);
//     console.log("words_response", response);
//     const openAI_json = await response.json();
//     console.log("openAI_json", openAI_json.data[0].b64_json);
//     //allow cross origin loading of images

//     loadImage(
//         "data:image/jpeg;base64," + openAI_json.data[0].b64_json,
//         function (incomingImage) {
//             img = incomingImage;
//             console.log("img", img);
//         }
//     );

//     document.body.style.cursor = "auto";
// }

// async function askForAudio(audio) {
//     document.body.style.cursor = "progress";

//     feedback.html("Waiting for reply from OpenAi Audio...");
//     //read test.m4a file audio file from disk
//     //https://stackoverflow.com/questions/10058814/get-data-from-fs-readfile

//     console.log("Asking Audio From OpenAI via Proxy");

//     const formData = new FormData();
//     formData.append("file", audio);
//     formData.append("model", "whisper-1");

//     const url = openAIProxy + "/askOpenAIAudio/";
//     console.log("audio url", url);

//     const response = await fetch(url, {
//         mode: "cors",
//         method: "POST",
//         body: formData,
//     });

//     const openAI_json = await response.json();
//     console.log("audio_response", openAI_json.transcription);
//     feedback.html(openAI_json.transcription);

//     document.body.style.cursor = "auto";
// }