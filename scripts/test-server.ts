import 'dotenv/config';
const secured = process.argv.includes('--secured');
process.env.PORT = secured ? '8081' : '8080';
process.env.BIND_HOST = '127.0.0.1';
process.env.APP_ORIGIN = 'http://127.0.0.1:' + process.env.PORT;
process.env.LAB_MODE = secured ? 'secured' : 'vulnerable';
await import('../server');
