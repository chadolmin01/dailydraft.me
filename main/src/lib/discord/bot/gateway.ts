/**
 * Discord Gateway (WebSocket) 연결
 *
 * discord.js 없이 최소한의 WebSocket 클라이언트로 Gateway 연결.
 * 필요한 이벤트만 수신: MESSAGE_CREATE, MESSAGE_REACTION_ADD
 *
 * 왜 직접 구현?
 * - discord.js는 ~50MB, 우리는 2개 이벤트만 필요
 * - 크론 기반 REST 클라이언트와 동일한 패턴 유지
 * - Railway/Fly.io에서 단일 프로세스로 가볍게 실행
 */

import WebSocket from 'ws';

// Discord Gateway Intents (비트마스크)
// MESSAGE_CONTENT intent는 Discord Developer Portal에서 별도 활성화 필요
const INTENTS = {
  GUILDS: 1 << 0,
  GUILD_MESSAGES: 1 << 9,
  GUILD_MESSAGE_REACTIONS: 1 << 10,
  MESSAGE_CONTENT: 1 << 15,
};

const GATEWAY_URL = 'wss://gateway.discord.gg/?v=10&encoding=json';

interface GatewayCallbacks {
  onMessageCreate: (data: any) => void;
  onReactionAdd: (data: any) => void;
  onGuildCreate?: (data: any) => void;
  onThreadCreate?: (data: any) => void;
  onReady: (data: any) => void;
  onError: (error: Error) => void;
}

export class DiscordGateway {
  private ws: WebSocket | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private lastSequence: number | null = null;
  private sessionId: string | null = null;
  private resumeUrl: string | null = null;
  private token: string;
  private callbacks: GatewayCallbacks;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor(token: string, callbacks: GatewayCallbacks) {
    this.token = token;
    this.callbacks = callbacks;
  }

  /**
   * Gateway 연결 시작
   */
  connect(): void {
    const url = this.resumeUrl ?? GATEWAY_URL;
    this.ws = new WebSocket(url);

    this.ws.on('open', () => {
      console.log('[Gateway] 연결됨');
      this.reconnectAttempts = 0;
    });

    this.ws.on('message', (raw: Buffer | string) => {
      const str = typeof raw === 'string' ? raw : raw.toString('utf-8');
      this.handleMessage(JSON.parse(str));
    });

    this.ws.on('close', (code: number) => {
      console.log(`[Gateway] 연결 종료 (code: ${code})`);
      this.stopHeartbeat();

      // 재연결 가능한 코드인지 확인
      // 4004 = invalid token, 4014 = disallowed intents → 재연결 불가
      if (code === 4004 || code === 4014) {
        console.error('[Gateway] 복구 불가능한 에러, 재연결 중지');
        this.callbacks.onError(new Error(`Gateway closed with code ${code}`));
        return;
      }

      this.attemptReconnect();
    });

    this.ws.on('error', (err: Error) => {
      console.error('[Gateway] WebSocket 에러:', err.message);
    });
  }

  /**
   * 연결 종료
   */
  disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'Normal closure');
      this.ws = null;
    }
  }

  private handleMessage(payload: {
    op: number;
    d: any;
    s: number | null;
    t: string | null;
  }): void {
    const { op, d, s, t } = payload;

    // 시퀀스 번호 업데이트 (heartbeat에 사용)
    if (s !== null) this.lastSequence = s;

    switch (op) {
      // Hello — heartbeat 시작 + identify
      case 10:
        this.startHeartbeat(d.heartbeat_interval);
        if (this.sessionId) {
          this.resume();
        } else {
          this.identify();
        }
        break;

      // Heartbeat ACK
      case 11:
        break;

      // Heartbeat 요청
      case 1:
        this.sendHeartbeat();
        break;

      // Reconnect 요청
      case 7:
        console.log('[Gateway] 서버가 재연결 요청');
        this.ws?.close(4000, 'Reconnect requested');
        break;

      // Invalid Session
      case 9:
        console.log('[Gateway] 세션 무효화, resumable:', d);
        if (!d) {
          // 세션 복구 불가 → 새로 identify
          this.sessionId = null;
          this.resumeUrl = null;
        }
        setTimeout(() => {
          if (this.sessionId) this.resume();
          else this.identify();
        }, 1000 + Math.random() * 4000);
        break;

      // Dispatch (실제 이벤트)
      case 0:
        this.handleDispatch(t!, d);
        break;
    }
  }

  private handleDispatch(eventName: string, data: any): void {
    switch (eventName) {
      case 'READY':
        this.sessionId = data.session_id;
        this.resumeUrl = data.resume_gateway_url;
        console.log(`[Gateway] READY — ${data.guilds.length}개 서버 연결`);
        this.callbacks.onReady(data);
        break;

      case 'RESUMED':
        console.log('[Gateway] 세션 복구 완료');
        break;

      case 'MESSAGE_CREATE':
        this.callbacks.onMessageCreate(data);
        break;

      case 'MESSAGE_REACTION_ADD':
        this.callbacks.onReactionAdd(data);
        break;

      case 'GUILD_CREATE':
        this.callbacks.onGuildCreate?.(data);
        break;

      case 'THREAD_CREATE':
        this.callbacks.onThreadCreate?.(data);
        break;
    }
  }

  private identify(): void {
    this.send({
      op: 2,
      d: {
        token: this.token,
        intents:
          INTENTS.GUILDS |
          INTENTS.GUILD_MESSAGES |
          INTENTS.GUILD_MESSAGE_REACTIONS |
          INTENTS.MESSAGE_CONTENT,
        properties: {
          os: 'linux',
          browser: 'draft-bot',
          device: 'draft-bot',
        },
      },
    });
  }

  private resume(): void {
    this.send({
      op: 6,
      d: {
        token: this.token,
        session_id: this.sessionId,
        seq: this.lastSequence,
      },
    });
  }

  private startHeartbeat(intervalMs: number): void {
    this.stopHeartbeat();
    // 첫 heartbeat는 interval * jitter(0~1) 후에
    const jitter = Math.random();
    setTimeout(() => {
      this.sendHeartbeat();
      this.heartbeatInterval = setInterval(
        () => this.sendHeartbeat(),
        intervalMs
      );
    }, intervalMs * jitter);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private sendHeartbeat(): void {
    this.send({ op: 1, d: this.lastSequence });
  }

  private send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Gateway] 최대 재연결 시도 초과');
      this.callbacks.onError(new Error('Max reconnect attempts exceeded'));
      return;
    }

    // 지수 백오프: 1s, 2s, 4s, 8s, ... 최대 30s
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      30_000
    );
    this.reconnectAttempts++;

    console.log(
      `[Gateway] ${delay / 1000}초 후 재연결 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => this.connect(), delay);
  }
}
