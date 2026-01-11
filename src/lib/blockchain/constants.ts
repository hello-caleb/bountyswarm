// Sepolia Testnet Deployed Contracts
export const CHAIN_ID = 11155111; // Sepolia
export const SEPOLIA_RPC_URL = "https://sepolia.infura.io/v3/728b6a254b8c4415bf334990419f8399";

export const MNEE_ADDRESS = "0x3C545Eb4729c2eDC316b42685833e295F10B5959";
export const VAULT_ADDRESS = "0xd031160F9c8f3A695878b016e2A2208bfFB5da94";

export const MNEE_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
] as const;

export const VAULT_ABI = [
  "function distributePrize(address winner, uint256 amount, string calldata submissionHash, string calldata scoreHash) external",
  "function mneeToken() view returns (address)",
  "function agentSwarm() view returns (address)",
  "function owner() view returns (address)",
  "event PrizeDistributed(address indexed winner, uint256 amount, string submissionHash, string scoreHash)",
] as const;

// Etherscan links
export const ETHERSCAN_BASE = "https://sepolia.etherscan.io";
export const MNEE_ETHERSCAN = `${ETHERSCAN_BASE}/address/${MNEE_ADDRESS}`;
export const VAULT_ETHERSCAN = `${ETHERSCAN_BASE}/address/${VAULT_ADDRESS}`;
