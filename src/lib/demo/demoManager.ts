import { broadcastStatus } from '@/lib/sse/broadcaster';
import { ethers } from 'ethers';
import { VAULT_ADDRESS, SEPOLIA_RPC_URL, VAULT_ABI, ETHERSCAN_BASE } from '@/lib/blockchain/constants';

const SLEEP = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Demo prize recipient (defaults if not provided)
const DEFAULT_WINNER = "0x75d4Ab5bFB82e33594f12f47AFb11195B5812DA6";
const DEFAULT_AMOUNT = "100";
const DEMO_SUBMISSION_HASH = "ipfs://QmBountySwarm127";
const DEMO_SCORE_HASH = "ipfs://QmScore98of100";

interface DemoConfig {
    winnerAddress?: string;
    prizeAmount?: string;
}

export async function runDemoScenario(config: DemoConfig = {}) {
    const winnerAddress = config.winnerAddress || DEFAULT_WINNER;
    const prizeAmount = config.prizeAmount || DEFAULT_AMOUNT;

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

    // 5. Executor - REAL BLOCKCHAIN TRANSACTION
    await SLEEP(1000);
    broadcastStatus('Executor', 'THINKING', 'Initiating blockchain transaction...');

    try {
        // Execute real transaction on Sepolia
        const txHash = await executeDistributePrize(winnerAddress, prizeAmount);
        const shortHash = `${txHash.slice(0, 6)}...${txHash.slice(-4)}`;
        const etherscanLink = `${ETHERSCAN_BASE}/tx/${txHash}`;

        broadcastStatus('Executor', 'SUCCESS', `Tx Confirmed: ${shortHash}`, txHash);
        console.log(`[EXECUTOR] Real transaction confirmed: ${etherscanLink}`);

        return { success: true, txHash, etherscanLink };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        broadcastStatus('Executor', 'FAILED', `Transaction failed: ${errorMessage}`);
        console.error('[EXECUTOR] Transaction failed:', error);
        return { success: false, error: errorMessage };
    }
}

async function executeDistributePrize(winnerAddress: string, amountStr: string): Promise<string> {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('PRIVATE_KEY not configured');
    }

    // Create provider and signer
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const signer = new ethers.Wallet(privateKey, provider);

    console.log(`[EXECUTOR] Using wallet: ${signer.address}`);
    console.log(`[EXECUTOR] Vault address: ${VAULT_ADDRESS}`);

    // Create vault contract instance with signer
    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);

    // Parse amount (18 decimals)
    const parsedAmount = ethers.parseUnits(amountStr, 18);

    console.log(`[EXECUTOR] Distributing ${amountStr} MNEE to ${winnerAddress}`);

    // Execute the transaction
    const tx = await vault.distributePrize(
        winnerAddress,
        parsedAmount,
        DEMO_SUBMISSION_HASH,
        DEMO_SCORE_HASH
    );

    console.log(`[EXECUTOR] Transaction submitted: ${tx.hash}`);
    console.log(`[EXECUTOR] Waiting for confirmation...`);

    // Wait for 1 confirmation
    const receipt = await tx.wait(1);
    console.log(`[EXECUTOR] Transaction confirmed in block ${receipt.blockNumber}`);

    return tx.hash;
}
