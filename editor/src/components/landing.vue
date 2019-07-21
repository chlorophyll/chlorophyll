<template>
    <div class="container">
        <div class="header">
        <div><img src="~@/assets/chlorophyll-logo.svg" /></div>
    </div>
    <div class="fade-in">
    <h2>Get Started</h2>
    <ul>
    <li><a @click="showImportDialog">Import New Model...</a></li>
    <li><a @click="showOpenDialog">Open project</a></li>
    </ul>
    <h2>Recent Projects</h2>
    <div class="projects">
    <template v-for="project in projects">
        <div class="project" @click="readSave(project.file)">
            <landing-preview
             class="preview"
             :style="preview_style"
             :width="preview_width"
             :height="preview_height"
             :project="project"
             :renderer="renderer"
             :camera="camera"
            />
            <div class="text"> {{ project.name }}</div>
        </div>
        </template>
    </div>
    </ul>
    </div>
    </div>
</template>

<script>
import { remote } from 'electron';
import { showImportDialog, showOpenDialog, readSavefile, } from 'chl/savefile/io';
import { getRecentProjectNames } from 'chl/savefile/recent';
import { createRenderer, createCamera } from 'chl/viewport';
import LandingPreview from '@/components/landing_preview';

const PREVIEW_WIDTH=120;
const PREVIEW_HEIGHT=100;

export default {
    name: 'landing',
    components: { LandingPreview },
    methods: {
        showImportDialog() {
            showImportDialog('chl');
        },
        showOpenDialog,
        readSave(path) {
            readSavefile(path).catch((err) => {
                console.error(err);
                remote.dialog.showErrorBox('Error opening file', err.message);
            });
        }
    },
    computed: {
        preview_style() {
            return {
                width: `${PREVIEW_WIDTH}px`,
                height: `${PREVIEW_HEIGHT}px`,
            };
        },
        preview_width() {
            return PREVIEW_WIDTH;
        },
        preview_height() {
            return PREVIEW_HEIGHT;
        },
    },

    data() {
        const dpiWidth = PREVIEW_WIDTH/window.devicePixelRatio;
        const dpiHeight = PREVIEW_HEIGHT/window.devicePixelRatio;
        return {
            projects: getRecentProjectNames(),
            renderer: createRenderer(dpiWidth, dpiHeight),
            camera: createCamera('perspective', PREVIEW_WIDTH, PREVIEW_HEIGHT),
        };
    },
};
</script>
<style scoped lang="scss">
@import "~@/style/aesthetic.scss";
a {
    cursor: pointer;
    color: $base-blue-4;
}
ul {
    list-style-type: none;
    li {
        display: flex;
        margin: $control-vspace;
        a {
            padding: 2px;
            color: $base-blue-4;
            display: block;
            width: 10em;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }
    margin: 0;
    padding: 0;
}

.container {
    width: 100%;
    height: 100%;
    background-color: $panel-bg;
    padding: 2em;
}

.fade-in {
	opacity: 1;
	animation-name: fadeInOpacity;
	animation-iteration-count: 1;
	animation-timing-function: ease-in;
	animation-duration: 0.2s;
}

@keyframes fadeInOpacity {
	0% {
		opacity: 0;
	}
	100% {
		opacity: 1;
	}
}

.header {
    width: 100%;
    div {
        margin: 0 auto;
        width: 500px;
        height: 200px;
    }
}
.platform-darwin .header div {
    margin-top: -$darwin-titlebar-height;
}

.preview {
    display: flex;
    position: relative;
    align-items: center;
    background-color: black;
}
.projects {
    display: flex;
    margin-left: -10px;
    padding: 0;
    width: 70%;
    flex-wrap: wrap;
    .project {
        cursor: pointer;
        color: $base-blue-4;
        width: 124px;
        height: 150px;
        flex: 0;
        display: flex;
        flex-direction: column;
        margin: 10px 20px;
        padding: 2px;
        border: 1px solid $panel-light;
        border-radius: $control-border-radius;
        align-items: center;

        .text {
            overflow: hidden;
            text-overflow: ellipsis;
            flex: auto;
            margin: 0 auto;
            display: flex;
            align-items: center;
            align-self: end;
        }
    }
}


</style>
