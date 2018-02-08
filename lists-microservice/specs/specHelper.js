import '../src/lib/specHelper';
import chakram from 'chakram';
global.expect = chakram.expect;
global.chakram = chakram;
global.baseUrl = process.env.TEST_URL || 'http://localhost:3000';
