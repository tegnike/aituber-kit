export async function synthesizeStyleBertVIT2Api(
  message: string,
  stylebertvit2ServerUrl: string,
  stylebertvits2ModelId: string
) {
  const body = {
    message: message,
    stylebertvit2ServerUrl: stylebertvit2ServerUrl,
    stylebertvits2ModelId: stylebertvits2ModelId,
    type: "stylebertvits2",
  };

  try {
    const res = await fetch("/api/stylebertvits2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`APIからの応答が異常です。ステータスコード: ${res.status}`);
    }

    const buffer = await res.arrayBuffer();
    return buffer;
  } catch (error: any) {
    throw new Error(`APIリクエスト中にエラーが発生しました: ${error.message}`);
  }
}
