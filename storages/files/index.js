
const { setupDatabase } = require('./database/initiators/main-initiator.js');
const { setupNetwork } = require('./network/initiators/main-initiator.js');
const { setupGrpcNetwork } = require('./network2/initiators/main-initiator.js');

async function main() {
  setupDatabase();
  setupNetwork();
  setupGrpcNetwork();
}

main();
