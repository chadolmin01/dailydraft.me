interface InviteCodeEmailProps {
  recipientName: string
  inviteCode: string
  expiresAt: string
  appUrl?: string
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function renderInviteCodeEmail({
  recipientName,
  inviteCode,
  expiresAt,
  appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dailydraft.me',
}: InviteCodeEmailProps): string {
  const safeName = escapeHtml(recipientName)
  const safeCode = escapeHtml(inviteCode)
  const formattedDate = new Date(expiresAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Draft.</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:48px 20px;">
        <table width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; box-shadow:0 2px 8px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:1.5px;">Private Access</span>
                  </td>
                  <td align="right">
                    <span style="font-family:Georgia,serif; font-size:15px; font-weight:600; color:#111827;">Draft.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:40px 40px 32px 40px;">
              <h1 style="margin:0 0 20px 0; font-size:32px; color:#111827; font-weight:700; letter-spacing:-0.5px; line-height:1.2;">
                You have been<br>drafted.
              </h1>
              <p style="margin:0; font-size:16px; color:#4b5563; line-height:1.7;">
                안녕하세요 <strong style="color:#111827;">${safeName}</strong>님,<br>
                당신의 아이디어에 날개를 달아줄 팀을 찾아보세요.<br>
                Draft 프리미엄 멤버십이 준비되어 있습니다.
              </p>
            </td>
          </tr>

          <!-- Code Box -->
          <tr>
            <td style="padding:0 40px 40px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa; border:2px solid #e5e5e5; border-radius:12px;">
                <tr>
                  <td align="center" style="padding:32px 24px;">
                    <p style="margin:0 0 12px 0; font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:2px; font-weight:500;">
                      Invitation Code
                    </p>
                    <p style="margin:0 0 12px 0; font-family:'Courier New',monospace; font-size:32px; font-weight:700; color:#111827; letter-spacing:4px;">
                      ${safeCode}
                    </p>
                    <p style="margin:0; font-size:13px; color:#dc2626; font-weight:500;">
                      ${formattedDate}까지 유효
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px; background-color:#e5e5e5;"></div>
            </td>
          </tr>

          <!-- Steps -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 20px 0; font-size:14px; font-weight:700; color:#111827; text-transform:uppercase; letter-spacing:1px;">
                How to activate
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:16px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="28" height="28" align="center" style="background-color:#111827; border-radius:50%; color:#ffffff; font-size:13px; font-weight:600;">1</td>
                        <td style="padding-left:14px; font-size:15px; color:#374151;">Draft에 로그인합니다.</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:16px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="28" height="28" align="center" style="background-color:#111827; border-radius:50%; color:#ffffff; font-size:13px; font-weight:600;">2</td>
                        <td style="padding-left:14px; font-size:15px; color:#374151;">프로필 메뉴에서 "초대 코드 입력"을 선택합니다.</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="28" height="28" align="center" style="background-color:#111827; border-radius:50%; color:#ffffff; font-size:13px; font-weight:600;">3</td>
                        <td style="padding-left:14px; font-size:15px; color:#374151;">코드를 입력하면 즉시 활성화됩니다.</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Button -->
          <tr>
            <td align="center" style="padding:8px 40px 48px 40px;">
              <a href="${appUrl}" target="_blank" style="display:inline-block; padding:16px 48px; background-color:#111827; color:#ffffff; text-decoration:none; border-radius:10px; font-size:15px; font-weight:600;">
                지금 시작하기 &rarr;
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:28px 40px; background-color:#fafafa; border-radius:0 0 16px 16px;">
              <p style="margin:0; font-size:12px; color:#9ca3af; line-height:1.6;">
                © 2026 Draft. 모든 프로젝트는 여기서 시작됩니다.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
