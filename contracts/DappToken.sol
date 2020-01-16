pragma solidity ^0.5.0;

contract DappToken {
    uint256 public totalSupply;
    string public name = 'DApp Token';
    string public symbol = 'DAPP';
    string public standard = 'DApp Token v1.0'; // Not part of erc20

    event Transfer(
        address indexed _from,
        address indexed _to,
        uint256 _value
    );

    mapping(address => uint256) public balanceOf;

    constructor (uint256 _initialSupply) public {
        balanceOf[msg.sender] = _initialSupply;
        totalSupply = _initialSupply;
    }

    // Transfer
    function transfer(address _to, uint256 _value) public returns (bool success) {
        // Exception if account doesn't have enough
        require(balanceOf[msg.sender] >= _value);
        
        // Transfer the balance
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;

        emit Transfer(msg.sender, _to, _value);

        // return a boolean
        return true;
    }
}