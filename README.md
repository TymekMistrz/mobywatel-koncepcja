# Prototyp aplikacji obywatelskiej — baza do własnej koncepcji

Statyczna kopia frontu prototypu „mObywatel.ai” (autor: Janusz Cieszyński, licencja MIT — zob. `LICENSE`),
przygotowana jako punkt wyjścia do zgłoszenia w mObywatel Challenge.

**Podgląd na żywo:** https://tymekmistrz.github.io/mobywatel-koncepcja/
Każdy commit na gałęzi `main` pojawia się pod tym adresem po ok. minucie.

## Co zostało zmienione względem oryginału
- Usunięte elementy wyłączone z licencji MIT: godło, nazwa/logo/oznaczenia mObywatela, grafiki dokumentów, zdjęcia osób.
- Zamiast godła: czerwony znak w kolorze przewodnim (`assets/icon-app.svg`).
- Własne tła kart (`assets/karta-*.svg`, `assets/pasek-*.svg`) i sylwetki z inicjałami (`assets/foto-*.svg`).
- „mDowód”, „mPrawo jazdy” itp. → „Dowód osobisty”, „Prawo jazdy”. Nagłówek aplikacji: napis „mObywatel” (bez logo) — nazwa użyta wyłącznie w celach pokazowych w ramach mObywatel Challenge.
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
| `variants.js` | stały układ „stos” |
| `nawigacja.js` | dolny pasek (Dokumenty, Usługi, Skanuj, Twoje sprawy, Więcej) i treść tych stron |
| `assets/` | grafiki |

Parametry adresu: `?osoba=marta|jan|ewa|kacper`, `?dzien=N`.

`koncepcja.html` — osobny, wcześniejszy szkic koncepcji (jeden plik).

Osoby i dane są fikcyjne. To nie jest usługa administracji publicznej ani oficjalna aplikacja mObywatel.

## Widok pokazu (index.html)
Na komputerze `index.html` pokazuje panel po lewej (osoba, data w aplikacji, terminy) i telefon po prawej
z aplikacją (`app.html`) w ramce. Na telefonie od razu otwiera się sama aplikacja.

**Data w aplikacji:** dane osób są przygotowane na 18.10.2026 („dzień 0”, stała w `czas.js`).
Suwak przesuwa „dziś” o N dni (parametr `?dzien=N`); `czas.js` przelicza wtedy teksty typu „za 11 dni”,
oznacza terminy po czasie i pokazuje „Dokument nieważny / Brak ważnego OC” zamiast „Dokument ważny”.
Odpowiedzi asystenta w scenariuszach (`scenarios.js`) są pisane dla dnia 0.
