import { app, BrowserWindow } from 'electron' // eslint-disable-line

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__glslifyBasedir = __dirname;
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\');
  global.__schemas = require('path').join(__dirname, '/schemas').replace(/\\/g, '\\\\');
}

let mainWindow;
const winURL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:9080'
  : `file://${__dirname}/index.html`;

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    show: false,
    width: 1280,
    height: 800,
    useContentSize: true,
    backgroundColor: '#222323',
    darkTheme: process.platform === 'linux',
    titleBarStyle: 'hidden',
    webPreferences: {
      experimentalFeatures: true,
    }
  });

  mainWindow.loadURL(winURL);
  mainWindow.once('ready-to-show', () => {
   mainWindow.show()
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const webContents = mainWindow.webContents;

  webContents.on('did-finish-load', () => {
    webContents.setZoomFactor(1);
    webContents.setVisualZoomLevelLimits(1, 1);
    webContents.setLayoutZoomLevelLimits(0, 0);
  });
}


app.commandLine.appendSwitch('disable-pinch');
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
