import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.module.min.js';
import * as FB from './firebaseStuff.js';
import { initMoveCameraWithMouse, initHTML } from './interaction.js';

let camera, scene, renderer;
let texturesThatNeedUpdating = [];  //for updating textures
let myObjectsByThreeID = {}  //for converting from three.js object to my JSON object
let clickableMeshes = []; //for use with raycasting
let myObjectsByFirebaseKey = {}; //for converting from firebase key to my JSON object


initHTML();
init3D();
recall();

function recall() {
    console.log("recall");
    FB.subscribeToData('objects'); //get notified if anything changes in this folder
}

export function reactToFirebase(reaction, data, key) {
    if (reaction === "added") {
        if (data.type === "text") {
            new SharedMindsText(data.text, data.position, key);
        } else if (data.type === "image") {
            let img = new Image();  //create a new image
            img.onload = function () {
                new SharedMindsImage(img, data.position, data.base64, key);
            }
            img.src = data.base64;
        } else if (data.type === "p5ParticleSystem") {
            let newp5 = new SharedMindsP5Sketch(data.position, key);
            console.log("new p5", newp5);
        }
    } else if (reaction === "changed") {
        console.log("changed", data);
        let thisObject = myObjectsByFirebaseKey[key];
        if (thisObject) {
            if (data.type === "text") {
                thisObject.text = data.text;
                thisObject.position = data.position;
                thisObject.redraw();
            } else if (data.type === "image") {
                let img = new Image();  //create a new image
                img.onload = function () {
                    thisObject.img = img;
                    thisObject.position = data.position;
                    thisObject.redraw();
                }
                img.src = data.base64;

            } else if (data.type === "p5ParticleSystem") {
                thisObject.position = data.position;
                thisObject.redraw();
            }
        }
    } else if (reaction === "removed") {
        console.log("removed", data);
        let thisObject = myObjectsByFirebaseKey[key];
        if (thisObject) {
            scene.remove(thisObject.mesh);
            delete myObjectsByThreeID[thisObject.threeID];
        }
    }
}


class AnyObject {
    constructor(canvas, pos, key) {
        this.type = "any";
        this.position = pos;
        this.firebaseKey = key;
        this.canvas = canvas;
        this.context = this.canvas.getContext("2d");
        this.texture = new THREE.Texture(this.canvas);
        this.texture.needsUpdate = true;
        this.material = new THREE.MeshBasicMaterial({ map: this.texture, transparent: true, side: THREE.DoubleSide, alphaTest: 0.5 });
        this.geo = new THREE.PlaneGeometry(1, 1);
        this.mesh = new THREE.Mesh(this.geo, this.material);
        this.mesh.lookAt(0, 0, 0);
        this.mesh.scale.set(10, 10, 10);
        scene.add(this.mesh);
        texturesThatNeedUpdating.push(this);
        clickableMeshes.push(this.mesh);
        myObjectsByThreeID[this.mesh.uuid] = this;
        myObjectsByFirebaseKey[this.firebaseKey] = this;
    }
    redraw() {
        this.mesh.position.x = this.position.x;
        this.mesh.position.y = this.position.y;
        this.mesh.position.z = this.position.z;
        this.mesh.lookAt(0, 0, 0);
        this.texture.needsUpdate = true;
    }
}

class SharedMindsImage extends AnyObject {
    constructor(img, pos, base64, key) {
        let canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        super(canvas, pos, key);
        this.type = "image";
        this.img = img;
        this.base64 = base64;
        this.redraw();
    }
    redraw() {
        super.redraw();
        this.context.drawImage(this.img, 0, 0);

    }
    getJSONForFirebase() {
        return { type: "image", position: this.position, base64: this.base64 };
    }

}

class SharedMindsText extends AnyObject {
    constructor(_words, pos, key) {
        let canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;
        super(canvas, pos, key);
        this.type = "text";
        this.text = _words;
        this.redraw();
    }
    redraw() {
        super.redraw();
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        let fontSize = Math.max(camera.fov / 2, 72);
        this.context.font = fontSize + "pt Arial";
        this.context.textAlign = "center";
        this.context.fillStyle = "red";
        this.context.fillText(this.text, this.canvas.width / 2, this.canvas.height / 2);

    }
    getJSONForFirebase() {
        return { type: "text", position: this.position, text: this.text };
    }
}

class SharedMindsP5Sketch extends AnyObject {
    constructor(pos, key) {
        let newP5 = birthP5Object(200, 200);
        //pull the p5 canvas out of sketch 
        //and then regular (elt) js canvas out of special p5 canvas
        let p5Canvas = newP5.getP5Canvas();
        let canvas = p5Canvas.elt;
        super(canvas, pos, key);
        this.type = "p5Sketch";
        this.redraw();
    }
    redraw() {
        super.redraw();
    }
    getJSONForFirebase() {
        return { type: "P5Sketch", position: this.position };
    }
}


export function findObjectUnderMouse(x, y) {
    let raycaster = new THREE.Raycaster(); // create once
    //var mouse = new THREE.Vector2(); // create once
    let mouse = {};
    mouse.x = (x / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = - (y / renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    let intersects = raycaster.intersectObjects(clickableMeshes, false);

    // if there is one (or more) intersections
    let hitObject = null;
    if (intersects.length > 0) {
        let hitMesh = intersects[0].object; //closest objec
        hitObject = myObjectsByThreeID[hitMesh.uuid]; //use look up table assoc array

    }
    return hitObject;
    //console.log("Hit ON", hitMesh);
}

export function project2DCoordsInto3D(distance, mouse) {
    let vector = new THREE.Vector3();
    vector.set(
        (mouse.x / window.innerWidth) * 2 - 1,
        - (mouse.y / window.innerHeight) * 2 + 1,
        0
    );
    //vector.set(0, 0, 0); //would be middle of the screen where input box is
    vector.unproject(camera);
    vector.multiplyScalar(distance)
    return vector;
}

function init3D() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.target = new THREE.Vector3(0, 0, 0);  //mouse controls move this around and camera looks at it 
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    ///document.body.appendChild(renderer.domElement);

    //this puts the three.js stuff in a particular div
    document.getElementById('THREEcontainer').appendChild(renderer.domElement)

    let bgGeometery = new THREE.SphereGeometry(1000, 60, 40);
    // let bgGeometery = new THREE.CylinderGeometry(725, 725, 1000, 10, 10, true)
    bgGeometery.scale(-1, 1, 1);
    // has to be power of 2 like (4096 x 2048) or(8192x4096).  i think it goes upside down because texture is not right size
    let panotexture = new THREE.TextureLoader().load("itp.jpg");
    // let material = new THREE.MeshBasicMaterial({ map: panotexture, transparent: true,   alphaTest: 0.02,opacity: 0.3});
    let backMaterial = new THREE.MeshBasicMaterial({ map: panotexture });
    let back = new THREE.Mesh(bgGeometery, backMaterial);
    scene.add(back);

    initMoveCameraWithMouse(camera, renderer);

    camera.position.z = 0;
    animate();
}

function animate() {
    for (let i = 0; i < texturesThatNeedUpdating.length; i++) {
        texturesThatNeedUpdating[i].texture.needsUpdate = true;
    }
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function birthP5Object(w, h) {
    let sketch = function (p) {
        let particles = [];
        let myCanvas;
        p.setup = function () {
            myCanvas = p.createCanvas(w, h);

        };
        p.getP5Canvas = function () {
            return myCanvas;
        }

        p.draw = function () {
            p.clear();
            for (let i = 0; i < 5; i++) {
                let p = new Particle();
                particles.push(p);
            }
            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].update();
                particles[i].show();
                if (particles[i].finished()) {
                    // remove this particle
                    particles.splice(i, 1);
                }
            }
        };

        class Particle {
            constructor() {
                this.x = p.width / 2;
                this.y = p.height / 2;
                this.vx = p.random(-1, 1);
                this.vy = p.random(-4, 1);
                this.alpha = 255;
            }
            finished() {
                return this.alpha < 0;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.alpha -= 10;
            }
            show() {
                p.noStroke();
                p.fill(255, 0, 255, this.alpha);
                p.ellipse(this.x, this.y, 5);
            }
        }
    };
    return new p5(sketch);
}






