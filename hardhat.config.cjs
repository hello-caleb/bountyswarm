require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
    solidity: "0.8.20",
    networks: {
        // sepolia: {
        //     url: process.env.SEPOLIA_RPC_URL || "",
        //     accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        // },
    },
    typechain: {
        outDir: "typechain-types",
        target: "ethers-v6",
    },
};

module.exports = config;
