/*
 * Icon Hider extension for Gnome Shell.
 *
 * Copyright 2012 Igor Kalnitsky <igor@kalnitsky.org>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// aliases
const Gio = imports.gi.Gio
const Main = imports.ui.main
const Panel = imports.ui.panel
const PopupMenu = imports.ui.popupMenu
const PanelMenu = imports.ui.panelMenu
const Mainloop = imports.mainloop;
const Lang = imports.lang;
const ExtensionUtils = imports.misc.extensionUtils;
const Params = imports.misc.params;

const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

// global consts
const EXTENSION_NAME = 'Icon Hider'
const GSETTINGS_SCHEMA = 'org.gnome.shell.extensions.icon-hider'
const GSETTINGS_HIDDEN_ICONS = 'hided-icons'
const GSETTINGS_SEEN_ICONS = 'seen-icons'

// interval to force hide unwanted actors
const INDICATOR_UPDATE_INTERVAL = 5000;

/*
 * Indicator definition.
 *
 * Create item in StatusArea panel. Provide menu for manipulating
 * visiblity of other icons.
 */

function Indicator() {
    this._init.apply(this, arguments)
}


Indicator.prototype = {
    __proto__: PanelMenu.SystemStatusButton.prototype,

    /**
     * Constructor
     */
    _init: function() {
        PanelMenu.SystemStatusButton.prototype._init.call(this, 'view-grid');

        // exceptions are not show in menu
        this._exceptions = ['battery', 'message-notifier'];

        this._settings = Convenience.getSettings();

        this.knownIcons = [];

        // hook addToStatusArea
        this._MainPanelAddToStatusArea = Main.panel.addToStatusArea;
        Main.panel.addToStatusArea = Lang.bind(this, this._addToStatusArea);

        this._refreshIcons();
        this._createMenu();

        this._settings.connect("changed::" + GSETTINGS_HIDDEN_ICONS, Lang.bind(this, function() {
            global.log("*** settings changed");
            this._refreshIcons();
        }));

        // SHITFIX: network icon arrive after some time
        // TODO: put this to prefs
        this._timeout = Mainloop.timeout_add(INDICATOR_UPDATE_INTERVAL, Lang.bind(this, function () {
            global.log("*** TIMEOUT REACHED");
            this._refreshIcons();
            return false; // TODO: put this to prefs too
        }))
    },

    destroy: function() {
        Mainloop.source_remove(this._timeout);
        Main.panel.addToStatusArea = this._MainPanelAddToStatusArea;
        this._MainPanelAddToStatusArea = null;
    },

    /**
     * Create menu in top bar.
     */
    _createMenu: function() {
        let hiddenItems = this._settings.get_strv(GSETTINGS_HIDDEN_ICONS)

        for (let item in Main.panel._statusArea) {
            // don't add exceptions (this is items not works correctly)
            if (this._exceptions.indexOf(item) != -1)
                continue

            let isHidden = (hiddenItems.indexOf(item) != -1)

            // create menu item
            let menuItem = new PopupMenu.PopupSwitchMenuItem(item, !isHidden)
            this.menu.addMenuItem(menuItem)

            // add reference to real status area item.
            // this ref need for access to actor
            menuItem.statusAreaItem = Main.panel._statusArea[item]
            menuItem.statusAreaKey = item

            if (isHidden)
                this._hideItem(menuItem)

            // set handler
            let $this = this
            menuItem.connect('toggled', function (item) {
                item.state == false
                    ? $this._hideItem(item)
                    : $this._showItem(item)
            })
        }
    },

    /**
     * Hide element and mark it as hidden in settings.
     */
    _hideItem: function (item) {
        let hiddenItems = this._settings.get_strv(GSETTINGS_HIDDEN_ICONS)

        if (hiddenItems.indexOf(item.statusAreaKey) == -1) {
            hiddenItems.push(item.statusAreaKey)
            this._settings.set_strv(GSETTINGS_HIDDEN_ICONS, hiddenItems)
        }

        item.statusAreaItem.actor.hide()
    },

    /**
     * Show element and mark it as visible in settings.
     */
    _showItem: function (item) {
        let hiddenItems = this._settings.get_strv(GSETTINGS_HIDDEN_ICONS)
        let index = hiddenItems.indexOf(item.statusAreaKey)

        while (index != -1) {
            hiddenItems.splice(index, 1)
            this._settings.set_strv(GSETTINGS_HIDDEN_ICONS, hiddenItems)
            index = hiddenItems.indexOf(item.statusAreaKey)
        }

        item.statusAreaItem.actor.show()
    },

    /**
     * Mark all elements as visible.
     * Used when extension is deactivating.
     */
    _showStatusAreaItems: function () {
        let menuItems = this.menu._getMenuItems()

        for (let index in menuItems)
            menuItems[index].statusAreaItem.actor.show()
    },

    _refreshIcons: function() {
        let hiddenIcons = this._settings.get_strv(GSETTINGS_HIDDEN_ICONS)
        let updatePrefs = false;

        for (let role in Main.panel._statusArea) {


            if (this._exceptions.indexOf(role) != -1) continue;

            if (this.knownIcons.indexOf(role) == -1) {
                this.knownIcons.push(role);
                updatePrefs = true;
                global.log("*** detected new icon: " + role);
            }

            if (hiddenIcons.indexOf(role) != -1) {
                Main.panel._statusArea[role].actor.hide();
            } else {
                Main.panel._statusArea[role].actor.show();
            }

        }

        // update settings to make icon list visible to prefs dialog
        if (updatePrefs) {
            global.log("*** update known icon list");
            this._settings.set_strv(GSETTINGS_SEEN_ICONS, this.knownIcons);
        }
    },

    _addToStatusArea: function(role, indicator, position) {
        let result = this._MainPanelAddToStatusArea.call(Main.panel, role, indicator, position);
        this._refreshIcons();
        return result;
    },

}


/*
 * Extension definition.
 *
 * Wrapper for Indicator.
 */

function Extension() {
    this._init();
}

Extension.prototype = {
    _init: function() {
        this._indicator = null;
    },

    enable: function() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(EXTENSION_NAME, this._indicator);
    },

    disable: function() {
        this._indicator._showStatusAreaItems();
        this._indicator.destroy();
        this._indicator = null;
    }
};


/**
 * Entry point.
 *
 * Should return an object with callable `enable` and `disable` properties.
 */
function init() {
    return new Extension();
}
