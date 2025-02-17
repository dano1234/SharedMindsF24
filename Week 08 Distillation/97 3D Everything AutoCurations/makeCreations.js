import { storeInFirebase } from "./firebaseMOD.js";
import { getPositionInFrontOfCamera } from "./3DStuff.js";
const replicateProxy = "https://replicate-api-proxy.glitch.me"


export async function getDataFromProjectsAPI() {
    let text = "give me a json object with 36 prompts  for stable diffusion image generation organized into 6 themes"
    document.body.style.cursor = "progress";
    // // feedback.html("Waiting for reply from OpenAi...");
    let url = "https://itp.nyu.edu/projects/public/projectsJSON_ALL.php?venue_id=204";

    console.log("Asking info from project Database");
    let options = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
    };

    const response = await fetch(url, options);
    console.log("words_response", response);
    const projects_json = await response.json();
    console.log("openAI_json", projects_json);
    for (let i = 0; i < projects_json.length; i++) {

        let title = projects_json[i].project_name;
        let description = projects_json[i].description;
        let elevatorPitch = projects_json[i].elevatorPitch;
        let keywords = projects_json[i].keywords;
        let tech = projects_json[i].techical_system;
        let user_scenario = projects_json[i].user_scenario;
        let image_url = "https://itp.nyu.edu" + projects_json[i].image;

        let prompt = description + " " + elevatorPitch + " " + keywords + " " + title + " " + tech + " " + user_scenario;
        console.log("prompt created", prompt, image_url);
        await getEmbeddingB64IntoFirebase(prompt, image_url, title);
    }
    // if (openAI_json.choices.length == 0) {
    //     //feedback.html("Something went wrong, try it again");
    //     return 0; 
    // } else {
    //     let prompts = [];
    //     for (let i = 0; i < openAI_json.choices.length; i++) {
    //         prompts.push(openAI_json.choices[i].text);
    //     }
    //     //let promptsArray = prompts.split("\n");
    //     for (let i = 0; i < prompts.length; i++) {

    //         let prompt = prompts[i];
    //         if (prompt.length < 30) {
    //             continue;
    //         }
    //         prompt = prompt.slice(2).trim();
    //         //place is some random place for now
    //         lon = Math.random() * 360 - 180;
    //         lat = Math.random() * 60 - 30;
    //         computeCameraOrientation();
    //         console.log("prompt created", prompt);
    //         await getImageEmbeddingB64IntoFirebase(prompt);
    //     }
    // }
    document.body.style.cursor = "auto";

}

async function getEmbeddingB64IntoFirebase(thisPrompt, imageURL, title) {
    let all = {}
    all.title = title;
    all.text_embedding = await askForEmbedding(thisPrompt);
    all.image_embedding = await askForImageEmbedding(imageURL);
    all.prompt = thisPrompt;

    //let imageURL = await askForPicture(thisPrompt);
    let b64 = "none"; //await convertURLToBase64(imageURL);
    all.image = { url: imageURL };  //base64Image: b64, 
    all.location = getPositionInFrontOfCamera();
    storeInFirebase(all);
}


async function askForEmbedding(p_prompt) {
    //let promptInLines = p_prompt.replace(/,/g,) "\n";  //replace commas with new lines
    p_prompt = p_prompt + "\n"
    let data = {
        version: "75b33f253f7714a281ad3e9b28f63e3232d583716ef6718f2e46641077ea040a",
        input: {
            inputs: p_prompt,
        },
    };
    console.log("Asking for Embedding Similarities From Replicate via Proxy", data);
    let options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };
    const url = replicateProxy + "/create_n_get/";
    let rawResponse = await fetch(url, options)
    let jsonData = await rawResponse.json();
    return jsonData.output[0].embedding;
}


async function askForImageEmbedding(prompt, imageURL) {
    //let justBase64 = base64.split(",")[1];
    const data = {
        "version": "0383f62e173dc821ec52663ed22a076d9c970549c209666ac3db181618b7a304",
        "input": {
            "input": imageURL,
            "modality": "vision"
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
    return replicateJSON.output;
}


async function askForPicture(text) {
    input_image_field.value = "Waiting for reply for:" + text;
    // prompt = inputField.value;
    //inputField.value = "Waiting for reply for:" + prompt;
    let data = {
        "version": "c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316",
        input: {
            "prompt": text,
        },
    };
    //console.log("Asking for Picture Info From Replicate via Proxy", data);
    let options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };
    const url = replicateProxy + "/create_n_get/"
    //console.log("url", url, "options", options);
    const picture_info = await fetch(url, options);
    //console.log("picture_response", picture_info);
    const proxy_said = await picture_info.json();
    console.log("Proxy Returned", proxy_said);
    if (proxy_said.output.length == 0) {
        alert("Something went wrong, try it again");
    } else {
        input_image_field.value = text;
        return proxy_said.output[0];
    }
}

async function convertURLToBase64(url) {
    var incomingImage = new Image();
    incomingImage.crossOrigin = "anonymous";
    incomingImage.src = url;
    //await incomingImage.decode();
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    canvas.height = incomingImage.height;
    canvas.width = incomingImage.width;
    ctx.drawImage(incomingImage, 0, 0, canvas.width, canvas.height);
    let base64 = canvas.toDataURL("image/png", 1.0);
    return base64;
}

