/*
 * Denning chat application
 *
 * Attach Module
 *
 */
define([
    'loadImage'
], function(
    loadImage
) {

    function Attach(app) {
        this.app = app;
        DenningApi = this.app.denningApi;
    }

    Attach.prototype = {

        upload: function(file, callback) {
            var self = this,
                QBApiCalls = self.app.service;

            this.getBase64(file).then(function(base64_data) {
                var lastModifiedDate = file.lastModifiedDate,
                    dialog_id = this.app.entities.active;

                if (typeof file.lastModified === "number") {
                    lastModifiedDate = new Date(file.lastModified);
                }

                var param = {
                    "fileNo1": "0800-8888",
                    "dialog_id": dialog_id,
                    "documents":[
                        {
                            "FileName": file.name,
                            "MimeType": file.type,
                            "dateCreate": lastModifiedDate.toISOString().replace('T', ' ').split('.')[0],
                            "dateModify": lastModifiedDate.toISOString().replace('T', ' ').split('.')[0],
                            "fileLength": file.size,
                            "base64": base64_data.split(';base64,')[1]
                        }
                    ]
                };

                DenningApi.call_crypto('post', 'v1/chat/attachment/matter', dialog_id, JSON.stringify(param), function (res) {
                    callback(res);                    
                });
            });
        },

        getBase64: function(file) {
            return new Promise(function(resolve, reject) {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = function() { resolve(reader.result); };
                reader.onerror = function(error) { reject(error); };
            });
        },

        create: function(blob, metadata) {
            var type = blob.content_type.indexOf('image/') === 0 ? 'image' :
                blob.content_type.indexOf('audio/') === 0 ? 'audio' :
                blob.content_type.indexOf('video/') === 0 ? 'video' :
                'file';

            return {
                'type': type,
                'id': blob.uid,
                'name': blob.name,
                'size': blob.size || metadata.size,
                'content-type': blob.content_type,
                'duration': metadata.duration,
                'height': metadata.height,
                'width': metadata.width
            };
        },

        crop: function(file, params, callback) {
            loadImage(
                file,
                function(img) {
                    var attr = {
                        'crop': true,
                        'maxWidth': img.width,
                        'maxHeight': img.height
                    };

                    loadImage(
                        file,
                        function(canvas) {
                            canvas.toBlob(function(blob) {
                                blob.name = file.name;
                                callback(blob);
                            }, file.type);
                        },
                        attr
                    );
                }
            );
        }

    };

    return Attach;
});
