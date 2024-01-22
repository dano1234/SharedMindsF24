// Get the input box and the canvas element
const inputBox = document.getElementById('inputBox');
const canvas = document.getElementById('myCanvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


// Add event listener to the input box
inputBox.addEventListener('keydown', function (event) {
    // Check if the Enter key is pressed

    if (event.key === 'Enter') {
        const inputValue = inputBox.value;
        const ctx = canvas.getContext('2d');
        ctx.font = '30px Arial';
        const inputBoxRect = inputBox.getBoundingClientRect();
        const x = inputBoxRect.left;
        const y = inputBoxRect.top;
        ctx.fillStyle = 'black';
        ctx.fillText(inputValue, x, y);
        inputBox.value = '';
    }
});

// Add event listener to the document for mouse down event
document.addEventListener('mousedown', (event) => {
    // Set the location of the input box to the mouse location
    inputBox.style.left = event.clientX + 'px';
    inputBox.style.top = event.clientY + 'px';

});
