// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "../common/DefiParameters.sol";

contract StableCoin is ERC20, ERC20Burnable {
    DefiParameters private _defiParameters;
    string[] private _eligibleContractKeys;

    modifier onlyEligibleContract() {
        bool isFound_;

        for (uint256 i = 0; i < _eligibleContractKeys.length; ++i) {
            if (msg.sender == _defiParameters.getAddress(_eligibleContractKeys[i])) {
                isFound_ = true;
                break;
            }
        }

        require(isFound_, "StableCoin - not eligible contract");
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        address defiParameters_,
        string[] memory eligibleContracts_
    ) ERC20(name_, symbol_) {
        _eligibleContractKeys = eligibleContracts_;
        _defiParameters = DefiParameters(defiParameters_);
    }

    function mint(address recipient_, uint256 amount_) external onlyEligibleContract returns (bool) {
        _mint(recipient_, amount_);

        return true;
    }
}
