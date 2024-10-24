import { AnyObject } from "./AnyObjectClass.js";

export class SharedMindsText extends AnyObject {
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
        let fontSize = 33;
        this.context.font = fontSize + "pt Arial";
        this.context.textAlign = "center";
        this.context.fillStyle = "red";
        this.context.fillText(this.text, this.canvas.width / 2, this.canvas.height / 2);

    }
    getJSONForFirebase() {
        return { type: "text", position: this.position, text: this.text };
    }
}