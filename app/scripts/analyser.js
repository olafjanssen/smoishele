/*global clm, pModel */

/** 
 *	This object can analyse an array of images given by an array of urls.
 *	It will first detect faces using ccv, then proceeds to fit facial features using clmtrackr.
 *	
 */
var smoisheleAnalyser = (function(clm, pModel){
	'use strict';

	var canvas = document.createElement('canvas'),
		context = canvas.getContext('2d'),
		cTrack = new clm.tracker({stopOnConvergence : true, scoreThreshold: 0.30}),
		queue = [],
		inProgress = false,
		blockResult = false,
		currentItem;

	cTrack.init(pModel);
	//cTrack.setResponseMode('blend', ['raw', 'sobel', 'lbp']);

	function processQueue() {
		if (queue.length === 0){
			return;
		}
		inProgress = true;
		currentItem = queue.shift();

		// load the image given by the url in a canvas
		var img = new Image();
		img.onload = function() {
			blockResult = false;
			canvas.setAttribute('width', img.width);
			canvas.setAttribute('height', img.height);
			context.drawImage(img,0,0,img.width, img.height);
			cTrack.reset();
			cTrack.start(canvas, null);
		};
		img.crossOrigin = 'Anonymous';
		img.src = currentItem.face.image.url;
	}

	// EVENTS FOR CLMTRACKR
	// detect if tracker fails to find a face
	document.addEventListener('clmtrackrNotFound', function() {
		cTrack.stop();
		inProgress = false;
		currentItem.callback(null);
		if (queue.length > 0){
			processQueue();
		}
	}, false);
	
	// detect if tracker loses tracking of face
	document.addEventListener('clmtrackrLost', function() {
		cTrack.stop();
		inProgress = false;
		currentItem.callback(null);
		if (queue.length > 0){
			processQueue();
		}
	}, false);
	
	// detect if tracker has converged
	document.addEventListener('clmtrackrConverged', function() {
		if (blockResult) {
			return;
		}

		blockResult = true;
		inProgress = false;

		var positions = cTrack.getCurrentPosition(),
			currentImage = currentItem.face.image,
			face = {image: currentImage, leftEye: {x: positions[27][0]/currentImage.width, y: positions[27][1]/currentImage.height},
										rightEye: {x: positions[32][0]/currentImage.width, y: positions[32][1]/currentImage.height},
										mouth: {x: 0.5*(positions[57][0]+positions[60][0])/currentImage.width,
												y: 0.5*(positions[57][1]+positions[60][1])/currentImage.height},
												quality: cTrack.getScore() };
		
		currentItem.callback(face);

		cTrack.draw(canvas);
		$('#analysis-result').css('background-image', 'url(' + canvas.toDataURL() + ')');

		if (queue.length > 0){
			processQueue();
		}
	}, false);

	
	/*
	 * Call this function to analyse faces in the given array of urls. The callback is called in the end and contains
	 * the array of analysed faces.
	 */
	function getFaceFeatures(face, callback) {
		queue.push({face: face, callback: callback});
		if (!inProgress){
			processQueue();
		}
	}

	return { getFaceFeatures: getFaceFeatures, init: function(){} };

})(clm, pModel);

smoisheleAnalyser.init();
