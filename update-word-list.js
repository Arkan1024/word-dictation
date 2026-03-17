const fs = require('fs');
const path = require('path');

const wordsDir = path.join(__dirname, 'public', 'words');
const listFile = path.join(wordsDir, 'list.json');

console.log('🔍 正在扫描词库目录: ' + wordsDir);

try {
  // 1. 读取目录下的所有文件
  const files = fs.readdirSync(wordsDir);

  // 2. 过滤出以 .txt 结尾的文件
  const txtFiles = files.filter(file => file.endsWith('.txt'));

  // 3. 将文件名写入 list.json
  fs.writeFileSync(listFile, JSON.stringify(txtFiles, null, 2), 'utf8');

  console.log('✅ 成功更新词库索引！');
  console.log('📄 发现词库数量: ' + txtFiles.length);
  txtFiles.forEach(f => console.log('   - ' + f));
  
} catch (err) {
  console.error('❌ 更新失败: ', err);
  process.exit(1);
}
