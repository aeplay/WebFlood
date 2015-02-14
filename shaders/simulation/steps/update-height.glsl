uniform float drainageAmount;

const float wettingThreshold = 0.000001;
const float newlyWetHeight = 0.0000003;
const float minFluxArea = 0.01;

vec4 simulationStep() {
    vec4 here = simData(pos);
    vec4 X1 = simData(posLeft);
    vec4 X2 = simData(posRight);
    vec4 Y1 = simData(posTop);
    vec4 Y2 = simData(posBottom);

    float dVelocityX = (Vx(X2) - Vx(X1)) / (2.0 * unit);
    float dVelocityY = (Vy(Y2) - Vy(Y1)) / (2.0 * unit);
    float velocityDivergence = (dVelocityX + dVelocityY);

    float newHeight;

    if (H(here) <= 0.0) {
        if ((H(X1) > wettingThreshold && L(X1) > T(here) + wettingThreshold)
        ||  (H(X2) > wettingThreshold && L(X2) > T(here) + wettingThreshold)
        ||  (H(Y1) > wettingThreshold && L(Y1) > T(here) + wettingThreshold)
        ||  (H(Y2) > wettingThreshold && L(Y2) > T(here) + wettingThreshold)) {
            newHeight = newlyWetHeight;
        } else newHeight = H(here);
    } else {
        float fluxArea = max(H(here), minFluxArea);
        newHeight = H(here) - fluxArea * velocityDivergence * dt;
        newHeight -= drainageAmount;
        newHeight = max(-0.00001, newHeight);
    }

    return vec4(V(here), newHeight, T(here));
}