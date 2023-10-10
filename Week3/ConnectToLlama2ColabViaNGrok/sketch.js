const NGrokAddress = "https://dano.ngrok.dev";

const container = document.getElementById("container");
var input_image_field = document.createElement("input");
input_image_field.type = "text";
input_image_field.id = "input_image_prompt";
input_image_field.value = "A student trying to learn how use a machine learning API";
container.appendChild(input_image_field);
input_image_field.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        askForText(input_image_field.value);
    }
});


async function askForText(p_prompt) {
    const textDiv = document.getElementById("resulting_text");
    textDiv.innerHTML = "Waiting for reply from Colabs via NGrok...";

    let data = {
        input: {
            "prompt": p_prompt,
            "width": 512,
            "height": 512,
        },
    };

    console.log("Asking for Text Info From Colabs via NGrok", data);
    let options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };
    //const picture_info = await fetch(NGrokAddress + "/dummypath/", options);
    const picture_info = await fetch(NGrokAddress + "/generateIt/", options);
    console.log("picture_response", picture_info);
    const result = await picture_info.json();
    console.log("json", result);
    textDiv.innerHTML = result.response;

}
