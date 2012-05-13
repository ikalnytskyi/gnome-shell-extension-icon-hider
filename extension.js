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

const St = imports.gi.St;
const Main = imports.ui.main;
const Lang = imports.lang;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;


function IconManagerExtension() {
    this._init();
}

IconManagerExtension.prototype = {
    __proto__: PanelMenu.SystemStatusButton.prototype,

    _init: function() {
        PanelMenu.SystemStatusButton.prototype._init.call(this,
            'edit-select-all-symbolic');

        this._myItem = new PopupMenu.PopupMenuItem('Item #1');
        this.menu.addMenuItem(this._myItem);
    },

    _createMenu: function() {

        this._menuItems = [];
        this._menuItems[0] = new PopupMenu.PopupSwitchMenuItem('Item #1');
        //this._killSwitch.connect('toggled', Lang.bind(this, this._toggleDaemon));
    },

    enable: function() {
        Main.panel._rightBox.insert_actor(this.actor, 0);
    },

    disable: function() {
        Main.panel._rightBox.remove_actor(this.actor);
    }
};


function init() {
    return new IconManagerExtension();
}
