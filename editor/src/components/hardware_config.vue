<template>
    <dialog-box title="hardware config" :show="true" @close="close" width="350px" :pos="{x: 100, y: 100}">
        <div class="controls config">
            <div class="control-row">
                <label>Protocol</label>
                <select class="control" v-model="protocol">
                    <option value="pixelpusher">Pixelpusher</option>
                    <option value="artnet">Art-Net</option>
                </select>
            </div>
            <hr />
            <div class="control-row textbox">
                <label>Settings</label>
                <textarea class="control" rows="10" v-model="settingsStr"/>
            </div>
        </div>
    </dialog-box>
</template>

<script>
import DialogBox from '@/components/widgets/dialog_box';
import store from 'chl/vue/store';
import { mapGetters } from 'vuex';
import _ from 'lodash';
import {stringifySettings, parseSettings} from '@/common/hardware/artnet';

export default {
    store,
    name: 'hardware-config',
    components: { DialogBox },
    data() {
        return {
            protocol: _.cloneDeep(this.$store.state.hardware.protocol),
            settings: _.cloneDeep(this.$store.state.hardware.settings),
        };
    },
    computed: {
        settingsStr: {
            get() {
                return stringifySettings(this.settings);
            },
            set(val) {
                return parseSettings(val);
            },
        },
    },
    methods: {
        close(ok) {
            this.$emit('close', ok);
        }
    },
};
</script>

<style scoped>
.config >>> .control {
    display: flex;
}

.textbox * {
    height: 10em;
}
</style>
