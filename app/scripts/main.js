/* global smoisheleAnalyser, smoisheleBlender */
// test range

var images = [];
for(var i=1; i<24; i++) {
	images.push('./images/jap/jap' + i + '.png');
}

function startBlend(images) {
	'use strict';
	smoisheleAnalyser.getFaceFeatures(images, function(detectedFaces){
		smoisheleBlender.blend(detectedFaces, function(image) {
			window.open(image, '', '_blank');
		});
		
	});
}

function handleFileSelect(evt) {
	'use strict';
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
