const { iostHelper } = require('./iostHelper');

// const keyPair = iostHelper.createKeyPair();

// iostHelper.transfer('admin', 'toAccount', '10.000', 'memo');

// const tx = iostHelper.makeCreateAccountTx('user1', 200, 200);
// iostHelper.sign(tx);
// iostHelper
//   .sendTx(tx)
//   .then(v => {
//     console.log(v);
//   })
//   .catch(err => {
//     console.log(err);
//   });

const tx = iostHelper.makeTransferTx('admin', 'admin', '1000', 'sdf');
iostHelper.sign(tx);
iostHelper.handle(tx);
