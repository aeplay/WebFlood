uniform float drainageAmount;

vec4 simulationStep() {
    vec4 X1 = simData(posLeft);
    vec4 X2 = simData(posRight);
    vec4 Y1 = simData(posTop);
    vec4 Y2 = simData(posBottom);

    float dVelocityX = (Vx(X2) - Vx(X1)) / (2.0 * unit);
    float dVelocityY = (Vy(Y2) - Vy(Y1)) / (2.0 * unit);
    float velocityDivergence = (dVelocityX + dVelocityY);

    vec4 here = simData(pos);

    float newHeight;

    if (H(here) < 0.0) {
        if ((H(X1) > 0.000001 && L(X1) > T(here) + 0.000001)
        ||  (H(X2) > 0.000001 && L(X2) > T(here) + 0.000001)
        ||  (H(Y1) > 0.000001 && L(Y1) > T(here) + 0.000001)
        ||  (H(Y2) > 0.000001 && L(Y2) > T(here) + 0.000001)) newHeight = 0.000003;
        else newHeight = H(here);
    } else {
        float fluxArea = max(H(here), 0.01);
        newHeight = H(here) - fluxArea * velocityDivergence * dt;
        newHeight -= drainageAmount;
    }

    return vec4(V(here), newHeight, T(here));
}