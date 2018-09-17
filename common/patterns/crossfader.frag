uniform sampler2D uSource;
uniform sampler2D uTarget;

uniform float time;

varying vec2 vUv;
#pragma glslify: ease = require('glsl-easings/cubic-in')

vec3 lerp(vec3 c1, vec3 c2, float t) {
    // lerp along the appropriate part of the hue wheel (since the shortest
    // path might pass through the 0/1 wrap around point.
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
