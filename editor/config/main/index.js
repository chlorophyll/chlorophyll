import { app, BrowserWindow } from 'electron' // eslint-disable-line

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\') // eslint-disable-line
  global.__schemas = require('path').join(__dirname, '/schemas').replace(/\\/g, '\\\\') // eslint-disable-line
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
}

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
