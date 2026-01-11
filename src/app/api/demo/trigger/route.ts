import { NextResponse } from 'next/server';
import { runDemoScenario } from '@/lib/demo/demoManager';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Fire and forget - don't block response
        runDemoScenario({
            winnerAddress: body.winnerAddress,
            prizeAmount: body.prizeAmount
        }).catch(console.error);

        return NextResponse.json({ status: 'STARTED', message: 'Demo scenario triggered' });
    } catch (error) {
        // Fallback if no body provided
        runDemoScenario().catch(console.error);
        return NextResponse.json({ status: 'STARTED', message: 'Demo scenario triggered (default)' });
    }
}
