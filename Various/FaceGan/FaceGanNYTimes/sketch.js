let button;

let faceMesh;
let faces = [];
let options = { maxFaces: 1, refineLandmarks: false, flipHorizontal: false };
let myMask;

function preload() {
    // Load the facemesh model
    faceMesh = ml5.faceMesh(options);
}


function setup() {
    createCanvas(400, 400);
    button = createButton('Fetch Faces');
    button.position(10, 10);
    button.mousePressed(fetchFaces);
}





function fetchFaces() {
    const apiKey = '4hcQhrLHcVAzKKGwbow32oPPrcf2p4Vr';
    const url = `https://api.nytimes.com/svc/topstories/v2/world.json?api-key=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log(data.results);
            const articles = data.results
            articles.forEach(article => {
                console.log(article.multimedia[0]);
                if (article.multimedia.length > 0) {
                    let url = article.multimedia[0].url;
                    loadImage(url, img => {

                        faceMesh.detect(img, (result) => {

                            console.log("face Mesh ", result.length);
                            image(img, 0, 0, random(0, width), random(0, height));
                        })

                    });
                }
            });
        })
        .catch(error => console.error('Error fetching data:', error));
}