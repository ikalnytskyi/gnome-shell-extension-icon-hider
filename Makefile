#
# Copyright 2012 Igor Kalnitsky <igor@kalnitsky.org>
#
# This file is part of Icon Hider for Gnome Shell.
#
# Program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with Program.  If not, see <http://www.gnu.org/licenses/>.
#

# installation helpers
PREFIX=${DESTDIR}/usr/share
INSTALLPATH=${PREFIX}/gnome-shell/extensions/

# package helpers
PACKAGE=gnome-shell-extension-icon-hider
VERSION=1.0
ARCHIVE=${PACKAGE}_${VERSION}.orig.tar.gz


# print usage info when make without arguments
_start: help


# install extension
install:
	mkdir -p ${INSTALLPATH}
	cp -r icon-hider@kalnitsky.org/ ${INSTALLPATH}


# build debian package
deb:
	tar -cvzf ../${ARCHIVE} .
	debuild -us -uc


# print usage info
help:
	@echo 'Icon Hider for Gnome Shell                        '
	@echo '                                                  '
	@echo 'Usage:                                            '
	@echo '   make install        install extension          '
	@echo '   make deb            build debian package       '
	@echo '   make help           show this tip              '
	@echo '                                                  '


.PHONY: help install deb clean
