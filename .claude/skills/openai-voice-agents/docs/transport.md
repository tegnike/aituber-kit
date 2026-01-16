---
title: 'Realtime Transport Layer | OpenAI Agents SDK'
source_url: 'https://openai.github.io/openai-agents-js/guides/voice-agents/transport'
fetched_at: '2025-12-19T21:01:27.520248+00:00'
---

# Realtime Transport Layer

## Default transport layers

[Section titled “Default transport layers”](https://openai.github.io/openai-agents-js/guides/voice-agents/transport.html#default-transport-layers)

### Connecting over WebRTC

[Section titled “Connecting over WebRTC”](https://openai.github.io/openai-agents-js/guides/voice-agents/transport.html#connecting-over-webrtc)

The default transport layer uses WebRTC. Audio is recorded from the microphone
and played back automatically.

To use your own media stream or audio element, provide an
`OpenAIRealtimeWebRTC` instance when creating the session.

```
import { RealtimeAgent, RealtimeSession, OpenAIRealtimeWebRTC } from '@openai/agents/realtime';

const agent = new RealtimeAgent({

name: 'Greeter',

instructions: 'Greet the user with cheer and answer questions.',

});

async function main() {

const transport = new OpenAIRealtimeWebRTC({

mediaStream: await navigator.mediaDevices.getUserMedia({ audio: true }),

audioElement: document.createElement('audio'),

});

const customSession = new RealtimeSession(agent, { transport });

}
```

### Connecting over WebSocket

[Section titled “Connecting over WebSocket”](https://openai.github.io/openai-agents-js/guides/voice-agents/transport.html#connecting-over-websocket)

Pass `transport: 'websocket'` or an instance of `OpenAIRealtimeWebSocket` when creating the session to use a WebSocket connection instead of WebRTC. This works well for server-side use cases, for example
building a phone agent with Twilio.

```
import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';

const agent = new RealtimeAgent({

name: 'Greeter',

instructions: 'Greet the user with cheer and answer questions.',

});

const myRecordedArrayBuffer = new ArrayBuffer(0);

const wsSession = new RealtimeSession(agent, {

transport: 'websocket',

model: 'gpt-realtime',

});

await wsSession.connect({ apiKey: process.env.OPENAI_API_KEY! });

wsSession.on('audio', (event) => {

// event.data is a chunk of PCM16 audio

});

wsSession.sendAudio(myRecordedArrayBuffer);
```

Use any recording/playback library to handle the raw PCM16 audio bytes.

### Connecting over SIP

[Section titled “Connecting over SIP”](https://openai.github.io/openai-agents-js/guides/voice-agents/transport.html#connecting-over-sip)

Bridge SIP calls from providers such as Twilio by using the `OpenAIRealtimeSIP` transport. The transport keeps the Realtime session synchronized with SIP events emitted by your telephony provider.

1. Accept the incoming call by generating an initial session configuration with `OpenAIRealtimeSIP.buildInitialConfig()`. This ensures the SIP invitation and Realtime session share identical defaults.
2. Attach a `RealtimeSession` that uses the `OpenAIRealtimeSIP` transport and connect with the `callId` issued by the provider webhook.
3. Listen for session events to drive call analytics, transcripts, or escalation logic.

```
import OpenAI from 'openai';

import {

OpenAIRealtimeSIP,

RealtimeAgent,

RealtimeSession,

type RealtimeSessionOptions,

} from '@openai/agents/realtime';

const openai = new OpenAI({

apiKey: process.env.OPENAI_API_KEY!,

webhookSecret: process.env.OPENAI_WEBHOOK_SECRET!,

});

const agent = new RealtimeAgent({

name: 'Receptionist',

instructions:

'Welcome the caller, answer scheduling questions, and hand off if the caller requests a human.',

});

const sessionOptions: Partial<RealtimeSessionOptions> = {

model: 'gpt-realtime',

config: {

audio: {

input: {

turnDetection: { type: 'semantic_vad', interruptResponse: true },

},

},

},

};

export async function acceptIncomingCall(callId: string): Promise<void> {

const initialConfig = await OpenAIRealtimeSIP.buildInitialConfig(

agent,

sessionOptions,

);

await openai.realtime.calls.accept(callId, initialConfig);

}

export async function attachRealtimeSession(

callId: string,

): Promise<RealtimeSession> {

const session = new RealtimeSession(agent, {

transport: new OpenAIRealtimeSIP(),

...sessionOptions,

});

session.on('history_added', (item) => {

console.log('Realtime update:', item.type);

});

await session.connect({

apiKey: process.env.OPENAI_API_KEY!,

callId,

});

return session;

}
```

#### Cloudflare Workers (workerd) note

[Section titled “Cloudflare Workers (workerd) note”](https://openai.github.io/openai-agents-js/guides/voice-agents/transport.html#cloudflare-workers-workerd-note)

Cloudflare Workers and other workerd runtimes cannot open outbound WebSockets using the global `WebSocket` constructor. Use the Cloudflare transport from the extensions package, which performs the `fetch()`-based upgrade internally.

```
import { CloudflareRealtimeTransportLayer } from '@openai/agents-extensions';

import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';

const agent = new RealtimeAgent({

name: 'My Agent',

});

// Create a transport that connects to OpenAI Realtime via Cloudflare/workerd's fetch-based upgrade.

const cfTransport = new CloudflareRealtimeTransportLayer({

url: 'wss://api.openai.com/v1/realtime?model=gpt-realtime',

});

const session = new RealtimeSession(agent, {

// Set your own transport.

transport: cfTransport,

});
```

### Building your own transport mechanism

[Section titled “Building your own transport mechanism”](https://openai.github.io/openai-agents-js/guides/voice-agents/transport.html#building-your-own-transport-mechanism)

If you want to use a different speech-to-speech API or have your own custom transport mechanism, you
can create your own by implementing the `RealtimeTransportLayer` interface and emit the `RealtimeTransportEventTypes` events.

## Interacting with the Realtime API more directly

[Section titled “Interacting with the Realtime API more directly”](https://openai.github.io/openai-agents-js/guides/voice-agents/transport.html#interacting-with-the-realtime-api-more-directly)

If you want to use the OpenAI Realtime API but have more direct access to the Realtime API, you have
two options:

### Option 1 - Accessing the transport layer

[Section titled “Option 1 - Accessing the transport layer”](https://openai.github.io/openai-agents-js/guides/voice-agents/transport.html#option-1---accessing-the-transport-layer)

If you still want to benefit from all of the capabilities of the `RealtimeSession` you can access
your transport layer through `session.transport`.

The transport layer will emit every event it receives under the `*` event and you can send raw
events using the `sendEvent()` method.

```
import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';

const agent = new RealtimeAgent({

name: 'Greeter',

instructions: 'Greet the user with cheer and answer questions.',

});

const session = new RealtimeSession(agent, {

model: 'gpt-realtime',

});

session.transport.on('*', (event) => {

// JSON parsed version of the event received on the connection

});

// Send any valid event as JSON. For example triggering a new response

session.transport.sendEvent({

type: 'response.create',

// ...

});
```

### Option 2 — Only using the transport layer

[Section titled “Option 2 — Only using the transport layer”](https://openai.github.io/openai-agents-js/guides/voice-agents/transport.html#option-2--only-using-the-transport-layer)

If you don’t need automatic tool execution, guardrails, etc. you can also use the transport layer
as a “thin” client that just manages connection and interruptions.

```
import { OpenAIRealtimeWebRTC } from '@openai/agents/realtime';

const client = new OpenAIRealtimeWebRTC();

const audioBuffer = new ArrayBuffer(0);

await client.connect({

apiKey: '<api key>',

model: 'gpt-4o-mini-realtime-preview',

initialSessionConfig: {

instructions: 'Speak like a pirate',

voice: 'ash',

modalities: ['text', 'audio'],

inputAudioFormat: 'pcm16',

outputAudioFormat: 'pcm16',

},

});

// optionally for WebSockets

client.on('audio', (newAudio) => {});

client.sendAudio(audioBuffer);
```
