<template>
    <dialog-box title="hardware config" :show="true" @close="close" width="900px" :pos="{x: 100, y: 100}">
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
                    <text-editor id="tabledisplay"
                        format="plain_text"
                        :readonly="true"
                        :linenumbers="false"
                        :value="outputSettingsResult" />
                </div>
            </template>
        </div>
    </dialog-box>
</template>

<script>
import _ from 'lodash';
import columnify from 'columnify';
import store from 'chl/vue/store';
import {mapGetters, mapMutations} from 'vuex';
import {userConfigFromSettings, settingsFromUserConfig} from '@/common/hardware/artnet';
import DialogBox from '@/components/widgets/dialog_box';
import TextEditor from '@/components/widgets/text_editor';
import {currentModel} from 'chl/model';

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
                startingConfig = userConfigFromSettings(storedSettings.artnet, currentModel);
            else
                startingConfig = {};
        }

        return {
            protocol,
            settings: startingConfig,
            initialSettings: startingConfig
        };
    },

    computed: {
        outputSettingsResult() {
            if (!this.settings || !currentModel || this.protocol !== 'artnet')
                return '';

            let settingsResult;
            try {
                settingsResult = settingsFromUserConfig(this.settings, currentModel);
            } catch (e) {
                return 'Invalid input.'
            }

            return columnify(
                settingsResult.map(out => ({
                    ...out,
                    startUniverse: out.startUniverse + 1,
                    startChannel: out.startChannel + 1,
                    output: `Output ${out.outputIdx + 1}`,
                    host: out.controller.host
                })),
                {
                    columns: ['host', 'output', 'startUniverse', 'startChannel', 'numPixels'],
                    columnSplitter: '  '
                }
            );
        }
    },

    watch: {
        protocol(newProtocol) {
            if (newProtocol !== 'artnet')
                return;

            const storedSettings = this.$store.state.hardware.settings;
            if (storedSettings.artnet)
                this.settings = userConfigFromSettings(storedSettings.artnet, currentModel);
            else
                this.settings = dummyConfig;
        }
    },

    methods: {
        ...mapMutations({
            saveProtocol: 'hardware/useProtocol',
        }),

        close(shouldSave) {
            if (shouldSave) {
                const arg = {protocol: this.protocol};
                if (this.protocol === 'artnet')
                    arg.settings = settingsFromUserConfig(this.settings, currentModel);

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
    max-width: 20em;
}

.textbox * {
    height: 10em;
}

#editor {
    width: 300px;
    height: 500px;
}

#tabledisplay {
    width: 500px;
    height: 500px;
}
</style>
