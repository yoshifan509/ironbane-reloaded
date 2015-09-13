/*global check: true*/
angular
    .module('server.services.chat', [
        'models',
        'server.services.activeWorlds'
    ])
    .service('ChatService', [
        'ChatMessagesCollection',
        function(ChatMessagesCollection) {
            'use strict';

            this.announce = function(msg, flags) {
                check(msg, String);

                flags = flags || {};

                // TODO: some other check that the client should be able to post an announcment!

                angular.extend(flags, {
                    system: true,
                    announcement: true
                });


                ChatMessagesCollection.insert({
                    room: 'global',
                    ts: new Date(),
                    msg: msg,
                    flags: flags
                });

            };
        }
    ])
    .run([
        'ChatService',
        'ChatMessagesCollection',
        'ChatRoomsCollection',
        '$activeWorlds',
        function(ChatService, ChatMessagesCollection, ChatRoomsCollection, $activeWorlds) {
            'use strict';

            Meteor.methods({
                chatAnnounce: ChatService.announce
            });

            // clear rooms on boot (for now)
            ChatRoomsCollection.remove({});
            ChatRoomsCollection.insert({
                roomname: 'global'
            });

            Meteor.methods({
                chat: function(msg) {

                    if (!_.isString(msg)) {
                        return;
                    }

                    if (msg.length <= 0) {
                        return false;
                    }

                    var me = this;

                    msg = msg.substr(0, 255);

                    _.each($activeWorlds, function (world) {
                        var playerEntities = world.getEntities('player');
                        playerEntities.forEach(function (player) {
                            if (player.owner === me.userId) {
                                ChatMessagesCollection.insert({
                                    room: 'global',
                                    // room: player.level
                                    ts: new Date(),
                                    msg: msg,
                                    // flags: flags,
                                    user: {
                                        name: player.name
                                    },
                                    pos: player.position
                                });
                            }
                        });
                    });

                }
            });

            Meteor.publish('chatMessages', function() {
                return ChatMessagesCollection.find({}, {
                    sort: {
                        ts: -1
                    },
                    limit: 50
                });
            });
        }
    ]);
