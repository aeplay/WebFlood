#ifdef GL_ES
	precision highp float;
#endif

uniform sampler2D texture;
uniform sampler2D noiseDots;
uniform sampler2D noise;
uniform float time;
uniform float unit;
uniform float dt;
varying float light;
uniform float flowStrength;
uniform float flowLength;
varying vec2 uv;

#define STEPS 50
#define STEPS_F 50.0

void main(void) {
	float scaling = 3.0;
	float maxVelocity = 1.0 * unit/dt;
	float walkDistance = dt * 0.0005 * flowLength;
	vec2 pos = uv;
	vec4 data = texture2D(texture, pos);
	vec2 v = data.xy;
	vec2 originalV = v;
	vec2 originalPos = pos;

	float b = 0.0;
	float n = 0.0;

	for (int i = 0; i < STEPS; i++) {
		float t = time;
		float phaseShift = texture2D(noise, pos.yx * (-scaling)).y;
		b += min(1.0, mod(n + STEPS_F + - 8.0 * t - STEPS_F * phaseShift, STEPS_F + 1.0) / STEPS_F) * texture2D(noiseDots, pos * scaling).x;
        pos -= pow(length(v), 0.3) * normalize(v) * walkDistance;
        v = texture2D(texture, pos).xy;
		n += 1.0;
	}


	b = pow(length(originalV), 0.6) * flowStrength * b  / n;

	gl_FragColor = vec4(b, b, b, 1.0);
}