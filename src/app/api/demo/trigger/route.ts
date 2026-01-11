import { NextResponse } from 'next/server';
import { runDemoScenario } from '@/lib/demo/demoManager';

export async function GET() {
    // Fire and forget - don't block response
    runDemoScenario().catch(console.error);

    return NextResponse.json({ status: 'STARTED', message: 'Demo scenario triggered' });
}
