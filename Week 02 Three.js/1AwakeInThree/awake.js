import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.module.min.js';

let camera, scene, renderer;
let cube, light
let dir = 1;

init3D(); //have to call the setup yourself

function init3D() { //like setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color("#ffffff");
    //  scene.fog = new THREE.Fog("#ffffff", 0.015, 100);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x006600 });
    cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 0, -30);
    cube.scale.set(10, 10, 10);
    scene.add(cube);


    light = new THREE.PointLight(0xFF00);
    /* position the light so it shines on the cube (x, y, z) */
    light.position.set(0, 0, 0);
    scene.add(light);
    camera.position.z = 5;
    animate();  // have to kickstart the draw-like function
}

function animate() {  //like draw
    cube.position.setZ(cube.position.z + dir);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    if (cube.position.z < -100 || cube.position.z > -10) {
        dir = -dir;
    }
    renderer.render(scene, camera);
    requestAnimationFrame(animate);  //call it self, almost recursive
}


