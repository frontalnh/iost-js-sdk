const IOSTHelper = require('./iost-helper');
const iostHelper = new IOSTHelper('http://localhost:30001');
jest.setTimeout(100000);

const genRandomString = len => {
  let randomString = '';
  const possible = 'abcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < len; i++) {
    randomString += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return randomString;
};

const delay = sec =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, sec * 1000);
  });

describe('[IostHelper]', () => {
  const USER1_ID = genRandomString(8);
  const USER2_ID = genRandomString(8);

  beforeAll(async () => {
    const user1Tx = await iostHelper.makeCreateAccountTx(USER1_ID, 200, 200);
    const user2Tx = await iostHelper.makeCreateAccountTx(USER2_ID, 200, 200);

    iostHelper.sign(user1Tx);
    iostHelper.sign(user2Tx);

    await iostHelper.handle(user1Tx);
    await iostHelper.handle(user2Tx);
  });

  it('get chain info', async () => {
    const chainInfo = await iostHelper.getChainInfo();
    console.log(chainInfo);
  });
  it('make create account tx', async () => {
    iostHelper.makeCreateAccountTx('user1', 200, 200);
  });

  it('create account', async () => {
    const userId = genRandomString(8);
    const tx = iostHelper.makeCreateAccountTx(userId.toString(), 200, 200);

    iostHelper.sign(tx);

    // const hash = await iostHelper.sendTx(tx);
    // expect(hash).toBeDefined();
    // console.log(hash);

    try {
      const hash = await iostHelper.handle(tx);

      const user = await iostHelper.getAccountInfo(userId);

      expect(user.name).toBe(userId);
    } catch (err) {
      console.log(err);
    }
  });

  it('sign and send transaction', async () => {
    // const tx = iostHelper.makeCreateAccountTx('user1', 200, 200);
    const tx = iostHelper.makeTransferTx('admin', 'admin', '1000', 'hello');
    expect(tx.publisher_sigs.length).toBe(0);
    iostHelper.sign(tx);

    expect(tx.publisher_sigs.length).toBe(1);

    const hash = await iostHelper.sendTx(tx);
    expect(hash).toBeDefined();
  });

  it.only('get block by num and get tx by hash', async () => {
    const userId = genRandomString(10);
    const userTx = iostHelper.makeCreateAccountTx(userId, 200, 200);
    iostHelper.sign(userTx);
    await iostHelper.handle(userTx);

    const transferTx = await iostHelper.makeTransferTx('admin', userId, '1000', 'test transfer');
    iostHelper.sign(transferTx);
    const transferHash = await iostHelper.handle(transferTx);

    const { block_number: blockNumber } = await iostHelper.getTxByHash(transferHash);

    const { status, transactions } = await iostHelper.getBlockByNum(blockNumber);

    const transaction = await iostHelper.getTxByHash(transactions[1].hash);
    console.log('Transaction: ', transaction);
    const transferData = await iostHelper.getTransferDataByHash(transactions[1].hash);

    expect(transferData).toMatchObject({
      fromUserId: 'admin',
      toUserId: userId,
      amount: 1000,
      memo: 'test transfer'
    });

    expect(transaction.block_number).toBe(blockNumber);
  });

  it('transfer', async () => {
    const adminBefore = await iostHelper.getAccountInfo('admin');
    const transferTx = iostHelper.makeTransferTx('admin', USER1_ID, '1000', 'hello');

    iostHelper.sign(transferTx);
    await iostHelper.handle(transferTx);

    const adminAfter = await iostHelper.getAccountInfo('admin');

    expect(adminAfter.balance).toBe(adminBefore.balance - 1000);
  });

  it('add permission to account', async () => {
    const secKey = await iostHelper.addPermToAccount('admin', 'general', 100, 100);
    expect(secKey).toBeDefined();

    const transferTx = iostHelper.makeTransferTx('admin', USER1_ID, '1000', 'hello');

    iostHelper.sign(transferTx);
    // iostHelper.signWithPerm(transferTx, 'general');

    await iostHelper.handle(transferTx);

    const accountInfo = await iostHelper.getAccountInfo('admin');

    expect(accountInfo.permissions).toMatchObject({ general: { name: 'general' } });
  });

  it('get block very fast', done => {
    const tasks = [];
    for (let i = 0; i < 300; i++) {
      tasks.push(iostHelper.getBlockByNum(i));
    }

    Promise.all(tasks).then(v => {
      console.log(v);
      done();
    });
  });
});
