const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        autoHideMenuBar: true,
        width: 800,
        height: 600,
        //icon: path.join(__dirname, 'assets', '.png'),
        webPreferences: {
            autoHideMenuBar: true,
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile('index.html');

    function showZoomNotification(zoomLevel) {

        const zoomPercentage = Math.round(100 * Math.pow(1.2, zoomLevel));

        const notification = new BrowserWindow({
            width: 200,
            height: 60,
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            skipTaskbar: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });


        const bounds = win.getBounds();
        notification.setPosition(bounds.x + bounds.width - 200, bounds.y + bounds.height - 60);

        notification.loadURL(`data:text/html,
            <body style="margin: 0; background: rgba(0,0,0,0.7); color: white; font-family: Arial; 
                        display: flex; justify-content: center; align-items: center; height: 100%; 
                        border-radius: 5px;">
                <div style="font-size: 16px;">Zoom: ${zoomPercentage}%</div>
            </body>
        `);


        setTimeout(() => notification.close(), 1500);
    }


    win.webContents.on('before-input-event', (event, input) => {
        if (input.control) {
            if (input.key === '=' || input.key === '+') {
                const newZoom = win.webContents.getZoomLevel() + 0.5;
                win.webContents.setZoomLevel(newZoom);
                showZoomNotification(newZoom);
                event.preventDefault();
            } else if (input.key === '-') {
                const newZoom = win.webContents.getZoomLevel() - 0.5;
                win.webContents.setZoomLevel(newZoom);
                showZoomNotification(newZoom);
                event.preventDefault();
            } else if (input.key === '0') {
                win.webContents.setZoomLevel(0);
                showZoomNotification(0);
                event.preventDefault();
            }
        }
    });

   
    win.on('move', () => {
        const notifications = BrowserWindow.getAllWindows()
            .filter(w => w !== win && !w.isDestroyed());
        if (notifications.length > 0) {
            const bounds = win.getBounds();
            notifications[0].setPosition(bounds.x + bounds.width - 200, bounds.y + bounds.height - 60);
        }
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});