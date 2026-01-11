import { ethers } from 'ethers';

// ABI for standard ERC20 functions we need
const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transfer(address to, uint256 amount) returns (bool)"
];

export class MneeToken {
    private contract: ethers.Contract;
    private provider: ethers.Provider;

    constructor(tokenAddress: string, providerOrSigner: ethers.Provider | ethers.Signer) {
        this.contract = new ethers.Contract(tokenAddress, ERC20_ABI, providerOrSigner);
        this.provider = (providerOrSigner as any).provider || providerOrSigner;
    }

    async getBalance(address: string): Promise<string> {
        try {
            const balance = await this.contract.balanceOf(address);
            const decimals = await this.contract.decimals();
            return ethers.formatUnits(balance, decimals);
        } catch (error) {
            console.error("Error fetching balance:", error);
            return "0.0";
        }
    }

    async approveVault(vaultAddress: string, amount: string): Promise<string> {
        try {
            // @ts-ignore - Check for signer
            if (!this.contract.runner?.sendTransaction) throw new Error("Read-only instance");

            const decimals = await this.contract.decimals();
            const tx = await this.contract.approve(vaultAddress, ethers.parseUnits(amount, decimals));
            return tx.hash;
        } catch (error) {
            console.error("Error approving vault:", error);
            throw error;
        }
    }
}
