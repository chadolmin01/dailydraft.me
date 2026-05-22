import { describe, it, expect } from 'vitest'
import { parseBuffer } from './binary-parser'

describe('parseBuffer', () => {
  it('text/plain — UTF-8 그대로 반환', async () => {
    const buf = Buffer.from('안녕하세요\n두 번째 줄', 'utf-8')
    const r = await parseBuffer(buf, 'text/plain')
    expect(r.text).toBe('안녕하세요\n두 번째 줄')
  })

  it('text/markdown 도 text 로 처리', async () => {
    const buf = Buffer.from('# 제목\n본문', 'utf-8')
    const r = await parseBuffer(buf, 'text/markdown')
    expect(r.text).toContain('제목')
  })

  it('text/csv 도 text 로 처리', async () => {
    const buf = Buffer.from('a,b,c\n1,2,3', 'utf-8')
    const r = await parseBuffer(buf, 'text/csv')
    expect(r.text).toBe('a,b,c\n1,2,3')
  })

  it('알 수 없는 mime 은 Unsupported throw', async () => {
    await expect(parseBuffer(Buffer.from('x'), 'application/octet-stream')).rejects.toThrow(
      /Unsupported/,
    )
  })

  it('text/* prefix 매칭 (text/html 등)', async () => {
    const r = await parseBuffer(Buffer.from('<p>hi</p>', 'utf-8'), 'text/html')
    expect(r.text).toBe('<p>hi</p>')
  })
})
