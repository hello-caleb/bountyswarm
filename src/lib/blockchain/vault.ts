import { ethers } from 'ethers';

const VAULT_ABI = [
    "function distributePrize(address winner, uint256 amount, string calldata submissionHash, string calldata scoreHash) external",
    "function mneeToken() view returns (address)",
    "event PrizeDistributed(address indexed winner, uint256 amount, string submissionHash, string scoreHash)"
];

export class BountySwarmVault {
    private contract: ethers.Contract;

    constructor(vaultAddress: string, providerOrSigner: ethers.Provider | ethers.Signer) {
        this.contract = new ethers.Contract(vaultAddress, VAULT_ABI, providerOrSigner);
    }

    async distributePrize(
        winner: string,
        amount: string,
        submissionHash: string,
        scoreHash: string
    ): Promise<string> {
        try {
            if (!(this.contract.runner as ethers.Signer)?.sendTransaction) throw new Error("Read-only instance");

            // Assuming 18 decimals for MNEE (standard)
            const parsedAmount = ethers.parseUnits(amount, 18);

            const tx = await this.contract.distributePrize(winner, parsedAmount, submissionHash, scoreHash);
            return tx.hash;
        } catch (error) {
            console.error("Error distributing prize:", error);
            throw error;
        }
    }
}
