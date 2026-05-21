import { describe, it, expect } from 'vitest'
import { extractDriveFolderId, extractSheetId } from './google-url'

describe('extractDriveFolderId', () => {
  it('표준 URL 에서 ID 추출', () => {
    expect(extractDriveFolderId('https://drive.google.com/drive/folders/1AbcDef-_123XYZ45')).toBe('1AbcDef-_123XYZ45')
  })

  it('?usp=sharing 같은 쿼리 무시', () => {
    expect(extractDriveFolderId('https://drive.google.com/drive/folders/abc12345_xyz?usp=sharing')).toBe('abc12345_xyz')
  })

  it('계정 prefix /u/0/ 가 있어도 ID 추출', () => {
    expect(extractDriveFolderId('https://drive.google.com/drive/u/0/folders/myFolder_id-2025')).toBe('myFolder_id-2025')
  })

  it('순수 ID 도 그대로 받음', () => {
    expect(extractDriveFolderId('1AbCdEf1234567890_someid_xyz')).toBe('1AbCdEf1234567890_someid_xyz')
  })

  it('짧거나 잘못된 형식은 null', () => {
    expect(extractDriveFolderId('xyz')).toBeNull()
    expect(extractDriveFolderId('')).toBeNull()
    expect(extractDriveFolderId('https://example.com/something')).toBeNull()
  })

  it('앞뒤 공백 트림', () => {
    expect(extractDriveFolderId('  1AbcDef-_123XYZ4567890  ')).toBe('1AbcDef-_123XYZ4567890')
  })
})

describe('extractSheetId', () => {
  it('Sheets URL', () => {
    expect(extractSheetId('https://docs.google.com/spreadsheets/d/sheet_id_12345/edit')).toBe('sheet_id_12345')
  })

  it('Sheets URL + gid', () => {
    expect(extractSheetId('https://docs.google.com/spreadsheets/d/anotherSheet_ID_XYZ/edit#gid=0')).toBe('anotherSheet_ID_XYZ')
  })

  it('순수 ID', () => {
    expect(extractSheetId('1aBcDeF_sheet_id_1234567890')).toBe('1aBcDeF_sheet_id_1234567890')
  })

  it('잘못된 형식', () => {
    expect(extractSheetId('xyz')).toBeNull()
  })
})
