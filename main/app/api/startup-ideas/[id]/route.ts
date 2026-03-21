import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/src/lib/api-utils';

export const runtime = 'nodejs';

/**
 * GET /api/startup-ideas/[id]
 * Get a single startup idea by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return ApiResponse.badRequest('ID is required');
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return ApiResponse.internalError('서버 설정 오류가 발생했습니다');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('startup_ideas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return ApiResponse.notFound('스타트업 아이디어를 찾을 수 없습니다');
      }
      throw error;
    }

    return ApiResponse.ok({
      success: true,
      data,
    });

  } catch (error) {
    console.error('[startup-ideas] GET by ID error:', error);
    return ApiResponse.internalError('스타트업 아이디어 조회에 실패했습니다');
  }
}
