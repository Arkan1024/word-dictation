const fs = require('fs');
const path = require('path');

const wordsDir = path.join(__dirname, 'public', 'words');
const listFile = path.join(wordsDir, 'list.json');

console.log('🔍 正在扫描词库目录: ' + wordsDir);

try {
  if (!fs.existsSync(wordsDir)) {
    console.error('❌ 目录不存在: ' + wordsDir);
    process.exit(1);
  }
  const files = fs.readdirSync(wordsDir);
  const txtFiles = files.filter(file => file.endsWith('.txt'));
  fs.writeFileSync(listFile, JSON.stringify(txtFiles, null, 2), 'utf8');
  console.log('✅ 成功更新词库索引！数量: ' + txtFiles.length);
} catch (err) {
  console.error('❌ 更新失败: ', err);
  process.exit(1);
}
