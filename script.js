// 页面脚本使用独立作用域，避免变量和函数与网页其他代码冲突。
(() => {
  // 本地数据：定义保存位置、空白数据结构，并读取浏览器里已有的记录。
  const KEY='petalJournal.v1';
  const $=id=>document.getElementById(id);
  const BUILTIN_FRIDGE_SVGS = [
    {name:'草莓',aliases:['草莓'],layout:'irregular',size:'small',placement:'bulk-stack',viewBox:'-40 -65 80 70',silhouette:'M0,0 C-24,0 -34,-27 -22,-46 C-13,-58 13,-58 22,-46 C34,-27 24,0 0,0 Z M-21,-46 Q-7,-37 0,-47 Q7,-37 21,-46 Q10,-55 4,-51 L0,-60 L-4,-51 Q-10,-55 -21,-46 Z',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-40 -65 80 70"><path d="M-21,-45 C-33,-26 -24,0 0,0 C24,0 33,-26 21,-45" fill="none" stroke="#ff85b3" stroke-width="2.5"/><path d="M-15,-36 C-19,-24 -15,-11 -5,-6" fill="none" stroke="#ffc2dc" stroke-width="1.8"/><path d="M-21,-46 Q-7,-37 0,-47 Q7,-37 21,-46 Q10,-55 4,-51 L0,-60 L-4,-51 Q-10,-55 -21,-46 Z" fill="none" stroke="#80e8b6" stroke-width="2.3"/><circle cx="-6" cy="-28" r="1.5" fill="none" stroke="#ff85b3" stroke-width="1.5"/><circle cx="6" cy="-22" r="1.5" fill="none" stroke="#ff85b3" stroke-width="1.5"/><circle cx="-1" cy="-14" r="1.5" fill="none" stroke="#ffeaf3" stroke-width="1.5"/></svg>'},
    {name:'鸡胸',aliases:['鸡胸','鸡胸肉'],layout:'irregular',size:'medium',placement:'stack',viewBox:'-55 -45 110 60',silhouette:'M-48,-12 C-52,-29 -26,-41 7,-38 C35,-36 53,-25 49,-12 L49,-10 C52,-1 41,6 14,9 C-22,11 -50,4 -48,-10 Z',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-55 -45 110 60"><defs><linearGradient id="fridgeChickenStroke" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff78b0"/><stop offset="50%" stop-color="#ffc2dc"/><stop offset="100%" stop-color="#ffffff"/></linearGradient></defs><path d="M-48,-11 C-50,4 -22,11 14,9 C41,6 52,-1 49,-12" fill="none" stroke="url(#fridgeChickenStroke)" stroke-width="2.2"/><path d="M-48,-12 C-52,-29 -26,-41 7,-38 C35,-36 53,-25 49,-12 C46,1 18,5 -14,2 C-36,1 -46,-5 -48,-12 Z" fill="none" stroke="url(#fridgeChickenStroke)" stroke-width="2.5"/><path d="M-29,-25 Q-2,-31 26,-22 M-19,-15 Q7,-20 31,-12" fill="none" stroke="#ffeaf3" stroke-width="1.8"/></svg>'},
    {name:'青椒',aliases:['青椒'],layout:'irregular',size:'medium',placement:'light-stack',viewBox:'-40 -70 80 75',silhouette:'M-14,-52 C-30,-52 -34,-26 -24,-4 C-18,4 -10,2 -5,-2 C-1,4 1,4 5,-2 C10,2 18,4 24,-4 C34,-26 30,-52 14,-52 C7,-52 4,-47 0,-47 C-4,-47 -7,-52 -14,-52 Z',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-40 -70 80 75"><path d="M0,-52 C0,-63 8,-67 14,-63" fill="none" stroke="#80e8b6" stroke-width="3.2"/><path d="M-14,-52 C-30,-52 -34,-26 -24,-4 C-18,4 -10,2 -5,-2 C-1,4 1,4 5,-2 C10,2 18,4 24,-4 C34,-26 30,-52 14,-52 C7,-52 4,-47 0,-47 C-4,-47 -7,-52 -14,-52 Z" fill="none" stroke="#80e8b6" stroke-width="2.4"/><path d="M-8,-46 C-12,-31 -11,-13 -5,-2 M8,-46 C12,-31 11,-13 5,-2" fill="none" stroke="#ffeaf3" stroke-width="1.8"/></svg>'},
    {name:'豆腐',aliases:['豆腐'],layout:'block',size:'medium',placement:'vertical-stack',viewBox:'-55 -45 110 55',silhouette:'M0,-40 L50,-28 50,-7 0,5 -50,-7 -50,-28 Z',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-55 -45 110 55"><polygon points="0,-40 50,-28 0,-16 -50,-28" fill="none" stroke="#dcd8e6" stroke-width="2.4"/><polyline points="-50,-28 -50,-7 0,5 0,-16" fill="none" stroke="#dcd8e6" stroke-width="2.4"/><polyline points="0,5 50,-7 50,-28" fill="none" stroke="#dcd8e6" stroke-width="2.4"/><line x1="-30" y1="-27" x2="-5" y2="-33" stroke="#fff" stroke-width="2"/></svg>'},
    {name:'鲜奶',aliases:['鲜奶','牛奶'],layout:'bottle',size:'large',placement:'parallel',viewBox:'-35 -130 70 135',silhouette:'M-26,0 -26,-88 -15,-112 -15,-122 15,-122 15,-112 26,-88 26,0 Z',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-35 -130 70 135"><rect x="-26" y="-88" width="52" height="88" rx="2" fill="none" stroke="#ffeaf3" stroke-width="2.5"/><polygon points="-26,-88 26,-88 15,-112 -15,-112" fill="none" stroke="#ffeaf3" stroke-width="2.5"/><polyline points="-18,-88 0,-106 18,-88" fill="none" stroke="#ffeaf3" stroke-width="1.8"/><ellipse cx="0" cy="-96" rx="5.5" ry="3.5" fill="none" stroke="#ff85b3" stroke-width="1.8"/><rect x="-15" y="-121" width="30" height="9" rx="2" fill="none" stroke="#ffeaf3" stroke-width="2.3"/><path d="M-26,-46 Q-13,-53 0,-46 T26,-46" fill="none" stroke="#ff85b3" stroke-width="1.9"/><line x1="-18" y1="-78" x2="-18" y2="-10" stroke="#fff" stroke-width="2.2"/></svg>'},
    {name:'气泡饮',aliases:['气泡饮','汽水'],layout:'bottle',size:'large',placement:'parallel',viewBox:'-35 -135 70 145',silhouette:'M-14,-127 L14,-127 14,-119 12,-119 14,-89 C25,-73 28,-59 28,-36 L26,-3 C26,5 15,8 0,8 -15,8 -26,5 -26,-3 L-28,-36 C-28,-59 -25,-73 -14,-89 L-12,-119 -14,-119 Z',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-35 -135 70 145"><path d="M-12,-119 L12,-119 L14,-89 C25,-73 28,-59 28,-36 L26,-2 C26,3 15,5 0,5 C-15,5 -26,3 -26,-2 L-28,-36 C-28,-59 -25,-73 -14,-89 Z" fill="none" stroke="#ffeaf3" stroke-width="2.5"/><line x1="-22" y1="-64" x2="22" y2="-64" stroke="#ff85b3" stroke-width="1.8"/><rect x="-14" y="-127" width="28" height="8" rx="3" fill="none" stroke="#ffeaf3" stroke-width="2.2"/><path d="M-18,-56 C-19,-40 -19,-20 -16,-6" fill="none" stroke="#ffeaf3" stroke-width="2.4"/><circle cx="-4" cy="-24" r="3.2" fill="none" stroke="#ffeaf3" stroke-width="1.8"/><circle cx="7" cy="-42" r="4.2" fill="none" stroke="#ff85b3" stroke-width="1.8"/></svg>'}
  ];
  window.petalDefaultFridgeSvgs=BUILTIN_FRIDGE_SVGS;
  const DEFAULT_BUBBLE_PRESET={id:'default-bubble-style',name:'默认',css:''};
  const DEFAULT_CHAT_SUMMARY_PROMPT='请客观、简洁地概括对话中发生了什么，使用第三人称叙述并按需标明各方观点或互动，不加修饰、不评价、不推测。只输出总结正文，最多250字，尽量控制在150字左右。';
  const DEFAULT_HEALTH_SUMMARY_PROMPT='请根据记录简洁总结近期生活习惯和身体状态，最多200字。概括睡眠、饮食、活动及明确的不适或感受；可在事实基础上谨慎说明习惯与状态之间可能的关联，使用“可能”等表述，不作诊断、不补充未提供的事实、不评价，只输出总结正文。';
  const LEGACY_FRIDGE_DRAWING_INSTRUCTIONS='食材轮廓要能辨认且有真实体积结构，不画简笔符号；线条颜色优先使用食材本身的真实颜色，例如西红柿果实用红色、叶子用绿色，其他食材也按其自然颜色描绘；瓶装饮品采用正平视、对称直立造型；方块食物表现顶面与侧面；肉类画饱满弧线和肌理；蔬果画自然曲线与叶蒂。';
  const DEFAULT_FRIDGE_DRAWING_INSTRUCTIONS='先结合食材名称、库存数量和量词/包装单位理解实际物品，再决定画什么；区分“食材有几个”和“一个包装里装了多少食材”。“西红柿两颗”“鸡蛋三个”等以颗、个、只、枚等表示单件数量的，只画一个有代表性的单个食材图案，不要按数量重复画。“鸡蛋一板”“榴莲肉一袋”“冻饺子一包”等以板、袋、包、大包等表示一份包装内含多个食材的量词，要画一份完整包装及其中多个可辨认的食材，表现为“一板鸡蛋/一袋榴莲肉/一包冻饺子”，不要误画成单个鸡蛋、一块榴莲肉或一个饺子；包、袋、板、托、盒、桶、箱、篮、筐等应结合具体食材判断是否为多件包装，不要机械套用，瓶、罐等若通常只装一个整体食材则画单个容器与内容物。库存数量表示有几份/几包时，图案仍只画一份有代表性的食材或包装，不按库存份数重复铺图。食材轮廓要能辨认且有真实体积结构，不画简笔符号；线条颜色按食材本色绘制，例如西红柿果实用红色、叶子用绿色；瓶装饮品采用正平视、对称直立造型；方块食物表现顶面与侧面；肉类画饱满弧线和肌理；蔬果画自然曲线与叶蒂。';
  const FRIDGE_DRAWING_SIZE_GUIDANCE='尺寸分类要符合实际摆放视觉：小型目标外接框 58×54，中型 120×104，大型 150×170，超大型 360×88。大型图案必须明显大于中型，细长物体高度尽量接近 170，横向或多件包装应明显更宽；多件食材包装大多数时候归为大型，按整包尺寸判断，只有确实需要占据大部分格宽时才用超大型。';
  const LEGACY_FRIDGE_DRAWING_SIZE_GUIDANCE='尺寸分类要符合实际摆放视觉：小型目标外接框 58×54，中型 104×82，大型 150×170，超大型 360×88。大型图案必须明显大于中型，细长物体高度尽量接近 170，横向或多件包装应明显更宽；多件食材包装大多数时候归为大型，按整包尺寸判断，只有确实需要占据大部分格宽时才用超大型。';
  let migratedFridgeDrawingInstructions=false;
  window.petalDefaultFridgeDrawingInstructions=`${DEFAULT_FRIDGE_DRAWING_INSTRUCTIONS} ${FRIDGE_DRAWING_SIZE_GUIDANCE}`;
  const LEGACY_CHAT_SUMMARY_PROMPT='请把所选对话归纳成简洁、客观、可供后续对话参考的长期记忆。保留明确偏好、重要背景和未完成事项，不补充推测，不评价用户。只输出总结正文。';
  const LEGACY_HEALTH_SUMMARY_PROMPT='你是健康记录整理助手。请使用用户提供的记录撰写中性、简洁的回顾；不诊断疾病、不做价值判断、不补充未提供的事实。只返回总结正文。';
  const BUILTIN_BUBBLE_PRESETS=[{id:'starry-rabbit-default',name:'星空兔兔',css:String.raw`.message-bubble.user,.message-bubble.ai{min-width:28px!important;min-height:24px!important;height:auto!important;border-radius:25px!important;background-color:rgba(255,255,255,.02)!important;backdrop-filter:blur(6px)!important;-webkit-backdrop-filter:blur(6px)!important;position:relative!important;display:inline-block!important;width:fit-content!important;max-width:75%!important;margin-top:18px!important;padding-top:12px!important;padding-bottom:10px!important;font-size:13px!important;line-height:1.5!important;text-align:left!important;word-wrap:break-word!important;z-index:0!important}
.message-bubble.user{margin-left:auto!important;margin-right:8px!important;padding-left:24px!important;padding-right:16px!important;border:1.2px solid rgba(255,198,224,.78)!important;color:#fff5fa!important;text-shadow:0 0 6px rgba(255,182,213,.5)!important;box-shadow:0 0 12px rgba(255,183,210,.35),0 0 24px rgba(168,237,234,.18),inset 0 0 15px rgba(255,198,224,.22)!important;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cdefs%3E%3Cfilter id='g'%3E%3CfeGaussianBlur stdDeviation='1.5' result='b'/%3E%3CfeMerge%3E%3CfeMergeNode in='b'/%3E%3CfeMergeNode in='SourceGraphic'/%3E%3C/feMerge%3E%3C/filter%3E%3C/defs%3E%3Ccircle cx='14' cy='30' r='5.5' fill='%23ff9ebb' opacity='0.65' filter='url(%23g)'/%3E%3Ccircle cx='46' cy='30' r='5.5' fill='%23a8edea' opacity='0.65' filter='url(%23g)'/%3E%3Ccircle cx='18.5' cy='25' r='2.8' fill='%23ffe6f2'/%3E%3Ccircle cx='41.5' cy='25' r='2.8' fill='%23ffe6f2'/%3E%3Cpath d='M 23 32 Q 26.5 35 30 31 Q 33.5 35 37 32' stroke='%23ffd1dc' stroke-width='2.5' fill='none' stroke-linecap='round'/%3E%3Cpath d='M 30 8 L 31.5 13 L 36.5 14.5 L 31.5 16 L 30 21 L 28.5 16 L 23.5 14.5 L 28.5 13 Z' fill='%23a8edea' opacity='0.9'/%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ctext x='6' y='28' font-size='14' fill='%23a8edea' opacity='0.75'%3E❃♢%3C/text%3E%3C/svg%3E"),radial-gradient(circle at 50% 50%,rgba(255,182,213,.3),rgba(168,237,234,.2) 45%,transparent 75%)!important;background-repeat:no-repeat,no-repeat,no-repeat!important;background-size:22px 22px,28px 28px,100% 100%!important;background-position:8px 1px,right 6px bottom -4px,center!important}
.message-bubble.ai{margin-right:auto!important;margin-left:8px!important;padding-left:16px!important;padding-right:24px!important;border:1.2px solid rgba(168,237,234,.78)!important;color:#f0fcff!important;text-shadow:0 0 6px rgba(168,237,234,.5)!important;box-shadow:0 0 12px rgba(168,237,234,.35),0 0 24px rgba(255,183,210,.18),inset 0 0 15px rgba(168,237,234,.22)!important;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Ccircle cx='14' cy='30' r='5.5' fill='%23a8edea' opacity='0.65'/%3E%3Ccircle cx='46' cy='30' r='5.5' fill='%23ff9ebb' opacity='0.65'/%3E%3Ccircle cx='18.5' cy='25' r='2.8' fill='%23e6ffff'/%3E%3Ccircle cx='41.5' cy='25' r='2.8' fill='%23e6ffff'/%3E%3Cpath d='M 23 32 Q 26.5 35 30 31 Q 33.5 35 37 32' stroke='%23a8edea' stroke-width='2.5' fill='none' stroke-linecap='round'/%3E%3Cpath d='M 30 8 L 31.5 13 L 36.5 14.5 L 31.5 16 L 30 21 L 28.5 16 L 23.5 14.5 L 28.5 13 Z' fill='%23ffd1dc' opacity='0.9'/%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ctext x='4' y='28' font-size='14' fill='%23ffd1dc' opacity='0.75'%3E♢❃%3C/text%3E%3C/svg%3E"),radial-gradient(circle at 50% 50%,rgba(168,237,234,.34),rgba(186,225,255,.24) 36%,rgba(255,209,220,.15) 56%,transparent 76%)!important;background-repeat:no-repeat,no-repeat,no-repeat!important;background-size:22px 22px,28px 28px,100% 100%!important;background-position:right 8px top 1px,left 6px bottom -4px,center!important}
.message-bubble.user .content,.message-bubble.ai .content{position:relative;min-width:10px;overflow:visible;background:transparent;box-shadow:none}
.message-bubble.user::before,.message-bubble.ai::before{content:''!important;display:block!important;position:absolute!important;width:28px!important;height:15px!important;top:-12px!important;background-repeat:no-repeat!important;background-size:100% 100%!important;z-index:2!important}
.message-bubble.user::before{left:14px!important;filter:drop-shadow(0 0 5px rgba(255,209,220,.85))!important;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='20' viewBox='0 0 36 20'%3E%3Cdefs%3E%3ClinearGradient id='mac1' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23ffd1dc'/%3E%3Cstop offset='50%25' stop-color='%23e0c3fc'/%3E%3Cstop offset='100%25' stop-color='%23a8edea'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M 4 19 C 2 8, 9 1, 13 4 C 16 6, 15 14, 14 19' fill='rgba(255,209,220,0.28)' stroke='url(%23mac1)' stroke-width='1.5' stroke-linecap='round'/%3E%3Cpath d='M 18 19 C 19 7, 27 1, 31 5 C 34 8, 29 15, 26 19' fill='rgba(168,237,234,0.28)' stroke='url(%23mac1)' stroke-width='1.5' stroke-linecap='round'/%3E%3Ccircle cx='17' cy='5' r='1.8' fill='%23fff'/%3E%3C/svg%3E")!important}
.message-bubble.ai::before{right:14px!important;left:auto!important;filter:drop-shadow(0 0 5px rgba(168,237,234,.85))!important;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='20' viewBox='0 0 36 20'%3E%3Cdefs%3E%3ClinearGradient id='mac2' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23a8edea'/%3E%3Cstop offset='50%25' stop-color='%23bae1ff'/%3E%3Cstop offset='100%25' stop-color='%23ffd1dc'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M 4 19 C 2 8, 9 1, 13 4 C 16 6, 15 14, 14 19' fill='rgba(168,237,234,0.28)' stroke='url(%23mac2)' stroke-width='1.5' stroke-linecap='round'/%3E%3Cpath d='M 18 19 C 19 7, 27 1, 31 5 C 34 8, 29 15, 26 19' fill='rgba(255,209,220,0.28)' stroke='url(%23mac2)' stroke-width='1.5' stroke-linecap='round'/%3E%3Ccircle cx='17' cy='5' r='1.8' fill='%23fff'/%3E%3C/svg%3E")!important}
.message-bubble.user::after,.message-bubble.ai::after{content:''!important;display:block!important;position:absolute!important;width:14px!important;height:18px!important;top:4px!important;background-color:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;background-repeat:no-repeat!important;background-size:100% 100%!important;z-index:2!important}
.message-bubble.user::after{right:-9px!important;filter:drop-shadow(0 0 6px #a8edea)!important;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='20' viewBox='0 0 16 20'%3E%3Cpath d='M 1 12 C 6 4, 15 5, 15 13 C 15 18, 6 19, 1 12 Z' fill='%23ffd1dc' stroke='%23a8edea' stroke-width='1.2'/%3E%3Ccircle cx='11' cy='12' r='2.5' fill='%23fff'/%3E%3C/svg%3E")!important}
.message-bubble.ai::after{left:-9px!important;filter:drop-shadow(0 0 6px #ffd1dc)!important;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='20' viewBox='0 0 16 20'%3E%3Cpath d='M 15 12 C 10 4, 1 5, 1 13 C 1 18, 10 19, 15 12 Z' fill='%23a8edea' stroke='%23ffd1dc' stroke-width='1.2'/%3E%3Ccircle cx='5' cy='12' r='2.5' fill='%23fff'/%3E%3C/svg%3E")!important}`}];
  const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const todayOffset=days=>{const d=new Date();d.setDate(d.getDate()+days);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const timeNow=()=>{const d=new Date();return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`};
  const emptyData=()=>({sleep:[],food:[],bowel:[],weight:[],joy:[],fridgeInventory:[],fridgeRecords:[],todos:[],todayNote:null,memories:[],memoryArchives:[],chatSummaries:[],foodAnalyses:[],healthAnalysisRecords:[],stickers:[],stickerCategories:['默认'],chat:[],hiddenHealthDates:[],settings:{api:{provider:'openai',model:'',base:''},analysisApi:{provider:'openai',model:'',base:''},weather:{city:''},apiPresets:{chat:[],analysis:[]},chatMemoryArchiveIds:[],chatMemoryArchiveIdsConfigured:false,dietGoals:{waterMl:2000,caloriesKcal:0,proteinG:0,carbohydrateG:250,fatG:65,fiberG:25},tokenSettings:{chatHistoryTokenLimit:6000,autoSummaryTokenThreshold:4000,healthMemoryAutoSummaryTokenThreshold:4000,lastAutoSummaryIndex:0,lastChatSummaryReminderLevel:0},voice:{input:false,output:false,provider:'minimax',apiKey:'',groupId:'',base:'https://api.minimax.cn/v1/t2a_v2',model:'speech-2.8-hd',voiceId:'female-shaonv',speed:1,pitch:0,notes:''},prompts:{system:'',promptPresets:[],characters:[{id:'default-character',name:'温柔陪伴',prompt:''}],activeCharacterId:'default-character',fridgeDrawingInstructions:DEFAULT_FRIDGE_DRAWING_INSTRUCTIONS},analysisPrompts:{chatSummary:'请把所选对话归纳成简洁、客观、可供后续对话参考的长期记忆。保留明确偏好、重要背景和未完成事项，不补充推测，不评价用户。只输出总结正文。',healthMemorySummary:'你是健康记录整理助手。请使用用户提供的记录撰写中性、简洁的回顾；不诊断疾病、不做价值判断、不补充未提供的事实。只返回总结正文。'},appearance:{chatBlur:18,chatOpacity:78,chatFontFamily:'system',chatBubbleFontSize:13,chatBubblePaddingY:8,chatMessageGap:8,backgroundImage:'',bubbleCss:''},reduceMotion:false}});
  let data=emptyData();
  data.healthAnalysisRecords=Array.isArray(data.healthAnalysisRecords)?data.healthAnalysisRecords:[];
  try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&typeof saved==='object')data={...emptyData(),...saved,joy:Array.isArray(saved.joy)?saved.joy:[],memoryArchives:Array.isArray(saved.memoryArchives)?saved.memoryArchives:[],foodAnalyses:Array.isArray(saved.foodAnalyses)?saved.foodAnalyses:[],stickers:Array.isArray(saved.stickers)?saved.stickers:[],stickerCategories:Array.isArray(saved.stickerCategories)?saved.stickerCategories:['默认'],settings:{...emptyData().settings,...(saved.settings||{}),api:{...emptyData().settings.api,...(saved.settings?.api||{})},voice:{...emptyData().settings.voice,...(saved.settings?.voice||{})},analysisPrompts:{...emptyData().settings.analysisPrompts,...(saved.settings?.analysisPrompts||{})},prompts:{...emptyData().settings.prompts,...(saved.settings?.prompts||{}),promptPresets:Array.isArray(saved.settings?.prompts?.promptPresets)?saved.settings.prompts.promptPresets:[],characters:Array.isArray(saved.settings?.prompts?.characters)&&saved.settings.prompts.characters.length?saved.settings.prompts.characters:emptyData().settings.prompts.characters}}}}catch(e){}
  data.fridgeSvgLibrary=Array.isArray(data.fridgeSvgLibrary)?data.fridgeSvgLibrary:BUILTIN_FRIDGE_SVGS;
  if(!Object.prototype.hasOwnProperty.call(data,'fridgeArrangement'))data.fridgeArrangement=null;
  data.settings.drawingApi={provider:'openai',model:'',base:'',...(data.settings.drawingApi||{})};
  data.settings.analysisPrompts={chatSummary:DEFAULT_CHAT_SUMMARY_PROMPT,healthMemorySummary:DEFAULT_HEALTH_SUMMARY_PROMPT,...(data.settings.analysisPrompts||{})};
  if(data.settings.analysisPrompts.chatSummary===LEGACY_CHAT_SUMMARY_PROMPT)data.settings.analysisPrompts.chatSummary=DEFAULT_CHAT_SUMMARY_PROMPT;
  if(data.settings.analysisPrompts.healthMemorySummary===LEGACY_HEALTH_SUMMARY_PROMPT)data.settings.analysisPrompts.healthMemorySummary=DEFAULT_HEALTH_SUMMARY_PROMPT;
  if(data.memories.length&&!data.memoryArchives.some(archive=>archive.id==='legacy-archive'))data.memoryArchives.push({id:'legacy-archive',name:'我的存档',createdAt:today(),items:data.memories.map(memory=>({...memory,type:memory.type==='待办 / 未完成话题'?'待办':memory.type||'其他'}))});
  data.todos=Array.isArray(data.todos)?data.todos:[];data.fridgeInventory=Array.isArray(data.fridgeInventory)?data.fridgeInventory:[];data.fridgeRecords=Array.isArray(data.fridgeRecords)?data.fridgeRecords:[];data.stickerCategorySettings=data.stickerCategorySettings&&typeof data.stickerCategorySettings==='object'?data.stickerCategorySettings:{};data.stickerRecentIds=Array.isArray(data.stickerRecentIds)?data.stickerRecentIds:[];data.settings.dietGoals={...emptyData().settings.dietGoals,...(data.settings.dietGoals||{})};data.todayNote=data.todayNote&&typeof data.todayNote==='object'?data.todayNote:null;
  const demoHomeNote='测试留言：今天也记得给自己一点温柔。';
  if([demoHomeNote,'临时测试数据：按用户说明，稍后可按要求删除。'].includes(data.todayNote?.content||'')){
    data.todayNote=null;
    try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}');if([demoHomeNote,'临时测试数据：按用户说明，稍后可按要求删除。'].includes(saved.todayNote?.content||'')){saved.todayNote=null;localStorage.setItem(KEY,JSON.stringify(saved))}}catch(error){console.error('清理首页测试留言失败',error)}
  }
  if(!data.homeDemoSeeded){
    data.todos.unshift({id:'home-demo-todo',content:'测试待办：饭后散步十分钟',createdAt:today(),completedAt:''});
    let demoArchive=data.memoryArchives.find(archive=>archive.id!=='health-archive'&&archive.id!=='chat-summary-archive');
    if(!demoArchive){demoArchive={id:'home-demo-archive',name:'对话存档',createdAt:today(),items:[]};data.memoryArchives.push(demoArchive)}
    if(!Array.isArray(demoArchive.items))demoArchive.items=[];
    if(!demoArchive.items.some(item=>item.id==='home-demo-favorite'))demoArchive.items.unshift({id:'home-demo-favorite',type:'收藏',date:today(),content:'测试收藏：喜欢清新的花草香和温柔的提醒。',source:'AI 收藏'});
    data.homeDemoSeeded=true;
    try{localStorage.setItem(KEY,JSON.stringify(data))}catch(error){console.error('保存首页测试数据失败',error)}
  }
  if(!data.sleepDemoSeeded){const demoSleep=[{date:today(),hours:7.5,start:'23:20',end:'06:50',quality:'不困，有力气'},{date:todayOffset(-1),hours:7,start:'00:10',end:'07:10',quality:'困，有力气'},{date:todayOffset(-2),hours:6.5,start:'00:40',end:'07:10',quality:'不困，没力气'},{date:todayOffset(-3),hours:8,start:'22:50',end:'06:50',quality:'不困，有力气'},{date:todayOffset(-4),hours:7.25,start:'23:45',end:'07:00',quality:'困，有力气'}];demoSleep.forEach((record,index)=>{record.id=`sleep-demo-${index+1}`;record.note='演示数据 · 可删除';data.sleep.push(record)});data.sleepDemoSeeded=true;try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){}}
  data.memoryArchives.unshift(...['健康记忆'].filter(name=>!data.memoryArchives.some(archive=>archive.id==='health-archive')).map(name=>({id:'health-archive',name,createdAt:today(),system:true,items:[]})));
  if(data.settings.prompts.custom&&!data.settings.prompts.promptPresets.some(preset=>preset.text===data.settings.prompts.custom))data.settings.prompts.promptPresets.push({id:'legacy-prompt',name:'旧自定义指令',text:data.settings.prompts.custom,enabled:false});
  if(data.settings.prompts.persona&&!data.settings.prompts.characters.some(character=>character.name===data.settings.prompts.persona)){const oldCharacter={id:'legacy-character',name:data.settings.prompts.persona,prompt:''};data.settings.prompts.characters.push(oldCharacter);data.settings.prompts.activeCharacterId=oldCharacter.id}
  if(data.settings.prompts.fridgeDrawingInstructions===LEGACY_FRIDGE_DRAWING_INSTRUCTIONS){data.settings.prompts.fridgeDrawingInstructions=DEFAULT_FRIDGE_DRAWING_INSTRUCTIONS;migratedFridgeDrawingInstructions=true}
  if(data.settings.prompts.fridgeDrawingInstructions===DEFAULT_FRIDGE_DRAWING_INSTRUCTIONS){data.settings.prompts.fridgeDrawingInstructions=`${DEFAULT_FRIDGE_DRAWING_INSTRUCTIONS} ${FRIDGE_DRAWING_SIZE_GUIDANCE}`;migratedFridgeDrawingInstructions=true}
  if(typeof data.settings.prompts.fridgeDrawingInstructions==='string'&&data.settings.prompts.fridgeDrawingInstructions.includes(LEGACY_FRIDGE_DRAWING_SIZE_GUIDANCE)){data.settings.prompts.fridgeDrawingInstructions=data.settings.prompts.fridgeDrawingInstructions.replace(LEGACY_FRIDGE_DRAWING_SIZE_GUIDANCE,FRIDGE_DRAWING_SIZE_GUIDANCE);migratedFridgeDrawingInstructions=true}
  data.settings.appearance={...emptyData().settings.appearance,...(data.settings.appearance||{})};data.settings.appearance.chatBubbleGlow??=35;data.settings.appearance.rainIntensity??=0;delete data.settings.appearance.joyHighlight;
  const savedUserProfile=data.settings.prompts.userProfile;
  data.settings.prompts.userProfile=typeof savedUserProfile==='string'?savedUserProfile:savedUserProfile&&typeof savedUserProfile==='object'?[savedUserProfile.name?`姓名/称呼：${savedUserProfile.name}`:'',savedUserProfile.prompt||''].filter(Boolean).join('\n'):'';
  const healthSources=['sleep','food','bowel','weight','joy'];
  const isValidHealthDate=date=>/^\d{4}-\d{2}-\d{2}$/.test(date||'')&&!Number.isNaN(Date.parse(`${date}T00:00:00Z`))&&new Date(`${date}T00:00:00Z`).toISOString().slice(0,10)===date;
  const dailyHealthText=(category,record)=>{
    if(category==='food')return `${record.category?`${record.category}；`:''}${record.content||''}${record.serving?`；${record.serving}`:''}${record.remark||record.note?`；备注：${record.remark||record.note}`:''}`;
    if(category==='sleep')return `${record.hours??'—'}小时${record.start?`；入睡 ${record.start}`:''}${record.end?`；起床 ${record.end}`:''}${record.quality?`；${record.quality}`:''}`;
    if(category==='bowel')return `${record.feeling||'排便记录'}${record.form?`；${record.form}`:''}${record.note?`；${record.note}`:''}`;
    if(category==='weight')return `${record.value??'—'}kg`;
    if(category==='joy')return `${record.time?`${record.time}；`:''}${record.durationMinutes?`${record.durationMinutes}分钟`:'一次'}`;
    return '';
  };
  function dailyHealthRecord(source,date){
    const record={date};
    for(const category of healthSources){
      const entries=(source[category]||[]).filter(item=>item.date===date).map(item=>dailyHealthText(category,item)).filter(Boolean);
      if(category==='food'){
        const water=(source.food||[]).filter(item=>item.date===date&&Number(item.waterMl)>0).map(item=>`饮水；${Number(item.waterMl)}ml`);
        entries.push(...water);
      }
      if(entries.length)record[category]=entries;
    }
    const analyses=(source.foodAnalyses||[]).filter(item=>item.date===date).map(item=>{
      const nutrients=Array.isArray(item.nutrients)?item.nutrients.map(value=>`${value.name||'营养素'}${value.amount??'—'}${value.unit||''}`):[];
      return [item.summary,Number.isFinite(Number(item.caloriesKcal))?`约${Number(item.caloriesKcal)}kcal`:'',...nutrients].filter(Boolean).join('；');
    }).filter(Boolean);
    if(analyses.length)record.food_analysis=analyses;
    const archive=source.memoryArchives?.find(item=>item.id==='health-archive');
    const existing=archive?.items?.find(item=>item.date===date&&item.dailyHealthRecord);
    let existingMemories=[];
    if(existing){try{const prior=JSON.parse(existing.content);if(Array.isArray(prior.health_memory))existingMemories=prior.health_memory}catch(error){console.error('读取每日健康记忆失败',error)}}
    const legacy=(archive?.items||[]).filter(item=>item.date===date&&!item.summary&&!item.dailyHealthRecord&&!healthSources.includes(item.source)&&item.source!=='food_analysis').map(item=>item.content).filter(Boolean);
    const memories=[...new Set([...existingMemories,...legacy])];
    if(memories.length)record.health_memory=memories;
    return Object.keys(record).length>1?record:null;
  }
  function syncDailyHealthMemories(source){
    let archive=source.memoryArchives.find(item=>item.id==='health-archive');
    if(!archive){archive={id:'health-archive',name:'健康记忆',createdAt:today(),system:true,items:[]};source.memoryArchives.unshift(archive)}
    archive.items=Array.isArray(archive.items)?archive.items:[];
    const dates=new Set();
    for(const category of healthSources)(source[category]||[]).forEach(item=>{if(isValidHealthDate(item.date))dates.add(item.date)});
    (source.foodAnalyses||[]).forEach(item=>{if(isValidHealthDate(item.date))dates.add(item.date)});
    archive.items.forEach(item=>{if(isValidHealthDate(item.date)&&!item.summary)dates.add(item.date)});
    const inventory=(source.fridgeInventory||[]).filter(item=>Number(item.amount)>0||Number(item.quantity)>0).map(item=>({
      name:item.name,amount:Number(item.amount)||0,amountUnit:item.amountUnit||'',
      quantity:Number(item.quantity)||0,packageUnit:item.packageUnit||''
    }));
    archive.items=archive.items.filter(item=>!item.permanentInventory);
    if(inventory.length)archive.items.unshift({
      id:'health-fridge-inventory',type:'现有库存',source:'冰箱库存',permanentInventory:true,
      content:JSON.stringify(inventory)
    });
    const summarizedDates=new Set(archive.items.filter(item=>item.summary).flatMap(item=>item.dates||[]));
    const generatedSource=new Set([...healthSources,'food_analysis']);
    const retained=archive.items.filter(item=>item.summary||!isValidHealthDate(item.date));
    for(const date of [...dates].sort()){
      if(summarizedDates.has(date))continue;
      const record=dailyHealthRecord(source,date);
      if(record)retained.push({id:`health-day-${date}`,type:'每日健康记录',date,source:'daily-health-record',dailyHealthRecord:true,content:JSON.stringify(record)});
      else retained.push(...archive.items.filter(item=>item.date===date&&!item.summary&&!item.dailyHealthRecord&&!generatedSource.has(item.source)));
    }
    archive.items=retained;
  }
  window.petalSyncDailyHealthMemories=syncDailyHealthMemories;
  window.petalGetDailyHealthRecord=(source,date)=>{
    const archive=source.memoryArchives?.find(item=>item.id==='health-archive');
    const stored=archive?.items?.find(item=>item.date===date&&item.dailyHealthRecord);
    if(stored){try{return JSON.parse(stored.content)}catch(error){console.error('读取每日健康记忆失败',error)}}
    return dailyHealthRecord(source,date);
  };
  // 常用小工具：保存数据、显示提示、转义文字以及格式化日期和时间。
  let replaceMemoryArchiveId='';
  const save=()=>{
    try{
      const stored=JSON.parse(localStorage.getItem(KEY)||'{}');
      const deletedMemoryIds=new Set(window.petalDeletedMemoryItemIds||[]);
      const deletedArchiveIds=new Set(window.petalDeletedMemoryArchiveIds||[]);
      data.memoryArchives=data.memoryArchives.filter(archive=>!deletedArchiveIds.has(archive.id));
      data.hiddenHealthDates=stored.hiddenHealthDates??data.hiddenHealthDates;
      const savedChat=Array.isArray(stored.chat)?stored.chat:[];
      const chatMessageKey=message=>message.id?`id:${message.id}`:`legacy:${message.role}|${message.characterId||''}|${message.time||''}|${message.text||''}`;
      const savedChatKeys=new Set(savedChat.map(chatMessageKey));
      data.chat=[...savedChat,...data.chat.filter(message=>{const key=chatMessageKey(message);if(savedChatKeys.has(key))return false;savedChatKeys.add(key);return true})];
      data.todos=stored.todos??data.todos;
      data.chatSummaries=stored.chatSummaries??data.chatSummaries;
      data.todayNote=stored.todayNote??data.todayNote;
      data.foodAnalyses=stored.foodAnalyses??data.foodAnalyses;
      data.healthAnalysisRecords=stored.healthAnalysisRecords??data.healthAnalysisRecords;
      data.settings.api=stored.settings?.api??data.settings.api;
      data.settings.analysisApi=stored.settings?.analysisApi??data.settings.analysisApi;
      data.settings.drawingApi=stored.settings?.drawingApi??data.settings.drawingApi;
      data.settings.apiPresets=stored.settings?.apiPresets??data.settings.apiPresets;
      data.settings.dietGoals=stored.settings?.dietGoals??data.settings.dietGoals;
      data.settings.chatMemoryArchiveIds=stored.settings?.chatMemoryArchiveIds??data.settings.chatMemoryArchiveIds;
      data.settings.chatMemoryArchiveIdsConfigured=stored.settings?.chatMemoryArchiveIdsConfigured??data.settings.chatMemoryArchiveIdsConfigured;
      data.settings.analysisPrompts=stored.settings?.analysisPrompts??data.settings.analysisPrompts;
      data.settings.chatMemoryArchiveIds=(data.settings.chatMemoryArchiveIds||[]).filter(id=>!deletedArchiveIds.has(id));
      data.settings.tokenSettings=stored.settings?.tokenSettings??data.settings.tokenSettings;
      data.fridgeSvgLibrary=stored.fridgeSvgLibrary??data.fridgeSvgLibrary??BUILTIN_FRIDGE_SVGS;
      data.fridgeArrangement=stored.fridgeArrangement??data.fridgeArrangement??null;
      const characterId=data.settings.prompts.activeCharacterId||data.settings.prompts.characters[0]?.id||'';
      for(const message of data.chat)if(!message.characterId)message.characterId=characterId;
      for(const archive of data.memoryArchives)archive.items=(archive.items||[]).filter(item=>!deletedMemoryIds.has(item.id));
      for(const storedArchive of stored.memoryArchives||[]){
        if(deletedArchiveIds.has(storedArchive.id))continue;
        const storedItems=(storedArchive.items||[]).filter(item=>!deletedMemoryIds.has(item.id));
        const localArchive=data.memoryArchives.find(item=>item.id===storedArchive.id);
        if(storedArchive.id==='health-archive'){
          if(localArchive){
            const summaries=storedItems.filter(item=>item.summary);
            const summarizedDates=new Set(summaries.flatMap(item=>item.dates||[]));
            localArchive.items=[...summaries,...(localArchive.items||[]).filter(item=>!item.summary&&!summarizedDates.has(item.date))];
          }else data.memoryArchives.unshift({...storedArchive,items:storedItems});
          continue;
        }
        if(replaceMemoryArchiveId===storedArchive.id)continue;
        if(!localArchive){data.memoryArchives.push({...storedArchive,items:storedItems});continue}
        const ids=new Set((localArchive.items||[]).map(item=>item.id));
        localArchive.items.push(...storedItems.filter(item=>!ids.has(item.id)));
      }
      replaceMemoryArchiveId='';
      window.petalDeletedMemoryItemIds=[];
      window.petalDeletedMemoryArchiveIds=[];
      syncDailyHealthMemories(data);
      localStorage.setItem(KEY,JSON.stringify(data));
      window.dispatchEvent(new Event('petal-data-updated'));
    }catch(e){toast('浏览器无法保存数据，请先导出备份。')}
  };
  window.addEventListener('petal-data-updated',()=>{
    try{
      const saved=JSON.parse(localStorage.getItem(KEY)||'{}');
      if(saved.settings?.weather&&typeof saved.settings.weather==='object')data.settings.weather={...(data.settings.weather||{}),...saved.settings.weather};
      for(const source of [...healthSources,'foodAnalyses','healthAnalysisRecords']){
        if(Array.isArray(saved[source]))data[source]=saved[source];
      }
      if(Array.isArray(saved.fridgeInventory))data.fridgeInventory=saved.fridgeInventory;
      if(Array.isArray(saved.fridgeRecords))data.fridgeRecords=saved.fridgeRecords;
      if(Array.isArray(saved.fridgeSvgLibrary))data.fridgeSvgLibrary=saved.fridgeSvgLibrary;
      if(Array.isArray(saved.fridgeArrangement)||saved.fridgeArrangement===null)data.fridgeArrangement=saved.fridgeArrangement;
      renderWeatherForecast();
      renderFridge();
    }catch(error){console.error('同步其他健康功能新增的记录失败',error)}
  });
  let toastTimer;
  function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');if(typeof t.showPopover==='function'&&!t.matches(':popover-open'))t.showPopover();clearTimeout(toastTimer);toastTimer=setTimeout(()=>{t.classList.remove('show');setTimeout(()=>{if(t.matches(':popover-open'))t.hidePopover()},250)},2400)}
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function fmtDate(s){if(!s)return '';const d=new Date(s+'T00:00:00');return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`}
  // 将保存的外观选项应用到聊天面板、背景和 Joy 日期标记。
  function syncBubbleSelectorAliases(root = document) {
    root.querySelectorAll('.message').forEach(bubble => {
      bubble.classList.add('message-bubble');
      bubble.querySelector('.message-content')?.classList.add('content');
      if(!bubble.querySelector('.bubble-effects')){
        const effects=document.createElement('span');
        effects.className='bubble-effects';effects.setAttribute('aria-hidden','true');
        effects.innerHTML='<i class="bubble-sparkle sp1"></i><i class="bubble-sparkle sp2"></i><i class="bubble-sparkle sp3"></i><i class="ripple"></i>';
        bubble.append(effects);
      }
    });
  }
  function applyAppearance(){
    const appearance=data.settings.appearance;
    const root=document.documentElement;
    root.style.setProperty('--chat-glass-blur',`${appearance.chatBlur}px`);
    root.style.setProperty('--chat-glass-opacity',String(appearance.chatOpacity/100));
    const chatFonts={system:'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',sans:'Arial, "Microsoft YaHei", sans-serif',serif:'Georgia, "Noto Serif SC", serif',noto:'"Noto Serif SC", serif',mono:'"DM Mono", "Microsoft YaHei", monospace'};
    root.style.setProperty('--chat-message-font-family',chatFonts[appearance.chatFontFamily]||chatFonts.system);
    root.style.setProperty('--chat-bubble-font-size',`${appearance.chatBubbleFontSize??13}px`);
    root.style.setProperty('--chat-bubble-padding-y',`${appearance.chatBubblePaddingY??8}px`);
    root.style.setProperty('--chat-message-gap',`${appearance.chatMessageGap??8}px`);
    if(appearance.backgroundImage){root.style.setProperty('--user-background',`url("${appearance.backgroundImage}")`);document.body.classList.add('has-user-background')}
    else{root.style.removeProperty('--user-background');document.body.classList.remove('has-user-background')}
    let style=document.getElementById('customChatBubbleStyle');
    if(!style){style=document.createElement('style');style.id='customChatBubbleStyle';document.head.appendChild(style)}
    const activeBuiltin=BUILTIN_BUBBLE_PRESETS.find(preset=>preset.id===appearance.activeBubblePresetId);
    const customCss=(activeBuiltin?.css||appearance.bubbleCss||'').trim();
    document.body.classList.toggle('has-custom-bubble-style',Boolean(customCss));
    const defaultBubbleSkinReset=`body.has-custom-bubble-style .message{flex:0 0 auto}body.has-custom-bubble-style .message.ai,body.has-custom-bubble-style .message.user{padding:0;background:transparent;border:0;border-radius:0;box-shadow:none;color:inherit}body.has-custom-bubble-style .health-attachment-card{min-width:0;width:100%;max-width:100%;box-sizing:border-box}body.has-custom-bubble-style .health-attachment-card summary{min-width:0}`;
    const controlledBubbleSettings=`body.has-custom-bubble-style .message-bubble.user,body.has-custom-bubble-style .message-bubble.ai{padding-top:var(--chat-bubble-padding-y)!important;padding-bottom:var(--chat-bubble-padding-y)!important;font-family:var(--chat-message-font-family)!important;font-size:var(--chat-bubble-font-size)!important;margin-top:0!important}`;
    const builtinGlowSettings=activeBuiltin?`body.has-custom-bubble-style .message-bubble.user{box-shadow:0 0 var(--chat-bubble-glow-blur,7.7px) rgba(255,183,210,var(--chat-bubble-glow-opacity,.126)),0 0 calc(var(--chat-bubble-glow-blur,7.7px)*1.8) rgba(168,237,234,var(--chat-bubble-glow-opacity,.126)),inset 0 0 15px rgba(255,198,224,.22)!important;filter:none!important}body.has-custom-bubble-style .message-bubble.ai{box-shadow:0 0 var(--chat-bubble-glow-blur,7.7px) rgba(168,237,234,var(--chat-bubble-glow-opacity,.126)),0 0 calc(var(--chat-bubble-glow-blur,7.7px)*1.8) rgba(255,183,210,var(--chat-bubble-glow-opacity,.126)),inset 0 0 15px rgba(168,237,234,.22)!important;filter:none!important}body.has-custom-bubble-style .message-bubble.user::before,body.has-custom-bubble-style .message-bubble.user::after,body.has-custom-bubble-style .message-bubble.ai::before,body.has-custom-bubble-style .message-bubble.ai::after{filter:drop-shadow(0 0 var(--chat-bubble-glow-blur,7.7px) rgba(238,197,157,var(--chat-bubble-glow-opacity,.126)))!important}`:'';
    const imports=customCss.match(/@import\b[^;]*;/gi)||[];
    const remainingCss=customCss.replace(/@import\b[^;]*;/gi,'').trim();
    const userRules=remainingCss?(remainingCss.includes('{')?remainingCss:`.message.ai,.message.user{${remainingCss}}`):'';
    style.textContent=customCss?[...imports,defaultBubbleSkinReset,userRules,controlledBubbleSettings,builtinGlowSettings].filter(Boolean).join('\n'):'';
    const messages=$('messages');
    if(messages&&!messages.dataset.bubbleAliasObserver){
      new MutationObserver(()=>syncBubbleSelectorAliases(messages)).observe(messages,{childList:true,subtree:true});
      messages.dataset.bubbleAliasObserver='true';
    }
    syncBubbleSelectorAliases();
  }
  function renderBubblePresetOptions(selectedId=data.settings.appearance.activeBubblePresetId||''){
    const select=$('chatBubblePresetSelect');
    if(!select)return;
    const presets=getBubblePresets();
    select.replaceChildren(new Option('选择样式预设',''),...presets.map(preset=>new Option(preset.name,preset.id)));
    select.value=presets.some(preset=>preset.id===selectedId)?selectedId:'';
    $('applyBubblePreset').disabled=!select.value;
    $('deleteBubblePreset').disabled=!select.value||select.value===DEFAULT_BUBBLE_PRESET.id;
  }
  function getBubblePresets(){
    const appearance=data.settings.appearance;
    const hidden=new Set(appearance.hiddenBubblePresetIds||[]);
    const builtins=BUILTIN_BUBBLE_PRESETS.filter(preset=>!hidden.has(preset.id));
    const builtinIds=new Set(BUILTIN_BUBBLE_PRESETS.map(preset=>preset.id));
    const builtinNames=new Set([DEFAULT_BUBBLE_PRESET.name,...BUILTIN_BUBBLE_PRESETS.map(preset=>preset.name)]);
    const custom=(appearance.bubblePresets||[]).filter(preset=>!builtinIds.has(preset.id)&&!builtinNames.has(preset.name));
    return [DEFAULT_BUBBLE_PRESET,...builtins,...custom];
  }
  function loadAppearanceSettings(){
    const defaults={...emptyData().settings.appearance,bubblePresets:[],activeBubblePresetId:'',hiddenBubblePresetIds:[]};
    data.settings.appearance={...defaults,...(data.settings.appearance||{})};
    const appearance=data.settings.appearance;
    if(!Array.isArray(appearance.bubblePresets))appearance.bubblePresets=[];
    if(!Array.isArray(appearance.hiddenBubblePresetIds))appearance.hiddenBubblePresetIds=[];
    const builtin=BUILTIN_BUBBLE_PRESETS.find(preset=>preset.name==='星空兔兔');
    const legacy=appearance.bubblePresets.find(preset=>preset.name===builtin.name||preset.id===builtin.id);
    let migrated=false;
    if(legacy){
      if(!appearance.activeBubblePresetId&&(!appearance.bubbleCss||appearance.bubbleCss===legacy.css)){
        appearance.activeBubblePresetId=builtin.id;
        appearance.bubbleCss='';
      }else if(appearance.activeBubblePresetId===legacy.id){
        appearance.activeBubblePresetId=builtin.id;
        appearance.bubbleCss='';
      }
      appearance.bubblePresets=appearance.bubblePresets.filter(preset=>preset!==legacy);
      migrated=true;
    }
    if(appearance.activeBubblePresetId===builtin.id&&appearance.bubbleCss){appearance.bubbleCss='';migrated=true}
    $('chatBlur').value=appearance.chatBlur;$('chatBlurValue').textContent=appearance.chatBlur+' px';
    $('chatOpacity').value=appearance.chatOpacity;$('chatOpacityValue').textContent=appearance.chatOpacity+'%';
    $('chatFontFamily').value=appearance.chatFontFamily||'system';
    $('chatBubbleFontSize').value=appearance.chatBubbleFontSize??13;
    $('chatBubblePaddingY').value=appearance.chatBubblePaddingY??8;
    $('chatMessageGap').value=appearance.chatMessageGap??8;
    $('chatBubbleGlow').value=appearance.chatBubbleGlow??35;
    $('rainIntensity').value=appearance.rainIntensity??0;
    updateAppearancePreview();
    $('chatBubbleCss').value=BUILTIN_BUBBLE_PRESETS.find(preset=>preset.id===appearance.activeBubblePresetId)?.css||appearance.bubbleCss;$('backgroundImage').value='';
    renderBubblePresetOptions();applyAppearance();
    if(migrated)save();
  }
  // 随机散布星点，让每颗星独立闪烁。
  function initStarfield(){
    document.querySelectorAll('.starfield').forEach((field,index)=>{
      const count=index===0?92:88;
      const fragment=document.createDocumentFragment();
      for(let starIndex=0;starIndex<count;starIndex++){
        const star=document.createElement('i');
        star.className='star-point';
        const size=1+Math.random()*1.8;
        star.style.left=`${Math.random()*100}%`;
        star.style.top=`${Math.random()*100}%`;
        star.style.width=`${size}px`;
        star.style.height=`${size}px`;
        star.style.setProperty('--star-duration',`${2.2+Math.random()*5.8}s`);
        star.style.setProperty('--star-delay',`${-Math.random()*8}s`);
        star.style.setProperty('--star-peak',`${.45+Math.random()*.55}`);
        fragment.appendChild(star);
      }
      field.appendChild(fragment);
    });
  }
  function startChatDust(){
    const canvas=$('dustCanvas');
    if(!canvas||canvas.dataset.started)return;
    const context=canvas.getContext('2d');
    if(!context)return;
    canvas.dataset.started='true';
    const wrap=canvas.parentElement;
    const colors=[[200,220,255],[168,237,234],[186,225,255],[255,209,220]];
    const count=40;
    let width=0,height=0,ratio=1,particles=[],time=0,lastFrame=0;
    const createParticle=randomY=>{
      const color=colors[Math.floor(Math.random()*colors.length)];
      return{x:Math.random()*width,y:randomY?Math.random()*height:height+Math.random()*30,r:Math.random()*1.3+.3,speedY:Math.random()*.14+.03,speedX:(Math.random()-.5)*.1,alpha:Math.random()*.45+.12,phase:Math.random()*Math.PI*2,freq:Math.random()*.6+.3,color};
    };
    const resize=()=>{
      const bounds=wrap.getBoundingClientRect();width=bounds.width;height=bounds.height;
      ratio=Math.min(window.devicePixelRatio||1,2);
      canvas.width=Math.max(1,Math.round(width*ratio));canvas.height=Math.max(1,Math.round(height*ratio));
      context.setTransform(ratio,0,0,ratio,0,0);
      particles=Array.from({length:count},()=>createParticle(true));
    };
    const resizeObserver=new ResizeObserver(resize);
    resizeObserver.observe(wrap);
    window.addEventListener('resize',resize,{passive:true});
    const animate=now=>{
      const chatVisible=$('view-chat')?.classList.contains('active');
      const motionReduced=document.body.classList.contains('reduce-motion')||window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(document.hidden||!chatVisible||motionReduced||!width||!height){context.clearRect(0,0,width,height);lastFrame=now;requestAnimationFrame(animate);return}
      const step=lastFrame?Math.min((now-lastFrame)/16.67,2):1;lastFrame=now;time+=step*.016;
      context.clearRect(0,0,width,height);
      for(let index=0;index<particles.length;index++){
        const particle=particles[index];particle.y-=particle.speedY*step;particle.x+=particle.speedX*step+Math.sin(time*.5+particle.phase)*.05*step;
        if(particle.y < -10||particle.x < -10||particle.x > width+10){particles[index]=createParticle(false);continue}
        const twinkle=.5+.5*Math.sin(time*particle.freq*2+particle.phase),alpha=particle.alpha*(.4+.6*twinkle);
        const glow=context.createRadialGradient(particle.x,particle.y,0,particle.x,particle.y,particle.r*4);
        glow.addColorStop(0,`rgba(${particle.color[0]},${particle.color[1]},${particle.color[2]},${alpha})`);
        glow.addColorStop(.4,`rgba(${particle.color[0]},${particle.color[1]},${particle.color[2]},${alpha*.3})`);
        glow.addColorStop(1,`rgba(${particle.color[0]},${particle.color[1]},${particle.color[2]},0)`);
        context.beginPath();context.fillStyle=glow;context.arc(particle.x,particle.y,particle.r*4,0,Math.PI*2);context.fill();
        context.beginPath();context.fillStyle=`rgba(255,255,255,${alpha*.9})`;context.arc(particle.x,particle.y,particle.r*.5,0,Math.PI*2);context.fill();
      }
      requestAnimationFrame(animate);
    };
    resize();requestAnimationFrame(animate);
  }
  // 桌面保持渐隐雨丝；手机改用轻量实色雨线并按帧间隔补偿速度。
  function startRain(){
    const canvas=$('rainCanvas');if(!canvas)return;
    const ctx=canvas.getContext('2d');if(!ctx)return;
    let drops=[];let width=0;let height=0;let intensity=0;let mobile=false;let lastFrameTime=0;
    function resize(){
      mobile=window.matchMedia('(max-width: 600px)').matches;
      const ratio=Math.min(window.devicePixelRatio||1,1.5);
      width=window.innerWidth;height=window.innerHeight;
      canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
      ctx.setTransform(ratio,0,0,ratio,0,0);
      const count=Math.round(50+200*intensity);
      drops=Array.from({length:count},()=>({x:Math.random()*width,y:Math.random()*height,length:(30+Math.random()*30)*(mobile?1.5:1),speed:15+Math.random()*10+intensity*13,opacity:Math.min(.9,.18+Math.random()*.32+intensity*.4)}));
    }
    window.petalSetRainIntensity=value=>{intensity=Math.min(1,Math.max(0,Number(value)||0)/100);resize()};
    function animate(now){
      if(document.body.classList.contains('reduce-motion')){ctx.clearRect(0,0,width,height);lastFrameTime=now;requestAnimationFrame(animate);return}
      const step=mobile?Math.min(lastFrameTime?Math.max(0,(now-lastFrameTime)/16.67):1,4):1;
      lastFrameTime=now;
      ctx.clearRect(0,0,width,height);
      drops.forEach(drop=>{
        drop.y+=drop.speed/3*step*(mobile?1.8:1);
        drop.x-=.5*step;
        if(drop.y>height+drop.length){drop.x=Math.random()*width;drop.y=-drop.length}
        ctx.beginPath();
        ctx.moveTo(drop.x,drop.y);
        ctx.lineTo(drop.x-drop.length*.05,drop.y+drop.length);
        if(mobile){
          ctx.strokeStyle=`rgba(174,196,232,${drop.opacity})`;
          ctx.lineWidth=1.3;
          ctx.lineCap='butt';
        }else{
          const gradient=ctx.createLinearGradient(drop.x,drop.y,drop.x-drop.length*.05,drop.y+drop.length);
          gradient.addColorStop(0,'rgba(158,212,209,0)');
          gradient.addColorStop(.65,`rgba(174,196,232,${drop.opacity*.55})`);
          gradient.addColorStop(1,`rgba(235,169,207,${drop.opacity})`);
          ctx.strokeStyle=gradient;
          ctx.lineWidth=1.4;
          ctx.lineCap='round';
        }
        ctx.stroke();
      });
      requestAnimationFrame(animate);
    }
    resize();window.addEventListener('resize',resize);requestAnimationFrame(animate);
  }
  // 页面导航：切换主页面、快捷跳转以及设置页内部的标签。
  function setDefaults(scope=null){const field=id=>scope?scope.querySelector(`#${id}`):$(id);['sleepDate','foodDate','bowelDate','weightDate','memoryDate','joyDate'].forEach(id=>{const input=field(id);if(input)input.value=today()});const foodTime=field('foodTime'),bowelTime=field('bowelTime');if(foodTime)foodTime.value=timeNow();if(bowelTime)bowelTime.value=timeNow()}
  function showView(name){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+name));document.querySelectorAll('.nav-button').forEach(b=>b.classList.toggle('active',b.dataset.view===name));$('todayChip').hidden=name==='home';window.scrollTo({top:0,behavior:'smooth'})}
  document.querySelectorAll('.nav-button').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
  document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.goto)));
  document.querySelectorAll('.setting-tab').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.setting-tab').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.setting-pane').forEach(x=>x.classList.toggle('active',x.id==='setting-'+b.dataset.setting))}));
  // 首次显示页面时填入日期，并把日期输入框设为今天。
  $('todayChip').innerHTML='<span class="top-symbol">✧</span> '+new Date().toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'short'}).toUpperCase()+' · YOUR JOURNAL';
  setDefaults();
  const dailyEntryDialog=document.createElement('dialog');
  dailyEntryDialog.className='daily-entry-dialog';
  dailyEntryDialog.innerHTML='<div class="daily-entry-dialog-head"><h2 id="dailyEntryDialogTitle"></h2><button class="daily-entry-close" type="button" aria-label="关闭记录窗口">×</button></div><div class="daily-entry-dialog-content"></div>';
  document.body.append(dailyEntryDialog);
  const dailyEntryPanels={
    sleep:$('sleepForm').closest('.panel'),
    food:$('foodForm').closest('.panel'),
    bowel:$('bowelForm').closest('.panel'),
    joy:$('joyForm').closest('.panel'),
    'nutrition-goals':$('nutritionGoalsForm').closest('.panel'),
    fridge:$('fridgeEntryPanel')
  };
  const dailyEntryParents=Object.fromEntries(Object.entries(dailyEntryPanels).map(([type,panel])=>[type,panel.parentElement]));
  for(const type of ['sleep','food','bowel','joy']){
    const parent=dailyEntryParents[type];
    if(parent.classList.contains('grid-2')&&parent.children.length===1)parent.hidden=true;
  }
  dailyEntryDialog.querySelector('.daily-entry-dialog-content').append(...Object.values(dailyEntryPanels));
  const dailyEntryTitles={sleep:'睡眠记录',food:'饮食记录',bowel:'排便记录',joy:'Joy 时间记录','nutrition-goals':'每日营养摄入目标',fridge:'冰箱每日一记'};
  document.querySelectorAll('[data-daily-entry]').forEach(button=>button.addEventListener('click',()=>{
    const type=button.dataset.dailyEntry;
    const panel=dailyEntryPanels[type];
    if(!panel)return;
    $('dailyEntryDialogTitle').textContent=dailyEntryTitles[type];
    dailyEntryDialog.querySelector('.daily-entry-dialog-content').replaceChildren(panel);
    setDefaults(panel);
    if(type==='fridge'){
      $('fridgeStockDate').value=today();
      $('fridgeConsumeDate').value=today();
      renderFridge();
    }
    if(type==='nutrition-goals')window.dispatchEvent(new Event('petal-load-nutrition-goals'));
    dailyEntryDialog.showModal();
  }));
  dailyEntryDialog.querySelector('.daily-entry-close').addEventListener('click',()=>dailyEntryDialog.close());
  dailyEntryDialog.addEventListener('click',event=>{if(event.target===dailyEntryDialog)dailyEntryDialog.close()});
  // 健康记录表单：提交后保存睡眠、饮食、排便或体重记录。
  function addRecord(type,record){record.id=Date.now().toString(36)+Math.random().toString(36).slice(2,7);data[type].unshift(record);save();renderAll();toast('已轻轻收好这条记录 ✧')}
  const fridgeNumber=value=>Number(Number(value||0).toFixed(6));
  const fridgeFormat=value=>String(Number(Number(value||0).toFixed(3)));
  const fridgeChineseInteger=value=>{
    const digits=['零','一','二','三','四','五','六','七','八','九'];
    if(value<10)return digits[value];
    if(value<20)return `十${value%10?digits[value%10]:''}`;
    if(value<100)return `${digits[Math.floor(value/10)]}十${value%10?digits[value%10]:''}`;
    if(value===100)return '一百';
    if(value<1000)return `${digits[Math.floor(value/100)]}百${value%100?fridgeChineseInteger(value%100):''}`;
    return String(value);
  };
  const fridgeFormatPackageCount=value=>{
    const count=Number(value)||0;
    const whole=Math.floor(count+1e-8);
    const fraction=count-whole;
    const denominators=[2,3,4,5,6,8,10,12,16,20,24,30,40,50,100];
    let best=null;
    for(const denominator of denominators){
      const numerator=Math.round(fraction*denominator);
      if(numerator>0&&Math.abs(fraction-numerator/denominator)<0.00001){best={numerator,denominator};break}
    }
    if(!best)return Math.abs(fraction)<1e-8&&whole<1000?fridgeChineseInteger(whole):fridgeFormat(count);
    const fractional=best.numerator===1&&best.denominator===2?'半':`${fridgeChineseInteger(best.denominator)}分之${fridgeChineseInteger(best.numerator)}`;
    return whole?`${fridgeChineseInteger(whole)}又${fractional}`:fractional;
  };
  const fridgePackageText=(value,unit)=>`${fridgeFormatPackageCount(value)} ${unit||''}`.trim();
  const fridgeInventoryText=inventory=>(inventory||[]).map(item=>`${Number(item.amount)>0?`${fridgeFormat(item.amount)}${item.amountUnit||''}`:''}${item.name}${Number(item.quantity)>0?fridgePackageText(item.quantity,item.packageUnit).replace(/\s+/g,''):''}`).join('；');
  const fridgeParseInventoryText=text=>{
    const amountUnits=['毫升','公升','公斤','千克','毫克','ml','kg','mg','升','克','g','l'].sort((a,b)=>b.length-a.length);
    const entries=String(text||'').split(/[；;，,、\n]+/).map(entry=>entry.trim()).filter(Boolean);
    const result=[];
    for(const entry of entries){
      const fields=entry.split('/').map(field=>field.trim());
      let value=entry,amount=0,amountUnit='';
      let name,quantity,packageUnit;
      if(fields.length===4){
        const amountMatch=fields[0].match(/^(\d+(?:\.\d+)?)\s*(.*)$/u);
        const quantityMatch=fields[2].match(/^(\d+(?:\.\d+)?)$/u);
        name=fields[1];
        amount=amountMatch?Number(amountMatch[1]):0;
        amountUnit=amountMatch?amountMatch[2].trim():'';
        quantity=quantityMatch?Number(quantityMatch[1]):NaN;
        packageUnit=fields[3];
      }else{
        const amountMatch=value.match(new RegExp(`^(\\d+(?:\\.\\d+)?)\\s*(${amountUnits.join('|')})`,'i'));
        if(amountMatch){
          amount=Number(amountMatch[1]);amountUnit=amountMatch[2];
          value=value.slice(amountMatch[0].length).trim();
        }
        const countMatch=value.match(/^(.*)(三分之二|三分之一|四分之三|四分之一|五分之二|五分之三|半|[零〇一二两三四五六七八九十百\d.]+)\s*([\p{L}\u3400-\u9fff]+)$/u);
        if(!countMatch)return {error:`无法识别“${entry}”。可以直接写“豆腐两块”或“200ml牛奶两瓶”，多项用逗号、顿号、分号或换行分开。`};
        name=countMatch[1].trim();
        quantity=fridgeParseMeasure(countMatch[2])?.amount;
        packageUnit=countMatch[3].trim();
        if(!amount){
          const inlineAmount=name.match(new RegExp(`^(.*?)\\s*(\\d+(?:\\.\\d+)?)\\s*(${amountUnits.join('|')})$`,'i'));
          if(inlineAmount){
            name=inlineAmount[1].trim();amount=Number(inlineAmount[2]);amountUnit=inlineAmount[3];
          }
        }
      }
      if(!name||!packageUnit||!Number.isFinite(quantity)||quantity<=0)return {error:`无法识别“${entry}”。可以直接写“豆腐两块”或“200ml牛奶两瓶”，多项用逗号、顿号、分号或换行分开。`};
      const existing=data.fridgeInventory.find(item=>item.name.toLocaleLowerCase()===name.toLocaleLowerCase()&&(item.packageUnit||'').toLocaleLowerCase()===packageUnit.toLocaleLowerCase());
      const storedUnit=existing?.amountUnit||amountUnit;
      const convertedAmount=amount&&storedUnit?fridgeConvert(amount,amountUnit,storedUnit):amount;
      if(amount&&convertedAmount===null)return {error:`“${entry}”的份量单位与现有库存不兼容。`};
      const item={id:existing?.id||Date.now().toString(36)+Math.random().toString(36).slice(2,7),name,amount:fridgeNumber(convertedAmount||0),amountUnit:storedUnit,quantity:fridgeNumber(quantity),packageUnit};
      const duplicate=result.find(value=>value.name.toLocaleLowerCase()===name.toLocaleLowerCase()&&value.packageUnit.toLocaleLowerCase()===packageUnit.toLocaleLowerCase());
      if(duplicate){duplicate.amount=fridgeNumber(duplicate.amount+item.amount);duplicate.quantity=fridgeNumber(duplicate.quantity+item.quantity)}
      else result.push(item);
    }
    return {inventory:result};
  };
  const fridgeUnitInfo=unit=>{
    const normalized=String(unit||'').trim().toLocaleLowerCase().replace(/\s+/g,'');
    const units={
      ml:['volume',1],毫升:['volume',1],毫升液:['volume',1],
      l:['volume',1000],升:['volume',1000],公升:['volume',1000],
      g:['mass',1],克:['mass',1],
      kg:['mass',1000],公斤:['mass',1000],千克:['mass',1000],
      mg:['mass',0.001],毫克:['mass',0.001]
    };
    const info=units[normalized];
    return info?{dimension:info[0],factor:info[1],normalized}:{dimension:`custom:${normalized}`,factor:1,normalized};
  };
  const fridgeConvert=(value,fromUnit,toUnit)=>{
    const from=fridgeUnitInfo(fromUnit),to=fridgeUnitInfo(toUnit);
    if(from.dimension!==to.dimension)return null;
    return fridgeNumber(Number(value)*from.factor/to.factor);
  };
  const fridgeChineseNumber=text=>{
    const digits={零:0,〇:0,一:1,二:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9};
    if(/^\d+(?:\.\d+)?$/.test(text))return Number(text);
    if(text==='十')return 10;
    let total=0,current=0,hasDigit=false;
    for(const char of text){
      if(Object.hasOwn(digits,char)){current=digits[char];hasDigit=true;continue}
      if(char==='十'){total+=(current||1)*10;current=0;hasDigit=true;continue}
      if(char==='百'){total+=(current||1)*100;current=0;hasDigit=true;continue}
      return NaN;
    }
    return hasDigit?total+current:NaN;
  };
  const fridgeParseMeasure=text=>{
    const value=String(text||'').trim().replace(/，/g,'');
    const fraction=value.match(/^([零〇一二两三四五六七八九十百\d.]+)分之([零〇一二两三四五六七八九十百\d.]+)\s*([\p{L}\u3400-\u9fff]*)$/u);
    if(fraction){
      const denominator=fridgeChineseNumber(fraction[1]),numerator=fridgeChineseNumber(fraction[2]);
      return Number.isFinite(numerator)&&Number.isFinite(denominator)&&denominator>0?{amount:numerator/denominator,unit:fraction[3]}:null;
    }
    const mixed=value.match(/^([零〇一二两三四五六七八九十百\d.]+)\s*([\p{L}\u3400-\u9fff]+)半$/u);
    if(mixed){
      const amount=fridgeChineseNumber(mixed[1]);
      return Number.isFinite(amount)&&amount>0?{amount:amount+0.5,unit:mixed[2]}:null;
    }
    const match=value.match(/^([零〇一二两三四五六七八九十百\d.]+|半)\s*(半)?\s*([\p{L}\u3400-\u9fff]*)$/u);
    if(!match)return null;
    let amount=match[1]==='半'?0.5:fridgeChineseNumber(match[1]);
    if(match[2])amount+=0.5;
    return Number.isFinite(amount)&&amount>0?{amount,unit:match[3]}:null;
  };
  function renderFridge(){
    const inventoryList=$('fridgeInventoryList');
    const historyList=$('fridgeConsumptionList');
    if(!historyList)return;
    const inventory=(data.fridgeInventory||[]).filter(item=>Number(item.amount)>0||Number(item.quantity)>0);
    if(inventoryList)inventoryList.innerHTML=inventory.length?inventory.map(item=>{
        const measures=[Number(item.amount)>0?`${fridgeFormat(item.amount)} ${esc(item.amountUnit)}`:'',Number(item.quantity)>0?esc(fridgePackageText(item.quantity,item.packageUnit)):''].filter(Boolean).join(' · ');
        return `<article class="fridge-item"><strong>${esc(item.name)}</strong><span>${measures}</span></article>`;
      }).join(''):'<div class="empty-state">还没有现有食材。点击“每日一记”添加。</div>';
    const select=$('fridgeConsumeItem');
    if(select)select.innerHTML=inventory.length?inventory.map(item=>{
        const measures=[Number(item.amount)>0?`${fridgeFormat(item.amount)} ${item.amountUnit||''}`:'',Number(item.quantity)>0?fridgePackageText(item.quantity,item.packageUnit):''].filter(Boolean).join(' · ');
        return `<option value="${esc(item.id)}">${esc(item.name)}（${esc(measures)}）</option>`;
      }).join(''):'<option value="">暂无可消耗食材</option>';
    const history=(data.fridgeRecords||[]).slice().sort((left,right)=>(right.date||'').localeCompare(left.date||'')).slice(0,30);
    historyList.innerHTML=history.length?history.map(record=>{
      const measure=record.mode==='stock'
        ? [Number(record.amount)>0?`${fridgeFormat(record.amount)} ${record.amountUnit||''}`.trim():'',fridgePackageText(record.quantity,record.packageUnit)].filter(Boolean).join(' · ')
        : record.mode==='amount'?`${fridgeFormat(record.amount)} ${record.amountUnit||''}`.trim():fridgePackageText(record.quantity,record.packageUnit);
      const remaining=[Number(record.remainingAmount)>0?`${fridgeFormat(record.remainingAmount)} ${record.amountUnit||''}`.trim():'',Number(record.remainingQuantity)>0?fridgePackageText(record.remainingQuantity,record.packageUnit):''].filter(Boolean).join(' · ');
      return `<article class="fridge-history-item"><strong>${record.action==='消耗'?'消耗':'加入'} ${esc(measure)} ${esc(record.name)}</strong><small>${esc(record.date)}${remaining?` · 剩余 ${esc(remaining)}`:''}</small></article>`;
    }).join(''):'<div class="empty-state">食材消耗和新增记录会显示在这里。</div>';
    updateFridgeConsumeMode();
  }
  $('viewFridgeInventory').addEventListener('click',()=>{$('fridgeInventoryText').value=fridgeInventoryText(data.fridgeInventory);$('fridgeInventoryDialog').showModal();renderFridge()});
  $('closeFridgeInventory').addEventListener('click',()=>$('fridgeInventoryDialog').close());
  $('fridgeInventoryDialog').addEventListener('click',event=>{if(event.target===$('fridgeInventoryDialog'))$('fridgeInventoryDialog').close()});
  $('fridgeInventoryForm').addEventListener('submit',event=>{
    event.preventDefault();
    const parsed=fridgeParseInventoryText($('fridgeInventoryText').value);
    if(parsed.error){toast(parsed.error);return}
    data.fridgeInventory=parsed.inventory;
    save();renderAll();toast('现有库存已更新。');
  });
  function updateFridgeConsumeMode(){
    const item=(data.fridgeInventory||[]).find(entry=>entry.id===$('fridgeConsumeItem')?.value);
    const mode=$('fridgeConsumeMode');
    const value=$('fridgeConsumeValue');
    const hint=$('fridgeConsumeStock');
    if(!mode||!value||!hint)return;
    const amountAvailable=Number(item?.amount)>0&&Boolean(item?.amountUnit);
    const packageAvailable=Number(item?.quantity)>0&&Boolean(item?.packageUnit);
    mode.querySelector('option[value="amount"]').disabled=!amountAvailable;
    mode.querySelector('option[value="package"]').disabled=!packageAvailable;
    if(mode.selectedOptions[0]?.disabled)mode.value=amountAvailable?'amount':'package';
    const byAmount=mode.value==='amount';
    const maximum=byAmount?Number(item?.amount)||0:Number(item?.quantity)||0;
    value.placeholder=maximum?`最多 ${fridgeFormat(maximum)}${byAmount?` ${item.amountUnit}`:` ${item.packageUnit}`}`:'当前没有可按此单位消耗的库存';
    hint.textContent=item?`现有：${Number(item.amount)>0?`${fridgeFormat(item.amount)} ${item.amountUnit}`:''}${Number(item.amount)>0&&Number(item.quantity)>0?' · ':''}${Number(item.quantity)>0?`${fridgeFormat(item.quantity)} ${item.packageUnit}`:''}`:'请先添加食材。';
    const parsed=fridgeParseMeasure(value.value);
    if(parsed?.unit){
      const amountMatch=Number.isFinite(fridgeConvert(1,parsed.unit,item?.amountUnit));
      const packageMatch=fridgeUnitInfo(parsed.unit).normalized===fridgeUnitInfo(item?.packageUnit).normalized;
      if(packageMatch&&!amountMatch)mode.value='package';
      else if(amountMatch&&!packageMatch)mode.value='amount';
    }
  }
  $('fridgeConsumeItem').addEventListener('change',updateFridgeConsumeMode);
  $('fridgeConsumeMode').addEventListener('change',updateFridgeConsumeMode);
  $('fridgeConsumeValue').addEventListener('input',updateFridgeConsumeMode);
  $('fridgeStockForm').addEventListener('submit',event=>{
    event.preventDefault();
    const parsed=fridgeParseInventoryText($('fridgeStockText').value);
    if(parsed.error){toast(parsed.error);return}
    const date=$('fridgeStockDate').value;
    for(const entry of parsed.inventory){
      let item=data.fridgeInventory.find(existing=>existing.name.toLocaleLowerCase()===entry.name.toLocaleLowerCase()&&(!existing.amountUnit||!entry.amountUnit||fridgeUnitInfo(existing.amountUnit).dimension===fridgeUnitInfo(entry.amountUnit).dimension)&&(existing.packageUnit||'').toLocaleLowerCase()===entry.packageUnit.toLocaleLowerCase());
      const amount=Number(entry.amount)||0;
      const storedAmount=amount&&item?.amountUnit?fridgeConvert(amount,entry.amountUnit,item.amountUnit):amount;
      if(amount&&storedAmount===null){toast(`份量单位“${entry.amountUnit}”与现有食材单位不兼容。`);return}
      if(!item){item={...entry,amount:0,quantity:0};data.fridgeInventory.unshift(item)}
      if(amount&&!item.amountUnit)item.amountUnit=entry.amountUnit;
      item.amount=fridgeNumber(Number(item.amount||0)+(storedAmount||0));
      item.quantity=fridgeNumber(Number(item.quantity||0)+Number(entry.quantity||0));
      data.fridgeRecords.unshift({id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),date,action:'加入',mode:'stock',name:entry.name,amount:storedAmount||0,amountUnit:item.amountUnit||entry.amountUnit,quantity:Number(entry.quantity)||0,packageUnit:entry.packageUnit,remainingAmount:item.amount,remainingQuantity:item.quantity});
    }
    save();renderAll();event.currentTarget.reset();$('fridgeStockDate').value=today();toast('食材已加入现有库存。');
  });
  $('fridgeConsumeForm').addEventListener('submit',event=>{
    event.preventDefault();
    const item=data.fridgeInventory.find(entry=>entry.id===$('fridgeConsumeItem').value);
    const mode=$('fridgeConsumeMode').value;
    const parsed=fridgeParseMeasure($('fridgeConsumeValue').value);
    if(!item||!parsed){toast('请填写有效的消耗数量，例如 50ml、半瓶、三分之一袋或一块。');return}
    const amountUnitMatch=Number.isFinite(fridgeConvert(1,parsed.unit||item.amountUnit,item.amountUnit));
    const packageUnitMatch=fridgeUnitInfo(parsed.unit||item.packageUnit).normalized===fridgeUnitInfo(item.packageUnit).normalized;
    if(parsed.unit&&packageUnitMatch&&!amountUnitMatch)$('fridgeConsumeMode').value='package';
    else if(parsed.unit&&amountUnitMatch&&!packageUnitMatch)$('fridgeConsumeMode').value='amount';
    const selectedMode=$('fridgeConsumeMode').value;
    const unit=parsed.unit|| (selectedMode==='amount'?item.amountUnit:item.packageUnit);
    const expectedUnit=selectedMode==='amount'?item.amountUnit:item.packageUnit;
    const converted=selectedMode==='amount'?fridgeConvert(parsed.amount,unit,expectedUnit):(fridgeUnitInfo(unit).normalized===fridgeUnitInfo(expectedUnit).normalized?parsed.amount:null);
    if(converted===null){toast(`消耗单位“${unit}”与库存单位“${expectedUnit}”不一致。`);return}
    const value=converted;
    const available=selectedMode==='amount'?Number(item.amount)||0:Number(item.quantity)||0;
    if(value>available+0.000001){toast(`消耗数量超过库存，当前最多可记录 ${fridgeFormat(available)}。`);return}
    if(selectedMode==='amount')item.amount=fridgeNumber(Math.max(0,available-value));
    else item.quantity=fridgeNumber(Math.max(0,available-value));
    const log={id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),date:$('fridgeConsumeDate').value,action:'消耗',mode:selectedMode,name:item.name,amount:selectedMode==='amount'?value:0,amountUnit:item.amountUnit||'',quantity:selectedMode==='package'?value:0,packageUnit:item.packageUnit||'',remainingAmount:item.amount,remainingQuantity:item.quantity};
    data.fridgeRecords.unshift(log);
    data.fridgeInventory=data.fridgeInventory.filter(entry=>Number(entry.amount)>0||Number(entry.quantity)>0);
    save();renderAll();event.currentTarget.reset();$('fridgeConsumeDate').value=today();toast('消耗已记录，库存已更新。');
  });
  if(!data.healthMemoryInitialized||data.fridgeInventoryMemoryVersion!==1){data.healthMemoryInitialized=true;data.fridgeInventoryMemoryVersion=1;save()}
  function updateSleepTimeFields(source){const start=$('sleepStart').value,end=$('sleepEnd').value,hours=Number($('sleepHours').value);const minutes=time=>{const [h,m]=time.split(':').map(Number);return h*60+m};if(start&&end&&(source==='submit'||source==='sleepEnd')){const duration=(minutes(end)-minutes(start)+1440)%1440;$('sleepHours').value=(duration/60).toFixed(2).replace(/0+$/,'').replace(/\.$/,'');return}if(start&&hours>0&&(source==='sleepStart'||source==='sleepHours')){const [h,m]=start.split(':').map(Number),endMinutes=(h*60+m+Math.round(hours*60))%1440;$('sleepEnd').value=`${String(Math.floor(endMinutes/60)).padStart(2,'0')}:${String(endMinutes%60).padStart(2,'0')}`;return}if(end&&hours>0&&source==='sleepHours'){const [h,m]=end.split(':').map(Number),startMinutes=(h*60+m-Math.round(hours*60)+1440)%1440;$('sleepStart').value=`${String(Math.floor(startMinutes/60)).padStart(2,'0')}:${String(startMinutes%60).padStart(2,'0')}`;return}if(start&&end&&(source==='sleepStart'||source==='sleepEnd')){const duration=(minutes(end)-minutes(start)+1440)%1440;$('sleepHours').value=(duration/60).toFixed(2).replace(/0+$/,'').replace(/\.$/,'')}}
  ['sleepHours','sleepStart','sleepEnd'].forEach(id=>$(id).addEventListener('input',()=>updateSleepTimeFields(id)));
  $('sleepForm').addEventListener('submit',e=>{e.preventDefault();updateSleepTimeFields('submit');const hours=Number($('sleepHours').value);if(!hours||hours>24){toast('请填写睡眠时长，或同时填写入睡和醒来时间');return}addRecord('sleep',{date:$('sleepDate').value,hours,start:$('sleepStart').value,end:$('sleepEnd').value,quality:$('sleepQuality').value});e.target.reset();setDefaults()});
  $('foodForm').addEventListener('submit',e=>{e.preventDefault();addRecord('food',{date:$('foodDate').value,time:$('foodTime').value,feeling:$('foodFeeling').value,content:$('foodContent').value.trim(),serving:$('foodNote').value.trim(),remark:$('foodRemark').value.trim(),category:$('foodCategory').value,waterMl:Number($('foodWater').value)||0});e.target.reset();setDefaults()});
  $('bowelForm').addEventListener('submit',e=>{e.preventDefault();addRecord('bowel',{date:$('bowelDate').value,time:$('bowelTime').value,form:$('bowelFormType').value,feeling:$('bowelFeeling').value,note:$('bowelNote').value.trim()});e.target.reset();setDefaults()});
  $('weightForm').addEventListener('submit',e=>{e.preventDefault();addRecord('weight',{date:$('weightDate').value,value:Number($('weightValue').value)});e.target.reset();setDefaults()});
  // Joy 日历：记录次数、绘制本月日期，并允许按月切换。
  let joyMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);
  $('joyForm').addEventListener('submit',e=>{e.preventDefault();addRecord('joy',{date:$('joyDate').value,time:$('joyTime').value,durationMinutes:Number($('joyDuration').value)||0,note:$('joyNote').value.trim()});e.target.reset();setDefaults()});
  $('joyPrevMonth').addEventListener('click',()=>{joyMonth=new Date(joyMonth.getFullYear(),joyMonth.getMonth()-1,1);renderJoy()});
  $('joyNextMonth').addEventListener('click',()=>{joyMonth=new Date(joyMonth.getFullYear(),joyMonth.getMonth()+1,1);renderJoy()});
  function renderJoy(){
    const records=data.joy||[];const y=joyMonth.getFullYear(),m=joyMonth.getMonth();$('joyMonthTitle').textContent=`${y} 年 ${m+1} 月`;
    $('joyCount').textContent=records.length+' 次记录';
    const counts={};records.forEach(r=>counts[r.date]=(counts[r.date]||0)+1);
    const days=['日','一','二','三','四','五','六'];let html=days.map(d=>`<div class="joy-weekday">${d}</div>`).join('');
    const offset=new Date(y,m,1).getDay(),total=new Date(y,m+1,0).getDate();for(let i=0;i<offset;i++)html+='<div></div>';
    for(let day=1;day<=total;day++){const date=`${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`,n=counts[date]||0;const color=n===1?'#ffb6c1':n===2?'#fffacd':n===3?'#e46883':n>=4?'#d34e6a':'';html+=`<button type="button" class="joy-day ${n?'has-record':''} ${date===today()?'today':''}" ${date===today()?'aria-current="date"':''} title="${date} · ${n} 次" style="--joy-color:${color}" data-joy-date="${date}"><span class="joy-dot"></span><span class="joy-num">${day}</span></button>`}
    $('joyCalendar').innerHTML=html;
    const list=$('joyList');list.innerHTML=records.length?records.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.time||'').localeCompare(a.time||'')).slice(0,40).map(r=>`<div class="record-row"><div><strong>${esc(fmtDate(r.date))}${r.time?' · '+esc(r.time):''}</strong><small>${esc([r.durationMinutes?`${r.durationMinutes} 分钟`:'',r.note||'一次私人记录'].filter(Boolean).join(' · '))}</small></div><button data-remove="joy" data-id="${r.id}" aria-label="删除记录">删除 ×</button></div>`).join(''):empty('这里暂时还空着。想记的时候再记就好。 ✧');
  }
  // 通用记录显示：创建列表行、空状态和各类记录列表。
  $('joyCalendar').addEventListener('click',e=>{const b=e.target.closest('[data-joy-date]');if(!b)return;$('joyDate').value=b.dataset.joyDate;$('joyTime').value=timeNow();$('joyNote').focus();toast(`${fmtDate(b.dataset.joyDate)} · ${(data.joy||[]).filter(r=>r.date===b.dataset.joyDate).length} 次记录`) });
  function removeRecord(type,id){data[type]=data[type].filter(x=>x.id!==id);save();renderAll();toast('这条记录已删除')}
  function row(title,detail,meta,type,id){return `<div class="record-row"><div><strong>${esc(title)}</strong><small>${esc(meta||'')}${detail?' · '+esc(detail):''}</small></div><button data-remove="${type}" data-id="${id}" aria-label="删除记录">删除 ×</button></div>`}
  function empty(text){return `<div class="empty-state">${text}</div>`}
  function renderList(id,type,mapper){const el=$(id);const arr=data[type]||[];el.innerHTML=arr.length?arr.slice(0,30).map(mapper).join(''):id==='weightList'?'':empty('这里还空着。<br>想起来的时候再来记录也可以。 ✧')}
  function weatherKind(code){if(code===0)return 'sun';if([1,2,3].includes(code))return 'cloud';if([45,48].includes(code))return 'fog';if([71,73,75,77,85,86].includes(code))return 'snow';if([51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(code))return 'rain';return 'cloud'}
  function weatherIcon(code){const kind=weatherKind(Number(code));const glyph={sun:'☀',cloud:'☁',fog:'≋',snow:'❄',rain:'☂'}[kind];return `<span class="weather-icon weather-icon-${kind}" aria-hidden="true"><span>${glyph}</span><i></i><i></i><i></i></span>`}
  function renderWeatherForecast(){
    const container=$('homeWeatherChart');
    const label=$('homeWeatherRange');
    const weather=data.settings.weather?.forecast;
    if(!container||!label)return;
    if(!weather?.current||!Array.isArray(weather.forecast)||!weather.forecast.length){
      label.textContent='WAITING FOR AI';
      container.innerHTML='<div class="weather-empty"><span aria-hidden="true">✧</span><p>向 AI 询问天气后，预报会自动显示在这里。</p></div>';
      return;
    }
    const forecast=weather.forecast.filter(day=>Number.isFinite(day.lowC)&&Number.isFinite(day.highC));
    if(!forecast.length){
      label.textContent='NO FORECAST';
      container.innerHTML='<div class="weather-empty"><span aria-hidden="true">☁</span><p>天气服务暂时没有返回可显示的预报。</p></div>';
      return;
    }
    const values=forecast.flatMap(day=>[Number(day.lowC),Number(day.highC)]);
    const minimum=Math.min(...values),maximum=Math.max(...values);
    const spread=Math.max(maximum-minimum,1);
    const chartMin=minimum-spread*.08,chartMax=maximum+spread*.08;
    const current=weather.current;
    const updatedAt=data.settings.weather.updatedAt?new Date(data.settings.weather.updatedAt):null;
    const updatedText=updatedAt&&!Number.isNaN(updatedAt.getTime())
      ?updatedAt.toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})
      :'';
    const currentTime=String(current.time||'').replace('T',' ');
    const rows=forecast.map(day=>{
      const date=new Date(`${day.date}T00:00:00`);
      const dayLabel=Number.isNaN(date.getTime())?esc(day.date):`${date.getMonth()+1}/${date.getDate()}`;
      const left=Math.max(0,Math.min(100,(Number(day.lowC)-chartMin)/(chartMax-chartMin)*100));
      const width=Math.max(4,Math.min(100-left,(Number(day.highC)-Number(day.lowC))/(chartMax-chartMin)*100));
      const precipitation=Number.isFinite(day.precipitationProbabilityPercent)?`${day.precipitationProbabilityPercent}%`:'—';
      return `<div class="weather-forecast-row" aria-label="${esc(day.date)} ${esc(day.condition)}，${Number(day.lowC)} 至 ${Number(day.highC)} 摄氏度，降水概率 ${precipitation}"><span class="weather-forecast-date">${dayLabel}</span>${weatherIcon(day.weatherCode)}<span class="weather-forecast-condition">${esc(day.condition||'天气')}</span><span class="weather-range-track" title="当天气温范围：最低 ${Number(day.lowC)}°C 至最高 ${Number(day.highC)}°C；横向位置用于对比预报日之间的气温" aria-hidden="true"><i style="--weather-range-left:${left}%;--weather-range-width:${width}%"></i></span><span class="weather-forecast-temp">${Number(day.lowC)}° <b>${Number(day.highC)}°</b></span><span class="weather-precipitation">${precipitation}</span></div>`;
    }).join('');
    label.textContent=`${forecast.length} DAY FORECAST`;
    container.innerHTML=`<div class="weather-current"><div class="weather-current-icon">${weatherIcon(current.weatherCode)}<span class="weather-orbit weather-orbit-one">✦</span><span class="weather-orbit weather-orbit-two">✧</span></div><div class="weather-current-copy"><span class="weather-current-city">${esc(weather.location||data.settings.weather.city||'所在城市')} · ${esc(current.condition||'')}</span><strong>${Number.isFinite(Number(current.temperatureC))?Number(current.temperatureC):'—'}<small>°C</small></strong><span>体感 ${Number.isFinite(Number(current.feelsLikeC))?`${Number(current.feelsLikeC)}°C`:'—'}${currentTime?` · ${esc(currentTime)}`:''}</span></div><span class="weather-current-sparkle" aria-hidden="true">✧</span></div><div class="weather-forecast-chart" role="list" aria-label="未来 ${forecast.length} 天天气预报">${rows}</div><div class="weather-chart-footer"><span>彩条：当天最低至最高气温（位置对比未来预报） · 右侧百分比：降水概率</span><span>${updatedText?`更新于 ${updatedText}`:'Open-Meteo'}</span></div>`;
  }
  // 页面数据刷新：更新各类健康记录列表与睡眠/体重统计。
  function renderAll(){
    renderWeatherForecast();
    $('sleepCount').textContent=data.sleep.length+' 条记录';$('foodCount').textContent=data.food.length+' 条记录';$('bowelCount').textContent=data.bowel.length+' 条记录';$('weightCount').textContent=data.weight.length+' 条记录';
    renderFridge();
    renderList('sleepList','sleep',r=>row((r.hours??'—')+' 小时',r.quality,fmtDate(r.date)+(r.start?' · 入睡 '+r.start:'')+(r.end?' · 醒来 '+r.end:'')+(r.note?' · '+r.note:''),'sleep',r.id));
    renderList('foodList','food',r=>row(r.content,[r.serving,r.category,r.feeling,r.waterMl?`饮水 ${r.waterMl} ml`:'',(r.remark||r.note)?`备注：${r.remark||r.note}`:''].filter(Boolean).join(' · '),fmtDate(r.date)+(r.time?' · '+r.time:''),'food',r.id));
    renderList('bowelList','bowel',r=>row(r.feeling,r.form,fmtDate(r.date)+(r.time?' · '+r.time:'')+(r.note?' · '+r.note:''),'bowel',r.id));
    const recentWeights=data.weight.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
    $('weightList').innerHTML=recentWeights.slice(0,30).map(r=>row(Number(r.value).toFixed(1)+' kg','',fmtDate(r.date)+(r.note?' · '+r.note:''),'weight',r.id)).join('');
    const recentByDay=new Map();for(let offset=0;offset<5;offset++){const date=todayOffset(-offset);recentByDay.set(date,{date,totalHours:0,records:[]})}data.sleep.filter(record=>recentByDay.has(record.date)).forEach(record=>{const day=recentByDay.get(record.date);day.totalHours+=Number(record.hours)||0;day.records.push(record)});const recentDays=[...recentByDay.values()].sort((a,b)=>a.date.localeCompare(b.date));const recordedDays=recentDays.filter(day=>day.records.length).length;const averageSleep=recordedDays?recentDays.reduce((total,day)=>total+day.totalHours,0)/recordedDays:0;const sleepDialMax=Math.max(10,Math.ceil(averageSleep));$('sleepAvg').textContent=recordedDays?averageSleep.toFixed(1):'—';$('sleepDialLabel').textContent=`最近 5 天日均 / ${sleepDialMax} 小时`;const sleepProgress=Math.min(100,Math.max(0,averageSleep/sleepDialMax*100));$('sleepDial').style.setProperty('--sleep-progress',sleepProgress);const sleepDialProgress=$('sleepDialProgress');if(sleepDialProgress)sleepDialProgress.style.strokeDashoffset=String(2*Math.PI*56*(1-sleepProgress/100));renderSleepTimeline(recentDays,recordedDays);
    $('weightLatest').innerHTML=recentWeights[0]?`<div class="metric"><div class="metric-label">最近一次记录 · ${esc(fmtDate(recentWeights[0].date))}</div><div class="metric-value">${Number(recentWeights[0].value).toFixed(1)}<span class="metric-unit">kg</span></div><div class="metric-foot">仅作个人记录</div></div>`:'';renderWeightChart();
    renderMemories();renderJoy();updateApiBadge();if(data.foodAnalyses.length)renderFoodAnalysis(data.foodAnalyses[0]);
  }
  function renderSleepTimeline(records,recordedDays=records.length){
    const chart=$('sleepTimelineChart');
    const toMinutes=time=>{const [hours,minutes]=time.split(':').map(Number);return hours*60+minutes};
    const averageHours=recordedDays?records.reduce((sum,day)=>sum+day.totalHours,0)/recordedDays:0;
    const timed=records.flatMap(day=>day.records.filter(record=>record.start&&record.end));
    const axisHours=[16,20,0,4,8,12,16];
    const offsetFrom16=minutes=>(minutes-960+1440)%1440;
    const rows=records.map(day=>{const bars=day.records.filter(record=>record.start&&record.end).map(record=>{const start=toMinutes(record.start),end=toMinutes(record.end),duration=(end-start+1440)%1440||Number(record.hours||0)*60,startOffset=offsetFrom16(start),endOffset=startOffset+duration;const segments=endOffset<=1440?[[startOffset,endOffset]]:[[startOffset,1440],[0,endOffset-1440]];const spans=segments.map(([left,right])=>`<span class="sleep-time-segment" style="left:${left/1440*100}%;width:${(right-left)/1440*100}%"></span>`).join('');return `${spans}<i class="sleep-time-start" style="left:${startOffset/1440*100}%"></i><i class="sleep-time-end" style="left:${(endOffset%1440)/1440*100}%"></i>`}).join('');const total=day.records.length?`${day.totalHours.toFixed(1)}h`:'—';return `<div class="sleep-time-row"><div class="sleep-time-date">${esc(fmtDate(day.date).slice(5))}</div><div class="sleep-time-track" title="${day.records.length?`当日总睡眠 ${day.totalHours.toFixed(2)} 小时`:'当天没有睡眠记录'}">${bars}</div><div class="sleep-time-duration">${total}</div></div>`}).join('');
    const averageLabel=recordedDays?averageHours.toFixed(1):'—';
    const chartTitle=`<div class="sleep-chart-title"><span>最近 5 天 · 每日总时长与睡眠时段</span><strong>已记录日均 ${averageLabel} 小时</strong></div>`;
    const axis=`<div class="sleep-time-axis"><span></span><div>${axisHours.map((hour,index)=>`<span style="left:${index/6*100}%">${String(hour).padStart(2,'0')}</span>`).join('')}</div><span></span></div>`;
    const chartLegend='<div class="sleep-chart-legend"><span><i></i>睡眠时段</span><span>右侧为当日总睡眠 · 左侧 16:00 至次日 16:00</span></div>';
    const averageTime=selector=>{const values=timed.map(record=>toMinutes(record[selector]));const reference=values[0];const adjusted=values.map(value=>{let delta=value-reference;if(delta>720)delta-=1440;if(delta< -720)delta+=1440;return reference+delta});return((adjusted.reduce((sum,value)=>sum+value,0)/adjusted.length)%1440+1440)%1440};
    if(!timed.length){$('sleepAverageNote').textContent=`最近 5 天有 ${recordedDays} 天睡眠记录；平均时点需填写入睡与醒来时间。`;chart.innerHTML=`${chartTitle}${axis}${rows}${chartLegend}`;return}
    const averageStart=averageTime('start'),averageEnd=averageTime('end');
    const midpoint=(averageStart+((averageEnd-averageStart+1440)%1440)/2)%1440;
    const midpointHour=Math.floor(midpoint/60);
    const creature=midpointHour>=21||midpointHour<5?'夜猫子':midpointHour<8?'晨鸟':midpointHour<11?'早起的小鹿':midpointHour<15?'午后猫头鹰':'黄昏蝙蝠';
    const formatTime=minutes=>{const rounded=Math.round(minutes/5)*5%1440;return `${String(Math.floor(rounded/60)).padStart(2,'0')}:${String(rounded%60).padStart(2,'0')}`};
    $('sleepAverageNote').innerHTML=`最近 5 天有 ${recordedDays} 天睡眠记录、${timed.length} 条完整时间记录 · 平均入睡 <strong>${formatTime(averageStart)}</strong> · 平均醒来 <strong>${formatTime(averageEnd)}</strong> · 你像一只<strong>${creature}</strong>`;
    chart.innerHTML=`${chartTitle}${axis}${rows}${chartLegend}`;
  }
  function renderWeightChart(){
    const records=(data.weight||[]).filter(record=>Number.isFinite(Number(record.value))&&record.date).slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,30).reverse();
    const container=$('weightChart');
    if(!records.length){$('weightChartRange').textContent='记录趋势';container.innerHTML=empty('记录几次体重后，这里会显示变化趋势。');return}
    if(records.length===1){$('weightChartRange').textContent='1 次记录';container.innerHTML=`<div class="weight-chart-single"><strong>${Number(records[0].value).toFixed(1)} kg</strong><span>${esc(fmtDate(records[0].date))}</span><div class="small-muted">再记录一次后即可查看变化趋势。</div></div>`;return}
    const width=640,height=250,padding={top:22,right:20,bottom:42,left:52};
    const values=records.map(record=>Number(record.value));
    const spread=Math.max(...values)-Math.min(...values);
    const margin=Math.max(spread*.2,.5);
    const min=Math.floor((Math.min(...values)-margin)*2)/2;
    const max=Math.ceil((Math.max(...values)+margin)*2)/2;
    const chartWidth=width-padding.left-padding.right,chartHeight=height-padding.top-padding.bottom;
    const x=index=>padding.left+(chartWidth*index/(records.length-1));
    const y=value=>padding.top+(max-value)/(max-min)*chartHeight;
    const points=records.map((record,index)=>({x:x(index),y:y(Number(record.value)),record}));
    const path=points.map((point,index)=>`${index?'L':'M'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
    const area=`${path} L ${points.at(-1).x.toFixed(1)} ${(height-padding.bottom).toFixed(1)} L ${points[0].x.toFixed(1)} ${(height-padding.bottom).toFixed(1)} Z`;
    const ticks=Array.from({length:5},(_,index)=>max-(max-min)*index/4);
    const grid=ticks.map(value=>{const tickY=y(value);return `<g class="weight-chart-gridline"><line x1="${padding.left}" y1="${tickY}" x2="${width-padding.right}" y2="${tickY}"/><text x="${padding.left-10}" y="${tickY+4}" text-anchor="end">${value.toFixed(1)}</text></g>`}).join('');
    const markers=points.map(point=>`<circle class="weight-chart-point" cx="${point.x}" cy="${point.y}" r="4.5"><title>${esc(fmtDate(point.record.date))} · ${Number(point.record.value).toFixed(1)} kg</title></circle>`).join('');
    const labels=[points[0],points.at(-1)].map(point=>`<text class="weight-chart-date" x="${point.x}" y="${height-12}" text-anchor="${point===points[0]?'start':'end'}">${esc(fmtDate(point.record.date))}</text>`).join('');
    const change=values.at(-1)-values[0];
    const changeText=`${change>0?'+':''}${change.toFixed(1)} kg`;
    $('weightChartRange').textContent=`${records.length} 次记录 · 最近 30 条`;
    container.innerHTML=`<div class="weight-chart-summary"><strong>${changeText}</strong><span>相较首条记录</span><small>${fmtDate(records[0].date)} 至 ${fmtDate(records.at(-1).date)}</small></div><svg class="weight-chart-svg" viewBox="0 0 ${width} ${height}" role="presentation" preserveAspectRatio="none"><defs><linearGradient id="weightAreaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--petal-blue)" stop-opacity=".28"/><stop offset="100%" stop-color="var(--petal-pink)" stop-opacity=".015"/></linearGradient><linearGradient id="weightLineStroke" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="var(--petal-blue)"/><stop offset="100%" stop-color="var(--petal-pink)"/></linearGradient></defs>${grid}<path class="weight-chart-area" d="${area}"/><path class="weight-chart-line" d="${path}"/>${markers}${labels}</svg>`;
  }
  // 删除记录和快捷入口：处理列表删除按钮及顶部快速记录按钮。
  document.addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(b)removeRecord(b.dataset.remove,b.dataset.id)});
  // 主题切换：在日间和夜间配色间切换，并记住用户的选择。
  function updateThemeToggle(day){$('themeToggleIcon').textContent=day?'☾':'☼';$('themeToggleLabel').textContent=day?'夜间':'日间'}
  $('themeToggle').addEventListener('click',()=>{document.body.classList.toggle('day-mode');const day=document.body.classList.contains('day-mode');updateThemeToggle(day);try{localStorage.setItem('petalTheme',day?'day':'night')}catch(e){}});
  try{const savedTheme=localStorage.getItem('petalTheme');if(savedTheme==='day'){document.body.classList.add('day-mode');updateThemeToggle(true)}}catch(e){}
  // 记忆管理：添加、显示和删除用户手动保存的记忆条目。
  let activeArchiveId='';
  $('memoryForm').addEventListener('submit',e=>{e.preventDefault();let archive=data.memoryArchives.find(item=>item.id===activeArchiveId&&(!item.system||item.personalProfile));if(!archive)archive=data.memoryArchives.find(item=>!item.system);if(!archive){archive={id:Date.now().toString(36),name:'我的存档',createdAt:today(),items:[]};data.memoryArchives.push(archive)}archive.items.unshift({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),type:$('memoryType').value,date:$('memoryDate').value,content:$('memoryContent').value.trim()});save();renderMemoryArchives();renderMemoryDetail();e.target.reset();setDefaults();toast('已加入存档记忆 ✧')});
  function getHealthArchiveItems(){return data.memoryArchives.find(item=>item.id==='health-archive')?.items||[]}
  function renderMemoryArchives(){const health=getHealthArchiveItems();$('memoryArchiveCards').innerHTML=data.memoryArchives.map(archive=>{const count=archive.id==='health-archive'?health.length:archive.items.filter(item=>!item.todoId).length+(archive.personalProfile?0:(data.todos||[]).filter(todo=>!todo.completedAt).length);return `<button type="button" class="memory-archive-card" data-memory-archive="${esc(archive.id)}"><span class="memory-archive-icon">${archive.id==='health-archive'?'✧':archive.personalProfile?'♡':'▤'}</span><strong>${esc(archive.name)}</strong><small>${count} 条记忆 · ${esc(archive.createdAt||'')}</small></button>`}).join('')||empty('记忆库暂时为空。')}
  function renderMemoryDetail(){const archive=data.memoryArchives.find(item=>item.id===activeArchiveId);if(!archive){$('memoryDetail').hidden=true;return}$('memoryDetail').hidden=false;$('memoryDetailTitle').textContent=archive.name;const items=archive.id==='health-archive'?getHealthArchiveItems():[...(archive.items||[]).filter(item=>!item.todoId),...(archive.personalProfile?[]:(data.todos||[]).filter(todo=>!todo.completedAt).map(todo=>({id:`global-todo-${todo.id}`,type:'待办',date:todo.createdAt,content:todo.content,source:'全局待办',globalTodo:true})))];$('memoryDetailCount').textContent=`${items.length} ITEMS`;$('memoryForm').hidden=!!archive.system&&!archive.personalProfile;$('healthMemoryControls').hidden=archive.id!=='health-archive';$('healthSummarize').hidden=archive.id!=='health-archive';$('deleteSelectedMemories').hidden=!!archive.system&&!archive.personalProfile;$('deleteMemoryArchive').hidden=!!archive.system;$('deleteAllArchiveMemories').hidden=!!archive.system&&!archive.personalProfile;$('memoryList').innerHTML=items.length?items.map(item=>{const status=item.globalTodo?' · 未完成':'';const meta=`${esc(item.type||'其他')} · ${esc(fmtDate(item.date))}${item.source?` · ${esc(item.source)}`:''}${status}`;return item.globalTodo?`<div class="memory-item"><span><small>${meta}</small><p>${esc(item.content)}</p></span></div>`:`<label class="memory-item"><input type="checkbox" data-memory-select="${esc(item.id)}"><span><small>${meta}</small><p>${esc(item.content)}</p></span></label>`}).join(''):empty('这份存档还没有记忆条目。')}
  $('memoryArchiveCards').addEventListener('click',e=>{const card=e.target.closest('[data-memory-archive]');if(!card)return;activeArchiveId=card.dataset.memoryArchive;renderMemoryDetail()});
  $('memoryBack').addEventListener('click',()=>{activeArchiveId='';$('memoryDetail').hidden=true});
  $('deleteMemoryArchive').addEventListener('click',()=>{const archive=data.memoryArchives.find(item=>item.id===activeArchiveId);if(!archive||archive.system||archive.id==='health-archive')return;if(!confirm(`确定删除「${archive.name}」存档及其中全部记忆吗？此操作无法撤销。`))return;window.petalDeletedMemoryArchiveIds=[...new Set([...(window.petalDeletedMemoryArchiveIds||[]),archive.id])];data.memoryArchives=data.memoryArchives.filter(item=>item.id!==archive.id);data.settings.chatMemoryArchiveIds=(data.settings.chatMemoryArchiveIds||[]).filter(id=>id!==archive.id);activeArchiveId='';save();renderMemoryArchives();renderMemoryDetail();toast('存档及其中记忆已删除')});
  $('newMemoryArchive').addEventListener('click',()=>{const input=$('newMemoryArchiveName'),name=input.value.trim();if(!name){toast('请先填写存档名称');input.focus();return}data.memoryArchives.push({id:Date.now().toString(36),name,createdAt:today(),items:[]});input.value='';save();renderMemoryArchives()});
  $('deleteSelectedMemories').addEventListener('click',()=>{const archive=data.memoryArchives.find(item=>item.id===activeArchiveId);if(!archive||archive.id==='health-archive')return;const selected=new Set([...document.querySelectorAll('[data-memory-select]:checked')].map(input=>input.dataset.memorySelect));if(!selected.size){toast('先选择要删除的条目');return}archive.items=archive.items.filter(item=>!selected.has(item.id));replaceMemoryArchiveId=archive.id;save();renderMemoryArchives();renderMemoryDetail();toast(`已删除 ${selected.size} 条记忆`)});
  $('deleteAllArchiveMemories').addEventListener('click',()=>{const archive=data.memoryArchives.find(item=>item.id===activeArchiveId);if(!archive||archive.id==='health-archive')return;archive.items=[];replaceMemoryArchiveId=archive.id;save();renderMemoryArchives();renderMemoryDetail();toast('这份存档已清空')});
  $('importMemoryFile').addEventListener('click',()=> $('memoryImportFile').click());
  $('memoryImportFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const parsed=JSON.parse(await file.text());const items=Array.isArray(parsed)?parsed:Array.isArray(parsed.items)?parsed.items:Array.isArray(parsed.memories)?parsed.memories:null;if(!items)throw Error();let archive=data.memoryArchives.find(item=>item.id===activeArchiveId&&!item.system);if(!archive){archive={id:Date.now().toString(36),name:parsed.name||file.name.replace(/\.json$/i,''),createdAt:today(),items:[]};data.memoryArchives.push(archive)}archive.items.unshift(...items.map(item=>({id:item.id||Date.now().toString(36)+Math.random().toString(36).slice(2,6),type:['长期偏好','待办','重要经历','当前近况','其他'].includes(item.type)?item.type:'其他',date:item.date||today(),content:String(item.content||'')})));save();renderMemoryArchives();if(activeArchiveId)renderMemoryDetail();toast(`已导入 ${items.length} 条记忆`)}catch(error){toast('文件格式不正确，请选择 JSON 记忆文件')}finally{e.target.value=''}});
  function renderMemories(){const oldArchive=data.memoryArchives.find(item=>item.id==='legacy-archive');if(oldArchive)data.memories=oldArchive.items;renderMemoryArchives();renderMemoryDetail()}
  let currentStickerCategory='最近';
  let stickerMultiSelect=false;
  const stickerActionPanels={categories:'stickerCategoryManager',import:'stickerImportManager',select:'stickerMultiManager'};
  const stickerManagerDialog=document.createElement('dialog');
  stickerManagerDialog.className='sticker-manager-dialog';
  stickerManagerDialog.setAttribute('aria-label','表情包管理');
  document.body.append(stickerManagerDialog);
  Object.values(stickerActionPanels).forEach(id=>stickerManagerDialog.append($(id)));
  stickerManagerDialog.addEventListener('close',()=>{
    if($('stickerGrid').parentElement===stickerManagerDialog){
      $('chatSlimeToggle').closest('label').after($('stickerGrid'));
      stickerManagerDialog.classList.remove('sticker-multi-dialog');
      stickerMultiSelect=false;
      $('stickerMultiManager').hidden=true;
      renderStickerMenu();
      $('emojiMenu').classList.add('open');
    }
  });
  stickerManagerDialog.addEventListener('click',event=>{if(event.target===stickerManagerDialog)stickerManagerDialog.close()});
  function stickerCategories(){return data.stickerCategories}
  function stickerCategorySetting(category){return data.stickerCategorySettings[category]||(data.stickerCategorySettings[category]={aiEnabled:true})}
  function analyzeStickerPrefix(stickers){
    const urls=stickers.map(sticker=>sticker.url).filter(url=>{
      if(typeof url!=='string')return false;
      try{return ['http:','https:'].includes(new URL(url).protocol)}catch{return false}
    });
    if(!urls.length)return '';
    const authorities=urls.map(url=>url.match(/^https?:\/\/[^/]+/i)?.[0]||'');
    if(authorities.some(authority=>!authority||authority!==authorities[0]))return '';
    let commonPath=urls[0].slice(authorities[0].length).split(/[?#]/,1)[0];
    for(const url of urls.slice(1)){
      const path=url.slice(authorities[0].length).split(/[?#]/,1)[0];
      let index=0;
      while(index<commonPath.length&&index<path.length&&commonPath[index]===path[index])index++;
      commonPath=commonPath.slice(0,index);
    }
    const directoryEnd=commonPath.lastIndexOf('/');
    return directoryEnd<0?'':`${authorities[0]}${commonPath.slice(0,directoryEnd+1)}`;
  }
  window.petalAnalyzeStickerPrefix=analyzeStickerPrefix;
  function stickersForCurrentCategory(){if(currentStickerCategory==='最近'){const byId=new Map(data.stickers.map(sticker=>[sticker.id,sticker]));return data.stickerRecentIds.map(id=>byId.get(id)).filter(Boolean)}return data.stickers.filter(sticker=>sticker.category===currentStickerCategory)}
  function renderStickerMenu(){const categories=stickerCategories();if(currentStickerCategory!=='最近'&&!categories.includes(currentStickerCategory))currentStickerCategory=categories[0];const recent=data.stickerRecentIds.filter(id=>data.stickers.some(sticker=>sticker.id===id));$('stickerCategoryTabs').innerHTML=`<button type="button" role="tab" class="sticker-category-tab ${currentStickerCategory==='最近'?'active':''}" aria-selected="${currentStickerCategory==='最近'}" data-sticker-category="最近">最近</button>${categories.map(category=>`<button type="button" role="tab" class="sticker-category-tab ${currentStickerCategory===category?'active':''}" aria-selected="${currentStickerCategory===category}" data-sticker-category="${esc(category)}">${esc(category)}</button>`).join('')}`;if(!recent.length)$('stickerCategoryTabs').querySelector('[data-sticker-category="最近"]').classList.add('has-no-recent');const stickers=stickersForCurrentCategory();$('stickerGrid').classList.toggle('is-multi-select',stickerMultiSelect);$('selectAllStickers').checked=false;$('stickerGrid').innerHTML=stickers.map(sticker=>`<div class="sticker-card"><button type="button" class="sticker-choice" data-sticker="${esc(sticker.id)}" title="${esc(`${sticker.name||'表情包'} · ${sticker.url}`)}"><img src="${esc(sticker.url)}" alt="${esc(sticker.name||'表情包')}" loading="lazy"><span>${esc(sticker.name||'表情包')}</span></button>${stickerMultiSelect?`<input type="checkbox" class="sticker-select-checkbox" data-sticker-select="${esc(sticker.id)}" aria-label="选择${esc(sticker.name||'表情包')}">`:''}</div>`).join('')||'<div class="sticker-empty"><span aria-hidden="true">✧</span><span>这个分类还没有图片表情包。</span><span>点击右上角 + 添加图床链接。</span></div>';renderStickerCategoryManager();renderStickerImportCategories();renderMoveStickerCategories();if(currentStickerCategory!=='最近')$('stickerImportCategory').value=currentStickerCategory}
  function renderStickerCategoryManager(){$('stickerCategoryManagerList').innerHTML=stickerCategories().map(category=>{const setting=stickerCategorySetting(category);const stickers=data.stickers.filter(sticker=>sticker.category===category);const prefix=analyzeStickerPrefix(stickers);const suffixes=prefix?stickers.filter(sticker=>typeof sticker.url==='string'&&sticker.url.startsWith(prefix)&&sticker.url.length>prefix.length).map(sticker=>({sticker,suffix:sticker.url.slice(prefix.length)})):[];return `<article class="sticker-category-config"><div class="sticker-category-config-head"><label><input type="checkbox" data-sticker-ai-category="${esc(category)}" ${setting.aiEnabled?'checked':''}> <strong>${esc(category)}</strong><small>发送给 AI</small></label><button type="button" class="danger-button" data-sticker-category-delete="${esc(category)}">删除</button></div><div class="field"><span>自动识别的图床前缀</span><code class="sticker-auto-prefix">${prefix?esc(prefix):'添加有效图片链接后自动识别'}</code></div><details><summary>查看后缀库详情（${suffixes.length}）</summary>${suffixes.length?`<ul>${suffixes.map(({sticker,suffix})=>`<li><span>${esc(sticker.name||'表情包')}</span><div><code title="${esc(sticker.url)}">${esc(sticker.url)}</code><small>AI 后缀：${esc(suffix)}</small></div></li>`).join('')}</ul>`:'<p>此分类暂无可拆分的图片链接，请检查图片链接是否使用同一图床地址。</p>'}</details></article>`}).join('')}
  function renderStickerImportCategories(){const choices=stickerCategories().map(category=>`<option value="${esc(category)}">${esc(category)}</option>`).join('');$('stickerImportCategory').innerHTML=choices}
  function renderMoveStickerCategories(){const choices=stickerCategories().map(category=>`<option value="${esc(category)}">${esc(category)}</option>`).join('');$('moveStickerCategory').innerHTML=choices}
  function openStickerAction(action){if(action==='select'){if(currentStickerCategory==='最近'&&!stickersForCurrentCategory().length&&data.stickerCategories.length)currentStickerCategory=data.stickerCategories[0];Object.values(stickerActionPanels).forEach(id=>$(id).hidden=true);$('stickerActionsMenu').hidden=true;stickerMultiSelect=true;$('stickerGrid').after($('stickerMultiManager'));$('stickerMultiManager').hidden=false;renderStickerMenu();$('emojiMenu').classList.add('open');return}stickerMultiSelect=false;Object.values(stickerActionPanels).forEach(id=>$(id).hidden=true);$('stickerActionsMenu').hidden=true;$('emojiMenu').classList.remove('open');$(stickerActionPanels[action]).hidden=false;stickerManagerDialog.showModal()}
  $('stickerCategoryTabs').addEventListener('click',event=>{const button=event.target.closest('[data-sticker-category]');if(!button)return;event.stopPropagation();currentStickerCategory=button.dataset.stickerCategory;renderStickerMenu()});
  $('stickerManage').addEventListener('click',()=>{$('stickerActionsMenu').hidden=!$('stickerActionsMenu').hidden});
  $('stickerActionsMenu').addEventListener('click',event=>{const button=event.target.closest('[data-sticker-action]');if(button){event.stopPropagation();openStickerAction(button.dataset.stickerAction)}});
  $('stickerMultiManager').addEventListener('click',event=>{if(!event.target.closest('[data-sticker-close-manager]'))return;stickerMultiSelect=false;$('stickerMultiManager').hidden=true;renderStickerMenu()});
  stickerManagerDialog.addEventListener('click',event=>{if(event.target.closest('[data-sticker-close-manager]')){event.stopPropagation();Object.values(stickerActionPanels).forEach(id=>$(id).hidden=true);stickerManagerDialog.close()}});
  $('addStickerCategory').addEventListener('click',()=>{const input=$('newStickerCategoryName'),category=input.value.trim();if(!category){toast('请先填写分类名称');input.focus();return}if(data.stickerCategories.includes(category)){toast('这个分类已经存在');return}data.stickerCategories.push(category);data.stickerCategorySettings[category]={aiEnabled:true};input.value='';currentStickerCategory=category;save();renderStickerMenu()});
  $('stickerCategoryManagerList').addEventListener('change',event=>{const checkbox=event.target.closest('[data-sticker-ai-category]');if(checkbox){stickerCategorySetting(checkbox.dataset.stickerAiCategory).aiEnabled=checkbox.checked;save()}});
  $('stickerCategoryManagerList').addEventListener('click',event=>{const button=event.target.closest('[data-sticker-category-delete]');if(!button)return;const category=button.dataset.stickerCategoryDelete;const stickersToDelete=data.stickers.filter(sticker=>sticker.category===category);if(!confirm(`删除「${category}」分类及其中 ${stickersToDelete.length} 张表情包？此操作无法撤销。`))return;const deletedStickerIds=new Set(stickersToDelete.map(sticker=>sticker.id));data.stickers=data.stickers.filter(sticker=>sticker.category!==category);data.stickerRecentIds=data.stickerRecentIds.filter(id=>!deletedStickerIds.has(id));data.stickerCategories=data.stickerCategories.filter(item=>item!==category);delete data.stickerCategorySettings[category];if(currentStickerCategory===category)currentStickerCategory=data.stickerCategories[0]||'最近';save();renderStickerMenu()});
  $('stickerGrid').addEventListener('click',e=>{const button=e.target.closest('[data-sticker]');if(!button)return;if(stickerMultiSelect){const checkbox=button.closest('.sticker-card')?.querySelector('[data-sticker-select]');if(checkbox)checkbox.checked=!checkbox.checked;return}const sticker=data.stickers.find(item=>item.id===button.dataset.sticker);if(sticker){const messages=$('messages'),previousScrollTop=messages.scrollTop,wasAtBottom=messages.scrollHeight-messages.clientHeight-previousScrollTop<=24;data.stickerRecentIds=[sticker.id,...data.stickerRecentIds.filter(id=>id!==sticker.id)].slice(0,30);const message={id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),role:'user',text:`[贴图:${sticker.url}]`,time:timeNow()};data.chat.push(message);save();appendStickerMessage(message,previousScrollTop,wasAtBottom);window.dispatchEvent(new Event('petal-data-updated'))}});
  $('selectAllStickers').addEventListener('change',event=>{document.querySelectorAll('#stickerGrid [data-sticker-select]').forEach(input=>{input.checked=event.target.checked})});
  $('deleteSelectedStickers').addEventListener('click',()=>{const selected=new Set([...document.querySelectorAll('#stickerGrid [data-sticker-select]:checked')].map(input=>input.dataset.stickerSelect));if(!selected.size){toast('先选择要删除的表情包');return}data.stickers=data.stickers.filter(sticker=>!selected.has(sticker.id));data.stickerRecentIds=data.stickerRecentIds.filter(id=>!selected.has(id));save();renderStickerMenu();toast(`已删除 ${selected.size} 张表情包`)});
  $('moveSelectedStickers').addEventListener('click',()=>{const selected=new Set([...document.querySelectorAll('#stickerGrid [data-sticker-select]:checked')].map(input=>input.dataset.stickerSelect));if(!selected.size){toast('先选择要移动的表情包');return}const category=$('moveStickerCategory').value;if(selected.size&&currentStickerCategory===category){toast('所选表情包已在这个分类中');return}data.stickers.forEach(sticker=>{if(selected.has(sticker.id))sticker.category=category});save();renderStickerMenu();toast(`已移动 ${selected.size} 张表情包到「${category}」`)});
  function parseStickerEntries(text){
    const entries=[];
    let previousLabel='';
    for(const rawLine of text.split(/\r?\n/)){
      const line=rawLine.trim().replace(/^\s*(?:[-*•]\s*)/,'');
      if(!line)continue;
      const regex=/https?:\/\/[^\s"'<>]+/gi;
      let match,lastEnd=0,found=false;
      while((match=regex.exec(line))){
        const url=match[0].replace(/[),.;!?，。；）】]+$/,'');
        if(!url)continue;
        const inlineLabel=line.slice(lastEnd,match.index).replace(/https?:\/\/\S+/gi,'').replace(/^[\s:：=—\-|,，]+|[\s:：=—\-|,，]+$/g,'').trim();
        const label=inlineLabel||(!found?previousLabel:'');
        entries.push({name:label||url.split('/').pop().split('?')[0]||'表情包',url});
        lastEnd=regex.lastIndex;
        found=true;
        if(!inlineLabel)previousLabel='';
      }
      if(!found)previousLabel=line.replace(/^[\s:：=—\-|,，]+|[\s:：=—\-|,，]+$/g,'').trim();
    }
    return entries;
  }
  function addStickerEntries(text,category){const entries=parseStickerEntries(text);if(!entries.length)throw new Error('没有识别到图片链接，请检查名称和 URL 格式。');let added=0;for(const entry of entries){if(data.stickers.some(sticker=>sticker.url===entry.url&&sticker.category===category))continue;data.stickers.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,8),url:entry.url,name:entry.name,category});added++}return {added,total:entries.length}}
  $('importStickerLinks').addEventListener('click',()=>{const text=$('stickerImportText').value.trim();const groupName=$('stickerImportGroupName').value.trim();let category=$('stickerImportCategory').value||stickerCategories()[0];try{if(groupName){category=groupName;if(!data.stickerCategories.includes(category)){data.stickerCategories.push(category);data.stickerCategorySettings[category]={aiEnabled:true}}}if(!category)throw new Error('请先新增分类，或填写新建分组名称。');const result=addStickerEntries(text,category);currentStickerCategory=category;stickerMultiSelect=false;$('stickerImportText').value='';$('stickerImportGroupName').value='';save();renderStickerMenu();toast(`导入完成：新增 ${result.added} 张，识别 ${result.total} 条`)}catch(error){toast(error.message)}});
  async function unzipTextEntries(buffer){const bytes=new Uint8Array(buffer),view=new DataView(buffer);let end=-1;for(let offset=bytes.length-22;offset>=Math.max(0,bytes.length-65557);offset--){if(view.getUint32(offset,true)===0x06054b50){end=offset;break}}if(end<0)throw Error('ZIP 文件结构无效');const count=view.getUint16(end+10,true),directoryOffset=view.getUint32(end+16,true),entries=[];let cursor=directoryOffset;for(let index=0;index<count;index++){if(view.getUint32(cursor,true)!==0x02014b50)throw Error('ZIP 目录损坏');const method=view.getUint16(cursor+10,true),compressedSize=view.getUint32(cursor+20,true),nameLength=view.getUint16(cursor+28,true),extraLength=view.getUint16(cursor+30,true),commentLength=view.getUint16(cursor+32,true),localOffset=view.getUint32(cursor+42,true);const name=new TextDecoder().decode(bytes.slice(cursor+46,cursor+46+nameLength));cursor+=46+nameLength+extraLength+commentLength;if(!/\.(txt|xml|docx)$/i.test(name))continue;const localNameLength=view.getUint16(localOffset+26,true),localExtraLength=view.getUint16(localOffset+28,true),dataStart=localOffset+30+localNameLength+localExtraLength,compressed=bytes.slice(dataStart,dataStart+compressedSize);let content;if(method===0)content=compressed;else if(method===8){const stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));content=new Uint8Array(await new Response(stream).arrayBuffer())}else continue;entries.push({name,bytes:content,text:new TextDecoder().decode(content)})}return entries}
  function extractDocxUrls(entries){const xml=entries.find(entry=>entry.name==='word/document.xml')?.text;if(!xml)throw Error('DOCX 中没有找到正文');const documentXml=new DOMParser().parseFromString(xml,'application/xml');if(documentXml.querySelector('parsererror'))throw Error('DOCX 正文 XML 无法解析');const relationships=entries.find(entry=>entry.name==='word/_rels/document.xml.rels')?.text||'';const relXml=new DOMParser().parseFromString(relationships,'application/xml');const relationMap=new Map([...relXml.getElementsByTagNameNS('*','Relationship')].map(relation=>[relation.getAttribute('Id'),relation.getAttribute('Target')]));const paragraphs=[...documentXml.getElementsByTagNameNS('*','p')];return paragraphs.map(paragraph=>{const parts=[];const visit=node=>{if(node.nodeType!==Node.ELEMENT_NODE){if(node.nodeType===Node.TEXT_NODE)parts.push(node.textContent);return}if(node.localName==='hyperlink'){const label=[...node.getElementsByTagNameNS('*','t')].map(text=>text.textContent).join('');const target=relationMap.get(node.getAttribute('r:id'))||'';parts.push(target?`${label||'表情包'}：${target}`:label);return}if(node.localName==='t'){parts.push(node.textContent);return}for(const child of node.childNodes)visit(child)};for(const child of paragraph.childNodes)visit(child);return parts.join('').trim()}).filter(Boolean).join('\n')}
  async function readBatchStickerFile(file){const extension=file.name.toLowerCase().split('.').pop();if(extension==='txt')return await file.text();if(!['docx','zip'].includes(extension))throw Error('不支持的文件类型');const entries=await unzipTextEntries(await file.arrayBuffer());if(extension==='docx')return extractDocxUrls(entries);const contents=[];for(const entry of entries){if(/\.txt$/i.test(entry.name))contents.push(entry.text);if(/\.docx$/i.test(entry.name))contents.push(extractDocxUrls(await unzipTextEntries(entry.bytes.slice().buffer)))}return contents.join('\n')}
  $('stickerBatchFile').addEventListener('change',async e=>{const files=[...e.target.files];try{const contents=[];for(const file of files)contents.push(await readBatchStickerFile(file));$('stickerImportText').value=[$('stickerImportText').value.trim(),...contents].filter(Boolean).join('\n');openStickerAction('import');toast(`已读取 ${files.length} 个文档，请检查列表后点击“导入列表”`)}catch(error){toast(error.message||'文档读取失败')}finally{e.target.value=''}});
  $('analyzeFood').addEventListener('click',analyzeFood);
  async function analyzeFood(){const entries=data.food.filter(record=>record.date===today());if(!entries.length){toast('今天还没有饮食记录');return}const api=data.settings.api||{};const key=$('apiKey').value.trim();if(!api.model||!api.base||!key){toast('请在 API 连接中填写模型、API 地址和临时 API Key');return}const button=$('analyzeFood');button.disabled=true;button.textContent='正在分析…';try{const response=await fetch(`${api.base.replace(/\/$/,'')}/chat/completions`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify({model:api.model,temperature:.2,response_format:{type:'json_object'},messages:[{role:'system',content:'你是谨慎的营养记录分析助手。根据食物描述和份量估算热量与营养素；信息不足时标记 estimateConfidence 为 low，并说明份量未知。不要诊断、不要提出减重建议。仅返回 JSON：summary, caloriesKcal, nutrients[{name,amount,unit,dailyPercent}], note。脂肪、蛋白质、碳水、纤维至少包含。'}, {role:'user',content:JSON.stringify(entries.map(({date,time,content,serving,note})=>({date,time,food:content,portion:serving||note||''}))) }]})});if(!response.ok)throw Error(`模型请求失败（${response.status}）`);const payload=await response.json();const content=payload.choices?.[0]?.message?.content;if(!content)throw Error('模型没有返回分析内容');const result=JSON.parse(content);if(!Array.isArray(result.nutrients))throw Error('营养数据格式无效');const analysis={id:Date.now().toString(36),date:today(),...result};data.foodAnalyses.unshift(analysis);const archive=data.memoryArchives.find(item=>item.id==='health-archive');archive.items.unshift({id:`food-analysis-${analysis.id}`,type:'当前近况',source:'饮食分析',date:today(),content:`饮食分析：${analysis.summary}；约 ${analysis.caloriesKcal??'—'} 千卡。${analysis.note||''}`});save();renderFoodAnalysis(analysis);toast('分析已完成并保存到健康记忆')}catch(error){toast(`分析失败：${error.message}`)}finally{button.disabled=false;button.textContent='分析今日饮食'}}
  function renderFoodAnalysis(analysis){
    $('foodAnalysis').hidden=false;
    $('foodAnalysisDate').textContent=fmtDate(analysis.date);
    $('foodAnalysisSummary').innerHTML=`<div class="nutrition-energy"><div><div class="summary-label">✧ 今日能量摄入估算</div><div class="summary-number">${Number(analysis.caloriesKcal||0)} <small>kcal</small></div></div><div class="nutrition-energy-note">${esc(analysis.summary||'营养摄入概览')}</div></div>`;
    const waterMl=(data.food||[]).filter(record=>record.date===analysis.date).reduce((total,record)=>total+(Number(record.waterMl)||0),0);
    const nutrients=(analysis.nutrients||[]).filter(nutrient=>!/(水|water)/i.test(nutrient.name||''));
    nutrients.push({name:'饮水',amount:waterMl,unit:'ml',dailyPercent:waterMl/20});
    const colors=['#ffcad4','#9ed4d1','#e8df9e','#c8b8e8','#e9bea9','#a9c9e5'];
    const circumference=2*Math.PI*43;
    $('nutritionGrid').innerHTML=`<div class="nutrition-section-label">NUTRIENT INTAKE ／ 营养素摄入</div><div class="nutrition-rings">${nutrients.map((nutrient,index)=>{
      const percent=Math.max(0,Math.min(100,Number(nutrient.dailyPercent)||0));
      const amount=esc(nutrient.amount??'—');
      const unit=esc(nutrient.unit||'');
      const remaining=Math.max(0,100-percent);
      return `<div class="nutrition-ring-item" style="--ring-color:${colors[index%colors.length]}"><div class="nutrition-ring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="nutrition-ring-track" cx="50" cy="50" r="43"/><circle class="nutrition-ring-progress" cx="50" cy="50" r="43" stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${(circumference*(1-percent/100)).toFixed(2)}"/></svg><div class="nutrition-ring-center"><strong>${amount}</strong><span>${unit}</span><small>${percent.toFixed(percent%1?1:0)}%</small></div></div><div class="nutrition-ring-name">${esc(nutrient.name||'营养素')}</div><div class="nutrition-ring-remaining">${remaining>0?`参考值内还差 <b>${remaining.toFixed(remaining%1?1:0)}%</b>`:'已达到参考值'}</div></div>`;
    }).join('')}</div>`;
    $('foodAnalysisNote').textContent=analysis.note||'营养数据为模型估算，实际值会因食材与份量而异。';
  }
  // API 和语音设置：只保存界面偏好，不会在此页面连接外部服务。
  $('apiProvider').addEventListener('change',()=>{if($('apiProvider').value==='openai')$('apiModel').placeholder='填写你要使用的 OpenAI 模型 ID';else if($('apiProvider').value==='gemini')$('apiModel').placeholder='填写你要使用的 Gemini 模型 ID';else $('apiModel').placeholder='填写兼容服务支持的模型 ID'});
  $('apiForm').addEventListener('submit',e=>{e.preventDefault();data.settings.api={provider:$('apiProvider').value,model:$('apiModel').value.trim(),base:$('apiBase').value.trim(),systemNote:$('apiSystemNote').value.trim()};save();$('apiFeedback').textContent='界面设置已保存。API Key 不会保存；聊天和饮食分析会在你点击发送/分析时调用配置的服务。';updateApiBadge();toast('设置已保存')});
  $('testApi').addEventListener('click',()=>{const a=data.settings.api;if(!$('apiModel').value.trim()){$('apiFeedback').textContent='请先填写模型名称。此按钮只检查必填项，不会发送网络请求。';return} $('apiFeedback').textContent='表单信息已填写。点击聊天发送或饮食分析时，将请求配置的模型服务。';toast('配置已检查')});
  function updateApiBadge(){const a=data.settings.api;const configured=!!(a&&a.model);$('apiStatusTag').textContent=configured?'已填写模型信息 · 未连接':'尚未连接 API';}
  // 美化设置：滑块实时预览，图片压缩后保存，气泡样式仅接受 CSS 属性。
  function updateAppearancePreview(){
    const root=document.documentElement;
    root.style.setProperty('--chat-glass-blur',`${$('chatBlur').value}px`);
    root.style.setProperty('--chat-glass-opacity',String(Number($('chatOpacity').value)/100));
    root.style.setProperty('--chat-message-font-family',({system:'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',sans:'Arial, "Microsoft YaHei", sans-serif',serif:'Georgia, "Noto Serif SC", serif',noto:'"Noto Serif SC", serif',mono:'"DM Mono", "Microsoft YaHei", monospace'})[$('chatFontFamily').value]||'system-ui, sans-serif');
    root.style.setProperty('--chat-bubble-font-size',`${$('chatBubbleFontSize').value}px`);
    root.style.setProperty('--chat-bubble-padding-y',`${$('chatBubblePaddingY').value}px`);
    root.style.setProperty('--chat-message-gap',`${$('chatMessageGap').value}px`);
    const glow=Number($('chatBubbleGlow').value);
    root.style.setProperty('--chat-bubble-glow-blur',`${(glow*.22).toFixed(1)}px`);
    root.style.setProperty('--chat-bubble-glow-opacity',String(glow/100*.36));
    const rain=Number($('rainIntensity').value);
    $('chatBubbleGlowValue').textContent=`${glow}%`;
    $('rainIntensityValue').textContent=rain===0?'默认':rain<25?'小雨':rain<50?'中雨':rain<75?'大雨':'倾盆大雨';
    window.petalSetRainIntensity?.(rain);
    $('chatBlurValue').textContent=$('chatBlur').value+' px';$('chatOpacityValue').textContent=$('chatOpacity').value+'%';
    $('chatBubbleFontSizeValue').textContent=$('chatBubbleFontSize').value+' px';
    $('chatBubblePaddingYValue').textContent=$('chatBubblePaddingY').value+' px';
    $('chatMessageGapValue').textContent=$('chatMessageGap').value+' px';
  }
  ['chatBlur','chatOpacity','chatBubbleFontSize','chatBubblePaddingY','chatMessageGap','chatBubbleGlow','rainIntensity'].forEach(id=>$(id).addEventListener('input',updateAppearancePreview));
  $('chatFontFamily').addEventListener('change',updateAppearancePreview);
  const isSafeBubbleCss=css=>!/@import\b|expression\s*\(|javascript\s*:/i.test(css);
  function saveBubbleCss(css,activePresetId=''){
    const builtin=BUILTIN_BUBBLE_PRESETS.some(preset=>preset.id===activePresetId);
    data.settings.appearance={...data.settings.appearance,chatBlur:Number($('chatBlur').value),chatOpacity:Number($('chatOpacity').value),chatFontFamily:$('chatFontFamily').value,chatBubbleFontSize:Number($('chatBubbleFontSize').value),chatBubblePaddingY:Number($('chatBubblePaddingY').value),chatMessageGap:Number($('chatMessageGap').value),chatBubbleGlow:Number($('chatBubbleGlow').value),rainIntensity:Number($('rainIntensity').value),bubbleCss:builtin?'':css,activeBubblePresetId:activePresetId};
    $('chatBubbleCss').value=css;
    applyAppearance();save();renderBubblePresetOptions(activePresetId);
  }
  $('saveAppearance').addEventListener('click',()=>{
    const css=$('chatBubbleCss').value.trim();
    const matchingPreset=getBubblePresets().find(preset=>preset.css===css);
    saveBubbleCss(css,matchingPreset?.id||'');toast('美化设置已保存');
  });
  $('saveBubblePreset').addEventListener('click',()=>{
    const name=$('chatBubblePresetName').value.trim();
    const css=$('chatBubbleCss').value.trim();
    if(!name){toast('请先填写预设名称。');$('chatBubblePresetName').focus();return}
    if(name===DEFAULT_BUBBLE_PRESET.name||BUILTIN_BUBBLE_PRESETS.some(preset=>preset.name===name)){toast('这是代码内置预设，请换一个名称保存副本。');return}
    const presets=data.settings.appearance.bubblePresets||[];
    let preset=presets.find(item=>item.name===name);
    if(preset)preset.css=css;
    else{preset={id:`bubble-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`,name,css};presets.push(preset)}
    data.settings.appearance.bubblePresets=presets;
    saveBubbleCss(css,preset.id);$('chatBubblePresetName').value='';toast(`气泡预设「${name}」已保存`);
  });
  $('applyBubblePreset').addEventListener('click',()=>{
    const preset=getBubblePresets().find(item=>item.id===$('chatBubblePresetSelect').value);
    if(!preset)return;
    saveBubbleCss(preset.css,preset.id);toast(`已应用气泡预设「${preset.name}」`);
  });
  $('deleteBubblePreset').addEventListener('click',()=>{
    const id=$('chatBubblePresetSelect').value;
    if(id===DEFAULT_BUBBLE_PRESET.id)return;
    const presets=getBubblePresets();
    const preset=presets.find(item=>item.id===id);
    if(!preset)return;
    if(BUILTIN_BUBBLE_PRESETS.some(item=>item.id===id)){
      data.settings.appearance.hiddenBubblePresetIds=[...new Set([...(data.settings.appearance.hiddenBubblePresetIds||[]),id])];
      if(data.settings.appearance.activeBubblePresetId===id){data.settings.appearance.activeBubblePresetId='';data.settings.appearance.bubbleCss=''}
    }else{
      data.settings.appearance.bubblePresets=(data.settings.appearance.bubblePresets||[]).filter(item=>item.id!==id);
      if(data.settings.appearance.activeBubblePresetId===id)data.settings.appearance.activeBubblePresetId='';
    }
    applyAppearance();
    save();renderBubblePresetOptions();toast(`气泡预设「${preset.name}」已删除`);
  });
  $('chatBubblePresetSelect').addEventListener('change',()=>{
    const selected=!!$('chatBubblePresetSelect').value;
    $('applyBubblePreset').disabled=!selected;$('deleteBubblePreset').disabled=!selected||$('chatBubblePresetSelect').value===DEFAULT_BUBBLE_PRESET.id;
  });
  $('resetAppearance').addEventListener('click',()=>{
    const bubblePresets=data.settings.appearance.bubblePresets||[];
    const hiddenBubblePresetIds=data.settings.appearance.hiddenBubblePresetIds||[];
    data.settings.appearance={...emptyData().settings.appearance,bubblePresets,hiddenBubblePresetIds,activeBubblePresetId:DEFAULT_BUBBLE_PRESET.id};
    loadAppearanceSettings();save();toast('美化设置已恢复默认');
  });
  $('clearBackground').addEventListener('click',()=>{data.settings.appearance.backgroundImage='';applyAppearance();save();toast('背景图片已移除')});
  $('backgroundImage').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;if(!file.type.startsWith('image/')){toast('请选择图片文件。');return}try{const image=await createImageBitmap(file);const scale=Math.min(1,1600/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);image.close();const imageData=canvas.toDataURL('image/jpeg',.78);if(imageData.length>1400000)throw new Error('large');data.settings.appearance.backgroundImage=imageData;applyAppearance();save();toast('背景图片已压缩并保存')}catch(error){toast('图片处理失败或文件过大，请换一张较小的图片。')}});
  applyAppearance();
  function readVoiceForm(){return{...data.settings.voice,output:$('voiceOutputToggle').checked,provider:$('voiceProvider').value,apiKey:$('minimaxApiKey').value.trim(),groupId:$('minimaxGroupId').value.trim(),base:$('minimaxBase').value.trim(),model:$('minimaxModel').value.trim(),voiceId:$('minimaxVoiceId').value.trim(),speed:Number($('minimaxSpeed').value),pitch:Number($('minimaxPitch').value),notes:$('voiceNotes').value.trim()}}
  function updateVoiceRangeLabels(){$('minimaxSpeedValue').textContent=Number($('minimaxSpeed').value).toFixed(1);$('minimaxPitchValue').textContent=$('minimaxPitch').value}
  $('minimaxSpeed').addEventListener('input',updateVoiceRangeLabels);$('minimaxPitch').addEventListener('input',updateVoiceRangeLabels);
  $('saveVoice').addEventListener('click',()=>{data.settings.voice=readVoiceForm();save();$('voiceFeedback').textContent='语音设置已保存。MiniMax API Key 保存在当前浏览器本地数据中。';toast('语音设置已保存')});
  $('testVoice').addEventListener('click',async()=>{data.settings.voice=readVoiceForm();try{await window.petalSpeakText('你好，这是 MiniMax 语音试听。',{test:true});$('voiceFeedback').textContent='试听已开始。'}catch(error){console.error('MiniMax TTS 试听失败',error);$('voiceFeedback').textContent=`试听失败：${error.message}`;toast(`试听失败：${error.message}`)}});
  // 聊天指令：保存角色设定，并提供合并内容的预览。
  $('saveSystemPrompt').addEventListener('click',()=>{data.settings.prompts.system=$('systemPrompt').value.trim();save();toast('系统指令已保存')});
  $('saveChatSummaryAnalysisPrompt').addEventListener('click',()=>{data.settings.analysisPrompts.chatSummary=$('chatSummaryAnalysisPrompt').value.trim();save();toast('聊天总结指令已保存')});
  $('saveHealthMemoryAnalysisPrompt').addEventListener('click',()=>{data.settings.analysisPrompts.healthMemorySummary=$('healthMemoryAnalysisPrompt').value.trim();save();toast('健康总结指令已保存')});
  $('saveFridgeDrawingInstructions').addEventListener('click',()=>{data.settings.prompts.fridgeDrawingInstructions=$('fridgeDrawingInstructions').value.trim();save();toast('食材绘制指令已保存')});
  function addPromptRestoreButton(saveButtonId,label,restoreValue){
    const button=document.createElement('button');button.type='button';button.className='secondary-button';button.textContent=label;
    $(saveButtonId).insertAdjacentElement('afterend',button);
    button.addEventListener('click',()=>{restoreValue();$(saveButtonId).click()});
  }
  addPromptRestoreButton('saveSystemPrompt','恢复系统指令默认',()=>{$('systemPrompt').value=window.petalDefaultSystemInstructions||''});
  addPromptRestoreButton('saveChatSummaryAnalysisPrompt','恢复默认',()=>{$('chatSummaryAnalysisPrompt').value=DEFAULT_CHAT_SUMMARY_PROMPT});
  addPromptRestoreButton('saveHealthMemoryAnalysisPrompt','恢复默认',()=>{$('healthMemoryAnalysisPrompt').value=DEFAULT_HEALTH_SUMMARY_PROMPT});
  let editingPromptPresetId='';
  $('savePromptPreset').addEventListener('click',()=>{const name=$('customPromptName').value.trim(),text=$('customPrompt').value.trim();if(!name||!text){toast('请填写预设名称和指令内容');return}const preset=data.settings.prompts.promptPresets.find(item=>item.id===editingPromptPresetId);if(preset){preset.name=name;preset.text=text}else data.settings.prompts.promptPresets.unshift({id:Date.now().toString(36),name,text,enabled:false});editingPromptPresetId='';$('customPromptName').value='';$('customPrompt').value='';$('savePromptPreset').textContent='保存当前文本为预设';save();renderPromptPresets();toast(preset?'指令预设已更新':'指令预设已保存')});
  let creatingCharacter=false;
  function estimateLocalTokens(value){return Math.max(0,Math.ceil(Array.from(String(value||'')).length/3.2))}
  function updateRoleTokenCounts(){
    $('characterNameTokenCount').textContent=`当前约 ${estimateLocalTokens($('characterName').value)} token`;
    $('characterPromptTokenCount').textContent=`当前约 ${estimateLocalTokens($('characterPrompt').value)} token`;
    $('userProfileTokenCount').textContent=`当前约 ${estimateLocalTokens($('userProfile').value)} token`;
  }
  function addRoleTokenCounter(fieldId,counterId){
    const field=$(fieldId).closest('.field');
    const counter=document.createElement('small');counter.className='small-muted';counter.id=counterId;counter.textContent='当前约 0 token';field.append(counter);
  }
  addRoleTokenCounter('characterName','characterNameTokenCount');
  addRoleTokenCounter('characterPrompt','characterPromptTokenCount');
  ['characterName','characterPrompt','userProfile'].forEach(id=>$(id).addEventListener('input',updateRoleTokenCounts));
  $('saveCharacter').textContent='保存当前角色';
  $('saveCharacter').addEventListener('click',()=>{
    const name=$('characterName').value.trim(),prompt=$('characterPrompt').value.trim();
    if(!name){toast('请填写角色名称');return}
    let character=data.settings.prompts.characters.find(item=>item.id===$('characterSelect').value);
    if(creatingCharacter||!character){character={id:Date.now().toString(36),name,prompt};data.settings.prompts.characters.push(character)}
    else{character.name=name;character.prompt=prompt}
    data.settings.prompts.activeCharacterId=character.id;creatingCharacter=false;save();renderCharacters();applyCharacter();updateRoleTokenCounts();$('deleteCharacter').disabled=data.settings.prompts.characters.length<=1;$('saveCharacter').textContent='保存当前角色';toast('角色卡已保存并启用');
  });
  $('characterSelect').addEventListener('change',()=>{
    const previous=data.settings.prompts.characters.find(character=>character.id===data.settings.prompts.activeCharacterId);
    if(previous&&!creatingCharacter){previous.name=$('characterName').value.trim()||previous.name;previous.prompt=$('characterPrompt').value.trim()}
    if(!$('characterSelect').value)return;
    creatingCharacter=false;data.settings.prompts.activeCharacterId=$('characterSelect').value;save();renderCharacters();applyCharacter();$('deleteCharacter').disabled=data.settings.prompts.characters.length<=1;toast('角色已切换');
  });
  $('newCharacter').addEventListener('click',()=>{
    creatingCharacter=true;$('characterSelect').value='';$('characterName').value='';$('characterPrompt').value='';$('deleteCharacter').disabled=true;$('saveCharacter').textContent='创建并使用';updateRoleTokenCounts();$('characterName').focus();
  });
  $('deleteCharacter').addEventListener('click',()=>{
    const id=$('characterSelect').value;
    if(data.settings.prompts.characters.length<=1){toast('至少保留一个角色预设。');return}
    data.settings.prompts.characters=data.settings.prompts.characters.filter(character=>character.id!==id);
    if(data.settings.prompts.activeCharacterId===id)data.settings.prompts.activeCharacterId=data.settings.prompts.characters[0].id;
    save();renderCharacters();applyCharacter();updateRoleTokenCounts();$('deleteCharacter').disabled=data.settings.prompts.characters.length<=1;toast('角色预设已删除');
  });
  $('userProfile').value=data.settings.prompts.userProfile||'';
  $('userProfile').classList.add('field-control');
  $('customPrompt').classList.add('field-control');
  $('newMemoryArchiveName').classList.add('field-control');
  $('saveUserProfile').addEventListener('click',()=>{
    data.settings.prompts.userProfile=$('userProfile').value.trim();save();updateRoleTokenCounts();renderAll();toast('我的信息已保存，并会作为用户身份背景发送给 AI。');
    $('userProfileDialog').close();
  });
  const rolePanel=document.querySelector('.character-presets');
  if(rolePanel)$('characterPresetDialogSlot').append(rolePanel);
  const openRoleButton=document.createElement('button');openRoleButton.type='button';openRoleButton.textContent='♙ 管理角色';
  const openProfileButton=document.createElement('button');openProfileButton.type='button';openProfileButton.textContent='♡ 我的信息';
  $('chatMoreMenu').prepend(openRoleButton,openProfileButton);
  openRoleButton.addEventListener('click',()=>{creatingCharacter=false;$('deleteCharacter').disabled=data.settings.prompts.characters.length<=1;$('saveCharacter').textContent='保存当前角色';updateRoleTokenCounts();$('chatMoreMenu').classList.remove('open');$('characterManagerDialog').showModal()});
  openProfileButton.addEventListener('click',()=>{$('userProfile').value=data.settings.prompts.userProfile||'';updateRoleTokenCounts();$('chatMoreMenu').classList.remove('open');$('userProfileDialog').showModal()});
  document.querySelectorAll('[data-close-dialog]').forEach(button=>button.addEventListener('click',()=>$(button.dataset.closeDialog).close()));
  function renderPromptPresets(){$('promptPresetList').innerHTML=data.settings.prompts.promptPresets.map(p=>`<div class="prompt-preset"><strong>${esc(p.name)}</strong><button type="button" class="${p.enabled?'primary-button':'secondary-button'}" data-prompt-toggle="${esc(p.id)}" aria-pressed="${p.enabled}">${p.enabled?'已启用':'启用'}</button><button type="button" class="secondary-button" data-prompt-edit="${esc(p.id)}" aria-label="编辑${esc(p.name)}指令">编辑</button><button type="button" class="secondary-button" data-prompt-delete="${esc(p.id)}" aria-label="删除${esc(p.name)}指令">删除</button></div>`).join('')||empty('还没有自定义指令预设。')}
  function renderCharacters(){$('characterSelect').innerHTML=data.settings.prompts.characters.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');$('characterSelect').value=data.settings.prompts.activeCharacterId||data.settings.prompts.characters[0]?.id||''}
  function applyCharacter(){const character=data.settings.prompts.characters.find(c=>c.id===data.settings.prompts.activeCharacterId)||data.settings.prompts.characters[0];if(character){$('chatPersonaName').textContent=character.name;$('characterName').value=character.name;$('characterPrompt').value=character.prompt||''}updateRoleTokenCounts()}
  $('promptPresetList').addEventListener('click',e=>{const toggle=e.target.closest('[data-prompt-toggle]');if(toggle){const preset=data.settings.prompts.promptPresets.find(item=>item.id===toggle.dataset.promptToggle);if(preset){preset.enabled=!preset.enabled;save();renderPromptPresets()}return}const edit=e.target.closest('[data-prompt-edit]');if(edit){const preset=data.settings.prompts.promptPresets.find(item=>item.id===edit.dataset.promptEdit);if(preset){editingPromptPresetId=preset.id;$('customPromptName').value=preset.name;$('customPrompt').value=preset.text;$('savePromptPreset').textContent='保存修改';$('customPromptName').focus()}return}const button=e.target.closest('[data-prompt-delete]');if(button){if(editingPromptPresetId===button.dataset.promptDelete){editingPromptPresetId='';$('customPromptName').value='';$('customPrompt').value='';$('savePromptPreset').textContent='保存当前文本为预设'}data.settings.prompts.promptPresets=data.settings.prompts.promptPresets.filter(preset=>preset.id!==button.dataset.promptDelete);save();renderPromptPresets()}});
  $('previewPrompt').addEventListener('click',()=>{const p=$('promptPreview');const character=data.settings.prompts.characters.find(c=>c.id===data.settings.prompts.activeCharacterId);p.style.display='block';p.textContent='【系统指令】\n'+($('systemPrompt').value||'（空）')+'\n\n【当前角色】\n'+(character?.name||'')+'\n'+(character?.prompt||'')+'\n\n【我的信息】\n'+(data.settings.prompts.userProfile||'（空）')+'\n\n【已启用指令预设】\n'+data.settings.prompts.promptPresets.filter(item=>item.enabled).map(item=>`· ${item.name}\n${item.text}`).join('\n\n')});
  // 聊天交互：显示消息、处理表情和菜单，并支持发送与朗读。
  let readModeEnabled=false;
  let voiceRecognition=null;
  function renderMessageText(text){return esc(text).replace(/\[贴图:(https?:\/\/[^\]\s]+)\]/g,'<img class="chat-sticker-image" src="$1" alt="聊天表情包" loading="lazy">')}
  function appendStickerMessage(message,previousScrollTop,wasAtBottom){const box=$('messages');if(!box.querySelector(`[data-message-id="${message.id}"]`)){const bubble=document.createElement('div');bubble.className='message user';bubble.dataset.messageId=message.id;const content=document.createElement('div');content.className='message-content';content.innerHTML=renderMessageText(message.text);const meta=document.createElement('div');meta.className='message-meta';const time=document.createElement('span');time.className='message-time';time.textContent=message.time;meta.append(time);bubble.append(content,meta);box.append(bubble)}box.scrollTop=wasAtBottom?box.scrollHeight:previousScrollTop}
  function renderChat(){const box=$('messages');const characterId=data.settings.prompts.activeCharacterId||data.settings.prompts.characters[0]?.id||'';const chat=data.chat.filter(message=>message.characterId===characterId);box.innerHTML=chat.length?chat.map(m=>{const content=m.attachment?`<details class="health-attachment-card"><summary><span class="health-attachment-icon" aria-hidden="true">▤</span><span><strong>${esc(m.attachment.title)}</strong><small>${esc(m.attachment.rangeLabel)} · ${m.attachment.payload.length} 天记录</small></span><span class="health-attachment-action">查看内容</span></summary><pre>${esc(JSON.stringify(m.attachment.payload,null,2))}</pre></details>`:renderMessageText(m.text);return `<div class="message ${m.role==='user'?'user':'ai'}${m.actionSummary?' has-action-summary':''}"><div class="message-content">${content}</div>${m.actionSummary?`<div class="message-action-summary">${esc(m.actionSummary)}</div>`:''}<div class="message-meta"><span class="message-time">${esc(m.time||'')}</span>${m.role==='user'?'':'<button class="speak-message" type="button" aria-label="朗读这条消息" title="朗读">♫</button>'}</div></div>`}).join(''):`<div class="message ai"><div class="message-content">嗨，欢迎来到这里。🌷<br>配置模型地址和 API Key 后即可发送消息；不配置时，记录仍只保存在本地。</div></div>`;box.scrollTop=box.scrollHeight}
  window.addEventListener('petal-data-updated',()=>{try{const latest=JSON.parse(localStorage.getItem(KEY)||'{}');if(Array.isArray(latest.memoryArchives))data.memoryArchives=latest.memoryArchives;if(Array.isArray(latest.todos))data.todos=latest.todos;if(Array.isArray(latest.chatSummaries))data.chatSummaries=latest.chatSummaries;if(Array.isArray(latest.settings?.chatMemoryArchiveIds))data.settings.chatMemoryArchiveIds=latest.settings.chatMemoryArchiveIds;renderMemoryArchives();renderMemoryDetail()}catch(error){console.error('刷新记忆存档失败',error)}});
  let minimaxAudio=null;let minimaxAudioUrl='';
  async function speakText(text,{test=false}={}){
    const voice=data.settings.voice||emptyData().settings.voice;
    if(voice.provider==='browser'){
      if(!('speechSynthesis'in window)||!('SpeechSynthesisUtterance'in window))throw new Error('当前浏览器不支持朗读功能。');
      window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang='zh-CN';const chineseVoice=window.speechSynthesis.getVoices().find(item=>item.lang.toLowerCase().startsWith('zh'));if(chineseVoice)utterance.voice=chineseVoice;window.speechSynthesis.speak(utterance);return;
    }
    if(!voice.apiKey)throw new Error('请先填写并保存 MiniMax API Key。');
    if(!/^[\x21-\x7e]+$/.test(voice.apiKey))throw new Error('MiniMax API Key 含有不支持的字符，请检查是否误带空格、换行或中文字符。');
    if(!voice.voiceId)throw new Error('请填写音色 Voice ID。');
    if(!voice.model)throw new Error('请填写 MiniMax TTS 模型名称。');
    if(!text.trim())throw new Error('没有可朗读的文字。');
    if(text.length>=10000)throw new Error('单次朗读文字必须少于 10000 个字符。');
    const endpoint=(voice.base||'https://api.minimax.cn/v1/t2a_v2').trim();
    let url;
    try{url=new URL(endpoint);if(!['https:','http:'].includes(url.protocol))throw new Error('');}
    catch{throw new Error('MiniMax API 地址无效，请填写 https:// 开头的 TTS 接口地址。');}
    if(voice.groupId)url.searchParams.set('GroupId',voice.groupId);
    if(minimaxAudio){minimaxAudio.pause();minimaxAudio=null;}
    if(minimaxAudioUrl){URL.revokeObjectURL(minimaxAudioUrl);minimaxAudioUrl='';}
    const response=await fetch(url.toString(),{method:'POST',headers:{Authorization:`Bearer ${voice.apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model:voice.model,text,stream:false,voice_setting:{voice_id:voice.voiceId,speed:Number(voice.speed)||1,vol:1,pitch:Number(voice.pitch)||0},audio_setting:{sample_rate:32000,bitrate:128000,format:'mp3',channel:1}})});
    let result;
    try{result=await response.json()}catch{throw new Error(`MiniMax 返回了无法解析的响应（HTTP ${response.status}）。`);}
    if(!response.ok)throw new Error(result?.base_resp?.status_msg||result?.message||`MiniMax 请求失败（HTTP ${response.status}）。`);
    if(result?.base_resp?.status_code!==0)throw new Error(result?.base_resp?.status_msg||`MiniMax 合成失败（错误码 ${result?.base_resp?.status_code??'未知'}）。`);
    const hex=result?.data?.audio;
    if(typeof hex!=='string'||!hex.length||hex.length%2||!/^[\da-f]+$/i.test(hex))throw new Error('MiniMax 响应中没有有效的音频数据。');
    const bytes=new Uint8Array(hex.length/2);for(let index=0;index<hex.length;index+=2)bytes[index/2]=parseInt(hex.slice(index,index+2),16);
    minimaxAudioUrl=URL.createObjectURL(new Blob([bytes],{type:'audio/mpeg'}));minimaxAudio=new Audio(minimaxAudioUrl);
    try{await minimaxAudio.play()}catch(error){throw new Error(`音频已生成，但浏览器无法播放：${error.message}`);}
    if(!test)$('voiceFeedback').textContent='MiniMax 正在朗读。';
  }
  window.petalSpeakText=speakText;
  $('readModeToggle').addEventListener('click',()=>{readModeEnabled=!readModeEnabled;$('readModeToggle').setAttribute('aria-pressed',String(readModeEnabled));$('readModeToggle').title=readModeEnabled?'朗读模式已开启，再点关闭':'开启朗读模式';toast(readModeEnabled?'朗读模式已开启，点击消息即可朗读':'朗读模式已关闭')});
  $('messages').addEventListener('click',e=>{const message=e.target.closest('.message');if(!message)return;if(e.target.closest('.speak-message')||readModeEnabled){const text=message.querySelector('.message-content')?.innerText.trim();if(text)speakText(text).catch(error=>{console.error('语音朗读失败',error);toast(`朗读失败：${error.message}`)})}});
  $('voiceCallOpen').addEventListener('click',()=>{$('voiceCallModal').hidden=false;$('voiceCallStatus').textContent='准备开始语音输入。浏览器可能会询问麦克风权限。'});
  $('voiceCallClose').addEventListener('click',()=>{$('voiceCallModal').hidden=true;if(voiceRecognition){voiceRecognition.stop();voiceRecognition=null}});
  $('voiceCallStart').addEventListener('click',()=>{const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Recognition){$('voiceCallStatus').textContent='此浏览器没有语音识别功能。请使用支持 Web Speech API 的浏览器。';return}if(voiceRecognition)return;voiceRecognition=new Recognition();voiceRecognition.lang='zh-CN';voiceRecognition.continuous=true;voiceRecognition.interimResults=false;voiceRecognition.onstart=()=>{$('voiceCallStatus').textContent='正在聆听。说话结束后，识别文字会保存在聊天记录中。'};$('voiceCallEnd').disabled=false;$('voiceCallStart').disabled=true;voiceRecognition.onresult=event=>{let transcript='';for(let i=event.resultIndex;i<event.results.length;i++){if(event.results[i].isFinal)transcript+=event.results[i][0].transcript}if(!transcript.trim())return;data.chat.push({role:'user',text:transcript.trim(),time:timeNow()});save();renderChat();$('voiceCallStatus').textContent=`已转写：${transcript.trim()}。AI 服务尚未连接，因此没有实时回复。`};voiceRecognition.onerror=event=>{$('voiceCallStatus').textContent=event.error==='not-allowed'?'麦克风权限被拒绝，请在浏览器设置中允许使用麦克风。':`语音识别暂不可用：${event.error}`};voiceRecognition.onend=()=>{$('voiceCallEnd').disabled=true;$('voiceCallStart').disabled=false;voiceRecognition=null};try{voiceRecognition.start()}catch(error){$('voiceCallStatus').textContent='语音识别未能启动，请稍后重试。';voiceRecognition=null;$('voiceCallEnd').disabled=true;$('voiceCallStart').disabled=false}});
  $('voiceCallEnd').addEventListener('click',()=>{if(voiceRecognition)voiceRecognition.stop()});
  function saveChatOnly(){const input=$('chatInput');const text=input.value.trim();if(!text)return;data.chat.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),role:'user',text,time:timeNow()});input.value='';save();renderChat();window.dispatchEvent(new Event('petal-data-updated'))}
  $('sendChat').addEventListener('click',saveChatOnly);$('chatInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();saveChatOnly()}});
  $('emojiToggle').addEventListener('click',()=>{$('emojiMenu').classList.toggle('open');$('chatMoreMenu').classList.remove('open');renderStickerMenu()});
  $('moreToggle').addEventListener('click',()=>{$('chatMoreMenu').classList.toggle('open');$('emojiMenu').classList.remove('open')});
  document.addEventListener('click',e=>{if(!e.target.closest('.chat-tools'))$('chatMoreMenu').classList.remove('open');if(!e.target.closest('.chat-input-wrap')&&!e.target.closest('#emojiToggle'))$('emojiMenu').classList.remove('open')});
  async function sendChat(){const input=$('chatInput');const text=input.value.trim();if(!text)return;const api=data.settings.api||{},key=$('apiKey').value.trim();if(!api.model||!api.base||!key){toast('请先在 API 连接中填写模型、API 地址和临时 API Key');return}data.chat.push({role:'user',text,time:timeNow()});input.value='';renderChat();save();$('sendChat').disabled=true;try{const character=data.settings.prompts.characters.find(item=>item.id===data.settings.prompts.activeCharacterId);const memories=data.memoryArchives.flatMap(archive=>archive.items).slice(0,40);const system=[data.settings.prompts.system,character?`当前角色：${character.name}\n${character.prompt}`:'',...data.settings.prompts.promptPresets.filter(item=>item.enabled).map(item=>item.text),`记忆提取规则：如出现值得保存的信息，在回复末尾另起一行，使用 <记忆 类别="长期偏好|待办|重要经历|当前近况|其他">简洁内容</记忆> 格式；没有则不输出。`,memories.length?`相关记忆：\n${memories.map(item=>`[${item.type}] ${item.content}`).join('\n')}`:''].filter(Boolean).join('\n\n');const response=await fetch(`${api.base.replace(/\/$/,'')}/chat/completions`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify({model:api.model,messages:[...(system?[{role:'system',content:system}]:[]),...data.chat.slice(-30).map(message=>({role:message.role,content:message.text}))]})});if(!response.ok)throw Error(`请求失败（${response.status}）`);const payload=await response.json();const answer=payload.choices?.[0]?.message?.content;if(!answer)throw Error('模型没有返回内容');const cleanAnswer=answer.replace(/<记忆\s+类别="(长期偏好|待办|重要经历|当前近况|其他)">([\s\S]*?)<\/记忆>/g,(_,type,content)=>{let archive=data.memoryArchives.find(item=>item.id!=='health-archive');if(!archive){archive={id:Date.now().toString(36),name:'对话存档',createdAt:today(),items:[]};data.memoryArchives.push(archive)}archive.items.unshift({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),type,date:today(),content:content.trim(),source:'AI 自动捕获'});return''}).trim();data.chat.push({role:'assistant',text:cleanAnswer||'（记忆已保存）',time:timeNow()});save();renderMemoryArchives();renderChat()}catch(error){data.chat.push({role:'assistant',text:`暂时无法连接模型：${error.message}`,time:timeNow()});save();renderChat()}finally{$('sendChat').disabled=false}}
  $('clearChat').addEventListener('click',()=>{if(confirm('确定清空本地聊天记录吗？')){const stored=JSON.parse(localStorage.getItem(KEY)||'{}');stored.chat=[];localStorage.setItem(KEY,JSON.stringify(stored));data.chat=[];if(data.settings.tokenSettings){data.settings.tokenSettings.lastAutoSummaryIndex=0;data.settings.tokenSettings.lastChatSummaryReminderLevel=0}save();renderChat();window.dispatchEvent(new Event('petal-data-updated'));toast('对话已清空')}});
  // 动画偏好与数据备份：减少动效、导出 JSON/CSV、导入或清空本地数据。
  $('reduceMotion').addEventListener('change',()=>{data.settings.reduceMotion=$('reduceMotion').checked;document.body.classList.toggle('reduce-motion',$('reduceMotion').checked);save()});
  $('exportData').addEventListener('click',()=>download('petal-backup-'+today()+'.json',JSON.stringify(JSON.parse(localStorage.getItem(KEY)||'{}'),null,2),'application/json'));
  $('exportCsv').addEventListener('click',()=>{const rows=[['类型','日期','时间','内容','份量','类别','饮水量（ml）','备注'],...data.sleep.map(r=>['睡眠',r.date,'',r.hours+' 小时 '+(r.quality||'') ,'','','',r.note||'']),...data.food.map(r=>['饮食',r.date,r.time||'',r.content,r.serving||'',r.category||'',r.waterMl||'',r.remark||r.note||'']),...data.bowel.map(r=>['排便',r.date,r.time||'',r.feeling+' / '+(r.form||''),'','','',r.note||'']),...data.weight.map(r=>['体重',r.date,'',r.value+' kg','','','','']),...data.joy.map(r=>['Joy 时间',r.date,r.time||'',r.durationMinutes?`${r.durationMinutes} 分钟`:'1 次','','','',''+(r.note||'')])];const csv=rows.map(row=>row.map(x=>'"'+String(x??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');download('petal-health-'+today()+'.csv','\ufeff'+csv,'text/csv;charset=utf-8')});
  function download(name,content,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);toast('备份文件已生成')}
  $('importFile').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{const obj=JSON.parse(await f.text());if(!obj||typeof obj!=='object')throw Error();if(!confirm('导入会覆盖当前页面的本地记录，确定继续吗？'))return;localStorage.removeItem(KEY);data={...emptyData(),...obj,settings:{...emptyData().settings,...(obj.settings||{})}};save();renderAll();loadSettings();toast('备份已导入')}catch(err){toast('无法读取文件，请确认它是本网站导出的 JSON 备份')}finally{e.target.value=''}});
  $('clearAll').addEventListener('click',()=>{if(!confirm('确定清空全部本地记录、记忆和设置吗？此操作无法撤销。建议先导出备份。'))return;localStorage.removeItem(KEY);data=emptyData();save();renderAll();loadSettings();renderChat();window.dispatchEvent(new Event('petal-data-cleared'));toast('本地数据已清空')});
  // 设置回填：把本地保存的 API、语音、指令和动画偏好显示在表单里。
  function loadSettings(){const a=data.settings.api||{};$('apiProvider').value=a.provider||'openai';$('apiModel').value=a.model||'';$('apiBase').value=a.base||'';const v={...emptyData().settings.voice,...(data.settings.voice||{})};$('voiceOutputToggle').checked=!!v.output;$('voiceProvider').value=v.provider||'minimax';$('minimaxApiKey').value=v.apiKey||'';$('minimaxGroupId').value=v.groupId||'';$('minimaxBase').value=v.base||'https://api.minimax.cn/v1/t2a_v2';$('minimaxModel').value=v.model||'speech-2.8-hd';$('minimaxVoiceId').value=v.voiceId||'female-shaonv';$('minimaxSpeed').value=String(v.speed??1);$('minimaxPitch').value=String(v.pitch??0);$('voiceNotes').value=v.notes||'';updateVoiceRangeLabels();const p=data.settings.prompts||{};$('systemPrompt').value=p.system||window.petalDefaultSystemInstructions||'';$('fridgeDrawingInstructions').value=p.fridgeDrawingInstructions??DEFAULT_FRIDGE_DRAWING_INSTRUCTIONS;const analysisPrompts=data.settings.analysisPrompts||{};$('chatSummaryAnalysisPrompt').value=analysisPrompts.chatSummary===LEGACY_CHAT_SUMMARY_PROMPT||!analysisPrompts.chatSummary?DEFAULT_CHAT_SUMMARY_PROMPT:analysisPrompts.chatSummary;$('healthMemoryAnalysisPrompt').value=analysisPrompts.healthMemorySummary===LEGACY_HEALTH_SUMMARY_PROMPT||!analysisPrompts.healthMemorySummary?DEFAULT_HEALTH_SUMMARY_PROMPT:analysisPrompts.healthMemorySummary;renderPromptPresets();renderCharacters();applyCharacter();renderMemoryArchives();renderStickerMenu();$('reduceMotion').checked=!!data.settings.reduceMotion;document.body.classList.toggle('reduce-motion',!!data.settings.reduceMotion);loadAppearanceSettings();if(migratedFridgeDrawingInstructions){migratedFridgeDrawingInstructions=false;save()}}
  // 启动页面：恢复设置，刷新各功能页面的数据，再显示聊天页。
  initStarfield();startRain();startChatDust();loadSettings();renderAll();renderChat();showView('chat');
})();