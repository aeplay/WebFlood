var gridSize = 1024;

Visualisation = {
	toggles: {
		showWater: true,
		showFloodDuration: false,
		showMaxVelocity: false,
		showMaxDepth: false
	},

	init: function (satImage) {
		var flowVizFBO = new GLOW.FBO({
			width: Math.min(gridResolution, 512),
			height: Math.min(gridResolution, 512),
			type: GL.FLOAT,
			magFilter: GL.LINEAR,
			minFilter: GL.LINEAR,
			depth: false
		});

		var flowVizStep = new GLOW.Shader({
			vertexShader: loadSynchronous("shaders/id-v.glsl"),
			fragmentShader: loadSynchronous("shaders/flow-viz-f.glsl"),
			data: {
				noise: new GLOW.Texture( { data: "noise.png", minFilter:GL.NEAREST } ),
				vertices: GLOW.Geometry.Plane.vertices(),
				uvs: GLOW.Geometry.Plane.uvs(),
				gridSpacing: new GLOW.Float(1/gridResolution),
				time: new GLOW.Float(0)
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

		for (var res = gridResolution; res > 1; res /= 2) {
			if (res < gridResolution) {
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

			interleave: {
				vertices: false
			},

			indices: GLOW.Geometry.Plane.indices()
		});

		var satTexture = new GLOW.Texture({
			data: satImage,
			width: gridResolution,
			height: gridResolution,
			wrapS: GL.CLAMP_TO_EDGE,
			wrapT: GL.CLAMP_TO_EDGE
		});

		var terrainMeshTiles = createMeshTiles({
			maxTileSize: 64,
			vertexShader: 'terrain-grid-v',
			fragmentShader: 'terrain-grid-f',
			data: {
				texture: undefined,
				sat: satTexture,
				useSat: new GLOW.Float(satImage ? 1 : 0),
				heightScale: new GLOW.Float(inputHeightScale),
				damage: undefined,
				toggles: undefined,
				transform: new GLOW.Matrix4(),
				cameraInverse: camera.inverse,
				cameraProjection: camera.projection,
				unit: new GLOW.Float(1/gridResolution)
			}
		});
		var waterMeshTiles = createMeshTiles({
			maxTileSize: 64,
			vertexShader: 'water-grid-v',
			fragmentShader: 'water-grid-f',
			data: {
				texture: undefined,
				heightScale: new GLOW.Float(inputHeightScale),
				flowTexture: undefined,
				transform: new GLOW.Matrix4(),
				cameraInverse: camera.inverse,
				cameraProjection: camera.projection,
				unit: new GLOW.Float(1/gridResolution)
			}
		});

		var lastWaterSave = -1;

		initCamera();

		Visualisation.render = function () {
//					for (var s = 0; s < waterSumFBOs.length - 1; s++) {
//						var currentWaterSumFBO = waterSumFBOs[s];
//						var previousWaterSumFBO = waterSumFBOs[s - 1] || getTextureFBO();
//
//						currentWaterSumFBO.bind();
//						waterSumShader.uniforms.water.data = previousWaterSumFBO;
//						waterSumShader.uniforms.pixelWidth.data = new GLOW.Float(1 / previousWaterSumFBO.width);
//						waterSumShader.draw();
//						currentWaterSumFBO.unbind();
//
//						var waterSumEncodeFBO = waterSumEncodeFBOs[s + 1];
//						waterSumEncodeFBO.bind();
//						waterSumEncodeShader.uniforms.amplification.data = new GLOW.Float(1/(4 * Math.pow(4, s)));
//						waterSumEncodeShader.uniforms.inputPixelWidth.data = new GLOW.Float(1 / currentWaterSumFBO.width);
//						waterSumEncodeShader.uniforms.texture.data = currentWaterSumFBO; //waterSumFBOs[waterSumFBOs.length - 2];
//						waterSumEncodeShader.draw();
//						waterSumEncodeFBO.unbind();
//					}

//					if (t - lastWaterSave >= 0.1) {
//						lastWaterSave = t;
//
//						var waterSumEncodeFBO = waterSumEncodeFBOs[0];
//						waterSumEncodeFBO.bind();
//						waterSumEncodeShader.uniforms.amplification.data = new GLOW.Float(1);
//						waterSumEncodeShader.uniforms.inputPixelWidth.data = new GLOW.Float(1 / gridResolution);
//						waterSumEncodeShader.uniforms.texture.data = getTextureFBO(); //waterSumFBOs[waterSumFBOs.length - 2];
//						waterSumEncodeShader.draw();
//						waterSumEncodeFBO.unbind();
//
//						waterSumEncodeFBO.bind();
//						var pixels = new Uint8Array(gridResolution * gridResolution * 4);
//						GL.readPixels(0, 0, gridResolution, gridResolution, GL.RGBA, GL.UNSIGNED_BYTE, pixels);
//						pixels = new Float32Array(pixels.buffer);
//
//						console.log(
//								"S1", (pixels[118/2 + 200/2 * 512/2] * worldSize).toFixed(3),
//								"S3", (pixels[200/2 + 200/2 * 512/2] * worldSize).toFixed(3),
//								t.toFixed(3)
//						);
//
//						waterSumEncodeFBO.unbind();
//					}

			if (Visualisation.saveWaterNextFrame) {
				Visualisation.saveWaterNextFrame = false;
				var waterSumEncodeFBO = waterSumEncodeFBOs[0];
				waterSumEncodeFBO.bind();
				waterSumEncodeShader.uniforms.amplification.data = new GLOW.Float(1);
				waterSumEncodeShader.uniforms.inputPixelWidth.data = new GLOW.Float(1 / gridResolution);
				waterSumEncodeShader.uniforms.texture.data = Simulation.state.texture; //waterSumFBOs[waterSumFBOs.length - 2];
				waterSumEncodeShader.draw();
				waterSumEncodeFBO.unbind();

				waterSumEncodeFBO.bind();
				var pixels = new Uint8Array(gridResolution * gridResolution * 4);
				GL.readPixels(0, 0, gridResolution, gridResolution, GL.RGBA, GL.UNSIGNED_BYTE, pixels);
				pixels = new Float32Array(pixels.buffer);

				var waterHeight = new Float32Array(gridResolution * gridResolution);

				for (var p = 0; p < gridResolution * gridResolution; p++) {
					waterHeight[p] = Math.max(0.0, 0.5 + pixels[p] / 2.0);
				}

				var tiff = write16bitTiff(waterHeight, gridResolution, gridResolution);
				var filename = document.getElementById("scenarioName").value.trim()
						.replace(/\s/g, "_") + "_water_t" + nStepsTotal + ".tif";
				saveContent(uint8ToBase64(tiff), filename);

				waterSumEncodeFBO.unbind();
			}

			/*var str = "";
			 var waterSum = 0;

			 for (var y = 0; y < 4; y ++) {
			 waterSum += pixels[y * 4];
			 waterSum += pixels[y * 4 + 1];
			 waterSum += pixels[y * 4 + 2];
			 waterSum += pixels[y * 4 + 3];

			 str +=	pixels[y * 4].toFixed(2) + " ";
			 str +=	pixels[y * 4 + 1].toFixed(2) + " ";
			 str +=	pixels[y * 4 + 2].toFixed(2) + " ";
			 str +=	pixels[y * 4 + 3].toFixed(2) + " ";
			 str += "\n ";
			 }

			 console.log(str);
			 console.log("---------");*/

			//document.getElementById("waterSum").innerHTML = waterSum.toFixed(2);
			//waterSumEncodeFBO.unbind();

//					if (showWater) {
//						flowVizFBO.bind();
//						flowVizStep.uniforms.texture.data = Simulation.state.texture;
//						flowVizStep.uniforms.time.data = new GLOW.Float(t);
//						flowVizStep.draw();
//						flowVizFBO.unbind();
//
//
//					}
			context.enableDepthTest(true);

			context.clear();

			terrainMeshTiles.forEach(function (meshTile) {
				meshTile.uniforms.texture.data = Simulation.state.texture;
				meshTile.uniforms.damage.data = Simulation.damage.texture;
				meshTile.uniforms.toggles.data = new GLOW.Vector4(
					Visualisation.toggles.showFloodDuration ? 1.0 : 0.0,
					Visualisation.toggles.showMaxVelocity ? 1.0 : 0.0,
					Visualisation.toggles.showMaxDepth ? 1.0 : 0.0,
					1.0
				);
				meshTile.draw();
			});

			if (Visualisation.toggles.showWater) {

				context.enableBlend(true, {
					equation: GL.FUNC_ADD, src: GL.SRC_ALPHA, dst: GL.ONE_MINUS_SRC_ALPHA});

				//context.enablePolygonOffset(1, 10);

				waterMeshTiles.forEach(function (meshTile) {
					meshTile.uniforms.texture.data = Simulation.state.texture;
					meshTile.uniforms.flowTexture.data = flowVizFBO;
					meshTile.draw();
				});

				//context.enablePolygonOffset(0, 0);

				context.enableBlend(false);
			}


			/*context.enableDepthTest(false);

			 showTextureShader.uniforms.texture.data = waterSumEncodeFBOs[5];
			 showTextureShader.draw();

			 context.enableDepthTest(true);*/
		}
	}
};