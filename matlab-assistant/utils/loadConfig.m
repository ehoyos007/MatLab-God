function config = loadConfig()
%LOADCONFIG Load or create default assistant configuration.
%   config = loadConfig() returns a struct with fields:
%       apiKey       - Anthropic API key (string)
%       watchFolder  - Path to folder of .m files to watch (string)
%       model        - Claude model ID (string)
%       maxContext   - Max characters of file context to send (double)

    configPath = fullfile(fileparts(fileparts(mfilename('fullpath'))), ...
        'config', 'assistant_config.mat');

    if isfile(configPath)
        loaded = load(configPath, 'config');
        config = loaded.config;
    else
        config = struct();
        config.apiKey = "";
        config.watchFolder = "";
        config.model = "claude-sonnet-4-20250514";
        config.maxContext = 8000;
    end
end
