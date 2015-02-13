Visualisation = {
	toggles: {},

	gauges: [],

	init: function (simulation, parameters) {
		var satImage = parameters.satellite;
		if (parameters.maxDisplayWaterHeight) {
			parameters.maxDisplayWaterHeight = parameters.maxDisplayWaterHeight / simulation.settings.worldSize;
		} else {
			parameters.maxDisplayWaterHeight = 1;
		}
		Visualisation.displayScale = parameters.displayScale || 1024;
		Visualisation.displayHeightScale = parameters.displayHeightScale || 1;

		initCamera();

		if (parameters.gauges) parameters.gauges.forEach(function (info) {
			Visualisation.addGauge(new GLOW.Vector3(info[0], info[1], 0), info[2], info[3]);
		});

		var satTexture = new GLOW.Texture({
			data: satImage,
			width: simulation.settings.resolution,
			height: simulation.settings.resolution,
			wrapS: GL.CLAMP_TO_EDGE,
			wrapT: GL.CLAMP_TO_EDGE
		});

		var terrainMeshTiles = createMeshTiles({
			resolution: simulation.settings.resolution,
			worldSize: Visualisation.displayScale,
			maxTileSize: 64,
			vertexShader: 'terrain-grid-v',
			fragmentShader: 'terrain-grid-f',
			data: {
				texture: undefined,
				sat: satTexture,
				useSat: new GLOW.Float(satImage ? 1 : 0),
				heightScale: new GLOW.Float(simulation.parameters.heightScale),
				displayHeightScale: new GLOW.Float(Visualisation.displayScale * Visualisation.displayHeightScale),
				damage: undefined,
				showDuration: new GLOW.Float(0),
				showMaxDepth: new GLOW.Float(0),
				showMaxVelocity: new GLOW.Float(0),
				showTerrainContours: new GLOW.Float(0),
				maxDisplayWaterHeight: new GLOW.Float(parameters.maxDisplayWaterHeight),
				transform: new GLOW.Matrix4(),
				cameraInverse: camera.inverse,
				cameraProjection: camera.projection,
				unit: new GLOW.Float(1/simulation.settings.resolution)
			}
		});
		var waterMeshTiles = createMeshTiles({
			resolution: simulation.settings.resolution,
			worldSize: Visualisation.displayScale,
			maxTileSize: 64,
			vertexShader: 'water-grid-v',
			fragmentShader: 'water-grid-f',
			data: {
				texture: undefined,
				displayHeightScale: new GLOW.Float(Visualisation.displayScale * Visualisation.displayHeightScale),
				flowTexture: undefined,
				transform: new GLOW.Matrix4(),
				cameraInverse: camera.inverse,
				cameraProjection: camera.projection,
				unit: new GLOW.Float(1/simulation.settings.resolution)
			}
		});

		var flowVizFBO = new GLOW.FBO({
			width: Math.min(simulation.settings.resolution * 4, 1024),
			height: Math.min(simulation.settings.resolution * 4, 1024),
			type: GL.FLOAT,
			magFilter: GL.LINEAR,
			minFilter: GL.LINEAR,
			depth: false
		});

		var flowVizStep = new GLOW.Shader({
			vertexShader: loadSynchronous("shaders/id-v.glsl"),
			fragmentShader: loadSynchronous("shaders/flow-viz-f.glsl"),
			data: {
				noise: new GLOW.Texture({data: "noise.png", minFilter: GL.NEAREST}),
				vertices: GLOW.Geometry.Plane.vertices(),
				uvs: GLOW.Geometry.Plane.uvs(),
				time: new GLOW.Float(0),
				unit: new GLOW.Float(1 / simulation.settings.resolution),
				dt: new GLOW.Float(simulation.settings.dt)
			},
			indices: GLOW.Geometry.Plane.indices()
		});

		var waterSumFBOs = [];
		var waterSumEncodeFBOs = [];
		var waterSumShader = new GLOW.Shader({
			vertexShader: loadSynchronous("shaders/id-v.glsl"),
			fragmentShader: loadSynchronous("shaders/sum-down-water-f.glsl"),
			data: {
				water: undefined,
				pixelWidth: undefined,
				vertices: GLOW.Geometry.Plane.vertices(),
				uvs: GLOW.Geometry.Plane.uvs()
			},
			indices: GLOW.Geometry.Plane.indices()
		});

		for (var res = simulation.settings.resolution; res > 1; res /= 2) {
			if (res < simulation.settings.resolution) {
				waterSumFBOs.push(new GLOW.FBO({
					width: res,
					height: res,
					type: GL.FLOAT,
					magFilter: GL.NEAREST,
					minFilter: GL.NEAREST,
					depth: false
				}));
			}

			waterSumEncodeFBOs.push(new GLOW.FBO({
				width: res,
				height: res,
				type: GL.UNSIGNED_BYTE,
				magFilter: GL.NEAREST,
				minFilter: GL.NEAREST,
				depth: false
			}));
		}

		var waterSumEncodeShader = new GLOW.Shader({
			vertexShader: loadSynchronous("shaders/id-v.glsl"),
			fragmentShader: loadSynchronous("shaders/encode-float-f.glsl"),
			data: {
				texture: undefined,
				inputPixelWidth: new GLOW.Float(1/2),
				amplification: new GLOW.Float(1),
				vertices: GLOW.Geometry.Plane.vertices(),
				uvs: GLOW.Geometry.Plane.uvs()
			},
			indices: GLOW.Geometry.Plane.indices()
		});

		var showTextureShader = new GLOW.Shader({
			vertexShader: loadSynchronous("shaders/id-v.glsl"),
			fragmentShader: loadSynchronous("shaders/texture-f.glsl"),
			data: {
				texture: undefined,
				vertices: GLOW.Geometry.Plane.vertices(0.5),
				uvs: GLOW.Geometry.Plane.uvs()
			},
			indices: GLOW.Geometry.Plane.indices()
		});

		Visualisation.toggles = {
			showWater: true,
			set showFloodDuration (show) {
				terrainMeshTiles.forEach(function (tile) {
					tile.uniforms.showDuration.data = new GLOW.Float(show ? 1.0 : 0.0)
				});
			},
			set showMaxVelocity (show) {
				terrainMeshTiles.forEach(function (tile) {
					tile.uniforms.showMaxVelocity.data = new GLOW.Float(show ? 1.0 : 0.0)
				});
			},
			set showMaxDepth (show) {
				terrainMeshTiles.forEach(function (tile) {
					tile.uniforms.showMaxDepth.data = new GLOW.Float(show ? 1.0 : 0.0)
				});
			},
			set showTerrainContours (show) {
				terrainMeshTiles.forEach(function (tile) {
					tile.uniforms.showTerrainContours.data = new GLOW.Float(show ? 1.0 : 0.0)
				});
			}
		};

		var lastWaterSave = -1;

		var cursorPositionElem = document.getElementById("cursorPosition");
		var gaugesElem = document.getElementById("gauges");

		var visualTime = 0;
		var maxGaugeHeight = 0.001;
		var firstFrame = true;

		Visualisation.render = function () {
			visualTime = 0.33 * simulation.nStepsTotal;

			if (UI.cursorX) {
				var cursorDisplayPosition = cursorToDisplayPosition(UI.cursorX, UI.cursorY);
				var cursorSimulationPosition = Visualisation.displayToSimulationPosition(
					cursorDisplayPosition);
				var cursorWorldPosition = Visualisation.displayToWorldPosition(cursorDisplayPosition);
				cursorPositionElem.innerText =
					cursorWorldPosition.value[0].toFixed(2) + " " +
					cursorWorldPosition.value[1].toFixed(2) + " (" +
					cursorSimulationPosition.value[0].toFixed(2) + " " +
					cursorSimulationPosition.value[1].toFixed(2) + ")";
			}

			if (simulation.parameters.stepsPerFrame > 0 || firstFrame) {
				firstFrame = false;
				Visualisation.saveWaterNextFrame = false;
				var waterSumEncodeFBO = waterSumEncodeFBOs[0];
				waterSumEncodeFBO.bind();
				waterSumEncodeShader.uniforms.amplification.data = new GLOW.Float(1);
				waterSumEncodeShader.uniforms.inputPixelWidth.data = new GLOW.Float(1 / simulation.settings.resolution);
				waterSumEncodeShader.uniforms.texture.data = simulation.state.texture; //waterSumFBOs[waterSumFBOs.length - 2];
				waterSumEncodeShader.draw();

				Visualisation.gauges.forEach(function (gauge) {
					var gaugeString = gauge.name;
					var pixel = new Uint8Array(4);
					GL.readPixels(
						gauge.position.value[0] * simulation.settings.resolution,
						gauge.position.value[1] * simulation.settings.resolution,
						1,
						1,
						GL.RGBA, GL.UNSIGNED_BYTE, pixel
					);
					pixel = new Float32Array(pixel.buffer);
					var height = Math.max(0, pixel[0] * simulation.settings.worldSize);

					if (height > maxGaugeHeight) maxGaugeHeight = 1.1 * height;

					gauge.historyTimes.push(simulation.t);
					gauge.historyValues.push(height);
					gauge.board.update();

					gaugeString += ": " + height.toFixed(4);
					gaugeString += " (" + (gauge.position.value[0] * simulation.settings.worldSize).toFixed(2);
					gaugeString += ", " + (gauge.position.value[1] * simulation.settings.worldSize).toFixed(2) + ")\n";
					gauge.textElement.innerText = gaugeString;
				});

				Visualisation.gauges.forEach(function (gauge) {
					if (gauge.board.getBoundingBox()[1] < maxGaugeHeight)
						gauge.board.setBoundingBox([
							gauge.board.getBoundingBox()[0],
							1.05 * maxGaugeHeight,
							gauge.board.getBoundingBox()[2],
							-0.15 * maxGaugeHeight
						]);
				});

				waterSumEncodeFBO.unbind();
			}

			if (Visualisation.saveWaterNextFrame) {
				Visualisation.saveWaterNextFrame = false;
				var waterSumEncodeFBO = waterSumEncodeFBOs[0];
				waterSumEncodeFBO.bind();
				waterSumEncodeShader.uniforms.amplification.data = new GLOW.Float(1);
				waterSumEncodeShader.uniforms.inputPixelWidth.data = new GLOW.Float(1 / simulation.settings.resolution);
				waterSumEncodeShader.uniforms.texture.data = simulation.state.texture; //waterSumFBOs[waterSumFBOs.length - 2];
				waterSumEncodeShader.draw();

				var pixels = new Uint8Array(simulation.settings.resolution * simulation.settings.resolution * 4);
				GL.readPixels(0, 0, simulation.settings.resolution, simulation.settings.resolution, GL.RGBA, GL.UNSIGNED_BYTE, pixels);
				pixels = new Float32Array(pixels.buffer);

				var waterHeight = new Float32Array(simulation.settings.resolution * simulation.settings.resolution);

				for (var p = 0; p < simulation.settings.resolution * simulation.settings.resolution; p++) {
					waterHeight[p] = Math.max(0.0, 0.5 + pixels[p] / 2.0);
				}

				var tiff = write16bitTiff(waterHeight, simulation.settings.resolution, simulation.settings.resolution);
				var filename = document.getElementById("scenarioName").innerText.trim()
						.replace(/\s/g, "_") + "_water_t" + simulation.nStepsTotal + ".tif";
				saveContent(uint8ToBase64(tiff), filename);

				waterSumEncodeFBO.unbind();
			}

			if (Visualisation.createInundationMapNextFrame) {
				Visualisation.createInundationMapNextFrame = false;
				var waterSumEncodeFBO = waterSumEncodeFBOs[0];
				waterSumEncodeFBO.bind();
				waterSumEncodeShader.uniforms.amplification.data = new GLOW.Float(1);
				waterSumEncodeShader.uniforms.inputPixelWidth.data = new GLOW.Float(1 / simulation.settings.resolution);
				waterSumEncodeShader.uniforms.texture.data = simulation.state.texture; //waterSumFBOs[waterSumFBOs.length - 2];
				waterSumEncodeShader.draw();

				var pixels = new Uint8Array(simulation.settings.resolution * simulation.settings.resolution * 4);
				GL.readPixels(0, 0, simulation.settings.resolution, simulation.settings.resolution, GL.RGBA, GL.UNSIGNED_BYTE, pixels);
				pixels = new Float32Array(pixels.buffer);

				var waterHeight = new Float32Array(simulation.settings.resolution * simulation.settings.resolution);

				for (var p = 0; p < simulation.settings.resolution * simulation.settings.resolution; p++) {
					waterHeight[p] = Math.max(0.0, pixels[p] / parameters.maxDisplayWaterHeight);
				}

				var tiff = write16bitTiff(waterHeight, simulation.settings.resolution, simulation.settings.resolution);
				var filename = document.getElementById("scenarioName").innerText.trim()
						.replace(/\s/g, "_") +
						"_h" + document.getElementById("sourceWaterHeight").value +
						"_v" + document.getElementById("sourceWaterVelocity").value +
						"_inun_t" + simulation.nStepsTotal + ".tif";
				saveContent(uint8ToBase64(tiff), filename);

				waterSumEncodeFBO.unbind();
			}

			if (Visualisation.toggles.showWater) {
				flowVizFBO.bind();
				flowVizStep.uniforms.texture.data = simulation.state.texture;
				flowVizStep.uniforms.time.data = new GLOW.Float(visualTime);
				flowVizStep.draw();
				flowVizFBO.unbind();
			}
			context.enableDepthTest(true);

			context.clear();

			terrainMeshTiles.forEach(function (meshTile) {
				meshTile.uniforms.texture.data = simulation.state.texture;
				meshTile.uniforms.damage.data = simulation.damage.texture;
				meshTile.draw();
			});

			if (Visualisation.toggles.showWater) {

				context.enableBlend(true, {
					equation: GL.FUNC_ADD, src: GL.SRC_ALPHA, dst: GL.ONE_MINUS_SRC_ALPHA});

				waterMeshTiles.forEach(function (meshTile) {
					meshTile.uniforms.texture.data = simulation.state.texture;
					meshTile.uniforms.flowTexture.data = flowVizFBO;
					meshTile.draw();
				});

				context.enableBlend(false);
			}

			/*context.enableDepthTest(false);

			 showTextureShader.uniforms.texture.data = waterSumEncodeFBOs[5];
			 showTextureShader.draw();

			 context.enableDepthTest(true);*/
		}
	},

	displayToSimulationPosition: function (displayPosition) {
		return displayPosition.clone().divideScalar(Visualisation.displayScale)
	},

	displayToWorldPosition: function (displayPosition) {
		return Visualisation.displayToSimulationPosition(displayPosition).clone()
			.multiplyScalar(Simulation.settings.worldSize);
	},

	worldToSimulationPosition: function (worldPosition) {
		return worldPosition.clone().divideScalar(Simulation.settings.worldSize)
	},

	addGauge: function (worldPosition, name, points) {
		var gaugeElement = document.createElement("div");
		var textElement = document.createElement("div");
		gaugeElement.appendChild(textElement);
		var graphElement = document.createElement("div");
		graphElement.className = "graph";
		graphElement.style.height = "8rem";
		graphElement.style.backgroundColor = "#eee";
		graphElement.id = "gauge" + Visualisation.gauges.length + "graph";
		gaugeElement.appendChild(graphElement);

		var allGaugesElement = document.getElementById("gauges");
		allGaugesElement.appendChild(gaugeElement);

		JXG.Options.text.display = 'internal';

		var board = JXG.JSXGraph.initBoard(graphElement.id, {
			grid: true,
			showCopyright: false,
			showNavigation: false,
			boundingBox: [
				-300 * Simulation.settings.dt,
				0.001,
				3000 * Simulation.settings.dt,
				0
			],
			axis: true
		});

		board.defaultAxes.x.setAttribute({lastArrow: false});
		board.defaultAxes.y.setAttribute({lastArrow: false});
		board.defaultAxes.x.defaultTicks.setAttribute({
			drawZero: false,
			tickEndings: [0, 1],
			label: {offset: [0, -2], anchorX: "middle", anchorY: "top"}
		});
		board.defaultAxes.y.defaultTicks.setAttribute({
			drawZero: false,
			tickEndings: [1, 0],
			label: {offset: [-2, 0], anchorX: "right", anchorY: "middle"}
		});
		board.fullUpdate();

		points = points || [];
		points.forEach(function (point) {
			board.create("point", [point[0], point[1]], {
				face: point[2],
				strokeWidth: 0.4,
				size: 0.7,
				fillColor: "transparent",
				strokeColor: "#333",
				withLabel: false
			});
		});

		board.on("up", function () {
			var svg = new XMLSerializer().serializeToString(board.renderer.svgRoot);
			window.open(
				'data:image/svg+xml;utf8,' + escape(svg),
				"_blank",
				"height=" + board.renderer.svgRoot.style.height.replace("px", "") +
				",width=" + board.renderer.svgRoot.style.width.replace("px", ""));
		});

		var gauge = {
			position: Visualisation.worldToSimulationPosition(worldPosition),
			historyTimes: [],
			historyValues: [],
			textElement: textElement,
			board: board,
			name: name || "#" + Visualisation.gauges.length
		};

		var curve = board.create("curve", [gauge.historyTimes, gauge.historyValues]);

		Visualisation.gauges.push(gauge);
		console.log(Visualisation.gauges);
	}
};