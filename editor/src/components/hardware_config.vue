<template>
    <dialog-box title="hardware config" :show="true" @close="close" width="500px" :pos="{x: 100, y: 100}">
        <div class="controls config">
            <div class="control-row">
                <label>Protocol</label>
                <select class="control" v-model="protocol">
                    <option value="pixelpusher">Pixelpusher</option>
                    <option value="artnet">Art-Net</option>
                </select>
            </div>
            <template v-if="protocol === 'artnet'">
                <hr />
                <div class="control-row">
                    <label>Settings</label>
                    <text-editor id="editor" format="yaml" v-model="settings" />
                </div>
            </template>
        </div>
    </dialog-box>
</template>

<script>
import DialogBox from '@/components/widgets/dialog_box';
import TextEditor from '@/components/widgets/text_editor';
import store from 'chl/vue/store';
import {mapGetters, mapMutations} from 'vuex';
import _ from 'lodash';
import {userConfigFromSettings, settingsFromUserConfig} from '@/common/hardware/artnet';

export default {
    store,
    name: 'hardware-config',
    components: { DialogBox, TextEditor },
    data() {
        const protocol = this.$store.state.hardware.protocol;
        const storedSettings = this.$store.state.hardware.settings;

        let startingConfig = {};
        if (protocol === 'artnet') {
            if (storedSettings.artnet)
                startingConfig = userConfigFromSettings(storedSettings.artnet);
            else
                startingConfig = {};
        }

        return {
            protocol,
            settings: startingConfig,
            initialSettings: startingConfig
        };
    },

    watch: {
        protocol(newProtocol) {
            if (newProtocol !== 'artnet')
                return;

            const storedSettings = this.$store.state.hardware.settings;
            if (storedSettings.artnet)
                this.settings = userConfigFromSettings(storedSettings.artnet);
            else
                this.settings = dummyConfig;
        }
    },

    methods: {
        ...mapMutations({
            saveProtocol: 'hardware/useProtocol',
        }),

        onUpdated(newValue) {
            this.settings = newValue;
        },

        close(shouldSave) {
            if (shouldSave) {
                const arg = {protocol: this.protocol};
                if (this.protocol === 'artnet')
                    arg.settings = settingsFromUserConfig(this.settings);

                this.saveProtocol(arg);
            } else {
                this.settings = this.initialSettings;
            }

            this.$emit('close', shouldSave);
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

#editor {
    width: 400px;
    height: 500px;
}
</style>
