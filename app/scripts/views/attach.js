/*
 * Denning chat application
 *
 * Attach View Module
 *
 */
define([
    'jquery',
    'config',
    'quickblox',
    'Helpers',
    'LocationView',
    'underscore',
    'progressbar'
], function(
    $,
    DCCONFIG,
    QB,
    Helpers,
    Location,
    _,
    ProgressBar
) {

    var self;

    var User,
        Message,
        Attach;

    function AttachView(app) {
        this.app = app;

        User = this.app.models.User;
        Message = this.app.models.Message;
        Attach = this.app.models.Attach;
        self = this;
    }

    AttachView.prototype = {

        changeInput: function(objDom, recordedAudioFile) {
            var file = recordedAudioFile ? recordedAudioFile : objDom[0].files[0],
                chat = $('.l-chat:visible .l-chat-content .mCSB_container'),
                id = _.uniqueId(),
                fileSize = file.size,
                fileSizeCrop = fileSize > (1024 * 1024) ? (fileSize / (1024 * 1024)).toFixed(1) : (fileSize / 1024).toFixed(1),
                fileSizeUnit = fileSize > (1024 * 1024) ? 'MB' : 'KB',
                metadata = { 'size': file.size },
                errMsg,
                html;

            if (file) {
                // progress bar DOM
                html = Helpers.fillTemplate('tpl_attach', { 
                    'fileName': file.name,
                    'fileSizeCrop': fileSizeCrop,
                    'fileSizeUnit': fileSizeUnit,
                    'id': id
                });

                chat.append(html);  

                if (objDom) {
                    objDom.val('');
                }

                fixScroll();

                self.createProgressBar(id, fileSizeCrop, metadata, file);
            }
        },

        pastErrorMessage: function(errMsg, objDom, chat) {
            var html = Helpers.fillTemplate('tpl_attach_error', { 
                'errMsg': errMsg
            });

            chat.append(html);

            if (objDom) {
                objDom.val('');
            }

            fixScroll();

            return false;
        },

        createProgressBar: function(id, fileSizeCrop, metadata, file) {
            var progressBar = new ProgressBar('progress_' + id),
                dialogId = self.app.entities.active,
                $chatItem = $('.j-chatItem[data-dialog="' + dialogId + '"]'),
                fileSize = file.size || metadata.size,
                percent = 5,
                isUpload = false,
                part,
                time;

            if (fileSize <= 5 * 1024 * 1024) {
                time = 50;
            } else if (fileSize > 5 * 1024 * 1024) {
                time = 60;
            } else if (fileSize > 6 * 1024 * 1024) {
                time = 70;
            } else if (fileSize > 7 * 1024 * 1024) {
                time = 80;
            } else if (fileSize > 8 * 1024 * 1024) {
                time = 90;
            } else if (fileSize > 9 * 1024 * 1024) {
                time = 100;
            }

            setPercent();

            Attach.upload(file, function(res) {
                if (res.code == "200") {                    

                    var MessageView = this.app.views.Message,
                        val = 'File Attachment: ' + file.name,
                        type = $chatItem.is('.is-group') ? 'groupchat' : 'chat',
                        fn_ = file.name.split('.'),
                        dext = {
                            url: res.success[0],
                            ext: '.'+fn_.pop(),
                            title: fn_.join('.'),
                            size: file.size
                        };

                    MessageView._sendMessage($chatItem.data('jid'), val, type, $chatItem.data('dialog'), dext);
                }

                isUpload = true;

                if ($('#progress_' + id).length > 0) {
                    setPercent();
                }
            });

            function setPercent() {
                if (isUpload) {
                    progressBar.setPercent(100);
                    part = fileSizeCrop;
                    $('.attach-part_' + id).text(part);

                    setTimeout(function() {
                        $('.attach-part_' + id).parents('article').remove();
                    }, 50);

                } else {
                    progressBar.setPercent(percent);
                    part = (fileSizeCrop * percent / 100).toFixed(1);
                    $('.attach-part_' + id).text(part);
                    percent += 5;
                    if (percent > 95) return false;
                    setTimeout(setPercent, time);
                }
            }
        },

        cancel: function(objDom) {
            objDom.parents('article').remove();
        },

        // only used for audio record file at the moment
        sendMessage: function(chat, blob, metadata, mapCoords) {
            var MessageView = this.app.views.Message,
                jid = chat.data('jid'),
                id = chat.data('id'),
                dialog_id = chat.data('dialog'),
                type = chat.is('.is-group') ? 'groupchat' : 'chat',
                time = Math.floor(Date.now() / 1000),
                dialogItem = type === 'groupchat' ? $('.l-list-wrap section:not(#searchList) .dialog-item[data-dialog="' + dialog_id + '"]') : $('.l-list-wrap section:not(#searchList) .dialog-item[data-id="' + id + '"]'),
                locationIsActive = $('.j-send_location').hasClass('btn_active'),
                copyDialogItem,
                lastMessage,
                message,
                attach,
                msg;

            if (mapCoords) {
                attach = {
                    'type': 'location',
                    'data': mapCoords
                };
            } else {
                attach = Attach.create(blob, metadata);
            }

            msg = {
                'type': type,
                'body': getAttachmentText(),
                'extension': {
                    'save_to_history': 1,
                    'dialog_id': dialog_id,
                    'date_sent': time,
                    'attachments': [
                        attach
                    ]
                },
                'markable': 1
            };

            if (locationIsActive) {
                msg.extension.latitude = localStorage['DC.latitude'];
                msg.extension.longitude = localStorage['DC.longitude'];
            }

            msg.id = QB.chat.send(jid, msg);

            message = Message.create({
                'body': msg.body,
                'chat_dialog_id': dialog_id,
                'date_sent': time,
                'attachment': attach,
                'sender_id': User.contact.id,
                'latitude': localStorage['DC.latitude'] || null,
                'longitude': localStorage['DC.longitude'] || null,
                '_id': msg.id,
                'online': true
            });

            Helpers.log(message);
            if (type === 'chat') {
                lastMessage = chat.find('article[data-type="message"]').last();

                message.stack = Message.isStack(true, message, lastMessage);
                MessageView.addItem(message, true, true);
            }

            if (dialogItem.length > 0) {
                copyDialogItem = dialogItem.clone();
                dialogItem.remove();
                $('#recentList ul').prepend(copyDialogItem);
                if (!$('#searchList').is(':visible')) {
                    $('#recentList').removeClass('is-hidden');
                    Helpers.Dialogs.isSectionEmpty($('#recentList ul'));
                }
            }

            function getAttachmentText() {
                var text;

                switch (attach.type) {
                    case 'location':
                        text = 'Location';
                        break;

                    case 'image':
                        text = 'Image attachment';
                        break;

                    case 'audio':
                        text = 'Audio attachment';
                        break;

                    case 'video':
                        text = 'Video attachment';
                        break;

                    default:
                        text = 'Attachment';
                        break;
                }

                return text;
            }
        }

    };

    /* Private
    ---------------------------------------------------------------------- */
    function fixScroll() {
        $('.l-chat:visible .j-scrollbar_message').mCustomScrollbar('scrollTo', 'bottom');
    }

    return AttachView;

});
