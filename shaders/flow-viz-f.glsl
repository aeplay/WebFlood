#ifdef GL_ES
	precision highp float;
#endif

uniform sampler2D texture;
uniform sampler2D noise;
uniform float time;
uniform float unit;
uniform float dt;
varying float light;
varying vec2 uv;

void main(void) {
	float scaling = 0.8;
	float maxVelocity = 1.0 * unit/dt;
	float walkDistance = dt * 1.0;
	float colorMultiplier = 400.0/maxVelocity;
	vec2 pos = uv;
	vec4 data = texture2D(texture, pos);
	vec2 v = data.xy;
	vec2 originalV = v;
	vec2 originalPos = pos;

	float b = 0.0;
	float n = 0.0;

	for (int i = 0; i < 40; i++) {
		float phaseShift = texture2D(noise, pos.yx * (-scaling)).y;
		b += log(length(v) * colorMultiplier + 1.0) * mod(texture2D(noise, pos * scaling).x + phaseShift - 0.03 * time, 0.21);
        pos += v * walkDistance;
        v = texture2D(texture, pos).xy;
		n += 1.0;
	}

	v = originalV;
	pos = originalPos;
	pos -= v * walkDistance;
    v = texture2D(texture, pos).xy;

	for (int i = 0; i < 40; i++) {
        float phaseShift = texture2D(noise, pos.yx * (-scaling)).y;
        b += log(length(v) * colorMultiplier + 1.0) * mod(texture2D(noise, pos * scaling).x + phaseShift - 0.03 * time, 0.21);
        pos -= v * walkDistance;
        v = texture2D(texture, pos).xy;
        n += 1.0;
    }

	b = b / n;

	gl_FragColor = vec4(b, b, b, 1.0);
}