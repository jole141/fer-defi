// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "./interfaces/IStableCoin.sol";
import "./common/DefiParameters.sol";

contract SystemBalance {
    struct SystemBalanceDetails {
        bool isDebtAuctionPossible;
        bool isSurplusAuctionPossible;
        uint256 currentDebt;
        uint256 debtThreshold;
        uint256 currentSurplus;
        uint256 surplusThreshold;
    }

    DefiParameters private _defiParameters;
    string private _stc;

    uint256 internal _debt;

    /**
     * @notice Restricts callers only to saving contracts
     */
    modifier onlySaving() {
        require(
            msg.sender == _defiParameters.getAddress(string(abi.encodePacked(_stc, "_saving"))),
            "SystemBalance: Permission denied, only Saving contract has access."
        );
        _;
    }

    /**
     * @notice Restricts callers only to liquidation auction and saving contracts
     */
    modifier onlyLiquidationAuctionOrSaving() {
        bool isLiquidationAuction_ = (msg.sender ==
            _defiParameters.getAddress(string(abi.encodePacked(_stc, "_liquidationAuction"))));
        bool isSaving_ = (msg.sender == _defiParameters.getAddress(string(abi.encodePacked(_stc, "_saving"))));

        require(
            (isLiquidationAuction_ || isSaving_),
            "SystemBalance: Permission denied, only Saving and Liquidation auction have access."
        );
        _;
    }

    constructor(address defiParameters_, string memory stc_) {
        _defiParameters = DefiParameters(defiParameters_);
        _stc = stc_;
    }

    /**
     * @notice increasing debt
     * @return true if the debt increasing was successful
     */
    function increaseDebt(uint256 debtAmount_) external onlyLiquidationAuctionOrSaving returns (bool) {
        _debt += debtAmount_;

        return true;
    }

    /**
     * @notice Accrued interest amount transferring
     * @return true if the accrued interest amount transferring was successful
     */
    function transferAccruedInterestAmount(uint256 amount_) external onlySaving returns (bool) {
        return _transferToSystemContract(msg.sender, amount_);
    }

    /**
     * @notice perform netting: burn available surplus amount
     * @return true if the netting performing was successful
     */
    function performNetting() external returns (bool) {
        uint256 surplus_ = getSurplus();
        uint256 min_;

        if (surplus_ > _debt) {
            min_ = _debt;
        } else {
            min_ = surplus_;
        }

        if (min_ == 0) {
            return false;
        }

        _debt -= min_;

        IStableCoin(_getStableCoinAddress()).burn(min_);

        return true;
    }

    /**
     * @notice Returns debt
     * @return Debt
     */
    function getDebt() external view returns (uint256) {
        return _debt;
    }

    /**
     * @notice Returns balance in STC without debt
     * @return STC balance without debt
     */
    function getBalance() external view returns (int256) {
        unchecked {
            return int256(getSurplus() - _debt);
        }
    }

    /**
     * @notice Returns detailed information about the system balance
     * @return struct with system balance details
     */
    function getBalanceDetails() external view returns (SystemBalanceDetails memory) {
        SystemBalanceDetails memory balanceDetails_;
        balanceDetails_.currentDebt = _debt;
        balanceDetails_.currentSurplus = getSurplus();
        balanceDetails_.debtThreshold = _defiParameters.getUintParameter(
            string(abi.encodePacked(_stc, "_debtThreshold"))
        );
        balanceDetails_.surplusThreshold = _defiParameters.getUintParameter(
            string(abi.encodePacked(_stc, "_surplusThreshold"))
        );

        if (balanceDetails_.currentDebt >= balanceDetails_.currentSurplus) {
            uint256 debtAfterNetting_ = balanceDetails_.currentDebt - balanceDetails_.currentSurplus;
            balanceDetails_.isDebtAuctionPossible = debtAfterNetting_ > balanceDetails_.debtThreshold;
        } else {
            uint256 surplusAfterNetting_ = balanceDetails_.currentSurplus - balanceDetails_.currentDebt;
            uint256 lotSize_ = _defiParameters.getUintParameter(string(abi.encodePacked(_stc, "_surplusLot")));

            balanceDetails_.isSurplusAuctionPossible =
                surplusAfterNetting_ >= balanceDetails_.surplusThreshold &&
                surplusAfterNetting_ >= lotSize_;
        }

        return balanceDetails_;
    }

    /**
     * @notice Returns balance in STC
     * @return STC balance
     */
    function getSurplus() public view returns (uint256) {
        return IStableCoin(_getStableCoinAddress()).balanceOf(address(this));
    }

    function _transferToSystemContract(address recipient_, uint256 amount_) internal returns (bool) {
        return IStableCoin(_getStableCoinAddress()).transfer(recipient_, amount_);
    }

    function _getStableCoinAddress() internal view returns (address) {
        return _defiParameters.getAddress(_stc);
    }
}
