#ifdef GL_ES
    precision highp float;
#endif

// main texture and uniform inputs

uniform sampler2D texture;
uniform float unit, time, dt;
uniform float sourceWaterHeight;
uniform float sourceWaterVelocity;

// current and neighbor positions, passed from vertex shader

varying vec2 pos, posLeft, posRight, posTop, posBottom;

// macros to access components of simulation data vector

#define V(D)  D.xy         // velocity
#define Vx(D) D.x          // velocity (x-component)
#define Vy(D) D.y          // velocity (y-component)
#define H(D)  D.z          // water height
#define T(D)  D.w          // terrain height
#define L(D)  H(D) + T(D)  // water level

// query (and interpolate) simulation data from texture

vec4 simData (vec2 pos) {
    vec4 data = texture2D(texture, pos);
    float minExtent = unit;
    float maxExtent = 1.0 - unit;

    if (pos.x < minExtent) {
        vec4 borderData = texture2D(texture, vec2(minExtent, clamp(pos.y, minExtent, maxExtent)));
        data.x = 0.0;
        data.z = borderData.z;
        data.w = borderData.w;
    } else if (pos.x > maxExtent) {
        vec4 borderData = texture2D(texture, vec2(maxExtent, clamp(pos.y, minExtent, maxExtent)));
        data.x = 0.0;
        data.z = borderData.z;
        data.w = borderData.w;
    }

    if (pos.y < minExtent) {
        vec4 borderData = texture2D(texture, vec2(clamp(pos.x, minExtent, maxExtent), minExtent));
        data.y = sourceWaterHeight > borderData.w ? sourceWaterVelocity : 0.0;
        data.z = sourceWaterHeight - borderData.w;
        data.w = borderData.w;
    } else if (pos.y > maxExtent) {
        vec4 borderData = texture2D(texture, vec2(clamp(pos.x, minExtent, maxExtent), maxExtent));
        data.y = max(borderData.y, 0.0);
        data.z = borderData.z;
        data.w = borderData.w;
    }

    return data;
}

// forward declare simulationStep
// will be implemented by simulation shader

vec4 simulationStep();

// use return value of simulationStep as output color

void main(void) {
    gl_FragColor = simulationStep();
}