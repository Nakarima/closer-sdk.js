// tslint:disable-next-line:no-implicit-dependencies
import {} from 'jasmine';

import { Config, load } from './config/config';
import { LoggerService } from './logger/logger-service';
import { LogLevel } from './logger/log-level';
import { LoggerFactory } from './logger/logger-factory';
import { NoopCollector } from './rtc/stats/noop-collector';
import { WebRTCStats } from './rtc/stats/webrtc-stats';
import { WebRTCStatsCollector } from './rtc/stats/webrtc-stats-collector';

export const log = new LoggerService(LogLevel.WARN);
export const loggerFactory = new LoggerFactory(LogLevel.WARN);

// tslint:disable-next-line:no-object-literal-type-assertion
export const config: Config = load({
  logLevel: LogLevel.DEBUG,
  chat: {
    rtc: {
      iceServers: []
    }
  }
});

export const sessionIdMock = '12345678';
export const deviceIdMock = '6515ea03-7421-4fa5-b02c-bf339c18abbf';
export const apiKeyMock = '8615ea03-7421-4fa5-b02c-bf339c18abbf';

export const sleep = (time: number): Promise<void> =>
  new Promise<void>((resolve, _reject): void => {
    setTimeout(resolve, time);
  });

export const whenever = (condition: boolean):
  (expectation: string, assertion?: (done: DoneFn) => void, timeout?: number) => void =>
  condition ? it : xit;

export const isWebRTCSupported = (): boolean =>
  !!window.RTCPeerConnection;

export const getStream = (onStream: (stream: MediaStream) => void, onError: (err: Error) => void,
                          constraints?: MediaStreamConstraints): void => {
  const cs: MediaStreamConstraints & { fake?: boolean } = constraints ? constraints : {
    video: true,
    audio: true
  };
  cs.fake = true; // NOTE For FireFox.
  log.info(`Creating a stream with constraints: ${JSON.stringify(cs)}`);
  navigator.mediaDevices.getUserMedia(cs).then(onStream).catch(onError);
};

// tslint:disable-next-line:no-any
export const logError = (done: DoneFn): (err: any) => void =>
  (error): void => {
    log.error(`Got an error: ${error} (${JSON.stringify(error)})`);
    if (typeof error.cause !== 'undefined') {
      log.error(`Cause: ${error.cause}`);
    }
    done.fail();
  };

export class WebRTCStatsMock extends WebRTCStats {
  constructor() {
    super(undefined, sessionIdMock, log, loggerFactory);
  }

  public createCollector(): WebRTCStatsCollector {
    return new NoopCollector();
  }
}
