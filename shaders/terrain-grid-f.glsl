#ifdef GL_ES
    precision highp float;
#endif

#extension GL_OES_standard_derivatives : enable

uniform	mat4 transform;
uniform mat4 cameraInverse;
uniform mat4 cameraProjection;


uniform sampler2D texture;
uniform sampler2D damage;
uniform float showDuration;
uniform float showMaxDepth;
uniform float showMaxVelocity;
uniform float showTerrainContours;
uniform float maxDisplayWaterHeight;
varying vec2 uv;

uniform float useSat;
uniform float useLight;
uniform sampler2D sat;
uniform float heightScale;
uniform float unit;

void main(void) {
    vec4 c = texture2D(texture, uv);
    vec4 d = texture2D(damage, uv);

    vec3 color;

    if (useSat > 0.0) {
        color = texture2D(sat, uv).rgb;
        if (showDuration > 0.0 || showMaxDepth > 0.0 || showMaxVelocity > 0.0) {
            float bw = 0.2 * (0.21 * color.r + 0.72 * color.g + 0.07 * color.b);
            color = vec3(bw, bw, bw);
        }
    } else {
        color = vec3(0.4, 0.4, 0.4);
    }

    if (useLight > 0.0) {
        float off = 1.0;

        vec4 cL = texture2D(texture, uv + vec2(-off * unit, 0.0));
        vec4 cR = texture2D(texture, uv + vec2(off * unit, 0.0));
        vec4 cT = texture2D(texture, uv + vec2(0.0, -off * unit));
        vec4 cB = texture2D(texture, uv + vec2(0.0, off * unit));

        float gx = (cR.w - cL.w) / off;
        float gy = (cB.w - cT.w) / off;

        vec3 normal = normalize(vec3(0.0, 0.0, 1.0) - 1000.0 * vec3(gx, gy, 0.0));
        vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));

        float reflectionIntensity = dot(normal, lightDir);

        vec3 cameraLookDir = (cameraInverse * vec4(0.0, 0.0, 1.0, 0.0)).xyz;

        float b = reflectionIntensity * dot(normal, cameraLookDir);

        vec3 sunColor = vec3(0.4, 0.4, 0.3);

        color = 0.5 * (2.0 * color + b * sunColor - (1.0 - b) * sunColor);
    }

    if (showDuration > 0.0) {
        color.r += mod(d.r, 1000.0) / 1000.0;
    }

    if (showMaxVelocity > 0.0) {
        color.g += d.g * 1000.0;
    }

    if (showMaxDepth > 0.0) {
        color.b += d.b / maxDisplayWaterHeight;
    }

    if (showTerrainContours > 0.0) {
        float distanceToLine = mod(c.w, 1.0/1024.0) * 1024.0;
        distanceToLine = min(1.0 - distanceToLine, distanceToLine);
        float gradient = 100.0 * length(vec2(dFdx(c.w) , dFdy(c.w)));
        float edgyness = smoothstep(1.0, 0.0, 0.2 * distanceToLine / gradient);

        color = color + vec3(min(0.3, edgyness/(10.0 * gradient)));
    }

    gl_FragColor = vec4(color, 1.0);
}