/**
 * Slack 알림 전송 유틸리티 (Block Kit 기반)
 * 기존 MS Teams 알림을 대체합니다.
 */

/**
 * 한국 표준시(KST, UTC+9) 기반의 타임스탬프를 반환합니다.
 * Vercel 서버는 UTC로 동작하므로, Asia/Seoul 타임존을 명시적으로 지정합니다.
 * 반환 형식: "YYYY.MM.DD HH:mm"
 */
export function getKSTTimestamp(): string {
  return new Date()
    .toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(/\. /g, ".") // "2026. 04. 07." → "2026.04.07."
    .replace(/\.$/, "") // 마지막 점 제거
    .replace(",", ""); // 날짜와 시간 사이 쉼표 제거
}

export async function sendSlackMessage(content: {
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
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("SLACK_WEBHOOK_URL is not defined in environment variables");
    return;
  }

  // ── Block Kit 블록 조립 ──
  const blocks: any[] = [];

  // 1. 제목
  blocks.push({
    type: "header",
    text: {
      type: "plain_text",
      text: content.title,
      emoji: true,
    },
  });

  // 2. 타임스탬프 / 부제목 라인
  const subtitleLines = [
    ...(content.subtitle ? [content.subtitle] : []),
    ...(content.subtitles || []),
  ];
  if (subtitleLines.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: subtitleLines.join("\n"),
      },
    });
  }

  // 3. 구분선
  blocks.push({ type: "divider" });

  // 4. 섹션 필드 (고객사, 이슈유형, 등록자 등)
  if (content.sections && content.sections.length > 0) {
    // Slack fields는 한 블록에 최대 10개 (2열 레이아웃)
    const fields = content.sections.map((s) => ({
      type: "mrkdwn",
      text: `*${s.name}*\n${s.value || "-"}`,
    }));

    // 10개 초과 시 분할
    for (let i = 0; i < fields.length; i += 10) {
      blocks.push({
        type: "section",
        fields: fields.slice(i, i + 10),
      });
    }
  }

  // 5. lastSections (이슈내용, 조치내용, 재발방지 대책 등 — 긴 텍스트)
  const allLastSections = [
    ...(content.lastSections || []),
    ...(content.lastSection ? [content.lastSection] : []),
  ];

  if (allLastSections.length > 0) {
    blocks.push({ type: "divider" });

    allLastSections.forEach((ls) => {
      // color 값을 이모지로 매핑
      const emoji =
        (ls as any).color === "Good"
          ? "✅"
          : (ls as any).color === "Warning"
          ? "⚠️"
          : "📋";

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${emoji} *${ls.name}*\n${ls.value || "-"}`,
        },
      });
    });
  }

  // 6. 구분선 + 버튼 (actions 블록)
  const allButtons: { label: string; url: string }[] = [];
  if (content.buttonUrl) {
    allButtons.push({
      label: content.buttonLabel || "사이트 바로가기",
      url: content.buttonUrl,
    });
  }
  if (content.buttons && content.buttons.length > 0) {
    allButtons.push(...content.buttons);
  }

  if (allButtons.length > 0) {
    blocks.push({ type: "divider" });
    blocks.push({
      type: "actions",
      elements: allButtons.map((btn, idx) => ({
        type: "button",
        action_id: `btn_${idx}_${Date.now()}`,
        text: {
          type: "plain_text",
          text: btn.label,
          emoji: true,
        },
        url: btn.url,
        style: "primary",
      })),
    });
  }

  const payload = { blocks };

  try {
    const obfuscatedUrl = webhookUrl.substring(0, 30) + "...";
    console.log(
      `[Slack Notification] Attempting to send message. URL Prefix: ${obfuscatedUrl}, Env: ${process.env.NODE_ENV}`
    );

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[Slack Notification] HTTP Error ${response.status}:`,
        errorText
      );
    } else {
      console.log(
        `[Slack Notification] Successfully sent message. Status: ${response.status}`
      );
    }
  } catch (error) {
    console.error("[Slack Notification] Network/Critical Error:", error);
  }
}
