// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "./CompoundRateKeeper.sol";
import "./common/DefiParameters.sol";
import "./oracle/BTCUSDDataFeed.sol";
import "./common/FullMath.sol";
import "./interfaces/IStableCoin.sol";
import "./interfaces/IPriceFeed.sol";

contract BorrowingContract {
    using FullMath for uint256;

    // structs
    struct Vault {
        string colKey;
        uint256 colAsset;
        uint256 normalizedDebt;
        uint256 mintedAmount;
        bool isLiquidated;
        uint256 liquidationFullDebt;
    }

    struct VaultStats {
        ColStats colStats;
        StcStats stcStats;
    }

    struct ColStats {
        string key;
        uint256 balance;
        uint256 price;
        uint256 withdrawableAmount;
        uint256 liquidationPrice;
    }

    struct StcStats {
        string key;
        uint256 outstandingDebt;
        uint256 normalizedDebt;
        uint256 compoundRate;
        uint256 lastUpdateOfCompoundRate;
        uint256 borrowingLimit;
        uint256 availableToBorrow;
        uint256 liquidationLimit;
        uint256 borrowingFee;
    }

    struct AggregatedTotalsInfo {
        uint256 outstandingDebt;
        uint256 mintedAmount;
        uint256 owedBorrowingFees;
    }

    struct CalcValues {
        uint256 colPrice;
        uint256 colDecimals;
        uint256 collateralValue;
        uint256 stcAmount;
        uint256 stcDecimals;
    }

    // private
    DefiParameters private _defiParameters;
    string private _stc;

    string[] private _colKeys;
    mapping(string => bool) private _colKeyExist;

    // public
    mapping(address => mapping(uint256 => Vault)) public userVaults;
    mapping(address => uint256) public userVaultsCount;
    mapping(address => uint256) public totalStcBackedByCol;
    mapping(string => CompoundRateKeeper) public compoundRateKeeper;

    uint256 public aggregatedMintedAmount;
    mapping(string => uint256) public aggregatedNormalizedDebts;

    // events
    event VaultCreated(address indexed user, uint256 indexed vaultId, string colKey);
    event CollateralDeposited(address indexed user, uint256 indexed vaultId, uint256 amount);
    event StcGenerated(address indexed user, uint256 indexed vaultId, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 indexed vaultId, uint256 amount);
    event Liquidated(address indexed user, uint256 indexed vaultId);
    event StcRepaid(address indexed user, uint256 indexed vaultId, uint256 burnt, uint256 surplus);

    // modifiers
    modifier shouldExist(address user_, uint256 vaultId_) {
        _shouldExist(user_, vaultId_);
        _;
    }

    modifier onlyLiquidationAuction() {
        _onlyLiquidationAuction();
        _;
    }

    modifier onlyNotLiquidated(address user_, uint256 vaultId_) {
        _onlyNotLiquidated(user_, vaultId_);
        _;
    }

    constructor(address defiParameters_, string memory stc_) {
        _defiParameters = DefiParameters(defiParameters_);
        _stc = stc_;
    }

    function createVault(string memory colKey_) external returns (uint256) {
        require(_defiParameters.getAddress(colKey_) != address(0), "BorrowingContract: colKey not supported");

        if (address(compoundRateKeeper[colKey_]) == address(0)) {
            compoundRateKeeper[colKey_] = new CompoundRateKeeper(address(this));
        }

        uint256 id_ = userVaultsCount[msg.sender];

        userVaults[msg.sender][id_].colKey = colKey_;
        userVaultsCount[msg.sender] = id_ + 1;

        if (!_colKeyExist[colKey_]) {
            _colKeys.push(colKey_);
            _colKeyExist[colKey_] = true;
        }

        emit VaultCreated(msg.sender, id_, colKey_);

        return id_;
    }

    function depositCollateral(
        uint256 vaultId_,
        uint256 amount_
    ) external shouldExist(msg.sender, vaultId_) onlyNotLiquidated(msg.sender, vaultId_) returns (bool) {
        require(amount_ > 0, "BorrowingContract: amount should be greater than 0");

        string memory colKey_ = _getColKey(msg.sender, vaultId_);
        address collateral_ = _defiParameters.getAddress(colKey_);

        // transfer collateral from user to this contract
        uint256 colAmount_ = _pullCollateral(msg.sender, collateral_, amount_);

        userVaults[msg.sender][vaultId_].colAsset += colAmount_;

        emit CollateralDeposited(msg.sender, vaultId_, colAmount_);

        return true;
    }

    function generateStableCoin(
        uint256 vaultId_,
        uint256 amount_
    ) external shouldExist(msg.sender, vaultId_) onlyNotLiquidated(msg.sender, vaultId_) returns (bool) {
        Vault storage vault_ = userVaults[msg.sender][vaultId_];
        CompoundRateKeeper compoundRateKeeper_ = compoundRateKeeper[vault_.colKey];

        uint256 normalizedAmount_ = compoundRateKeeper_.normalizeAmount(amount_);
        amount_ = compoundRateKeeper_.denormalizeAmount(normalizedAmount_);

        string memory defiParametersPrefix_ = string(abi.encodePacked(vault_.colKey, "_", _stc));

        require(
            amount_ >=
                _defiParameters.getUintParameter(
                    string(abi.encodePacked(defiParametersPrefix_, "_stcAcceptableMinimum"))
                ),
            "BorrowingContract: amount should be greater than acceptable minimum"
        );

        // use {} to keep vars only inside block
        {
            address collateralTokenAddress_ = _defiParameters.getAddress(vault_.colKey);
            uint256 totalStcBackedByCol_ = totalStcBackedByCol[collateralTokenAddress_];

            require(
                totalStcBackedByCol_ + amount_ <=
                    _defiParameters.getUintParameter(string(abi.encodePacked(defiParametersPrefix_, "_stcCeiling"))),
                "BorrowingContract: stc ceiling reached"
            );

            totalStcBackedByCol[collateralTokenAddress_] = totalStcBackedByCol_ + amount_;
        }

        require(
            _getColRatio(msg.sender, vaultId_, vault_.colAsset, amount_) >=
                _defiParameters.getUintParameter(
                    string(abi.encodePacked(defiParametersPrefix_, "_collateralizationRatio"))
                ),
            "BorrowingContract: Not enough collateral."
        );

        vault_.normalizedDebt += normalizedAmount_;
        vault_.mintedAmount += amount_;
        userVaults[msg.sender][vaultId_] = vault_;

        aggregatedNormalizedDebts[vault_.colKey] += normalizedAmount_;
        aggregatedMintedAmount += amount_;

        require(
            IStableCoin(_defiParameters.getAddress(_stc)).mint(msg.sender, amount_),
            "BorrowingContract: Failed to mint stable coin"
        );

        emit StcGenerated(msg.sender, vaultId_, amount_);

        return true;
    }

    function withdrawCol(
        uint256 vaultId_,
        uint256 amount_
    ) external shouldExist(msg.sender, vaultId_) onlyNotLiquidated(msg.sender, vaultId_) returns (bool) {
        require(
            userVaults[msg.sender][vaultId_].colAsset >= amount_,
            "BorrowingContract: amount should be less than or equal to the collateral amount"
        );

        userVaults[msg.sender][vaultId_].colAsset -= amount_;

        string memory colKey_ = _getColKey(msg.sender, vaultId_);
        require(
            getCurrentColRatio(msg.sender, vaultId_) >=
                _defiParameters.getUintParameter(
                    string(abi.encodePacked(colKey_, "_", _stc, "_collateralizationRatio"))
                ),
            "BorrowingContract: Withdrawal is not allowed, because the collateralization ratio is too low."
        );

        address collateralTokenAddress_ = _defiParameters.getAddress(colKey_);
        require(
            IERC20(collateralTokenAddress_).transfer(msg.sender, amount_),
            "BorrowingContract: colateral transfer failed"
        );

        emit CollateralWithdrawn(msg.sender, vaultId_, amount_);

        return true;
    }

    function getLiquidationRatio(address user_, uint256 vaultId_) external view returns (uint256) {
        return
            _defiParameters.getUintParameter(
                string(abi.encodePacked(_getColKey(user_, vaultId_), "_", _stc, "_liquidationRatio"))
            );
    }

    function liquidate(
        address user_,
        uint256 vaultId_
    ) external shouldExist(user_, vaultId_) onlyNotLiquidated(user_, vaultId_) returns (bool) {
        Vault memory vault_ = userVaults[user_][vaultId_];
        require(
            getCurrentColRatio(user_, vaultId_) <=
                _defiParameters.getUintParameter(
                    string(abi.encodePacked(_getColKey(user_, vaultId_), "_", _stc, "_liquidationRatio"))
                ),
            "BorrowingContract: Vault is above liquidation ratio."
        );

        vault_.isLiquidated = true;
        vault_.liquidationFullDebt = getFullDebt(user_, vaultId_);
        userVaults[user_][vaultId_] = vault_;

        emit Liquidated(user_, vaultId_);

        return true;
    }

    function updateCompoundRate(string memory colKey_) external returns (uint256) {
        if (address(compoundRateKeeper[colKey_]) == address(0)) {
            require(_defiParameters.getAddress(colKey_) != address(0), "BorrowingContract: colKey not supported");

            compoundRateKeeper[colKey_] = new CompoundRateKeeper(address(this));
        }

        uint256 interestRate_ = _defiParameters.getUintParameter(
            string(abi.encodePacked(colKey_, "_", _stc, "_interestRate"))
        );

        return compoundRateKeeper[colKey_].update(interestRate_);
    }

    function payBackStc(uint256 vaultId_, uint256 amount_) external shouldExist(msg.sender, vaultId_) {
        _payBackStc(vaultId_, amount_);
    }

    function clearVault(
        address user_,
        uint256 vaultId_,
        uint256 amountToClear_,
        address beneficiary_
    ) external onlyLiquidationAuction shouldExist(user_, vaultId_) {
        IERC20 collateralToken = IERC20(_defiParameters.getAddress(_getColKey(user_, vaultId_)));

        uint256 invariantBalance_ = collateralToken.balanceOf(address(this)) - userVaults[user_][vaultId_].colAsset;
        require(
            collateralToken.transfer(beneficiary_, userVaults[user_][vaultId_].colAsset),
            "Borrowing: Transfer of the collateral asset failed."
        );

        assert(invariantBalance_ == collateralToken.balanceOf(address(this)));

        _clearVault(user_, vaultId_, amountToClear_);
    }

    function getWithdrawableAmount(
        address user_,
        uint256 vaultId_
    ) external view shouldExist(user_, vaultId_) returns (uint256) {
        Vault memory vault_ = userVaults[user_][vaultId_];
        uint256 minColBalance_ = (getFullDebt(user_, vaultId_) * getCurrentColRatio(user_, vaultId_)) / getDecimal();

        if (
            getCurrentColRatio(user_, vaultId_) <
            _defiParameters.getUintParameter(
                string(abi.encodePacked(_getColKey(user_, vaultId_), "_", _stc, "_collateralizationRatio"))
            )
        ) {
            // can happen because of integer truncation of _minColBalance
            minColBalance_++;
        }

        if (vault_.colAsset > minColBalance_) {
            return vault_.colAsset - minColBalance_;
        }

        return 0;
    }

    function getVaultStats(
        address user_,
        uint256 vaultId_
    ) external view shouldExist(user_, vaultId_) returns (VaultStats memory) {
        VaultStats memory stats_;
        Vault memory vault_ = userVaults[user_][vaultId_];
        address oracleAddress_ = _defiParameters.getAddress(
            string(abi.encodePacked(vault_.colKey, "_", _stc, "_oracle"))
        );
        IPriceFeed feed_ = IPriceFeed(oracleAddress_);

        stats_.colStats.key = vault_.colKey;

        stats_.colStats.price =
            feed_.getLatestPrice() *
            (10 ** IStableCoin(_defiParameters.getAddress(_stc)).decimals());

        stats_.colStats.balance = vault_.colAsset;

        uint256 decimal_ = getDecimal();
        uint256 colDecimal_ = 10 ** IERC20Metadata(_defiParameters.getAddress(vault_.colKey)).decimals();
        uint256 minColRatio_ = getCurrentColRatio(user_, vaultId_);

        uint256 fullDebt_ = getFullDebt(user_, vaultId_);

        if (fullDebt_ == 0) {
            stats_.colStats.withdrawableAmount = stats_.colStats.balance;
        } else if (stats_.colStats.price > 0) {
            uint256 minColBalance_ = (fullDebt_ * minColRatio_ * colDecimal_) / stats_.colStats.price / decimal_;

            if (_getColRatio(user_, vaultId_, minColBalance_, 0) < minColRatio_) {
                // can happen because of integer truncation of _minColBalance
                minColBalance_++;
            }

            if (stats_.colStats.balance > minColBalance_) {
                stats_.colStats.withdrawableAmount = stats_.colStats.balance - minColBalance_;
            }
        }

        uint256 liquidationRatio_ = _defiParameters.getUintParameter(
            string(abi.encodePacked(vault_.colKey, "_", _stc, "liquidationRatio"))
        );

        if (vault_.colAsset != 0) {
            stats_.colStats.liquidationPrice =
                (liquidationRatio_ * fullDebt_ * colDecimal_) /
                decimal_ /
                vault_.colAsset;
        } else {
            stats_.colStats.liquidationPrice = type(uint256).max;
        }

        // STC
        stats_.stcStats.key = _stc;
        stats_.stcStats.outstandingDebt = fullDebt_;
        stats_.stcStats.normalizedDebt = vault_.normalizedDebt;
        stats_.stcStats.borrowingFee = _defiParameters.getUintParameter(
            string(abi.encodePacked(vault_.colKey, "_", _stc, "_interestRate"))
        );
        stats_.stcStats.borrowingLimit =
            (vault_.colAsset * stats_.colStats.price * decimal_) /
            minColRatio_ /
            colDecimal_;

        if (stats_.stcStats.borrowingLimit > fullDebt_) {
            stats_.stcStats.availableToBorrow = stats_.stcStats.borrowingLimit - stats_.stcStats.outstandingDebt;
        }

        CompoundRateKeeper compoundRateKeeper_ = compoundRateKeeper[vault_.colKey];

        stats_.stcStats.compoundRate = compoundRateKeeper_.getCurrentRate();
        stats_.stcStats.lastUpdateOfCompoundRate = compoundRateKeeper_.getLastUpdate();

        stats_.stcStats.liquidationLimit =
            (vault_.colAsset * stats_.colStats.price * decimal_) /
            liquidationRatio_ /
            colDecimal_;

        return stats_;
    }

    function getAggregatedTotals() external view returns (AggregatedTotalsInfo memory) {
        AggregatedTotalsInfo memory totalsInfo_;
        string[] memory colKeys_ = _colKeys;

        for (uint256 i = 0; i < colKeys_.length; i++) {
            string memory colKey_ = colKeys_[i];

            uint256 colOutstandingDebt_ = compoundRateKeeper[colKey_].denormalizeAmount(
                aggregatedNormalizedDebts[colKey_]
            );

            totalsInfo_.outstandingDebt = totalsInfo_.outstandingDebt + colOutstandingDebt_;
        }

        totalsInfo_.mintedAmount = aggregatedMintedAmount;
        totalsInfo_.owedBorrowingFees = totalsInfo_.outstandingDebt - totalsInfo_.mintedAmount;

        return totalsInfo_;
    }

    function getCurrentColRatio(
        address user_,
        uint256 vaultId_
    ) public view shouldExist(user_, vaultId_) returns (uint256) {
        return _getColRatio(user_, vaultId_, userVaults[user_][vaultId_].colAsset, 0);
    }

    function getCompoundRateUpdateTimestamp(string memory colKey_) public view returns (uint256) {
        return compoundRateKeeper[colKey_].getLastUpdate();
    }

    function getFullDebt(address user_, uint256 vaultId_) public view shouldExist(user_, vaultId_) returns (uint256) {
        Vault storage vault_ = userVaults[user_][vaultId_];

        return compoundRateKeeper[vault_.colKey].denormalizeAmount(vault_.normalizedDebt);
    }

    function _payBackStc(uint256 vaultId_, uint256 amount_) private onlyNotLiquidated(msg.sender, vaultId_) {
        require(amount_ != 0, "BorrowingContract: amount should be greater than 0");

        uint256 currentFullDebt_ = getFullDebt(msg.sender, vaultId_);

        if (amount_ > currentFullDebt_) {
            amount_ = currentFullDebt_;
        }

        uint256 burnAmount_;
        uint256 actualSurplus_ = amount_;

        // distribute payback amount between surplus (accrued interest)
        // and minted amount (should be burnt)
        Vault storage vault_ = userVaults[msg.sender][vaultId_];

        uint256 accruedInterest_ = currentFullDebt_ - vault_.mintedAmount;

        if (amount_ > accruedInterest_) {
            burnAmount_ = amount_ - accruedInterest_;
            actualSurplus_ = accruedInterest_;
        }

        CompoundRateKeeper compoundRateKeeper_ = compoundRateKeeper[vault_.colKey];

        uint256 canceledDebtAmount_;

        if (amount_ == currentFullDebt_) {
            canceledDebtAmount_ = vault_.normalizedDebt;
        } else {
            canceledDebtAmount_ = compoundRateKeeper_.normalizeAmount(amount_);

            // trying to compensate - potential rounding issue
            uint256 debtLookAhead_ = compoundRateKeeper_.denormalizeAmount(vault_.normalizedDebt - canceledDebtAmount_);
            uint256 mintedLookAhead_ = vault_.mintedAmount - burnAmount_;

            if (debtLookAhead_ < mintedLookAhead_) {
                canceledDebtAmount_ -= 1;
            }
        }

        vault_.normalizedDebt -= canceledDebtAmount_;
        vault_.mintedAmount -= burnAmount_;

        aggregatedNormalizedDebts[vault_.colKey] -= canceledDebtAmount_;
        aggregatedMintedAmount -= burnAmount_;

        IStableCoin stcContract_ = IStableCoin(_defiParameters.getAddress(_stc));

        stcContract_.transferFrom(msg.sender, _getSystemBalanceAddress(), actualSurplus_);

        if (burnAmount_ > 0) {
            stcContract_.burnFrom(msg.sender, burnAmount_);

            address colAddress = _defiParameters.getAddress(vault_.colKey);

            totalStcBackedByCol[colAddress] -= burnAmount_;
        }

        emit StcRepaid(msg.sender, vaultId_, burnAmount_, actualSurplus_);
    }

    function _clearVault(address user_, uint256 vaultId_, uint256 amount_) private {
        Vault memory vault_ = userVaults[user_][vaultId_];

        uint256 accruedInterest_ = vault_.liquidationFullDebt - vault_.mintedAmount;
        uint256 actualSurplus_ = accruedInterest_;
        uint256 burnAmount_ = vault_.mintedAmount;

        if (amount_ < vault_.mintedAmount) {
            actualSurplus_ = 0;
            burnAmount_ = amount_;
        } else if (amount_ < vault_.liquidationFullDebt) {
            actualSurplus_ = amount_ - vault_.mintedAmount;
        }

        IStableCoin stcContract_ = IStableCoin(_defiParameters.getAddress(_stc));

        if (actualSurplus_ > 0) {
            stcContract_.transferFrom(msg.sender, _getSystemBalanceAddress(), actualSurplus_);
        }

        // decreasing the total number of STC backed by COL
        address colTokenAddress_ = _defiParameters.getAddress(vault_.colKey);

        totalStcBackedByCol[colTokenAddress_] -= vault_.mintedAmount;

        stcContract_.burnFrom(msg.sender, burnAmount_);

        aggregatedMintedAmount -= vault_.mintedAmount;
        aggregatedNormalizedDebts[vault_.colKey] -= vault_.normalizedDebt;

        delete userVaults[user_][vaultId_].colAsset;
        delete userVaults[user_][vaultId_].normalizedDebt;
        delete userVaults[user_][vaultId_].mintedAmount;
    }

    function _pullCollateral(address user_, address collateralAddress_, uint256 amount_) private returns (uint256) {
        IERC20 collateral_ = IERC20(collateralAddress_);
        uint256 initialBalance_ = collateral_.balanceOf(address(this));

        require(collateral_.transferFrom(user_, address(this), amount_), "BorrowingContract: transferFrom failed");

        return collateral_.balanceOf(address(this)) - initialBalance_;
    }

    function _getColKey(address user, uint256 vaultId_) private view returns (string memory) {
        return userVaults[user][vaultId_].colKey;
    }

    function _onlyLiquidationAuction() private view {
        require(
            msg.sender == _defiParameters.getAddress(string(abi.encodePacked(_stc, "_liquidationAuction"))),
            "BorrowingContract: Permission denied, only LiquidationAuction contract has access."
        );
    }

    function _onlyNotLiquidated(address user_, uint256 vaultId_) private view {
        require(!userVaults[user_][vaultId_].isLiquidated, "BorrowingContract: The vault is liquidated.");
    }

    function _shouldExist(address user_, uint256 vaultId_) private view {
        require(userVaultsCount[user_] > vaultId_, "BorrowingContract: The vault does not exist.");
    }

    function _getSystemBalanceAddress() internal view returns (address) {
        return _defiParameters.getAddress(string(abi.encodePacked(_stc, "_systemBalance")));
    }

    function _getColRatio(
        address user_,
        uint256 vaultId_,
        uint256 colAsset_,
        uint256 additionalStc_
    ) private view returns (uint256) {
        CalcValues memory calcValues_;
        calcValues_.stcAmount = getFullDebt(user_, vaultId_) + additionalStc_;

        if (calcValues_.stcAmount == 0) {
            return type(uint256).max;
        }

        address oracleAddress_ = _defiParameters.getAddress(
            string(abi.encodePacked(_getColKey(user_, vaultId_), "_", _stc, "_oracle"))
        );

        require(oracleAddress_ != address(0), "BorrowingContract: data feed not found");

        uint256 exchangeRate_ = IPriceFeed(oracleAddress_).getLatestPrice();

        calcValues_.stcDecimals = IStableCoin(_defiParameters.getAddress(_stc)).decimals();
        calcValues_.colPrice = exchangeRate_ * (10 ** calcValues_.stcDecimals);
        calcValues_.colDecimals = IERC20Metadata(_defiParameters.getAddress(_getColKey(user_, vaultId_))).decimals();

        return
            (calcValues_.colPrice).mulDiv(getDecimal(), 10 ** calcValues_.colDecimals).mulDiv(
                colAsset_,
                calcValues_.stcAmount
            );
    }
}
