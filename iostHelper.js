const { IOST, RPC, HTTPProvider, KeyPair, Account, TxHandler, Signature } = require('iost');
const util = require('util');
const bs58 = require('bs58');

// TODO
// only in test net!!!
const chainId = 1020;

// config object for IOST class, config details as as follows:
// gasRatio: transaction gas price
// gasLimit: transaction gas limit
// expiration: time in seconds that transaction will be expired
const iostConfig = {
  // will use default setting if not set
  gasRatio: 1,
  gasLimit: 1e6,
  delay: 0
};

class IOSTHelper {
  constructor(providerUrl) {
    this.adminAccount = {};
    this.adminKeyPair = {};
    this.adminName = '';
    // use RPC
    this.rpc = new RPC(new HTTPProvider(providerUrl));

    // init iost sdk
    this.iost = new IOST(iostConfig, new HTTPProvider(providerUrl));

    // init rpc
    this.iost.setRPC(this.rpc);

    // init admin account
    this.initAdminAccount(
      'admin',
      '2yquS3ySrGWPEKywCPzX4RTJugqRh7kJSo5aehsLYPEWkUxBWA39oMrZ7ZxuM4fgyXYs2cPwh5n8aNNpH5x2VyK1'
    );
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
  makeCreateAccountTx(name, initialRAM, initialGasPledge) {
    // then create new Account transaction
    const tx = this.iost.newAccount(
      name,
      this.adminName,
      this.adminKeyPair.id, // creator account ownerKey
      this.adminKeyPair.id, // creator account activeKey
      initialRAM,
      initialGasPledge
    );

    tx.setTime(90, 0, 0);

    return tx;
  }

  getChainInfo() {
    this.rpc.blockchain.getChainInfo().then(console.log);
  }

  initAdminAccount(name, priKey) {
    // init admin account
    const account = new Account(name);

    // const uint8Array = new util.TextEncoder('utf-8').encode(priKey);
    const keyPair = new KeyPair(bs58.decode(priKey));
    account.addKeyPair(keyPair, 'owner');
    account.addKeyPair(keyPair, 'active');
    account.addKeyPair(keyPair, 'general');

    this.iost.setAccount(account);
    this.adminKeyPair = keyPair;
    this.adminName = name;
    this.adminAccount = account;

    return { account, keyPair };
  }

  createKeyPair() {
    return KeyPair.newKeyPair();
  }

  makeTransferTx(from, to, amount, memo) {
    const tx = this.iost.callABI('token.iost', 'transfer', ['iost', from, to, amount, memo]);
    tx.setTime(90, 0, 0);

    return tx;
  }

  sign(tx) {
    tx.setChainID(1020);

    // 어프루브 반드시 해야함!!!
    tx.addApprove('iost', 1000);

    this.adminAccount.signTx(tx);

    return tx;
  }

  async sendTx(tx) {
    tx.setChainID(chainId);

    const { hash } = await this.rpc.transaction.sendTx(tx);

    return hash;
  }

  getCurrentAccount() {
    return this.iost.currentAccount;
  }

  getBlockByNum(blockNumber) {
    return this.rpc.blockchain.getBlockByNum(blockNumber, true);
  }

  async getAccountInfo(userId) {
    return this.rpc.blockchain.getAccountInfo(userId, false);
  }

  async handle(tx) {
    tx.setChainID(chainId);

    return new Promise((resolve, reject) => {
      const handler = new TxHandler(tx, this.rpc);
      handler
        .onSuccess(function(response) {
          const { tx_hash: txHash } = response;
          console.log('Tansaction Succeed!');
          resolve(txHash);
        })
        .onFailed(err => {
          console.log('Transaction Failed', err);
          reject();
        })
        .onPending(() => {
          console.log('pending..');
        })
        .send()
        .listen(1000, 5);
    });
  }

  addPermToAccount(permission, keyPair) {
    this.adminAccount.addKeyPair(keyPair, permission);
  }

  signWithPerm(tx, permission) {
    tx.setChainID(1020);

    // 어프루브 반드시 해야함!!!
    tx.addApprove('iost', 1000);
    this.adminAccount.sign(tx, permission);
  }

  async getTxByHash(hash) {
    return this.rpc.transaction.getTxByHash(hash);
  }

  async getTransferDataByHash(hash) {
    const { transaction } = await this.getTxByHash(hash);
    const data = JSON.parse(transaction.actions[0].data).slice(1);

    const [fromUserId, toUserId, amount, memo] = data;

    return { fromUserId, toUserId, amount: +amount, memo };
  }
}

module.exports = {
  iostHelper: new IOSTHelper('http://localhost:30001')
};
