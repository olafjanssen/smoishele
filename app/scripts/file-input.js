/* global smoisheleAnalyser, smoisheleBlender */

/** 
 *	This object starts a blend based on file input.
 *	
 */
(function fileInput(smoisheleAnalyser, smoisheleBlender){
	'use strict';

	function startBlend(images) {
		smoisheleAnalyser.getFaceFeatures(images, function(detectedFaces){
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
					imagesUrls.push(e.target.result);
					if (imagesUrls.length === files.length) {
						startBlend(imagesUrls);
					}
				};
			})(file);
			reader.readAsDataURL(file);
		});

	}

	document.getElementById('file-upload-button').addEventListener('change', handleFileSelect, false);
})(smoisheleAnalyser, smoisheleBlender);
