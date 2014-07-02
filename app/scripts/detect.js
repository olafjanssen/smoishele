/* global ccv, cascade */

/*
    Face detect code
 */
var smoisheleDetect = (function(ccv, cascade){
	'use strict';

	var maxWidth = 1024,
		calls = 0;

	function processImage(url, callback) {

		var canvas = document.createElement('canvas'),
			context = canvas.getContext('2d');

		// load the image given by the url in a canvas
		var img = new Image();
		img.onload = function() {
			var W = img.width > maxWidth ? maxWidth : img.width,
				H = img.width > maxWidth ? img.height * maxWidth / img.width : img.height;

			calls += 1;

			canvas.setAttribute('width', W);
			canvas.setAttribute('height', H);
			context.drawImage(img,0,0,W,H);

			// detect faces in the image using ccv
			/*jshint camelcase: false */
			// var facesInPhoto = ccv.detect_objects({ 'canvas': canvas, //ccv.grayscale(canvas),
			// 						'cascade': cascade,
			// 						'interval': 5,
			// 						'min_neighbors': 2 });

			function post(facesInPhoto){
				if (facesInPhoto.length === 0){
					callback(null);
				}

				facesInPhoto.forEach(function(faceInPhoto) {
					var faceCanvas = document.createElement('canvas'),
						faceContext = faceCanvas.getContext('2d');
					
					var mult = 3;

					var box = {
						x: faceInPhoto.x - (mult-1)/2*faceInPhoto.width < 0?0 : faceInPhoto.x - (mult-1)/2*faceInPhoto.width,
						y: faceInPhoto.y - (mult-1)/2*faceInPhoto.height < 0?0 : faceInPhoto.y - (mult-1)/2*faceInPhoto.height,
						x2: faceInPhoto.x + (mult+1)/2*faceInPhoto.width > img.width?img.width : faceInPhoto.x + (mult+1)/2*faceInPhoto.width,
						y2: faceInPhoto.y + (mult+1)/2*faceInPhoto.height > img.height?img.height : faceInPhoto.y + (mult+1)/2*faceInPhoto.height
					};

					box.width = box.x2-box.x;
					box.height = box.y2-box.y;

					faceCanvas.setAttribute('width', box.width);
					faceCanvas.setAttribute('height', box.height);
					var faceData = context.getImageData(box.x, box.y, box.width, box.height);
					faceContext.putImageData(faceData,0,0);
					var face = { image: {url: faceCanvas.toDataURL('image/png'), width: faceInPhoto.width, height: faceInPhoto.height} };
					callback(face);
				});

			}
			ccv.detect_objects({ 'canvas' : canvas,
							 'cascade' : cascade,
							 'interval' : 5,
							 'min_neighbors' : 3,
							 'async' : true,
							 'worker' : 1 })(post);

			/*jshint camelcase: true */

		};
		img.crossOrigin = 'Anonymous';
		img.src = url;
	}

	return { getFaceFeatures: processImage, init: function(){} };

})(ccv, cascade);

smoisheleDetect.init();