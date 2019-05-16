const { IOST, RPC, HTTPProvider, KeyPair, Account } = require('iost');

// config object for IOST class, config details as as follows:
// gasRatio: transaction gas price
// gasLimit: transaction gas limit
// expiration: time in seconds that transaction will be expired
const iostConfig = {
  // will use default setting if not set
  gasRatio: 0,
  gasLimit: 0,
  delay: 0
};

const privateKey = new TextEncoder('utf-8').encode(
  '2yquS3ySrGWPEKywCPzX4RTJugqRh7kJSo5aehsLYPEWkUxBWA39oMrZ7ZxuM4fgyXYs2cPwh5n8aNNpH5x2VyK1'
);

class IOSTHelper {
  constructor(providerUrl) {
    // use RPC
    const rpc = new RPC(new HTTPProvider(providerUrl));
    rpc.blockchain.getChainInfo().then(console.log);

    // init iost sdk
    this.iost = new IOST(iostConfig, new HTTPProvider(providerUrl));
    const keyPair = new KeyPair(privateKey);

    const account = new Account(keyPair.id);
    account.addKeyPair(keyPair, 'owner');
    account.addKeyPair(keyPair, 'active');
    this.iost.setAccount(account);
    this.iost.setRPC(rpc);

    console.log('Key pair: ', keyPair);
  }

  /**
   *
   * @param {string} name new account name
   * @param {string} creator creator account name
   * @param {string} ownerKey creator account ownerKey
   * @param {string} activeKey creator account activeKey
   * @param {number} initialRAM new account initialRAM, paid by creator
   * @param {number} initialGasPledge new account initialGasPledge, paid by creator
   */
  createAccount(name, creator, ownerKey, activeKey, initialRAM, initialGasPledge) {
    // then create new Account transaction
    const newAccountTx = this.iost.newAccount(
      name,
      creator,
      ownerKey,
      activeKey,
      initialRAM,
      initialGasPledge
    );

    console.log('create account: ', newAccountTx);

    return newAccountTx;
  }

  createKeyPair() {
    return KeyPair.newKeyPair();
  }

  // token String	token name
  // from	String	transfer-from account
  // to	String	transfer-to account
  // amount	String	transfer amount
  // memo	Number	memo of this transfer
  transfer(from, to, amount, memo) {
    const tx = this.iost.transfer('iost', from, to, amount, memo);

    console.log('Transfer Transaction Created: ', tx);

    this.iost
      .signAndSend(tx)
      .on('pending', console.log)
      .on('success', console.log)
      .on('failed', console.log);

    return tx;
  }
}

module.exports = {
  iostHelper: new IOSTHelper('http://localhost:30001')
};
