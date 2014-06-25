/** 
 *	This object can analyse an array of images given by an array of urls.
 *	It will first detect faces using ccv, then proceeds to fit facial features using clmtrackr.
 *	
 */
var smoisheleBlender = (function(){
	'use strict';

	var faces = [],
		resultWidth = 320,
		resultHeight = 480,
		faceBlend = {};

	var eye2eyeDistance = 0;
	var eye2mouthDistance = 0;
	var eyeAngle = 0;

	// computes the average proportions of the data to be blended
	function init(){
		eye2eyeDistance = 0;
		eye2mouthDistance = 0;
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

		console.log(eye2eyeDistance + ' ' + eye2mouthDistance + ' ' + eyeAngle);

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
		faceBlend.mouth.x = (faceBlend.leftEye.x + normalizedEye2mouthDistance * Math.cos(eyeAngle))/resultWidth;
		faceBlend.mouth.y = (faceBlend.leftEye.y + normalizedEye2mouthDistance * Math.sin(eyeAngle))/resultHeight;

	}

	function transformContext(context, source, target) {
		var affinematrix = [];

        var a = source.leftEye.x, b = source.leftEye.y, dx = -target.leftEye.x, dy = -target.leftEye.y;
        var l = source.rightEye.x, m = source.rightEye.y, kx = -target.rightEye.x, ky = -target.rightEye.y;
        var p = source.mouth.x, q = source.mouth.y, sx = -target.mouth.x, sy = -target.mouth.y;
    
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
		console.log(transformContext + ' ' + face);
	}

	function blend(faces_) {
		faces = faces_;
		init();

		performNextBlend();
	}

	return { blend: blend };
})();

console.log(smoisheleBlender);


// -(void)prepareMix{
// 	pool = [[NSAutoreleasePool alloc] init];
	
//     // start mixing
//     transformer = [[Transformer alloc] init];
// 	// find correct ending points
//     int icnt = 0;
// 	int fcnt = 0;
// 	float AB = 0;
// 	float AC = 0;
// 	float theta = 0;
// 	BOOL isQuit = NO;
	
//     for (Face *face in appDelegate.faceDatabaseDelegate.faces){
// 		if(toggles[fcnt++]==NO) continue;
		
// 		icnt++;
//         CGPoint P0 = [face getPoint:0];
//         CGPoint P1 = [face getPoint:1];
//         CGPoint P2 = [face getPoint:2];
		
// 		NSString *filePath = [face.path stringByAppendingPathComponent:face.imageName];

// 		curFaceImg = [[UIImage alloc] initWithContentsOfFile:filePath];
// 		// continue if image is corrupt
// 		if (!curFaceImg) {
// 			icnt--;
// 			continue;
// 		}
// 		float resheight2 = curFaceImg.size.height/curFaceImg.size.width * reswidth;
// 		[curFaceImg release];
		
// 		float dAB = sqrt( (P1.x-P0.x)*(P1.x-P0.x)*reswidth*reswidth + (P1.y-P0.y)*(P1.y-P0.y)*resheight2*resheight2);
// 		float dAC = sqrt( (P2.x-P0.x)*(P2.x-P0.x)*reswidth*reswidth + (P2.y-P0.y)*(P2.y-P0.y)*resheight2*resheight2);
		
//         AB += dAB;
//         AC += dAC;
		
// 		theta += acos( ( (P1.x-P0.x)*(P2.x-P0.x)*reswidth*reswidth +  (P1.y-P0.y)*(P2.y-P0.y)*resheight2*resheight2)/dAB/dAC);
		
//     }
	
// 	if (icnt == 0){
// 		[self performSelectorOnMainThread:@selector(dismiss) withObject:nil waitUntilDone:YES];
// 		return;
// 	}
	
// 	AB /= (float)icnt;
// 	AC /= (float)icnt;
// 	theta /= (float)icnt;
	
	
// 	// autoresize images
// 	float ABn = 0.3*reswidth;
// 	float ACn = AC* ABn/AB;
	
// 	float dy = 0.4 * resheight;
// 	if(2*ACn*sin(theta) > dy){
// 		ACn = dy/(2*sin(theta));
// 		ABn = AB * ACn/AC;
// 	}
	
//     CGPoint b0 = CGPointMake((reswidth - ABn)/2,0.45*resheight);
//     CGPoint b1= CGPointMake((reswidth + ABn)/2,0.45*resheight);
// 	CGPoint b2 = CGPointMake(b0.x + ACn*cos(theta), b0.y + ACn*sin(theta) );
	
// 	CGPoint c0 = CGPointMake(b0.x/reswidth,b0.y/resheight);
//     CGPoint c1= CGPointMake(b1.x/reswidth,b1.y/resheight);
// 	CGPoint c2 = CGPointMake(b2.x/reswidth,b2.y/resheight);
	
// 	[theNewItem setPoint:c0 at:0];
// 	[theNewItem setPoint:c1 at:1];
// 	[theNewItem setPoint:c2 at:2];
	
//     [transformer setDestPointsP0x: b0.x P0y: b0.y P1x: b1.x P1y: b1.y P2x: b2.x P2y: b2.y];
	
//     // set memory allocation
//     mixData = malloc( reswidth*resheight*sizeof(float)*3 );
//     curBitmapData = malloc( reswidth*resheight*4 );
	
// 	// then flip and transform
//     colorSpace = CGColorSpaceCreateDeviceRGB();                       
	
// 	cgctx = CGBitmapContextCreate( curBitmapData,
// 								  reswidth,
// 								  resheight,
// 								  8,
// 								  reswidth*4,
// 								  colorSpace,
// 								  kCGImageAlphaNoneSkipLast);
// 	mix_ = -1; mixCnt_ = -1;
// 	for (int q=0;q<appDelegate.faceDatabaseDelegate.faces.count;q++)
// 		if ([[NSThread currentThread] isCancelled]){
// 			isQuit = YES;
// 			break;
// 		} else [self doMix];
		
// 	if (!isQuit) [self finalizeMix];
// 	[self finishUp];
// 	[self dismiss];
// 	[pool release];
// }
