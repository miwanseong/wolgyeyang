import fs from 'node:fs';
import path from 'node:path';
export function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { if (e.code === 'ENOENT') return fallback; throw new Error(`설정 파일을 읽을 수 없습니다: ${path.basename(file)}`); }
}
export function writeJSON(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  fs.writeFileSync(`${file}.tmp`, JSON.stringify(data, null, 2), { mode: 0o600 });
  fs.renameSync(`${file}.tmp`, file);
}
export class Budget {
  constructor(file, limit) { this.file = file; this.limit = limit; this.data = readJSON(file, { day: '', turns: 0 }); }
  snapshot() {
    const day = new Date().toISOString().slice(0, 10);
    if (this.data.day !== day) this.data = { day, turns: 0 };
    return { ...this.data, limit: this.limit };
  }
  reserve() {
    this.snapshot();
    if (this.data.turns >= this.limit) throw new Error('오늘의 AI 호출 한도에 도달했습니다. (UTC 기준)');
    this.data.turns += 1;
    writeJSON(this.file, this.data); // reserve before paid work; failed attempts also count
  }
}
