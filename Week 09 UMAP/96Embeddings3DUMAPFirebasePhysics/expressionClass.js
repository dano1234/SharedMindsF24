import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';

let physics;
// let {
//     VerletPhysics3D,
//     VerletParticle3D,
//     VerletSpring3D,
//     VerletMinDistanceSpring3D,
// } = toxi.physics3d;
console.log("toxi", toxi);
let VerletMinDistanceSpring3D = toxi.physics3d.VerletMinDistanceSpring3D
let VerletSpring3D = toxi.physics3d.VerletSpring3D
let VerletParticle3D = toxi.physics3d.VerletParticle3D
let VerletPhysics3D = toxi.physics3d.VerletPhysics3D

export function initPhysics() {
    physics = new VerletPhysics3D();
    //physics.setWorldBounds(new Rect(100, 100, window.innerWidth - 200, window.innerHeight - 200));
    // physics.addBehavior(new GravityBehavior(new Vec2D(0, 0.5)));
    return physics;
}

export class Expressions extends VerletParticle3D {

    constructor(key, data) {
        super(data.location.x, data.location.y, data.location.z);
        this.key = key;
        this.prompt = data.prompt;
        this.embedding = data.embedding;
        this.location = data.location;
        this.imageData = data.image;  //should probably rename in the database

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.size = 1024;
        this.canvas.height = this.size;
        this.canvas.width = this.size;
        this.showText = false;

        this.create3DObject()

        if (this.imageData.base64Image) {
            let incomingImage = new Image();
            incomingImage.crossOrigin = "anonymous";
            let expression = this;
            incomingImage.onload = function () {
                //console.log("loaded image", expression.prompt);
                expression.image = incomingImage;
            };
            incomingImage.src = this.imageData.base64Image;
        }
    }
    create3DObject() {
        this.texture = new THREE.Texture(this.canvas);
        this.texture.needsUpdate = true;
        let material = new THREE.MeshBasicMaterial({ map: this.texture, transparent: true });
        let geo = new THREE.PlaneGeometry(this.size, this.size);
        this.mesh = new THREE.Mesh(geo, material);
        this.mesh.position.x = this.location.x
        this.mesh.position.y = this.location.y
        this.mesh.position.z = this.location.z
        this.mesh.lookAt(0, 0, 0);
        this.mesh.scale.set(.1, .1, .1);
    }
    repaint() {

        let textParts = this.prompt.split(" ");
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.image) {
            this.ctx.drawImage(this.image, 0, 0);
        } else {
            this.showText = true; //so far only have the text to show
        }
        if (this.showText) {
            let fontSize = 72;
            this.ctx.font = fontSize + 'px Arial';
            this.ctx.fillStyle = 'white';
            for (let i = 0; i < textParts.length; i++) {
                const metrics = this.ctx.measureText(textParts[i]);
                this.ctx.fillText(textParts[i], this.canvas.width / 2 - metrics.width / 2, 10 + i * fontSize);
            }
        }

        this.texture.needsUpdate = true;
    }
    updateFromFirebase(data) {
        this.text = text;
        this.embedding = embedding;
        this.location = data.location;
        this.mesh.location.x = this.location.x;
        this.mesh.location.y = this.location.y;
        this.mesh.location.z = this.location.z;
        thisObject.mesh.lookAt(0, 0, 0);
        if (data.imageData.base64Image) {
            //Loading of the home test image - img1
            var incomingImage = new Image();
            incomingImage.crossOrigin = "anonymous";
            incomingImage.onload = function () {
                this.image = incomingImage;
            };
            incomingImage.src = image.base64Image;
        }
    }
}


export function updateObject(key, data) {
    let text = data.prompt;
    let embedding = data.embedding;
    let pos = data.location;
    let image = data.image;
    console.log("updateObject", pos);
    let thisArrayIndex = findObjectByKey(key);
    if (thisArrayIndex == -1) {
        console.log("could not find object", key);
        return;
    }
    thisObject = objects[thisArrayIndex];
    thisObject.text = text;
    thisObject.embedding = embedding;
    thisObject.mesh.position.x = pos.x;
    thisObject.mesh.position.y = pos.y;
    thisObject.mesh.position.z = pos.z;
    thisObject.mesh.lookAt(0, 0, 0);
    if (image) {
        //Loading of the home test image - img1
        var incomingImage = new Image();
        incomingImage.crossOrigin = "anonymous";
        incomingImage.onload = function () {
            thisObject.image = incomingImage;
        };
        incomingImage.src = image.base64Image;
    }
}

export function addToPhysics(newObject, objects) {

    physics.addParticle(newObject);
    for (let i = 0; i < objects.length - 1; i++) {
        for (let j = 0; j < objects.length; j++) {
            let springExists = physics.getSpring(objects[i], objects[j]);
            if (!springExists && i != j) {
                let xdist = objects[i].umapx - objects[j].umapx;
                let ydist = objects[i].umapy - objects[j].umapy;
                let zdist = objects[i].umapz - objects[j].umapz;
                let distance = Math.sqrt(xdist * xdist + ydist * ydist + zdist * zdist);
                //var distance = Math.sqrt((Math.pow(this.particles[i].umapx - this.particles[j].umapx, 2)) + (Math.pow(this.particles[i].umapy - this.particles[j].umapy, 2)))
                physics.addSpring(new VerletMinDistanceSpring3D(objects[i], objects[j], 175, distance));
            }
        }
    }

}

// export class Cluster {
//     constructor(objects) {
//         this.particles = [];

//         //start them off in UMAP positions
//         for (let i = 0; i < objects.length; i++) {

//             let umapx = objects.UMAPFitting[0];
//             let umapy = objects.UMAPFitting[1];
//             let umapz = objects.UMAPFitting[2];
//             let text = objects[i].prompt;
//             let image = objects[i].image;
//             let newParticle = new Particle(umapx * window.innerWidth, umapy * window.innerHeight, umapx, umapy, text, image);
//             physics.addParticle(newParticle);
//             this.particles.push(newParticle);
//         }
//         for (let i = 0; i < this.particles.length - 1; i++) {
//             for (let j = 0; j < this.particles.length; j++) {
//                 if (i != j) {
//                     let xdist = this.particles[i].umapx - this.particles[j].umapx;
//                     let ydist = this.particles[i].umapy - this.particles[j].umapy;
//                     let zdist = this.particles[i].umapz - this.particles[j].umapz;
//                     let distance = Math.sqrt(xdist * xdist + ydist * ydist + zdist * zdist);
//                     //var distance = Math.sqrt((Math.pow(this.particles[i].umapx - this.particles[j].umapx, 2)) + (Math.pow(this.particles[i].umapy - this.particles[j].umapy, 2)))
//                     physics.addSpring(new VerletMinDistanceSpring2D(this.particles[i], this.particles[j], 175, distance));
//                     // }
//                 }
//             }
//         }
//         //console.log("physics", physics);
//     }

// }
// export function createObject(key, data) {

//     //get stuff from firebase
//     let text = data.prompt;
//     let embedding = data.embedding;
//     let pos = data.location;
//     let image = data.image;

//     //create a texturem mapped 3D object
//     let canvas = document.createElement('canvas');
//     let ctx = canvas.getContext('2d');
//     let size = 1024;
//     canvas.height = size;
//     canvas.width = size;

//     //let teture = new THREE.TextureLoader().load(img);
//     let texture = new THREE.Texture(canvas);
//     texture.needsUpdate = true;
//     var material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
//     var geo = new THREE.PlaneGeometry(size, size);
//     var mesh = new THREE.Mesh(geo, material);
//     mesh.position.x = pos.x
//     mesh.position.y = pos.y
//     mesh.position.z = pos.z
//     mesh.lookAt(0, 0, 0);
//     mesh.scale.set(.1, .1, .1);
//     scene.add(mesh);
//     hitTestableThings.push(mesh);//make a list for the raycaster to check for intersection
//     //leave the image null for now
//     let thisObject = { "dbKey": key, "embedding": embedding, "mesh": mesh, "uuid": mesh.uuid, "texture": texture, "text": text, "show_text": false, "context": ctx, "image": null, "canvas": canvas };

//     objects.push(thisObject);
//     if (image) {
//         let incomingImage = new Image();
//         thisObject.image = incomingImage;
//         incomingImage.crossOrigin = "anonymous";
//         incomingImage.onload = function () {
//             console.log("loaded image", thisObject.text);
//         };
//         incomingImage.src = image.base64Image;
//     }
//     if (objects.length > 6) {
//         runUMAP(objects)
//     }
//     findClosest(getPositionInFrontOfCamera(), clusterSize)
//     return thisObject;
// }



// function repaintObject(object) {
//     let texture = object.texture;
//     let text = object.text;
//     let image = object.image;
//     let ctx = object.context;
//     let canvas = object.canvas;

//     let textParts = text.split(" ");
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     if (image) {
//         ctx.drawImage(image, 0, 0);
//     } else {
//         object.showText = true; //so far only have the text to show
//     }
//     if (object.showText) {
//         let fontSize = 72;
//         ctx.font = fontSize + 'px Arial';
//         ctx.fillStyle = 'white';
//         for (let i = 0; i < textParts.length; i++) {
//             const metrics = ctx.measureText(textParts[i]);
//             ctx.fillText(textParts[i], canvas.width / 2 - metrics.width / 2, 10 + i * fontSize);
//         }
//     }
//     texture.needsUpdate = true;
// }