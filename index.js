const { iostHelper } = require('./iostHelper');

const keyPair = iostHelper.createKeyPair();

iostHelper.transfer('fromAccount', 'toAccount', '10.000', 'memo');
