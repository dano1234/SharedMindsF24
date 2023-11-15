let lora_field;
let prompt_field;
const replicateProxy = "https://replicate-api-proxy.glitch.me";
let imgs = [];

const myLoraUrl =
  "https://replicate.delivery/pbxt/0KIe8eZNXTuPeIe89ye2U2qRaxClHID7yobYA3cfqiAuV1AeIA/tmptyicwiwqdano_lora_itpzip.safetensors";

function setup() {
  createCanvas(1024, 1024);
  lora_field = createInput(myLoraUrl);
  lora_field.size(550);
  lora_field.position(0, 0);

  prompt_field = createInput("a photo of a man next to his horse");
  prompt_field.size(550);
  prompt_field.position(0, 20);
  //add a button to ask for words
  let button = createButton("Use Lora");
  button.position(550, 20);
  button.mousePressed(() => {
    askForLora(prompt_field.value(), lora_field.value());
  });
  textSize(18);
}

function draw() {
  background(255);
  if (img[0]) image(img, 0, 0);
}

async function askForLora(prompt, loraUrl) {
  let data = {
    version: "bb149dd20427beccf1b9f6332c7d5c233d914173fd463faa2c4a011080133afc",
    input: {
      //     width: 512,
      //     height: 512,
      prompt: prompt,
      lora_urls: loraUrl,
      //     scheduler: "DPMSolverMultistep",
      lora_scales: "0.5", //string?
      //     num_outputs: 1,    //string?
      guidance_scale: 7.5,
      //     negative_prompt: "frame",
      num_inference_steps: 50,
    },
  };

  let options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
  const url = replicateProxy + "/create_n_get/";
  console.log("url", url, "options", data);
  const raw = await fetch(url, options);
  const proxy_said = await raw.json();
  let output = proxy_said.output;
  console.log("Proxy Returned", output);
  for (let i = 0; i < 4; i++) {
    if (output.length > 0) {
      loadImage(output[0], (incomingImage) => {
        img = incomingImage;
      });
    }
  }
}
