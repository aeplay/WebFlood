var DT = 1/4;
var gridResolution = parseInt(getParameterByName("res")) || 256;
var worldSize = 8500;
var inputHeightScale = 160;

var Simulation = {
	parameters: {},
	init: function (waterData, terrainData, startNSteps, frictionData) {
		// layout
		// x: x velocity
		// y: y velocity
		// z: water height
		// w: terrain height
		var initialConditions = new Float32Array(gridResolution * gridResolution * 4);
		var p;

		if (waterData) for (p = 0; p < terrainData.length; p++)
			initialConditions[p * 4 + 2] = (waterData[p] - 0.5) * 2 / (worldSize);
		else for (p = 0; p < terrainData.length; p++)
			initialConditions[p * 4 + 2] = -0.01;//0.04 - terrainData[p] / (worldSize);

		for (p = 0; p < terrainData.length; p++)
			initialConditions[p * 4 + 3] = inputHeightScale * terrainData[p] / (worldSize)

		if (frictionData) {
			var frictionMap = new Float32Array(gridResolution * gridResolution * 4);
			for (p = 0; p < frictionMap.length; p++) frictionMap[p * 4] = frictionData[p];
		}

		Simulation.state = new FlipFlopFBO({
			width: gridResolution,
			height: gridResolution,
			type: GL.FLOAT,
			magFilter: GL.LINEAR,
			minFilter: GL.LINEAR,
			depth: false,
			data: initialConditions
		});

		var defineSimulationStep = function (fragmentShader, uniforms) {
			console.log(fragmentShader);
			return new GLOW.Shader({
				vertexShader: loadSynchronous("shaders/simulation/vertex.glsl"),
				fragmentShader: loadSynchronous("shaders/simulation/prefix.glsl") + "\n" +
					loadSynchronous("shaders/simulation/steps/" + fragmentShader + ".glsl"),
				data: _.extend(uniforms, {
					texture: undefined,
					vertices: GLOW.Geometry.Plane.vertices(),
					uvs: GLOW.Geometry.Plane.uvs(),
					unit: new GLOW.Float(1/gridResolution),
					dt: new GLOW.Float(DT),
					sourceWaterHeight: new GLOW.Float(0),
					sourceWaterVelocity: new GLOW.Float(0)
				}),
				indices: GLOW.Geometry.Plane.indices()
			});
		};

		var advectionStep = defineSimulationStep('advect-height-velocity', {});

		var heightIntegrationStep = defineSimulationStep('update-height', {
			drainageAmount: new GLOW.Float(0)
		});

		var frictionTexture = new GLOW.Texture({
			data: frictionMap,
			width: gridResolution,
			height: gridResolution,
			type: GL.FLOAT
		});

		var velocityIntegrationStep = defineSimulationStep('update-velocity', {
			frictionMap: frictionTexture,
			manningCoefficient: new GLOW.Float(0),
			gravity: new GLOW.Float(0)
		});

		Simulation.steps = [
			advectionStep,
			heightIntegrationStep,
			velocityIntegrationStep
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
			fragmentShader: loadSynchronous("shaders/simulation/damage-f.glsl"),
			data: {
				texture: undefined,
				damage: undefined,
				dt: new GLOW.Float(DT),
				inputPixelWidth: new GLOW.Float(1/2),
				vertices: GLOW.Geometry.Plane.vertices(),
				uvs: GLOW.Geometry.Plane.uvs()
			},
			indices: GLOW.Geometry.Plane.indices()
		});

		Simulation.parameters = {
			stepsPerFrame: 0,
			set sourceWaterHeight (height) {
				Simulation.steps.forEach(function (step) {
					step.uniforms.sourceWaterHeight.data = new GLOW.Float(height);
				});
			},
			set sourceWaterVelocity (velocity) {
				Simulation.steps.forEach(function (step) {
					step.uniforms.sourceWaterVelocity.data = new GLOW.Float(velocity);
				});
			},
			set manningCoefficient (n) {
				var correctedN = n * Math.pow(worldSize, 1/3);
				velocityIntegrationStep.uniforms.manningCoefficient.data = new GLOW.Float(correctedN);
			},
			set gravity (g) {
				var correctedG = g/worldSize;
				velocityIntegrationStep.uniforms.gravity.data = new GLOW.Float(correctedG);
			},
			set drainageAmount (drainageAmount) {
				heightIntegrationStep.uniforms.drainageAmount.data = new GLOW.Float(drainageAmount);
			}
		};

		var t = 0;
		var nStepsTotal = startNSteps || 0;

		Simulation.update = function () {
			context.enableDepthTest(false);

			for (var i = 0; i < Simulation.parameters.stepsPerFrame; i++) {
				t += DT;

				Simulation.steps.forEach(function (step) {
					Simulation.state.target.bind();
					step.uniforms.texture.data = Simulation.state.texture;
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