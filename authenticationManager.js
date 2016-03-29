define(['jquery'], function($) {

    function init() {

    }

    function createSession() {
        var dfd = $.Deferred();

        window.setTimeout(function() {
            dfd.resolve();
        }, 2000);

        return dfd.promise();
    }

    // Expose public API
    var authenticationManagerComponent = {
        init: init,
        createSession: createSession
    };
    
    return authenticationManagerComponent;
});
