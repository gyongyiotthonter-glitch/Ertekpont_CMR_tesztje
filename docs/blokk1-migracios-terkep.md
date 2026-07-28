# Blokk 1 – Migrációs térkép (régi ↔ új ingatlan-mezők)

Staging build: 2026-07-28 – b1-a6f6ea9 • Projekt: ErtekPont-staging • Csak additív változások.

## Migrációk
- block1a_properties_structured_columns – új properties oszlopok (additív).
- block1b_valasztolistak_hierarchy_and_seed – valasztolistak.szulo + unique index + seed.

## Megtartott / újrahasznosított meglévő mezők
- ingatlan_tipus -> fő típus (lista: ingatlantipus)
- allapot -> műszaki állapot (lista: muszaki_allapot)
- villamos -> villamos biztonsági felülvizsgálat státusza (lista: felulvizsgalat_statusz)
- energetikai -> energetikai tanúsítvány státusza (lista: felulvizsgalat_statusz)
- elhelyezkedes -> Belterület/Külterület/Zártkert (lista: elhelyezkedes)
- cim -> megjelenített cím (a strukturált mezőkből áll össze, kézzel felülírható)
- `szobak`: a „Szobák összesen” az irányadó; a bontás (nappali + haloszoba) csak kitöltéskor frissíti, üresen a régi érték megmarad.
- futes -> legacy szabadszöveg (az új futesi_modok az elsődleges)
- emelet -> legacy (az új lakas_szint + emelet_szam az elsődleges)
- hrsz, foldhivatali_megnevezes, netto_alap, telek, epites_eve, lift, parkolas, kozmuvek -> változatlan

Adatvesztés nincs: régi oszlopokat nem töröltünk, csak új, párhuzamos oszlopokat vezettünk be.
A régi mezők kivezetése csak későbbi, emberi ellenőrzés után történik.

## Új properties oszlopok
altipus, telepules, varosresz, utca, hazszam, nappali(bool), haloszoba(numeric), emelet_szam(int),
lakas_szint, epulet_szintjei, tetoter, kertkapcsolat, garazs_onallo(bool), garazs_m2,
teremgarazs(bool), gepkocsibeallo(bool), pince(bool), pince_m2, szuteren(bool), szuteren_m2,
mellekepulet(bool), mellekepulet_m2, klima(bool), futesi_modok(text[]), holeadok(text[]),
melegviz, energetikai_besorolas, muszaki_reszletek(jsonb).

## Választólisták seed (14 lista / 110 érték)
ingatlantipus(6), altipus(30, szulo=fő típus), muszaki_allapot(7), elhelyezkedes(3),
gyor_varosresz(20), tetoter(3), kertkapcsolat(4), epulet_szintjei(2), lakas_szint(2),
futesi_mod(8), holeado(5), melegviz(4), felulvizsgalat_statusz(3), energetikai_besorolas(13).
Mind Adminból bővíthető lesz (10. blokk).

## Rollback
- Oszlopok: ALTER TABLE public.properties DROP COLUMN IF EXISTS <oszlop>; (a fenti új oszlopokra)
- Lista: DELETE FROM public.valasztolistak WHERE lista IN (...); majd DROP INDEX IF EXISTS valasztolistak_uni;
  ALTER TABLE public.valasztolistak DROP COLUMN IF EXISTS szulo;
- App: a 0. blokk érintetlen egyfájlos ertekpont-crm.html rollbackként megmarad.

## Blokk 1C / 1D pontosítások
- haloszoba: **numeric** (nem integer) – fél szobák (pl. 2,5) kezelhetők.
- szobak: a „Szobák összesen" mező az **irányadó**; a bontás (nappali + haloszoba) csak akkor frissíti, ha kitöltik. Üres → null (nem 0). A régi szobaszám nem íródik felül.
- Nullable boolean mezők (lift, garazs_onallo, teremgarazs, gepkocsibeallo, pince, szuteren, mellekepulet, klima): **háromállapotú** (Nincs adat=null / Igen=true / Nem=false). A „Nincs adat" nem ír felül meglévő értéket. m²: csak Igen esetén; Nem/Nincs adat → null.
- futesi_modok / holeadok: érintetlen null nem lesz üres tömb; a listában nem szereplő meglévő érték „Korábbi érték" jelöléssel megmarad.
- cim_kezi (boolean, Blokk 1D): true=kézi megjelenítési cím, false=automatikus (strukturált mezőkből). Meglévő, cím-mel bíró rekordok biztonságból cim_kezi=true.
- A közös tiszta logika a `js/logic.js`-ben van; a `tests/` ezt használja (nem másolatot).
- Rollback 1D: `ALTER TABLE public.properties DROP COLUMN IF EXISTS cim_kezi;`
