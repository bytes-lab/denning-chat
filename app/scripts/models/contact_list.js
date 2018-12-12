/*
 * Denning chat application
 *
 * Contact List Module
 *
 */
define([
    'config',
    'underscore',
    'Helpers'
], function(
    DCCONFIG,
    _,
    Helpers
) {

    var contact_ids,
        isExistingRequest;

    function ContactList(app) {
        this.app = app;
        this.roster = {};
        this.denningUsers = {};
        this.contacts = getContacts();
        contact_ids = Object.keys(this.contacts).map(Number);
    }

    ContactList.prototype = {

        saveRoster: function(roster) {
            this.roster = roster;
        },

        saveNotConfirmed: function(notConfirmed) {
            localStorage.setItem('DC.notConfirmed', JSON.stringify(notConfirmed));
        },

        saveHiddenDialogs: function(hiddenDialogs) {
            sessionStorage.setItem('DC.hiddenDialogs', JSON.stringify(hiddenDialogs));
        },

        addDenningUsers: function(users, contactLoaded) {
            var QBApiCalls = this.app.service,
                Contact = this.app.models.Contact,
                self = this,
                emails = Helpers.getEmails(users, ['client', 'staff']),
                params;

            self.denningUsers = users;

            if (!contactLoaded) {
                params = {
                    filter: {
                        field: 'email',
                        param: 'in',
                        value: _.difference(emails, _.pluck(self.contacts, 'email'))
                    },
                    per_page: 10000
                };
                
                QBApiCalls.listUsers(params, function(users) {
                    users.items.forEach(function(qbUser) {
                        var user = qbUser.user;
                        var contact = Contact.create(user);
                        var ContactListView = self.app.views.ContactList;

                        self.contacts[user.id] = contact;
                        localStorage.setItem('DC.contact-' + user.id, JSON.stringify(contact));
                    });

                    Helpers.log('Contact List is updated with Denning Users', self);
                });                
            }
        },

        add: function(occupants_ids, dialog, callback, subscribe) {
            var QBApiCalls = this.app.service,
                Contact = this.app.models.Contact,
                self = this,
                new_ids,
                params;

            // TODO: need to make optimization here
            // (for new device the user will be waiting very long time if he has a lot of private dialogs)
            new_ids = [].concat(_.difference(occupants_ids, contact_ids));
            contact_ids = contact_ids.concat(new_ids);
            localStorage.setItem('DC.contacts', contact_ids.join());
            if (subscribe) new_ids = occupants_ids;

            if (new_ids.length > 0) {
                params = {
                    filter: {
                        field: 'id',
                        param: 'in',
                        value: new_ids
                    },
                    per_page: 100
                };

                QBApiCalls.listUsers(params, function(users) {
                    users.items.forEach(function(qbUser) {
                        var user = qbUser.user;
                        var contact = Contact.create(user);
                        var ContactListView = self.app.views.ContactList;
                        
                        self.contacts[user.id] = contact;
                        localStorage.setItem('DC.contact-' + user.id, JSON.stringify(contact));
                    });

                    Helpers.log('Contact List is updated', self);
                    callback(dialog);
                });

            } else {
                callback(dialog);
            }
        },

        cleanUp: function (requestIds, responseIds) {
            var ContactListView = this.app.views.ContactList,
                ids = _.difference(requestIds, responseIds);

            ids.forEach(function(id) {
                localStorage.removeItem('DC.contact-' + id);
            });

            contact_ids = _.difference(contact_ids, ids);
            localStorage.setItem('DC.contacts', contact_ids.join());
        },

        globalSearch: function(callback) {
            if (isExistingRequest) {
                return false;
            }

            var QBApiCalls = this.app.service,
                val = sessionStorage['DC.search.value'],
                page = sessionStorage['DC.search.page'],
                self = this,
                contacts;

            isExistingRequest = true;

            QBApiCalls.getUser({
                full_name: val,
                page: page,
                per_page: 20
            }, function(data) {
                isExistingRequest = false;

                if(data.items.length) {
                    contacts = self.getResults(data.items);
                } else {
                    contacts = data.items;
                }

                sessionStorage.setItem('DC.search.allPages', Math.ceil(data.total_entries / data.per_page));
                sessionStorage.setItem('DC.search.page', ++page);

                contacts.sort(function(first, second) {
                    var a = first.full_name.toLowerCase(),
                        b = second.full_name.toLowerCase();

                    return (a < b) ? -1 : (a > b) ? 1 : 0;
                });

                Helpers.log('Search results', contacts);

                callback(contacts);
            });
        },

        getResults: function(data) {
            var Contact = this.app.models.Contact,
                User = this.app.models.User,
                contacts = [],
                contact;

            data.forEach(function(item) {
                if (item.user.id !== User.contact.id) {
                    contact = Contact.create(item.user);
                    contacts.push(contact);
                }
            });

            return contacts;
        },

        getFBFriends: function(ids, callback) {
            var QBApiCalls = this.app.service,
                Contact = this.app.models.Contact,
                self = this,
                new_ids = [],
                params;

            // TODO: duplicate of add() function
            params = {
                filter: {
                    field: 'facebook_id',
                    param: 'in',
                    value: ids
                }
            };

            QBApiCalls.listUsers(params, function(users) {
                users.items.forEach(function(qbUser) {
                    var user = qbUser.user;
                    var contact = Contact.create(user);
                    new_ids.push(user.id);
                    self.contacts[user.id] = contact;
                    localStorage.setItem('DC.contact-' + user.id, JSON.stringify(contact));
                });

                contact_ids = contact_ids.concat(new_ids);
                localStorage.setItem('DC.contacts', contact_ids.join());

                Helpers.log('Contact List is updated', self);
                callback(new_ids);
            });
        }

    };

    /* Private
    ---------------------------------------------------------------------- */
    // Creation of Contact List from cache
    function getContacts() {
        var contacts = {},
            ids = localStorage['DC.contacts'] ? localStorage['DC.contacts'].split(',') : [];

        if (ids.length > 0) {
            try {
                for (var i = 0, len = ids.length; i < len; i++) {
                    contacts[ids[i]] = typeof localStorage['DC.contact-' + ids[i]] !== 'undefined' ?
                        JSON.parse(localStorage['DC.contact-' + ids[i]]) :
                        true;

                    if (contacts[ids[i]] === true) {
                        delete contacts[ids[i]];
                    }
                }
            } catch (e) {
                Helpers.log("Error getting contacts from cache. Clearing...");
                var tmp = localStorage.userInfo;
                localStorage.clear();
                localStorage.setItem('userInfo', tmp);
                contacts = {};
            }
        }

        return contacts;
    }

    return ContactList;

});
