Page({
  data: {
    input: '',
    todoDate: '',
    todayDate: '', // 今日日期（用于日期选择器）
    todayTodos: [], // 今日待办
    futureTodos: [], // 未来待办
    leftCount: 0, // 未完成总数
    allCompleted: false, // 今日全选状态
    logs: [] // 操作日志
  },

  // 页面显示时执行
  onShow: function () {
    wx.setNavigationBarTitle({
      title: '待办清单'
    })
    // 重新分类待办（避免切换页面后数据异常）
    this.classifyTodosByDate([...this.data.todayTodos, ...this.data.futureTodos])
  },

  // 保存数据到本地缓存
  save: function () {
    const allTodos = [...this.data.todayTodos, ...this.data.futureTodos]
    wx.setStorageSync('todo_list', allTodos)
    wx.setStorageSync('todo_logs', this.data.logs)
  },

  // 从本地缓存加载数据
  load: function () {
    const todos = wx.getStorageSync('todo_list') || []
    const logs = wx.getStorageSync('todo_logs') || []
    const today = this.getTodayDate()
    
    // 格式化待办（补全缺失的日期）
    const formatTodos = todos.map(item => {
      if (!item.date) item.date = today
      return item
    })

    this.setData({
      logs: logs,
      todayDate: today,
      todoDate: today
    })
    
    // 分类待办
    this.classifyTodosByDate(formatTodos)
    // 计算未完成数
    this.calcLeftCount()
  },

  // 页面加载时执行
  onLoad: function () {
    this.load()
  },

  // 获取今日日期（格式：YYYY-MM-DD）
  getTodayDate: function() {
    const date = new Date()
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  },

  // 按日期分类待办（今日/未来）
  classifyTodosByDate: function(todos) {
    const today = this.getTodayDate()
    const todayTodos = []
    const futureTodos = []
    
    // 兼容未传参的情况
    const targetTodos = todos || []
    
    targetTodos.forEach(item => {
      if (item.date === today) {
        todayTodos.push(item)
      } else if (item.date > today) {
        futureTodos.push(item)
      }
    })

    // 倒序显示（最新添加的在最上面）
    todayTodos.reverse()
    futureTodos.reverse()
    
    this.setData({ 
      todayTodos, 
      futureTodos 
    })
  },

  // 计算未完成待办总数
  calcLeftCount: function() {
    const allTodos = [...this.data.todayTodos, ...this.data.futureTodos]
    const leftCount = allTodos.filter(item => !item.completed).length
    this.setData({ leftCount })
  },

  // 日期选择器改变事件
  bindDateChange: function(e) {
    this.setData({ todoDate: e.detail.value })
  },

  // 输入框内容改变事件
  inputChangeHandle: function (e) {
    this.setData({ input: e.detail.value })
  },

  // 添加待办事件
  addTodoHandle: function (e) {
    const inputVal = this.data.input.trim()
    // 空输入拦截
    if (!inputVal) {
      wx.showToast({
        title: '请输入任务内容',
        icon: 'none',
        duration: 1500
      })
      return
    }

    const { todoDate, todayTodos, futureTodos } = this.data
    // 新建待办项
    const newTodo = {
      name: inputVal,
      completed: false,
      date: todoDate,
      id: Date.now() // 用时间戳做唯一ID
    }

    // 深拷贝数组（避免修改原数组引用）
    let newTodayTodos = [...todayTodos]
    let newFutureTodos = [...futureTodos]

    // 判断添加到今日/未来待办
    if (todoDate === this.getTodayDate()) {
      newTodayTodos.unshift(newTodo)
    } else {
      newFutureTodos.unshift(newTodo)
    }

    // 记录操作日志
    const logs = [...this.data.logs, {
      timestamp: new Date(),
      action: 'Add',
      name: inputVal
    }]

    // 更新数据
    this.setData({
      input: '', // 清空输入框
      todayTodos: newTodayTodos,
      futureTodos: newFutureTodos,
      logs: logs
    })

    // 计算未完成数 + 保存数据
    this.calcLeftCount()
    this.save()

    // 操作成功提示
    wx.showToast({
      title: '添加成功',
      icon: 'success',
      duration: 1000
    })
  },

  // 切换待办完成状态
  toggleTodoHandle: function (e) {
    const { type, index } = e.currentTarget.dataset
    const { todayTodos, futureTodos } = this.data

    // 深拷贝数组（避免修改原数组）
    let todos = type === 'today' ? [...todayTodos] : [...futureTodos]
    // 切换完成状态
    todos[index].completed = !todos[index].completed

    // 记录操作日志
    const logs = [...this.data.logs, {
      timestamp: new Date(),
      action: todos[index].completed ? 'Finish' : 'Restart',
      name: todos[index].name
    }]

    // 更新数据
    this.setData({
      [type === 'today' ? 'todayTodos' : 'futureTodos']: todos,
      logs: logs
    })

    // 计算未完成数 + 保存数据
    this.calcLeftCount()
    this.save()
  },

  // 删除待办
  removeTodoHandle: function (e) {
    const { type, index } = e.currentTarget.dataset
    const { todayTodos, futureTodos } = this.data

    // 深拷贝数组
    let todos = type === 'today' ? [...todayTodos] : [...futureTodos]
    // 删除指定待办
    const removeItem = todos.splice(index, 1)[0]

    // 记录操作日志
    const logs = [...this.data.logs, {
      timestamp: new Date(),
      action: 'Remove',
      name: removeItem.name
    }]

    // 更新数据
    this.setData({
      [type === 'today' ? 'todayTodos' : 'futureTodos']: todos,
      logs: logs
    })

    // 计算未完成数 + 保存数据
    this.calcLeftCount()
    this.save()

    // 操作成功提示
    wx.showToast({
      title: '删除成功',
      icon: 'none',
      duration: 1000
    })
  },

  // 今日待办全选/取消全选
  toggleAllHandle: function (e) {
    const newAllCompleted = !this.data.allCompleted
    // 深拷贝今日待办
    let todayTodos = [...this.data.todayTodos]
    
    // 切换所有今日待办的完成状态
    todayTodos.forEach(item => {
      item.completed = newAllCompleted
    })

    // 记录操作日志
    const logs = [...this.data.logs, {
      timestamp: new Date(),
      action: newAllCompleted ? 'Finish' : 'Restart',
      name: '今日所有待办'
    }]

    // 更新数据
    this.setData({
      todayTodos: todayTodos,
      allCompleted: newAllCompleted,
      logs: logs
    })

    // 计算未完成数 + 保存数据
    this.calcLeftCount()
    this.save()

    // 震动反馈
    wx.vibrateShort()
  },

  // 清除已完成待办
  clearCompletedHandle: function (e) {
    // 过滤出未完成的待办
    let todayTodos = [...this.data.todayTodos].filter(item => !item.completed)
    let futureTodos = [...this.data.futureTodos].filter(item => !item.completed)

    // 记录操作日志
    const logs = [...this.data.logs, {
      timestamp: new Date(),
      action: 'Clear',
      name: '已完成待办'
    }]

    // 先显示提示（避免页面晃动）
    wx.showToast({
      title: '已清除已完成任务',
      icon: 'none',
      duration: 1500,
      mask: true,
      success: () => {
        // 延迟更新数据（避开提示显示的视觉窗口期）
        setTimeout(() => {
          this.setData({
            todayTodos,
            futureTodos,
            logs: logs
          })
          this.calcLeftCount()
          this.save()
          wx.vibrateShort()
        }, 200)
      }
    })
  },

  // 分享到好友
  onShareAppMessage: function (res) {
    if (res.from === 'button') {
      return {
        title: '管理时间，保持专注！让自律成为习惯！',
        path: '/pages/todos/todos'
      }
    }
  },

  // 分享到朋友圈
  onShareTimeline: function (res) {
    return {
      title: '管理时间，保持专注，让自律成为习惯！',
      query: {}
    }
  }
})