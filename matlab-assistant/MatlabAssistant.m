classdef MatlabAssistant < matlab.apps.AppBase

    % Properties that correspond to app components
    properties (Access = public)
        UIFigure           matlab.ui.Figure
        GridLayout         matlab.ui.container.GridLayout
        TabGroup           matlab.ui.container.TabGroup

        % Chat tab
        ChatTab            matlab.ui.container.Tab
        ChatHistory        matlab.ui.control.TextArea
        MessageInput       matlab.ui.control.EditField
        SendButton         matlab.ui.control.Button
        ClearButton        matlab.ui.control.Button

        % Settings tab
        SettingsTab        matlab.ui.container.Tab
        APIKeyField        matlab.ui.control.EditField
        APIKeyLabel        matlab.ui.control.Label
        WatchFolderField   matlab.ui.control.EditField
        WatchFolderLabel   matlab.ui.control.Label
        BrowseButton       matlab.ui.control.Button
        ModelDropDown       matlab.ui.control.DropDown
        ModelLabel         matlab.ui.control.Label
        SaveSettingsButton matlab.ui.control.Button
        StatusLabel        matlab.ui.control.Label
    end

    properties (Access = private)
        Config             struct
        FileState          % containers.Map for file watcher
        FileContext        string = ""
        WatchTimer         timer
        ChatLog            string = ""
    end

    methods (Access = private)

        function startupFcn(app)
            % Add utils to path
            utilsPath = fullfile(fileparts(mfilename('fullpath')), 'utils');
            addpath(utilsPath);

            % Load config
            app.Config = loadConfig();
            app.APIKeyField.Value = char(app.Config.apiKey);
            app.WatchFolderField.Value = char(app.Config.watchFolder);

            % Initialize file watcher
            app.FileState = containers.Map();
            if strlength(app.Config.watchFolder) > 0
                app.startWatcher();
            end

            app.appendChat("System", "MATLAB Assistant ready. Type a question below.");

            % Try always-on-top
            try
                drawnow;
                warning('off', 'MATLAB:HandleGraphics:ObsoletedProperty:JavaFrame');
                jFrame = get(app.UIFigure, 'JavaFrame'); %#ok<JAVFM>
                jWindow = jFrame.fHG2Client.getWindow();
                if ~isempty(jWindow)
                    jWindow.setAlwaysOnTop(true);
                end
            catch
                % Java frame not available in newer MATLAB — skip
            end
        end

        function startWatcher(app)
            if ~isempty(app.WatchTimer) && isvalid(app.WatchTimer)
                stop(app.WatchTimer);
                delete(app.WatchTimer);
            end
            app.WatchTimer = timer( ...
                'ExecutionMode', 'fixedSpacing', ...
                'Period', 3, ...
                'TimerFcn', @(~,~) app.pollFiles() ...
            );
            start(app.WatchTimer);
        end

        function pollFiles(app)
            try
                [changed, newState] = watchFiles(app.Config.watchFolder, app.FileState);
                if changed
                    app.FileState = newState;
                    app.FileContext = buildContext(app.Config.watchFolder, app.Config.maxContext);
                end
            catch
                % Silently handle — folder may not exist yet
            end
        end

        function sendMessage(app)
            msg = strtrim(string(app.MessageInput.Value));
            if strlength(msg) == 0
                return;
            end

            app.MessageInput.Value = '';
            app.appendChat("You", msg);

            % Show thinking indicator
            app.SendButton.Enable = 'off';
            app.SendButton.Text = '...';
            drawnow;

            reply = callClaude(msg, app.FileContext, app.Config);
            reply = parseResponse(reply);

            app.appendChat("Claude", reply);

            app.SendButton.Enable = 'on';
            app.SendButton.Text = 'Send';
        end

        function appendChat(app, sender, message)
            entry = "[ " + sender + " ]" + newline + message + newline;
            app.ChatLog = app.ChatLog + newline + entry;
            app.ChatHistory.Value = char(app.ChatLog);

            % Scroll to bottom
            drawnow;
            scroll(app.ChatHistory, 'bottom');
        end

        function saveSettings(app)
            app.Config.apiKey = string(app.APIKeyField.Value);
            app.Config.watchFolder = string(app.WatchFolderField.Value);
            app.Config.model = string(app.ModelDropDown.Value);

            configPath = fullfile(fileparts(mfilename('fullpath')), ...
                'config', 'assistant_config.mat');
            config = app.Config; %#ok<PROPLC>
            save(configPath, 'config');

            app.StatusLabel.Text = 'Settings saved.';

            % Restart watcher with new folder
            if strlength(app.Config.watchFolder) > 0
                app.FileState = containers.Map();
                app.startWatcher();
            end
        end

        function browseFolder(app)
            folder = uigetdir('', 'Select MATLAB workspace folder to watch');
            if folder ~= 0
                app.WatchFolderField.Value = folder;
            end
        end

        function onClose(app)
            if ~isempty(app.WatchTimer) && isvalid(app.WatchTimer)
                stop(app.WatchTimer);
                delete(app.WatchTimer);
            end
            delete(app.UIFigure);
        end
    end

    methods (Access = private)

        function createComponents(app)
            % Main figure
            app.UIFigure = uifigure('Visible', 'off');
            app.UIFigure.Position = [100 100 420 600];
            app.UIFigure.Name = 'MATLAB Assistant';
            app.UIFigure.CloseRequestFcn = @(~,~) app.onClose();

            % Tab group
            app.TabGroup = uitabgroup(app.UIFigure);
            app.TabGroup.Position = [1 1 420 600];

            % ---- Chat Tab ----
            app.ChatTab = uitab(app.TabGroup, 'Title', 'Chat');

            app.ChatHistory = uitextarea(app.ChatTab);
            app.ChatHistory.Editable = 'off';
            app.ChatHistory.Position = [10 80 400 500];
            app.ChatHistory.FontName = 'Courier New';
            app.ChatHistory.FontSize = 12;

            app.MessageInput = uieditfield(app.ChatTab, 'text');
            app.MessageInput.Position = [10 40 310 30];
            app.MessageInput.Placeholder = 'Ask about your MATLAB code...';
            app.MessageInput.ValueChangedFcn = @(~, event) app.onEnterKey(event);

            app.SendButton = uibutton(app.ChatTab, 'push');
            app.SendButton.Position = [325 40 85 30];
            app.SendButton.Text = 'Send';
            app.SendButton.ButtonPushedFcn = @(~,~) app.sendMessage();

            app.ClearButton = uibutton(app.ChatTab, 'push');
            app.ClearButton.Position = [10 5 85 30];
            app.ClearButton.Text = 'Clear Chat';
            app.ClearButton.ButtonPushedFcn = @(~,~) app.clearChat();

            % ---- Settings Tab ----
            app.SettingsTab = uitab(app.TabGroup, 'Title', 'Settings');

            app.APIKeyLabel = uilabel(app.SettingsTab);
            app.APIKeyLabel.Position = [20 520 200 22];
            app.APIKeyLabel.Text = 'Anthropic API Key:';

            app.APIKeyField = uieditfield(app.SettingsTab, 'text');
            app.APIKeyField.Position = [20 490 380 28];
            app.APIKeyField.Placeholder = 'sk-ant-...';

            app.WatchFolderLabel = uilabel(app.SettingsTab);
            app.WatchFolderLabel.Position = [20 440 200 22];
            app.WatchFolderLabel.Text = 'Watch Folder:';

            app.WatchFolderField = uieditfield(app.SettingsTab, 'text');
            app.WatchFolderField.Position = [20 410 300 28];

            app.BrowseButton = uibutton(app.SettingsTab, 'push');
            app.BrowseButton.Position = [325 410 75 28];
            app.BrowseButton.Text = 'Browse';
            app.BrowseButton.ButtonPushedFcn = @(~,~) app.browseFolder();

            app.ModelLabel = uilabel(app.SettingsTab);
            app.ModelLabel.Position = [20 360 200 22];
            app.ModelLabel.Text = 'Model:';

            app.ModelDropDown = uidropdown(app.SettingsTab);
            app.ModelDropDown.Position = [20 330 250 28];
            app.ModelDropDown.Items = { ...
                'claude-sonnet-4-20250514', ...
                'claude-haiku-4-20250414', ...
                'claude-opus-4-20250514' ...
            };

            app.SaveSettingsButton = uibutton(app.SettingsTab, 'push');
            app.SaveSettingsButton.Position = [20 270 120 30];
            app.SaveSettingsButton.Text = 'Save Settings';
            app.SaveSettingsButton.ButtonPushedFcn = @(~,~) app.saveSettings();

            app.StatusLabel = uilabel(app.SettingsTab);
            app.StatusLabel.Position = [150 270 250 30];
            app.StatusLabel.Text = '';

            app.UIFigure.Visible = 'on';
        end
    end

    methods (Access = private)
        function onEnterKey(app, event)
            % Send on Enter key (ValueChanged fires on Enter in uieditfield)
            if ~isempty(event.Value)
                app.sendMessage();
            end
        end

        function clearChat(app)
            app.ChatLog = "";
            app.ChatHistory.Value = '';
            app.appendChat("System", "Chat cleared.");
        end
    end

    methods (Access = public)

        function app = MatlabAssistant()
            createComponents(app);
            registerApp(app, app.UIFigure);
            startupFcn(app);

            if nargout == 0
                clear app;
            end
        end

        function delete(app)
            if ~isempty(app.WatchTimer) && isvalid(app.WatchTimer)
                stop(app.WatchTimer);
                delete(app.WatchTimer);
            end
            delete(app.UIFigure);
        end
    end
end
