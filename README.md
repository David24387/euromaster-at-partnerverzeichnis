# EUROMASTER_AT-Partnerlandkarte

Die Karte wird im selben Repository stündlich durch `.github/workflows/sync-hubspot.yml` aus HubSpot aktualisiert und anschließend veröffentlicht. GitHub kann geplante Läufe verzögern.

Voraussetzung: Unter Settings → Secrets and variables → Actions muss das Repository-Secret `HUBSPOT_TOKEN` mit einem HubSpot Private-App-Token hinterlegt sein. Benötigt werden Leserechte für Unternehmen und deren Property-Definitionen. Schlüssel niemals in Dateien oder Chats eintragen.

Manuell starten: Actions → Sync public HubSpot partners → Run workflow.

Es werden ausschließlich aktive FRP/FRPL/EFR/PLP mit Public_Status = Public übernommen. Neue freigegebene Standorte kommen beim nächsten erfolgreichen Lauf hinzu; nicht mehr freigegebene oder inaktive Standorte entfallen. Veröffentlicht werden nur freigegebene Verzeichnisfelder. Interne Firmenfelder und Non-Public-Standorte sind ausgeschlossen.

Der Export aktualisiert daten.csv, standorte.json und export_status.json. Bei Export- oder Prüfungsfehlern bleibt der bisherige veröffentlichte Datenstand erhalten.

Website: https://david24387.github.io/euromaster-at-partnerverzeichnis/
