import { RatelAPI } from "./api";
import { Config, load } from "./config";
import { debugConsole } from "./logger";
import { ID, Timestamp } from "./protocol/protocol";
import { Session } from "./session";

export type ApiKey = string;
export type Signature = string;

export interface Payload {
  orgId: ID;
  externalId: ID;
  timestamp: Timestamp;
}

export interface SessionData {
  payload: Payload;
  signature: Signature;
}

export interface AgentContext {
  id: ID;
  orgId: ID;
  apiKey: ApiKey;
}

export function withApiKey(sessionId: ID, apiKey: ApiKey, config: Config): Promise<Session> {
  return Promise.resolve(new Session(sessionId, apiKey, load(config)));
}

export function withSignedAuth(sessionData: SessionData, config: Config): Promise<Session> {
  let cfg = load(config);
  let api = new RatelAPI(cfg.ratel, debugConsole); // FIXME Should be the common logger.
  return api.verifySignature(sessionData).then((context: AgentContext) => {
    return withApiKey(context.id, context.apiKey, cfg);
  });
}
