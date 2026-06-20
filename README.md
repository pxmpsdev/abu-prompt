# PromptVibe

Statische Hackathon-Demo fuer die Unterseite "Prompt erstellen".

## Lokal starten

Backend starten:

```powershell
cd backend
npm install
npm run dev
```

Frontend starten:

```powershell
cd ..
npx vite --host 127.0.0.1 --port 4173 .
```

Dann aufrufen:

```txt
http://localhost:4173
```

## Uebergabe an Frontend

Die Seite nutzt einen AI-Input-Composer ohne Chatverlauf. Beim Absenden ruft sie das Backend auf:

```js
POST http://localhost:3000/api/prompts/improve
```

Payload:

```js
{
  prompt: string
}
```

Die API erzeugt 3 direkte Prompt-Varianten mit Score. `variant.prompt` ist der final nutzbare Prompt, nicht ein Text wie "Verbessere diesen Prompt...".

Der Backend-Service erwartet einen OpenAI-kompatiblen AI-Endpunkt. Die Defaults stehen in `backend/.env.example`.
