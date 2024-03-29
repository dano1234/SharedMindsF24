import { UMAP } from "https://cdn.skypack.dev/umap-js";

let canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.position = "absolute";
canvas.style.left = "0px";
canvas.style.top = "0px";
document.body.append(canvas);
let ctx = canvas.getContext('2d');


let createUniverseField = document.createElement('input');
createUniverseField.type = "text";
createUniverseField.style.position = "absolute";
createUniverseField.style.left = "80%";
createUniverseField.style.top = "90%";
createUniverseField.style.transform = "translate(-50%,-50%)";
createUniverseField.style.width = "350px";
createUniverseField.id = "createUniverse";
createUniverseField.placeholder = "Enter a motto and press Enter to create a universe";
document.body.append(createUniverseField);
createUniverseField.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        let universalMotto = createUniverseField.value;
        console.log("create universe", universalMotto);
        createUniverse(universalMotto);
    }
});

init();

function init() {
    let embeddingsAndSentences = JSON.parse(localStorage.getItem("embeddings"));
    if (embeddingsAndSentences) {
        runUMAP(embeddingsAndSentences);
    }
    else {
        console.log("no embeddings");
    }
}

function placeSentence(sentence, fitting) {
    console.log("placeSentence", sentence, fitting);
    ctx.font = "20px Arial";
    ctx.fillStyle = "rgba(100,100,100,127)";
    let w = ctx.measureText(sentence).width;
    ctx.fillText(sentence, fitting[0] * window.innerWidth - w / 2, fitting[1] * window.innerHeight);

    //or use DOM elements
    // let sentenceDiv = document.createElement('div');
    // sentenceDiv.style.position = "absolute";
    // sentenceDiv.style.left = fitting[0] * window.innerWidth + "px";
    // sentenceDiv.style.top = fitting[1] * window.innerHeight + "px";
    // sentenceDiv.style.transform = "translate(-100%,-50%)";
    // sentenceDiv.style.width = "100px";
    // sentenceDiv.style.backgroundColor = "rgba(255,255,255,.5)";
    // sentenceDiv.innerHTML = sentence;
    // document.body.append(sentenceDiv);
}

async function createUniverse(universalMotto) {
    document.body.style.cursor = "progress";
    let text = "give me a json object with 36 short descriptions of a people with the motto " + universalMotto + " organized into  6 different types of people";

    // // feedback.html("Waiting for reply from OpenAi...");

    ///////////GET SENTENCES
    const data = {
        model: "gpt-3.5-turbo-instruct", //"gpt-3.5-turbo-instruct", //"gpt-4-1106-preview", //"gpt-4-1106-preview",//
        prompt: text,
        temperature: 0,
        max_tokens: 1000,
    };

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
    console.log("asking sentences", url, "words options", options);
    const response = await fetch(url, options);
    const openAI_json = await response.json();
    //console.log("openAI_json", openAI_json.choices[0].text);
    let arrayOfStrings = openAI_json.choices[0].text.split("\n");
    let sentences = "";
    //clean up the sentences, replicate want string with /n delims
    for (let i = 0; i < arrayOfStrings.length; i++) {
        let thisSentence = arrayOfStrings[i].substring(1);
        if (thisSentence.length < 30) {  //skip the types of people
            continue;
        }
        console.log("prompt created", thisSentence);
        //GET AND EMBEDDING FOR EACH SENTENCE
        sentences += thisSentence + "\n";
    }

    //////////GET EMBEDDINGS
    //document.getElementById("feedback").innerHTML = "Getting Embeddings...";
    //let promptInLines = p_prompt.replace(/,/g, "\n");
    let embeddingData = {
        version: "75b33f253f7714a281ad3e9b28f63e3232d583716ef6718f2e46641077ea040a",
        input: {
            inputs: sentences,
        },
    };
    console.log("Asking for Embedding Similarities From Replicate via Proxy", data);
    options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(embeddingData),
    };
    const replicateProxy = "https://replicate-api-proxy.glitch.me"

    const replicateURL = replicateProxy + "/create_n_get/";
    console.log("url", replicateURL, "options", options);
    const raw = await fetch(replicateURL, options)
    const embeddingsJSON = await raw.json();
    console.log("embeddingsJSON", embeddingsJSON.output);
    document.body.style.cursor = "auto";
    localStorage.setItem("embeddings", JSON.stringify(embeddingsJSON.output));
    runUMAP(embeddingsJSON.output)
}



function runUMAP(embeddingsAndSentences) {

    //comes back with a list of embeddings and Sentences, single out the embeddings for UMAP
    console.log("embeddingsAndSentences", embeddingsAndSentences);
    let embeddings = [];
    for (let i = 0; i < embeddingsAndSentences.length; i++) {
        embeddings.push(embeddingsAndSentences[i].embedding);
    }
    //let fittings = runUMAP(embeddings);
    var myrng = new Math.seedrandom('hello.');
    let umap = new UMAP({
        nNeighbors: 6,
        minDist: .5,
        nComponents: 2,
        random: myrng,  //special library seeded random so it is the same randome numbers every time
        spread: .99,
        //distanceFn: 'cosine',
    });
    let fittings = umap.fit(embeddings);
    fittings = normalize(fittings);  //normalize to 0-1
    for (let i = 0; i < embeddingsAndSentences.length; i++) {
        placeSentence(embeddingsAndSentences[i].input, fittings[i]);
    }
    //console.log("fitting", fitting);
}



function normalize(arrayOfNumbers) {
    //find max and min in the array
    let max = [0, 0];
    let min = [0, 0];
    for (let i = 0; i < arrayOfNumbers.length; i++) {
        for (let j = 0; j < 2; j++) {
            if (arrayOfNumbers[i][j] > max[j]) {
                max[j] = arrayOfNumbers[i][j];
            }
            if (arrayOfNumbers[i][j] < min[j]) {
                min[j] = arrayOfNumbers[i][j];
            }
        }
    }
    //normalize
    for (let i = 0; i < arrayOfNumbers.length; i++) {
        for (let j = 0; j < 2; j++) {
            arrayOfNumbers[i][j] = (arrayOfNumbers[i][j] - min[j]) / (max[j] - min[j]);
        }
    }
    return arrayOfNumbers;
}