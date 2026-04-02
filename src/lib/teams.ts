/**
 * MS Teams 알림 전송 유틸리티
 */

export async function sendTeamsMessage(content: {
  title: string;
  subtitle?: string;
  subtitles?: string[];
  sections?: { name: string; value: string }[];
  lastSection?: { name: string; value: string };
  lastSections?: { name: string; value: string; color?: string }[];
  buttonUrl?: string;
  buttonLabel?: string;
  buttons?: { label: string; url: string }[]; // 여러 버튼 지원
}) {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("TEAMS_WEBHOOK_URL이 설정되지 않아 알림을 보낼 수 없습니다.");
    return;
  }

  // 헤더 (제목 + 타임스탬프)
  const body: any[] = [
    {
      "type": "TextBlock",
      "text": content.title,
      "weight": "Bolder",
      "size": "Medium",
      "wrap": true
    }
  ];

  // subtitle 단일 or subtitles 배열 모두 지원
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

  // 섹션들을 ColumnSet(좌: 라벨, 우: 값) 2컬럼으로 배치
  if (content.sections && content.sections.length > 0) {
    content.sections.forEach((section, index) => {
      body.push({
        "type": "ColumnSet",
        "spacing": "Small",
        "separator": index === 0, // 첫 번째 항목 앞에만 구분선 표시
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

  // 전체 너비 마지막 항목들 (단일 또는 배열 모두 지원)
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

  // 버튼 조합: buttonUrl 단일 + buttons 배열 통합
  const allButtons: { label: string; url: string }[] = [];
  if (content.buttonUrl) {
    allButtons.push({ label: content.buttonLabel || "사이트 바로가기", url: content.buttonUrl });
  }
  if (content.buttons && content.buttons.length > 0) {
    allButtons.push(...content.buttons);
  }
  if (allButtons.length > 0) {
    payload.attachments[0].content.actions = allButtons.map(btn => ({
      "type": "Action.OpenUrl",
      "title": btn.label,
      "url": btn.url
    }));
  }

  try {
    console.log(`[Teams Notification] Sending message to webhook... (Title: ${content.title})`);
    
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Teams Notification] Failed (Status: ${response.status}):`, errorText);
    } else {
      console.log(`[Teams Notification] Successfully sent message.`);
    }
  } catch (error) {
    console.error("[Teams Notification] Critical error during fetch:", error);
  }
}
