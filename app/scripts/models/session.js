/*
 * Denning chat application
 *
 * Session Module
 *
 */
define([
    'config',
    'cryptojs',
    'cryptojs_hmac',
], function(
    DCCONFIG,
    CryptoJS
) {

    function Session(app) {
        this.app = app;
    }

    Session.prototype = {

        create: function(params) {
            this.token = params.token;
            this.expirationTime = params.expirationTime || null;
            this.authParams = params.authParams;
        },

        update: function(params) {
            var date;

            if (params.token) {
                this.token = params.token;
            } else {

                if (params.authParams) {
                    this.authParams = params.authParams;
                }
                if (params.date) {
                    // set QB session expiration through 5 minutes
                    date = params.date;
                    date.setMinutes(date.getMinutes() + 5);
                    this.expirationTime = date.toISOString();
                }

                localStorage.setItem('DC.session', JSON.stringify({
                    token: this.token,
                    expirationTime: this.expirationTime,
                    authParams: this.authParams
                }));
            }
        },

        destroy: function() {
            localStorage.removeItem('DC.session');
            this.token = null;
            this.expirationTime = null;
            this.authParams = null;
        },

        // crypto methods for password
        encrypt: function(params) {
            if (params && params.password) {
                params.password = CryptoJS.AES.encrypt(params.password, DCCONFIG.qbAccount.authSecret).toString();
            }
            // console.log(CryptoJS.HmacSHA1('application_id=55869&auth_key=tpH4TbFKOcmrYet&nonce=3515&timestamp=1517023275', DCCONFIG.qbAccount.authSecret).toString());
            return params;
        },

        decrypt: function(params) {
            if (params && params.password) {
                params.password = CryptoJS.AES.decrypt(params.password, DCCONFIG.qbAccount.authSecret).toString(CryptoJS.enc.Utf8);
            }
            return params;
        }

    };

    return Session;

});
