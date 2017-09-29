<template>
    <div>
    <h1>Chlorophyll</h1>
    <h2>Start</h2>
    <a @click="showImportDialog">Import New Model...</a>
    <h2>Recent Projects</h2>
    <ul>
    <template v-for="project in getRecentProjectNames()">
        <li><a @click="readSavefile(project.file)">{{ project.name }}</a></li>
    </template>
    </ul>
    </div>
</template>

<script>
import { showImportDialog, readSavefile } from 'chl/savefile/io';
import { getRecentProjectNames } from 'chl/savefile/recent';

export default {
    name: 'landing',
    methods: {
        showImportDialog,
        getRecentProjectNames,
        readSavefile,
    }
};
</script>
<style>
a {
    cursor: pointer;
}
</style>
