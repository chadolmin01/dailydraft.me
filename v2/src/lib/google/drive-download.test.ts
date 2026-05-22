import { describe, it, expect } from 'vitest'
import { isGoogleNative } from './drive-download'

describe('isGoogleNative', () => {
  it('Google Docs/Sheets/Slides → true', () => {
    expect(isGoogleNative('application/vnd.google-apps.document')).toBe(true)
    expect(isGoogleNative('application/vnd.google-apps.spreadsheet')).toBe(true)
    expect(isGoogleNative('application/vnd.google-apps.presentation')).toBe(true)
  })

  it('PDF/DOCX/HWP → false (직접 다운로드)', () => {
    expect(isGoogleNative('application/pdf')).toBe(false)
    expect(isGoogleNative('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(false)
    expect(isGoogleNative('application/x-hwp')).toBe(false)
  })

  it('text 류 → false', () => {
    expect(isGoogleNative('text/plain')).toBe(false)
    expect(isGoogleNative('text/csv')).toBe(false)
  })
})
