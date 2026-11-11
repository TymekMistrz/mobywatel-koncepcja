# Prototyp aplikacji obywatelskiej — baza do własnej koncepcji

Statyczna kopia frontu prototypu „mObywatel.ai” (autor: Janusz Cieszyński, licencja MIT — zob. `LICENSE`),
przygotowana jako punkt wyjścia do zgłoszenia w mObywatel Challenge.

**Podgląd na żywo:** https://tymekmistrz.github.io/mobywatel-koncepcja/
Każdy commit na gałęzi `main` pojawia się pod tym adresem po ok. minucie.

## Co zostało zmienione względem oryginału
- Usunięte elementy wyłączone z licencji MIT: godło, nazwa/logo/oznaczenia mObywatela, grafiki dokumentów, zdjęcia osób.
- Zamiast godła: czerwony znak w kolorze przewodnim (`assets/icon-app.svg`).
- Własne tła kart (`assets/karta-*.svg`, `assets/pasek-*.svg`) i sylwetki z inicjałami (`assets/foto-*.svg`).
- „mDowód”, „mPrawo jazdy” itp. → „Dowód osobisty”, „Prawo jazdy”.
- Działa bez serwera: asystent AI jest wyłączony, rozmowy to gotowe scenariusze.
  Nie działa przekazywanie danych między dwoma urządzeniami (`komputer.html`, skanowanie znaku) — wymaga serwera.

## Gdzie co edytować
| Plik | Co tam jest |
|---|---|
| `index.html` | szkielet ekranu (nagłówek, pole „Co chcesz załatwić?”, okna) |
| `style.css` | cały wygląd: kolory, odstępy, karty |
| `osoby.js` | osoby demo: dokumenty, kafelki „Do załatwienia”, podpowiedzi |
| `scenarios.js` | scenariusze rozmów (zgubiony portfel, stłuczka, OC…) |
| `core.js` | stos kart, szczegóły dokumentu, czat |
| `variants.js` | układy dokumentów (stos, karuzela, lista, siatka) |
| `assets/` | grafiki |

Parametry adresu: `?osoba=marta|jan|ewa|kacper`, `?uklad=stos|karuzela|pion|lista|siatka`.

`koncepcja.html` — osobny, wcześniejszy szkic koncepcji (jeden plik).

Osoby i dane są fikcyjne. To nie jest usługa administracji publicznej ani oficjalna aplikacja mObywatel.
