

let canvasDimension = 512;

let imagers = [];
let currentImager = null;


const url = "https://replicate-api-proxy.glitch.me/create_n_get/";
let mouseDown = false;

init();

function init() {

    // Perform initialization logic here
    initMouseStuff();
    // Load Disney.png and paint it on the canvas
    const img = new Image();
    let newImager = new Imager({ x: 300, y: 300 });
    imagers.push(newImager);
    currentImager = newImager;
    // img.onload = function () {
    //     const ctx = canvas.getContext('2d');
    //     ctx.drawImage(img, 0, 0);
    // };
    // img.src = 'Disney.png';
    // askPictures("the disneyland of my life disagrees with my level of hapieness", { x: 0, y: 0 });
    animate();
}

// Animate loop
function animate() {
    for (let i = 0; i < imagers.length; i++) {
        imagers[i].drawMe();
    }
    // Perform animation logic here
    // inputLocationX = inputLocationX + inputBoxDirectionX;
    // inputLocationY = inputLocationY + inputBoxDirectionY;
    // if (inputLocationX > window.innerWidth || inputLocationX < 0) {
    //     inputBoxDirectionX = - inputBoxDirectionX;
    // }
    // if (inputLocationY > window.innerHeight || inputLocationY < 0) {
    //     inputBoxDirectionY = - inputBoxDirectionY;
    // }

    // inputBox.style.left = inputLocationX + 'px';
    // inputBox.style.top = inputLocationY + 'px';
    requestAnimationFrame(animate);
}



async function askPictures(prompt, location) {
    document.body.style.cursor = "progress";
    let maskBase64 = mask.toDataURL();
    let imageBase64 = canvas.toDataURL();
    const data = {
        version: "8beff3369e81422112d93b89ca01426147de542cd4684c244b673b105188fe5f",
        //version: "7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3",   //stable diffusion
        input: {
            prompt: prompt,
            mask: maskBase64,
            image: imageBase64,
        },
    };
    console.log("Making a Fetch Request", data);
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: 'application/json',
        },
        body: JSON.stringify(data),
    };

    const picture_info = await fetch(url, options);
    console.log("picture_response", picture_info);
    const proxy_said = await picture_info.json();
    console.log("proxy_said", proxy_said);

    if (proxy_said.output.length == 0) {
        console.log("Something went wrong, try it again");
    } else {

        let img = document.createElement("img");
        img.src = proxy_said.output[0];
        img.onload = function () {
            let ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
        }


        // document.body.appendChild(img);
        // img.style.position = 'absolute';
        // img.style.left = location.x + 'px';
        // img.style.top = location.y + 'px';
        // img.style.width = '256px';
        // img.style.height = '256px';
        // img.src = proxy_said.output[0];

    }
    document.body.style.cursor = "auto";
    let maskCtx = mask.getContext('2d');
    maskCtx.clearRect(0, 0, mask.width, mask.height);
    inputBoxDirectionX = 1;
    inputBoxDirectionY = 1;
}


function initMouseStuff() {

    // Add event listener to the document for mouse move event
    document.addEventListener('mousemove', (event) => {
        // Check if the input box is being dragged
        if (mouseDown) {
            let y = event.clientY;
            let x = event.clientX;

            //   move the selected div
        }
    });
    document.addEventListener('mouseup', () => {
        mouseDown = false;
    });
    document.addEventListener('mousedown', () => {
        mouseDown = true;
        for (let i = 0; i < imagers.length; i++) {
            if (imagers[i].isMouseOver()) {
                currentImager = imagers[i]; //word "this" also used by event listener
                console.log("Selected Imager: ", currentImager);
                break;
                //find the selected div

            }
        }

    });
    document.addEventListener('dblclick', (event) => {
        let newImager = new Imager({ x: event.clientX, y: event.clientY });
        imagers.push(newImager);
    });

}




