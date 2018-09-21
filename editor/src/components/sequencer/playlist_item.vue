<template>
    <li class="playlist-item" :class="{selected}">
        <div class="square"><span v-if="current" class="material-icons">chevron_right</span></div>
        <div class="name">{{name}}</div>
        <div>
            <select class="control" v-model="mappingId">
                <option :value="null"></option>
                <template v-for="mapping in availableMappings">
                    <option :value="mapping.id">{{ mapping.name }}</option>
                </template>
            </select>
        </div>
        <div class="duration">
                <masked-input
                  class="duration-input"
                  type="text"
                  :mask="[/\d/, /\d/, ':', /\d/, /\d/, ]"
                  placeholder="mm:ss"
                  v-model="duration" />
        </div>
        <div class="drag"><span class="material-icons">drag_handle</span></div>
    </li>
</template>

<script>
//import * as d3 from 'd3';
import * as numeral from 'numeral';
import { mapMutations } from 'vuex';
import MaskedInput from 'vue-text-mask'
import store from 'chl/vue/store';
import { mappingUtilsMixin } from 'chl/mapping';

export default {
    name: 'playlist-item',
    props: ['item', 'index', 'current', 'selected'],
    store,
    mixins: [mappingUtilsMixin],
    data() {
        return {
            editing: false,
            asdf: ''
        }
    },
    components: { MaskedInput },
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
        duration: {
            get() {
                const minutes = numeral(this.minutes).format('00');
                const seconds = numeral(this.seconds).format('00');
                const ret = `${minutes}:${seconds}`;
                return ret;
            },
            set(val) {
                const duration = numeral(val).value();
                if (duration !== this.item.duration) {
                    this.updateItem({duration});
                }
            }
        },
        mappingId: {
            get() {
                return this.item.mapping !== null ? this.item.mapping.id : null;
            },
            set(mappingId) {
                this.updateItem({mapping: mappingId});
            },
        },
        availableMappings() {
            return this.mappingsByType[this.item.pattern.mapping_type];
        },
    },
    methods: {
        ...mapMutations('playlists', {
           updateItemWithIndex: 'updateItem'
        }),
        updateItem(updates) {
            const index = this.index;
            this.updateItemWithIndex({index, ...updates});
        }
    },
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
        height: 1.1em;
    }

    .name {
        flex: auto;
    }

    .drag {
        height: 1.1em;
        padding-left: 2em;
        cursor: pointer;
        display: flex;
    }
    .material-icons {
        display: inline-block;
        margin-top: -1px;
        font-size: 18px;
    }

    .duration {
    }

    .duration-input {
        width: 4em;
        margin-top: -0.4em;
    }
}

.selected {
    background-color: $accent;
    color: $accent-text;
}
</style>
