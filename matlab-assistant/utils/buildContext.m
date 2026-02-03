function context = buildContext(watchFolder, maxChars)
%BUILDCONTEXT Build a context string from .m files in a folder.
%   context = buildContext(watchFolder, maxChars)
%
%   Reads all .m files in watchFolder, sorted by most-recently-modified
%   first, and concatenates their contents up to maxChars characters.

    if nargin < 2
        maxChars = 8000;
    end

    context = "";

    if ~isfolder(watchFolder)
        return;
    end

    files = dir(fullfile(watchFolder, '*.m'));
    if isempty(files)
        return;
    end

    % Sort by modification time, newest first
    [~, idx] = sort([files.datenum], 'descend');
    files = files(idx);

    totalChars = 0;
    parts = strings(0);

    for i = 1:numel(files)
        fpath = fullfile(files(i).folder, files(i).name);
        try
            content = fileread(fpath);
        catch
            continue;
        end

        header = "--- " + string(files(i).name) + " ---";
        block = header + newline + string(content) + newline;

        if totalChars + strlength(block) > maxChars
            remaining = maxChars - totalChars;
            if remaining > strlength(header) + 50
                block = header + newline + extractBefore(string(content), remaining - strlength(header)) + newline + "... (truncated)";
                parts(end+1) = block; %#ok<AGROW>
            end
            break;
        end

        parts(end+1) = block; %#ok<AGROW>
        totalChars = totalChars + strlength(block);
    end

    context = join(parts, newline);
end
