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
const Lang = imports.lang;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;
const Convenience = Me.imports.convenience;
const Shell = imports.gi.Shell;

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
const Indicator = new Lang.Class({
    Name: 'Indicator',
    Extends: PanelMenu.Button,

    /**
     * Creates an actor object, which can be added to the status area,
     *
     * @constructor
     * @this {Indicator}
     * @param {string} icon an icon name
     */
    _init: function(icon) {
        this.parent(0.0, _config.EXTENSION_NAME);

        this.actor.add_actor(new St.Icon({
            icon_name: icon,
            style_class: 'popup-menu-icon'
        }));

        this._settings = Convenience.getSettings();
        this._createMenu();
    },

    /**
     * Creates menu for the Indicator. It will be popuped on RMB click.
     *
     * @private
     * @this {Indicator}
     */
    _createMenu: function() {
        let knownItems = this._settings.get_strv(_config.GSETTINGS_KNOWN);
        let hiddenItems = this._settings.get_strv(_config.GSETTINGS_HIDDEN);

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

        let settingsItem = new PopupMenu.PopupMenuItem(_('Settings'));
        settingsItem.connect('activate', Lang.bind(this, function() {
            var runPrefs = 'gnome-shell-extension-prefs ' + Me.metadata.uuid;
            Main.Util.trySpawnCommandLine(runPrefs);
        }));
        this.menu.addMenuItem(settingsItem);
    },

    /**
     * Hide element and mark it as hidden in gsettings.
     *
     * @private
     * @this {Indicator}
     * @param {object} item an item to hide
     */
    _hideItem: function (item) {
        let hiddenItems = this._settings.get_strv(_config.GSETTINGS_HIDDEN);

        if (hiddenItems.indexOf(item.statusAreaKey) == -1) {
            hiddenItems.push(item.statusAreaKey);
            this._settings.set_strv(_config.GSETTINGS_HIDDEN, hiddenItems);
        }
    },

    /**
     * Show element and mark it as visible in gsettings.
     *
     * @private
     * @this {Indicator}
     * @param {object} item an item to show
     */
    _showItem: function (item) {
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

function Extension() {
    this._init();
}

Extension.prototype = {
    _init: function() {
        this._indicator = null;
        this._settings = Convenience.getSettings();
        this._traymanager = new Shell.TrayManager();
        this._statusArea = Main.panel.statusArea;
    },

    enable: function() {
        // load visibility
        this._actorSignals = [];
        this._refreshIndicators();

        // create indicator
        this._indicator = new Indicator('view-grid-symbolic');
        Main.panel.addToStatusArea(_config.EXTENSION_NAME, this._indicator);


        // load utilities settings
        let isIndicatorShown = this._settings.get_boolean(_config.GSETTINGS_ISINDICATORSHOWN);

        isIndicatorShown
            ? this._indicator.actor.show()
            : this._indicator.actor.hide();

        // call `this._reloadSettings` if settings or tray icons was changed
        let reload = Lang.bind(this, this._reloadSettings);

        this._settingsId = this._settings.connect('changed::', reload);
        this._trayAddedId = this._traymanager.connect('tray-icon-added', reload);
        this._trayRemovedId = this._traymanager.connect('tray-icon-removed', reload);
    },

    /**
     * Clean-up:
     *   - restore icons' visibility
     *   - disconnect settings signal
     *   - destroy indicator
     */
    disable: function() {
        // disconnect global handlers
        this._settings.disconnect(this._settingsId);
        this._traymanager.disconnect(this._trayAddedId);
        this._traymanager.disconnect(this._trayRemovedId);

        // disconnect per-actor handlers
        for each (let signal in this._actorSignals)
            this._statusArea[signal['item']].actor.disconnect(signal['id']);

        // restore visibility
        let hiddenItems = this._settings.get_strv(_config.GSETTINGS_HIDDEN);
        for each (let item in hiddenItems)
            if (item in this._statusArea)
                this._statusArea[item].actor.show();

        // destroy extension indicator
        this._indicator.destroy();
        this._indicator = null;
    },

    /**
     * This function is called when settings are changed.
     */
    _reloadSettings: function() {
        this.disable();
        this.enable();
    },

    _refreshIndicators: function() {
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
                let signalId = this._statusArea[item].actor.connect(
                    'notify::visible',
                    Lang.bind(this, function(actor) {
                        actor.hide();
                    })
                );

                this._actorSignals.push({'id': signalId, 'item': item});
                this._statusArea[item].actor.hide()
            } else {
                this._statusArea[item].actor.show();
            }
        }

        if (isKnownItemsChanged)
            this._settings.set_strv(_config.GSETTINGS_KNOWN, knownItems);
    }
};


/**
 * Entry point.
 *
 * Should return an object with callable `enable` and `disable` properties.
 */
function init() {
    Convenience.initTranslations();
    return new Extension();
}
