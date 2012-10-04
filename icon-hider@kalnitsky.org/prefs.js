/** Credit:
 *  based on prefs.js from the gnome shell window-button extensions repository at
 *  https://github.com/biox/Gnome-Shell-Window-Buttons-Extension
 */

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Params = imports.misc.params;

const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
let extensionPath = Me.path;

/*
 * https://live.gnome.org/GnomeShell/Extensions saying:
 * Beyond that, a function named init may also be provided, and will be invoked after the file is loaded but before buildPrefsWidget is invoked.
 */

function init() {
}

/*
 * Preferences widget class
 */

const IconHiderPrefsWidget = new GObject.Class({
    Name: 'IconHider.Prefs.Widget',
    GTypeName: 'IconHiderPrefsWidget',
    Extends: Gtk.Grid,

    _init: function (params) {
        this.parent(params);
        this.margin = this.row_spacing = this.column_spacing = 10;
         this._rownum = 0;
        this._settings = Convenience.getSettings();

        let visibleIcons = this._settings.get_strv('seen-icons');
        let hiddenIcons = this._settings.get_strv('hided-icons');

        for(let i=0; i < visibleIcons.length; i++) {
            let icon = visibleIcons[i];
            let iconSwitch = new Gtk.Switch({active: (hiddenIcons.indexOf(icon) == -1)});
            iconSwitch.connect('notify::active', Lang.bind(this, function(button) {
                if (button.active) {
                    // remove icon from hidden
                    if (hiddenIcons.indexOf(icon) != -1) {
                        hiddenIcons.splice(hiddenIcons.indexOf(icon), 1);
                    }
                } else {
                    // hide icon
                    if (hiddenIcons.indexOf(icon) == -1) {
                        hiddenIcons.push(icon);
                    }
                }
                this._settings.set_strv('hided-icons', hiddenIcons);

                global.log("*** notify::active: " + button.active + " - " + icon);
            }));

            this.addRow(icon, iconSwitch);
        }
    },

    addBoolean: function (text, key) {
        let item = new Gtk.Switch({active: true});
//        let item = new Gtk.Switch({active: this._settings.get_boolean(key)});
//        this._settings.bind(key, item, 'active', Gio.SettingsBindFlags.DEFAULT);
        return this.addRow(text, item);
    },

    addRow: function (text, widget, wrap) {
        let label = new Gtk.Label({
            label: text,
            hexpand: true,
            halign: Gtk.Align.START
        });
        label.set_line_wrap(wrap || false);
        this.attach(label, 0, this._rownum, 1, 1); // col, row, colspan, rowspan
        this.attach(widget, 1, this._rownum, 1, 1);
        this._rownum++;
        return widget;
    }

});

function buildPrefsWidget() {
    let widget = new IconHiderPrefsWidget();
    widget.show_all();

    return widget;
}
