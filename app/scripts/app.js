/*
 * Denning chat application
 *
 * Main Module
 *
 */
define([
    'jquery', 'UserModule',
    'SessionModule', 'SettingsModule',
    'ContactModule', 'DialogModule',
    'MessageModule', 'AttachModule',
    'ContactListModule', 'VideoChatModule',
    'CursorModule', 'SyncTabsModule',
    'UserView', 'SettingsView',
    'DialogView', 'MessageView',
    'AttachView', 'ContactListView',
    'VideoChatView', 'Events',
    'Helpers', 'QBApiCalls',
    'config', 'Entities',
    'DCHtml', 'Listeners',
    'VoiceMessage', 'DCPlayer'
], function(
    $, User,
    Session, Settings,
    Contact, Dialog,
    Message, Attach,
    ContactList, VideoChat,
    Cursor, SyncTabs,
    UserView, SettingsView,
    DialogView, MessageView,
    AttachView, ContactListView,
    VideoChatView, Events,
    Helpers, QBApiCalls,
    DCCONFIG, Entities,
    DCHtml, Listeners,
    VoiceMessage, DCPlayer
) {

    function DenningChat() {
        this.listeners = new Listeners(this);

        this.models = {
            User        : new User(this),
            Session     : new Session(this),
            Settings    : new Settings(this),
            Contact     : new Contact(this),
            Dialog      : new Dialog(this),
            Message     : new Message(this),
            Attach      : new Attach(this),
            ContactList : new ContactList(this),
            VideoChat   : new VideoChat(this),
            Cursor      : new Cursor(this),
            SyncTabs    : new SyncTabs(this),
            VoiceMessage: new VoiceMessage(this)
        };

        this.views = {
            User        : new UserView(this),
            Settings    : new SettingsView(this),
            Dialog      : new DialogView(this),
            Message     : new MessageView(this),
            Attach      : new AttachView(this),
            ContactList : new ContactListView(this),
            VideoChat   : new VideoChatView(this)
        };

        this.events    = new Events(this);
        this.service   = new QBApiCalls(this);

        this.entities  = Entities;
        this.entities.app = this;

        this.DCPlayer = DCPlayer;
    }

    DenningChat.prototype = {
        init: function() {
            var token;

            this.setHtml5Patterns();

            // QB SDK initialization
            // Checking if autologin was chosen
            if (localStorage['DC.session'] && localStorage['DC.user'] &&
                // new QB release account (13.02.2015)
                localStorage['DC.isReleaseQBAccount']) {

                token = JSON.parse(localStorage['DC.session']).token;
                this.service.init(token);
            } else if (localStorage['DC.isReleaseQBAccount']) {
                this.service.init();
            } else {
                // removing the old cached data from LocalStorage
                var tmp = localStorage.userInfo;
                localStorage.clear();
                localStorage.setItem('userInfo', tmp);
                localStorage.setItem('DC.isReleaseQBAccount', '1');
                this.service.init();
            }

            this.events.init();
            this.listeners.init();

            Helpers.log('App init', this);
            var email = Helpers.getURLParameter('uid');
            if (email) {
                this.models.User.login({ 
                    email: email, 
                    password: Helpers.getURLParameter('sppid') || 'denningIT'
                });
            }
        },

        setHtml5Patterns: function() {
            $('.pattern-name').attr('pattern', DCCONFIG.patterns.name);
            $('.pattern-pass').attr('pattern', DCCONFIG.patterns.password);
        }
    };

    return DenningChat;
});
