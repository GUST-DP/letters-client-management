/**
 * MS Teams 알림 전송 유틸리티
 * 이전 정상 작동 버전(AdaptiveCard 1.4)의 구조로 완벽 복구되었습니다.
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
  buttons?: { label: string; url: string }[];
}) {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("[Teams Notification] TEAMS_WEBHOOK_URL is missing.");
    return;
  }

  // 본문(body) 생성 로직
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

  // 최종 페이로드 구조 (AdaptiveCard 1.4)
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
    allButtons.push({ label: content.buttonLabel || "바로가기", url: content.buttonUrl });
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
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Teams Notification] Failed (${response.status}):`, errorText);
    }
  } catch (error) {
    console.error("[Teams Notification] Critical Error:", error);
  }
}
