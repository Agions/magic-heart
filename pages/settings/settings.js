// settings.js
import { languages } from '../../utils/i18n/languages';
import { themes } from '../../utils/themes/themes';

const app = getApp()

Page({
  data: {
    texts: {
      language: '语言设置',
      currentLanguage: '当前语言',
      theme: '主题设置',
      currentTheme: '当前主题',
      sound: '音效设置',
      bgmVolume: '背景音乐',
      sfxVolume: '音效音量',
      save: '保存设置',
      reset: '重置设置'
    },
    languages: [
      { code: 'zh', name: '简体中文' },
      { code: 'en', name: 'English' }
    ],
    themes: [
      { code: 'default', name: '默认主题' },
      { code: 'dark', name: '暗夜主题' },
      { code: 'light', name: '明亮主题' }
    ],
    languageIndex: 0,
    themeIndex: 0,
    bgmVolume: 50,
    sfxVolume: 50,
    soundEnabled: true
  },

  onLoad: function() {
    // 从本地存储加载设置
    const settings = wx.getStorageSync('settings') || {};
    this.setData({
      languageIndex: settings.languageIndex || 0,
      themeIndex: settings.themeIndex || 0,
      bgmVolume: settings.bgmVolume || 50,
      sfxVolume: settings.sfxVolume || 50,
      soundEnabled: settings.soundEnabled !== false
    });
  },

  onLanguageChange: function(e) {
    this.setData({
      languageIndex: e.detail.value
    });
  },

  onThemeChange: function(e) {
    this.setData({
      themeIndex: e.detail.value
    });
  },

  onBGMVolumeChange: function(e) {
    this.setData({
      bgmVolume: e.detail.value
    });
  },

  onSFXVolumeChange: function(e) {
    this.setData({
      sfxVolume: e.detail.value
    });
  },

  saveSettings: function() {
    const settings = {
      languageIndex: this.data.languageIndex,
      themeIndex: this.data.themeIndex,
      bgmVolume: this.data.bgmVolume,
      sfxVolume: this.data.sfxVolume,
      soundEnabled: this.data.soundEnabled
    };

    wx.setStorageSync('settings', settings);
    wx.showToast({
      title: '设置已保存',
      icon: 'success'
    });
  },

  resetSettings: function() {
    this.setData({
      languageIndex: 0,
      themeIndex: 0,
      bgmVolume: 50,
      sfxVolume: 50,
      soundEnabled: true
    });

    wx.removeStorageSync('settings');
    wx.showToast({
      title: '设置已重置',
      icon: 'success'
    });
  },

  // 切换语言
  changeLanguage: function(e) {
    const lang = e.detail.value;
    this.setData({
      languageIndex: this.data.languages.findIndex(item => item.code === lang),
      texts: languages[lang]
    });
    
    // 保存设置
    this.saveSettings();
    
    // 通知应用更新语言
    app.globalData.currentLanguage = lang;
    app.globalData.texts = languages[lang];
  },

  // 切换主题
  changeTheme: function(e) {
    const theme = e.detail.value;
    this.setData({
      themeIndex: this.data.themes.findIndex(item => item.code === theme),
      texts: languages[theme]
    });
    
    // 保存设置
    this.saveSettings();
    
    // 通知应用更新主题
    app.globalData.currentTheme = theme;
    app.globalData.theme = themes[theme];
    
    // 应用主题
    this.applyTheme(theme);
  },

  // 应用主题
  applyTheme: function(themeName) {
    const theme = themes[themeName];
    
    // 设置页面样式
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: theme.primary
    });
    
    // 更新全局样式变量
    this.updateGlobalStyle(theme);
  },

  // 更新全局样式变量
  updateGlobalStyle: function(theme) {
    wx.setStorageSync('themeStyle', {
      '--primary-color': theme.primary,
      '--secondary-color': theme.secondary,
      '--background': theme.background,
      '--text-color': theme.textColor,
      '--button-glow': theme.buttonGlow,
      '--energy-bar-color': theme.energyBarColor,
      '--selected-glow': theme.selectedGlow
    });
  },

  // 切换音效
  toggleSound: function(e) {
    this.setData({
      soundEnabled: e.detail.value
    });
    this.saveSettings();
  },

  // 切换振动
  toggleVibration: function(e) {
    this.setData({
      vibrationEnabled: e.detail.value
    });
    this.saveSettings();
  },

  // 重置游戏进度
  resetProgress: function() {
    wx.showModal({
      title: '重置进度',
      content: '确定要重置所有游戏进度吗？这将清除您的所有关卡进度和解锁状态。',
      confirmText: '重置',
      confirmColor: '#d63031',
      success: (res) => {
        if (res.confirm) {
          // 重置游戏进度
          app.globalData.gameProgress = {
            level: 1,
            score: 0,
            unlockedCards: ['basic']
          };
          
          // 保存到存储
          wx.setStorageSync('gameProgress', app.globalData.gameProgress);
          
          wx.showToast({
            title: '游戏进度已重置',
            icon: 'success',
            duration: 2000
          });
        }
      }
    });
  },

  // 导出用户数据
  exportUserData: function() {
    const userData = {
      theme: app.globalData.theme,
      audio: app.globalData.audio,
      language: app.globalData.language,
      gameSettings: app.globalData.gameSettings,
      gameProgress: app.globalData.gameProgress,
      exportDate: new Date().toISOString()
    };
    
    // 将数据转换为字符串
    const userDataString = JSON.stringify(userData);
    
    // 复制到剪贴板
    wx.setClipboardData({
      data: userDataString,
      success: () => {
        wx.showToast({
          title: '数据已复制到剪贴板',
          icon: 'success',
          duration: 2000
        });
      }
    });
  },

  // 返回上一页
  navigateBack: function() {
    wx.navigateBack();
  }
}); 