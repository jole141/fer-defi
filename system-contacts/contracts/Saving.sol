// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "./SystemBalance.sol";
import "./BorrowingContract.sol";
import "./CompoundRateKeeper.sol";

import "./interfaces/IStableCoin.sol";

/**
 * @title Saving
 * @notice Used to earn interest on holdings by STC holders
 */
contract Saving {
    struct BalanceDetails {
        uint256 currentBalance;
        uint256 normalizedBalance;
        uint256 compoundRate;
        uint256 lastUpdateOfCompoundRate;
        uint256 interestRate;
    }

    DefiParameters internal _defiParameters;
    string internal _stc;

    CompoundRateKeeper public compoundRateKeeper;
    uint256 public aggregatedNormalizedCapital;

    mapping(address => uint256) public normalizedCapitals;

    event UserDeposited(address indexed user, uint256 depositAmount);
    event UserWithdrawn(address indexed user, uint256 withdrawAmount);

    constructor(address defiParameters_, string memory stc_) {
        _defiParameters = DefiParameters(defiParameters_);
        _stc = stc_;

        compoundRateKeeper = new CompoundRateKeeper(address(this));
    }

    /**
     * @notice Deposits STC to saving balance of the user
     * @param amount_ The amount of STC the user wants to deposit
     * @return true if everything went well
     */
    function deposit(uint256 amount_) external returns (bool) {
        require(amount_ > 0, "Saving: Deposit amount must be greater than 0.");

        _getStableCoin().transferFrom(msg.sender, address(this), amount_);

        uint256 newNormalizedCapital_ = compoundRateKeeper.normalizeAmount(getBalance(msg.sender) + amount_);

        aggregatedNormalizedCapital =
            aggregatedNormalizedCapital +
            (newNormalizedCapital_ - normalizedCapitals[msg.sender]);

        normalizedCapitals[msg.sender] = newNormalizedCapital_;

        emit UserDeposited(msg.sender, amount_);

        _checkBalance();

        return true;
    }

    /**
     * @notice Withdraws STC from the saving balance of the user
     * @param amount_ The amount of STC the user wants to withdraw
     * @return true if everything went well
     */
    function withdraw(uint256 amount_) external returns (bool) {
        uint256 userBalance_ = getBalance(msg.sender);

        require(userBalance_ != 0, "Saving: The caller does not have any balance to withdraw.");

        uint256 withdrawAmount_ = amount_;

        if (userBalance_ < withdrawAmount_) {
            withdrawAmount_ = userBalance_;
        }

        uint256 newNormalizedCapital_ = compoundRateKeeper.normalizeAmount(userBalance_ - withdrawAmount_);

        aggregatedNormalizedCapital =
            aggregatedNormalizedCapital -
            (normalizedCapitals[msg.sender] - newNormalizedCapital_);

        normalizedCapitals[msg.sender] = newNormalizedCapital_;

        _getStableCoin().transfer(msg.sender, withdrawAmount_);

        emit UserWithdrawn(msg.sender, withdrawAmount_);

        _checkBalance();

        return true;
    }

    /**
     * @notice Calculates and updates the compound rate
     * @return New compound rate
     */
    function updateCompoundRate() external returns (uint256) {
        CompoundRateKeeper compoundRateKeeper_ = compoundRateKeeper;
        string memory stc_ = _stc;

        uint256 savingRate_ = _defiParameters.getUintParameter(string(abi.encodePacked(stc_, "_savingRate")));

        uint256 oldAggregatedDenormalizedCapital_ = compoundRateKeeper_.denormalizeAmount(aggregatedNormalizedCapital);
        uint256 newRate_ = compoundRateKeeper_.update(savingRate_);
        uint256 newAggregatedDenormalizedCapital_ = compoundRateKeeper_.denormalizeAmount(aggregatedNormalizedCapital);

        SystemBalance systemBalance_ = SystemBalance(
            _defiParameters.getAddress(string(abi.encodePacked(stc_, "_systemBalance")))
        );

        uint256 surplus_ = systemBalance_.getSurplus();
        uint256 accruedSavings_ = newAggregatedDenormalizedCapital_ - oldAggregatedDenormalizedCapital_;

        if (surplus_ < accruedSavings_) {
            BorrowingContract.AggregatedTotalsInfo memory totalsInfo_ = BorrowingContract(
                _defiParameters.getAddress(string(abi.encodePacked(stc_, "_borrowing")))
            ).getAggregatedTotals();

            uint256 missingAmount_ = accruedSavings_ - surplus_;

            require(
                systemBalance_.getDebt() + missingAmount_ <= totalsInfo_.owedBorrowingFees,
                "Saving: System debt exceeds owed borrowing fees, failed to update compound rate."
            );

            _getStableCoin().mint(address(systemBalance_), missingAmount_);

            systemBalance_.increaseDebt(missingAmount_);
        }

        systemBalance_.transferAccruedInterestAmount(accruedSavings_);

        _checkBalance();

        return newRate_;
    }

    /**
     * @notice Returns detailed information about the user's balance
     * @return BalanceDetails struct
     */
    function getBalanceDetails(address user_) external view returns (BalanceDetails memory) {
        BalanceDetails memory balanceDetails_;
        CompoundRateKeeper compoundRateKeeper_ = compoundRateKeeper;

        balanceDetails_.compoundRate = compoundRateKeeper_.getCurrentRate();
        balanceDetails_.lastUpdateOfCompoundRate = compoundRateKeeper_.getLastUpdate();
        balanceDetails_.currentBalance = getBalance(user_);
        balanceDetails_.normalizedBalance = normalizedCapitals[user_];
        balanceDetails_.interestRate = _defiParameters.getUintParameter(string(abi.encodePacked(_stc, "_savingRate")));

        return balanceDetails_;
    }

    /**
     * @notice Returns the saving balance of the user
     * @return Amount of the user balance
     */
    function getBalance(address user_) public view returns (uint256) {
        return compoundRateKeeper.denormalizeAmount(normalizedCapitals[user_]);
    }

    function _checkBalance() private view {
        uint256 aggregatedDenormalizedCapital_ = compoundRateKeeper.denormalizeAmount(aggregatedNormalizedCapital);
        uint256 balance_ = _getStableCoin().balanceOf(address(this));

        assert(balance_ >= aggregatedDenormalizedCapital_);
    }

    function _getStableCoin() private view returns (IStableCoin) {
        return IStableCoin(_defiParameters.getAddress(_stc));
    }
}
