(() => {
  const STORE_KEY = 'petalSharedReading.v1';
  const $ = id => document.getElementById(id);
  const app = $('app');
  const reader = $('sharedReadingPage');
  const bookContent = $('readingBookContent');
  const toolbar = document.querySelector('.shared-reading-toolbar');
  let savedScrollY = 0;
  let renderedChapters = [];
  let pageTurnInProgress = false;
  let shelfReturnFocus = null;
  let pendingSelection = null;
  let pendingCompanionRequest = null;
  let companionRequestInProgress = false;
  let discussionRequestInProgress = false;
  let progressSaveTimer;
  let toastTimer;

  const emptyState = () => ({
    book: { id: '', title: '', content: '', sourceName: '', progress: 0 },
    books: [],
    thoughts: [],
    discussions: [],
    discussionMessages: [],
    memories: [],
    highlights: [],
    readingTokenLimit: 50000,
    discussionHistoryLimit: 60,
    progress: 0,
    appearance: {
      readingBackgrounds: [],
      activeReadingBackgroundId: '',
      pageBackgrounds: [],
      activePageBackgroundId: '',
      pageImagePosition: 'top',
      pageImageBlur: 0,
      pageColor: '#d9dde1',
      textColor: '#f2ecdf',
      quoteColor: '#d4c6a9',
      turnMode: 'scroll',
      frostedEnabled: true,
      pageOpacity: 84,
      pageBlur: 18,
      fontSize: 15,
      lineHeight: 2,
      readingRain: false,
      readingSnow: false
    }
  });

  function showMessage(message) {
    const toast = $('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    if (typeof toast.showPopover === 'function' && !toast.matches(':popover-open')) toast.showPopover();
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.matches(':popover-open')) toast.hidePopover();
      }, 250);
    }, 2600);
  }

  function loadState() {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return emptyState();
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('共读数据格式无效。');
      const defaults = emptyState();
      return {
        ...defaults,
        ...parsed,
        book: {
          ...defaults.book,
          ...(parsed.book || {}),
          id: parsed.book?.id || (parsed.book?.content ? makeId() : ''),
          progress: Number(parsed.book?.progress ?? parsed.progress) || 0
        },
        books: Array.isArray(parsed.books) ? parsed.books.filter(book => book && typeof book.content === 'string').map(book => ({
          ...defaults.book,
          ...book,
          id: book.id || makeId()
        })) : [],
        thoughts: Array.isArray(parsed.thoughts) ? parsed.thoughts.filter(item => item && typeof item === 'object' && !Array.isArray(item)) : [],
        discussions: Array.isArray(parsed.discussions) ? parsed.discussions.filter(item => item && typeof item === 'object' && !Array.isArray(item)) : [],
        discussionMessages: Array.isArray(parsed.discussionMessages) ? parsed.discussionMessages.filter(item => item && typeof item === 'object' && !Array.isArray(item)
          && typeof item.bookId === 'string' && ['user', 'assistant', 'error'].includes(item.role) && typeof item.content === 'string')
          .map(item => item.role === 'user' && typeof item.requestedAt !== 'string' ? { ...item, requestedAt: item.requestedAt === false ? false : 'legacy' } : item) : [],
        memories: Array.isArray(parsed.memories) ? parsed.memories.filter(item => item && typeof item === 'object' && !Array.isArray(item)) : [],
        highlights: Array.isArray(parsed.highlights) ? parsed.highlights.filter(item => item && typeof item === 'object' && !Array.isArray(item)) : [],
        readingTokenLimit: Math.min(200000, Math.max(256, Number(parsed.readingTokenLimit) || defaults.readingTokenLimit)),
        discussionHistoryLimit: Math.min(100, Math.max(30, Number.isInteger(Number(parsed.discussionHistoryLimit))
          ? Number(parsed.discussionHistoryLimit) : defaults.discussionHistoryLimit)),
        appearance: { ...defaults.appearance, ...(parsed.appearance || {}) }
      };
    } catch (error) {
      console.error('读取共读数据失败', error);
      showMessage(`共读数据读取失败：${error.message}`);
      return emptyState();
    }
  }

  let state = loadState();

  function saveState(nextState = state) {
    const serialized = JSON.stringify(nextState);
    try {
      localStorage.setItem(STORE_KEY, serialized);
      state = nextState;
      return true;
    } catch (error) {
      console.error('保存共读数据失败', error);
      showMessage(`共读内容保存失败：${error.message}`);
      return false;
    }
  }

  function makeId() {
    return `reading-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function escapeCssUrl(value) {
    return `url("${String(value).replace(/["\\\n\r]/g, character => `\\${character}`)}")`;
  }

  let readingAtmosphereFrame = 0;
  let readingAtmosphereSize = { width: 0, height: 0, ratio: 1 };
  let readingRainDrops = [];
  let readingSnowParticles = [];
  let readingAtmosphereLastFrame = 0;
  const readingRainCanvas = $('readingRainCanvas');
  const readingSnowCanvas = $('readingSnowCanvas');
  const readingRainContext = readingRainCanvas.getContext('2d');
  const readingSnowContext = readingSnowCanvas.getContext('2d');

  function resizeReadingAtmosphere() {
    const bounds = reader.getBoundingClientRect();
    const { width, height } = bounds;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    readingAtmosphereSize = { width, height, ratio };
    [readingRainCanvas, readingSnowCanvas].forEach(canvas => {
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      canvas.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0);
    });
    readingRainDrops = Array.from({ length: Math.round(Math.min(140, Math.max(45, width / 10))) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: 16 + Math.random() * 25,
      speed: 5 + Math.random() * 5,
      opacity: .14 + Math.random() * .28
    }));
    readingSnowParticles = Array.from({ length: Math.round(Math.min(70, Math.max(28, width / 20))) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: .7 + Math.random() * 2,
      speed: .55 + Math.random() * .65,
      drift: .12 + Math.random() * .38,
      phase: Math.random() * Math.PI * 2,
      frequency: .003 + Math.random() * .004,
      opacity: .18 + Math.random() * .42
    }));
  }

  function syncReadingAtmosphere() {
    const appearance = state.appearance;
    const active = !reader.hidden && !document.hidden && !document.body.classList.contains('reduce-motion')
      && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && (appearance.readingRain || appearance.readingSnow);
    if (active && !readingAtmosphereFrame) {
      readingAtmosphereLastFrame = 0;
      readingAtmosphereFrame = requestAnimationFrame(animateReadingAtmosphere);
    } else if (!active && readingAtmosphereFrame) {
      cancelAnimationFrame(readingAtmosphereFrame);
      readingAtmosphereFrame = 0;
      readingRainContext.clearRect(0, 0, readingAtmosphereSize.width, readingAtmosphereSize.height);
      readingSnowContext.clearRect(0, 0, readingAtmosphereSize.width, readingAtmosphereSize.height);
    }
  }

  function animateReadingAtmosphere(now) {
    readingAtmosphereFrame = 0;
    if (reader.hidden || document.hidden) return;
    const { width, height } = readingAtmosphereSize;
    if (!width || !height) {
      syncReadingAtmosphere();
      return;
    }
    const step = readingAtmosphereLastFrame ? Math.min((now - readingAtmosphereLastFrame) / 16.67, 2) : 1;
    readingAtmosphereLastFrame = now;
    readingRainContext.clearRect(0, 0, width, height);
    readingSnowContext.clearRect(0, 0, width, height);
    if (state.appearance.readingRain) {
      readingRainDrops.forEach(drop => {
        drop.y += drop.speed * step;
        drop.x -= .45 * step;
        if (drop.y > height + drop.length) {
          drop.x = Math.random() * width;
          drop.y = -drop.length;
        }
        readingRainContext.beginPath();
        readingRainContext.moveTo(drop.x, drop.y);
        readingRainContext.lineTo(drop.x - drop.length * .055, drop.y + drop.length);
        readingRainContext.strokeStyle = `rgba(174,196,232,${drop.opacity})`;
        readingRainContext.lineWidth = 1;
        readingRainContext.stroke();
      });
    }
    if (state.appearance.readingSnow) {
      readingSnowParticles.forEach(particle => {
        particle.y += particle.speed * step;
        particle.phase += particle.frequency * step;
        particle.x += (Math.sin(particle.phase) * particle.drift + .035) * step;
        if (particle.y > height + particle.radius * 5 || particle.x < -10 || particle.x > width + 10) {
          particle.x = Math.random() * width;
          particle.y = -particle.radius * 5;
        }
        const glow = readingSnowContext.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.radius * 4);
        glow.addColorStop(0, `rgba(239,248,255,${particle.opacity})`);
        glow.addColorStop(.38, `rgba(198,224,255,${particle.opacity * .45})`);
        glow.addColorStop(1, 'rgba(198,224,255,0)');
        readingSnowContext.beginPath();
        readingSnowContext.fillStyle = glow;
        readingSnowContext.arc(particle.x, particle.y, particle.radius * 4, 0, Math.PI * 2);
        readingSnowContext.fill();
      });
    }
    if (reader.classList.contains('reading-atmosphere-rain') || reader.classList.contains('reading-atmosphere-snow')) {
      readingAtmosphereFrame = requestAnimationFrame(animateReadingAtmosphere);
    }
  }

  const readingAtmosphereObserver = new ResizeObserver(resizeReadingAtmosphere);
  readingAtmosphereObserver.observe(reader);
  document.addEventListener('visibilitychange', syncReadingAtmosphere);
  window.addEventListener('resize', resizeReadingAtmosphere, { passive: true });

  function applyAppearance() {
    const appearance = state.appearance;
    const color = /^#[\da-f]{6}$/i.test(appearance.pageColor) ? appearance.pageColor : '#d9dde1';
    const textColor = /^#[\da-f]{6}$/i.test(appearance.textColor) ? appearance.textColor : '#f2ecdf';
    const quoteColor = /^#[\da-f]{6}$/i.test(appearance.quoteColor) ? appearance.quoteColor : '#d4c6a9';
    const opacity = Math.min(100, Math.max(10, Number(appearance.pageOpacity) || 84));
    const blur = Math.min(36, Math.max(0, Number(appearance.pageBlur) || 0));
    const colorChannels = color.slice(1).match(/.{2}/g).map(channel => Number.parseInt(channel, 16));
    const page = $('readingBookPage');
    page.style.setProperty('--reading-page-background', `rgba(${colorChannels.join(',')},${opacity / 100})`);
    page.style.setProperty('--reading-page-opacity', String(opacity / 100));
    page.style.setProperty('--reading-page-blur', `${blur}px`);
    page.style.setProperty('--reading-text-color', textColor);
    page.style.setProperty('--reading-quote-color', quoteColor);
    page.style.setProperty('--reading-font-size', `${Math.min(24, Math.max(12, Number(appearance.fontSize) || 15))}px`);
    page.style.setProperty('--reading-line-height', String(Math.min(3, Math.max(1.4, Number(appearance.lineHeight) || 2))));
    const imageBlur = Math.min(36, Math.max(0, Number(appearance.pageImageBlur) || 0));
    page.style.setProperty('--reading-page-image-blur', `${imageBlur}px`);
    page.dataset.turnMode = appearance.turnMode === 'realistic' ? 'realistic' : 'scroll';
    page.classList.toggle('reading-frosted-enabled', appearance.frostedEnabled !== false);
    const pageBackground = appearance.readingBackgrounds.find(image => image.id === appearance.activeReadingBackgroundId);
    if (pageBackground) reader.style.setProperty('--reading-background-image', escapeCssUrl(pageBackground.dataUrl));
    else reader.style.removeProperty('--reading-background-image');

    const bookBackground = appearance.pageBackgrounds.find(image => image.id === appearance.activePageBackgroundId);
    page.classList.toggle('has-reading-page-image', Boolean(bookBackground));
    if (bookBackground) $('readingPageImageMask').style.setProperty('--reading-page-image', escapeCssUrl(bookBackground.dataUrl));
    else $('readingPageImageMask').style.removeProperty('--reading-page-image');
    $('readingPageImageMask').classList.toggle('is-bottom', appearance.pageImagePosition === 'bottom');
    reader.classList.toggle('reading-atmosphere-rain', Boolean(appearance.readingRain));
    reader.classList.toggle('reading-atmosphere-snow', Boolean(appearance.readingSnow));
    syncReadingAtmosphere();
  }

  function updateProgress() {
    const maxScroll = Math.max(0, bookContent.scrollHeight - bookContent.clientHeight);
    const progress = maxScroll ? bookContent.scrollTop / maxScroll : 0;
    $('readingProgressFill').style.width = `${Math.round(progress * 100)}%`;
    const currentChapter = updateCurrentChapter();
    const remainingChapters = Math.max(0, renderedChapters.length - currentChapter - 1);
    $('readingPageIndicator').textContent = `第 ${Math.min(renderedChapters.length || 1, currentChapter + 1)} 章 · 剩余 ${remainingChapters} 章`;
    state.progress = progress;
    state.book.progress = progress;
    if (!reader.hidden) {
      clearTimeout(progressSaveTimer);
      progressSaveTimer = setTimeout(() => saveState(), 500);
    }
  }

  function parseChapters(content) {
    const lines = content.replace(/\r\n?/g, '\n').split('\n');
    const headings = [];
    const chapterHeading = /^#{0,6}\s*(?:(第\s*(?:\d+|[零〇一二三四五六七八九十百千万两]+)\s*[章节回卷部集篇])(?:\s*(?:[:：、.．\-—]\s*|\s+).*)?|chapter\s+(?:\d+|[ivxlcdm]+)(?:\s*[:：.、\-—]\s*.*|\s+.*)?)\s*$/i;
    lines.forEach((line, index) => {
      const title = line.trim().replace(/^#{1,6}\s*/, '');
      if (chapterHeading.test(title)) headings.push({ index, title });
    });

    if (!headings.length) return [{ title: '全文', content, hasHeading: false }];

    const chapters = [];
    const preface = lines.slice(0, headings[0].index).join('\n').trim();
    if (preface) chapters.push({ title: '前言', content: preface, hasHeading: false });
    headings.forEach((heading, index) => {
      const end = headings[index + 1]?.index ?? lines.length;
      chapters.push({
        title: heading.title,
        content: lines.slice(heading.index + 1, end).join('\n').trim(),
        hasHeading: true
      });
    });
    return chapters;
  }

  function appendParagraphs(container, text, nextParagraphNumber) {
    const paragraphs = text.split(/\n\s*\n|\n(?=[\u3000]{1,}|[ \t]{2,}|[“「『])/).map(value => value.trim()).filter(Boolean);
    paragraphs.forEach(value => {
      const quoteLines = value.split('\n');
      const markdownQuote = quoteLines.every(line => /^\s*>\s?/.test(line));
      const standaloneQuote = /^(?:"[^"\n]+"|“[^”\n]+”|「[^」\n]+」|『[^』\n]+』|‘[^’\n]+’)$/.test(value);
      if (markdownQuote) {
        const quote = document.createElement('blockquote');
        quoteLines.map(line => line.replace(/^\s*>\s?/, '').trim()).filter(Boolean).forEach(line => {
          const paragraph = document.createElement('p');
          paragraph.dataset.readingParagraph = `p${nextParagraphNumber()}`;
          appendInlineQuotes(paragraph, line);
          quote.append(paragraph);
        });
        container.append(quote);
        return;
      }
      const paragraph = document.createElement('p');
      paragraph.dataset.readingParagraph = `p${nextParagraphNumber()}`;
      if (standaloneQuote) paragraph.className = 'reading-quote';
      appendInlineQuotes(paragraph, value);
      container.append(paragraph);
    });
  }

  function appendInlineQuotes(container, text) {
    const quotePattern = /“[^”]+”|「[^」]+」|『[^』]+』|‘[^’]+’|"[^"]+"/g;
    let lastIndex = 0;
    for (const match of text.matchAll(quotePattern)) {
      if (match.index > lastIndex) container.append(document.createTextNode(text.slice(lastIndex, match.index)));
      const quote = document.createElement('span');
      quote.className = 'reading-quote-text';
      quote.textContent = match[0];
      container.append(quote);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) container.append(document.createTextNode(text.slice(lastIndex)));
  }

  function updateChapterList() {
    const list = $('readingChapterList');
    list.replaceChildren();
    renderedChapters.forEach((chapter, index) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'reading-chapter-item';
      item.dataset.chapterIndex = String(index);
      const title = document.createElement('span');
      title.textContent = chapter.title;
      item.append(title);
      if (index < (Number(state.book.aiReadThrough) || 0)) {
        const readMark = document.createElement('small');
        readMark.className = 'reading-chapter-ai-read';
        readMark.textContent = 'AI 已读';
        item.append(readMark);
      }
      item.addEventListener('click', () => {
        const section = bookContent.querySelectorAll('.reading-chapter')[index];
        if (section) bookContent.scrollTo({ top: section.offsetTop, behavior: 'smooth' });
        closeChapterDrawer();
      });
      list.append(item);
    });
    $('readingChapterOpen').hidden = renderedChapters.length <= 1;
  }

  function itemsForCurrentBook(items) {
    return items.filter(item => item && (!item.bookId || item.bookId === state.book.id));
  }

  function wrapTextRange(root, startOffset, endOffset, className, dataset = {}) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    let length = 0;
    while ((node = walker.nextNode())) {
      nodes.push({ node, start: length, end: length + node.textContent.length });
      length += node.textContent.length;
    }
    const start = nodes.find(item => startOffset >= item.start && startOffset < item.end);
    const end = nodes.find(item => endOffset > item.start && endOffset <= item.end);
    if (!start || !end || endOffset <= startOffset) return false;
    const range = document.createRange();
    range.setStart(start.node, startOffset - start.start);
    range.setEnd(end.node, endOffset - end.start);
    const mark = document.createElement('mark');
    mark.className = className;
    Object.assign(mark.dataset, dataset);
    try {
      mark.append(range.extractContents());
      range.insertNode(mark);
      return true;
    } catch (error) {
      console.warn('无法渲染共读划线', error);
      return false;
    }
  }

  function renderParagraphAnnotations() {
    const paragraphs = [...bookContent.querySelectorAll('[data-reading-paragraph]')];
    const paragraphById = new Map(paragraphs.map(paragraph => [paragraph.dataset.readingParagraph, paragraph]));
    const paragraphIndex = new Map(paragraphs.map((paragraph, index) => [paragraph.dataset.readingParagraph, index]));
    const comments = itemsForCurrentBook(state.thoughts)
      .filter(item => item.kind === 'ai-comment')
      .filter(item => {
        const paragraph = paragraphById.get(item.paragraphId || '');
        return paragraph && typeof item.paragraphText === 'string'
          && item.paragraphText === paragraph.textContent.trim();
      })
      .sort((left, right) => (paragraphIndex.get(left.paragraphId) ?? 0) - (paragraphIndex.get(right.paragraphId) ?? 0));
    const annotations = [];
    const usedCommentIds = new Set();
    comments.forEach((item, index) => {
      if (usedCommentIds.has(item.id)) return;
      const paragraphIds = Array.isArray(item.paragraphIds) && item.paragraphIds.includes(item.paragraphId)
        ? item.paragraphIds.filter(id => paragraphById.has(id)
          && (!item.paragraphTexts || item.paragraphTexts[id] === paragraphById.get(id).textContent.trim()))
        : [item.paragraphId];
      const rangeIds = [...paragraphIds];
      if (!Array.isArray(item.paragraphIds)) {
        let lastIndex = paragraphIndex.get(item.paragraphId);
        for (let nextIndex = index + 1; nextIndex < comments.length; nextIndex += 1) {
          const next = comments[nextIndex];
          const currentIndex = paragraphIndex.get(next.paragraphId);
          if (Array.isArray(next.paragraphIds) || next.content !== item.content
            || next.chapterTitle !== item.chapterTitle || currentIndex !== lastIndex + 1) break;
          const currentTime = Date.parse(item.createdAt);
          const nextTime = Date.parse(next.createdAt);
          if (Number.isFinite(currentTime) && Number.isFinite(nextTime) && nextTime - currentTime > 5000) break;
          usedCommentIds.add(next.id);
          rangeIds.push(next.paragraphId);
          lastIndex = currentIndex;
        }
      }
      annotations.push({ item, paragraphIds: rangeIds });
    });

    paragraphs.forEach(paragraph => {
      const paragraphId = paragraph.dataset.readingParagraph;
      const highlights = state.highlights
        .filter(item => item && item.bookId === state.book.id && item.paragraphId === paragraphId)
        .sort((left, right) => right.start - left.start);
      highlights.forEach(highlight => {
        if (!wrapTextRange(paragraph, Number(highlight.start), Number(highlight.end), 'reading-user-highlight', {
          readingHighlight: highlight.id,
          readingHighlightLabel: '点击查看划线操作'
        })) return;
        const mark = paragraph.querySelector(`[data-reading-highlight="${CSS.escape(highlight.id)}"]`);
        mark?.setAttribute('tabindex', '0');
        mark?.setAttribute('role', 'button');
        mark?.setAttribute('aria-label', '划线文本，点击查看讨论或取消划线');
        const actions = document.createElement('span');
        actions.className = 'reading-annotation-actions';
        actions.dataset.readingHighlightActions = highlight.id;
        actions.hidden = true;
        const discuss = document.createElement('button');
        discuss.type = 'button';
        discuss.className = 'reading-inline-discuss';
        discuss.dataset.readingDiscussHighlight = highlight.id;
        discuss.textContent = '讨论';
        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.className = 'reading-inline-cancel';
        cancel.dataset.readingCancelHighlight = highlight.id;
        cancel.textContent = '取消划线';
        actions.append(discuss);
        actions.append(cancel);
        paragraph.after(actions);
      });
      const annotationsForParagraph = annotations.filter(annotation => annotation.paragraphIds.includes(paragraphId));
      if (annotationsForParagraph.length) {
        wrapTextRange(paragraph, 0, paragraph.textContent.length, 'reading-ai-highlight');
      }
      const paragraphComments = annotationsForParagraph.filter(annotation => annotation.item.paragraphId === paragraphId);
      if (paragraphComments.length) {
        paragraph.classList.add('reading-ai-annotated');
        paragraph.dataset.readingNote = paragraphComments.map(annotation => annotation.item.content).join('\n\n');
        paragraph.style.setProperty('--reading-note-count', String(paragraphComments.length));
        paragraph.setAttribute('role', 'button');
        paragraph.setAttribute('tabindex', '0');
        paragraph.setAttribute('aria-label', '查看 AI 对本段的短评');
      }
    });
  }

  function openChapterDrawer() {
    $('readingChapterBackdrop').hidden = false;
    $('readingChapterDrawer').hidden = false;
    $('readingChapterBackdrop').classList.add('is-open');
    $('readingChapterDrawer').classList.add('is-open');
    $('readingChapterDrawer').setAttribute('aria-hidden', 'false');
    $('readingChapterOpen').setAttribute('aria-expanded', 'true');
    $('readingChapterClose').focus();
  }

  function closeChapterDrawer() {
    const drawer = $('readingChapterDrawer');
    const backdrop = $('readingChapterBackdrop');
    drawer.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    $('readingChapterOpen').setAttribute('aria-expanded', 'false');
    setTimeout(() => {
      if (!drawer.classList.contains('is-open')) {
        drawer.hidden = true;
        backdrop.hidden = true;
      }
    }, 240);
    $('readingChapterOpen').focus();
  }

  function updateCurrentChapter() {
    if (!renderedChapters.length) return 0;
    const sections = bookContent.querySelectorAll('.reading-chapter');
    let activeIndex = 0;
    sections.forEach((section, index) => {
      if (section.offsetTop <= bookContent.scrollTop + 8) activeIndex = index;
    });
    $('readingChapterList').querySelectorAll('.reading-chapter-item').forEach((item, index) => {
      item.classList.toggle('is-current', index === activeIndex);
      item.setAttribute('aria-current', index === activeIndex ? 'location' : 'false');
    });
    return activeIndex;
  }

  function renderBook(restoreProgress = true) {
    $('readingBookTitle').textContent = state.book.title || '还没有导入书籍';
    renderedChapters = parseChapters(state.book.content.trim());
    bookContent.replaceChildren();
    if (!state.book.content.trim()) {
      const empty = document.createElement('p');
      empty.className = 'reading-empty';
      empty.textContent = '导入 TXT、Markdown 或 HTML 文本，开始在这里阅读。';
      bookContent.append(empty);
    } else {
      let paragraphNumber = 0;
      renderedChapters.forEach(chapter => {
        const section = document.createElement('section');
        section.className = 'reading-chapter';
        if (chapter.hasHeading) {
          const heading = document.createElement('h2');
          heading.className = 'reading-chapter-heading';
          heading.textContent = chapter.title;
          section.append(heading);
        }
        appendParagraphs(section, chapter.content, () => ++paragraphNumber);
        bookContent.append(section);
      });
      renderParagraphAnnotations();
    }
    updateChapterList();
    const progress = restoreProgress ? Number(state.book.progress ?? state.progress) || 0 : 0;
    bookContent.scrollTop = progress * Math.max(0, bookContent.scrollHeight - bookContent.clientHeight);
    updateProgress();
    $('readingMemoryCount').textContent = String(itemsForCurrentBook(state.memories).length);
  }

  function openPage() {
    savedScrollY = window.scrollY;
    app.hidden = true;
    reader.hidden = false;
    resizeReadingAtmosphere();
    document.querySelector('.shared-reading-toolbar').scrollLeft = 0;
    document.body.classList.add('shared-reading-open');
    syncReadingAtmosphere();
    applyAppearance();
    renderBook();
    $('sharedReadingBack').focus();
  }

  function closePage() {
    if (reader.hidden) return;
    clearTimeout(progressSaveTimer);
    saveState();
    $('readingNotePopover').hidden = true;
    reader.hidden = true;
    app.hidden = false;
    document.body.classList.remove('shared-reading-open');
    syncReadingAtmosphere();
    window.scrollTo(0, savedScrollY);
    $('sharedReadingPlaceholder').focus();
  }

  function showDialog(id) {
    const dialog = $(id);
    if (!dialog.open) dialog.showModal();
  }

  function openImportDialog() {
    $('readingImportBookTitle').value = '';
    $('readingImportText').value = '';
    $('readingImportFile').value = '';
    showDialog('readingImportDialog');
  }

  function importTextFile(file) {
    if (!file) return;
    const readerFile = new FileReader();
    readerFile.onerror = () => {
      console.error('读取书籍文件失败', readerFile.error);
      showMessage(`读取文件失败：${readerFile.error?.message || '无法读取文件'}`);
    };
    readerFile.onload = () => {
      let text;
      try {
        text = decodeTextFile(readerFile.result);
      } catch (error) {
        console.error('解码书籍文件失败', error);
        showMessage(`无法识别文件编码：${error.message}`);
        return;
      }
      const inferredTitle = file.name.replace(/\.[^.]+$/, '');
      if (/\.html?$/i.test(file.name)) {
        const documentFromFile = new DOMParser().parseFromString(text, 'text/html');
        documentFromFile.querySelectorAll('script,style,noscript').forEach(element => element.remove());
        text = documentFromFile.body.textContent || '';
        $('readingImportBookTitle').value = documentFromFile.title.trim() || inferredTitle;
      } else $('readingImportBookTitle').value = inferredTitle;
      $('readingImportText').value = text.replace(/\r\n?/g, '\n').trim();
    };
    readerFile.readAsArrayBuffer(file);
  }

  function decodeTextFile(buffer) {
    if (!(buffer instanceof ArrayBuffer)) throw new TypeError('文件内容不是有效的二进制数据。');
    const bytes = new Uint8Array(buffer);
    const hasPrefix = (...prefix) => prefix.every((byte, index) => bytes[index] === byte);
    if (hasPrefix(0xef, 0xbb, 0xbf)) return new TextDecoder('utf-8').decode(bytes.subarray(3));
    if (hasPrefix(0xff, 0xfe)) return new TextDecoder('utf-16le').decode(bytes.subarray(2));
    if (hasPrefix(0xfe, 0xff)) return new TextDecoder('utf-16be').decode(bytes.subarray(2));
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch (utf8Error) {
      try {
        return new TextDecoder('gb18030').decode(bytes);
      } catch (encodingError) {
        throw new Error(`UTF-8 和 GB18030 解码均失败：${encodingError.message}`, { cause: utf8Error });
      }
    }
  }

  function saveImportedBook() {
    const content = $('readingImportText').value.trim();
    if (!content) {
      showMessage('请先选择文件或粘贴书籍文本。');
      return;
    }
    const books = state.books.filter(book => book.id !== state.book.id);
    if (state.book.content && state.book.id) {
      books.push({ ...state.book, progress: state.progress });
    }
    const updated = {
      ...state,
      books,
      book: {
        id: makeId(),
        title: $('readingImportBookTitle').value.trim() || '未命名书籍',
        content,
        sourceName: $('readingImportFile').files[0]?.name || '',
        aiReadThrough: 0,
        lastReadingStartChapter: null,
        progress: 0
      },
      progress: 0
    };
    if (!saveState(updated)) return;
    bookContent.scrollTop = 0;
    renderBook(false);
    $('readingImportDialog').close();
    renderShelf();
    showMessage('书籍已导入。');
  }

  function getShelfBooks() {
    const books = [...state.books];
    if (state.book.content && state.book.id) books.unshift({ ...state.book, progress: state.progress, active: true });
    return books;
  }

  function renderShelf() {
    const list = $('readingShelfList');
    const books = getShelfBooks();
    list.replaceChildren();
    $('readingShelfCount').textContent = `${books.length} 本书`;
    if (!books.length) {
      const empty = document.createElement('p');
      empty.className = 'reading-shelf-empty';
      empty.textContent = '书架还是空的，导入一本书开始阅读吧。';
      list.append(empty);
      return;
    }
    books.forEach(book => {
      const item = document.createElement('article');
      item.className = `reading-shelf-item${book.active ? ' is-active' : ''}`;
      const select = document.createElement('button');
      select.type = 'button';
      select.className = 'reading-shelf-select';
      select.disabled = Boolean(book.active);
      const title = document.createElement('strong');
      title.textContent = book.title || '未命名书籍';
      const source = document.createElement('small');
      source.textContent = book.sourceName || `${Math.max(1, book.content.length).toLocaleString('zh-CN')} 字`;
      select.append(title, source);
      if (book.active) {
        const active = document.createElement('span');
        active.className = 'reading-shelf-active';
        active.textContent = '正在阅读';
        select.append(active);
      } else {
        select.addEventListener('click', () => selectShelfBook(book.id));
      }
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'reading-shelf-delete';
      remove.textContent = '删除';
      remove.setAttribute('aria-label', `从书架删除${book.title || '未命名书籍'}`);
      remove.addEventListener('click', () => deleteShelfBook(book.id));
      item.append(select, remove);
      list.append(item);
    });
  }

  function openShelf() {
    shelfReturnFocus = document.activeElement;
    renderShelf();
    $('readingShelfBackdrop').hidden = false;
    $('readingShelfDrawer').hidden = false;
    $('readingShelfBackdrop').classList.add('is-open');
    $('readingShelfDrawer').classList.add('is-open');
    $('readingShelfDrawer').setAttribute('aria-hidden', 'false');
    $('readingShelfClose').focus();
  }

  function closeShelf() {
    const drawer = $('readingShelfDrawer');
    const backdrop = $('readingShelfBackdrop');
    drawer.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      if (!drawer.classList.contains('is-open')) {
        drawer.hidden = true;
        backdrop.hidden = true;
      }
    }, 240);
    (shelfReturnFocus?.isConnected ? shelfReturnFocus : $('sharedReadingBack')).focus();
  }

  function selectShelfBook(bookId) {
    const selected = state.books.find(book => book.id === bookId);
    if (!selected) {
      showMessage('找不到这本书，书架已更新。');
      renderShelf();
      return;
    }
    const books = state.books.filter(book => book.id !== bookId);
    if (state.book.content && state.book.id) books.push({ ...state.book, progress: state.progress });
    const updated = {
      ...state,
      books,
      book: { ...selected },
      progress: Number(selected.progress) || 0
    };
    if (!saveState(updated)) return;
    bookContent.scrollTop = 0;
    renderBook();
    renderShelf();
    closeShelf();
  }

  function deleteShelfBook(bookId) {
    const isActive = state.book.id === bookId;
    const selectedArchive = state.books.find(book => book.id === bookId);
    if (!isActive && !selectedArchive) {
      showMessage('找不到这本书，书架已更新。');
      renderShelf();
      return;
    }
    if (!window.confirm(`确定从书架删除《${isActive ? state.book.title : selectedArchive.title}》吗？`)) return;
    const updatedBooks = state.books.filter(book => book.id !== bookId);
    let updated = {
      ...state,
      books: updatedBooks,
      thoughts: state.thoughts.filter(item => !item || item.bookId !== bookId),
      discussions: state.discussions.filter(item => !item || item.bookId !== bookId),
      memories: state.memories.filter(item => !item || item.bookId !== bookId),
      highlights: state.highlights.filter(item => !item || item.bookId !== bookId)
    };
    if (isActive) {
      const nextBook = updatedBooks.shift();
      updated = {
        ...updated,
        books: updatedBooks,
        book: nextBook ? { ...nextBook } : { id: '', title: '', content: '', sourceName: '', progress: 0 },
        progress: nextBook ? Number(nextBook.progress) || 0 : 0
      };
    }
    if (!saveState(updated)) return;
    renderBook();
    renderShelf();
    showMessage('书籍已从书架删除。');
  }

  function readTextOffset(root, container, offset) {
    const range = document.createRange();
    range.selectNodeContents(root);
    range.setEnd(container, offset);
    return range.toString().length;
  }

  function captureSelection() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return null;
    const range = selection.getRangeAt(0).cloneRange();
    const startNode = range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer : range.startContainer.parentElement;
    const endNode = range.endContainer.nodeType === Node.ELEMENT_NODE ? range.endContainer : range.endContainer.parentElement;
    const startParagraph = startNode?.closest('[data-reading-paragraph]');
    const endParagraph = endNode?.closest('[data-reading-paragraph]');
    const text = range.toString().trim();
    if (!text) return null;
    return {
      range,
      text,
      paragraphId: startParagraph && startParagraph === endParagraph ? startParagraph.dataset.readingParagraph : '',
      start: startParagraph && startParagraph === endParagraph ? readTextOffset(startParagraph, range.startContainer, range.startOffset) : -1,
      end: startParagraph && startParagraph === endParagraph ? readTextOffset(startParagraph, range.endContainer, range.endOffset) : -1
    };
  }

  function addSelectionHighlight(selection) {
    if (!selection?.paragraphId || selection.start < 0 || selection.end <= selection.start) {
      showMessage('划线请选择同一段落内的文字。');
      return;
    }
    if (state.highlights.some(item => item.bookId === state.book.id && item.paragraphId === selection.paragraphId
      && item.start === selection.start && item.end === selection.end)) {
      showMessage('这段文字已经划过线了。');
      return;
    }
    const item = {
      id: makeId(),
      bookId: state.book.id,
      paragraphId: selection.paragraphId,
      start: selection.start,
      end: selection.end,
      content: selection.text,
      chapterTitle: renderedChapters[chapterIndexForParagraph(selection.paragraphId)]?.title || ''
    };
    if (!saveState({ ...state, highlights: [...state.highlights, item] })) return;
    renderBook();
    showMessage('已划线，点击这段划线文案可选择讨论或取消划线。');
  }

  function chapterIndexForParagraph(paragraphId) {
    const paragraph = bookContent.querySelector(`[data-reading-paragraph="${CSS.escape(paragraphId)}"]`);
    const section = paragraph?.closest('.reading-chapter');
    return section ? [...bookContent.querySelectorAll('.reading-chapter')].indexOf(section) : -1;
  }

  function addFavorite(selection) {
    if (!selection?.text) {
      showMessage('请先选中想收藏的文字。');
      return;
    }
    const item = {
      id: makeId(),
      kind: 'favorite',
      bookId: state.book.id,
      paragraphId: selection.paragraphId || '',
      content: selection.text,
      chapterTitle: renderedChapters[chapterIndexForParagraph(selection.paragraphId)]?.title || '',
      createdAt: new Date().toISOString()
    };
    if (!saveState({ ...state, thoughts: [item, ...state.thoughts] })) return;
    window.getSelection()?.removeAllRanges();
    showMessage('已收藏到感想。');
  }

  function addDiscussion(highlightId) {
    const highlight = state.highlights.find(item => item.id === highlightId && item.bookId === state.book.id);
    if (!highlight) {
      showMessage('找不到这条划线，请重新选择。');
      return;
    }
    const discussion = {
      id: makeId(),
      bookId: state.book.id,
      paragraphId: highlight.paragraphId,
      start: highlight.start,
      end: highlight.end,
      sourceHighlightId: highlight.id,
      content: highlight.content,
      chapterTitle: highlight.chapterTitle || '',
      createdAt: new Date().toISOString()
    };
    const alreadyAdded = state.discussions.some(item => item.bookId === discussion.bookId && item.sourceHighlightId === highlight.id);
    if (!alreadyAdded && !saveState({ ...state, discussions: [discussion, ...state.discussions] })) return;
    openDiscussionPage();
  }

  function renderSavedItems(containerId, items, emptyText, jumpable = true) {
    const list = $(containerId);
    list.replaceChildren();
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'book-list-empty';
      empty.textContent = emptyText;
      list.append(empty);
      return;
    }
    items.forEach(item => {
      const article = document.createElement('article');
      article.className = 'book-saved-item';
      const text = document.createElement('p');
      text.textContent = item.content || '';
      const meta = document.createElement('small');
      meta.textContent = [item.chapterTitle, item.kind === 'ai-comment' ? 'AI 段评' : item.kind === 'favorite' ? '用户收藏' : '用户想要讨论的段落'].filter(Boolean).join(' · ');
      article.append(text, meta);
      if (item.kind === 'favorite') {
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'book-entry-delete';
        remove.dataset.readingDeleteFavorite = item.id;
        remove.textContent = '取消收藏';
        article.append(remove);
      }
      if (jumpable && item.paragraphId) {
        const jump = document.createElement('button');
        jump.type = 'button';
        jump.className = 'book-entry-open';
        jump.textContent = '跳转';
        jump.addEventListener('click', () => jumpToParagraph(item.paragraphId));
        article.append(jump);
      }
      list.append(article);
    });
  }

  function renderThoughtList() {
    const items = itemsForCurrentBook(state.thoughts).filter(item => {
      if (item.kind !== 'ai-comment') return true;
      const paragraph = bookContent.querySelector(`[data-reading-paragraph="${CSS.escape(item.paragraphId || '')}"]`);
      return typeof item.paragraphText === 'string' && paragraph
        && item.paragraphText === paragraph.textContent.trim();
    });
    renderSavedItems('readingThoughtList', items, '还没有感想或收藏。');
  }

  function renderDiscussionQuotes() {
    const quotes = itemsForCurrentBook(state.discussions);
    const container = $('readingDiscussionQuotes');
    container.replaceChildren();
    $('readingDiscussionQuoteCount').textContent = `${quotes.length} 段`;
    if (!quotes.length) {
      const empty = document.createElement('p');
      empty.className = 'book-list-empty';
      empty.textContent = '还没有划线引用。阅读时划线后点击“讨论”，就能带着原文一起聊天。';
      container.append(empty);
      return;
    }
    quotes.forEach(item => {
      const quote = document.createElement('blockquote');
      quote.textContent = item.content;
      const meta = document.createElement('small');
      meta.textContent = [item.chapterTitle, item.paragraphId].filter(Boolean).join(' · ');
      const card = document.createElement('article');
      card.className = 'reading-discussion-quote';
      card.append(quote, meta);
      container.append(card);
    });
  }

  function appendDiscussionMessage(container, message) {
    const article = document.createElement('article');
    const bubbleRole = message.role === 'user' ? 'user' : 'ai';
    article.className = `message message-bubble ${bubbleRole} reading-discussion-message${message.role === 'user' ? ' is-user' : ''}${message.role === 'error' ? ' is-error' : ''}${message.role === 'user' && !message.requestedAt ? ' is-pending' : ''}`;
    if (message.role === 'error') article.setAttribute('role', 'alert');
    const body = document.createElement('div');
    body.className = 'message-content content reading-discussion-message-body';
    const text = String(message.content || '');
    const stickerPattern = /\[贴图:(https?:\/\/[^\]\s]+)\]/g;
    let cursor = 0;
    for (const match of text.matchAll(stickerPattern)) {
      body.append(document.createTextNode(text.slice(cursor, match.index)));
      const image = document.createElement('img');
      image.className = 'chat-sticker-image';
      image.src = match[1];
      image.alt = '表情包';
      image.loading = 'lazy';
      body.append(image);
      cursor = match.index + match[0].length;
    }
    body.append(document.createTextNode(text.slice(cursor)));
    article.append(body);
    const meta = document.createElement('div');
    meta.className = 'message-meta';
    const time = document.createElement('span');
    time.className = 'message-time';
    const timestamp = Date.parse(message.createdAt);
    time.textContent = Number.isFinite(timestamp)
      ? new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      : message.role === 'user' ? '我' : message.role === 'error' ? '请求未完成' : 'AI';
    meta.append(time);
    article.append(meta);
    container.append(article);
  }

  function renderDiscussionMessages() {
    const container = $('readingDiscussionMessages');
    container.replaceChildren();
    const messages = state.discussionMessages.filter(item => item.bookId === state.book.id);
    if (!messages.length) {
      const empty = document.createElement('p');
      empty.className = 'reading-discussion-empty';
      empty.textContent = '划线句子和阅读上下文已经准备好，发条消息开始讨论吧。';
      container.append(empty);
    } else {
      messages.forEach(message => appendDiscussionMessage(container, message));
    }
    $('readingDiscussionRequest').disabled = discussionRequestInProgress || !messages.some(item => item.role === 'user' && !item.requestedAt);
    container.scrollTop = container.scrollHeight;
  }

  function openDiscussionPage() {
    renderDiscussionQuotes();
    renderDiscussionMessages();
    showDialog('readingDiscussionDialog');
    $('readingDiscussionInput').focus();
  }

  function renderMemoryList() {
    const items = itemsForCurrentBook(state.memories);
    const list = $('readingMemoryList');
    list.replaceChildren();
    $('readingMemorySelectAll').checked = false;
    $('readingMemorySelectAll').indeterminate = false;
    $('readingMemorySummarize').disabled = true;
    $('readingMemoryArchive').disabled = true;
    $('readingMemoryDelete').disabled = true;
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'book-list-empty';
      empty.textContent = 'AI 总结过的章节或讨论中新增的阅读记忆会保存在这里。';
      list.append(empty);
      return;
    }
    items.forEach(item => {
      const article = document.createElement('article');
      article.className = 'book-saved-item reading-memory-item';
      article.classList.toggle('is-archived', Boolean(item.archivedAt));
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'reading-memory-select';
      checkbox.value = item.id;
      const type = item.kind === 'discussion-memory' || item.kind === 'memory' ? '记忆' : '总结';
      checkbox.setAttribute('aria-label', `选择${type}：${item.chapterTitle || '阅读记忆'}`);
      article.append(checkbox);
      if (type === '总结') {
        const details = document.createElement('details');
        details.className = 'reading-memory-summary';
        const heading = document.createElement('summary');
        heading.textContent = [item.bookTitle || state.book.title || '未命名书籍', type, item.chapterTitle].filter(Boolean).join(' · ');
        const text = document.createElement('p');
        text.textContent = item.content || '';
        details.append(heading, text);
        article.append(details);
      } else {
        const heading = document.createElement('strong');
        heading.className = 'reading-memory-kind';
        heading.textContent = [type, item.chapterTitle].filter(Boolean).join(' · ');
        const text = document.createElement('p');
        text.textContent = item.content || '';
        article.append(heading, text);
      }
      if (item.archivedAt) {
        const archived = document.createElement('small');
        archived.className = 'reading-memory-archived';
        archived.textContent = '已存档';
        article.append(archived);
      }
      if (item.paragraphId) {
        const jump = document.createElement('button');
        jump.type = 'button';
        jump.className = 'book-entry-open';
        jump.textContent = '跳转';
        jump.addEventListener('click', () => jumpToParagraph(item.paragraphId));
        article.append(jump);
      }
      list.append(article);
    });
  }

  function updateMemorySelection() {
    const checkboxes = [...$('readingMemoryList').querySelectorAll('.reading-memory-select')];
    const selectedIds = new Set(checkboxes.filter(input => input.checked).map(input => input.value));
    const selected = selectedIds.size;
    const selectedItems = itemsForCurrentBook(state.memories).filter(item => selectedIds.has(item.id));
    $('readingMemorySummarize').disabled = selected === 0;
    $('readingMemoryArchive').disabled = !selectedItems.some(item => !item.archivedAt);
    $('readingMemoryDelete').disabled = selected === 0;
    $('readingMemorySelectAll').checked = checkboxes.length > 0 && selected === checkboxes.length;
    $('readingMemorySelectAll').indeterminate = selected > 0 && selected < checkboxes.length;
  }

  async function summarizeSelectedReadingMemories() {
    const selectedIds = new Set([...$('readingMemoryList').querySelectorAll('.reading-memory-select:checked')].map(input => input.value));
    const selected = itemsForCurrentBook(state.memories).filter(item => selectedIds.has(item.id));
    if (!selected.length) return;
    const summarize = window.petalRequestReadingMemorySummary;
    if (typeof summarize !== 'function') {
      showMessage('总结 AI 尚未就绪，请刷新页面后重试。');
      return;
    }
    const button = $('readingMemorySummarize');
    button.disabled = true;
    button.textContent = '正在总结…';
    try {
      const content = await summarize({
        userContent: `书名：${state.book.title || '未命名书籍'}\n\n${selected.map(item => `【${item.chapterTitle || '阅读记忆'}】\n${item.content}`).join('\n\n')}`
      });
      if (typeof content !== 'string' || !content.trim()) throw new Error('总结 AI 没有返回内容。');
      const currentSelected = itemsForCurrentBook(state.memories).filter(item => selectedIds.has(item.id));
      if (currentSelected.length !== selected.length) throw new Error('总结期间所选阅读记忆已变化，请重新选择后再试。');
      const chapterStarts = selected.map(item => Number(item.chapterStart) || 0).filter(value => value > 0);
      const summary = {
        id: makeId(),
        bookId: state.book.id,
        bookTitle: state.book.title || '未命名书籍',
        kind: 'summary',
        source: '阅读记忆二次总结',
        summarizedMemoryIds: [...selectedIds],
        chapterStart: chapterStarts.length ? Math.min(...chapterStarts) : 0,
        chapterEnd: Math.max(...selected.map(item => Number(item.chapterEnd) || 0)),
        chapterTitle: selected.map(item => item.chapterTitle).filter(Boolean).join('、') || '阅读记忆总结',
        paragraphId: selected.find(item => item.paragraphId)?.paragraphId || '',
        content: content.trim(),
        createdAt: new Date().toISOString()
      };
      const remaining = state.memories.filter(item => !selectedIds.has(item.id));
      if (!saveState({ ...state, memories: [summary, ...remaining] })) return;
      renderMemoryList();
      $('readingMemoryCount').textContent = String(itemsForCurrentBook(state.memories).length);
      showMessage('已将选中的阅读记忆总结并替换为一条摘要。');
    } catch (error) {
      console.error('总结阅读记忆失败', error);
      showMessage(`阅读记忆总结失败：${error.message}`);
    } finally {
      button.textContent = '总结选中';
      updateMemorySelection();
    }
  }

  function selectedReadingMemoryIds() {
      return new Set([...$('readingMemoryList').querySelectorAll('.reading-memory-select:checked')].map(input => input.value));
  }

  function deleteSelectedReadingMemories() {
      const selectedIds = selectedReadingMemoryIds();
      if (!selectedIds.size) return;
      if (!window.confirm(`删除选中的 ${selectedIds.size} 条阅读记忆？此操作无法撤销。`)) return;
      const memories = state.memories.filter(item => !selectedIds.has(item.id));
      if (!saveState({ ...state, memories })) return;
      renderMemoryList();
      $('readingMemoryCount').textContent = String(itemsForCurrentBook(state.memories).length);
  }

  async function archiveSelectedReadingMemories() {
      const selectedIds = selectedReadingMemoryIds();
      const selected = itemsForCurrentBook(state.memories).filter(item => selectedIds.has(item.id) && !item.archivedAt);
      if (!selected.length) return;
      const archive = window.petalArchiveReadingMemory;
      if (typeof archive !== 'function') {
        showMessage('存档功能尚未就绪，请刷新页面后重试。');
        return;
      }
      const button = $('readingMemoryArchive');
      button.disabled = true;
      button.textContent = '正在存档…';
      const archivedIds = new Set();
      try {
        for (const item of selected) {
          await archive({
            content: item.content,
            bookTitle: state.book.title,
            chapterTitle: item.chapterTitle,
            createdAt: item.createdAt,
            memoryId: item.id
          });
          archivedIds.add(item.id);
        }
        const archivedAt = new Date().toISOString();
        const memories = state.memories.map(item => archivedIds.has(item.id) ? { ...item, archivedAt } : item);
        if (!saveState({ ...state, memories })) {
          throw new Error('已写入角色存档，但阅读记忆的存档状态未能更新。');
        }
        renderMemoryList();
        showMessage(`已存档 ${selected.length} 条阅读记忆到当前角色的存档记忆。`);
      } catch (error) {
        console.error('存档阅读记忆失败', error);
        showMessage(`阅读记忆存档失败：${error.message}`);
        renderMemoryList();
      } finally {
        button.textContent = '存档';
        updateMemorySelection();
      }
  }

  function buildDiscussionContext() {
    const quotes = itemsForCurrentBook(state.discussions);
    const memories = itemsForCurrentBook(state.memories);
    const paragraphs = renderedChapters.flatMap((chapter, chapterIndex) => getChapterParagraphs(chapterIndex)
      .map((paragraph, paragraphIndex) => ({ ...paragraph, chapterTitle: chapter.title, chapterIndex, paragraphIndex })));
    const paragraphIndexes = new Map(paragraphs.map((paragraph, index) => [paragraph.id, index]));
    const orderedQuotes = quotes
      .map(item => ({ item, index: paragraphIndexes.get(item.paragraphId) }))
      .filter(entry => Number.isInteger(entry.index))
      .sort((left, right) => left.index - right.index);
    const finalQuote = orderedQuotes.at(-1);
    const thoughts = itemsForCurrentBook(state.thoughts)
      .filter(item => item.kind === 'ai-comment')
      .map(item => ({ item, index: paragraphIndexes.get(item.paragraphId) }))
      .filter(entry => Number.isInteger(entry.index));
    const summaries = memories.filter(item => item.kind === 'summary');
    const otherMemories = memories.filter(item => item.kind !== 'summary');
    const novelText = [];
    let startChapter = -1;
    if (finalQuote) {
      const lastParagraph = paragraphs[finalQuote.index];
      const storedStart = state.book.lastReadingStartChapter;
      const aiReadThrough = Number(state.book.aiReadThrough) || 0;
      const fallbackStart = aiReadThrough > 0
        ? Math.max(0, Number(state.book.aiReadThrough) - 1)
        : lastParagraph.chapterIndex;
      startChapter = Math.min(lastParagraph.chapterIndex, Math.max(0,
        Number.isInteger(storedStart) && storedStart >= 0 ? storedStart : fallbackStart));
      const startIndex = paragraphs.findIndex(paragraph => paragraph.chapterIndex >= startChapter);
      let previousChapter = -1;
      paragraphs.slice(startIndex, finalQuote.index + 1).forEach(paragraph => {
        if (paragraph.chapterIndex !== previousChapter) {
          novelText.push(`【${paragraph.chapterTitle}】`);
          previousChapter = paragraph.chapterIndex;
        }
        novelText.push(`[段落 ${paragraph.id}] ${paragraph.text}`);
      });
    }
    const relevantThoughts = finalQuote && startChapter >= 0
      ? thoughts.filter(({ index }) => {
        const paragraph = paragraphs[index];
        return paragraph.chapterIndex >= startChapter && index <= finalQuote.index;
      })
      : [];
    return [
      `书名：${state.book.title || '未命名书籍'}`,
      summaries.length ? `【小说章节摘要】\n${summaries.map(item => `【${item.bookTitle || state.book.title || '未命名书籍'} · ${item.chapterTitle || '阅读记忆'}】\n${item.content}`).join('\n\n')}` : '',
      otherMemories.length ? `【本书阅读记忆】\n${otherMemories.map(item => `【${item.chapterTitle || '阅读记忆'}】\n${item.content}`).join('\n\n')}` : '',
      orderedQuotes.length ? `【本次讨论的划线段落】\n${orderedQuotes.map(({ item }) => `【${item.chapterTitle || '未命名章节'} · ${item.paragraphId || '段落'}】\n${item.content}`).join('\n\n')}` : '【本次讨论的划线段落】\n用户没有添加划线引用，请根据用户消息讨论小说。',
      relevantThoughts.length ? `【AI 之前写下的段落短评】\n${relevantThoughts.map(({ item }) => `【${item.chapterTitle || '未命名章节'} · ${item.paragraphId}】\n${item.content}`).join('\n\n')}` : '',
      novelText.length ? `【从上次发送给 AI 的起始章节至最后一条划线段落的小说正文】\n${novelText.join('\n\n')}` : ''
    ].filter(Boolean).join('\n\n');
  }

  async function sendDiscussionMessage(event) {
    event.preventDefault();
    if (companionRequestInProgress || discussionRequestInProgress) return;
    const input = $('readingDiscussionInput');
    const userMessage = input.value.trim();
    if (!userMessage) return;
    const userEntry = { id: makeId(), bookId: state.book.id, role: 'user', content: userMessage, requestedAt: false, createdAt: new Date().toISOString() };
    if (!saveState({ ...state, discussionMessages: [...state.discussionMessages, userEntry] })) {
      return;
    }
    input.value = '';
    renderDiscussionMessages();
    input.focus();
  }

  async function requestDiscussionReply() {
    if (companionRequestInProgress || discussionRequestInProgress) return;
    const request = window.petalRequestBookDiscussion;
    if (typeof request !== 'function') {
      showMessage('讨论 AI 尚未就绪，请刷新页面后重试。');
      return;
    }
    const messages = state.discussionMessages.filter(item => item.bookId === state.book.id);
    const pending = messages.filter(item => item.role === 'user' && !item.requestedAt);
    if (!pending.length) return;
    const pendingIds = new Set(pending.map(item => item.id));
    const firstPendingIndex = messages.findIndex(item => pendingIds.has(item.id));
    const history = messages.slice(0, firstPendingIndex).filter(item => ['user', 'assistant'].includes(item.role));
    const userMessage = pending.map(item => item.content).join('\n\n');
    discussionRequestInProgress = true;
    const requestButton = $('readingDiscussionRequest');
    const sendButton = $('readingDiscussionSend');
    requestButton.disabled = true;
    requestButton.setAttribute('aria-busy', 'true');
    sendButton.disabled = true;
    renderDiscussionMessages();
    try {
      const result = await request({
        context: buildDiscussionContext(),
        conversation: (state.discussionHistoryLimit ? history.slice(-state.discussionHistoryLimit) : [])
          .map(item => ({ role: item.role, content: item.content })),
        dailyChatHistory: window.petalGetRecentChatHistory(),
        userMessage
      });
      if (!result || !Array.isArray(result.messages)) throw new Error('讨论 AI 返回格式无效。');
      const createdAt = new Date().toISOString();
      const newMessages = result.messages.filter(message => typeof message === 'string' && message.trim())
        .map(content => ({ id: makeId(), bookId: state.book.id, role: 'assistant', content, createdAt }));
      const newMemories = Array.isArray(result.readingMemories) ? result.readingMemories
        .filter(content => typeof content === 'string' && content.trim())
        .map(content => ({
          id: makeId(),
          bookId: state.book.id,
          kind: 'memory',
          chapterTitle: itemsForCurrentBook(state.discussions)[0]?.chapterTitle || '段落讨论',
          paragraphId: itemsForCurrentBook(state.discussions)[0]?.paragraphId || '',
          content: content.trim(),
          createdAt
        })) : [];
      const requestedAt = new Date().toISOString();
      const discussionMessages = state.discussionMessages.map(item => pendingIds.has(item.id) ? { ...item, requestedAt } : item);
      if (!saveState({
        ...state,
        discussionMessages: [...discussionMessages, ...newMessages],
        memories: [...newMemories, ...state.memories]
      })) throw new Error('AI 回复已收到，但保存讨论或阅读记忆失败。');
      if (newMemories.length) {
        $('readingMemoryCount').textContent = String(itemsForCurrentBook(state.memories).length);
        if ($('readingMemoryDialog').open) renderMemoryList();
      }
      renderDiscussionMessages();
    } catch (error) {
      console.error('小说段落讨论请求失败', error);
      showMessage(`讨论请求失败：${error.message}`);
    } finally {
      discussionRequestInProgress = false;
      requestButton.removeAttribute('aria-busy');
      sendButton.disabled = false;
      renderDiscussionMessages();
    }
  }

  function jumpToParagraph(paragraphId) {
    const paragraph = bookContent.querySelector(`[data-reading-paragraph="${CSS.escape(paragraphId)}"]`);
    if (!paragraph) {
      showMessage('这段内容暂时无法定位。');
      return;
    }
    document.querySelectorAll('.book-dialog[open]').forEach(dialog => dialog.close());
    paragraph.scrollIntoView({ behavior: 'smooth', block: 'center' });
    paragraph.classList.add('reading-jump-highlight');
    setTimeout(() => paragraph.classList.remove('reading-jump-highlight'), 1400);
  }

  function showReadingNote(paragraph, event) {
    const popover = $('readingNotePopover');
    $('readingNoteText').textContent = paragraph.dataset.readingNote || '';
    popover.hidden = false;
    const paragraphBounds = paragraph.getBoundingClientRect();
    const anchorX = Number.isFinite(event?.clientX) && event.clientX ? event.clientX : paragraphBounds.left + paragraphBounds.width / 2;
    const anchorY = Number.isFinite(event?.clientY) && event.clientY ? event.clientY : paragraphBounds.top + paragraphBounds.height / 2;
    const margin = 12;
    const gap = 14;
    const bounds = popover.getBoundingClientRect();
    const left = Math.max(margin, Math.min(anchorX + gap, window.innerWidth - bounds.width - margin));
    const below = anchorY + gap + bounds.height <= window.innerHeight - margin;
    const top = below
      ? anchorY + gap
      : Math.max(margin, anchorY - bounds.height - gap);
    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
  }

  function estimateReadingTokens(value) {
    const characters = Array.from(String(value || ''));
    const estimate = characters.reduce((total, character) => total + (/\p{Script=Han}/u.test(character) ? 1.3 : 1 / 3.2), 0);
    return Math.max(0, Number(estimate.toFixed(1)));
  }

  function buildReadingRequestContent(startIndex, endIndex, chapterBodies, selectedText) {
    const summaries = itemsForCurrentBook(state.memories).map(item => item.content).filter(Boolean);
    const discussions = itemsForCurrentBook(state.discussions).map(item => `章节：${item.chapterTitle || '未命名章节'}\n段落：${item.content}`).filter(Boolean);
    const novelBody = chapterBodies.map((body, index) => `【${renderedChapters[startIndex + index].title}】\n${body}`).join('\n\n');
    const coverage = renderedChapters.slice(startIndex, endIndex).map((chapter, index) => {
      const paragraphIds = getChapterParagraphs(startIndex + index).map(paragraph => paragraph.id).join('、');
      return `章节「${chapter.title}」段落编号：${paragraphIds || '无'}`;
    }).join('\n');
    return [
      summaries.length ? `【之前章节总结】\n${summaries.join('\n\n')}` : '',
      discussions.length ? `【用户想要讨论的段落】\n${discussions.join('\n\n')}` : '',
      selectedText ? `【用户当前选中的段落】\n${selectedText}` : '',
      `【本次章节段落编号索引】\n${coverage}`,
      `【本次小说正文；章节范围 ${startIndex + 1}-${endIndex}】\n${novelBody}`
    ].filter(Boolean).join('\n\n');
  }

  function getChapterParagraphs(chapterIndex) {
    const section = bookContent.querySelectorAll('.reading-chapter')[chapterIndex];
    if (!section) return [];
    return [...section.querySelectorAll('[data-reading-paragraph]')].map(paragraph => ({
      id: paragraph.dataset.readingParagraph,
      text: paragraph.textContent.trim()
    })).filter(item => item.text);
  }

  function parseAiNotes(answer) {
    const notes = [];
    const add = (reference, content) => {
      const ids = reference.match(/^p(\d+)(?:\s*[-–—~～]\s*(?:p)?(\d+))?$/i);
      if (!ids || !content.trim()) return;
      const first = Number(ids[1]);
      const last = Number(ids[2] || ids[1]);
      if (!Number.isSafeInteger(first) || !Number.isSafeInteger(last) || last < first || last - first > 20) return;
      notes.push({
        paragraphId: `p${first}`,
        paragraphIds: Array.from({ length: last - first + 1 }, (_, index) => `p${first + index}`),
        content: content.trim()
      });
    };
    const text = String(answer || '');
    const tagPattern = /<段评\s+(?:p|id)=["'](p\d+(?:\s*[-–—~～]\s*(?:p)?\d+)?)["']\s*>([\s\S]*?)<\/段评>/gi;
    for (const match of text.matchAll(tagPattern)) add(match[1], match[2]);
    const pairPattern = /\{\s*["“']?(p\d+(?:\s*[-–—~～]\s*(?:p)?\d+)?)["”']?\s*,\s*["“']([\s\S]*?)["”']\s*["”]?\s*\}/gi;
    for (const match of text.matchAll(pairPattern)) add(match[1], match[2]);
    return notes;
  }

  function openCompanionConfirm(selectedText) {
    if (!state.book.content || !renderedChapters.length) {
      showMessage('请先导入一本书。');
      return;
    }
    const startIndex = Math.max(0, Number(state.book.aiReadThrough) || 0);
    if (startIndex >= renderedChapters.length) {
      showMessage('AI 已读到本书末尾。');
      return;
    }
    pendingCompanionRequest = { startIndex, selectedText };
    const startSelect = $('readingCompanionStartChapter');
    startSelect.replaceChildren();
    renderedChapters.forEach((chapter, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = `第 ${index + 1} 章：${chapter.title}`;
      startSelect.append(option);
    });
    startSelect.value = String(startIndex);
    populateCompanionEndChapters(startIndex);
    $('readingCompanionConfirmHint').textContent = `默认从 AI 尚未阅读的第 ${startIndex + 1} 章开始；可修改起止章节。`;
    showDialog('readingCompanionConfirmDialog');
  }

  function companionTokenBudget() {
    return Math.min(200000, Math.max(256, Number(state.readingTokenLimit) || 50000));
  }

  function estimateChapterRangeTokens(startIndex, endIndex) {
    return renderedChapters.slice(startIndex, endIndex + 1).reduce((total, chapter) => (
      total + estimateReadingTokens(`${chapter.title}\n${chapter.content}`)
    ), 0);
  }

  function populateCompanionEndChapters(startIndex) {
    const endSelect = $('readingCompanionEndChapter');
    endSelect.replaceChildren();
    renderedChapters.slice(startIndex).forEach((chapter, offset) => {
      const index = startIndex + offset;
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = `第 ${index + 1} 章：${chapter.title}`;
      endSelect.append(option);
    });
    const budget = companionTokenBudget();
    let defaultEndIndex = startIndex;
    let tokens = 0;
    for (let index = startIndex; index < renderedChapters.length; index += 1) {
      tokens += estimateReadingTokens(`${renderedChapters[index].title}\n${renderedChapters[index].content}`);
      if (tokens > budget) break;
      defaultEndIndex = index;
    }
    endSelect.value = String(defaultEndIndex);
    updateCompanionRangeEstimate();
  }

  function updateCompanionRangeEstimate() {
    const startIndex = Number($('readingCompanionStartChapter').value);
    const endIndex = Number($('readingCompanionEndChapter').value);
    const estimate = $('readingCompanionEstimate');
    const confirmButton = $('readingCompanionConfirm');
    if (!Number.isInteger(startIndex) || !Number.isInteger(endIndex) || endIndex < startIndex) {
      estimate.textContent = '请选择有效的章节范围。';
      estimate.classList.add('is-over-limit');
      confirmButton.disabled = true;
      return;
    }
    const tokens = estimateChapterRangeTokens(startIndex, endIndex);
    const budget = companionTokenBudget();
    const overLimit = tokens > budget;
    estimate.textContent = `第 ${startIndex + 1} 章至第 ${endIndex + 1} 章，共 ${endIndex - startIndex + 1} 章；段评正文约 ${tokens.toLocaleString('zh-CN')} token（中文字符按约 1.3 token 估算，不含指令、其他上下文及并行发送的章节总结请求）。${overLimit ? `超过正文上限 ${budget.toLocaleString('zh-CN')} token，请缩小范围或提高上限。` : `正文上限 ${budget.toLocaleString('zh-CN')} token。`}`;
    estimate.classList.toggle('is-over-limit', overLimit);
    confirmButton.disabled = overLimit;
  }

  async function sendCompanionRequest() {
    if (!pendingCompanionRequest) return;
    const { selectedText } = pendingCompanionRequest;
    const startIndex = Number($('readingCompanionStartChapter').value);
    const endIndex = Number($('readingCompanionEndChapter').value) + 1;
    if (!Number.isInteger(startIndex) || !Number.isInteger(endIndex) || startIndex < 0 || endIndex <= startIndex || endIndex > renderedChapters.length) {
      showMessage('章节范围无效，请重新选择。');
      return;
    }
    $('readingCompanionConfirmDialog').close();
    try {
      await requestCompanion(startIndex, endIndex, selectedText);
    } finally {
      pendingCompanionRequest = null;
    }
  }

  async function requestCompanion(startIndex, endIndex, selectedText = '') {
    if (companionRequestInProgress) return;
    if (!state.book.content || !renderedChapters.length) {
      showMessage('请先导入一本书。');
      return;
    }
    const budget = companionTokenBudget();
    const chapters = renderedChapters.slice(startIndex, endIndex);
    const tokens = chapters.reduce((total, chapter) => total + estimateReadingTokens(`${chapter.title}\n${chapter.content}`), 0);
    if (!chapters.length || tokens > budget) {
      showMessage('所选章节超出正文 token 上限，请重新选择。');
      return;
    }
    const selectedBodies = chapters.map((chapter, index) => getChapterParagraphs(startIndex + index)
      .map(item => `[段落标记 ${item.id}] ${item.text}`).join('\n\n'));

    const readingRequest = window.petalRequestReading;
    const summaryRequest = window.petalRequestAnalysis;
    if (typeof readingRequest !== 'function' || typeof summaryRequest !== 'function') {
      showMessage('陪读 AI 尚未就绪，请刷新页面后重试。');
      return;
    }
    const chapterTitles = renderedChapters.slice(startIndex, endIndex).map(chapter => chapter.title);
    const sentParagraphIds = new Set(renderedChapters
      .slice(startIndex, endIndex)
      .flatMap((_, index) => getChapterParagraphs(startIndex + index).map(item => item.id)));
    const userContent = buildReadingRequestContent(startIndex, endIndex, selectedBodies, selectedText);
    const readingRules = '你只执行阅读段评任务，不主动与用户聊天，不寒暄、不回复任务、不作章节总评，不生成任何聊天正文。必须提高短评频率：本次发送的每一章节至少写 3 条短评；如果某章不足 3 段，则对每个可用段落都写短评。只评论小说正文中的段落，不要把总结、讨论内容或选中段落当作段评对象。你可以只选一个段落评论，例如 {"p23","这里也太惨了吧……"}；也可以选择连续多个段落，例如 {"p34-p35","也许这两段暗示了……"} 或 {"p34~p35","也许这两段暗示了……"}。编号必须逐字对应正文里的“段落标记 p数字”；单个编号只对应一个段落，范围编号表示一条短评覆盖从起始到结束的连续段落（含首尾），只在范围首段前显示一个星标，并对范围内段落整段划线。若要分别评论多个段落，请分别输出短评条目，每条短评对应一个星标。绝不能标记整个章节或未被点名的段落。短评要具体、简短且各不相同。除这些段评条目外不输出其他文字。';
    const dailyChatHistory = window.petalGetRecentChatHistory();
    const summaryPrompt = {
      system: '你是小说阅读记忆整理助手。请用当前角色的口吻记录本次章节发生了什么，保留角色、事件、因果与情绪，不跳出角色扮演、不评价、不推测。日常聊天记录仅提供角色关系背景，不得将其当作小说剧情或写进总结。只输出简洁的总结正文。',
      user: `书名：${state.book.title || '未命名书籍'}\n章节：${chapterTitles.join('、')}\n\n【最近日常聊天记录，仅作角色关系背景】\n${dailyChatHistory.map(message => `${message.role === 'user' ? '用户' : 'AI'}：${message.content}`).join('\n\n') || '（暂无日常聊天记录）'}\n\n【小说正文】\n${renderedChapters.slice(startIndex, endIndex).map(chapter => `【${chapter.title}】\n${chapter.content}`).join('\n\n')}`
    };
    companionRequestInProgress = true;
    const requestButton = toolbar.querySelector('[data-reading-action="request"]');
    requestButton.disabled = true;
    requestButton.setAttribute('aria-busy', 'true');
    showMessage(`正在请求陪读：${chapterTitles[0]} 至 ${chapterTitles.at(-1)}（约 ${tokens.toLocaleString('zh-CN')} token）`);
    try {
      const results = await Promise.allSettled([
        readingRequest({ userContent, readingRules, dailyChatHistory }),
        summaryRequest(summaryPrompt)
      ]);
      const readingResult = results[0].status === 'fulfilled' ? results[0].value : null;
      const summaryResult = results[1].status === 'fulfilled' ? results[1].value : null;
      const nextThoughts = state.thoughts.filter(item => !(item && item.bookId === state.book.id
        && item.kind === 'ai-comment' && sentParagraphIds.has(item.paragraphId)));
      if (typeof readingResult === 'string' && readingResult.trim()) {
        parseAiNotes(readingResult).forEach(note => {
          if (!sentParagraphIds.has(note.paragraphId)) return;
          const chapterIndex = chapterIndexForParagraph(note.paragraphId);
          const paragraph = bookContent.querySelector(`[data-reading-paragraph="${CSS.escape(note.paragraphId)}"]`);
          if (!paragraph) return;
          const paragraphIds = note.paragraphIds.filter(id => sentParagraphIds.has(id)
          && bookContent.querySelector(`[data-reading-paragraph="${CSS.escape(id)}"]`));
          if (!paragraphIds.length) return;
          const paragraphTexts = Object.fromEntries(paragraphIds.map(id => [
          id,
          bookContent.querySelector(`[data-reading-paragraph="${CSS.escape(id)}"]`).textContent.trim()
          ]));
          const entry = {
          id: makeId(),
          kind: 'ai-comment',
          annotationFormat: 3,
          bookId: state.book.id,
          paragraphId: note.paragraphId,
          paragraphText: paragraph.textContent.trim(),
          paragraphIds,
          paragraphTexts,
          chapterTitle: renderedChapters[chapterIndex]?.title || '',
          content: note.content,
          createdAt: new Date().toISOString()
          };
          nextThoughts.unshift(entry);
        });
      }
      let nextMemories = [...state.memories];
      if (typeof summaryResult === 'string' && summaryResult.trim()) {
        const firstParagraphId = getChapterParagraphs(startIndex)[0]?.id || '';
        nextMemories = nextMemories.filter(item => !(item.bookId === state.book.id
          && item.chapterStart === startIndex + 1 && item.chapterEnd === endIndex));
        nextMemories.unshift({
          id: makeId(),
          bookId: state.book.id,
          bookTitle: state.book.title || '未命名书籍',
          kind: 'summary',
          chapterStart: startIndex + 1,
          chapterEnd: endIndex,
          chapterTitle: `${chapterTitles[0]} — ${chapterTitles.at(-1)}`,
          paragraphId: firstParagraphId,
          content: summaryResult.trim(),
          createdAt: new Date().toISOString()
        });
      } else if (results[1].status === 'rejected') {
        console.error('共读章节总结失败', results[1].reason);
      }
      const nextBook = readingResult !== null
        ? { ...state.book, aiReadThrough: Math.max(Number(state.book.aiReadThrough) || 0, endIndex), lastReadingStartChapter: startIndex }
        : state.book;
      if (!saveState({ ...state, book: nextBook, thoughts: nextThoughts, memories: nextMemories })) return;
      renderBook();
      renderThoughtList();
      renderMemoryList();
      if (readingResult === null && !summaryResult) {
        showMessage(`阅读段评请求失败：${results[0].status === 'rejected' ? results[0].reason?.message || '阅读模型请求失败' : '阅读模型没有返回内容'}；总结也未完成。`);
      } else if (readingResult === null) {
        showMessage(`总结已保存，但阅读段评请求失败：${results[0].status === 'rejected' ? results[0].reason?.message || '阅读模型请求失败' : '阅读模型没有返回内容'}`);
      } else if (!summaryResult) {
        showMessage(`陪读完成，但总结失败：${results[1].status === 'rejected' ? results[1].reason?.message : '总结 AI 没有返回内容'}。`);
      } else {
        showMessage(`阅读段评完成，已标记 AI 阅读至「${chapterTitles.at(-1)}」。`);
      }
    } finally {
      companionRequestInProgress = false;
      requestButton.disabled = false;
      requestButton.removeAttribute('aria-busy');
    }
  }

  function updateImageSelect(select, images, activeId, emptyLabel) {
    select.replaceChildren();
    const none = document.createElement('option');
    none.value = '';
    none.textContent = images.length ? '不使用背景图' : emptyLabel;
    select.append(none);
    images.forEach(image => {
      const option = document.createElement('option');
      option.value = image.id;
      option.textContent = image.name;
      select.append(option);
    });
    select.value = activeId;
  }

  function renderImagePreviews() {
    const background = state.appearance.readingBackgrounds.find(item => item.id === state.appearance.activeReadingBackgroundId);
    const pageImage = state.appearance.pageBackgrounds.find(item => item.id === state.appearance.activePageBackgroundId);
    for (const [id, image, label] of [
      ['readingBackgroundPreview', background, '当前共读页面背景'],
      ['readingPageImagePreview', pageImage, '当前书页背景图']
    ]) {
      const preview = $(id);
      preview.replaceChildren();
      preview.classList.toggle('has-image', Boolean(image));
      if (image) {
        preview.style.backgroundImage = escapeCssUrl(image.dataUrl);
        const name = document.createElement('span');
        name.textContent = `${label}：${image.name}`;
        preview.append(name);
      } else {
        preview.style.removeProperty('background-image');
        preview.textContent = '尚未选择图片';
      }
    }
  }

  function openBeautifyDialog(activeTab = 'appearance') {
    updateImageSelect($('readingBackgroundSelect'), state.appearance.readingBackgrounds, state.appearance.activeReadingBackgroundId, '没有保存的页面背景');
    updateImageSelect($('readingPageImageSelect'), state.appearance.pageBackgrounds, state.appearance.activePageBackgroundId, '没有保存的书页图片');
    document.querySelectorAll('input[name="readingPageImagePosition"]').forEach(input => {
      input.checked = input.value === state.appearance.pageImagePosition;
    });
    $('readingPageImageBlur').value = String(Math.min(36, Math.max(0, Number(state.appearance.pageImageBlur) || 0)));
    $('readingPageColor').value = /^#[\da-f]{6}$/i.test(state.appearance.pageColor) ? state.appearance.pageColor : '#d9dde1';
    $('readingTextColor').value = /^#[\da-f]{6}$/i.test(state.appearance.textColor) ? state.appearance.textColor : '#f2ecdf';
    $('readingQuoteColor').value = /^#[\da-f]{6}$/i.test(state.appearance.quoteColor) ? state.appearance.quoteColor : '#d4c6a9';
    document.querySelectorAll('input[name="readingTurnMode"]').forEach(input => {
      input.checked = input.value === (state.appearance.turnMode === 'realistic' ? 'realistic' : 'scroll');
    });
    $('readingFrostedEnabled').checked = state.appearance.frostedEnabled !== false;
    $('readingPageOpacity').value = String(Math.min(100, Math.max(10, Number(state.appearance.pageOpacity) || 84)));
    $('readingPageBlur').value = String(Math.min(36, Math.max(0, Number(state.appearance.pageBlur) || 0)));
    $('readingFontSize').value = String(Math.min(24, Math.max(12, Number(state.appearance.fontSize) || 15)));
    $('readingLineHeight').value = String(Math.min(30, Math.max(14, Math.round((Number(state.appearance.lineHeight) || 2) * 10))));
    $('readingRainEnabled').checked = Boolean(state.appearance.readingRain);
    $('readingSnowEnabled').checked = Boolean(state.appearance.readingSnow);
    $('readingTokenLimit').value = String(Math.min(200000, Math.max(256, Number(state.readingTokenLimit) || 50000)));
    $('readingDiscussionHistoryLimit').value = String(Math.min(100, Math.max(30, Number(state.discussionHistoryLimit) || 60)));
    updateStyleRangeLabels();
    renderImagePreviews();
    selectSettingsTab(activeTab);
    showDialog('readingBeautifyDialog');
  }

  function selectSettingsTab(tab) {
    document.querySelectorAll('[data-reading-settings-tab]').forEach(button => {
      const active = button.dataset.readingSettingsTab === tab;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('[data-reading-settings-panel]').forEach(panel => {
      panel.hidden = panel.dataset.readingSettingsPanel !== tab;
    });
  }

  function updateStyleRangeLabels() {
    $('readingPageImageBlurValue').value = `${$('readingPageImageBlur').value}px`;
    $('readingPageOpacityValue').value = `${$('readingPageOpacity').value}%`;
    $('readingPageBlurValue').value = `${$('readingPageBlur').value}px`;
    $('readingFontSizeValue').value = `${$('readingFontSize').value}px`;
    $('readingLineHeightValue').value = (Number($('readingLineHeight').value) / 10).toFixed(1);
  }

  function savePageStyle(key, value) {
    const updated = { ...state, appearance: { ...state.appearance, [key]: value } };
    if (saveState(updated)) applyAppearance();
  }

  function readImageFile(file, collection) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showMessage('请选择图片文件。');
      return;
    }
    if (file.size > 12000000) {
      showMessage('图片原文件不能超过 12 MB。');
      return;
    }
    const fileReader = new FileReader();
    fileReader.onerror = () => {
      console.error('读取共读背景图片失败', fileReader.error);
      showMessage(`读取图片失败：${fileReader.error?.message || '无法读取文件'}`);
    };
    fileReader.onload = () => {
      const image = new Image();
      image.onerror = () => showMessage('无法解析这张图片。');
      image.onload = () => {
        const scale = Math.min(1, 2000 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        let dataUrl = canvas.toDataURL('image/webp', 0.78);
        if (dataUrl.length > 900000) {
          const smaller = document.createElement('canvas');
          smaller.width = Math.max(1, Math.round(canvas.width * 0.72));
          smaller.height = Math.max(1, Math.round(canvas.height * 0.72));
          smaller.getContext('2d').drawImage(canvas, 0, 0, smaller.width, smaller.height);
          dataUrl = smaller.toDataURL('image/webp', 0.62);
        }
        if (dataUrl.length > 900000) {
          showMessage('压缩后的图片仍过大，请选择较小图片。');
          return;
        }
        const images = state.appearance[collection];
        const entry = { id: makeId(), name: file.name || '共读背景', dataUrl };
        const updated = {
          ...state,
          appearance: {
            ...state.appearance,
            [collection]: [...images, entry],
            [collection === 'readingBackgrounds' ? 'activeReadingBackgroundId' : 'activePageBackgroundId']: entry.id
          }
        };
        if (!saveState(updated)) return;
        applyAppearance();
        openBeautifyDialog();
        showMessage('背景图片已保存并应用。');
      };
      image.src = String(fileReader.result);
    };
    fileReader.readAsDataURL(file);
  }

  function removeSelectedImage(collectionName, activeIdName, label) {
    const activeId = state.appearance[activeIdName];
    if (!activeId) {
      showMessage(`尚未选择${label}。`);
      return;
    }
    if (!window.confirm(`移除当前${label}？`)) return;
    const updated = {
      ...state,
      appearance: {
        ...state.appearance,
        [collectionName]: state.appearance[collectionName].filter(image => image.id !== activeId),
        [activeIdName]: ''
      }
    };
    if (saveState(updated)) {
      applyAppearance();
      openBeautifyDialog();
    }
  }

  toolbar.addEventListener('pointerdown', event => {
    if (event.target.closest('[data-reading-action="highlight"],[data-reading-action="favorite"],[data-reading-action="request"]')) {
      pendingSelection = captureSelection();
    }
  });
  document.querySelectorAll('[data-reading-action]').forEach(button => button.addEventListener('click', () => {
    switch (button.dataset.readingAction) {
      case 'import':
        openImportDialog();
        break;
      case 'shelf':
        openShelf();
        break;
      case 'thought':
        renderThoughtList();
        showDialog('readingThoughtDialog');
        break;
      case 'discussion':
        openDiscussionPage();
        break;
      case 'memory':
        renderMemoryList();
        showDialog('readingMemoryDialog');
        break;
      case 'highlight':
        addSelectionHighlight(pendingSelection || captureSelection());
        pendingSelection = null;
        break;
      case 'favorite':
        addFavorite(pendingSelection || captureSelection());
        pendingSelection = null;
        break;
      case 'request':
        openCompanionConfirm((pendingSelection || captureSelection())?.text || '');
        pendingSelection = null;
        break;
      case 'beautify':
        openBeautifyDialog();
        break;
      default:
        console.error(`未知的共读操作：${button.dataset.readingAction}`);
    }
  }));

  $('sharedReadingBack').addEventListener('click', closePage);
  $('readingShelfClose').addEventListener('click', closeShelf);
  $('readingShelfBackdrop').addEventListener('click', closeShelf);
  $('readingImportFile').addEventListener('change', event => importTextFile(event.target.files[0]));
  $('readingImportSave').addEventListener('click', saveImportedBook);
  document.querySelectorAll('[data-reading-settings-tab]').forEach(button => button.addEventListener('click', () => {
    selectSettingsTab(button.dataset.readingSettingsTab);
  }));
  $('readingTokenLimit').addEventListener('change', event => {
    const value = Number(event.target.value);
    if (!Number.isFinite(value) || value < 256 || value > 200000) {
      event.target.value = String(state.readingTokenLimit);
      showMessage('token 上限需在 256 至 200000 之间。');
      return;
    }
    if (saveState({ ...state, readingTokenLimit: Math.round(value) })) showMessage('AI 陪读 token 上限已保存。');
  });
  $('readingDiscussionHistoryLimit').addEventListener('change', event => {
    const value = Number(event.target.value);
    if (!Number.isInteger(value) || value < 30 || value > 100) {
      event.target.value = String(state.discussionHistoryLimit);
      showMessage('讨论历史条数需为 30 至 100 之间的整数。');
      return;
    }
    if (saveState({ ...state, discussionHistoryLimit: value })) {
      showMessage(`讨论请求将发送最近 ${value} 条历史消息。`);
    }
  });
  $('readingCompanionConfirm').addEventListener('click', sendCompanionRequest);
  $('readingCompanionStartChapter').addEventListener('change', event => {
    populateCompanionEndChapters(Number(event.target.value));
  });
  $('readingCompanionEndChapter').addEventListener('change', updateCompanionRangeEstimate);
  $('readingDiscussionForm').addEventListener('submit', sendDiscussionMessage);
  $('readingDiscussionRequest').addEventListener('click', requestDiscussionReply);
  $('readingMemoryList').addEventListener('change', event => {
    if (event.target.matches('.reading-memory-select')) updateMemorySelection();
  });
  $('readingMemorySelectAll').addEventListener('change', event => {
    $('readingMemoryList').querySelectorAll('.reading-memory-select').forEach(input => { input.checked = event.target.checked; });
    updateMemorySelection();
  });
  $('readingMemorySummarize').addEventListener('click', summarizeSelectedReadingMemories);
  $('readingMemoryArchive').addEventListener('click', archiveSelectedReadingMemories);
  $('readingMemoryDelete').addEventListener('click', deleteSelectedReadingMemories);
  $('readingThoughtList').addEventListener('click', event => {
    const removeButton = event.target.closest('[data-reading-delete-favorite]');
    if (!removeButton) return;
    const item = state.thoughts.find(entry => entry.id === removeButton.dataset.readingDeleteFavorite
      && entry.bookId === state.book.id && entry.kind === 'favorite');
    if (!item) return;
    if (!saveState({ ...state, thoughts: state.thoughts.filter(entry => entry.id !== item.id) })) return;
    renderThoughtList();
    showMessage('已取消收藏。');
  });
  bookContent.addEventListener('click', event => {
    const cancelButton = event.target.closest('[data-reading-cancel-highlight]');
    if (cancelButton) {
      const highlightId = cancelButton.dataset.readingCancelHighlight;
      const scrollTop = bookContent.scrollTop;
      if (!saveState({
        ...state,
        highlights: state.highlights.filter(item => item.id !== highlightId),
        discussions: state.discussions.filter(item => item.sourceHighlightId !== highlightId)
      })) return;
      renderBook();
      bookContent.scrollTop = scrollTop;
      return;
    }
    const discussionButton = event.target.closest('[data-reading-discuss-highlight]');
    if (discussionButton) {
      addDiscussion(discussionButton.dataset.readingDiscussHighlight);
      return;
    }
    const highlightMark = event.target.closest('[data-reading-highlight]');
    bookContent.querySelectorAll('.reading-annotation-actions:not([hidden])').forEach(actions => { actions.hidden = true; });
    if (highlightMark) {
      const actions = bookContent.querySelector(`[data-reading-highlight-actions="${CSS.escape(highlightMark.dataset.readingHighlight)}"]`);
      if (actions) actions.hidden = false;
      return;
    }
    const paragraph = event.target.closest('.reading-ai-annotated');
    if (paragraph) showReadingNote(paragraph, event);
  });
  bookContent.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-reading-highlight]')) {
      event.preventDefault();
      const highlightId = event.target.dataset.readingHighlight;
      bookContent.querySelectorAll('.reading-annotation-actions:not([hidden])').forEach(actions => { actions.hidden = true; });
      const actions = bookContent.querySelector(`[data-reading-highlight-actions="${CSS.escape(highlightId)}"]`);
      if (actions) actions.hidden = false;
      return;
    }
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.reading-ai-annotated')) {
      event.preventDefault();
      showReadingNote(event.target, event);
    }
  });
  $('readingNoteClose').addEventListener('click', () => { $('readingNotePopover').hidden = true; });
  function turnPage(direction) {
    const distance = bookContent.clientHeight * direction;
    if (state.appearance.turnMode !== 'realistic') {
      bookContent.scrollBy({ top: distance, behavior: 'smooth' });
      return;
    }
    if (pageTurnInProgress) return;
    pageTurnInProgress = true;
    const page = $('readingBookPage');
    const animationClass = direction > 0 ? 'page-turn-next' : 'page-turn-previous';
    page.classList.add(animationClass);
    setTimeout(() => bookContent.scrollBy({ top: distance, behavior: 'instant' }), 300);
    setTimeout(() => {
      page.classList.remove(animationClass);
      pageTurnInProgress = false;
      updateProgress();
    }, 700);
  }

  $('readingPreviousPage').addEventListener('click', () => turnPage(-1));
  $('readingNextPage').addEventListener('click', () => turnPage(1));
  $('readingChapterOpen').addEventListener('click', openChapterDrawer);
  $('readingChapterClose').addEventListener('click', closeChapterDrawer);
  $('readingChapterBackdrop').addEventListener('click', closeChapterDrawer);
  bookContent.addEventListener('scroll', updateProgress, { passive: true });

  document.addEventListener('click', event => {
    const closeButton = event.target.closest('[data-reading-close]');
    if (closeButton) {
      $(closeButton.dataset.readingClose).close();
      if (closeButton.dataset.readingClose === 'readingCompanionConfirmDialog') pendingCompanionRequest = null;
    }
    if (event.target instanceof HTMLDialogElement) event.target.close();
  });

  $('readingBackgroundSelect').addEventListener('change', event => {
    if (saveState({ ...state, appearance: { ...state.appearance, activeReadingBackgroundId: event.target.value } })) {
      applyAppearance();
      renderImagePreviews();
    }
  });
  $('readingPageImageSelect').addEventListener('change', event => {
    if (saveState({ ...state, appearance: { ...state.appearance, activePageBackgroundId: event.target.value } })) {
      applyAppearance();
      renderImagePreviews();
    }
  });
  $('readingBackgroundUpload').addEventListener('change', event => {
    readImageFile(event.target.files[0], 'readingBackgrounds');
    event.target.value = '';
  });
  $('readingPageImageUpload').addEventListener('change', event => {
    readImageFile(event.target.files[0], 'pageBackgrounds');
    event.target.value = '';
  });
  $('readingBackgroundRemove').addEventListener('click', () => removeSelectedImage('readingBackgrounds', 'activeReadingBackgroundId', '共读页面背景'));
  $('readingPageImageRemove').addEventListener('click', () => removeSelectedImage('pageBackgrounds', 'activePageBackgroundId', '书页背景图'));
  $('readingPageColor').addEventListener('input', event => savePageStyle('pageColor', event.target.value));
  $('readingTextColor').addEventListener('input', event => savePageStyle('textColor', event.target.value));
  $('readingQuoteColor').addEventListener('input', event => savePageStyle('quoteColor', event.target.value));
  document.querySelectorAll('input[name="readingTurnMode"]').forEach(input => input.addEventListener('change', event => {
    if (event.target.checked) savePageStyle('turnMode', event.target.value);
  }));
  $('readingFrostedEnabled').addEventListener('change', event => savePageStyle('frostedEnabled', event.target.checked));
  $('readingPageImageBlur').addEventListener('input', event => {
    updateStyleRangeLabels();
    savePageStyle('pageImageBlur', Number(event.target.value));
  });
  $('readingPageOpacity').addEventListener('input', event => {
    updateStyleRangeLabels();
    savePageStyle('pageOpacity', Number(event.target.value));
  });
  $('readingPageBlur').addEventListener('input', event => {
    updateStyleRangeLabels();
    savePageStyle('pageBlur', Number(event.target.value));
  });
  $('readingFontSize').addEventListener('input', event => {
    updateStyleRangeLabels();
    savePageStyle('fontSize', Number(event.target.value));
  });
  $('readingLineHeight').addEventListener('input', event => {
    updateStyleRangeLabels();
    savePageStyle('lineHeight', Number(event.target.value) / 10);
  });
  $('readingRainEnabled').addEventListener('change', event => savePageStyle('readingRain', event.target.checked));
  $('readingSnowEnabled').addEventListener('change', event => savePageStyle('readingSnow', event.target.checked));
  document.querySelectorAll('input[name="readingPageImagePosition"]').forEach(input => input.addEventListener('change', event => {
    if (!event.target.checked) return;
    if (saveState({ ...state, appearance: { ...state.appearance, pageImagePosition: event.target.value } })) applyAppearance();
  }));

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !$('readingNotePopover').hidden) {
      $('readingNotePopover').hidden = true;
      return;
    }
    if (event.key === 'Escape' && !$('readingShelfDrawer').hidden) {
      closeShelf();
      return;
    }
    if (event.key === 'Escape' && !$('readingChapterDrawer').hidden) {
      closeChapterDrawer();
      return;
    }
    if (event.key === 'Escape' && !reader.hidden && !document.querySelector('.book-dialog[open]')) closePage();
  });

  applyAppearance();
  renderBook();
  $('readingMemoryCount').textContent = String(state.memories.length);
  window.petalOpenSharedReadingPage = openPage;
})();
