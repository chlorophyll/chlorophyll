<template>
    <li class="playlist-item" :class="{selected}">
        <div class="square"><span v-if="current" class="material-icons">chevron_right</span></div>
        <div class="delete square clickable" @click="deleteItem"><span class="material-icons">close</span></div>
        <div class="name">{{name}}</div>
        <div>
            <select class="control" v-model="mappingId">
                <option :value="null"></option>
                <template v-for="mapping in availableMappings">
                    <option :value="mapping.id">{{ mapping.name }}</option>
                </template>
            </select>
        </div>
        <div class="square" />
        <div class="duration">
                <masked-input
                  class="control duration-input"
                  type="text"
                  @focus="focusDuration"
                  @blur="blurDuration"
                  :mask="[/\d/, /\d/, ':', /\d/, /\d/, ]"
                  :keep-char-positions="true"
                  placeholder="mm:ss"
                  v-model="duration" />
        </div>
        <div class="drag clickable"><span class="material-icons">drag_handle</span></div>
    </li>
</template>

<script>
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
            durationForEditing: null,
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
                if (this.durationForEditing !== null) {
                    return this.durationForEditing;
                }
                const minutes = numeral(this.minutes).format('00');
                const seconds = numeral(this.seconds).format('00');
                const ret = `${minutes}:${seconds}`;
                return ret;
            },
            set(val) {
                if (this.durationForEditing !== null) {
                    this.durationForEditing = val;
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
            updateItemWithIndex: 'updateItem',
            deleteWithIndex: 'deleteItem',
        }),
        updateItem(updates) {
            const index = this.index;
            this.updateItemWithIndex({index, ...updates});
        },
        deleteItem() {
            const index = this.index;
            this.deleteWithIndex({index});
        },
        focusDuration() {
            this.durationForEditing = this.duration;
        },
        blurDuration() {
            const duration = numeral(this.durationForEditing).value();
            this.durationForEditing = null;
            this.updateItem({duration});
        }
    },
};
</script>
<style scoped lang="scss">
@import "~@/style/aesthetic.scss";
li {

    .name {
        flex: auto;
        margin-left: 2em;
    }

    .drag {
        padding-left: 2em;
    }

    .clickable {
        cursor: pointer;
    }

    .material-icons {
        display: inline-block;
        font-size: 18px;
    }

    .delete {
        margin-top: 3px;
    }

    .duration {
    }

    .duration-input {
        width: 4em;
    }
}

.selected {
    background-color: $accent;
    color: $accent-text;
}
</style>
