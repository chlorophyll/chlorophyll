<template>
    <label class="switch">
        <input type="checkbox" :checked='value' @change="$emit('input', $event.target.checked)" />
        <div />
    </label>
</template>

<script>
export default {
    name: 'toggle',
    props: ['value'],

};
</script>

<style scoped lang="scss">
@import "~@/style/aesthetic.scss";

/** Switch
 -------------------------------------*/

.switch input {
    position: absolute;
    opacity: 0;
    width: 2rem;
}

label.switch {
    display: inline-block;
    font-size: 12px;
    height: 1rem;
    width: 2rem;
    padding: 0;
    background: $control-base;
    border: 1px solid $control-border;
    border-radius: $control-border-radius;
}

.switch div {
    height: 1rem;
    width: 1rem;
    border-radius: $control-border-radius;
    background: $control-light;
    border-right: 1px solid $input-bg;
    box-shadow: inset 0 1px $control-light;
    transition: all 100ms;
    transition-timing-function: ease-in-out;
}

.switch input:checked + div {
    border-right: 1px solid $control-highlight-border;
    background-color: $control-highlight;
    box-shadow: inset 0 1px $base-blue-4;
    transform: translate(100%, 0);
}
</style>
