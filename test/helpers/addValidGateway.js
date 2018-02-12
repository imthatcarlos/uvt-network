/**
 * Adds a gateway to the ODR storage, and returns the tx
 */
module.exports = async function addValidGateway (ledger, account, area = '60641') {
  return await ledger.addGateway(
    '127.0.0.1',
    '41.878114',
    '-87.629798',
    'chicago',
    area,
    '123+W+Blah+Street+Chicago+IL+60641+11234567890',
    {from: account}
  );
}
