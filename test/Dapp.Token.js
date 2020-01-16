var DappToken = artifacts.require("./DappToken.sol")

contract('DappToken', function(accounts){
    it('sets the total supply upon deplyment', () => {
        return DappToken.deployed().then(instance => {
            tokenInstance = instance;
            return tokenInstance.totalSupply();
        }).then(totalSupply => {
            assert.equal(totalSupply.toNumber(), 1000000, 'sets the total supply to 1,000,000')
        })
    });
})