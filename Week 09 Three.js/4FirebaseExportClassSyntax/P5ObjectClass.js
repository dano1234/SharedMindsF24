import { AnyObject } from "./AnyObjectClass.js";

export class SharedMindsP5Sketch extends AnyObject {
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