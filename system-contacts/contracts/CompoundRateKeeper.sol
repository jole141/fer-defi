// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./common/Utils.sol";
import "./libs/math/DSMath.sol";

contract CompoundRateKeeper is Ownable {
    struct CompoundRate {
        uint256 rate;
        uint256 lastUpdate;
    }

    CompoundRate public compoundRate;

    constructor(address initialOwner_) Ownable(initialOwner_) {
        compoundRate.rate = getInitialCompoundRate();
        compoundRate.lastUpdate = block.timestamp;
    }

    function update(uint256 interestRate_) external onlyOwner returns (uint256) {
        if (block.timestamp <= compoundRate.lastUpdate) return compoundRate.rate;

        uint256 decimal_ = getDecimal();
        uint256 period_ = block.timestamp - compoundRate.lastUpdate;
        uint256 newRate_ = (compoundRate.rate * DSMath.rpow(interestRate_ + decimal_, period_, decimal_)) / decimal_;

        compoundRate.lastUpdate = block.timestamp;
        compoundRate.rate = newRate_;

        return newRate_;
    }

    function getCurrentRate() external view returns (uint256) {
        return compoundRate.rate;
    }

    function getLastUpdate() external view returns (uint256) {
        return compoundRate.lastUpdate;
    }

    function normalizeAmount(uint256 amount_) external view returns (uint256) {
        uint256 normalizedAmount_ = (amount_ * getDecimal()) / compoundRate.rate;
        uint256 actualLookAhead_ = denormalizeAmount(normalizedAmount_);

        return normalizedAmount_;
    }

    function denormalizeAmount(uint256 amount_) public view returns (uint256) {
        return (amount_ * compoundRate.rate) / getDecimal();
    }
}
