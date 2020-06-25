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

Als Erstes müssen wir auf unserem Ubunut-Server NodeJs_ installieren:

.. _NodeJs: https://nodejs.org/de/

https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-16-04

Zusätzlich brauchen für Rocket.Chat eine Datenbank. Dafür nehmen wir eine MongoDB, die wir unter Ubuntu auf folgende Weise installieren:

https://www.digitalocean.com/community/tutorials/how-to-install-mongodb-on-ubuntu-16-04

Die Installation, Konfiguration und Bereitstellung der Anwendung Rocket.Chat wird hier genauer Beschrieben:

https://www.digitalocean.com/community/tutorials/how-to-install-configure-and-deploy-rocket-chat-on-ubuntu-14-04

Ist npm schon installiert, brauchen wir eine stabile npm-Version:

.. code-block:: none

    > npm -v
    > npm install npm@6.13.4 -g
    > npm -v

npm dient zur Verwaltung der NodeJs-Pakete. Jetzt nutzen wir npm zum Update von NodeJs Version 12.14.0:

.. code-block:: none

    > sudo n 12.14.0

Zusätzlich ist es notwendig Rocket.Chat zu updaten. Das funktioniert wie folgt:

.. code-block:: none

    > sudo service rocketchat stop
    > sudo rm -rf /var/www/chat
    > curl -L https://releases.rocket.chat/2.4.11/download -o /tmp/rocket.chat.tgz
    > tar -xzf /tmp/rocket.chat.tgz -C /tmp
    > cd /tmp/bundle/programs/server && npm install
    > sudo mv /tmp/bundle /var/www/chat
    > sudo chown -R rocketchat:rocketchat /var/www/chat
    > sudo service rocketchat start

Als letzte Komponente ist es nötig nginx upzudaten.

.. code-block:: none

    > sudo apt-get --only-upgrade install nginx

Zusätzlich zu nginx brauchen wir noch ein Echtzeit-Messaging-Modul. Hierzu nehmen wir das Paket rtmp:

.. code-block:: none

    > sudo apt-get install libnginx-mod-rtmp