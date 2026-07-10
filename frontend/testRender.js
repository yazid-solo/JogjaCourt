import fs from 'fs';
import { parse } from '@babel/parser';

try {
  const code = fs.readFileSync('./src/pages/dashboard/Settings.jsx', 'utf-8');
  parse(code, { sourceType: 'module', plugins: ['jsx'] });
  console.log('Parse Success!');
} catch (e) {
  console.error('Parse Error:', e);
}