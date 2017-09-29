import { remote } from 'electron';

import { writeSavefile, readSavefile, importModelFile } from 'chl/savefile/io';

const { app, Menu, dialog } = remote;

export default function initMenu() {

    let appMenu = [];

    let windowMenu = {
        role: 'window',
        submenu: [
            {role: 'minimize'},
            {role: 'close'}
        ]
    };

    if (process.platform === 'darwin') {
        appMenu = [{
            label: app.getName(),
            submenu: [
                {role: 'about'},
                {type: 'separator'},
                {role: 'services', submenu: []},
                {type: 'separator'},
                {role: 'hide'},
                {role: 'hideothers'},
                {role: 'unhide'},
                {type: 'separator'},
                {role: 'quit'}
            ]
        }];

        windowMenu.submenu = [
            {role: 'close'},
            {role: 'minimize'},
            {role: 'zoom'},
            {type: 'separator'},
            {role: 'front'}
        ];
    }

    const menuTemplate = [
        ...appMenu,
        {
            label: 'File',
            submenu: [
                {
                    label: 'Import New Model...',
                    accelerator: 'CommandOrControl+Shift+N',
                    click() {
                        dialog.showOpenDialog({
                            filters: [
                                { name: 'Model file', extensions: ['ledmap', 'json'] }
                            ]
                        }, (filenames) => {
                            if (filenames === undefined)
                                return;
                            importModelFile(filenames[0]);
                        });
                    }
                },
                {
                    label: 'Save As...',
                    accelerator: 'CommandOrControl+Shift+S',
                    click() {
                        dialog.showSaveDialog({
                            filters: [
                                { name: 'Chlorophyll project file', extensions: ['chl'] }
                            ]
                        }, writeSavefile);
                    }
                },
                {
                    label: 'Open...',
                    accelerator: 'CommandOrControl+O',
                    click() {
                        dialog.showOpenDialog({
                            filters: [
                                { name: 'Chlorophyll project file', extensions: ['chl'] }
                            ],
                            multiSelections: false,
                        }, (filenames) => {
                            if (filenames === undefined)
                                return;
                            readSavefile(filenames[0]);
                        });
                    }
                }
            ],
        },
        {
            label: 'Edit',
            submenu: [
                {
                    label: 'Undo',
                    accelerator: 'CommandOrControl+Z',
                    click() {
                        // todo undo
                    }
                },
                {
                    label: 'Redo',
                    accelerator: 'ComandOrControl+Shift+Z',
                    click() {
                        // todo redo
                    }
                },
                { type: 'separator' },
                {
                    label: 'Viewport Settings',
                    click() {
                        // todo once layout
                        // rendering_win.show();
                        // rendering_win.setPosition(window.innerWidth - 520, 20);
                    }
                },
            ]
        },
        windowMenu,
        {
            role: 'help',
        },
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
}
