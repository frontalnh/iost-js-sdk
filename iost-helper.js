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
    this.currentAccount = {};
    this.currentKeypair = {};
    this.currentName = '';
    // use RPC
    this.rpc = new RPC(new HTTPProvider(providerUrl));

    // init iost sdk
    this.iost = new IOST(iostConfig, new HTTPProvider(providerUrl));

    // init rpc
    this.iost.setRPC(this.rpc);
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
      this.currentName,
      this.currentKeypair.id, // creator account ownerKey
      this.currentKeypair.id, // creator account activeKey
      initialRAM,
      initialGasPledge
    );

    tx.setTime(90, 0, 0);

    return tx;
  }

  async getChainInfo() {
    const { head_block: headBlockNumber } = await this.rpc.blockchain.getChainInfo();

    return { headBlockNumber };
  }

  setAccount(name, priKey) {
    // init admin account
    const account = new Account(name);

    // const uint8Array = new util.TextEncoder('utf-8').encode(priKey);
    const keyPair = new KeyPair(bs58.decode(priKey));
    account.addKeyPair(keyPair, 'owner');
    account.addKeyPair(keyPair, 'active');

    this.iost.setAccount(account);
    this.currentKeypair = keyPair;
    this.currentName = name;
    this.currentAccount = account;

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

    this.currentAccount.signTx(tx);

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

  async getBlockByNum(blockNumber) {
    const { status, block } = await this.rpc.blockchain.getBlockByNum(blockNumber, true);

    return { status, transactions: block.transactions, blockNumber: block.number };
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

  async addPermToAccount(userId, permission, threshold, weight) {
    const keyPair = this.createKeyPair();
    const addPermTx = this.iost.callABI('auth.iost', 'addPermission', [
      userId,
      permission,
      threshold
    ]);
    addPermTx.setTime(90, 0, 0);
    this.sign(addPermTx);

    await this.sendTx(addPermTx);

    const assignPermTx = this.iost.callABI('auth.iost', 'assignPermission', [
      userId,
      permission,
      keyPair.B58PubKey(),
      weight
    ]);
    assignPermTx.setTime(90, 0, 0);
    this.sign(assignPermTx);

    await this.sendTx(assignPermTx);

    return keyPair.B58SecKey();
  }

  signWithPerm(tx, permission) {
    // tx.setChainID(1020);

    // 어프루브 반드시 해야함!!!
    // tx.addApprove('iost', 1000);
    this.currentAccount.sign(tx, permission);
  }

  async getTxByHash(hash) {
    return this.rpc.transaction.getTxByHash(hash);
  }

  async getTransferDataByHash(hash) {
    const { transaction, block_number: blockNumber } = await this.getTxByHash(hash);
    console.log(transaction);
    const data = JSON.parse(transaction.actions[0].data).slice(1);

    const [fromUserId, toUserId, amount, memo] = data;

    return { fromUserId, toUserId, amount: +amount, memo, blockNumber: +blockNumber, hash };
  }
}

module.exports = IOSTHelper;
