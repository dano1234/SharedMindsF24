const container = document.getElementById("container");
var input_image_field = document.createElement("input");
input_image_field.type = "text";
input_image_field.id = "input_image_prompt";
input_image_field.value = "Gothic Fairy";
container.appendChild(input_image_field);
input_image_field.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        askForPicture(input_image_field.value);
    }
});

var input_field = document.createElement("input");
input_field.type = "text";
input_field.id = "input_prompt";
input_field.value = "Gothic Fairy";
container.appendChild(input_field);
input_field.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        askForWords(input_field.value);
    }
});



async function askForPicture(p_prompt) {
    const imageDiv = document.getElementById("resulting_image");
    imageDiv.innerHTML = "Waiting for reply from Replicate's Stable Diffusion API...";
    let data = {
        "version": "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",
        input: {
            "prompt": p_prompt,
        },
    };
    console.log("Asking for Picture Info From Replicate via Proxy", data);
    let options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };
    const picture_info = await fetch("https://proxy-replicate-stablediffusion-api.glitch.me/replicate_api", options);
    //console.log("picture_response", picture_info);
    const proxy_said = await picture_info.json();
    let prediction_id = proxy_said.id;
    data = { 'id': prediction_id, };
    console.log("Asking for Picture From Replicate via Proxy", data);
    options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };
    console.log("Asking for Actual Picture From Replicate via Proxy", options);
    const picture_response = await fetch("https://proxy-replicate-stablediffusion-api.glitch.me/replicate_image_from_id", options);
    console.log("proxy relayed this about picture:", picture_response);
    const picture_json = await picture_response.json();
    if (picture_json.output.length == 0) {
        imageDiv.innerHTML = "Something went wrong, try it again";
    } else {
        imageDiv.innerHTML = "";
        let img = document.createElement("img");
        img.src = picture_json.output[0];
        imageDiv.appendChild(img);
    }
}

async function askForWords(p_prompt) {
    const imageDiv = document.getElementById("resulting_image");
    imageDiv.innerHTML = "Waiting for reply from Replicate...";
    const data = {
        "version": "58d078176e02c219e11eb4da5a02a7830a283b14cf8f94537af893ccff5ee781",
        input: {
            prompt: p_prompt,
        },
    };
    console.log("Asking for Words From Replicate via Proxy", data);
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };
    const picture_response = await fetch("https://proxy-replicate-stablediffusion-api.glitch.me/replicate_api", options);
    //console.log("picture_response", picture_response);
    const proxy_said = await picture_response.json();
    console.log("proxy relayed this about picture:", proxy_said);
    /*
    if (proxy_said.output.length == 0) {
        imageDiv.innerHTML = "Something went wrong, try it again";
    } else {
        imageDiv.innerHTML = "";
        let img = document.createElement("img");
        img.src = proxy_said.output[0];
        imageDiv.appendChild(img);
    }
    */
}