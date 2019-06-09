import * as path from 'path';
import _ from 'lodash';
import app_settings from 'chl/app_settings';
import Const from 'chl/const';

import {previewSavefile} from 'chl/savefile/io';

const CUR_SCHEMA_VERSION = 3;

export function pushRecentFile(file, { preview }) {
    let recent_projects = getRecentProjects();

    recent_projects = recent_projects.filter((r) => r.file !== file);

    recent_projects.unshift({file, preview});
    recent_projects = recent_projects.slice(0, Const.num_recent_files);

    app_settings.set('recent_files', recent_projects);
}

function updateWithPreviewsAsync(projects) {
    const previewsAsync = projects.map(project => previewSavefile(project.file));

    Promise.all(previewsAsync).then(models => {
        const projectsWithPreviews = _.zip(projects, models).map(
            ([project, model]) => ({...project, preview: model.model_info})
        );
        app_settings.set('recent_files', projectsWithPreviews);
    });
}

export function getRecentProjects() {
    const schemaVersion = app_settings.get('schema_version', null);
    const recents = app_settings.get('recent_files', []);
    let recentProjects;

    if (schemaVersion === CUR_SCHEMA_VERSION) {
        recentProjects = recents;
    } else if (schemaVersion === 2) {
        // just loading some extra data built as part of the model construction
        recentProjects = recents;
        app_settings.set('schema_version', CUR_SCHEMA_VERSION);
        updateWithPreviewsAsync(recentProjects);
    } else if (schemaVersion === 1) {
        recentProjects = recents.map(file => ({file, preview: null}));
        app_settings.set('recent_files', recentProjects);
        app_settings.set('schema_version', CUR_SCHEMA_VERSION);
        updateWithPreviewsAsync(recentProjects);
    }
    return recentProjects;
}

export function getRecentProjectNames() {
    let recent_projects = getRecentProjects();

    return recent_projects.map(project => {
        const name = path.basename(project.file, '.chl');
        return {
            name,
            ...project,
        };
    });
}
