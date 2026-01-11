// Simple event emitter pattern for SSE
let clients: ReadableStreamDefaultController[] = [];

export function addClient(controller: ReadableStreamDefaultController) {
    clients.push(controller);
}

export function removeClient(controller: ReadableStreamDefaultController) {
    clients = clients.filter(c => c !== controller);
}

// Helper to broadcast status updates to all connected clients
export function broadcastStatus(agent: string, status: string, message: string, txHash?: string) {
    const payload = JSON.stringify({
        type: 'UPDATE',
        agent,
        status,
        message,
        txHash,
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
