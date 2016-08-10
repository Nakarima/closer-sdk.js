function onLoad() {
    // Cross-browser support:
    navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;

    if (navigator.mediaDevices.getUserMedia) {
        navigator.getUserMedia = function(arg, t, c) {
            return navigator.mediaDevices.getUserMedia(arg).then(t).catch(c);
        };
    };

    var username = "You";

    // Connection:
    document.getElementById("login").onclick = function() {
        var f = document.getElementById("login-form");

        RatelSDK.withSignedAuth({
            "organizationId": f.elements[1].value,
            "sessionId": f.elements[1].value,
            "timestamp": Date.now(),
            "signature": "FIXME"
        }, {
            "url": f.elements[0].value,
            "debug": true
        }).then(function(session) {
            var roster = {};
            var chatboxes = {};
            var calls = {};

            makeChatboxControls("chatbox-controls");
            roster = makeRoster("chatbox-roster");

            session.chat.onConnect(function() {
                console.log("Connected to artichoke!");
            });

            session.chat.onError(function(error) {
                console.log("An error has occured: ", error);
            });

            session.chat.onMessage("hello", function(m) {
                console.log("Connection ready for " + username + "!");
            });

            session.chat.onMessage("call_offer", function(m) {
                console.log(m.user + " is calling...");
                if(confirm(m.user + " is calling, answer?")) {
                    makeCall(m.user).createLocalStream(function(stream) {
                        session.chat.answerCall(m, stream);
                    });
                } else {
                    console.log("Rejecting call...");
                    session.chat.rejectCall(m);
                }
            });

            session.chat.onMessage("call_answer", function(m) {
                console.log(m.user + " answered the call!");
            });

            session.chat.onMessage("call_hangup", function(m) {
                console.log(m.user + " hang up, reason: " + m.reason);
                removeCall(m.user);
            });

            session.chat.onMessage("presence", function(m) {
                // FIXME Actually implement proper status handling.
                var status = m.status;
                var user = m.sender;
                var line = "User " + user + " is " + status + "!";
                if(user in chatboxes) chatboxes[user].receive(line);
                else console.log(line);
            });

            session.chat.onMessage("roster_add", function(m) {
                roster.add(m.user);
                console.log("User " + m.user + " added to roster.");
            });

            session.chat.onMessage("roster_remove", function(m) {
                roster.remove(m.user);
                console.log("User " + m.user + " removed from roster.");
            });

            session.chat.onMessage("room_action", function(m) {
                var s = m.subject ? makeAddable(m.subject) : "the room";
                makeChatbox(m.room).receive("User ", makeAddable(m.originator), " ", m.action, " ", s, ".");
            });

            session.chat.onMessage("message", function(m) {
                makeChatbox(m.room).receive("[" + m.sender + "] " + m.body)
            });

            session.chat.onMessage("msg_delivered", function(m) {
                console.log("Message delivery ack for id: " + m.id);
            });

            session.chat.getRooms().then(function(res) {
                var rooms = {};
                res.forEach(function(room) {
                    rooms[room.id] = room;
                });
                roster.set(rooms);
                console.log("Roster: " + res);
            }).catch(function(error) {
                console.log("Fetching roster failed:" + error);
            });

            document.getElementById("login-box").style = "display: none;";
            document.getElementById("call-container").style = "display: block";
            document.getElementById("chatbox-container").style = "display: block";

            session.chat.connect();

            // Utils:
            function makeCall(peer) {
                console.log("Creating a call object.");
                var call = calls[peer];
                if(call) return call;

                var box = document.createElement("div")

                var local_video = document.createElement("video")
                local_video.className = "video-stream";
                local_video.id = "local-video";
                local_video.autoplay = true;
                local_video.muted = true;
                box.appendChild(local_video);

                var remote_video = document.createElement("video")
                remote_video.className = "video-stream";
                remote_video.id = "remote-video";
                remote_video.autoplay = true;
                box.appendChild(remote_video);

                var end = document.createElement("button");
                end.innerHTML = "Hangup call";
                end.onclick = function() {
                    console.log( "Ending call with " + peer + "...");
                    session.chat.hangupCall(peer, "hangup");
                    removeCall(peer);
                };
                box.appendChild(end);

                document.getElementById("call-container").appendChild(box);

                var local_stream = undefined;
                var remote_stream = undefined;

                function showRemoteStream(stream) {
                    remote_stream = stream;
                    remote_video.src = window.URL.createObjectURL(stream);
                }

                function showLocalStream(stream) {
                    local_stream = stream;
                    local_video.src = window.URL.createObjectURL(stream);
                }

                function stopStreams() {
                    if(local_stream) {
                        if(local_stream.stop) local_stream.stop();
                        else local_stream.getTracks().map(function(t) { t.stop(); });
                        local_stream = undefined;
                        remote_stream = undefined;
                    };
                }

                function createLocalStream(onLocalStream) {
                    navigator.getUserMedia(
                        {"video": f.elements[3].checked,
                         "audio": f.elements[2].checked},
                        function(stream) {
                            console.log("Local stream started!");
                            showLocalStream(stream);
                            onLocalStream(stream);
                        }, function(error) {
                            console.log("Could not start stream: " + error);
                        });
                };

                session.chat.onRemoteStream(function(stream) {
                    console.log("Remote stream started!");
                    showRemoteStream(stream);
                });

                calls[peer] = {
                    box: box,
                    peer: peer,
                    showRemoteStream: showRemoteStream,
                    createLocalStream: createLocalStream,
                    stopStreams: stopStreams
                };

                return calls[peer];
            }

            function removeCall(peer) {
                console.log("Removing a call object.");
                var call = calls[peer];
                if(call) {
                    call.stopStreams();
                    document.getElementById("call-container").removeChild(call.box);
                    delete calls[peer];
                }
            }

            function makeRoster(id) {
                console.log("Building the roster.");
                var roster = {};

                function regenRoster() {
                    var r = document.getElementById(id);
                    r.innerHTML = "";

                    // NOTE Can't use just for, since it'll overwrite u in each onclick.
                    var users = [];
                    for(var u in roster) users.push(u);
                    users.forEach(function(u) {
                        var chat = document.createElement("button");
                        chat.onclick = function() {
                            console.log("Opening chat with " + u + "...");

                            createDirectRoom(u, function(room) {
                                makePrivateChatbox(room.id);
                            });
                        }
                        chat.innerHTML = "Chat with " + u;
                        r.appendChild(chat);

                        var call = document.createElement("button");
                        call.onclick = function() {
                            console.log("Calling " + u + "...");
                            var keys = [];
                            for(var k in calls) { keys.push(k); }

                            if(keys.length == 0) {
                                makeCall(u).createLocalStream(function(stream) {
                                    session.chat.offerCall(u, stream);
                                });
                            }
                            else if(confirm("You are arleady calling someone. Hang up that call?")) {
                                keys.forEach(function(k) {
                                    session.chat.hangupCall(k, "hangup");
                                    removeCall(k);
                                });
                                makeCall(u).createLocalStream(function(stream) {
                                    session.chat.offerCall(u, stream);
                                });
                            }
                        };
                        call.innerHTML = "Call " + u;
                        r.appendChild(call);
                    });
                };

                return {
                    set: function(users) {
                        roster = users;
                        regenRoster();
                    },

                    add: function(user) {
                        if(!roster[user]) {
                            roster[user] = {
                                name: user,
                                unread: 0
                            };
                            regenRoster();
                        };
                    },

                    remove: function(user) {
                        delete roster[user];
                        regenRoster();
                    },

                    update: function(user) {
                        if(roster[user]) {
                            // TODO Bump unread count and mark
                            regenRoster();
                        }
                    }
                }
            }

            function makeChatbox(room) {
                console.log("Creating a chatbox object: " + room);
                var chat = makeGenericChatbox(room);
                chat.teardown = function() {
                    session.chat.leaveRoom(room);
                }
                return chat;
            }

            function makePrivateChatbox(room) {
                console.log("Creating a private chatbox object: " + room);
                return makeGenericChatbox(room);
            }

            function makeGenericChatbox(room) {
                var chat = chatboxes[room];
                if(chat) return chat;

                var box = document.createElement("div");

                var id = room + "-chatbox";

                box.className = "chatbox";
                box.id = id;

                var text = document.createElement("div");
                text.className = "chatbox-textarea";
                box.appendChild(text);

                var controls = document.createElement("form");
                var input = document.createElement("input");
                input.type = "text";
                controls.appendChild(input);

                var send = document.createElement("input");
                send.type = "submit";
                send.value = "Send!";
                controls.appendChild(send);

                controls.onsubmit = function() {
                    session.chat.sendMessage(room, input.value).then(function(ack) {
                        console.log("Received ack for message id " + ack.message.id + " on " + ack.message.timestamp);
                        receive("[" + ack.message.sender + "] " + ack.message.body);
                        input.value = "";
                    }).catch(function(error) {
                        console.log("Sending a message failed: ", error);
                    });
                    return false;
                };

                var end = document.createElement("input");
                end.type = "button";
                end.value = "Close chat";
                end.onclick = function() {
                    removeChatbox(room);
                };
                controls.appendChild(end);
                box.appendChild(controls);
                document.getElementById("chatbox-container").appendChild(box);

                function receive() {
                    var p = document.createElement("p");

                    function append(element) {
                        if(element.appendChild != undefined) {
                            p.appendChild(element);
                        }
                        else if(typeof element === "object") {
                            element.forEach(function(e) {
                                append(e);
                            });
                        }
                        else {
                            var c = document.createElement("span");
                            c.innerHTML = element;
                            p.appendChild(c);
                        }
                    }

                    for(var a in arguments) {
                        append(arguments[a]);
                    }

                    console.log("[" + room + "] " + p.innerHTML);
                    text.appendChild(p);
                    text.scrollTop = text.scrollHeight - text.clientHeight;
                }

                chatboxes[room] = {
                    id: id,
                    box: box,
                    receive: receive
                };

                return chatboxes[room];
            }

            function removeChatbox(room) {
                console.log("Removing a chatbox object: " + room);
                var chat = chatboxes[room];
                document.getElementById("chatbox-container").removeChild(chat.box);
                if(chat.teardown) chat.teardown();
                delete chatboxes[room];
            }

            function makeChatboxControls(id) {
                console.log("Creating a chatbox controls: " + id);
                var box = document.createElement("form");
                var room = document.createElement("input");
                room.type = "text";
                room.value = "#artichoke";
                box.appendChild(room);

                var join = document.createElement("input");
                join.type = "submit";
                join.value = "Join room";
                box.appendChild(join);

                box.onsubmit = function() {
                    try {
                        createRoom(room.value, function(r) {
                            session.chat.joinRoom(r.id);
                        });
                    } catch(e) {
                        console.log("Error while creating a room: " + e);
                    }
                    return false;
                };

                document.getElementById(id).appendChild(box);
            }

            function createRoom(name, onresponse) {
                console.log("Creating a chat room: " + name);
                session.chat.createRoom(name).then(function(room) {
                    session.chat.getUsers(room.id).then(function(list) {
                        makeChatbox(room.id).receive("Users currently in ", makeAddable(room.id), ": ", list.users.map(makeAddable));
                    }).catch(function(error) {
                        console.log("Error while retrieving room user list: " + error);
                    });
                    session.chat.getChatHistory(room.id).then(function(history) {
                        var r = makeChatbox(room.id);
                        history.forEach(function(m) {
                            r.receive("[" + m.sender + "] " + m.body);
                        });
                    }).catch(function(error) {
                        console.log("Error while retrieving chat history: " + error);
                    });
                    return onresponse(room);
                }).catch(function(error) {
                    console.log("Error while creating a room: " + error);
                });
            }

            function createDirectRoom(peer, onresponse) {
                console.log("Creating a direct chat room with: " + peer);
                session.chat.createDirectRoom(peer).then(function(room) {
                    session.chat.getChatHistory(room.id).then(function(history) {
                        var r = makeChatbox(room.id);
                        r.receive("Chatting with ", makeAddable(peer))
                        history.forEach(function(m) {
                            r.receive("[" + m.sender + "] " + m.body);
                        });
                    }).catch(function(error) {
                        console.log("Error while retrieving chat history: " + error);
                    });
                    return onresponse(room);
                }).catch(function(error) {
                    console.log("Error while creating a direct room: " + e);
                });
            }

            function makeAddable(handle) {
                var b = document.createElement("button");
                b.innerHTML = handle;
                b.onclick = function() {
                    if(handle != username) {
                        console.log("Opening chat with " + handle + "...");

                        createDirectRoom(handle, function(room) {
                            makePrivateChatbox(room.id);
                            roster.add(handle);
                        });
                    }
                }
                return b;
            }
        }).catch(function(error) {
            console.log(error);
        });
    };
}
