import keyboardJS from 'keyboardjs';
import Hotkey from 'chl/keybindings';
import store from 'chl/vue/store';

import { ToolMixin } from 'chl/tools';
import { colorDisplay } from 'chl/model';

const SelectionState = {
    Creating: 0,
    Adding: 1,
    Subtracting: 2,
};

export function SelectionToolMixin(name) {
    return [
        ToolMixin,
        {
            name,
            store,
            mounted() {
                keyboardJS.withContext(this.kb_ctx, () => {
                    keyboardJS.bind(Hotkey.cancel_selection, () => this.onHotkey());
                });
            },
            data() {
                return {
                    initial_selection: null,
                    selection_state: SelectionState.Create,
                    in_progress: false,
                };
            },
            computed: {
                viewport() {
                    return document.getElementById('viewport');
                },
                kb_ctx() {
                    return `${name}-kbctx`;
                }
            },

            watch: {
                enabled(newval) {
                    if (newval) {
                        keyboardJS.setContext(this.kb_ctx);
                    } else {
                        keyboardJS.setContext('global');
                    }
                }
            },
            methods: {
                onHotkey() {
                    if (this.in_progress) {
                        this.cancelSelection();
                    } else if (this.enabled) {
                        colorDisplay.active_selection = [];
                    }
                },
                startSelection(event) {
                    if (event.altKey) {
                        this.selection_state = SelectionState.Subtracting;
                    } else if (event.shiftKey) {
                        this.selection_state = SelectionState.Adding;
                    } else {
                        this.selection_state = SelectionState.Creating;
                        // Start with an empty selection if we're not adding or subtracting
                        // from an existing one.
                        colorDisplay.active_selection = [];
                    }
                    this.in_progress = true;

                    this.initial_selection = [...colorDisplay.active_selection];
                    colorDisplay.in_progress_selection = this.initial_selection;
                    colorDisplay.active_selection = [];
                },

                handlePixel(selection, pixel) {
                    if (this.selection_state == SelectionState.Subtracting) {
                        selection.delete(pixel);
                    } else {
                        selection.add(pixel);
                    }
                },

                updateInProgressSelection(selection) {
                    colorDisplay.in_progress_selection = [...selection];
                },

                commitSelection(selection=null) {
                    selection = selection || colorDisplay.in_progress_selection;
                    this.in_progress = false;
                    colorDisplay.active_selection = [...selection];
                    colorDisplay.in_progress_selection = [];
                    this.initial_selection = null;
                    this.reset();
                },

                cancelSelection() {
                    this.commitSelection(this.initial_selection);
                }

            }
        }
    ];
}
