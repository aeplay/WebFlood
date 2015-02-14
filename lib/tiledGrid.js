var gridVertices = function (resolution, size) {
	var vertices = new Float32Array(3 * (resolution + 1) * (resolution + 1));
	var i = 0;

	for (var y = 0; y <= resolution; y++) {
		for (var x = 0; x <= resolution; x++) {
			vertices[i * 3    ] = x * size / resolution;
			vertices[i * 3 + 1] = y * size / resolution;
			vertices[i * 3 + 2] = 0;
			i++;
		}
	}

	return vertices;
};

var gridUvs = function (subdivisions, offset) {
	var uvs =  new Float32Array(2 * (subdivisions + 1) * (subdivisions + 1));
	var i = 0;

	for (var y = 0; y <= subdivisions; y++) {
		for (var x = 0; x <= subdivisions; x++) {
			uvs[i * 2    ] = offset + x / subdivisions;
			uvs[i * 2 + 1] = offset + y / subdivisions;
			i++;
		}
	}

	return uvs;
};

var gridIndices = function (subdivisions) {
	var numPrimitives = 2 * subdivisions * subdivisions;
	var indices = new Float32Array(3 * numPrimitives);
	var i = 0;

	for (var y = 0; y < subdivisions; y++) {
		for (var x = 0; x < subdivisions; x++) {
			// 0___1
			//  | /
			//  |/
			//  2
			indices[i * 3    ] =       y * (subdivisions + 1) + x;
			indices[i * 3 + 1] =       y * (subdivisions + 1) + x + 1;
			indices[i * 3 + 2] = (y + 1) * (subdivisions + 1) + x;
			i++;
			//    0
			//   /|
			//  /_|
			// 2  1
			indices[i * 3    ] =       y * (subdivisions + 1) + x + 1;
			indices[i * 3 + 1] = (y + 1) * (subdivisions + 1) + x + 1;
			indices[i * 3 + 2] = (y + 1) * (subdivisions + 1) + x;
			i++;
		}
	}

	return indices;
};

var createMeshTiles = function (parameters) {
	var maxTileSize = parameters.maxTileSize;
	var vertexShader = parameters.vertexShader;
	var fragmentShader = parameters.fragmentShader;
	var nTiles1d = parameters.resolution / maxTileSize;
	var tiles = [];
	var vertices = gridVertices(parameters.resolution / nTiles1d, parameters.worldSize / nTiles1d);
	var uvs = gridUvs(parameters.resolution / nTiles1d, 1 / (0.5 *  parameters.resolution));
	var indices = gridIndices(parameters.resolution / nTiles1d);
	var normals = GLOW.Geometry.faceNormals(vertices, indices);

	for (var y = 0; y < nTiles1d; y++) for (var x = 0; x < nTiles1d; x++)
		tiles.push(new GLOW.Shader({
			vertexShader: loadSynchronous("shaders/" + vertexShader + ".glsl"),
			fragmentShader: loadSynchronous("shaders/" + fragmentShader + ".glsl"),
			data: _.extend(parameters.data, {
				vertices: vertices,
				uvs: uvs,
				nTiles1d: new GLOW.Float(nTiles1d),
				tileWidth: new GLOW.Float(parameters.worldSize / nTiles1d),
				x: new GLOW.Float(x),
				y: new GLOW.Float(y),
				normals: normals
			}),
			indices: indices,
			//primitives: parameters.data.unit ? GL.LINE_STRIP : undefined
		}));

	return tiles;
};