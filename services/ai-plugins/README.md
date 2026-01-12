# Sonántica AI Plugins

> "Intelligence at the service of intention."

The **AI Plugins** category represents the analytical frontier of Sonántica. These are optional, high-performance modules designed to deepen the listening experience through machine learning and advanced signal processing.

## 🧠 Philosophy

Our AI strategy is guided by **User Autonomy** and **Respect for Sound**. We do not use AI to "fix" or "replace" the original audio, but to **interpret**, **organize**, and **enrich** it. Every AI feature is:
1.  **Optional**: The user chooses what to enable.
2.  **Explainable**: We show how and why it works.
3.  **Local**: Prioritizing local execution to protect the user's privacy and library.

## 📦 The AI Stack

The Sonántica AI ecosystem is divided into three specialized nodes:

| Plugin | Responsibility | Identity |
| :--- | :--- | :--- |
| **[Demucs](./demucs)** | Source Separation | *The Analytical Ear* |
| **[The Brain](./brain)** | Audio Similarity & Embeddings | *The Connective Tissue* |
| **[Knowledge](./knowledge)** | LLM Enrichment & Context | *The Wise Librarian* |

## 🛠️ Global Standards

All AI plugins in this directory follow a unified architecture:
- **Containerized Isolation**: Each plugin runs in its own Docker container.
- **FastAPI Standard**: Unified API signatures for status, processing, and results.
- **Resource Consciousness**: Shared models and caches via `sonantica_ai_cache` volume.
- **Hardware Agnostic**: Supports both CPU and NVIDIA GPU (CUDA) execution where available.

## 🚀 Activation

AI plugins are part of the `ai` profile in Docker Compose. To enable the full stack:

```bash
docker compose --profile ai up -d
```

> "We don't optimize to attract attention, but to preserve intention."

---

Made with ❤ and **Synthesizer**.
