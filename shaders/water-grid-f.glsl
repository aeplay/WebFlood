#ifdef GL_ES
    precision highp float;
#endif

#extension GL_OES_standard_derivatives : enable

uniform mat4 cameraInverse;

uniform sampler2D texture;
uniform sampler2D flowTexture;
varying float light;
varying vec2 uv;

uniform float unit;
uniform float useFlow;
uniform float useGrid;
uniform float useLight;

void main(void) {
    vec4 c = texture2D(texture, uv);
    vec4 f = texture2D(flowTexture, uv);
    float alpha = 0.85;
    if (c.z < 0.0) {
        alpha = 0.0;
    };

    vec3 color = vec3(0, 0.5, 0.5 + 0.5 * (c.z + c.w));

    if (useGrid > 0.0) {
        float distanceToLineX = mod(uv.x + 0.5/256.0, 1.0/256.0) * 256.0;
        distanceToLineX = min(1.0 - distanceToLineX, distanceToLineX);
        float xGradient = 100.0 * length(vec2(dFdx(uv.x) , dFdy(uv.x)));
        float xEdgyness = smoothstep(1.0, 0.0, 0.3 * distanceToLineX / xGradient);

        float distanceToLineY = mod(uv.y - 0.5/256.0, 1.0/256.0) * 256.0;
        distanceToLineY = min(1.0 - distanceToLineY, distanceToLineY);
        float yGradient = 100.0 * length(vec2(dFdx(uv.y) , dFdy(uv.y)));
        float yEdgyness = smoothstep(1.0, 0.0, 0.3 * distanceToLineY / xGradient);

        float edgyness = max(xEdgyness, yEdgyness);

        color = mix(color, vec3(1.0, 1.0, 1.0), min(0.3, edgyness/(30.0 * max(xGradient, yGradient))));
    }

    if (useFlow > 0.0) {
        color = mix(color, vec3(1.0, 1.0, 1.0), 0.6 * min(0.6, f.r));
    }

    if (useLight > 0.0) {
        float off = 1.0;

        vec4 cL = texture2D(texture, uv + vec2(-off * unit, 0.0));
        vec4 cR = texture2D(texture, uv + vec2(off * unit, 0.0));
        vec4 cT = texture2D(texture, uv + vec2(0.0, -off * unit));
        vec4 cB = texture2D(texture, uv + vec2(0.0, off * unit));

        float gx = (cR.z + cR.w - cL.z - cL.w) / off;
        float gy = (cB.z + cB.w - cT.z - cT.w) / off;

        vec3 normal = normalize(vec3(0.0, 0.0, 1.0) - 1000.0 * vec3(gx, gy, 0.0));
        vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));

        float reflectionIntensity = dot(normal, lightDir);

        vec3 cameraLookDir = (cameraInverse * vec4(0.0, 0.0, 1.0, 0.0)).xyz;

        float b = 0.5 * reflectionIntensity * dot(normal, cameraLookDir) + 0.5 * (1.0 - dot(normal, cameraLookDir));

        color += 0.5 * b - 0.3 * (1.0 - b);
    }

    gl_FragColor = vec4(color, alpha);
}