Icon Hider for Gnome Shell
==========================

**Icon Hider** is a `Gnome Shell`_ extension for managing *status area* items.
This extension create a special menu by which you can change visibility of
desired item.

    **NOTE:** This extension can't hide 'battery' icon, because last one
    has a very ugly design with strange behaviour.

.. image:: http://i.imm.io/sklW.png


Requirements
------------

**Icon Hider** require *gnome-shell 3.4* or higher. This is due to the fact that
the extension uses the *settings api* which introduced in *gnome-shell 3.4*.


Installation
------------

#. Clone repository.
#. Place or link ``icon-hider@kalnitsky.org`` directory to
   ``~/.local/share/gnome-shell/extensions/``.
#. Activate extension via ``gnome-tweak-tool``.

Info
----

* **Author:** Igor Kalnitsky <igor@kalnitsky.org>
* **License:** GNU GPL v3
* **Version:** 0.1

.. _`Gnome Shell`: http://live.gnome.org/GnomeShell
