# BeifußKompass für Android

Ein offline nutzbarer Lebensmittelführer mit Schwerpunkt **Beifuß-Kreuzallergie**. Eigene Lebensmittel, Zutatenlisten, alternative Suchbegriffe, persönliche Erfahrungen und ärztliche Aussagen lassen sich ergänzen. Keine Registrierung, Werbung, Tracker oder Datenübertragung.

## Installation

1. In diesem Repository **Actions → Android APK und Prüfungen** öffnen.
2. Den neuesten erfolgreichen Lauf für `main` wählen.
3. Unter **Artifacts** `BeifussKompass-Android-APK` herunterladen und die ZIP entpacken.
4. `BeifussKompass-1.0.0.apk` auf dem Android-Gerät öffnen. Falls nötig, die Installation aus dieser Quelle für den verwendeten Dateimanager erlauben.

Android **8.0 oder neuer** und eine aktuelle Android System WebView werden benötigt. Es handelt sich um eine persönlich installierbare, mit einer Entwicklungssignatur signierte APK, keine Play-Store-Veröffentlichung. Die CI bewahrt den Entwicklungsschlüssel über einen Cache auf; bei Verlust dieses Caches kann ein späteres APK eine Neuinstallation erfordern. **Vorher die persönlichen Daten exportieren.**

## Funktionen

- 163 redaktionelle Einträge, darunter 24 ausdrücklich als Beispielrezepturen gekennzeichnete Gerichte; hunderte deutsche und englische Suchbegriffe, Umlaute und einfache Tippfehlertoleranz.
- Suche nach Lebensmitteln oder Gerichten, etwa **Chicken Nuggets**, Pfeffer, Brot, Selleriesalz oder Tahin.
- Separate Anzeige von berichteten ärztlichen Gruppenverboten, möglichem Beifuß-Bezug und persönlichen Markierungen.
- Persönliche Einordnung für **roh, gekocht, gebacken/gebraten, geröstet, getrocknet/gemahlen und fermentiert**. Eine gekochte Verträglichkeit wird nicht auf roh übertragen.
- **Zutatencheck** für eingefügte aktuelle Zutatenlisten: erkennt bekannte Begriffe, aktive Regeln, mögliche Spuren sowie Sammelbegriffe wie „Gewürze“. Ein Gerichtname allein ist keine bestätigte Zutatenliste.
- Eigene Produkte und Rezepturen anlegen/bearbeiten/löschen, Suchbegriffe hinzufügen, Zutaten prüfen, Favoriten, Notizen und Datumsangaben.
- Geschmackliche und ernährungsbezogene Alternativen, mit besonderem Artikel zu **Pfeffer**. Auch Alternativen behalten ihre persönliche Einordnung.
- Hell-/Dunkeldarstellung, große Bedienelemente, responsive Oberfläche, Android-Zurück-Unterstützung.
- JSON-Sicherung und Wiederherstellung über den Android-Dateidialog; Textübersicht über den Android-Teilen-Dialog. Teilen erfolgt ausschließlich auf ausdrückliche Aktion innerhalb der App.

## Ausgangslage und Bedeutung der Kennzeichnungen

Die Voreinstellung bildet die übermittelte Schilderung ab: Neurodermitis, Beifuß-Kreuzallergie, zusätzliche Baum-/Gräserpollenallergien, pauschal berichtete Verbote für Obst, Gemüse, Nüsse, Saaten/Samen, Kräuter und Gewürze sowie ausdrücklich Pfeffer. **Ein Befund und die individuellen Lebensmittelallergene liegen nicht vor.** Diese Gruppenangaben sind deshalb keine von der App bestätigten Allergiediagnosen.

| Anzeige | Bedeutung |
| --- | --- |
| Zu meiden / ärztlich ausgeschlossen | Aktive berichtete Vorgabe oder persönliche Unverträglichkeits-/Verbotsmarkierung. |
| Vorsicht / Rezeptur prüfen | Möglicher Zusammenhang, unklare Zutaten oder Ausgangsprodukt. |
| Persönlich ungeklärt | Keine ausreichende Einzelfallinformation. **Kein Synonym für sicher.** |
| Bisher vertragen | Persönliche Beobachtung, zubereitungsbezogen, keine Garantie. Überstimmt kein aktives Verbot. |
| Als ärztlich geeignet erfasst | Selbst dokumentierte ärztliche Aussage für genau diese Zubereitung; von der App nicht medizinisch überprüft. |

Keine Kategorie wird allein aus „kein Treffer“ oder „gekocht“ zu „unbedenklich“. Lebensmittel ohne typischen Beifuß-Bezug können andere Allergien auslösen. Nach schweren Reaktionen keine Selbsttests. Bei schweren akuten Symptomen 112 und persönlichen Notfallplan befolgen.

Die App ist ein recherchierter Informations- und Dokumentationsführer, **keine medizinisch validierte Freigabeliste, Diagnose oder automatische Ernährungstherapie**. Die Recherche mit Quellen, Abgrenzungen, verwandten Apps und Beispielen steht in [docs/RESEARCH.md](docs/RESEARCH.md).

## Daten und Datenschutz

Alle persönlichen Angaben liegen im privaten WebView-Speicher der Android-App. Die App besitzt **keine Internetberechtigung**. Automatische Android-Backups sind deaktiviert. Quellen werden erst nach Antippen im externen Browser geöffnet. JSON-Exporte sind nicht zusätzlich verschlüsselt und enthalten Gesundheitsangaben. Selbst geschützt aufbewahren; nicht in dieses öffentliche Repository hochladen. Deinstallation oder Löschen der App-Daten entfernt die lokalen Angaben.

## Entwicklung und Prüfungen

JDK 17, Android SDK 36, Build Tools 35.0.0; Gradle 8.13, Android Gradle Plugin 8.11.1. Android Studio kann den Projektordner direkt öffnen.

```sh
./gradlew :app:assembleDebug :app:lintDebug
npm test
```

Eine Browseransicht für Entwicklung lässt sich mit `npm run serve` unter `http://localhost:4173` öffnen. Die Anwendung verwendet keine externen Web-Abhängigkeiten; Browser-Import/Export dient als Entwicklungsfallback.

Für die Oberflächenprüfung:

```sh
npm install --no-save --package-lock=false playwright@1.58.2
npx playwright install chromium --only-shell
npm run test:ui
```

Die CI prüft Bewertungsprioritäten, Quell-/Referenzintegrität, Suchbegriffe, Zutaten- und Spurenlogik, Sicherungsvalidierung, Bedienabläufe und kleine/große Displays in Hell/Dunkel. Die native APK wird gebaut, durch Android Lint geprüft und in einem Android-15-Emulator installiert und gestartet. Diese Prüfungen ersetzen keine medizinische Inhaltsvalidierung oder einen Test auf jedem physischen Android-Gerät.

## Aufbau

- `catalog.js`: Quellen, Lebensmittel, Aliasbegriffe, Beispielgerichte und Wissensartikel.
- `engine.js`: reine Such-, Bewertungs-, Etikett- und Sicherungslogik, mit Node testbar.
- `app.js`, `index.html`, `styles.css`: zugängliche Offline-Oberfläche.
- `MainActivity.java`: geschützte lokale HTTPS-Asset-Oberfläche, Dateidialoge, Teilen und Zurück-Navigation.

Für Veröffentlichungsfragen und Inhalte siehe [docs/RESEARCH.md](docs/RESEARCH.md). Software-Drittbestandteile sind in [docs/THIRD_PARTY.md](docs/THIRD_PARTY.md) aufgeführt.
