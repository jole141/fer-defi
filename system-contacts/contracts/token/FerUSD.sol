// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Stable Coin
 * @notice Holds the logic for stable coin tokens
 */
contract FerUSD is ERC20, Ownable {
    /**
     * @notice Constructor for the FerUSD.sol contract
     */
    constructor(address initialOwner_) ERC20("Fer stablecoin USD", "FerUSD") Ownable(initialOwner_) {
        _mint(msg.sender, 1000000000000000000000); // Mint 1000 FerUSD
    }

    /**
     * @notice Mints new tokens
     * @param to_ Address to mint tokens to
     * @param amount_ Amount of tokens to mint
     */
    function mint(address to_, uint256 amount_) external onlyOwner returns (bool) {
        _mint(to_, amount_);
        return true;
    }

    /**
     * @notice Burns tokens
     * @param amount_ Amount of tokens to burn
     */
    function burn(uint256 amount_) external onlyOwner {
        _burn(msg.sender, amount_);
    }

    /**
     * @notice Burns tokens from a specific address
     * @param from_ Address to burn tokens from
     * @param amount_ Amount of tokens to burn
     */
    function burnFrom(address from_, uint256 amount_) external onlyOwner {
        _burn(from_, amount_);
    }
}
