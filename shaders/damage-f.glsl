#ifdef GL_ES
    precision highp float;
#endif

uniform sampler2D texture;
uniform sampler2D damage;
uniform float time;
uniform float dt;
varying float light;
varying vec2 uv;


void main(void) {
    //float dt = 1.0 / 60.0;
    vec2 pos = uv;
    vec4 data = texture2D(texture, pos);
    vec4 oldDamage = texture2D(damage, pos);

    float maxVelocity = oldDamage.g;
    if (data.z > 0.0 && length(data.xy) > maxVelocity) {
        maxVelocity = length(data.xy);
    }

    float maxHeight = oldDamage.b;
    if (data.z > maxHeight) {
        maxHeight = data.z;
    }

    gl_FragColor = vec4(oldDamage.r + data.z * 1.0 * dt, maxVelocity, maxHeight, oldDamage.a);
}