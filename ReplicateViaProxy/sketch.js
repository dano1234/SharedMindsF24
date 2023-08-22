var input_field = document.createElement("input");
input_field.type = "text";
input_field.id = "input_prompt";
input_field.value = "Gothic Fairy";
const container = document.getElementById("container");
container.appendChild(input_field);
input_field.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        askForPicture(input_field.value);
    }
});

async function askForPicture(p_prompt) {
    const imageDiv = document.getElementById("resulting_image");
    imageDiv.innerHTML = "Waiting for reply from Replicate...";
    const data = {
        input: {
            prompt: p_prompt,
        },
    };
    console.log("Asking for Picture From Replicate via Proxy", data);
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };
    const picture_response = await fetch("/replicate_api/", options);
    const proxy_said = await picture_response.json();
    console.log("proxy relayed this about picture:", proxy_said);
    if (proxy_said.output.length == 0) {
        imageDiv.innerHTML = "Something went wrong, try it again";
    } else {
        imageDiv.innerHTML = "";
        let img = document.createElement("img");
        img.src = proxy_said.output[0];
        imageDiv.appendChild(img);
    }
}