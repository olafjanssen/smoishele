/* global FB, smoisheleAnalyser, smoisheleBlender, smoisheleDetect, smoisheleDataView */

(function facebookInput(smoisheleAnalyser, smoisheleBlender, smoisheleDetect, smoisheleDataView) {
    'use strict';

    // This is called with the results from from FB.getLoginStatus().
    function statusChangeCallback(response) {
        // The response object is returned with a status field that lets the
        // app know the current login status of the person.
        // Full docs on the response object can be found in the documentation
        // for FB.getLoginStatus().
        if (response.status === 'connected') {
            // Logged into your app and Facebook.
            testAPI();
        } else if (response.status === 'not_authorized') {
            // The person is logged into Facebook, but not your app.
            document.getElementById('status').innerHTML = 'Please log ' +
                'into this app.';
        } else {
            // The person is not logged into Facebook, so we're not sure if
            // they are logged into this app or not.
            document.getElementById('status').innerHTML = 'Please log ' +
                'into Facebook.';
        }
    }

    window.fbAsyncInit = function () {
        FB.init({
            appId: '715869205121101',
            cookie: true,  // enable cookies to allow the server to access
            // the session
            xfbml: true,  // parse social plugins on this page
            version: 'v2.0' // use version 2.0
        });

        FB.getLoginStatus(function (response) {
            statusChangeCallback(response);
        });

    };

    // Load the SDK asynchronously
    (function (d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
            return;
        }
        js = d.createElement(s);
        js.id = id;
        js.src = '//connect.facebook.net/en_US/sdk.js';
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));

    // Here we run a very simple test of the Graph API after login is
    // successful.  See statusChangeCallback() for when this call is made.
    function testAPI() {
        console.log('Welcome!  Fetching your information.... ');
        FB.api('/me', function (response) {
            console.log('Successful login for: ' + response.name);
        });
    }

    function handleConnect() {
        FB.login(function (response) {
            // handle the response
            console.log(response);

            var userId = response.authResponse.userID;

            FB.api('/me/photos', {fields: 'images', limit: 200}, function (photosResponse) {

                var start = 0,
                    step  = 1;
            
                smoisheleDataView.reset();
                function processBatch() {
                    var batch = photosResponse.data.slice(start, start + step);

                    console.log('batch:');
                    console.log(batch);

                    start += step;

                    if (batch.length === 0) {
                        smoisheleBlender.blend(smoisheleDataView.getFaces());
                    }

                    var expectedFaces = 0, analysedFaces = 0;

                    batch.forEach(function(photo) {

                        FB.api('/' + photo.id + '/tags', {fields: 'id,x,y'}, function (tagsResponse) {
                                console.log(tagsResponse);
                                tagsResponse.data.forEach(function (tag) {
                                    if (tag.id === userId) {
                                        smoisheleDetect.getFaceFeatures(photo.images[0].source, function(face) {
                                            if (face === null) {
                                                processBatch();
                                                return;
                                            }

                                            expectedFaces += 1;
                                            console.log(face);

                                            smoisheleAnalyser.getFaceFeatures(face, function(newFace) {
                                                analysedFaces += 1;
                                                if (newFace){
                                                    smoisheleDataView.addFace(newFace);
                                                }
                                                console.log(newFace);

                                                if (analysedFaces === expectedFaces){
                                                    processBatch();
                                                }
                                            });
                                        }, {x: 0.01 * tag.x, y: 0.01 * tag.y});
                                    }
                                });
                            });
                    });
                }

                // process first batch
                processBatch();

            });

        }, {scope: 'public_profile,email,user_photos,user_friends'});
    }

    document.getElementById('facebook-connect-button').addEventListener('click', handleConnect, false);

})(smoisheleAnalyser, smoisheleBlender, smoisheleDetect, smoisheleDataView);