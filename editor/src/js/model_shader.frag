#define CIRCLE_SIZE 0.25
#define OUTLINE_WIDTH 0.015
#define OUTLINE_SIZE (CIRCLE_SIZE - OUTLINE_WIDTH)
varying vec3 vComputedColor;

uniform bool displayOnly;
varying vec3 vOverlayColor;

float aastep(float threshold, float value) {
    float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678118654757;
    return smoothstep(threshold-afwidth, threshold+afwidth, value);
}

float circle(vec2 p, float radius) {
  return 1.-aastep(radius, length(p)-radius);
}

vec3 toGamma(vec3 v, float gamma) {
    return pow(v, vec3(1.0 / gamma));
}
vec3 toLinear(vec3 v, float gamma) {
    return pow(v, vec3(gamma));
}

void main() {
  vec3 outcolor;
  vec2 uv =  gl_PointCoord.xy; //vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ).xy;
  float outline = circle(vec2(0.5)-uv, CIRCLE_SIZE);
  float circ = circle(vec2(0.5)-uv, OUTLINE_SIZE);
  vec3 outlineColor = vec3(0.);
  if (!displayOnly) {
    if (vOverlayColor == vec3(0.)) {
      discard;
    }
    outcolor = vOverlayColor;
  } else {
    outcolor = vComputedColor;
    outcolor *= vec3(1.25, 0.8, 0.95);
    outcolor = toGamma(outcolor, 3.5);
    outcolor.g *= 1.05;
    outcolor.b *= 1.05;
  }
  outcolor = mix(vec3(outlineColor), outcolor, circ);
  if (outline == 0.)
    discard;
  gl_FragColor = vec4(outcolor, outline);
}
