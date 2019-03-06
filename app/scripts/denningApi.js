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
        email,
        baseUrl,
        sessionID;

    function DenningApi() {
        self = this;
    }

    DenningApi.prototype = {
        init: function() {
            var userInfo = JSON.parse(localStorage.userInfo);
            baseUrl = userInfo.catDenning[0].APIServer;
            sessionID = userInfo.sessionID;
            email = userInfo.email;
        },
        call: function (method, path, data, callback) {
            self.init();

            if (path == 'v2/chat/contact' || path == 'v1/chat/contact/fav') {
                url = 'https://denningonline.com.my/denningapi/' + path;
                _sessionID = "{334E910C-CC68-4784-9047-0F23D37C9CF9}";
            } else {
                url = baseUrl + path;
                _sessionID = sessionID;
            }

            return $.ajax({
                type: method,
                url: url,
                headers: {
                    "Content-Type": "application/json",
                    "webuser-sessionid": _sessionID,
                    "webuser-id": email
                }, 
                data: data,
                success: function(res) {
                    callback(res);
                }
            });
        }
    };

    return DenningApi;
});

