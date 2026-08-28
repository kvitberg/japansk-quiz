# Japansk verbquiz — designspesifikasjon

**Dato:** 2026-08-28
**Status:** Godkjent design, klar for implementeringsplan

## Formål

En multiple choice-quiz som hjelper Scott med å lære japanske verb fra
Duolingos japanskkurs (Scott er t.o.m. Section 3, Unit 28). Quizen viser
verbet på japansk og ber om riktig norsk betydning. Verb Scott bommer på
skal dukke opp oftere; verb Scott kan skal dukke opp sjeldnere, og
fremgangen skal huskes mellom økter.

## Form og plattform

- Én selvstendig HTML-side (all CSS/JS inline) publisert som Artifact på
  claude.ai.
- Fungerer på mobil og PC (responsiv layout, ingen horisontal scrolling).
- Støtter både lys og mørk modus via CSS-tokens og `prefers-color-scheme`
  / `data-theme`, slik Artifact-plattformen krever.
- Ingen eksterne avhengigheter (streng CSP): ingen CDN, ingen eksterne
  fonter utenom ev. Google Fonts med fallback-stack.

## Verbdata

- 60–80 verb fra tidlig i Duolingos japanskkurs (omtrent t.o.m.
  Section 3), satt sammen av Claude. Listen kan justeres senere.
- Verbene skrives i ます-form slik Duolingo lærer dem (食べます, ikke
  食べる).
- Datastruktur per verb (inline JS-array):
  - `kanji` — skrivemåte med kanji, f.eks. `食べます` (tom/null for verb
    som normalt skrives i ren kana)
  - `kana` — lesning i hiragana/katakana, f.eks. `たべます`
  - `no` — norsk betydning, f.eks. `å spise`
- Visning: kanji med kana over som lesehjelp via `<ruby>`-elementet
  (furigana). Verb uten kanji vises i ren kana.
- Norske betydninger skal være innbyrdes distinkte nok til at bare ett
  alternativ er riktig per spørsmål (synonym-kollisjoner unngås når
  listen settes sammen).

## Quizflyt

1. Et verb trekkes (se «Smart repetisjon» under) og vises på japansk.
2. Fire norske svaralternativer vises i tilfeldig rekkefølge: riktig
   betydning pluss tre distraktorer trukket tilfeldig fra de andre
   verbene i listen.
3. Umiddelbar tilbakemelding: valgt alternativ farges grønt (riktig)
   eller rødt (feil); ved feil markeres også riktig svar.
4. Bruker går videre med en «Neste»-knapp (ikke auto-advance, så man
   rekker å lese fasiten).
5. Samme verb stilles ikke som to spørsmål på rad.

## Smart repetisjon (Leitner-bokser)

- Hvert verb har en boks 0–4. Nye verb starter i boks 0.
- Riktig svar: verbet flyttes opp én boks (maks 4).
- Feil svar: verbet flyttes til boks 0.
- Trekking av neste spørsmål vektes sterkt mot lave bokser, f.eks.
  vekt per boks: 0→16, 1→8, 2→4, 3→2, 4→1. Eksakte vekter kan
  finjusteres under implementering; kravet er at boks 0-verb dukker opp
  klart oftest og boks 4-verb sjeldnest, uten at noe verb forsvinner
  helt.
- Et verb regnes som «mestret» når det står i boks 3 eller høyere.

## Fremgang og lagring

- Bokstilstanden lagres i `localStorage` under én nøkkel, nøklet per
  verb på kombinasjonen kanji + kana (kana alene er tvetydig: 来ます og
  着ます leses begge きます).
- All lesing/skriving av `localStorage` pakkes i try/catch. Uten
  tilgjengelig lagring fungerer quizen normalt, men fremgangen glemmes
  når siden lukkes.
- Verb som legges til/fjernes i senere versjoner håndteres tolerant:
  ukjente lagrede nøkler ignoreres, nye verb starter i boks 0.
- Diskret fremgangslinje øverst: «X av Y verb mestret». Ingen annen
  statistikk i denne versjonen.

## Feilhåndtering

- `localStorage`-feil: stille fallback til kun minne (se over).
- Datafeil (f.eks. færre enn 4 verb): utelukkes av at listen alltid har
  60+ verb; ingen egen håndtering nødvendig.

## Testing/verifisering

Før lenken leveres verifiseres i nettleserpanelet:

- Spørsmål rendres med korrekt furigana (ruby) i begge tema.
- Riktig/feil-flyt: grønn/rød markering, fasit vises ved feil,
  «Neste» fungerer.
- Leitner-logikk: feil svar resetter boksen, riktig svar øker den, og
  lagringen overlever en sideoppfriskning.
- Mobilstørrelse (375px): ingen horisontal scrolling, knapper er
  trykkbare.

## Utenfor scope (YAGNI)

- Norsk → japansk-modus
- Detaljert statistikk
- Lyd/uttale
- Redigering av verblisten i selve appen
- Kontoer, synkronisering mellom enheter
