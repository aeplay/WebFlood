var viewPortX;
var viewPortY;
var viewPortWidth;
var viewPortHeight;

window.onload = function () {
	var devicePixelRatio = 1.0;// || window.devicePixelRatio || 1;
	window.context = new GLOW.Context({
		clear: {red: 0.2, green: 0.2, blue: 0.2},
		preserveDrawingBuffer: true,
		width: window.innerWidth * devicePixelRatio * 0.8,
		height: window.innerHeight * devicePixelRatio
	});

	assureRequiredGLFeatures(context);

	window.viewportElem = document.getElementById("viewport");
	context.domElement.style.height = "100%";
	context.domElement.style.width = "100%";
	viewportElem.appendChild(context.domElement);

	Scenarios.fetch("scenarios.json");
	Scenarios.list();
};

var lastFrame = performance.now();
var lastSecond = performance.now();
var minFrame = 1000;
var maxFrame = 0;
var nFrames = 0;
var nFramesTotal = 0;

var start = function () {
	document.getElementById("viewport").style.display = "block";
	viewPortX = viewportElem.offsetLeft;
	viewPortY = viewportElem.offsetTop;
	viewPortWidth = viewportElem.offsetWidth;
	viewPortHeight = viewportElem.offsetHeight;

	UI.init({
		numbers: {
			"stepsPerFrame": Simulation.parameters,
			"sourceWaterHeight": Simulation.parameters,
			"sourceWaterVelocity": Simulation.parameters,
			"gravity": Simulation.parameters,
			"manningCoefficient": Simulation.parameters,
			"drainageAmount": Simulation.parameters
		},

		toggles: {
			"showWater": Visualisation.toggles,
			"showFloodDuration": Visualisation.toggles,
			"showMaxVelocity": Visualisation.toggles,
			"showMaxDepth": Visualisation.toggles,
			"showTerrainContours": Visualisation.toggles
		},

		triggers: {
			"saveWater": function () {
				Visualisation.saveWaterNextFrame = true;
			},
			"createInundationMap": function () {
				Visualisation.createInundationMapNextFrame = true;
			},
			"saveTerrain": function () {
				var tiff = write16bitTiff(terrainData, gridResolution, gridResolution);
				var filename = document.getElementById("scenarioName").value
						.trim().replace(/\s/g, "_") + "_terrain.tif";
				saveContent(uint8ToBase64(tiff), filename);
			},
			"addGauge": function () {UI.mode = "addGauge"},
			"paintObstacles": function () {UI.mode = "paintObstacles"}
		}
	});

	var render = function () {
		window.requestAnimationFrame(render);

		var thisFrame = performance.now();
		var frameDuration = thisFrame - lastFrame;
		if (frameDuration > maxFrame) maxFrame = frameDuration;
		if (frameDuration < minFrame) minFrame = frameDuration;
		var avg = (thisFrame - lastSecond) / nFrames;
		lastFrame = thisFrame;

		if (thisFrame - lastSecond > 1000) {
			document.getElementById("frameDuration").textContent =
				"min " + minFrame.toFixed(1) + "ms - " +
				"avg " +      avg.toFixed(1) + "ms - " +
				"max " + maxFrame.toFixed(1) + "ms";

			minFrame = 1000;
			maxFrame = 0;
			nFrames = 0;
			lastSecond = thisFrame;
		}

		nFrames ++;
		nFramesTotal ++;

		context.cache.clear();

		Simulation.update();
		Visualisation.render();
	};

	window.requestAnimationFrame(render);
};