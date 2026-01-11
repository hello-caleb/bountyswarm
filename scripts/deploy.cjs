const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("=".repeat(60));
    console.log("BountySwarm Sepolia Deployment");
    console.log("=".repeat(60));
    console.log(`Deployer address: ${deployer.address}`);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log(`Deployer balance: ${hre.ethers.formatEther(balance)} ETH`);
    console.log("");

    // Deploy MockMNEE token
    console.log("1. Deploying MockMNEE token...");
    const MockMNEE = await hre.ethers.getContractFactory("MockMNEE");
    const mockMNEE = await MockMNEE.deploy();
    await mockMNEE.waitForDeployment();
    const mneeAddress = await mockMNEE.getAddress();
    console.log(`   MockMNEE deployed to: ${mneeAddress}`);

    // Deploy BountySwarmVault with deployer as initial agentSwarm
    console.log("2. Deploying BountySwarmVault...");
    const BountySwarmVault = await hre.ethers.getContractFactory("BountySwarmVault");
    const vault = await BountySwarmVault.deploy(mneeAddress, deployer.address);
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    console.log(`   BountySwarmVault deployed to: ${vaultAddress}`);

    // Fund the vault with test tokens (12,500 MNEE for the prize pool)
    console.log("3. Funding vault with 12,500 MNEE...");
    const prizeAmount = hre.ethers.parseUnits("12500", 18);
    const transferTx = await mockMNEE.transfer(vaultAddress, prizeAmount);
    await transferTx.wait();
    console.log(`   Vault funded with 12,500 MNEE`);

    // Verify vault balance
    const vaultBalance = await mockMNEE.balanceOf(vaultAddress);
    console.log(`   Vault balance: ${hre.ethers.formatUnits(vaultBalance, 18)} MNEE`);

    console.log("");
    console.log("=".repeat(60));
    console.log("DEPLOYMENT COMPLETE");
    console.log("=".repeat(60));
    console.log("");
    console.log("Contract Addresses (save these!):");
    console.log(`  MNEE_TOKEN_ADDRESS=${mneeAddress}`);
    console.log(`  VAULT_ADDRESS=${vaultAddress}`);
    console.log("");
    console.log("Next steps:");
    console.log("1. Add these addresses to your .env.local");
    console.log("2. Verify contracts on Etherscan:");
    console.log(`   npx hardhat verify --network sepolia ${mneeAddress}`);
    console.log(`   npx hardhat verify --network sepolia ${vaultAddress} ${mneeAddress} ${deployer.address}`);
    console.log("");
    console.log("Etherscan links:");
    console.log(`  MockMNEE: https://sepolia.etherscan.io/address/${mneeAddress}`);
    console.log(`  Vault: https://sepolia.etherscan.io/address/${vaultAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
