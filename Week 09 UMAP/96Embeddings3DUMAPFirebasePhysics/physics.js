
let myCluster;
let physics;

let {
    VerletPhysics2D,
    VerletParticle2D,
    VerletSpring2D,
    VerletMinDistanceSpring2D,
} = toxi.physics2d;
let { GravityBehavior } = toxi.physics2d.behaviors;

let { Vec2D, Rect } = toxi.geom;


export class Particle extends VerletParticle2D {
    constructor(x, y, umapx, umapy, text, image) {
        super(x, y);
        this.umapx = umapx;
        this.umapy = umapy;
        this.currentX = this.umapx * window.innerWidth;
        this.currentY = this.umapy * window.innerHeight;

        this.text = text;
        this.image = image;
        // this.selected = false;
        this.inCluster = true;
    }

    show() {
        ctx.fillStyle = "rgba(127,0,127,127)";
        ctx.strokeStyle = "rgba(0,0,0,127)";

        this.currentX = this.umapx * window.innerWidth;
        this.currentY = this.umapy * window.innerHeight;
        if (this.inCluster) {
            this.currentX = this.x;
            this.currentY = this.y;
        }
        // if (this.selected) {
        //     ctx.beginPath();
        //     ctx.arc(this.currentX, this.currentY, 10, 0, Math.PI * 2);
        //     ctx.fill();
        //     ctx.stroke();
        //     //  ctx.font = "24px Arial";
        //     // let w = ctx.measureText(this.text).width;
        //     //ctx.fillText(this.text, this.currentX - w / 2, this.currentY);
        // } else {
        ctx.beginPath();
        ctx.arc(this.currentX, this.currentY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        if (this.image) {
            ctx.drawImage(this.image, this.currentX, this.currentY);

        }
        // }
    }
    showText() {
        showText.style.display = "block";
        showText.style.left = this.currentX + "px";
        showText.style.top = this.currentY + "px";
        showText.innerHTML = this.text;
        console.log("showText", showText);
    }
    hideText() {
        showText.style.display = "none";
    }
}


export class Cluster {
    constructor(objects) {
        this.particles = [];

        //start them off in UMAP positions
        for (let i = 0; i < objects.length; i++) {

            let umapx = objects.UMAPFitting[0];
            let umapy = objects.UMAPFitting[1];
            let text = objects[i].prompt;
            let image = objects[i].image;
            let newParticle = new Particle(umapx * window.innerWidth, umapy * window.innerHeight, umapx, umapy, text, image);
            physics.addParticle(newParticle);
            this.particles.push(newParticle);
        }
        for (let i = 0; i < this.particles.length - 1; i++) {
            for (let j = 0; j < this.particles.length; j++) {
                if (i != j) {
                    // var distance = Math.sqrt((Math.pow(this.particles[i].x - this.particles[j].x, 2)) + (Math.pow(this.particles[i].y - this.particles[j].y, 2)))
                    var distance = Math.sqrt((Math.pow(this.particles[i].umapx - this.particles[j].umapx, 2)) + (Math.pow(this.particles[i].umapy - this.particles[j].umapy, 2)))
                    //console.log("distance", distance);
                    //let distance = this.particles[i].distanceTo(this.particles[j]);
                    // if (distance < 100) {
                    //physics.addSpring(new VerletSpring2D(this.particles[i], this.particles[j], distance * window.innerWidth, 0.1));
                    physics.addSpring(new VerletMinDistanceSpring2D(this.particles[i], this.particles[j], 175, distance));
                    // }
                }
            }
        }
        console.log("physics", physics);
    }
    show() {
        physics.update();
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        for (let particle of this.particles) {

            particle.show();
        }
    }
}