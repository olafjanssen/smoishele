console.log('\'Allo \'Allo!');

var smoishele = (function(clm, pModel){
	'use strict';

	var canvas = document.createElement('canvas'),
		context = canvas.getContext('2d'),
		cTrack = new clm.tracker({stopOnConvergence : true});
	
	cTrack.init(pModel);


	function start(urls) {
		console.log(urls);
	}

	return { blendUrls: start };


				// var cc = document.getElementById('image').getContext('2d');
				// var overlay = document.getElementById('overlay');
				// var overlayCC = overlay.getContext('2d');
				
				// var ctrack = new clm.tracker({stopOnConvergence : true});
				// ctrack.init(pModel);
			
				// images = [];
				// images.push('https://fbcdn-sphotos-b-a.akamaihd.net/hphotos-ak-xpa1/t1.0-9/1150996_10151751243536893_1407817114_n.jpg');
				// for(var i=1; i<23; i++) {
				// 	images.push('./media/jap'+i+".png");
				// }

				// var iterator = 0;

				// var drawRequest;

				// loadImage(images[iterator++]);
				
				// function animate(box) {
				// 	ctrack.start(document.getElementById('image'), box);
				// 	drawLoop();
				// }
				
				// function drawLoop() {
				// 	drawRequest = requestAnimFrame(drawLoop);
				// 	overlayCC.clearRect(0, 0, 720, 576);
				// 	if (ctrack.getCurrentPosition()) {
				// 		ctrack.draw(overlay);
				// 	}
				// }
				
				// // detect if tracker fails to find a face
				// document.addEventListener("clmtrackrNotFound", function(event) {
				// 	ctrack.stop();
				// 	alert("The tracking had problems with finding a face in this image. Try selecting the face in the image manually.")
				// }, false);
				
				// // detect if tracker loses tracking of face
				// document.addEventListener("clmtrackrLost", function(event) {
				// 	ctrack.stop();
				// 	alert("The tracking had problems converging on a face in this image. Try selecting the face in the image manually.")
				// }, false);
				
				// // detect if tracker has converged
				// document.addEventListener("clmtrackrConverged", function(event) {
				// 	document.getElementById('convergence').innerHTML = "CONVERGED";
				// 	document.getElementById('convergence').style.backgroundColor = "#00FF00";
				// 	// stop drawloop
				// 	cancelRequestAnimFrame(drawRequest);

				// 	var positions = ctrack.getCurrentPosition();
					
				// 	var smFace = {leftEye: positions[27], rightEye: positions[32], mouth: positions[60]};	

				// 	console.log(smFace);

				// 	loadImage(images[iterator++]);
				// }, false);
				

				// // function to start showing images
				// function loadImage(url) {
				// 		// Render thumbnail.
				// 		var canvas = document.getElementById('image')
				// 		var cc = canvas.getContext('2d');
				// 		var img = new Image();
				// 		img.onload = function() {
				// 			if (img.height > 500 || img.width > 700) {
				// 				var rel = img.height/img.width;
				// 				var neww = 700;
				// 				var newh = neww*rel;
				// 				if (newh > 500) {
				// 					newh = 500;
				// 					neww = newh/rel;
				// 				}
				// 				canvas.setAttribute('width', neww);
				// 				canvas.setAttribute('height', newh);
				// 				cc.drawImage(img,0,0,neww, newh);
				// 			} else {
				// 				canvas.setAttribute('width', img.width);
				// 				canvas.setAttribute('height', img.height);
				// 				cc.drawImage(img,0,0,img.width, img.height);
				// 			}
							
				// 			var coords = ccv.detect_objects(canvas, cascade, 5, 1);
				// 			for(var c = 0; c < coords.length; c++ ) {
				// 				var box = [coords[c].x, coords[c].y, coords[c].width, coords[c].height];
				// 				console.log(box);
				// 				animate(box);
				// 			}
				// 		}
				// 		img.crossOrigin = "Anonymous";
				// 		img.src = url;
				// 		overlayCC.clearRect(0, 0, 720, 576);
				// 		document.getElementById('convergence').innerHTML = "";
				// 		ctrack.reset();
				// }



})(clm, pModel);

console.log(smoishele);