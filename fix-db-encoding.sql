-- fix-db-encoding.sql
-- Konvertiert falsch gespeicherte Umlaute in der Datenbank

BEGIN;

-- Backup erstellen (nur zur Sicherheit anzeigen)
SELECT 'BACKUP EMPFOHLEN: pg_dump -U betfinder betfinder > backup_before_fix.sql';

-- Zeige betroffene Teams
SELECT 
    id, 
    name as old_name,
    convert_from(convert_to(name, 'LATIN1'), 'UTF8') as new_name
FROM teams 
WHERE name LIKE '%├%' OR name LIKE '%╝%' OR name LIKE '%╗%'
LIMIT 10;

-- Wenn die Vorschau OK aussieht, dann ausführen:
-- UPDATE teams SET name = convert_from(convert_to(name, 'LATIN1'), 'UTF8') 
-- WHERE name LIKE '%├%' OR name LIKE '%╝%' OR name LIKE '%╗%';

ROLLBACK; -- Erstmal nur Vorschau, kein Commit
