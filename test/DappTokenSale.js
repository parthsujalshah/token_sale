var DappToken = artifacts.require("./DappToken.sol")
var DappTokenSale = artifacts.require("./DappTokenSale.sol")

contract('DappTokenSale', accounts => {
    var tokenInstance;
    var tokenSaleInstance;
    var admin = accounts[0];
    var buyer = accounts[1];
    var tokenPrice = 1000000000000000; // In Wei (0.001 Ether)
    var numberOfTokens;
    var tokensAvailable = 750000;

    it('initializes the contract with correct values', () => {
        return DappTokenSale.deployed().then(instance => {
            tokenSaleInstance = instance;
            return tokenSaleInstance.address
        }).then(address => {
            assert.notEqual(address, 0x0, 'has contract address')
            return tokenSaleInstance.tokenContract()
        }).then(address => {
            assert.notEqual(address, 0x0, 'has token contract address')
            return tokenSaleInstance.tokenPrice();
        }).then(price => {
            assert.equal(price, tokenPrice, 'token price is correct')
        });
    });

    it('facilitates token buying', () => {
        return DappToken.deployed().then(instance => {
            tokenInstance = instance;
            return DappTokenSale.deployed();
        }).then(instance => {
            tokenSaleInstance = instance;
            return tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable, { from: admin });
        }).then(receipt => {
            numberOfTokens = 10;
            return tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: tokenPrice * numberOfTokens })
        }).then(receipt => {
            assert.equal(receipt.logs.length, 1, 'triggers event');
            assert.equal(receipt.logs[0].event, 'Sell', 'should be the "Sell" event');
            assert.equal(receipt.logs[0].args._buyer, buyer, 'logs the account that purchased the tokens');
            assert.equal(receipt.logs[0].args._amount.toNumber(), numberOfTokens, 'logs the number of tokens purchased');
            return tokenSaleInstance.tokensSold();
        }).then(amount => {
            assert.equal(amount.toNumber(), numberOfTokens, 'increments the number of tokens sold')
            return tokenInstance.balanceOf(buyer);
            // Buy tokens from a different ether value
        }).then(balance => {
            assert.equal(balance.toNumber(), numberOfTokens)
            return tokenInstance.balanceOf(tokenSaleInstance.address);
        }).then(balance => {
            assert.equal(balance.toNumber(), tokensAvailable - numberOfTokens)
            return tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: 1 });
        }).then(assert.fail).catch(error => {
            assert(error.message.indexOf('revert') >= 0, 'msg.value must be equal to tokens in wei')
            return tokenSaleInstance.buyTokens(800000, { from: buyer, value: numberOfTokens * tokenPrice });
        }).then(assert.fail).catch(error => {
            assert(error.message.indexOf('revert') >= 0, 'cannot purchase more tokens than available')
        });
    });

    it('ends token sale', () => {
        return DappToken.deployed().then(instance => {
            tokenInstance = instance;
            return DappTokenSale.deployed();
        }).then(instance => {
            tokenSaleInstance = instance;
            // Try ending sale by someone other than admin
            return tokenSaleInstance.endSale({ from: buyer });
        }).then(assert.fail).catch(error => {
            assert(error.message.indexOf('revert') >= 0, 'must be adming to end sale')
            // End sale as admin
            return tokenSaleInstance.endSale({from: admin});
        }).then(receipt => {
            return tokenInstance.balanceOf(admin);
        }).then(balance => {
            assert.equal(balance.toNumber(), 999990, 'returns all the unsold tokens to admin');
            // Check that tokenPrice was reset when selfdestruct was called
            // return tokenSaleInstance.tokenPrice();
        })
    });
});