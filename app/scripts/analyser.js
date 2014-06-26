/*global clm, pModel, ccv, cascade */

/** 
 *	This object can analyse an array of images given by an array of urls.
 *	It will first detect faces using ccv, then proceeds to fit facial features using clmtrackr.
 *	
 */
var smoisheleAnalyser = (function(clm, pModel, ccv, cascade){
	'use strict';

	var canvas = document.createElement('canvas'),
		context = canvas.getContext('2d'),
		cTrack = new clm.tracker({stopOnConvergence : true}),
		urls = [],
		facesInPhoto = [],
		currentImage = {},
		blockResult = false,
		detectedFaces = [],
		progressCallback,
		doneCallback;

		
	cTrack.init(pModel);

	function processImage(url) {
		// load the image given by the url in a canvas
		var img = new Image();
		img.onload = function() {
			canvas.setAttribute('width', img.width);
			canvas.setAttribute('height', img.height);
			context.drawImage(img,0,0,img.width, img.height);
			currentImage.width = img.width;
			currentImage.height = img.height;

			// detect faces in the image using ccv
			/*jshint camelcase: false */
			facesInPhoto = ccv.detect_objects({ 'canvas': ccv.grayscale(canvas),
											'cascade': cascade,
											'interval': 5,
											'min_neighbors': 1 });

			/*jshint camelcase: true */
			
			// if multiple faces are found, try to find features for all faces, else try to find one again
			if (facesInPhoto.length > 0) {
				detectFeatures();
			} else {
				cTrack.reset();
				cTrack.start(canvas, null);
				blockResult = false;
			}
		};
		img.crossOrigin = 'Anonymous';
		img.src = url;
		currentImage = {url: url};
	}

	// tries to detect features of a single face in a portion of the image
	function detectFeatures() {
		if (facesInPhoto.length > 0) {
			var face = facesInPhoto[0];
			var box = [face.x, face.y, face.width, face.height];
			facesInPhoto.splice(0,1);

			cTrack.reset();
			cTrack.start(canvas, box);
			blockResult = false;
		} else {
			if (urls.length > 0){
				processImage(urls.shift());
			} else {
				document.documentElement.classList.remove('analysing');
				doneCallback(detectedFaces);
			}
		}
	}

	// EVENTS FOR CLMTRACKR
	// detect if tracker fails to find a face
	document.addEventListener('clmtrackrNotFound', function() {
		cTrack.stop();
		detectFeatures();
	}, false);
	
	// detect if tracker loses tracking of face
	document.addEventListener('clmtrackrLost', function() {
		cTrack.stop();
		detectFeatures();
	}, false);
	
	// detect if tracker has converged
	document.addEventListener('clmtrackrConverged', function() {
		if (blockResult){
			return;
		}
		blockResult = true;

		var positions = cTrack.getCurrentPosition(),
			face = {image: currentImage, leftEye: {x: positions[27][0]/currentImage.width, y: positions[27][1]/currentImage.height},
										rightEye: {x: positions[32][0]/currentImage.width, y: positions[32][1]/currentImage.height},
										mouth: {x: positions[60][0]/currentImage.width, y: positions[60][1]/currentImage.height}};
		detectedFaces.push(face);
		progressCallback(face);
		detectFeatures();
	}, false);

	
	/*
	 * Call this function to analyse faces in the given array of urls. The callback is called in the end and contains
	 * the array of analysed faces.
	 */
	function getFaceFeatures(urls_, progressCallback_, doneCallback_) {
		document.documentElement.classList.add('analysing');

		progressCallback = progressCallback_;
		doneCallback = doneCallback_;
		urls = urls_;

		detectedFaces = [];
		processImage(urls.shift());
	}

	return { getFaceFeatures: getFaceFeatures };

})(clm, pModel, ccv, cascade);

console.log(smoisheleAnalyser);
