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

Die Seite nutzt einen AI-Input-Composer ohne Chatverlauf. Beim Absenden wird aktuell dieses Payload-Format erzeugt:

```js
{
  inputPrompt: string
}
```

Die Mock-Funktion in `app.js` erzeugt 3 Frontend-Varianten mit Score:

- Targeted Fix
- Technique Injection
- Self-Reflection Rubric

Sobald eine echte API existiert, kann `createMockVariants(payload)` durch einen API-Call ersetzt werden.
