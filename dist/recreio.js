/**
 * recre.io JavaScript SDK
 * Copyright 2015, recre.io
 * Released under the MIT license.
 */
var RecreIO;
(function (RecreIO) {
    var Exercise = (function () {
        function Exercise(client, exercise) {
            this.client = client;
            this.exercise = exercise;
            this.mousePosition = {};
            this.mouseMovement = new Array();
            this.mouseInterval = 0;
        }
        Exercise.prototype.begin = function () {
            // if (!user) {
            //     console.error("Not yet authenticated.")
            //     // return false;
            // }
            this.startTime = new Date().getTime();
            // Save mouse position 10 times per second
            document.onmousemove = this.handleMouseMove;
            this.mouseInterval = setInterval(this.getMousePosition, 1000 / this.client.MOUSE_TRACKING_RATE);
            this.client.getAccount().then(function (account) {
                this.user = account;
            }).catch(function (exception) {
                this.user = { id: 42, name: "John Doe" };
            });
            return this;
        };
        Exercise.prototype.save = function (success) {
            if (!this.startTime) {
                console.error("Exercise hasn't started yet.");
                return false;
            }
            this.endTime = new Date().getTime();
            this.duration = this.endTime - this.startTime;
            clearInterval(this.mouseInterval);
            var statement = {
                actor: {
                    name: this.user.name,
                    account: {
                        id: this.user.id
                    }
                },
                verb: {
                    id: "completed"
                },
                object: {
                    id: 42,
                    definition: {
                        name: ""
                    }
                },
                result: {
                    completion: true,
                    success: success,
                    duration: Math.floor(Math.abs(this.duration / 1000)) + "S"
                },
                context: {
                    extensions: {
                        app: this.client.appId,
                        mouseMovement: this.mouseMovement
                    }
                },
                timestamp: new Date().toISOString()
            };
            this.client.sendRequest('POST', 'statements', statement).then(function (body) {
                // do nothing
            }).catch(function (error) {
                console.error(error);
            });
            return statement;
        };
        Exercise.prototype.handleMouseMove = function (event) {
            var dot, eventDoc, doc, body, pageX, pageY;
            event = event || window.event; // IE-ism
            // If pageX/Y aren't available and clientX/Y are,
            // calculate pageX/Y - logic taken from jQuery.
            // (This is to support old IE)
            if (event.pageX == null && event.clientX != null) {
                eventDoc = (event.target && event.target.ownerDocument) || document;
                doc = eventDoc.documentElement;
                body = eventDoc.body;
                event.pageX = event.clientX +
                    (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
                    (doc && doc.clientLeft || body && body.clientLeft || 0);
                event.pageY = event.clientY +
                    (doc && doc.scrollTop || body && body.scrollTop || 0) -
                    (doc && doc.clientTop || body && body.clientTop || 0);
            }
            this.mousePosition = {
                x: event.pageX,
                y: event.pageY
            };
        };
        Exercise.prototype.getMousePosition = function () {
            if (this.mousePosition.x && this.mousePosition.y) {
                this.mouseMovement[this.mouseInterval] = { x: this.mousePosition.x, y: this.mousePosition.y };
                this.mouseInterval++;
            }
        };
        return Exercise;
    })();
    RecreIO.Exercise = Exercise;
})(RecreIO || (RecreIO = {}));
;
/**
 * recre.io JavaScript SDK
 * Copyright 2015, recre.io
 * Released under the MIT license.
 */
/// <reference path="../typings/bluebird/bluebird.d.ts" />
/// <reference path="exercise.ts" />
var RecreIO;
(function (RecreIO) {
    var Client = (function () {
        /**
         * Create a new RecreIO client with your API key.
         */
        function Client(apiKey, appId) {
            this.apiKey = apiKey;
            this.appId = appId;
            this.exercises = [];
            this.exerciseIndex = 0;
        }
        /**
         * ...
         */
        Client.prototype.sendRequest = function (method, to, payload) {
            var promise = new Promise(function (resolve, reject) {
                var httpRequest = new XMLHttpRequest();
                var url = 'https://api.recre.io/' + to;
                var encodedPayload = JSON.stringify(payload);
                httpRequest.open(method, url, true);
                httpRequest.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                httpRequest.setRequestHeader("X-API-Key", 'wzHb9a2YjLPQWAMyxSSjLuy9XsPAV3e3');
                httpRequest.withCredentials = true; // Send cookies with CORS requests
                httpRequest.send(encodedPayload);
                httpRequest.onreadystatechange = function () {
                    if (httpRequest.readyState === 4) {
                        if (httpRequest.status === 200) {
                            resolve(httpRequest.responseText);
                        }
                        else {
                            reject(httpRequest.status);
                        }
                    }
                };
            });
            return promise.bind({ apiKey: this.apiKey, apiUrl: 'https://api.recre.io/' });
        };
        /**
         * ...
         */
        Client.prototype.signInWithUsername = function (username, password) {
            var payload = {
                login: username,
                password: password,
                isUsername: true
            };
            return this.sendRequest('POST', 'auth/callback/password', payload);
        };
        /**
         * ...
         */
        Client.prototype.getAccount = function () {
            return this.sendRequest('GET', 'users/me');
        };
        /**
         * ...
         */
        Client.prototype.getNextExercise = function (template, soundEnabled) {
            if (template === void 0) { template = 'true-false'; }
            if (soundEnabled === void 0) { soundEnabled = false; }
            return new Promise(function (resolve, reject) {
                if (this.exercises.length == 0 || this.exerciseIndex == this.exercises.length - 1) {
                    this.exerciseIndex = 0;
                    this.sendRequest('GET', 'users/me/exercises?template=' + template + '&sound=' + soundEnabled).then(function (body) {
                        this.exercises = JSON.parse(body);
                        resolve(new RecreIO.Exercise(this, this.exercises[0]));
                    }).catch(function (error) {
                        console.error(error);
                        reject(error);
                    });
                }
                else {
                    this.exerciseIndex += 1;
                    resolve(new RecreIO.Exercise(this, this.exercises[this.exerciseIndex]));
                }
            });
        };
        /** The host of the API. */
        Client.API_URL = "https://api.recre.io/";
        /** The number of mouse frames tracked per second. */
        Client.MOUSE_TRACKING_RATE = 10;
        return Client;
    })();
    RecreIO.Client = Client;
    ;
})(RecreIO || (RecreIO = {}));
;