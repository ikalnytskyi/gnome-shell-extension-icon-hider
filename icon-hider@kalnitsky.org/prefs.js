/*
 * icon-hider@kalnitsky.org/prefs.js
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *
 * This module implements a helper window which is duplicate an
 * extension's functionality with some additional util options.
 *
 * The module could be launched from the indicator's menu or
 * from the `gnome-tweak-tool` as the extension settings.
 *
 * This file is part of Icon Hider for GNOME Shell.
 *
 * @copyright 2012 by Igor Kalnitsky <igor@kalnitsky.org>
 * @license BSD, see LICENSE for details
 */

// extension root object
const Me = imports.misc.extensionUtils.getCurrentExtension();

// aliases for used modules
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const GObject = imports.gi.GObject;
const Convenience = Me.imports.convenience;

// gettext alias
const _ = imports.gettext.domain(Me.metadata['gettext-domain']).gettext;

// import settings module
const _config = Me.imports._config;


/**
 * SettingsWidget is a GTK widget, which displays extension's settings.
 * It includes the two tabs:
 *    - indicator tab;
 *    - util tab.
 */
const SettingsWidget = new GObject.Class({
    Name: 'IconHider.Prefs.SettingsWidget',
    GTypeName: 'IconHiderSettingsWidget',
    Extends: Gtk.Box,

    _init: function(params) {
        this.parent(params);
        this._settings = Convenience.getSettings();

        // build UI
        let notebook = new Gtk.Notebook();
        this._initShowHideIconsTab(notebook);
        this._initUtilitiesTab(notebook);
        this.add(notebook);
    },

    _initShowHideIconsTab: function(notebook) {
        let title = new Gtk.Label({label: _("Show/Hide icons")});
        let page = new Gtk.Grid({margin: 10, vexpand: true});

        let hiddenItems = this._settings.get_strv(_config.GSETTINGS_HIDDEN);
        let knownItems = this._settings.get_strv(_config.GSETTINGS_KNOWN);

        let row = 0;
        for each (let item in knownItems) {
            let switcher = new Gtk.Switch({active: (hiddenItems.indexOf(item) == -1)});
            switcher.item = item;

            switcher.connect('notify::active', Lang.bind(this, function (button) {
                let hiddenItems = this._settings.get_strv(_config.GSETTINGS_HIDDEN);

                if (button.active && hiddenItems.indexOf(button.item) != -1)
                    hiddenItems.splice(hiddenItems.indexOf(button.item), 1);

                if (!button.active && hiddenItems.indexOf(button.item) == -1)
                    hiddenItems.push(button.item);

                this._settings.set_strv(_config.GSETTINGS_HIDDEN, hiddenItems);
            }));

            // add row to switchers box
            page.attach(new Gtk.Label({
                label: item,
                hexpand: true,
                halign: Gtk.Align.START
            }), 0, row, 1, 1);
            page.attach(switcher, 1, row++, 1, 1);
        }

        notebook.append_page(page, title);
    },


    _initUtilitiesTab: function(notebook) {
        let title = new Gtk.Label({label: _("Utils")});
        let page = new Gtk.Grid({margin: 10, vexpand: true});

        // hide indicator switcher
        let isIndicatorShown = this._settings.get_boolean(_config.GSETTINGS_ISINDICATORSHOWN);
        let indicatorSwitcher = new Gtk.Switch({active: isIndicatorShown});
        indicatorSwitcher.connect('notify::active', Lang.bind(this, function (button) {
            this._settings.set_boolean(_config.GSETTINGS_ISINDICATORSHOWN, button.active)
        }));
        page.attach(indicatorSwitcher, 1, 0, 1, 1);
        page.attach(new Gtk.Label({
            label: _("Show extension's indicator"),
            hexpand: true,
            halign: Gtk.Align.START
        }), 0, 0, 1, 1);

        notebook.append_page(page, title);
    }
});


function init() {
    Convenience.initTranslations();
}


function buildPrefsWidget() {
    let widget = new SettingsWidget();
    widget.show_all();
    return widget;
}
