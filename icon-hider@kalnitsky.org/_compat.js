/*
 * Copyright 2012 Igor Kalnitsky <igor@kalnitsky.org>
 *
 * This file is part of Icon Hider for Gnome Shell.
 *
 * Icon Hider is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Icon Hider is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Icon Hider Extension. If not, see <http://www.gnu.org/licenses/>.
 */

const Main = imports.ui.main;


function statusArea() {
    // for Gnome Shell 3.4
    if (Main.panel._statusArea)
        return Main.panel._statusArea;

    // for Gnome Shell > 3.4
    return Main.panel.statusArea;
}


function indicatorIcon() {
    // for Gnome Shell 3.4
    if (Main.panel._statusArea)
        return 'view-grid';

    // for Gnome Shell > 3.4
    return 'view-grid-symbolic';
}
