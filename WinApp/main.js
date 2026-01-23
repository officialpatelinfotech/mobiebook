const { app, BrowserWindow, ipcMain } = require('electron')
const url = require("url");
const path = require("path");
const fs = require("fs");

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 680,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false
        },
        icon:__dirname +'/src/assets/img/icon.png'
    })
    mainWindow.maximize();

    mainWindow.setMenuBarVisibility(false)

    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, `/dist/index.html`),
            protocol: "file:",
            slashes: true
        })
    );
    // Open the DevTools.
    //mainWindow.webContents.openDevTools()

    mainWindow.on('closed', function () {
        mainWindow = null
    })
}

app.on('ready', createWindow);


app.on('activate', function () {
    if (mainWindow === null) createWindow()
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

function getImages() {
    const cwd = process.cwd();
    fs.readdir('.', { withFileTypes: true }, (err, files) => {
        if (!err) {
            const re = /(?:\.([^.]+))?$/;
            const images = files
                .filter(file => file.isFile() && ['jpg', 'png'].includes(re.exec(file.name)[1]))
                .map(file => `file://${cwd}/${file.name}`);
                mainWindow.webContents.send("getImagesResponse", images);
        }
    });
}

function isRoot() {
    return path.parse(process.cwd()).root == process.cwd();
}

function getDirectory() {
    fs.readdir('.', {withFileTypes: true}, (err, files) => {
        if (!err) {
            const directories = files
              .filter(file => file.isDirectory())
              .map(file => file.name);
            if (!isRoot()) {
                directories.unshift('..');
            }
            mainWindow.webContents.send("getDirectoryResponse", directories);
        }
    });
  }

  ipcMain.on("navigateDirectory", (event, path) => {
    process.chdir(path);
    getImages();
    getDirectory();
  });

//   process.once('loaded', () => {
//     window.addEventListener('message', evt => {
//       if (evt.data.type === 'select-dirs') {
//         ipcRenderer.send('select-dirs')
//       }
//     })
//   })

// ipcMain.on('select-dirs', async (event, arg) => {
//     const result = await dialog.showOpenDialog(mainWindow, {
//       properties: ['openDirectory']
//     })
//     console.log('directories selected', result.filePaths)
//   })