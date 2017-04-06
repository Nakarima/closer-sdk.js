import { ArtichokeAPI } from "./api";
import { createCall, DirectCall, GroupCall } from "./call";
import { ChatConfig } from "./config";
import { Callback, EventHandler } from "./events";
import { Logger } from "./logger";
import * as events from "./protocol/events";
import * as proto from "./protocol/protocol";
import { eventTypes, Status, WireEvent } from "./protocol/wire-events";
import { createRoom, DirectRoom, GroupRoom, Room } from "./room";
import { wrapPromise } from "./utils";

export class Artichoke {
  private api: ArtichokeAPI;
  private config: ChatConfig;
  private log: Logger;
  private events: EventHandler;

  constructor(config: ChatConfig, log: Logger, events: EventHandler, api: ArtichokeAPI) {
    this.api = api;
    this.config = config;
    this.log = log;
    this.events = events;

    // NOTE Disable some events by default.
    let nop = (e: events.Event) => {
      // Do nothing.
    };
    events.onEvent(eventTypes.ERROR, nop);
    events.onEvent(eventTypes.CHAT_RECEIVED, nop);
    events.onEvent(eventTypes.CHAT_DELIVERED, nop);
  }

  // Callbacks:
  onConnect(callback: Callback<events.Hello>) {
    this.events.onEvent(eventTypes.HELLO, callback);
  }

  onHeartbeat(callback: Callback<events.Heartbeat>) {
    this.events.onEvent(eventTypes.HEARTBEAT, callback);
  }

  onDisconnect(callback: Callback<events.RichDisconnect>) {
    this.events.onEvent(eventTypes.DISCONNECT, callback);
  }

  onError(callback: Callback<events.Error>) {
    this.events.onError(callback);
  }

  // API:
  connect() {
    this.api.connect();

    this.api.onEvent((e: WireEvent) => {
      const richEvent: events.Event = events.eventUtils.upgrade(e, this.config, this.log, this.events, this.api);
      this.events.notify(richEvent);
    });
  }

  disconnect() {
    this.api.disconnect();
  }

  // Bot API:
  onBotUpdate(callback: Callback<events.BotUpdated>) {
    this.events.onEvent(eventTypes.BOT_UPDATED, callback);
  }

  createBot(name: string, callback?: string): Promise<proto.Bot> {
    return this.api.createBot(name, callback);
  }

  getBot(bot: proto.ID): Promise<proto.Bot> {
    return this.api.getBot(bot);
  }

  getBots(): Promise<Array<proto.Bot>> {
    return this.api.getBots();
  }

  // GroupCall API:
  onCall(callback: Callback<events.CallInvitation>) {
    this.events.onEvent(eventTypes.CALL_INVITATION, callback);
  }

  createDirectCall(stream: MediaStream, peer: proto.ID, timeout?: number): Promise<DirectCall> {
    return this.wrapCall(this.api.createDirectCall(peer, timeout), stream);
  }

  createCall(stream: MediaStream, users: Array<proto.ID>): Promise<GroupCall> {
    return this.wrapCall(this.api.createCall(users), stream);
  }

  getCall(call: proto.ID): Promise<GroupCall | DirectCall> {
    return this.wrapCall(this.api.getCall(call));
  }

  getCalls(): Promise<Array<GroupCall | DirectCall>> {
    return this.wrapCall(this.api.getCalls());
  }

  // Chat room API:
  onRoom(callback: Callback<events.RoomInvitation>) {
    this.events.onEvent(eventTypes.ROOM_INVITATION, callback);
  }

  createRoom(name: string): Promise<GroupRoom> {
    return this.wrapRoom(this.api.createRoom(name));
  }

  createDirectRoom(peer: proto.ID): Promise<DirectRoom> {
    return this.wrapRoom(this.api.createDirectRoom(peer));
  }

  getRoom(room: proto.ID): Promise<Room> {
    return this.wrapRoom(this.api.getRoom(room));
  }

  getRooms(): Promise<Array<Room>> {
    return this.wrapRoom(this.api.getRooms());
  }

  getRoster(): Promise<Array<Room>> {
    return this.wrapRoom(this.api.getRoster());
  }

  // Presence API:
  onStatusUpdate(callback: Callback<events.PresenceUpdate>) {
    this.events.onEvent(eventTypes.PRESENCE_UPDATE, callback);
  }

  setStatus(status: Status) {
    this.api.setStatus(status);
  }

  // Utils:
  private wrapCall(promise: Promise<proto.Call | Array<proto.Call>>, stream?: MediaStream) {
    return wrapPromise(promise, (call) => createCall(call, this.config.rtc, this.log, this.events, this.api, stream));
  }

  private wrapRoom(promise: Promise<proto.Room | Array<proto.Room>>) {
    return wrapPromise(promise, (room: proto.Room) => createRoom(room, this.log, this.events, this.api));
  }
}
