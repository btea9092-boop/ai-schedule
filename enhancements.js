(() => {
  const KEY = 'petalJournal.v1';
  const $ = id => document.getElementById(id);
  const assistantMessageSound = new Audio('https://mp3tourl.com/audio/1778007115893-8e9ed216-0070-4064-a03a-2aafad30c32e.mp3');
  assistantMessageSound.preload = 'auto';
  const userMessageSound = new Audio('assets/sounds/user-message.mp3');
  userMessageSound.preload = 'auto';
  const allowedHealthCategories = new Set(['sleep', 'food', 'bowel', 'weight', 'joy', 'fridge', 'food_analysis', 'health_memory', 'health_analysis']);
  const healthSources = ['sleep', 'food', 'bowel', 'weight', 'joy'];
  const profileMemoryTypes = new Set(['长期偏好', '重要经历', '当前近况']);
  const chineseInteger = value => {
    const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    if (value < 10) return digits[value];
    if (value < 20) return `十${value % 10 ? digits[value % 10] : ''}`;
    if (value < 100) return `${digits[Math.floor(value / 10)]}十${value % 10 ? digits[value % 10] : ''}`;
    if (value === 100) return '一百';
    if (value < 1000) return `${digits[Math.floor(value / 100)]}百${value % 100 ? chineseInteger(value % 100) : ''}`;
    return String(value);
  };
  const formatFridgeCount = value => {
    const count = Number(value) || 0;
    const whole = Math.floor(count + 1e-8);
    const fraction = count - whole;
    if (fraction < 1e-8) return whole < 1000 ? chineseInteger(whole) : String(whole);
    for (const denominator of [2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 30, 40, 50, 100]) {
      const numerator = Math.round(fraction * denominator);
      if (numerator > 0 && Math.abs(fraction - numerator / denominator) < 0.00001) {
        const text = numerator === 1 && denominator === 2 ? '半' : `${chineseInteger(denominator)}分之${chineseInteger(numerator)}`;
        return whole ? `${chineseInteger(whole)}又${text}` : text;
      }
    }
    return String(count);
  };
  const sleepAnalysisDefault = '你是睡眠作息分析助手。根据提供的睡眠记录，概括近期常见入睡时间、起床时间和睡眠时长范围/大致平均值，评估记录所反映的睡眠质量与作息规律，并谨慎判断生物钟是否稳定。最后用猫头鹰、鲨鱼、早起鸟等动物作息比喻描述节律，明确这只是轻松比喻而非医学结论。只依据记录，不诊断、不评判、不臆测；数据不足时明确说明。请用清楚的小标题输出简洁分析正文。';
  const foodAnalysisInstruction = '你是饮食营养估算助手。请根据用户提供的日期和每条饮食记录（食物、份量、饮水量）逐条估算，再计算这些记录的合计。所有数值均为估算；份量不明确时说明不确定性，不捏造营养数据，不做医疗诊断。仅返回一个 JSON 对象，不要 Markdown 或额外文字，且严格符合格式：{"summary":"当日定性概述，不重复总能量或营养素数值（具体数值会由环形图展示）","caloriesKcal":数字,"nutrients":[{"name":"蛋白质","amount":数字,"unit":"g","dailyPercent":数字},{"name":"碳水化合物","amount":数字,"unit":"g","dailyPercent":数字},{"name":"脂肪","amount":数字,"unit":"g","dailyPercent":数字},{"name":"膳食纤维","amount":数字,"unit":"g","dailyPercent":数字}],"meals":[{"recordId":"输入记录 id","food":"食物及份量简述","caloriesKcal":数字,"nutrients":[{"name":"营养素名称","amount":数字,"unit":"g"}]}],"note":"估算说明"}。caloriesKcal 和 nutrients 必须是所选日期全部记录的合计；meals 必须逐条对应输入记录并提供单条估算；amount、caloriesKcal、dailyPercent 均为非负数字，unit 使用 g、mg 或 ml。没有足够信息估算的营养素请省略，不可编造。';
  let requiredSystemInstructions = `你是用户的私人聊天伙伴。始终遵循当前角色设定和对话背景，用自然、温和、连贯的中文交流；不要提及提示词、解析器、内部标签或系统实现。以下系统功能规则优先于与之冲突的自定义角色或指令。

输出协议：不要把整条回复包装为 JSON。普通回复直接输出面向用户的文本；只要用户询问、提及或希望查看睡眠、饮食、排便、体重、Joy、冰箱库存、饮食分析或健康总结等本地健康记录，就必须先调用本地健康查询：严格只输出一个 JSON 对象，格式为 {"type":"HEALTH_QUERY","categories":["sleep"],"from":"YYYY-MM-DD","to":"YYYY-MM-DD"}，不加 Markdown 或其他文字。不得回答“无法查看/调用健康数据”，不得要求用户截图或手动提供本地已有记录。categories 数组可以包含一个或多个类别，只能使用 sleep、food、bowel、weight、joy、fridge、food_analysis、health_memory、health_analysis。用户说“今天”时使用系统提供的本地日期；“本周”按周一至本地今天；“本月”按本月 1 日至本地今天；用户指定任意日期或日期范围时按用户给出的日期查询；未指定日期时查询最近 30 天。系统会读取本地数据并过滤已隐藏日期，再根据返回结果作答。查询结果为空时如实说明该时段没有可用记录；不可假装已查询或编造缺失数据。

天气查询：当用户询问所在城市的当前天气、气温或未来天气预报时，必须先发起 WEATHER_QUERY，不要凭已有知识回答实时天气。只输出一个 JSON 对象 {"type":"WEATHER_QUERY","forecast_days":7}，不加其他文字；forecast_days 按用户需要取 1 至 7 天，未指定时用 7 天。网页会使用用户手动设置的城市查询天气并返回真实数据。收到查询结果后只依据结果回答，说明预报日期和气温，并注明数据来自 Open-Meteo（https://open-meteo.com/，CC BY 4.0）；若城市未设置、查询失败或数据缺失，明确告知用户，不得编造或用常识补全。

健康数据代记：只有用户在当前消息中明确要求“帮我记录、替我记下、记录一下、记成”等，且明确提供具体健康事件时，才可在正常回复之外使用 <记录健康数据>{"type":"food|sleep|bowel|weight|joy","date":"YYYY-MM-DD","time":"HH:MM","content":"...","category":"正餐|零嘴|饮品|其他","serving":"...","waterMl":0,"feeling":"...","hours":0,"start":"HH:MM","end":"HH:MM","quality":"...","form":"...","note":"...","value":0,"durationMinutes":0}</记录健康数据> 标签。只填写与该类型相关且用户明确提供的信息；不要推测份量、体重、睡眠时长或感受。日期未指定时由网页使用本地当天，时间未指定时保持为空。仅接受 food、sleep、bowel、weight、joy 五类；信息不足以形成有效记录时先询问，不发标签。普通叙述、回忆、愿望或仅提到“吃了/睡了”不等于请求代记，绝不因此自动写入。网页还会检查当前用户消息是否包含明确记录请求及相应类别；只有标签通过检查并成功保存后，才能告诉用户已记录。

营养目标设置：当用户表达了明确的每日营养目标或明确要求设置/调整时，在正常回复之外使用 <营养目标>{"waterMl":2000,"caloriesKcal":2000,"proteinG":60,"carbohydrateG":250,"fatG":65,"fiberG":25}</营养目标> 标签；只输出用户明确给出的字段和值，数值必须是非负数字，单位分别为 ml、kcal、g。用户没有提供具体数值时先询问，不要猜测或套用通用标准，不要发送该标签。系统会校验并保存标签中的设置；只有标签成功保存后才能告诉用户已设置。不得用该标签记录单餐摄入。

joy 时间含义：用户的自慰记录。

手机消息格式：每次普通回复严格拆成 5 至 20 条消息，使用 <消息>内容</消息> 分隔；每条最多不超过 150 个字符，最少字数不限制甚至可以只有一个标点符号。模仿自然即时通讯，可用短句、补充、语气词或表情；保持自然，不机械切句、不重复凑数。HEALTH_QUERY 和 WEATHER_QUERY 必须单独输出 JSON，不加消息标签。

可执行的系统标签：
- 值得长期保留的信息使用 <记忆 类别="长期偏好|待办|重要经历|当前近况|其他">具体内容</记忆>。用户明确要求记住的偏好、稳定背景、重要项目进展和未完成事项优先考虑；不保存普通闲聊，不把猜测当事实，不重复保存。
- 用户明确要求创建待办，或表达了具体、近期、可执行的计划/需要时，可自主使用 <待办>简洁明确的事项</待办>，不必再询问。例如用户说“我今天应该洗澡了”，可创建“今天洗澡”，在聊天中自然告知并顺势询问打算何时去。不要把随口提及误当任务，不要擅自编造日期；只有写入成功后才能说已创建。
- 用户明确表示某个现有待办已完成时，使用 <完成待办>现有待办的完整原文</完成待办>。只能匹配当前上下文中可见且唯一的未完成待办；无法唯一匹配时不要操作，先询问。完成后说明已完成并从记录中删除。
- 用户明确指出长期记忆中的事实已变化、过时时，可用 <更新记忆>{"原文":"记忆库中的完整旧内容","类别":"长期偏好|待办|重要经历|当前近况|其他","内容":"准确的新内容"}</更新记忆> 更正。只更新上下文中可见且唯一精确匹配的旧记忆；无法唯一匹配时不要操作，先询问。不得把推测写入记忆。
- 用户明确要求删除某个待办时，使用 <删除待办>现有待办的完整原文</删除待办>；只有能与当前上下文中的唯一待办精确匹配时才操作，否则先询问。不要因待办已完成而自动删除。
- 用户明确要求删除某条收藏时，使用 <删除收藏>现有收藏的完整原文</删除收藏>；仅删除内容完全匹配的收藏，找不到时不要声称已删除。
- 对确有长期珍藏、回味或日后查阅价值的信息，可自主使用 <收藏>内容</收藏>；包括用户有意义的表达、值得保留的想法或有特殊意义的片段。稳定偏好、背景和事实优先记入记忆，不要仅因用户喜欢某物就收藏；避免收藏普通信息或重复内容。
- 以上功能标签只承载可核验的具体内容；标签放在正常回复之外，标签本身不会展示给用户。行动后用简短自然语言告知实际完成的操作；没有发出标签就不得声称已操作。
- 首页留言可使用 <今日留言>内容</今日留言>；选择当天最值得留给用户的一句话。用户再次要求留言时，可以更新当天已有的留言。
冰箱库存查询：用户询问现有食材或库存时，使用 HEALTH_QUERY categories ["fridge"] 查询当前库存；库存变动记录不属于健康记忆，不能当作健康记录发送或总结。库存按用户描述的计量方式分别更新：明确毫升/克时只扣减份量数值，明确半瓶、三分之一袋等量词数量时只扣减数量，量词单位保持不变。
所有操作标签由系统提取处理；仅在确有价值时行动，不为使用功能而机械操作。标签本身不会展示给用户；只有操作成功后才能告知完成。普通聊天可以与操作标签同时出现；HEALTH_QUERY 和 WEATHER_QUERY 必须单独输出 JSON。`;
  window.petalDefaultSystemInstructions = requiredSystemInstructions;
  window.petalDefaultAnalysisPrompts = {
    chatSummary: '请客观、简洁地概括对话中发生了什么，使用第三人称叙述并按需标明各方观点或互动，不加修饰、不评价、不推测。只输出总结正文，最多250字，尽量控制在150字左右。',
    healthMemorySummary: '请根据记录简洁总结近期生活习惯和身体状态，最多200字。概括睡眠、饮食、活动及明确的不适或感受；可在事实基础上谨慎说明习惯与状态之间可能的关联，使用“可能”等表述，不作诊断、不补充未提供的事实、不评价，只输出总结正文。',
    sleepAnalysis: sleepAnalysisDefault
  };
  const legacyAnalysisPrompts = {
    chatSummary: '请把所选对话归纳成简洁、客观、可供后续对话参考的长期记忆。保留明确偏好、重要背景和未完成事项，不补充推测，不评价用户。只输出总结正文。',
    healthMemorySummary: '你是健康记录整理助手。请使用用户提供的记录撰写中性、简洁的回顾；不诊断疾病、不做价值判断、不补充未提供的事实。只返回总结正文。'
  };
  if (!$('systemPrompt').value.trim()) $('systemPrompt').value = requiredSystemInstructions;
  let chatApiKey = '';
  let analysisApiKey = '';
  let drawingApiKey = '';
  let renderedChatCharacterId = '';
  let rangeSelectionAnchorId = '';
  let rangeSelectionActive = false;
  let bowelMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  let hiddenMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  let foodReviewMode = false;
  let foodReviewDate = isoDate(new Date());
  let activeHealthDate = '';
  let healthEditMode = false;
  let editingHealthRecord = null;
  let summarizing = false;
  let chatSummarizing = false;
  let healthAutoSummarizing = false;
  let loadedApiSettings = '';

  function readData() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
      if (typeof saved !== 'object' || Array.isArray(saved)) throw new Error('本地数据格式无效。');
      if (!saved.settings || typeof saved.settings !== 'object' || Array.isArray(saved.settings)) saved.settings = {};
      if (!Array.isArray(saved.memoryArchives)) saved.memoryArchives = [];
      if (!Array.isArray(saved.healthAnalysisRecords)) saved.healthAnalysisRecords = [];
      if (!Array.isArray(saved.fridgeInventory)) saved.fridgeInventory = [];
      if (!Array.isArray(saved.fridgeRecords)) saved.fridgeRecords = [];
      if (!Array.isArray(saved.chat)) saved.chat = [];
      saved.chat.forEach((message, index) => {
        if (!message.id) message.id = `legacy-chat-${index}-${String(message.time || '').replace(/\W/g, '')}`;
      });
      if (!Array.isArray(saved.chatSummaries)) {
        saved.chatSummaries = saved.memoryArchives.flatMap(archive => archive.items || [])
          .filter(item => item.type === '对话总结' || item.source === '自动总结' || item.source === '聊天总结')
          .map(item => ({
            id: item.summaryId || item.id,
            source: item.source || '自动总结',
            date: item.date || '',
            from: item.from || '',
            to: item.to || '',
            count: Number(item.count) || 0,
            content: item.content || ''
          }));
        const latestLegacySummary = saved.chatSummaries.find(item => item.source === '自动总结');
        const summarizedCount = Math.min(saved.chat.length, Number(saved.settings?.tokenSettings?.lastAutoSummaryIndex) || 0);
        if (latestLegacySummary && summarizedCount) {
          saved.chat.slice(0, summarizedCount).forEach(message => {
            message.summaryId ||= latestLegacySummary.id;
            message.summarizedAt ||= latestLegacySummary.date;
          });
        }
      }
      if (!Array.isArray(saved.todos)) saved.todos = [];
      if (!Array.isArray(saved.hiddenHealthDates)) saved.hiddenHealthDates = [];
      if (!saved.settings.api || typeof saved.settings.api !== 'object' || Array.isArray(saved.settings.api)) saved.settings.api = { provider: 'openai', model: '', base: '' };
      if (!saved.settings.drawingApi || typeof saved.settings.drawingApi !== 'object' || Array.isArray(saved.settings.drawingApi)) saved.settings.drawingApi = { provider: 'openai', model: '', base: '' };
      if (!saved.settings.apiPresets || typeof saved.settings.apiPresets !== 'object') saved.settings.apiPresets = {};
      if (!saved.settings.analysisApi || typeof saved.settings.analysisApi !== 'object' || Array.isArray(saved.settings.analysisApi)) saved.settings.analysisApi = { provider: 'openai', model: '', base: '' };
      if (!Array.isArray(saved.settings.apiPresets.chat)) saved.settings.apiPresets.chat = [];
      if (!Array.isArray(saved.settings.apiPresets.analysis)) saved.settings.apiPresets.analysis = [];
      if (!saved.settings.tokenSettings || typeof saved.settings.tokenSettings !== 'object') saved.settings.tokenSettings = {};
      if (!saved.settings.dietGoals || typeof saved.settings.dietGoals !== 'object') saved.settings.dietGoals = {};
      saved.settings.dietGoals = { waterMl: 2000, caloriesKcal: 0, proteinG: 0, carbohydrateG: 0, fatG: 0, fiberG: 0, ...saved.settings.dietGoals };
      if (!saved.settings.analysisPrompts || typeof saved.settings.analysisPrompts !== 'object') saved.settings.analysisPrompts = {};
      saved.settings.analysisPrompts = {
        ...window.petalDefaultAnalysisPrompts,
        ...saved.settings.analysisPrompts
      };
      if (saved.settings.analysisPrompts.chatSummary === legacyAnalysisPrompts.chatSummary) {
        saved.settings.analysisPrompts.chatSummary = window.petalDefaultAnalysisPrompts.chatSummary;
      }
      if (saved.settings.analysisPrompts.healthMemorySummary === legacyAnalysisPrompts.healthMemorySummary) {
        saved.settings.analysisPrompts.healthMemorySummary = window.petalDefaultAnalysisPrompts.healthMemorySummary;
      }
      if (!Array.isArray(saved.settings.chatMemoryArchiveIds) || !saved.settings.chatMemoryArchiveIdsConfigured) {
        saved.settings.chatMemoryArchiveIds = saved.memoryArchives.filter(archive => archive.id !== 'health-archive').map(archive => archive.id);
        saved.settings.chatMemoryArchiveIdsConfigured = true;
      }
      saved.settings.tokenSettings = { chatHistoryTokenLimit: 6000, autoSummaryTokenThreshold: 4000, healthMemoryAutoSummaryTokenThreshold: 4000, lastAutoSummaryIndex: 0, lastChatSummaryReminderLevel: 0, ...saved.settings.tokenSettings };
      delete saved.settings.tokenSettings.chatHistoryCount;
      if (!Array.isArray(saved.healthMemorySummaries)) saved.healthMemorySummaries = [];
      for (const source of [...healthSources, 'foodAnalyses']) if (!Array.isArray(saved[source])) saved[source] = [];
      let profileArchive = saved.memoryArchives.find(archive => archive.id === 'personal-profile-archive');
      if (!profileArchive) {
        profileArchive = { id: 'personal-profile-archive', name: '个人画像', createdAt: isoDate(new Date()), system: true, personalProfile: true, items: [] };
        saved.memoryArchives.unshift(profileArchive);
      }
      profileArchive.items ||= [];
      saved.settings.chatMemoryArchiveIds = (saved.settings.chatMemoryArchiveIds || [])
        .filter(id => id !== 'personal-profile-archive' && id !== 'health-archive');
      const healthArchive = saved.memoryArchives.find(archive => archive.id === 'health-archive');
      if (healthArchive?.items?.some(item => item.summary)) {
        const remaining = [];
        for (const item of healthArchive.items) {
          if (!item.summary) {
            remaining.push(item);
            continue;
          }
          const dates = (item.dates || []).filter(validIsoDate);
          for (const date of dates) {
            if (!saved.healthAnalysisRecords.some(record => record.type === 'health_summary' && record.date === date && record.content === item.content)) {
              saved.healthAnalysisRecords.push({
                id: `${item.id}-${date}`,
                type: 'health_summary',
                title: item.title || '健康总结',
                date,
                dates,
                period: item.period || '',
                content: item.content || '',
                source: item.source || 'AI 总结'
              });
            }
          }
        }
        healthArchive.items = remaining;
      }
      const profileIds = new Set(profileArchive.items.map(item => item.id));
      for (const archive of saved.memoryArchives) {
        if (archive.id === 'health-archive' || archive.id === 'personal-profile-archive') continue;
        const remaining = [];
        for (const item of archive.items || []) {
          if (!item.summary && profileMemoryTypes.has(item.type) && !item.todoId) {
            if (!profileIds.has(item.id)) {
              profileArchive.items.push(item);
              profileIds.add(item.id);
            }
          } else remaining.push(item);
        }
        archive.items = remaining;
      }
      return saved;
    } catch (error) {
      console.error('读取本地健康数据失败', error);
      throw new Error('无法读取本地数据，请检查浏览器存储空间。');
    }
  }

  function writeData(data) {
    try {
      const characterId = activeCharacterId(data);
      for (const message of data.chat) {
        if (!message.characterId) message.characterId = characterId;
      }
      window.petalSyncDailyHealthMemories?.(data);
      localStorage.setItem(KEY, JSON.stringify(data));
      window.dispatchEvent(new Event('petal-data-updated'));
    } catch (error) {
      console.error('保存本地健康数据失败', error);
      throw new Error('保存失败，可能是浏览器存储空间不足。请先导出备份。');
    }
  }

  function updateData(mutator) {
    const data = readData();
    mutator(data);
    writeData(data);
    refresh();
    return data;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function estimateTokens(value) {
    const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
    return Math.max(0, Math.ceil(Array.from(text).length / 3.2));
  }

  function chatMessageContent(message) {
    if (!message.attachment) return message.text || '';
    if (message.attachment.contextCompacted) return '健康数据，想知道请自己主动调用';
    return `本条消息附带本地健康数据文件「${message.attachment.title}」。以下为文件内容：\n${JSON.stringify(message.attachment.payload, null, 2)}`;
  }

  function notify(message) {
    const toast = $('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    if (typeof toast.showPopover === 'function' && !toast.matches(':popover-open')) toast.showPopover();
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.matches(':popover-open')) toast.hidePopover();
      }, 250);
    }, 3000);
  }

  function isoDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function validIsoDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  function isHidden(data, date) {
    return data.hiddenHealthDates.includes(date);
  }

  function recordsForDate(data, date) {
    const details = {};
    for (const source of healthSources) {
      const records = (data[source] || []).filter(record => record.date === date);
      if (records.length) details[source] = records;
    }
    const analysis = (data.foodAnalyses || []).filter(item => item.date === date);
    if (analysis.length) details.food_analysis = analysis;
    const archive = data.memoryArchives.find(item => item.id === 'health-archive');
    const summaries = (archive?.items || []).filter(item => item.summary && (item.dates || []).includes(date));
    if (summaries.length) details.health_memory = summaries;
    const analyses = (data.healthAnalysisRecords || []).filter(item => item.date === date);
    if (analyses.length) details.health_analysis = analyses;
    return details;
  }

  function healthRecordSourceList(data, source) {
    if (source === 'food_analysis') return data.foodAnalyses || [];
    if (source === 'health_analysis') return data.healthAnalysisRecords || [];
    if (source === 'health_memory') return data.memoryArchives.find(item => item.id === 'health-archive')?.items || [];
    return data[source] || [];
  }

  function formatHealthRecords(details, data) {
    const labels = { sleep: '详细数据 · 睡眠', food: '详细数据 · 饮食', bowel: '详细数据 · 排便', weight: '详细数据 · 体重', joy: '详细数据 · Joy', fridge: '详细数据 · 冰箱食材', food_analysis: '分析数据 · 饮食分析', health_memory: '分析数据 · 健康总结', health_analysis: '分析数据 · 睡眠分析' };
    return Object.entries(details).map(([source, records]) => {
      return records.map(record => {
        const content = (() => {
        if (source === 'sleep') return `${record.hours ?? '—'} 小时${record.quality ? `，醒来感觉：${record.quality}` : ''}${record.start || record.end ? `（${record.start || '—'}–${record.end || '—'}）` : ''}`;
        if (source === 'food') return `${record.time ? `${record.time} ` : ''}${record.content || ''}${record.serving ? `，份量：${record.serving}` : ''}${record.category ? `，类别：${record.category}` : ''}${record.waterMl ? `，饮水 ${record.waterMl} ml` : ''}${record.feeling ? `，感受：${record.feeling}` : ''}`;
        if (source === 'bowel') return `${record.time ? `${record.time} ` : ''}${record.feeling || '排便记录'}${record.form ? `，形态：${record.form}` : ''}${record.note ? `，备注：${record.note}` : ''}`;
        if (source === 'weight') return `${record.value} kg`;
        if (source === 'joy') return `${record.time ? `${record.time} ` : ''}Joy 时间${record.durationMinutes ? `，${record.durationMinutes} 分钟` : ''}${record.note ? `，${record.note}` : ''}`;
        if (source === 'food_analysis') return [
          record.summary || '饮食分析记录',
          Number.isFinite(Number(record.caloriesKcal)) ? `能量约 ${Number(record.caloriesKcal)} kcal` : '',
          ...(Array.isArray(record.nutrients) ? record.nutrients.map(nutrient => `${nutrient.name || '营养素'} ${nutrient.amount ?? '—'} ${nutrient.unit || ''}`) : [])
        ].filter(Boolean).join('；');
        if (source === 'health_analysis' || source === 'health_memory') return `${record.title || (record.type === 'sleep_analysis' ? '睡眠分析' : '健康总结')}：${record.content || ''}`;
        return record.content || '';
        })();
        const index = healthRecordSourceList(data, source).indexOf(record);
        const deletableSummary = (source === 'health_analysis' || source === 'health_memory') && record.type === 'health_summary';
        const actions = healthEditMode
          ? `<span class="health-record-actions"><button type="button" class="secondary-button" data-health-edit-source="${source}" data-health-edit-index="${index}" data-health-edit-date="${escapeHtml(record.date)}">编辑</button><button type="button" class="danger-button" data-health-delete-source="${source}" data-health-delete-index="${index}" data-health-delete-date="${escapeHtml(record.date)}">删除</button></span>`
          : deletableSummary
            ? `<span class="health-record-actions"><button type="button" class="danger-button" data-health-delete-source="${source}" data-health-delete-index="${index}" data-health-delete-date="${escapeHtml(record.date)}">删除总结</button></span>`
            : '';
        const label = source === 'health_analysis' && record.type === 'health_summary' ? '分析数据 · 健康总结' : labels[source];
        return `<div class="health-detail-line"><strong>${label}</strong><span>${escapeHtml(content)}</span>${actions}</div>`;
      }).join('');
    }).join('');
  }

  function ensureHealthArchive(data) {
    let archive = data.memoryArchives.find(item => item.id === 'health-archive');
    if (!archive) {
      archive = { id: 'health-archive', name: '健康记忆', createdAt: new Date().toISOString().slice(0, 10), system: true, items: [] };
      data.memoryArchives.unshift(archive);
    }
    archive.items ||= [];
    return archive;
  }

  function allHealthDates(data) {
    const dates = new Set();
    for (const source of healthSources) (data[source] || []).forEach(record => validIsoDate(record.date) && dates.add(record.date));
    (data.foodAnalyses || []).forEach(record => validIsoDate(record.date) && dates.add(record.date));
    (data.healthAnalysisRecords || []).forEach(record => validIsoDate(record.date) && dates.add(record.date));
    const archive = data.memoryArchives.find(item => item.id === 'health-archive');
    (archive?.items || []).forEach(item => {
      if (item.summary) (item.dates || []).forEach(date => validIsoDate(date) && dates.add(date));
      else if (validIsoDate(item.date)) dates.add(item.date);
    });
    return [...dates].sort().reverse();
  }

  function renderHealthMemory() {
    const data = readData();
    const archive = ensureHealthArchive(data);
    const list = $('memoryList');
    const controls = $('healthMemoryControls');
    const summarize = $('healthSummarize');
    if (!list || !controls || !summarize || $('memoryDetailTitle').textContent !== '健康记忆') return;
    controls.hidden = false;
    let categoryLegend = $('healthMemoryCategories');
    if (!categoryLegend) {
      categoryLegend = document.createElement('div');
      categoryLegend.id = 'healthMemoryCategories';
      categoryLegend.className = 'health-memory-categories';
      categoryLegend.innerHTML = '<strong>详细数据</strong><small>来自日期对应的睡眠、饮食等原始记录</small><strong>分析数据</strong><small>睡眠分析与健康总结按日期保存；饮食分析也会显示在分析数据中</small>';
      controls.append(categoryLegend);
    }
    summarize.hidden = false;
    $('deleteSelectedMemories').hidden = false;
    $('deleteSelectedMemories').textContent = '删除选中日期';
    $('toggleHealthEdit').hidden = false;
    $('toggleHealthEdit').textContent = healthEditMode ? '完成编辑' : '编辑';
    $('deleteAllArchiveMemories').hidden = true;
    $('healthJumpDate').value ||= new Date().toISOString().slice(0, 10);
    const dates = allHealthDates(data);
    const summaries = archive.items.filter(item => item.summary);
    const rows = [];
    let monthKey = '';
    dates.forEach(date => {
      const month = date.slice(0, 7);
      if (month !== monthKey) {
        monthKey = month;
        rows.push(`<div class="health-month-divider" data-month="${month}"><span></span><strong>${Number(month.slice(5))} 月健康记录</strong><span></span></div>`);
      }
      const summary = summaries.filter(item => (item.dates || []).includes(date));
      const details = recordsForDate(data, date);
      const hidden = isHidden(data, date);
      rows.push(`<article class="health-date-entry ${summary.length ? 'is-summarized' : ''}" id="health-date-${date}" data-health-date="${date}">
        <div class="health-date-heading"><label><input type="checkbox" data-health-select="${date}"><strong>${date}</strong></label><span>${hidden ? '已隐藏' : summary.length ? '已总结' : `${Object.values(details).reduce((sum, records) => sum + records.length, 0)} 项记录`}</span><button type="button" class="secondary-button health-date-toggle" data-health-toggle="${date}">${activeHealthDate === date ? '收起' : '查看'}</button><button type="button" class="secondary-button health-date-edit" data-health-edit-date-toggle="${date}">${healthEditMode ? '完成' : '编辑'}</button></div>
        <div class="health-date-details" ${activeHealthDate === date ? '' : 'hidden'}>${formatHealthRecords(details, data) || '<p class="small-muted">这一天没有详细或分析记录。</p>'}</div>
      </article>`);
    });
    summaries.filter(summary => !(summary.dates || []).some(date => dates.includes(date))).forEach(summary => {
      const month = summary.date?.slice(0, 7) || '';
      if (month && month !== monthKey) rows.push(`<div class="health-month-divider"><span></span><strong>${Number(month.slice(5))} 月健康记录</strong><span></span></div>`);
      rows.push(`<article class="health-date-entry is-summarized"><div class="health-date-heading"><strong>${escapeHtml(summary.title || '健康总结')}</strong><span>${escapeHtml(summary.period || summary.date || '')}</span><button type="button" class="secondary-button health-summary-view" data-summary-view="${escapeHtml(summary.id)}">查看总结</button><button type="button" class="danger-button" data-health-delete-source="health_memory" data-health-delete-id="${escapeHtml(summary.id)}" data-health-delete-date="${escapeHtml(summary.date || '')}">删除总结</button></div><div class="health-date-details" data-summary-content="${escapeHtml(summary.id)}" hidden><p>${escapeHtml(summary.content)}</p></div></article>`);
    });
    list.classList.add('health-memory-records');
    const inventoryItem = archive.items.find(item => item.permanentInventory);
    const inventory = (() => {
      if (!inventoryItem) return [];
      try { return JSON.parse(inventoryItem.content); }
      catch (error) {
        console.error('读取常驻冰箱库存记忆失败', error);
        return [];
      }
    })();
    const inventorySection = inventory.length
      ? `<section class="health-permanent-memory"><div><strong>常驻记忆 · 冰箱库存</strong><small>当前库存，不关联具体日期</small></div><p>${inventory.map(item => {
        const measures = [
          Number(item.amount) > 0 ? `${item.amount}${escapeHtml(item.amountUnit || '')}` : '',
          Number(item.quantity) > 0 ? `${formatFridgeCount(item.quantity)}${escapeHtml(item.packageUnit || '')}` : ''
        ].filter(Boolean);
        return `${escapeHtml(item.name)}：${measures.join('，')}`;
      }).join('；')}</p></section>`
      : '';
    list.innerHTML = inventorySection + (rows.join('') || '<div class="empty-state">还没有健康记录。<br>在睡眠、饮食、排便等页面留下记录后，会按日期整理到这里。</div>');
    if (!$('healthJumpDate').value) $('healthJumpDate').value = dates[0] || new Date().toISOString().slice(0, 10);
  }

  function healthSummaryGroupMatches(left, right) {
    return left.type === 'health_summary' && right.type === 'health_summary'
      && left.content === right.content
      && JSON.stringify([...(left.dates || [left.date])].sort()) === JSON.stringify([...(right.dates || [right.date])].sort());
  }

  function deleteHealthRecord(source, date, index, id = '') {
    const data = readData();
    const list = healthRecordSourceList(data, source);
    const record = id ? list.find(item => item.id === id) : list[Number(index)];
    if (!record || record.date !== date) {
      notify('这条健康记录已变化，请刷新后重试。');
      return;
    }
    if (!confirm(`确定删除 ${date} 的这条${record.type === 'health_summary' ? '健康总结' : '健康记录'}吗？`)) return;
    if (source === 'health_analysis' && record.type === 'health_summary') {
      data.healthAnalysisRecords = data.healthAnalysisRecords.filter(item => !healthSummaryGroupMatches(item, record));
      for (const archive of data.memoryArchives) {
        archive.items = (archive.items || []).filter(item => !(item.summary && item.content === record.content
          && JSON.stringify([...(item.dates || [])].sort()) === JSON.stringify([...(record.dates || [record.date])].sort())));
      }
    } else {
      list.splice(list.indexOf(record), 1);
      if (source === 'health_memory' && record.summary) {
        data.healthAnalysisRecords = data.healthAnalysisRecords.filter(item => !(item.type === 'health_summary' && item.content === record.content
          && JSON.stringify([...(item.dates || [item.date])].sort()) === JSON.stringify([...(record.dates || [])].sort())));
      }
    }
    writeData(data);
    renderHealthMemory();
    notify('健康记录已删除。');
  }

  function deleteSelectedHealthDates() {
    const dates = new Set([...document.querySelectorAll('[data-health-select]:checked')].map(input => input.dataset.healthSelect));
    if (!dates.size) {
      notify('请先勾选要删除的日期。');
      return;
    }
    if (!confirm(`确定删除所选 ${dates.size} 天的全部健康数据及相关总结吗？此操作无法撤销。`)) return;
    const data = readData();
    for (const source of [...healthSources, 'foodAnalyses']) {
      data[source] = (data[source] || []).filter(record => !dates.has(record.date));
    }
    data.healthAnalysisRecords = (data.healthAnalysisRecords || []).filter(record =>
      record.type === 'health_summary'
        ? !(record.dates || [record.date]).some(date => dates.has(date))
        : !dates.has(record.date));
    for (const archive of data.memoryArchives) {
      if (archive.id !== 'health-archive') continue;
      archive.items = (archive.items || []).filter(item => item.summary
        ? !(item.dates || []).some(date => dates.has(date))
        : !dates.has(item.date));
    }
    writeData(data);
    renderHealthMemory();
    notify(`已删除所选 ${dates.size} 天的健康数据与相关总结。`);
  }

  function openHealthRecordEditor(source, date, index) {
    const data = readData();
    const record = healthRecordSourceList(data, source)[Number(index)];
    if (!record || record.date !== date) {
      notify('这条健康记录已变化，请刷新后重试。');
      return;
    }
    editingHealthRecord = { source, date, index: Number(index), id: record.id || '' };
    const labels = {
      content: '内容', summary: '概述', note: '备注', serving: '份量', category: '类别', feeling: '感受',
      quality: '睡眠感受', form: '形态', title: '标题', time: '时间', start: '入睡时间', end: '起床时间',
      hours: '睡眠时长（小时）', waterMl: '饮水量（ml）', caloriesKcal: '能量（kcal）', value: '数值',
      durationMinutes: '时长（分钟）'
    };
    const excluded = new Set(['id', 'date', 'createdAt', 'dates', 'type', 'source', 'period', 'summaryId', 'archiveId', 'range', 'completedAt', 'todoId', 'dailyHealthRecord', 'action', 'mode']);
    const fields = Object.entries(record).filter(([key, value]) => !excluded.has(key) && ['string', 'number'].includes(typeof value));
    if (!fields.length) {
      notify('这类记录没有可编辑的文字或数值字段。');
      return;
    }
    $('healthRecordEditorDate').textContent = `${date} · ${labels[source] || source}`;
    $('healthRecordEditFields').innerHTML = fields.map(([key, value]) => {
      const label = labels[key] || key;
      const numeric = typeof value === 'number';
      const multiline = typeof value === 'string' && (value.length > 70 || ['content', 'summary', 'note'].includes(key));
      const control = multiline
        ? `<textarea name="${escapeHtml(key)}" rows="3">${escapeHtml(value)}</textarea>`
        : `<input name="${escapeHtml(key)}" type="${numeric ? 'number' : 'text'}" ${numeric ? 'step="any"' : ''} value="${escapeHtml(value)}">`;
      return `<label class="field"><span>${escapeHtml(label)}</span>${control}</label>`;
    }).join('');
    $('healthRecordEditor').showModal();
  }

  function saveHealthRecordEdit(event) {
    event.preventDefault();
    if (!editingHealthRecord) return;
    const data = readData();
    const { source, date, index, id } = editingHealthRecord;
    const list = healthRecordSourceList(data, source);
    const record = id ? list.find(item => item.id === id) : list[index];
    if (!record || record.date !== date) {
      notify('这条健康记录已变化，未保存修改。');
      $('healthRecordEditor').close();
      editingHealthRecord = null;
      return;
    }
    const original = JSON.parse(JSON.stringify(record));
    const summaryGroup = source === 'health_analysis' && record.type === 'health_summary'
      ? data.healthAnalysisRecords.filter(item => healthSummaryGroupMatches(item, original))
      : [];
    const limits = { hours: 24, waterMl: 10000, caloriesKcal: 20000, value: 500, durationMinutes: 1440 };
    for (const [key, value] of new FormData(event.currentTarget).entries()) {
      if (typeof value !== 'string') continue;
      if (typeof record[key] === 'number') {
        if (!value.trim()) {
          delete record[key];
          continue;
        }
        const number = Number(value);
        if (!Number.isFinite(number) || number < 0 || (limits[key] !== undefined && number > limits[key])) {
          notify(`${key} 数值无效，未保存修改。`);
          return;
        }
        record[key] = number;
      } else {
        const text = value.trim();
        if (['content', 'summary'].includes(key) && !text) {
          notify('内容不能为空，未保存修改。');
          return;
        }
        if (text.length > 1000 || (['time', 'start', 'end'].includes(key) && text && !/^([01]\d|2[0-3]):[0-5]\d$/.test(text))) {
          notify(`${key} 内容格式无效，未保存修改。`);
          return;
        }
        if (key === 'category' && source === 'food_analysis' && !['正餐', '零嘴', '饮品', '其他'].includes(text)) {
          notify('饮食类别无效，未保存修改。');
          return;
        }
        record[key] = text;
      }
    }
    if (summaryGroup.length) {
      for (const sibling of summaryGroup) {
        if (sibling === record) continue;
        sibling.content = record.content;
        sibling.title = record.title;
      }
    }
    writeData(data);
    $('healthRecordEditor').close();
    editingHealthRecord = null;
    renderHealthMemory();
    notify('健康记录修改已保存。');
  }

  function renderMonthCalendar(containerId, titleId, month, records, clickAttr, hiddenDates = null) {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    $(titleId).textContent = `${year} 年 ${monthIndex + 1} 月`;
    const counts = {};
    records.forEach(record => counts[record.date] = (counts[record.date] || 0) + 1);
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    let html = weekdays.map(day => `<div class="joy-weekday">${day}</div>`).join('');
    const firstOffset = new Date(year, monthIndex, 1).getDay();
    const countDays = new Date(year, monthIndex + 1, 0).getDate();
    for (let index = 0; index < firstOffset; index++) html += '<div></div>';
    for (let day = 1; day <= countDays; day++) {
      const date = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const count = counts[date] || 0;
      const hidden = hiddenDates?.has(date);
      html += `<button type="button" class="joy-day ${count ? 'has-record' : ''} ${hidden ? 'hidden-health-date' : ''}" ${clickAttr}="${date}" aria-pressed="${hidden ? 'true' : 'false'}" title="${date}${count ? ` · ${count} 条` : ''}${hidden ? ' · 已隐藏' : ''}"><span class="joy-dot"></span><span class="joy-num">${day}</span></button>`;
    }
    $(containerId).innerHTML = html;
  }

  function renderBowelCalendar() {
    const data = readData();
    renderMonthCalendar('bowelCalendar', 'bowelMonthTitle', bowelMonth, data.bowel || [], 'data-bowel-date');
  }

  function renderHiddenCalendar() {
    const data = readData();
    const hidden = new Set(data.hiddenHealthDates);
    const dates = allHealthDates(data);
    const records = dates.flatMap(date => {
      const details = recordsForDate(data, date);
      return Object.values(details).flat().map(() => ({ date }));
    });
    renderMonthCalendar('hiddenDateCalendar', 'hiddenMonthTitle', hiddenMonth, records, 'data-hidden-date', hidden);
    $('hiddenDatesList').innerHTML = data.hiddenHealthDates.length
      ? `<span>已隐藏 ${data.hiddenHealthDates.length} 天</span> <button class="secondary-button" type="button" id="unhideAllDates">取消全部隐藏</button>`
      : '<span>当前没有隐藏日期。</span>';
  }

  function renderTokenTotals() {
    const data = readData();
    const instructionText = [
      systemInstructionBaseText(data),
      healthAnalysisProtocolText(),
      data.settings.appearance?.chatSlimeEnabled ? chatSlimeInstructionText() : '',
      `当前本地日期：${isoDate(new Date())}`,
      todayNoteStatusText(data),
      currentTimeContext()
    ].filter(Boolean).join('\n\n');
    const stickerTokens = estimateTokens(stickerAiContext(data));
    const memoryText = [fridgeInventoryMemoryText(data), ordinaryMemoryText(data)].filter(Boolean).join('\n\n');
    const roleCardTokens = estimateTokens([characterCardText(data), userProfileText(data)].filter(Boolean).join('\n\n'));
    const hidden = new Set(data.hiddenHealthDates);
    const healthEntries = [];
    const healthArchive = data.memoryArchives.find(archive => archive.id === 'health-archive');
    const summaries = (healthArchive?.items || []).filter(item => item.summary);
    const analysisSummaries = (data.healthAnalysisRecords || []).filter(item => item.type === 'health_summary');
    const summarizedDates = new Set([...summaries.flatMap(item => item.dates || []), ...analysisSummaries.flatMap(item => item.dates || [item.date])]);
    for (const source of [...healthSources, 'foodAnalyses', 'healthAnalysisRecords']) {
      for (const record of data[source] || []) if (!hidden.has(record.date) && !summarizedDates.has(record.date)) healthEntries.push(record);
    }
    const uniqueAnalysisSummaries = [...new Map(analysisSummaries.map(item => [(item.dates || [item.date]).join('|'), item])).values()];
    for (const summary of [...summaries, ...uniqueAnalysisSummaries]) {
      if ((summary.summary || summary.type === 'health_summary') && (summary.dates || [summary.date]).every(date => !hidden.has(date))) healthEntries.push(summary.content);
    }
    const instructionTokens = estimateTokens(instructionText);
    const memoryTokens = estimateTokens(memoryText);
    const healthTokens = estimateTokens(healthEntries);
    const chatTokens = estimateTokens(pickConversation(data).map(message => message.content).join('\n'));
    $('instructionTokens').textContent = instructionTokens.toLocaleString();
    $('stickerContextTokens').textContent = stickerTokens.toLocaleString();
    $('roleCardTokens').textContent = roleCardTokens.toLocaleString();
    $('archiveMemoryTokens').textContent = memoryTokens.toLocaleString();
    $('chatTokens').textContent = chatTokens.toLocaleString();
    $('healthMemoryTokens').textContent = healthTokens.toLocaleString();
    $('tokensWithoutHealth').textContent = (instructionTokens + stickerTokens + roleCardTokens + memoryTokens + chatTokens).toLocaleString();
    $('tokensWithHealth').textContent = (instructionTokens + stickerTokens + roleCardTokens + memoryTokens + chatTokens + healthTokens).toLocaleString();
    const chatApi = data.settings.api;
    $('apiStatusTag').textContent = chatApi?.model && chatApi?.base ? '聊天 API 已配置' : '尚未连接 API';
    $('chatHistoryTokenLimit').value = data.settings.tokenSettings.chatHistoryTokenLimit;
    $('autoSummaryTokenThreshold').value = data.settings.tokenSettings.autoSummaryTokenThreshold;
    $('healthMemoryAutoSummaryTokenThreshold').value = data.settings.tokenSettings.healthMemoryAutoSummaryTokenThreshold;
  }

  function refresh() {
    try {
      renderBowelCalendar();
      renderHiddenCalendar();
      renderTokenTotals();
      renderHealthMemory();
      const data = readData();
      const selectedFoodAnalysis = (data.foodAnalyses || []).find(item => item.date === selectedFoodDashboardDate(data)) || null;
      renderFoodAnalysisCard(selectedFoodAnalysis, data);
      renderNutritionGoalProgress();
      renderSleepAnalysisFeed(data);
      const healthCard = document.querySelector('[data-memory-archive="health-archive"] small');
      if (healthCard) healthCard.textContent = `${allHealthDates(data).length} 天健康记录`;
    } catch (error) {
      console.error('刷新健康记忆与 Token 信息失败', error);
    }
  }

  function renderSleepAnalysisFeed(data) {
    const container = $('sleepAnalysisFeed');
    if (!container) return;
    const analyses = (data.healthAnalysisRecords || [])
      .filter(item => item.type === 'sleep_analysis')
      .sort((left, right) => (right.date || '').localeCompare(left.date || ''))
      .slice(0, 5);
    container.innerHTML = analyses.map(item => `<article class="sleep-analysis-entry"><div class="sleep-analysis-meta"><strong>${escapeHtml(item.date)}</strong><button type="button" class="secondary-button" data-rerun-sleep-analysis="${escapeHtml(item.date)}">重新分析</button></div><p>${escapeHtml(item.content)}</p></article>`).join('');
  }

  function currentTimeContext() {
    const currentTime = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    return `当前设备本地时间：${currentTime}。请据此理解“现在”“今天”等相对时间。`;
  }

  function apiConfig(type) {
    const data = readData();
    const config = type === 'analysis' ? data.settings.analysisApi : type === 'drawing' ? data.settings.drawingApi : data.settings.api;
    const key = config?.key || (type === 'analysis' ? analysisApiKey : type === 'drawing' ? drawingApiKey : chatApiKey);
    if (!config?.model || !config?.base || !key) throw new Error(`请先填写${type === 'analysis' ? '数据分析 / 记忆总结' : type === 'drawing' ? '绘画' : '聊天'} API 的模型、地址和 API Key。`);
    return { ...config, key };
  }

  function validateHeaderApiKey(key) {
    if (!/^[\x21-\x7E]+$/.test(key)) {
      throw new Error('API Key 含有非 ASCII 字符或空格，无法用于 HTTP 请求头。请检查是否粘贴了中文/全角字符，或重新复制服务商提供的 API Key。');
    }
  }

  function redactDiagnosticText(value, config) {
    let text = String(value || '').trim();
    if (config?.key) text = text.split(config.key).join('[已隐藏 API Key]');
    text = text.replace(/(authorization\s*[:=]\s*bearer\s+)[^\s"'<>]+/gi, '$1[已隐藏]');
    text = text.replace(/([?&]key=)[^&\s"'<>]+/gi, '$1[已隐藏]');
    return text.slice(0, 2000);
  }

  async function responseErrorDetail(response, config) {
    let body = '';
    try {
      body = await response.text();
    } catch (error) {
      console.warn('读取 API 错误响应正文失败', error);
    }
    let detail = '';
    if (body.trim()) {
      try {
        const payload = JSON.parse(body);
        const error = payload?.error;
        if (typeof error === 'string') detail = error;
        else if (error && typeof error === 'object') {
          detail = [error.message, error.type, error.code, error.status, error.param]
            .filter(value => typeof value === 'string' && value.trim()).join(' · ');
          if (!detail) detail = JSON.stringify(error);
        } else if (typeof payload?.message === 'string') detail = payload.message;
        else detail = JSON.stringify(payload);
      } catch {
        detail = body;
      }
    }
    detail = redactDiagnosticText(detail, config);
    const status = `${response.status}${response.statusText ? ` ${response.statusText}` : ''}`;
    return `HTTP ${status}${detail ? `：${detail}` : '；服务端没有返回错误详情。'}`;
  }

  async function requestCompletion(config, messages) {
    const timeContext = currentTimeContext();
    const requestMessages = [...messages];
    const systemMessageIndex = requestMessages.findIndex(message => message.role === 'system');
    if (systemMessageIndex < 0) {
      requestMessages.unshift({ role: 'system', content: timeContext });
    } else {
      requestMessages[systemMessageIndex] = {
        ...requestMessages[systemMessageIndex],
        content: `${timeContext}\n\n${requestMessages[systemMessageIndex].content}`
      };
    }
    const provider = config.provider || 'openai';
    const base = config.base.replace(/\/+$/, '');
    if (provider === 'gemini') {
      const system = requestMessages.filter(message => message.role === 'system').map(message => message.content).join('\n\n');
      const contents = requestMessages.filter(message => message.role !== 'system').map(message => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }]
      }));
      const endpoint = `${base}/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.key)}`;
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents }) });
      if (!response.ok) throw new Error(`模型请求失败：${await responseErrorDetail(response, config)}`);
      const payload = await response.json().catch(error => {
        throw new Error(`模型返回的 JSON 无法解析：${redactDiagnosticText(error.message, config)}`);
      });
      if (payload?.error) {
        const detail = typeof payload.error === 'string' ? payload.error : payload.error.message || JSON.stringify(payload.error);
        throw new Error(`模型返回错误：${redactDiagnosticText(detail, config)}`);
      }
      const text = payload.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('');
      if (!text) throw new Error('模型没有返回内容');
      return text;
    }
    validateHeaderApiKey(config.key);
    const response = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.key}` },
      body: JSON.stringify({ model: config.model, messages: requestMessages })
    });
    if (!response.ok) throw new Error(`模型请求失败：${await responseErrorDetail(response, config)}`);
    const payload = await response.json().catch(error => {
      throw new Error(`模型返回的 JSON 无法解析：${redactDiagnosticText(error.message, config)}`);
    });
    if (payload?.error) {
      const detail = typeof payload.error === 'string' ? payload.error : payload.error.message || JSON.stringify(payload.error);
      throw new Error(`模型返回错误：${redactDiagnosticText(detail, config)}`);
    }
    const text = payload.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) throw new Error('模型没有返回内容');
    return text.trim();
  }

  function characterCardText(data) {
    const prompts = data.settings.prompts || {};
    const character = prompts.characters?.find(item => item.id === prompts.activeCharacterId);
    return character ? `当前角色：${character.name}\n${character.prompt || ''}` : '';
  }

  function userProfileText(data) {
    const savedProfile=data.settings.prompts?.userProfile;
    const profile=typeof savedProfile==='string'?savedProfile.trim():savedProfile&&typeof savedProfile==='object'?[savedProfile.name?`姓名/称呼：${savedProfile.name}`:'',savedProfile.prompt||''].filter(Boolean).join('\n').trim():'';
    const memories = data.memoryArchives.find(archive => archive.id === 'personal-profile-archive')?.items || [];
    const captured = memories.filter(item => item.content).map(item => `[${item.type || '个人记忆'}] ${item.content}`).join('\n');
    return [profile ? `用户身份信息（用户提供）：\n${profile}` : '', captured ? `个人画像记忆（跨角色共享，AI 从对话中记录）：\n${captured}` : ''].filter(Boolean).join('\n\n');
  }

  function systemInstructionBaseText(data) {
    const prompts = data.settings.prompts || {};
    const customSystemPrompt = prompts.system || '';
    return [
      customSystemPrompt,
      ...(prompts.promptPresets || []).filter(item => item.enabled).map(item => item.text),
      ...(customSystemPrompt === requiredSystemInstructions ? [] : [requiredSystemInstructions]),
    ].filter(Boolean).join('\n\n');
  }

  function fridgeInventoryMemoryText(data) {
    const inventory = (Array.isArray(data.fridgeInventory) ? data.fridgeInventory : [])
      .filter(item => item && typeof item.name === 'string' && item.name.trim()
        && (Number(item.amount) > 0 || Number(item.quantity) > 0));
    if (!inventory.length) return '';
    const items = inventory.map(item => {
      const measures = [
        Number(item.amount) > 0 ? `${Number(item.amount)}${item.amountUnit || ''}` : '',
        Number(item.quantity) > 0 ? `${formatFridgeCount(item.quantity)}${item.packageUnit || ''}` : ''
      ].filter(Boolean);
      return measures.length > 1
        ? `${item.name.trim()}（${measures.join('；')}）`
        : `${item.name.trim()}${measures[0] || ''}`;
    });
    return `当前冰箱库存（常驻健康记忆，仅表示当前存量，不代表已摄入）：${items.join('；')}`;
  }

  function healthAnalysisProtocolText() {
    return '用户询问当前冰箱库存时，可在 HEALTH_QUERY 的 categories 中使用 fridge；冰箱库存变动流水不是健康记忆，不要作为健康数据发送或总结。用户询问本地睡眠分析或健康分析记录时，可使用 health_analysis；按请求日期查询，不要把详细数据与分析数据混为一类。天气查询协议优先：用户询问当前天气、温度或预报时，第一轮必须只输出 WEATHER_QUERY JSON，不要回复寒暄、猜测或声称已经查询；网页会执行查询并在第二轮提供天气结果，收到后再根据结果回答。使用记忆标签时，长期偏好、重要经历和当前近况属于跨角色共享的个人画像；其他记忆写入当前角色绑定的存档。';
  }

  function systemInstructionText(data) {
    return [systemInstructionBaseText(data), healthAnalysisProtocolText(), fridgeInventoryMemoryText(data), characterCardText(data), userProfileText(data)].filter(Boolean).join('\n\n');
  }

  function todayNoteStatusText(data) {
    return data.todayNote?.date===isoDate(new Date())?'今日留言状态：今天已有留言，用户再次要求时可以更新。':'今日留言状态：今天尚未生成。';
  }

  function ordinaryMemoryText(data) {
    const selected = new Set(data.settings.chatMemoryArchiveIds || []);
    const memories = data.memoryArchives.filter(archive => !['health-archive', 'personal-profile-archive'].includes(archive.id) && selected.has(archive.id))
      .flatMap(archive => (archive.items || []).filter(item => !item.todoId).map(item => `[${archive.name} · ${item.type || '记忆'}] ${item.content}`));
    const todos = (data.todos || []).filter(item => !item.completedAt).map(item => `[全局待办 · 未完成] ${item.content}`);
    return [...memories, ...todos].join('\n');
  }

  function stickerAiContext(data) {
    const categories = (data.stickerCategories || []).flatMap(category => {
      const setting = data.stickerCategorySettings?.[category];
      if (!setting?.aiEnabled) return [];
      const categoryStickers = (data.stickers || []).filter(sticker => sticker.category === category && typeof sticker.url === 'string');
      const prefix = window.petalAnalyzeStickerPrefix?.(categoryStickers) || '';
      if (!prefix) return [];
      const stickers = categoryStickers
        .filter(sticker => sticker.url.startsWith(prefix) && sticker.url.length > prefix.length)
        .map(sticker => `${sticker.name || '表情包'}：${sticker.url.slice(prefix.length)}`);
      return stickers.length ? [`分类「${category}」的链接前缀为 ${prefix}；可选表情：${stickers.join('；')}`] : [];
    });
    if (!categories.length) return '';
    return `可用表情包（仅限以下列表；不要编造或改写名称、分类或后缀）：\n${categories.join('\n')}\n\n表情包使用规则：只有当表情能自然增强回复时才使用；从列表中选择对应分类、名称和后缀，并在回复中输出 <使用表情包>{"category":"分类名","suffix":"对应后缀"}</使用表情包>。category 和 suffix 必须与列表完全一致，不要输出完整 URL；没有合适的表情时不要输出此标签。网页会将标签替换成对应图片。`;
  }

  function chatSlimeInstructionText() {
    return '表情团子已开启：每次普通回复结束时附加一个独立的 <团子>{"body":"#十六进制颜色","face":"简短颜文字","action":"default|happy|shy|贴贴蹭你|scheming|sad|angry|scared|love"}</团子> 控制标签，不要在正文中解释标签。action 可省略；body 必须为 #RRGGBB。暖色使用较高但克制的饱和度，冷色使用较低饱和度，避免荧光色；颜文字不要括号、不要过长、少用装饰符号。动作与颜文字和颜色自由组合，不要固定绑定。';
  }

  function buildSystemPrompt(data) {
    const memory = ordinaryMemoryText(data);
    const stickers = stickerAiContext(data);
    const slimeInstruction = data.settings.appearance?.chatSlimeEnabled ? chatSlimeInstructionText() : '';
    return [`当前本地日期：${isoDate(new Date())}`, systemInstructionText(data), stickers, slimeInstruction, todayNoteStatusText(data), memory ? `当前角色存档记忆：\n${memory}` : ''].filter(Boolean).join('\n\n');
  }

  function pickConversation(data) {
    const settings = data.settings.tokenSettings;
    const maxTokens = Math.max(256, Number(settings.chatHistoryTokenLimit) || 6000);
    const selected = [];
    let tokens = 0;
    for (const message of chatForActiveCharacter(data).filter(item => !item.summaryId).slice().reverse()) {
      let content = chatMessageContent(message);
      let count = estimateTokens(content);
      if (message.attachment) {
        selected.unshift({ role: message.role, content });
        tokens += count;
        if (tokens >= maxTokens) break;
        continue;
      }
      if (!selected.length && count > maxTokens) {
        content = Array.from(content).slice(-Math.floor(maxTokens * 3.2)).join('');
        count = estimateTokens(content);
      }
      if (tokens + count > maxTokens) break;
      selected.unshift({ role: message.role, content });
      tokens += count;
    }
    return selected;
  }

  function compactedAttachmentIds(data, conversation) {
    const includedContentCounts = new Map();
    for (const message of conversation) {
      const key = `${message.role}\u0000${message.content}`;
      includedContentCounts.set(key, (includedContentCounts.get(key) || 0) + 1);
    }
    const ids = [];
    for (const message of chatForActiveCharacter(data).filter(item => !item.summaryId && item.attachment && !item.attachment.contextCompacted)) {
      const key = `${message.role}\u0000${chatMessageContent(message)}`;
      const count = includedContentCounts.get(key) || 0;
      if (!count) continue;
      ids.push(message.id);
      includedContentCounts.set(key, count - 1);
    }
    return ids;
  }

  function maybePromptChatSummary() {
    const data = readData();
    const pending = chatForActiveCharacter(data).filter(message => !message.summaryId);
    const pendingTokens = estimateTokens(pending.map(chatMessageContent).join('\n'));
    const threshold = Math.max(256, Number(data.settings.tokenSettings.autoSummaryTokenThreshold) || 4000);
    const level = Math.floor(pendingTokens / threshold);
    if (level <= Number(data.settings.tokenSettings.lastChatSummaryReminderLevel || 0)) return;
    data.settings.tokenSettings.lastChatSummaryReminderLevel = level;
    writeData(data);
    $('chatSummaryReminderText').textContent = `未总结的对话约 ${pendingTokens.toLocaleString()} token，已达到提醒阈值。可以前往聊天总结页面挑选记录并整理成长期记忆。`;
    const dialog = $('chatSummaryReminder');
    if (!dialog.open) dialog.showModal();
  }

  function parseHealthQuery(text) {
    const candidate = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    let query;
    try { query = JSON.parse(candidate); } catch { return null; }
    if (!query || query.type !== 'HEALTH_QUERY') return null;
    const categories = [...new Set(Array.isArray(query.categories) ? query.categories : [query.category])];
    if (!categories.length || categories.some(category => !allowedHealthCategories.has(category))) return { error: '模型请求了不支持的健康数据类别，已拒绝读取。' };
    const start = query.from || query.start_date || query.date;
    const end = query.to || query.end_date || query.date || start;
    if (!validIsoDate(start) || !validIsoDate(end) || end < start) return { error: '健康数据请求日期无效，已拒绝读取。' };
    return { categories, start, end };
  }

  function parseWeatherQuery(text) {
    const candidates = [text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')];
    const messageContents = [...text.matchAll(/<消息>([\s\S]*?)<\/消息>/g)].map(match => match[1].trim());
    candidates.push(...messageContents);
    candidates.push(...[...text.matchAll(/\{[^{}]*"type"\s*:\s*"WEATHER_QUERY"[^{}]*\}/g)].map(match => match[0]));
    let query = null;
    for (const candidate of candidates) {
      try {
        query = JSON.parse(candidate);
        break;
      } catch {}
    }
    if (!query || query.type !== 'WEATHER_QUERY') return null;
    const forecastDays = query.forecast_days === undefined ? 7 : query.forecast_days;
    if (!Number.isInteger(forecastDays) || forecastDays < 1 || forecastDays > 7) {
      return { error: '天气查询的预报天数无效，已拒绝请求。' };
    }
    return { forecastDays };
  }

  function hasWeatherForecastForDate(weather, date) {
    const forecast = weather?.forecast;
    return Boolean(
      forecast?.current
      && Array.isArray(forecast.forecast)
      && forecast.forecast.some(day => day?.date === date && Number.isFinite(day.lowC) && Number.isFinite(day.highC))
    );
  }

  function weatherDescription(code) {
    const descriptions = {
      0: '晴',
      1: '大致晴朗',
      2: '局部多云',
      3: '阴',
      45: '有雾',
      48: '有雾凇',
      51: '毛毛雨',
      53: '中等毛毛雨',
      55: '强毛毛雨',
      56: '冻毛毛雨',
      57: '强冻毛毛雨',
      61: '小雨',
      63: '中雨',
      65: '大雨',
      66: '冻雨',
      67: '强冻雨',
      71: '小雪',
      73: '中雪',
      75: '大雪',
      77: '雪粒',
      80: '阵雨',
      81: '较强阵雨',
      82: '强阵雨',
      85: '阵雪',
      86: '强阵雪',
      95: '雷暴',
      96: '雷暴伴小冰雹',
      99: '雷暴伴强冰雹'
    };
    return descriptions[code] || `未知天气（代码 ${code}）`;
  }

  function weatherCitySearchTerms(city) {
    const terms = new Set([city]);
    const cityWithDistrict = city.match(/^(.+?(?:市|州|盟|地区)).*(?:区|县|旗|新区|开发区|街道|镇|乡)$/);
    if (cityWithDistrict) {
      terms.add(cityWithDistrict[1]);
      terms.add(cityWithDistrict[1].replace(/(?:市|州|盟|地区)$/, ''));
    }
    terms.add(city.replace(/(?:特别行政区|自治区|自治州|地区|市|州|盟)$/, ''));
    return [...terms].filter(Boolean);
  }

  async function queryWeather(city, forecastDays) {
    let place = null;
    for (const searchTerm of weatherCitySearchTerms(city)) {
      const geocodingUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
      geocodingUrl.search = new URLSearchParams({ name: searchTerm, count: '1', language: 'zh', format: 'json' }).toString();
      const geocodingResponse = await fetch(geocodingUrl);
      if (!geocodingResponse.ok) throw new Error(`城市查询服务请求失败（HTTP ${geocodingResponse.status}）。`);
      const geocoding = await geocodingResponse.json();
      place = geocoding.results?.[0];
      if (place) break;
    }
    if (!place || !Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) {
      throw new Error(`天气服务无法识别“${city}”。请在设置中输入城市名称，例如“武汉”；暂不支持只填写区县名称。`);
    }

    const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
    forecastUrl.search = new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      current: 'temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      timezone: 'auto',
      forecast_days: String(forecastDays)
    }).toString();
    const forecastResponse = await fetch(forecastUrl);
    if (!forecastResponse.ok) throw new Error(`天气预报服务请求失败（HTTP ${forecastResponse.status}）。`);
    const forecast = await forecastResponse.json();
    if (!forecast.current || !forecast.daily?.time) throw new Error('天气服务没有返回完整的当前天气和预报数据。');

    return {
      source: 'Open-Meteo (https://open-meteo.com/), CC BY 4.0',
      location: [place.name, place.admin1, place.country].filter(Boolean).join('，'),
      timezone: forecast.timezone,
      fetchedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      current: {
        time: forecast.current.time,
        temperatureC: forecast.current.temperature_2m,
        feelsLikeC: forecast.current.apparent_temperature,
        weatherCode: forecast.current.weather_code,
        condition: weatherDescription(forecast.current.weather_code),
        precipitationMm: forecast.current.precipitation,
        windSpeedKmh: forecast.current.wind_speed_10m
      },
      forecast: forecast.daily.time.map((date, index) => ({
        date,
        weatherCode: forecast.daily.weather_code[index],
        condition: weatherDescription(forecast.daily.weather_code[index]),
        highC: forecast.daily.temperature_2m_max[index],
        lowC: forecast.daily.temperature_2m_min[index],
        precipitationProbabilityPercent: forecast.daily.precipitation_probability_max[index]
      }))
    };
  }

  function queryLocalHealth(data, query) {
    const hidden = new Set(data.hiddenHealthDates);
    const dates = new Set(allHealthDates(data).filter(date => date >= query.start && date <= query.end && !hidden.has(date)));
    const results = [...dates].map(date => {
      const records = {};
      for (const category of query.categories) {
        if (category === 'fridge') continue;
        if (category === 'health_memory') {
          const details = recordsForDate(data, date);
          const summaries = [
            ...(details.health_memory || []),
            ...(data.healthAnalysisRecords || []).filter(item => item.type === 'health_summary' && item.date === date)
          ].filter(item => (item.dates || [item.date]).every(itemDate => !hidden.has(itemDate)));
          if (summaries.length) records.health_memory = summaries;
        } else {
          const matches = category === 'food_analysis'
            ? (data.foodAnalyses || []).filter(item => item.date === date)
            : category === 'health_analysis'
              ? (data.healthAnalysisRecords || []).filter(item => item.date === date)
              : (data[category] || []).filter(item => item.date === date);
          if (matches.length) records[category] = matches;
        }
      }
      return { date, records };
    }).filter(item => Object.keys(item.records).length);
    if (query.categories.includes('fridge')) {
      const inventory = (data.fridgeInventory || []).filter(item => Number(item.amount) > 0 || Number(item.quantity) > 0);
      if (inventory.length) results.push({ permanentMemory: '冰箱库存', records: { fridge: inventory } });
    }
    return results;
  }

  function explicitHealthRecordIntent(userMessage, type) {
    const text = String(userMessage || '');
    const request = /(?:帮我|替我|请|麻烦|能不能|可以).{0,12}(?:记录|记下|记一下|记成|记到)|(?:记录一下|记一下|记下来|记成)/u.test(text);
    if (!request) return false;
    const typeTerms = {
      food: /吃|饮食|早餐|午餐|晚餐|正餐|零食|点心|饮品|喝水|饮水/u,
      sleep: /睡眠|睡觉|入睡|起床|睡了/u,
      bowel: /排便|大便|如厕/u,
      weight: /体重|称重/u,
      joy: /\bjoy\b|自慰|高潮|性生活/iu
    };
    return typeTerms[type]?.test(text) === true;
  }

  function validateAssistantHealthRecord(value) {
    const types = new Set(['food', 'sleep', 'bowel', 'weight', 'joy']);
    if (!value || typeof value !== 'object' || Array.isArray(value) || !types.has(value.type)) throw new Error('记录类别无效。');
    const date = value.date || isoDate(new Date());
    if (!validIsoDate(date)) throw new Error('记录日期无效。');
    const record = { id: `ai-health-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, date };
    const textField = (key, maxLength = 300) => {
      const field = value[key];
      if (field === undefined || field === null || field === '') return '';
      if (typeof field !== 'string' || field.length > maxLength) throw new Error(`${key} 字段格式无效。`);
      return field.trim();
    };
    const numberField = (key, max) => {
      const field = value[key];
      if (field === undefined || field === null || field === '') return undefined;
      if (typeof field !== 'number' || !Number.isFinite(field) || field < 0 || field > max) throw new Error(`${key} 数值超出允许范围。`);
      return field;
    };
    const timeField = key => {
      const field = textField(key, 5);
      if (field && !/^([01]\d|2[0-3]):[0-5]\d$/.test(field)) throw new Error(`${key} 时间格式无效。`);
      return field;
    };
    if (value.type === 'food') {
      const content = textField('content');
      if (!content) throw new Error('饮食记录缺少食物或饮品内容。');
      record.content = content;
      record.serving = textField('serving', 100);
      record.category = textField('category', 20);
      if (record.category && !['正餐', '零嘴', '饮品', '其他'].includes(record.category)) throw new Error('饮食类别无效。');
      record.feeling = textField('feeling', 100);
      record.note = textField('note');
      record.waterMl = numberField('waterMl', 10000) || 0;
      record.time = timeField('time');
    } else if (value.type === 'sleep') {
      record.hours = numberField('hours', 24);
      record.start = timeField('start');
      record.end = timeField('end');
      record.quality = textField('quality', 100);
      record.note = textField('note');
      if (record.hours === undefined && record.start && record.end) {
        const [startHour, startMinute] = record.start.split(':').map(Number);
        const [endHour, endMinute] = record.end.split(':').map(Number);
        record.hours = ((endHour * 60 + endMinute - startHour * 60 - startMinute + 1440) % 1440) / 60;
      }
      if (record.hours === undefined && !record.start && !record.end && !record.quality && !record.note) throw new Error('睡眠记录信息不足。');
    } else if (value.type === 'bowel') {
      record.time = timeField('time');
      record.feeling = textField('feeling', 100);
      record.form = textField('form', 100);
      record.note = textField('note');
      if (!record.feeling && !record.form && !record.note) throw new Error('排便记录信息不足。');
    } else if (value.type === 'weight') {
      record.value = numberField('value', 500);
      record.note = textField('note');
      if (record.value === undefined) throw new Error('体重记录缺少数值。');
    } else {
      record.time = timeField('time');
      record.durationMinutes = numberField('durationMinutes', 1440);
      record.note = textField('note');
      if (record.durationMinutes === undefined && !record.note) throw new Error('Joy 记录信息不足。');
    }
    return { type: value.type, record };
  }

  function captureAssistantMemories(data, text, latestUserMessage = '') {
    const date = isoDate(new Date());
    const makeId = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const actionEvents = [];
    const actorName = data.settings.prompts?.characters?.find(item => item.id === data.settings.prompts.activeCharacterId)?.name || 'AI';
    const previousPetSlime = [...data.chat].reverse().find(message => message.role === 'assistant' && message.petSlime)?.petSlime;
    let petSlime = previousPetSlime ? { ...previousPetSlime } : { body: '#6CA9C8', face: '⦁֊⦁', action: 'default' };
    let cleaned = text;
    cleaned = cleaned.replace(/<使用表情包>([\s\S]*?)<\/使用表情包>/g, (_, content) => {
      try {
        const choice = JSON.parse(content.trim());
        const category = String(choice?.category || '');
        const suffix = String(choice?.suffix || '');
        const setting = data.stickerCategorySettings?.[category];
        const categoryStickers = (data.stickers || []).filter(item => item.category === category && typeof item.url === 'string');
        const prefix = window.petalAnalyzeStickerPrefix?.(categoryStickers) || '';
        if (!setting?.aiEnabled || !prefix || !suffix) throw new Error('分类未启用或图片后缀无效。');
        const sticker = categoryStickers.find(item => item.url === `${prefix}${suffix}`);
        if (!sticker) throw new Error('所选表情不在该分类的后缀库中。');
        return `[贴图:${sticker.url}]`;
      } catch (error) {
        console.warn('忽略无效的 AI 表情包选择', error);
        return '（表情包未发送：AI 选择的分类或后缀无效。）';
      }
    });
    if (data.settings.appearance?.chatSlimeEnabled) cleaned = cleaned.replace(/<团子>([\s\S]*?)<\/团子>/g, (_, content) => {
      try {
        const value = JSON.parse(content.trim());
        const body = normalizePetSlimeColor(value?.body);
        const face = normalizePetSlimeFace(value?.face);
        const actions = new Set(['default', 'happy', 'shy', 'nuzzle', 'scheming', 'sad', 'angry', 'scared', 'love']);
        const action = value.action === '贴贴蹭你' ? 'nuzzle' : value.action;
        if (body && face) petSlime = { body, face, action: actions.has(action) ? action : 'default' };
      } catch (error) {
        console.warn('忽略无效的团子控制标签', error);
      }
      return '';
    });
    cleaned = cleaned.replace(/<营养目标>([\s\S]*?)<\/营养目标>/g, (_, content) => {
      try {
        const values = JSON.parse(content.trim());
        const limits = { waterMl: 20000, caloriesKcal: 20000, proteinG: 1000, carbohydrateG: 1000, fatG: 1000, fiberG: 1000 };
        if (!values || typeof values !== 'object' || Array.isArray(values)) throw new Error('目标内容必须是 JSON 对象。');
        const entries = Object.entries(values);
        if (!entries.length || entries.some(([key, value]) => !Object.prototype.hasOwnProperty.call(limits, key) || typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > limits[key])) {
          throw new Error('目标字段或数值超出允许范围。');
        }
        data.settings.dietGoals = { ...data.settings.dietGoals, ...values };
        actionEvents.push('设置了营养目标');
        return '';
      } catch (error) {
        console.error('AI 营养目标标签无效', error);
        return `（营养目标未能保存：${error.message}）`;
      }
    });
    cleaned = cleaned.replace(/<记录健康数据>([\s\S]*?)<\/记录健康数据>/g, (_, content) => {
      try {
        const parsed = JSON.parse(content.trim());
        if (!explicitHealthRecordIntent(latestUserMessage, parsed?.type)) return '（这次没有明确要求代记，因此未新增健康记录。）';
        const { type, record } = validateAssistantHealthRecord(parsed);
        data[type].unshift(record);
        const labels = { food: '饮食', sleep: '睡眠', bowel: '排便', weight: '体重', joy: 'Joy' };
        actionEvents.push(`写入了一条${labels[type]}消息`);
        return '';
      } catch (error) {
        console.error('AI 健康记录标签无效或未获用户明确授权', error);
        return `（健康记录未能保存：${error.message}）`;
      }
    });
    const ordinaryArchive = () => {
      const character = data.settings.prompts?.characters?.find(item => item.id === data.settings.prompts.activeCharacterId);
      let archive = data.memoryArchives.find(item => item.id === character?.memoryArchiveId && !['health-archive', 'personal-profile-archive', 'chat-summary-archive'].includes(item.id));
      if (!archive) archive = data.memoryArchives.find(item => !['health-archive', 'personal-profile-archive', 'chat-summary-archive'].includes(item.id));
      if (!archive) {
        archive = { id: 'archive-default', name: '对话存档', createdAt: date, items: [] };
        data.memoryArchives.push(archive);
      }
      archive.items ||= [];
      return archive;
    };
    const normalizeActionTarget = value => String(value || '').trim().replace(/\s+/g, ' ');
    const ensureTodoMemory = todo => {
      if (todo.completedAt) {
        removeCompletedTodoMemories(data, todo);
        return null;
      }
      const archive = ordinaryArchive();
      let item = archive.items.find(entry => entry.todoId === todo.id)
        || archive.items.find(entry => entry.source === 'AI 待办' && !entry.todoId && normalizeActionTarget(entry.content) === normalizeActionTarget(todo.content));
      if (!item) {
        item = { id: makeId('todo-memory'), type: '待办', date: todo.createdAt || date, content: todo.content, source: 'AI 待办' };
        archive.items.unshift(item);
      }
      item.todoId = todo.id;
      item.completedAt = todo.completedAt || '';
      return item;
    };
    const markDeletedMemoryItems = items => {
      window.petalDeletedMemoryItemIds = [...new Set([...(window.petalDeletedMemoryItemIds || []), ...items.map(item => item.id)])];
    };
    cleaned = cleaned.replace(/<记忆\s+类别="(长期偏好|待办|重要经历|当前近况|其他)">([\s\S]*?)<\/记忆>/g, (_, type, content) => {
      const value = content.trim();
      if (value) {
        const archive = profileMemoryTypes.has(type)
          ? data.memoryArchives.find(item => item.id === 'personal-profile-archive')
          : ordinaryArchive();
        archive.items.unshift({ id: makeId('memory'), type, date, content: value, source: 'AI 自动捕获' });
        actionEvents.push('保存了一条记忆');
      }
      return '';
    });
    cleaned = cleaned.replace(/<更新记忆>([\s\S]*?)<\/更新记忆>/g, (_, content) => {
      try {
        const update=JSON.parse(content.trim());
        const categories=new Set(['长期偏好','待办','重要经历','当前近况','其他']);
        const original=normalizeActionTarget(update?.原文);
        const value=String(update?.内容||'').trim();
        if(!original||!value||!categories.has(update?.类别))return '';
        const matches=data.memoryArchives.filter(archive=>archive.id!=='health-archive').flatMap(archive=>archive.items||[])
          .filter(item=>!item.summary&&!item.todoId&&item.source!=='AI 收藏'&&item.type!=='收藏'&&normalizeActionTarget(item.content)===original);
        if(matches.length===1){
          const item=matches[0];
          const owner=data.memoryArchives.find(archive=>(archive.items||[]).includes(item));
          if(profileMemoryTypes.has(update.类别)&&owner?.id!=='personal-profile-archive'){
            owner.items=owner.items.filter(entry=>entry!==item);
            data.memoryArchives.find(archive=>archive.id==='personal-profile-archive').items.unshift(item);
          }else if(!profileMemoryTypes.has(update.类别)&&owner?.id==='personal-profile-archive'){
            owner.items=owner.items.filter(entry=>entry!==item);
            ordinaryArchive().items.unshift(item);
          }
          item.content=value;item.type=update.类别;item.date=date;item.source='AI 自动捕获';
          actionEvents.push('更新了一条记忆');
        }
      }catch(error){console.error('AI 记忆更新标签无效',error)}
      return '';
    });
    cleaned = cleaned.replace(/<待办>([\s\S]*?)<\/待办>/g, (_, content) => {
      const value = content.trim();
      if (value) {
        let todo = data.todos.find(item => item.content === value && !item.completedAt);
        if (!todo) {
          todo = { id: makeId('todo'), content: value, createdAt: date, completedAt: '' };
          data.todos.unshift(todo);
          actionEvents.push('创建了一条待办');
        }
        ensureTodoMemory(todo);
      }
      return '';
    });
    cleaned = cleaned.replace(/<完成待办>([\s\S]*?)<\/完成待办>/g, (_, content) => {
      const target = normalizeActionTarget(content);
      const matches = data.todos.filter(todo => !todo.completedAt && normalizeActionTarget(todo.content) === target);
      if (target && matches.length === 1) {
        const [todo] = matches;
        removeCompletedTodoMemories(data, todo);
        data.todos = data.todos.filter(item => item.id !== todo.id);
        actionEvents.push('完成了一条待办');
      }
      return '';
    });
    cleaned = cleaned.replace(/<删除待办>([\s\S]*?)<\/删除待办>/g, (_, content) => {
      const target = normalizeActionTarget(content);
      const matches = data.todos.filter(todo => normalizeActionTarget(todo.content) === target);
      if (target && matches.length === 1) {
        const [todo] = matches;
        const removed = data.memoryArchives.flatMap(archive => archive.items || []).filter(item => item.todoId === todo.id);
        markDeletedMemoryItems(removed);
        data.todos = data.todos.filter(item => item.id !== todo.id);
        for (const archive of data.memoryArchives) archive.items = (archive.items || []).filter(item => !removed.includes(item));
        actionEvents.push('删除了一条待办');
      }
      return '';
    });
    cleaned = cleaned.replace(/<收藏>([\s\S]*?)<\/收藏>/g, (_, content) => {
      const value = content.trim();
      const archive = ordinaryArchive();
      if (value && !archive.items.some(item => item.source === 'AI 收藏' && item.content === value)) {
        archive.items.unshift({ id: makeId('favorite'), type: '收藏', date, content: value, source: 'AI 收藏' });
        actionEvents.push('收藏了一条消息');
      }
      return '';
    });
    cleaned = cleaned.replace(/<删除收藏>([\s\S]*?)<\/删除收藏>/g, (_, content) => {
      const target = normalizeActionTarget(content);
      if (target) {
        const removed = data.memoryArchives.flatMap(archive => archive.items || []).filter(item => (item.source === 'AI 收藏' || item.type === '收藏')
          && normalizeActionTarget(item.content) === target);
        if (removed.length) {
          markDeletedMemoryItems(removed);
          for (const archive of data.memoryArchives) archive.items = (archive.items || []).filter(item => !removed.includes(item));
          actionEvents.push('删除了一条收藏');
        }
      }
      return '';
    });
    cleaned = cleaned.replace(/<今日留言>([\s\S]*?)<\/今日留言>/g, (_, content) => {
      const value = content.trim();
      if (value) {
        data.todayNote = { date, content: value };
        actionEvents.push('留了言');
      }
      return '';
    }).trim();
    const matches = [...cleaned.matchAll(/<消息>([\s\S]*?)<\/消息>/g)];
    let visibleText;
    if (matches.length) {
      visibleText = [];
      let cursor = 0;
      for (const match of matches) {
        const outside = cleaned.slice(cursor, match.index).trim();
        if (outside) visibleText.push(outside);
        if (match[1].trim()) visibleText.push(match[1].trim());
        cursor = match.index + match[0].length;
      }
      const trailing = cleaned.slice(cursor).trim();
      if (trailing) visibleText.push(trailing);
    } else visibleText = [cleaned.replace(/<\/?消息>/g, '').trim()].filter(Boolean);
    return {
      messages: visibleText.length ? visibleText : ['（已为你收好。）'],
      actionSummary: actionEvents.length ? `${actorName}${actionEvents.join('、')}~` : '',
      petSlime
    };
  }

  function normalizePetSlimeColor(value) {
    const match = /^#?([\da-f]{6})$/i.exec(String(value || '').trim());
    if (!match) return '';
    const hex = match[1];
    const red = parseInt(hex.slice(0, 2), 16) / 255;
    const green = parseInt(hex.slice(2, 4), 16) / 255;
    const blue = parseInt(hex.slice(4, 6), 16) / 255;
    const maximum = Math.max(red, green, blue);
    const minimum = Math.min(red, green, blue);
    const lightness = (maximum + minimum) / 2;
    let hue = 0;
    let saturation = 0;
    if (maximum !== minimum) {
      const difference = maximum - minimum;
      saturation = difference / (1 - Math.abs(2 * lightness - 1));
      if (maximum === red) hue = ((green - blue) / difference + (green < blue ? 6 : 0)) / 6;
      else if (maximum === green) hue = ((blue - red) / difference + 2) / 6;
      else hue = ((red - green) / difference + 4) / 6;
    }
    const warm = hue <= 0.22 || hue >= 0.95;
    saturation = Math.min(warm ? 0.74 : 0.48, Math.max(warm ? 0.52 : 0.24, saturation));
    const clampedLightness = Math.min(0.66, Math.max(0.34, lightness));
    const chroma = (1 - Math.abs(2 * clampedLightness - 1)) * saturation;
    const section = hue * 6;
    const secondary = chroma * (1 - Math.abs(section % 2 - 1));
    let channels;
    if (section < 1) channels = [chroma, secondary, 0];
    else if (section < 2) channels = [secondary, chroma, 0];
    else if (section < 3) channels = [0, chroma, secondary];
    else if (section < 4) channels = [0, secondary, chroma];
    else if (section < 5) channels = [secondary, 0, chroma];
    else channels = [chroma, 0, secondary];
    const offset = clampedLightness - chroma / 2;
    return `#${channels.map(channel => Math.round((channel + offset) * 255).toString(16).padStart(2, '0')).join('')}`;
  }

  function normalizePetSlimeFace(value) {
    const face = Array.from(String(value || '').replace(/[()（）\[\]{}]/g, '').trim()).slice(0, 12).join('');
    return face || '⦁֊⦁';
  }

  function petSlimeMarkup(petSlime) {
    if (!petSlime) return '';
    const actions = new Set(['default', 'happy', 'shy', 'nuzzle', 'scheming', 'sad', 'angry', 'scared', 'love']);
    const action = actions.has(petSlime.action) ? petSlime.action : 'default';
    const color = normalizePetSlimeColor(petSlime.body) || '#6CA9C8';
    const face = escapeHtml(normalizePetSlimeFace(petSlime.face));
    const particles = {
      default: ['✧', '‧', '˚'], happy: ['♪', '✧', '★', '❀'], shy: ['♡', '⁄', '‧'],
      nuzzle: ['♡', '蹭蹭', '❀', '🫧'], scheming: ['嘿嘿', '✦', 'ψ', '▪'],
      sad: [], angry: ['💢', '🔥'], scared: ['💦', '!', '…'], love: ['💖', '💕', '♥', '♡']
    }[action];
    const particleMarkup = particles.map((particle, index) => `<span class="petal-slime-fx fx-${index + 1}">${escapeHtml(particle)}</span>`).join('');
    const tears = action === 'sad' ? '<i class="petal-slime-tear tear-left"></i><i class="petal-slime-tear tear-right"></i>' : '';
    return `<span class="chat-petal-slime mood-${action}" style="--slime-color:${color}" aria-hidden="true"><span class="petal-slime-shadow"></span><span class="petal-slime-body"><i class="petal-slime-blush blush-left"></i><i class="petal-slime-blush blush-right"></i><span class="petal-slime-face">${face}</span>${tears}</span>${particleMarkup}</span>`;
  }

  function ensureChatSummaryArchive(data) {
    let archive = data.memoryArchives.find(item => item.id === 'chat-summary-archive');
    if (!archive) {
      archive = { id: 'chat-summary-archive', name: '聊天总结', createdAt: isoDate(new Date()), items: [] };
      data.memoryArchives.unshift(archive);
      if (!data.settings.chatMemoryArchiveIds.includes(archive.id)) data.settings.chatMemoryArchiveIds.push(archive.id);
    }
    archive.items ||= [];
    return archive;
  }

  function selectedChatSummaryArchive(data) {
    const selected=new Set(data.settings.chatMemoryArchiveIds||[]);
    const character = activeCharacter(data);
    const boundArchive = data.memoryArchives.find(archive => archive.id === character?.memoryArchiveId
      && !['health-archive', 'personal-profile-archive'].includes(archive.id));
    if (boundArchive) return boundArchive;
    return data.memoryArchives.find(archive=>!['health-archive', 'personal-profile-archive'].includes(archive.id)&&selected.has(archive.id))||ensureChatSummaryArchive(data);
  }

  function saveChatSummary(data, items, content, source, range) {
    const date = isoDate(new Date());
    const id = `chat-summary-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const archive=selectedChatSummaryArchive(data);
    const entry = {
      id,
      source,
      archiveId:archive.id,
      characterId: activeCharacterId(data),
      date,
      from: range.from,
      to: range.to,
      count: items.length,
      content
    };
    data.chatSummaries.unshift(entry);
    archive.items.unshift({
      id: `memory-${id}`,
      type: '聊天总结',
      date,
      content,
      source: '聊天总结',
      summaryId: id,
      range: `${range.from}–${range.to}`
    });
    for (const item of items) {
      item.summaryId = id;
      item.summarizedAt = date;
    }
    data.settings.tokenSettings.lastChatSummaryReminderLevel = 0;
    writeData(data);
    renderChatSummaryPage();
    renderChatMemoryChoices();
    refresh();
    return entry;
  }

  function unsummarizedChat(data) {
    return chatForActiveCharacter(data).map((message, index) => ({ message, index })).filter(item => !item.message.summaryId);
  }

  async function summarizeChatRange(from, to, source = '手动总结') {
    if (chatSummarizing) return;
    const data = readData();
    const roleChat = chatForActiveCharacter(data);
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from || to > roleChat.length) {
      throw new Error(`请输入 1 至 ${roleChat.length} 之间有效的聊天条数范围。`);
    }
    const selected = roleChat.slice(from - 1, to).filter(message => !message.summaryId);
    if (!selected.length) throw new Error('所选聊天记录都已总结，无需重复总结。');
    const config = apiConfig('analysis');
    const transcript = selected.map(message => `${message.role === 'user' ? '用户' : 'AI'}：${chatMessageContent(message)}`).join('\n');
    chatSummarizing = true;
    $('runChatSummary').disabled = true;
    $('chatSummaryFeedback').textContent = '正在使用总结 API 整理所选聊天记录…';
    try {
      const content = await requestCompletion(config, [
        { role: 'system', content: data.settings.analysisPrompts.chatSummary || window.petalDefaultAnalysisPrompts.chatSummary },
        { role: 'user', content: transcript }
      ]);
      const current = readData();
      const selectedIds = new Set(selected.map(item => item.id));
      const currentRoleChat = chatForActiveCharacter(current);
      const currentItems = currentRoleChat.filter(item => selectedIds.has(item.id) && !item.summaryId);
      if (!currentItems.length) throw new Error('所选聊天记录已变化，请重新选择范围。');
      const firstIndex = currentRoleChat.findIndex(item => selectedIds.has(item.id)) + 1;
      let lastIndex = 0;
      currentRoleChat.forEach((item, index) => { if (selectedIds.has(item.id)) lastIndex = index + 1; });
      const entry = saveChatSummary(current, currentItems, content, source, { from: firstIndex, to: lastIndex });
      $('chatSummaryFeedback').textContent = `已总结 ${currentItems.length} 条聊天记录，并存入「聊天总结」长期记忆。`;
      notify('聊天总结已保存；原对话不会再发送给 AI。');
      return entry;
    } finally {
      chatSummarizing = false;
      $('runChatSummary').disabled = false;
      renderChatSummaryPage();
    }
  }

  async function maybeAutoSummarizeHealth() {
    if (healthAutoSummarizing || summarizing) return;
    const data = readData();
    const archive = data.memoryArchives.find(item => item.id === 'health-archive');
    const summarizedDates = new Set([
      ...(archive?.items || []).filter(item => item.summary).flatMap(item => item.dates || []),
      ...(data.healthAnalysisRecords || []).filter(item => item.type === 'health_summary').map(item => item.date)
    ]);
    const hiddenDates = new Set(data.hiddenHealthDates || []);
    const pendingDates = allHealthDates(data).filter(date => !summarizedDates.has(date) && !hiddenDates.has(date)).sort();
    const threshold = Math.max(256, Number(data.settings.tokenSettings.healthMemoryAutoSummaryTokenThreshold) || 4000);
    const selectedDates = [];
    let tokens = 0;
    for (const date of pendingDates) {
      const dailyRecord = window.petalGetDailyHealthRecord?.(data, date);
      if (!dailyRecord) continue;
      selectedDates.push(date);
      tokens += estimateTokens(dailyRecord);
      if (tokens >= threshold) break;
    }
    if (tokens < threshold || !selectedDates.length) return;
    healthAutoSummarizing = true;
    try {
      await summarizeHealth(selectedDates, `自動健康总结（${selectedDates[0]} 至 ${selectedDates[selectedDates.length - 1]}）`);
    } finally {
      healthAutoSummarizing = false;
    }
  }

  function activeCharacter(data) {
    return data.settings.prompts?.characters?.find(item => item.id === data.settings.prompts.activeCharacterId);
  }

  function activeCharacterId(data) {
    return data.settings.prompts?.activeCharacterId || data.settings.prompts?.characters?.[0]?.id || '';
  }

  function chatForActiveCharacter(data) {
    const characterId = activeCharacterId(data);
    return data.chat.filter(message => message.characterId === characterId);
  }

  function removeCompletedTodoMemories(data, todo) {
    const removed = [];
    const normalizeTarget = value => String(value || '').trim().replace(/\s+/g, ' ');
    for (const archive of data.memoryArchives) {
      archive.items = (archive.items || []).filter(item => {
        const matches = item.todoId === todo.id
          || (!item.todoId && item.source === 'AI 待办' && normalizeTarget(item.content) === normalizeTarget(todo.content));
        if (matches) removed.push(item);
        return !matches;
      });
    }
    if (removed.length) {
      window.petalDeletedMemoryItemIds = [...new Set([...(window.petalDeletedMemoryItemIds || []), ...removed.map(item => item.id)])];
    }
  }

  function syncActiveCharacterArchiveSelection(data) {
    const character = activeCharacter(data);
    if (!character?.autoSwitchMemoryArchive) return false;
    const boundArchive = data.memoryArchives.find(archive => archive.id === character.memoryArchiveId
      && !['health-archive', 'personal-profile-archive'].includes(archive.id));
    const next = boundArchive ? [boundArchive.id] : [];
    if (JSON.stringify(data.settings.chatMemoryArchiveIds || []) === JSON.stringify(next)) return false;
    data.settings.chatMemoryArchiveIds = next;
    data.settings.chatMemoryArchiveIdsConfigured = true;
    return true;
  }

  function renderCharacterArchiveBinding(data = readData()) {
    const character = activeCharacter(data);
    const archives = data.memoryArchives.filter(archive => !['health-archive', 'personal-profile-archive'].includes(archive.id));
    const hasSelectedCharacter = Boolean($('characterSelect').value);
    const select = $('characterArchiveSelect');
    select.innerHTML = `<option value="">不绑定存档</option>${archives.map(archive => `<option value="${escapeHtml(archive.id)}">${escapeHtml(archive.name)}</option>`).join('')}`;
    select.value = hasSelectedCharacter && archives.some(archive => archive.id === character?.memoryArchiveId) ? character.memoryArchiveId : '';
    $('bindCharacterArchive').disabled = !hasSelectedCharacter;
    $('characterAutoSwitchMemory').disabled = !hasSelectedCharacter;
    $('characterAutoSwitchMemory').checked = hasSelectedCharacter && Boolean(character?.autoSwitchMemoryArchive);
    $('characterArchiveBindingStatus').textContent = !hasSelectedCharacter
      ? '请先保存新角色，再配置其绑定存档。'
      : character?.memoryArchiveId && archives.some(archive => archive.id === character.memoryArchiveId)
      ? `当前绑定：${archives.find(archive => archive.id === character.memoryArchiveId).name}`
      : '尚未绑定存档；AI 捕获的角色记忆将写入默认对话存档。';
  }

  function applyCharacterArchiveSwitch() {
    const data = readData();
    if (syncActiveCharacterArchiveSelection(data)) writeData(data);
    renderChatMemoryChoices();
  }

  function renderChatMemoryChoices() {
    const container = $('chatMemoryArchiveChoices');
    if (!container) return;
    const data = readData();
    const archives = data.memoryArchives.filter(archive => !['health-archive', 'personal-profile-archive'].includes(archive.id));
    const selected = new Set(data.settings.chatMemoryArchiveIds || []);
    container.innerHTML = archives.length
      ? archives.map(archive => { const count = (archive.items || []).filter(item => !item.todoId).length + data.todos.length; return `<label class="chat-memory-choice"><input type="checkbox" data-chat-memory-archive="${escapeHtml(archive.id)}" ${selected.has(archive.id) ? 'checked' : ''}><span>${escapeHtml(archive.name)}<small>${count} 条长期记忆</small></span></label>`; }).join('')
      : '<p class="small-muted">目前没有可发送的存档记忆。</p>';
  }

  function addCharacterMemoryControls() {
    if ($('bindCharacterArchive')) return;
    const saveButton = $('saveCharacter');
    const header = saveButton.closest('.panel-title');
    const actions = document.createElement('div');
    actions.className = 'role-character-actions';
    const bindButton = document.createElement('button');
    bindButton.type = 'button';
    bindButton.className = 'secondary-button';
    bindButton.id = 'bindCharacterArchive';
    bindButton.textContent = '绑定存档';
    const toggle = document.createElement('label');
    toggle.className = 'toggle-row role-memory-toggle';
    toggle.innerHTML = '<span class="toggle-copy"><strong>切换角色时自动切换绑定记忆</strong></span><input class="switch" id="characterAutoSwitchMemory" type="checkbox">';
    actions.append(bindButton, toggle, saveButton);
    header.append(actions);
    const status = document.createElement('p');
    status.className = 'small-muted';
    status.id = 'characterArchiveBindingStatus';
    status.textContent = '尚未绑定存档。';
    $('characterPrompt').closest('.field').insertAdjacentElement('afterend', status);
  }

  function addMemoryCaptureExplanation() {
    if ($('memoryCaptureExplanation')) return;
    const note = document.createElement('p');
    note.id = 'memoryCaptureExplanation';
    note.className = 'small-muted';
    note.textContent = '“AI 自动捕获”表示聊天模型在回复中提出了记忆标签，网页解析后保存在本机；系统不会独立推断或生成这类记忆。长期偏好、重要经历和当前近况会进入跨角色共享的个人画像。';
    $('memoryArchiveCards').insertAdjacentElement('beforebegin', note);
  }

  function renderChatSummaryPage() {
    const data = readData();
    const pending = unsummarizedChat(data);
    const roleChat = chatForActiveCharacter(data);
    const selectedArchives=new Set(data.settings.chatMemoryArchiveIds||[]);
    const total = roleChat.length;
    $('chatSummaryCount').textContent = `当前聊天共 ${total} 条记录，其中 ${pending.length} 条尚未总结，可选择任意连续范围；已总结条目会跳过。`;
    $('chatSummaryFrom').max = String(Math.max(total, 1));
    $('chatSummaryTo').max = String(Math.max(total, 1));
    if (!Number($('chatSummaryFrom').value) && pending.length) $('chatSummaryFrom').value = String(pending[0].index + 1);
    if (!Number($('chatSummaryTo').value) && pending.length) $('chatSummaryTo').value = String(pending[pending.length - 1].index + 1);
    if (Number($('chatSummaryFrom').value) > total) $('chatSummaryFrom').value = pending.length ? String(pending[0].index + 1) : '';
    if (Number($('chatSummaryTo').value) > total) $('chatSummaryTo').value = pending.length ? String(pending[pending.length - 1].index + 1) : '';
    $('runChatSummary').disabled = chatSummarizing || !pending.length;
    const selectedSummaryIds=new Map();
    for(const archive of data.memoryArchives.filter(item=>!['health-archive','personal-profile-archive'].includes(item.id)&&selectedArchives.has(item.id))){
      for(const item of archive.items||[]){
        if(item.summaryId&&!selectedSummaryIds.has(item.summaryId))selectedSummaryIds.set(item.summaryId,archive.name);
      }
    }
    const summaries=(data.chatSummaries||[]).filter(item=>selectedSummaryIds.has(item.id) && item.characterId === activeCharacterId(data));
    $('chatSummaryList').innerHTML = summaries.length
      ? summaries.map(item => `<article class="chat-summary-entry"><div class="chat-summary-meta"><div><strong>${escapeHtml(item.source === '自动总结' ? '自动聊天总结' : '聊天总结')}</strong><span>${escapeHtml(selectedSummaryIds.get(item.id))}</span></div><span>${escapeHtml(item.date)} · 第 ${escapeHtml(item.from)}–${escapeHtml(item.to)} 条 · ${escapeHtml(item.count)} 条对话</span><button class="danger-button chat-summary-delete" type="button" data-chat-summary-delete="${escapeHtml(item.id)}" aria-label="删除聊天总结">删除</button></div><p>${escapeHtml(item.content)}</p></article>`).join('')
      : `<p class="home-empty">${selectedArchives.size?'当前选中的存档里还没有聊天总结。':'请先在聊天“更多”中勾选包含聊天总结的存档。'}</p>`;
  }

  function deleteChatSummary(summaryId){
    const data=readData();
    const summary=data.chatSummaries.find(item=>item.id===summaryId);
    if(!summary)return;
    if(!confirm('删除这条聊天总结？原聊天会恢复为未总结状态，并重新参与上下文。'))return;
    for(const archive of data.memoryArchives)archive.items=(archive.items||[]).filter(item=>item.summaryId!==summaryId);
    data.chatSummaries=data.chatSummaries.filter(item=>item.id!==summaryId);
    for(const message of data.chat){if(message.summaryId===summaryId){delete message.summaryId;delete message.summarizedAt}}
    writeData(data);renderChatSummaryPage();renderChatMemoryChoices();refresh();
    notify('聊天总结已删除，原聊天已恢复。');
  }

  function openChatSummaryPage(mode) {
    $('chat-shell').hidden = true;
    $('chatSummaryPage').hidden = false;
    $('chatSummaryCreate').hidden = mode !== 'create';
    renderChatSummaryPage();
    $('chatMoreMenu').classList.remove('open');
    $('chatSummaryPage').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function saveChatMessage() {
    const input = $('chatInput');
    const text = input.value.trim();
    if (!text) return;
    const data = readData();
    data.chat.push({ id: `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, role: 'user', characterId: activeCharacterId(data), text, time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) });
    writeData(data);
    input.value = '';
    renderChatFromStorage();
    playUserMessageSound();
    renderChatSummaryPage();
    renderChatMemoryChoices();
    maybePromptChatSummary();
  }

  function cloneData(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function snapshotAssistantActions(data) {
    return cloneData({
      dietGoals: data.settings.dietGoals,
      todayNote: data.todayNote,
      todos: data.todos,
      memoryArchives: data.memoryArchives.filter(archive => archive.id !== 'health-archive')
    });
  }

  function sameValue(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  function changedObjectPair(before, after) {
    const oldValues = {};
    const newValues = {};
    for (const key of new Set([...Object.keys(before || {}), ...Object.keys(after || {})])) {
      if (sameValue(before?.[key], after?.[key])) continue;
      if (Object.prototype.hasOwnProperty.call(before || {}, key)) oldValues[key] = cloneData(before[key]);
      if (Object.prototype.hasOwnProperty.call(after || {}, key)) newValues[key] = cloneData(after[key]);
    }
    return { before: oldValues, after: newValues };
  }

  function changedArrayPair(before, after, nestedKey = '') {
    const oldById = new Map(before.filter(item => item?.id).map(item => [item.id, item]));
    const newById = new Map(after.filter(item => item?.id).map(item => [item.id, item]));
    const oldChanges = [];
    const newChanges = [];
    for (const id of new Set([...oldById.keys(), ...newById.keys()])) {
      const oldItem = oldById.get(id);
      const newItem = newById.get(id);
      if (sameValue(oldItem, newItem)) continue;
      if (!oldItem || !newItem) {
        oldChanges.push(oldItem ? cloneData(oldItem) : null);
        newChanges.push(newItem ? cloneData(newItem) : null);
        continue;
      }
      const oldFields = { ...oldItem };
      const newFields = { ...newItem };
      delete oldFields[nestedKey];
      delete newFields[nestedKey];
      const fields = changedObjectPair(oldFields, newFields);
      const oldEntry = { id, ...fields.before };
      const newEntry = { id, ...fields.after };
      if (nestedKey) {
        const nested = changedArrayPair(oldItem[nestedKey] || [], newItem[nestedKey] || []);
        oldEntry[nestedKey] = nested.before;
        newEntry[nestedKey] = nested.after;
      }
      oldChanges.push(oldEntry);
      newChanges.push(newEntry);
    }
    return {
      before: oldChanges.filter(Boolean),
      after: newChanges.filter(Boolean)
    };
  }

  function createAssistantActionUndo(before, after) {
    const goals = changedObjectPair(before.dietGoals, after.dietGoals);
    const todos = changedArrayPair(before.todos, after.todos);
    const archives = changedArrayPair(before.memoryArchives, after.memoryArchives, 'items');
    const todayNoteChanged = !sameValue(before.todayNote, after.todayNote);
    return {
      before: {
        dietGoals: goals.before,
        todos: todos.before,
        memoryArchives: archives.before,
        ...(todayNoteChanged ? { todayNote: cloneData(before.todayNote) } : {})
      },
      after: {
        dietGoals: goals.after,
        todos: todos.after,
        memoryArchives: archives.after,
        ...(todayNoteChanged ? { todayNote: cloneData(after.todayNote) } : {})
      },
      snapshots: {
        before: {
          dietGoals: cloneData(before.dietGoals),
          todayNote: cloneData(before.todayNote)
        },
        after: {
          dietGoals: cloneData(after.dietGoals),
          todayNote: cloneData(after.todayNote)
        }
      },
      todayNoteChanged
    };
  }

  function restoreObjectChanges(current, before, after) {
    if (!current || !before || !after) return;
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
      if (sameValue(before[key], after[key])) continue;
      if (!sameValue(current[key], after[key])) continue;
      if (Object.prototype.hasOwnProperty.call(before, key)) current[key] = cloneData(before[key]);
      else delete current[key];
    }
  }

  function restoreArrayChanges(current, before, after, nestedKey = '') {
    const currentById = new Map(current.filter(item => item?.id).map(item => [item.id, item]));
    const beforeById = new Map(before.filter(item => item?.id).map(item => [item.id, item]));
    const afterById = new Map(after.filter(item => item?.id).map(item => [item.id, item]));
    for (const id of new Set([...beforeById.keys(), ...afterById.keys()])) {
      const oldItem = beforeById.get(id);
      const newItem = afterById.get(id);
      const currentItem = currentById.get(id);
      if (!oldItem && newItem) {
        if (!currentItem) continue;
        if (nestedKey) {
          currentItem[nestedKey] ||= [];
          restoreArrayChanges(currentItem[nestedKey], [], newItem[nestedKey] || []);
          const createdFields = { ...newItem };
          const currentFields = { ...currentItem };
          delete createdFields[nestedKey];
          delete currentFields[nestedKey];
          if (!currentItem[nestedKey].length && sameValue(currentFields, createdFields)) current.splice(current.indexOf(currentItem), 1);
        } else if (sameValue(currentItem, newItem)) {
          current.splice(current.indexOf(currentItem), 1);
        }
        continue;
      }
      if (oldItem && !newItem) {
        if (!currentItem) current.push(cloneData(oldItem));
        continue;
      }
      if (!oldItem || !newItem || !currentItem) continue;
      if (nestedKey) {
        const oldNested = oldItem[nestedKey] || [];
        const newNested = newItem[nestedKey] || [];
        currentItem[nestedKey] ||= [];
        restoreArrayChanges(currentItem[nestedKey], oldNested, newNested);
      }
      const oldFields = { ...oldItem };
      const newFields = { ...newItem };
      const currentFields = { ...currentItem };
      if (nestedKey) {
        delete oldFields[nestedKey];
        delete newFields[nestedKey];
        delete currentFields[nestedKey];
      }
      restoreObjectChanges(currentFields, oldFields, newFields);
      for (const key of new Set([...Object.keys(oldFields), ...Object.keys(newFields)])) {
        if (Object.prototype.hasOwnProperty.call(currentFields, key)) currentItem[key] = currentFields[key];
        else delete currentItem[key];
      }
    }
  }

  function restoreAssistantActions(data, undo) {
    if (!undo) return;
    data.settings.dietGoals ||= {};
    const snapshots = undo.snapshots;
    if (snapshots?.before && snapshots?.after) {
      if (sameValue(data.settings.dietGoals, snapshots.after.dietGoals)) {
        data.settings.dietGoals = cloneData(snapshots.before.dietGoals);
      }
      if (undo.todayNoteChanged && sameValue(data.todayNote, snapshots.after.todayNote)) {
        data.todayNote = cloneData(snapshots.before.todayNote);
      }
    }
    restoreObjectChanges(data.settings.dietGoals, undo.before.dietGoals || {}, undo.after.dietGoals || {});
    if (undo.todayNoteChanged && sameValue(data.todayNote, undo.after.todayNote)) data.todayNote = cloneData(undo.before.todayNote);
    restoreArrayChanges(data.todos, undo.before.todos || [], undo.after.todos || []);
    restoreArrayChanges(data.memoryArchives, undo.before.memoryArchives || [], undo.after.memoryArchives || [], 'items');
    const restoredIds = new Set();
    const afterArchives = new Map((undo.after.memoryArchives || []).map(archive => [archive.id, archive]));
    for (const archive of undo.before.memoryArchives || []) {
      const afterArchive = afterArchives.get(archive.id);
      const removedItems = (archive.items || []).filter(item => item.id && !(afterArchive?.items || []).some(candidate => candidate.id === item.id));
      for (const item of removedItems) restoredIds.add(item.id);
    }
    window.petalDeletedMemoryItemIds = (window.petalDeletedMemoryItemIds || []).filter(id => !restoredIds.has(id));
  }

  function removeSummariesForMessages(data, messages) {
    const summaryIds = new Set(messages.map(message => message.summaryId).filter(Boolean));
    if (!summaryIds.size) return;
    data.chatSummaries = (data.chatSummaries || []).filter(summary => !summaryIds.has(summary.id));
    for (const archive of data.memoryArchives) {
      archive.items = (archive.items || []).filter(item => !summaryIds.has(item.summaryId) && !summaryIds.has(item.id));
    }
    for (const message of data.chat) {
      if (summaryIds.has(message.summaryId)) {
        delete message.summaryId;
        delete message.summarizedAt;
      }
    }
  }

  function removeAssistantResponse(data, responseMessages) {
    const undo = responseMessages.find(message => message.actionUndo)?.actionUndo;
    restoreAssistantActions(data, undo);
    removeSummariesForMessages(data, responseMessages);
    const ids = new Set(responseMessages.map(message => message.id));
    data.chat = data.chat.filter(message => !ids.has(message.id));
  }

  function retryLastAssistantResponse() {
    const data = readData();
    const roleChat = chatForActiveCharacter(data);
    const lastUserIndex = roleChat.map(message => message.role).lastIndexOf('user');
    if (lastUserIndex < 0) {
      notify('还没有可以重新请求的用户消息。');
      return false;
    }
    const responseMessages = roleChat.slice(lastUserIndex + 1).filter(message => message.role === 'assistant');
    if (!responseMessages.length) {
      notify('没有找到上一次 AI 回复；请使用请求按钮发送。');
      return false;
    }
    removeAssistantResponse(data, responseMessages);
    writeData(data);
    renderChatFromStorage();
    renderChatSummaryPage();
    renderChatMemoryChoices();
    return true;
  }

  function toggleChatSelection(enabled) {
    const messages = $('messages');
    rangeSelectionActive = false;
    rangeSelectionAnchorId = '';
    messages.classList.toggle('bulk-selecting', enabled);
    $('toggleChatSelection').setAttribute('aria-pressed', String(enabled));
    $('toggleChatSelection').textContent = enabled ? '☑ 取消选择' : '☑ 批量删除';
    $('deleteSelectedChatMessages').hidden = !enabled;
    if (!enabled) messages.querySelectorAll('.message-selection').forEach(input => { input.checked = false; });
    $('toggleChatRangeSelection').textContent = '↔ 范围选择';
    $('toggleChatRangeSelection').setAttribute('aria-pressed', 'false');
    updateSelectedChatMessageCount();
  }

  function beginChatRangeSelection() {
    if (!$('messages').classList.contains('bulk-selecting')) toggleChatSelection(true);
    rangeSelectionActive = true;
    rangeSelectionAnchorId = '';
    $('toggleChatRangeSelection').setAttribute('aria-pressed', 'true');
    $('toggleChatRangeSelection').textContent = '先选起点，再选终点';
    $('messages').querySelectorAll('.message-selection').forEach(input => { input.checked = false; });
    updateSelectedChatMessageCount();
  }

  function updateChatRangeSelection(input) {
    if (!rangeSelectionActive || !input.checked) return;
    if (!rangeSelectionAnchorId) {
      rangeSelectionAnchorId = input.value;
      return;
    }
    const checkboxes = [...$('messages').querySelectorAll('.message-selection')];
    const start = checkboxes.findIndex(item => item.value === rangeSelectionAnchorId);
    const end = checkboxes.findIndex(item => item.value === input.value);
    if (start < 0 || end < 0) return;
    checkboxes.forEach((item, index) => { item.checked = index >= Math.min(start, end) && index <= Math.max(start, end); });
    rangeSelectionActive = false;
    rangeSelectionAnchorId = '';
    $('toggleChatRangeSelection').setAttribute('aria-pressed', 'false');
    $('toggleChatRangeSelection').textContent = '↔ 范围选择';
    updateSelectedChatMessageCount();
  }

  function updateSelectedChatMessageCount() {
    const selected = $('messages').querySelectorAll('.message-selection:checked').length;
    const button = $('deleteSelectedChatMessages');
    button.disabled = selected === 0;
    button.textContent = selected ? `☒ 删除选中（${selected}）` : '☒ 删除选中';
  }

  function deleteSelectedChatMessages() {
    const selectedIds = new Set([...$('messages').querySelectorAll('.message-selection:checked')].map(input => input.value));
    if (!selectedIds.size) return;
    const data = readData();
    const selectedMessages = data.chat.filter(message => selectedIds.has(message.id));
    const selectedResponseIds = new Set(selectedMessages.filter(message => message.role === 'assistant').map(message => message.responseId).filter(Boolean));
    for (const responseId of selectedResponseIds) {
      const responseMessages = data.chat.filter(message => message.responseId === responseId);
      if (!responseMessages.length) continue;
      if (responseMessages.every(message => selectedIds.has(message.id))) {
        removeAssistantResponse(data, responseMessages);
      } else {
        const undo = responseMessages.find(message => message.actionUndo)?.actionUndo;
        const remaining = responseMessages.find(message => !selectedIds.has(message.id));
        if (undo && remaining && !remaining.actionUndo) remaining.actionUndo = undo;
      }
    }
    removeSummariesForMessages(data, selectedMessages);
    data.chat = data.chat.filter(message => !selectedIds.has(message.id));
    writeData(data);
    renderChatFromStorage();
    toggleChatSelection(false);
    renderChatSummaryPage();
    renderChatMemoryChoices();
    maybePromptChatSummary();
  }

  function editUserMessage(messageId) {
    const data = readData();
    const message = data.chat.find(item => item.id === messageId && item.role === 'user');
    if (!message) return;
    const bubble = $('messages').querySelector(`[data-message-id="${CSS.escape(messageId)}"]`);
    const content = bubble?.querySelector('.message-content');
    if (!bubble || !content || bubble.classList.contains('editing-message')) return;
    bubble.classList.add('editing-message');
    content.hidden = true;
    const editor = document.createElement('div');
    editor.className = 'message-editor';
    const textarea = document.createElement('textarea');
    textarea.className = 'message-edit-input';
    textarea.value = message.text || '';
    textarea.setAttribute('aria-label', '编辑用户消息');
    const actions = document.createElement('div');
    actions.className = 'message-edit-actions';
    const saveButton = document.createElement('button');
    saveButton.className = 'message-edit-save';
    saveButton.type = 'button';
    saveButton.textContent = '保存';
    const cancelButton = document.createElement('button');
    cancelButton.className = 'message-edit-cancel';
    cancelButton.type = 'button';
    cancelButton.textContent = '取消';
    actions.append(saveButton, cancelButton);
    editor.append(textarea, actions);
    content.after(editor);
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }

  function finishUserMessageEdit(messageId, save) {
    const bubble = $('messages').querySelector(`[data-message-id="${CSS.escape(messageId)}"]`);
    if (!bubble) return;
    if (save) {
      const data = readData();
      const message = data.chat.find(item => item.id === messageId && item.role === 'user');
      const textarea = bubble.querySelector('.message-edit-input');
      if (!message || !textarea) return;
      removeSummariesForMessages(data, [message]);
      message.text = textarea.value.trim();
      writeData(data);
      renderChatFromStorage();
      renderChatSummaryPage();
      renderChatMemoryChoices();
      return;
    }
    bubble.querySelector('.message-editor')?.remove();
    bubble.querySelector('.message-content').hidden = false;
    bubble.classList.remove('editing-message');
  }

  function playUserMessageSound() {
    userMessageSound.currentTime = 0;
    const playback = userMessageSound.play();
    playback?.catch(error => console.warn('无法播放用户消息提示音', error));
  }

  function showChatRequestStatus(message) {
    let status = $('chatRequestStatus');
    if (!status) {
      status = document.createElement('div');
      status.id = 'chatRequestStatus';
      status.className = 'message ai request-status';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      status.innerHTML = '<div class="message-content"></div>';
      $('messages').append(status);
    }
    status.querySelector('.message-content').textContent = message;
    status.classList.remove('message-enter');
    scrollMessagesToBottom();
    return status;
  }

  function createAssistantBubble(text, animate = true, existingBubble = null, actionSummary = '', petSlime = null) {
    const bubble = existingBubble || document.createElement('div');
    bubble.className = `message ai${animate ? ' message-enter' : ''}${actionSummary ? ' has-action-summary' : ''}`;
    bubble.removeAttribute('id');
    bubble.removeAttribute('role');
    bubble.removeAttribute('aria-live');
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = escapeHtml(text).replace(/\[贴图:(https?:\/\/[^\]\s]+)\]/g, '<img class="chat-sticker-image" src="$1" alt="聊天表情包" loading="lazy">');
    const summary = actionSummary ? document.createElement('div') : null;
    if (summary) {
      summary.className = 'message-action-summary';
      summary.textContent = actionSummary;
    }
    const meta = document.createElement('div');
    meta.className = 'message-meta';
    const time = document.createElement('span');
    time.className = 'message-time';
    time.textContent = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const speak = document.createElement('button');
    speak.className = 'speak-message';
    speak.type = 'button';
    speak.setAttribute('aria-label', '朗读这条消息');
    speak.title = '朗读';
    speak.textContent = '♫';
    meta.append(time, speak);
    const slime = petSlime ? petSlimeMarkup(petSlime) : '';
    if (slime) bubble.classList.add('has-petal-slime');
    bubble.replaceChildren(content, ...(summary ? [summary] : []), meta);
    if (slime) bubble.insertAdjacentHTML('beforeend', slime);
    $('messages').append(bubble);
    if (assistantAutoScrollEnabled) {
      scrollMessagesToBottom(() => assistantAutoScrollEnabled);
    }
    return bubble;
  }

  function playAssistantMessageSound() {
    assistantMessageSound.currentTime = 0;
    const playback = assistantMessageSound.play();
    playback?.catch(error => console.warn('无法播放 AI 消息提示音', error));
  }

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  let assistantAutoScrollEnabled = false;
  let chatScrollbarPointerActive = false;

  function assistantMessageInterval(message) {
    const characterCount = Array.from(String(message || '')).length;
    if (characterCount <= 20) return 1500;
    if (characterCount >= 40) return 3000;
    return 2000 + Math.floor((characterCount - 21) / 5) * 250;
  }

  function stopAssistantAutoScroll() {
    assistantAutoScrollEnabled = false;
  }

  async function requestEnhancedChat(retry = false) {
    const request = $('requestAi');
    if (request.disabled) return;
    const hasDraft = !!$('chatInput').value.trim();
    if (hasDraft) saveChatMessage();
    if (retry && !hasDraft) {
      try {
        apiConfig('chat');
      } catch (error) {
        notify(error.message);
        return;
      }
      if (!retryLastAssistantResponse()) return;
    }
    const initialData = readData();
    const roleChat = chatForActiveCharacter(initialData);
    const requestCharacterId = activeCharacterId(initialData);
    const lastMessage = roleChat.filter(message => !message.summaryId).at(-1);
    if (!lastMessage || lastMessage.role !== 'user') {
      notify('请先发送一条新消息，再请求 AI 回复。');
      return;
    }
    request.disabled = true;
    $('sendChat').disabled = true;
    assistantAutoScrollEnabled = true;
    $('chatMoreMenu').classList.remove('open');
    $('emojiMenu').classList.remove('open');
    const status = showChatRequestStatus('正在请求 AI，请稍候…');
    try {
      const config = apiConfig('chat');
      const localDate = isoDate(new Date());
      const weatherSettings = initialData.settings.weather || {};
      let automaticWeather = null;
      if (!retry && !hasWeatherForecastForDate(weatherSettings, localDate) && weatherSettings.autoQueryDate !== localDate) {
        const city = String(weatherSettings.city || '').trim();
        initialData.settings.weather = { ...weatherSettings, autoQueryDate: localDate };
        writeData(initialData);
        if (city) {
          status.querySelector('.message-content').textContent = '正在查询今日天气并准备 AI 回复…';
          try {
            automaticWeather = await queryWeather(city, 7);
          } catch (error) {
            console.error('每日自动天气查询失败', error);
            automaticWeather = { error: error.message || '天气服务暂时不可用。' };
          }
          if (!automaticWeather.error) {
            const latest = readData();
            latest.settings.weather = {
              ...(latest.settings.weather || {}),
              city,
              forecast: automaticWeather,
              updatedAt: new Date().toISOString()
            };
            writeData(latest);
            initialData.settings.weather = latest.settings.weather;
          }
        } else {
          automaticWeather = { error: '尚未在设置中填写天气查询城市。' };
        }
      }
      status.querySelector('.message-content').textContent = '正在请求 AI，请稍候…';
      const automaticWeatherContext = automaticWeather
        ? `今日天气自动检查结果：${JSON.stringify(automaticWeather)}。请继续正常回应用户当前消息；如果结果有效，在不打断当前话题的前提下自然地补充一条简短、具体的天气提醒；如果包含 error，简短说明今日天气提醒暂不可用或需要先设置城市。不得编造天气。`
        : '';
      const system = [buildSystemPrompt(initialData), automaticWeatherContext].filter(Boolean).join('\n\n');
      const conversation = pickConversation(initialData);
      const attachmentIdsToCompact = compactedAttachmentIds(initialData, conversation);
      const messages = [{ role: 'system', content: system }, ...conversation];
      let answer = await requestCompletion(config, messages);
      const query = parseHealthQuery(answer);
      const weatherQuery = parseWeatherQuery(answer);
      if (query?.error) {
        answer = query.error;
      } else if (query) {
        const results = queryLocalHealth(readData(), query);
        const secondMessages = [
          ...messages,
          { role: 'assistant', content: answer },
          { role: 'user', content: `网页已完成本地只读查询。查询类别：${query.categories.join('、')}；日期：${query.start} 至 ${query.end}。结果（已过滤隐藏日期）：${JSON.stringify(results)}。请根据结果回复用户，不要再次请求其他类别或超出该日期范围的数据。` }
        ];
        answer = await requestCompletion(config, secondMessages);
      } else if (weatherQuery?.error) {
        answer = weatherQuery.error;
      } else if (weatherQuery) {
        const city = String(readData().settings.weather?.city || '').trim();
        if (!city) {
          answer = '请先在“设置 → API 连接 → 天气查询”中填写并保存所在城市，再查询天气。';
        } else {
          let results = automaticWeather;
          if (!results) {
            try {
              results = await queryWeather(city, weatherQuery.forecastDays);
            } catch (error) {
              console.error('天气查询失败', error);
              results = { error: error.message || '天气服务暂时不可用。' };
            }
          }
          if (!results.error) {
            const latest = readData();
            latest.settings.weather = {
              ...(latest.settings.weather || {}),
              city,
              forecast: results,
              updatedAt: new Date().toISOString()
            };
            writeData(latest);
          }
          const secondMessages = [
            ...messages,
            { role: 'assistant', content: answer },
            { role: 'user', content: `网页已通过天气服务查询城市“${city}”。以下是服务返回的数据：${JSON.stringify(results)}。请只根据这些数据回答用户，使用正常聊天回复格式；若结果包含 error，明确告知查询失败，不得用常识推测或编造天气。不要再次输出 WEATHER_QUERY。` }
          ];
          answer = await requestCompletion(config, secondMessages);
        }
      }
      const latest = readData();
      const attachmentIds = new Set(attachmentIdsToCompact);
      for (const message of latest.chat) {
        if (attachmentIds.has(message.id) && message.attachment) message.attachment.contextCompacted = true;
      }
      const beforeActions = snapshotAssistantActions(latest);
      const activeCharacterBeforeCapture = activeCharacterId(latest);
      latest.settings.prompts.activeCharacterId = requestCharacterId;
      let captured;
      try {
        captured = captureAssistantMemories(latest, answer, lastMessage.text || '');
      } finally {
        latest.settings.prompts.activeCharacterId = activeCharacterBeforeCapture;
      }
      const { messages: finalMessages, actionSummary, petSlime } = captured;
      const actionUndo = createAssistantActionUndo(beforeActions, snapshotAssistantActions(latest));
      const responseId = `response-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      for (let index = 0; index < finalMessages.length; index += 1) {
        latest.chat.push({
          id: `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
          role: 'assistant',
          characterId: requestCharacterId,
          text: finalMessages[index],
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          responseId,
          ...(index === finalMessages.length - 1 && actionSummary ? { actionSummary } : {}),
          ...(index === finalMessages.length - 1 && latest.settings.appearance?.chatSlimeEnabled ? { petSlime } : {}),
          ...(index === 0 ? { actionUndo } : {})
        });
      }
      writeData(latest);
      window.dispatchEvent(new Event('petal-data-updated'));
      if (activeCharacterId(readData()) !== requestCharacterId) {
        stopAssistantAutoScroll();
        renderChatFromStorage();
      } else {
      for (let index = 0; index < finalMessages.length; index += 1) {
        if (index === 0) playAssistantMessageSound();
        createAssistantBubble(finalMessages[index], true, index === 0 ? status : null, index === finalMessages.length - 1 ? actionSummary : '', index === finalMessages.length - 1 && latest.settings.appearance?.chatSlimeEnabled ? petSlime : null);
        if (index < finalMessages.length - 1) await wait(assistantMessageInterval(finalMessages[index]));
      }
      }
      if (latest.settings.voice?.output && typeof window.petalSpeakText === 'function') {
        window.petalSpeakText(finalMessages.join('\n\n')).catch(error => {
          console.error('自动朗读 AI 回复失败', error);
          notify(`语音朗读失败：${error.message}`);
        });
      }
      maybePromptChatSummary();
    } catch (error) {
      console.error('聊天请求失败', error);
      status.classList.add('request-error');
      status.querySelector('.message-content').textContent = `请求未完成：${error.message}`;
    } finally {
      stopAssistantAutoScroll();
      request.disabled = false;
      $('sendChat').disabled = false;
      refresh();
    }
  }

  function renderChatFromStorage() {
    const data = readData();
    const roleChat = chatForActiveCharacter(data);
    renderedChatCharacterId = activeCharacterId(data);
    const latestAssistantIndex = roleChat.reduce((latestIndex, message, index) => message.role === 'assistant' ? index : latestIndex, -1);
    const slimeEnabled = Boolean(data.settings.appearance?.chatSlimeEnabled);
    const slimeToggle = $('chatSlimeToggle');
    if (slimeToggle) slimeToggle.checked = slimeEnabled;
    const savedMessagesHtml = roleChat.length
      ? roleChat.map((message, index) => {
        const content = message.attachment
          ? `<details class="health-attachment-card"><summary><span class="health-attachment-icon" aria-hidden="true">▤</span><span><strong>${escapeHtml(message.attachment.title)}</strong><small>${escapeHtml(message.attachment.rangeLabel)} · ${message.attachment.payload.length} 天记录</small></span><span class="health-attachment-action">查看内容</span></summary><pre>${escapeHtml(JSON.stringify(message.attachment.payload, null, 2))}</pre></details>`
          : escapeHtml(message.text).replace(/\[贴图:(https?:\/\/[^\]\s]+)\]/g, '<img class="chat-sticker-image" src="$1" alt="聊天表情包" loading="lazy">');
        const slime = slimeEnabled && message.role === 'assistant' && index === latestAssistantIndex
          ? petSlimeMarkup(message.petSlime || { body: '#6CA9C8', face: '⦁֊⦁', action: 'default' })
          : '';
        return `<div class="message ${message.role === 'user' ? 'user' : 'ai'}${message.actionSummary ? ' has-action-summary' : ''}${slime ? ' has-petal-slime' : ''}" data-message-id="${escapeHtml(message.id)}"><input class="message-selection" type="checkbox" aria-label="选择消息删除" value="${escapeHtml(message.id)}"><div class="message-content">${content}</div>${message.actionSummary ? `<div class="message-action-summary">${escapeHtml(message.actionSummary)}</div>` : ''}<div class="message-meta"><span class="message-time">${escapeHtml(message.time || '')}</span>${message.role === 'user' ? `<button class="edit-message" type="button" aria-label="编辑这条消息" title="编辑">编辑</button>` : '<button class="speak-message" type="button" aria-label="朗读这条消息" title="朗读">♫</button>'}</div>${slime}</div>`;
      }).join('')
      : '<div class="message ai"><div class="message-content">嗨，欢迎来到这里。🌷</div></div>';
    $('messages').innerHTML = savedMessagesHtml;
    scrollMessagesToBottom();
  }

  function scrollMessagesToBottom(shouldScroll = () => true) {
    const messages = $('messages');
    const scroll = () => {
      if (shouldScroll()) messages.scrollTop = messages.scrollHeight;
    };
    scroll();
    requestAnimationFrame(() => {
      scroll();
      requestAnimationFrame(scroll);
    });
    messages.querySelectorAll('img').forEach(image => image.addEventListener('load', scroll, { once: true }));
  }

  function healthAttachmentRange(period) {
    const end = isoDate(new Date());
    if (period === 'today') return { start: end, end, label: '今日' };
    if (period === 'week') {
      const start = new Date();
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
      return { start: isoDate(start), end, label: '本周' };
    }
    if (period === 'month') return { start: `${end.slice(0, 7)}-01`, end, label: '本月' };
    return { start: '', end: '', label: '所有' };
  }

  function createHealthAttachment(data, range) {
    const includeDetails = $('healthAttachmentIncludeDetails').checked;
    const includeAnalysis = $('healthAttachmentIncludeAnalysis').checked;
    if (!includeDetails && !includeAnalysis) {
      notify('请至少选择发送详细健康数据或分析数据。');
      return false;
    }
    const hiddenDates = new Set(data.hiddenHealthDates || []);
    const allDates = allHealthDates(data);
    const dates = allDates.filter(date => !hiddenDates.has(date)
      && (!range.start || date >= range.start)
      && (!range.end || date <= range.end));
    if (!dates.length) {
      notify('所选范围内没有可发送的健康记录。');
      return false;
    }
    const archive = data.memoryArchives.find(item => item.id === 'health-archive');
    const records = dates.map(date => {
      const record = { date };
      if (includeDetails) {
        const detailed = window.petalGetDailyHealthRecord?.(data, date) || { date };
        delete detailed.health_memory;
        delete detailed.food_analysis;
        delete detailed.health_analysis;
        Object.assign(record, detailed);
      }
      if (includeAnalysis) {
        const legacySummaries = (archive?.items || []).filter(item => item.summary
          && (item.dates || []).includes(date)
          && (item.dates || []).every(summaryDate => !hiddenDates.has(summaryDate)));
        const healthAnalyses = (data.healthAnalysisRecords || []).filter(item => item.date === date);
        const foodAnalyses = (data.foodAnalyses || []).filter(item => item.date === date);
        if (legacySummaries.length) record.health_memory = legacySummaries.map(item => item.content);
        if (healthAnalyses.length) record.health_analysis = healthAnalyses.map(item => ({ title: item.title || '睡眠分析', type: item.type, content: item.content }));
        if (foodAnalyses.length) record.food_analysis = foodAnalyses;
      }
      return record;
    }).filter(record => Object.keys(record).length > 1);
    if (!records.length) {
      notify('所选日期范围内没有所选类别的健康数据。');
      return false;
    }
    const label = range.label || '自定义日期';
    const rangeLabel = range.start && range.end
      ? `${range.start} 至 ${range.end}`
      : dates.length > 1 ? `${dates[dates.length - 1]} 至 ${dates[0]}` : dates[0];
    data.chat.push({
      id: `chat-health-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      role: 'user',
      text: `${label}${includeDetails && includeAnalysis ? '详细及分析' : includeAnalysis ? '分析' : '详细'}健康数据`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      attachment: {
        title: `${label}${includeDetails && includeAnalysis ? '详细及分析' : includeAnalysis ? '分析' : '详细'}健康数据`,
        rangeLabel,
        payload: records
      }
    });
    writeData(data);
    renderChatFromStorage();
    renderChatSummaryPage();
    renderChatMemoryChoices();
    return true;
  }

  async function requestAnalysis(prompt) {
    const config = apiConfig('analysis');
    return requestCompletion(config, [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }]);
  }
  window.petalRequestAnalysis = requestAnalysis;
  async function requestDrawing(prompt) {
    const config = apiConfig('drawing');
    return requestCompletion(config, [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }]);
  }
  window.petalRequestDrawing = requestDrawing;

  async function summarizeHealth(dates, periodLabel) {
    if (summarizing) return;
    dates = [...new Set(dates)].sort();
    if (!dates.length) {
      $('healthSummaryMenu').hidden = false;
      notify('所选范围内没有健康记录。');
      return;
    }
    summarizing = true;
    $('healthSummarize').disabled = true;
    $('runHealthSummary').disabled = true;
    try {
      const data = readData();
      const visibleDates = dates.filter(date => !isHidden(data, date));
      if (!visibleDates.length) throw new Error('所选日期均已隐藏，无法用于总结。');
      const source = visibleDates.map(date => window.petalGetDailyHealthRecord?.(data, date) || { date });
      const content = await requestAnalysis({
        system: data.settings.analysisPrompts.healthMemorySummary || window.petalDefaultAnalysisPrompts.healthMemorySummary,
        user: `请总结这些日期的健康记录：\n${JSON.stringify(source)}`
      });
      const current = readData();
      const archive = ensureHealthArchive(current);
      archive.items = archive.items.filter(item => !item.summary || !(item.dates || []).some(date => visibleDates.includes(date)));
      current.healthAnalysisRecords = current.healthAnalysisRecords.filter(item => item.type !== 'health_summary'
        || !(item.dates || [item.date]).some(date => visibleDates.includes(date)));
      const summaryId = `health-summary-${Date.now().toString(36)}`;
      const title = periodLabel || `${visibleDates[0]} 至 ${visibleDates[visibleDates.length - 1]} 总结`;
      current.healthAnalysisRecords.unshift(...visibleDates.map(date => ({
        id: `${summaryId}-${date}`,
        type: 'health_summary',
        title,
        date,
        dates: visibleDates,
        content,
        source: 'AI 总结'
      })));
      writeData(current);
      document.querySelectorAll('[data-health-select]').forEach(input => input.checked = false);
      $('healthSummaryMenu').hidden = true;
      $('analysisApiFeedback').textContent = '健康分析已另行保存至分析数据区；详细记录仍保留在详细数据区。';
      refresh();
      notify('健康记忆总结已保存');
    } catch (error) {
      console.error('健康记忆总结失败', error);
      $('analysisApiFeedback').textContent = `总结失败：${error.message}`;
      notify(error.message);
    } finally {
      summarizing = false;
      $('healthSummarize').disabled = false;
      $('runHealthSummary').disabled = false;
    }
  }

  function bindApiSettings() {
    for (const [providerId, modelId] of [['apiProvider', 'apiModel'], ['analysisApiProvider', 'analysisApiModel'], ['drawingApiProvider', 'drawingApiModel']]) {
      $(providerId).addEventListener('change', () => {
        $(modelId).placeholder = $(providerId).value === 'gemini' ? '填写 Gemini 模型 ID' : '填写兼容服务支持的模型 ID';
      });
    }
    const fetchModels = async type => {
      const analysis = type === 'analysis';
      const drawing = type === 'drawing';
      const provider = $(`${drawing ? 'drawingApi' : analysis ? 'analysisApi' : 'api'}Provider`).value;
      const base = $(`${drawing ? 'drawingApi' : analysis ? 'analysisApi' : 'api'}Base`).value.trim().replace(/\/+$/, '');
      const key = $(`${drawing ? 'drawingApi' : analysis ? 'analysisApi' : 'api'}Key`).value.trim();
      const button = $(drawing ? 'fetchDrawingModels' : analysis ? 'fetchAnalysisModels' : 'fetchChatModels');
      const select = $(drawing ? 'drawingModelChoices' : analysis ? 'analysisModelChoices' : 'chatModelChoices');
      const feedback = $(drawing ? 'drawingApiFeedback' : analysis ? 'analysisApiFeedback' : 'apiFeedback');
      if (!base || !key) {
        feedback.textContent = '请先填写 API 地址和 API Key，再拉取模型。';
        return;
      }
      if (provider !== 'gemini') {
        try {
          validateHeaderApiKey(key);
        } catch (error) {
          feedback.textContent = error.message;
          notify(error.message);
          return;
        }
      }
      button.disabled = true;
      button.textContent = '正在拉取…';
      try {
        const isGemini = provider === 'gemini';
        const endpoint = isGemini
          ? `${base}/models?key=${encodeURIComponent(key)}`
          : `${base}/models`;
        const response = await fetch(endpoint, {
          headers: isGemini ? {} : { Authorization: `Bearer ${key}` }
        });
        if (!response.ok) throw new Error(`拉取失败：${await responseErrorDetail(response, { key })}`);
        const payload = await response.json().catch(error => {
          throw new Error(`模型列表响应 JSON 无法解析：${redactDiagnosticText(error.message, { key })}`);
        });
        if (payload?.error) {
          const detail = typeof payload.error === 'string' ? payload.error : payload.error.message || JSON.stringify(payload.error);
          throw new Error(`模型列表请求返回错误：${redactDiagnosticText(detail, { key })}`);
        }
        const models = (isGemini
          ? (payload.models || []).filter(model => (model.supportedGenerationMethods || []).includes('generateContent')).map(model => model.name?.replace(/^models\//, ''))
          : (payload.data || []).map(model => typeof model === 'string' ? model : model.id))
          .filter(model => typeof model === 'string' && model.trim());
        if (!models.length) throw new Error('服务未返回可用模型。');
        select.replaceChildren(new Option('选择已拉取的模型', ''));
        for (const model of [...new Set(models)]) select.add(new Option(model, model));
        select.hidden = false;
        select.onchange = () => {
          if (select.value) $(`${drawing ? 'drawingApi' : analysis ? 'analysisApi' : 'api'}Model`).value = select.value;
        };
        feedback.textContent = `已拉取 ${new Set(models).size} 个模型；选择模型会填入名称栏。`;
      } catch (error) {
        console.error('拉取 API 模型列表失败', error);
        feedback.textContent = `拉取模型失败：${error.message}`;
      } finally {
        button.disabled = false;
        button.textContent = '拉取模型';
      }
    };
    $('fetchChatModels').addEventListener('click', () => fetchModels('chat'));
    $('fetchAnalysisModels').addEventListener('click', () => fetchModels('analysis'));
    $('fetchDrawingModels').addEventListener('click', () => fetchModels('drawing'));
    $('apiForm').addEventListener('submit', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      chatApiKey = $('apiKey').value.trim();
      updateData(data => { data.settings.api = { provider: $('apiProvider').value, model: $('apiModel').value.trim(), base: $('apiBase').value.trim(), key: chatApiKey }; });
      $('apiFeedback').textContent = '聊天 API 设置（包括密钥）已保存到本地数据。';
      notify('聊天 API 设置已保存');
    }, true);
    $('weatherSettingsForm').addEventListener('submit', event => {
      event.preventDefault();
      const city = $('weatherCity').value.trim();
      updateData(data => {
        data.settings.weather = { ...(data.settings.weather || {}), city };
      });
      $('weatherSettingsFeedback').textContent = city ? `已保存所在城市：${city}` : '已清除所在城市。';
      notify(city ? '所在城市已保存' : '所在城市已清除');
    });
    $('analysisApiForm').addEventListener('submit', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      analysisApiKey = $('analysisApiKey').value.trim();
      updateData(data => { data.settings.analysisApi = { provider: $('analysisApiProvider').value, model: $('analysisApiModel').value.trim(), base: $('analysisApiBase').value.trim(), key: analysisApiKey }; });
      $('analysisApiFeedback').textContent = '分析 / 总结 API 设置（包括密钥）已保存到本地数据。';
      notify('分析 API 设置已保存');
    }, true);
    $('drawingApiForm').addEventListener('submit', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      drawingApiKey = $('drawingApiKey').value.trim();
      updateData(data => { data.settings.drawingApi = { provider: $('drawingApiProvider').value, model: $('drawingApiModel').value.trim(), base: $('drawingApiBase').value.trim(), key: drawingApiKey }; });
      $('drawingApiFeedback').textContent = '绘画 API 设置（包括密钥）已保存到本地数据。';
      notify('绘画 API 设置已保存');
    }, true);
    const fillConfig = type => {
      const analysis = type === 'analysis';
      const select = $(analysis ? 'analysisApiPreset' : 'chatApiPreset');
      select.addEventListener('change', () => {
        const data = readData();
        const preset = data.settings.apiPresets[type].find(item => item.id === select.value);
        if (!preset) return;
        $(analysis ? 'analysisApiProvider' : 'apiProvider').value = preset.provider;
        $(analysis ? 'analysisApiModel' : 'apiModel').value = preset.model;
        $(analysis ? 'analysisApiBase' : 'apiBase').value = preset.base;
        const feedback = $(analysis ? 'analysisApiFeedback' : 'apiFeedback');
        feedback.textContent = '预设已载入；请确认 API Key 后保存。';
      });
      $(analysis ? 'saveAnalysisApiPreset' : 'saveChatApiPreset').addEventListener('click', () => {
        const name = $(analysis ? 'analysisApiPresetName' : 'chatApiPresetName').value.trim();
        if (!name) return notify('请填写预设名称。');
        const config = {
          id: `api-preset-${Date.now().toString(36)}`,
          name,
          provider: $(analysis ? 'analysisApiProvider' : 'apiProvider').value,
          model: $(analysis ? 'analysisApiModel' : 'apiModel').value.trim(),
          base: $(analysis ? 'analysisApiBase' : 'apiBase').value.trim()
        };
        updateData(data => data.settings.apiPresets[type].unshift(config));
        $(analysis ? 'analysisApiPresetName' : 'chatApiPresetName').value = '';
        renderApiPresets();
      });
      $(analysis ? 'deleteAnalysisApiPreset' : 'deleteChatApiPreset').addEventListener('click', () => {
        const id = select.value;
        if (!id) return notify('请选择要删除的预设。');
        updateData(data => { data.settings.apiPresets[type] = data.settings.apiPresets[type].filter(item => item.id !== id); });
        renderApiPresets();
      });
    };
    fillConfig('chat');
    fillConfig('analysis');
    const saved = readData();
    $('apiProvider').value = saved.settings.api?.provider || 'openai';
    $('apiModel').value = saved.settings.api?.model || '';
    $('apiBase').value = saved.settings.api?.base || '';
    $('weatherCity').value = saved.settings.weather?.city || '';
    $('weatherSettingsFeedback').textContent = saved.settings.weather?.city
      ? `已保存所在城市：${saved.settings.weather.city}`
      : '尚未设置城市。';
    $('analysisApiProvider').value = saved.settings.analysisApi.provider || 'openai';
    $('analysisApiModel').value = saved.settings.analysisApi.model || '';
    $('analysisApiBase').value = saved.settings.analysisApi.base || '';
    renderApiPresets();
  }

  function renderApiPresets() {
    const data = readData();
    for (const [type, id] of [['chat', 'chatApiPreset'], ['analysis', 'analysisApiPreset']]) {
      const select = $(id);
      const selected = select.value;
      select.innerHTML = '<option value="">选择预设</option>' + data.settings.apiPresets[type].map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('');
      if (data.settings.apiPresets[type].some(item => item.id === selected)) select.value = selected;
    }
  }

  function bindControls() {
    const messages = $('messages');
    messages.addEventListener('wheel', stopAssistantAutoScroll, { passive: true });
    messages.addEventListener('touchmove', stopAssistantAutoScroll, { passive: true });
    messages.addEventListener('pointerdown', event => {
      const bounds = messages.getBoundingClientRect();
      const scrollbarWidth = messages.offsetWidth - messages.clientWidth;
      chatScrollbarPointerActive = scrollbarWidth > 0 && event.clientX >= bounds.right - scrollbarWidth;
    });
    messages.addEventListener('scroll', () => {
      if (chatScrollbarPointerActive) stopAssistantAutoScroll();
    }, { passive: true });
    messages.addEventListener('keydown', event => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(event.key)) {
        stopAssistantAutoScroll();
      }
    });
    document.addEventListener('pointerup', () => { chatScrollbarPointerActive = false; });
    $('toggleFoodReview').addEventListener('click', () => {
      foodReviewMode = !foodReviewMode;
      foodReviewDate = isoDate(new Date());
      $('foodReviewDate').value = foodReviewDate;
      $('foodReviewDate').hidden = !foodReviewMode;
      $('toggleFoodReview').textContent = foodReviewMode ? '回到今天' : '回顾数据';
      $('analyzeFood').textContent = foodReviewMode ? '分析所选日饮食' : '分析今日饮食';
      renderSelectedFoodDashboard();
    });
    $('foodReviewDate').addEventListener('change', event => {
      if (!validIsoDate(event.target.value)) return;
      foodReviewDate = event.target.value;
      renderSelectedFoodDashboard();
    });
    $('deleteSelectedMemories').addEventListener('click', event => {
      if ($('memoryDetailTitle').textContent !== '健康记忆') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      deleteSelectedHealthDates();
    }, true);
    $('toggleHealthEdit').addEventListener('click', () => {
      healthEditMode = !healthEditMode;
      renderHealthMemory();
    });
    $('healthRecordEditForm').addEventListener('submit', saveHealthRecordEdit);
    $('healthRecordEditor').addEventListener('close', () => { editingHealthRecord = null; });
    $('healthAttachmentIncludeDetails').addEventListener('change', event => {
      if (event.target.checked) $('healthAttachmentIncludeAnalysis').checked = false;
    });
    $('healthAttachmentIncludeAnalysis').addEventListener('change', event => {
      if (event.target.checked) $('healthAttachmentIncludeDetails').checked = false;
    });
    $('bindCharacterArchive').addEventListener('click', () => {
      renderCharacterArchiveBinding();
      $('characterArchiveDialog').showModal();
    });
    $('saveCharacterArchiveBinding').addEventListener('click', () => {
      const archiveId = $('characterArchiveSelect').value;
      updateData(data => {
        const character = activeCharacter(data);
        if (character) character.memoryArchiveId = archiveId;
      });
      renderCharacterArchiveBinding();
      applyCharacterArchiveSwitch();
      $('characterArchiveDialog').close();
      notify(archiveId ? '角色记忆存档已绑定。' : '角色记忆存档已解除绑定。');
    });
    $('clearCharacterArchiveBinding').addEventListener('click', () => {
      $('characterArchiveSelect').value = '';
      $('saveCharacterArchiveBinding').click();
    });
    $('characterAutoSwitchMemory').addEventListener('change', event => {
      updateData(data => {
        const character = activeCharacter(data);
        if (character) character.autoSwitchMemoryArchive = event.target.checked;
      });
      applyCharacterArchiveSwitch();
    });
    $('characterSelect').addEventListener('change', () => setTimeout(() => {
      renderCharacterArchiveBinding();
      applyCharacterArchiveSwitch();
    }, 0));
    $('newCharacter').addEventListener('click', () => setTimeout(renderCharacterArchiveBinding, 0));
    $('saveCharacter').addEventListener('click', () => {
      const autoSwitch = $('characterAutoSwitchMemory').checked;
      setTimeout(() => {
        updateData(data => {
          const character = activeCharacter(data);
          if (character) character.autoSwitchMemoryArchive = autoSwitch;
        });
        renderCharacterArchiveBinding();
        applyCharacterArchiveSwitch();
      }, 0);
    }, true);
    $('deleteCharacter').addEventListener('click', () => setTimeout(() => {
      renderCharacterArchiveBinding();
      applyCharacterArchiveSwitch();
    }, 0));
    $('characterArchiveDialog').querySelectorAll('[data-close-dialog="characterArchiveDialog"]').forEach(button => button.addEventListener('click', () => $('characterArchiveDialog').close()));
    document.addEventListener('submit', event => {
      if (event.target !== $('memoryForm') || !profileMemoryTypes.has($('memoryType').value)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const data = readData();
      const archive = data.memoryArchives.find(item => item.id === 'personal-profile-archive');
      archive.items.unshift({
        id: `profile-memory-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        type: $('memoryType').value,
        date: $('memoryDate').value,
        content: $('memoryContent').value.trim(),
        source: '手动记录'
      });
      writeData(data);
      $('memoryForm').reset();
      $('memoryDate').value = isoDate(new Date());
      refresh();
      notify('已加入个人画像记忆。');
    }, true);
    $('chatMoreMenu').addEventListener('click', event => {
      const toggle = event.target.closest('#healthAttachmentToggle');
      if (toggle) {
        event.preventDefault();
        event.stopImmediatePropagation();
        $('healthAttachmentFrom').value ||= isoDate(new Date());
        $('healthAttachmentTo').value ||= isoDate(new Date());
        $('healthAttachmentDialog').showModal();
        $('chatMoreMenu').classList.remove('open');
        return;
      }
    }, true);
    $('healthAttachmentDialog').addEventListener('click', event => {
      const periodButton = event.target.closest('[data-health-period]');
      if (periodButton) {
        event.preventDefault();
        const inserted = createHealthAttachment(readData(), healthAttachmentRange(periodButton.dataset.healthPeriod));
        if (inserted) $('healthAttachmentDialog').close();
        return;
      }
      if (!event.target.closest('#insertCustomHealthAttachment')) return;
      event.preventDefault();
      const start = $('healthAttachmentFrom').value;
      const end = $('healthAttachmentTo').value;
      if (!validIsoDate(start) || !validIsoDate(end) || end < start) {
        notify('请选择有效的自定义日期范围。');
        return;
      }
      if (createHealthAttachment(readData(), { start, end, label: '自定义日期' })) $('healthAttachmentDialog').close();
    });
    $('closeHealthAttachmentDialog').addEventListener('click', () => $('healthAttachmentDialog').close());
    $('chatMoreMenu').addEventListener('click', event => {
      const button = event.target.closest('[data-chat-summary-page]');
      if (!button) return;
      event.preventDefault();
      openChatSummaryPage(button.dataset.chatSummaryPage);
    }, true);
    $('chatMemoryArchiveChoices').addEventListener('change', event => {
      const input = event.target.closest('[data-chat-memory-archive]');
      if (!input) return;
      updateData(data => {
        const selected = new Set(data.settings.chatMemoryArchiveIds || []);
        if (input.checked) selected.add(input.dataset.chatMemoryArchive);
        else selected.delete(input.dataset.chatMemoryArchive);
        data.settings.chatMemoryArchiveIds = [...selected];
        data.settings.chatMemoryArchiveIdsConfigured = true;
      });
      renderChatSummaryPage();
    });
    $('chatSummaryList').addEventListener('click',event=>{
      const button=event.target.closest('[data-chat-summary-delete]');
      if(button)deleteChatSummary(button.dataset.chatSummaryDelete);
    });
    $('chatSummaryBack').addEventListener('click', () => {
      $('chatSummaryPage').hidden = true;
      $('chat-shell').hidden = false;
      renderChatSummaryPage();
    });
    $('runChatSummary').addEventListener('click', async () => {
      const from = Number($('chatSummaryFrom').value);
      const to = Number($('chatSummaryTo').value);
      try {
        await summarizeChatRange(from, to);
      } catch (error) {
        console.error('手动聊天总结失败', error);
        $('chatSummaryFeedback').textContent = `总结失败：${error.message}`;
        notify(error.message);
      }
    });
    $('dismissChatSummaryReminder').addEventListener('click', () => $('chatSummaryReminder').close());
    $('openChatSummaryReminder').addEventListener('click', () => {
      $('chatSummaryReminder').close();
      openChatSummaryPage('create');
    });
    $('sendChat').addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      saveChatMessage();
    }, true);
    $('chatInput').addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        event.stopImmediatePropagation();
        saveChatMessage();
      }
    }, true);
    $('requestAi').addEventListener('click', () => requestEnhancedChat(false));
    $('retryChat').addEventListener('click', () => requestEnhancedChat(true));
    $('toggleChatSelection').addEventListener('click', () => {
      toggleChatSelection(!$('messages').classList.contains('bulk-selecting'));
    });
    $('toggleChatRangeSelection').addEventListener('click', beginChatRangeSelection);
    $('deleteSelectedChatMessages').addEventListener('click', () => {
      if (window.confirm('确定删除选中的聊天消息吗？')) deleteSelectedChatMessages();
    });
    $('messages').addEventListener('change', event => {
      if (event.target.matches('.message-selection')) {
        updateChatRangeSelection(event.target);
        updateSelectedChatMessageCount();
      }
    });
    $('messages').addEventListener('click', event => {
      const saveButton = event.target.closest('.message-edit-save');
      if (saveButton) {
        const message = saveButton.closest('[data-message-id]');
        if (message) finishUserMessageEdit(message.dataset.messageId, true);
        return;
      }
      const cancelButton = event.target.closest('.message-edit-cancel');
      if (cancelButton) {
        const message = cancelButton.closest('[data-message-id]');
        if (message) finishUserMessageEdit(message.dataset.messageId, false);
        return;
      }
      const editButton = event.target.closest('.edit-message');
      if (editButton) {
        event.preventDefault();
        event.stopPropagation();
        const message = editButton.closest('[data-message-id]');
        if (message) editUserMessage(message.dataset.messageId);
        return;
      }
      if (event.target.closest('.message-selection, .speak-message, .message-editor, details, button')) return;
      const message = event.target.closest('.message[data-message-id]');
      if (!message || $('messages').classList.contains('bulk-selecting')) return;
      $('messages').querySelectorAll('.editing-target').forEach(item => item.classList.remove('editing-target'));
      message.classList.add('editing-target');
    });
    document.addEventListener('click', event => {
      if (event.target.closest('.message[data-message-id]')) return;
      $('messages').querySelectorAll('.editing-target').forEach(item => item.classList.remove('editing-target'));
    });
    $('messages').addEventListener('keydown', event => {
      if (!event.target.matches('.message-edit-input')) return;
      if (event.key === 'Escape') {
        const message = event.target.closest('[data-message-id]');
        if (message) finishUserMessageEdit(message.dataset.messageId, false);
      } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        const message = event.target.closest('[data-message-id]');
        if (message) finishUserMessageEdit(message.dataset.messageId, true);
      }
    });
    $('memoryArchiveCards').addEventListener('click', event => {
      const card = event.target.closest('[data-memory-archive]');
      if (!card) return;
      if (card.dataset.memoryArchive === 'health-archive') {
        setTimeout(renderHealthMemory, 0);
      } else {
        setTimeout(() => {
          $('healthMemoryControls').hidden = true;
          $('healthSummarize').hidden = true;
          $('toggleHealthEdit').hidden = true;
          $('deleteSelectedMemories').hidden = false;
          $('deleteSelectedMemories').textContent = '删除选中';
          healthEditMode = false;
          $('memoryList').classList.remove('health-memory-records');
          const types = card.dataset.memoryArchive === 'personal-profile-archive'
            ? [...profileMemoryTypes, '其他']
            : ['待办', '其他'];
          $('memoryType').replaceChildren(...types.map(type => new Option(type, type)));
        }, 0);
      }
    }, true);
    $('healthSummarize').addEventListener('click', () => {
      const selected = [...document.querySelectorAll('[data-health-select]:checked')].map(input => input.dataset.healthSelect);
      if (!selected.length) {
        $('healthSummaryMenu').hidden = !$('healthSummaryMenu').hidden;
        return;
      }
      const sorted = selected.slice().sort();
      summarizeHealth(sorted, `${sorted[0]} 至 ${sorted[sorted.length - 1]} 总结`);
    });
    $('runHealthSummary').addEventListener('click', () => {
      const data = readData();
      const period = $('healthSummaryPeriod').value;
      const now = new Date();
      let start;
      if (period === 'week') {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
        start = isoDate(date);
      } else if (period === 'month') start = isoDate(new Date(now.getFullYear(), now.getMonth(), 1));
      else start = isoDate(new Date(now.getFullYear(), 0, 1));
      const end = isoDate(now);
      const dates = allHealthDates(data).filter(date => date >= start && date <= end);
      const labels = { week: '本周总结', month: '本月总结', year: '本年总结' };
      summarizeHealth(dates, `${labels[period]}（${start} 至 ${end}）`);
    });
    $('runHealthSummaryRange').addEventListener('click', () => {
      const start = $('healthSummaryFrom').value;
      const end = $('healthSummaryTo').value;
      if (!validIsoDate(start) || !validIsoDate(end) || end < start) {
        notify('请检查健康总结的起止日期。');
        return;
      }
      const dates = allHealthDates(readData()).filter(date => date >= start && date <= end);
      summarizeHealth(dates, `范围总结（${start} 至 ${end}）`);
    });
    $('nutritionGoalsForm').addEventListener('submit', event => {
      event.preventDefault();
      const number = id => Math.max(0, Number($(id).value) || 0);
      updateData(data => {
        data.settings.dietGoals = {
          waterMl: number('goalWaterMl'),
          caloriesKcal: number('goalCaloriesKcal'),
          proteinG: number('goalProteinG'),
          carbohydrateG: number('goalCarbohydrateG'),
          fatG: number('goalFatG'),
          fiberG: number('goalFiberG')
        };
      });
      notify('每日营养目标已保存。');
    });
    $('homeTodoList').addEventListener('change', event => {
      const input = event.target.closest('[data-todo-complete]');
      if (!input) return;
      updateData(data => {
        const todo = data.todos.find(item => item.id === input.dataset.todoComplete);
        if (todo && input.checked) {
          removeCompletedTodoMemories(data, todo);
          data.todos = data.todos.filter(item => item.id !== todo.id);
        }
      });
    });
    $('homeTodoList').addEventListener('click', event => {
      const button = event.target.closest('[data-todo-delete]');
      if (!button) return;
      updateData(data => {
        data.todos = data.todos.filter(item => item.id !== button.dataset.todoDelete);
        for (const archive of data.memoryArchives) {
          archive.items = (archive.items || []).filter(item => item.todoId !== button.dataset.todoDelete);
        }
      });
      notify('已删除这条待办。');
    });
    $('homeFavoritesList').addEventListener('click', event => {
      const button = event.target.closest('[data-favorite-delete]');
      if (!button) return;
      window.petalDeletedMemoryItemIds = [...new Set([...(window.petalDeletedMemoryItemIds || []), button.dataset.favoriteDelete])];
      updateData(data => {
        for (const archive of data.memoryArchives) {
          archive.items = (archive.items || []).filter(item => item.id !== button.dataset.favoriteDelete);
        }
      });
      notify('已删除这条收藏。');
    });
    $('memoryList').addEventListener('click', event => {
      const dateEdit = event.target.closest('[data-health-edit-date-toggle]');
      if (dateEdit) {
        const date = dateEdit.dataset.healthEditDateToggle;
        if (activeHealthDate === date && healthEditMode) healthEditMode = false;
        else {
          activeHealthDate = date;
          healthEditMode = true;
        }
        renderHealthMemory();
        return;
      }
      const edit = event.target.closest('[data-health-edit-source]');
      if (edit) {
        openHealthRecordEditor(edit.dataset.healthEditSource, edit.dataset.healthEditDate, edit.dataset.healthEditIndex);
        return;
      }
      const remove = event.target.closest('[data-health-delete-source]');
      if (remove) {
        deleteHealthRecord(remove.dataset.healthDeleteSource, remove.dataset.healthDeleteDate, remove.dataset.healthDeleteIndex, remove.dataset.healthDeleteId);
        return;
      }
      const toggle = event.target.closest('[data-health-toggle]');
      if (toggle) {
        activeHealthDate = activeHealthDate === toggle.dataset.healthToggle ? '' : toggle.dataset.healthToggle;
        renderHealthMemory();
        return;
      }
      const summary = event.target.closest('[data-summary-view]');
      if (summary) {
        const content = summary.closest('.health-date-entry')?.querySelector('.health-date-details');
        if (content) content.hidden = !content.hidden;
        return;
      }
      const summarySelect = event.target.closest('[data-summary-select]');
      if (summarySelect) {
        summarySelect.closest('.health-date-entry').querySelector('.health-date-details').hidden = false;
      }
    });
    $('healthJumpButton').addEventListener('click', () => {
      const date = $('healthJumpDate').value;
      if (!validIsoDate(date)) return notify('请选择有效日期。');
      const row = $(`health-date-${date}`);
      if (!row) return notify('这一天没有健康记录。');
      activeHealthDate = date;
      renderHealthMemory();
      setTimeout(() => $(`health-date-${date}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 20);
    });
    $('bowelPrevMonth').addEventListener('click', () => { bowelMonth = new Date(bowelMonth.getFullYear(), bowelMonth.getMonth() - 1, 1); renderBowelCalendar(); });
    $('bowelNextMonth').addEventListener('click', () => { bowelMonth = new Date(bowelMonth.getFullYear(), bowelMonth.getMonth() + 1, 1); renderBowelCalendar(); });
    $('bowelCalendar').addEventListener('click', event => {
      const dateButton = event.target.closest('[data-bowel-date]');
      if (!dateButton) return;
      $('bowelDate').value = dateButton.dataset.bowelDate;
      $('bowelTime').value = new Date().toTimeString().slice(0, 5);
      $('bowelNote').focus();
    });
    $('hiddenPrevMonth').addEventListener('click', () => { hiddenMonth = new Date(hiddenMonth.getFullYear(), hiddenMonth.getMonth() - 1, 1); renderHiddenCalendar(); });
    $('hiddenNextMonth').addEventListener('click', () => { hiddenMonth = new Date(hiddenMonth.getFullYear(), hiddenMonth.getMonth() + 1, 1); renderHiddenCalendar(); });
    $('hiddenDateCalendar').addEventListener('click', event => {
      const button = event.target.closest('[data-hidden-date]');
      if (!button) return;
      const date = button.dataset.hiddenDate;
      updateData(data => { data.hiddenHealthDates = data.hiddenHealthDates.includes(date) ? data.hiddenHealthDates.filter(item => item !== date) : [...data.hiddenHealthDates, date].sort(); });
      notify(`${date} ${button.getAttribute('aria-pressed') === 'true' ? '已取消隐藏' : '已隐藏'}`);
    });
    $('hiddenDatesList').addEventListener('click', event => {
      if (!event.target.closest('#unhideAllDates')) return;
      updateData(data => { data.hiddenHealthDates = []; });
      notify('已取消全部隐藏日期');
    });
    $('hideDateRange').addEventListener('click', () => {
      const start = $('hideFromDate').value;
      const end = $('hideToDate').value;
      if (!validIsoDate(start) || !validIsoDate(end) || start > end) return notify('请检查批量隐藏的起止日期。');
      const span = (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000 + 1;
      if (span > 3650) return notify('批量隐藏范围不能超过 10 年。');
      updateData(data => {
        const hidden = new Set(data.hiddenHealthDates);
        for (let day = 0; day < span; day++) hidden.add(new Date(Date.parse(`${start}T00:00:00Z`) + day * 86400000).toISOString().slice(0, 10));
        data.hiddenHealthDates = [...hidden].sort();
      });
      notify('所选日期范围已隐藏');
    });
    $('saveTokenSettings').addEventListener('click', () => {
      const limit = Number($('chatHistoryTokenLimit').value);
      const threshold = Number($('autoSummaryTokenThreshold').value);
      const healthThreshold = Number($('healthMemoryAutoSummaryTokenThreshold').value);
      if (!Number.isInteger(limit) || limit < 256 || limit > 200000
        || ![threshold, healthThreshold].every(value => Number.isInteger(value) && value >= 256 && value <= 50000)) {
        return notify('请填写有效范围：聊天记录上限为 256–200000；聊天总结提醒阈值与健康记忆自动总结阈值为 256–50000。');
      }
      updateData(data => { data.settings.tokenSettings = { ...data.settings.tokenSettings, chatHistoryTokenLimit: limit, autoSummaryTokenThreshold: threshold, healthMemoryAutoSummaryTokenThreshold: healthThreshold }; });
      notify('Token 设置已保存');
    });
    document.addEventListener('submit', event => {
      if (!['sleepForm', 'foodForm', 'bowelForm', 'weightForm', 'joyForm'].includes(event.target.id)) return;
      setTimeout(() => {
        refresh();
        maybeAutoSummarizeHealth();
      }, 0);
    });
    document.addEventListener('click', event => {
      if (event.target.closest('[data-remove]') || event.target.closest('#clearAll')) setTimeout(refresh, 0);
    });
    window.addEventListener('petal-data-updated', refresh);
    window.addEventListener('petal-render-chat', renderChatFromStorage);
    window.addEventListener('petal-data-cleared', () => {
      chatApiKey = '';
      analysisApiKey = '';
      drawingApiKey = '';
      $('apiKey').value = '';
      $('analysisApiKey').value = '';
      $('drawingApiKey').value = '';
      refresh();
    });
    $('analyzeFood').addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      analyzeFood();
    }, true);
    $('analyzeSleep').addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      analyzeSleep();
    }, true);
    $('sleepAnalysisFeed').addEventListener('click', event => {
      const button = event.target.closest('[data-rerun-sleep-analysis]');
      if (!button) return;
      $('sleepDate').value = button.dataset.rerunSleepAnalysis;
      analyzeSleep();
    });
  }

  function addSleepAnalysisPromptSetting() {
    const existing = $('sleepAnalysisPrompt');
    if (existing) return;
    const field = document.createElement('div');
    field.className = 'field';
    field.innerHTML = '<label for="sleepAnalysisPrompt">睡眠分析指令</label><textarea id="sleepAnalysisPrompt" rows="5" placeholder="设置睡眠情况分析规则"></textarea><button class="secondary-button" type="button" id="saveSleepAnalysisPrompt">保存睡眠分析指令</button>';
    $('healthMemoryAnalysisPrompt').closest('.field').insertAdjacentElement('afterend', field);
    $('sleepAnalysisPrompt').value = readData().settings.analysisPrompts.sleepAnalysis || sleepAnalysisDefault;
    $('saveSleepAnalysisPrompt').addEventListener('click', () => {
      updateData(data => { data.settings.analysisPrompts.sleepAnalysis = $('sleepAnalysisPrompt').value.trim() || sleepAnalysisDefault; });
      notify('睡眠分析指令已保存。');
    });
  }

  async function analyzeSleep() {
    const data = readData();
    const date = $('sleepDate').value;
    if (!validIsoDate(date)) {
      $('sleepAnalysisStatus').textContent = '请选择有效的分析日期。';
      return notify('请选择有效的分析日期。');
    }
    const startDate = new Date(`${date}T00:00:00`);
    startDate.setDate(startDate.getDate() - 13);
    const start = isoDate(startDate);
    const hidden = new Set(data.hiddenHealthDates || []);
    const records = data.sleep.filter(record => record.date >= start && record.date <= date && !hidden.has(record.date))
      .sort((left, right) => left.date.localeCompare(right.date));
    if (!records.length) {
      $('sleepAnalysisStatus').textContent = '近 14 天没有可用于分析的睡眠记录。';
      return notify('近 14 天没有可用于分析的睡眠记录。');
    }
    const button = $('analyzeSleep');
    const status = $('sleepAnalysisStatus');
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = '正在分析…';
    status.textContent = `正在分析 ${start} 至 ${date} 的睡眠记录…`;
    try {
      const current = readData();
      const content = await requestAnalysis({
        system: current.settings.analysisPrompts.sleepAnalysis || sleepAnalysisDefault,
        user: `分析日期：${date}\n统计范围：${start} 至 ${date}\n睡眠记录：${JSON.stringify(records)}`
      });
      const latest = readData();
      latest.healthAnalysisRecords = latest.healthAnalysisRecords.filter(item => !(item.type === 'sleep_analysis' && item.date === date));
      latest.healthAnalysisRecords.unshift({
        id: `sleep-analysis-${Date.now().toString(36)}`,
        type: 'sleep_analysis',
        title: '睡眠分析',
        date,
        period: `${start} 至 ${date}`,
        content,
        source: 'AI 睡眠分析'
      });
      writeData(latest);
      refresh();
      maybeAutoSummarizeHealth();
      status.textContent = `睡眠分析已保存至 ${date} 的健康记忆。`;
      notify('睡眠分析完成并已加入健康记忆。');
    } catch (error) {
      console.error('睡眠分析失败', error);
      status.textContent = `睡眠分析失败：${error.message}`;
      notify(`睡眠分析失败：${error.message}`);
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      button.textContent = '分析睡眠';
    }
  }

  async function analyzeFood() {
    const data = readData();
    const date = foodReviewMode ? selectedFoodDashboardDate() : $('foodDate').value;
    const foods = data.food.filter(record => record.date === date);
    const status = $('foodAnalysisStatus');
    if (!foods.length) {
      status.textContent = `${date} 还没有饮食记录。`;
      return notify(`${date} 还没有饮食记录。`);
    }
    const button = $('analyzeFood');
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = '正在请求分析…';
    status.textContent = '正在请求分析 API，请稍候…';
    try {
      const analysis = await requestAnalysis({
        system: foodAnalysisInstruction,
        user: `日期：${date}\n饮食记录：${JSON.stringify(foods)}`
      });
      const parsed = JSON.parse(analysis.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('模型返回的数据格式无效。');
      if (typeof parsed.summary !== 'string' || typeof parsed.note !== 'string' || !Number.isFinite(parsed.caloriesKcal) || parsed.caloriesKcal < 0 || !Array.isArray(parsed.nutrients) || !Array.isArray(parsed.meals)) {
        throw new Error('模型返回格式不完整；需要概述、总能量、营养素数组、逐条记录估算和说明。');
      }
      const validNutrients = items => Array.isArray(items) && items.every(item =>
        item && typeof item.name === 'string' && item.name.trim() &&
        Number.isFinite(item.amount) && item.amount >= 0 &&
        typeof item.unit === 'string' &&
        (item.dailyPercent === undefined || (Number.isFinite(item.dailyPercent) && item.dailyPercent >= 0))
      );
      if (!validNutrients(parsed.nutrients) || parsed.meals.some(meal =>
        !meal || typeof meal.recordId !== 'string' || typeof meal.food !== 'string' ||
        !Number.isFinite(meal.caloriesKcal) || meal.caloriesKcal < 0 || !validNutrients(meal.nutrients)
      )) throw new Error('模型返回的营养素或单条饮食估算格式无效。');
      const inputRecordIds = new Set(foods.map(record => record.id));
      if (parsed.meals.length !== foods.length || parsed.meals.some(meal => !inputRecordIds.has(meal.recordId))) {
        throw new Error('模型返回的单条饮食估算与输入记录无法对应，请重试。');
      }
      const latest = readData();
      latest.foodAnalyses = latest.foodAnalyses.filter(item => item.date !== date);
      const savedAnalysis = { ...parsed, date, createdAt: new Date().toISOString() };
      latest.foodAnalyses.unshift(savedAnalysis);
      writeData(latest);
      renderFoodAnalysisCard(savedAnalysis, latest);
      window.dispatchEvent(new Event('petal-data-updated'));
      document.dispatchEvent(new Event('petal-refresh'));
      maybeAutoSummarizeHealth();
      status.textContent = '饮食分析完成并已保存。';
      notify('饮食分析已保存');
    } catch (error) {
      console.error('饮食分析失败', error);
      status.textContent = `饮食分析失败：${error.message}`;
      notify(`饮食分析失败：${error.message}`);
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      button.textContent = foodReviewMode ? '分析所选日饮食' : '分析今日饮食';
    }
  }

  function loadNutritionGoalForm() {
    const goals = readData().settings.dietGoals;
    $('goalWaterMl').value = goals.waterMl;
    $('goalCaloriesKcal').value = goals.caloriesKcal || '';
    $('goalProteinG').value = goals.proteinG || '';
    $('goalCarbohydrateG').value = goals.carbohydrateG || '';
    $('goalFatG').value = goals.fatG || '';
    $('goalFiberG').value = goals.fiberG || '';
  }

  function renderNutritionGoalProgress() {
    const container = $('nutritionGoalProgress');
    if (!container) return;
    const data = readData();
    const goals = data.settings.dietGoals;
    const date = selectedFoodDashboardDate();
    const analysis = data.foodAnalyses.find(item => item.date === date) || null;
    const values = [
      { label: '能量', actual: analysis ? Number(analysis.caloriesKcal) || 0 : 0, target: Number(goals.caloriesKcal), unit: 'kcal' },
      ...[
        { key: 'proteinG', label: '蛋白质', pattern: /蛋白|protein/i },
        { key: 'carbohydrateG', label: '碳水化合物', pattern: /碳水|carbohydrate|carb/i },
        { key: 'fatG', label: '脂肪', pattern: /脂肪|fat/i },
        { key: 'fiberG', label: '膳食纤维', pattern: /纤维|fiber/i }
      ].map(item => {
        const nutrient = (analysis?.nutrients || []).find(entry => item.pattern.test(entry.name || ''));
        const parsed = Number(String(nutrient?.amount ?? '').match(/-?\d+(?:\.\d+)?/)?.[0]);
        return { label: item.label, actual: Number.isFinite(parsed) ? parsed : 0, target: Number(goals[item.key]), unit: nutrient?.unit || 'g' };
      }),
      {
        label: '饮水',
        actual: data.food.filter(record => record.date === date).reduce((sum, record) => sum + (Number(record.waterMl) || 0), 0),
        target: Number(goals.waterMl),
        unit: 'ml'
      }
    ].filter(item => item.target > 0 && Number.isFinite(item.actual));
    container.innerHTML = values.length
      ? `<div class="nutrition-goal-divider"></div><div class="nutrition-goal-title">每日目标</div><div class="nutrition-goal-list">${values.map(item => {
        const ratio = Math.max(0, Math.min(1, item.actual / item.target));
        const percent = Math.round(item.actual / item.target * 100);
        const complete = item.actual >= item.target;
        const actual = Number.isInteger(item.actual) ? item.actual : Number(item.actual.toFixed(1));
        const target = Number.isInteger(item.target) ? item.target : Number(item.target.toFixed(1));
        return `<div class="nutrition-goal-item ${complete ? 'is-complete' : ''}"><span class="nutrition-goal-label">${escapeHtml(item.label)}</span><strong class="nutrition-goal-value" style="--goal-fill:${(ratio * 100).toFixed(2)}%">${escapeHtml(actual)} / ${escapeHtml(target)} ${escapeHtml(item.unit)} <small>${percent}%</small></strong></div>`;
      }).join('')}</div>`
      : '';
  }

  function renderFoodAnalysisCard(analysis, data) {
    $('foodAnalysis').hidden = false;
    const today = isoDate(new Date());
    const date = selectedFoodDashboardDate();
    const currentAnalysis = analysis?.date === date ? analysis : (data.foodAnalyses || []).find(item => item.date === date) || null;
    const isToday = date === today;
    const calories = currentAnalysis && Number.isFinite(Number(currentAnalysis.caloriesKcal)) ? Number(currentAnalysis.caloriesKcal) : 0;
    $('foodAnalysisDate').textContent = currentAnalysis ? `${date} · ${isToday ? '今日' : '历史'}估算` : `${date} · ${isToday ? '今日' : '历史'}指标`;
    $('foodAnalysisSummary').innerHTML = `<div class="nutrition-energy"><div><div class="summary-label">✧ ${isToday ? '今日' : '当日'}能量摄入估算</div><div class="summary-number">${calories} <small>kcal</small></div></div><div class="nutrition-energy-note">${escapeHtml(foodAnalysisSummaryWithoutRingValues(currentAnalysis?.summary) || (currentAnalysis ? '营养摄入数值已由上方图表展示。' : '尚未分析时，能量和营养素估算显示为 0。'))}</div></div>`;
    $('foodMealEstimates').innerHTML = (currentAnalysis?.meals || []).length
      ? `<div class="food-meal-title">单条饮食估算</div><div class="food-meal-list">${currentAnalysis.meals.map(meal => `<div class="food-meal-item"><strong>${escapeHtml(meal.food)}</strong><span>约 ${escapeHtml(meal.caloriesKcal)} kcal</span><small>${meal.nutrients.map(item => `${escapeHtml(item.name)} ${escapeHtml(item.amount)} ${escapeHtml(item.unit)}`).join(' · ')}</small></div>`).join('')}</div>`
      : '';
    renderNutritionRings(getNutritionRingValues(currentAnalysis, data, date));
    $('foodAnalysisNote').textContent = currentAnalysis?.note || `饮水量直接汇总${isToday ? '今日' : '所选日期'}记录；其余营养估算需点击“分析饮食”。`;
  }

  function selectedFoodDashboardDate() {
    return foodReviewMode && validIsoDate(foodReviewDate) ? foodReviewDate : isoDate(new Date());
  }

  function renderSelectedFoodDashboard() {
    const data = readData();
    const date = selectedFoodDashboardDate();
    renderFoodAnalysisCard((data.foodAnalyses || []).find(item => item.date === date) || null, data);
    renderNutritionGoalProgress();
  }

  function foodAnalysisSummaryWithoutRingValues(summary) {
    return String(summary || '').split(/(?<=[。！？!?；;\n])/u).filter(sentence => {
      const hasNutrient = /(能量|热量|卡路里|kcal|千卡|大卡|蛋白质|碳水|脂肪|膳食纤维|纤维|饮水|水分)/i.test(sentence);
      return !(hasNutrient && /\d/.test(sentence));
    }).join('').trim();
  }

  function getNutritionRingValues(analysis, data, date = selectedFoodDashboardDate()) {
    const nutrients = analysis?.nutrients || [];
    const water = data.food.filter(record => record.date === date).reduce((total, record) => total + (Number(record.waterMl) || 0), 0);
    const definitions = [
      { name: '能量', unit: 'kcal', key: 'caloriesKcal', amount: analysis ? Number(analysis.caloriesKcal) || 0 : 0 },
      { name: '蛋白质', unit: 'g', key: 'proteinG', pattern: /蛋白|protein/i },
      { name: '碳水化合物', unit: 'g', key: 'carbohydrateG', pattern: /碳水|carbohydrate|carb/i },
      { name: '脂肪', unit: 'g', key: 'fatG', pattern: /脂肪|fat/i },
      { name: '膳食纤维', unit: 'g', key: 'fiberG', pattern: /纤维|fiber/i },
      { name: date === isoDate(new Date()) ? '今日饮水' : '当日饮水', unit: 'ml', key: 'waterMl', amount: water }
    ];
    return definitions.map(item => {
      const nutrient = item.pattern ? nutrients.find(entry => item.pattern.test(entry.name || '')) : null;
      const parsed = nutrient ? Number(String(nutrient.amount ?? '').match(/-?\d+(?:\.\d+)?/)?.[0]) : 0;
      const amount = item.amount ?? (Number.isFinite(parsed) ? parsed : 0);
      const target = Number(data.settings.dietGoals[item.key]) || 0;
      const fallbackPercent = nutrient && Number.isFinite(nutrient.dailyPercent) ? nutrient.dailyPercent : 0;
      return { name: item.name, unit: item.unit, amount, dailyPercent: target > 0 ? amount / target * 100 : fallbackPercent };
    });
  }

  function renderNutritionRings(nutrients) {
    const colors = ['#ffcad4', '#9ed4d1', '#e8df9e', '#c8b8e8', '#e9bea9', '#a9c9e5'];
    const circumference = 2 * Math.PI * 43;
    $('nutritionGrid').innerHTML = `<div class="nutrition-section-label">NUTRIENT INTAKE ／ 营养素摄入</div><div class="nutrition-rings">${nutrients.map((nutrient, index) => {
      const hasPercent = Number.isFinite(nutrient.dailyPercent);
      const percent = Math.max(0, Math.min(100, hasPercent ? nutrient.dailyPercent : 0));
      const amount = escapeHtml(nutrient.amount ?? 0);
      const unit = escapeHtml(nutrient.unit || '');
      return `<div class="nutrition-ring-item" style="--ring-color:${colors[index % colors.length]}"><div class="nutrition-ring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="nutrition-ring-track" cx="50" cy="50" r="43"/><circle class="nutrition-ring-progress" cx="50" cy="50" r="43" stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${(circumference * (1 - percent / 100)).toFixed(2)}"/></svg><div class="nutrition-ring-center"><strong>${amount}</strong><span>${unit}</span><small>${hasPercent ? `${percent.toFixed(percent % 1 ? 1 : 0)}%` : '—'}</small></div></div><div class="nutrition-ring-name">${escapeHtml(nutrient.name || '营养素')}</div></div>`;
    }).join('')}</div>`;
  }

  function init() {
    addCharacterMemoryControls();
    addMemoryCaptureExplanation();
    bindApiSettings();
    bindControls();
    addSleepAnalysisPromptSetting();
    const startupData = readData();
    const startupCharacterId = activeCharacterId(startupData);
    for (const message of startupData.chat) {
      if (!message.characterId) message.characterId = startupCharacterId;
    }
    for (const summary of startupData.chatSummaries || []) {
      if (summary.characterId) continue;
      const associatedMessages = startupData.chat.filter(message => message.summaryId === summary.id);
      const characterIds = [...new Set(associatedMessages.map(message => message.characterId).filter(Boolean))];
      summary.characterId = characterIds.length === 1 ? characterIds[0] : startupCharacterId;
    }
    const completedTodos = (startupData.todos || []).filter(todo => todo.completedAt);
    const completedTodoIds = new Set(completedTodos.map(todo => todo.id));
    const normalizeTodoContent = value => String(value || '').trim().replace(/\s+/g, ' ');
    const completedTodoContents = new Set(completedTodos.map(todo => normalizeTodoContent(todo.content)));
    for (const archive of startupData.memoryArchives) {
      const removed = (archive.items || []).filter(item =>
        (item.todoId && completedTodoIds.has(item.todoId))
        || (item.type === '待办' && item.completedAt)
        || (item.source === 'AI 待办' && completedTodoContents.has(normalizeTodoContent(item.content)))
      );
      if (removed.length) {
        window.petalDeletedMemoryItemIds = [...new Set([...(window.petalDeletedMemoryItemIds || []), ...removed.map(item => item.id)])];
        archive.items = archive.items.filter(item => !removed.includes(item));
      }
    }
    startupData.todos = (startupData.todos || []).filter(todo => !todo.completedAt);
    syncActiveCharacterArchiveSelection(startupData);
    writeData(startupData);
    renderCharacterArchiveBinding(startupData);
    loadApiSettings();
    window.addEventListener('petal-data-updated', () => {
      const data = readData();
      const current = JSON.stringify({ api: data.settings.api, analysisApi: data.settings.analysisApi, drawingApi: data.settings.drawingApi, weather: data.settings.weather });
      if (current !== loadedApiSettings) loadApiSettings();
      if (activeCharacterId(data) !== renderedChatCharacterId) {
        renderChatFromStorage();
        renderChatSummaryPage();
        renderChatMemoryChoices();
      }
      renderCharacterArchiveBinding(data);
    });
    loadNutritionGoalForm();
    window.addEventListener('petal-load-nutrition-goals', loadNutritionGoalForm);
    const tokenSettings = readData().settings.tokenSettings;
    $('chatHistoryTokenLimit').value = tokenSettings.chatHistoryTokenLimit;
    $('autoSummaryTokenThreshold').value = tokenSettings.autoSummaryTokenThreshold;
    $('healthMemoryAutoSummaryTokenThreshold').value = tokenSettings.healthMemoryAutoSummaryTokenThreshold;
    refresh();
    renderChatFromStorage();
    $('chatSlimeToggle')?.addEventListener('change', event => {
      const data = readData();
      data.settings.appearance ||= {};
      data.settings.appearance.chatSlimeEnabled = event.target.checked;
      writeData(data);
      renderChatFromStorage();
    });
    renderChatSummaryPage();
    renderChatMemoryChoices();
    maybePromptChatSummary();
    document.addEventListener('petal-refresh', refresh);
    window.addEventListener('load', renderTokenTotals, { once: true });
    document.addEventListener('click', event => {
      if (event.target.closest('[data-setting="tokens"]')) setTimeout(renderTokenTotals, 0);
    });
  }

  function loadApiSettings() {
    const data = readData();
    const chat = data.settings.api || {};
    const analysis = data.settings.analysisApi || {};
    const drawing = data.settings.drawingApi || {};
    $('apiProvider').value = chat.provider || 'openai';
    $('apiModel').value = chat.model || '';
    $('apiBase').value = chat.base || '';
    $('apiKey').value = chat.key || '';
    chatApiKey = chat.key || '';
    $('analysisApiProvider').value = analysis.provider || 'openai';
    $('analysisApiModel').value = analysis.model || '';
    $('analysisApiBase').value = analysis.base || '';
    $('analysisApiKey').value = analysis.key || '';
    analysisApiKey = analysis.key || '';
    $('drawingApiProvider').value = drawing.provider || 'openai';
    $('drawingApiModel').value = drawing.model || '';
    $('drawingApiBase').value = drawing.base || '';
    $('drawingApiKey').value = drawing.key || '';
    drawingApiKey = drawing.key || '';
    loadedApiSettings = JSON.stringify({ api: data.settings.api, analysisApi: data.settings.analysisApi, drawingApi: data.settings.drawingApi, weather: data.settings.weather });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
