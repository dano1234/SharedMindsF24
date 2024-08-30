import * as MAIN from "./main.js";
const replicateProxy = "https://replicate-api-proxy.glitch.me";



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

export function showAskButtons() {

    let askButtons = document.createElement("div");
    askButtons.style.position = "absolute";
    askButtons.style.top = "80%";
    askButtons.style.left = "50%";
    askButtons.style.transform = "translate(-50%, -50%)";
    askButtons.style.width = "300px";
    askButtons.style.zIndex = "5";
    document.body.appendChild(askButtons);

    let feedback = document.createElement("div");
    //feedback.style.position = "absolute";
    //feedback.style.top = "0px";
    //feedback.style.left = "30%";
    //feedback.style.zIndex = "5";
    askButtons.appendChild(feedback);

    const textInput = document.createElement("input");
    textInput.setAttribute("type", "text");
    textInput.setAttribute("id", "textInput");
    textInput.setAttribute("placeholder", "Enter text here");
    askButtons.appendChild(textInput);
    // textInput.style.position = "absolute";
    //textInput.style.top = "50%";
    // textInput.style.left = "50%";
    //override css
    textInput.style.width = "265px";
    //textInput.style.transform = "translate(-50%, -50%)";
    textInput.style.zIndex = "7";


    /////////////////////////////////////////////////////
    /////////////////////////////////////////////////////

    let askReplicateTextButton = document.createElement("button");
    askReplicateTextButton.innerHTML = '<img src="./icons/text_icon.jpg" alt="Text Icon" />';

    //askReplicateTextButton.textContent = "Replicate Text to Text";
    askButtons.appendChild(askReplicateTextButton);
    askReplicateTextButton.addEventListener("click", async function () {
        const inputBox = document.getElementById("textInput")
        const data = {
            //mistral "cf18decbf51c27fed6bbdc3492312c1c903222a56e3fe9ca02d6cbe5198afc10",
            //llama  "2d19859030ff705a87c746f7e96eea03aefb71f166725aee39692f1476566d48"
            "version": "2d19859030ff705a87c746f7e96eea03aefb71f166725aee39692f1476566d48",
            input: {
                prompt: inputBox.value,
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
            let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
            MAIN.addTextRemote(incomingText, mouse);
        }
    });


    /////////////////////////////////////////////////////
    /////////////////////////////////////////////////////


    let askReplicateImageButton = document.createElement("button");
    askReplicateImageButton.innerHTML = '<img src="./icons/image_icon.jpg" alt="Image Icon" />';
    askButtons.appendChild(askReplicateImageButton);
    askReplicateImageButton.addEventListener("click", async function () {
        const data = {
            //"version": "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            "version": "727e49a643e999d602a896c774a0658ffefea21465756a6ce24b7ea4165eba6a",
            input: {
                prompt: document.getElementById("textInput").value,
                width: 512,
                height: 512,
            },
        };
        feedback.innerHTML = "Waiting for reply from API...";
        let url = replicateProxy + "/create_n_get/";
        let replicateJSON = await myFetch(url, data,);
        console.log("replicateJSON", replicateJSON);
        if (replicateJSON.output.length == 0) {
            feedback.innerHTML = "Something went wrong, try it again";
        } else {
            feedback.innerHTML = "";
            let imageURL = replicateJSON.output[0];
            console.log("imageURL", imageURL);
            let image = new Image();
            image.crossOrigin = "Anonymous";
            image.onload = function () {
                console.log("image loaded", image);
                let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
                let canvas = document.createElement("canvas");
                canvas.width = image.width;
                canvas.height = image.height;
                let context = canvas.getContext("2d");
                context.drawImage(image, 0, 0);
                let base64 = canvas.toDataURL();
                MAIN.addImageRemote(base64, mouse, document.getElementById("textInput").value);
            }
            image.src = imageURL;

        }
    });

    /////////////////////////////////////////////////////
    /////////////////////////////////////////////////////

    let askReplicateMusicButton = document.createElement("button");
    askReplicateMusicButton.innerHTML = '<img src="./icons/music_icon.png" alt="Music Icon" />';
    askButtons.appendChild(askReplicateMusicButton);
    askReplicateMusicButton.addEventListener("click", async function () {
        let data = {
            //replicate / riffusion / riffusion
            "version": "8cf61ea6c56afd61d8f5b9ffd14d7c216c0a93844ce2d82ac1c9ecc9c7f24e05",
            input: {
                "prompt_a": document.getElementById("textInput").value,
            },
        };
        console.log("Asking for Sound Info From Replicate via Proxy", data);
        let options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        };
        feedback.innerHTML = "Waiting for reply from API...";
        let url = replicateProxy + "/create_n_get/";
        let replicateJSON = await myFetch(url, data,);
        if (replicateJSON.output.length == 0) {
            feedback.innerHTML = "Something went wrong, try it again";
        } else {
            let audioURL = replicateJSON.output.audio;
            let incomingData = await fetch(audioURL);
            const ctx = new AudioContext();
            let arrayBuffer = await incomingData.arrayBuffer();
            let b64 = bufferToBase64(arrayBuffer);
            b64 = "data:audio/wav;base64," + b64;
            let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
            MAIN.addAudioRemote(b64, mouse, audioURL, inputBox.value);
            feedback.innerHTML = "";
        }
    });

    function bufferToBase64(buffer) {
        var bytes = new Uint8Array(buffer);
        var len = buffer.byteLength;
        var binary = "";
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    /////////////////////////////////////////////////////
    /////////////////////////////////////////////////////

    let askReplicate3DButton = document.createElement("button");
    askReplicate3DButton.innerHTML = '<img src="./icons/3D_icon.png" alt="3D Icon" />';
    askButtons.appendChild(askReplicate3DButton);
    askReplicate3DButton.addEventListener("click", async function () {
        let data = {
            "version": "5957069d5c509126a73c7cb68abcddbb985aeefa4d318e7c63ec1352ce6da68c",
            "input": {
                "prompt": document.getElementById("textInput").value,
                "save_mesh": true,
                "batch_size": 1,
                "render_mode": "nerf",
                "render_size": 32,
                "guidance_scale": 15
            }
        };
        console.log("Asking for 3D From Replicate via Proxy", data);
        let options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        };
        feedback.innerHTML = "Waiting for reply from API...";
        let url = replicateProxy + "/create_n_get/";
        let replicateJSON = await myFetch(url, data,);
        if (replicateJSON.output.length == 0) {
            feedback.innerHTML = "Something went wrong, try it again";
        } else {
            let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
            let objURL = replicateJSON.output[1];
            console.log("3D Object", objURL);
            MAIN.add3DModelRemote(objURL, mouse, document.getElementById("textInput").value);
            feedback.innerHTML = "";
        }
    });


}





