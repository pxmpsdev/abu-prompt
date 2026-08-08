# ABU Prompt

**AI-Based Understanding for better prompts.**

ABU Prompt is a hackathon prototype for creating and improving AI prompts.

Instead of learning complicated prompt engineering techniques, users simply describe what they want to achieve. ABU transforms that input into **3 clear, precise, and directly usable prompt variants**, each with a score.

## 💡 The Idea

> You know what you want. ABU helps you say it better.

Many people know what they want AI to do, but don't know how to write an effective prompt.

ABU closes that gap by taking a user's natural-language idea and turning it into better prompts — without requiring the user to understand prompt engineering.

## ✨ Features

- 🧠 AI-powered prompt improvement
- ✍️ Natural-language input
- 🔀 3 different prompt variants
- 📊 Score for each variant
- ⚡ Directly usable prompts
- 💬 AI input composer without chat history
- 🔌 OpenAI-compatible backend service
- 🎯 Simple and focused user experience

## 🏆 Hackathon

ABU Prompt was built as a OpenAI Codex hackathon project at **WU Vienna University** in Vienna.

The central question behind the project:

> How can we make AI more accessible to people who don't know prompt engineering?

Our approach:

> Don't make users learn how to write better prompts. Let AI understand what they mean and turn it into a better prompt.

## 🧠 Why "ABU"?

**ABU = AI-Based Understanding**

The name represents the core idea of the project: understanding the user's intent and transforming it into a high-quality prompt that can be used directly with AI.

## 🔄 How It Works

```text
User describes an idea
        ↓
ABU analyzes the intent
        ↓
3 prompt variants are generated
        ↓
Each variant receives a score
        ↓
User chooses the preferred version
        ↓
Prompt is ready to use
```

## 🖥️ Run Locally

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

Then open:

```txt
http://localhost:4173
```

## 🔌 Frontend Integration

The page uses an AI input composer without chat history. When the user submits a prompt, the frontend calls the backend:

```js
POST http://localhost:3000/api/prompts/improve
```

Payload:

```js
{
  prompt: string
}
```

Example:

```json
{
  "prompt": "Create a marketing strategy for my new café."
}
```

## 🤖 API Response

The API generates **3 direct prompt variants with a score**.

`variant.prompt` is the **final, ready-to-use prompt**.

It is **not** a meta-instruction such as:

```text
"Improve this prompt..."
```

Instead, `variant.prompt` should be a complete prompt that can be directly used for the user's actual task.

Example:

```json
{
  "variants": [
    {
      "prompt": "You are an experienced marketing strategist for local restaurants...",
      "score": 92
    },
    {
      "prompt": "Develop a comprehensive marketing strategy for a new café...",
      "score": 88
    },
    {
      "prompt": "Create a practical marketing plan for launching a new café...",
      "score": 84
    }
  ]
}
```

## 🏗️ Architecture

```text
┌─────────────────────────┐
│        Frontend         │
│                         │
│    AI Input Composer    │
└───────────┬─────────────┘
            │
            │ POST /api/prompts/improve
            │ { prompt: string }
            ↓
┌─────────────────────────┐
│        Backend          │
│                         │
│  Prompt Improvement     │
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────┐
│   OpenAI-compatible     │
│      AI Endpoint        │
└───────────┬─────────────┘
            │
            ↓
      3 Prompt Variants
         + Scores
            │
            ↓
┌─────────────────────────┐
│        Frontend         │
│                         │
│   Compare → Choose → Use│
└─────────────────────────┘
```

## ⚙️ Backend Configuration

The backend service expects an **OpenAI-compatible AI endpoint**.

Default configuration values are provided in:

```txt
backend/.env.example
```

Configure the required environment variables before starting the backend.

## 📁 Project Structure

```txt
.
├── backend/
│   ├── ...
│   └── .env.example
│
├── ...
│
└── README.md
```

The frontend contains the AI input composer and the UI for displaying generated prompt variants.

The backend handles the prompt improvement request and communication with the AI service.

## 🎯 Example

### Input

```txt
Create a marketing strategy for my new café.
```

### ABU

```text
🧠 Understand intent
        ↓
✨ Generate different approaches
        ↓
📊 Score the variants
```

### Output

```text
Variant 1 — Score: 92

You are an experienced marketing strategist for local
restaurants. Develop a comprehensive launch strategy...
```

```text
Variant 2 — Score: 88

Develop a comprehensive marketing strategy for a new
café, including target audience, positioning...
```

```text
Variant 3 — Score: 84

Create a practical marketing plan for launching a new
café with a limited budget...
```

The user can then choose the version that best matches their goal.

## 🔮 Future Ideas

ABU was built as a hackathon prototype, but the concept could be extended further.

### 🧪 Prompt Evaluation

Instead of only improving prompts, ABU could test whether the improved prompt actually produces a better result:

```text
Original Prompt
      ↓
AI Response
      ↓
Improved Prompt
      ↓
AI Response
      ↓
Compare Results
```

### 📊 Detailed Scoring

The current score could be broken down into:

- 🎯 Clarity
- 🧠 Context
- 📋 Constraints
- 📝 Output format
- 🔍 Specificity

### 🎨 Use Cases

Prompt optimization could be tailored for:

- 💻 Coding
- 📚 Education
- 🔬 Research
- ✍️ Writing
- 📣 Marketing
- 💼 Business

### ⚡ More Ideas

- Prompt history
- Before / after comparison
- Save and share prompts
- Compare different AI models
- Execute and compare prompt results
- Automatic suggestions for further improvements

## ❤️ The Idea in One Sentence

> **ABU Prompt turns "I know what I want" into "I know exactly how to ask AI for it."**

## 📜 Status

🚧 **Hackathon Prototype**

ABU Prompt is currently a proof of concept demonstrating the core user experience and AI-powered prompt generation.
