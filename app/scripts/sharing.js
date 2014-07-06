/* global FB */

/** 
 *	
 *	
 */
var smoisheleSharing = (function() {
	'use strict';

	var message,
		imageUrl;

    function dataURItoBlob(dataURI,mime) {
        // convert base64 to raw binary data held in a string
        // doesn't handle URLEncoded DataURIs

        var byteString = window.atob(dataURI);

        // separate out the mime component
        // write the bytes of the string to an ArrayBuffer
        //var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(byteString.length);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        // write the ArrayBuffer to a blob, and you're done
        var blob = new Blob([ia], { type: mime });

        return blob;
    }

    function postImageToFacebook( authToken, filename, mimeType, imageData, message ) {
        var blob;
        try {
            blob = dataURItoBlob(imageData,mimeType);
        } catch(e){console.log(e);}
        
        var fd = new FormData();
        fd.append('access_token', authToken);
        fd.append('source', blob);
        fd.append('message', message);
        
        try {
            $.ajax({
                url:'https://graph.facebook.com/me/photos?access_token=' + authToken,
                type: 'POST',
                data:fd,
                processData:false,
                contentType:false,
                cache:false,
                success:function(data){
                    console.log('success ' + data);
                },
                error:function(shr,status,data){
                    console.log('error ' + data + ' Status ' + shr.status);
                },
                complete:function(){
                    console.log('Ajax Complete');
                }
            });
        } catch(e){console.log(e);}
    }

	function shareOnFacebook() {
        FB.login(function (response) {
            var accessToken = response.authResponse.accessToken;
            var imageString = imageUrl.substring(imageUrl.indexOf(',') + 1, imageUrl.length);
            postImageToFacebook(accessToken, 'smoishele', 'image/png', imageString, message);
            
        }, {scope: 'public_profile,email,user_photos,publish_actions'});
	}

	function setResult(result) {
		message = result.message;
		imageUrl = result.url;

		document.getElementById('image-download').href = result.url;
	}

	document.getElementById('facebook-share').addEventListener('click', shareOnFacebook, false);

	return {setResult: setResult, init: function(){}};
})();

smoisheleSharing.init();