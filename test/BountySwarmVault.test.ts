import pkg from "hardhat";
const { ethers } = pkg;
import { expect } from "chai";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import type { Contract } from "ethers";

describe("BountySwarmVault", function () {
    let vault: Contract;
    let token: Contract;
    let owner: HardhatEthersSigner;
    let agentSwarm: HardhatEthersSigner;
    let winner: HardhatEthersSigner;
    let stranger: HardhatEthersSigner;

    const PRIZE_AMOUNT = ethers.parseEther("1000");

    beforeEach(async function () {
        [owner, agentSwarm, winner, stranger] = await ethers.getSigners();

        // Deploy Mock Token
        const TokenFactory = await ethers.getContractFactory("MockMNEE");
        token = await TokenFactory.deploy(); // Minted to owner by default

        // Deploy Vault
        const VaultFactory = await ethers.getContractFactory("BountySwarmVault");
        vault = await VaultFactory.deploy(await token.getAddress(), agentSwarm.address);
    });

    describe("Deployment", function () {
        it("Should set the correct token and agent swarm addresses", async function () {
            expect(await vault.mneeToken()).to.equal(await token.getAddress());
            expect(await vault.agentSwarm()).to.equal(agentSwarm.address);
        });

        it("Should fail if initialized with zero addresses", async function () {
            const VaultFactory = await ethers.getContractFactory("BountySwarmVault");
            await expect(VaultFactory.deploy(ethers.ZeroAddress, agentSwarm.address))
                .to.be.revertedWithCustomError(vault, "ZeroAddress");
            await expect(VaultFactory.deploy(await token.getAddress(), ethers.ZeroAddress))
                .to.be.revertedWithCustomError(vault, "ZeroAddress");
        });
    });

    describe("Deposits", function () {
        it("Should allow depositing tokens via transfer", async function () {
            await token.transfer(await vault.getAddress(), PRIZE_AMOUNT);
            expect(await token.balanceOf(await vault.getAddress())).to.equal(PRIZE_AMOUNT);
        });
    });

    describe("Distribution", function () {
        beforeEach(async function () {
            // Fund the vault
            await token.transfer(await vault.getAddress(), PRIZE_AMOUNT);
        });

        it("Should allow agent swarm to distribute prize", async function () {
            const submissionHash = "QmHash123";
            const scoreHash = "QmScore456";

            await expect(vault.connect(agentSwarm).distributePrize(winner.address, PRIZE_AMOUNT, submissionHash, scoreHash))
                .to.emit(vault, "PrizeDistributed")
                .withArgs(winner.address, PRIZE_AMOUNT, submissionHash, scoreHash);

            expect(await token.balanceOf(winner.address)).to.equal(PRIZE_AMOUNT);
            expect(await token.balanceOf(await vault.getAddress())).to.equal(0);
        });

        it("Should revert if called by non-swarm address", async function () {
            await expect(vault.connect(owner).distributePrize(winner.address, PRIZE_AMOUNT, "", ""))
                .to.be.revertedWithCustomError(vault, "OnlyAgentSwarm");

            await expect(vault.connect(stranger).distributePrize(winner.address, PRIZE_AMOUNT, "", ""))
                .to.be.revertedWithCustomError(vault, "OnlyAgentSwarm");
        });

        it("Should revert if trying to distribute more than balance", async function () {
            const excessAmount = PRIZE_AMOUNT + ethers.parseEther("1");
            await expect(vault.connect(agentSwarm).distributePrize(winner.address, excessAmount, "", ""))
                .to.be.revertedWithCustomError(vault, "InsufficientBalance");
        });

        it("Should revert if winner is zero address", async function () {
            await expect(vault.connect(agentSwarm).distributePrize(ethers.ZeroAddress, PRIZE_AMOUNT, "", ""))
                .to.be.revertedWithCustomError(vault, "ZeroAddress");
        });
    });

    describe("Administration", function () {
        it("Should allow owner to update agent swarm address", async function () {
            const newSwarm = stranger.address;
            await expect(vault.connect(owner).setAgentSwarm(newSwarm))
                .to.emit(vault, "SwarmAddressUpdated")
                .withArgs(agentSwarm.address, newSwarm);

            expect(await vault.agentSwarm()).to.equal(newSwarm);
        });

        it("Should fail if non-owner tries to update swarm", async function () {
            await expect(vault.connect(stranger).setAgentSwarm(stranger.address))
                .to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
        });

        it("Should revert setting swarm to zero address", async function () {
            await expect(vault.connect(owner).setAgentSwarm(ethers.ZeroAddress))
                .to.be.revertedWithCustomError(vault, "ZeroAddress");
        });
    });
});
