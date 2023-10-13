// Import the Firebase SDK and Firebase Authentication module
import { firebase } from 'https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js';
import 'https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js';

// Initialize Firebase
var firebaseConfig = {
    // Your Firebase project configuration goes here
};
firebase.initializeApp(firebaseConfig);

// Get the email and password input fields
var emailInput = document.getElementById('email');
var passwordInput = document.getElementById('password');
// Get the sign-in button
var signInButton = document.getElementById('sign-in');

// Add a click event listener to the sign-in button
signInButton.addEventListener('click', function () {
    // Get the email and password values
    var email = emailInput.value;
    var password = passwordInput.value;

    // Sign in with email and password
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(function (userCredential) {
            // User successfully signed in
            var user = userCredential.user;
            console.log('User signed in:', user.email);
            // ...
        })
        .catch(function (error) {
            // Sign-in failed, display error message
            var errorCode = error.code;
            var errorMessage = error.message;
            console.error('Sign-in failed:', errorMessage);
            // ...
        });
});

// Get the Google sign-in button
var googleSignInButton = document.getElementById('google-sign-in');

// Add a click event listener to the Google sign-in button
googleSignInButton.addEventListener('click', function () {
    // Create a new Google provider object
    var provider = new firebase.auth.GoogleAuthProvider();

    // Sign in with Google
    firebase.auth().signInWithPopup(provider)
        .then(function (result) {
            // User successfully signed in with Google
            var user = result.user;
            console.log('User signed in with Google:', user.email);
            // ...
        })
        .catch(function (error) {
            // Sign-in failed, display error message
            var errorCode = error.code;
            var errorMessage = error.message;
            console.error('Sign-in with Google failed:', errorMessage);
            // ...
        });
});

// Get the email sign-up button
var emailSignUpButton = document.getElementById('email-sign-up');

// Add a click event listener to the email sign-up button
emailSignUpButton.addEventListener('click', function () {
    // Get the email and password values
    var email = emailInput.value;
    var password = passwordInput.value;

    // Sign up with email and password
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(function (userCredential) {
            // User successfully signed up
            var user = userCredential.user;
            console.log('User signed up:', user.email);
            // ...
        })
        .catch(function (error) {
            // Sign-up failed, display error message
            var errorCode = error.code;
            var errorMessage = error.message;
            console.error('Sign-up failed:', errorMessage);
            // ...
        });
});