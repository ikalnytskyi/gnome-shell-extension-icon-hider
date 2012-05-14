/*
 * Icon Manager extension for Gnome Shell.
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
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;

// global consts
const EXTENSION_NAME = 'Icon Manager';


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

    _init: function() {
        PanelMenu.SystemStatusButton.prototype._init.call(this,
            'edit-select-all-symbolic', null);
        this._createMenu();
    },

    _createMenu: function() {
        for (let item in Main.panel._statusArea) {
            // don't add myself
            if (item == EXTENSION_NAME)
                continue;

            // create menu item
            let menuItem = new PopupMenu.PopupSwitchMenuItem(item, true);
            menuItem.connect('toggled', this._toggleItem);
            this.menu.addMenuItem(menuItem);

            // add reference to real status area item.
            // this ref need for access to actor
            menuItem['statusAreaItem'] = Main.panel._statusArea[item];
        }
    },

    // show/hide statusarea's item
    _toggleItem: function(menuItem) {
        if (menuItem.state)
            menuItem.statusAreaItem.actor.show();
        else
            menuItem.statusAreaItem.actor.hide();
    },

    _showStatusAreaItems: function() {
        for (let item in Main.panel._statusArea)
            Main.panel._statusArea[item].actor.show();
    }
};


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
