.. _installation:

Installation
============

Ubuntu unter Vagrant
--------------------

Grundlage: Virtualbox 5.1.22 | Vagrant 1.9.5 | ubuntu/xenial64 (Ubuntu 16.04.3 LTS)

.. code-block:: none

    > vagrant init "ubuntu/xenial64"
    > vagrant up
    > vagrant ssh
    > sudo apt-get update
    > sudo apt-get upgrade

Normalerweise passen die "VirtualBox" und die im Linux installierten "VBoxGuestAdditions" nicht zusammen.
Also wird ein Update fällig.

.. code-block:: none

    > sudo apt-get install build-essential module-assistant
    > sudo m-a prepare
    > sudo apt-get install linux-headers-$(uname -r)
    > sudo shutdown -h now

Download: `VBoxGuestAdditions.iso <http://download.virtualbox.org/virtualbox/5.1.22/VBoxGuestAdditions_5.1.22.iso>`_

Die virtuelle "CD" (Das Image ``VBoxGuestAdditions.iso``) wird in das virtuelle CD-ROM-Laufwerk des Linux Systems "eingelegt".

.. code-block:: none

    > sudo -i
    > mount /dev/cdrom /mnt
    > cd /mnt
    > sh VBoxLinuxAdditions.run
    > shutdown -h now

Nach dieser Aktion kann die virtuelle "CD" aus dem virtuellen CD-ROM-Laufwerk des Linux Systems entfernt.

Prüfung
-------

.. code-block:: none

    > sudo lsb_release -a

Lokalisierung
-------------

Für den Betrieb ist ein Locale_ mit der Bezeichnung ``de_DE.utf8`` notwendig.

.. _Locale: https://de.wikipedia.org/wiki/Locale

.. code-block:: none

    > locale -a

Wenn das Gewünschte nicht auftaucht:

.. code-block:: none

    > sudo locale-gen de_DE.utf8

Python 3.6
----------

``Python 3.6`` ist ein wesentlicher Grundbaustein für unser Project. Da es noch nicht zur Grundaustattung
von unsrer Ubuntuversion gehört ist ein ``Build and Installation from Scratch`` fällig.

.. code-block:: none

    > sudo apt-get install build-essential libssl-dev libffi-dev python-dev checkinstall
    > sudo apt-get install libreadline-gplv2-dev libncursesw5-dev libssl-dev libsqlite3-dev tk-dev libgdbm-dev libc6-dev libbz2-dev
    > wget https://www.python.org/ftp/python/3.6.3/Python-3.6.3.tar.xz
    > tar xvf Python-3.6.3.tar.xz
    > cd Python-3.6.3
    > ./configure --enable-optimizations
    > sudo -H make altinstall

Unser Python Intepreter kann dann über ``python3.6`` aufgerufen werden. Weitere Pakete werden dann über ``pip3.6 install`` installiert.

GEOS 3.6.2
----------

.. code-block:: none

    > sudo apt-get install swig
    > wget http://download.osgeo.org/geos/geos-3.6.2.tar.bz2
    > tar xvf geos-3.6.2.tar.bz2
    > cd geos-3.6.2
    > ./configure --enable-python
    > make
    > make check
    > sudo -H make install
    > sudo ldconfig

proj.4
------

.. code-block:: none

    > sudo apt-get install unzip
    > wget http://download.osgeo.org/proj/proj-4.9.2.tar.gz
    > tar xvf proj-4.9.2.tar.gz
    > cd proj-4.9.2/nad
    > wget http://download.osgeo.org/proj/proj-datumgrid-1.6.zip
    > unzip proj-datumgrid-1.6.zip
    > cd ..
    > ./configure
    > make
    > make check
    > sudo -H make install
    > sudo ldconfig

OpenJPEG
--------

.. code-block:: none

    > sudo apt-get install liblcms2-dev  libtiff-dev libpng-dev libz-dev
    > sudo apt-get install unzip
    > sudo apt-get install cmake
    > wget https://github.com/uclouvain/openjpeg/archive/v2.3.0.zip
    > unzip v2.3.0.zip
    > cd openjpeg-2.3.0
    > mkdir build
    > cd build
    > cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/usr/local -DCMAKE_C_FLAGS="-O3 -march=native -DNDEBUG" ..
    > make
    > sudo -H make install
    > sudo ldconfig

GDAL
----

.. code-block:: none

    > wget http://download.osgeo.org/gdal/2.2.3/gdal-2.2.3.tar.xz
    > tar xvf gdal-2.2.3.tar.xz
    > cd gdal-2.2.3
    > LDFLAGS="-s" ./configure --with-ecw=no --with-geos=yes --with-python --with-threads=yes --without-grass --without-ogdi
    > make
    > sudo -H make install
    > sudo ldconfig

postgresql
----------
Die zugrunde liegende Datenbank wird vom DBMS ``PostgreSQL`` (kurz Postgres) verwaltet. Postgres ist mit Django
kompatibel und ermöglicht die Verwaltung relationaler Datenbanken im SQL-Format.

.. code-block:: none

    > sudo add-apt-repository "deb http://apt.postgresql.org/pub/repos/apt/ xenial-pgdg main"
    > wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
    > sudo apt-get update
    > sudo apt-get install postgresql-9.6 postgresql-contrib-9.6 postgresql-9.6-postgis-2.3

.. code-block:: none

    > sudo su - postgres
    > createuser sammy -D -R -S -P
    > createdb -O djcode copernicus
    > psql copernicus
    # CREATE EXTENSION postgis;
    # \q
    > exit

Python Packages
---------------
Für die Bereitstellung des Backends benötigen wir noch verschiedene Python-Pakete. Django ist ein quelloffenes Webframework
mit dem sich die Daten verwalten lassen und das eine eigene RESTful API anbietet.

.. code-block:: none

    > sudo -H pip3.6 install psycopg2
    > sudo -H pip3.6 install requests
    > sudo -H pip3.6 install django

.. code-block:: none

    > auto-apt run ./configure
    > make
    > sudo checkinstall

Grundlegende Vorbereitungen
---------------------------
See: `Initial Server Setup <https://www.digitalocean.com/community/tutorials/initial-server-setup-with-ubuntu-16-04>`__ &
`How to add and delete Users <https://www.digitalocean.com/community/tutorials/how-to-add-and-delete-users-on-ubuntu-16-04>`__ &
`How do i disable ssh login for the root user <https://mediatemple.net/community/products/dv/204643810/how-do-i-disable-ssh-login-for-the-root-user>`__

Benutzer und Zugang über ssh einrichten
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Für den Zugang per SSH muss ein Nutzer angelegt werden. Dieser Nutzer muss noch in der Gruppe ``sudo`` aufgenommen werden.
Nutzer in der Gruppe ``sudo`` können Kommandos mit Root-Rechten ausführen. Zudem sollte die Authetifizierung mittels
Passwort aktiviert werden.

.. code-block:: none

    > sudo -i
    # adduser sammy
    # usermod -aG sudo sammy
    # vim /etc/ssh/sshd_config

    -> PasswordAuthentication yes

    # systemctl reload sshd
    # exit
    > exit

Auf dem lokalen Rechner:

.. code-block:: none

    > ssh-copy-id sammy@your_server_ip
    > ssh sammy@your_server_ip

Zurück auf dem Server:

.. code-block:: none

    > sudo vim /etc/ssh/sshd_config

    -> PasswordAuthentication no
    -> PubkeyAuthentication yes
    -> ChallengeResponseAuthentication no
    -> PermitRootLogin no

    > sudo systemctl reload sshd

Firewall installieren und aktivieren
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See: `How to set up a firewall with ufw <https://www.digitalocean.com/community/tutorials/how-to-set-up-a-firewall-with-ufw-on-ubuntu-16-04>`__

.. code-block:: none

    > how-to-set-up-a-firewall-with-ufw
    > sudo vim /etc/default/ufw

    -> IPV6=yes

    > sudo ufw default deny incoming
    > sudo ufw default allow outgoing
    > sudo ufw allow ssh
    > sudo ufw enable

Zeitsynchronisation
~~~~~~~~~~~~~~~~~~~

See: `How to set up Time Synchronization <https://www.digitalocean.com/community/tutorials/how-to-set-up-time-synchronization-on-ubuntu-16-04>`__ &
`How to configure ntp for use in the Ntp Pool Project <https://www.digitalocean.com/community/tutorials/how-to-configure-ntp-for-use-in-the-ntp-pool-project-on-ubuntu-16-04>`__

.. code-block:: none

    > sudo dpkg-reconfigure tzdata
    > sudo timedatectl
    > sudo timedatectl set-ntp no
    > sudo apt-get install ntp
    > sudo ntpq -p

NGINX
~~~~~
NGINX ist eine freie, quelloffene Webserver-Engine um HTTP-Server und Reverse Proxys aufzusetzen. Die folgenden Links
dienen zur Installation und Konfiguration von NGINX-Services unter Ubuntu:

* `How To Install Nginx <https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-ubuntu-16-04>`__
* `Config Pitfalls <https://www.nginx.com/resources/wiki/start/topics/tutorials/config_pitfalls/>`__
* `How to install an SSL Certificate from a commercial Certificate Authority <https://www.digitalocean.com/community/tutorials/how-to-install-an-ssl-certificate-from-a-commercial-certificate-authority>`__
* `Where to store SSL certificates on a Linux server <https://www.getpagespeed.com/server-setup/ssl-directory>`__
* `nginx SSL PEM_read_bio:bad end line <http://www.ur-ban.com/2010/12/09/nginx-ssl-pem_read_biobad-end-line/>`__
* `Implementing SSL Perfect Forward Secrecy in NGINX Web-Server <https://www.howtoforge.com/ssl-perfect-forward-secrecy-in-nginx-webserver>`__
* `How to set up NGINX with http 2 support <https://www.digitalocean.com/community/tutorials/how-to-set-up-nginx-with-http-2-support-on-ubuntu-16-04>`__
* `How to increase Pagespeed Score by changing your NGINX Configuration <https://www.digitalocean.com/community/tutorials/how-to-increase-pagespeed-score-by-changing-your-nginx-configuration-on-ubuntu-16-04>`__
* `How to upgrade NGINX in place without dropping Client Connections <https://www.digitalocean.com/community/tutorials/how-to-upgrade-nginx-in-place-without-dropping-client-connections>`__
* `Creating NGINX Rewrite Rules <https://www.nginx.com/blog/creating-nginx-rewrite-rules/>`__
* `How to configure Nginx so you can quickly put your website into maintenance mode <https://www.calazan.com/how-to-configure-nginx-so-you-can-quickly-put-your-website-into-maintenance-mode/>`__

.. code-block:: none

    > sudo apt-get install nginx
    > sudo ufw allow 'Nginx Full'
    > sudo ufw status
    > systemctl status nginx

Cerbot
~~~~~~
Cerbot dient dazu eine vorhandene HTTP-Website durch ein ``Let's Encrypt``-Zertifikat in eine HTTPS-Website umzuwandeln.
Für den Cerbot braucht man eine vorhandene HTTP-Website und SSH-Zugriff auf den darunterliegenden Server.

See: `How to secure NGINX with Let's encrypt <https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-16-04>`__

.. code-block:: none

    > sudo apt-get install software-properties-common python-software-properties
    > sudo add-apt-repository ppa:certbot/certbot
    > sudo apt-get update
    > sudo apt-get install python-certbot-nginx
    > sudo vim /etc/nginx/sites-available/default

    -> server_name example.com www.example.com;

    > sudo nginx -t
    > sudo systemctl reload nginx
    > sudo certbot --nginx -d example.com -d www.example.com

..
    IMPORTANT NOTES:
     - Congratulations! Your certificate and chain have been saved at:
       /etc/letsencrypt/live/alpinexplorer.eu/fullchain.pem
       Your key file has been saved at:
       /etc/letsencrypt/live/alpinexplorer.eu/privkey.pem
       Your cert will expire on 2018-03-01. To obtain a new or tweaked
       version of this certificate in the future, simply run certbot again
       with the "certonly" option. To non-interactively renew *all* of
       your certificates, run "certbot renew"
     - Your account credentials have been saved in your Certbot
       configuration directory at /etc/letsencrypt. You should make a
       secure backup of this folder now. This configuration directory will
       also contain certificates and private keys obtained by Certbot so
       making regular backups of this folder is ideal.

Django
~~~~~~
Django ist ein in Python geschriebenes, quelloffenes Webframework, das einem Model-View-Presenter-Schema folgt. Um
gemeinsam mit ``NGINX`` zu funktionieren braucht es bestimmte Konfigurationen seitens des Servers und dessen Module.

See: `Automatic Maintenance Page for NGINX+Django <http://www.djangocurrent.com/2015/12/automatic-maintenance-page-for.html>`__ &
`How to Scale Django: Beyond the Basics <https://www.digitalocean.com/community/tutorials/how-to-scale-django-beyond-the-basics>`__

Varnish
~~~~~~~
Varnish ist ein Cache für dynamische Webseiten mit viel Inhalt. Im Gegensatz zu anderen Reverse-Proxys, die häufig aus
clientseitigen Proxys oder aus Servern entstanden, wurde Varnish von Grund auf als Reverse-Proxy konzipiert. Aufgrunddessen
lassen sich mit Varnish viele Performance-Probleme lösen, da die Requests nicht an die Django-Instanz an sich gehen, sondern
an den vorgeschalteten Varnish-Cache.

See: `How To Configure Varnish Cache 4.0 with SSL Termination on Ubuntu 14.04 <https://www.digitalocean.com/community/tutorials/how-to-configure-varnish-cache-4-0-with-ssl-termination-on-ubuntu-14-04>`__ &
`Varnish caching for unauthenticated Django views <http://chase-seibert.github.io/blog/2011/09/23/varnish-caching-for-unauthenticated-django-views.html>`__


TeXLive
~~~~~~~
Für die Erstellung flexbiler PDF-Dokumente nutzen wir ``TeXLive``, eine Distribution von ``TeX``. ``TeX`` ist eine
Programmiersprache, die eigens dafür entwickelt wurde schöne, einheitliche Dokumente aus zugrundliegenden Quellcode
zu erstellen.

.. code-block:: none

    > mkdir install-tl && cd install-tl
    > wget -O - -- http://mirror.ctan.org/systems/texlive/tlnet/install-tl-unx.tar.gz | tar xzf - --strip-components=1
    > sudo -s
    # apt install tex-common texinfo equivs perl-tk perl-doc
    # ./install-tl

* Menüpunkt „Options“ wählen: O
* Menüpunkt „create symlinks in standard directories“ wählen: L
* Die drei darauf folgenden Anfragen für Pfadänderungen mit Enter bestätigen (also die Vorgaben annehmen)
* Zurück ins Hauptmenu: R
* Falls nicht alle Sprachen unterstützt werden sollen (z.B., um Speicherplatz zu sparen), kann man Sprachen im
  Untermenu C an-/abwählen
* Im Menü des Installationsscripts kann außerdem festgelegt werden, dass nicht die volle
  TeX Live-Distribution (2,5 GiB) installiert werden soll, sondern nur eine kleinere Untermenge von Paketen
* Schließlich, zum Installieren: I
* Root-Zugang beenden und den Installationsordner löschen:

.. code-block:: none

    # exit
    > cd .. && rm -ir install_tl

.. code-block:: none

    > sudo apt-get install poppler-utils

RabbitMQ
~~~~~~~~
RabbitMQ ist eine Open Source Message Broker Software, die das Advanced Message Queuing Protocol implementiert. RabbitMQ
verwaltet die alle zugehörigen Queues, Buffer und Signale.

Öffentliche Schlüssel für die neuen Repositories zur Packetverwaltung hinzufügen:

.. code-block:: none

    > wget -O - "https://github.com/rabbitmq/signing-keys/releases/download/2.0/rabbitmq-release-signing-key.asc" | sudo apt-key add -

Erlang und RabbitMQ Repositiories anmelden:

.. code-block:: none

    > sudo tee /etc/apt/sources.list.d/bintray.rabbitmq.list <<EOF
    deb https://dl.bintray.com/rabbitmq-erlang/debian xenial erlang-19.3.x
    deb https://dl.bintray.com/rabbitmq/debian xenial main
    EOF

RabbitMQ Server installieren:

.. code-block:: none

    > sudo apt-get update
    > sudo apt-get install rabbitmq-server

Quellen:

* http://www.rabbitmq.com/install-debian.html
* https://www.digitalocean.com/community/tutorials/how-to-install-and-manage-rabbitmq
* https://tecadmin.net/install-rabbitmq-server-on-ubuntu/


* http://www.rabbitmq.com/configure.html
* http://www.rabbitmq.com/production-checklist.html

.. code-block:: none

    > sudo rabbitmqctl delete_user guest
    > sudo service rabbitmq-server restart

dramatiq
~~~~~~~~
Dramatiq ist eine Background-Task Bibliothek für Python. Dramatiq kann zusammen mit RabbitMQ für Messages genutzt werden,
die im Hintergrund verschickt werden sollen.

https://dramatiq.io/v1.4.0/index.html

.. code-block:: none

    > sudo -H pip3.6 install -U 'dramatiq[rabbitmq, watch]'
