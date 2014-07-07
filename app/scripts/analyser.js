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
		cTrack = new clm.tracker({stopOnConvergence : true, scoreThreshold: 0.10}),
		queue = [],
		inProgress = false,
		blockResult = false,
		currentItem;

	cTrack.init(pModel);
	
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
		img.onerror = function() {
			console.log('error loading img');
			processQueue();
		};

		// Since we assume the url to be a data url, we do not need set cross-origin
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

		var ec = new EmotionClassifier();
		ec.init(emotionModel);
		var er = ec.predict(cTrack.getCurrentParameters());
		
		var positions = cTrack.getCurrentPosition(),
			currentImage = currentItem.face.image,
			face = {image: currentImage, leftEye: {x: positions[27][0]/currentImage.width, y: positions[27][1]/currentImage.height},
										rightEye: {x: positions[32][0]/currentImage.width, y: positions[32][1]/currentImage.height},
										mouth: {x: 0.5*(positions[57][0]+positions[60][0])/currentImage.width,
												y: 0.5*(positions[57][1]+positions[60][1])/currentImage.height},
												quality: cTrack.getScore(),
												happiness: Math.max(Math.min(1,0.25 + 0.75*er[3].value - 0.25*er[1].value),0) };
		
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

	var emotionModel = {
		'angry' : {
			'bias' : -2.3768163629,
			'coefficients' : [-0.026270300474413848, -0.037963304603547195, -0.25318394482150264, 0.36801694354709802, 0.059638621925431838, -6.3145056900010567e-17, 0.094520059272651849, 0.21347244366388901, 0.42885313652690621, -1.5592214434343613e-14, 0.13850079872874066, -5.1485910666665307e-16, 0.33298910350203975, 8.0357363919330235e-16, 0.0025325096363696059, -0.44615090964065951, -1.5784656134660036e-15, 0.047596008125675944],
		},
		'sad' : {
		    'bias' : -2.75274632938,
			'coefficients' : [0.092611010001705449, 0.12883530427748521, 0.068975994604949298, 0.19623077060801897, -0.055312197843294802, 3.5874521027522394e-16, 0.46315306348086854, -0.32103622843654361, -0.46536626891885491, 1.725612051187888e-14, -0.40841535552399683, 2.1258665882389598e-14, 0.45405204011625938, 5.9194289392226669e-15, 0.094410500655151899, -0.4861387223131064, -3.030330454831321e-15, 0.73708254653765559],
		},
		'surprised' : {
			'bias' : -2.86262062696,
			'coefficients' : [-0.12854109490879712, 0.049194392540246726, 0.22856553950573175, -0.2992140056765602, 0.25975558754705375, -1.4688408313649554e-09, -0.13685597104348368, -0.23581884244542603, 0.026447180058097462, 1.6822695398601112e-10, 0.095712304864421921, -4.4670230074132591e-10, 0.40505706085269738, 2.7821987602166784e-11, -0.54367856543588833, -0.096320945782919151, 1.4239801195516449e-10, -0.7238167998685946],
		},
		'happy' : {
			'bias' : -1.4786712822,
			'coefficients' : [0.014837209675880276, -0.31092627456808286, 0.1214238695400552, -0.45265837869400843, -0.36700140259900887, -1.7113646510738279e-15, -0.4786251427206033, -0.15377369505521801, -0.16948121903942992, 6.0300272629176253e-15, -0.021184992727875669, -6.9318606881292957e-15, -0.81611603551588852, -3.7883560238442657e-15, 0.1486320646217055, 0.94973410351769527, 3.6260400713070416e-15, -0.31361179943007411],
		},
	};

	var EmotionClassifier = function() {

		var previousParameters = [];
		var classifier = {};
		var emotions = [];
		var coefficientLength;

		this.getEmotions = function() {
			return emotions;
		};

		this.init = function(model) {
			// load it
			for (var m in model) {
				emotions.push(m);
				classifier[m] = {};
				classifier[m].bias = model[m].bias;
				classifier[m].coefficients = model[m].coefficients;
			}
			coefficientLength = classifier[emotions[0]].coefficients.length;
		};

		this.getBlank = function() {
			var prediction = [];
			for (var j = 0;j < emotions.length;j++) {
				prediction[j] = {'emotion' : emotions[j], 'value' : 0.0};
			}
			return prediction;
		};

		this.predict = function(parameters) {
			var prediction = [];
			for (var j = 0;j < emotions.length;j++) {
				var e = emotions[j];
				var score = classifier[e].bias;
				for (var i = 0;i < coefficientLength;i++) {
					score += classifier[e].coefficients[i]*parameters[i+6];
				}
				prediction[j] = {'emotion' : e, 'value' : 0.0};
				prediction[j].value = 1.0/(1.0 + Math.exp(-score));
			}
			return prediction;
		};

		this.meanPredict = function (parameters) {
			// store to array of 10 previous parameters
			previousParameters.splice(0, previousParameters.length === 10 ? 1 : 0);
			previousParameters.push(parameters.slice(0));
			
			if (previousParameters.length > 9) {
				// calculate mean of parameters?
				var meanParameters = [];
				for (var i = 0;i < parameters.length;i++) {
					meanParameters[i] = 0;
				}
				for (i = 0;i < previousParameters.length;i++) {
					for (var j = 0;j < parameters.length;j++) {
						meanParameters[j] += previousParameters[i][j];
					}
				}
				for (i = 0;i < parameters.length;i++) {
					meanParameters[i] /= 10;
				}

				// calculate logistic regression 
				return this.predict(meanParameters);
			} else {
				return false;
			}
		};
	};

	return { getFaceFeatures: getFaceFeatures, init: function(){} };

})(clm, pModel);

smoisheleAnalyser.init();
