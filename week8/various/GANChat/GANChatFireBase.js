
let db;
let localUserEmail, localUserDisplayName,      localImage;
let storage;
let roomName = "mySillyRoomName";
let loggedIn = false;
let me;

$("#login").click(function (event) {
    var ui = new firebaseui.auth.AuthUI(firebase.auth());
    //  firebase.auth().onAuthStateChanged(function(){ location.reload();});
    ui.start('#firebaseui-auth-container', uiConfig);
 
    //
});

function loadChoices(){
        //MAKE A ONE TIME QUERY
        let db = firebase.database();
        db.ref(roomName + '/users/').limitToFirst(10).once("value", snapshot => {

      //  db.ref('group/' + group_id + '/notes/').orderByChild('cameraFOV').endAt(30).once("value", function (snapshot) {
            console.log("once query", snapshot.val());
        //POPULATE PULL DOWN MENU WITH RESULTS
            let users = snapshot.val();
            var dropdown = $('#testUsers');
            dropdown.empty();
            dropdown.append(
                $('<option>', {
                    value: 'select',
                    text: 'Select Test User'
                }, '</option>'))

            for (key in users) {
                console.log("in loop",dropdown, users[key]);
                dropdown.append(
                    $('<option>', {
                        value: key,
                        text: users[key].ID
                    }, '</option>'))
            }
            dropdown.append(
                $('<option>', {
                    value: 'new_user',
                    text: 'New User'
                }, '</option>'))

             //GIVE PULL DOWN AN ACTION
            dropdown.on('change', function () {
                console.log("changed", this.value);
                if (this.value == "new_user"){
                    console.log("new guy");
                    let locationsInSpaces = [];
                    for (spaceName in spaces) {
                        locationsInSpaces[spaceName] = createRandomVector();
                    }
                    let randomName = Math.random() * 1000 + "@gmail.com";
                    localUserEmail = randomName;
                    localUserDisplayName = randomName;
                    let mydata = {
                        // 'location': me.location,
                        'locationsInSpaces': locationsInSpaces,
                        'ID': randomName,
                        'displayName': randomName,
                        'defaultProfileImage' : randomName,
                        'profileFilename': 'null'
                    };
                    //insert in the database
                    db.ref(roomName + '/users/').push(mydata);
                }else if (this.value != "select"){
                    me = people[this.value];
                    localUserEmail = me.id;
                    localUserDisplayName = me.displayName;
                    localImage =   me.defaultProfileImage;
                    loadLocalSpaces();
                }
            
            });
    
        });

}

function pickUser(who){

}
var uiConfig = {
    callbacks: {
        signInSuccessWithAuthResult: function (authResult, redirectUrl) {
            console.log("succesfuly logged in" , authResult.user.email);
            if (loggedIn) location.reload(); //reboot if this is a change.
            localUserEmail = authResult.user.email;
            localUserDisplayName = authResult.user.displayName;
            // User successfully signed in.
            // Return type determines whether we continue the redirect automatically
            // or whether we leave that to developer to handle.
            return false;
        },
        uiShown: function () {
            // The widget is rendered.
            // Hide the loader.
            document.getElementById('loader').style.display = 'none';
        }
    },
    // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
    signInFlow: 'popup',
    // signInSuccessUrl: '<url-to-redirect-to-on-success>',
    signInOptions: [
        // Leave the lines as is for the providers you want to offer your users.
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        // firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
        // firebase.auth.GithubAuthProvider.PROVIDER_ID,
        // firebase.auth.EmailAuthProvider.PROVIDER_ID,
        // firebase.auth.PhoneAuthProvider.PROVIDER_ID
    ],
    // Terms of service url.
    tosUrl: '<your-tos-url>',
    // Privacy policy url.
    privacyPolicyUrl: '<your-privacy-policy-url>'
};




function connectToFirebase() {
    var config = {

        apiKey: "AIzaSyDAIaFzMPS0xRpOR56uD6qC4E7ncoMM1mI",
        authDomain: "fir-8dcef.firebaseapp.com",
        databaseURL: "https://fir-8dcef-default-rtdb.firebaseio.com/",
        projectId: "fir-8dcef",
        storageBucket: "fir-8dcef.appspot.com",
        messagingSenderId: "60100778383",
        appId: "1:60100778383:web:20acc0a282adc17e6953fa",
        measurementId: "G-24S99XKT64"

        //apiKey: "AIzaSyAbJCseU4PrkYSQBdM3NRqWg0UGvb-Fpj4",
        // authDomain: "osc-itp-1553359662966.firebaseapp.com",
        // databaseURL: "https://osc-itp-1553359662966.firebaseio.com/",
        // storageBucket: "gs://osc-itp-1553359662966.appspot.com"
    };
    firebase.initializeApp(config);


    firebase.auth().onAuthStateChanged((user) => {

        if (user) {
            $("#login").show();
            // User is signed in, see docs for a list of available properties
            // https://firebase.google.com/docs/reference/js/firebase.User
            localUserEmail = user.email;
            localUserDisplayName = user.displayName;
            localImage =   user.photoURL;
            $("#gProfile").attr("src",user.photoURL);
            /*
            if (user.email.endsWith("@nyu.edu")  || user.email == "osullivision@gmail.com" ) { 
               
              
                loggedIn = true;
               // $("#login").hide();
            }else{
                $("#login").html('Logged In As ' + localUserEmail  +  " Please use an nyu.edu gmail (and refresh page).");
                $("#info").hide();
                console.log("please use your @nyu.edu address");
                return;
            }
            */


            console.log("login still valid", localUserEmail, localUserDisplayName);
            
            let db = firebase.database();
            db.ref(roomName + '/users/').orderByChild("ID").equalTo(localUserEmail).once("value", snapshot => {
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    console.log("someone by that id in db", userData);
                    //will get it in the "add"
                } else {
                    console.log("not yet a user");
                    let locationsInSpaces = [];
                    for (spaceName in spaces) {
                        locationsInSpaces[spaceName] = createRandomVector();
                    }
                    let mydata = {
                        // 'location': me.location,
                        'locationsInSpaces': locationsInSpaces,
                        'ID': localUserEmail,
                        'displayName': localUserDisplayName,
                        'defaultProfileImage' : localImage,
                        'profileFilename': 'null'
                    };
                    //insert in the database
                    db.ref(roomName + '/users/').push(mydata);
                }
            }).catch(function (error) {
                console.log("tried to get snapshot of existing", error);
            });
        } else {
            // User is signed out
            // ...
            $("#info").hide();
            $("#login").hide();
            console.log("no valid login, sign in again?");
            var ui = new firebaseui.auth.AuthUI(firebase.auth());
            ui.start('#firebaseui-auth-container', uiConfig);
        }
    });


    db = firebase.database();

    var myRef = db.ref(roomName + '/users/');
    myRef.on('child_added', (data) => {

        let key = data.key;
        let thing = data.val();
        let dbInfo = { "dbKey": key, "id": thing.ID, "displayName": thing.displayName, "locationsInSpaces":thing.locationsInSpaces, "profileFilename": thing.profileFilename ,"defaultProfileImage":thing.defaultProfileImage};
         let newPerson = new Person(dbInfo);
         people[key] = newPerson;    //positionEveryoneOnACircle();

        if (dbInfo.id == localUserEmail ) {
            me = newPerson;
            loadLocalSpaces();
        }
/*



function uploadImage(directory) {
    let base64Image = me.canvas.toDataURL("image/png", 1.0)
    // Create a storage reference from our storage service
    var storageRef = storage.ref();
    var profilesRef = storageRef.child(roomName + '/' + me.id + '/' + directory + '/');
    //  var filename = new Date().toString();
    latestProfile = Date.now().toString();
    me.profileFilename = latestProfile + '.png';
    me.addProfileURL(me.profileFilename );
    var directory = profilesRef.child(latestProfile + '.png');;
    directory.putString(base64Image, 'data_url').then((snapshot) => {
        console.log('uploaded');
        updateMeInDB();
    }).catch((error) => {
        // Uh-oh, an error occurred!
       console.log("not uploaded" + error);
    });;
}

function deleteFile(id, filename) {
    var storageRef = storage.ref();
    var delRef = storageRef.child(roomName + '/' + id + '/profilePhotos/' + filename);
    // Delete the file
    delRef.delete().then(() => {
        // File deleted successfully
     console.log("deleted");
    }).catch((error) => {
        // Uh-oh, an error occurred!
       console.log("not deleted");
    });
}
        let objectInfo = createNew3DObject(thing);

        let dbInfo = { "dbkey": key, "id": thing.ID, "displayName": thing.displayName, "positionOnCircleV": thing.positionOnCircleV, "positionOnCircleH": thing.positionOnCircleH, "zOffset": thing.zOffset, "profileFilename": thing.profileFilename ,"defaultProfileImage":thing.defaultProfileImage};
       // console.log('child_added', dbInfo);
        let newPerson = new Person(dbInfo, objectInfo);
        people[key] = newPerson;    //positionEveryoneOnACircle();

        if (dbInfo.id == localUserEmail ) {
            hitTestableOjects.push(myAvatarObj); //make the local one movable
            me = newPerson;
            repositionCameraAtMe();
        }
        // Create a reference under which you want to list
        var storageRef = storage.ref();
        var listRef = storageRef.child(roomName + '/' + newPerson.id + '/profilePhotos/');
        // Find all the prefixes and items.
        newPerson.clearProfileURLs();
        listRef.listAll()
            .then((res) => {
                res.items.forEach((itemRef) => {
                    // All the items under listRef.
                    itemRef.getDownloadURL().then(function (url) {
                        url = url.split(RegExp("%2..*%2F(.*?)\?alt"))[1].split(".")[0];
                        newPerson.addProfileURL(url + ".png");
                       // 
                    }).catch(function (error) {
                        // Handle any errors
                    });

                });
            }).catch((error) => {
                // Uh-oh, an error occurred!
            });
           
 */
    });

    myRef.on('child_changed', (data) => {
       // console.log('child_changed', data.key, data.val());
        people[data.key].updateFromDB(data.val());

    });

    myRef.on('child_removed', (data) => {
      //  console.log('child_removed', data.key);
    });

    // Get a reference to the storage service, which is used to create references in your storage bucket
    storage = firebase.storage();


}



function updateMeInDB() {

    let mydata = {
        'locationsInSpaces' : me.locationsInSpaces,
        'ID' : me.id,
        'displayName': me.displayName,
        'profileFilename': me.profileFilename
    };

    //insert in the database
    //let returnInfo = 
    db.ref(roomName + '/users/' + me.dbKey).update(mydata);

}