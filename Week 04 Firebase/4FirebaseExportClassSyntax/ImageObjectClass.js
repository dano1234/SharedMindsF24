import { AnyObject } from "./AnyObjectClass.js";

export class SharedMindsImage extends AnyObject {
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