function formatted = parseResponse(rawText)
%PARSERESPONSE Format Claude's response for display in the chat panel.
%   formatted = parseResponse(rawText)
%
%   Strips excessive whitespace and ensures clean display.

    formatted = strtrim(string(rawText));

    % Collapse triple+ newlines to double
    while contains(formatted, newline + newline + newline)
        formatted = replace(formatted, newline + newline + newline, newline + newline);
    end
end
