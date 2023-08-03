
let button = document.createElement("button");
button.innerHTML = "Click me";
button.position = "absolute";
button.style.left = "100px";
button.style.top = "100px";
button.style.width = "100px";
button.style.height = "50px";

button.value = "Click me";
console.log(document.getElementById("sketch-holder"));
document.body.appendChild(button);

button.addEventListener("click", askReplicate);

async function askReplicate() {
    let prompt = "This is a test prompt";
    console.log("askReplicate called");
    const data = {
        version: 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4',
        input: {
            prompt: prompt,
        },
    };
    let api_key = "a9fa25b0a26c6943b69532e5ce5c4d6e6fe19f1f";
    //data_to_send.version = 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4';
    console.log(data);
    const replicate_url = "https://api.replicate.com/v1/predictions";
    const options = {
        headers: {
            Authorization: `Token ${api_key}`,
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(data),
    };
    const replicate_response = await fetch(replicate_url, options);
    const replicate_result = await replicate_response.json();
    const prediction_id = replicate_result.id;
    console.log("GOT A PREDICTION", replicate_result)


    // const picture_response = await fetch("/replicate_api/", options);
    // const proxy_said = await picture_response.json();
    // console.log("proxy relayed this about picture:", proxy_said);
    // if (proxy_said.output.length == 0) {
    //   imageDiv.innerHTML = "Something went wrong, try it again";
    // } else {
    //   imageDiv.innerHTML = "";
    //   let img = document.createElement("img");
    //   img.src = proxy_said.output[0];
    //   imageDiv.appendChild(img);
    // }
}