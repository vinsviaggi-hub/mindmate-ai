import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Sei un coach motivazionale amichevole e positivo." },
          { role: "user", content: message },
        ],
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Errore API:", errorText);
      return NextResponse.json({ reply: "Errore nella risposta AI 😞" }, { status: 500 });
    }

    const data = await res.json();
    const reply = data.choices[0].message.content;
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Errore generale:", error);
    return NextResponse.json({ reply: "Si è verificato un errore 😢" }, { status: 500 });
  }
}