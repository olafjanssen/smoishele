/* global smoisheleAnalyser, smoisheleBlender */

/** 
 *	This object starts a blend based on file input.
 *	
 */
(function fileInput(smoisheleAnalyser, smoisheleBlender, $){
	'use strict';

	function startBlend(images) {
		$('#analysed-folder').empty();

		smoisheleAnalyser.getFaceFeatures(images, function(face){
			var $img = $('<div class="input-thumb"></div>');
			$img.css('background-image', 'url(' + face.image.url + ')');
			$('#analysed-folder').append($img);

			var scrollContainer = document.getElementById('analysed-folder');
			scrollContainer.scrollTop = scrollContainer.scrollHeight;
		}, function(detectedFaces){
			smoisheleBlender.blend(detectedFaces, function(image) {
				window.open(image, '', '_blank');
			});
		});
	}

	function handleFileSelect(evt) {
		// filter the input for image files
		var files = evt.target.files;
		var fileList = [];
		for (var i = 0;i < files.length;i++) {
			if (!files[i].type.match('image.*')) {
				continue;
			}
			fileList.push(files[i]);
		}

		// load all files into file urls
		var imagesUrls = [];
		fileList.forEach(function(file) {
			var reader = new FileReader();
			reader.onload = (function() {
				return function(e) {
					imagesUrls.push({url: e.target.result});
					if (imagesUrls.length === files.length) {
						startBlend(imagesUrls);
					}
				};
			})(file);
			reader.readAsDataURL(file);
		});

	}

	document.getElementById('file-upload-button').addEventListener('change', handleFileSelect, false);
})(smoisheleAnalyser, smoisheleBlender, $);
