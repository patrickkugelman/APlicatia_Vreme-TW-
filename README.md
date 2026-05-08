# Proiect TW — JavaScript și DOM

**Echipă:** [Nume Coleg 1] + [Nume Coleg 2]
**Tema:** 2. JavaScript și DOM
**Profesor coordonator:** [Profesor]

## Structura proiectului

```
proiect_TW/
├── proiect-vreme/   # Aplicație demonstrativă (fir roșu) — OpenWeatherMap API
├── exemple/         # Exemple scurte pentru fiecare capitol din documentație
├── documentatie/    # Documentul .docx
└── prezentare/      # Slide-uri prezentare
```

## Rulare aplicație vreme

```bash
cd proiect-vreme
npm install
cp .env.example .env
# Editați .env și adăugați cheia voastră OpenWeatherMap
npm run dev
```

Demo live: https://patrickkugelman.github.io/APlicatia_Vreme-TW-/

## Rulare teste

```bash
cd proiect-vreme
npx vitest run
```

## Deploy GitHub Pages

```bash
cd proiect-vreme
npm run deploy
```

## Exemple per capitol

Fiecare folder din `exemple/` conține un `index.html` care se deschide direct în browser.

| Folder | Capitol |
|---|---|
| `01-baze/` | Bazele JavaScript |
| `02-obiecte-functii/` | Obiecte și funcții |
| `03-dom-evenimente/` | Manipularea DOM și evenimente |
| `04-async/` | JavaScript asincron |
| `05-es6/` | ES6 și versiuni ulterioare |
| `06-api/` | Interacțiuni cu API-uri |
| `07-best-practices/` | Best practices și debugging |
| `08-securitate/` | Securitate în browser |
| `09-testare/` | Testare cu Vitest |
