<template>
    <div class="playlist-item">
        <div class="name">{{name}}</div>
        <div class="duration">{{duration}}</div>
        <div class="drag"><div class="handle"/></div>
    </div>
</template>

<script>
import {format} from 'd3-format';

const padded = format('02d');
export default {
    name: 'playlist-item',
    props: ['item'],
    computed: {
        name() {
            return this.item.pattern.name;
        },
        duration() {
            const { duration } = this.item;
            const minutes = padded(Math.floor(duration / 60));
            const seconds = padded(duration % 60);
            return `${minutes}:${seconds}`;
        }
    }
};
</script>
<style scoped lang="scss">
@import "~@/style/aesthetic.scss";
.playlist-item {
    width: 400px;
    height: 3em;
    display: flex;
    align-items: center;
    margin: $control-vspace;
    border: 1px solid $panel-light;
    border-radius: $control-border-radius;

    padding: 0.5em;

    div {
        margin: auto;
    }

    .name {
        flex: auto;
        height: 1.1em;
    }

    .duration {
        height: 1.1em;
    }
    .drag {
        height: 1.1em;
        padding-left: 2em;
        cursor: pointer;
        display: flex;
        .handle {
            margin: auto;
            height: 6px;
            border-top: 1px solid $panel-text;
            border-bottom: 1px solid $panel-text;
            width: 1em;
        }
    }

}
</style>
