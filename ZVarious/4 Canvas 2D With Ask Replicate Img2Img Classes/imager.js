class Imager {
    constructor(location) {
        this.location = location
        this.initInterface();
        this.video = null;
        this.image = null;
        this.getImageButton();
        //this.dragAndDrop();
        this.liveVideo();
    }
    isMouseOver(x, y) {
        const rect = this.div.getBoundingClientRect();
        return (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom);
    }

    drawMe() {
        const ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.image) {
            ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
        }
        if (this.video) {
            ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        }
    }
    initInterface() {
        this.div = document.createElement('div');
        this.div.setAttribute('id', 'imager' + imagers.length);
        this.div.style.position = 'absolute';
        this.div.style.left = this.location.x + 'px';
        this.div.style.top = this.location.y + 'px';
        this.div.style.zIndex = 100 + imagers.length;
        document.body.appendChild(this.div);


        // Get the input box and the canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.setAttribute('id', 'myCanvas');
        this.canvas.style.position = 'absolute';
        this.canvas.width = canvasDimension;
        this.canvas.height = canvasDimension;
        this.canvas.style.left = 0 + 'px';
        this.canvas.style.top = 0 + 'px';
        // canvas.style.width = '100%';
        // canvas.style.height = '100%';
        this.div.appendChild(this.canvas);

        this.inputBox = document.createElement('input');
        this.inputBox.setAttribute('type', 'text');
        this.inputBox.setAttribute('id', 'inputBox');
        this.inputBox.setAttribute('placeholder', 'Enter text here');
        this.inputBox.style.position = 'absolute';
        this.inputBox.style.left = '50%';
        this.inputBox.style.top = '50%';
        this.inputBox.style.transform = 'translate(-50%, -50%)';
        this.inputBox.style.zIndex = '100';
        this.inputBox.style.fontSize = '30px';
        this.inputBox.style.fontFamily = 'Arial';
        this.div.appendChild(this.inputBox);
        this.inputBox.setAttribute('autocomplete', 'off');


        // Add event listener to the input box
        this.inputBox.addEventListener('keydown', function (event) {
            // Check if the Enter key is pressed

            if (event.key === 'Enter') {
                const inputValue = inputBox.value;
                //askWord(inputValue, { x: inputLocationX, y: inputLocationY });
                askPictures(inputValue, { x: this.location.x, y: this.location.y });

            }
        });
    }
    getImageButton() {
        // Add a button for getting image files from the finder
        this.imageButton = document.createElement('button');
        this.imageButton.setAttribute('id', 'imageButton');
        this.imageButton.textContent = 'Get Image';
        this.imageButton.style.position = 'absolute';
        this.imageButton.style.left = '50%';
        this.imageButton.style.top = '50px';
        this.imageButton.style.transform = 'translateX(-50%)';
        this.imageButton.style.zIndex = '100';
        this.div.appendChild(this.imageButton);

        // Add event listener to the image button
        this.imageButton.addEventListener('click', function () {
            // Call a function to open the file picker

            openFilePicker();
        });

        // Function to open the file picker
        function openFilePicker() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';

            input.onchange = function (event) {
                const file = event.target.files[0];
                // Handle the selected file

                handleSelectedFile(file);
            };
            input.click();
        }

        // Function to handle the selected file
        function handleSelectedFile(file) {
            // Check if the file is an image
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();

                reader.onload = function (event) {
                    const image = new Image();
                    image.src = event.target.result;
                    // Display the image on the canvas
                    console.log("curentimageer", currentImager);

                    currentImager.image = image;
                    // Redraw the canvas to show the new image
                    currentImager.drawMe();
                };
                reader.readAsDataURL(file);
            } else {
                console.log('Invalid file type. Only images are supported.');
            }
        }
    }


    dragAndDrop() {

        // Add event listeners for drag and drop functionality
        this.div.addEventListener('dragover', function (event) {
            event.preventDefault();
        });

        this.div.addEventListener('drop', function (event) {
            event.preventDefault();
            const file = event.dataTransfer.files[0];
            // Handle the dropped file
            handleDroppedFile(file);
        });

        // Function to handle the dropped file
        function handleDroppedFile(file) {
            // Check if the file is an image
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    const image = new Image();
                    image.src = event.target.result;
                    // Display the image on the canvas
                    this.image = image;
                    //displayImage(image);
                };
                reader.readAsDataURL(file);
            } else {
                console.log('Invalid file type. Only images are supported.');
            }
        }

        // // Function to display the image on the canvas
        // function displayImage(image) {
        //     const context = canvas.getContext('2d');
        //     context.clearRect(0, 0, canvas.width, canvas.height);

        // }
    }

    liveVideo() {
        // Add a button for seeing live video
        this.liveVideoButton = document.createElement('button');
        this.liveVideoButton.setAttribute('id', 'liveVideoButton');
        this.liveVideoButton.textContent = 'Live Video';
        this.liveVideoButton.style.position = 'absolute';
        this.liveVideoButton.style.left = '50%';
        this.liveVideoButton.style.top = '10px';
        this.liveVideoButton.style.transform = 'translateX(-50%)';
        this.liveVideoButton.style.zIndex = '100';
        this.div.appendChild(this.liveVideoButton);

        // Add event listener to the live video button
        this.liveVideoButton.addEventListener('click', function () {
            // Call a function to start the live video
            startLiveVideo();
        });

        // Function to start the live video
        function startLiveVideo() {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(function (stream) {
                    this.video = document.createElement('video');
                    this.video.srcObject = stream;
                    this.video.autoplay = true;
                    this.video.style.width = '100%';
                    this.video.style.height = '100%';

                    this.video.addEventListener('play', function () {
                        const ctx = this.canvas.getContext('2d');
                        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                        ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
                    });
                    //this.div.appendChild(video);
                })
                .catch(function (error) {
                    console.error('Error accessing webcam:', error);
                });
        }
    }





}
