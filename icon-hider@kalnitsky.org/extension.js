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

// global consts
const EXTENSION_NAME = 'Icon Hider'
const GSETTINGS_SCHEMA = 'org.gnome.shell.extensions.icon-hider'
const GSETTINGS_HIDE_KEY = 'hided-icons'


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
        PanelMenu.SystemStatusButton.prototype._init.call(this, 'view-grid')

        // exceptions are not show in menu
        this._exceptions = ['battery', 'message-notifier']

        this._initSettings()
        this._createMenu()
    },

    /**
     * Get settings instance and save it as `this._settings`
     */
    _initSettings: function() {
        let extension = imports.misc.extensionUtils.getCurrentExtension()

        let src = Gio.SettingsSchemaSource.new_from_directory(
            extension.dir.get_child('schemas').get_path(),
            Gio.SettingsSchemaSource.get_default(),
            false
        )

        this._settings = new Gio.Settings({
            settings_schema: src.lookup(GSETTINGS_SCHEMA, false)
        })
    },

    /**
     * Create menu in top bar.
     */
    _createMenu: function() {
        let hiddenItems = this._settings.get_strv(GSETTINGS_HIDE_KEY)

        for (let item in Main.panel._statusArea) {
            // don't add myself
            if (item == EXTENSION_NAME)
                continue
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
        let hiddenItems = this._settings.get_strv(GSETTINGS_HIDE_KEY)

        if (hiddenItems.indexOf(item.statusAreaKey) == -1) {
            hiddenItems.push(item.statusAreaKey)
            this._settings.set_strv(GSETTINGS_HIDE_KEY, hiddenItems)
        }

        item.statusAreaItem.actor.hide()
    },

    /**
     * Show element and mark it as visible in settings.
     */
    _showItem: function (item) {
        let hiddenItems = this._settings.get_strv(GSETTINGS_HIDE_KEY)
        let index = hiddenItems.indexOf(item.statusAreaKey)

        while (index != -1) {
            hiddenItems.splice(index, 1)
            this._settings.set_strv(GSETTINGS_HIDE_KEY, hiddenItems)
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
    }
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
