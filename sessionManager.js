define(['jquery', 'localStorageMutex'], function($, localStorageMutex) {

    var storageAuthorityKey = 'TRIC_SESSION_AUTHORITY';
    var storageSessionKey = 'TRIC_SESSION_STATUS';
    var guid;
    var usingLocalStorage;
    var webStorage;
    var authManager;

    var SessionStatus = {
        NOT_CREATED: 'not created',
        CREATED: 'created'
    };

    function init(authenticationManager, useLocalStorage) {
        authManager = authenticationManager;

        guid = _createGuid();
        document.getElementById('guid').innerHTML = guid;

        usingLocalStorage = useLocalStorage || false;
        webStorage = usingLocalStorage ? window.localStorage : window.sessionStorage;

        _addEventListeners();
        _tryEstablishAuthority();
    }

    function _tryEstablishAuthority() {
        _logMessage('Attempting to establish authority.', true);

        _establishAuthority().then(
            function onTryEstablishAuthoritySuccess() {
                _logMessage('I have established authority.', true, 'color:green;');
                _createSession();
            },
            function onTryEstablishAuthorityFailure(storageAuthorityGuid) {
                _logMessage('Unable to establish authority. ' + storageAuthorityGuid.substring(0, 7) + ' has it.', true, 'color:red;');
                _logMessage('Waiting...', true);
            }
        );
    }

    function _establishAuthority() {
        var dfd = $.Deferred();

        window.setTimeout(function() {
            _executeCritical(function () {
                var storageAuthorityGuid = webStorage.getItem(storageAuthorityKey);
                if (!storageAuthorityGuid || storageAuthorityGuid === guid) {
                    webStorage.setItem(storageAuthorityKey, guid);
                    dfd.resolve();
                } else {
                    dfd.reject(storageAuthorityGuid.substring(0,7));
                }
            });
        }, 2000);

        return dfd.promise();
    }

    function _createSession() {
        _logMessage('Creating a session.', true);
        webStorage.setItem(storageSessionKey, SessionStatus.NOT_CREATED);
        authManager.createSession().then(
            function onCreateSessionSuccess() {
                _logMessage('Session was created. Informing others.', true);
                window.setTimeout(function() {
                    webStorage.setItem(storageSessionKey, SessionStatus.CREATED);
                    _reload();
                }, 2000);
            },
            function onCreateSessionError() {
                _logMessage('Unable to create session.', true);
            }
        );
    }

    function _addEventListeners() {
        // Add listener for window unload event.
        window.addEventListener('unload', _onWindowUnload, false);

        if (window.parent.window !== window.self) {
            // Widget is in an iFrame. Add listener for parent window unload event.
            window.parent.addEventListener('unload', _onWindowUnload, false);
        }

        // Add listener for storage event.
        window.addEventListener('storage', _onStorageChange, false);
    }

    function _onWindowUnload() {
        _executeCritical(function() {
            var storageAuthorityGuid = webStorage.getItem(storageAuthorityKey);
            if (storageAuthorityGuid === guid) {
                // This widget currently has authority and the window containing it is closing.
                // Relinquish the authority claim in web storage.
                webStorage.removeItem(storageAuthorityKey);
            }
        });
    }

    function _onStorageChange(event) {
        if (event.storageArea.length === 0 || (event.key === storageAuthorityKey && event.newValue === null)) {
            _logMessage('Authority was relinquished.', false);
            _tryEstablishAuthority();
        } else if (event.key === storageSessionKey && event.newValue === SessionStatus.CREATED) {
            _logMessage('Session established by another instance.', true);
            _reload();
        }
    }

    function _executeCritical(callback) {
        if (usingLocalStorage) {
            localStorageMutex.lockAndExecute(storageAuthorityKey, guid, callback);
        } else {
            callback();
        }
    }

    function _reload() {
        //window.location.reload();
        _logMessage('Reloading page.', true);
    }

    function _createGuid() {
        // guid creation code below came from workbench/hub.js in ADC static content
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function _logMessage(message, append, style) {
        var html = '<p' + (style ? ' style=\"' + style + '\">' : '>') + message + '</p>';
        if (append) {
            document.getElementById('log').innerHTML += html;
        } else {
            document.getElementById('log').innerHTML = html;
        }
    }

    // Expose public API
    var sessionManagerComponent = {
        init: init
    };

    return sessionManagerComponent;
});
