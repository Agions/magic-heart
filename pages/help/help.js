// help.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 此页面只需要简单的导航逻辑
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('帮助页面加载');
  },

  /**
   * 返回上一页
   */
  navigateBack: function() {
    wx.navigateBack();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 可以在这里记录用户查看了帮助页面
    console.log('帮助页面显示');
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    console.log('帮助页面隐藏');
  }
}); 