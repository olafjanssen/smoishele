/* global FB, smoisheleBlender, smoisheleDataView, analyse */

(function facebookInput(smoisheleBlender, smoisheleDataView) {
    'use strict';

    // This is called with the results from from FB.getLoginStatus().
    function statusChangeCallback(response) {
        // The response object is returned with a status field that lets the
        // app know the current login status of the person.
        // Full docs on the response object can be found in the documentation
        // for FB.getLoginStatus().
        if (response.status === 'connected') {
            // Logged into your app and Facebook.
            FB.api('/me/permissions', 'delete', function(response) {
                console.log(response); // true
            });
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

    function handleConnect() {
        FB.login(function (response) {
            // handle the response
            $('body').addClass('analysing');
            var length = document.querySelector('.progress-circle path').getTotalLength();
            $('.progress-circle path').css('stroke-dasharray',length + ' ' + length)
            .css('stroke-dashoffset', length);

            var userId = response.authResponse.userID;

            FB.api('/me/photos', {fields: 'images', limit: 200}, function (photosResponse) {

                var count = 0,
                    expectedCount = photosResponse.data.length;

                var start = 0,
                    step  = 1;
            
                smoisheleDataView.reset();
                function processBatch() {
                    var batch = photosResponse.data.slice(start, start + step);

                    start += step;

                    if (batch.length === 0) {
                        smoisheleBlender.blend(smoisheleDataView.getFaces());
                    }

                    batch.forEach(function(photo) {
                        count += 1;
                        var length = document.querySelector('.progress-circle path').getTotalLength();
                        $('.progress-circle path').css('stroke-dasharray',length + ' ' + length)
                            .css('stroke-dashoffset', length * (1-count/expectedCount));

                        FB.api('/' + photo.id + '/tags', {fields: 'id,x,y'}, function (tagsResponse) {
                                tagsResponse.data.forEach(function (tag) {
                                    if (tag.id === userId) {
                                        analyse(photo.images[0].source, processBatch, {x: 0.01 * tag.x, y: 0.01 * tag.y});
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

})(smoisheleBlender, smoisheleDataView);