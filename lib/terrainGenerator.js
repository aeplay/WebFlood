var terrain = function (x, y) {
	var result = 0// + (Math.cos(2 * x/gridResolution * Math.PI) + Math.cos(2 * y/gridResolution * Math.PI)) * 0.2;
	var multiplier = 0.2;
	var scaling = 1.5;
	for (var o = 1; o <= octaves; o++) {
		var val = noise.simplex3(o * scaling * x/gridResolution, o * scaling * y/gridResolution, o * 1);
		result += (1 - 2 * Math.abs(val)) * multiplier;
		multiplier *= 0.4 * (1 + result/10);
	}

	result += (-0.1 + 0.2 * Math.abs(noise.simplex3(o/4 * scaling * x/gridResolution, o/4 * scaling * y/gridResolution, o * 2)))
	result += 0.1 * noise.simplex3(o * x/gridResolution, o * y/gridResolution, o * 4);
	result += -0.0003 * x;
	result += Math.abs(-0.002 * (gridResolution/2 - y));

	return result;
};