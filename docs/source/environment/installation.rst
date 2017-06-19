.. _installation:

Installation
============

Ubuntu unter Vagrant
--------------------

Grundlage: Virtualbox 5.1.22 | Vagrant 1.9.5 | ubuntu/trusty32 (Ubuntu 14.04.5 LTS)

.. code-block:: none

    > vagrant init "ubuntu/trusty32"
    > vagrant up
    > vagrant ssh
    > sudo apt-get update
    > sudo apt-get upgrade

Normalerweise passen die Virtualbox und die im Linux installierten "VBoxGuestAdditions" nicht zusammen.
Also wird ein Update fällig.

.. code-block:: none

    > sudo apt-get install build-essential module-assistant
    > sudo m-a prepare
    > sudo apt-get install linux-headers-$(uname -r)

Download: `VBoxGuestAdditions.iso <http://dwnload.virtualbox.org/virtualbox/5.1.0/VBoxGuestAdditions_5.1.0.iso>`_

Die virtuelle "CD" (Das Image ``VBoxGuestAdditions.iso``) wird in das virtuelle CD-ROM-Laufwerk des Linux Systems "eingelegt".

.. code-block:: none

    > sudo -i
    > mount /dev/cdrom /mnt
    > cd /mnt
    > sh VBoxLinuxAdditions.run
    > shutdown -h now

Für den Betrieb ist ein Locale_ mit der Bezeichnung ``de_DE.utf8`` notwendig.

.. _Locale: https://de.wikipedia.org/wiki/Locale

.. code-block:: none

    > locale -a

Wenn das Gewünschte nicht auftaucht:

.. code-block:: none

    > locale-gen de_DE.utf8


