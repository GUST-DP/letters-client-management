/**
 * MS Teams 알림 전송 유틸리티
 */

/**
 * 한국 표준시(KST, UTC+9) 기반의 타임스탬프를 반환합니다.
 * Vercel 서버는 UTC로 동작하므로, Asia/Seoul 타임존을 명시적으로 지정합니다.
 * 반환 형식: "YYYY.MM.DD HH:mm"
 */
export function getKSTTimestamp(): string {
  return new Date().toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
  .replace(/\. /g, ".")   // "2026. 04. 07." → "2026.04.07."
  .replace(/\.$/, "")     // 마지막 점 제거
  .replace(",", "");      // 날짜와 시간 사이 쉼표 제거
}

export async function sendTeamsMessage(content: {
  title: string;
  subtitle?: string;
  subtitles?: string[];
  sections?: { name: string; value: string }[];
  lastSection?: { name: string; value: string };
  lastSections?: { name: string; value: string; color?: string }[];
  buttonUrl?: string;
  buttonLabel?: string;
  buttons?: { label: string; url: string }[];
}) {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("TEAMS_WEBHOOK_URL is not defined in environment variables");
    return;
  }

  const body: any[] = [
    {
      "type": "TextBlock",
      "text": content.title,
      "weight": "Bolder",
      "size": "Medium",
      "wrap": true
    }
  ];

  const subtitleLines = [
    ...(content.subtitle ? [content.subtitle] : []),
    ...(content.subtitles || []),
  ];
  subtitleLines.forEach((line, index) => {
    body.push({
      "type": "TextBlock",
      "text": line,
      "size": "Small",
      "spacing": index === 0 ? "None" : "Small",
      "wrap": true
    });
  });

  if (content.sections && content.sections.length > 0) {
    content.sections.forEach((section, index) => {
      body.push({
        "type": "ColumnSet",
        "spacing": "Small",
        "separator": index === 0,
        "columns": [
          {
            "type": "Column",
            "width": "auto",
            "items": [
              {
                "type": "TextBlock",
                "text": section.name,
                "weight": "Bolder",
                "color": "Accent",
                "size": "Small",
                "wrap": false
              }
            ]
          },
          {
            "type": "Column",
            "width": "stretch",
            "items": [
              {
                "type": "TextBlock",
                "text": section.value || "-",
                "size": "Small",
                "wrap": true
              }
            ]
          }
        ]
      });
    });
  }

  const allLastSections = [
    ...(content.lastSections || []),
    ...(content.lastSection ? [content.lastSection] : []),
  ];
  allLastSections.forEach((ls, i) => {
    body.push({
      "type": "TextBlock",
      "text": `**${ls.name}**`,
      "weight": "Bolder",
      "color": (ls as any).color || "Accent",
      "size": "Small",
      "spacing": "Medium",
      "separator": i === 0,
      "wrap": true
    });
    body.push({
      "type": "TextBlock",
      "text": ls.value || "-",
      "size": "Small",
      "spacing": "None",
      "wrap": true
    });
  });

  const payload: any = {
    "type": "message",
    "attachments": [
      {
        "contentType": "application/vnd.microsoft.card.adaptive",
        "content": {
          "type": "AdaptiveCard",
          "version": "1.4",
          "body": body,
          "msteams": {
            "width": "Full"
          }
        }
      }
    ]
  };

  const allButtons: { label: string; url: string }[] = [];
  if (content.buttonUrl) {
    allButtons.push({ label: content.buttonLabel || "사이트 바로가기", url: content.buttonUrl });
  }
  if (content.buttons && content.buttons.length > 0) {
    allButtons.push(...content.buttons);
  }

  if (allButtons.length > 0) {
    // 표준 Action 버튼으로 렌더링 (Teams에서 세련된 CTA 버튼 스타일 자동 적용)
    payload.attachments[0].content.actions = allButtons.map(btn => ({
      "type": "Action.OpenUrl",
      "title": btn.label,
      "url": btn.url,
      "style": "positive"
    }));
  }

  try {
    const isLocal = process.env.NODE_ENV === 'development';
    const obfuscatedUrl = webhookUrl.substring(0, 10) + "...";
    
    console.log(`[Teams Notification] Attempting to send message. URL Prefix: ${obfuscatedUrl}, Env: ${process.env.NODE_ENV}`);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Teams Notification] HTTP Error ${response.status}:`, errorText);
    } else {
      console.log(`[Teams Notification] Successfully sent message. Status: ${response.status}`);
    }
  } catch (error) {
    console.error("[Teams Notification] Network/Critical Error:", error);
  }
}
