const NGrokAddress = "https://firm-honeybee-noticeably.ngrok-free.app";

const container = document.getElementById("container");
var input_image_field = document.createElement("input");
input_image_field.type = "text";
input_image_field.id = "input_image_prompt";
input_image_field.value = "A student trying to learn how use a machine learning API";
container.appendChild(input_image_field);
input_image_field.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        askForPicture(input_image_field.value);
    }
});


async function askForPicture(p_prompt) {
    const imageDiv = document.getElementById("resulting_image");
    imageDiv.innerHTML = "Waiting for reply from Colabs via NGrok...";

    let data = {
        input: {
            "prompt": p_prompt,
            "width": 512,
            "height": 512,
        },
    };

    console.log("Asking for Picture Info From Colabs via NGrok", data);
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
    imageDiv.innerHTML = "";
    let img = document.createElement("img");
    img.src = "data:image/jpeg;base64," + result.b64Image;
    imageDiv.appendChild(img);
}
