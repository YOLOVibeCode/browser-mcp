/**
 * Event payload schemas.
 * All events MUST have typed payloads.
 * Event names are past-tense verbs (e.g., TabActivated, FrameworkDetected)
 */

export interface TabActivatedEvent {
  tabId: number;
  url: string;
  port: number;
  timestamp: number;
}

export interface TabDeactivatedEvent {
  tabId: number;
  timestamp: number;
}

export interface FrameworkDetectedEvent {
  tabId: number;
  framework: {
    name: string;
    version: string | null;
  };
  timestamp: number;
}

export interface DOMUpdatedEvent {
  tabId: number;
  nodeCount: number;
  timestamp: number;
}

export interface ResourceRequestedEvent {
  resourceURI: string;
  tabId: number;
  timestamp: number;
}

export interface PortAllocatedEvent {
  port: number;
  tabId: number;
  timestamp: number;
}

export interface SourceMapLoadedEvent {
  tabId: number;
  url: string;
  timestamp: number;
}

export interface ConsoleMessageEvent {
  tabId: number;
  level: 'log' | 'info' | 'warn' | 'error';
  text: string;
  timestamp: number;
}

/**
 * Union type of all event schemas.
 */
export type EventSchema =
  | TabActivatedEvent
  | TabDeactivatedEvent
  | FrameworkDetectedEvent
  | DOMUpdatedEvent
  | ResourceRequestedEvent
  | PortAllocatedEvent
  | SourceMapLoadedEvent
  | ConsoleMessageEvent;
