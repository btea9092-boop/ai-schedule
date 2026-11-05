(() => {
  const KEY = 'petalJournal.v1';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const $ = id => document.getElementById(id);
  const allowedElements = new Set(['svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'defs', 'linearGradient', 'radialGradient', 'stop']);
  const allowedAttributes = new Set(['xmlns', 'viewBox', 'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'd', 'points', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'opacity', 'fill-opacity', 'stroke-opacity', 'transform', 'gradientUnits', 'gradientTransform', 'offset', 'stop-color', 'stop-opacity', 'id', 'x1', 'x2', 'y1', 'y2']);
  const numeric = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?%?$/;
  const pathData = /^[MmZzLlHhVvCcSsQqTtAa0-9eE+.,\-\s]+$/;
  const pointData = /^[0-9eE+.,\-\s]+$/;
  const layouts = new Set(['irregular', 'block', 'bottle']);
  const sizes = new Set(['small', 'medium', 'large', 'extra-large']);
  const placements = new Set(['parallel', 'vertical-stack', 'light-stack', 'stack', 'bulk-stack']);
  const placementLabels = {
    parallel: '平行摆放',
    'vertical-stack': '垂直堆叠',
    'light-stack': '少量堆叠（最多 3 个）',
    stack: '堆叠（最多 6 个）',
    'bulk-stack': '大量堆叠（最多 9 个）'
  };
  const sizeLabels = { small: '小型', medium: '中型', large: '大型', 'extra-large': '超大型' };
  const shelfFloors = [214, 394, 576, 766];
  const artworkDimensions = {
    small: [58, 54],
    medium: [120, 104],
    large: [150, 170],
    'extra-large': [360, 88]
  };
  const artworkBoundsCache = new Map();
  const maxCopiesPerIngredient = 60;
  const maxFridgeCopies = 120;
  let organizing = false;

  function readData() {
    let data;
    try {
      data = JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch (error) {
      console.error('读取冰箱 SVG 数据失败', error);
      throw new Error('无法读取本地数据，请检查浏览器数据。');
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('本地数据格式无效。');
    return data;
  }

  function writeData(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      window.dispatchEvent(new Event('petal-data-updated'));
    } catch (error) {
      console.error('保存冰箱 SVG 数据失败', error);
      throw new Error('无法保存 SVG 库，可能是浏览器存储空间不足。请先导出数据备份。');
    }
  }

  function normalizeName(value) {
    return String(value || '').normalize('NFKC').toLocaleLowerCase().replace(/[\s\u3000·・_-]/g, '');
  }

  function validatePath(value) {
    return typeof value === 'string' && value.length > 0 && value.length <= 12000 && pathData.test(value);
  }

  function validateSilhouette(value) {
    return validatePath(value) && /[zZ]\s*$/.test(value);
  }

  function validateArtwork(source) {
    if (typeof source !== 'string' || source.length > 50000) throw new Error('SVG 内容为空或超过 50 KB。');
    const documentNode = new DOMParser().parseFromString(source, 'image/svg+xml');
    if (documentNode.doctype || documentNode.querySelector('parsererror')) throw new Error('SVG XML 格式无效。');
    const root = documentNode.documentElement;
    if (root.localName !== 'svg' || root.namespaceURI !== SVG_NS) throw new Error('图案必须是 SVG 根元素。');
    const ids = new Set();
    const references = [];
    let nodeCount = 0;
    const viewBox = (root.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
    if (viewBox.length !== 4 || viewBox.some(value => !Number.isFinite(value)) || viewBox[2] <= 0 || viewBox[3] <= 0 || viewBox.some(value => Math.abs(value) > 10000)) {
      throw new Error('SVG 需要有效且尺寸合理的 viewBox。');
    }
    for (const element of [root, ...root.querySelectorAll('*')]) {
      nodeCount += 1;
      if (nodeCount > 3000 || !allowedElements.has(element.localName) || element.namespaceURI !== SVG_NS) throw new Error('SVG 含有不支持的元素或节点过多。');
      for (const attribute of [...element.attributes]) {
        const name = attribute.name;
        const value = attribute.value.trim();
        if (/^on/i.test(name) || name.toLowerCase() === 'style' || name.toLowerCase() === 'href') throw new Error('SVG 含有不安全属性。');
        if (!allowedAttributes.has(name)) {
          element.removeAttribute(name);
          continue;
        }
        if (name === 'id') {
          if (!/^[A-Za-z][A-Za-z0-9_-]{0,40}$/.test(value) || ids.has(value)) throw new Error('SVG 中有无效或重复的 id。');
          ids.add(value);
        } else if (name === 'd') {
          if (!validatePath(value)) throw new Error('SVG 路径数据无效或过长。');
        } else if (name === 'points') {
          if (!value || value.length > 12000 || !pointData.test(value)) throw new Error('SVG 多边形数据无效或过长。');
        } else if (name === 'viewBox') {
          if (element !== root) throw new Error('图案内部不能嵌套 SVG 画布。');
        } else if (name === 'fill') {
          if (value !== 'none') throw new Error('食材线稿必须透明填充。');
        } else if (['stroke', 'stop-color'].includes(name)) {
          if (/^url\(#([A-Za-z][A-Za-z0-9_-]{0,40})\)$/.test(value)) references.push(value.slice(5, -1));
          else if (value !== 'none' && value !== 'black' && value !== 'white' && !/^#[0-9a-f]{3,8}$/i.test(value)) throw new Error('SVG 只能使用纯色或内部渐变引用。');
        } else if (name === 'transform' || name === 'gradientTransform') {
          if (!/^(?:(?:translate|rotate|scale|matrix)\([-+0-9eE.,\s]+\)\s*)+$/.test(value) || value.length > 200) throw new Error('SVG 变换数据无效。');
        } else if (name === 'gradientUnits') {
          if (!['userSpaceOnUse', 'objectBoundingBox'].includes(value)) throw new Error('SVG 渐变属性无效。');
        } else if (name === 'offset') {
          if (!numeric.test(value)) throw new Error('SVG 渐变位置无效。');
        } else if (name === 'stroke-linecap') {
          if (!['butt', 'round', 'square'].includes(value)) throw new Error('SVG 线端样式无效。');
        } else if (name === 'stroke-linejoin') {
          if (!['miter', 'round', 'bevel'].includes(value)) throw new Error('SVG 连接样式无效。');
        } else if (name === 'stroke-miterlimit') {
          if (!numeric.test(value) || Number(value) < 1) throw new Error('SVG 斜接限制无效。');
        } else if (name === 'xmlns') {
          if (value !== SVG_NS) throw new Error('SVG 命名空间无效。');
        } else if (!numeric.test(value)) throw new Error(`SVG 属性 ${name} 的数值无效。`);
      }
    }
    if (references.some(id => !ids.has(id))) throw new Error('SVG 渐变引用不存在。');
    return { source: new XMLSerializer().serializeToString(root), viewBox: viewBox.join(' ') };
  }

  function createSvgElement(tag, attributes = {}) {
    const element = document.createElementNS(SVG_NS, tag);
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, String(value)));
    return element;
  }

  function copyArtworkChildren(source, target, prefix) {
    for (const child of [...source.children]) {
      const copy = createSvgElement(child.localName);
      for (const attribute of [...child.attributes]) {
        let value = attribute.value;
        if (attribute.name === 'id') value = `${prefix}-${value}`;
        else value = value.replace(/url\(#([A-Za-z][A-Za-z0-9_-]{0,40})\)/g, `url(#${prefix}-$1)`);
        copy.setAttribute(attribute.name, value);
      }
      target.append(copy);
      copyArtworkChildren(child, copy, prefix);
    }
  }

  function appendArtwork(target, entry, prefix, x, y, width, height) {
    const parsed = validateArtwork(entry.svg);
    const source = new DOMParser().parseFromString(parsed.source, 'image/svg+xml').documentElement;
    const art = createSvgElement('svg', {
      x, y, width, height, viewBox: parsed.viewBox,
      preserveAspectRatio: 'xMidYMax meet',
      overflow: 'visible'
    });
    copyArtworkChildren(source, art, prefix);
    target.append(art);
  }

  function validLibrary(data) {
    return (Array.isArray(data.fridgeSvgLibrary) ? data.fridgeSvgLibrary : []).filter(entry => {
      try {
        const artwork = normalizeArtwork(entry);
        return Boolean(artwork && typeof artwork.name === 'string' && layouts.has(artwork.layout) && validateSilhouette(artwork.silhouette) && validateArtwork(artwork.svg));
      } catch (error) {
        console.warn(`已忽略无效食材图案「${entry?.name || '未命名'}」`, error);
        return false;
      }
    }).map(normalizeArtwork);
  }

  function normalizeArtwork(entry) {
    if (!entry || typeof entry !== 'object') return null;
    if (entry.size === undefined && entry.placement === undefined) {
      const legacy = entry.layout === 'bottle'
        ? { size: 'large', placement: 'parallel' }
        : entry.layout === 'block'
          ? { size: 'medium', placement: 'vertical-stack' }
          : { size: 'medium', placement: 'stack' };
      return { ...entry, ...legacy };
    }
    if (!sizes.has(entry.size) || !placements.has(entry.placement)) return null;
    return entry;
  }

  function findArtwork(library, name) {
    const key = normalizeName(name);
    return library.find(entry => [entry.name, ...(Array.isArray(entry.aliases) ? entry.aliases : [])].some(alias => normalizeName(alias) === key));
  }

  function inventorySignature(inventory) {
    return JSON.stringify(inventory.map(item => ({
      name: String(item.name || '').trim(),
      quantity: Number(item.quantity) || 0,
      packageUnit: String(item.packageUnit || ''),
      amount: Number(item.amount) || 0,
      amountUnit: String(item.amountUnit || '')
    })).sort((left, right) => normalizeName(left.name).localeCompare(normalizeName(right.name))));
  }

  function countOf(item) {
    return Math.max(1, Math.ceil(Number(item.quantity) > 0 ? Number(item.quantity) : 1));
  }

  function getArtworkBounds(artwork, width, height) {
    const key = `${artwork.name}:${width}:${height}`;
    if (artworkBoundsCache.has(key)) return artworkBoundsCache.get(key);
    const viewBox = validateArtwork(artwork.svg).viewBox.split(' ').map(Number);
    const [viewX, viewY, viewWidth, viewHeight] = viewBox;
    const scale = Math.min(width / viewWidth, height / viewHeight);
    const offsetX = (width - viewWidth * scale) / 2;
    const offsetY = height - viewHeight * scale;
    const svg = createSvgElement('svg', { viewBox: viewBox.join(' '), width: 1, height: 1 });
    const path = createSvgElement('path', { d: artwork.silhouette });
    svg.style.position = 'fixed';
    svg.style.left = '-10000px';
    svg.style.top = '-10000px';
    svg.style.visibility = 'hidden';
    svg.append(path);
    document.body.append(svg);
    let bounds;
    try {
      const box = path.getBBox();
      bounds = {
        left: -width / 2 + offsetX + (box.x - viewX) * scale,
        right: -width / 2 + offsetX + (box.x + box.width - viewX) * scale,
        top: -height + offsetY + (box.y - viewY) * scale,
        bottom: -height + offsetY + (box.y + box.height - viewY) * scale
      };
    } finally {
      svg.remove();
    }
    artworkBoundsCache.set(key, bounds);
    return bounds;
  }

  function activeInventory(data) {
    return (Array.isArray(data.fridgeInventory) ? data.fridgeInventory : [])
      .filter(item => item && (Number(item.amount) > 0 || Number(item.quantity) > 0));
  }

  function validateArrangementCapacity(inventory) {
    const total = inventory.reduce((sum, item) => sum + countOf(item), 0);
    if (inventory.some(item => countOf(item) > maxCopiesPerIngredient) || total > maxFridgeCopies) {
      throw new Error(`单种食材最多摆放 ${maxCopiesPerIngredient} 个，冰箱总计最多摆放 ${maxFridgeCopies} 个；请先调整库存数量。`);
    }
  }

  function planArrangement(inventory, library) {
    const clusters = [];
    const ordered = inventory.filter(item => Number(item.amount) > 0 || Number(item.quantity) > 0);
    validateArrangementCapacity(ordered);
    const groups = [];
    let nextClusterId = 0;
    for (const item of ordered) {
      const artwork = findArtwork(library, item.name);
      if (!artwork) throw new Error(`SVG 库中缺少「${item.name}」的图案。`);
      const count = countOf(item);
      const dimensions = { ...artworkDimensions };
      if (artwork.name === '鸡胸' || (artwork.aliases || []).includes('鸡胸肉')) dimensions.medium = [142, 88];
      else if (artwork.name === '豆腐') dimensions.medium = [100, 55];
      const [pieceWidth, pieceHeight] = dimensions[artwork.size];
      const visibleBounds = getArtworkBounds(artwork, pieceWidth, pieceHeight);
      const visibleWidth = visibleBounds.right - visibleBounds.left;
      const regionLimit = artwork.size === 'large' ? 1 : artwork.placement === 'parallel'
        ? Math.max(1, Math.min(6, Math.floor(720 / visibleWidth)))
        : artwork.placement === 'vertical-stack' ? 5
          : artwork.placement === 'light-stack' ? 3
            : artwork.placement === 'stack' ? 6 : 9;
      for (let start = 0, regionIndex = 0; start < count; start += regionLimit, regionIndex += 1) {
        const regionCount = Math.min(regionLimit, count - start);
        const placementsInGroup = [];
        const horizontalStep = pieceWidth * (artwork.size === 'small' ? 0.72 : 0.66);
        const verticalStep = pieceHeight * 0.39;
        if (artwork.placement === 'parallel') {
          let visualRight = 0;
          for (let index = 0; index < regionCount; index += 1) {
            const gap = index % 2 === 1 ? 0 : Math.random() * 14;
            const dx = visualRight + gap - visibleBounds.left;
            placementsInGroup.push({ dx, dy: 0, rotate: 0 });
            visualRight = dx + visibleBounds.right;
          }
        } else if (artwork.placement === 'vertical-stack') {
          for (let index = 0; index < regionCount; index += 1) placementsInGroup.push({ dx: 0, dy: -index * 23, rotate: 0 });
        } else {
          const tilts = artwork.size === 'large' ? [-1, 0, 1] : [-8, -7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8];
          for (let index = tilts.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [tilts[index], tilts[swapIndex]] = [tilts[swapIndex], tilts[index]];
          }
          let remaining = regionCount;
          const rows = Math.ceil((Math.sqrt(8 * regionCount + 1) - 1) / 2);
          let row = 0;
          while (remaining > 0) {
            const rowCount = Math.min(rows - row, remaining);
            const rowY = -row * verticalStep;
            const rowWidth = (rowCount - 1) * horizontalStep;
            for (let index = 0; index < rowCount; index += 1) {
              placementsInGroup.push({
                dx: index * horizontalStep - rowWidth / 2,
                dy: rowY,
                rotate: tilts[placementsInGroup.length]
              });
            }
            remaining -= rowCount;
            row += 1;
          }
        }
        const minDx = Math.min(...placementsInGroup.map(position => position.dx + visibleBounds.left));
        const maxDx = Math.max(...placementsInGroup.map(position => position.dx + visibleBounds.right));
        const width = maxDx - minDx;
        const clusterId = `${normalizeName(item.name)}-${nextClusterId++}`;
        groups.push({ name: item.name, size: artwork.size, placement: artwork.placement, clusterId, width, pieceWidth, pieceHeight, minDx, placements: placementsInGroup, visibleBounds });
      }
    }
    const shelfGroups = shelfFloors.map(() => []);
    groups.forEach(group => {
      const minX = 130;
      const maxX = 870 - group.width;
      const slots = [];
      shelfGroups.forEach((placed, shelf) => {
        const sorted = placed.slice().sort((left, right) => left.left - right.left);
        let cursor = minX;
        sorted.forEach(entry => {
          if (entry.left - cursor >= group.width) slots.push({ shelf, min: cursor, max: entry.left - group.width });
          cursor = Math.max(cursor, entry.right);
        });
        if (maxX >= cursor) slots.push({ shelf, min: cursor, max: maxX });
      });
      let shelf;
      let left;
      if (slots.length) {
        const slot = slots[Math.floor(Math.random() * slots.length)];
        shelf = slot.shelf;
        left = slot.min + Math.random() * (slot.max - slot.min);
      } else {
        const placements = [];
        for (let candidateShelf = 0; candidateShelf < shelfGroups.length; candidateShelf += 1) {
          const placed = shelfGroups[candidateShelf];
          for (let attempt = 0; attempt < 30; attempt += 1) {
            const candidateLeft = minX + Math.random() * Math.max(0, maxX - minX);
            const overlap = placed.reduce((sum, entry) => sum + Math.max(0, Math.min(candidateLeft + group.width, entry.right) - Math.max(candidateLeft, entry.left)), 0);
            placements.push({ shelf: candidateShelf, left: candidateLeft, overlap });
          }
        }
        const leastOverlap = Math.min(...placements.map(candidate => candidate.overlap));
        const candidates = placements.filter(candidate => candidate.overlap === leastOverlap);
        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        shelf = selected.shelf;
        left = selected.left;
      }
      const baseX = left - group.minDx;
      const depth = Math.random();
      const floor = shelfFloors[shelf] - (group.placement === 'vertical-stack' ? 4 : 0);
      shelfGroups[shelf].push({ left, right: left + group.width, depth });
      group.placements.forEach(position => clusters.push({
        name: group.name, size: group.size, placement: group.placement, shelf, clusterId: group.clusterId,
        width: group.pieceWidth, height: group.pieceHeight,
        x: baseX + position.dx,
        y: floor + position.dy,
        depth,
        rotate: position.rotate,
        scale: 1
      }));
    });
    return clusters;
  }

  function appendSilhouette(target, item, artwork) {
    const group = createSvgElement('g', { transform: `translate(${item.x} ${item.y}) rotate(${item.rotate}) scale(${item.scale})` });
    const silhouette = createSvgElement('svg', { x: -item.width / 2, y: -item.height, width: item.width, height: item.height, viewBox: artwork.viewBox, preserveAspectRatio: 'xMidYMax meet', overflow: 'visible' });
    silhouette.append(createSvgElement('path', { d: artwork.silhouette, fill: 'black', stroke: 'black', 'stroke-width': '3', 'stroke-linejoin': 'round' }));
    group.append(silhouette);
    target.append(group);
  }

  function renderArrangement(data) {
    const library = validLibrary(data);
    const inventory = activeInventory(data);
    const arrangement = data.fridgeArrangement;
    const foods = [1, 2, 3, 4].map(layer => $(`fridgeFoods-${layer}`));
    const maskContainer = $('fridgeDynamicMasks');
    if (!maskContainer || foods.some(group => !group)) return;
    foods.forEach(group => group.replaceChildren());
    maskContainer.replaceChildren();
    document.querySelectorAll('.fridge-shelf-back').forEach(group => group.removeAttribute('mask'));
    $('fridgeBackWall').removeAttribute('mask');
    $('fridgeBottomFrame').removeAttribute('mask');
    const currentSignature = inventorySignature(inventory);
    const matches = arrangement?.version === 7 && arrangement.signature === currentSignature && Array.isArray(arrangement.items);
    const expectedCounts = new Map();
    inventory.forEach(item => {
      const key = normalizeName(item.name);
      expectedCounts.set(key, (expectedCounts.get(key) || 0) + countOf(item));
    });
    const actualCounts = new Map();
    if (matches && arrangement.items.length <= maxFridgeCopies) {
      arrangement.items.forEach(item => {
        const key = normalizeName(item?.name);
        actualCounts.set(key, (actualCounts.get(key) || 0) + 1);
      });
    }
    const safeItems = matches && arrangement.items.length <= maxFridgeCopies && arrangement.items.every(item =>
      item && typeof item === 'object'
      && findArtwork(library, item.name)?.size === item.size
      && findArtwork(library, item.name)?.placement === item.placement
      && Number.isInteger(item.shelf) && item.shelf >= 0 && item.shelf < 4
      && ['x', 'y', 'rotate', 'scale', 'width', 'height'].every(key => Number.isFinite(item[key]))
      && Number.isFinite(item.depth) && item.depth >= 0 && item.depth <= 1
      && Math.abs(item.x) <= 1000 && Math.abs(item.y) <= 1000 && Math.abs(item.rotate) <= 16
      && item.scale > 0 && item.scale <= 2 && item.width > 0 && item.width <= 720 && item.height > 0 && item.height <= 180
      && typeof item.clusterId === 'string'
    ) && [...expectedCounts].every(([key, count]) => actualCounts.get(key) === count)
      && [...actualCounts].every(([key, count]) => expectedCounts.get(key) === count);
    $('shuffleFridgeSpacing').hidden = !safeItems || !arrangement.items.length;
    $('fridgeOrganizerStatus').textContent = safeItems
      ? `${arrangement.items.length} 个食材图案已摆入冰箱。库存有变化时，请重新整理。`
        : matches
          ? '冰箱布局与库存不匹配，请重新整理。'
          : arrangement?.version === 1 || arrangement?.version === 2 || arrangement?.version === 3 || arrangement?.version === 4 || arrangement?.version === 5 || arrangement?.version === 6 || arrangement?.version === 7
            ? '库存已变化，请点击“整理冰箱”更新摆放。'
            : '图案保存在本地 SVG 库；整理后才会摆入冰箱。';
    if (!safeItems) return;

    const all = arrangement.items;
    const addMask = (id, items) => {
      const mask = createSvgElement('mask', { id, maskUnits: 'userSpaceOnUse', x: '0', y: '0', width: '1000', height: '810' });
      mask.append(createSvgElement('rect', { x: '0', y: '0', width: '1000', height: '810', fill: 'white' }));
      items.forEach(item => appendSilhouette(mask, item, findArtwork(library, item.name)));
      maskContainer.append(mask);
    };
    [0, 1, 2, 3].forEach(shelfIndex => {
      const items = all.filter(item => item.shelf === shelfIndex);
      const rear = $('fridgeShelf-' + (shelfIndex + 1)).querySelector('.fridge-shelf-back');
      const shelfMask = `fridge-shelf-mask-${shelfIndex}`;
      addMask(shelfMask, items);
      rear.setAttribute('mask', `url(#${shelfMask})`);
      const clusters = new Map();
      items.forEach(item => {
        if (!clusters.has(item.clusterId)) clusters.set(item.clusterId, []);
        clusters.get(item.clusterId).push(item);
      });
      const orderedClusters = [...clusters.values()].sort((left, right) => {
        const averageDepth = group => group.reduce((sum, item) => sum + item.depth, 0) / group.length;
        return averageDepth(left) - averageDepth(right);
      });
      orderedClusters.forEach((clusterItems, clusterIndex) => {
        const laterClusters = orderedClusters.slice(clusterIndex + 1).flat();
        const clusterGroup = createSvgElement('g');
        if (laterClusters.length) {
          const maskId = `fridge-cluster-mask-${shelfIndex}-${clusterIndex}`;
          addMask(maskId, laterClusters);
          clusterGroup.setAttribute('mask', `url(#${maskId})`);
        }
        clusterItems.forEach((item, itemIndex) => {
          const group = createSvgElement('g', { class: 'fridge-food-art', role: 'img', 'aria-label': item.name });
          const laterItems = clusterItems.slice(itemIndex + 1);
          if (laterItems.length) {
            const maskId = `fridge-stack-mask-${shelfIndex}-${clusterIndex}-${itemIndex}`;
            addMask(maskId, laterItems);
            group.setAttribute('mask', `url(#${maskId})`);
          }
          const transform = `translate(${item.x} ${item.y}) rotate(${item.rotate}) scale(${item.scale})`;
          const artGroup = createSvgElement('g', { transform });
          appendArtwork(artGroup, findArtwork(library, item.name), `art-${shelfIndex}-${clusterIndex}-${itemIndex}`, -item.width / 2, -item.height, item.width, item.height);
          group.append(artGroup);
          clusterGroup.append(group);
        });
        foods[shelfIndex].append(clusterGroup);
      });
    });
    addMask('fridge-all-food-mask', all);
    $('fridgeBackWall').setAttribute('mask', 'url(#fridge-all-food-mask)');
    $('fridgeBottomFrame').setAttribute('mask', 'url(#fridge-all-food-mask)');
  }

  function renderLibrary() {
    const container = $('fridgeSvgLibrary');
    if (!container) return;
    let data;
    try {
      data = readData();
    } catch (error) {
      console.error(error);
      container.textContent = error.message;
      return;
    }
    const library = validLibrary(data);
    $('fridgeSvgLibraryCount').textContent = `${library.length} 个图案`;
    container.replaceChildren();
    if (!library.length) {
      container.textContent = '图库暂时为空。点击“整理冰箱”后，可由分析 AI 为缺少图案的库存食材绘制 SVG。';
      return;
    }
    for (const entry of library) {
      const card = document.createElement('article');
      card.className = 'fridge-svg-library-card';
      const preview = createSvgElement('svg', { viewBox: '-65 -140 130 150', role: 'img', 'aria-label': `${entry.name} SVG 预览` });
      try {
        appendArtwork(preview, entry, `preview-${entry.id || normalizeName(entry.name)}`, -55, -135, 110, 135);
      } catch (error) {
        console.warn(`无法预览图案「${entry.name}」`, error);
        continue;
      }
      const title = document.createElement('strong');
      title.textContent = entry.name;
      const label = document.createElement('small');
      label.textContent = `${entry.builtIn ? '内置图案' : 'AI 绘制'} · ${sizeLabels[entry.size]} · ${placementLabels[entry.placement]}`;
      card.append(preview, title, label);
      if (!entry.builtIn) {
        const remove = document.createElement('button');
        remove.className = 'secondary-button';
        remove.type = 'button';
        remove.textContent = '移除图案';
        remove.addEventListener('click', () => {
          if (!window.confirm(`移除「${entry.name}」图案？下次整理时会重新请求 AI 绘制。`)) return;
          try {
            const latest = readData();
            latest.fridgeSvgLibrary = (latest.fridgeSvgLibrary || []).filter(item => item.id !== entry.id);
            latest.fridgeArrangement = null;
            writeData(latest);
            renderLibrary();
            renderArrangement(latest);
          } catch (error) {
            console.error('移除食材 SVG 失败', error);
            window.alert(error.message);
          }
        });
        card.append(remove);
      }
      container.append(card);
    }
  }

  function parseAiResult(text, missing) {
    if (typeof text !== 'string' || text.length > 300000) throw new Error('AI 返回内容过长或格式无效。');
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first < 0 || last <= first) throw new Error('AI 没有按要求返回 SVG JSON。');
    let payload;
    try {
      payload = JSON.parse(cleaned.slice(first, last + 1));
    } catch (error) {
      throw new Error(`AI 返回的 SVG JSON 无法解析：${error.message}`);
    }
    if (!Array.isArray(payload.items)) throw new Error('AI 返回的 SVG 数据缺少 items 列表。');
    const requested = new Map(missing.map(item => [normalizeName(item.name), item]));
    const generated = new Map();
    for (const result of payload.items) {
      const key = normalizeName(result?.name);
      if (!requested.has(key) || generated.has(key)) continue;
      if (!sizes.has(result.size) || !placements.has(result.placement)) throw new Error(`AI 没有为「${requested.get(key).name}」提供有效的尺寸分类和摆放方式。`);
      if (!validateSilhouette(result.silhouette)) throw new Error(`AI 为「${requested.get(key).name}」生成的轮廓路径无效。`);
      const artwork = validateArtwork(result.svg);
      generated.set(key, {
        id: `fridge-svg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        name: requested.get(key).name,
        aliases: [],
        layout: result.placement === 'parallel' ? 'bottle' : result.placement === 'vertical-stack' ? 'block' : 'irregular',
        size: result.size,
        placement: result.placement,
        viewBox: artwork.viewBox,
        silhouette: result.silhouette,
        svg: artwork.source,
        builtIn: false,
        createdAt: new Date().toISOString()
      });
    }
    const absent = [...requested.keys()].filter(key => !generated.has(key));
    if (absent.length) throw new Error(`AI 没有返回完整图案：${absent.map(key => requested.get(key).name).join('、')}。`);
    return [...generated.values()];
  }

  const aiSystemPrompt = `你是食材 SVG 插画与分类助手。只输出可解析 JSON，不要 Markdown 或代码围栏。每种食材必须提供名称、尺寸分类、摆放方式、透明底纯线稿 SVG 和对应的闭合黑色外轮廓路径。
绘制指令：先分析食材名称及完整库存字段（amount、amountUnit、quantity、packageUnit），理解量词表达的是单件计数还是装有多件食材的一份包装。颗、个、只、枚等单件计数（如西红柿两颗、鸡蛋三个）只画一个代表性单品，不按数字复制；包、大包、袋、板、托、盒、桶、箱、篮、筐等要结合具体食品判断包装含义：若一份包装通常装有多件食材（如鸡蛋一板、榴莲肉一袋、冻饺子一包），要画一整份可辨认的包装及其中多件食材，不能只画其中一个；若包装单位通常对应一个整体食材（如一瓶饮料），则画单个容器及内容物。库存数量表示有几份/几包时，图案始终只画一份代表性物品或包装，不根据库存份数重复铺图。不得忽略库存字段中的包装单位，也不得仅凭某个量词机械推断，必须结合食材判断。食材轮廓要能辨认且有真实体积结构，不画简笔符号；瓶装饮品采用正平视、对称直立造型；方块食物表现顶面与侧面；肉类画饱满弧线和肌理；蔬果画自然曲线与叶蒂。所有可见食物图形 fill="none"，使用符合食材本色的彩色线条（如西红柿果实用红色、叶子用绿色），禁止背景色、实心底色、黑色阴影、数字标签和外部资源。绘制内容、轮廓和描边必须完整留在 SVG viewBox 内，不得裁切或越界；按食材长宽比选择合适的 viewBox，不要为了统一画布把细长或扁平食材画小。网页按类别缩放图案，以下尺寸是目标外接框（宽×高，网页坐标）：小型 58×54，中型 120×104（鸡胸肉约 142×88，豆腐约 100×55），大型 150×170，超大型 360×88（约为四瓶牛奶并排的总长度、一块鸡胸肉的高度）。大型图案应明显大于中型：细长物体高度尽量接近 170，横向或多件包装应明显更宽；严禁把大型轮廓缩成小图。若一份包装中含多个食材（如一袋/一盒冻饺子、一板鸡蛋或多根火腿肠），大多数情况下应将整份包装归类为 large，并画出包装与多件内容物；只有确实需要占据大部分格宽时才使用 extra-large。冰箱单格可用空间约 770×180；任何图案的最终外接尺寸（含倾斜后的占位）都不得超过一格的宽或高，也不得超出所属类别目标外接框。每个 svg 的 viewBox 可按图案比例设置；内部只用 path、line、circle、ellipse、rect、polygon、polyline、g、defs、linearGradient、stop；所有渐变必须使用当前图案内部的 id，不使用 style、script、image、use、外链或事件属性。silhouette 必须与 SVG 使用相同 viewBox，是用于遮挡消隐的单一闭合轮廓 path d，必须合法并与可见图案轮廓一致。
尺寸根据单个食材现实大小分类：size 只能是 small（小型）、medium（中型）、large（大型）或 extra-large（超大型）。含多件食材的包装大多数时候为 large，依据整包的实际外接尺寸决定，不能仅按单颗/单个食材大小分类。摆放方式 placement 只能是 parallel（平行摆放，适合瓶装饮品或鱼等大件）、vertical-stack（方正物品垂直叠放）、light-stack（少量堆叠，最多 3 个）、stack（堆叠，最多 6 个）或 bulk-stack（大量堆叠，最多 9 个）。根据物品真实形状、体积和稳定性选择；草莓通常 small + bulk-stack，鸡胸肉 medium + stack，牛奶 large + parallel，鱼通常 extra-large + parallel，火龙果通常 medium + light-stack。所有不规则堆叠必须采用正三角分层：底层最多、越往上越少；网页会保持每簇的堆叠造型，但不同食材以及不同食材簇之间可随机靠近、接触或重叠，并以线框遮挡表现前后关系。JSON 形状：{"items":[{"name":"库存原名","size":"medium","placement":"stack","silhouette":"M...Z","svg":"<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"-60 -135 120 140\\">...</svg>"}]}。`;

  const drawingReferenceSvgs = [
    ...window.petalDefaultFridgeSvgs
      .filter(entry => ['草莓', '鲜奶', '火腿肠', '鹌鹑蛋', '鸡蛋'].includes(entry.name))
      .map(({ name, svg }) => ({ name, svg })),
    {
      name: '饺子（多件包装）',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 140"><path d="M25 35 Q110 10 195 35 L188 118 Q110 137 32 118 Z" fill="none" stroke="#88aacc" stroke-width="2"/><path d="M25 35 Q110 57 195 35 M32 118 Q110 99 188 118" fill="none" stroke="#88aacc" stroke-width="1.5"/><g fill="none" stroke="#e8b88b" stroke-width="2.2" stroke-linejoin="round"><path d="M48 77 Q61 48 78 77 Q63 91 48 77 Z M48 77 Q62 70 78 77"/><path d="M87 72 Q101 41 118 72 Q103 87 87 72 Z M87 72 Q102 65 118 72"/><path d="M128 78 Q142 47 159 78 Q144 92 128 78 Z M128 78 Q143 71 159 78"/><path d="M67 105 Q80 78 96 105 Q82 119 67 105 Z M67 105 Q82 98 96 105"/><path d="M112 105 Q126 76 143 105 Q128 120 112 105 Z M112 105 Q127 98 143 105"/></g><g fill="none" stroke="#d2b48c" stroke-width="1"><path d="M54 76 Q62 82 72 76 M93 71 Q102 79 112 71 M134 77 Q143 84 153 77"/></g></svg>`
    },
    {
      name: '火腿肠',
      layout: 'bottle',
      size: 'medium',
      placement: 'parallel',
      viewBox: '-50 -72 100 144',
      silhouette: 'M-38,-65 L38,-65 C43,-65 46,-61 45,-55 L40,58 C39,64 35,68 28,68 L-28,68 C-35,68 -39,64 -40,58 L-45,-55 C-46,-61 -43,-65 -38,-65 Z',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-50 -72 100 144"><path d="M-36,-63 L36,-63 C41,-63 43,-59 42,-54 L37,56 C36,61 32,65 26,65 L-26,65 C-32,65 -36,61 -37,56 L-42,-54 C-43,-59 -41,-63 -36,-63 Z" fill="none" stroke="#E64A19" stroke-width="2.2" stroke-linejoin="round"/><path d="M-40,-53 L40,-53" fill="none" stroke="#E64A19" stroke-width="1.5"/><path d="M-36,-63 L-34,-57 L-30,-63 L-26,-57 L-22,-63 L-18,-57 L-14,-63 L-10,-57 L-6,-63 L-2,-57 L2,-63 L6,-57 L10,-63 L14,-57 L18,-63 L22,-57 L26,-63 L30,-57 L34,-63" fill="none" stroke="#FF7043" stroke-width="1.2"/><rect x="-30" y="-45" width="60" height="80" rx="6" fill="none" stroke="#FF8A65" stroke-width="1.4"/><g stroke="#D84315" stroke-width="1.8" fill="none"><rect x="-25" y="-38" width="14" height="66" rx="7" stroke="#E53935"/><circle cx="-18" cy="-35" r="2.5" stroke="#FBC02D" stroke-width="1.2"/><circle cx="-18" cy="25" r="2.5" stroke="#FBC02D" stroke-width="1.2"/><line x1="-21" y1="-24" x2="-21" y2="16" stroke="#FF8A80" stroke-width="1"/><rect x="-7" y="-40" width="14" height="70" rx="7" stroke="#E53935"/><circle cx="0" cy="-37" r="2.5" stroke="#FBC02D" stroke-width="1.2"/><circle cx="0" cy="27" r="2.5" stroke="#FBC02D" stroke-width="1.2"/><line x1="-3" y1="-26" x2="-3" y2="18" stroke="#FF8A80" stroke-width="1"/><rect x="11" y="-38" width="14" height="66" rx="7" stroke="#E53935"/><circle cx="18" cy="-35" r="2.5" stroke="#FBC02D" stroke-width="1.2"/><circle cx="18" cy="25" r="2.5" stroke="#FBC02D" stroke-width="1.2"/><line x1="15" y1="-24" x2="15" y2="16" stroke="#FF8A80" stroke-width="1"/></g><path d="M-36,54 L36,54 M-20,44 L20,44" fill="none" stroke="#D84315" stroke-width="1.5"/><path d="M-36,-20 C-33,-5 -33,20 -35,38 M36,-20 C33,-5 33,20 35,38" fill="none" stroke="#FFAB91" stroke-width="1.2"/></svg>`
    },
    {
      name: '鹌鹑蛋',
      layout: 'block',
      size: 'large',
      placement: 'vertical-stack',
      viewBox: '0 0 90 140',
      silhouette: 'M 30 15 C 40 12 50 12 60 15 C 65 25 55 30 50 40 C 75 50 85 90 70 130 C 55 140 35 140 20 130 C 5 90 15 50 40 40 C 35 30 25 25 30 15 Z',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 140"><path d="M 30 15 C 40 12 50 12 60 15 C 65 25 55 30 50 40 C 75 50 85 90 70 130 C 55 140 35 140 20 130 C 5 90 15 50 40 40 C 35 30 25 25 30 15 Z" stroke="#88aacc" stroke-width="2" fill="none"/><g stroke="#a38a6a" stroke-width="1.5" fill="none"><ellipse cx="45" cy="125" rx="9" ry="11"/><path d="M 36 125 C 25 125 22 115 25 105 C 30 95 38 100 40 110"/><path d="M 54 125 C 65 125 68 115 65 105 C 60 95 52 100 50 110"/><path d="M 38 113 C 35 100 45 95 52 100 C 55 105 53 113 52 114"/><path d="M 26 106 C 20 100 20 85 30 85 C 35 85 40 90 39 98"/><path d="M 64 106 C 70 100 70 85 60 85 C 55 85 50 90 51 98"/><path d="M 31 86 C 25 80 30 65 40 70 C 42 75 42 80 40 85"/><path d="M 59 86 C 65 80 60 65 50 70 C 48 75 48 80 50 85"/><path d="M 38 72 C 35 60 45 55 52 60 C 55 65 53 72 52 73"/><path d="M 23 120 C 18 125 15 115 18 110"/><path d="M 67 120 C 72 125 75 115 72 110"/></g><g stroke="#5c4033" stroke-width="1.5" fill="none"><circle cx="43" cy="120" r="0.5"/><circle cx="47" cy="122" r="0.5"/><circle cx="42" cy="128" r="0.5"/><circle cx="48" cy="126" r="0.5"/><circle cx="45" cy="132" r="0.5"/><circle cx="28" cy="110" r="0.5"/><circle cx="32" cy="118" r="0.5"/><circle cx="27" cy="115" r="0.5"/><circle cx="62" cy="110" r="0.5"/><circle cx="58" cy="118" r="0.5"/><circle cx="63" cy="115" r="0.5"/><circle cx="43" cy="100" r="0.5"/><circle cx="47" cy="102" r="0.5"/><circle cx="45" cy="108" r="0.5"/><circle cx="28" cy="90" r="0.5"/><circle cx="32" cy="98" r="0.5"/><circle cx="27" cy="95" r="0.5"/><circle cx="62" cy="90" r="0.5"/><circle cx="58" cy="98" r="0.5"/><circle cx="63" cy="95" r="0.5"/><circle cx="33" cy="70" r="0.5"/><circle cx="37" cy="78" r="0.5"/><circle cx="57" cy="70" r="0.5"/><circle cx="53" cy="78" r="0.5"/><circle cx="43" cy="60" r="0.5"/><circle cx="47" cy="62" r="0.5"/></g><path d="M 36 40 L 54 40" stroke="#d2b48c" stroke-width="3" fill="none" stroke-linecap="round"/><g stroke="#88aacc" stroke-width="1" fill="none"><path d="M 42 42 C 35 60 30 80 25 100"/><path d="M 48 42 C 55 60 60 80 65 100"/><path d="M 45 42 L 45 70"/><path d="M 40 38 L 35 20"/><path d="M 50 38 L 55 20"/><path d="M 45 38 L 45 15"/><path d="M 25 125 C 35 132 55 132 65 125"/></g></svg>`
    },
    {
      name: '鸡蛋',
      layout: 'block',
      size: 'large',
      placement: 'vertical-stack',
      viewBox: '0 0 120 160',
      silhouette: 'M 20 15 L 20 145 C 20 150.5 24.5 155 30 155 L 90 155 C 95.5 155 100 150.5 100 145 L 100 15 C 100 9.5 95.5 5 90 5 L 30 5 C 24.5 5 20 9.5 20 15 Z',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160"><path d="M 20 15 L 20 145 C 20 150.5 24.5 155 30 155 L 90 155 C 95.5 155 100 150.5 100 145 L 100 15 C 100 9.5 95.5 5 90 5 L 30 5 C 24.5 5 20 9.5 20 15 Z" stroke="#9aa0a6" stroke-width="2" fill="none"/><rect x="24" y="9" width="72" height="142" rx="4" stroke="#9aa0a6" stroke-width="1" fill="none"/><circle cx="46" cy="35" r="3" stroke="#9aa0a6" stroke-width="1.5" fill="none"/><circle cx="46" cy="65" r="3" stroke="#9aa0a6" stroke-width="1.5" fill="none"/><circle cx="46" cy="95" r="3" stroke="#9aa0a6" stroke-width="1.5" fill="none"/><circle cx="46" cy="125" r="3" stroke="#9aa0a6" stroke-width="1.5" fill="none"/><circle cx="73" cy="35" r="3" stroke="#9aa0a6" stroke-width="1.5" fill="none"/><circle cx="73" cy="65" r="3" stroke="#9aa0a6" stroke-width="1.5" fill="none"/><circle cx="73" cy="95" r="3" stroke="#9aa0a6" stroke-width="1.5" fill="none"/><circle cx="73" cy="125" r="3" stroke="#9aa0a6" stroke-width="1.5" fill="none"/><g stroke="#9aa0a6" stroke-width="1" fill="none"><line x1="24" y1="35" x2="43" y2="35"/><line x1="49" y1="35" x2="70" y2="35"/><line x1="76" y1="35" x2="96" y2="35"/><line x1="24" y1="65" x2="43" y2="65"/><line x1="49" y1="65" x2="70" y2="65"/><line x1="76" y1="65" x2="96" y2="65"/><line x1="24" y1="95" x2="43" y2="95"/><line x1="49" y1="95" x2="70" y2="95"/><line x1="76" y1="95" x2="96" y2="95"/><line x1="24" y1="125" x2="43" y2="125"/><line x1="49" y1="125" x2="70" y2="125"/><line x1="76" y1="125" x2="96" y2="125"/><line x1="46" y1="9" x2="46" y2="32"/><line x1="46" y1="38" x2="46" y2="62"/><line x1="46" y1="68" x2="46" y2="92"/><line x1="46" y1="98" x2="46" y2="122"/><line x1="46" y1="128" x2="46" y2="151"/><line x1="73" y1="9" x2="73" y2="32"/><line x1="73" y1="38" x2="73" y2="62"/><line x1="73" y1="68" x2="73" y2="92"/><line x1="73" y1="98" x2="73" y2="122"/><line x1="73" y1="128" x2="73" y2="151"/></g><g stroke="#e69b55" stroke-width="2" fill="none"><ellipse cx="33" cy="20" rx="12" ry="10"/><path d="M 30 16 C 28 18 28 22 30 24" stroke-width="1"/><ellipse cx="33" cy="50" rx="12" ry="10"/><path d="M 30 46 C 28 48 28 52 30 54" stroke-width="1"/><ellipse cx="33" cy="80" rx="12" ry="10"/><path d="M 30 76 C 28 78 28 82 30 84" stroke-width="1"/><ellipse cx="33" cy="110" rx="12" ry="10"/><path d="M 30 106 C 28 108 28 112 30 114" stroke-width="1"/><ellipse cx="33" cy="140" rx="12" ry="10"/><path d="M 30 136 C 28 138 28 142 30 144" stroke-width="1"/><ellipse cx="60" cy="20" rx="12" ry="10"/><path d="M 57 16 C 55 18 55 22 57 24" stroke-width="1"/><ellipse cx="60" cy="50" rx="12" ry="10"/><path d="M 57 46 C 55 48 55 52 57 54" stroke-width="1"/><ellipse cx="60" cy="80" rx="12" ry="10"/><path d="M 57 76 C 55 78 55 82 57 84" stroke-width="1"/><ellipse cx="60" cy="110" rx="12" ry="10"/><path d="M 57 106 C 55 108 55 112 57 114" stroke-width="1"/><ellipse cx="60" cy="140" rx="12" ry="10"/><path d="M 57 136 C 55 138 55 142 57 144" stroke-width="1"/><ellipse cx="87" cy="20" rx="12" ry="10"/><path d="M 84 16 C 82 18 82 22 84 24" stroke-width="1"/><ellipse cx="87" cy="50" rx="12" ry="10"/><path d="M 84 46 C 82 48 82 52 84 54" stroke-width="1"/><ellipse cx="87" cy="80" rx="12" ry="10"/><path d="M 84 76 C 82 78 82 82 84 84" stroke-width="1"/><ellipse cx="87" cy="110" rx="12" ry="10"/><path d="M 84 106 C 82 108 82 112 84 114" stroke-width="1"/><ellipse cx="87" cy="140" rx="12" ry="10"/><path d="M 84 136 C 82 138 82 142 84 144" stroke-width="1"/></g></svg>`
    }
  ];
  window.petalFridgeAiInstructionContext = `${aiSystemPrompt}\n\n精细度参考 SVG：${JSON.stringify(drawingReferenceSvgs)}`;
  const builtInFoodArtworkNames = new Set(['火腿肠', '鹌鹑蛋', '鸡蛋']);
  window.petalDefaultFridgeSvgs.push(...drawingReferenceSvgs
    .filter(entry => builtInFoodArtworkNames.has(entry.name))
    .map(entry => ({
      name: entry.name,
      aliases: [entry.name],
      layout: entry.layout,
      size: entry.size,
      placement: entry.placement,
      viewBox: entry.viewBox,
      silhouette: entry.silhouette,
      svg: entry.svg
    })));

  async function organizeFridge() {
    if (organizing) return;
    const button = $('organizeFridge');
    const status = $('fridgeOrganizerStatus');
    let initialData;
    try {
      initialData = readData();
    } catch (error) {
      status.textContent = error.message;
      return;
    }
    const inventory = activeInventory(initialData);
    if (!inventory.length) {
      status.textContent = '库存为空，请先添加食材。';
      return;
    }
    try {
      validateArrangementCapacity(inventory);
    } catch (error) {
      status.textContent = error.message;
      return;
    }
    const library = validLibrary(initialData);
    const missing = inventory.filter(item => !findArtwork(library, item.name));
    organizing = true;
    button.disabled = true;
    $('shuffleFridgeSpacing').disabled = true;
    try {
      let generated = [];
      if (missing.length) {
        if (typeof window.petalRequestDrawing !== 'function') throw new Error('绘画 AI 尚未就绪，请刷新页面后重试。');
        status.textContent = `SVG 库缺少 ${missing.length} 种食材图案，正在请求绘画 AI 绘制……`;
        const stockPayload = inventory.map(item => ({
          name: item.name,
          amount: Number(item.amount) || 0,
          amountUnit: item.amountUnit || '',
          quantity: Number(item.quantity) || 0,
          packageUnit: item.packageUnit || ''
        }));
        const response = await window.petalRequestDrawing({
          system: `${aiSystemPrompt}\n\n精细度参考 SVG（学习轮廓、分层、包装结构和细节描线，不要照抄示例内容）：${JSON.stringify(drawingReferenceSvgs)}\n\n以下用户自定义绘制指令优先于与其冲突的通用描述；食材描边颜色必须遵循食材真实颜色：${initialData.settings?.prompts?.fridgeDrawingInstructions ?? window.petalDefaultFridgeDrawingInstructions}`,
          user: `完整库存数据：${JSON.stringify(stockPayload)}。请只为这些缺少图案的食材绘制 SVG：${JSON.stringify(missing.map(item => item.name))}`
        });
        const latest = readData();
        const latestInventory = activeInventory(latest);
        if (inventorySignature(latestInventory) !== inventorySignature(inventory)) throw new Error('等待 AI 绘图期间库存已变化，请重新点击“整理冰箱”。');
        generated = parseAiResult(response, missing);
      }
      const latest = readData();
      const latestInventory = activeInventory(latest);
      if (inventorySignature(latestInventory) !== inventorySignature(inventory)) throw new Error('整理期间库存已变化，请重新点击“整理冰箱”。');
      const mergedLibrary = [...validLibrary(latest), ...generated.filter(entry => !findArtwork(validLibrary(latest), entry.name))];
      const items = planArrangement(latestInventory, mergedLibrary);
      latest.fridgeSvgLibrary = mergedLibrary;
      latest.fridgeArrangement = { version: 7, signature: inventorySignature(latestInventory), items, createdAt: new Date().toISOString() };
      writeData(latest);
      renderLibrary();
      renderArrangement(latest);
      status.textContent = `${generated.length ? `已将 ${generated.length} 个新图案保存到 SVG 库；` : ''}已按库存数量整理冰箱。`;
    } catch (error) {
      console.error('整理冰箱失败', error);
      status.textContent = `整理失败：${error.message}`;
    } finally {
      organizing = false;
      button.disabled = false;
      $('shuffleFridgeSpacing').disabled = false;
    }
  }

  $('organizeFridge').addEventListener('click', organizeFridge);
  $('shuffleFridgeSpacing').addEventListener('click', () => {
    if (organizing) return;
    try {
      const data = readData();
      const inventory = activeInventory(data);
      const library = validLibrary(data);
      data.fridgeArrangement = { version: 7, signature: inventorySignature(inventory), items: planArrangement(inventory, library), createdAt: new Date().toISOString() };
      writeData(data);
      renderArrangement(data);
    } catch (error) {
      console.error('随机调整食材间距失败', error);
      $('fridgeOrganizerStatus').textContent = `调整失败：${error.message}`;
    }
  });
  window.addEventListener('petal-data-updated', () => {
    try {
      const data = readData();
      renderLibrary();
      renderArrangement(data);
    } catch (error) {
      console.error('刷新冰箱 SVG 视图失败', error);
      $('fridgeOrganizerStatus').textContent = error.message;
    }
  });
  window.addEventListener('petal-data-cleared', () => {
    const data = readData();
    data.fridgeSvgLibrary = window.petalDefaultFridgeSvgs.map(entry => ({ ...entry, id: `builtin-${normalizeName(entry.name)}`, builtIn: true }));
    data.fridgeArrangement = null;
    writeData(data);
  });

  try {
    const data = readData();
    const inventory = activeInventory(data);
    const library = validLibrary(data);
    if (data.fridgeArrangement && data.fridgeArrangement.version !== 7 && inventory.length && inventory.every(item => findArtwork(library, item.name))) {
      data.fridgeArrangement = { version: 7, signature: inventorySignature(inventory), items: planArrangement(inventory, library), createdAt: new Date().toISOString() };
      writeData(data);
    }
    const previousLibrary = JSON.stringify(Array.isArray(data.fridgeSvgLibrary) ? data.fridgeSvgLibrary : []);
    const builtInNames = new Set(window.petalDefaultFridgeSvgs.map(entry => normalizeName(entry.name)));
    const customArtworks = (Array.isArray(data.fridgeSvgLibrary) ? data.fridgeSvgLibrary : [])
      .filter(entry => !builtInNames.has(normalizeName(entry?.name)) && !entry?.builtIn);
    data.fridgeSvgLibrary = [
      ...window.petalDefaultFridgeSvgs.map(entry => ({ ...entry, id: `builtin-${normalizeName(entry.name)}`, builtIn: true })),
      ...customArtworks.map(normalizeArtwork).filter(Boolean)
    ];
    if (previousLibrary !== JSON.stringify(data.fridgeSvgLibrary)) writeData(data);
    renderLibrary();
    renderArrangement(data);
  } catch (error) {
    console.error('初始化冰箱 SVG 库失败', error);
    $('fridgeOrganizerStatus').textContent = error.message;
  }
})();
