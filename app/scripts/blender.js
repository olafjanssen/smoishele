/** 
 *	This object can analyse an array of images given by an array of urls.
 *	It will first detect faces using ccv, then proceeds to fit facial features using clmtrackr.
 *	
 */
var smoisheleBlender = (function(){
	'use strict';

	var faces = [],
		resultWidth = 320 * 2,
		resultHeight = 480 * 2,
		faceBlend = {},
		count = 0,
		doneCallback;

	var grandBuffer = [];

	var canvas = document.getElementById('result'),
		context = canvas.getContext('2d');
	canvas.setAttribute('width', resultWidth);
	canvas.setAttribute('height', resultHeight);

	// computes the average proportions of the data to be blended
	function init(){
		var eye2eyeDistance = 0,
			eye2mouthDistance = 0,
			eyeAngle = 0;

		faces.forEach(function(face){
			var scaledImageHeight = face.image.height/face.image.width * resultWidth;
			var eye2eye = Math.sqrt( Math.pow( (face.rightEye.x-face.leftEye.x)*resultWidth, 2) + Math.pow( (face.rightEye.y-face.leftEye.y)*scaledImageHeight, 2) );
			var eye2mouth = Math.sqrt( Math.pow( (face.mouth.x-face.leftEye.x)*resultWidth, 2) + Math.pow( (face.mouth.y-face.leftEye.y)*scaledImageHeight, 2) );
			
			eye2eyeDistance += eye2eye;
			eye2mouthDistance += eye2mouth;
			eyeAngle += Math.acos( ((face.rightEye.x-face.leftEye.x)*(face.mouth.x-face.leftEye.x) * resultWidth * resultWidth + (face.rightEye.y-face.leftEye.y)*(face.mouth.y-face.leftEye.y) * scaledImageHeight * scaledImageHeight) / eye2eye / eye2mouth );
		});

		eye2eyeDistance /= faces.length;
		eye2mouthDistance /= faces.length;
		eyeAngle /= faces.length;

		// resizing and position the averaged face on the result canvas
		var normalizedEye2eyeDistance = 0.3 * resultWidth, normalizedEye2mouthDistance = eye2mouthDistance* normalizedEye2eyeDistance/eye2eyeDistance;
		var dy = 0.4 * resultHeight;

		if (2*normalizedEye2mouthDistance * Math.sin(eyeAngle) > dy) {
			normalizedEye2mouthDistance = dy / (2 * Math.sin(eyeAngle));
			normalizedEye2eyeDistance = eye2eyeDistance * normalizedEye2mouthDistance/eye2mouthDistance;
		}

		// create the average face metadata
		faceBlend = {image: {width: resultWidth, height: resultHeight},
					leftEye: {x: 0.5*(resultWidth - normalizedEye2eyeDistance)/resultWidth, y: 0.45},
					rightEye: {x: 0.5*(resultWidth + normalizedEye2eyeDistance)/resultWidth, y: 0.45}};
		
		faceBlend.mouth = {x: faceBlend.leftEye.x + (normalizedEye2mouthDistance * Math.cos(eyeAngle))/resultWidth,
							y: faceBlend.leftEye.y + (normalizedEye2mouthDistance * Math.sin(eyeAngle))/resultHeight};
	}

	function transformContext(context, source, target) {
		var affinematrix = [];

        var a = source.leftEye.x * source.image.width,
			b = source.leftEye.y * source.image.height,
			dx = -target.leftEye.x * target.image.width,
			dy = -target.leftEye.y * target.image.height;
        var l = source.rightEye.x * source.image.width,
			m = source.rightEye.y * source.image.height,
			kx = -target.rightEye.x * target.image.width,
			ky = -target.rightEye.y * target.image.height;
        var p = source.mouth.x * source.image.width,
			q = source.mouth.y * source.image.height,
			sx = -target.mouth.x * target.image.width,
			sy = -target.mouth.y * target.image.height;
    
        var D = (a*m+b*p+l*q) - (a*q+b*l+m*p);
        affinematrix[0] = ((b*kx + m*sx + dx*q) - (b*sx +q*kx + dx*m))/D;
        affinematrix[1] = ((b*ky + m*sy + dy*q) - (b*sy +q*ky + dy*m))/D;
        affinematrix[2] = ((a*sx + p*kx + dx*l) - (a*kx +l*sx + dx*p))/D;
        affinematrix[3] = ((a*sy + p*ky + dy*l) - (a*ky +l*sy + dy*p))/D;
        affinematrix[4] = ((a*q*kx + b*l*sx + dx*m*p) - (a*m*sx +b*p*kx + dx*l*q))/D;
        affinematrix[5] = ((a*q*ky + b*l*sy + dy*m*p) - (a*m*sy +b*p*ky + dy*l*q))/D;

        context.transform(affinematrix[0],affinematrix[1],affinematrix[2],affinematrix[3],affinematrix[4],affinematrix[5]);
	}

	function performNextBlend(){
		var face = faces.pop();
				
		var img = new Image();
		img.onload = function() {
			context.save();
			context.clearRect(0, 0, canvas.width, canvas.height);
			transformContext(context, face, faceBlend);
			context.drawImage(img, 0, 0);
			context.restore();

			// put the image into a buffer
			var imageData = context.getImageData(0, 0, resultWidth, resultHeight);
			for (var d=0;d<grandBuffer.length;d++) {
				grandBuffer[d] += imageData.data[d];
			}
	
			if(faces.length>0) {
				performNextBlend();
			} else {
				finishBlend();
			}
		};
		
		img.crossOrigin = 'Anonymous';
		img.src = face.image.url;

	}

	function finishBlend(){
		context.clearRect(0, 0, canvas.width, canvas.height);
		var imageData = context.getImageData(0, 0, resultWidth, resultHeight);

		for (var d=0;d<grandBuffer.length;d++) {
			imageData.data[d] = grandBuffer[d]/count;
		}
		context.putImageData(imageData, 0, 0);

	    var exportedImage = canvas.toDataURL('image/png;base64;');
		doneCallback(exportedImage);
	}

	function blend(faces_, callback) {
		faces = faces_;
		count = faces.length;
		doneCallback = callback;
		
		grandBuffer = new Uint32Array(4 * resultWidth * resultHeight);
		for (var d=0;d<grandBuffer.length;d++) {
			grandBuffer[d] = d%4===3?255:0;
		}
		
		init();

		setTimeout(function(){
			$('body').addClass('blending');
			setTimeout(performNextBlend, 1000);
		}, 2000);
	}

	return { blend: blend, init: function(){} };
})();

smoisheleBlender.init();

