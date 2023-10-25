let spaces = [];
let people = [];
let menu = [];

function setup() {
    createCanvas(800, 800);
    connectToFirebase();
    loadChoices();
    let model = new rw.HostedModel({
        url: "https://stylegan2-7694fe98.hosted-models.runwayml.cloud/v1/",
        token: "g/YBslj6S5eCne661wNO2Q=="
    });
    spaces['StyleGAN2Face']= new LatentSpace("StyleGAN2Face", model, 10, 100);
    model = new rw.HostedModel({
        url: "https://stylegan2-7694fe98.hosted-models.runwayml.cloud/v1/",
        token: "g/YBslj6S5eCne661wNO2Q=="
    });
    spaces['CustomFace'] = new LatentSpace("CustomFace", model, 400, 100);
}

function draw() {
    let numberOfOthers = Object.keys(people).length-1;
    let increment = 2*Math.PI/numberOfOthers;
    menu = [];
    for (spaceName in spaces) {
        thisSpace = spaces[spaceName];
        thisSpace.drawIt();
        let index = 0;
        
        for(person in people){
            thisPerson = people[person];
            if (thisPerson == me)continue;
            let x = 100*cos(increment*index) +thisSpace.x +  256; //thisSpace.image.width/2;
            let y = 100*sin(increment*index) +thisSpace.y +   256; // thisSpace.image.height/2;
            fill(255,0,0);
            ellipse(x,y,30,30);
            index++;
            let thisMenu = {"person":thisPerson, "spaceName":spaceName, "x": x, "y":y};
            menu.push(thisMenu);
        }
    }

}
function mousePressed(){
   
    for (var i = 0; i < menu.length; i++){
        let menuItem = menu[i]
        if(dist(mouseX, mouseY, menuItem.x, menuItem.y) < 15){
            console.log(menuItem.person.id, menuItem.spaceName);
        }
    }
}

function loadLocalSpaces(){
    for (spaceName in spaces) {
        let myVectorForThisSpace = me.locationsInSpaces[spaceName];
        let thisLatentSpace = spaces[spaceName];
        thisLatentSpace.setMyVector(myVectorForThisSpace);
    }
}


class Person {
    constructor(dbInfo) {
        this.locationsInSpaces = dbInfo.locationsInSpaces;
        this.displayName = dbInfo.displayName;
        this.id = dbInfo.id;
        this.profileFilename = dbInfo.profileFilename;
        this.defaultProfileImage = dbInfo.defaultProfileImage;
        this.dbKey = dbInfo.dbKey;
        //this.img;
        //this.newImage();
        //if (this.id == localUserEmail) $("#display_name").val(this.displayName);

    }


}


class LatentSpace {
    constructor(name, model, x, y) {
        this.name = name;
        this.model = model;
        this.x = x;
        this.y = y;
        this.image;
        this.localVector;
    }

    drawIt() {
        if (this.image)
            image(this.image, this.x, this.y, 512, 512);
    }

    setMyVector(vector){
        this.localVector = vector;
        this.talkToRunway(vector);
    }


    talkToRunway(vector) {
        console.log("askit");
        const data = {
            z: vector,
            truncation: 0.7
        };
        this.model.query(data).then(outputs => {
            console.log("got reply");
            const { image } = outputs;
            this.image = createImg(image,"alterego","anonymous",this.loaded);
            this.image.hide();
   
        });
    }
    loaded(person){
       // console.log("loaded",param);
        //person.image = param;
    }



/*

  function () {  //this function gets called when it is finished being created
                    console.log("created image", );
                    this.image = createGraphics(512, 512);
                    this.image.image(runway_img, 0, 0, 512, 512);
                    runway_img.hide();
                  
                }
    loadObjectImage(img, person) {
        console.log(img, person);
        if (this.id == localUserEmail) {
     //huh
        }
        img.onerror = function () {
            console.log("Error occurred while loading image for " + person);
        };
        img.onload = function () {
            image(img, person.x, person.y);
          //  person.drawImageAndName(img);
        
        };
    }
    */

}





function createRandomVector() {
    const vector = [];
    for (let i = 0; i < 512; i++) {
        vector[i] = random(-1, 1);
    }
    return vector;
}

function allowCameraSelection(w, h) {
    //This whole thing is to build a pulldown menu for selecting between cameras

    //manual alternative to all of this pull down stuff:
    //type this in the console and unfold resulst to find the device id of your preferredwebcam, put in sourced id below
    //navigator.mediaDevices.enumerateDevices()

    //default settings
    let videoOptions = {
        audio: true, video: {
            width: w,
            height: h
        }
    };

    let preferredCam = localStorage.getItem('preferredCam')
    //if you changed it in the past and stored setting
    if (preferredCam) {
        videoOptions = {
            video: {
                width: w,
                height: h,
                sourceId: preferredCam
            }
        };
    }
    //create a pulldown menu for picking source
    navigator.mediaDevices.enumerateDevices().then(function (d) {
        var sel = createSelect();
        sel.position(10, 10);
        for (var i = 0; i < d.length; i++) {
            if (d[i].kind == "videoinput") {
                let label = d[i].label;
                let ending = label.indexOf('(');
                if (ending == -1) ending = label.length;
                label = label.substring(0, ending);
                sel.option(label, d[i].deviceId)
            }
            if (preferredCam) sel.selected(preferredCam);
        }
        sel.changed(function () {
            let item = sel.value();
            //console.log(item);
            localStorage.setItem('preferredCam', item);
            videoOptions = {
                video: {
                    optional: [{
                        sourceId: item
                    }]
                }
            };
            myVideo.remove();
            myVideo = createCapture(videoOptions, VIDEO);
            myVideo.hide();
            console.log("Preferred Camera", videoOptions);
        });
    });
    return videoOptions;
}