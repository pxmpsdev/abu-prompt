# PromptVibe

Statische Hackathon-Demo fuer die Unterseite "Prompt erstellen".

## Lokal starten

Direkt im Browser oeffnen:

```txt
index.html
```

Oder mit Ruby als lokalem Server:

```sh
ruby -run -e httpd . -p 4173
```

Dann aufrufen:

```txt
http://localhost:4173
```

## Uebergabe an Frontend

Die Seite sammelt aktuell dieses Payload-Format:

```js
{
  inputPrompt: string,
  goal: string,
  tone: string,
  language: string,
  audience: string
}
```

Die Mock-Funktion in `app.js` erzeugt 5 Varianten mit Score. Sobald eine echte API existiert, kann `createMockVariants(payload)` durch einen API-Call ersetzt werden.
