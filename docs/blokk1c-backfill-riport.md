# Blokk 1C – Backfill riport (before / after)

Projekt: ErtekPont-staging • Rekordok: 16 • Rekordszintű backup: migr_block1c_backup (16 sor, zárolt).

## ingatlan_tipus átvezetése (régi → új fő típus / altípus)
| Régi érték (n) | Új ingatlan_tipus / altipus |
|---|---|
| családi ház (1) + Családi ház (6) | Ház / Családi ház (7) |
| Panel lakás (2) | Lakás / Panel lakás |
| Tégla lakás (1) | Lakás / Tégla lakás |
| sorház (1) | Ház / Sorház |
| lakás (1) | Lakás (altípus nélkül) |
| Telek (1) | Telek |
| NULL (3) | változatlan NULL – nem találunk ki besorolást |

## elhelyezkedes normalizálása
- belterület (2) → Belterület
- NULL (14) → változatlan

## Szobaszám
- A haloszoba oszlop integer → numeric (fél szobák, pl. 2,5 kezelhető).
- A migráció EGYETLEN szobaszámot sem módosított: szobak_changed = 0. A 2 és 4 szobás rekordok változatlanok.

## Ellenőrzés összesítés
- backup_rows = 16
- minden felismert érték a várt cél-értékre került (rekordszinten igazolva a backup ↔ properties join alapján)
- ismeretlen érték nem lett nullázva, nem kapott kitalált besorolást
- szobak_changed = 0

## Rollback (1C)
- Típus/elhelyezkedes visszaállítás a backupból:
  `UPDATE properties p SET ingatlan_tipus=b.regi_ingatlan_tipus, altipus=b.regi_altipus, elhelyezkedes=b.regi_elhelyezkedes, szobak=b.regi_szobak FROM migr_block1c_backup b WHERE b.property_id=p.id;`
- (opcionális) `ALTER TABLE properties ALTER COLUMN haloszoba TYPE integer USING round(haloszoba);`
