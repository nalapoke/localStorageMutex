define(['jquery'], function($) {

    var popupUrl;

    function init(idpUrl, appName, targetUrl) {
        popupUrl = idpUrl + '?app=' + appName + '&TARGET=' + encodeURIComponent(targetUrl);
    }

    function createSession() {
        var dfd = $.Deferred();

        var popupWindow = window.open(popupUrl, 'SSO popup');
        var pollTimer = window.setInterval(function() {
            if (popupWindow.closed !== false) {
                window.clearInterval(pollTimer);
                dfd.resolve();
            }
        }, 200);

        return dfd.promise();
    }

    // Expose public API
    var authenticationManagerComponent = {
        init: init,
        createSession: createSession
    };
    
    return authenticationManagerComponent;
});
