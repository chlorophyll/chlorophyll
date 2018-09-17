uniform sampler2D uSource;
uniform sampler2D uTarget;

uniform float time;

varying vec2 vUv;
#pragma glslify: ease = require('glsl-easings/cubic-in')

vec3 rgb_to_hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = c.g < c.b ? vec4(c.bg, K.wz) : vec4(c.gb, K.xy);
    vec4 q = c.r < p.x ? vec4(p.xyw, c.r) : vec4(c.r, p.yzx);

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv_to_rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 lerp(vec3 c1, vec3 c2, float t) {
    // hue is special-cased because the shortest path between the hues might
    // pass through the 0/1 discontinuity.
    float hue = (mod(mod((c2.x-c1.x), 1.) + 1.5, 1.)-0.5)*t + c1.x;
    return vec3(hue, mix(c1.yz, c2.yz, t));
}


vec3 toLerpspace(vec3 rgb) {
    return rgb_to_hsv(rgb);
}

vec3 fromLerpspace(vec3 v) {
    return hsv_to_rgb(v);
}

void main() {
    vec3 source = texture2D(uSource, vUv).rgb;
    vec3 target = texture2D(uTarget, vUv).rgb;

    vec3 lerpspaceSource = toLerpspace(source);
    vec3 lerpspaceTarget = toLerpspace(target);

    vec3 lerpspaceOut = lerp(lerpspaceSource, lerpspaceTarget, ease(time));

    gl_FragColor = vec4(clamp(fromLerpspace(lerpspaceOut), 0., 1.), 1.0);
}
