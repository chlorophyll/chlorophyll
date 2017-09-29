import * as path from 'path';

import app_settings from 'chl/app_settings';
import Const from 'chl/const';


export function pushRecentFile(file) {
    let recent_files = app_settings.get('recent_files', []);

    recent_files = recent_files.filter((r) => r !== file);

    recent_files.unshift(file);
    recent_files = recent_files.slice(0, Const.num_recent_files);

    app_settings.set('recent_files', recent_files);

}

export function getRecentFiles() {
    return app_settings.get('recent_files', []);
}

export function getRecentProjectNames() {
    let recent_files = getRecentFiles();

    return recent_files.map((file) => ({file, name: path.basename(file, '.chl')}));
}
