
const openAIProxy = "https://openai-api-proxy.glitch.me"

let img;

function setup() {
    createCanvas(512, 512);
    let input_image_field = createInput("A student trying to learn how use a machine learning API");
    input_image_field.size(600);

    input_image_field.id("input_image_prompt");
    input_image_field.parent("image_container");
    //add a button to ask for picture
    let button1 = createButton("AskPicture");
    button1.mousePressed(() => {
        askForImage(input_image_field.value());
    });

    let input_field = createInput("Why should learn to use a machine learning API?");
    input_field.id("input_prompt");
    input_field.size(600);
    input_field.parent("text_container");
    //add a button to ask for words
    let button2 = createButton("AskWords");
    button2.parent("text_container");
    button2.mousePressed(() => {
        askForWords(input_field.value());
    });
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
