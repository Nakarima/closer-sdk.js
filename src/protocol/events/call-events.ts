// tslint:disable:no-namespace
// tslint:disable:max-classes-per-file
import { VideoContentType, Metadata } from '../protocol';
import { DomainEvent } from './domain-event';

export namespace callEvents {
  export enum EndReason {
    Terminated = 'terminated',
    Timeout = 'timeout',
    Ended = 'ended',
    Hangup = 'hangup',
    ConnectionDropped = 'connection_dropped',
    Disconnected = 'disconnected',
    CallRejected = 'rejected',
    Busy = 'busy',
  }

  export abstract class CallEvent implements DomainEvent {
    public readonly callId: string;
    public readonly timestamp: number;
    public readonly tag: string;
    public readonly __discriminator__ = 'domainEvent';

    public static isCallEvent(e: DomainEvent): e is CallEvent {
      return typeof (e as CallEvent).callId !== 'undefined';
    }

    protected constructor(callId: string, timestamp: number, tag: string) {
      this.callId = callId;
      this.timestamp = timestamp;
      this.tag = tag;
    }
  }

  export class Created extends CallEvent {
    public static readonly tag = 'call_created';
    public readonly authorId: string;

    constructor(callId: string, authorId: string, timestamp: number) {
      super(callId, timestamp, Created.tag);
      this.authorId = authorId;
    }

    public static isCreated(e: DomainEvent): e is Created {
      return e.tag === Created.tag;
    }
  }

  export class Invited extends CallEvent {
    public static readonly tag = 'call_invited';
    public readonly authorId: string;
    public readonly invitee: string;
    public readonly metadata?: Metadata;

    constructor(callId: string, authorId: string, invitee: string, timestamp: number, metadata?: Metadata) {
      super(callId, timestamp, Invited.tag);

      this.invitee = invitee;
      this.metadata = metadata;
      this.authorId = authorId;
    }

    public static isInvited(e: DomainEvent): e is Invited {
      return e.tag === Invited.tag;
    }
  }

  export class Answered extends CallEvent {
    public static readonly tag = 'call_answered';
    public readonly authorId: string;

    constructor(callId: string, authorId: string, timestamp: number) {
      super(callId, timestamp, Answered.tag);
      this.authorId = authorId;
    }

    public static isAnswered(e: DomainEvent): e is Answered {
      return e.tag === Answered.tag;
    }
  }

  export class Joined extends CallEvent {
    public static readonly tag = 'call_joined';
    public readonly authorId: string;

    constructor(callId: string, authorId: string, timestamp: number) {
      super(callId, timestamp, Joined.tag);
      this.authorId = authorId;
    }

    public static isJoined(e: DomainEvent): e is Joined {
      return e.tag === Joined.tag;
    }
  }

  export class Left extends CallEvent {
    public static readonly tag = 'call_left';
    public readonly authorId: string;
    public readonly reason: EndReason;

    constructor(callId: string, authorId: string, reason: EndReason, timestamp: number) {
      super(callId, timestamp, Left.tag);

      this.authorId = authorId;
      this.reason = reason;
    }

    public static isLeft(e: DomainEvent): e is Left {
      return e.tag === Left.tag;
    }
  }

  export class Rejected extends CallEvent {
    public static readonly tag = 'call_rejected';
    public readonly authorId: string;
    public readonly reason: EndReason;

    constructor(callId: string, authorId: string, reason: EndReason, timestamp: number) {
      super(callId, timestamp, Rejected.tag);

      this.authorId = authorId;
      this.reason = reason;
    }

    public static isRejected(e: DomainEvent): e is Rejected {
      return e.tag === Rejected.tag;
    }
  }

  export class Ended extends CallEvent {
    public static readonly tag = 'call_ended';
    public readonly reason: EndReason;

    constructor(callId: string, reason: EndReason, timestamp: number) {
      super(callId, timestamp, Ended.tag);

      this.reason = reason;
    }

    public static isEnded(e: DomainEvent): e is Ended {
      return e.tag === Ended.tag;
    }
  }

  export class CallHandledOnDevice extends CallEvent {
    public static readonly tag = 'call_handled_on_device';
    public readonly authorId: string;
    public readonly device: string;

    constructor(callId: string, authorId: string, device: string, timestamp: number) {
      super(callId, timestamp, CallHandledOnDevice.tag);

      this.authorId = authorId;
      this.device = device;
    }

    public static isCallHandledOnDevice(e: DomainEvent): e is CallHandledOnDevice {
      return e.tag === CallHandledOnDevice.tag;
    }
  }

  export class DeviceOffline extends CallEvent {
    public static readonly tag = 'device_offline';
    public readonly userId: string;
    public readonly deviceId: string;

    constructor(callId: string, userId: string, deviceId: string, timestamp: number) {
      super(callId, timestamp, DeviceOffline.tag);

      this.userId = userId;
      this.deviceId = deviceId;
    }

    public static isDeviceOffline(e: DomainEvent): e is DeviceOffline {
      return e.tag === DeviceOffline.tag;
    }
  }

  export class DeviceOnline extends CallEvent {
    public static readonly tag = 'device_online';
    public readonly userId: string;
    public readonly deviceId: string;

    constructor(callId: string, userId: string, deviceId: string, timestamp: number) {
      super(callId, timestamp, DeviceOnline.tag);

      this.userId = userId;
      this.deviceId = deviceId;
    }

    public static isDeviceOnline(e: DomainEvent): e is DeviceOnline {
      return e.tag === DeviceOnline.tag;
    }
  }

  export class AudioStreamToggled extends CallEvent {
    public static readonly tag = 'audio_stream_toggled';

    public readonly userId: string;
    public readonly enabled: boolean;

    constructor(callId: string, userId: string, enabled: boolean, timestamp: number) {
      super(callId, timestamp, AudioStreamToggled.tag);

      this.userId = userId;
      this.enabled = enabled;
    }

    public static isAudioStreamToggled(e: DomainEvent): e is AudioStreamToggled {
      return e.tag === AudioStreamToggled.tag;
    }
  }

  export class VideoStreamToggled extends CallEvent {
    public static readonly tag = 'video_stream_toggled';

    public readonly userId: string;
    public readonly enabled: boolean;
    public readonly content?: VideoContentType;

    constructor(callId: string, userId: string, enabled: boolean, timestamp: number, contentType?: VideoContentType) {
      super(callId, timestamp, VideoStreamToggled.tag);

      this.userId = userId;
      this.enabled = enabled;
      this.content = contentType;
    }

    public static isVideoStreamToggled(e: DomainEvent): e is VideoStreamToggled {
      return e.tag === VideoStreamToggled.tag;
    }
  }

}
