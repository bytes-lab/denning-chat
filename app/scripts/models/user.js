/*
 * Denning chat application
 *
 * User Module
 *
 */
define([
    'jquery',
    'underscore',
    'config',
    'quickblox',
    'Helpers',
    'models/person',
    'views/profile',
    'views/change_password'
], function(
    $,
    _,
    DCCONFIG,
    QB,
    Helpers,
    Person,
    ProfileView,
    ChangePassView
) {

    var self,
        tempParams,
        isFacebookCalled;

    function User(app) {
        this.app = app;
        this._is_import = null;
        this._valid = false;
        self = this;
    }

    User.prototype = {

        initProfile: function() {
            var currentUser = new Person(_.clone(self.contact), {
                app: self.app,
                parse: true
            });

            var profileView = new ProfileView({
                model: currentUser
            });

            var changePassView = new ChangePassView({
                model: currentUser
            });

            self.app.views.Profile = profileView;
            self.app.views.ChangePass = changePassView;
        },

        updateQBUser: function(user) {
            var QBApiCalls = this.app.service,
                custom_data;

            try {
                custom_data = JSON.parse(user.custom_data) || {};
            } catch (err) {
                custom_data = {};
            }

            custom_data.is_import = '1';
            custom_data = JSON.stringify(custom_data);
            QBApiCalls.updateUser(user.id, {
                custom_data: custom_data
            }, function(res) {

            });
        },

        uploadAvatar: function() {
            var QBApiCalls = this.app.service,
                UserView = this.app.views.User,
                DialogView = this.app.views.Dialog,
                Attach = this.app.models.Attach,
                custom_data,
                self = this;

            Attach.crop(tempParams.blob, {
                w: 1000,
                h: 1000
            }, function(file) {
                QBApiCalls.createBlob({
                    file: file,
                    'public': true
                }, function(blob) {
                    self.contact.blob_id = blob.id;
                    self.contact.avatar_url = blob.path;

                    UserView.successFormCallback();
                    DialogView.prepareDownloading();
                    DialogView.downloadDialogs();

                    custom_data = JSON.stringify({
                        avatar_url: blob.path
                    });
                    QBApiCalls.updateUser(self.contact.id, {
                        blob_id: blob.id,
                        custom_data: custom_data
                    }, function(res) {

                    });
                });
            });
        },

        login: function(defaultUser) {
            var QBApiCalls = this.app.service,
                UserView = this.app.views.User,
                DialogView = this.app.views.Dialog,
                Contact = this.app.models.Contact,
                form = $('section:visible form'),
                self = this,
                params;

            localStorage.removeItem('DC._logOut');

            if (defaultUser || validate(form, this)) {
                UserView.createSpinner();

                params = {
                    email: defaultUser && defaultUser.email || tempParams.email,
                    password: defaultUser && defaultUser.password || tempParams.password
                };

                QBApiCalls.createSession(params, function(session) {
                    QBApiCalls.getUser(session.user_id, function(user) {
                        self.contact = Contact.create(user);

                        Helpers.log('User', self);
                        
                        UserView.successFormCallback();
                        QBApiCalls.connectChat(self.contact.user_jid, function() {
                            self.rememberMe();
                            DialogView.prepareDownloading();
                            DialogView.downloadDialogs();
                        });
                    });
                });
            }
        },

        rememberMe: function() {
            var storage = {},
                self = this;

            Object.keys(self.contact).forEach(function(prop) {
                if (prop !== 'app') {
                    storage[prop] = self.contact[prop];
                }
            });

            localStorage.setItem('DC.user', JSON.stringify(storage));
        },

        forgot: function() {
            var QBApiCalls = this.app.service,
                UserView = this.app.views.User,
                form = $('section:visible form'),
                self = this;

            if (validate(form, this)) {
                UserView.createSpinner();

                QBApiCalls.createSession({}, function() {
                    QBApiCalls.forgotPassword(tempParams.email, function() {
                        UserView.successSendEmailCallback();
                        self._valid = false;
                    });
                });
            }
        },

        autologin: function() {
            var QBApiCalls = this.app.service,
                UserView = this.app.views.User,
                DialogView = this.app.views.Dialog,
                Contact = this.app.models.Contact,
                storage = JSON.parse(localStorage['DC.user']),
                self = this;

            UserView.createSpinner();

            QBApiCalls.getUser(storage.id, function(user) {
                if (user) {
                    self.contact = Contact.create(user);
                } else {
                    self.contact = Contact.create(storage);
                }

                Helpers.log('User', user);

                UserView.successFormCallback();

                QBApiCalls.connectChat(self.contact.user_jid, function() {
                    self.rememberMe();
                    DialogView.prepareDownloading();
                    DialogView.downloadDialogs();
                });
            });
        },

        logout: function() {
            var self = this,
                QBApiCalls = self.app.service;

            QBApiCalls.disconnectChat();

            QBApiCalls.logoutUser(function() {
                localStorage.removeItem('DC.user');
                self.contact = null;
                self._valid = false;

                var tmp = localStorage.userInfo;
                localStorage.clear();
                localStorage.setItem('DC._logOut', true);
                if (tmp)
                    localStorage.setItem('userInfo', tmp);
                window.location.reload();
            });
        }

    };

    /* Private
    ---------------------------------------------------------------------- */
    function validate(form, user) {
        var maxSize = DCCONFIG.maxLimitFile * 1024 * 1024,
            file = form.find('input:file')[0],
            fieldName, errName,
            value, errMsg;

        tempParams = {};
        form.find('input:not(:file, :checkbox)').each(function() {
            // fix requeired pattern
            this.value = this.value.trim();

            fieldName = this.id.split('-')[1];
            errName = this.placeholder;
            value = this.value;

            if (this.checkValidity()) {

                user._valid = true;
                tempParams[fieldName] = value;

            } else {

                if (this.validity.valueMissing) {
                    errMsg = errName + ' is required';
                } else if (this.validity.typeMismatch) {
                    this.value = '';
                    errMsg = DCCONFIG.errors.invalidEmail;
                } else if (this.validity.patternMismatch && errName === 'Name') {
                    if (value.length < 3) {
                        errMsg = DCCONFIG.errors.shortName;
                    } else if (value.length > 50) {
                        errMsg = DCCONFIG.errors.bigName;
                    } else {
                        errMsg = DCCONFIG.errors.invalidName;
                    }
                } else if (this.validity.patternMismatch && (errName === 'Password' || errName === 'New password')) {
                    if (value.length < 8) {
                        errMsg = DCCONFIG.errors.shortPass;
                    } else if (value.length > 40) {
                        errMsg = DCCONFIG.errors.bigPass;
                    } else {
                        errMsg = DCCONFIG.errors.invalidPass;
                    }
                }

                fail(user, errMsg);
                $(this).addClass('is-error').focus();

                return false;
            }
        });

        if (user._valid && file && file.files[0]) {
            file = file.files[0];

            if (file.type.indexOf('image/') === -1) {
                errMsg = DCCONFIG.errors.avatarType;
                fail(user, errMsg);
            } else if (file.name.length > 100) {
                errMsg = DCCONFIG.errors.fileName;
                fail(user, errMsg);
            } else if (file.size > maxSize) {
                errMsg = DCCONFIG.errors.fileSize;
                fail(user, errMsg);
            } else {
                tempParams.blob = file;
            }
        }

        return user._valid;
    }

    function fail(user, errMsg) {
        user._valid = false;
        $('section:visible .text_error').addClass('is-error').text(errMsg);
        $('section:visible input:password').val('');
        $('section:visible .chroma-hash label').css('background-color', 'rgb(255, 255, 255)');
    }

    function getImport(user) {
        var isImport;

        try {
            isImport = JSON.parse(user.custom_data).is_import || null;
        } catch (err) {
            isImport = null;
        }

        return isImport;
    }

    return User;

});
