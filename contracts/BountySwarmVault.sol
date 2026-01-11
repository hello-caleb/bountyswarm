// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract BountySwarmVault is Ownable, ReentrancyGuard {
    IERC20 public immutable mneeToken;
    address public agentSwarm;

    event PrizeDeposited(address indexed organizer, uint256 amount);
    event PrizeDistributed(address indexed winner, uint256 amount, string submissionHash, string scoreHash);
    event SwarmAddressUpdated(address indexed oldSwarm, address indexed newSwarm);

    error OnlyAgentSwarm();
    error ZeroAddress();
    error InsufficientBalance();

    constructor(address _mneeToken, address _agentSwarm) Ownable(msg.sender) {
        if (_mneeToken == address(0) || _agentSwarm == address(0)) revert ZeroAddress();
        mneeToken = IERC20(_mneeToken);
        agentSwarm = _agentSwarm;
    }

    modifier onlySwarm() {
        if (msg.sender != agentSwarm) revert OnlyAgentSwarm();
        _;
    }

    function setAgentSwarm(address _newSwarm) external onlyOwner {
        if (_newSwarm == address(0)) revert ZeroAddress();
        emit SwarmAddressUpdated(agentSwarm, _newSwarm);
        agentSwarm = _newSwarm;
    }

    // Agent Swarm triggers distribution after consensus
    function distributePrize(
        address winner, 
        uint256 amount, 
        string calldata submissionHash, 
        string calldata scoreHash
    ) external onlySwarm nonReentrant {
        if (winner == address(0)) revert ZeroAddress();
        
        uint256 balance = mneeToken.balanceOf(address(this));
        if (balance < amount) revert InsufficientBalance();

        require(mneeToken.transfer(winner, amount), "Transfer failed");
        
        emit PrizeDistributed(winner, amount, submissionHash, scoreHash);
    }

    // Allow organizers to fund the vault manually if needed via standard transfer
    // (Tokens must be sent to this contract address)
}
