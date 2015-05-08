/*
 * icon-hider@kalnitsky.org/_compat.js
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *
 * Internal file with some helpers that is used to achieve compatibility.
 * This file is part of Icon Hider for GNOME Shell.
 *
 * @copyright 2014 by Igor Kalnitsky <igor@kalnitsky.org>
 * @license BSD, see LICENSE for details
 */


/**
 * The function returns a tray manager instance.
 */
function getTrayManager() {
    const Main = imports.ui.main;

    // various gnome versions have various tray keepers. let's find all
    // available tray keepers and then find tray manager instance among
    // them.
    let trayKeepers = [
        Main.legacyTray,                                 // GNOME Shell 3.16
        Main.notificationDaemon._fdoNotificationDaemon,  // GNOME Shell 3.14/3.12
        Main.notificationDaemon,                         // GNOME Shell 3.10
    ].filter(function (item) {
        return !!item;
    });

    // find first available tray manager instance
    return trayKeepers.filter(function (item) {
        return !!item._trayManager;
    })[0]._trayManager;
}
