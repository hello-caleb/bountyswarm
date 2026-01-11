import { NextRequest, NextResponse } from 'next/server';

// Simple event emitter pattern for SSE
let clients: ReadableStreamDefaultController[] = [];

export async function GET(req: NextRequest) {
    const stream = new ReadableStream({
        start(controller) {
            clients.push(controller);

            // Send initial connection message
            const initialMessage = `data: ${JSON.stringify({ type: 'CONNECTED', message: 'Stream connected' })}\n\n`;
            controller.enqueue(new TextEncoder().encode(initialMessage));

            req.signal.addEventListener('abort', () => {
                clients = clients.filter(c => c !== controller);
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

// Helper to broadcast status updates to all connected clients
export function broadcastStatus(agent: string, status: string, message: string) {
    const payload = JSON.stringify({
        type: 'UPDATE',
        agent,
        status,
        message,
        timestamp: Date.now()
    });

    const data = `data: ${payload}\n\n`;
    const encoder = new TextEncoder();

    clients.forEach(client => {
        try {
            client.enqueue(encoder.encode(data));
        } catch (err) {
            console.error('Error sending to client', err);
        }
    });
}
