define([], function() {

    var mutex_x_key = '__MUTEX_x';
    var mutex_y_key = '__MUTEX_y';

    function _executeCriticalSection(localStorageKey, callback) {
        try {
            callback();
        } finally {
            window.localStorage.removeItem(localStorageKey + mutex_y_key);
        }
    }

    function lockAndExecute(localStorageKey, id, callback) {
        window.localStorage.setItem(localStorageKey + mutex_x_key, id);
        if (window.localStorage.getItem(localStorageKey + mutex_y_key)) {
            window.setTimeout(function () { lockAndExecute(localStorageKey, id, callback); }, 0);
            return;
        }
        window.localStorage.setItem(localStorageKey + mutex_y_key, id);
        if (window.localStorage.getItem(localStorageKey + mutex_x_key) !== id) {
            window.setTimeout(function () {
                if (window.localStorage.getItem(localStorageKey + mutex_y_key) !== id) {
                    window.setTimeout(function() { lockAndExecute(localStorageKey, id, callback); }, 0);
                } else {
                    _executeCriticalSection(localStorageKey, callback);
                }
            }, 50);
            return;
        } else {
            _executeCriticalSection(localStorageKey, callback);
        }
    }

    var mutexComponent = {
        lockAndExecute: lockAndExecute
    };

    return mutexComponent;
});
