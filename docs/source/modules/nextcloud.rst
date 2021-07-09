.. _nextcloud:

Nextcloud
============

Nextcloud ist eine Cloudanwendung für Server. Vorteil von Nextcloud ist das die hochgeladenen Daten stets in unserem Datenbestand
bleiben und nicht irgendwo auf der Welt gespeichert werden.

Der erste Schritt für die Installation von Nextcloud ist die Einrichtung einer Datenbank, in dem Fall einer ``MariaDB``.

.. code-block:: none

    > sudo apt-get install mariadb-server mariadb-client
    > sudo systemctl stop mysql.service
    > sudo systemctl start mysql.service
    > sudo systemctl enable mysql.service
    > sudo mysql_secure_installation
    > sudo systemctl restart mysql.service

Als nächster Schritt müssen verschiedene Pakete aktualisiert werden.

.. code-block:: none

    > sudo apt-get install software-properties-common
    > sudo add-apt-repository ppa:ondrej/php
    > sudo apt update

Nextcloud der Version ``19.0.1`` braucht mindestens die die PHP-Verion ``7.1`` um richtig zu arbeiten. Dies müssen wir auch
installieren um dann im nachhinein die eigentlichen Pakete für Nextcloud herunterzuladen und zu installieren.

.. code-block:: none

    > sudo apt install php7.1-fpm php7.1-common php7.1-mbstring php7.1-xmlrpc php7.1-soap php7.1-apcu php7.1-smbclient php7.1-ldap php7.1-redis php7.1-gd php7.1-xml php7.1-intl php7.1-json php7.1-imagick php7.1-mysql php7.1-cli php7.1-mcrypt php7.1-ldap php7.1-zip php7.1-curl
    > sudo nano /etc/php/7.1/fpm/php.ini
    file_uploads = On
    allow_url_fopen = On
    memory_limit = 256M
    upload_max_filesize = 64M
    max_execution_time = 360
    cgi.fix_pathinfo = 0
    date.timezone = Europe/Berlin

Als Unterbau für Nextcloud ist es noch notwendig eine Datenbank zu erstellen und mit den richtigen Parametern auszustatten.

.. code-block:: none

    > sudo mysql -u root -p
    CREATE DATABASE nextcloud;
    CREATE USER 'nextclouduser'@'localhost' IDENTIFIED BY 'new_password_here';
    GRANT ALL ON nextcloud.* TO 'nextclouduser'@'localhost' IDENTIFIED BY 'user_password_here' WITH GRANT OPTION;
    FLUSH PRIVILEGES;
    EXIT;

Als letzten Schritt laden wir jetzt Nextcloud herunter und installieren es im gewünschen Ordner.

.. code-block:: none

    > cd /tmp && wget https://download.nextcloud.com/server/releases/nextcloud-19.0.1.zip
    > unzip nextcloud-19.0.1.zip
    > sudo mkdir /var/www/cloud && mv nextcloud /var/www/cloud/
    > sudo chown -R www-data:www-data /var/www/cloud/
    > sudo -u www-data php occ  maintenance:install --database "mysql" --database-name "nextcloud"  --database-user "nextclouduser" --database-pass "" --admin-user "vagrant" --admin-pass "password"

Jetzt ist es möglich Nutzer anzulegen, Dateien hochzuladen und diese zu speichern.
