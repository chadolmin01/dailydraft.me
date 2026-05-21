/**
 * OAuth Access Token 암호화 (AES-256-GCM).
 *
 * 저장 규격: `${ivBase64}:${ciphertextBase64}:${authTagBase64}`
 * GCM은 authTag가 11~16바이트 MAC이라 복호화 시 변조 탐지 가능.
 *
 * 키: process.env.TOKEN_ENCRYPTION_KEY (base64 32바이트). 한번 정하면 변경 금지
 * — 변경 시 기존 암호화된 토큰 모두 무효 (모든 유저 재연결 필요).
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // GCM 권장 96비트

function getKey(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY
  if (!raw) {
    throw new Error('TOKEN_ENCRYPTION_KEY 환경변수가 설정되지 않았습니다')
  }
  const key = Buffer.from(raw, 'base64')
  if (key.length !== 32) {
    throw new Error(
      `TOKEN_ENCRYPTION_KEY는 base64 디코딩 후 32바이트여야 합니다 (현재 ${key.length}바이트). openssl rand -base64 32로 생성하세요.`,
    )
  }
  return key
}

export function encryptToken(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('base64')}:${ciphertext.toString('base64')}:${authTag.toString('base64')}`
}

export function decryptToken(encrypted: string): string {
  const key = getKey()
  const parts = encrypted.split(':')
  if (parts.length !== 3) {
    throw new Error('암호화 토큰 형식 오류 (iv:ct:tag)')
  }
  const [ivB64, ctB64, tagB64] = parts as [string, string, string]
  const iv = Buffer.from(ivB64, 'base64')
  const ciphertext = Buffer.from(ctB64, 'base64')
  const authTag = Buffer.from(tagB64, 'base64')

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])
  return plaintext.toString('utf8')
}
