# Fer DeFi System Contacts

This is a project that integrates the implementation of MakerDAO to generate DAI tokens and enables borrowing and lending.
It uses aspects of Compound, particularly the normalization and denormalization of interest rates.


### Pre-requisites
Create a `.env` file in the root directory. Use the `.env.example` file as a template.

Install all dependencies:

```bash
yarn
```

### How to run

Compile the contracts:

```bash
yarn compile
```

Deploy the contracts (choose one of the following):

```bash
yarn deploy:sepolia
```
OR

```bash
yarn deploy:mumbai
```

### Format the code

```bash
yarn prettier
```

### Test the contracts

To be implemented... 🤫


### Additional Scripts
You can use the script to check the collateralization ratio for a specific account. Simply enter the user's address into
the script. For more information, refer to the scripts in the folder `scripts/liquidation-bot-FerUSD`.

e.g.
```bash
yarn run:liquidationBot:sepolia
```

Output:
```
🚀 Starting liquidation bot 🚀
DefiParameters contract loaded!
Borrowing contract address:  0x17f8375ef0c01b341213b4C914221a5E8184de85
Borrowing contract loaded!

Processing 0x52196310E1acaA3eFC58e20FE52a09404Fc9E7B6 vaults...
------------🔐 Vault 0 ------------
 Vault 0 debt: $55098698432220491365773
 Vault 0 liquidation price: $71628
 Collateral price: $50000
🟢 Vault already liquidated 🟢
----------------------------------------

------------🔐 Vault 1 ------------
 Vault 1 debt: $4329999900000000000000
 Vault 1 liquidation price: $5628
 Collateral price: $50000
🟢 Liquidation is not possible 🟢
----------------------------------------

------------🔐 Vault 2 ------------
 Vault 2 debt: $43753999900000000000000
 Vault 2 liquidation price: $56880
 Collateral price: $50000
🟢 Vault already liquidated 🟢
----------------------------------------

------------🔐 Vault 3 ------------
 Vault 3 debt: $43452666567000000000000
 Vault 3 liquidation price: $56488
 Collateral price: $50000
🟢 Vault already liquidated 🟢
----------------------------------------
```