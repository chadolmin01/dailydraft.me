// Google Picker 동적 로더.
//
// Picker API 는 https://apis.google.com/js/api.js 를 통해 런타임에 로드.
// SSR 환경 (Next.js Server Component) 에서는 호출하지 말 것 — window 참조.
//
// 셋업 (사용자 작업):
//   1. https://console.cloud.google.com/apis/library/picker.googleapis.com
//      에서 Picker API 활성화
//   2. APIs & Services → Credentials → "Create credentials" → "API key"
//      → 발급 후 "Picker API" 로 제한 권장
//   3. v2/.env.local 에 추가:
//        NEXT_PUBLIC_GOOGLE_API_KEY="AIza..."
//   4. dev 서버 재시작

declare global {
  interface Window {
    gapi?: {
      load: (lib: string, callback: () => void) => void
    }
    google?: {
      picker: GooglePickerNamespace
    }
  }
}

interface GooglePickerNamespace {
  PickerBuilder: new () => PickerBuilder
  DocsView: new (viewId?: string) => DocsView
  Action: { PICKED: string; CANCEL: string }
  ViewId: { FOLDERS: string; SPREADSHEETS: string; DOCS: string }
}

interface DocsView {
  setIncludeFolders(b: boolean): DocsView
  setSelectFolderEnabled(b: boolean): DocsView
  setMimeTypes(types: string): DocsView
  setMode(mode: string): DocsView
  setParent(folderId: string): DocsView
}

interface PickerBuilder {
  addView(view: DocsView): PickerBuilder
  setOAuthToken(token: string): PickerBuilder
  setDeveloperKey(key: string): PickerBuilder
  setAppId(id: string): PickerBuilder
  setOrigin(origin: string): PickerBuilder
  setCallback(cb: (data: PickerCallbackData) => void): PickerBuilder
  setTitle(title: string): PickerBuilder
  build(): Picker
}

interface Picker {
  setVisible(visible: boolean): void
}

export interface PickerCallbackData {
  action: string
  docs?: Array<{
    id: string
    name: string
    mimeType: string
    url?: string
  }>
}

let loadingPromise: Promise<void> | null = null

export function loadPickerApi(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Picker can only load in browser'))
  }
  if (window.google?.picker) return Promise.resolve()
  if (loadingPromise) return loadingPromise

  loadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://apis.google.com/js/api.js"]')
    const onLoad = () => {
      if (!window.gapi) {
        reject(new Error('gapi 로드 실패'))
        return
      }
      window.gapi.load('picker', () => resolve())
    }

    if (existing) {
      if (window.gapi) onLoad()
      else existing.addEventListener('load', onLoad)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://apis.google.com/js/api.js'
    script.async = true
    script.defer = true
    script.onload = onLoad
    script.onerror = () => reject(new Error('apis.google.com 스크립트 로드 실패'))
    document.body.appendChild(script)
  })

  return loadingPromise
}

// project_id = "draft-497014" 의 프로젝트 번호. client_id 앞부분.
// Picker 가 OAuth scope 검증 시 필요.
export const GOOGLE_APP_ID = '388622029066'
