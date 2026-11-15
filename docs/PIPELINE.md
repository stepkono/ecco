# ecco: So funktioniert die Pipeline

Stand: 15.11.2026. Diese Übersicht erklärt das System ohne Vorwissen.

## Die Idee in einem Satz

Kleine KI-Horchposten im Wald erkennen Tierlaute selbst. Nur wenn sie unsicher sind, schicken sie eine kurze Aufnahme an die Community. Menschen markieren und benennen den Laut, und der Horchposten lernt ihn in Sekunden dazu.

## Die drei Teile

```
 HORCHPOSTEN (Board)          SERVER                        WEBSITE (ecco)
 im Wald, mit Mikrofon   →    sammelt Aufnahmen        →    hier wird gelabelt
 KI entscheidet selbst   ←    verteilt das Gelernte    ←
```

| Teil | Was es ist | Aufgabe |
|---|---|---|
| **Horchposten** | Arduino UNO Q mit USB-Mikrofon | hört zu, erkennt Laute, meldet nur Unklares |
| **Server** | Python-Programm (FastAPI), läuft heute auf dem Laptop | Briefkasten zwischen Posten und Website, speichert Aufnahmen und Labels |
| **Website** | ecco im Browser | Menschen hören, sehen und benennen die unklaren Laute |

Die **Entscheidungen** fallen dezentral auf den Boards. Der Server ist nur der Treffpunkt. Alles, was ein Posten sicher erkennt, bleibt auf dem Board.

## Der Ablauf Schritt für Schritt

1. **Zuhören:** Das Board nimmt laufend Audio auf und betrachtet es in Abschnitten von 5 Sekunden.
2. **Filtern:**
   - Ist ein Abschnitt zu leise (unter -55 dBFS), passiert nichts.
   - Hört das Board menschliche Sprache, verwirft es den Abschnitt sofort. Sprache verlässt das Board nie.
3. **Erkennen:** Ein KI-Modell (YAMNet, int8, auf dem Board) macht aus dem Abschnitt einen „Fingerabdruck“, eine Liste aus 1024 Zahlen. Das Board vergleicht ihn mit den Fingerabdrücken der Laute, die es schon kennt.
4. **Entscheiden:** Daraus ergibt sich einer von drei Zuständen:
   - **Quiet:** still, Sprache oder klar Wetter (Wind, Regen)
   - **Recognized:** ein bekannter Laut, zum Beispiel ein Frosch
   - **Needs help:** etwas ist da, aber das Board ist unsicher
5. **Aufnahme bilden:** Aufeinanderfolgende unsichere Abschnitte werden zu **einer** Aufnahme zusammengefasst (siehe unten).
6. **Senden:** Alle 5 Sekunden lädt das Board fertige Aufnahmen per WLAN auf den Server hoch. Ohne Verbindung warten sie auf dem Board.
7. **Labeln:** Auf der Website öffnet jemand die Aufnahme. Der Laut erscheint als 3D-Landschaft. Die Person markiert ihn mit dem Pinsel und wählt einen Namen, zum Beispiel „frog“.
8. **Lernen:** Der Server berechnet den Fingerabdruck des markierten Teils und fügt ihn als neues Beispiel zu dieser Lautart hinzu. Daraus entsteht eine neue Version der „bekannten Laute“.
9. **Zurück aufs Board:** Das Board fragt alle 5 Sekunden nach einer neueren Version und lädt sie herunter. Das ist eine kleine Datei, kein Audio. Ab dann erkennt es den Laut.

Audio fließt also nur **Board → Server → Website**. Zurück aufs Board geht nur die kleine Datei mit den Fingerabdrücken.

## Wie das Board entscheidet

Der Vergleich liefert eine **Ähnlichkeit** zwischen 0 und 1 zu jeder bekannten Lautart.

| Regel | Wert | Bedeutung |
|---|---|---|
| Erkannt | Ähnlichkeit mindestens **0,80** | Das Board ist sich sicher genug |
| Wetter | Ähnlichkeit mindestens **0,65** bei Wind, Regen oder Motor | Für Wetter reicht weniger. Ein überhörter Windstoß kostet nichts |
| Abstand | mindestens **0,05** zur zweitbesten Lautart | Liegen zwei Arten fast gleichauf, ist das Board nicht sicher |

Wenn keine Regel greift, heißt das Ergebnis **Needs help**. Den Schwellwert für „erkannt“ kann man in der Board-Konsole mit dem Regler „Trust knob“ verschieben.

## Die Logs lesen

Beispiel:

```
04:11:14 mic: NEEDS_HELP noise:wind 0.66 (margin 0.03)
```

| Teil | Bedeutung |
|---|---|
| `04:11:14` | Uhrzeit der Entscheidung |
| `mic` | Quelle: das Mikrofon (bei Tests steht hier ein Dateiname) |
| `NEEDS_HELP` | Ergebnis: Das Board ist unsicher |
| `noise:wind` | Die ähnlichste bekannte Art: Windgeräusch |
| `0.66` | Ähnlichkeit zu dieser Art |
| `margin 0.03` | Abstand zur zweitbesten Art |

In diesem Beispiel ist 0,66 zwar über der Wetter-Schwelle von 0,65. Der Abstand von 0,03 ist aber kleiner als 0,05: Eine andere Art ist fast genauso ähnlich. Deshalb fragt das Board nach.

Weitere Zusätze, die man sieht:

- `→ saved event 40df90804b48 (32 s, 6 unclear segments)`: Aus sechs unsicheren Abschnitten wurde eine Aufnahme von 32 Sekunden.
- `→ repeat of 81991f93a6b5 (83% of segments match, heard 7×)`: Dieser Laut wurde schon einmal gesendet. Er wird nur gezählt, nicht nochmal geschickt.
- `QUIET speech, dropped`: Sprache erkannt und verworfen.

## Aus unsicheren Momenten werden Aufnahmen

Damit die Community keine Flut von Schnipseln bekommt, fasst das Board zusammen:

- **Zusammenhängend:** Aufeinanderfolgende unsichere 5-Sekunden-Abschnitte werden eine Aufnahme. Ein einzelner klarer Abschnitt dazwischen ist erlaubt.
- **Kontext:** 2 Sekunden davor und danach kommen mit, damit man den Laut im Zusammenhang hört.
- **Länge:** höchstens 30 Sekunden.
- **Keine Doppelten:** Wenn mindestens 80 % der Abschnitte einer früheren Aufnahme gleichen (Ähnlichkeit 0,90), gilt es als Wiederholung. Sie wird gezählt, aber nicht nochmal gesendet. Die klarere Aufnahme wird behalten.
- **Budget:** höchstens 20 neue Aufnahmen pro Stunde. Ist das Budget voll, ersetzt eine neuere, ungewöhnlichere Aufnahme die gewöhnlichste.

## Die Website

- **Startseite:** die Mission, die drei Schritte (Hören, Markieren, Benennen) und die Liste der Challenges mit einer Karte von Finnland.
  - **Newest:** die neuesten echten Aufnahmen der Horchposten. Titel ist die unsichere Vermutung des Boards, zum Beispiel „Chirping birds?“.
  - **Hottest, Most viewed, Least viewed:** Beispiel-Challenges mit bekannter Lösung zum Üben. Orte, Zeiten und Zahlen dieser Beispiele sind Demo-Daten.
- **Arbeitsbereich:** Die Aufnahme wird zur 3D-Landschaft. Zeit läuft nach rechts, Tonhöhe nach hinten, Lautstärke nach oben.
  - Werkzeuge: Pinsel, Echo (findet Wiederholungen eines Rufs), Fork (wählt einen Ruf mit seinen Obertönen), Radierer
  - Player mit Zeitleiste zum Greifen, Vor- und Zurückschieben
  - Lange Aufnahmen kommen in Teilen von 5 Sekunden
- **Labeln:** Namen wählen und „Send label“ drücken. Danach öffnet sich die nächste Aufnahme der Liste. Unmarkiert gilt die ganze Aufnahme.
- **Aufräumen:** In „Newest“ lassen sich Aufnahmen einzeln oder alle auf einmal vom Server löschen.

## Wann ein Label zählt

- **Im Demo-Modus** (aktuell eingestellt) reicht ein Label.
- **Im Normalbetrieb** müssen zwei zuverlässige Personen übereinstimmen. Zuverlässigkeit misst der Server mit Testaufnahmen, deren Lösung bekannt ist.
- Das Label „other“ wird nicht gelernt.

## Das Lernen: kein Neutrainieren

Das KI-Modell auf dem Board bleibt unverändert. Jede Lautart ist durch einige Fingerabdrücke vertreten. Ein angenommenes Label fügt einen neuen Fingerabdruck hinzu. Darum lernt das Board mit **einem** Beispiel und in Sekunden, ohne Grafikkarte und ohne neues Modell.

## Gemessene Werte

| Was | Wert |
|---|---|
| Rechenzeit pro Audiofenster auf dem Board | ca. 9 ms |
| Ganze Entscheidung für 5 s Audio | ca. 0,15 s |
| Speicherbedarf des Modells auf dem Board | ca. 95 MB |
| Vom Label bis das Board es kann | 1,4 bis 2,0 s |
| Ganzer Kreislauf in der Demo, von „unsicher“ bis „erkannt“ | ca. 24 s |
| Erkennung mit 5 Beispielen pro Art (Datensatz ESC-50) | 86 % |

## Starten

1. **Server**, im Projektordner: `.venv/bin/python -m backend.app`. Unter http://localhost:8000 zeigt eine Statusseite, wie viele Aufnahmen warten und welche Posten online sind.
2. **Website**, im Projektordner: `npm run dev`, dann die angezeigte Adresse öffnen (meist http://localhost:5173).
3. **Board:** Die Konsole startet nach einem Neustart von selbst. Sie ist erreichbar unter `http://<board-ip>:8765/?token=<token>`. Dort startet „Listen to mic“ das Zuhören. Oben steht in einem Satz, ob das Board gerade zuhört.

## Bekannte Grenzen

- **Stromversorgung:** Hängt das Board über einen Hub am Laptop, reicht der Strom nicht. Das Board stürzt ab, die Kamera trennt sich kurz, und das Mikrofon rauscht. Ein eigenes USB-C-Netzteil mit mindestens 15 W löst das.
- **Arten:** Die Liste der Lautarten (frog, chirping_birds, crow) ist ein Platzhalter, bis die drei lokalen Zielarten feststehen.
- **Server:** läuft heute auf einem Laptop. Später gehört er in die Cloud oder zu einem Nationalpark.
