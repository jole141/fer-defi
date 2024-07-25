// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "./BorrowingContract.sol";
import "./SystemBalance.sol";

/**
 * @notice Manages the auctioning of collateral assets in case of borrowing vault liquidation.
 * The contract is tied to one synthetic asset (a.k.a stable coin).
 * Users bid an amount of the synthetic asset to win the collateral asset from the liquidated vault.
 * Liquidation auctions are identified by the same combination of user and vault ID as the liquidated vault.
 */
contract LiquidationAuction {
    enum AuctionStatus {
        NONE,
        ACTIVE,
        CLOSED
    }

    struct AuctionInfo {
        AuctionStatus status;
        address bidder;
        uint256 highestBid;
        uint256 endTime;
    }

    struct DefiContracts {
        BorrowingContract borrowingContract;
        SystemBalance systemBalance;
    }

    mapping(address => mapping(uint256 => AuctionInfo)) public auctions;

    DefiParameters private _defiParameters;
    string private _stc;

    event AuctionStarted(address indexed user, uint256 vaultId, address indexed bidder, uint256 bid);
    event Bid(address indexed user, uint256 indexed vaultId, address indexed bidder, uint256 bid);
    event Executed(address indexed user, uint256 vaultId, AuctionInfo info);

    constructor(address defiParameters_, string memory stc_) {
        _defiParameters = DefiParameters(defiParameters_);
        _stc = stc_;
    }

    /**
     * @notice Starts an auction.
     * @param user_ The owner of the liquidated vault
     * @param vaultId_ The user specific vault id of the liquidated vault
     * @param bid_ The initial bid.
     */
    function startAuction(address user_, uint256 vaultId_, uint256 bid_) external returns (bool) {
        BorrowingContract borrowingContract_ = BorrowingContract(
            _defiParameters.getAddress(string(abi.encodePacked(_stc, "_borrowing")))
        );

        (, , , , bool isLiquidated_, ) = borrowingContract_.userVaults(user_, vaultId_);

        AuctionInfo memory auction_ = auctions[user_][vaultId_];

        require(
            auction_.status == AuctionStatus.NONE,
            "LiquidationAuction: Auction for this borrowing vault has already been started."
        );

        if (!isLiquidated_) {
            borrowingContract_.liquidate(user_, vaultId_);
        }

        _getStableCoin().transferFrom(msg.sender, address(this), bid_);

        auction_.status = AuctionStatus.ACTIVE;
        auction_.bidder = msg.sender;
        auction_.highestBid = bid_;
        auction_.endTime = block.timestamp + _defiParameters.getUintParameter("liquidationAuctionPeriod");
        auctions[user_][vaultId_] = auction_;

        emit AuctionStarted(user_, vaultId_, msg.sender, bid_);

        return true;
    }

    /**
     * @notice Places a bid for the given auction.
     * Returns funds to the previous highest bidder.
     * @param user_ The owner of the liquidated vault
     * @param vaultId_ The user specific vault id of the liquidated vault
     * @param bid_ The caller's raising bid
     */
    function bid(address user_, uint256 vaultId_, uint256 bid_) external returns (bool) {
        AuctionInfo memory auction_ = auctions[user_][vaultId_];

        require(auction_.status == AuctionStatus.ACTIVE, "LiquidationAuction: Failed to bid, auction is not active.");
        require(auction_.endTime >= block.timestamp, "LiquidationAuction: Failed to bid, the auction is finished.");
        require(
            bid_ >= _getRaisingBid(user_, vaultId_),
            "LiquidationAuction: The bid amount must exceed the highest bid by the minimum increment percentage or more."
        );

        IERC20 stcInstance_ = _getStableCoin();
        stcInstance_.transfer(auction_.bidder, auction_.highestBid);
        stcInstance_.transferFrom(msg.sender, address(this), bid_);

        auction_.bidder = msg.sender;
        auction_.highestBid = bid_;

        auctions[user_][vaultId_] = auction_;

        emit Bid(user_, vaultId_, msg.sender, bid_);

        return true;
    }

    /**
     * @notice Executes a finalized auction.
     * Pays back the open debt (creates system debt if necessary).
     * Transfers the vault collateral to the highest bidder.
     * Transfers liquidation fee as system surplus.
     * Any remainder of synthetic asset is sent to the liquidated vault owner.
     * @param user_ The owner of the liquidated vault
     * @param vaultId_ The user specific vault id of the liquidated vault
     */
    function execute(address user_, uint256 vaultId_) external returns (bool) {
        AuctionInfo memory auction_ = auctions[user_][vaultId_];
        DefiContracts memory defiContracts_;

        defiContracts_.borrowingContract = BorrowingContract(
            _defiParameters.getAddress(string(abi.encodePacked(_stc, "_borrowing")))
        );
        defiContracts_.systemBalance = SystemBalance(
            _defiParameters.getAddress(string(abi.encodePacked(_stc, "_systemBalance")))
        );

        require(
            block.timestamp > auction_.endTime,
            "LiquidationAuction: Failed to execute, the auction is not finished."
        );
        require(auction_.status == AuctionStatus.ACTIVE, "LiquidationAuction: The auction has already been executed.");

        IERC20 stableCoin_ = _getStableCoin();
        uint256 oldBalance_ = stableCoin_.balanceOf(address(this));

        (string memory col_, , , uint256 mintedAmount_, , uint256 liquidationFullDebt_) = defiContracts_
            .borrowingContract
            .userVaults(user_, vaultId_);

        string memory defiParametersPrefix_ = string(abi.encodePacked(col_, "_", _stc));

        uint256 liquidationFee_ = (liquidationFullDebt_ *
            (_defiParameters.getUintParameter(string(abi.encodePacked(defiParametersPrefix_, "_liquidationFee"))))) /
            getDecimal();

        uint256 amountToClear_ = liquidationFullDebt_;

        if (auction_.highestBid > liquidationFullDebt_ + liquidationFee_) {
            stableCoin_.transfer(user_, auction_.highestBid - liquidationFullDebt_ - liquidationFee_);
            stableCoin_.transfer(address(defiContracts_.systemBalance), liquidationFee_);
        } else if (auction_.highestBid > liquidationFullDebt_) {
            stableCoin_.transfer(address(defiContracts_.systemBalance), auction_.highestBid - liquidationFullDebt_);
        } else {
            amountToClear_ = auction_.highestBid;

            if (auction_.highestBid < mintedAmount_) {
                defiContracts_.systemBalance.increaseDebt(mintedAmount_ - auction_.highestBid);
            }
        }

        _closeAuction(user_, vaultId_);

        stableCoin_.approve(address(defiContracts_.borrowingContract), amountToClear_);
        defiContracts_.borrowingContract.clearVault(user_, vaultId_, amountToClear_, auction_.bidder);

        _checkExecute(oldBalance_, stableCoin_.balanceOf(address(this)), user_, vaultId_);

        emit Executed(user_, vaultId_, auction_);

        return true;
    }

    /**
     * @notice Retrieves the minimum next bid to exceed the current highest bid.
     * @param user_ The owner of the liquidated vault
     * @param vaultId_ The user specific vault id of the liquidated vault
     */
    function getRaisingBid(address user_, uint256 vaultId_) public view returns (uint256) {
        require(
            auctions[user_][vaultId_].status == AuctionStatus.ACTIVE,
            "LiquidationAuction: The auction is not active."
        );

        return _getRaisingBid(user_, vaultId_);
    }

    function _closeAuction(address user_, uint256 vaultId_) private {
        auctions[user_][vaultId_].status = AuctionStatus.CLOSED;
    }

    function _checkExecute(uint256 oldBalance_, uint256 newBalance_, address user_, uint256 vaultId_) private view {
        uint256 bid_ = auctions[user_][vaultId_].highestBid;

        assert(oldBalance_ - bid_ == newBalance_);
    }

    function _getStableCoin() private view returns (IERC20) {
        return IERC20(_defiParameters.getAddress(_stc));
    }

    function _getRaisingBid(address user_, uint256 vaultId_) private view returns (uint256) {
        uint256 minimumIncrement_ = _defiParameters.getUintParameter("auctionMinIncrement");

        uint256 highestBid_ = auctions[user_][vaultId_].highestBid;
        uint256 raisingBid_ = (highestBid_ * (minimumIncrement_)) / getDecimal() + highestBid_;

        if (raisingBid_ == highestBid_) {
            raisingBid_++;
        }

        return raisingBid_;
    }
}
