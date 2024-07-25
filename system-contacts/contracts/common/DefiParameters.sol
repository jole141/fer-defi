// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract DefiParameters is Ownable {
    mapping(string => uint256) public uintParameters;
    mapping(string => address) public addressParameters;

    uint256 public uintParameterLength;
    string[] public uintParameterKeys;

    uint256 public addressParameterLength;
    string[] public addressParameterKeys;

    constructor(address initialOwner_) Ownable(initialOwner_) {}

    function setUintParameter(string memory key_, uint256 value_) external onlyOwner {
        if (uintParameters[key_] == 0) {
            uintParameterLength++;
            uintParameterKeys.push(key_);
        }
        uintParameters[key_] = value_;
    }

    function getUintParameter(string memory key_) external view returns (uint256) {
        return uintParameters[key_];
    }

    function setAddress(string memory key, address value) external onlyOwner {
        if (addressParameters[key] == address(0)) {
            addressParameterLength++;
            addressParameterKeys.push(key);
        }
        addressParameters[key] = value;
    }

    function getAddress(string memory key) external view returns (address) {
        return addressParameters[key];
    }

    function getAllUintParameters() external view returns (string[] memory keys, uint256[] memory values) {
        keys = new string[](uintParameterLength);
        values = new uint256[](uintParameterLength);

        for (uint256 i = 0; i < uintParameterLength; i++) {
            keys[i] = uintParameterKeys[i];
            values[i] = uintParameters[uintParameterKeys[i]];
        }
    }

    function getAllAddressParameters() external view returns (string[] memory keys, address[] memory values) {
        keys = new string[](addressParameterLength);
        values = new address[](addressParameterLength);

        for (uint256 i = 0; i < addressParameterLength; i++) {
            keys[i] = addressParameterKeys[i];
            values[i] = addressParameters[addressParameterKeys[i]];
        }
    }
}
