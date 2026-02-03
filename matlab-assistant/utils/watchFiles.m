function [changed, fileState] = watchFiles(watchFolder, prevFileState)
%WATCHFILES Check a folder for .m file changes since last check.
%   [changed, fileState] = watchFiles(watchFolder, prevFileState)
%
%   Inputs:
%       watchFolder   - Path to folder to watch (string)
%       prevFileState - Previous file state map (containers.Map) or empty
%
%   Outputs:
%       changed   - true if any files were added, removed, or modified
%       fileState - Current file state map (filename -> datenum)

    changed = false;
    fileState = containers.Map('KeyType', 'char', 'ValueType', 'double');

    if ~isfolder(watchFolder)
        return;
    end

    files = dir(fullfile(watchFolder, '*.m'));

    for i = 1:numel(files)
        fname = fullfile(files(i).folder, files(i).name);
        fileState(fname) = files(i).datenum;
    end

    % Also watch command history
    histFile = fullfile(prefdir, 'History.xml');
    if isfile(histFile)
        d = dir(histFile);
        fileState(histFile) = d.datenum;
    end

    if isempty(prevFileState)
        changed = true;
        return;
    end

    % Compare
    currKeys = keys(fileState);
    prevKeys = keys(prevFileState);

    if ~isequal(sort(currKeys), sort(prevKeys))
        changed = true;
        return;
    end

    for i = 1:numel(currKeys)
        k = currKeys{i};
        if fileState(k) ~= prevFileState(k)
            changed = true;
            return;
        end
    end
end
