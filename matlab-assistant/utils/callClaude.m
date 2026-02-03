function reply = callClaude(userMessage, context, config)
%CALLCLAUDE Send a message to the Anthropic Messages API and return the reply.
%   reply = callClaude(userMessage, context, config)
%
%   Inputs:
%       userMessage - User's chat message (string)
%       context     - Current file context string (string)
%       config      - Config struct from loadConfig()
%
%   Output:
%       reply - Assistant's text response (string)

    if strlength(config.apiKey) == 0
        reply = "[Error] No API key configured. Go to Settings and enter your Anthropic API key.";
        return;
    end

    url = "https://api.anthropic.com/v1/messages";

    systemPrompt = "You are a MATLAB expert assistant. " + ...
        "Help the user with their MATLAB code, errors, and concepts. " + ...
        "Be concise and practical. Use MATLAB syntax in code examples.";

    if strlength(context) > 0
        systemPrompt = systemPrompt + newline + newline + ...
            "The user's current MATLAB workspace files:" + newline + context;
    end

    body = struct();
    body.model = config.model;
    body.max_tokens = 2048;
    body.system = systemPrompt;
    body.messages = {struct('role', 'user', 'content', userMessage)};

    options = weboptions( ...
        'MediaType', 'application/json', ...
        'HeaderFields', { ...
            'x-api-key', config.apiKey; ...
            'anthropic-version', '2023-06-01'; ...
            'content-type', 'application/json' ...
        }, ...
        'Timeout', 60 ...
    );

    try
        response = webwrite(url, body, options);
        if isfield(response, 'content') && ~isempty(response.content)
            reply = string(response.content(1).text);
        else
            reply = "[Error] Empty response from API.";
        end
    catch ME
        reply = "[Error] API call failed: " + string(ME.message);
    end
end
