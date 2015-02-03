#ifdef GL_ES
    precision highp float;
#endif

#extension GL_OES_standard_derivatives : enable

uniform sampler2D texture;
uniform sampler2D damage;
uniform vec4 toggles;
varying float light;
varying vec2 uv;

uniform float useSat;
uniform sampler2D sat;
uniform float heightScale;

void main(void) {
    vec4 c = texture2D(texture, uv);

    vec4 d = texture2D(damage, uv);

    vec3 color;

    if (useSat > 0.0) {
        color = texture2D(sat, uv).rgb;
        if (toggles.r > 0.0 || toggles.g > 0.0 || toggles.b > 0.0) {
            float bw = 0.2 * (0.21 * color.r + 0.72 * color.g + 0.07 * color.b);
            color = vec3(bw, bw, bw);
        }
    } else {
         float b = 0.1 + 0.8 * c.w * 10.0; //* heightScale;
         color = vec3(b, b, b);
    }

    if (toggles.r > 0.0) {
        color.r += d.r * 0.1;
    }

    if (toggles.g > 0.0) {
        color.g += d.g * 100.0;
    }

    if (toggles.b > 0.0) {
        color.b += d.b * heightScale * 1.0;
    }

    float distanceToLine = mod(c.w, 1.0/256.0) * 256.0;
    distanceToLine = min(1.0 - distanceToLine, distanceToLine);
    float gradient = 100.0 * length(vec2(dFdx(c.w) , dFdy(c.w)));
    float edgyness = smoothstep(1.0, 0.0, 0.3 * distanceToLine / gradient);

    color = color + vec3(min(0.3, edgyness/(10.0 * gradient)));

    gl_FragColor = vec4(color, 1.0);
}