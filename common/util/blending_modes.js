import modes from 'glsl-blend/modes';

const m = [
    {module: 'add',          description: 'Add', value: modes.ADD},
    {module: 'average',      description: 'Average', value: modes.AVERAGE},
    {module: 'color-burn',   description: 'Color Burn', value: modes.COLOR_BURN},
    {module: 'color-dodge',  description: 'Color Dodge', value: modes.COLOR_DODGE},
    {module: 'darken',       description: 'Darken', value: modes.DARKEN},
    {module: 'difference',   description: 'Difference', value: modes.DIFFERENCE},
    {module: 'exclusion',    description: 'Exclusion', value: modes.EXCLUSION},
    {module: 'glow',         description: 'Glow', value: modes.GLOW},
    {module: 'hard-light',   description: 'Hard Light', value: modes.HARD_LIGHT},
    {module: 'hard-mix',     description: 'Hard Mix', value: modes.HARD_MIX},
    {module: 'lighten',      description: 'Lighten', value: modes.LIGHTEN},
    {module: 'linear-burn',  description: 'Linear Burn', value: modes.LINEAR_BURN},
    {module: 'linear-dodge', description: 'Linear Dodge', value: modes.LINEAR_DODGE},
    {module: 'linear-light', description: 'Linear Light', value: modes.LINEAR_LIGHT},
    {module: 'multiply',     description: 'Multiply', value: modes.MULTIPLY},
    {module: 'negation',     description: 'Negation', value: modes.NEGATION},
    {module: 'normal',       description: 'Normal', value: modes.NORMAL},
    {module: 'overlay',      description: 'Overlay', value: modes.OVERLAY},
    {module: 'pin-light',    description: 'Pin Light', value: modes.PIN_LIGHT},
    {module: 'reflect',      description: 'Reflect', value: modes.REFLECT},
    {module: 'screen',       description: 'Screen', value: modes.SCREEN},
    {module: 'soft-light',   description: 'Soft Light', value: modes.SOFT_LIGHT},
    {module: 'subtract',     description: 'Subtract', value: modes.SUBTRACT},
    {module: 'vivid-light',  description: 'Vivid Light', value: modes.VIVID_LIGHT},
];

export default m;
