.. _code:

Quellcode
=========
Der Quellcode des Webtools lässt sich drei grobe Bereiche einteilen:

1. Konfiguration
2. Frontend
3. Server

Die Konfiguration (Config-Module) definiert die Einstellungen des lokalen Servers und des Live-Systems. Hier liegen vor
allem die Konfigurationen für das Backend (Server-Module). Das Frontend-Module beinhaltet den Quellcode für das Frontend,
einer Angular-Applikation, die Daten des Backend darstellt und bearbeitbar macht. Das Backend (Server-Module) beinhaltet
den Quellcode für das Backend inklusive der REST-API.

.. toctree::
   :maxdepth: 2
   :caption: Module:

   config
   frontend
   server
