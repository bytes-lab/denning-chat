/*
 * Denning chat application
 *
 * Denning API Wrapper
 *
 */
define([
    'jquery',
    'config'
], function(
    $,
    DCCONFIG
) {    

    var self, 
        baseUrl,
        sessionID;

    function DenningApi() {
        self = this;
        baseUrl = 'https://denningonline.com.my/denningapi/'; 
        sessionID = "{334E910C-CC68-4784-9047-0F23D37C9CF9}";
    }

    DenningApi.prototype = {
        call: function (method, path, data) {
            return $.ajax({
                type: method,
                url: baseUrl+path,
                headers: {
                    "Content-Type": "application/json",
                    "webuser-sessionid": sessionID
                }, 
                data: data
            })
        }
    };

    return DenningApi;
});

