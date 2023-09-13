//THIS IS PROXY SERVER AS GO BETWEEN YOUR WEB PAGE AND REPLICATE API
const express = require("express");
const Datastore = require("nedb");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors"); // importing the `cors` package
app.use(express.json({ limit: "2mb" }));

const corsOptions = {
    origin: "*",
};

app.use(cors(corsOptions));
app.use(cors()); // tells Express to use `cors`, and solves the issue

app.listen(port, () => {
    console.log(`Starting server at ${port}`);
});
app.use(express.static("public"));
app.use(express.json({ limit: "2mb" }));
const api_key = process.env.REPLICATE_API_KEY;

var version = null;

//REPLICATE SEND PROMPT
app.post("/create_n_get", async (request, response) => {
    //await getModel(); //could be outside of this function but glitch restarts server alot while i debug.
    //START PREDICTION
    let data_to_send = request.body;

    //data_to_send.version = version;
    //console.log(version);
    console.log("data_to_send", data_to_send);
    const replicate_url = "https://api.replicate.com/v1/predictions";
    const options = {
        headers: {
            Authorization: `Token ${api_key}`,
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(data_to_send),
    };

    const replicate_response = await fetch(replicate_url, options);
    const replicate_result = await replicate_response.json();
    const prediction_id = replicate_result.id;
    console.log("GOT A PREDICTION", replicate_result.id);
    //response.json(replicate_result);

    //USE PREDICTION ID TO GET THE URL OF THE PICTURE
    const get_prediction_url =
        "https://api.replicate.com/v1/predictions/" + prediction_id;
    const header = {
        Authorization: `Token ${api_key}`,
        "Content-Type": "application/json",
        //Accept: "application/json",
    };

    //console.log(get_prediction_url, { headers: header });

    let get_prediction_response = null;
    let predictionStatus = null;
    let get_prediction_result = null;
    //it will get back to you with a few interim status reports so use do loop to wait for real thing.
    //could update web page with these status changes but I don't
    do {
        get_prediction_response = await fetch(get_prediction_url, {
            headers: header,
        });
        get_prediction_result = await get_prediction_response.json();
        console.log("got interim message", get_prediction_result);
        predictionStatus = get_prediction_result.status;
        await sleep(50);
    } while (["starting", "processing"].includes(predictionStatus));
    console.log(get_prediction_result);
    response.json(get_prediction_result);
});

async function getModel() {
    //MOST OF THE TIME WE LOOK UP VERSION IDS ON THE REPLICATE DOCS BUT YOU CAN GET DYNAMICALLY
    const model_url =
        "https://api.replicate.com/v1/models/stability-ai/stable-diffusion";
    let modelVersionOptions = {
        headers: { Authorization: `Token ${api_key}` },
        method: "GET",
    };
    const models_response = await fetch(model_url, modelVersionOptions);
    const models_result = await models_response.json();
    version = models_result.latest_version.id;
    console.log("We will be using this model version: ", version);
}

app.post("/hello", async (request, response) => {
    console.log("hellow");
    response.json({ hello: "world" });
});
app.get("/hello", async (request, response) => {
    console.log("hellow");
    response.json({ hello: "world" });
});

//REPLICATE SEND PROMPT
app.post("/replicate_api_id_from_prompt", async (request, response) => {
    //await getModel(); //could be outside of this function but glitch restarts server alot while i debug.
    //START PREDICTION
    let data_to_send = request.body;

    //data_to_send.version = version;
    //console.log(version);
    console.log("data_to_send", data_to_send);
    const replicate_url = "https://api.replicate.com/v1/predictions";
    const options = {
        headers: {
            Authorization: `Token ${api_key}`,
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(data_to_send),
    };

    const replicate_response = await fetch(replicate_url, options);
    const replicate_result = await replicate_response.json();
    const prediction_id = replicate_result.id;
    console.log("GOT A PREDICTION", replicate_result.id);
    response.json(replicate_result);

    //USE PREDICTION ID TO GET THE URL OF THE PICTURE
    const get_prediction_url =
        "https://api.replicate.com/v1/predictions/" + prediction_id;
    const header = {
        Authorization: `Token ${api_key}`,
        "Content-Type": "application/json",
        Accept: "application/json",
    };

    //console.log(get_prediction_url, { headers: header });

    let get_prediction_response = null;
    let predictionStatus = null;
    let get_prediction_result = null;
    //it will get back to you with a few interim status reports so use do loop to wait for real thing.
    //could update web page with these status changes but I don't
    do {
        get_prediction_response = await fetch(get_prediction_url, {
            headers: header,
        });
        get_prediction_result = await get_prediction_response.json();
        predictionStatus = get_prediction_result.status;
        await sleep(500);
    } while (["starting", "processing"].includes(predictionStatus));
    console.log(get_prediction_result);
    response.json(get_prediction_result);
});

app.post("/replicate_prediction_output_from_id", async (request, response) => {
    //USE PREDICTION ID TO GET THE URL OF THE PICTURE
    let prediction_id = request.body.id;
    console.log("prediction id", prediction_id);
    const get_prediction_url =
        "https://api.replicate.com/v1/predictions/" + prediction_id;
    const header = {
        Authorization: `Token ${api_key}`,
        "Content-Type": "application/json",
        Accept: "application/json",
    };

    //console.log(get_prediction_url, { headers: header });

    let get_prediction_response = null;
    let predictionStatus = null;
    let get_prediction_result = null;
    //it will get back to you with a few interim status reports so use do loop to wait for real thing.
    //could update web page with these status changes but I don't
    do {
        get_prediction_response = await fetch(get_prediction_url, {
            headers: header,
        });
        get_prediction_result = await get_prediction_response.json();
        predictionStatus = get_prediction_result.status;
        await sleep(500);
    } while (["starting", "processing"].includes(predictionStatus));
    console.log(get_prediction_result);
    response.json(get_prediction_result);
});

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
