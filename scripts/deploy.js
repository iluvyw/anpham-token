const fs = require("fs");
const { BigNumber } = require("ethers");

async function main() {
  const [deployer] = await ethers.getSigners();

  const totalSupply = BigNumber.from(1000000000000000);

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const MyToken = await ethers.getContractFactory("MyToken");
  const myToken = await MyToken.deploy("An Pham", "APM", totalSupply);

  console.log("Token address:", myToken.address);
  const data =
    `owner: ${deployer.address.toString()}; \n` +
    `address: ${myToken.address.toString()};`;
  fs.writeFileSync("config.js", data);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
