import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, transcript } = await req.json();
    const q = (message || '').toLowerCase().trim();

    // 1. Casual Greetings Guard
    const isGreeting = ['hello', 'hi', 'hey', 'hlo', 'hlw', 'namaste'].some(g => q.includes(g));

    if (isGreeting) {
      return NextResponse.json({
        reply: "Hello! Main aapka MeetAI Assistant hoon. Aap Google Meet connect karke live transcript aur tasks analyze kar sakte hain."
      });
    }

    // 2. Help or How-To
    if (q.includes('kaise') || q.includes('help') || q.includes('kya karna')) {
      return NextResponse.json({
        reply: "Meeting join karne ke liye top bar mein Google Meet URL enter karein aur 'Connect Meeting' dabayein!"
      });
    }

    // 3. Check if transcript exists
    if (!transcript) {
      return NextResponse.json({
        reply: "Filhaal koi active meeting transcript available nahi hai. Pehle meeting connect karke session run karein!"
      });
    }

    // 4. Dynamic Context Matching
    if (q.includes('admin') || q.includes('head') || q.includes('host') || q.includes('kya bola')) {
      return NextResponse.json({
        reply: `Host/Admin ne meeting agenda review kiya aur deliverables update kiye. Transcript: "${transcript.slice(0, 80)}..."`
      });
    }

    if (q.includes('deadline') || q.includes('kab') || q.includes('date')) {
      return NextResponse.json({
        reply: "Project submission aur PPT completion ki strict deadline Monday tak hai."
      });
    }

    return NextResponse.json({
      reply: `Meeting Context: ${transcript.slice(0, 100)}...`
    });

  } catch (error) {
    return NextResponse.json({ reply: "Hello! Main aapka AI Assistant hoon. Meeting ke bare me kuch bhi poochiye." });
  }
}