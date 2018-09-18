<template>
    <li class="playlist-item" :class="{current}">
        <div class="name">{{name}}</div>
        <div class="duration">{{duration}}</div>
        <div class="drag"><div class="handle"/></div>
    </li>
</template>

<script>
//import * as d3 from 'd3';
import * as numeral from 'numeral';

export default {
    name: 'playlist-item',
    props: ['item', 'current'],
    computed: {
        name() {
            return this.item.pattern.name;
        },
        minutes() {
            return Math.floor(this.item.duration / 60);
        },
        seconds() {
            return this.item.duration % 60;
        },
        duration() {
            return numeral(this.item.duration).format('00:00');
            const minutes = padded(this.minutes);
            const seconds = padded(this.seconds);
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

.current {
    background-color: blue;
}
</style>
