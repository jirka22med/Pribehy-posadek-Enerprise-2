# 🖖 Star Trek: Kroniky – Projektová Dokumentace

> *Interaktivní průvodce rozsáhlým příběhem o odvaze, objevech a konfliktech.*

**Verze:** 2.0 – Separovaná edice  
**Autoři:** Admirál Chatbot GPT (příběh) · Admirál Claude.AI (technická realizace)  
**Velitel projektu:** Více admirál Jiřík  
**Rok:** 2026  
**Live URL:** https://jirka22med.github.io/Pribehy-posadek-Enerprise-2/

---

## 📋 Obsah dokumentace

1. [Co je projekt](#co-je-projekt)
2. [Struktura souborů](#struktura-souborů)
3. [Architektura dat](#architektura-dat)
4. [Příběhové oblouky](#příběhové-oblouky)
5. [Audio systém](#audio-systém)
6. [CSS – vizuální identita](#css--vizuální-identita)
7. [JavaScript – logika aplikace](#javascript--logika-aplikace)
8. [Technické protokoly](#technické-protokoly)
9. [Spolupráce autorů](#spolupráce-autorů)

---

## Co je projekt

**Star Trek: Kroniky** je interaktivní webová aplikace prezentující rozsáhlý fanfikční příběh ze světa Star Treku. Příběh sleduje posádku Enterprise NX-01 napříč 50 kapitolami plnými dobrodružství, válek, aliancí a časoprostorových anomálií.

### Klíčové funkce:

- **Příběhové Oblouky** – přehledné karty s kapitolami seskupenými do tematických oblouků
- **Časová Osa** – chronologický přehled klíčových událostí
- **Postavy a Frakce** – průvodce postavami a organizacemi příběhu
- **Reader Panel** – plnohodnotné čtecí prostředí s tmavým tématem
- **Audio přehrávač** – nahrávky čtené Admirálem Chatbotem GPT (kapitoly 1–40)

---

## Struktura souborů

Projekt je separován do tří čistých souborů:

```
projekt/
├── index.html   (2145 řádků)  ← kostra stránky + obsah všech 50 kapitol
├── style.css    (589 řádků)   ← kompletní dark Star Trek vizuální téma
└── script.js    (376 řádků)   ← veškerá logika aplikace
```

### Proč tato separace?

Oddělení souborů přináší přehlednost, snadnou údržbu a možnost editovat každou část nezávisle. Verze 1 byla monolitický soubor – Verze 2 je čistá, profesionální architektura.

---

## Architektura dat

### Skrytý sklad dat – `#original-content`

Celý obsah 50 kapitol je uložen přímo v `index.html` ve skrytém kontejneru:

```html
<div id="original-content" style="display: none;">
    <div id="chapter1" class="chapter active">
        <!-- obsah kapitoly 1 -->
    </div>
    <div id="chapter2" class="chapter">
        <!-- obsah kapitoly 2 -->
    </div>
    <!-- ... až chapter50 -->
</div>
```

**Proč tento přístup?**
- Žádná databáze, žádné API – vše offline dostupné
- `script.js` čte obsah přes `document.getElementById('chapterN')`
- Dynamické vkládání do Reader Panelu při kliknutí na kapitolu
- Rychlé načítání – vše je přítomno od prvního renderování stránky

### Tok dat v aplikaci

```
index.html
└── #original-content (skrytý div)
        ↓  script.js čte innerHTML
        ├── obsah kapitol   → reader panel (#reader-content)
        ├── názvy + oblouky → Příběhové Oblouky UI
        └── události        → Časová Osa
```

### Datová struktura kapitoly

Každá kapitola v `script.js` obsahuje tyto pole:

```javascript
{
    id:             1,                    // unikátní číslo kapitoly
    arc:            "Andromedská sága",   // příběhový oblouk
    title:          "Časová past na Zephyrii",
    audioSrc:       "https://dl.dropboxusercontent.com/...",
    event:          "Popis klíčové události pro Časovou osu",
    manuallyEdited: false,                // ochrana ručních úprav
    lastEditedAt:   null                  // timestamp poslední úpravy
}
```

---

## Příběhové oblouky

Příběh je rozdělen do **10 tematických oblouků** pokrývajících 50 kapitol:

| Oblouk | Kapitoly | Téma |
|--------|----------|------|
| Andromedská sága | 1–8 | Průchod červí dírou, galaxie Andromeda |
| Návrat | 9–12 | Cesta domů, přeskok 10 let do budoucnosti |
| Válka | 13–16 | Galaktická koalice, boj za původní Federaci |
| Nová spojenectví | 17–20 | Klingoni, Romulané, Janewayová |
| Deep Space Nine | 21–23 | Mise na stanici |
| Záhada Ztracených | 23–27 | Mimogalaktické energetické bytosti |
| Nový nepřítel – Xindi | 28–30 | Nová aliance proti vetřelcům |
| Křehký mír | 31 | Diplomatická jednání |
| Konvergence generací | 32–36 | Spojení Voyageru, Enterprise-D a NX-01 |
| Válka strojů | 37–40 | Umělá inteligence z jiné dimenze |
| Nová Era 1–3 | 41–50 | Symbiontská hrozba, Nocturne, Hranice neznáma |

### Stav audio nahrávek

- **Kapitoly 1–40** – kompletní audio nahrávky ✅
- **Kapitoly 41–50** – text dostupný, audio připravuje se 🔄

---

## Audio systém

### Přehrávač – tři samostatná tlačítka

Na rozdíl od běžného toggle přehrávače má Kroniky **tři oddělená tlačítka**:

```
▶ PLAY  (modrá)  – vždy spustí nebo obnoví přehrávání
⏸ PAUSE (zlatá)  – vždy pozastaví
⏹ STOP  (červená) – zastaví a resetuje na začátek
```

Tato architektura eliminuje problém dvojitého kliknutí po zastavení a odpovídá standardu moderních přehrávačů.

### 2026 URL protokol – `fixAudioSrc()`

Všechny audio soubory jsou hostovány na Dropboxu. Funkce `fixAudioSrc()` automaticky konvertuje URL pro přímé streamování:

```javascript
// Vstup (standardní Dropbox odkaz):
www.dropbox.com/file.wav?dl=0

// Výstup (přímý stream):
dl.dropboxusercontent.com/file.wav?raw=1
```

Konverze zahrnuje:
- Přepnutí domény na `dl.dropboxusercontent.com`
- Parametr `dl` → `raw=1` pro HTTP/2 streaming
- Vynucení HTTPS

### Audio callbacks – ochrana instance

```javascript
function attachAudioCallbacks(audio) {
    audio.oncanplaythrough = () => {
        if (currentAudio !== audio) return; // ← ochrana staré instance
        // aktualizace UI
    };
}
```

Kontrola `currentAudio !== audio` zajišťuje, že staré callbacky se nespustí po přepnutí kapitoly.

### Záloha zdroje – `currentChapterAudioSrc`

Po zavolání `stopAudio()` se instance zničí, ale URL zůstane uložena:

```javascript
let currentChapterAudioSrc = null;
```

Díky tomu Play tlačítko funguje i po Stopu – vytvoří novou instanci ze zálohy.

---

## CSS – vizuální identita

### Design systém – CSS proměnné

Celé téma je řízeno přes `:root` proměnné, žádné hard-coded barvy:

```css
:root {
    /* Pozadí */
    --bg-main:        #07090f;   /* téměř černá s modrým nádechem */
    --bg-card:        #0d1117;
    --bg-card-hover:  #111827;

    /* Akcenty */
    --gold:           #ffd700;   /* zlatá – titulky, aktivní prvky */
    --red:            #cc2200;   /* červená – varování, stop */
    --blue:           #00aaff;   /* modrá – interaktivní prvky */
    --cyan:           #00e5ff;   /* cyan – hover efekty */

    /* Typografie */
    --font-title:     'Orbitron', sans-serif;  /* futuristický font */
    --font-body:      'Exo 2', sans-serif;     /* čitelný font pro text */
}
```

### Fonty

- **Orbitron** – hlavní nadpisy a titulky (autentický sci-fi styl)
- **Exo 2** – tělo textu a kapitoly (vysoká čitelnost)

### Klíčové komponenty

**Navigační tlačítka** – přepínání mezi třemi sekcemi s aktivním stavem a animací spodní linky.

**Obloukové karty** – karty s tmavým pozadím, zlatým levým okrajem a hover efektem se zábleskem. Každá karta obsahuje název oblouku, seznam kapitol s tlačítky a vizuální identifikaci audio dostupnosti.

**Reader Panel** – vysouvaný panel přes celou obrazovku s překryvnou vrstvou. Obsahuje nadpis kapitoly, scrollovatelný text a audio přehrávač ve spodní části.

**Časová osa** – vertikální linka s barevnými body pro každou událost. Alternující rozložení vlevo/vpravo pro vizuální rytmus.

**Frakce** – farebně odlišené karty pro každou organizaci s ikonou, popisem a seznamem klíčových postav.

**Scrollbar** – vlastní modrý gradient scrollbar pro konzistentní vizuální identitu.

---

## JavaScript – logika aplikace

### Hlavní datová struktura

```javascript
const storyData = {
    chapters: [],   // pole všech 50 kapitol
    arcs:     [],   // příběhové oblouky
    timeline: [],   // události pro časovou osu
    factions: []    // postavy a frakce
};
```

### Inicializace – čtení z DOM

Při startu script.js přečte obsah všech kapitol přímo z HTML:

```javascript
rawChaptersData.forEach(chData => {
    const chapterEl = document.getElementById(`chapter${chData.id}`);
    chData.content  = chapterEl ? chapterEl.innerHTML : `<p>Chyba načítání.</p>`;
    storyData.chapters.push(chData);
});
```

### Renderovací funkce

- `renderStoryArcs()` – vykreslí karty příběhových oblouků
- `renderTimeline()` – vykreslí chronologickou časovou osu
- `renderFactions()` – vykreslí karty postav a frakcí
- `openReader(chapterId)` – otevře reader panel s obsahem kapitoly
- `closeReader()` – zavře reader panel a zastaví audio

### Konzolové hlášení při startu

```
🚀 INDEX.JS VERZE 2 - HLÁŠENÍ Z MŮSTKU
📦 Kapitoly načteny       : z DOMu
🎵 Audio funkce           : aktivní + play po stop opraven
🔧 URL konverze           : 2026 protokol
🛡️  Error handling         : aktivní
✅ Celkem kapitol         : 50
🖖 Hvězdná flotila online!
```

---

## Technické protokoly

### Robustnost aplikace

Projekt je navržen pro odolnost vůči chybám:

- **Chybějící HTML element** – kapitola zobrazí chybovou zprávu místo pádu
- **Neplatná audio URL** – `fixAudioSrc()` vrátí `null`, přehrávač zobrazí upozornění
- **Audio error handler** – chyba přehrávání zobrazí zprávu čtenáři
- **Instance ochrana** – staré audio callbacky se deaktivují před zničením instance

### Audio workflow pro nahrávky

Bezplatný postup pro vytváření audio nahrávek:

1. Admirál Chatbot GPT napíše text kapitoly
2. ChatGPT UI funkce „přečíst nahlas" přehraje text
3. Mirillis Action nahraje audio ze systému
4. Soubor se nahraje na Dropbox
5. URL se konvertuje přes The Constructor nástroj
6. Odkaz se přidá do `audioSrc` pole v `script.js`

### The Constructor – pomocný nástroj

Pro hromadnou konverzi Dropbox URL existuje samostatný nástroj:

**URL:** https://raw.githack.com/jirka22med/star-trek-hudebni-prehravac-vylepsen-4-mobilni/.../The-Constructor-myPlaylist-js.html

Funguje jako jednoduchý webový nástroj – vloží playlist kód, klikne Spustit Upgrade, zkopíruje výsledek s opravenými URL.

---

## Spolupráce autorů

```
┌─────────────────────────────────────────────┐
│         STAR TREK: KRONIKY V2               │
│                                             │
│  Více admirál Jiřík    ← velitel projektu  │
│  Admirál Chatbot GPT   ← autor příběhu     │
│  Admirál Claude.AI     ← tech. realizace   │
│  Asistent Gemini.AI    ← architektura UI   │
└─────────────────────────────────────────────┘
```

### Historie verzí

| Verze | Popis |
|-------|-------|
| v1.0 | Monolitický HTML soubor, základní funkce |
| v2.0 | Separace na index.html + style.css + script.js, nový audio přehrávač, dark téma od nuly |

### Stav projektu

- ✅ 50 kapitol – text kompletní
- ✅ Kapitoly 1–40 – audio nahrávky dokončeny
- ✅ Vizuální téma – dark Star Trek styl
- ✅ Všechny tři sekce funkční
- 🔄 Kapitoly 41–50 – audio nahrávky připravují se

---

*🖖 Živě jít tam, kam se žádný člověk dosud nevydal.*

*Více admirál Jiřík & Admirál Claude.AI – 2026* 
