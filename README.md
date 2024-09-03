# LangGraph Studio TypeScript Starter (Beta)

This is a side project to build my own AI agentic school that teaches me anything. [LangGraph.js](https://github.com/langchain-ai/langgraphjs) projects in [LangGraph Studio](https://github.com/langchain-ai/langgraph-studio).

<!-- ![LangGraph Studio](static/studio.png) -->

## Getting Started

This demo requires an [ANTHROPIC_API_KEY](https://www.anthropic.com/) and a [Tavily API key](https://tavily.com/) for search results.

1. **Clone this repository:**
   ```sh
   git clone https://github.com/hireshBrem/ai-school.git
   cd ai-school
   npm i 
   ```

2. **Set up environment variables:**
   Rename the existing `.env.example` file to `.env` and fill in your `OPENAI_API_KEY` and `TAVILY_API_KEY`.

3. **Download LangGraph Studio:**
   Download the latest release of LangGraph Studio [from here](https://github.com/langchain-ai/langgraph-studio/releases).

4. **Log in to LangSmith:**
   Log in/sign up for [LangSmith](https://smith.langchain.com/) if you haven't already.

5. **Open the project in LangGraph Studio:**
   Open the enclosing folder in LangGraph Studio.

6. **Start testing your app!**
Use 'npm run start' to run the agent. You can also use Langgraph Studio for this project. 

## Development

You must export your graph, or a function that returns a created graph, from a specified file. See [this page for more information](https://langchain-ai.github.io/langgraph/cloud/reference/cli/#configuration-file).

While iterating on your graph, you can edit past state and rerun your app from past states to debug specific nodes. Local changes will be automatically applied via hot reload.
