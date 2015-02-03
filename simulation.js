var gridSize = 1024;
var DT = 1/4;
var gridResolution = parseInt(getParameterByName("res")) || 256;
var worldSize = 8500;
var inputHeightScale = 160;

var Simulation = {
	init: function (waterData, terrainData, startNSteps, frictionData) {
		var initialConditions = new Float32Array(gridResolution * gridResolution * 4);

		if (waterData) {
			console.log("initial", waterData[118/2 + 512/2 * 200/2]);
			console.log("initial", waterData[0]);
			for (var p = 0; p < terrainData.length; p++) {
				initialConditions[p * 4 + 2] = (waterData[p] - 0.5) * 2 / (worldSize);
			}
		} else {
			for (var p = 0; p < terrainData.length; p++) {
				initialConditions[p * 4 + 2] = -0.01;//0.04 - terrainData[p] / (worldSize);
			}
		}

		for (var p = 0; p < terrainData.length; p++) {
			initialConditions[p * 4 + 3] = inputHeightScale * terrainData[p] / (worldSize);
		}

		if (frictionData) {
			var frictionMap = new Float32Array(gridResolution * gridResolution * 4);
			for (var p = 0; p < frictionMap.length; p++) {
				frictionMap[p * 4] = frictionData[p];
			}
		}

		// layout
		// x: x velocity
		// y: y velocity
		// z: water-height
		// w: unused
		Simulation.state = new FlipFlopFBO({
			width: gridResolution,
			height: gridResolution,
			type: GL.FLOAT,
			magFilter: GL.LINEAR,
			minFilter: GL.LINEAR,
			depth: false,
			data: initialConditions
		});

		var frictionTexture = new GLOW.Texture({
			data: frictionMap,
			width: gridResolution,
			height: gridResolution,
			type: GL.FLOAT
		});

		var defineSimulationStep = function (vertexShader, fragmentShader) {
			console.log(fragmentShader);
			return new GLOW.Shader({
				vertexShader: loadSynchronous("shaders/" + vertexShader + ".glsl"),
				fragmentShader: loadSynchronous("shaders/simulation-step-prefix.glsl") + "\n" +
				loadSynchronous("shaders/" + fragmentShader + ".glsl"),

				data: {
					texture: undefined,
					frictionMap: frictionTexture,
					vertices: GLOW.Geometry.Plane.vertices(),
					uvs: GLOW.Geometry.Plane.uvs(),
					unit: new GLOW.Float(1/gridResolution),
					time: new GLOW.Float(0),
					dt: new GLOW.Float(DT),
					sourceWaterHeight: new GLOW.Float(0),
					sourceWaterVelocity: new GLOW.Float(0),
					gravity: new GLOW.Float(0),
					manningCoefficient: new GLOW.Float(0),
					drainageAmount: new GLOW.Float(0)
				},

				interleave: {
					vertices: false,
					uvs: false
				},

				indices: GLOW.Geometry.Plane.indices()
			});
		};

		var simulationSteps = [
			defineSimulationStep('id-offsets-v', 'advect-height-velocity-f'),
			defineSimulationStep('id-offsets-v', 'update-height-f'),
			defineSimulationStep('id-offsets-v', 'update-velocity-f')
		];

		Simulation.damage = new FlipFlopFBO({
			width: gridResolution,
			height: gridResolution,
			type: GL.FLOAT,
			magFilter: GL.NEAREST,
			minFilter: GL.NEAREST,
			depth: false
		});

		var damageStep = new GLOW.Shader({
			vertexShader: loadSynchronous("shaders/id-v.glsl"),
			fragmentShader: loadSynchronous("shaders/damage-f.glsl"),

			data: {
				texture: undefined,
				damage: undefined,
				dt: new GLOW.Float(DT),
				inputPixelWidth: new GLOW.Float(1/2),
				vertices: GLOW.Geometry.Plane.vertices(),
				uvs: GLOW.Geometry.Plane.uvs()
			},

			interleave: {
				vertices: false
			},

			indices: GLOW.Geometry.Plane.indices()
		});

		var t = 0;


		var nStepsTotal = startNSteps || 0;

		Simulation.update = function () {
			context.enableDepthTest(false);

			for (var i = 0; i < stepsPerFrame; i++) {
				t += DT;

				simulationSteps.forEach(function (step) {
					Simulation.state.target.bind();
					step.uniforms.texture.data = Simulation.state.texture;
					//#### TODO: only update on change
					if (step.uniforms.sourceWaterHeight)
						step.uniforms.sourceWaterHeight.data = new GLOW.Float(sourceWaterHeight);
					if (step.uniforms.sourceWaterVelocity)
						step.uniforms.sourceWaterVelocity.data = new GLOW.Float(sourceWaterVelocity);
					if (step.uniforms.gravity)
						step.uniforms.gravity.data = new GLOW.Float(correctedGravity);
					if (step.uniforms.manningCoefficient)
						step.uniforms.manningCoefficient.data = new GLOW.Float(correctedManningCoefficient);
					if (step.uniforms.drainageAmount)
						step.uniforms.drainageAmount.data = new GLOW.Float(drainageAmount);
					//step.uniforms.time.data = t;
					step.draw();
					Simulation.state.target.unbind();
					Simulation.state.flip();
				});

				nStepsTotal++;

				Simulation.damage.target.bind();

				damageStep.uniforms.texture.data = Simulation.state.texture;
				damageStep.uniforms.damage.data = Simulation.damage.texture;
				damageStep.draw();

				Simulation.damage.target.unbind();
				Simulation.damage.flip();
			}
		};
	}
};