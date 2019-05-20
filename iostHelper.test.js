const { iostHelper } = require('./iostHelper');
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
  it('make create account tx', async () => {
    iostHelper.makeCreateAccountTx('user1', 200, 200);
  });

  it('create account', async () => {
    const userId = genRandomString(8);
    const tx = iostHelper.makeCreateAccountTx(userId.toString(), 200, 200);

    iostHelper.sign(tx);

    console.log('TX: ', tx);
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

    console.log(tx);
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

    const { status, block } = await iostHelper.getBlockByNum(blockNumber);

    const transaction = await iostHelper.getTxByHash(block.transactions[1].hash);

    const transferData = await iostHelper.getTransferDataByHash(block.transactions[1].hash);

    expect(transferData).toMatchObject({
      fromUserId: 'admin',
      toUserId: userId,
      amount: 1000,
      memo: 'test transfer'
    });

    expect(transaction.block_number).toBe(blockNumber);
  });

  it('transfer', async () => {
    const user1Id = genRandomString(8);
    const user2Id = genRandomString(8);
    const user1Tx = await iostHelper.makeCreateAccountTx(user1Id, 200, 200);
    const user2Tx = await iostHelper.makeCreateAccountTx(user2Id, 200, 200);

    iostHelper.sign(user1Tx);
    iostHelper.sign(user2Tx);

    await iostHelper.handle(user1Tx);
    await iostHelper.handle(user2Tx);

    const adminBefore = await iostHelper.getAccountInfo('admin');
    const transferTx = iostHelper.makeTransferTx('admin', user1Id, '1000', 'hello');

    iostHelper.sign(transferTx);
    await iostHelper.handle(transferTx);

    const adminAfter = await iostHelper.getAccountInfo('admin');

    expect(adminAfter.balance).toBe(adminBefore.balance - 1000);
  });

  it('add permission to account', async () => {
    const keyPair = iostHelper.createKeyPair();

    const result = iostHelper.addPermToAccount('general', keyPair);
    console.log(result);

    const transferTx = iostHelper.makeTransferTx('admin', 'admin', '2000', 'hello');
    iostHelper.sign(transferTx);
    // iostHelper.signWithPerm(transferTx, 'general');

    await iostHelper.handle(transferTx);

    const accountInfo = await iostHelper.getAccountInfo('admin');
    console.log(accountInfo);
  });
});
