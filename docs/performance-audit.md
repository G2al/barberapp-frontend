# Performance audit

Audit eseguito il 3 agosto 2026 sulla build di produzione, pagina `/login`, profilo mobile Lighthouse.

| Metrica | Prima | Dopo |
| --- | ---: | ---: |
| Performance | 90 | 95 |
| Accessibility | 94 | 94 |
| Best Practices | 100 | 100 |
| First Contentful Paint | 1,1 s | 0,8 s |
| Largest Contentful Paint | 3,5 s | 2,9 s |
| Speed Index | 2,3 s | 0,8 s |
| Total Blocking Time | 50 ms | 60 ms |
| Cumulative Layout Shift | 0 | 0 |

## Intervento applicato

Il logo Lama era l'elemento LCP. È stato reso immediatamente individuabile dal browser con caricamento eager e priorità alta. Dopo l'intervento tutti i controlli Lighthouse relativi alla scoperta della risorsa LCP risultano superati.

## Osservazioni

- Il layout è stabile (`CLS 0`) e il thread principale rimane reattivo (`TBT 60 ms`).
- Il punteggio Accessibility pari a 94 dipende dal blocco dello zoom nel viewport, requisito esplicito della PWA.
- Lighthouse segnala circa 83 KiB di JavaScript potenzialmente inutilizzato nella pagina di login. Proviene soprattutto dal runtime React e dalle librerie del form; rimuoverlo richiederebbe una riscrittura sproporzionata rispetto al beneficio.
- La splash animata della route `/` non è inclusa nel test: la durata è una scelta di esperienza, non tempo di caricamento involontario.
- Un audit delle sezioni autenticate va ripetuto sull'ambiente pubblicato con una sessione di test, per includere immagini remote e latenza reale delle API.
