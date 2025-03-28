const app = getApp()

// 导入工具函数
import { checkMatchesInDirection, getAdjacentCells } from '../../utils/gameLogic';

// 音效管理器
const audioManager = {
  bgm: wx.createInnerAudioContext(),
  click: wx.createInnerAudioContext(),
  match: wx.createInnerAudioContext(),
  power: wx.createInnerAudioContext(),
  combo: wx.createInnerAudioContext(),
  levelUp: wx.createInnerAudioContext(),

  init() {
    this.bgm.src = '/assets/audio/bgm.mp3'
    this.bgm.loop = true
    this.click.src = '/assets/audio/click.mp3'
    this.match.src = '/assets/audio/match.mp3'
    this.power.src = '/assets/audio/power.mp3'
    this.combo.src = '/assets/audio/combo.mp3'
    this.levelUp.src = '/assets/audio/level_up.mp3'
  },

  playBgm() {
    this.bgm.play()
  },

  stopBgm() {
    this.bgm.stop()
  },

  playClick() {
    this.click.play()
  },

  playMatch() {
    this.match.play()
  },

  playPower() {
    this.power.play()
  },

  playCombo() {
    this.combo.play()
  },

  playLevelUp() {
    this.levelUp.play()
  }
}

Page({
  data: {
    gameStarted: false,
    menuOpen: false,
    hexCells: [],
    currentEnergy: 0,
    maxEnergy: 100,
    energyPercent: 0,
    selectedCells: [],
    score: 0,
    combo: 0,
    colorTypes: ['red', 'green', 'blue', 'yellow', 'purple', 'teal'],
    colorNames: ['红', '绿', '蓝', '黄', '紫', '青'],
    effectActive: false,
    gameLevel: 1,
    lastMoveTime: 0,
    timeoutWarning: false,
    gameIsFrozen: false,
    animationManager: null,
    isDragging: false,
    lastTouchedCell: null,
    dragStartCell: null,
    dragEndCell: null,
    isSwapping: false,
    lastCheckTime: 0,
    isChecking: false,
    isFirstLaunch: true
  },

  onLoad: function() {
    // 初始化音效
    audioManager.init()
    
    // 初始化动画管理器
    this.initAnimationManager();
    
    // 检查是否有保存的游戏进度
    this.checkSavedGame();
    
    // 初始化棋盘数据
    this.initializeHexBoard();

    // 如果是首次启动，显示主菜单
    if (this.data.isFirstLaunch) {
      this.setData({
        menuOpen: true,
        isFirstLaunch: false
      });
    }
  },

  // 初始化动画管理器
  initAnimationManager: function() {
    this.animationManager = wx.createAnimation({
      duration: 300,
      timingFunction: 'ease',
    });
  },

  // 开始游戏
  startGame: function() {
    if (this.data.gameIsFrozen) return;
    
    // 播放点击音效
    audioManager.playClick();
    
    // 开始背景音乐
    audioManager.playBgm();
    
    // 添加开始动画
    const animation = wx.createAnimation({
      duration: 500,
      timingFunction: 'ease-out',
    });
    
    animation.scale(1.1).step();
    animation.scale(1.0).step();
    
    this.setData({
      menuOpen: false,
      startAnimation: animation.export()
    });
    
    setTimeout(() => {
      this.setData({
        gameStarted: true
      });
      
      // 启动游戏计时器
      this.startGameTimer();
      
      // 触觉反馈
      if (wx.vibrateShort) {
        wx.vibrateShort({ type: 'light' });
      }
      
      // 开始时检查一次
      this.onCellOperation();
    }, 500);
  },

  // 触摸开始事件
  touchStart: function(e) {
    if (this.data.effectActive || !this.data.gameStarted) return;
    
    const id = parseInt(e.currentTarget.dataset.id);
    const row = parseInt(e.currentTarget.dataset.row);
    const col = parseInt(e.currentTarget.dataset.col);
    const type = e.currentTarget.dataset.type;
    
    this.setData({
      isDragging: true,
      dragStartCell: { id, row, col, type }
    });

    // 触觉反馈
    wx.vibrateShort({ type: 'light' });
  },

  // 触摸移动事件
  touchMove: function(e) {
    if (!this.data.isDragging || this.data.isSwapping) return;
    
    const touch = e.touches[0];
    const { clientX, clientY } = touch;
    
    wx.createSelectorQuery()
      .selectAll('.hex-cell')
      .boundingClientRect((rects) => {
        if (!rects || !Array.isArray(rects)) return;
        
        // 找到触摸点所在的格子
        const touchedRect = rects.find(rect => {
          return clientX >= rect.left && clientX <= rect.right &&
                 clientY >= rect.top && clientY <= rect.bottom;
        });
        
        if (!touchedRect || !touchedRect.dataset) return;
        
        const endId = parseInt(touchedRect.dataset.id);
        const endRow = parseInt(touchedRect.dataset.row);
        const endCol = parseInt(touchedRect.dataset.col);
        const endType = touchedRect.dataset.type;
        
        // 检查是否是相邻格子
        if (this.checkNearby(this.data.dragStartCell, { row: endRow, col: endCol })) {
          this.setData({
            dragEndCell: { id: endId, row: endRow, col: endCol, type: endType }
          });
        }
      })
      .exec();
  },

  // 触摸结束事件
  touchEnd: function() {
    if (!this.data.isDragging || this.data.isSwapping) return;
    
    const { dragStartCell, dragEndCell } = this.data;
    
    if (dragStartCell && dragEndCell && dragStartCell.id !== dragEndCell.id) {
      // 尝试交换格子
      this.trySwapCells(dragStartCell, dragEndCell);
    }
    
    this.setData({
      isDragging: false,
      dragStartCell: null,
      dragEndCell: null
    });
    
    // 检查是否有可消除的格子
    this.checkAndEliminateSameColors();
  },

  // 尝试交换格子
  trySwapCells: function(startCell, endCell) {
    if (!startCell || !endCell) return;
    
    const hexCells = [...this.data.hexCells];
    
    // 获取格子索引
    const startIndex = hexCells.findIndex(cell => cell.id === startCell.id);
    const endIndex = hexCells.findIndex(cell => cell.id === endCell.id);
    
    if (startIndex === -1 || endIndex === -1) return;
    
    // 检查是否相邻
    if (!this.checkNearby(startCell, endCell)) {
      wx.showToast({
        title: '只能交换相邻的格子',
        icon: 'none'
      });
      return;
    }
    
    // 暂时交换格子
    const tempType = hexCells[startIndex].type;
    hexCells[startIndex].type = hexCells[endIndex].type;
    hexCells[endIndex].type = tempType;
    
    this.setData({
      hexCells: hexCells,
      isSwapping: true
    });
    
    // 检查是否可以形成消除
    setTimeout(() => {
      if (!this.checkAndEliminateSameColors()) {
        // 如果不能消除，恢复原状
        hexCells[startIndex].type = startCell.type;
        hexCells[endIndex].type = endCell.type;
        
        this.setData({
          hexCells: hexCells,
          isSwapping: false
        });
        
        wx.showToast({
          title: '无法形成消除',
          icon: 'none'
        });
      } else {
        this.setData({ isSwapping: false });
      }
    }, 300);
  },

  // 查找可以消除的格子
  findMatches: function(cells) {
    const matches = new Set();
    
    // 检查每个格子的周围是否有相同颜色的格子
    cells.forEach((cell, index) => {
      const sameColorNeighbors = this.findSameColorNeighbors(cell, cells);
      
      if (sameColorNeighbors.length >= 2) {
        matches.add(cell);
        sameColorNeighbors.forEach(neighbor => matches.add(neighbor));
      }
    });
    
    return Array.from(matches);
  },

  // 查找相同颜色的相邻格子
  findSameColorNeighbors: function(cell, cells) {
    return cells.filter(other => 
      other.id !== cell.id && 
      other.type === cell.type && 
      this.checkNearby(cell, other)
    );
  },

  // 检查两个格子是否相邻
  checkNearby: function(cell1, cell2) {
    if (!cell1 || !cell2) return false;
    
    const rowDiff = Math.abs(cell1.row - cell2.row);
    const colDiff = Math.abs(cell1.col - cell2.col);
    
    // 允许上下左右相邻
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  },

  // 消除选中的格子
  eliminateCells: function(cells) {
    const hexCells = this.data.hexCells;
    const score = cells.length * 10;
    const combo = this.data.combo + 1;
    const comboBonus = Math.floor(combo * 0.5) * score;
    
    // 标记要消除的格子
    cells.forEach(cell => {
      const index = hexCells.findIndex(c => c.id === cell.id);
      if (index !== -1) {
        hexCells[index].matched = true;
        hexCells[index].selected = false;
      }
    });
    
    this.setData({
      hexCells: hexCells,
      score: this.data.score + score + comboBonus,
      combo: combo,
      selectedCells: [],
      effectActive: true
    });
    
    // 播放消除动画
    setTimeout(() => {
      this.fillEmptyCells();
    }, 500);
  },

  // 填充空格子
  fillEmptyCells: function() {
    const hexCells = this.data.hexCells;
    
    // 移除匹配的格子并填充新的
    hexCells.forEach((cell, index) => {
      if (cell.matched) {
        hexCells[index] = {
          ...cell,
          type: this.data.colorTypes[Math.floor(Math.random() * this.data.colorTypes.length)],
          matched: false,
          selected: false
        };
      }
    });
    
    this.setData({
      hexCells: hexCells,
      effectActive: false
    });
    
    // 检查是否还有可以消除的组合
    if (!this.checkPossibleMatches()) {
      this.reshuffleBoard();
    }
  },

  // 检查是否还有可以消除的组合
  checkPossibleMatches: function() {
    const hexCells = this.data.hexCells;
    
    for (let i = 0; i < hexCells.length; i++) {
      const cell = hexCells[i];
      const sameColorCells = hexCells.filter(c => 
        c.type === cell.type && 
        this.checkNearby(cell, c)
      );
      
      if (sameColorCells.length >= 2) {
        return true;
      }
    }
    
    return false;
  },

  // 重新洗牌
  reshuffleBoard: function() {
    const hexCells = this.data.hexCells;
    
    // 随机重新分配颜色
    hexCells.forEach((cell, index) => {
      hexCells[index] = {
        ...cell,
        type: this.data.colorTypes[Math.floor(Math.random() * this.data.colorTypes.length)]
      };
    });
    
    this.setData({
      hexCells: hexCells,
      combo: 0
    });
    
    wx.showToast({
      title: '棋盘已重新洗牌',
      icon: 'none'
    });
  },

  checkSavedGame: function() {
    const savedGame = wx.getStorageSync('savedGame');
    if (savedGame) {
      wx.showModal({
        title: '发现存档',
        content: '是否继续上次的游戏？',
        cancelText: '新游戏',
        confirmText: '继续',
        success: (res) => {
          if (res.confirm) {
            // 恢复游戏
            this.setData({
              hexCells: savedGame.hexCells || [],
              currentEnergy: savedGame.currentEnergy || 0,
              energyPercent: savedGame.energyPercent || 0,
              score: savedGame.score || 0,
              combo: savedGame.combo || 0,
              gameLevel: savedGame.gameLevel || 1
            });
          } else {
            // 新游戏
            this.initializeHexBoard();
          }
        }
      });
    }
  },

  // 初始化六边形棋盘
  initializeHexBoard: function() {
    const hexCells = [];
    const rows = 8;
    const cols = 5;
    let id = 0;
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        // 随机选择颜色类型索引(0-5)
        const colorIndex = Math.floor(Math.random() * this.data.colorTypes.length);
        hexCells.push({
          id: id++,
          row: i,
          col: j,
          type: this.data.colorTypes[colorIndex],
          colorIndex: colorIndex,
          selected: false,
          matched: false
        });
      }
    }
    
    this.setData({
      hexCells: hexCells,
      currentEnergy: 0,
      energyPercent: 0,
      selectedCells: [],
      score: 0,
      combo: 0,
      lastMoveTime: Date.now(),
      isDragging: false,
      lastTouchedCell: null,
      effectActive: false
    });
  },

  // 启动游戏计时器
  startGameTimer: function() {
    // 清除可能存在的旧计时器
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
    }
    
    // 每秒检查一次游戏状态
    this.gameTimer = setInterval(() => {
      const now = Date.now();
      const elapsed = now - this.data.lastMoveTime;
      
      // 如果超过20秒没有操作，给出提示
      if (elapsed > 20000 && !this.data.timeoutWarning) {
        this.setData({
          timeoutWarning: true
        });
        
        wx.showToast({
          title: '继续游戏？点击方块',
          icon: 'none',
          duration: 3000
        });
      }
      
      // 如果超过60秒没有操作，自动打开菜单
      if (elapsed > 60000) {
        this.openMenu();
        clearInterval(this.gameTimer);
      }
    }, 1000);
  },

  // 打开主菜单
  openMenu: function() {
    // 保存游戏状态
    this.saveGameState();
    
    this.setData({
      menuOpen: true,
      gameIsFrozen: true
    });
    
    setTimeout(() => {
      this.setData({
        gameIsFrozen: false
      });
    }, 1000);
    
    // 播放音效
    audioManager.playCombo();
  },

  // 保存游戏状态
  saveGameState: function() {
    try {
      const gameState = {
        hexCells: this.data.hexCells,
        currentEnergy: this.data.currentEnergy,
        energyPercent: this.data.energyPercent,
        score: this.data.score,
        combo: this.data.combo,
        gameLevel: this.data.gameLevel
      };
      
      wx.setStorageSync('savedGame', gameState);
    } catch (e) {
      console.error('保存游戏状态失败', e);
    }
  },

  // 重置游戏
  resetGame: function() {
    wx.showModal({
      title: '重置游戏',
      content: '确定要重新开始游戏吗？当前进度将丢失。',
      success: (res) => {
        if (res.confirm) {
          this.initializeHexBoard();
          
          // 播放音效
          audioManager.playCombo();
          
          wx.showToast({
            title: '游戏已重置',
            icon: 'success',
            duration: 1500
          });
        }
      }
    });
  },

  // 能量满时的提示
  notifyFullEnergy: function() {
    wx.showToast({
      title: '能量已满!可使用魔法技能',
      icon: 'none',
      duration: 2000
    });
    
    // 播放音效
    audioManager.playCombo();
  },
  
  // 检查是否还有可能的匹配
  checkForPossibleMatches: function() {
    const hexCells = this.data.hexCells;
    let hasPossibleMatch = false;
    
    // 简单检查：查找相邻的相同颜色方块
    for (let i = 0; i < hexCells.length; i++) {
      const cell = hexCells[i];
      
      // 查找所有相邻的方块
      for (let j = 0; j < hexCells.length; j++) {
        if (i !== j) {
          const neighbor = hexCells[j];
          
          if (this.isAdjacent(cell, neighbor) && cell.colorIndex === neighbor.colorIndex) {
            // 查找第三个相邻且颜色相同的方块
            for (let k = 0; k < hexCells.length; k++) {
              if (k !== i && k !== j) {
                const thirdCell = hexCells[k];
                
                if (this.isAdjacent(neighbor, thirdCell) && neighbor.colorIndex === thirdCell.colorIndex) {
                  hasPossibleMatch = true;
                  break;
                }
              }
            }
            
            if (hasPossibleMatch) break;
          }
        }
      }
      
      if (hasPossibleMatch) break;
    }
    
    // 如果没有可能的匹配，重新生成棋盘
    if (!hasPossibleMatch) {
      wx.showToast({
        title: '无可用匹配，重新生成棋盘',
        icon: 'none',
        duration: 2000
      });
      
      setTimeout(() => {
        this.initializeHexBoard();
      }, 1500);
    }
  },

  // 取消选择
  cancelSelection: function() {
    if (this.data.effectActive || this.data.selectedCells.length === 0) return;
    
    const hexCells = [...this.data.hexCells];
    
    this.data.selectedCells.forEach(selected => {
      const index = hexCells.findIndex(cell => cell.id === selected.id);
      if (index !== -1) {
        hexCells[index].selected = false;
      }
    });
    
    this.setData({
      hexCells: hexCells,
      selectedCells: [],
      combo: 0 // 取消选择重置连击
    });
    
    // 播放音效
    audioManager.playCombo();
  },

  // 使用特殊能力
  useSpecialPower: function() {
    if (this.data.effectActive || this.data.gameIsFrozen || this.data.currentEnergy < this.data.maxEnergy) return;
    
    this.setData({
      effectActive: true
    });
    
    // 播放音效
    audioManager.playCombo();
    
    // 触觉反馈-强
    if (wx.vibrateLong) {
      wx.vibrateLong();
    }
    
    wx.showToast({
      title: '释放魔法能量!',
      icon: 'success',
      duration: 1500
    });
    
    // 获取当前棋盘和选中颜色
    const hexCells = [...this.data.hexCells];
    
    // 根据游戏等级选择不同的魔法效果
    let effectDescription = '';
    
    switch (this.data.gameLevel % 3) {
      case 1: // 清除随机颜色
        const targetColorIndex = Math.floor(Math.random() * 6);
        let clearedCount = 0;
        
        hexCells.forEach((cell, index) => {
          if (cell.colorIndex === targetColorIndex) {
            const newColorIndex = (targetColorIndex + 1 + Math.floor(Math.random() * 5)) % 6;
            hexCells[index] = {
              ...cell,
              colorIndex: newColorIndex,
              type: this.data.colorTypes[newColorIndex],
              matched: true // 标记为匹配，显示动画
            };
            clearedCount++;
          }
        });
        
        effectDescription = `清除所有${this.data.colorNames[targetColorIndex]}色方块(${clearedCount}个)`;
        break;
        
      case 2: // 颜色转换
        hexCells.forEach((cell, index) => {
          const newColorIndex = (cell.colorIndex + 2) % 6;
          hexCells[index] = {
            ...cell,
            colorIndex: newColorIndex,
            type: this.data.colorTypes[newColorIndex]
          };
        });
        
        effectDescription = '转换所有方块颜色';
        break;
        
      case 0: // 随机消除一半方块
        const cellsToMatch = Math.floor(hexCells.length / 2);
        const cellIndices = Array.from({length: hexCells.length}, (_, i) => i);
        
        // 随机洗牌
        for (let i = cellIndices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [cellIndices[i], cellIndices[j]] = [cellIndices[j], cellIndices[i]];
        }
        
        // 选择前一半进行消除
        for (let i = 0; i < cellsToMatch; i++) {
          const index = cellIndices[i];
          const newColorIndex = Math.floor(Math.random() * 6);
          hexCells[index] = {
            ...hexCells[index],
            colorIndex: newColorIndex,
            type: this.data.colorTypes[newColorIndex],
            matched: true
          };
        }
        
        effectDescription = `随机消除${cellsToMatch}个方块`;
        break;
    }
    
    this.setData({
      hexCells: hexCells
    });
    
    // 延时更新
    setTimeout(() => {
      // 重置所有匹配标记
      const updatedCells = hexCells.map(cell => ({
        ...cell,
        matched: false
      }));
      
      this.setData({
        hexCells: updatedCells,
        currentEnergy: 0,
        energyPercent: 0,
        effectActive: false,
        gameLevel: this.data.gameLevel + 1
      });
      
      // 显示效果描述
      wx.showToast({
        title: effectDescription,
        icon: 'none',
        duration: 2000
      });
    }, 1000);
  },

  // 播放音效
  playSound: function(type) {
    // 在实际项目中实现不同类型音效的播放
    const audioContext = wx.createInnerAudioContext();
    
    switch(type) {
      case 'select':
        // audioContext.src = '/audio/select.mp3';
        break;
      case 'deselect':
        // audioContext.src = '/audio/deselect.mp3';
        break;
      case 'match':
        // audioContext.src = '/audio/match.mp3';
        break;
      case 'special':
        // audioContext.src = '/audio/special.mp3';
        break;
      case 'start':
        // audioContext.src = '/audio/start.mp3';
        break;
      case 'menu':
        // audioContext.src = '/audio/menu.mp3';
        break;
      case 'reset':
        // audioContext.src = '/audio/reset.mp3';
        break;
      case 'full_energy':
        // audioContext.src = '/audio/full_energy.mp3';
        break;
      case 'cancel':
        // audioContext.src = '/audio/cancel.mp3';
        break;
      default:
        return;
    }
    
    // audioContext.play();
  },

  // 打开设置
  openSettings: function() {
    if (this.data.gameIsFrozen) return;
    
    // 保存游戏状态
    this.saveGameState();
    
    wx.navigateTo({
      url: '/pages/settings/settings'
    });
  },

  // 打开商店
  openStore: function() {
    if (this.data.gameIsFrozen) return;
    
    wx.showToast({
      title: '魔法商店正在建设中',
      icon: 'none',
      duration: 2000,
      image: '../../images/buttons/store.png'
    });
  },

  // 打开好友列表
  openFriends: function() {
    if (this.data.gameIsFrozen) return;
    
    wx.showToast({
      title: '好友功能正在建设中',
      icon: 'none',
      duration: 2000,
      image: '../../images/buttons/friends.png'
    });
  },
  
  // 打开设置菜单
  openSettingsMenu: function() {
    if (this.data.gameIsFrozen) return;
    
    wx.navigateTo({
      url: '/pages/settings/settings'
    });
  },
  
  // 打开帮助菜单
  openHelpMenu: function() {
    if (this.data.gameIsFrozen) return;
    
    wx.navigateTo({
      url: '/pages/help/help'
    });
  },
  
  // 组件生命周期函数
  onUnload: function() {
    // 保存游戏状态
    this.saveGameState();
    
    // 清除计时器
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
    }
    
    // 清除音频资源
    if (audioManager) {
      if (audioManager.bgm) {
        audioManager.bgm.destroy();
      }
      Object.values(audioManager).forEach(effect => {
        if (effect) {
          effect.destroy();
        }
      });
    }
    
    // 重置数据
    this.setData({
      hexCells: [],
      selectedCells: [],
      dragStartCell: null,
      dragEndCell: null,
      isSwapping: false,
      isDragging: false,
      effectActive: false,
      isChecking: false
    });
  },
  
  onHide: function() {
    // 保存游戏状态
    this.saveGameState();
    
    // 暂停背景音乐
    if (audioManager && audioManager.bgm) {
      audioManager.bgm.pause();
    }
    
    // 清除计时器
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
    }
  },
  
  onShow: function() {
    // 恢复背景音乐
    if (this.data.gameStarted && !this.data.menuOpen && audioManager && audioManager.bgm) {
      audioManager.bgm.play();
    }
    
    // 恢复计时器
    if (this.data.gameStarted && !this.data.menuOpen) {
      this.startGameTimer();
    }
  },

  // 填充新的格子
  fillNewCells: function() {
    const hexCells = [...this.data.hexCells];
    const rows = 8;
    const cols = 5;
    let hasMatched = false;
    
    // 标记所有已匹配的格子
    hexCells.forEach((cell, index) => {
      if (cell.matched) {
        hasMatched = true;
        // 生成新的随机颜色
        const newColorIndex = Math.floor(Math.random() * 6);
        hexCells[index] = {
          ...cell,
          colorIndex: newColorIndex,
          type: this.data.colorTypes[newColorIndex],
          matched: false,
          selected: false
        };
      }
    });
    
    if (hasMatched) {
      this.setData({
        hexCells: hexCells
      });
      
      // 检查是否还有可能的匹配
      setTimeout(() => {
        this.checkForPossibleMatches();
      }, 500);
    }
  },

  // 检查两个格子是否相邻
  isAdjacent: function(cell1, cell2) {
    // 获取两个格子的行列差值
    const rowDiff = Math.abs(cell1.row - cell2.row);
    const colDiff = Math.abs(cell1.col - cell2.col);
    
    // 同一行的情况
    if (rowDiff === 0 && colDiff === 1) {
      return true;
    }
    
    // 相邻行的情况
    if (rowDiff === 1) {
      // 奇数行和偶数行的相邻规则不同
      const isOddRow = cell1.row % 2 === 1;
      if (isOddRow) {
        // 奇数行的格子，右上和右下的格子列号相同
        return cell1.col === cell2.col || cell1.col === cell2.col - 1;
      } else {
        // 偶数行的格子，左上和左下的格子列号相同
        return cell1.col === cell2.col || cell1.col === cell2.col + 1;
      }
    }
    
    return false;
  },

  // 执行消除动画
  eliminateCells: function(selectedCells) {
    const hexCells = this.data.hexCells;
    
    // 标记匹配的格子
    selectedCells.forEach(cell => {
      const index = hexCells.findIndex(c => c.id === cell.id);
      if (index !== -1) {
        hexCells[index].matched = true;
        hexCells[index].selected = false;
      }
    });
    
    // 更新分数和连击
    const matchScore = selectedCells.length * 10 * (this.data.combo + 1);
    const newCombo = this.data.combo + 1;
    const newEnergy = Math.min(this.data.currentEnergy + selectedCells.length * 5, this.data.maxEnergy);
    
    // 显示得分动画
    wx.showToast({
      title: `+${matchScore}分 ${newCombo > 1 ? '连击x' + newCombo : ''}`,
      icon: 'none',
      duration: 1000
    });
    
    this.setData({
      hexCells: hexCells,
      selectedCells: [],
      score: this.data.score + matchScore,
      combo: newCombo,
      currentEnergy: newEnergy,
      energyPercent: (newEnergy / this.data.maxEnergy) * 100,
      effectActive: true
    });
    
    // 播放消除音效
    if (audioManager && audioManager.effects.match) {
      audioManager.effects.match.play();
    }
    
    // 触觉反馈
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'medium' });
    }
    
    // 延迟后填充新的格子
    setTimeout(() => {
      this.fillNewCells();
      this.setData({ effectActive: false });
    }, 300);
  },

  // 检查并消除相同颜色的格子
  checkAndEliminateSameColors: function() {
    if (this.data.isChecking) return;
    this.setData({ isChecking: true });
    
    const cells = this.data.hexCells;
    const visited = new Set();
    const groups = [];
    
    // 查找相同颜色的组
    for (let i = 0; i < cells.length; i++) {
      if (visited.has(i)) continue;
      const cell = cells[i];
      const group = this.findSameColorGroup(i, cell.type, visited);
      if (group.length >= 3) {
        groups.push(group);
      }
    }
    
    // 如果找到可消除的组
    if (groups.length > 0) {
      let newScore = this.data.score;
      let combo = this.data.combo;
      
      // 处理所有可消除的组
      groups.forEach(group => {
        // 计算分数
        const baseScore = group.length * 10;
        const comboBonus = Math.floor(combo * 0.5);
        newScore += baseScore + comboBonus;
        combo++;
        
        // 标记要消除的格子
        group.forEach(index => {
          cells[index].matched = true;
        });
      });
      
      this.setData({
        hexCells: cells,
        score: newScore,
        combo: combo
      });
      
      // 播放消除动画
      setTimeout(() => {
        this.eliminateMatchedCells();
      }, 500);
      
      return true;
    }
    
    this.setData({ 
      isChecking: false,
      combo: 0  // 重置连击
    });
    return false;
  },

  // 查找相同颜色的组
  findSameColorGroup: function(startIndex, color, visited) {
    const group = [];
    const queue = [startIndex];
    visited.add(startIndex);
    
    while (queue.length > 0) {
      const currentIndex = queue.shift();
      group.push(currentIndex);
      
      // 获取相邻的格子
      const neighbors = this.getNeighbors(currentIndex);
      
      for (const neighborIndex of neighbors) {
        if (!visited.has(neighborIndex) && 
            this.data.hexCells[neighborIndex].type === color) {
          visited.add(neighborIndex);
          queue.push(neighborIndex);
        }
      }
    }
    
    return group;
  },

  // 获取相邻格子的索引
  getNeighbors: function(index) {
    const cells = this.data.hexCells;
    const row = Math.floor(index / 5);
    const col = index % 5;
    const neighbors = [];
    
    // 定义可能的相邻位置
    const directions = [
      [-1, 0], // 上
      [1, 0],  // 下
      [0, -1], // 左
      [0, 1],  // 右
    ];
    
    for (const [dx, dy] of directions) {
      const newRow = row + dx;
      const newCol = col + dy;
      
      if (newRow >= 0 && newRow < 6 && newCol >= 0 && newCol < 5) {
        const neighborIndex = newRow * 5 + newCol;
        if (neighborIndex >= 0 && neighborIndex < cells.length) {
          neighbors.push(neighborIndex);
        }
      }
    }
    
    return neighbors;
  },

  // 消除匹配的格子并填充新的
  eliminateMatchedCells: function() {
    const cells = this.data.hexCells;
    const colors = ['red', 'blue', 'green', 'yellow', 'purple'];
    
    // 创建粒子效果
    this.createParticles();
    
    // 移除匹配的格子
    for (let i = cells.length - 1; i >= 0; i--) {
      if (cells[i].matched) {
        // 播放消除音效
        this.playEliminateSound();
        
        // 显示分数增加效果
        this.showScoreAdd(cells[i], 10);
        
        // 从当前位置向上移动格子
        for (let j = i; j >= 5; j -= 5) {
          cells[j].type = cells[j - 5].type;
          cells[j].matched = cells[j - 5].matched;
        }
        // 在顶部生成新的格子
        const topRow = i % 5;
        cells[topRow].type = colors[Math.floor(Math.random() * colors.length)];
        cells[topRow].matched = false;
        cells[topRow].isNew = true; // 标记为新格子
      }
    }
    
    this.setData({
      hexCells: cells,
      isChecking: false
    }, () => {
      // 移除新格子标记
      setTimeout(() => {
        cells.forEach(cell => {
          if (cell.isNew) {
            cell.isNew = false;
          }
        });
        this.setData({ hexCells: cells });
      }, 300);
      
      // 检查是否还有可以消除的格子
      setTimeout(() => {
        if (this.checkAndEliminateSameColors()) {
          // 如果还有可消除的，继续消除
          this.showComboEffect();
        }
      }, 300);
    });
  },

  // 创建粒子效果
  createParticles: function() {
    const container = this.selectComponent('.particle-container');
    if (!container) return;
    
    const particleCount = 20;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('view');
      particle.className = 'particle';
      
      // 随机位置和颜色
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const hue = Math.random() * 360;
      
      particle.style.left = `${x}%`;
      particle.style.top = `${y}%`;
      particle.style.backgroundColor = `hsl(${hue}, 100%, 70%)`;
      
      // 随机动画
      const duration = 0.5 + Math.random() * 0.5;
      const delay = Math.random() * 0.2;
      const scale = 0.5 + Math.random() * 0.5;
      
      particle.style.animation = `
        particle-fade ${duration}s ease-out ${delay}s forwards,
        particle-move ${duration}s ease-out ${delay}s forwards
      `;
      
      particles.push(particle);
      container.appendChild(particle);
    }
    
    // 清理粒子
    setTimeout(() => {
      particles.forEach(particle => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
    }, 1000);
  },

  // 显示分数增加效果
  showScoreAdd: function(cell, score) {
    const scoreAdd = document.createElement('view');
    scoreAdd.className = 'score-add';
    scoreAdd.textContent = `+${score}`;
    
    // 获取格子位置
    wx.createSelectorQuery()
      .select(`#cell-${cell.id}`)
      .boundingClientRect((rect) => {
        if (!rect) return;
        
        scoreAdd.style.left = `${rect.left + rect.width / 2}px`;
        scoreAdd.style.top = `${rect.top}px`;
        
        document.body.appendChild(scoreAdd);
        
        // 动画结束后移除元素
        setTimeout(() => {
          if (scoreAdd.parentNode) {
            scoreAdd.parentNode.removeChild(scoreAdd);
          }
        }, 1000);
      })
      .exec();
  },

  // 显示连击效果
  showComboEffect: function() {
    const combo = this.data.combo;
    if (combo <= 1) return;
    
    const comboDisplay = this.selectComponent('.combo-display');
    if (!comboDisplay) return;
    
    comboDisplay.setData({
      text: `${combo} 连击！`,
      active: true
    });
    
    setTimeout(() => {
      comboDisplay.setData({ active: false });
    }, 500);
  },

  // 播放消除音效
  playEliminateSound: function() {
    if (audioManager && audioManager.effects.match) {
      audioManager.effects.match.play();
    }
  },

  // 在游戏中的各个事件处理函数中添加音效
  handleCellTap(e) {
    audioManager.playClick();
    // ... existing code ...
  },

  handleMatch() {
    audioManager.playMatch();
    // ... existing code ...
  },

  handleCombo() {
    audioManager.playCombo();
    // ... existing code ...
  },

  handleLevelUp() {
    audioManager.playLevelUp();
    // ... existing code ...
  },

  handlePowerUsed() {
    audioManager.playPower();
    // ... existing code ...
  }
}); 