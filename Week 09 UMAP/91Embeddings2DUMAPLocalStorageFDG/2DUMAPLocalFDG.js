import { UMAP } from "https://cdn.skypack.dev/umap-js";
import { TOX } from "https://cdn.skypack.dev/toxiclibsjs";

let canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.position = "absolute";
canvas.style.left = "0px";
canvas.style.top = "0px";
document.body.append(canvas);
let ctx = canvas.getContext('2d');

let myCluster;


let createUniverseField = document.createElement('input');
createUniverseField.type = "text";
createUniverseField.style.position = "absolute";
createUniverseField.style.left = "80%";
createUniverseField.style.top = "90%";
createUniverseField.style.transform = "translate(-50%,-50%)";
createUniverseField.style.width = "200px";
createUniverseField.id = "createUniverse";
createUniverseField.placeholder = "Create Universe";
document.body.append(createUniverseField);
createUniverseField.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        let universalMotto = createUniverseField.value;
        console.log("create universe", universalMotto);
        createUniverse(universalMotto);
    }
});

init();
animate();

function init() {
    let embeddingsAndSentences = JSON.parse(localStorage.getItem("embeddings"));
    if (embeddingsAndSentences) {
        runUMAP(embeddingsAndSentences);
    }
    else {
        console.log("no embeddings");
    }
    let physics = new TOX.VerletPhysics2D();
    // physics.setDrag(0.01);
    // physics.addBehavior(new TOX.GravityBehavior(new TOX.Vec2D(0, 0.1)));
    // physics.addBehavior(new TOX.AttractionBehavior(new TOX.Vec2D(window.innerWidth / 2, window.innerHeight / 2), window.innerWidth / 2, 0.01));
    // physics.addBehavior(new TOX.BoundaryBehavior(new TOX.Rect(0, 0, window.innerWidth, window.innerHeight), -0.3));
    // physics.addBehavior(new TOX.DampingBehavior(0.1));
    // physics.addBehavior(new TOX.FrictionBehavior(0.1));
}

function animate() {
    physics.update();
    requestAnimationFrame(animate);
}

class Particle extends VerletParticle2D {
    constructor(x, y, r, text) {
        super(x, y);
        this.r = r;
        this.text = text;
        this.embedding = embedding;
    }
    show() {
        fill(127);
        stroke(0);
        circle(this.x, this.y, this.r * 2);
        text(text, this.x, this.y);
    }
}

class Cluster {
    constructor(sentencesAndEmbeddings, UMAPFittings) {
        this.particles = [];
        for (let i = 0; i < sentencesAndEmbeddings.length; i++) {
            let x = UMAPFittings[i][0] * window.innerWidth;
            let y = UMAPFittings[i][1] * window.innerHeight;
            this.particles.push(new Particle(x, y, 4));
        }
        for (let i = 0; i < this.particles.length - 1; i++) {
            for (let j = 0; j < this.particles.length; j++) {
                if (i != j) {
                    let distance = this.particles[i].distanceTo(this.particles[j]);
                    if (distance < 100) {
                        physics.addSpring(new VerletSpring2D(this.particles[i], this.particles[j], distance, 0.01));
                    }
                }
            }
        }
    }
    show() {
        for (let particle of this.particles) {
            particle.show();
        }
    }
}

function placeSentence(sentence, fitting) {
    console.log("placeSentence", sentence, fitting);
    ctx.font = "20px Arial";
    ctx.fillStyle = "rgba(100,100,100,127)";
    let width = ctx.measureText(sentence).width;
    ctx.fillText(sentence, fitting[0] * window.innerWidth, fitting[1] * window.innerHeight);

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
    myCluster = new Cluster(embeddingsAndSentences, fittings);
    //for (let i = 0; i < embeddingsAndSentences.length; i++) {
    //    placeSentence(embeddingsAndSentences[i].input, fittings[i]);
    //}
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