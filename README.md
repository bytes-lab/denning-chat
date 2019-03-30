# Denning Chat

[Denning Chat](https://52.40.151.221/chat) is an open source code chat application with wide range of communication features available (such as one-to-one messaging, group chat messaging, file transfers, notifications and audio/video calls).

We are please to present you with an out of the box chat application. You can customize this application depending of your needs. [QuickBlox](https://quickblox.com) is used for the backend.

### - Setup environment

If you want to build your own app using this repo as a base, please do the following:

1. Install [nodeJS](https://nodejs.org/en/download/) and [Ruby](https://www.ruby-lang.org/en/downloads) before start.
2. Clone the repo
3. Run `npm install -g bower` in your terminal as an administrator.
4. Run `gem install sass` in your terminal as an administrator.
5. Run `npm install -g grunt-cli` in your terminal as an administrator.		
6. Run `bower install` to install all additional packages in your terminal.		
7. Run `npm install` to install all additional packages in your terminal as an administrator.		
8. Copy the credentials (App ID, Authorization key, Authorization secret) and your Facebook App ID ([How to generate and save Facebook application ID](https://quickblox.com/developers/How_to_generate_and_save_Facebook_application_ID)) into your project code in `config.js`.



### - Build and run

1. Run `grunt build` or `grunt` (build with jshint verification) in your terminal to build the project.
2. Run `grunt serve` in your terminal to open chat in a browser window (<https://localhost:7000>).
