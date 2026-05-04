import { NextResponse } from "next/server";

export async function GET() {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json({ error: "SLACK_WEBHOOK_URL이 설정되지 않았습니다." }, { status: 500 });
  }

  // 가장 단순한 페이로드로 테스트
  const payload = {
    text: "✅ Slack 알림 테스트 성공! 이슈 알림봇이 정상 작동 중입니다.",
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    return NextResponse.json({
      status: response.status,
      ok: response.ok,
      slackResponse: responseText,
      webhookUrlPrefix: webhookUrl.substring(0, 40) + "...",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
