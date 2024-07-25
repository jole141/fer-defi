// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FerBTC is ERC20, Ownable {
    uint8 private _decimals;

    constructor(address initialOwner_) ERC20("Wrapped Fer Bitcoin", "FerBTC") Ownable(initialOwner_) {
        _decimals = 8;
        _mint(msg.sender, 1000 * 10 ** 8); // Mint 1000 WBTC
    }

    function mint(uint256 amount) public onlyOwner {
        _mint(owner(), amount);
    }

    function burn(uint256 amount) public onlyOwner {
        _burn(msg.sender, amount);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}
