Page({
  data: {
    currentTime: '12:35',
    workOptions: [25, 30, 45],
    breakOptions: [5, 10, 15],
    selectedWork: 25,
    selectedBreak: 5,
    mode: 'work',
    tomatoCount: 0,
    timerRunning: false,
    secondsLeft: 25 * 60,
    timerMinutes: '25',
    timerSeconds: '00',
    timerStateText: '准备开始',
    currentTab: 'focus',
    intervalId: null,
    timeUpdateInterval: null,
    // 新增自定义时间相关状态
    showWorkCustom: false,
    showBreakCustom: false,
    customWorkValue: '',
    customBreakValue: ''
  },
  

  onLoad() {
    this.updateTimerDisplay();
    this.updateCurrentTime();
    // 每分钟更新一次状态栏时间
    this.setData({
      timeUpdateInterval: setInterval(() => {
        this.updateCurrentTime();
      }, 60000)
    });
  },

  onUnload() {
    this.clearTimer();
    if (this.data.timeUpdateInterval) {
      clearInterval(this.data.timeUpdateInterval);
    }
  },

  // 更新当前时间
  updateCurrentTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    this.setData({ currentTime: `${hours}:${minutes}` });
  },

  // 根据secondsLeft更新显示
  updateTimerDisplay() {
    const { secondsLeft, mode, timerRunning, selectedWork, selectedBreak } = this.data;
    const mins = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
    const secs = Math.floor(secondsLeft % 60).toString().padStart(2, '0');
    const total = mode === 'work' ? selectedWork * 60 : selectedBreak * 60;

    let state = '';
    if (timerRunning) {
      state = mode === 'work' ? '专注中' : '休息中';
    } else {
      state = (secondsLeft === total) ? '准备开始' : '已暂停';
    }

    this.setData({
      timerMinutes: mins,
      timerSeconds: secs,
      timerStateText: state
    });
  },

  // 清除计时器
  clearTimer() {
    if (this.data.intervalId) {
      clearInterval(this.data.intervalId);
      this.setData({ intervalId: null });
    }
  },

  // 开始倒计时（总是重新启动一个新的定时器）
  startTimer() {
    // 如果已有定时器，先清除
    this.clearTimer();
    this.setData({ timerRunning: true });
    this.updateTimerDisplay();

    const intervalId = setInterval(() => {
      let { secondsLeft, mode } = this.data;
      secondsLeft -= 1;
      this.setData({ secondsLeft });
      this.updateTimerDisplay();

      // 倒计时结束
      if (secondsLeft <= 0) {
        this.clearTimer(); // 停止当前定时器

        if (mode === 'work') {
          // 工作结束：番茄数+1，切换到休息
          this.setData({
            tomatoCount: this.data.tomatoCount + 1,
            mode: 'break',
            secondsLeft: this.data.selectedBreak * 60
          });
        } else {
          // 休息结束：切换到工作
          this.setData({
            mode: 'work',
            secondsLeft: this.data.selectedWork * 60
          });
        }
        // 自动开始下一阶段（继续计时）
        this.startTimer(); // 重新开启新定时器
        this.updateTimerDisplay();
      }
    }, 1000);

    this.setData({ intervalId });
  },

  // 暂停
  pauseTimer() {
    this.clearTimer();
    this.setData({ timerRunning: false });
    this.updateTimerDisplay();
  },

  // 重置为当前模式的完整时长
  resetToCurrentMode() {
    const { mode, selectedWork, selectedBreak } = this.data;
    const secondsLeft = mode === 'work' ? selectedWork * 60 : selectedBreak * 60;
    this.setData({ secondsLeft });
    this.updateTimerDisplay();
  },

  // 事件：开始/暂停
  onStartPause() {
    if (this.data.timerRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  },

  // 重置
  onReset() {
    this.pauseTimer();
    this.resetToCurrentMode();
  },

  // 选择工作时长
  onSelectWork(e) {
    const value = e.currentTarget.dataset.value;
    if (value === this.data.selectedWork) return;

    this.setData({ selectedWork: value });
    if (this.data.mode === 'work') {
      this.pauseTimer();
      this.setData({ secondsLeft: value * 60 });
      this.updateTimerDisplay();
    }
  },

  // 选择休息时长
  onSelectBreak(e) {
    const value = e.currentTarget.dataset.value;
    if (value === this.data.selectedBreak) return;

    this.setData({ selectedBreak: value });
    if (this.data.mode === 'break') {
      this.pauseTimer();
      this.setData({ secondsLeft: value * 60 });
      this.updateTimerDisplay();
    }
  },

  // 显示工作时长自定义输入框
  showWorkCustomInput() {
    this.setData({
      showWorkCustom: true,
      showBreakCustom: false,  // 确保只显示一个自定义输入
      customWorkValue: this.data.selectedWork.toString()
    });
  },

  // 显示休息时长自定义输入框
  showBreakCustomInput() {
    this.setData({
      showBreakCustom: true,
      showWorkCustom: false,   // 确保只显示一个自定义输入
      customBreakValue: this.data.selectedBreak.toString()
    });
  },

  // 处理工作时长输入
  onWorkCustomInput(e) {
    this.setData({ customWorkValue: e.detail.value });
  },

  // 处理休息时长输入
  onBreakCustomInput(e) {
    this.setData({ customBreakValue: e.detail.value });
  },

  // 确认自定义工作时长
  confirmWorkCustom() {
    const value = parseInt(this.data.customWorkValue);
    if (!isNaN(value) && value > 0 && value <= 120) {
      this.setData({
        selectedWork: value,
        showWorkCustom: false,
        secondsLeft: this.data.mode === 'work' ? value * 60 : this.data.secondsLeft
      });
      this.updateTimerDisplay();
    } else {
      wx.showToast({ title: '请输入1-120的整数', icon: 'none' });
    }
  },

  // 确认自定义休息时长
  confirmBreakCustom() {
    const value = parseInt(this.data.customBreakValue);
    if (!isNaN(value) && value > 0 && value <= 60) {
      this.setData({
        selectedBreak: value,
        showBreakCustom: false,
        secondsLeft: this.data.mode === 'break' ? value * 60 : this.data.secondsLeft
      });
      this.updateTimerDisplay();
    } else {
      wx.showToast({ title: '请输入1-60的整数', icon: 'none' });
    }
  },

  // 取消自定义
  cancelCustom() {
    this.setData({
      showWorkCustom: false,
      showBreakCustom: false
    });
  }

});