import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Printer, FileText, X, Shuffle, Book, CheckSquare, Square } from 'lucide-react';
import './App.css';

interface Word {
  id: string;
  en: string;
  cn: string;
}

interface WordGroup {
  name: string;
  words: Word[];
}

interface LibraryData {
  fileName: string;
  path: string;
  groups: WordGroup[];
}

interface LibraryOption {
  label: string;
  path: string;
}

const App: React.FC = () => {
  const [words, setWords] = useState<Word[]>([]);
  const [libraryOptions, setLibraryOptions] = useState<LibraryOption[]>([]);
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [wordsPerPage, setWordsPerPage] = useState(12);
  const [mergeLastPage, setMergeLastPage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [isLibraryFocused, setIsLibraryFocused] = useState(false);
  
  const [loadedLibraries, setLoadedLibraryData] = useState<LibraryData[]>([]);
  const [pendingLibraries, setPendingLibraries] = useState<LibraryData[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [tempSelectedGroupMap, setTempSelectedGroupMap] = useState<Record<string, number[]>>({});
  const [showGroupModal, setShowGroupModal] = useState(false);

  useEffect(() => {
    const fetchLibraryList = async () => {
      try {
        const response = await fetch('/words/');
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) throw new Error('Not JSON');
        const data = await response.json();
        if (Array.isArray(data)) {
          const txtFiles = data.filter((item: any) => item.type === 'file' && item.name.endsWith('.txt'))
            .map((item: any) => ({ label: item.name.replace('.txt', ''), path: `/words/${item.name}` }));
          setLibraryOptions(txtFiles);
        }
      } catch (error) {
        try {
          const fallback = await fetch('/words/list.json');
          const data = await fallback.json();
          if (Array.isArray(data)) {
            setLibraryOptions(data.map((name: string) => ({ label: name.replace('.txt', ''), path: `/words/${name.endsWith('.txt') ? name : name + '.txt'}` })));
          }
        } catch (e) { console.error('Load fail'); }
      }
    };
    fetchLibraryList();
  }, []);

  const addWord = () => setWords([...words, { id: Date.now().toString(), en: '', cn: '' }]);
  const updateWord = (id: string, field: 'en' | 'cn', value: string) => setWords(words.map(w => w.id === id ? { ...w, [field]: value } : w));
  const removeWord = (id: string) => setWords(words.filter(w => w.id !== id));
  const shuffleWords = () => {
    const shuffled = [...words];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setWords(shuffled);
  };

  const parseSingleWord = (line: string): Word | null => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('-')) return null;
    const match = trimmed.match(/\s+(?![a-zA-Z])/) || trimmed.match(/[\u4e00-\u9fa5]|（/);
    if (match && match.index !== undefined) {
      return { id: Math.random().toString(36).substr(2, 9), en: trimmed.substring(0, match.index).trim(), cn: trimmed.substring(match.index).trim() };
    }
    return null;
  };

  const processTextToGroups = (text: string, fileName: string, path: string): LibraryData => {
    const lines = text.split('\n');
    const groups: WordGroup[] = [];
    let currentGroup: WordGroup = { name: '默认分组', words: [] };
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (trimmed.startsWith('-')) {
        if (currentGroup.words.length > 0) groups.push(currentGroup);
        currentGroup = { name: trimmed.substring(1).trim(), words: [] };
      } else {
        const word = parseSingleWord(trimmed);
        if (word) currentGroup.words.push(word);
      }
    });
    if (currentGroup.words.length > 0) groups.push(currentGroup);
    return { fileName, path, groups };
  };

  const handleLibraryFetch = async () => {
    if (selectedPaths.length === 0) return;
    try {
      let pending: LibraryData[] = [];
      let groupMap: Record<string, number[]> = {};
      for (const path of selectedPaths) {
        const response = await fetch(path);
        const text = await response.text();
        const fileName = libraryOptions.find(o => o.path === path)?.label || '未知词库';
        const libData = processTextToGroups(text, fileName, path);
        pending.push(libData);
        groupMap[path] = libData.groups.map((_, i) => i);
      }
      setPendingLibraries(pending);
      setTempSelectedGroupMap(groupMap);
      setActiveTabIndex(0);
      setShowGroupModal(true);
      setIsLibraryFocused(false);
    } catch (e) { console.error(e); }
  };

  const confirmLoadGroups = () => {
    const finalLibs = pendingLibraries.map(lib => ({
      ...lib,
      groups: lib.groups.filter((_, i) => tempSelectedGroupMap[lib.path]?.includes(i))
    })).filter(lib => lib.groups.length > 0);

    setLoadedLibraryData([...loadedLibraries, ...finalLibs]);
    const allWords = finalLibs.flatMap(lib => lib.groups.flatMap(g => g.words));
    setWords([...words, ...allWords]);
    setShowGroupModal(false);
    setSelectedPaths([]);
  };

  const removeLibrary = (path: string) => {
    const libToRemove = loadedLibraries.find(l => l.path === path);
    if (!libToRemove) return;
    const newLoaded = loadedLibraries.filter(l => l.path !== path);
    setLoadedLibraryData(newLoaded);
    const wordsToRemoveIds = new Set(libToRemove.groups.flatMap(g => g.words.map(w => w.id)));
    setWords(words.filter(w => !wordsToRemoveIds.has(w.id)));
  };

  const handleBulkImport = () => {
    const lines = importText.split('\n');
    const newWords: Word[] = [];
    lines.forEach(l => { const w = parseSingleWord(l); if (w) newWords.push(w); });
    if (newWords.length > 0) { setWords([...words, ...newWords]); setImportText(''); setShowImport(false); }
  };

  const clearWords = () => {
    if (window.confirm('清空所有单词？')) { setWords([]); setLoadedLibraryData([]); }
  };

  const togglePath = (path: string) => setSelectedPaths(prev => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]);
  const filteredOptions = searchTerm.trim() === '' ? libraryOptions.slice(0, 5) : libraryOptions.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 10);

  let pages: Word[][] = [];
  for (let i = 0; i < words.length; i += wordsPerPage) pages.push(words.slice(i, i + wordsPerPage));
  if (mergeLastPage && pages.length > 1) {
    const lastPageWords = pages.pop() || [];
    pages[pages.length - 1] = [...pages[pages.length - 1], ...lastPageWords];
  }
  if (pages.length === 0) pages.push([]);

  // 全选/取消全选逻辑
  const toggleAllInCurrentTab = () => {
    const path = pendingLibraries[activeTabIndex].path;
    const allIndices = pendingLibraries[activeTabIndex].groups.map((_, i) => i);
    const currentSelected = tempSelectedGroupMap[path] || [];
    
    if (currentSelected.length === allIndices.length) {
      setTempSelectedGroupMap({...tempSelectedGroupMap, [path]: []});
    } else {
      setTempSelectedGroupMap({...tempSelectedGroupMap, [path]: allIndices});
    }
  };

  return (
    <div className="app-container">
      {/* 批量导入 */}
      {showImport && (
        <div className="modal-overlay" onClick={() => setShowImport(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>批量导入单词</h3><button className="close-modal" onClick={() => setShowImport(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <p className="hint-text">格式: apple 苹果</p>
              <textarea className="import-textarea" value={importText} onChange={e => setImportText(e.target.value)} />
              <button className="import-confirm-btn" onClick={handleBulkImport}>确认导入</button>
            </div>
          </div>
        </div>
      )}

      {/* 分组选择弹窗 - 重构 */}
      {showGroupModal && (
        <div className="modal-overlay" onClick={() => setShowGroupModal(false)}>
          <div className="modal-content group-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-title-group">
                <h3>细化词库范围</h3>
                <span className="subtitle">请勾选需要加载的分组</span>
              </div>
              <button className="close-modal" onClick={() => setShowGroupModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{padding: 0}}>
              <div className="tabs-nav">
                {pendingLibraries.map((lib, i) => (
                  <div key={lib.path} className={`tab-item ${activeTabIndex === i ? 'active' : ''}`} onClick={() => setActiveTabIndex(i)}>
                    {lib.fileName}
                  </div>
                ))}
              </div>
              <div className="tab-toolbar">
                <button className="text-btn" onClick={toggleAllInCurrentTab}>
                  {(tempSelectedGroupMap[pendingLibraries[activeTabIndex]?.path]?.length === pendingLibraries[activeTabIndex]?.groups.length) 
                    ? <CheckSquare size={16} /> : <Square size={16} />}
                  <span>全选 / 反选</span>
                </button>
                <span className="selection-info">
                  已选 {tempSelectedGroupMap[pendingLibraries[activeTabIndex]?.path]?.length || 0} / {pendingLibraries[activeTabIndex]?.groups.length} 组
                </span>
              </div>
              <div className="tab-content">
                {pendingLibraries[activeTabIndex] && (
                  <div className="group-list">
                    {pendingLibraries[activeTabIndex].groups.map((group, idx) => (
                      <label key={idx} className="group-item-row">
                        <input type="checkbox" checked={tempSelectedGroupMap[pendingLibraries[activeTabIndex].path]?.includes(idx)}
                          onChange={() => {
                            const path = pendingLibraries[activeTabIndex].path;
                            const current = tempSelectedGroupMap[path] || [];
                            setTempSelectedGroupMap({...tempSelectedGroupMap, [path]: current.includes(idx) ? current.filter(i => i !== idx) : [...current, idx]});
                          }}
                        />
                        <div className="group-info"><span className="group-name">{group.name}</span><span className="group-count">{group.words.length} 词</span></div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="confirm-load-btn" onClick={confirmLoadGroups}>
                  确认加载所选分组
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="input-panel">
        <div className="input-header">
          <h2 className="panel-title">单词听写表生成</h2>
          <div className="library-section">
            <div className="searchable-select">
              <div className="search-input-wrapper">
                <Book size={16} className="search-icon" /><input type="text" placeholder="🔍 选择内置词库..." value={searchTerm} onFocus={() => setIsLibraryFocused(true)} onChange={e => setSearchTerm(e.target.value)} className="search-input" />
              </div>
              {isLibraryFocused && (
                <div className="options-dropdown">
                  <div className="dropdown-header"><span>📚 词库列表</span><button onClick={handleLibraryFetch} className="finish-btn">选好了</button></div>
                  <div className="options-list">
                    {filteredOptions.map(opt => (
                      <label key={opt.path} className="library-option-row">
                        <input type="checkbox" checked={selectedPaths.includes(opt.path)} onChange={() => togglePath(opt.path)} />{opt.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {loadedLibraries.length > 0 && (
              <div className="selected-tags">
                {loadedLibraries.map(lib => (
                  <span key={lib.path} className="tag">
                    {lib.fileName}
                    <X size={12} onClick={() => removeLibrary(lib.path)} />
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="action-grid compact-actions">
            <button className="action-btn btn-primary" onClick={addWord}><Plus size={14} /><span>添加</span></button>
            <button className="action-btn btn-danger" onClick={clearWords}><Trash2 size={14} /><span>清空</span></button>
            <button className="action-btn btn-gray" onClick={() => setShowImport(true)}><FileText size={14} /><span>导入</span></button>
            <button className="action-btn btn-purple" onClick={shuffleWords}><Shuffle size={14} /><span>乱序</span></button>
          </div>

          <div className="settings-container">
            <div className="settings-row">
              <div className="row-left"><span className="setting-label">每页行数:</span><input type="number" min="1" max="50" value={wordsPerPage} onChange={e => setWordsPerPage(Math.max(1, parseInt(e.target.value) || 1))} className="setting-input" /></div>
              <div className="badges-row">
                <span className="badge badge-blue">共 {words.length} 词</span>
                <span className="badge badge-green">分 {pages.length} 页</span>
                <span className="badge badge-orange">末页 {pages.length > 0 ? pages[pages.length - 1].length : 0} 词</span>
              </div>
            </div>
            <label className="merge-label"><input type="checkbox" checked={mergeLastPage} onChange={e => setMergeLastPage(e.target.checked)} /><span>末页太少？并入上页</span></label>
          </div>
        </div>

        <div className="word-list">
          {words.map((word) => (
            <div key={word.id} className="word-item">
              <button className="remove-btn" onClick={() => removeWord(word.id)}><Trash2 size={16} /></button>
              <input type="text" placeholder="EN" value={word.en} onChange={e => updateWord(word.id, 'en', e.target.value)} />
              <input type="text" placeholder="中文" value={word.cn} onChange={e => updateWord(word.id, 'cn', e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div className="preview-panel">
        {pages.map((pageWords, pageIndex) => (
          <div key={`page-${pageIndex}`} className="a4-page">
            <div className="page-date">日期：________________</div>
            <div className="practice-title">单词听写练习单 ({pageIndex + 1})</div>
            <div className="main-content">
              <div className="practice-container">
                <div className="practice-list">
                  <div className="column-header">根据英文写出中文</div>
                  {pageWords.map((word, index) => (
                    <div key={`en-cn-${word.id}`} className="practice-item"><span className="label">{index + 1}. {word.en}</span><div className="english-grid" style={{ backgroundImage: 'none', borderBottom: '1px solid #000' }}></div></div>
                  ))}
                  {Array.from({ length: Math.max(0, wordsPerPage - pageWords.length) }).map((_, i) => (
                    <div key={`en-cn-empty-${i}`} className="practice-item"><span className="label">{pageWords.length + i + 1}. </span><div className="english-grid" style={{ backgroundImage: 'none', borderBottom: '1px solid #000' }}></div></div>
                  ))}
                </div>
                <div className="practice-list">
                  <div className="column-header">根据中文写出英文</div>
                  {pageWords.map((word, index) => (
                    <div key={`cn-en-${word.id}`} className="practice-item"><span className="label">{index + 1}. {word.cn}</span><div className="english-grid"></div></div>
                  ))}
                  {Array.from({ length: Math.max(0, wordsPerPage - pageWords.length) }).map((_, i) => (
                    <div key={`cn-en-empty-${i}`} className="practice-item"><span className="label">{pageWords.length + i + 1}. </span><div className="english-grid"></div></div>
                  ))}
                </div>
              </div>
              <div className="correction-zone">
                <div className="correction-title">订正区 (Correction Area)</div>
                <div className="correction-grid">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className="correction-row"><div className="correction-item"></div><div className="correction-item"></div></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="floating-print-btn" onClick={() => window.print()}><Printer size={20} /><span>生成 PDF</span></button>
    </div>
  );
};

export default App;
