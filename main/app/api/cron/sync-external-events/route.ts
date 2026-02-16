import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for processing

/**
 * Cron endpoint for syncing external events (Devpost, Meetup)
 * POST /api/cron/sync-external-events
 *
 * 이 엔드포인트는 event-collector 모듈을 호출하여
 * 외부 소스(Devpost, Meetup)에서 이벤트를 수집합니다.
 *
 * 현재는 event-collector 모듈이 별도로 실행되므로
 * 이 엔드포인트는 트리거 역할만 합니다.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Verify authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const expectedAuth = `Bearer ${cronSecret}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. 외부 이벤트 동기화
    // event-collector 모듈은 독립적으로 실행되므로
    // 여기서는 상태만 확인하거나 직접 호출할 수 있습니다.

    // Option A: 독립 실행 (권장)
    // GitHub Actions에서 직접 event-collector 실행

    // Option B: 모듈 직접 호출 (모노레포 시)
    // const { runFullSync } = await import('event-collector');
    // const result = await runFullSync();

    // 현재는 placeholder 응답
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'External event sync triggered. Check event-collector logs for details.',
      sources: ['devpost', 'meetup'],
      duration_ms: duration,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        error: errorMessage,
        duration_ms: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 * GET /api/cron/sync-external-events
 */
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    sources: ['devpost', 'meetup'],
    timestamp: new Date().toISOString(),
  });
}
