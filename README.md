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
| `dane.js` | dane bieżącej osoby dla asystenta (miasto, urzędy, dokumenty, terminy) |
| `asystent-osoby.js` | odpowiedzi asystenta dopasowane do osoby i daty w aplikacji |
| `sprawy.js` | ekrany sprawy, usługi i sekcji „Więcej” (w tym „Kto sprawdzał moje dane”) |
| `nawigacja.js` | dolny pasek (Dokumenty, Usługi, Twoje sprawy, Więcej) i przycisk „Skanuj” w nagłówku i treść tych stron |
| `assets/` | grafiki |

Parametry adresu: `?osoba=marta|jan|ewa|kacper`, `?dzien=N`.

`koncepcja.html` — osobny, wcześniejszy szkic koncepcji (jeden plik).

Osoby i dane są fikcyjne. To nie jest usługa administracji publicznej ani oficjalna aplikacja mObywatel.

## Widok pokazu (index.html)
Na komputerze `index.html` pokazuje panel po lewej (osoba, data w aplikacji, terminy) i telefon po prawej
z aplikacją (`app.html`) w ramce. Na telefonie od razu otwiera się sama aplikacja.

**Data w aplikacji:** dane osób są przygotowane na 18.10.2026 („dzień 0”, stała w `czas.js`), ale na ekranie dzień 0 to zawsze prawdziwe dziś — wszystkie wyświetlane daty są przesuwane automatycznie.
Suwak przesuwa „dziś” o N dni (parametr `?dzien=N`); `czas.js` przelicza wtedy teksty typu „za 11 dni”,
oznacza terminy po czasie i pokazuje „Dokument nieważny / Brak ważnego OC” zamiast „Dokument ważny”.
Odpowiedzi asystenta w scenariuszach (`scenarios.js`) są pisane dla dnia 0.

`lib/qrcode.js` — generator kodów QR (Kazuhiko Arase, licencja MIT), używany w przycisku „Otwórz na swoim telefonie”.

## Wygląd
`motyw.css` nadpisuje `style.css`: cienkie linie 1 px zamiast cieni, małe zaokrąglenia, płaskie karty z giloszem (`assets/karta2-*.svg`). Kolory i promienie zmieniasz w pierwszych linijkach `motyw.css`.

## Pomoc bliskiej osoby (upoważnienie dla zaufanej osoby)
`pomoc.js`. Halina Lis (84 l.) daje Ewie Nowak dostęp do wybranych spraw: Więcej → „Pomoc bliskiej osoby” → Upoważnij. Osobę wskazuje wyłącznie osoba dająca dostęp, na swoim telefonie: skanuje znak, który Ewa pokazuje (Więcej → Pomoc bliskiej osoby → Pokaż mój znak), albo wpisuje jej PESEL i numer dowodu (oba muszą się zgadzać). Dalej: w czym (sprawy i terminy, opłaty, pisma, recepty), na jak długo → Face ID. Ewa przyjmuje zaproszenie w „Twoich sprawach” i przełącza się na „Halina Lis” — działa tylko w udzielonym zakresie, o resztę może poprosić. Halina widzi historię działań (też w „Kto sprawdzał moje dane”) i cofa dostęp jednym przyciskiem.

Stan jest w `localStorage` (klucz `mobPomoc`) i przechodzi na żywo między oknami tej samej przeglądarki. Między różnymi urządzeniami zmiany idą przez publiczny, darmowy przekaźnik ntfy.sh (tematy `mobywatel-koncepcja-v1-…`: znak, osoba, upoważnienie) — tylko fikcyjne dane prototypu. W panelu pokazu przy Halinie lub Ewie drugi telefon pojawia się obok (przełącznik „Drugi telefon obok”), a „Upoważnienie od nowa” czyści stan pokazu. Upoważnić można każdą osobę z mObywatelem — aplikacja nie zakłada żadnego pokrewieństwa i nazywa osoby imieniem i nazwiskiem (z datą urodzenia do weryfikacji). W panelu drugi telefon można włączyć przy każdej osobie i wybrać, kto na nim jest.
