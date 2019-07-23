uniform sampler2D texForeground;
uniform sampler2D texBackground;

uniform float opacity;
uniform int blendMode;

varying vec2 vUv;

#pragma glslify: blend = require(glsl-blend/all)

void main() {
    vec3 foreground = texture2D(texForeground, vUv).rgb;
    vec3 background = texture2D(texBackground, vUv).rgb;

    vec3 result = blend(blendMode, background, foreground, opacity);

    gl_FragColor = vec4(clamp(result, 0., 1.), 1.);
}



