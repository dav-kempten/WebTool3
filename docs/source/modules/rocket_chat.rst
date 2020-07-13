.. _rocket_chat:

Rocket.Chat
============

Rocket.Chat ist ein umfassendes Online-Kommunikationstool, dass die Zusammenarbeit zwischen Sektionsmitgliedern und eine sichere Kommunikation ermöglichen soll.

Hierfür werden verschiedene Services benötigt:

* MongoDB_ 4.2
* RocketChat_
* nginx_

.. _MongoDB: https://www.mongodb.com/cloud/atlas/lp/try2?utm_source=google&utm_campaign=gs_emea_germany_search_brand_atlas_desktop&utm_term=mongodb&utm_medium=cpc_paid_search&utm_ad=e&gclid=EAIaIQobChMIsJniivOa6gIVUMayCh2jSQxSEAAYASAAEgIqkfD_BwE
.. _RocketChat: https://rocket.chat/de/
.. _nginx: https://www.nginx.com/

Als Erstes müssen wir auf unserem Ubunutu-Server NodeJs_ installieren:

.. _NodeJs: https://nodejs.org/de/

https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-16-04

NodeJs ist eine Laufzeitumgebung mit der sich Server betreiben lassen. Dabei ist NodeJs effizienter als vergleichbare Plattformen.

Zusätzlich brauchen für Rocket.Chat eine Datenbank. Dafür nehmen wir eine MongoDB, die wir unter Ubuntu auf folgende Weise installieren:

https://www.digitalocean.com/community/tutorials/how-to-install-mongodb-on-ubuntu-16-04

Ist npm schon installiert, brauchen wir eine stabile npm-Version:

.. code-block:: none

    > npm -v
    > npm install npm@6.13.4 -g
    > npm -v

npm dient zur Verwaltung der NodeJs-Pakete. Durch ``-g``, oder alternativ ``--global``, wird die gewählte npm-Version als globales Paket installiert.

Jetzt nutzen wir npm zum Update von NodeJs Version 12.14.0:

.. code-block:: none

    > sudo n 12.14.0

Durch das Update können wir alle notwendigen NodeJs-Pakete installieren, die für Rocket.Chat nötig sind.

Danach müssen wir uns um die MongoDB kümmern: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/

.. code-block:: none

    > wget -qO - https://www.mongodb.org/static/pgp/server-4.2.asc | sudo apt-key add -

Falls dieser Befehl scheitert müssen wir noch ``gnupg`` nachinstallieren und das Kommando nochmals ausführen.

.. code-block:: none

    > sudo apt-get install gnupg
    > wget -qO - https://www.mongodb.org/static/pgp/server-4.2.asc | sudo apt-key add -

Danach holen wir uns die Installationsverzeichnisse von MongoDB und installieren die nötigen Tools, checken ob die die
Log- & Lib-Verzeichnisse richtig angelegt wurden und starten den Service.

.. code-block:: none

    > echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.2.list
    > sudo apt-get update
    > sudo apt-get install -y mongodb-org
    > cd /var/lib/mongodb
    > cd /var/log/mongodb
    > sudo systemctl start mongod
    > sudo systemctl daemon-reload
    > sudo systemctl enable mongod

Zusätzlich ist es notwendig Rocket.Chat zu installieren. Das funktioniert wie folgt:

.. code-block:: none

    > curl -L https://releases.rocket.chat/latest/download -o /tmp/rocket.chat.tgz
    > tar -xzf /tmp/rocket.chat.tgz -C /tmp
    > cd /tmp/bundle/programs/server && npm install
    > sudo mv /tmp/bundle /var/www/chat
    > sudo chown -R rocketchat:rocketchat /var/www/chat
    > sudo service rocketchat start

Zuerst werden die entsprechenden Pakete für Rocket.Chat heruntergeladen, entpackt und installiert. Dann wird der
Rocket.Chat-Service nach kleineren Anpassungen wieder gestartet.

Die Installation, Konfiguration und Bereitstellung der Anwendung Rocket.Chat wird hier genauer beschrieben:

https://docs.rocket.chat/installation/manual-installation/ubuntu

Als ersten Schritt legen wir einen neuen User "rocketchat" an und blockieren dessen Zugang. Danach ändern wir den
Owner des Rocket.Chat-Ordners zu dem neu angelegten User.

.. code-block:: none

    > sudo useradd -M rocketchat && sudo usermod -L rocketchat
    > sudo chown -R rocketchat:rocketchat /var/www/chat

Zudem muss der Rocket.Chat-Service noch konfiguriert werden:

.. code-block:: none

    cat << EOF |sudo tee -a /lib/systemd/system/rocketchat.service
    [Unit]
    Description=The Rocket.Chat server
    After=network.target remote-fs.target nss-lookup.target nginx.target mongod.target
    [Service]
    ExecStart=/usr/local/bin/node /opt/Rocket.Chat/main.js
    StandardOutput=syslog
    StandardError=syslog
    SyslogIdentifier=rocketchat
    User=rocketchat
    Environment=MONGO_URL=mongodb://localhost:27017/rocketchat?replicaSet=rs01 MONGO_OPLOG_URL=mongodb://localhost:27017/local?replicaSet=rs01 ROOT_URL=http://localhost:3000/ PORT=3000
    [Install]
    WantedBy=multi-user.target
    EOF

Zudem muss die MongoDB noch konfiguriert werden. Folgende Zeilen müssen ``/lib/systemd/system/rocketchat.service`` hinzugefügt werden.

.. code-block:: none

    MONGO_URL=mongodb://localhost:27017/rocketchat?replicaSet=rs01
    MONGO_OPLOG_URL=mongodb://localhost:27017/local?replicaSet=rs01
    ROOT_URL=http://your-host-name.com-as-accessed-from-internet:3000
    PORT=3000

Dazu wird auch noch ``mongod.conf`` angepasst:

.. code-block:: none

    > sudo sed -i "s/^#  engine:/  engine: mmapv1/"  /etc/mongod.conf
    > sudo sed -i "s/^#replication:/replication:\n  replSetName: rs01/" /etc/mongod.conf
    > sudo systemctl enable mongod && sudo systemctl start mongod
    > mongo --eval "printjson(rs.initiate())"
    > sudo systemctl enable rocketchat && sudo systemctl start rocketchat

Als letzte Komponente ist es nötig nginx upzudaten.

.. code-block:: none

    > sudo apt-get --only-upgrade install nginx

nginx ist eine modulare Webserver-Software und unterstützt viele moderne Web-Services.

Zusätzlich zu nginx brauchen wir noch ein Echtzeit-Messaging-Modul. Hierzu nehmen wir das Paket rtmp:

.. code-block:: none

    > sudo apt-get install libnginx-mod-rtmp

Das Paket wird benötigt um das Streaming von Audio-, Foto- und Videodaten zu unterstützen.

Danach müssen wir Rocket.Chat noch auf dem Server bereitstellen. Dazu bauen wir einen Server unter ``nginx`` auf.

.. code-block:: none

    # HTTPS Server
    server {
        listen 443;
        server_name your_hostname.com;

        # You can increase the limit if your need to.
        client_max_body_size 200M;

        error_log /var/log/nginx/rocketchat.access.log;

        ssl on;
        ssl_certificate /etc/nginx/certificate.crt;
        ssl_certificate_key /etc/nginx/certificate.key;
        ssl_protocols TLSv1 TLSv1.1 TLSv1.2; # don’t use SSLv3 ref: POODLE

        location / {
            proxy_pass http://backend/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $http_host;

            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            proxy_set_header X-Nginx-Proxy true;

            proxy_redirect off;
        }
    }

Der nächste Punkt widmet sich mit dem Backup der MongoDB. Damit bei einem Verlust der Datenbank keine Chat-Daten verloren gehen
müssen wir regelmäßig ein Update erstellen. Dies funkioniert mittels:

.. code-block:: none

    > mongodump --db=<db_dump>

Mit ``mongodump`` können wir ein Backup einer kompletten MongoDB erstellen und müssen nicht einzelne Collections auswählen.

Möchten wir die Daten im Gegenzug wiederherstellen, gibt es für die MongoDB einen entsprechenden Befehl:

.. code-block:: none

    > mongorestore --drop --dir <folder_dump>

Zudem müssen die Konfigurations-Dateien gesichert werden...