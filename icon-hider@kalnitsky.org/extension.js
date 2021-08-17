/*
 * icon-hider@kalnitsky.org/extension.js
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *
 * The main module which implements an extension itself. It creates
 * indicator on the StatusArea and hides all disables items.
 *
 * This file is part of Icon Hider for GNOME Shell.
 *
 * @copyright 2012 by Igor Kalnitsky <igor@kalnitsky.org>
 * @license BSD, see LICENSE for details
 */

// extension root object
const Me = imports.misc.extensionUtils.getCurrentExtension();

// aliases for used modules
const St = imports.gi.St;
const GObject = imports.gi.GObject;
const Lang = imports.lang;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;
const Convenience = Me.imports.convenience;
const Shell = imports.gi.Shell;
const Util = imports.misc.util;

// gettext alias
const _ = imports.gettext.gettext;

// import internal modules
const _config = Me.imports._config;


/*
 * Indicator class.
 *
 * Creates an actor in the StatusArea panel. Provides menu for manipulating
 * visiblity of other icons.
 */
let Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {

    /**
     * Creates an actor object, which can be added to the status area,
     *
     * @constructor
     * @this {Indicator}
     * @param {string} icon an icon name
     */
    _init(icon) {
        super._init(0.0, _config.EXTENSION_NAME);

        this.add_actor(new St.Icon({
            icon_name: icon,
            style_class: 'popup-menu-icon'
        }));

        this._settings = Convenience.getSettings();
        this._createMenu();
    }

    /**
     * Creates menu for the Indicator. It will be popuped on RMB click.
     *
     * @private
     * @this {Indicator}
     */
    _createMenu() {
        let knownItems = this._settings.get_strv(_config.GSETTINGS_KNOWN);
        let hiddenItems = this._settings.get_strv(_config.GSETTINGS_HIDDEN);

        // create switchers list
        for (let item of knownItems) {
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

        let settingsItem = new PopupMenu.PopupMenuItem(_('Settings'));
        settingsItem.connect('activate', Lang.bind(this, function() {
            var runPrefs = ['gnome-shell-extension-prefs', Me.metadata.uuid];
            Util.spawn(runPrefs);
        }));
        this.menu.addMenuItem(settingsItem);
    }

    /**
     * Hide element and mark it as hidden in gsettings.
     *
     * @private
     * @this {Indicator}
     * @param {object} item an item to hide
     */
    _hideItem(item) {
        let hiddenItems = this._settings.get_strv(_config.GSETTINGS_HIDDEN);

        if (hiddenItems.indexOf(item.statusAreaKey) == -1) {
            hiddenItems.push(item.statusAreaKey);
            this._settings.set_strv(_config.GSETTINGS_HIDDEN, hiddenItems);
        }
    }

    /**
     * Show element and mark it as visible in gsettings.
     *
     * @private
     * @this {Indicator}
     * @param {object} item an item to show
     */
    _showItem(item) {
        let hiddenItems = this._settings.get_strv(_config.GSETTINGS_HIDDEN);
        let index = hiddenItems.indexOf(item.statusAreaKey);

        while (index != -1) {
            hiddenItems.splice(index, 1);
            this._settings.set_strv(_config.GSETTINGS_HIDDEN, hiddenItems);
            index = hiddenItems.indexOf(item.statusAreaKey);
        }
    }
});


/*
 * Extension definition.
 */
class Extension {
    constructor() {
        this._indicator = null;
        this._settings = Convenience.getSettings();
        this._traymanager = new Shell.TrayManager();
        this._statusArea = Main.panel.statusArea;
        this._actorSignals = [];
    }

    enable() {
        // load visibility
        this._refreshIndicators();

        // create indicator
        if (this._indicator === null) {
            this._indicator = new Indicator('view-grid-symbolic');
            Main.panel.addToStatusArea(_config.EXTENSION_NAME, this._indicator);
        }

        // call `this._reloadSettings` if settings or tray icons was changed
        let reload = Lang.bind(this, this._reloadSettings);

        this._settingsId = this._settings.connect('changed', reload);
        this._trayAddedId = this._traymanager.connect('tray-icon-added', reload);
        this._trayRemovedId = this._traymanager.connect('tray-icon-removed', reload);

        // load utilities settings
        let isIndicatorShown = this._settings.get_boolean(_config.GSETTINGS_ISINDICATORSHOWN);

        isIndicatorShown
            ? this._indicator.show()
            : this._indicator.hide();
    }

    /**
     * Clean-up:
     *   - restore icons' visibility
     *   - disconnect settings signal
     *   - destroy indicator
     */
    disable(destroy=true) {
        // disconnect global handlers
        this._settings.disconnect(this._settingsId);
        this._traymanager.disconnect(this._trayAddedId);
        this._traymanager.disconnect(this._trayRemovedId);

        // restore visibility
        let hiddenItems = this._settings.get_strv(_config.GSETTINGS_HIDDEN);
        for (let item of hiddenItems)
            if (item in this._statusArea)
                this._statusArea[item].show();

        // disconnect per-actor handlers
        for (let signal of this._actorSignals)
            this._statusArea[signal['item']].disconnect(signal['id']);

        if (destroy) {
            // destroy extension indicator
            this._indicator.destroy();
            this._indicator = null;
        }
    }

    /**
     * This function is called when settings are changed.
     */
    _reloadSettings() {
        this.disable(false);
        this.enable();
    }

    _refreshIndicators() {
        // load visibility
        let hiddenItems = this._settings.get_strv(_config.GSETTINGS_HIDDEN);
        let knownItems = this._settings.get_strv(_config.GSETTINGS_KNOWN);

        let isKnownItemsChanged = false;
        for (let item in this._statusArea) {
            // skip the extension indicator
            if (item === _config.EXTENSION_NAME)
                continue;

            // add to known icons (used by prefs.js and indicator)
            if (knownItems.indexOf(item) == -1) {
                knownItems.push(item);
                isKnownItemsChanged = true;
            }

            // set icon visibility
            if (hiddenItems.indexOf(item) != -1) {
                // hide actor after each visible updates
                let signalId = this._statusArea[item].connect(
                    'notify::visible',
                    Lang.bind(this, function(actor) {
                        actor.hide();
                    })
                );

                this._actorSignals.push({'id': signalId, 'item': item});
                this._statusArea[item].hide()
            } else {
                this._statusArea[item].show();
            }
        }

        if (isKnownItemsChanged)
            this._settings.set_strv(_config.GSETTINGS_KNOWN, knownItems);
    }
}


/**
 * Entry point.
 *
 * Should return an object with callable `enable` and `disable` properties.
 */
function init() {
    Convenience.initTranslations();
    return new Extension();
}
