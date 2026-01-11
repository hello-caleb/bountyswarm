import { NextRequest, NextResponse } from 'next/server';
import { addClient, removeClient } from '@/lib/sse/broadcaster';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const stream = new ReadableStream({
        start(controller) {
            addClient(controller);

            // Send initial connection message
            const initialMessage = `data: ${JSON.stringify({ type: 'CONNECTED', message: 'Stream connected' })}\n\n`;
            controller.enqueue(new TextEncoder().encode(initialMessage));

            req.signal.addEventListener('abort', () => {
                removeClient(controller);
            });
        }
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
