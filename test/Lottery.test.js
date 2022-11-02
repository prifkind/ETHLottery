const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");

const web3 = new Web3(ganache.provider());

const { interface, bytecode } = require("../compile");

let lottery;
let accounts;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();

  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: "1000000" });
});

describe("Lottery contract", () => {
  it("deploys a contract", () => {
    assert.ok(lottery.options.address);
  });

  it("allows one account to enter", async () => {
    // Remember that the contract has a methods object that includes the embedded methods
    // You need to invoke the method, then chain the send method with its parameters
    await lottery.methods.enter().send(
      // the value prop calls a method included with web3 that allows for conversion from ETH to WEI
      { from: accounts[0], value: web3.utils.toWei("0.02", "ether") }
    );

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0],
    });

    // So what we did was enter the lottery with the address from accounts[0]
    // Then we called getPlayers with the address from accounts[0]
    // It's important to keep in mind your require statements in the contract, because getPlayers is restricted to ony the manager's address
    assert.equal(accounts[0], players[0]);
    assert.equal(1, players.length);
  });

  it("allows multiple accounts to enter", async () => {
    await lottery.methods
      .enter()
      .send({ from: accounts[0], value: web3.utils.toWei("0.02", "ether") });

    await lottery.methods
      .enter()
      .send({ from: accounts[1], value: web3.utils.toWei("0.02", "ether") });

    await lottery.methods
      .enter()
      .send({ from: accounts[2], value: web3.utils.toWei("0.02", "ether") });

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0],
    });

    assert.equal(accounts[0], players[0]);
    assert.equal(accounts[1], players[1]);
    assert.equal(accounts[2], players[2]);

    assert.equal(3, players.length);
  });

  it("prevents users from entering with less than the required amount", async () => {
    try {
      await lottery.methods.enter().send({
        from: accounts[0],
        value: 200,
      });

      assert(false);
    } catch (error) {
      assert(error);
    }
  });

  it("only the manager can pick a winner", async () => {
    try {
      await lottery.methods.pickWinner().send({
        from: accounts[1],
      });
      assert(false);
    } catch (error) {
      assert(error);
    }
  });

  it("sends money to the winner and resets the array", async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("2", "ether"),
    });

    // Accounts[0] sends 2 ETH; so, pickWinner should send 2 ETH back
    // Use this method to get a balance
    const initialBalance = await web3.eth.getBalance(accounts[0]);

    await lottery.methods.pickWinner().send({ from: accounts[0] });

    const finalBalance = await web3.eth.getBalance(accounts[0]);
    const difference = finalBalance - initialBalance

    // The difference won't be exactly 2 because of gas
    // This could be much more; so, consider how you implement this test
    // There's probably a way to get the amount of gas used when entering, set that to a variable, and just use that to calculate the difference
    assert(difference > web3.utils.toWei('1.8', 'ether'));
  });
});
