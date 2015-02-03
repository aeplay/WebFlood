float maxVelocity = 0.5 * unit / dt;
uniform float manningCoefficient;
uniform float gravity;

uniform sampler2D frictionMap;

vec4 simulationStep() {
    vec4 here = simData(pos);

    if (H(here) < 0.0) return vec4(0.0, 0.0, H(here), T(here));

    vec4 X1 = simData(posLeft);
    vec4 X2 = simData(posRight);
    vec4 Y1 = simData(posTop);
    vec4 Y2 = simData(posBottom);

    // boundary: assume water is flat until shoreline
    float L_X1 = H(X1) < 0.0 && T(X1) > L(here) ? L(here) : L(X1);
    float L_X2 = H(X2) < 0.0 && T(X2) > L(here) ? L(here) : L(X2);
    float L_Y1 = H(Y1) < 0.0 && T(Y1) > L(here) ? L(here) : L(Y1);
    float L_Y2 = H(Y2) < 0.0 && T(Y2) > L(here) ? L(here) : L(Y2);

    vec2 slope = vec2(L_X2 - L_X1, L_Y2 - L_Y1) / (2.0 * unit);

    float n = manningCoefficient;
    n *= texture2D(frictionMap, pos).x;
    vec2 frictionSlope = V(here) * length(V(here)) * pow(n, 2.0) / pow(H(here), 4.0/3.0);

    vec2 totalSlope = slope + frictionSlope;
    totalSlope.x = slope.x < 0.0 ? min(totalSlope.x, 0.0) : max(totalSlope.x, 0.0);
    totalSlope.x = slope.x == 0.0 ? 0.0 : totalSlope.x;
    totalSlope.y = slope.y < 0.0 ? min(totalSlope.y, 0.0) : max(totalSlope.y, 0.0);
    totalSlope.y = slope.y == 0.0 ? 0.0 : totalSlope.y;

    vec2 newVelocity = V(here) - gravity * totalSlope * dt;

    if (length(newVelocity) > maxVelocity)
        newVelocity *= maxVelocity/length(newVelocity);

    if (H(X1) < 0.0 || H(X2) < 0.0) newVelocity.x = 0.0;
    if (H(Y1) < 0.0 || H(Y2) < 0.0) newVelocity.y = 0.0;

    return vec4(newVelocity, H(here), T(here));
}