# Drittbestandteile

- Gradle Wrapper 8.13: offizielle `gradle-wrapper.jar` aus `gradle/gradle` v8.13.0, Apache License 2.0. Die JAR enthält die zugehörigen Lizenz-/Hinweisdateien. Launcher im Repository sind eigene kleine Wrapper-Launcher.
- Android Gradle Plugin und AndroidX WebKit: Build-/Laufzeitbestandteile unter ihren jeweiligen Apache-2.0-Lizenzen, über Google Maven aufgelöst. Android SDK und System WebView bleiben Plattformbestandteile.
- Playwright 1.51.1: nur automatisierte Oberflächenprüfung, Apache-2.0, nicht in der APK enthalten.
- GitHub Actions von actions, gradle und android-actions: ausschließlich Build-Infrastruktur, nicht Teil des Anwendungsdatenbestands.
- Die App lädt keine externen Schriftarten, Bilder, Icons oder JavaScript-Bibliotheken. Redaktionelle Texte und UI sind eigenständig formuliert. Medizinische Quellen sind verlinkt; keine vollständigen fremden Texte übernommen.

Die installierte Entwicklungssignatur dient persönlichem Sideloading. Sie ist keine dauerhafte Store-Release-Signatur.
