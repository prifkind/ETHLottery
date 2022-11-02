pragma solidity ^0.4.17;

contract Lottery {
    address public manager;
    address[] public players;

    function Lottery() public {
        manager = msg.sender;
    }

    function enter() public payable {
        require(msg.value > .01 ether);
        players.push(msg.sender);
    }

    function random() private view returns (uint256) {
        // No random number method in Solidity
        // Use a hashing algo to create a new random number with some other characteristics
        // block comes from global variables, and has a difficulty prop
        // 'now' also comes from the global variable

        // Gets wrapped in unit to convert hex -> uint
        return uint256(keccak256(block.difficulty, now, players));
    }

    function pickWinner() public restricted {
        uint256 index = random() % players.length;

        // This context is the current contract
        // balance is a native prop of the contract
        players[index].transfer(this.balance);

        // This resets the array
        // You re-initialize the array as dynamic with type address
        // The (0) invocation represents an initial number of elements, in this case no new elements; otherwise, entering a number would create that many 0 value addresses
        players = new address[](0);
    }

    // This is an example of a function modifier
    // Used like a helper function to help DRY
    // You add it when typing your functions almost like an additional parameter
    modifier restricted() {
        require(msg.sender == manager);

        // The underscore is kind of like a placeholder
        // It imports any code that will run as part of an associated function
        _;
    }

    function getPlayers() public view returns (address[]) {
        return players;
    }
}
