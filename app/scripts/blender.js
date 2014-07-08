/* global smoisheleDataView */

/** 
 *	This object can analyse an array of images given by an array of urls.
 *	It will first detect faces using ccv, then proceeds to fit facial features using clmtrackr.
 *	
 */
var smoisheleBlender = (function(smoisheleDataView){
	'use strict';

	var faces = [],
		resultWidth = 320,
		resultHeight = 480,
		faceBlend = {},
		count = 0,
		maxCount = 0,
		totalQuality = 0,
		doneCallback;

	var grandBuffer = [];

	var canvas = document.createElement('canvas'),
		context = canvas.getContext('2d');

	// set up the result canvas
	canvas.setAttribute('width', resultWidth);
	canvas.setAttribute('height', resultHeight);
	context.fillStyle = 'rgba(0, 0, 0, 0)';


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

	function autoContrast() {
		var min = 255, max = 0, d, i, grayValue, stretch;
		
		var imageData = context.getImageData(0, 0, resultWidth, resultHeight);
		
		// find extremes
		for (d=0;d<imageData.data.length;d+=4) {
			grayValue = 0.21*imageData.data[d] + 0.72*imageData.data[d+1] + 0.07*imageData.data[d+2];
			if (grayValue>0){
				min = Math.min(min, grayValue);
			}
			max = Math.max(max, grayValue);
		}
		stretch = 255.0/(max-min);

		// stretch contrast
		for (d=0;d<imageData.data.length;d+=4) {
			grayValue = 0.21*imageData.data[d] + 0.72*imageData.data[d+1] + 0.07*imageData.data[d+2];
			
			for(i=0;i<3;i++){
				imageData.data[d+i] = Math.max(Math.min(255, (imageData.data[d+i] - min) * stretch), 0);
			}
		}

		context.putImageData(imageData, 0, 0);
	}

	function setContrast(contrast){

		var imageData = context.getImageData(0, 0, resultWidth, resultHeight);
		var data = imageData.data;
	    var factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

	    for(var i=0;i<data.length;i+=4) {
			data[i] = factor * (data[i] - 128) + 128;
			data[i+1] = factor * (data[i+1] - 128) + 128;
			data[i+2] = factor * (data[i+2] - 128) + 128;
	    }
		context.putImageData(imageData, 0, 0);
	
	}

	function performNextBlend(){
		var face = faces.pop();
		
		if (face === undefined){
			finishBlend();
		}

		var img = new Image();
		img.onload = function() {
			context.save();
			context.fillRect(0,0, canvas.width, canvas.height);
			transformContext(context, face, faceBlend);
			context.drawImage(img, 0, 0);
			context.restore();

			autoContrast();


			// put the image into a buffer
			var imageData = context.getImageData(0, 0, resultWidth, resultHeight);
			for (var d=0;d<grandBuffer.length;d++) {
				if (d%4<3){
					grandBuffer[d] += face.quality * imageData.data[d];
				}
			}
			
			// update the intermediate result
			count += 1;
			totalQuality += face.quality;
			context.clearRect(0, 0, canvas.width, canvas.height);

			for (d=0;d<grandBuffer.length;d++) {
				if (d%4<3){
					imageData.data[d] = grandBuffer[d] / totalQuality;
				}
			}

			context.putImageData(imageData, 0, 0);
			$('#result').css('background-image', 'url(' + canvas.toDataURL() + ')');

			var length = document.querySelector('.progress-circle path').getTotalLength();
			$('.progress-circle path').css('stroke-dasharray',length + ' ' + length)
			.css('stroke-dashoffset', length * (count/maxCount));


			if(faces.length>0) {
				performNextBlend();
			} else {
				finishBlend();
			}
		};
		
		// Since we assume the url to be a data url, we do not need set cross-origin
		img.src = face.image.url;

	}

	function finishBlend() {
		// enhance the contrast in the final image
		setContrast(50.0);

		$('#result').css('background-image', 'url(' + canvas.toDataURL() + ')');

	    var exportedImage = canvas.toDataURL('image/png;base64;');
		$('body').removeClass('blending');
		$('body').addClass('finished-blending');
		
		doneCallback(exportedImage);
	}

	function blend(faces_, callback) {
		faces = faces_;
		maxCount = faces_.length;
		totalQuality = 0;
		count = 0;
		doneCallback = callback;
		
		grandBuffer = new Uint32Array(4 * resultWidth * resultHeight);
		for (var d=0;d<grandBuffer.length;d++) {
			grandBuffer[d] = d%4===3?255:0;
		}
		
		init();

		setTimeout(function(){
			$('body').addClass('blending');
			$('body').removeClass('analysing');

			setTimeout(function(){
				smoisheleDataView.reset();
				performNextBlend();
			}, 1000);
		}, 2000);
	}

	document.getElementById('result').addEventListener('click', function(){
		document.body.classList.toggle('finished-blending');
	}, false);

	document.getElementById('smoishel-button').addEventListener('mouseenter', function(){
		document.body.classList.add('cancelable');
	}, false);

	document.getElementById('smoishel-button').addEventListener('mouseleave', function(){
		document.body.classList.remove('cancelable');
	}, false);


	return { blend: blend, init: function(){} };
})(smoisheleDataView);

smoisheleBlender.init();

