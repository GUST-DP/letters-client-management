/**
 * MS Teams 알림 전송 유틸리티 (Legacy MessageCard 포맷 버전)
 * 이 포맷은 모든 종류의 팀즈 웹훅(Incoming Webhook, Power Automate 등)에서 호환성이 가장 높습니다.
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
    console.warn("[Teams Notification] WEBHOOK URL is missing.");
    return;
  }

  // 모든 부가 정보를 섹션들의 내역인 'facts'로 변환하여 가장 안정적으로 표시합니다.
  const facts: { name: string; value: string }[] = [];
  
  if (content.subtitle) facts.push({ name: "📍 정보", value: content.subtitle });
  if (content.subtitles) {
    content.subtitles.forEach(s => facts.push({ name: "📍 정보", value: s }));
  }
  
  if (content.sections) {
    content.sections.forEach(s => facts.push({ name: s.name, value: s.value || "-" }));
  }

  const allLastSections = [
    ...(content.lastSections || []),
    ...(content.lastSection ? [content.lastSection] : []),
  ];
  
  allLastSections.forEach(ls => {
    facts.push({ name: `📌 ${ls.name}`, value: ls.value || "-" });
  });

  // 레거시 MessageCard 포맷 (호환성 최강)
  const payload = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": "0076D7",
    "summary": content.title,
    "sections": [{
      "activityTitle": content.title,
      "activitySubtitle": content.subtitle || (content.subtitles ? content.subtitles[0] : ""),
      "facts": facts,
      "markdown": true
    }],
    "potentialAction": [] as any[]
  };

  // 버튼 추가
  if (content.buttonUrl) {
    payload.potentialAction.push({
      "@type": "OpenUri",
      "name": content.buttonLabel || "바로가기",
      "targets": [{ "os": "default", "uri": content.buttonUrl }]
    });
  }
  
  if (content.buttons) {
    content.buttons.forEach(btn => {
      payload.potentialAction.push({
        "@type": "OpenUri",
        "name": btn.label,
        "targets": [{ "os": "default", "uri": btn.url }]
      });
    });
  }

  try {
    console.log(`[Teams Notification] Sending Legacy MessageCard... (Title: ${content.title})`);
    
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
