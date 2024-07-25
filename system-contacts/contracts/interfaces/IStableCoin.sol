// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

interface IStableCoin is IERC20Metadata {
    function mint(address recipient_, uint256 amount_) external returns (bool);

    function transferAndCall(address to_, uint256 value_, bytes memory data_) external returns (bool);

    function burn(uint256 amount_) external;

    function burnFrom(address account_, uint256 amount_) external;
}
