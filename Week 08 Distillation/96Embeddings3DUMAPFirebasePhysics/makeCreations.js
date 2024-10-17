
const replicateProxy = "https://replicate-api-proxy.glitch.me"

export async function manufactureFakePrompts() {
    let text = "give me a json object with 36 prompts  for stable diffusion image generation organized into 6 themes"
    document.body.style.cursor = "progress";
    // // feedback.html("Waiting for reply from OpenAi...");
    const data = {
        model: "gpt-3.5-turbo-instruct", //"gpt-3.5-turbo-instruct", //"gpt-4-1106-preview", //"gpt-4-1106-preview",//
        prompt: text,
        temperature: 0,
        max_tokens: 1000,
        // response_format: { "type": "json_object" },
        //  n: 1,
        //  stop: "\n",
    };
    // const data = {
    //     "model": "gpt-4-1106-preview",
    //     "messages": [{ "role": "user", "content": "Say this is a test!" }],
    //     "temperature": 0.7
    // }
    console.log("Asking for Words From OpenAI via Proxy", data);
    let options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(data),
    };
    const openAIProxy = "https://openai-api-proxy.glitch.me";

    const url = openAIProxy + "/AskOpenAI/";  //"/askOpenAIChat/"; // 
    console.log("words url", url, "words options", options);
    const response = await fetch(url, options);
    console.log("words_response", response);
    const openAI_json = await response.json();
    console.log("openAI_json", openAI_json);
    if (openAI_json.choices.length == 0) {
        //feedback.html("Something went wrong, try it again");
        return 0;
    } else {
        let prompts = [];
        for (let i = 0; i < openAI_json.choices.length; i++) {
            prompts.push(openAI_json.choices[i].text);
        }
        //let promptsArray = prompts.split("\n");
        for (let i = 0; i < prompts.length; i++) {

            let prompt = prompts[i];
            if (prompt.length < 30) {
                continue;
            }
            prompt = prompt.slice(2).trim();
            //place is some random place for now
            lon = Math.random() * 360 - 180;
            lat = Math.random() * 60 - 30;
            computeCameraOrientation();
            console.log("prompt created", prompt);
            await getImageEmbeddingB64IntoFirebase(prompt);
        }
    }
    document.body.style.cursor = "auto";

}

async function getImageEmbeddingB64IntoFirebase(thisPrompt) {
    let all = {}
    let embedding = await askForEmbedding(thisPrompt);
    all.embedding = embedding;
    all.prompt = thisPrompt;
    let imageURL = await askForPicture(thisPrompt);
    let b64 = await convertURLToBase64(imageURL);
    all.image = { base64Image: b64, url: imageURL };
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
    await incomingImage.decode();
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    canvas.height = incomingImage.height;
    canvas.width = incomingImage.width;
    ctx.drawImage(incomingImage, 0, 0, canvas.width, canvas.height);
    let base64 = canvas.toDataURL("image/png", 1.0);
    return base64;
}

