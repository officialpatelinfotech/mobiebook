const { app, BrowserWindow } = require("electron");

let win

function createWindow() {
    win = new BrowserWindow({
        width:1024,
        height:2014,
        backgroundColor:'#ffffff',
        icon:`file://${__dirname}/dist/photo/assets/icons/icon-128x128.png`
    })

    win.loadURL(`file://${__dirname}/dist/photo/index.html`)

    //win.webContents.openDevTools()

    win.on('closed',function () {
        win = null
    })
}

app.on('ready',createWindow)

app.on('window-all-closed',function () {    
    if(process.platform !== 'darwin'){
        app.quit();
    }
})

app.on('activate', function () {
    if(win === null){
        createWindow();
    }
})