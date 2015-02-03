attribute vec3 vertices;
attribute vec2 uvs;

varying vec2 uv;

uniform float unit;

void main(void) {
	uv = uvs;
	gl_Position = vec4(vertices.x, vertices.y, 1.0, 1.0);
}