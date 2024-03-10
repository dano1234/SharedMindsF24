import * as FB from './firebaseAuth.js';

const replicateProxy = "https://replicate-api-proxy.glitch.me";
let exampleName = "2DEmbeddingDistances";

FB.initFirebase();



let inputField = document.getElementById("inputText");
inputField.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        askForPicture(inputField.value);
    }
});



async function askForPicture(prompt) {
    const data = {
        "version": "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        input: {
            prompt: prompt,
            seed: 42
        },
    };
    feedback.innerHTML = "Waiting for reply from API...";
    let url = replicateProxy + "/create_n_get/";
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
    const replicateJSON = await raw_response.json();
    document.body.style.cursor = "auto";

    console.log("replicateJSON", replicateJSON);
    if (replicateJSON.output.length == 0) {
        feedback.innerHTML = "Something went wrong, try it again";
    } else {
        feedback.innerHTML = "";
        let imageURL = replicateJSON.output[0];
        let localImage = document.getElementById("outputImage");
        localImage.crossOrigin = "Anonymous";
        localImage.onload = function () {
            console.log("image loaded", localImage);
            let canvas = document.createElement("canvas");
            canvas.width = localImage.width;
            canvas.height = localImage.height;
            let context = canvas.getContext("2d");
            context.drawImage(localImage, 0, 0);
            let base64 = canvas.toDataURL();
            //addImageRemote(base64,prompt);
        }
        localImage.src = imageURL;

    }
}

