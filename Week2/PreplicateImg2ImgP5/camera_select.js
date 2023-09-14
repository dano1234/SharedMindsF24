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
        // var sel = createSelect();
        var select = document.getElementById('video_select');
        //sel.position(10, 10);

        var option;
        option = document.createElement('option');
        option.value = d[0].deviceId;
        option.textContent = "";
        select.appendChild(option);
        numberOfCameras = 0;
        //console.log(d);
        for (var i = 0; i < d.length; i++) {
            if (d[i].kind == "videoinput") {
                if (d[i].deviceId == "") continue;
                let label = d[i].label;
                let ending = label.indexOf('(');
                if (ending == -1) ending = label.length;
                label = label.substring(0, ending);
                option = document.createElement('option');
                option.value = d[i].deviceId;
                option.textContent = label;
                select.appendChild(option);
                numberOfCameras++;

                //sel.option(label, d[i].deviceId)
            }
            if (preferredCam)
                $("#video_select").val(preferredCam);
            //sel.selected(preferredCam);
        }
        //  console.log("Number of Cameras"+ numberOfCameras );
        if (numberOfCameras < 2) {
            $('#video_select').hide();
            return;
        } else {
            $('#video_select').css({ 'width': 20 });
        }
        $('#video_select').change(function () {
            //let item = sel.value();
            let item = $("select#video_select:checked").val();

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