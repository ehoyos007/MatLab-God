# MATLAB Assistant — AI Chatbot Overlay

A MATLAB App Designer chatbot powered by Claude (Anthropic API) that watches your local `.m` files and provides context-aware help.

## Setup

1. **Requirements**: MATLAB R2020b or later (uses `uifigure` components)
2. **API Key**: Get an Anthropic API key from https://console.anthropic.com/
3. **Launch**:
   ```matlab
   cd matlab-assistant
   MatlabAssistant
   ```
4. Go to the **Settings** tab, paste your API key, select a folder containing your `.m` files, and click **Save Settings**.

## How It Works

- The assistant watches your selected folder for `.m` file changes (polls every 3 seconds)
- When you ask a question, it sends your message along with the contents of your recent files as context to Claude
- Responses are MATLAB-aware — it understands your code, variables, and errors

## Files

| File | Purpose |
|------|---------|
| `MatlabAssistant.m` | Main app (programmatic App Designer class) |
| `utils/callClaude.m` | Anthropic Messages API wrapper |
| `utils/watchFiles.m` | Poll-based file change detector |
| `utils/buildContext.m` | Assembles file contents into context string |
| `utils/parseResponse.m` | Formats API responses for display |
| `utils/loadConfig.m` | Configuration load/save |
| `config/` | Stores `assistant_config.mat` (auto-created) |
