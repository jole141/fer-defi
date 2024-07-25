// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "../interfaces/AgregatorV3Interface.sol";
import "../interfaces/IPriceFeed.sol";

contract BTCUSDDataFeed is IPriceFeed {
    AggregatorV3Interface internal priceFeed;

    constructor() {
        priceFeed = AggregatorV3Interface(0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43);
    }

    function getLatestPrice() public view returns (uint256) {
        (uint80 roundID, int price, uint startedAt, uint timeStamp, uint80 answeredInRound) = priceFeed
            .latestRoundData();
        return uint256(price) / 10 ** 8;
    }
}
