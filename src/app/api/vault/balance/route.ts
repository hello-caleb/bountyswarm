import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { MNEE_ADDRESS, VAULT_ADDRESS, MNEE_ABI, SEPOLIA_RPC_URL, VAULT_ETHERSCAN, MNEE_ETHERSCAN } from '@/lib/blockchain/constants';

export async function GET() {
    try {
        const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
        const mneeContract = new ethers.Contract(MNEE_ADDRESS, MNEE_ABI, provider);

        const balance = await mneeContract.balanceOf(VAULT_ADDRESS);
        const decimals = await mneeContract.decimals();
        const formattedBalance = ethers.formatUnits(balance, decimals);

        return NextResponse.json({
            balance: formattedBalance,
            balanceRaw: balance.toString(),
            vaultAddress: VAULT_ADDRESS,
            mneeAddress: MNEE_ADDRESS,
            vaultEtherscan: VAULT_ETHERSCAN,
            mneeEtherscan: MNEE_ETHERSCAN,
            network: 'sepolia',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching vault balance:', error);
        return NextResponse.json(
            { error: 'Failed to fetch vault balance', details: String(error) },
            { status: 500 }
        );
    }
}
