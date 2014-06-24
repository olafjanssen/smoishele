/*global clm, pModel */

var smoishele = (function(clm, pModel){
	'use strict';

	var canvas = document.createElement('canvas'),
		context = canvas.getContext('2d'),
		cTrack = new clm.tracker({stopOnConvergence : true}),
		urls = [],
		iterator = 0;
		
	cTrack.init(pModel);

	function start(urls_) {
		urls = urls_;

		// reset the iterator
		iterator = 0;

		processImage(urls[iterator++]);
	}

	function processImage(url) {
		var img = new Image();
		img.onload = function() {
			if (img.height > 500 || img.width > 700) {
				var rel = img.height/img.width;
				var neww = 700;
				var newh = neww*rel;
				if (newh > 500) {
					newh = 500;
					neww = newh/rel;
				}
				canvas.setAttribute('width', neww);
				canvas.setAttribute('height', newh);
				context.drawImage(img,0,0,neww, newh);
			} else {
				canvas.setAttribute('width', img.width);
				canvas.setAttribute('height', img.height);
				context.drawImage(img,0,0,img.width, img.height);
			}
			// animate();
			// var coords = ccv.detect_objects(canvas, cascade, 5, 1);
			// for(var c = 0; c < coords.length; c++ ) {
			// 	var box = [coords[c].x, coords[c].y, coords[c].width, coords[c].height];
			// 	console.log(box);
				// animate(box);
			// }
			cTrack.start(canvas, null);
		};
		img.crossOrigin = 'Anonymous';
		img.src = url;
		
		cTrack.reset();
	}

	// detect if tracker fails to find a face
	document.addEventListener('clmtrackrNotFound', function() {
		cTrack.stop();
	}, false);
	
	// detect if tracker loses tracking of face
	document.addEventListener('clmtrackrLost', function() {
		cTrack.stop();
	}, false);
	
	// detect if tracker has converged
	document.addEventListener('clmtrackrConverged', function() {
		var positions = cTrack.getCurrentPosition(),
			face = {leftEye: positions[27], rightEye: positions[32], mouth: positions[60]};

		console.log(face);

		processImage(urls[iterator++]);
	}, false);
				

	return { blendUrls: start };

})(clm, pModel);

console.log(smoishele);