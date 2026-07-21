const env = require('./config/env');
const app = require('./app');

const PORT = env.app.port;

app.listen(PORT, () => {
  console.log(`${env.app.name} running on port ${PORT}`);
});
