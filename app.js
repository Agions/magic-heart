// app.js
import { languages } from './utils/i18n/languages';
import { themes } from './utils/themes/themes';

App({
  globalData: {
    currentLanguage: 'zh',
    currentTheme: 'default',
    texts: languages.zh,
    theme: themes.default,
    userInfo: null,
    settings: null
  },
  
  onLaunch: function() {
    console.log('App Launch');
    
    // 加载用户设置
    this.loadUserSettings();
    
    // 检查更新
    this.checkUpdate();
  },
  
  // 加载用户设置
  loadUserSettings: function() {
    try {
      const settings = wx.getStorageSync('gameSettings');
      if (settings) {
        // 应用语言设置
        this.globalData.currentLanguage = settings.language || 'zh';
        this.globalData.texts = languages[this.globalData.currentLanguage];
        
        // 应用主题设置
        this.globalData.currentTheme = settings.theme || 'default';
        this.globalData.theme = themes[this.globalData.currentTheme];
        
        // 应用其他设置
        this.globalData.settings = {
          soundEnabled: settings.soundEnabled !== false,
          vibrationEnabled: settings.vibrationEnabled !== false,
          bgmVolume: settings.bgmVolume || 80,
          sfxVolume: settings.sfxVolume || 100
        };
        
        // 应用主题样式
        this.applyTheme(this.globalData.theme);
      } else {
        // 使用默认设置
        this.globalData.settings = {
          soundEnabled: true,
          vibrationEnabled: true,
          bgmVolume: 80,
          sfxVolume: 100
        };
      }
    } catch (e) {
      console.error('加载用户设置失败', e);
    }
  },
  
  // 应用主题
  applyTheme: function(theme) {
    try {
      // 设置导航栏颜色
      wx.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: theme.primary
      });
      
      // 保存主题样式变量
      wx.setStorageSync('themeStyle', {
        '--primary-color': theme.primary,
        '--secondary-color': theme.secondary,
        '--background': theme.background,
        '--text-color': theme.textColor,
        '--button-glow': theme.buttonGlow,
        '--energy-bar-color': theme.energyBarColor,
        '--selected-glow': theme.selectedGlow
      });
    } catch (e) {
      console.error('应用主题失败', e);
    }
  },
  
  // 设置语言
  setLanguage: function(lang) {
    if (languages[lang]) {
      this.globalData.currentLanguage = lang;
      this.globalData.texts = languages[lang];
      
      // 更新设置
      const settings = wx.getStorageSync('gameSettings') || {};
      settings.language = lang;
      wx.setStorageSync('gameSettings', settings);
    }
  },
  
  // 检查更新
  checkUpdate: function() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      
      updateManager.onCheckForUpdate(function(res) {
        if (res.hasUpdate) {
          console.log('有新版本可用');
          
          updateManager.onUpdateReady(function() {
            wx.showModal({
              title: '更新提示',
              content: '新版本已经准备好，是否重启应用？',
              success: function(res) {
                if (res.confirm) {
                  updateManager.applyUpdate();
                }
              }
            });
          });
          
          updateManager.onUpdateFailed(function() {
            wx.showModal({
              title: '更新提示',
              content: '新版本下载失败，请检查网络后重试',
              showCancel: false
            });
          });
        }
      });
    } else {
      console.log('当前微信版本不支持自动更新');
    }
  },
  
  onShow: function() {
    console.log('App Show');
  },
  
  onHide: function() {
    console.log('App Hide');
  }
}); 