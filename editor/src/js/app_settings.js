import * as Config from 'electron-config';

const app_settings = new Config();
console.log('Using config:', app_settings.path);

export default app_settings;
