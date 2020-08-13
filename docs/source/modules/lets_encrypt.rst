.. _lets_encrypt:

Let's encrypt
==============

Das Webtool benötigt ein vertrauenswürdiges Zertifikat um darauf zugreifen zu können. Dafür nutzen wir ein Zertifikat von **Let's encrypt**.
Dieses Zertifikat muss eingebunden werden und dafür nutzen wir ``acme.sh``. Die offizielle Dokumentation ist hier zu finden:

https://github.com/acmesh-official/acme.sh/tree/2.8.0

Mit Hilfe des Shell-Scripts werden die Zertifikate dann eingebunden.

.. code-block:: none

    > acme.sh --issue -d dav-ke.info -w  /var/www/letsencrypt
    > acme.sh --issue -d webtool.dav-kempten.de -w  /var/www/letsencrypt
    > acme.sh --issue -d dav-cloud.de -d imap.dav-cloud.de -d pop3.dav-cloud.de -d smtp.dav-cloud.de -d wmts.dav-cloud.de -d chat.dav-cloud.de -d hls.dav-cloud.de -w  /var/www/letsencrypt

Nachdem die Zertifkate eingebunden wurden, werden diese alle 60 Tage erneuert.
