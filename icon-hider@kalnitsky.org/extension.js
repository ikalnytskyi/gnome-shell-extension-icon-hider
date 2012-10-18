/*
 * Copyright 2012 Igor Kalnitsky <igor@kalnitsky.org>
 *
 * This file is part of Icon Hider for Gnome Shell.
 *
 * Icon Hider is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Icon Hider is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Icon Hider Extension.  If not, see <http://www.gnu.org/licenses/>.
 */

const Lang = imports.lang;
const Config = imports.misc.config
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;


// global consts
const EXTENSION_NAME = 'Icon Hider';
const GSETTINGS = {
    HIDDEN:             'hidden',
    KNOWN:              'known',
    EXCEPTIONS:         'exceptions',
    IS_INDICATOR_SHOWN: 'is-indicator-shown',
    IS_USERNAME_SHOWN:  'is-username-shown'
};

/*
 * Indicator definition.
 *
 * Create item in StatusArea panel. Provide menu for manipulating
 * visiblity of other icons.
 */

function Indicator() {
    this._init.apply(this, arguments);
}


Indicator.prototype = {
    __proto__: PanelMenu.SystemStatusButton.prototype,

    /**
     * Constructor
     */
    _init: function() {
        if (age=="old") PanelMenu.SystemStatusButton.prototype._init.call(this, 'view-grid');
        else            PanelMenu.SystemStatusButton.prototype._init.call(this, 'view-grid-symbolic');
        Main.panel.addToStatusArea(EXTENSION_NAME, this);

        this._settings = Convenience.getSettings();
        this._createMenu();
    },

    /**
     * Create menu in top bar.
     */
    _createMenu: function() {
        let knownItems = this._settings.get_strv(GSETTINGS.KNOWN);
        let hiddenItems = this._settings.get_strv(GSETTINGS.HIDDEN);

        // create switchers list
        for each (let item in knownItems) {
            // create menu item
            let isHidden = (hiddenItems.indexOf(item) != -1);
            let menuItem = new PopupMenu.PopupSwitchMenuItem(item, !isHidden);
            this.menu.addMenuItem(menuItem);

            menuItem.statusAreaKey = item;

            // set handler
            menuItem.connect('toggled', Lang.bind(this, function (item) {
                item.state == false
                    ? this._hideItem(item)
                    : this._showItem(item);
            }));
        }

        // create service items
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        let settingsItem = new PopupMenu.PopupMenuItem('Settings');
        settingsItem.connect('activate', Lang.bind(this, function() {
            var runPrefs = 'gnome-shell-extension-prefs ' + Me.metadata.uuid;
            Main.Util.trySpawnCommandLine(runPrefs);
        }));
        this.menu.addMenuItem(settingsItem);
    },

    /**
     * Hide element and mark it as hidden in settings.
     */
    _hideItem: function (item) {
        let hiddenItems = this._settings.get_strv(GSETTINGS.HIDDEN);

        if (hiddenItems.indexOf(item.statusAreaKey) == -1) {
            hiddenItems.push(item.statusAreaKey);
            this._settings.set_strv(GSETTINGS.HIDDEN, hiddenItems);
        }
    },

    /**
     * Show element and mark it as visible in settings.
     */
    _showItem: function (item) {
        let hiddenItems = this._settings.get_strv(GSETTINGS.HIDDEN);
        let index = hiddenItems.indexOf(item.statusAreaKey);

        while (index != -1) {
            hiddenItems.splice(index, 1);
            this._settings.set_strv(GSETTINGS.HIDDEN, hiddenItems);
            index = hiddenItems.indexOf(item.statusAreaKey);
        }
    }
}


/*
 * Extension definition.
 */
let age;

function Extension() {
    this._init();
}

Extension.prototype = {
    _init: function() {
        this._indicator = null;
        this._settings = Convenience.getSettings();
        if (age=="old") this._statusArea = Main.panel._statusArea;
        else            this._statusArea = Main.panel.statusArea;
    },

    enable: function() {
        // load visibility
        let hiddenItems = this._settings.get_strv(GSETTINGS.HIDDEN);
        let knownItems = this._settings.get_strv(GSETTINGS.KNOWN);
        let exceptionsItems = this._settings.get_strv(GSETTINGS.EXCEPTIONS);

        for (let item in this._statusArea) {
            // skip exceptions (this items don't works correctly)
            if (exceptionsItems.indexOf(item) != -1 || item === EXTENSION_NAME)
                continue;

            // add to known icons (used by prefs.js and indicator)
            if (knownItems.indexOf(item) == -1)
                knownItems.push(item);

            // set icon visibility
            hiddenItems.indexOf(item) != -1
                ? this._statusArea[item].actor.hide()
                : this._statusArea[item].actor.show();
        }
        this._settings.set_strv(GSETTINGS.KNOWN, knownItems);

        // create indicator
        this._indicator = new Indicator();

        // load utilities settings
        let isIndicatorShown = this._settings.get_boolean(GSETTINGS.IS_INDICATOR_SHOWN);
        let isUsernameShown = this._settings.get_boolean(GSETTINGS.IS_USERNAME_SHOWN);

        isIndicatorShown
            ? this._indicator.actor.show()
            : this._indicator.actor.hide();

        isUsernameShown
            ? this._statusArea.userMenu._name.show()
            : this._statusArea.userMenu._name.hide();
        // save signal id (should be used for disconnecting in `destroy()`)
        this._settingsSignal =
            this._settings.connect('changed::', Lang.bind(this, this._reloadSettings));
    },

    /**
     * Clean-up:
     *   - restore icons' visibility
     *   - disconnect settings signal
     *   - destroy indicator
     */
    disable: function() {
        // restore visibility
        let hiddenItems = this._settings.get_strv(GSETTINGS.HIDDEN);
        for each (let item in hiddenItems)
            if (item in this._statusArea)
                this._statusArea[item].actor.show();

        this._indicator.destroy();
        this._indicator = null;
        this._settings.disconnect(this._settingsSignal);
    },

    /**
     * This function is called when settings are changed.
     */
    _reloadSettings: function() {
        this.disable();
        this.enable();
    }
};


/**
 * Entry point.
 *
 * Should return an object with callable `enable` and `disable` properties.
 */
function init(metadata) {
    let current_version = Config.PACKAGE_VERSION.split('.');
    if (current_version.length != 3 || current_version[0] != 3) throw new Error("Strange version number (extension.js:223).");
    
    switch (current_version[1]) {
        case"3": global.log("Warning of extension [" + metadata.uuid + "]:\n              Old development release detected (" + Config.PACKAGE_VERSION + "). You should upgrade!\n");   //eak
        case"4": age = "old";
            break;
        case"5": global.log("Warning of extension [" + metadata.uuid + "]:\n              Development release detected (" + Config.PACKAGE_VERSION + "). Loading as a 3.6 release.\n"); //eak
        case"6": age = "new";
            break;
        default: throw new Error("Strange version number (extension.js:232).");
    }
    return new Extension();
}
