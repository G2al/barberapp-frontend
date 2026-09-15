# Prenotazioni per conto di un cliente — integrazione in attesa

## Verifica eseguita

Il 15 settembre 2026 sono stati letti, senza modifiche, `routes/api.php` e
`app/Http/Controllers/Api/BookingController.php` del backend locale
`../barberapp`, branch `mottolastyle`. Non è una verifica del deploy produzione
né una conferma ricevuta dal backend developer.

- Non risultano rotte API per elencare i clienti o creare prenotazioni admin per terzi.
- `POST /api/bookings` non valida `user_id` e salva sempre `$request->user()->id`.
- La nota è supportata dalla rotta normale solo per admin (massimo 1000 caratteri).
- `GET /api/bookings` restituisce solo le prenotazioni dell'utente autenticato,
  non quelle create per altri clienti.

## Stato frontend

Nella pagina Prenota, `AdminBookingSection` legge `/auth/me`: solo una risposta
valida con `role === "admin"` e id corrispondente alla sessione mostra la sezione.
Ruolo mancante, diverso o errore di verifica: sezione nascosta.

Il form è predisposto, ma disabilitato con un avviso finché non riceve un adapter
`AdminBookingIntegration`. Non ci sono URL admin inventati, dati cliente fittizi,
fallback sulla rotta normale, né invii di `user_id` a `/bookings`.
Il wizard normale è invariato. Nessun dato del form admin viene persistito.

Il componente predisposto comprende cliente, professionista, servizio filtrato,
data, orari dinamici, nota, riepilogo, conferma esplicita, blocco doppi clic,
messaggi 401/403/422/400 e aggiornamento delle query dopo successo.
I controlli frontend del ruolo NON sostituiscono l'autorizzazione backend.

## Da concordare con il backend developer prima di attivare

1. Metodo/URL elenco clienti; risposta con id, nome, cognome, email e telefono;
   ricerca, paginazione e criteri di prenotabilità (es. clienti disattivati).
2. Metodo/URL **dedicato agli admin** per creare prenotazioni per altri utenti.
   Deve validare e usare realmente `user_id`, senza ripiegare sull'admin corrente.
3. Sanctum Bearer + controllo server `role === admin` su entrambi gli endpoint;
   401 senza sessione, 403 per ruoli non autorizzati.
4. Payload da supportare:

   ```json
   {
     "user_id": 12,
     "staff_id": 3,
     "service_id": 8,
     "date": "2026-09-20",
     "time": "15:00",
     "note": "Prenotazione effettuata per conto del cliente"
   }
   ```

5. Nota facoltativa: confermare limite, stringa vuota/null, salvataggio e visibilità.
   Il limite 1000 della rotta normale non è assunto come contratto della futura API.
6. Validazione cliente, compatibilità servizio/staff, disponibilità, conflitti,
   limiti cliente, fuso orario e destinatario delle notifiche (il cliente selezionato).
7. Risposte di successo/errori: confermare struttura, `message`, `errors` per 422,
   gestione slot non disponibile con 400, eventuale idempotenza dei tentativi.
8. Endpoint/lista admin per vedere le prenotazioni dei clienti e filtri/paginazione:
   la lista personale attuale non può essere usata come agenda amministrativa.

## Collegamento successivo

Implementare l'adapter usando il client `api` esistente (stesso token Bearer e
gestione 401), esclusivamente con URL confermati. Normalizzare clienti e risposta
di creazione secondo `src/types/admin-booking.ts`; non usare type cast per mascherare
un contratto diverso. Collegare `refreshBookings` alla lista admin concordata.
Il componente invalida anche prenotazioni personali e disponibilità, ma non inserisce
mai la prenotazione di un cliente nella cache personale dell'admin.

Passare l'adapter da un componente client ad `AdminBookingSection`; la pagina
server attuale non passa funzioni. Aggiungere i limiti confermati e l'eventuale
ricerca/paginazione clienti prima del rilascio operativo.

Test di accettazione dopo disponibilità API: admin/client/ruolo mancante, accesso
diretto non autorizzato, annullamento riepilogo senza POST, cambio staff/servizio/data
che azzera l'orario, payload e note multilinea, doppi clic, 401/403/422/400,
successo visibile nell'agenda corretta e notifiche al cliente giusto.
