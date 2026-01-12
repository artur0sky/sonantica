# Sonántica AI: Knowledge (Enrichment)

> "Context is the silence between the notes."

The **Knowledge Plugin** is the librarian and historian of Sonántica. It leverages Large Language Models (LLMs) to provide deep context, stories, and technical explanations about the music you love.

## 🧠 Philosophy

Knowledge embodies the **Wise** aspect of our persona. It believes that listening is an active act of learning. By providing historical context, lyrical analysis, and artist backgrounds, it bridges the gap between the sound and the story. It treats the user as a curious intellectual, offering depth without pretension.

## 📦 Features

- **Contextual Enrichment**: Generates artist biographies and album histories on demand.
- **Lyrical Interpretation**: Analyzes themes and meanings in tracks (where lyrics are available).
- **Technical Explanation**: Explains complex audio concepts (like bitrates vs sample rates) for the specific files in the library.
- **Ollama Integration**: Runs entirely locally via Ollama, respecting the user's privacy and autonomy.

## 🛡️ Security & Reliability

- **Private by Design**: No data leaves the user's machine. All inference is local.
- **Smart Caching**: Results are cached in Redis and PostgreSQL to minimize repetitive LLM usage.
- **Sanitized Prompts**: Uses strict templates to ensure information is relevant, accurate, and follows the Sonántica voice.

## ⚡ Performance Specifications

- **Asynchronous Enrichment**: Large requests are handled as background tasks to keep the UI fluid.
- **Resource Management**: Automatically adjusts to available system resources for local LLM execution.
- **TTL Cache**: Knowledge is ephemeral but persistent enough to be useful, with configurable Time-To-Live.

## 🏗️ Architecture

- **Language**: Python 3.12+
- **LLM Client**: Ollama (Local)
- **Framework**: FastAPI
- **Cache**: Redis / PostgreSQL

## ⚖️ Responsibility

This service handles:
- Interfacing with the local Ollama instance.
- Formatting and presenting musicological data.
- Managing the knowledge cache.
- Answering technical questions in the Educational UI.

> "To listen is to learn the story of a sound."

## 📄 License

Licensed under the **Apache License, Version 2.0**.

---

Made with ❤ and **Ambient**.
