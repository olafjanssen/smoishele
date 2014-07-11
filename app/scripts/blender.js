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

	/**
	 * Converts an RGB color value to HSL. Conversion formula
	 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
	 * Assumes r, g, and b are contained in the set [0, 255] and
	 * returns h, s, and l in the set [0, 1].
	 *
	 * @param   Number  r       The red color value
	 * @param   Number  g       The green color value
	 * @param   Number  b       The blue color value
	 * @return  Array           The HSL representation
	 */
	function rgbToHsl(r, g, b) {
	    r /= 255;
	    g /= 255;
	    b /= 255;

	    var max = Math.max(r, g, b), min = Math.min(r, g, b);
	    var h, s, l = (max + min) / 2;

	    if(max === min){
	        h = s = 0; // achromatic
	    } else {
	        var d = max - min;
	        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	        switch(max){
				case r:
					h = (g - b) / d + (g < b ? 6 : 0);
					break;
				case g:
					h = (b - r) / d + 2;
					break;
				case b:
					h = (r - g) / d + 4;
					break;
	        }
	        h /= 6;
	    }

	    return [h, s, l];
	}

	/**
	 * Converts an HSL color value to RGB. Conversion formula
	 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
	 * Assumes h, s, and l are contained in the set [0, 1] and
	 * returns r, g, and b in the set [0, 255].
	 *
	 * @param   Number  h       The hue
	 * @param   Number  s       The saturation
	 * @param   Number  l       The lightness
	 * @return  Array           The RGB representation
	 */
	function hslToRgb(h, s, l){
	    var r, g, b;

	    if(s === 0){
	        r = g = b = l; // achromatic
	    }else{
	        var hue2rgb = function(p, q, t){
	            if(t < 0) { t += 1; }
	            if(t > 1) { t -= 1; }
	            if(t < 1/6) { return p + (q - p) * 6 * t; }
	            if(t < 1/2) { return q; }
	            if(t < 2/3) { return p + (q - p) * (2/3 - t) * 6; }
	            return p;
	        };

	        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	        var p = 2 * l - q;
	        r = hue2rgb(p, q, h + 1/3);
	        g = hue2rgb(p, q, h);
	        b = hue2rgb(p, q, h - 1/3);
	    }

	    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
	}

	/**
	* Equalizes the histogram of an unsigned 1-channel image with values
	* in range [0, rangeMax-1]. Corresponds to the equalizeHist OpenCV function.
	*
	* @param {Array} src 1-channel source image
	* @param {Array} [dst] 1-channel destination image. If omitted, the
	* result is written to src (faster)
	* @return {Array} Destination image
	*/
	function equalizeHistogram(rangeMax, src, dst) {
	    var srcLength = src.length;
	    if (!dst) { dst = src; }

	    // Compute histogram and histogram sum:
	    var hist = new Float32Array(rangeMax);
	    var sum = 0;
		/*jshint bitwise: false*/
	    for (var i = 0; i < srcLength; ++i) {
	        ++hist[~~src[i]];
	        ++sum;
	    }

	    // Compute integral histogram:
	    var prev = hist[0];
	    var mmin = 0, mmax = 0;
	    for (i = 1; i < rangeMax; ++i) {
	        prev = hist[i] += prev;
	        if (prev/sum < 0.01) { mmin = i; }
	        if (prev/sum < 0.99) { mmax = i; }
	    }

	    // Equalize image:
	    //var norm = (rangeMax - 1) / sum;
	    for (i = 0; i < srcLength; ++i) {
	        // dst[i] = hist[~~src[i]] * norm;
	        dst[i] = (src[i] - mmin) * (rangeMax - 1) / (mmax - mmin);
	    }

	    /*jshint bitwise: true*/
		return dst;
	}

	function autoContrast() {
		var imageData = context.getImageData(0, 0, resultWidth, resultHeight);
		var data = imageData.data;
		var luminance = new Float32Array(data.length/4);

		for (var d=0;d<data.length;d+=4) {
			luminance[d/4] = rgbToHsl(data[d], data[d+1], data[d+2])[2] * 256;
		}

		luminance = equalizeHistogram(256, luminance);

		for (d=0;d<data.length;d+=4) {
			var hsl = rgbToHsl(data[d], data[d+1], data[d+2]);
			var rgb = hslToRgb(hsl[0], hsl[1], luminance[d/4]/256);
			data[d] = rgb[0];
			data[d+1] = rgb[1];
			data[d+2] = rgb[2];
		}

		context.putImageData(imageData, 0, 0);
	}

	// function autoContrast() {
	// 	var min = 255, max = 0, d, i, grayValue, stretch;
		
	// 	var imageData = context.getImageData(0, 0, resultWidth, resultHeight);
		
	// 	// find extremes
	// 	for (d=0;d<imageData.data.length;d+=4) {
	// 		grayValue = 0.21*imageData.data[d] + 0.72*imageData.data[d+1] + 0.07*imageData.data[d+2];
	// 		if (grayValue>0){
	// 			min = Math.min(min, grayValue);
	// 		}
	// 		max = Math.max(max, grayValue);
	// 	}
	// 	stretch = 255.0/(max-min);

	// 	// stretch contrast
	// 	for (d=0;d<imageData.data.length;d+=4) {
	// 		grayValue = 0.21*imageData.data[d] + 0.72*imageData.data[d+1] + 0.07*imageData.data[d+2];
			
	// 		for(i=0;i<3;i++){
	// 			imageData.data[d+i] = Math.max(Math.min(255, (imageData.data[d+i] - min) * stretch), 0);
	// 		}
	// 	}

	// 	context.putImageData(imageData, 0, 0);
	// }

	// function setContrast(contrast){

	// 	var imageData = context.getImageData(0, 0, resultWidth, resultHeight);
	// 	var data = imageData.data;
	//     var factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

	//     for(var i=0;i<data.length;i+=4) {
	// 		data[i] = factor * (data[i] - 128) + 128;
	// 		data[i+1] = factor * (data[i+1] - 128) + 128;
	// 		data[i+2] = factor * (data[i+2] - 128) + 128;
	//     }
	// 	context.putImageData(imageData, 0, 0);
	
	// }

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

			//autoContrast();


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
		autoContrast();

		$('#result').css('background-image', 'url(' + canvas.toDataURL() + ')');

	    var exportedImage = canvas.toDataURL('image/png;base64;');
		$('body').removeClass('blending');
		$('body').addClass('finished-blending');
		$('body').addClass('contains-result');
		
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

