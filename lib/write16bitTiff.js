var write16bitTiff = function (floatArray, width, height) {
	var imageDataLength = width * height * 2;
	var buffer = new Uint8Array(imageDataLength + 1000);
	var o = 0;

	// tiff header
	buffer[o] = 0x4d; o++;
	buffer[o] = 0x4d; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x2a; o++;

	var firstIfdOffset = imageDataLength + 8;
	buffer[o] = (firstIfdOffset & 0xff000000) / 16777216; o++;
	buffer[o] = (firstIfdOffset & 0x00ff0000) / 65536; o++;
	buffer[o] = (firstIfdOffset & 0x0000ff00) / 256; o++;
	buffer[o] = (firstIfdOffset & 0x000000ff); o++;

	for (var p = 0; p < width * height; p++) {
		var intValue = Math.floor(floatArray[p] * 65535);
		buffer[o] = (intValue & 0xff00) / 256; o++;
		buffer[o] = (intValue & 0x00ff); o++;
	}

	// footer, 13 directory entries
	buffer[o] = 0x00; o++;
	buffer[o] = 0x0d; o++;

	// width tag
	buffer[o] = 0x01; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x03; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x01; o++;

	buffer[o] = (width & 0xff00) / 256; o++;
	buffer[o] = (width & 0x00ff); o++;

	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;

	// height tag
	buffer[o] = 0x01; o++;
	buffer[o] = 0x01; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x03; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x01; o++;

	buffer[o] = (height & 0xff00) / 256; o++;
	buffer[o] = (height & 0x00ff); o++;

	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;

	// bits per sample tag

	buffer[o] = 0x01; o++;
	buffer[o] = 0x02; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x03; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x01; o++;

	buffer[o] = 0x00; o++;
	buffer[o] = 0x10; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;

	// compression flag
	buffer[o] = 0x01; o++;
	buffer[o] = 0x03; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x03; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x01; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x01; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;

	// photometric interpretation tag
	buffer[o] = 0x01; o++;
	buffer[o] = 0x06; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x03; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x01; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x01; o++; // 1 = greyscale 2 = rgb
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;

	// strip offset tag
	buffer[o] = 0x01; o++;
	buffer[o] = 0x11; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x04; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x01; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x08; o++;

	// orientation flag
	buffer[o] = 0x01; o++;
	buffer[o] = 0x12; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x03; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x01; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x01; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;

	// sample per pixel tag
	buffer[o] = 0x01; o++;
	buffer[o] = 0x15; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x03; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x01; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x01; o++; // number of channels
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;

	// rows per strip tag
	buffer[o] = 0x01; o++;
	buffer[o] = 0x16; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x03; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x01; o++;

	buffer[o] = (height & 0xff00) / 256; o++;
	buffer[o] = (height & 0x00ff); o++;

	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;

	// strip byte count tag
	buffer[o] = 0x01; o++;
	buffer[o] = 0x17; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x04; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x01; o++;

	var byteCount = imageDataLength;
	buffer[o] = (byteCount & 0xff000000) / 16777216; o++;
	buffer[o] = (byteCount & 0x00ff0000) / 65536; o++;
	buffer[o] = (byteCount & 0x0000ff00) / 256; o++;
	buffer[o] = (byteCount & 0x000000ff); o++;

	// minimum sample value tag
	buffer[o] = 0x01; o++;
	buffer[o] = 0x18; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x03; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x01; o++;

	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;

	// maximum sample value tag
	buffer[o] = 0x01; o++;
	buffer[o] = 0x19; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x03; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x01; o++;

	buffer[o] = 0xff; o++;
	buffer[o] = 0xff; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;


	// sample format tag
	buffer[o] = 0x01; o++;
	buffer[o] = 0x53; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x03; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x01; o++;

	buffer[o] = 0x00; o++;
	buffer[o] = 0x01; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;

	// end of the directory entry
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;
	buffer[o] = 0x00; o++;

	console.log(o);
	return buffer;
};

var testImage = new Float32Array([1.0, 0.5, 0.25, 0.0]);

function uint8ToBase64(u8Arr){
	var CHUNK_SIZE = 0x8000; //arbitrary number
	var index = 0;
	var length = u8Arr.length;
	var result = '';
	var slice;
	while (index < length) {
		slice = u8Arr.subarray(index, Math.min(index + CHUNK_SIZE, length));
		result += String.fromCharCode.apply(null, slice);
		index += CHUNK_SIZE;
	}
	return btoa(result);
}

function saveContent(fileContents, fileName) {
	var link = document.createElement('a');
	link.download = fileName;
	link.href = 'data:application/stream;base64,' + fileContents;
	link.click();
}

//var data = write16bitTiff(testImage, 2, 2);
//
//console.log(data);
//
//window.open('data:application/stream;base64,' + uint8ToBase64(data));