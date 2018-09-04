# WebFlood - Interactive Shallow Water Simulations in City Environments

Anselm Eickhoff, Bachelor Thesis

Homepage, interactive examples: http://aeickhoff.github.io/WebFlood/

## Abstract

WebGL offers not only a graphics pipeline for modern web browsers,
but can also be used as a simple GPGPU computation environment,
making much more sophisticated web applications possible.
As a proof-of-concept, <em>WebFlood,</em> a realtime, fully browser
based flood simulation and visualisation was implemented.
It employs a semi-lagrangian approach to solving the shallow-water equations.
All computation is done by GLSL shaders on the GPU. The simulation
state is displayed in a 3D visualisation, as part of a web page that
allows user interaction with the simulation. WebFlood performs well
in the classical 2D dam-break scenario of Fraccarollo and Toro (1995)
and closely reproduces urban flooding behaviour of Iowa City (USA),
given digital elevation data. Based on its cross-platform compatibility
and simple distribution, two main applications are suggested: interactive
public flood information and simulation-aided education for the example of hydrology.

## Thesis

[Full Thesis](interactive_shallow_water.pdf) (PDF)
[Thesis Presentation](interactive_shallow_water_presentation.pdf) (PDF)
