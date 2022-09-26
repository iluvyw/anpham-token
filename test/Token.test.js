const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

describe("My Token", function () {
  let myToken;
  let MyToken;
  let totalSupply = BigNumber.from(1000 * 10 ** 10);

  beforeEach(async function () {
    MyToken = await ethers.getContractFactory("MyToken");
    myToken = await MyToken.deploy("An Pham", "APM", totalSupply);
  });

  // Check address, name and symbol of contract
  it("Contract constructor", async function () {
    expect(myToken.address, "My Token has not deployed!!!");
    expect(await myToken.name()).to.equal("An Pham");
    expect(await myToken.symbol()).to.equal("APM");
  });

  // Check if deployer's account balance equal to total supply after constructor
  it("Accounts' balances", async function () {
    const [deployer, otherAccount] = await ethers.getSigners();
    const deployer_balance = await myToken.balanceOf(deployer.address);
    const other_account_balance = await myToken.balanceOf(otherAccount.address);
    expect(deployer_balance).to.equal(totalSupply);
    expect(other_account_balance).to.equal(0);
  });

  // Check if token's decimals equal to 18 (default of ERC20)
  it("Token's decimals", async function () {
    const decimals = await myToken.decimals();
    expect(decimals).to.equal(10);
  });

  // Check transfer from deployer to first account
  it("Transfer", async function () {
    const value = BigNumber.from(100);
    const [deployer, firstAccount] = await ethers.getSigners();
    await expect(myToken.transfer(firstAccount.address, value))
      .to.emit(myToken, "Transfer")
      .withArgs(deployer.address, firstAccount.address, value);
    expect(await myToken.balanceOf(deployer.address)).to.equal(
      totalSupply - value
    );
    expect(await myToken.balanceOf(firstAccount.address)).to.equal(value);
  });

  describe("Transfer from", function () {
    let deployer, firstAccount, secondAccount, thirdAccount;
    let value = BigNumber.from(100);
    /* 
    Before each test:
    Get deployers, first, second and third accounts
    Transfer 100 tokens to first account from user
    */
    beforeEach(async function () {
      const [owner, first, second, third] = await ethers.getSigners();
      firstAccount = first;
      secondAccount = second;
      thirdAccount = third;
      deployer = owner;
      await myToken.transfer(firstAccount.address, value);
    });
    // Second account not approved by first account to send tokens to third account
    it("Insufficient allowance", async function () {
      await expect(
        myToken
          .connect(secondAccount)
          .transferFrom(firstAccount.address, thirdAccount.address, value)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });

    // Second account not approved enough value (90 < 100) by first account to send tokens to third account
    it("Approve amount smaller than value", async function () {
      const send_value = BigNumber.from(100);
      await myToken
        .connect(firstAccount)
        .approve(secondAccount.address, BigNumber.from(90));
      await expect(
        myToken
          .connect(secondAccount)
          .transferFrom(firstAccount.address, thirdAccount.address, send_value)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });

    // Second account approved enough value (80 >= 50) by first account to send tokens to third account
    it("Approve amount greater or equal value", async function () {
      const firstAccountInitialBalance = await myToken.balanceOf(
        firstAccount.address
      );
      const send_value = BigNumber.from(50);
      await expect(
        myToken
          .connect(firstAccount)
          .approve(secondAccount.address, BigNumber.from(80))
      )
        .to.emit(myToken, "Approval")
        .withArgs(
          firstAccount.address,
          secondAccount.address,
          BigNumber.from(80)
        );
      await expect(
        myToken
          .connect(secondAccount)
          .transferFrom(firstAccount.address, thirdAccount.address, send_value)
      )
        .to.emit(myToken, "Transfer")
        .withArgs(firstAccount.address, thirdAccount.address, send_value);
      expect(await myToken.balanceOf(firstAccount.address)).to.equal(
        firstAccountInitialBalance - send_value
      );
      expect(await myToken.balanceOf(thirdAccount.address)).to.equal(
        send_value
      );
    });

    //Check allowance
    it("Allowance", async function () {
      await myToken
        .connect(firstAccount)
        .approve(secondAccount.address, BigNumber.from(60));
      expect(
        await myToken.allowance(firstAccount.address, secondAccount.address)
      ).to.equal(BigNumber.from(60));
    });
  });
});
