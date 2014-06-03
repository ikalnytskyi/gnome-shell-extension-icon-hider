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

    let notificationDaemon = Main.notificationDaemon._fdoNotificationDaemon
        ? Main.notificationDaemon._fdoNotificationDaemon    // GNOME Shell 3.12
        : Main.notificationDaemon                           // GNOME Shell 3.10
    ;

    // default: GNOME Shell 3.12 case
    return notificationDaemon._trayManager;
}
