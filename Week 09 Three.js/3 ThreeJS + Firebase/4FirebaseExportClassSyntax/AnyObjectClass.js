import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.module.min.js';

export class AnyObject {
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
    }
    redraw() {
        this.mesh.position.x = this.position.x;
        this.mesh.position.y = this.position.y;
        this.mesh.position.z = this.position.z;
        this.mesh.lookAt(0, 0, 0);
        this.texture.needsUpdate = true;
    }
}