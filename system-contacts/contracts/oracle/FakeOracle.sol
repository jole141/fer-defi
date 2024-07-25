// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "../interfaces/IPriceFeed.sol";

contract FakeOracle is IPriceFeed {
    uint private _price;

    constructor(uint price_) {
        _price = price_;
    }

    function getLatestPrice() public view returns (uint256) {
        return _price;
    }

    function setPrice(uint price_) public {
        _price = price_;
    }
}
