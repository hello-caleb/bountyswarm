// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockMNEE is ERC20 {
    constructor() ERC20("Mock MNEE", "mMNEE") {
        // Mint 1 million tokens to deployer for testing
        _mint(msg.sender, 1_000_000 * 10**18);
    }
    
    // Allow anyone to mint for testing purposes
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
