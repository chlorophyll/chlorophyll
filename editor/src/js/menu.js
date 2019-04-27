import { remote } from 'electron';

import { saveCurrentProject, showSaveAsDialog, showOpenDialog, showImportDialog } from 'chl/savefile/io';

const { app, Menu } = remote;

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
                    click: () => showImportDialog('chl'),
                },
                {
                    label: 'Import OBJ (experimental)...',
                    click: () => showImportDialog('obj'),
                },
                {
                    label: 'Open...',
                    accelerator: 'CommandOrControl+O',
                    click: showOpenDialog,
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Save',
                    accelerator: 'CommandOrControl+S',
                    click: saveCurrentProject,
                },
                {
                    label: 'Save As...',
                    accelerator: 'CommandOrControl+Shift+S',
                    click: showSaveAsDialog,
                },
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
