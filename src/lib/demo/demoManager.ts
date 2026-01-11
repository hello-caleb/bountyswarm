import { broadcastStatus } from '@/app/api/agents/status/route';

const SLEEP = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function runDemoScenario() {
    // 1. Scout
    broadcastStatus('Scout', 'THINKING', 'Scanning submission channels...');
    await SLEEP(2000);
    broadcastStatus('Scout', 'SUCCESS', 'Found candidate: BountySwarm (Submission #127)');

    // 2. Analyst
    await SLEEP(1000);
    broadcastStatus('Analyst', 'THINKING', 'Calculating final score...');
    await SLEEP(2500);
    broadcastStatus('Analyst', 'SUCCESS', 'Score: 98/100. Category: TRACK_WINNER');

    // 3. Auditor
    await SLEEP(1000);
    broadcastStatus('Auditor', 'THINKING', 'Verifying location and eligibility...');
    await SLEEP(2000);
    broadcastStatus('Auditor', 'SUCCESS', 'Eligibility verified. No sanctions found.');

    // 4. Compliance
    await SLEEP(1000);
    broadcastStatus('Compliance', 'THINKING', 'Checking tax forms (W-8BEN)...');
    await SLEEP(2000);
    broadcastStatus('Compliance', 'SUCCESS', 'Tax forms valid. Banking confirmed.');

    // 5. Executor
    await SLEEP(1000);
    broadcastStatus('Executor', 'THINKING', 'Initiating blockchain transaction...');
    await SLEEP(3000);
    broadcastStatus('Executor', 'SUCCESS', 'Tx Confirmed: 0x7f...3a9c');

    return true;
}
