// Modules to control application life and create native browser window
const path = require("path");
const { fork } = require("child_process");
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const isDev = require("electron-is-dev");

function runScriptWithChildProcess(script, args = []) {
  const child = fork(script, args);

  return new Promise((resolve) => {
    child.on("error", (err) => {
      resolve([err]);
    });

    child.on("exit", (code) => {
      global.console.log(`stop child_process: "${script}" with ${code}`);
    });

    child.on("message", ({ data }) => {
      resolve([null, data]);
    });
  });
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "renderer.js")
    }
  });

  // and load the index.html of the app.
  if (isDev) {
    mainWindow.loadURL("http://localhost:3000/");
  } else {
    mainWindow.loadFile(path.join(__dirname, "index.html"));
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on("closed", function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", function() {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function() {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});

ipcMain.on("crawl", async (event, msg) => {
  const [err, data] = await runScriptWithChildProcess(path.resolve(__dirname, "../spider/main"), [msg]);
  event.sender.send("after-crawl", data);
});

ipcMain.on("open-directory-dialog", function(event) {
  dialog.showOpenDialog({ properties: ["openDirectory"] }, function(files) {
    if (files) {
      event.sender.send("selected-directory", files);
    }
  });
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
