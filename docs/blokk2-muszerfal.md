# Blokk 2 – Műszerfal (napi munkaállomás)

Staging build: 2026-07-28 – b2. Migráció: block2_dashboard_notes_and_links.

## Mit tartalmaz
- **Közelgő találkozók** kattintható listája (Találkozó típusú vagy időponttal bíró aktív feladatok, dátum+idő szerint).
- **Határidős és lejárt teendők** képes táblázata: fotó, ügy fajtája (Lead/Megbízás/Keresés/Kiajánlás/Egyéb/Magán), kapcsolódó ügy, teendő, típus, határidő, időpont, Intézi. Rendezés: lejárt/legközelebbi elöl. Minden sor ugyanazt az openTask ablakot nyitja.
- **Gyors jegyzet**: felhasználónként privát, automatikusan (debounce) mentődő jegyzettömb. Tábla: felhasznaloi_jegyzet, RLS user_id=auth.uid() (a másik felhasználó és anon nem látja).
- **Naptár**: heti és napi, órarácsos (7–20h) nézet, „időpont nélkül" sorral; a feladatok dátum+idopont szerint jelennek meg, kattintásra openTask. Navigáció: ‹ Ma ›, Hét/Nap váltás. A dátumsegédek (addDaysStr, mondayOf, dowMon) a közös js/logic.js-ben, TZ-függetlenül (UTC), tesztelve.
- **Gyors elérések**: Adminból szerkeszthető linkek (gyorslinkek tábla), most 6 alap elemmel; az URL-eket a 10. blokk Admin felülete tölti fel/szerkeszti.
- A feladat-időpont (idopont) mező bekerült az openTask és a taskForm űrlapokba, a feladattípus választható (Teendő/Intézkedés/Visszahívás/Találkozó/Egyéb).

## Rollback
- DROP TABLE IF EXISTS public.felhasznaloi_jegyzet; DROP TABLE IF EXISTS public.gyorslinkek;
- App: a 0. blokk egyfájlos rollback változatlan.

## 2A – biztonsági és működési javítás
- Táblajogok szűkítve: felhasznaloi_jegyzet és gyorslinkek → csak SELECT/INSERT/UPDATE/DELETE az authenticated szerepnek (nincs TRUNCATE/REFERENCES/TRIGGER, anon 0). Migráció: block2a_dashboard_security_and_behavior.
- A jegyzet RLS aktív app_user tagságot is követel: using/check = is_app_user() AND user_id=auth.uid().
- Határidős lista: minden dátumozott aktív feladat időrendben (lejárt→ma→jövő), dátum nélküli kimarad; a számláló csak a ténylegesen esedékeseket mutatja.
- A teljes teendősor kattintható; a Műszerfalról indított mentés/kész/újranyitás a Műszerfalon marad (a Feladatok oldalról a Feladatokon).
- Közelgő találkozók: csak tipus='Találkozó', az elmúlt mai időpont nem közelgő; a számláló a levágás (max 8) ELŐTT számol.
- Helyi idő: today()/nowHM() Europe/Budapest szerint (Logic.localDateISO/localTimeHM), így éjfél után is helyes a nap.
- nameOf kiterjesztve: lead/megbízás/keresés/kiajánlás/általános + egyértelmű helyőrzők.
- Gyors jegyzet hibabiztos: betöltési hibánál látható üzenet, letiltott textarea, nincs felülíró automentés; sikeres betöltés után szerkeszthető; debounce + blur mentés.
- Gyorslinkek: üres vagy '#' URL nem kattintható („Még nincs beállítva”); csak http(s) vagy biztonságos relatív cím kattintható (Logic.safeUrl).
- Képméret: a Műszerfal és Feladatok sorai kompakt, fix ~76×52 px bélyegképet használnak (thumbHover), hoveren nagyobb lebegő előnézettel; a sor magassága nem nő.
