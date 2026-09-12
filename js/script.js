/* ============================================================
   辽韵三萃 — 沉浸式3D交互H5（三非遗融合版）
   三展区：岫岩皮影戏台 + 新宾满族剪纸展厅 + 辽阳满族刺绣展厅
   联动：剪纸为纹样源头 → 皮影造型 + 刺绣绣纹（三非遗闭环）
   交互：递进式交互 / 皮影AI拟人 / 虚拟走针 / 拼窗花+绣样拼贴
   特效：鎏金流光 / 透光投影 / 分层雾效 / 季节粒子 / 丝线粒子
         镜头智能跟随 / 音画同步 / 窗花+丝线转场 / UI弹性动效
   ============================================================ */

// ===== 全局状态 =====
const STATE = {
  currentScene:'paper',
  isRoaming:false,
  isAudioPlaying:false,
  roamAngle:0, roamRadius:18, roamHeight:8,
  hoveredObject:null,
  clock:new THREE.Clock(),
  hotspots:[],
  audioCtx:null, audioNodes:{},
  visited:new Set(),
  switching:false,
  // 升级系统
  beat:0,               // 音频节奏脉冲 0~1
  costumePattern:-1,    // 当前皮影服饰纹样
  lastInteract:0,       // 上次交互时间（皮影AI待机判定）
  userOrbited:false,    // 用户是否手动转动了镜头
  focusReturnAt:null,   // 镜头自动回位时间点
  camReturn:null,       // 对焦前镜头位置（用于回位）
  fx:{},                // 灯光/幕布等特效引用
  bursts:[],            // 金粒剥离粒子
  sheenMeshes:[],       // 鎏金流光网格
  fogMats:[],           // 分层雾效材质
  storyPanels:{},       // 剧目故事剪纸展板
  embStoryPanels:{},    // 剧目故事刺绣枕顶（三非遗联动）
  embroideryPattern:-1, // 当前刺绣绣纹（与剪纸纹样同源）
  needles:[],           // 虚拟走针动画实例
  flow:{sel:-1, born:{}, puppet:{}, emb:{}}, // 纹样母体流转链路：诞生→皮影演绎→刺绣织造
  journey:{scenes:new Set()}, // 「我的辽韵旅程」总结页：到访展区痕迹
};

// ===== 场景数据 =====
const SCENE_DATA = {
  puppet:{
    name:'岫岩皮影戏台',
    tagline:'灯影传奇 · 辽南影韵',
    intro:{title:'鞍山岫岩皮影戏',sub:'国家级非物质文化遗产 · 同源载体（辅）',
      body:`<p><span class="highlight">岫岩皮影戏</span>是辽宁省鞍山市岫岩满族自治县的传统戏剧，2008年被列入国家级非物质文化遗产名录。</p>
      <p>岫岩皮影以<span class="highlight">驴皮雕刻</span>为主，造型古朴典雅，纹样精细繁复。其唱腔融合了东北民歌、满族音乐与河北皮影元素，形成独特的"辽南影调"。</p>
      <p><span class="highlight">依附母体</span>：皮影不另起纹样体系——皮偶服饰纹样均由<span class="highlight">新宾剪纸母题实时映射</span>而来（剪纸是皮影的"底稿库"），在「纹样流转」中一键换装即可直观对比纸刻与皮雕的形态差异。</p>
      <p><span class="highlight">表演特点</span>：演员在白色幕布后操纵皮影，借灯光投影成像，配以唱念做打，是集绘画、雕刻、音乐、表演于一体的综合艺术。</p>`},
    hotspots:[
      {id:'history',title:'岫岩皮影历史',sub:'百年传承 · 辽南影韵',
        body:`<p>岫岩皮影戏起源于<span class="highlight">明末清初</span>，至今已有四百余年历史。清乾隆年间，河北皮影艺人闯关东来到岫岩，与当地满族文化融合，逐渐形成独具特色的岫岩皮影。</p>
        <p>岫岩皮影在清代中晚期达到鼎盛，全县有皮影班社数十个，艺人逾百人。每逢年节、庙会、婚丧嫁娶，皆有皮影演出，是当地民众最主要的娱乐形式之一。</p>
        <p><span class="highlight">代表剧目</span>：《杨家将》《薛家将》《封神榜》《五锋会》等传统长篇连台本戏。</p>`},
      {id:'craft',title:'皮影雕刻工艺',sub:'驴皮为纸 · 刀笔生花',
        body:`<p>岫岩皮影的制作需经<span class="highlight">选皮、制皮、画稿、雕刻、敷彩、熨平、装订</span>七道工序。</p>
        <p>选用优质驴皮，经浸泡、刮薄、晾晒后制成透明皮料。艺人用特制刻刀在皮料上雕刻出精细纹样，一个人物头像需雕刻<span class="highlight">数千刀</span>。</p>
        <p>雕刻完成后用矿物颜料敷彩，再经熨压定型，最后用线将头、身、四肢装订连接。一个完整皮影人物通常有<span class="highlight">11个关节</span>，可灵活操纵表演。</p>`},
      {id:'music',title:'辽南影调唱腔',sub:'五音四弦 · 古韵新声',
        body:`<p>岫岩皮影的唱腔称为<span class="highlight">"辽南影调"</span>，属于板腔体音乐，分为"大板"和"小板"两大系统。</p>
        <p><span class="highlight">伴奏乐器</span>：主弦为四胡，辅以二胡、扬琴、笛子、唢呐、锣鼓等。唱词多为七字句和十字句，讲究押韵和平仄。</p>
        <p>角色行当分为生、旦、净、末、丑，各行当有独特的唱腔和表演程式。男演员唱旦角时用"小嗓"（假声），音色尖细明亮，是皮影戏的一大特色。</p>`},
    ]
  },
  paper:{
    name:'新宾满族剪纸',
    tagline:'纸上乾坤 · 满韵遗风',
    intro:{title:'抚顺新宾满族剪纸',sub:'国家级非物质文化遗产 · 纹样母体（主核心）',
      body:`<p><span class="highlight">新宾满族剪纸</span>是辽宁省抚顺市新宾满族自治县的传统民间艺术，2008年被列入国家级非物质文化遗产名录。</p>
      <p>本项目确立<span class="highlight">"一主两辅"</span>内容架构：剪纸是整套作品的<span class="highlight">纹样母体</span>——团花、福字、萨满神纹、连年有余等民俗母题在此诞生，再作为"底稿"向皮影、刺绣输出图样。</p>
      <p><span class="highlight">艺术特点</span>：以红纸为主要材料，用剪刀或刻刀创作，线条简练有力，构图饱满对称，是满族文化的"活化石"。</p>
      <p>点击展品或使用底部<span class="highlight">「纹样流转」</span>，即可见证同一纹样在纸、皮料、织物三种载体上的形态演变。</p>`},
    hotspots:[
      {id:'window',title:'满族窗花艺术',sub:'贴窗花 · 迎新春',
        body:`<p>满族窗花是新宾剪纸中最常见的形式，每逢<span class="highlight">春节</span>，家家户户在窗格上贴满红色窗花，寓意吉祥如意、辞旧迎新。</p>
        <p>满族窗花题材丰富，有<span class="highlight">福字、寿字、喜字</span>等文字纹样，也有牡丹、荷花、蝙蝠、鲤鱼等吉祥图案。满族人家的窗花还常出现"挂签"形式，贴在窗楣或门楣上，随风飘动。</p>
        <p>窗花的制作讲究<span class="highlight">"线线相连"</span>，剪刻时不能断线条，否则图案散落。一张精美的窗花往往需要数小时的精心剪刻。</p>`},
      {id:'shaman',title:'萨满纹样剪纸',sub:'神灵世界 · 纸上萨满',
        body:`<p>萨满纹样是新宾满族剪纸最具特色的题材，源于满族古老的<span class="highlight">萨满教信仰</span>。</p>
        <p>这类剪纸常表现<span class="highlight">萨满神、祖先神、自然神</span>等形象，以及祭祀仪式场景。萨满神剪纸多为正面站立造型，头戴神帽，腰系神铃，手持神鼓，造型神秘威严。</p>
        <p>满族人家在祭祀时会将萨满剪纸悬挂于室内或神杆上，作为<span class="highlight">沟通人神的媒介</span>。这些剪纸不仅是艺术品，更是满族原始宗教信仰的实物见证。</p>`},
      {id:'custom',title:'年俗剪纸文化',sub:'剪窗花 · 过大年',
        body:`<p>满族年俗剪纸与春节习俗紧密结合，从<span class="highlight">腊月二十三</span>小年开始，满族人家便开始剪窗花、贴挂签、糊灯笼。</p>
        <p><span class="highlight">常见年俗剪纸</span>："肥猪拱门"（寓意财富进门）、"连年有余"（莲花与鲤鱼）、"喜鹊登梅"（喜上眉梢）、"龙凤呈祥"等。</p>
        <p>满族剪纸还有独特的<span class="highlight">"挂签"</span>习俗：用五色纸剪成长条形挂签，上端有吉祥纹样，下端为流苏，贴在门楣、窗楣、神龛上，五色分别象征五行，寓意驱邪纳福。</p>`},
    ]
  },
  emb:{
    name:'辽阳满族刺绣展厅',
    tagline:'针尖丹青 · 织物春秋',
    intro:{title:'辽阳满族刺绣',sub:'国家级非物质文化遗产 · 同源载体（辅）',
      body:`<p><span class="highlight">辽阳满族刺绣</span>是流传于辽宁辽阳地区的满族传统刺绣技艺，与岫岩皮影、新宾剪纸并称辽宁非遗"三绝"，已列入国家级非物质文化遗产名录。</p>
      <p>满族刺绣以<span class="highlight">枕头顶刺绣</span>最具特色，兼有荷包、服饰绣片、萨满图腾绣品，针法细密、色彩浓艳，构图饱满对称。</p>
      <p><span class="highlight">依附母体</span>：剪纸是刺绣的<span class="highlight">"花样母本"</span>——先剪出纸样，再绷于织物之上飞针走线。本展厅绣纹均由剪纸母体纹样实时映射生成，「纹样流转」一键即可观察纸刻线如何变为丝线针脚。</p>`},
    hotspots:[
      {id:'pillow',title:'满族枕头顶刺绣',sub:'枕顶之上 · 针尖丹青',
        body:`<p>枕头顶刺绣是满族女红的<span class="highlight">核心技艺</span>，绣于长方形枕头两端，是满族姑娘陪嫁的必备嫁妆。</p>
        <p>旧时满族有<span class="highlight">"比绣"</span>习俗：姑娘们将枕头顶互相赠送、评看，针脚密、花样新者倍受赞誉，枕头顶因此成为衡量女红技艺的标尺。</p>
        <p>题材涵盖<span class="highlight">花鸟鱼虫、吉祥文字、萨满图腾</span>，与剪纸纹样同源同构——先剪纸样，再依样施针。</p>`},
      {id:'purse',title:'荷包民俗绣品',sub:'锦囊香韵 · 民俗传情',
        body:`<p>满族荷包是随身佩挂的<span class="highlight">刺绣香囊</span>，内装香料、烟草或祈福物件，是端午节、春节的重要佩饰。</p>
        <p>荷包也是满族青年男女的<span class="highlight">定情信物</span>，姑娘将亲手绣制的荷包赠予心上人，纹样多为并蒂莲、比翼鸟等吉祥图案。</p>
        <p>荷包形制有<span class="highlight">鸡心形、葫芦形、元宝形</span>等，束口缀珠，底垂流苏，集刺绣、镶滚、编结工艺于一体。</p>`},
      {id:'robe',title:'服饰绣片工艺',sub:'衣上锦绣 · 针法乾坤',
        body:`<p>满族服饰讲究<span class="highlight">"衣必绣、饰必纹"</span>，旗袍、马褂、坎肩的领口、袖口、下摆皆镶绣花边。</p>
        <p>主要针法有<span class="highlight">盘金绣、打籽绣、平针绣、套针绣</span>等：盘金绣以金线盘出龙凤轮廓，打籽绣结籽成点、立体如雕。</p>
        <p>绣片纹样与剪纸、皮影纹样<span class="highlight">同源共生</span>：同一团花母题，纸上可剪、皮上可雕、布上可绣。</p>`},
      {id:'totem',title:'萨满图腾刺绣',sub:'神谕图腾 · 针线传承',
        body:`<p>萨满图腾刺绣源于满族<span class="highlight">萨满信仰</span>，多绣于神衣、神裙、神幡之上，是沟通人神的"织物神谕"。</p>
        <p>常见图腾有<span class="highlight">柳枝（始母神）、乌鸦（神鹊）、蟒神、虎神</span>等，构图对称庄严，用色以红、黄、蓝为主。</p>
        <p>与剪纸萨满纹样、皮影神怪造型构成<span class="highlight">"三位一体"</span>的满族神灵艺术谱系，见证北方民族的精神世界。</p>`},
    ]
  }
};

// ===== 剧目故事刺绣枕顶（三非遗联动：皮影剧目 → 刺绣枕顶） =====
const EMB_STORY_DATA = {
  yang:{title:'《杨家将》故事枕顶',sub:'皮影开演 · 刺绣同款织造',
    body:`<p>皮影戏台开演《杨家将》时，刺绣展厅同步点亮<span class="highlight">同款故事枕顶</span>——剪纸出样、皮影演绎、刺绣织造，三非遗一脉贯通。</p>
    <p>枕顶以盘金绣勾勒<span class="highlight">杨门战将、旌旗金刀</span>，金线盘龙、彩线填彩，把戏台上的忠烈传奇凝于方寸织物。</p>
    <p>这正是辽宁民俗文化的<span class="highlight">完整链条</span>：剪纸是纹样源头，皮影是动态演绎，刺绣是织物定格。</p>`},
  xue:{title:'《薛家将》故事枕顶',sub:'皮影开演 · 刺绣同款织造',
    body:`<p>皮影开演《薛家将》时，刺绣展厅同步点亮<span class="highlight">同款故事枕顶</span>，白袍银枪纹样以打籽绣、套针绣织就。</p>
    <p>三非遗联动在此闭环：<span class="highlight">剪纸纹样</span>同时驱动皮影服饰与刺绣绣纹，实现"一源三态"的文化演绎。</p>`}
};

// ===== 剧目故事剪纸（双非遗联动：皮影剧目 → 剪纸展板） =====
const STORY_DATA = {
  yang:{title:'《杨家将》故事剪纸',sub:'皮影剧目 · 剪纸同款演绎',
    body:`<p>《杨家将》是岫岩皮影的<span class="highlight">代表剧目</span>之一，讲述杨家世代忠良、金刀铁马、戍边卫国的英雄传奇，是辽南皮影戏常演不衰的经典连台本戏。</p>
    <p>武将皮影开演此剧目时，剪纸展区自动点亮<span class="highlight">同款故事主题剪纸展板</span>——剪纸是皮影的"纹样库"，皮影是剪纸的"动态演绎"，双非遗文化闭环。</p>
    <p>展板以红纸镂刻<span class="highlight">杨门战将、旌旗金刀</span>纹样，再现皮影戏台上的忠烈传奇。</p>`},
  xue:{title:'《薛家将》故事剪纸',sub:'皮影剧目 · 剪纸同款演绎',
    body:`<p>《薛家将》同样是岫岩皮影的<span class="highlight">看家剧目</span>，演述薛仁贵白袍银枪、跨海征东的故事，唱做繁重，文武兼备。</p>
    <p>文生皮影开演此剧目时，剪纸展区自动点亮<span class="highlight">同款故事主题剪纸展板</span>，实现"皮影演故事、剪纸定格故事"的双非遗联动。</p>
    <p>展板以红纸镂刻<span class="highlight">白袍银枪、跨海征东</span>纹样，与戏台唱影遥相呼应。</p>`}
};

// ===== 左侧导航数据（一主两辅：剪纸=母体置顶，皮影/刺绣=载体变体依附） =====
const NAV_GROUPS = [
  {key:'paper', name:'纹样母体 · 新宾满族剪纸', tag:'主模块', hint:'纹样源头 —— 一切母题由此诞生', open:true},
  {key:'puppet', name:'载体变体 · 岫岩皮影', tag:'辅助模块', hint:'纹样转刻皮料 · 由剪纸母体衍生，请先选定纹样', open:false},
  {key:'emb', name:'载体变体 · 辽阳满族刺绣', tag:'辅助模块', hint:'纹样织绣成纹 · 由剪纸母体衍生，请先选定纹样', open:false},
];
const NAV_ITEMS = [
  // 【纹样母体 · 新宾满族剪纸】主模块（默认展开）
  {title:'剪纸展厅全景', sub:'纹样母体 · 主模块', scene:'paper', type:'overview', group:'paper'},
  {title:'满族窗花艺术', sub:'纹样库 · 存放全部基础纹样', scene:'paper', type:'hotspot', hotspotId:'window', group:'paper'},
  {title:'萨满纹样剪纸', sub:'神灵世界 · 紙上萨满', scene:'paper', type:'hotspot', hotspotId:'shaman', group:'paper'},
  {title:'年俗剪纸文化', sub:'剪窗花 · 过大年', scene:'paper', type:'hotspot', hotspotId:'custom', group:'paper'},
  // 【载体变体 · 岫岩皮影】辅助模块（默认折叠，依附母体纹样）
  {title:'皮影戏台全景', sub:'皮影戏全景', scene:'puppet', type:'overview', group:'puppet'},
  {title:'纹样转皮影演绎', sub:'复用剪纸选中纹样 · 生成皮偶开演', scene:'puppet', type:'derivative', group:'puppet', requiresPattern:true},
  {title:'皮影历史渊源', sub:'百年传承 · 辽南影韵', scene:'puppet', type:'hotspot', hotspotId:'history', group:'puppet'},
  // 【载体变体 · 辽阳满族刺绣】辅助模块（默认折叠，依附母体纹样）
  {title:'刺绣展厅全景', sub:'刺绣展厅全景', scene:'emb', type:'overview', group:'emb'},
  {title:'纹样转刺绣织造', sub:'复用剪纸选中纹样 · 织物走线', scene:'emb', type:'derivative', group:'emb', requiresPattern:true},
  {title:'枕头顶刺绣艺术', sub:'枕顶之上 · 针尖丹青', scene:'emb', type:'hotspot', hotspotId:'pillow', group:'emb'},
  {title:'荷包民俗绣品', sub:'锦囊香韵 · 民俗传情', scene:'emb', type:'hotspot', hotspotId:'purse', group:'emb'},
];

// ===== Three.js 初始化 =====
let scene, camera, renderer, controls;
let puppetSceneGroup, paperSceneGroup, embSceneGroup;
let raycaster, mouse;
let puppetObjects = [], paperObjects = [], embObjects = [];
let particleSystem, snowSystem, fuSystem, paperParticles, threadSystem;

function initThree(){
  const container = document.getElementById('canvas-container');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2E1424);   // 国潮绛红墨色（原冷黑 0x0D0D1A）
  scene.fog = new THREE.Fog(0x281220, 22, 55);

  camera = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 200);
  camera.position.set(0, 8, 20);

  renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  container.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 6;
  controls.maxDistance = 40;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.target.set(0, 3, 0);

  // ===== 拖动优先：用户拖拽时暂停自动漫游，松手静置3秒后恢复 =====
  STATE.roamPaused = false;
  controls.addEventListener('start', ()=>{
    STATE.userOrbited = true;
    STATE.focusReturnAt = null;
    if(STATE.isRoaming){
      STATE.roamPaused = true;
      clearTimeout(STATE.roamResumeTimer);
      setMode('漫游暂停 · 拖动中');
    }
  });
  controls.addEventListener('end', ()=>{
    if(STATE.isRoaming && STATE.roamPaused){
      clearTimeout(STATE.roamResumeTimer);
      STATE.roamResumeTimer = setTimeout(()=>{
        STATE.roamPaused = false;
        if(STATE.isRoaming) setMode('自动漫游');
      }, 3000);
    }
  });

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2(-2,-2);

  const ambient = new THREE.AmbientLight(0x8a5a48, 0.75);   // 暖朱 ambient（原冷紫 0x4a3f5c）
  scene.add(ambient);
  // 国潮天光：上暖金 · 下绛红，给全场罩一层红金氛围
  const hemi = new THREE.HemisphereLight(0xffcf96, 0x6e1b2c, 0.34);
  scene.add(hemi);

  puppetSceneGroup = new THREE.Group();
  paperSceneGroup = new THREE.Group();
  embSceneGroup = new THREE.Group();
  puppetSceneGroup.visible = false;
  embSceneGroup.visible = false;
  scene.add(puppetSceneGroup);
  scene.add(paperSceneGroup);
  scene.add(embSceneGroup);

  buildPuppetScene();
  buildPaperScene();
  buildEmbScene();
  buildParticles();
  buildPaperParticles();
  buildThreadParticles();
  applyParticleTheme('puppet');

  window.addEventListener('resize', onResize);
  renderer.domElement.addEventListener('click', onCanvasClick);
  renderer.domElement.addEventListener('mousemove', onCanvasHover);
  renderer.domElement.addEventListener('touchstart', onTouchStart, {passive:true});
  // 用户手动操作镜头 → 取消自动回位
  renderer.domElement.addEventListener('pointerdown', ()=>{
    STATE.userOrbited=true; STATE.focusReturnAt=null;
    // 用户按下即接管镜头：打断对焦动画，拖动立即生效
    if(focusTween.active){
      focusTween.active = false;
      controls.enabled = true;
      setMode(STATE.isRoaming ? '自动漫游' : '可旋转');
    }
  });
  renderer.domElement.addEventListener('wheel', ()=>{ STATE.userOrbited=true; STATE.focusReturnAt=null; });
}

// ===== 纹理生成工具 =====
function makeTexture(drawFn, w=512, h=512){
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  drawFn(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function woodTexture(){
  return makeTexture((ctx,w,h)=>{
    ctx.fillStyle = '#3d1f1a';
    ctx.fillRect(0,0,w,h);
    for(let i=0;i<40;i++){
      ctx.strokeStyle = `rgba(${80+Math.random()*40},${30+Math.random()*20},${20+Math.random()*15},${0.3+Math.random()*0.3})`;
      ctx.lineWidth = 1+Math.random()*3;
      ctx.beginPath();
      const y = Math.random()*h;
      ctx.moveTo(0,y);
      for(let x=0;x<w;x+=20){ ctx.lineTo(x, y+Math.sin(x*0.02+i)*8+Math.random()*4); }
      ctx.stroke();
    }
    for(let i=0;i<5;i++){
      const x=Math.random()*w, y=Math.random()*h, r=10+Math.random()*25;
      const g=ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,'rgba(60,25,15,.8)');
      g.addColorStop(1,'rgba(60,25,15,0)');
      ctx.fillStyle=g;
      ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    }
  });
}

function curtainTexture(){
  return makeTexture((ctx,w,h)=>{
    const g = ctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0,'#8B1428');
    g.addColorStop(0.5,'#C41E3A');
    g.addColorStop(1,'#6B0F1E');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);
    for(let x=0;x<w;x+=30){
      ctx.fillStyle = `rgba(0,0,0,${0.1+Math.random()*0.15})`;
      ctx.fillRect(x,0,8+Math.random()*6,h);
      ctx.fillStyle = `rgba(255,200,150,${0.05+Math.random()*0.08})`;
      ctx.fillRect(x+10,0,4,h);
    }
    ctx.strokeStyle = 'rgba(212,168,67,.6)';
    ctx.lineWidth = 4;
    ctx.strokeRect(15,15,w-30,h-30);
    ctx.lineWidth = 1;
    ctx.strokeRect(25,25,w-50,h-50);
    const corners = [[30,30],[w-30,30],[30,h-30],[w-30,h-30]];
    corners.forEach(([cx,cy])=>{
      ctx.save();ctx.translate(cx,cy);
      ctx.strokeStyle='rgba(212,168,67,.7)';ctx.lineWidth=2;
      for(let i=0;i<3;i++){ ctx.beginPath(); ctx.arc(0,0,10+i*8,0,Math.PI/2); ctx.stroke(); }
      ctx.restore();
    });
  },512,1024);
}

function whiteScreenTexture(){
  return makeTexture((ctx,w,h)=>{
    ctx.fillStyle = '#F5E6C8';
    ctx.fillRect(0,0,w,h);
    for(let i=0;i<200;i++){
      ctx.fillStyle=`rgba(180,150,100,${Math.random()*0.08})`;
      ctx.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*3,1+Math.random()*3);
    }
    ctx.strokeStyle='rgba(139,20,40,.3)';
    ctx.lineWidth=6;
    ctx.strokeRect(8,8,w-16,h-16);
  });
}

// 皮影人物基础剪影（供原版与换装版共用）
function drawPuppetFigure(ctx,w,h,type=0){
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = '#1a0a05';
  ctx.strokeStyle = '#1a0a05';
  ctx.lineWidth = 3;
  const cx = w/2;
  ctx.beginPath();
  ctx.ellipse(cx, h*0.15, w*0.12, h*0.14, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#8B1428';
  ctx.beginPath();
  ctx.moveTo(cx-w*0.14, h*0.08);
  ctx.lineTo(cx, h*0.02);
  ctx.lineTo(cx+w*0.14, h*0.08);
  ctx.lineTo(cx+w*0.1, h*0.12);
  ctx.lineTo(cx-w*0.1, h*0.12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = type===1 ? '#2a1a3a' : '#1a0a05';
  ctx.beginPath();
  ctx.moveTo(cx-w*0.18, h*0.28);
  ctx.lineTo(cx+w*0.18, h*0.28);
  ctx.lineTo(cx+w*0.22, h*0.6);
  ctx.lineTo(cx-w*0.22, h*0.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#D4A843';
  ctx.fillRect(cx-w*0.2, h*0.42, w*0.4, h*0.03);
  ctx.fillStyle = type===1 ? '#2a1a3a' : '#1a0a05';
  ctx.beginPath();
  ctx.moveTo(cx-w*0.18, h*0.3);
  ctx.lineTo(cx-w*0.35, h*0.5);
  ctx.lineTo(cx-w*0.3, h*0.52);
  ctx.lineTo(cx-w*0.15, h*0.35);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx+w*0.18, h*0.3);
  ctx.lineTo(cx+w*0.35, h*0.45);
  ctx.lineTo(cx+w*0.3, h*0.47);
  ctx.lineTo(cx+w*0.15, h*0.35);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(cx-w*0.12, h*0.6, w*0.09, h*0.35);
  ctx.fillRect(cx+w*0.03, h*0.6, w*0.09, h*0.35);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = 'rgba(0,0,0,1)';
  for(let i=0;i<6;i++){
    ctx.beginPath();
    ctx.arc(cx-w*0.1+Math.random()*w*0.2, h*0.32+Math.random()*h*0.08, 2+Math.random()*4, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
}

// 剪纸纹样 → 皮影服饰 overlay（双非遗联动核心）
function patternOverlay(ctx,w,h,p){
  const cx=w/2;
  ctx.globalCompositeOperation='source-atop';
  if(p===0){ // 团花纹
    ctx.strokeStyle='rgba(240,214,138,.9)'; ctx.lineWidth=2.5;
    for(let i=0;i<3;i++){ ctx.beginPath(); ctx.arc(cx,h*0.44,9+i*12,0,Math.PI*2); ctx.stroke(); }
    ctx.fillStyle='rgba(232,69,95,.75)';
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4;
      ctx.beginPath(); ctx.arc(cx+Math.cos(a)*33,h*0.44+Math.sin(a)*33,3.2,0,Math.PI*2); ctx.fill();
    }
  } else if(p===1){ // 福字纹
    ctx.fillStyle='rgba(240,214,138,.95)';
    ctx.font='bold 38px "Noto Serif SC",serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('福',cx,h*0.44);
    ctx.strokeStyle='rgba(232,69,95,.7)'; ctx.lineWidth=2;
    ctx.strokeRect(cx-26,h*0.44-26,52,52);
  } else if(p===2){ // 萨满三角纹
    ctx.strokeStyle='rgba(240,214,138,.9)'; ctx.lineWidth=2.5;
    for(let i=0;i<4;i++){
      const y=h*0.32+i*15;
      ctx.beginPath();
      ctx.moveTo(cx-26+i*6,y+12); ctx.lineTo(cx,y-8); ctx.lineTo(cx+26-i*6,y+12);
      ctx.closePath(); ctx.stroke();
    }
    ctx.fillStyle='rgba(232,69,95,.7)';
    ctx.beginPath(); ctx.arc(cx,h*0.31,3,0,Math.PI*2); ctx.fill();
  } else { // 连年有余（鱼纹）
    ctx.strokeStyle='rgba(240,214,138,.9)'; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.ellipse(cx,h*0.44,28,13,0,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+26,h*0.44); ctx.lineTo(cx+40,h*0.44-10); ctx.lineTo(cx+40,h*0.44+10); ctx.closePath(); ctx.stroke();
    ctx.fillStyle='rgba(232,69,95,.75)';
    ctx.beginPath(); ctx.arc(cx-14,h*0.42,3,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(240,214,138,.55)';
    ctx.beginPath(); ctx.moveTo(cx-18,h*0.44); ctx.quadraticCurveTo(cx,h*0.38,cx+18,h*0.44); ctx.stroke();
  }
  ctx.globalCompositeOperation='source-over';
}

function puppetFigureTexture(type=0, pattern=-1){
  return makeTexture((ctx,w,h)=>{
    drawPuppetFigure(ctx,w,h,type);
    if(pattern>=0) patternOverlay(ctx,w,h,pattern);
  },256,512);
}

// 换装纹理缓存
const costumeCache = {};
function costumeTexture(figType, pattern){
  const key = figType+'-'+pattern;
  if(!costumeCache[key]) costumeCache[key] = puppetFigureTexture(figType, pattern);
  return costumeCache[key];
}

function paperCutTexture(type=0){
  return makeTexture((ctx,w,h)=>{
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = '#C41E3A';
    const cx=w/2, cy=h/2, r=w*0.42;
    if(type===0){
      ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
      ctx.globalCompositeOperation='destination-out';
      for(let i=0;i<8;i++){
        const a=i*Math.PI/4;
        ctx.save();ctx.translate(cx,cy);ctx.rotate(a);
        ctx.beginPath();
        ctx.ellipse(0,-r*0.5, r*0.08, r*0.25, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
      }
      ctx.beginPath();ctx.arc(cx,cy,r*0.15,0,Math.PI*2);ctx.fill();
      for(let i=0;i<6;i++){
        const a=i*Math.PI/3;
        ctx.beginPath();
        ctx.ellipse(cx+Math.cos(a)*r*0.3, cy+Math.sin(a)*r*0.3, r*0.1, r*0.15, a, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.globalCompositeOperation='source-over';
    } else if(type===1){
      ctx.fillRect(cx-r*0.7, cy-r*0.7, r*1.4, r*1.4);
      ctx.globalCompositeOperation='destination-out';
      ctx.font = `bold ${r*1.1}px serif`;
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('福', cx, cy);
      ctx.globalCompositeOperation='source-over';
    } else if(type===2){
      ctx.beginPath();
      ctx.moveTo(cx, cy-r*0.8);
      ctx.lineTo(cx+r*0.3, cy-r*0.5);
      ctx.lineTo(cx+r*0.35, cy+r*0.3);
      ctx.lineTo(cx+r*0.5, cy+r*0.8);
      ctx.lineTo(cx-r*0.5, cy+r*0.8);
      ctx.lineTo(cx-r*0.35, cy+r*0.3);
      ctx.lineTo(cx-r*0.3, cy-r*0.5);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();ctx.arc(cx, cy-r*0.65, r*0.18, 0, Math.PI*2);ctx.fill();
      ctx.fillRect(cx-r*0.25, cy-r*0.88, r*0.5, r*0.1);
      for(let i=0;i<5;i++){ ctx.fillRect(cx-r*0.2+i*r*0.1, cy-r*1.0, r*0.04, r*0.15); }
      ctx.globalCompositeOperation='destination-out';
      ctx.beginPath();ctx.arc(cx, cy-r*0.1, r*0.08, 0, Math.PI*2);ctx.fill();
      for(let i=0;i<4;i++){
        ctx.beginPath();
        ctx.arc(cx-r*0.15+i*r*0.1, cy+r*0.2, r*0.04, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.globalCompositeOperation='source-over';
    } else {
      ctx.beginPath();
      ctx.ellipse(cx, cy, r*0.6, r*0.35, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx+r*0.55, cy);
      ctx.lineTo(cx+r*0.9, cy-r*0.3);
      ctx.lineTo(cx+r*0.9, cy+r*0.3);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx-r*0.1, cy-r*0.3);
      ctx.lineTo(cx-r*0.3, cy-r*0.55);
      ctx.lineTo(cx+r*0.1, cy-r*0.25);
      ctx.closePath();
      ctx.fill();
      ctx.globalCompositeOperation='destination-out';
      for(let row=0;row<3;row++){
        for(let col=0;col<5;col++){
          ctx.beginPath();
          ctx.arc(cx-r*0.35+col*r*0.18, cy-r*0.15+row*r*0.15, r*0.05, 0, Math.PI*2);
          ctx.fill();
        }
      }
      ctx.beginPath();ctx.arc(cx-r*0.4, cy-r*0.08, r*0.05, 0, Math.PI*2);ctx.fill();
      ctx.globalCompositeOperation='source-over';
    }
  },512,512);
}

function floorTexture(){
  return makeTexture((ctx,w,h)=>{
    ctx.fillStyle='#1a1520';
    ctx.fillRect(0,0,w,h);
    const tileW=w/4, tileH=h/4;
    for(let i=0;i<4;i++){
      for(let j=0;j<4;j++){
        const shade=20+Math.random()*15;
        ctx.fillStyle=`rgb(${shade},${shade-5},${shade+5})`;
        ctx.fillRect(i*tileW+1, j*tileH+1, tileW-2, tileH-2);
      }
    }
    ctx.strokeStyle='rgba(212,168,67,.15)';
    ctx.lineWidth=1;
    for(let i=0;i<=4;i++){
      ctx.beginPath();ctx.moveTo(i*tileW,0);ctx.lineTo(i*tileW,h);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,i*tileH);ctx.lineTo(w,i*tileH);ctx.stroke();
    }
  });
}

// 鎏金流光纹理（动态扫光）
let sheenTex = null;
function goldSheenTexture(){
  return makeTexture((ctx,w,h)=>{
    ctx.clearRect(0,0,w,h);
    const g = ctx.createLinearGradient(0,0,w,0);
    g.addColorStop(0,'rgba(240,214,138,0)');
    g.addColorStop(0.32,'rgba(240,214,138,0)');
    g.addColorStop(0.42,'rgba(255,244,214,.85)');
    g.addColorStop(0.5,'rgba(240,214,138,1)');
    g.addColorStop(0.58,'rgba(255,244,214,.85)');
    g.addColorStop(0.68,'rgba(240,214,138,0)');
    g.addColorStop(1,'rgba(240,214,138,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);
    // 细碎金闪
    for(let i=0;i<26;i++){
      ctx.fillStyle = `rgba(255,236,180,${0.15+Math.random()*0.35})`;
      const x = w*0.3+Math.random()*w*0.4;
      ctx.fillRect(x, Math.random()*h, 2, 2+Math.random()*4);
    }
  },256,256);
}

// 径向暖光（皮影皮革透光）
function radialGlowTexture(){
  return makeTexture((ctx,w,h)=>{
    const g = ctx.createRadialGradient(w/2,h/2,4,w/2,h/2,w/2);
    g.addColorStop(0,'rgba(255,196,120,.9)');
    g.addColorStop(0.5,'rgba(255,160,80,.35)');
    g.addColorStop(1,'rgba(255,140,60,0)');
    ctx.fillStyle=g;
    ctx.fillRect(0,0,w,h);
  },128,128);
}

// 雾团纹理（分层国风雾效）
function fogTexture(){
  return makeTexture((ctx,w,h)=>{
    ctx.clearRect(0,0,w,h);
    for(let i=0;i<46;i++){
      const x=Math.random()*w, y=h*0.25+Math.random()*h*0.75, r=18+Math.random()*46;
      const g=ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,'rgba(13,13,26,.22)');
      g.addColorStop(1,'rgba(13,13,26,0)');
      ctx.fillStyle=g;
      ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    }
  },256,128);
}

// 金色星光粒子贴图
function starSpriteTexture(){
  return makeTexture((ctx,w,h)=>{
    ctx.clearRect(0,0,w,h);
    ctx.translate(w/2,h/2);
    ctx.shadowColor='rgba(240,214,138,1)';
    ctx.shadowBlur=10;
    ctx.fillStyle='rgba(255,240,200,1)';
    ctx.beginPath();
    for(let i=0;i<4;i++){
      const a=i*Math.PI/2;
      ctx.lineTo(Math.cos(a)*w*0.46, Math.sin(a)*w*0.46);
      ctx.lineTo(Math.cos(a+Math.PI/4)*w*0.1, Math.sin(a+Math.PI/4)*w*0.1);
    }
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(0,0,3,0,Math.PI*2); ctx.fill();
  },64,64);
}

// 红色雪花粒子贴图（年俗主题）
function snowSpriteTexture(){
  return makeTexture((ctx,w,h)=>{
    ctx.clearRect(0,0,w,h);
    ctx.translate(w/2,h/2);
    ctx.strokeStyle='rgba(255,220,220,1)';
    ctx.lineWidth=3;
    ctx.shadowColor='rgba(255,120,120,.9)';
    ctx.shadowBlur=6;
    for(let i=0;i<3;i++){
      const a=i*Math.PI/3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a)*-w*0.42, Math.sin(a)*-w*0.42);
      ctx.lineTo(Math.cos(a)*w*0.42, Math.sin(a)*w*0.42);
      ctx.stroke();
      for(let s=-1;s<=1;s+=2){
        const bx=Math.cos(a)*w*0.22*s, by=Math.sin(a)*w*0.22*s;
        ctx.beginPath();
        ctx.moveTo(bx,by);
        ctx.lineTo(bx+Math.cos(a+0.6)*8*s, by+Math.sin(a+0.6)*8*s);
        ctx.moveTo(bx,by);
        ctx.lineTo(bx+Math.cos(a-0.6)*8*s, by+Math.sin(a-0.6)*8*s);
        ctx.stroke();
      }
    }
  },64,64);
}

// 福字粒子贴图（年俗主题）
function fuSpriteTexture(){
  return makeTexture((ctx,w,h)=>{
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle='#C41E3A';
    ctx.strokeStyle='#D4A843';
    ctx.lineWidth=3;
    const r=10;
    ctx.beginPath();
    ctx.moveTo(r,2); ctx.lineTo(w-r,2); ctx.quadraticCurveTo(w-2,2,w-2,r);
    ctx.lineTo(w-2,h-r); ctx.quadraticCurveTo(w-2,h-2,w-r,h-2);
    ctx.lineTo(r,h-2); ctx.quadraticCurveTo(2,h-2,2,h-r);
    ctx.lineTo(2,r); ctx.quadraticCurveTo(2,2,r,2);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#F5E6C8';
    ctx.font='bold 40px "Noto Serif SC",serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('福', w/2, h/2+2);
  },64,64);
}

// ===== 皮影戏台场景 =====
function buildPuppetScene(){
  const g = puppetSceneGroup;
  const woodTex = woodTexture();
  const curtainTex = curtainTexture();
  const screenTex = whiteScreenTexture();
  const floorTex = floorTexture();

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({map:floorTex, roughness:0.9, metalness:0.1}));
  floor.rotation.x = -Math.PI/2;
  floor.receiveShadow = true;
  g.add(floor);

  const baseMat = new THREE.MeshStandardMaterial({map:woodTex, roughness:0.8});
  const base = new THREE.Mesh(new THREE.BoxGeometry(16, 1.5, 10), baseMat);
  base.position.set(0, 0.75, 0);
  base.castShadow = true; base.receiveShadow = true;
  g.add(base);

  for(let i=0;i<3;i++){
    const step = new THREE.Mesh(new THREE.BoxGeometry(6-i*0.8, 0.4, 1.2), baseMat);
    step.position.set(0, 0.2+i*0.4, 5.5+i*1.2);
    step.castShadow = true; step.receiveShadow = true;
    g.add(step);
  }

  const pillarGeo = new THREE.CylinderGeometry(0.35, 0.4, 7, 16);
  const pillarMat = new THREE.MeshStandardMaterial({map:woodTex, roughness:0.7, color:0x8B4513});
  [[-7,4.5,-4],[7,4.5,-4],[-7,4.5,4],[7,4.5,4]].forEach(([x,y,z])=>{
    const p = new THREE.Mesh(pillarGeo, pillarMat);
    p.position.set(x,y,z); p.castShadow = true; g.add(p);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.6,0.4,16),
      new THREE.MeshStandardMaterial({color:0x555555,roughness:0.6}));
    foot.position.set(x,1.7,z); g.add(foot);
  });

  const beamGeo = new THREE.BoxGeometry(16, 0.6, 0.8);
  const beam1 = new THREE.Mesh(beamGeo, pillarMat);
  beam1.position.set(0, 8, -4); beam1.castShadow=true; g.add(beam1);
  const beam2 = beam1.clone(); beam2.position.z = 4; g.add(beam2);
  const beam3 = new THREE.Mesh(new THREE.BoxGeometry(0.8,0.6,9), pillarMat);
  beam3.position.set(-7,8,0); beam3.castShadow=true; g.add(beam3);
  const beam4 = beam3.clone(); beam4.position.x=7; g.add(beam4);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(18, 0.5, 12),
    new THREE.MeshStandardMaterial({color:0x2a1a1a, roughness:0.9}));
  roof.position.set(0, 8.8, 0); roof.castShadow=true; g.add(roof);
  const eave = new THREE.Mesh(new THREE.BoxGeometry(19, 0.3, 13),
    new THREE.MeshStandardMaterial({color:0x3d2520,roughness:0.8}));
  eave.position.set(0,8.5,0); g.add(eave);

  const screenMat = new THREE.MeshStandardMaterial({
    map:screenTex, transparent:true, opacity:0.92,
    side:THREE.DoubleSide, emissive:0xF5E6C8, emissiveIntensity:0.15
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), screenMat);
  screen.position.set(0, 4.5, -3.8);
  g.add(screen);
  STATE.fx.screen = screen;

  const frameMat = new THREE.MeshStandardMaterial({map:woodTex, color:0x6B3A1A});
  const frameTop = new THREE.Mesh(new THREE.BoxGeometry(10.8,0.4,0.3), frameMat);
  frameTop.position.set(0,7.7,-3.8); g.add(frameTop);
  const frameBot = frameTop.clone(); frameBot.position.y=1.3; g.add(frameBot);
  const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.4,6.4,0.3), frameMat);
  frameL.position.set(-5.2,4.5,-3.8); g.add(frameL);
  const frameR = frameL.clone(); frameR.position.x=5.2; g.add(frameR);

  const sideCurtainMat = new THREE.MeshStandardMaterial({map:curtainTex, side:THREE.DoubleSide, roughness:0.9});
  const curtainL = new THREE.Mesh(new THREE.PlaneGeometry(3, 7), sideCurtainMat);
  curtainL.position.set(-6.2, 4.5, -3.5); curtainL.rotation.y = 0.2; g.add(curtainL);
  const curtainR = new THREE.Mesh(new THREE.PlaneGeometry(3, 7), sideCurtainMat);
  curtainR.position.set(6.2, 4.5, -3.5); curtainR.rotation.y = -0.2; g.add(curtainR);
  STATE.fx.curtainL = curtainL;
  STATE.fx.curtainR = curtainR;

  // 皮影人物（含透光辉光 + 幕布投影 + AI状态）
  const glowTex = radialGlowTexture();
  [{x:-2, role:'yang', fig:0, name:'皮影人物·武将'},
   {x:2.5, role:'xue', fig:1, name:'皮影人物·文生'}].forEach((def,i)=>{
    const mat = new THREE.MeshBasicMaterial({
      map:puppetFigureTexture(def.fig), transparent:true, opacity:0.85,
      side:THREE.DoubleSide, depthWrite:false
    });
    const puppet = new THREE.Mesh(new THREE.PlaneGeometry(2, 4), mat);
    puppet.position.set(def.x, i===0?4:3.8, -3.6);
    puppet.userData = {
      type:'puppet', name:def.name, role:def.role, figIndex:def.fig,
      animState:'idle', baseY:puppet.position.y, baseX:def.x,
      phase0:Math.random()*6, costumePulse:0,
      aiRotY:0, aiOffX:0, aiOffY:0
    };
    // 皮革透光辉光（子对象随动）
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.8,4.8),
      new THREE.MeshBasicMaterial({map:glowTex, transparent:true, opacity:0.2,
        blending:THREE.AdditiveBlending, depthWrite:false}));
    glow.position.z = -0.03;
    puppet.add(glow);
    puppet.userData.glow = glow;
    // 幕布投影（影子形变/重叠/虚化）
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.1,4.2),
      new THREE.MeshBasicMaterial({map:puppetFigureTexture(def.fig), color:0x000000,
        transparent:true, opacity:0.28, depthWrite:false}));
    shadow.position.set(def.x*1.25, puppet.position.y+0.1, -3.72);
    shadow.scale.set(1.1,1.12,1);
    g.add(shadow);
    puppet.userData.shadow = shadow;

    g.add(puppet);
    puppetObjects.push(puppet);
  });

  // 灯笼（音画同步脉冲对象）
  const lanternMat = new THREE.MeshStandardMaterial({
    color:0xC41E3A, emissive:0xFF4444, emissiveIntensity:0.6, roughness:0.5
  });
  STATE.fx.lanternMat = lanternMat;
  STATE.fx.lanternLights = [];
  [[-5,7.5,0],[5,7.5,0],[-5,7.5,-3],[5,7.5,-3]].forEach(([x,y,z])=>{
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), lanternMat);
    lantern.position.set(x,y,z);
    lantern.scale.set(1,1.3,1);
    g.add(lantern);
    const light = new THREE.PointLight(0xFF7248, 1.3, 9);
    light.position.set(x,y,z);
    g.add(light);
    STATE.fx.lanternLights.push(light);
    const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.6,8),
      new THREE.MeshBasicMaterial({color:0xD4A843}));
    tassel.position.set(x,y-0.8,z); g.add(tassel);
  });

  const spotLight = new THREE.SpotLight(0xFFE4B5, 2.5, 30, Math.PI/5, 0.4, 1);
  spotLight.position.set(0, 5, -8);
  spotLight.target.position.set(0, 4.5, -3.8);
  spotLight.castShadow = true;
  g.add(spotLight);
  g.add(spotLight.target);
  STATE.fx.spot = spotLight;

  const warmLight = new THREE.PointLight(0xFF8C42, 1.0, 25);
  warmLight.position.set(0, 6, 2);
  g.add(warmLight);
  STATE.fx.warm = warmLight;

  // 交互热点
  const hotspotMat = new THREE.MeshBasicMaterial({color:0xD4A843, transparent:true, opacity:0.9});
  const hotspotRingMat = new THREE.MeshBasicMaterial({color:0xD4A843, transparent:true, opacity:0.4, side:THREE.DoubleSide});
  SCENE_DATA.puppet.hotspots.forEach((hs, i)=>{
    const group = new THREE.Group();
    group.add(new THREE.Mesh(new THREE.RingGeometry(0.3,0.45,32), hotspotRingMat));
    group.add(new THREE.Mesh(new THREE.CircleGeometry(0.2,32), hotspotMat));
    const positions = [[-5.5,2.5,1.5],[5.5,2.5,1.5],[0,2.5,5.2]];
    group.position.set(...positions[i]);
    group.userData = {type:'hotspot', scene:'puppet', data:hs};
    g.add(group);
    puppetObjects.push(group);
    STATE.hotspots.push(group);
  });

  const mountain = new THREE.Mesh(new THREE.PlaneGeometry(50, 15),
    new THREE.MeshBasicMaterial({color:0x1a1525, transparent:true, opacity:0.6}));
  mountain.position.set(0, 5, -15);
  g.add(mountain);

  addFogLayers(g, -14.5, 3.5, -8.5, 2.5);
}

// ===== 分层国风雾效 =====
function addFogLayers(g, farZ, farY, midZ, midY){
  const tex = fogTexture();
  [[farZ, farY, 60, 12, 0.5],[midZ, midY, 50, 9, 0.28]].forEach(([z,y,w2,h2,op])=>{
    const t = tex.clone();
    t.needsUpdate = true;
    const m = new THREE.MeshBasicMaterial({map:t, transparent:true, opacity:op, depthWrite:false});
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w2, h2), m);
    mesh.position.set(0, y, z);
    mesh.renderOrder = 2;
    g.add(mesh);
    STATE.fogMats.push(m);
  });
}

// ===== 满族剪纸展厅场景 =====
function buildPaperScene(){
  const g = paperSceneGroup;
  const woodTex = woodTexture();
  const floorTex = floorTexture();

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40,40),
    new THREE.MeshStandardMaterial({map:floorTex, roughness:0.9}));
  floor.rotation.x = -Math.PI/2; floor.receiveShadow=true; g.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({color:0x381425, roughness:0.95});   // 国潮朱漆红墙
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), wallMat);
  backWall.position.set(0, 6, -8); backWall.receiveShadow=true; g.add(backWall);
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), wallMat);
  leftWall.position.set(-12, 6, 0); leftWall.rotation.y = Math.PI/2; g.add(leftWall);
  const rightWall = leftWall.clone(); rightWall.position.x=12; rightWall.rotation.y=-Math.PI/2; g.add(rightWall);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(30,20),
    new THREE.MeshStandardMaterial({color:0x301622, roughness:1}));
  ceiling.rotation.x = Math.PI/2; ceiling.position.y=12; g.add(ceiling);

  const shelfMat = new THREE.MeshStandardMaterial({map:woodTex, color:0x5C3A1A, roughness:0.7});
  function makeShelf(x, z, rot=0){
    const shelf = new THREE.Group();
    const postGeo = new THREE.BoxGeometry(0.2, 5, 0.2);
    [[-1.8,0,-0.8],[1.8,0,-0.8],[-1.8,0,0.8],[1.8,0,0.8]].forEach(([px,py,pz])=>{
      const post = new THREE.Mesh(postGeo, shelfMat);
      post.position.set(px, 2.5+py, pz);
      post.castShadow=true; shelf.add(post);
    });
    for(let i=0;i<4;i++){
      const board = new THREE.Mesh(new THREE.BoxGeometry(4, 0.15, 1.8), shelfMat);
      board.position.set(0, 1+i*1.3, 0);
      board.castShadow=true; board.receiveShadow=true;
      shelf.add(board);
    }
    shelf.position.set(x, 0, z);
    shelf.rotation.y = rot;
    g.add(shelf);
  }

  makeShelf(-6, -5, 0);
  makeShelf(6, -5, 0);
  makeShelf(0, -6.5, 0);

  if(!sheenTex) sheenTex = goldSheenTexture();

  const paperTypes = [0,1,2,3,0,1,2,3,0,1,2,3];
  const paperNames = ['团花窗花','福字剪纸','萨满神像','连年有余','团花纹样','喜字剪纸','萨满祭祀','鲤鱼跃龙门','八角窗花','寿字剪纸','祖先神影','富贵有余'];
  const paperPositions = [
    [-6,1.7,-4.2],[-6,3.0,-4.2],[-6,4.3,-4.2],
    [6,1.7,-4.2],[6,3.0,-4.2],[6,4.3,-4.2],
    [-2.5,1.7,-5.7],[0,1.7,-5.7],[2.5,1.7,-5.7],
    [-2.5,3.3,-5.7],[0,3.3,-5.7],[2.5,3.3,-5.7],
  ];

  paperPositions.forEach((pos, i)=>{
    const type = paperTypes[i % 4];
    const paperGroup = new THREE.Group();
    const paperMat = new THREE.MeshStandardMaterial({
      map:paperCutTexture(type), transparent:true, side:THREE.DoubleSide,
      roughness:0.6, metalness:0.1, emissive:0xC41E3A, emissiveIntensity:0.08
    });
    paperGroup.add(new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), paperMat));

    const border = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.7,1.7)),
      new THREE.LineBasicMaterial({color:0xD4A843, transparent:true, opacity:0.6}));
    paperGroup.add(border);

    // 鎏金流光层
    const sheen = new THREE.Mesh(new THREE.PlaneGeometry(1.78,1.78),
      new THREE.MeshBasicMaterial({map:sheenTex, transparent:true, opacity:0.22,
        blending:THREE.AdditiveBlending, depthWrite:false}));
    sheen.position.z = 0.01;
    sheen.renderOrder = 3;
    paperGroup.add(sheen);
    STATE.sheenMeshes.push({mesh:sheen, obj:paperGroup, base:0.22, phase:Math.random()});

    paperGroup.position.set(...pos);
    paperGroup.userData = {
      type:'papercut', name:paperNames[i], patternIndex:type,
      data: SCENE_DATA.paper.hotspots[i % 3],
      animState:'idle', hovered:false, unfolded:false, interStage:0,
      targetScale:1, targetRotY:0, phase:Math.random()*6
    };
    g.add(paperGroup);
    paperObjects.push(paperGroup);
  });

  // 展厅中央：萨满神主剪纸
  const centerPaper = new THREE.Group();
  const bigPaper = new THREE.Mesh(new THREE.PlaneGeometry(4, 4),
    new THREE.MeshStandardMaterial({map:paperCutTexture(2), transparent:true, side:THREE.DoubleSide,
      emissive:0xC41E3A, emissiveIntensity:0.15, depthWrite:false}));
  bigPaper.position.z = 0.02;
  centerPaper.add(bigPaper);
  const bigPaperBack = new THREE.Mesh(new THREE.PlaneGeometry(4,4),
    new THREE.MeshStandardMaterial({map:paperCutTexture(0),transparent:true,side:THREE.DoubleSide, depthWrite:false}));
  bigPaperBack.rotation.y = Math.PI;
  bigPaperBack.position.z = -0.02;
  centerPaper.add(bigPaperBack);
  const centerSheen = new THREE.Mesh(new THREE.PlaneGeometry(4.3,4.3),
    new THREE.MeshBasicMaterial({map:sheenTex, transparent:true, opacity:0.25,
      blending:THREE.AdditiveBlending, depthWrite:false}));
  centerSheen.position.z = 0.06;
  centerSheen.renderOrder = 3;
  centerPaper.add(centerSheen);
  STATE.sheenMeshes.push({mesh:centerSheen, obj:centerPaper, base:0.25, phase:0.4});
  centerPaper.position.set(0, 5, 1);
  centerPaper.userData = {type:'centerpaper', name:'萨满神主剪纸', rotating:true, patternIndex:2};
  g.add(centerPaper);
  paperObjects.push(centerPaper);

  const spotPositions = [[-6,11,-4],[6,11,-4],[0,11,-5.5],[0,11,1]];
  spotPositions.forEach(([x,y,z])=>{
    const spot = new THREE.SpotLight(0xFFF0D0, 1.25, 15, Math.PI/6, 0.5, 1);
    spot.position.set(x,y,z);
    spot.target.position.set(x, 2, z+1);
    spot.castShadow = true;
    g.add(spot); g.add(spot.target);
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.3,0.4,16),
      new THREE.MeshStandardMaterial({color:0x333333, metalness:0.8}));
    lamp.position.set(x,y,z); g.add(lamp);
  });

  g.add(new THREE.AmbientLight(0x8a5a48, 0.6));
  const fillLight = new THREE.PointLight(0xD4A843, 0.95, 20);
  fillLight.position.set(0, 8, 0);
  g.add(fillLight);

  for(let i=0;i<8;i++){
    const hangPaper = new THREE.Mesh(new THREE.PlaneGeometry(0.6,0.6),
      new THREE.MeshStandardMaterial({map:paperCutTexture(i%4),transparent:true,side:THREE.DoubleSide}));
    hangPaper.position.set(-8+i*2.3, 10.5 - Math.random()*1.5, -2+Math.random()*4);
    hangPaper.userData = {type:'hangpaper', baseY:hangPaper.position.y, phase:Math.random()*Math.PI*2};
    g.add(hangPaper);
    paperObjects.push(hangPaper);
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.01,0.01,1.5,4),
      new THREE.MeshBasicMaterial({color:0xD4A843, transparent:true, opacity:0.5}));
    string.position.set(hangPaper.position.x, hangPaper.position.y+0.9, hangPaper.position.z);
    g.add(string);
  }

  const cabinet = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 3),
    new THREE.MeshStandardMaterial({color:0x2a1f1a, roughness:0.3, metalness:0.5, transparent:true, opacity:0.3}));
  cabinet.position.set(0, 1.5, 2);
  g.add(cabinet);
  const cabLine = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(5,3,3)),
    new THREE.LineBasicMaterial({color:0xD4A843, opacity:0.6, transparent:true}));
  cabLine.position.copy(cabinet.position);
  g.add(cabLine);

  buildStoryPanels(g);
  addFogLayers(g, -7.7, 3.2, -6.3, 2.2);
}

// ===== 剧目故事剪纸展板（双非遗联动：皮影剧目 → 剪纸展板） =====
function storyTexture(kind){
  return makeTexture((ctx,w,h)=>{
    ctx.clearRect(0,0,w,h);
    const cx=w/2;
    // 金边外框
    ctx.strokeStyle='#D4A843'; ctx.lineWidth=8;
    ctx.strokeRect(20,20,w-40,h-40);
    ctx.lineWidth=2;
    ctx.strokeRect(36,36,w-72,h-72);
    // 顶部剧目题字
    ctx.fillStyle='#F0D68A';
    ctx.font='bold 64px "Noto Serif SC",serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(kind==='yang'?'杨家将':'薛家将', cx, h*0.16);
    // 红色主纹样：战将剪影
    ctx.fillStyle='#C41E3A';
    const by=h*0.62;
    ctx.beginPath(); ctx.arc(cx,by-h*0.24,w*0.09,0,Math.PI*2); ctx.fill();           // 头
    ctx.beginPath();                                                                  // 战袍
    ctx.moveTo(cx-w*0.13,by-h*0.16); ctx.lineTo(cx+w*0.13,by-h*0.16);
    ctx.lineTo(cx+w*0.2,by+h*0.1); ctx.lineTo(cx-w*0.2,by+h*0.1);
    ctx.closePath(); ctx.fill();
    ctx.save();                                                                       // 大刀/银枪
    ctx.strokeStyle='#C41E3A'; ctx.lineWidth=10; ctx.lineCap='round';
    if(kind==='yang'){
      ctx.beginPath(); ctx.moveTo(cx+w*0.16,by+h*0.12); ctx.lineTo(cx+w*0.34,by-h*0.3); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx+w*0.34,by-h*0.32,w*0.05,0,Math.PI*2); ctx.fillStyle='#C41E3A'; ctx.fill();
    } else {
      ctx.beginPath(); ctx.moveTo(cx+w*0.16,by+h*0.1); ctx.lineTo(cx+w*0.32,by-h*0.28); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+w*0.32,by-h*0.28);
      ctx.lineTo(cx+w*0.38,by-h*0.38); ctx.lineTo(cx+w*0.26,by-h*0.36); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // 底部祥云纹
    ctx.strokeStyle='#C41E3A'; ctx.lineWidth=5;
    for(let i=0;i<3;i++){
      const wx=cx+(i-1)*w*0.22;
      ctx.beginPath();
      ctx.arc(wx,h*0.86,w*0.06,Math.PI,0);
      ctx.arc(wx+w*0.06,h*0.86,w*0.04,Math.PI,0);
      ctx.stroke();
    }
    // 鎏金点纹
    ctx.fillStyle='#D4A843';
    for(let i=0;i<10;i++){
      const a=i/10*Math.PI*2;
      ctx.beginPath();
      ctx.arc(cx+Math.cos(a)*w*0.4, h*0.55+Math.sin(a)*h*0.3, 4, 0, Math.PI*2);
      ctx.fill();
    }
  },512,512);
}

function buildStoryPanels(g){
  [{key:'yang', pos:[-11.6,4.5,-2], rotY:Math.PI/2},
   {key:'xue',  pos:[11.6,4.5,-2], rotY:-Math.PI/2}].forEach(def=>{
    const panel = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2,4),
      new THREE.MeshStandardMaterial({map:storyTexture(def.key), transparent:true,
        side:THREE.DoubleSide, emissive:0xC41E3A, emissiveIntensity:0.12, roughness:0.6}));
    panel.add(mesh);
    const border = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(3.35,4.15)),
      new THREE.LineBasicMaterial({color:0xD4A843, transparent:true, opacity:0.8}));
    panel.add(border);
    const sheen = new THREE.Mesh(new THREE.PlaneGeometry(3.4,4.2),
      new THREE.MeshBasicMaterial({map:sheenTex, transparent:true, opacity:0.3,
        blending:THREE.AdditiveBlending, depthWrite:false}));
    sheen.position.z = 0.02;
    panel.add(sheen);
    STATE.sheenMeshes.push({mesh:sheen, obj:panel, base:0.3, phase:Math.random()});

    panel.position.set(...def.pos);
    panel.rotation.y = def.rotY;
    panel.visible = false;
    panel.scale.setScalar(0.001);
    panel.userData = {type:'storypanel', name:STORY_DATA[def.key].title,
      data:STORY_DATA[def.key], key:def.key, sv:0};
    g.add(panel);
    paperObjects.push(panel);
    STATE.storyPanels[def.key] = panel;
  });
}

function activateStoryPanel(key){
  const panel = STATE.storyPanels[key];
  if(!panel) return;
  panel.visible = true;
  panel.userData.sv = 0.06;   // 弹性弹出初速度
  showToast(`剪纸展区已点亮同款故事展板「${STORY_DATA[key].title}」`);
}

// ============================================================
// 辽阳满族刺绣展厅（第三展区 · 三非遗融合）
// ============================================================

// 丝绸织物纹理（展台丝布）
function silkTexture(){
  return makeTexture((ctx,w,h)=>{
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,'#3a2440'); g.addColorStop(.35,'#5a2e4e');
    g.addColorStop(.5,'#8a4a68'); g.addColorStop(.65,'#5a2e4e'); g.addColorStop(1,'#3a2440');
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    for(let y=0;y<h;y+=4){
      ctx.fillStyle=`rgba(255,240,214,${0.02+Math.random()*0.05})`;
      ctx.fillRect(0,y,w,1);
    }
    for(let i=0;i<26;i++){
      ctx.strokeStyle=`rgba(240,214,138,${0.05+Math.random()*0.1})`;
      ctx.lineWidth=1;
      const x=Math.random()*w;
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x+(Math.random()-0.5)*20,h); ctx.stroke();
    }
  },256,256);
}

// 丝线粒子贴图
function threadSpriteTexture(){
  return makeTexture((ctx,w,h)=>{
    const g = ctx.createRadialGradient(w/2,h/2,1,w/2,h/2,w/2);
    g.addColorStop(0,'rgba(255,255,255,1)');
    g.addColorStop(0.35,'rgba(255,255,255,.55)');
    g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  },32,32);
}

// 金针贴图（虚拟走针）
function needleSpriteTexture(){
  return makeTexture((ctx,w,h)=>{
    ctx.clearRect(0,0,w,h);
    const g = ctx.createLinearGradient(0,0,w,0);
    g.addColorStop(0,'rgba(255,236,180,0)');
    g.addColorStop(0.55,'rgba(255,236,180,.9)');
    g.addColorStop(1,'rgba(255,255,245,1)');
    ctx.strokeStyle=g;
    ctx.lineWidth=h*0.34; ctx.lineCap='round';
    ctx.shadowColor='rgba(255,224,150,.9)'; ctx.shadowBlur=6;
    ctx.beginPath(); ctx.moveTo(2,h/2); ctx.lineTo(w-3,h/2); ctx.stroke();
  },64,16);
}

// 刺绣织物底纹（丝绸质感：经纬纹+光泽带）
function embFabric(ctx,w,h){
  const g = ctx.createLinearGradient(0,0,0,h);
  g.addColorStop(0,'#241a33'); g.addColorStop(.45,'#2f2142'); g.addColorStop(1,'#1c1428');
  ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  for(let y=0;y<h;y+=6){
    ctx.fillStyle=`rgba(240,214,138,${0.02+Math.random()*0.03})`;
    ctx.fillRect(0,y,w,2);
  }
  for(let x=0;x<w;x+=6){
    ctx.fillStyle=`rgba(240,214,138,${0.015+Math.random()*0.02})`;
    ctx.fillRect(x,0,2,h);
  }
  const sg = ctx.createLinearGradient(0,h*0.28,0,h*0.72);
  sg.addColorStop(0,'rgba(255,240,214,0)');
  sg.addColorStop(.5,'rgba(255,240,214,.09)');
  sg.addColorStop(1,'rgba(255,240,214,0)');
  ctx.fillStyle=sg; ctx.fillRect(0,0,w,h);
}

// 回针虚线笔触（模拟针脚）
function stitchStyle(ctx,color,lw=3){
  ctx.strokeStyle=color; ctx.lineWidth=lw;
  ctx.setLineDash([7,4]); ctx.lineCap='round';
  ctx.shadowColor=color; ctx.shadowBlur=5;
}

// 圆角矩形路径
function rrect(ctx,x,y,w2,h2,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w2,y,x+w2,y+h2,r);
  ctx.arcTo(x+w2,y+h2,x,y+h2,r);
  ctx.arcTo(x,y+h2,x,y,r);
  ctx.arcTo(x,y,x+w2,y,r);
  ctx.closePath();
}

// 满族母题纹样（与剪纸四类同源：团花/福字/萨满/鱼 —— 三非遗联动共用索引）
const MOTIFS = [
  {n:'团花', draw(ctx,cx,cy,r,c1,c2){
    ctx.save(); stitchStyle(ctx,c1);
    for(let i=0;i<3;i++){ ctx.beginPath(); ctx.arc(cx,cy,r*(0.35+i*0.32),0,Math.PI*2); ctx.stroke(); }
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4;
      ctx.beginPath();
      ctx.ellipse(cx+Math.cos(a)*r*0.55, cy+Math.sin(a)*r*0.55, r*0.13, r*0.24, a, 0, Math.PI*2);
      ctx.stroke();
    }
    ctx.setLineDash([]); ctx.fillStyle=c2;
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4+Math.PI/8;
      ctx.beginPath(); ctx.arc(cx+Math.cos(a)*r*0.9, cy+Math.sin(a)*r*0.9, r*0.05, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }},
  {n:'福字', draw(ctx,cx,cy,r,c1,c2){
    ctx.save();
    ctx.fillStyle=c1;
    ctx.font=`bold ${r*1.5}px "Noto Serif SC",serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('福',cx,cy+r*0.06);
    stitchStyle(ctx,c2);
    ctx.strokeRect(cx-r*1.02, cy-r*1.02, r*2.04, r*2.04);
    ctx.restore();
  }},
  {n:'萨满', draw(ctx,cx,cy,r,c1,c2){
    ctx.save(); stitchStyle(ctx,c1);
    ctx.beginPath(); ctx.arc(cx,cy-r*0.55,r*0.22,0,Math.PI*2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx-r*0.42,cy+r*0.72); ctx.lineTo(cx,cy-r*0.28); ctx.lineTo(cx+r*0.42,cy+r*0.72);
    ctx.closePath(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx-r*0.3,cy); ctx.lineTo(cx-r*0.68,cy-r*0.18);
    ctx.moveTo(cx+r*0.3,cy); ctx.lineTo(cx+r*0.68,cy-r*0.18);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(cx-r*0.76,cy-r*0.24,r*0.12,0,Math.PI*2); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle=c2;
    ctx.beginPath(); ctx.arc(cx,cy-r*0.55,r*0.06,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }},
  {n:'连年有余', draw(ctx,cx,cy,r,c1,c2){
    ctx.save(); stitchStyle(ctx,c1);
    ctx.beginPath(); ctx.ellipse(cx,cy-r*0.1,r*0.62,r*0.32,0,0,Math.PI*2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx+r*0.56,cy-r*0.1); ctx.lineTo(cx+r*0.92,cy-r*0.34); ctx.lineTo(cx+r*0.92,cy+r*0.14);
    ctx.closePath(); ctx.stroke();
    stitchStyle(ctx,c2,2);
    ctx.setLineDash([]); ctx.fillStyle=c2;
    ctx.beginPath(); ctx.arc(cx-r*0.34,cy-r*0.16,r*0.055,0,Math.PI*2); ctx.fill();
    stitchStyle(ctx,c1,2);
    ctx.beginPath();
    ctx.moveTo(cx-r*0.45,cy+r*0.52); ctx.quadraticCurveTo(cx,cy+r*0.36,cx+r*0.45,cy+r*0.52);
    ctx.stroke();
    ctx.restore();
  }}
];

// 拼贴扩展纹样（绣样拼贴调色盘用）
const MOTIFS_PLUS = MOTIFS.concat([
  {n:'云纹', draw(ctx,cx,cy,r,c1){
    ctx.save(); stitchStyle(ctx,c1);
    for(let i=0;i<3;i++){
      const ox=cx+(i-1)*r*0.72;
      ctx.beginPath();
      ctx.arc(ox,cy,r*0.3,Math.PI,0);
      ctx.arc(ox+r*0.16,cy-r*0.12,r*0.2,Math.PI,0);
      ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(cx-r*0.95,cy); ctx.lineTo(cx+r*0.95,cy); ctx.stroke();
    ctx.restore();
  }},
  {n:'盘长', draw(ctx,cx,cy,r,c1,c2){
    ctx.save(); stitchStyle(ctx,c1);
    ctx.strokeRect(cx-r*0.5,cy-r*0.5,r,r);
    ctx.strokeRect(cx-r*0.78,cy-r*0.26,r*1.56,r*0.52);
    ctx.strokeRect(cx-r*0.26,cy-r*0.78,r*0.52,r*1.56);
    stitchStyle(ctx,c2,2);
    ctx.strokeRect(cx-r*0.28,cy-r*0.28,r*0.56,r*0.56);
    ctx.restore();
  }},
  {n:'蝶纹', draw(ctx,cx,cy,r,c1,c2){
    ctx.save(); stitchStyle(ctx,c1);
    for(let s=-1;s<=1;s+=2){
      ctx.beginPath();
      ctx.ellipse(cx+s*r*0.36,cy-r*0.16,r*0.32,r*0.46,s*0.5,0,Math.PI*2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx+s*r*0.3,cy+r*0.32,r*0.22,r*0.28,s*0.4,0,Math.PI*2);
      ctx.stroke();
    }
    ctx.setLineDash([]); ctx.fillStyle=c2;
    ctx.fillRect(cx-r*0.05,cy-r*0.55,r*0.1,r*1.2);
    ctx.restore();
  }},
  {n:'花卉', draw(ctx,cx,cy,r,c1,c2){
    ctx.save(); stitchStyle(ctx,c1);
    for(let i=0;i<5;i++){
      const a=i*Math.PI*2/5-Math.PI/2;
      ctx.beginPath();
      ctx.arc(cx+Math.cos(a)*r*0.52, cy+Math.sin(a)*r*0.52, r*0.27, 0, Math.PI*2);
      ctx.stroke();
    }
    ctx.setLineDash([]); ctx.fillStyle=c2;
    ctx.beginPath(); ctx.arc(cx,cy,r*0.16,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }}
]);

// ===== 刺绣展品纹理（织物+边框+同源纹样；pattern 与剪纸联动） =====
const embTexCache = {};
function embTexture(kind, pattern=-1){
  const key = kind+'-'+pattern;
  if(embTexCache[key]) return embTexCache[key];
  const tex = makeTexture((ctx,w,h)=>{
    embFabric(ctx,w,h);
    const cx=w/2, cy=h/2;
    if(kind==='pillow'){
      // 枕头顶：圆角金边 + 回纹角 + 中央纹样
      ctx.strokeStyle='#D4A843'; ctx.lineWidth=10;
      rrect(ctx,30,30,w-60,h-60,40); ctx.stroke();
      ctx.lineWidth=3; ctx.strokeRect(56,56,w-112,h-112);
      ctx.strokeStyle='rgba(212,168,67,.85)'; ctx.lineWidth=4;
      [[78,78],[w-78,78],[78,h-78],[w-78,h-78]].forEach(([x,y])=>{
        ctx.save(); ctx.translate(x,y);
        for(let i=0;i<3;i++){ ctx.strokeRect(-20+i*6,-20+i*6,40-i*12,40-i*12); }
        ctx.restore();
      });
      MOTIFS[Math.max(0,pattern)%4].draw(ctx,cx,cy+8,w*0.185,'#F0D68A','#E8455F');
    } else if(kind==='purse'){
      // 荷包：束口袋形 + 束口系绳 + 流苏
      const top=h*0.2, bot=h*0.86;
      const pouch=()=>{
        ctx.beginPath();
        ctx.moveTo(cx-w*0.09, top);
        ctx.bezierCurveTo(cx-w*0.52, h*0.3, cx-w*0.44, bot, cx, bot);
        ctx.bezierCurveTo(cx+w*0.44, bot, cx+w*0.52, h*0.3, cx+w*0.09, top);
        ctx.closePath();
      };
      ctx.save(); pouch(); ctx.clip();
      ctx.fillStyle='rgba(74,42,84,.72)'; ctx.fillRect(0,0,w,h);
      MOTIFS[Math.max(0,pattern)%4].draw(ctx,cx,h*0.6,w*0.16,'#F0D68A','#E8455F');
      ctx.restore();
      ctx.strokeStyle='#D4A843'; ctx.lineWidth=6; pouch(); ctx.stroke();
      ctx.strokeStyle='#C41E3A'; ctx.lineWidth=8;
      ctx.beginPath(); ctx.moveTo(cx-w*0.13,top-6); ctx.quadraticCurveTo(cx,top+26,cx+w*0.13,top-6); ctx.stroke();
      ctx.fillStyle='#F0D68A';
      ctx.beginPath(); ctx.arc(cx,top-10,8,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#D4A843'; ctx.lineWidth=4;
      for(let s=-1;s<=1;s+=2){
        ctx.beginPath(); ctx.moveTo(cx,top+8); ctx.lineTo(cx+s*5,top+40); ctx.stroke();
      }
    } else if(kind==='robe'){
      // 服饰绣片：双重镶边 + 中央纹样 + 角云纹
      ctx.strokeStyle='#D4A843'; ctx.lineWidth=12; ctx.strokeRect(24,24,w-48,h-48);
      ctx.strokeStyle='#C41E3A'; ctx.lineWidth=4; ctx.strokeRect(52,52,w-104,h-104);
      MOTIFS[Math.max(0,pattern)%4].draw(ctx,cx,cy,w*0.17,'#F0D68A','#7EC8A9');
      ctx.strokeStyle='rgba(126,200,169,.8)'; ctx.lineWidth=4;
      [[64,64],[w-64,64],[64,h-64],[w-64,h-64]].forEach(([x,y])=>{
        ctx.beginPath(); ctx.arc(x,y,w*0.05,0,Math.PI*2); ctx.stroke();
      });
    } else {
      // 萨满图腾：大圆环 + 放射针脚 + 中央纹样
      ctx.strokeStyle='#D4A843'; ctx.lineWidth=8;
      ctx.beginPath(); ctx.arc(cx,cy,w*0.4,0,Math.PI*2); ctx.stroke();
      ctx.lineWidth=3;
      for(let i=0;i<12;i++){
        const a=i*Math.PI/6;
        ctx.beginPath();
        ctx.moveTo(cx+Math.cos(a)*w*0.4, cy+Math.sin(a)*w*0.4);
        ctx.lineTo(cx+Math.cos(a)*w*0.45, cy+Math.sin(a)*w*0.45);
        ctx.stroke();
      }
      ctx.strokeStyle='#C41E3A'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.arc(cx,cy,w*0.3,0,Math.PI*2); ctx.stroke();
      MOTIFS[Math.max(0,pattern)%4].draw(ctx,cx,cy,w*0.155,'#F0D68A','#E8455F');
    }
  },512,512);
  embTexCache[key]=tex;
  return tex;
}

// 故事枕顶纹理（皮影剧目 → 刺绣织造）
function embStoryTexture(kind){
  return makeTexture((ctx,w,h)=>{
    embFabric(ctx,w,h);
    const cx=w/2;
    ctx.strokeStyle='#D4A843'; ctx.lineWidth=10; ctx.strokeRect(26,26,w-52,h-52);
    ctx.lineWidth=3; ctx.strokeRect(52,52,w-104,h-104);
    ctx.fillStyle='#F0D68A';
    ctx.font='bold 76px "Noto Serif SC",serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(kind==='yang'?'杨家将':'薛家将', cx, h*0.18);
    // 盘金绣战将（针脚风）
    const by=h*0.56;
    stitchStyle(ctx,'#E8455F',9);
    ctx.beginPath(); ctx.arc(cx,by-h*0.2,w*0.1,0,Math.PI*2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx-w*0.16,by-h*0.1); ctx.lineTo(cx+w*0.16,by-h*0.1);
    ctx.lineTo(cx+w*0.22,by+h*0.16); ctx.lineTo(cx-w*0.22,by+h*0.16);
    ctx.closePath(); ctx.stroke();
    stitchStyle(ctx,'#F0D68A',7);
    ctx.beginPath();
    if(kind==='yang'){ ctx.moveTo(cx+w*0.2,by+h*0.12); ctx.lineTo(cx+w*0.38,by-h*0.28); }
    else { ctx.moveTo(cx+w*0.2,by+h*0.1); ctx.lineTo(cx+w*0.36,by-h*0.26); }
    ctx.stroke();
    // 底部云纹
    stitchStyle(ctx,'#7EC8A9',5);
    for(let i=0;i<3;i++){
      const wx=cx+(i-1)*w*0.24;
      ctx.beginPath(); ctx.arc(wx,h*0.85,w*0.07,Math.PI,0); ctx.stroke();
    }
    ctx.setLineDash([]); ctx.fillStyle='rgba(240,214,138,.75)';
    ctx.font='24px "Noto Sans SC",sans-serif';
    ctx.fillText('满族枕头顶刺绣 · 盘金绣', cx, h*0.945);
  },512,640);
}

// 刺绣展品创建（织物底 + 鎏金流光 + 递进交互状态）
function makeEmbExhibit(g, def){
  const grp = new THREE.Group();
  const frontTex = embTexture(def.kind, def.pattern);
  const mat = new THREE.MeshStandardMaterial({
    map:frontTex, transparent:(def.kind==='purse'),
    side:THREE.DoubleSide, roughness:0.5, metalness:0.1,
    emissive:0xD4A843, emissiveIntensity:0.1
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(def.w, def.h), mat);
  grp.add(mesh);
  const border = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(def.w+0.06, def.h+0.06)),
    new THREE.LineBasicMaterial({color:0xD4A843, transparent:true, opacity:0.55}));
  grp.add(border);
  const sheen = new THREE.Mesh(new THREE.PlaneGeometry(def.w+0.12, def.h+0.12),
    new THREE.MeshBasicMaterial({map:sheenTex, transparent:true, opacity:0.22,
      blending:THREE.AdditiveBlending, depthWrite:false}));
  sheen.position.z = 0.02; sheen.renderOrder = 3;
  grp.add(sheen);
  STATE.sheenMeshes.push({mesh:sheen, obj:grp, base:0.22, phase:Math.random()});

  grp.position.set(...def.pos);
  if(def.rotY) grp.rotation.y = def.rotY;
  grp.userData = {
    type:'embroidery', name:def.name, kind:def.kind, patternIndex:def.pattern,
    data:SCENE_DATA.emb.hotspots[def.hs], stage:0, hovered:false,
    baseY:def.pos[1], phase:Math.random()*6, pulse:0,
    size:{w:def.w, h:def.h}, mesh:mesh, rotating:!!def.rotating,
    front:frontTex, back:exhibitBackTex(def.kind, def.pattern), flipped:false, baseRotY:def.rotY||0
  };
  g.add(grp);
  embObjects.push(grp);
}

// —— 背面信息卡：每件展品各自不同的“工艺档案” ——
const BACK_INFO = {
  pillow: [
    {t:'四季平安枕顶', note:'针法 · 斜针打籽', line:'平安四时 · 常伴枕眠', col:['#b5573a','#8a3a24']},
    {t:'福寿双全枕顶', note:'针法 · 盘金描福', line:'福寿双全 · 吉庆盈门', col:['#a05a35','#7c3f22']},
    {t:'富贵牡丹枕顶', note:'针法 · 掺针攒花', line:'花开富贵 · 锦绣满堂', col:['#c06a45','#93412a']},
    {t:'连年有余枕顶', note:'针法 · 套针叠鳞', line:'连年有余 · 五谷丰登', col:['#9f6a40','#79461f']},
  ],
  purse: [
    {t:'并蒂莲香荷包', note:'结法 · 玉绦同心', line:'并蒂同心 · 香囊传情', col:['#c19a4f','#966b2b']},
    {t:'锦囊传情荷包', note:'结法 · 移针密缝', line:'锦囊藏意 · 情系千结', col:['#caa25c','#9c6f2d']},
  ],
  robe: [
    {t:'衣上锦绣绣片', note:'绣地 · 缎料 针法盘金', line:'衣锦无疆 · 衮衣绣裳', col:['#5d7a9e','#3f5a78']},
  ],
  totem: [
    {t:'萨满图腾织物', note:'绣法 · 满针刺影', line:'神谕织物 · 图腾护佑', col:['#6f8f60','#4e6a42']},
  ],
};

// 每个展品背面：藏针线迹背景 + 对应工艺档案（各不相同）
function exhibitBackTex(kind, pattern=0){
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const x = c.getContext('2d');
  const list = BACK_INFO[kind] || BACK_INFO.pillow;
  const info = list[pattern % list.length];
  const base = info.col || ['#ead9c8','#cbb6a0'];
  const g = x.createLinearGradient(0,0,512,512);
  g.addColorStop(0, base[0]); g.addColorStop(1, base[1]);
  x.fillStyle = g; x.fillRect(0,0,512,512);
  // 边框虚线
  x.strokeStyle = '#5f4226'; x.lineWidth = 7; x.setLineDash([12,10]); x.strokeRect(38,38,436,436); x.setLineDash([]);
  // 左上 · 藏针线迹区
  x.globalAlpha = 0.5; x.strokeStyle = '#6a4626'; x.lineWidth = 4;
  for(let r=0;r<4;r++) for(let col=0;col<3;col++){
    const px = 96 + col*50, py = 150 + r*46;
    x.beginPath(); x.moveTo(px-16,py-16); x.lineTo(px+16,py+16);
    x.moveTo(px+16,py-16); x.lineTo(px-16,py+16); x.stroke();
  }
  x.globalAlpha = 1;
  x.fillStyle = '#5f4226'; x.font = 'bold 24px "KaiTi","STKaiti","SimSun",serif';
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('藏针线迹 · 结构透示', 146, 84);
  // 角纹
  x.strokeStyle = '#8a5a2e'; x.lineWidth = 6;
  [[56,56],[456,56],[56,456],[456,456]].forEach(([px,py])=>{ x.beginPath(); x.moveTo(px-16,py); x.lineTo(px+16,py); x.stroke(); });
  // 右侧 · 工艺档案信息区
  x.fillStyle = 'rgba(80,50,24,.14)'; x.fillRect(268,60,198,392);
  x.fillStyle = '#5b3418';
  x.font = 'bold 34px "KaiTi","STKaiti","SimSun",serif';
  x.fillText(info.t, 367, 116);
  x.strokeStyle = '#8a5a2e'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(290,150); x.lineTo(444,150); x.stroke();
  x.font = '26px "KaiTi","STKaiti","SimSun",serif'; x.fillStyle = '#6f4522';
  x.fillText(info.note, 367, 214);
  // 寓意拆成两行
  const parts = info.line.split(' · ');
  x.fillText(parts[0]||'', 367, 300);
  if(parts[1]) x.fillText('· '+(parts[1].replace(/^·/,'')), 367, 356);
  x.font = '22px "KaiTi","STKaiti","SimSun",serif'; x.fillStyle = '#8a6238';
  x.fillText('背面 · 工艺档案', 367, 428);
  return new THREE.CanvasTexture(c);
}

// ===== 刺绣展厅场景 =====
function buildEmbScene(){
  const g = embSceneGroup;
  const woodTex = woodTexture();
  const floorTex = floorTexture();
  const silkTex = silkTexture();
  if(!sheenTex) sheenTex = goldSheenTexture();

  // 地面 / 墙面 / 顶棚（暖色陈列展廊）
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40,40),
    new THREE.MeshStandardMaterial({map:floorTex, roughness:0.9}));
  floor.rotation.x = -Math.PI/2; floor.receiveShadow=true; g.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({color:0x361a2c, roughness:0.95});   // 暖绛红墙（原冷紫 0x2a1c30）
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(30,12), wallMat);
  backWall.position.set(0,6,-8); backWall.receiveShadow=true; g.add(backWall);
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(20,12), wallMat);
  leftWall.position.set(-12,6,0); leftWall.rotation.y=Math.PI/2; g.add(leftWall);
  const rightWall = leftWall.clone(); rightWall.position.x=12; rightWall.rotation.y=-Math.PI/2; g.add(rightWall);
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(30,20),
    new THREE.MeshStandardMaterial({color:0x18101f, roughness:1}));
  ceiling.rotation.x = Math.PI/2; ceiling.position.y=12; g.add(ceiling);

  // 展廊立柱 + 柱头灯
  const pillarGeo = new THREE.CylinderGeometry(0.28,0.34,9,12);
  const pillarMat = new THREE.MeshStandardMaterial({map:woodTex, color:0x6B3A1A, roughness:0.75});
  [[-9,-6],[9,-6],[-9,4],[9,4]].forEach(([x,z])=>{
    const p = new THREE.Mesh(pillarGeo, pillarMat);
    p.position.set(x,4.5,z); p.castShadow=true; g.add(p);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22,12,12),
      new THREE.MeshStandardMaterial({color:0xC41E3A, emissive:0xFF6644, emissiveIntensity:0.7}));
    lamp.position.set(x,9.2,z); g.add(lamp);
  });

  // ---- 背墙：枕头顶展示板 ----
  const boardMat = new THREE.MeshStandardMaterial({map:woodTex, color:0x5C3A1A, roughness:0.7});
  const board = new THREE.Mesh(new THREE.BoxGeometry(8.4,4.6,0.25), boardMat);
  board.position.set(0,4.6,-7.8); board.castShadow=true; g.add(board);
  const boardTrim = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(8.4,4.6,0.25)),
    new THREE.LineBasicMaterial({color:0xD4A843, transparent:true, opacity:0.7}));
  boardTrim.position.copy(board.position); g.add(boardTrim);

  // ---- 左：丝布展台 ----
  const tableMat = new THREE.MeshStandardMaterial({map:woodTex, roughness:0.75});
  const table = new THREE.Mesh(new THREE.BoxGeometry(4,0.9,1.8), tableMat);
  table.position.set(-6.5,0.45,-2); table.castShadow=true; table.receiveShadow=true; g.add(table);
  const silkTop = new THREE.Mesh(new THREE.PlaneGeometry(4.2,2),
    new THREE.MeshStandardMaterial({map:silkTex, roughness:0.35, metalness:0.15, side:THREE.DoubleSide}));
  silkTop.rotation.x = -Math.PI/2; silkTop.position.set(-6.5,0.93,-2); g.add(silkTop);

  // ---- 右：服饰绣片展架 ----
  const framePostGeo = new THREE.CylinderGeometry(0.09,0.09,5.6,8);
  [[5.4,-1],[7.6,-1]].forEach(([x,z])=>{
    const post = new THREE.Mesh(framePostGeo, tableMat);
    post.position.set(x,2.8,z); g.add(post);
  });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(2.5,0.16,0.16), tableMat);
  beam.position.set(6.5,5.55,-1); g.add(beam);

  // ---- 中央：萨满图腾基座 ----
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1,1.15,0.9,20), boardMat);
  pedestal.position.set(0,0.45,1.4); pedestal.castShadow=true; g.add(pedestal);
  const pedRing = new THREE.Mesh(new THREE.TorusGeometry(1.02,0.035,8,40),
    new THREE.MeshBasicMaterial({color:0xD4A843}));
  pedRing.rotation.x = Math.PI/2; pedRing.position.set(0,0.92,1.4); g.add(pedRing);

  // ---- 刺绣展品（全部贴图扁平低模） ----
  const defs = [
    {kind:'pillow', name:'枕头顶·四季平安',   pattern:0, w:1.5, h:1.5, pos:[-2,5.4,-7.6], hs:0},
    {kind:'pillow', name:'枕头顶·福寿双全',   pattern:1, w:1.5, h:1.5, pos:[-2,3.8,-7.6], hs:0},
    {kind:'pillow', name:'枕头顶·富贵牡丹',   pattern:3, w:1.5, h:1.5, pos:[2,5.4,-7.6],  hs:0},
    {kind:'pillow', name:'枕头顶·连年有余',   pattern:2, w:1.5, h:1.5, pos:[2,3.8,-7.6],  hs:0},
    {kind:'purse',  name:'荷包·并蒂莲香',     pattern:0, w:1.15, h:1.55, pos:[-7.1,2.9,-2], hs:1},
    {kind:'purse',  name:'荷包·锦囊传情',     pattern:1, w:1.05, h:1.45, pos:[-5.9,2.7,-2], hs:1},
    {kind:'robe',   name:'服饰绣片·衣上锦绣', pattern:0, w:2.3, h:3.1, pos:[6.45,3.9,-1], rotY:-Math.PI/2, hs:2},
    {kind:'totem',  name:'萨满图腾·织物神谕', pattern:2, w:2.6, h:2.6, pos:[0,3.4,1.4], hs:3, rotating:true},
  ];
  defs.forEach(d=>makeEmbExhibit(g,d));
  // 荷包悬吊丝线
  defs.filter(d=>d.kind==='purse').forEach(d=>{
    const str = new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,5.5,4),
      new THREE.MeshBasicMaterial({color:0xD4A843, transparent:true, opacity:0.45}));
    str.position.set(d.pos[0], d.pos[1]+d.h/2+2.75, d.pos[2]);
    g.add(str);
  });

  // ---- 故事枕顶（三非遗联动：皮影剧目点亮） ----
  [{key:'yang', pos:[-11.4,4.6,-2.5], rotY:Math.PI/2},
   {key:'xue',  pos:[11.4,4.6,-2.5], rotY:-Math.PI/2}].forEach(def=>{
    const panel = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.6,3.4),
      new THREE.MeshStandardMaterial({map:embStoryTexture(def.key), transparent:true,
        side:THREE.DoubleSide, emissive:0xD4A843, emissiveIntensity:0.15, roughness:0.55}));
    panel.add(mesh);
    const border = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.75,3.55)),
      new THREE.LineBasicMaterial({color:0xD4A843, transparent:true, opacity:0.8}));
    panel.add(border);
    const sheen = new THREE.Mesh(new THREE.PlaneGeometry(2.85,3.65),
      new THREE.MeshBasicMaterial({map:sheenTex, transparent:true, opacity:0.3,
        blending:THREE.AdditiveBlending, depthWrite:false}));
    sheen.position.z = 0.02; panel.add(sheen);
    STATE.sheenMeshes.push({mesh:sheen, obj:panel, base:0.3, phase:Math.random()});
    panel.position.set(...def.pos);
    panel.rotation.y = def.rotY;
    panel.visible = false;
    panel.scale.setScalar(0.001);
    panel.userData = {type:'embstory', name:EMB_STORY_DATA[def.key].title,
      data:EMB_STORY_DATA[def.key], key:def.key, sv:0};
    g.add(panel);
    embObjects.push(panel);
    STATE.embStoryPanels[def.key] = panel;
  });

  // ---- 知识热点 + 虚拟走针热点 ----
  const hotspotMat = new THREE.MeshBasicMaterial({color:0xD4A843, transparent:true, opacity:0.9});
  const hotspotRingMat = new THREE.MeshBasicMaterial({color:0xD4A843, transparent:true, opacity:0.4, side:THREE.DoubleSide});
  [
    {hs:SCENE_DATA.emb.hotspots[0], pos:[-4.6,2.5,-4.4]},
    {hs:SCENE_DATA.emb.hotspots[1], pos:[-6.5,1.7,0.6]},
    {hs:SCENE_DATA.emb.hotspots[3], pos:[0,1.7,3.6]},
  ].forEach(d=>{
    const group = new THREE.Group();
    group.add(new THREE.Mesh(new THREE.RingGeometry(0.3,0.45,32), hotspotRingMat));
    group.add(new THREE.Mesh(new THREE.CircleGeometry(0.2,32), hotspotMat));
    group.position.set(...d.pos);
    group.userData = {type:'hotspot', scene:'emb', data:d.hs, phase0:Math.random()*6};
    g.add(group);
    embObjects.push(group);
    STATE.hotspots.push(group);
  });
  const needleSpot = new THREE.Group();
  needleSpot.add(new THREE.Mesh(new THREE.RingGeometry(0.3,0.45,32), hotspotRingMat.clone()));
  const needleCore = new THREE.Mesh(new THREE.CircleGeometry(0.2,32), hotspotMat.clone());
  needleCore.material.color.set(0xF0D68A);
  needleSpot.add(needleCore);
  needleSpot.position.set(3.4,1.7,3.6);
  needleSpot.userData = {type:'embneedle', name:'虚拟刺绣演示', phase0:Math.random()*6};
  g.add(needleSpot);
  embObjects.push(needleSpot);

  // ---- 暖柔展陈灯光（丝绸微弱高光） ----
  [[-6,11,-3],[6,11,-3],[0,11,-6],[0,11,2]].forEach(([x,y,z])=>{
    const spot = new THREE.SpotLight(0xFFE0C0, 1.35, 18, Math.PI/5.5, 0.5, 1);
    spot.position.set(x,y,z);
    spot.target.position.set(x*0.4, 2, z+1.5);
    spot.castShadow = true;
    g.add(spot); g.add(spot.target);
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.3,0.4,16),
      new THREE.MeshStandardMaterial({color:0x333333, metalness:0.8}));
    lamp.position.set(x,y,z); g.add(lamp);
  });
  g.add(new THREE.AmbientLight(0x8a5a48, 0.7));
  const fillLight = new THREE.PointLight(0xD4A843, 0.9, 22);
  fillLight.position.set(0,8,1); g.add(fillLight);
  const warmLight = new THREE.PointLight(0xFF8C42, 0.6, 20);
  warmLight.position.set(0,4,6); g.add(warmLight);

  addFogLayers(g, -7.7, 3.2, -6.2, 2.2);

  // ---- 混合交互：双面翻面卡（不再在场景中央挂3D枕顶，避免遮挡后方展品） ----
  makeDoublePillow(); // 仅用于生成正背面图，作为翻面卡默认内容；不加入场景渲染
}

// ===== 混合交互 · 3D 双面枕顶 + CSS 翻面卡联动 =====
const FLIP = {cur:0, target:0, turning:false, dragging:false, open:false, exhibit:null};
function wrap180(v){ return ((v % 360) + 360) % 360; }
function rotateTo(deg){ FLIP.target = deg; FLIP.turning = true; }
function applyFlip(){
  const card = document.getElementById('flip-card');
  if(card) card.style.transform = `rotateY(${-FLIP.cur}deg)`;
  const faceEl = document.getElementById('fp-face');
  if(faceEl){
    const w = wrap180(FLIP.cur);
    faceEl.textContent = (w < 90 || w > 270) ? '正面' : '背面';
  }
}
function snapFlip(){ rotateTo(wrap180(FLIP.cur) < 180 ? 0 : 180); }

// 选择刺绣展品：翻面卡切到该展品正背面，3D 展位也随卡翻转
function selectFlipExhibit(obj){
  FLIP.open = true; FLIP.cur = 0; rotateTo(0);
  toggleRightPanel(true); // 收起右侧知识卡，给翻面卡让位
  const titleEl = document.getElementById('fp-title');
  if(titleEl) titleEl.textContent = (obj && obj.name) || '满绣双面枕顶';
  if(obj && obj.userData.front && obj.userData.front.image){
    const fi = document.getElementById('fp-front-img');
    if(fi) fi.src = obj.userData.front.image.toDataURL();
  }
  if(obj && obj.userData.back && obj.userData.back.image){
    const bi = document.getElementById('fp-back-img');
    if(bi) bi.src = obj.userData.back.image.toDataURL();
  }
  const panel = document.getElementById('flip-panel');
  if(panel) panel.classList.add('on','focus');
  setTimeout(applyFlip, 60);
}

// 双面枕顶贴图：正面吉祥绣样 / 背面藏针线迹
function pillowTex(kind){
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const x = c.getContext('2d');
  if(kind === 'back'){
    const g = x.createLinearGradient(0,0,512,512);
    g.addColorStop(0,'#f2e7cd'); g.addColorStop(1,'#ddcba0');
    x.fillStyle = g; x.fillRect(0,0,512,512);
    // 藏针法走线：虚线纵向 + 斜向 X 针脚
    x.strokeStyle = '#8a6238'; x.lineWidth = 4;
    for(let i=0;i<6;i++){
      x.beginPath(); x.setLineDash([16,12]);
      const px = 96 + i*70;
      x.moveTo(px, 96); x.lineTo(px, 408); x.stroke();
      x.setLineDash([0]);
      for(let yy=120; yy<=408; yy+=34){ x.strokeRect(px-16,yy-12,32,24); }
    }
    // 四角 X 针迹
    x.strokeStyle = '#a37640'; x.lineWidth = 6;
    [[110,110],[402,110],[110,402],[402,402]].forEach(([px,py])=>{
      x.beginPath(); x.moveTo(px-20,py-20); x.lineTo(px+20,py+20);
      x.moveTo(px+20,py-20); x.lineTo(px-20,py+20); x.stroke();
    });
    // 边缘虚线段
    x.setLineDash([12,10]); x.strokeStyle = '#8a6238'; x.lineWidth = 7;
    x.strokeRect(52,52,408,408);
    // 注释
    x.setLineDash([]); x.fillStyle = '#7a5230';
    x.font = 'bold 46px "KaiTi","STKaiti","SimSun",serif';
    x.textAlign='center'; x.textBaseline='middle'; x.fillText('藏针法 · 线迹',256,248);
  } else {
    const g = x.createLinearGradient(0,0,512,512);
    g.addColorStop(0,'#9c2b43'); g.addColorStop(1,'#6b1026');
    x.fillStyle = g; x.fillRect(0,0,512,512);
    // 丝光横带
    x.globalAlpha = 0.08; x.strokeStyle = '#fff'; x.lineWidth = 26;
    for(let i=0;i<4;i++){
      x.beginPath(); x.moveTo(0,110+i*100); x.lineTo(512,110+i*100); x.stroke();
    }
    x.globalAlpha = 1;
    // 金线双框
    x.strokeStyle = '#E8B64C'; x.lineWidth = 16; x.strokeRect(52,52,408,408);
    x.lineWidth = 5; x.strokeStyle = 'rgba(232,182,76,.85)'; x.strokeRect(86,86,340,340);
    // 八瓣团花（外圈）
    x.save(); x.translate(256,256);
    x.strokeStyle = 'rgba(232,182,76,.9)'; x.lineWidth = 7;
    for(let i=0;i<8;i++){
      x.rotate(Math.PI/4);
      x.beginPath(); x.ellipse(0,-150,30,76,0,0,Math.PI*2); x.stroke();
    }
    x.restore();
    // 中心福字
    x.fillStyle = '#F2D28C'; x.shadowColor='rgba(255,200,90,.6)'; x.shadowBlur=22;
    x.font = 'bold 170px "KaiTi","STKaiti","SimSun",serif';
    x.textAlign='center'; x.textBaseline='middle'; x.fillText('福',256,258);
  }
  return new THREE.CanvasTexture(c);
}

// 3D 双面枕顶模型（正/背双层 · 金边包边 · 悬浮在刺绣展台前）
function makeDoublePillow(){
  const front = pillowTex('front'), back = pillowTex('back');
  // 喂给 CSS 翻面卡同源贴图
  const fi = document.getElementById('fp-front-img'), bi = document.getElementById('fp-back-img');
  if(fi && fi.src.indexOf('data:') !== 0 && front.image){ fi.src = front.image.toDataURL(); }
  if(bi && bi.src.indexOf('data:') !== 0 && back.image){ bi.src = back.image.toDataURL(); }

  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.BoxGeometry(1.5,1.82,0.16),
    new THREE.MeshStandardMaterial({color:0xf2e7cd, roughness:0.9}));
  g.add(core);
  const fMat = new THREE.MeshStandardMaterial({map:front, side:THREE.DoubleSide,
    roughness:0.5, metalness:0.1, emissive:0xD4A843, emissiveIntensity:0.08});
  const f = new THREE.Mesh(new THREE.PlaneGeometry(1.5,1.82), fMat); f.position.z = 0.09; g.add(f);
  const bMat = new THREE.MeshStandardMaterial({map:back, side:THREE.DoubleSide, roughness:0.72});
  const b = new THREE.Mesh(new THREE.PlaneGeometry(1.5,1.82), bMat);
  b.position.z = -0.09; b.rotation.y = Math.PI; g.add(b);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.56,1.9,0.2)),
    new THREE.LineBasicMaterial({color:0xE8B64C, transparent:true, opacity:0.85}));
  g.add(edge);
  // 悬挂金穗
  const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.05,0.55,6),
    new THREE.MeshStandardMaterial({color:0xE8B64C, metalness:0.5, roughness:0.4}));
  tassel.position.y = -1.16; g.add(tassel);
  g.position.set(0, 2.9, 2.8);
  g.userData = {type:'dblpillow', name:'满绣双面枕顶', hovered:false, baseY:2.9, phase:Math.random()*6, front, back};
  STATE.dblPillow = g;
  return g;
}

// 翻面卡交互：拖动旋转 / 点按与按钮翻面，双向联动 3D
function initFlipPanel(){
  const panel = document.getElementById('flip-panel');
  const stage = document.getElementById('flip-stage');
  const turn = document.getElementById('fp-turn');
  if(!panel || !stage || !turn) return;
  stage.style.cursor = 'default';
  // 翻转仅由下方「翻面」按钮触发；点选展品是放大查看正面，不通过拖动/点按翻面
  turn.addEventListener('click', ()=>{ if(FLIP.open) rotateTo(wrap180(FLIP.cur) + 180); });
  const closeBtn = document.getElementById('fp-close');
  if(closeBtn) closeBtn.addEventListener('click', e=>{ e.stopPropagation(); closeFlip(); });
  const curtain = document.getElementById('right-curtain');
  if(curtain) curtain.addEventListener('click', ()=> toggleRightPanel());
  const lcurtain = document.getElementById('left-curtain');
  if(lcurtain) lcurtain.addEventListener('click', ()=> toggleLeftPanel());
}
// 左侧导航 · 窗帘收起/放下（force: 传布尔则按值，否则切换；移动端用 open 切换，跳过）
function toggleLeftPanel(force){
  if(window.innerWidth <= 680) return;
  const panel = document.getElementById('left-panel');
  const txt = document.getElementById('lc-text');
  if(!panel) return;
  const collapsed = (typeof force === 'boolean') ? force : !panel.classList.contains('collapsed');
  panel.classList.toggle('collapsed', collapsed);
  if(txt) txt.textContent = collapsed ? '展开' : '收起';
}
// 右侧知识卡 · 窗帘收起/放下（force: 传布尔则按值，否则切换）
function toggleRightPanel(force){
  if(window.innerWidth <= 680) return;
  const panel = document.getElementById('right-panel');
  const txt = document.getElementById('rc-text');
  if(!panel) return;
  const collapsed = (typeof force === 'boolean') ? force : !panel.classList.contains('collapsed');
  panel.classList.toggle('collapsed', collapsed);
  if(txt) txt.textContent = collapsed ? '展开' : '收起';
  // 互斥：刺绣展厅内，文字收起→枕顶出现；文字展开→枕顶收起
  if(collapsed){ if(STATE.currentScene === 'emb') openFlipPanel(); }
  else if(FLIP.open) closeFlip();
}
function closeFlip(){
  hideFlipPanel();
  toggleRightPanel(false); // 放下右侧知识卡（文字展开，枕顶收起）
}
if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', initFlipPanel); }
else initFlipPanel();
// 显示默认双面枕顶卡（默认跟随第一个刺绣展品，正反面与之对应，避免固定福字封面）
function openFlipPanel(){
  const panel = document.getElementById('flip-panel'); if(!panel) return;
  FLIP.open = true; FLIP.cur = 0; FLIP.exhibit = null; rotateTo(0);
  const def = (typeof embObjects !== 'undefined' ? embObjects : []).find(e=>e.userData && e.userData.type === 'embroidery');
  const titleEl = document.getElementById('fp-title');
  if(titleEl && !titleEl.dataset.locked) titleEl.textContent = def ? def.userData.name : '满绣 · 双面工艺';
  const fi = document.getElementById('fp-front-img'), bi = document.getElementById('fp-back-img');
  if(def && def.userData.front && def.userData.front.image && fi) fi.src = def.userData.front.image.toDataURL();
  if(def && def.userData.back && def.userData.back.image && bi) bi.src = def.userData.back.image.toDataURL();
  panel.classList.add('on'); panel.classList.remove('focus'); setTimeout(applyFlip, 60);
}
// 隐藏翻面卡并复位展品（不改动左/右面板的收起状态）
function hideFlipPanel(){
  const panel = document.getElementById('flip-panel'); if(!panel) return;
  FLIP.open = false; FLIP.dragging = false; FLIP.cur = 0; FLIP.turning = false;
  if(FLIP.exhibit && FLIP.exhibit.userData && FLIP.exhibit.userData.mesh && FLIP.exhibit.userData.mesh.material){
    const u = FLIP.exhibit.userData;
    if(u.flipped){ u.flipped = false; u.mesh.material.map = u.front; u.mesh.material.needsUpdate = true; }
    FLIP.exhibit.rotation.y = u.baseRotY || 0;
  }
  FLIP.exhibit = null;
  panel.classList.remove('on','focus');
}
// 进入/离开刺绣展厅时：按右侧文字是否收起决定枕顶卡显隐；不重置左右面板收起状态
function toggleFlipPanel(name){
  const panel = document.getElementById('flip-panel'); if(!panel) return;
  const on = name === 'emb';
  if(!on){ hideFlipPanel(); return; }
  const rp = document.getElementById('right-panel');
  const textCollapsed = rp ? rp.classList.contains('collapsed') : false;
  if(textCollapsed) openFlipPanel(); else hideFlipPanel();
}

// 逐帧：枕顶浮动 + 角度趋近 + 同步 CSS卡
function updateDoublePillow(delta, elapsed){
  const p = STATE.dblPillow;
  if(!p) return;
  p.position.y = p.userData.baseY + Math.sin(elapsed * 1 + p.userData.phase) * 0.06;
  if(FLIP.turning){
    FLIP.cur += (FLIP.target - FLIP.cur) * 0.16;
    if(Math.abs(FLIP.target - FLIP.cur) < 0.4){ FLIP.cur = FLIP.target; FLIP.turning = false; }
  } else if(!FLIP.open && !FLIP.dragging){
    // 未开启面板：缓慢自转展示正背两面
    FLIP.cur += delta * 20; FLIP.cur = wrap180(FLIP.cur);
  }
  p.rotation.y = THREE.MathUtils.degToRad(-FLIP.cur);
  applyFlip();

  // 已选刺绣展品：吸附到正/背面并就地翻转（薄平面不显示边缘）
  const ex = FLIP.exhibit;
  if(ex && ex.userData.mesh){
    const u = ex.userData;
    const flipDeg = Math.round(wrap180(FLIP.cur) / 180) * 180;
    ex.rotation.y = u.baseRotY + THREE.MathUtils.degToRad(-flipDeg);
    const isBack = flipDeg >= 180;
    if(u.flipped !== isBack){
      u.flipped = isBack;
      if(u.mesh.material){ u.mesh.material.map = isBack ? u.back : u.front; u.mesh.material.needsUpdate = true; }
    }
  }
}

// ===== 三非遗联动：点亮故事枕顶 =====
function activateEmbStory(key){
  const panel = STATE.embStoryPanels[key];
  if(!panel) return;
  panel.visible = true;
  panel.userData.sv = 0.06;
  showKnowledge(EMB_STORY_DATA[key]);
  showToast(`刺绣展厅已点亮「${EMB_STORY_DATA[key].title}」`);
}

// ===== 虚拟走针动画（金针沿纹样轨迹穿针走线 + 丝线流光） =====
function playNeedleAnim(exhibit){
  const size = exhibit.userData.size || {w:1.6,h:1.6};
  const MAX = 240;
  const pos = new Float32Array(MAX*3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  geo.setDrawRange(0,0);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({color:0xFFD98A,
    transparent:true, opacity:0.95, blending:THREE.AdditiveBlending, depthWrite:false}));
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map:needleSpriteTexture(),
    transparent:true, blending:THREE.AdditiveBlending, depthWrite:false}));
  sprite.scale.set(0.7,0.16,1);
  scene.add(sprite); scene.add(line);
  STATE.needles.push({sprite, line, pos, count:0, MAX, t:0, dur:8,
    exhibit, R1:size.w*0.36, R2:size.h*0.3, acc:0});
  showToast('虚拟刺绣演示 · 金针沿纹样轨迹穿针走线');
}

// ===== 粒子系统（季节主题切换） =====
function buildParticles(){
  const particleCount = 300;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  for(let i=0;i<particleCount;i++){
    positions[i*3] = (Math.random()-0.5)*40;
    positions[i*3+1] = Math.random()*15;
    positions[i*3+2] = (Math.random()-0.5)*30;
    const c = new THREE.Color().setHSL(0.1 + Math.random()*0.05, 0.8, 0.5+Math.random()*0.3);
    colors[i*3]=c.r; colors[i*3+1]=c.g; colors[i*3+2]=c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size:0.28, map:starSpriteTexture(), vertexColors:true, transparent:true, opacity:0.8,
    blending:THREE.AdditiveBlending, depthWrite:false, sizeAttenuation:true, alphaTest:0.02
  });
  particleSystem = new THREE.Points(geo, mat);
  scene.add(particleSystem);
}

function buildPaperParticles(){
  paperParticles = new THREE.Group();
  // 红色雪花
  const n1 = 220;
  const pos1 = new Float32Array(n1*3), col1 = new Float32Array(n1*3);
  const snowTints = [[1,0.45,0.45],[1,0.75,0.75],[1,0.55,0.55]];
  for(let i=0;i<n1;i++){
    pos1[i*3]=(Math.random()-0.5)*38;
    pos1[i*3+1]=Math.random()*14;
    pos1[i*3+2]=(Math.random()-0.5)*28;
    const c=snowTints[i%3];
    col1[i*3]=c[0]; col1[i*3+1]=c[1]; col1[i*3+2]=c[2];
  }
  const g1 = new THREE.BufferGeometry();
  g1.setAttribute('position', new THREE.BufferAttribute(pos1,3));
  g1.setAttribute('color', new THREE.BufferAttribute(col1,3));
  snowSystem = new THREE.Points(g1, new THREE.PointsMaterial({
    size:0.34, map:snowSpriteTexture(), vertexColors:true, transparent:true, opacity:0.85,
    depthWrite:false, alphaTest:0.02
  }));
  paperParticles.add(snowSystem);
  // 福字粒子
  const n2 = 30;
  const pos2 = new Float32Array(n2*3);
  for(let i=0;i<n2;i++){
    pos2[i*3]=(Math.random()-0.5)*34;
    pos2[i*3+1]=Math.random()*13;
    pos2[i*3+2]=(Math.random()-0.5)*24;
  }
  const g2 = new THREE.BufferGeometry();
  g2.setAttribute('position', new THREE.BufferAttribute(pos2,3));
  fuSystem = new THREE.Points(g2, new THREE.PointsMaterial({
    size:0.55, map:fuSpriteTexture(), transparent:true, opacity:0.9, depthWrite:false, alphaTest:0.05
  }));
  paperParticles.add(fuSystem);
  paperParticles.visible = false;
  scene.add(paperParticles);
}

// ===== 丝线粒子系统（刺绣展厅氛围：彩色细丝缓缓飘散） =====
function buildThreadParticles(){
  const n = 180;
  const positions = new Float32Array(n*3);
  const colors = new Float32Array(n*3);
  const PAL = [[0.94,0.84,0.54],[0.91,0.27,0.37],[0.49,0.78,0.66],[0.44,0.66,0.86],[0.78,0.49,0.73]];
  for(let i=0;i<n;i++){
    positions[i*3]   = (Math.random()-0.5)*36;
    positions[i*3+1] = Math.random()*12;
    positions[i*3+2] = (Math.random()-0.5)*26;
    const c = PAL[i%PAL.length];
    colors[i*3]=c[0]; colors[i*3+1]=c[1]; colors[i*3+2]=c[2];
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions,3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors,3));
  threadSystem = new THREE.Points(geo, new THREE.PointsMaterial({
    size:0.14, map:threadSpriteTexture(), vertexColors:true, transparent:true, opacity:0.85,
    blending:THREE.AdditiveBlending, depthWrite:false, alphaTest:0.02
  }));
  threadSystem.visible = false;
  scene.add(threadSystem);
}

function applyParticleTheme(sceneName){
  if(particleSystem) particleSystem.visible = (sceneName==='puppet');
  if(paperParticles) paperParticles.visible = (sceneName==='paper');
  if(threadSystem) threadSystem.visible = (sceneName==='emb');
}

// ===== 金粒剥离粒子爆发 =====
function spawnGoldBurst(worldPos, n=12){
  const positions = new Float32Array(n*3);
  const vels = [];
  for(let i=0;i<n;i++){
    positions[i*3]=worldPos.x; positions[i*3+1]=worldPos.y; positions[i*3+2]=worldPos.z;
    vels.push(new THREE.Vector3((Math.random()-0.5)*1.6, Math.random()*1.4+0.3, (Math.random()-0.5)*1.6));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions,3));
  const mat = new THREE.PointsMaterial({color:0xF0D68A, size:0.09, transparent:true, opacity:1,
    blending:THREE.AdditiveBlending, depthWrite:false});
  const points = new THREE.Points(geo, mat);
  scene.add(points);
  STATE.bursts.push({points, vels, life:1});
}

// ===== 丝线粒子飘散（绣品悬浮/走针时飞出彩色细丝） =====
function spawnThreadBurst(worldPos, n=10, small=false){
  const positions = new Float32Array(n*3);
  const colors = new Float32Array(n*3);
  const vels = [];
  const PAL = [[0.94,0.84,0.54],[0.91,0.27,0.37],[0.49,0.78,0.66],[0.44,0.66,0.86],[0.78,0.49,0.73]];
  for(let i=0;i<n;i++){
    positions[i*3]   = worldPos.x+(Math.random()-0.5)*0.3;
    positions[i*3+1] = worldPos.y+(Math.random()-0.5)*0.3;
    positions[i*3+2] = worldPos.z+(Math.random()-0.5)*0.3;
    vels.push(new THREE.Vector3((Math.random()-0.5)*0.7, 0.15+Math.random()*0.5, (Math.random()-0.5)*0.7));
    const c = PAL[Math.floor(Math.random()*PAL.length)];
    colors[i*3]=c[0]; colors[i*3+1]=c[1]; colors[i*3+2]=c[2];
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions,3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors,3));
  const mat = new THREE.PointsMaterial({size: small?0.11:0.17, map:threadSpriteTexture(),
    vertexColors:true, transparent:true, opacity:1,
    blending:THREE.AdditiveBlending, depthWrite:false, alphaTest:0.02});
  const points = new THREE.Points(geo, mat);
  scene.add(points);
  STATE.bursts.push({points, vels, life:1, grav:-0.04, decay:0.55});
}

// ===== 交互处理 =====
function onCanvasClick(event){
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const objects = STATE.currentScene === 'puppet' ? puppetObjects :
                  (STATE.currentScene === 'paper' ? paperObjects : embObjects);
  const intersects = raycaster.intersectObjects(objects, true);
  if(intersects.length > 0){
    let obj = intersects[0].object;
    while(obj.parent && !obj.userData.type){ obj = obj.parent; }
    handleObjectClick(obj);
  }
}

function onCanvasHover(event){
  STATE.lastInteract = STATE.clock.getElapsedTime();
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const objects = STATE.currentScene === 'puppet' ? puppetObjects :
                  (STATE.currentScene === 'paper' ? paperObjects : embObjects);
  const intersects = raycaster.intersectObjects(objects, true);

  const prev = STATE.hoveredObject;
  if(prev && prev.userData){ prev.userData.hovered = false; }

  if(intersects.length > 0){
    let obj = intersects[0].object;
    while(obj.parent && !obj.userData.type){ obj = obj.parent; }
    if(obj.userData.type){
      STATE.hoveredObject = obj;
      obj.userData.hovered = true;
      document.body.style.cursor = 'pointer';
      // 悬浮金粒剥离 / 丝线飘散
      if(obj !== prev && (obj.userData.type === 'papercut' || obj.userData.type === 'embroidery')){
        const wp = new THREE.Vector3();
        obj.getWorldPosition(wp);
        if(obj.userData.type === 'embroidery') spawnThreadBurst(wp, 12);
        else spawnGoldBurst(wp, 10);
      }
      showHotspotLabel(obj, event.clientX, event.clientY);
      return;
    }
  }
  document.body.style.cursor = 'default';
  hideHotspotLabel();
}

function onTouchStart(event){
  if(event.touches.length === 1){
    const touch = event.touches[0];
    onCanvasClick({clientX:touch.clientX, clientY:touch.clientY});
  }
}

// ===== 物件点击（递进式交互 + 双非遗联动） =====
function handleObjectClick(obj){
  if(!obj.userData.type) return;
  STATE.lastInteract = STATE.clock.getElapsedTime();

  if(obj.userData.type === 'puppet'){
    handlePuppetClick(obj);
  } else if(obj.userData.type === 'hotspot'){
    const idx = NAV_ITEMS.findIndex(n=>n.type==='hotspot' && n.hotspotId===obj.userData.data.id);
    if(idx >= 0) gotoNav(idx);
  } else if(obj.userData.type === 'papercut'){
    handlePapercutClick(obj);
  } else if(obj.userData.type === 'centerpaper'){
    obj.userData.rotating = !obj.userData.rotating;
    applyCostume(obj.userData.patternIndex);
    applyEmbroidery(obj.userData.patternIndex);
    // 纹样母体流转：中央萨满神主剪纸同纹样登记到流转台
    STATE.flow.sel = obj.userData.patternIndex;
    STATE.flow.born[obj.userData.patternIndex] = true;
    updateBottomBarState();
    showToast(`「${obj.userData.name}」${obj.userData.rotating?'旋转展示':'停止旋转'} · 纹样已同步皮影与刺绣`);
    showKnowledgeById('paper', 'shaman');
  } else if(obj.userData.type === 'storypanel'){
    showKnowledge(obj.userData.data);
    focusOnObject(obj);
    showToast(`已聚焦「${obj.userData.name}」`);
  } else if(obj.userData.type === 'embroidery'){
    handleEmbroideryClick(obj);
  } else if(obj.userData.type === 'embneedle'){
    const target = embObjects.find(o=>o.userData.kind==='totem') ||
                   embObjects.find(o=>o.userData.type==='embroidery');
    if(target){ focusOnObject(obj); playNeedleAnim(target); }
  } else if(obj.userData.type === 'embstory'){
    showKnowledge(obj.userData.data);
    focusOnObject(obj);
    showToast(`已聚焦「${obj.userData.name}」`);
  } else if(obj.userData.type === 'dblpillow'){
    // 混合交互：点击 3D 双面枕顶 → 展开 CSS 翻面卡（默认双面枕顶）
    FLIP.exhibit = null;
    selectFlipExhibit(obj);
    focusOnObject(obj);
    showToast('满绣双面枕顶 · 拖动 / 点按翻面；点击其它绣品可分别查看双面');
  } else if(obj.userData.type === 'hangpaper'){
    // 挂签（剪纸展区悬吊小剪纸）→ 非遗知识
    showKnowledge(PROP_KNOWLEDGE.hangpaper);
    const wp = new THREE.Vector3();
    obj.getWorldPosition(wp);
    spawnGoldBurst(wp, 10);
    showToast(`「${PROP_KNOWLEDGE.hangpaper.title}」非遗小知识`);
  } else if(obj.userData.type === 'prop'){
    // 全场景环境物件 → 点击弹出相关知识
    const k = PROP_KNOWLEDGE[obj.userData.propId];
    if(k){
      showKnowledge(k);
      focusOnObject(obj);
      showToast(`「${k.title}」非遗小知识`);
    }
  }
}

// ===== 三非遗联动：荷包 → 跳转皮影 + 剧目 → 跳转刺绣 =====
// 刺绣：递进式 抬起/褶皱 → 科普讲解 → 收起（荷包联动皮影）
function handleEmbroideryClick(obj){
  const u = obj.userData;
  if(u.stage === 0){
    u.stage = 1;
    u.pulse = 1;
    const wp = new THREE.Vector3();
    obj.getWorldPosition(wp);
    spawnThreadBurst(wp, 14);
    // 混合交互：把翻面卡切到该展品双面，可就地翻转查看
    FLIP.exhibit = obj;
    selectFlipExhibit(obj);
    showToast(`「${u.name}」可翻转 · 显示正面绣样 / 背面线迹`);
  } else if(u.stage === 1){
    u.stage = 2;
    showKnowledgeById('emb', u.data.id);
    focusOnObject(obj);
    showToast(`「${u.name}」科普讲解 · 镜头自动对焦`);
    // 荷包绣品 → 自动跳转皮影戏台加载同款纹样
    if(u.kind === 'purse'){
      setTimeout(()=>{
        if(STATE.currentScene==='emb' && u.stage===2 && !STATE.switching){
          applyCostume(u.patternIndex);
          showToast('三非遗联动 · 荷包绣纹同步皮影服饰，即将跳转皮影戏台');
          gotoScene('puppet');
        }
      }, 1800);
    }
  } else {
    u.stage = 0;
    showToast(`「${u.name}」收起`);
  }
}

// 皮影：递进式 苏醒 → 开演剧目（联动剪纸展板） → 停演
function handlePuppetClick(obj){
  const u = obj.userData;
  if(u.animState === 'idle'){
    u.animState = 'awake';
    u.costumePulse = 1;
    showToast(`「${u.name}」苏醒 · 再次点击开演剧目`);
  } else if(u.animState === 'awake'){
    u.animState = 'perform';
    activateStoryPanel(u.role);
    showKnowledge(STORY_DATA[u.role]);
    showToast(`「${STORY_DATA[u.role].title}」开演 · 即将联动刺绣枕顶`);
    // 三非遗联动：皮影剧目 → 一键跳转刺绣展厅点亮故事枕顶
    setTimeout(()=>{
      if(STATE.currentScene==='puppet' && u.animState==='perform' && !STATE.switching){
        showToast('三非遗联动 · 跳转刺绣展厅展示同款故事枕顶');
        gotoScene('emb');
        setTimeout(()=>activateEmbStory(u.role), 1200);
      }
    }, 2600);
  } else {
    u.animState = 'idle';
    showToast(`「${u.name}」停止表演`);
  }
}

// 剪纸：递进式 展开/换装 → 科普讲解 → 收起
function handlePapercutClick(obj){
  const u = obj.userData;
  if(!u.unfolded){
    u.unfolded = true;
    u.interStage = 1;
    applyCostume(u.patternIndex);
    applyEmbroidery(u.patternIndex);
    // 纹样母体流转：点击剪纸 = 母题在剪纸展厅"诞生"，同步流转台选中态
    STATE.flow.sel = u.patternIndex;
    STATE.flow.born[u.patternIndex] = true;
    const wp = new THREE.Vector3();
    obj.getWorldPosition(wp);
    spawnGoldBurst(wp, 14);
    updateBottomBarState();
    showToast(`「${u.name}」苏醒展开 · 纹样已同步皮影服饰与刺绣绣纹`);
  } else if(u.interStage === 1){
    u.interStage = 2;
    showKnowledgeById('paper', u.data.id);
    focusOnObject(obj);
    showToast(`「${u.name}」科普讲解 · 镜头自动对焦`);
  } else {
    u.unfolded = false;
    u.interStage = 0;
    showToast(`「${u.name}」收起`);
  }
}

// ===== 双非遗联动：剪纸纹样 → 皮影服饰实时换装 =====
function applyCostume(pattern){
  if(pattern === undefined || pattern === null) return;
  STATE.costumePattern = pattern;
  puppetObjects.forEach(p=>{
    const u = p.userData;
    if(u.type !== 'puppet') return;
    p.material.map = costumeTexture(u.figIndex, pattern);
    p.material.needsUpdate = true;
    u.costumePulse = 1;
  });
}

// ===== 三非遗联动：剪纸纹样 → 刺绣绣纹实时映射 =====
function applyEmbroidery(pattern){
  if(pattern === undefined || pattern === null || pattern < 0) return;
  STATE.embroideryPattern = pattern;
  embObjects.forEach(o=>{
    const u = o.userData;
    if(u.type !== 'embroidery') return;
    u.mesh.material.map = embTexture(u.kind, pattern);
    u.mesh.material.needsUpdate = true;
    u.pulse = 1;
  });
}

// ===== 左侧导航（折叠分组：主模块+两辅载体变体） =====
function buildNav(){
  const list = document.getElementById('nav-list');
  list.innerHTML = '';
  NAV_GROUPS.forEach((g, gi)=>{
    const grp = document.createElement('div');
    grp.className = 'nav-group' + (g.open ? ' open' : '');
    grp.id = 'nav-group-' + g.key;
    const hdr = document.createElement('div');
    hdr.className = 'nav-group-header';
    hdr.innerHTML = `<span class="nav-toggle">${g.open ? '▾' : '▸'}</span>
      <span class="nav-group-name">${g.name}</span>
      <span class="nav-group-tag">${g.tag}</span>`;
    hdr.addEventListener('click', ()=>toggleNavGroup(g.key));
    grp.appendChild(hdr);
    if(g.hint){
      const h = document.createElement('div');
      h.className = 'nav-group-hint';
      h.textContent = g.hint;
      grp.appendChild(h);
    }
    const items = document.createElement('div');
    items.className = 'nav-group-items';
    NAV_ITEMS.forEach((item, i)=>{
      if(item.group !== g.key) return;
      const el = document.createElement('div');
      el.className = 'nav-item' + (i===0 ? ' active' : '');
      el.id = 'nav-' + i;
      const lock = item.requiresPattern ? '<span class="nav-lock">🔒</span>' : '';
      el.innerHTML = `<span class="num">${i+1}</span>
        <span class="nav-txt"><b>${item.title}</b><small>${item.sub}</small></span>
        ${lock}
        <span class="check">已探索</span>`;
      el.addEventListener('click', ()=>gotoNav(i));
      items.appendChild(el);
    });
    grp.appendChild(items);
    list.appendChild(grp);
  });
}

function toggleNavGroup(key){
  const g = NAV_GROUPS.find(x=>x.key===key);
  if(!g) return;
  const willOpen = !g.open;
  // 手风琴：展开当前分组，其余分组全部收起
  NAV_GROUPS.forEach(gg=>{ gg.open = false; });
  if(willOpen) g.open = true;
  NAV_GROUPS.forEach(gg=>{
    const grp = document.getElementById('nav-group-' + gg.key);
    if(!grp) return;
    grp.classList.toggle('open', gg.open);
    const tog = grp.querySelector('.nav-toggle');
    if(tog) tog.textContent = gg.open ? '▾' : '▸';
  });
}

function setNavActive(idx){
  document.querySelectorAll('.nav-item').forEach((el,i)=>{
    el.classList.toggle('active', i===idx);
  });
}

function markVisited(idx){
  if(STATE.visited.has(idx)) return;
  STATE.visited.add(idx);
  const el = document.getElementById('nav-'+idx);
  if(el) el.classList.add('visited');
  updateExplore();
  if(STATE.visited.size === NAV_ITEMS.length){
    setTimeout(()=>showToast(`全部${NAV_ITEMS.length}个探索点打卡完成 · 纹样母体三载体全体验！`), 600);
    const cel = document.getElementById('confetti-btn'); if(cel) cel.classList.remove('hide'); // 顶端出现「完结撒花」
    setTimeout(()=>showJourney(true), 2600); // 全部达成 → 自动弹出总结升华
  }
  if(STATE.visited.size >= 6) unlockCode('era');
}

function updateExplore(){
  const n = STATE.visited.size, total = NAV_ITEMS.length;
  document.getElementById('explore-count').textContent = `${n}/${total}`;
  document.getElementById('explore-bar').style.width = (n/total*100) + '%';
}

function gotoNav(idx){
  if(STATE.switching) return;
  const item = NAV_ITEMS[idx];
  // 衍生条目（纹样转皮影/刺绣）需先选定剪纸纹样
  if(item.requiresPattern && STATE.flow.sel < 0){
    showModal({title:'请先选定纹样母体', sub:'一主两辅 · 纹样流转',
      body:`<p>「${item.title}」属于<span class="highlight">载体变体</span>功能，需先在<span class="highlight">纹样母体·新宾满族剪纸</span>选择一款民俗纹样。</p>
      <p>请先前往剪纸模块<span class="highlight">选取或刻绘</span>一款纹样，再体验皮影/刺绣的载体变体功能。</p>`});
    return;
  }
  // 自动展开目标分组
  if(item.group && !NAV_GROUPS.find(g=>g.key===item.group).open){
    toggleNavGroup(item.group);
  }
  setNavActive(idx);
  markVisited(idx);
  closePanelsOnMobile();
  if(STATE.currentScene !== item.scene){
    switchScene(item.scene, ()=>afterNav(item));
  } else {
    afterNav(item);
  }
}

// 按场景+热点ID查找可对焦的3D物件（镜头智能跟随）
function findFocusTarget(scene, hotspotId){
  const arr = scene === 'puppet' ? puppetObjects : scene === 'paper' ? paperObjects : embObjects;
  return arr.find(o => o.userData && o.userData.type === 'hotspot' && o.userData.data && o.userData.data.id === hotspotId) ||
         arr.find(o => o.userData && o.userData.data && o.userData.data.id === hotspotId) || null;
}

function afterNav(item){
  if(item.type === 'overview'){
    resetView();
    showKnowledge(SCENE_DATA[item.scene].intro, false);
    setOverlay(SCENE_DATA[item.scene].name, SCENE_DATA[item.scene].tagline);
  } else if(item.type === 'derivative'){
    // 衍生条目：用当前剪纸纹样映射到载体并触发演绎/织造
    const pat = STATE.flow.sel;
    showKnowledge({title:item.title, sub:'复用剪纸纹样 · 载体变体',
      body:`<p>已将剪纸母体纹样「<span class="highlight">${FLOW_NAMES[pat]}</span>」映射到此载体。</p>
      <p>剪纸是纹样<span class="highlight">母体</span>，${item.scene==='puppet'?'皮影':'刺绣'}是同源纹样的<span class="highlight">${item.scene==='puppet'?'皮料':'织物'}载体变体</span>——同一纹样在不同材质上演化出不同工艺形态。</p>`});
    setOverlay(item.title, item.sub);
    if(item.scene === 'puppet'){
      applyCostume(pat);
      STATE.flow.puppet[pat] = true;
      const p = puppetObjects.find(o=>o.userData.type === 'puppet');
      if(p && p.userData.animState !== 'perform'){
        p.userData.animState = 'perform';
        p.userData.costumePulse = 1;
        activateStoryPanel(p.userData.role);
      }
      checkFlowComplete(pat);
    } else {
      applyEmbroidery(pat);
      STATE.flow.emb[pat] = true;
      const tgt = embObjects.find(o=>o.userData.kind === 'totem') ||
                  embObjects.find(o=>o.userData.type === 'embroidery');
      if(tgt) playNeedleAnim(tgt);
      checkFlowComplete(pat);
    }
  } else {
    const data = SCENE_DATA[item.scene].hotspots.find(h=>h.id===item.hotspotId);
    showKnowledge(data);
    setOverlay(item.title, item.sub);
    const target = findFocusTarget(item.scene, item.hotspotId);
    if(target) focusOnObject(target);
  }
  showToast(`已定位「${item.title}」`);
}

// ===== 镜头智能跟随（对焦 + 自动回位） =====
const focusTween = {active:false, t:0, fromCam:null, toCam:null, fromTarget:null, toTarget:null};

function startTween(camPos, target){
  focusTween.active = true;
  focusTween.t = 0;
  focusTween.fromCam = camera.position.clone();
  focusTween.toCam = camPos;
  focusTween.fromTarget = controls.target.clone();
  focusTween.toTarget = target;
  controls.enabled = false;
}

function focusOnObject(obj){
  if(STATE.isRoaming) toggleRoam();
  const target = new THREE.Vector3();
  obj.getWorldPosition(target);
  const dir = camera.position.clone().sub(controls.target).normalize();
  const camPos = target.clone().add(dir.multiplyScalar(7));
  camPos.y = Math.max(camPos.y, target.y + 1.5);
  // 记录对焦前镜头（用于看完自动回位）
  STATE.camReturn = {pos:camera.position.clone(), target:controls.target.clone()};
  STATE.userOrbited = false;
  STATE.focusReturnAt = null;
  startTween(camPos, target);
  // 智能镜头叙事：按展品类型匹配专属电影运镜
  if(LAB.cinema){
    const st = STATE.currentScene === 'puppet' ? 'dolly' : STATE.currentScene === 'paper' ? 'orbit' : 'macro';
    STATE.cinema = {style:st, t:0, pos:camPos.clone(), tgt:target.clone()};
  } else STATE.cinema = null;
  setMode('镜头对焦');
}

// ===== 场景覆盖标题 =====
function setOverlay(title, sub){
  const o = document.getElementById('scene-overlay');
  document.getElementById('overlay-title').textContent = title;
  document.getElementById('overlay-sub').textContent = sub;
  o.classList.remove('switching');
  void o.offsetWidth;
  o.classList.add('switching');
}

// ===== 右侧知识讲解 =====
function showKnowledge(data, flash=true){
  if(!data) return;
  stopNarration(); // 切换知识时停止旧语音讲解
  document.getElementById('k-title').textContent = data.title;
  document.getElementById('k-sub').textContent = data.sub;
  document.getElementById('k-body').innerHTML = data.body;
  if(flash){
    const card = document.getElementById('knowledge-card');
    card.classList.remove('flash');
    void card.offsetWidth;
    card.classList.add('flash');
  }
}

function showKnowledgeById(scene, id){
  const data = SCENE_DATA[scene].hotspots.find(h=>h.id===id);
  if(data) showKnowledge(data);
}

// ===== 语音讲解（优先播放对应录音，无录音则用浏览器 TTS 兜底） =====
let narrationActive = false;
let narrationMode = null;   // 'tts' | 'audio'
let currentAudio = null;
// 各板块对应的录音文件（音频/mp3 目录，均已在末尾裁剪约 2.5 秒）
const VOICE_AUDIO = {
  '抚顺新宾满族剪纸':'音频/mp3/jimeng-2026-09-12-9252.mp3',
  '满族窗花艺术':'音频/mp3/jimeng-2026-09-12-7736.mp3',
  '萨满纹样剪纸':'音频/mp3/jimeng-2026-09-12-5497.mp3',
  '年俗剪纸文化':'音频/mp3/jimeng-2026-09-12-3481.mp3',
  '鞍山岫岩皮影戏':['音频/mp3/jimeng-2026-09-12-4101.mp3','音频/mp3/jimeng-2026-09-12-4764.mp3'],
  '岫岩皮影历史':'音频/mp3/jimeng-2026-09-12-4176.mp3',
  '皮影雕刻工艺':'音频/mp3/jimeng-2026-09-12-4533.mp3',
  '辽南影调唱腔':'音频/mp3/jimeng-2026-09-12-2185.mp3',
  '辽阳满族刺绣':'音频/mp3/jimeng-2026-09-12-1548.mp3',
  '满族枕头顶刺绣':'音频/mp3/jimeng-2026-09-12-3252.mp3',
  '荷包民俗绣品':'音频/mp3/jimeng-2026-09-12-2296.mp3',
};
function playAudioSequence(srcs){
  narrationMode = 'audio';
  narrationActive = true;
  setNarrationUI(true);
  let i = 0;
  const next = () => {
    if(!narrationActive) return;
    if(i >= srcs.length){
      narrationActive = false; narrationMode = null; currentAudio = null;
      setNarrationUI(false);
      return;
    }
    const a = new Audio(srcs[i++]);
    currentAudio = a;
    a.onended = next;
    a.onerror = () => { if(narrationActive) stopNarration(); };
    a.play().catch(()=>{ stopNarration(); });
  };
  next();
}
function getChineseVoice(){
  if(!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  return voices.find(v=>/zh|cmn|Chinese/i.test(v.lang) || /zh/i.test(v.name)) || null;
}
function narrationText(){
  const title = (document.getElementById('k-title').textContent || '').trim();
  const body = (document.getElementById('k-body').innerText || '').replace(/\n+/g,' ').trim();
  if(!body) return '';
  return (title === '非遗档案' ? '' : title + '。') + body;
}
function setNarrationUI(on){
  const btn = document.getElementById('k-audio-btn');
  if(btn) btn.classList.toggle('speaking', on);
  const body = document.getElementById('k-body');
  if(body) body.classList.toggle('speaking', on);
}
function stopNarration(){
  if(currentAudio){ try{ currentAudio.pause(); }catch(e){} currentAudio = null; }
  if('speechSynthesis' in window) window.speechSynthesis.cancel();
  narrationMode = null;
  narrationActive = false;
  setNarrationUI(false);
}
function toggleNarration(){
  if(narrationActive){ stopNarration(); return; }
  const title = (document.getElementById('k-title').textContent || '').trim();
  const audioSrcs = VOICE_AUDIO[title];
  if(audioSrcs){
    playAudioSequence(Array.isArray(audioSrcs) ? audioSrcs : [audioSrcs]);
    return;
  }
  if(!('speechSynthesis' in window)){
    alert('当前浏览器不支持语音合成');
    return;
  }
  const text = narrationText();
  if(!text){ alert('暂无知识讲解内容'); return; }
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'zh-CN';
  utter.rate = 0.95;
  const v = getChineseVoice();
  if(v) utter.voice = v;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
  narrationMode = 'tts';
  narrationActive = true;
  setNarrationUI(true);
}
// 自动检测 TTS 朗读结束，复位按钮态（录音模式由播放结束事件自复位）
if('speechSynthesis' in window){
  setInterval(()=>{
    if(!narrationActive || narrationMode === 'audio') return;
    if(window.speechSynthesis.speaking || window.speechSynthesis.pending) return;
    narrationActive = false; narrationMode = null;
    setNarrationUI(false);
  }, 500);
}

// ===== 板块视频介绍（随展厅切换对应视频，按钮弹出） =====
const GROUP_VIDEOS = {paper:'videos/jianzhi.mp4', puppet:'videos/piying.mp4', emb:'videos/cixiu.mp4'};
const GROUP_VIDEO_NAMES = {paper:'新宾满族剪纸 · 视频介绍', puppet:'岫岩皮影 · 视频介绍', emb:'辽阳满族刺绣 · 视频介绍'};
function loadGroupVideo(group){
  const video = document.getElementById('group-video');
  if(!video) return;
  const name = GROUP_VIDEO_NAMES[group] || '板块视频介绍';
  const sub = document.getElementById('video-pop-sub');
  if(sub) sub.textContent = name;
  const src = GROUP_VIDEOS[group];
  let source;
  if(video.querySelector('source')) source = video.querySelector('source');
  else { source = document.createElement('source'); source.type='video/mp4'; video.appendChild(source); }
  if(src && source.src !== new URL(src, location.href).href){ source.src = src; video.load(); }
}
function openGroupVideo(){
  const group = STATE.currentScene || 'paper';
  loadGroupVideo(group);
  const overlay = document.getElementById('video-overlay');
  if(overlay) overlay.classList.add('show');
}
function closeGroupVideo(){
  const overlay = document.getElementById('video-overlay');
  if(overlay) overlay.classList.remove('show');
  const video = document.getElementById('group-video');
  if(video){ video.pause(); }
}

// ===== 动画循环 =====
let fpsFrames = 0, fpsTime = 0;

function animate(){
  requestAnimationFrame(animate);
  const delta = STATE.clock.getDelta();
  const elapsed = STATE.clock.getElapsedTime();

  // FPS
  fpsFrames++; fpsTime += delta;
  if(fpsTime >= 0.5){
    document.getElementById('status-fps').textContent = Math.round(fpsFrames / fpsTime);
    fpsFrames = 0; fpsTime = 0;
  }

  // 节奏脉冲衰减
  STATE.beat = Math.max(0, STATE.beat - delta * 3);
  const b = STATE.beat;

  // 镜头对焦动画
  if(focusTween.active){
    focusTween.t += delta / 1.1;
    const k = focusTween.t >= 1 ? 1 : 1 - Math.pow(1 - focusTween.t, 3);
    camera.position.lerpVectors(focusTween.fromCam, focusTween.toCam, k);
    controls.target.lerpVectors(focusTween.fromTarget, focusTween.toTarget, k);
    if(focusTween.t >= 1){
      focusTween.active = false;
      controls.enabled = true;
      setMode(STATE.isRoaming ? '自动漫游' : '可旋转');
      // 看完 6 秒自动回位（专业展厅导览式运镜）
      if(STATE.camReturn && !STATE.userOrbited){
        STATE.focusReturnAt = elapsed + 6;
      }
    }
  } else if(STATE.focusReturnAt !== null){
    if(STATE.userOrbited){
      STATE.focusReturnAt = null;
    } else if(elapsed > STATE.focusReturnAt){
      const r = STATE.camReturn;
      STATE.focusReturnAt = null;
      startTween(r.pos, r.target);
      showToast('镜头已自动回位');
    }
  }

  if(STATE.isRoaming && !STATE.roamPaused){   // 用户拖动期间暂停漫游，避免运镜抵消拖拽
    STATE.roamAngle += delta * 0.15;
    const targetX = Math.sin(STATE.roamAngle) * STATE.roamRadius;
    const targetZ = Math.cos(STATE.roamAngle) * STATE.roamRadius;
    camera.position.x += (targetX - camera.position.x) * 0.02;
    camera.position.z += (targetZ - camera.position.z) * 0.02;
    camera.position.y = STATE.roamHeight + Math.sin(elapsed*0.3)*1;
    controls.target.set(0, 3.5, 0);
  }

  controls.update();

  // ===== 混合交互：3D 双面枕顶 + CSS 翻面卡联动 =====
  updateDoublePillow(delta, elapsed);

  // ===== 皮影：AI拟人 + 表演 + 换装脉冲 =====
  puppetObjects.forEach(o=>{
    const u = o.userData;
    if(u.type !== 'puppet') return;

    if(u.animState === 'perform'){
      o.position.y = u.baseY + Math.sin(elapsed*3)*0.3;
      o.position.x = u.baseX + Math.sin(elapsed*1.5)*0.5;
      o.rotation.z = Math.sin(elapsed*4)*0.1;
      o.scale.set(1 + Math.sin(elapsed*2)*0.05, 1, 1);
      o.rotation.y *= 0.9;
    } else {
      // AI拟人：鼠标靠近 → 侧身避让 + 头部跟随；静止3秒 → 待机小动作
      const v = o.position.clone(); v.project(camera);
      const dx = mouse.x - v.x, dy = mouse.y - v.y;
      const near = Math.abs(dx) < 0.3 && Math.abs(dy) < 0.42;
      const idle = (elapsed - STATE.lastInteract) > 3;
      let trY = 0, trZ = 0, tox = u.baseX, toy = u.baseY;
      if(near && !idle){
        trY = (dx > 0 ? -0.45 : 0.45);
        tox = u.baseX + (dx > 0 ? -0.35 : 0.35);
        toy = u.baseY + Math.max(-0.15, Math.min(0.15, -dy*0.3));
        trZ = dx * 0.06;
      } else if(idle){
        const it = elapsed*0.9 + u.phase0;
        trY = Math.sin(it)*0.08;
        trZ = Math.sin(it*1.7)*0.05;
        toy = u.baseY + Math.max(0, Math.sin(it*0.6))*0.06;
      }
      o.rotation.y += (trY - o.rotation.y)*0.06;
      o.rotation.z += (trZ - o.rotation.z)*0.06;
      o.position.x += (tox - o.position.x)*0.06;
      o.position.y += (toy - o.position.y)*0.06;
      // 换装脉冲（鎏金颤动）
      if(u.costumePulse > 0) u.costumePulse = Math.max(0, u.costumePulse - delta*2.2);
      const ps = 1 + u.costumePulse*0.1;
      o.scale.set(ps, ps, 1);
      // 苏醒透光度
      const top = u.animState === 'idle' ? 0.85 : 0.98;
      o.material.opacity += (top - o.material.opacity)*0.1;
      if(u.glow) u.glow.material.opacity = 0.18 + b*0.12 + (u.animState==='awake'?0.15:0);
    }
    // 幕布投影随动（形变/虚化/节奏）
    if(u.shadow){
      const sh = u.shadow;
      sh.position.x = o.position.x*1.25 + Math.sin(elapsed*1.2 + u.phase0)*0.04;
      sh.position.y = o.position.y + 0.1;
      sh.scale.set(1.1 + b*0.08, 1.12 + b*0.08, 1);
      sh.material.opacity = 0.22 + b*0.18 + (u.animState !== 'idle' ? 0.06 : 0);
      sh.rotation.z = o.rotation.z*0.5;
    }
    if(u.type === 'puppet' && o.userData.animState !== undefined){}
  });

  // ===== 皮影开演专属特效：篝火光晕 + 火星粒子 + 镂空透彩光 =====
  updateStagePerformFx(delta, elapsed);
  // 投递展品悬浮呼吸
  updateDeliveredFx(elapsed);

  // 热点呼吸
  puppetObjects.forEach(obj=>{
    if(obj.userData.type === 'hotspot'){
      obj.lookAt(camera.position);
      const s = 1 + Math.sin(elapsed*3)*0.15;
      obj.scale.set(s,s,s);
    }
  });

  // ===== 剪纸：呼吸/展开/鎏金 =====
  paperObjects.forEach(obj=>{
    const u = obj.userData;
    if(u.type === 'papercut'){
      if(u.hovered){
        u.targetScale = 1.12 + Math.sin(elapsed*3 + u.phase)*0.03;  // 呼吸微动
        u.targetRotY = 0.2;
        obj.rotation.z = Math.sin(elapsed*2 + u.phase)*0.03;
      } else {
        u.targetScale = u.unfolded ? 1.28 : 1;
        u.targetRotY = u.unfolded ? Math.sin(elapsed + u.phase)*0.1 : 0;
        obj.rotation.z *= 0.9;
      }
      obj.scale.x += (u.targetScale - obj.scale.x)*0.08;
      obj.scale.y += (u.targetScale - obj.scale.y)*0.08;
      obj.rotation.y += (u.targetRotY - obj.rotation.y)*0.08;
      if(u.unfolded) obj.rotation.x = Math.sin(elapsed*0.5 + u.phase)*0.05;
      obj.children.forEach(child=>{
        if(child.material && child.material.emissive){
          child.material.emissiveIntensity = u.hovered ? 0.4 : (u.unfolded ? 0.18 : 0.08);
        }
      });
    }
    if(u.type === 'centerpaper' && u.rotating){
      obj.rotation.y += delta * 0.5;
    }
    if(u.type === 'hangpaper'){
      obj.position.y = u.baseY + Math.sin(elapsed*1.5 + u.phase)*0.3;
      obj.rotation.z = Math.sin(elapsed*2 + u.phase)*0.1;
      obj.rotation.y = Math.sin(elapsed*1 + u.phase)*0.15;
    }
    if(u.type === 'storypanel' && obj.visible){
      // 弹性弹出（物理回弹）
      u.sv += (1 - obj.scale.x)*0.14;
      u.sv *= 0.78;
      obj.scale.x += u.sv;
      obj.scale.y += u.sv;
      if(Math.abs(obj.scale.x-1) < 0.002 && Math.abs(u.sv) < 0.002){ obj.scale.set(1,1,1); u.sv=0; }
    }
  });

  // ===== 刺绣：呼吸/抬起/褶皱/图腾慢转/弹性弹出 =====
  embObjects.forEach(obj=>{
    const u = obj.userData;
    if(u.type === 'embroidery'){
      let ts = u.hovered ? 1.1 : (u.stage > 0 ? 1.14 : 1);
      if(u.pulse > 0){ u.pulse = Math.max(0, u.pulse - delta*2.2); ts += u.pulse*0.08; }
      obj.scale.x += (ts - obj.scale.x)*0.08;
      obj.scale.y += (ts - obj.scale.y)*0.08;
      obj.position.y += ((u.baseY + (u.stage>0 ? 0.32 : 0)) - obj.position.y)*0.07;
      if(u.stage > 0){
        // 布料褶皱起伏
        obj.rotation.x = Math.sin(elapsed*2.2 + u.phase)*0.05;
        obj.rotation.z = Math.sin(elapsed*2.8 + u.phase)*0.03;
      } else {
        obj.rotation.x *= 0.92;
        obj.rotation.z *= 0.92;
      }
      if(u.rotating && !u.hovered) obj.rotation.y += delta*0.4;
      if(u.mesh) u.mesh.material.emissiveIntensity = u.hovered ? 0.4 : (u.stage>0 ? 0.22 : 0.1);
    }
    if(u.type === 'embstory' && obj.visible){
      // 弹性弹出（物理回弹）
      u.sv += (1 - obj.scale.x)*0.14;
      u.sv *= 0.78;
      obj.scale.x += u.sv;
      obj.scale.y += u.sv;
      if(Math.abs(obj.scale.x-1) < 0.002 && Math.abs(u.sv) < 0.002){ obj.scale.set(1,1,1); u.sv=0; }
    }
    if(u.type === 'hotspot' || u.type === 'embneedle'){
      obj.lookAt(camera.position);
      const s = 1 + Math.sin(elapsed*3 + (u.phase0||0))*0.15;
      obj.scale.set(s,s,s);
    }
  });

  // ===== 鎏金流光扫过 =====
  if(sheenTex) sheenTex.offset.x = (elapsed*0.09) % 1;
  STATE.sheenMeshes.forEach(s=>{
    const target = s.obj.userData.hovered ? 0.85 : s.base;
    s.mesh.material.opacity += (target - s.mesh.material.opacity)*0.15;
  });

  // ===== 金粒剥离粒子 =====
  for(let i=STATE.bursts.length-1;i>=0;i--){
    const bu = STATE.bursts[i];
    bu.life -= delta*(bu.decay!==undefined?bu.decay:1.4);
    if(bu.life <= 0){
      scene.remove(bu.points);
      bu.points.geometry.dispose();
      bu.points.material.dispose();
      STATE.bursts.splice(i,1);
      continue;
    }
    const arr = bu.points.geometry.attributes.position.array;
    bu.vels.forEach((v,j)=>{
      arr[j*3]   += v.x*delta;
      arr[j*3+1] += v.y*delta;
      arr[j*3+2] += v.z*delta;
      v.y -= delta*(bu.grav!==undefined?bu.grav:0.8);
    });
    bu.points.geometry.attributes.position.needsUpdate = true;
    bu.points.material.opacity = bu.life;
  }

  // ===== 音画同步：灯光/幕布随节奏 =====
  if(STATE.fx.spot){
    const t = elapsed;
    STATE.fx.spot.intensity = 2.5 + b*1.6;
    STATE.fx.warm.intensity = 0.6 + b*0.5 + Math.sin(t*7)*0.05;
    STATE.fx.lanternMat.emissiveIntensity = 0.6 + b*1.0;
    STATE.fx.lanternLights.forEach((l,i)=>{ l.intensity = 0.8 + b*1.3 + Math.sin(t*3+i)*0.08; });
    STATE.fx.screen.rotation.z = Math.sin(t*26)*0.004*b;
    STATE.fx.screen.scale.y = 1 + b*0.012 + Math.sin(t*1.3)*0.003;
    STATE.fx.curtainL.rotation.y = 0.2 + b*Math.sin(t*22)*0.03;
    STATE.fx.curtainR.rotation.y = -0.2 - b*Math.sin(t*20+1)*0.03;
  }

  // ===== 分层雾效漂移 =====
  STATE.fogMats.forEach((m,i)=>{
    if(m.map) m.map.offset.x += delta*0.01*(i%2 ? 1 : -1);
  });

  // ===== 季节粒子（皮影：金色星光 / 剪纸：红色雪花+福字） =====
  if(particleSystem && particleSystem.visible){
    const arr = particleSystem.geometry.attributes.position.array;
    const speed = 1 + b*1.8;  // 粒子速度随唱腔节奏
    for(let i=0;i<arr.length;i+=3){
      arr[i+1] -= (0.02 + (i%5)*0.004) * speed;
      arr[i] += Math.sin(elapsed + i)*0.01;
      if(arr[i+1] < 0){ arr[i+1] = 15; arr[i]=(Math.random()-0.5)*40; arr[i+2]=(Math.random()-0.5)*30; }
    }
    particleSystem.geometry.attributes.position.needsUpdate = true;
    particleSystem.rotation.y = elapsed * 0.02;
  }
  if(paperParticles && paperParticles.visible){
    const arr = snowSystem.geometry.attributes.position.array;
    for(let i=0;i<arr.length;i+=3){
      arr[i+1] -= 0.012 + (i%7)*0.002;
      arr[i] += Math.sin(elapsed*1.2 + i)*0.008;   // 雪花飘摆
      if(arr[i+1] < 0){ arr[i+1] = 14; arr[i]=(Math.random()-0.5)*38; arr[i+2]=(Math.random()-0.5)*28; }
    }
    snowSystem.geometry.attributes.position.needsUpdate = true;
    snowSystem.rotation.y = Math.sin(elapsed*0.15)*0.05;
    const arr2 = fuSystem.geometry.attributes.position.array;
    for(let i=0;i<arr2.length;i+=3){
      arr2[i+1] -= 0.02;
      arr2[i] += Math.sin(elapsed*0.8 + i)*0.012;
      if(arr2[i+1] < 0){ arr2[i+1] = 13; arr2[i]=(Math.random()-0.5)*34; arr2[i+2]=(Math.random()-0.5)*24; }
    }
    fuSystem.geometry.attributes.position.needsUpdate = true;
    fuSystem.rotation.y = elapsed * 0.03;
  }

  // ===== 丝线粒子（刺绣展厅氛围） =====
  if(threadSystem && threadSystem.visible){
    const arr = threadSystem.geometry.attributes.position.array;
    for(let i=0;i<arr.length;i+=3){
      arr[i+1] += 0.006 + (i%5)*0.0012;            // 缓缓上浮
      arr[i]   += Math.sin(elapsed*1.4 + i)*0.006; // 丝线摆动
      if(arr[i+1] > 13){ arr[i+1] = 0.2; arr[i]=(Math.random()-0.5)*36; arr[i+2]=(Math.random()-0.5)*26; }
    }
    threadSystem.geometry.attributes.position.needsUpdate = true;
    threadSystem.rotation.y = elapsed*0.015;
  }

  // ===== 虚拟走针（金针轨迹 + 丝线流光尾迹） =====
  for(let i=STATE.needles.length-1;i>=0;i--){
    const n = STATE.needles[i];
    n.t += delta;
    if(n.t > n.dur + 1){
      scene.remove(n.sprite); scene.remove(n.line);
      n.sprite.material.dispose(); n.line.geometry.dispose(); n.line.material.dispose();
      STATE.needles.splice(i,1);
      continue;
    }
    if(n.t <= n.dur){
      const a = n.t*2.4;
      const v = new THREE.Vector3(Math.cos(a)*n.R1, Math.sin(a)*n.R2, 0.22);
      n.exhibit.localToWorld(v);
      if(n.count < n.MAX){
        n.pos.set([v.x,v.y,v.z], n.count*3);
        n.count++;
      } else {
        n.pos.copyWithin(0,3);
        n.pos.set([v.x,v.y,v.z], (n.MAX-1)*3);
      }
      n.line.geometry.setDrawRange(0, n.count);
      n.line.geometry.attributes.position.needsUpdate = true;
      n.sprite.position.copy(v);
      n.acc += delta;
      if(n.acc > 0.18){ n.acc = 0; spawnThreadBurst(v, 2, true); }
    } else {
      const fade = Math.max(0, 1-(n.t-n.dur));
      n.sprite.material.opacity = fade;
      n.line.material.opacity = fade*0.95;
    }
  }

  renderer.render(scene, camera);
}

// ===== 场景切换（灯影开窗 · 三幕式转场） =====
// 转场磬音：E6+B6 正弦泛音，清脆一击（WebAudio 惰性合成，零素材）
let _chimeCtx = null;
function playChime(){
  try{
    if(!_chimeCtx) _chimeCtx = new (window.AudioContext||window.webkitAudioContext)();
    if(_chimeCtx.state === 'suspended') _chimeCtx.resume();
    const t = _chimeCtx.currentTime;
    [[1318.5,.09],[880,.05],[1975.5,.035]].forEach(([f,v],i)=>{
      const o = _chimeCtx.createOscillator(), g = _chimeCtx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t+0.015+i*0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t+0.9);
      o.connect(g); g.connect(_chimeCtx.destination);
      o.start(t); o.stop(t+1);
    });
  }catch(e){}
}

function motifThumbURL(name, c1, c2){
  try{
    const m = MOTIFS.find(k => k.n === name);
    if(!m) return '';
    const S = 64;
    const cv = document.createElement('canvas');
    cv.width = S*3; cv.height = S*3;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    m.draw(ctx, S*1.5, S*1.5, S*0.9, c1, c2);
    return cv.toDataURL('image/png');
  }catch(e){ return ''; }
}

function switchScene(name, cb){
  if(STATE.switching) return;
  if(STATE.currentScene === name){ if(cb) cb(); return; }
  STATE.switching = true;
  const gv = document.getElementById('group-video');
  if(gv && !gv.paused) gv.pause(); // 切换展厅时暂停当前视频
  const mask = document.getElementById('transition-mask');
  const maskText = document.getElementById('mask-text');
  const maskSub = document.getElementById('mask-sub');
  const data = SCENE_DATA[name];
  // 展区名逐字拆分 → 第二幕逐字浮现
  maskText.innerHTML = data.name.split('').map((ch,i)=>`<span style="transition-delay:${i*90}ms">${ch}</span>`).join('');
  if(maskSub) maskSub.textContent = data.tagline || data.sub || '';
  // 中央例证：随展区切换展示2-3个代表性纹样（图+文）
  const maskSamples = document.getElementById('mask-samples');
  if(maskSamples){
    const samples = {
      paper: {list:['团花','萨满','连年有余'], cols:['#C41E3A','#E8B64C']},
      puppet:{list:['团花','萨满','福字'],     cols:['#B97A3F','#F0C080']},
      emb:   {list:['福字','连年有余','萨满'], cols:['#8A1E34','#E8B64C']}
    };
    const cfg = samples[name] || {list:[], cols:['#C41E3A','#E8B64C']};
    // 例证布局与动画交由场景类(scene-paper/puppet/emb)控制，每个场景各不相同
    maskSamples.innerHTML = (cfg.list||[]).map((s, i)=>{
      const url = motifThumbURL(s, cfg.cols[0], cfg.cols[1]);
      return `<span class="ms-chip" style="transition-delay:${30+i*130}ms">
        <span class="ms-thumb"><img src="${url}" alt="${s}"></span>${s}</span>`;
    }).join('');
  }
  mask.classList.remove('open','reveal');
  // 按目标展区切换材质：红纸/驴皮/缎料
  mask.classList.remove('scene-paper','scene-puppet','scene-emb');
  mask.classList.add(name === 'paper' ? 'scene-paper' : name === 'puppet' ? 'scene-puppet' : 'scene-emb');
  // 第一幕：画面沉入暗幕（载体合拢感）
  document.getElementById('canvas-container').classList.add('dimming');
  playChime();
  void mask.offsetWidth; // 强制重排，确保三幕动画每次从零开始
  mask.classList.add('active');
  STATE.isRoaming = false;
  document.getElementById('btn-roam').classList.remove('active');

  setTimeout(()=>mask.classList.add('reveal'), 600); // 第二幕 · 揭名
  setTimeout(()=>{
    STATE.currentScene = name;
    loadGroupVideo(name); // 展区切换后预载对应板块视频
    if(STATE.journey && STATE.journey.scenes) STATE.journey.scenes.add(name);
    bgmSwitchScene(name); // 背景音乐无缝换曲
    puppetSceneGroup.visible = (name === 'puppet');
    paperSceneGroup.visible = (name === 'paper');
    embSceneGroup.visible = (name === 'emb');
    toggleFlipPanel(name); // 混合交互：双面枕顶翻面卡随展厅显隐
    applyParticleTheme(name);
    document.getElementById('status-scene').textContent = data.name;
    setOverlay(data.name, data.tagline || data.sub || ''); // 场景切换时同步顶部标题浮层
    resetView();
    setTimeout(()=>{
      mask.classList.remove('reveal');
      mask.classList.add('open'); // 第三幕 · 载体展开
      document.getElementById('canvas-container').classList.remove('dimming');
      setTimeout(()=>{
        mask.classList.remove('active','open');
        STATE.switching = false;
        if(cb) cb();
      }, 460);
    }, 760);
  }, 1000);
}

// 三展区自由轮切（皮影 → 剪纸 → 刺绣 → 皮影）
function toggleScene(){
  const order = ['paper','puppet','emb'];
  const next = order[(order.indexOf(STATE.currentScene)+1) % 3];
  gotoScene(next);
}

// 直达指定展区（底部「刺绣展厅」按钮 / 联动跳转）
function gotoScene(name){
  switchScene(name, ()=>{
    showToast(`已切换至「${SCENE_DATA[name].name}」`);
    const idx = NAV_ITEMS.findIndex(n=>n.scene===name && n.type==='overview');
    gotoNav(idx);
  });
}

// ===== 自动漫游 =====
function toggleRoam(){
  STATE.isRoaming = !STATE.isRoaming;
  const btn = document.getElementById('btn-roam');
  btn.classList.toggle('active', STATE.isRoaming);
  setMode(STATE.isRoaming ? '自动漫游' : '可旋转');
  STATE.focusReturnAt = null;
  if(STATE.isRoaming){
    STATE.roamAngle = Math.atan2(camera.position.x, camera.position.z);
    showToast('自动漫游已开启');
  } else {
    showToast('自动漫游已暂停');
  }
}

// ===== 重置视角 =====
function resetView(){
  focusTween.active = false;
  controls.enabled = true;
  STATE.focusReturnAt = null;
  camera.position.set(0, 8, 20);
  controls.target.set(0, 3.5, 0);
  controls.update();
  setMode(STATE.isRoaming ? '自动漫游' : '可旋转');
}

function setMode(text){
  document.getElementById('status-mode').textContent = text;
}

// ===== 移动端面板开关 =====
function togglePanel(side){
  const panel = document.getElementById(side === 'left' ? 'left-panel' : 'right-panel');
  if(panel) panel.classList.toggle('open');
}

function closePanelsOnMobile(){
  if(window.innerWidth <= 960){
    document.getElementById('left-panel').classList.remove('open');
    document.getElementById('right-panel').classList.remove('open');
  }
}

// ===== 背景音乐引擎（谱写式五声 motifs · 暖Pad+古筝拨弦+反馈延迟混响 · 三展区变奏） =====
const BGM = {
  ctx:null, master:null, reverb:null, reverbGain:null,
  padOscs:[], timers:[], playing:false, currentScene:null,
  // 三展区：各有一段谱写的五声旋律 motifs（音阶索引序列，-1=休止）
  // 0=宫 1=商 2=角 3=徵 4=羽 5=宫(高八度) 6=商(高) 7=角(高)
  scenes:{
    puppet:{ // 皮影 · G徵调 · 辽南影韵（略带戏剧感但内敛）
      scale:[196.00,220.00,246.94,293.66,329.63,392.00,440.00,493.88],
      drone:[98.00, 147.00],            // 双音嗡鸣 G+D
      // 谱写旋律（4句对答式 motifs，每句8拍）
      motifA:[4,2,3,4, 5,4,3,-1, 2,3,4,2, 0,-1,-1,-1],
      motifB:[3,4,5,4, 3,2,3,-1, 4,5,6,5, 4,3,2,-1],
      pad:[0,3],                        // 持续和弦音
      tempo:640, vol:0.14,
    },
    paper:{ // 剪纸 · A羽调 · 轻灵明快（竹笛古筝交融）
      scale:[220.00,246.94,293.66,329.63,392.00,440.00,493.88,587.33],
      drone:[110.00, 164.81],
      motifA:[5,4,5,6, 7,5,4,-1, 3,4,5,4, 3,2,-1,-1],
      motifB:[4,3,2,3, 4,5,4,-1, 5,6,5,4, 3,2,3,-1],
      pad:[0,4],
      tempo:520, vol:0.12,
    },
    emb:{ // 刺绣 · C宫调 · 深沉冥想（古琴意境）
      scale:[130.81,146.83,164.81,196.00,220.00,261.63,293.66,329.63],
      drone:[65.41, 98.00],
      motifA:[2,-1,3,-1, 4,-1,3,2, -1,0,-1,-1, 2,3,4,-1],
      motifB:[4,-1,5,-1, 4,3,2,-1, 3,4,5,-1, 4,3,2,-1],
      pad:[0,2],
      tempo:880, vol:0.13,
    },
  },
};
// 反馈延迟混响（营造厅堂空间感，零外部素材）
function buildReverb(ctx){
  const input = ctx.createGain(); input.gain.value = 1;
  const delay = ctx.createDelay(1.0); delay.delayTime.value = 0.28;
  const feedback = ctx.createGain(); feedback.gain.value = 0.42;
  const filter = ctx.createBiquadFilter(); filter.type='lowpass'; filter.frequency.value = 2200;
  const wet = ctx.createGain(); wet.gain.value = 0.30;
  input.connect(delay);
  delay.connect(filter);
  filter.connect(feedback);
  feedback.connect(delay);            // 反馈环
  filter.connect(wet);
  BGM.reverb = input;                 // input 是混响入口
  BGM.reverbGain = wet;               // wet 是混响出口
  return {input, wet};
}
// 古筝式拨弦单音（多泛音叠加 + 软包络）
function pluckNote(ctx, freq, time, dur, gain, dest){
  // 基音 + 2 次泛音（正弦波叠加，模拟拨弦泛音列）
  const partials = [
    {mul:1, vol:1.0, type:'sine'},
    {mul:2, vol:0.30, type:'sine'},
    {mul:3, vol:0.12, type:'sine'},
    {mul:4, vol:0.06, type:'sine'},
  ];
  partials.forEach(p=>{
    const o = ctx.createOscillator();
    o.type = p.type; o.frequency.value = freq * p.mul;
    // 轻微失谐增添暖意
    if(p.mul === 1) o.detune.value = (Math.random()-0.5)*3;
    const g = ctx.createGain();
    // 拨弦包络：极快起音 → 指数衰减 → 长尾释音
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(gain * p.vol, time + 0.008);
    g.gain.exponentialRampToValueAtTime(gain * p.vol * 0.3, time + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    o.connect(g);
    g.connect(dest);
    if(BGM.reverb) g.connect(BGM.reverb); // 送入混响
    o.start(time); o.stop(time + dur + 0.1);
  });
}
// 持续暖 Pad 层（双失谐正弦叠加 + 慢 LFO 呼吸）
function startPad(ctx, cfg, dest){
  cfg.pad.forEach((noteIdx, i)=>{
    const freq = cfg.scale[noteIdx] * 0.5; // 低八度
    [1.0, 1.005, 0.5].forEach((mul, k)=>{  // 基音+微失谐+低八度
      const o = ctx.createOscillator();
      o.type = 'sine'; o.frequency.value = freq * mul;
      const g = ctx.createGain();
      g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 3 + i*0.8); // 极慢淡入
      // 慢呼吸 LFO（模拟呼吸般的强弱起伏）
      const lfo = ctx.createOscillator();
      lfo.type = 'sine'; lfo.frequency.value = 0.08 + i*0.03;
      const lfoG = ctx.createGain(); lfoG.gain.value = 0.012;
      lfo.connect(lfoG); lfoG.connect(g.gain);
      o.connect(g); g.connect(dest);
      if(BGM.reverb) g.connect(BGM.reverb);
      o.start(ctx.currentTime);
      lfo.start(ctx.currentTime);
      BGM.padOscs.push(o, lfo);
    });
  });
}
// 钟磬泛音点缀（每隔数拍一记，清远空灵）
function bellTone(ctx, cfg, time, dest){
  const freq = cfg.scale[7] * 2; // 高音区
  const o = ctx.createOscillator();
  o.type = 'sine'; o.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(0.015, time + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 3.5);
  o.connect(g); g.connect(dest);
  if(BGM.reverb) g.connect(BGM.reverb);
  o.start(time); o.stop(time + 3.6);
  // 叠一个五度泛音
  const o2 = ctx.createOscillator();
  o2.type = 'sine'; o2.frequency.value = freq * 1.5;
  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0.0001, time);
  g2.gain.exponentialRampToValueAtTime(0.008, time + 0.06);
  g2.gain.exponentialRampToValueAtTime(0.0001, time + 3);
  o2.connect(g2); g2.connect(dest);
  if(BGM.reverb) g2.connect(BGM.reverb);
  o2.start(time); o2.stop(time + 3.1);
}
function startBGM(sceneName){
  const cfg = BGM.scenes[sceneName] || BGM.scenes.puppet;
  if(!BGM.ctx) BGM.ctx = new (window.AudioContext||window.webkitAudioContext)();
  if(BGM.ctx.state === 'suspended') BGM.ctx.resume();
  const ctx = BGM.ctx;
  // 主输出 + 混响
  if(!BGM.master){
    BGM.master = ctx.createGain();
    BGM.master.gain.value = 0;
    const rev = buildReverb(ctx);
    BGM.master.connect(ctx.destination);
    rev.wet.connect(BGM.master);
    // 频谱分析器（供声光联动使用）
    LAB.analyser = ctx.createAnalyser();
    LAB.analyser.fftSize = 128;
    LAB.analyser.smoothingTimeConstant = 0.8;
    LAB.freqData = new Uint8Array(LAB.analyser.frequencyBinCount);
    BGM.master.connect(LAB.analyser);
  }
  BGM.master.gain.setValueAtTime(BGM.master.gain.value, ctx.currentTime);
  BGM.master.gain.linearRampToValueAtTime(cfg.vol, ctx.currentTime + 3); // 整体缓入
  stopBGMLayers();
  BGM.currentScene = sceneName;
  BGM.padOscs = [];
  // 启动暖 Pad 层
  startPad(ctx, cfg, BGM.master);
  // 旋律播放器：交替演奏 motifA / motifB，每 4 小节加一记钟磬
  let phrase = 0, beat = 0;
  const beatDur = cfg.tempo / 1000;
  const playBeat = ()=>{
    if(!BGM.playing) return;
    const motif = (phrase % 2 === 0) ? cfg.motifA : cfg.motifB;
    const idx = motif[beat % motif.length];
    if(idx >= 0){
      const freq = cfg.scale[idx];
      // 古筝拨弦：音量随机微变增添人手感
      const vel = 0.06 + Math.random() * 0.03;
      pluckNote(ctx, freq, ctx.currentTime, beatDur * 1.8, vel, BGM.master);
    }
    // 每 16 拍换一句 motif
    if(beat > 0 && beat % 16 === 0) phrase++;
    // 每 8 拍一记钟磬点缀
    if(beat % 8 === 0) bellTone(ctx, cfg, ctx.currentTime, BGM.master);
    beat++;
  };
  BGM.timers.push(setInterval(playBeat, cfg.tempo));
  setTimeout(playBeat, 100);
  BGM.playing = true;
}
function stopBGMLayers(){
  BGM.timers.forEach(t=>clearInterval(t));
  BGM.timers = [];
  const ctx = BGM.ctx; if(!ctx) return;
  const t = ctx.currentTime + 0.3;
  BGM.padOscs.forEach(o=>{ try{ o.stop(t); }catch(e){} });
  BGM.padOscs = [];
}
function toggleBGM(){
  const btn = document.getElementById('btn-bgm');
  const label = document.getElementById('bgm-label');
  if(BGM.playing){
    if(BGM.master) BGM.master.gain.linearRampToValueAtTime(0.0001, BGM.ctx.currentTime + 0.8);
    setTimeout(()=>{ stopBGMLayers(); BGM.playing = false; }, 900);
    if(btn) btn.classList.remove('active');
    if(label) label.textContent = '背景音乐';
  } else {
    startBGM(STATE.currentScene || 'puppet');
    if(btn) btn.classList.add('active');
    if(label) label.textContent = '音乐播放中';
  }
}
function bgmSwitchScene(sceneName){
  if(!BGM.playing || BGM.currentScene === sceneName) return;
  const ctx = BGM.ctx; if(!ctx) return;
  // 三展区专属民乐 · 平滑淡入淡出（不硬切）
  BGM.master.gain.cancelScheduledValues(ctx.currentTime);
  BGM.master.gain.setValueAtTime(BGM.master.gain.value, ctx.currentTime);
  BGM.master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.75);
  stopBGMLayers();
  BGM.playing = false;
  setTimeout(()=>{ startBGM(sceneName); }, 800);
}

// ===== 拼窗花小游戏（拖拽拼装创作交互） =====
const PUZZLE = {inited:false, open:false, pieces:[], drag:null, off:{x:0,y:0},
  confetti:[], rings:[], raf:0, ctx:null, canvas:null, doneCount:0};
const PUZZLE_CX = 260, PUZZLE_CY = 235;

function openPuzzle(){
  document.getElementById('puzzle-overlay').classList.add('show');
  PUZZLE.open = true;
  PUZZLE.canvas = document.getElementById('puzzle-canvas');
  PUZZLE.ctx = PUZZLE.canvas.getContext('2d');
  if(!PUZZLE.inited){ initPuzzlePieces(); bindPuzzleEvents(); PUZZLE.inited = true; }
  resetPuzzle();
  cancelAnimationFrame(PUZZLE.raf);
  puzzleLoop();
}

function closePuzzle(){
  document.getElementById('puzzle-overlay').classList.remove('show');
  PUZZLE.open = false;
  cancelAnimationFrame(PUZZLE.raf);
}

function initPuzzlePieces(){
  const pieces = [{kind:'core', x:0, y:0, tx:PUZZLE_CX, ty:PUZZLE_CY, placed:false, rot:0}];
  for(let i=0;i<6;i++){
    const a = i*Math.PI/3 - Math.PI/2;
    pieces.push({kind:'petal', x:0, y:0, tx:PUZZLE_CX+Math.cos(a)*34, ty:PUZZLE_CY+Math.sin(a)*34,
      placed:false, rot:i*Math.PI/3});
  }
  PUZZLE.pieces = pieces;
}

function resetPuzzle(){
  PUZZLE.doneCount = 0;
  updatePuzzleCount();
  PUZZLE.confetti.length = 0;
  PUZZLE.rings.length = 0;
  PUZZLE.drag = null;
  PUZZLE.pieces.forEach(p=>{
    const ang = Math.random()*Math.PI*2;
    const rad = 150 + Math.random()*55;
    p.x = Math.min(455, Math.max(70, PUZZLE_CX + Math.cos(ang)*rad));
    p.y = Math.min(430, Math.max(115, PUZZLE_CY + Math.sin(ang)*rad*0.82));
    p.placed = false;
  });
}

function puzzleLoop(){
  if(!PUZZLE.open) return;
  drawPuzzle();
  PUZZLE.raf = requestAnimationFrame(puzzleLoop);
}

function drawPetalPath(ctx){
  ctx.beginPath();
  ctx.moveTo(0,-16);
  ctx.bezierCurveTo(26,-26,32,-70,0,-104);
  ctx.bezierCurveTo(-32,-70,-26,-26,0,-16);
  ctx.closePath();
}

function drawPuzzlePiece(p, ghost){
  const ctx = PUZZLE.ctx;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  if(p.kind === 'petal'){
    drawPetalPath(ctx);
    if(ghost){
      ctx.strokeStyle='rgba(212,168,67,.35)';
      ctx.setLineDash([6,5]); ctx.lineWidth=2; ctx.stroke();
    } else {
      const g = ctx.createLinearGradient(0,-104,0,0);
      g.addColorStop(0,'#E8455F'); g.addColorStop(1,'#A3152E');
      ctx.fillStyle=g; ctx.fill();
      ctx.strokeStyle='#D4A843'; ctx.lineWidth=3; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,-22); ctx.lineTo(0,-90);
      ctx.strokeStyle='rgba(240,214,138,.7)'; ctx.lineWidth=2; ctx.stroke();
      for(let s=-1;s<=1;s+=2){
        ctx.beginPath();
        ctx.moveTo(0,-38); ctx.lineTo(s*15,-52);
        ctx.moveTo(0,-56); ctx.lineTo(s*12,-68);
        ctx.stroke();
      }
      ctx.fillStyle='rgba(240,214,138,.9)';
      ctx.beginPath(); ctx.arc(0,-16,4,0,Math.PI*2); ctx.fill();
    }
  } else {
    ctx.beginPath(); ctx.arc(0,0,30,0,Math.PI*2);
    if(ghost){
      ctx.strokeStyle='rgba(212,168,67,.35)';
      ctx.setLineDash([6,5]); ctx.lineWidth=2; ctx.stroke();
    } else {
      const g = ctx.createRadialGradient(0,0,4,0,0,30);
      g.addColorStop(0,'#F0D68A'); g.addColorStop(0.55,'#C41E3A'); g.addColorStop(1,'#8B1428');
      ctx.fillStyle=g; ctx.fill();
      ctx.strokeStyle='#D4A843'; ctx.lineWidth=3; ctx.stroke();
      ctx.fillStyle='#F5E6C8';
      ctx.font='bold 26px "Noto Serif SC",serif';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('福', 0, 2);
    }
  }
  ctx.restore();
}

function drawPuzzle(){
  const ctx = PUZZLE.ctx, c = PUZZLE.canvas;
  ctx.clearRect(0,0,c.width,c.height);
  // 中心引导环
  ctx.strokeStyle='rgba(212,168,67,.15)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.arc(PUZZLE_CX, PUZZLE_CY, 142, 0, Math.PI*2); ctx.stroke();
  // 目标轮廓
  PUZZLE.pieces.forEach(p=>{
    if(!p.placed) drawPuzzlePiece({...p, x:p.tx, y:p.ty}, true);
  });
  // 已拼好
  PUZZLE.pieces.forEach(p=>{ if(p.placed) drawPuzzlePiece(p, false); });
  // 散件
  PUZZLE.pieces.forEach(p=>{ if(!p.placed && p !== PUZZLE.drag) drawPuzzlePiece(p, false); });
  if(PUZZLE.drag) drawPuzzlePiece(PUZZLE.drag, false);
  // 金环闪光
  PUZZLE.rings = PUZZLE.rings.filter(r=>r.life > 0);
  PUZZLE.rings.forEach(r=>{
    ctx.strokeStyle = `rgba(240,214,138,${Math.max(0,r.life)})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI*2); ctx.stroke();
    r.r += 3.2; r.life -= 0.03;
  });
  // 鎏金礼花 + 四芒星光
  PUZZLE.confetti = PUZZLE.confetti.filter(pt=>pt.life > 0);
  PUZZLE.confetti.forEach(pt=>{
    ctx.globalAlpha = Math.max(0, Math.min(1, pt.life));
    ctx.fillStyle = pt.color;
    if(pt.star){
      ctx.save();
      ctx.translate(pt.x, pt.y); ctx.rotate((pt.rot += pt.vr));
      ctx.beginPath();
      for(let k=0;k<4;k++){
        ctx.lineTo(Math.cos(k*Math.PI/2)*pt.size, Math.sin(k*Math.PI/2)*pt.size);
        ctx.lineTo(Math.cos(k*Math.PI/2+Math.PI/4)*pt.size*0.32, Math.sin(k*Math.PI/2+Math.PI/4)*pt.size*0.32);
      }
      ctx.closePath(); ctx.fill();
      ctx.restore();
    } else {
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI*2); ctx.fill();
    }
    pt.x += pt.vx; pt.y += pt.vy; pt.vy += pt.star ? 0.05 : 0.12;
    if(pt.star) pt.vx *= 0.985;
    pt.life -= pt.star ? 0.008 : 0.012;
    ctx.globalAlpha = 1;
  });
}

function bindPuzzleEvents(){
  const c = PUZZLE.canvas;
  const pos = e=>{
    const r = c.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return {x:(t.clientX-r.left)*(c.width/r.width), y:(t.clientY-r.top)*(c.height/r.height)};
  };
  function hit(p, pt){
    if(p.kind === 'core') return Math.hypot(pt.x-p.x, pt.y-p.y) < 38;
    const cx = p.x + Math.sin(p.rot)*52;
    const cy = p.y - Math.cos(p.rot)*52;
    return Math.hypot(pt.x-cx, pt.y-cy) < 58;
  }
  function down(e){
    const pt = pos(e);
    for(let i=PUZZLE.pieces.length-1;i>=0;i--){
      const p = PUZZLE.pieces[i];
      if(!p.placed && hit(p, pt)){
        PUZZLE.drag = p;
        PUZZLE.off = {x:pt.x-p.x, y:pt.y-p.y};
        c.classList.add('dragging');
        e.preventDefault();
        return;
      }
    }
  }
  function move(e){
    if(!PUZZLE.drag) return;
    const pt = pos(e);
    PUZZLE.drag.x = pt.x - PUZZLE.off.x;
    PUZZLE.drag.y = pt.y - PUZZLE.off.y;
    e.preventDefault();
  }
  function up(){
    const p = PUZZLE.drag;
    if(!p) return;
    c.classList.remove('dragging');
    if(Math.hypot(p.x-p.tx, p.y-p.ty) < 28){
      p.x = p.tx; p.y = p.ty; p.placed = true;
      PUZZLE.doneCount++;
      updatePuzzleCount();
      PUZZLE.rings.push({x:p.tx, y:p.ty, r:20, life:1});
      if(PUZZLE.doneCount === 7) puzzleSuccess();
    }
    PUZZLE.drag = null;
  }
  c.addEventListener('mousedown', down);
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);
  c.addEventListener('touchstart', down, {passive:false});
  c.addEventListener('touchmove', move, {passive:false});
  c.addEventListener('touchend', up);
}

function updatePuzzleCount(){
  document.getElementById('puzzle-count').textContent = `已拼 ${PUZZLE.doneCount}/7`;
}

function puzzleSuccess(){
  // 全屏鎏金特效
  const gf = document.getElementById('gold-flash');
  gf.classList.remove('boom'); void gf.offsetWidth; gf.classList.add('boom');
  // 鎏金礼花 + 金色星光（四芒星形态，呼应窗花散射）
  for(let i=0;i<130;i++){
    const a = Math.random()*Math.PI*2, sp = 2+Math.random()*6;
    PUZZLE.confetti.push({x:PUZZLE_CX, y:PUZZLE_CY,
      vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-2,
      life:1, size:2+Math.random()*3.5,
      color:Math.random()<0.6 ? '#F0D68A' : (Math.random()<0.5 ? '#D4A843' : '#E8455F')});
  }
  for(let i=0;i<26;i++){
    const a = Math.random()*Math.PI*2, sp = 1+Math.random()*4.5;
    PUZZLE.confetti.push({x:PUZZLE_CX, y:PUZZLE_CY, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-1.4,
      life:1.25, size:5+Math.random()*7, color:'#F0D68A', star:true, rot:Math.random()*Math.PI, vr:(Math.random()-0.5)*0.2});
  }
  showToast('成就解锁 · 妙手拼窗花！');
  unlockCode('pin');
  setTimeout(()=>{
    showModal({title:'成就 · 妙手拼窗花', sub:'参与式非遗创作体验',
      body:SCENE_DATA.paper.hotspots[0].body +
      `<button class="quiz-entry-btn" onclick="closeModal();placeWindowFlowerOnWall()">✿ 将这扇窗花贴上展厅墙面</button>`});
  }, 1400);
}

// ===== 绣样拼贴（用户参与创作 + 数字文创卡片生成） =====
const STITCH = {inited:false, open:false, frags:[], sel:null, drag:null, off:{x:0,y:0},
  raf:0, ctx:null, canvas:null, lastTap:0, lastTapFrag:null};
const STITCH_W = 520, STITCH_H = 360, STITCH_CX = 260, STITCH_CY = 180;
const STITCH_ACCENTS = ['#E8455F','#7EC8A9','#6FA8DC','#C77DBA','#FF8C42','#F0D68A'];

function openStitch(){
  document.getElementById('stitch-overlay').classList.add('show');
  STITCH.open = true;
  STITCH.canvas = document.getElementById('stitch-canvas');
  STITCH.ctx = STITCH.canvas.getContext('2d');
  if(!STITCH.inited){ buildStitchPalette(); bindStitchEvents(); STITCH.inited = true; }
  cancelAnimationFrame(STITCH.raf);
  stitchLoop();
}

function closeStitch(){
  document.getElementById('stitch-overlay').classList.remove('show');
  STITCH.open = false;
  cancelAnimationFrame(STITCH.raf);
}

function buildStitchPalette(){
  const pal = document.getElementById('stitch-palette');
  MOTIFS_PLUS.forEach((m,i)=>{
    const c = document.createElement('canvas');
    c.width = c.height = 92; c.title = '添加「'+m.n+'」纹样';
    const ctx = c.getContext('2d');
    // 绣布底小样
    const g = ctx.createLinearGradient(0,0,92,92);
    g.addColorStop(0,'#241a33'); g.addColorStop(1,'#1c1428');
    ctx.fillStyle = g; ctx.fillRect(0,0,92,92);
    ctx.strokeStyle = 'rgba(212,168,67,.5)'; ctx.lineWidth = 3;
    ctx.strokeRect(3,3,86,86);
    m.draw(ctx, 46, 46, 24, '#F0D68A', STITCH_ACCENTS[i%STITCH_ACCENTS.length]);
    c.addEventListener('click', ()=>addStitchFrag(i));
    pal.appendChild(c);
  });
}

function addStitchFrag(i){
  STITCH.frags.push({
    def:i,
    x: STITCH_CX + (Math.random()-0.5)*140,
    y: STITCH_CY + (Math.random()-0.5)*100,
    rot: Math.random()<0.5 ? 0 : Math.PI/4,
    s: 62 + Math.random()*18,
    c2: STITCH_ACCENTS[Math.floor(Math.random()*STITCH_ACCENTS.length)]
  });
  STITCH.sel = STITCH.frags[STITCH.frags.length-1];
}

function bindStitchEvents(){
  const c = STITCH.canvas;
  const pos = (e)=>{
    const r = c.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return {x:(p.clientX-r.left)*STITCH_W/r.width, y:(p.clientY-r.top)*STITCH_H/r.height};
  };
  function pick(pt){
    for(let i=STITCH.frags.length-1;i>=0;i--){
      const f = STITCH.frags[i];
      if(Math.hypot(pt.x-f.x, pt.y-f.y) < f.s*0.62) return f;
    }
    return null;
  }
  function down(e){
    const pt = pos(e);
    const f = pick(pt);
    const now = Date.now();
    if(f){
      STITCH.sel = f;
      STITCH.drag = f;
      STITCH.off = {x:pt.x-f.x, y:pt.y-f.y};
      // 双击/双触 → 旋转
      if(STITCH.lastTapFrag===f && now-STITCH.lastTap<320){ f.rot += Math.PI/4; STITCH.drag=null; }
      STITCH.lastTap = now; STITCH.lastTapFrag = f;
      c.classList.add('dragging');
      e.preventDefault();
    }
  }
  function move(e){
    if(!STITCH.drag) return;
    const pt = pos(e);
    STITCH.drag.x = Math.max(10, Math.min(STITCH_W-10, pt.x-STITCH.off.x));
    STITCH.drag.y = Math.max(10, Math.min(STITCH_H-10, pt.y-STITCH.off.y));
    e.preventDefault();
  }
  function up(){
    STITCH.drag = null;
    c.classList.remove('dragging');
  }
  c.addEventListener('mousedown', down);
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);
  c.addEventListener('touchstart', down, {passive:false});
  c.addEventListener('touchmove', move, {passive:false});
  c.addEventListener('touchend', up);
}

function drawStitchFrame(){
  const ctx = STITCH.ctx;
  if(!ctx) return;
  // 绣布底（织物经纬+光泽）
  const g = ctx.createLinearGradient(0,0,0,STITCH_H);
  g.addColorStop(0,'#1d1630'); g.addColorStop(.5,'#251a38'); g.addColorStop(1,'#1a1228');
  ctx.fillStyle = g; ctx.fillRect(0,0,STITCH_W,STITCH_H);
  ctx.globalAlpha = 1;
  for(let y=6;y<STITCH_H;y+=8){
    ctx.fillStyle = 'rgba(240,214,138,.045)';
    ctx.fillRect(0,y,STITCH_W,1);
  }
  for(let x=6;x<STITCH_W;x+=8){
    ctx.fillStyle = 'rgba(240,214,138,.035)';
    ctx.fillRect(x,0,1,STITCH_H);
  }
  const sg = ctx.createLinearGradient(0,STITCH_H*0.3,0,STITCH_H*0.7);
  sg.addColorStop(0,'rgba(255,240,214,0)'); sg.addColorStop(.5,'rgba(255,240,214,.07)'); sg.addColorStop(1,'rgba(255,240,214,0)');
  ctx.fillStyle = sg; ctx.fillRect(0,0,STITCH_W,STITCH_H);
  ctx.strokeStyle = 'rgba(212,168,67,.55)'; ctx.lineWidth = 2;
  ctx.strokeRect(8,8,STITCH_W-16,STITCH_H-16);
  // 纹样碎片
  STITCH.frags.forEach(f=>{
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.rot);
    MOTIFS_PLUS[f.def].draw(ctx, 0, 0, f.s/2, '#F0D68A', f.c2);
    ctx.restore();
  });
  // 选中高亮（虚线金框）
  if(STITCH.sel){
    const f = STITCH.sel;
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.rot);
    ctx.strokeStyle = '#F0D68A';
    ctx.lineWidth = 2;
    ctx.setLineDash([6,4]);
    ctx.shadowColor = '#F0D68A'; ctx.shadowBlur = 8;
    const hs = f.s*0.62;
    ctx.strokeRect(-hs, -hs, hs*2, hs*2);
    ctx.restore();
  }
}

function stitchLoop(){
  if(!STITCH.open) return;
  drawStitchFrame();
  STITCH.raf = requestAnimationFrame(stitchLoop);
}

function rotateStitchSel(){
  if(!STITCH.sel){ showToast('先点击绣布上的纹样再旋转'); return; }
  STITCH.sel.rot += Math.PI/4;
}

function deleteStitchSel(){
  if(!STITCH.sel){ showToast('先点击要删除的纹样'); return; }
  STITCH.frags = STITCH.frags.filter(f=>f!==STITCH.sel);
  STITCH.sel = null;
}

function clearStitch(){
  STITCH.frags = [];
  STITCH.sel = null;
}

function makeStitchCard(){
  if(!STITCH.frags.length){ showToast('先点击上方纹样碎片，拼出你的绣样吧'); return; }
  unlockCode('xiu');
  drawStitchFrame();
  const card = document.createElement('canvas');
  card.width = 720; card.height = 940;
  const ctx = card.getContext('2d');
  // 卡片底
  const g = ctx.createLinearGradient(0,0,720,940);
  g.addColorStop(0,'#14102a'); g.addColorStop(.5,'#1c1436'); g.addColorStop(1,'#120d24');
  ctx.fillStyle = g; ctx.fillRect(0,0,720,940);
  // 双层鎏金边框 + 回纹角
  ctx.strokeStyle = '#D4A843'; ctx.lineWidth = 6; ctx.strokeRect(22,22,676,896);
  ctx.lineWidth = 2; ctx.strokeRect(38,38,644,864);
  [[46,46],[674,46],[46,894],[674,894]].forEach(([x,y])=>{
    ctx.save(); ctx.translate(x,y);
    for(let i=0;i<3;i++){ ctx.strokeRect(-22+i*7,-22+i*7,44-i*14,44-i*14); }
    ctx.restore();
  });
  // 标题
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#F0D68A';
  ctx.font = '900 46px "Noto Serif SC",serif';
  ctx.shadowColor = 'rgba(212,168,67,.6)'; ctx.shadowBlur = 18;
  ctx.fillText('满族绣样 · 数字文创卡', 360, 96);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(240,214,138,.75)';
  ctx.font = '22px "Noto Sans SC",sans-serif';
  ctx.fillText('辽韵三萃 · 皮影 × 剪纸 × 刺绣', 360, 148);
  // 绣样画布
  ctx.fillStyle = '#1a1228';
  ctx.fillRect(70, 190, 580, 430);
  ctx.strokeStyle = 'rgba(212,168,67,.6)'; ctx.lineWidth = 3;
  ctx.strokeRect(70, 190, 580, 430);
  ctx.drawImage(STITCH.canvas, 78, 198, 564, 414);
  // 落款
  const now = new Date();
  ctx.fillStyle = 'rgba(240,214,138,.85)';
  ctx.font = '20px "Noto Sans SC",sans-serif';
  ctx.fillText(`参与式非遗创作纪念 · ${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日`, 360, 682);
  ctx.fillStyle = 'rgba(240,214,138,.6)';
  ctx.font = '17px "Noto Sans SC",sans-serif';
  ctx.fillText('剪纸为纹样源头 · 赋能皮影造型与刺绣图案 · 辽宁非遗数字化表达', 360, 716);
  // 朱红印章
  ctx.save();
  ctx.translate(360, 800);
  ctx.rotate(-0.06);
  ctx.fillStyle = '#C41E3A';
  ctx.fillRect(-64, -40, 128, 80);
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3;
  ctx.strokeRect(-56, -32, 112, 64);
  ctx.fillStyle = '#FFF6E8';
  ctx.font = '900 30px "Noto Serif SC",serif';
  ctx.fillText('辽韵三萃', 0, 2);
  ctx.restore();
  // 下载
  const a = document.createElement('a');
  a.download = '辽韵三萃-满族绣样文创卡.png';
  a.href = card.toDataURL('image/png');
  a.click();
  const gf = document.getElementById('gold-flash');
  gf.classList.remove('boom'); void gf.offsetWidth; gf.classList.add('boom');
  showToast('文创卡片已生成 · 已开始下载保存');
}

// ===== UI 功能 =====
function showModal(data){
  document.getElementById('modal-title').textContent = data.title;
  document.getElementById('modal-sub').textContent = data.sub;
  document.getElementById('modal-body').innerHTML = data.body;
  document.getElementById('modal-overlay').classList.add('show');
}

function closeModal(){
  document.getElementById('modal-overlay').classList.remove('show');
}

// 母题纹样名（MOTIFS 里 n 字段）
function motifName(p){ return (MOTIFS[p] && MOTIFS[p].n) || ('纹样' + p); }

// ===== ⑩ 我的辽韵旅程：汇总全部交互痕迹 → 升华主题 =====
function showJourney(auto){
  const total = NAV_ITEMS.length;
  const n = STATE.visited.size;
  const pct = total ? Math.round(n/total*100) : 0;
  const codes = LAB.codes.size, totalCodes = CODE_DEFS.length;
  const bornIdx = Object.keys(STATE.flow.born||{}).filter(k=>STATE.flow.born[k]);
  const bornFlow = bornIdx.filter(k=>STATE.flow.puppet[k] && STATE.flow.emb[k]).length;
  const scenes = (STATE.journey && STATE.journey.scenes) ? STATE.journey.scenes : new Set();
  const arts = [
    {name:'剪纸', key:'paper', ico:'✂'},
    {name:'皮影', key:'puppet', ico:'🎭'},
    {name:'刺绣', key:'emb',   ico:'🪡'}
  ];
  const artHtml = arts.map(a=>{
    const on = scenes.has(a.key);
    return `<span class="jv-badge ${on?'on':''}"><b>${a.ico} ${a.name}</b>${on?'已到访':'未涉足'}</span>`;
  }).join('');
  let lineage;
  if(bornIdx.length){
    lineage = bornIdx.map(k=>{
      const m = motifName(k), pp = STATE.flow.puppet[k], eb = STATE.flow.emb[k];
      return `<div class="jv-line"><b>${m}</b><span>${pp?'✔皮影':'·皮影'}　${eb?'✔刺绣':'·刺绣'}</span></div>`;
    }).join('');
  } else {
    lineage = `<div class="jv-empty">你尚未刻绘一枚母题纹样 —— 先到剪纸厅刻一枚，再看它流转成影、织作成线。</div>`;
  }
  let verdict;
  if(n>=total && codes>=totalCodes) verdict='纸可剪千年，线可牵万语 —— 你已亲手走通「纸·皮·布」同源三态，非遗在你手中重获新生。';
  else if(n>=total) verdict='三处展区皆至，纹脉在案成全 —— 尚余纹样密码待你逐一解锁，艺已传、人未倦。';
  else if(scenes.size>=3) verdict='文以其源，技因其变 —— 你已踏遍纸·皮·布三艺，把同一份辽纹看成三种活法。';
  else verdict='纹脉初成，尚有留白待你续笔 —— 每一次探访，都是在为辽纹重新落子。';
  const body = `
  <div class="jv">
    <div class="jv-hero">
      <div class="jv-ring" style="background:conic-gradient(var(--gold) ${pct*3.6}deg, rgba(255,255,255,.12) 0)">
        <div class="jv-ring-in"><b>${pct}%</b><i>探索度</i></div>
      </div>
      <div class="jv-hero-t">
        <h3>我的辽韵旅程</h3>
        <p>人随艺存 <b>·</b> 艺随人传<br><small>一脉辽纹 · 三艺共生</small></p>
      </div>
    </div>
    <div class="jv-stats">
      <div><b>${n}</b><i>探索点 · ${total}</i></div>
      <div><b>${codes}</b><i>纹样密码 · ${totalCodes}</i></div>
      <div><b>${bornIdx.length}</b><i>诞生成母题</i></div>
      <div><b>${bornFlow}</b><i>全链路流转</i></div>
    </div>
    <div class="jv-art">${artHtml}</div>
    <div class="jv-ln"><div class="jv-ln-title">纹样谱系 · 你刻下的源</div>${lineage}</div>
    <div class="jv-words">${verdict}</div>
  </div>`;
  showModal({ title: auto ? '旅程达成 · 毕业礼赞' : '我的辽韵旅程', sub: `探索报告 · 截止当前 ${n}/${total}`, body });
}

// ===== ⑪ 完结撒花：满格达成 → 幕布 + 素材坠落 + 烟花 → 终末之诗升华 =====
function playCelebration(){
  if(window.__celOn) return; window.__celOn = true;
  const curtain = document.getElementById('curtain');
  if(curtain) curtain.classList.remove('hide');
  startCardRain();   // 素材图片如纸牌般从上方坠落
  startFireworks();  // 烟花自下向上发射绽放
  setTimeout(()=>{   // 烟花结束 → 收起幕布 → 播放终末之诗升华
    if(curtain) curtain.classList.add('hide');
    playEndingPoem(()=>{ // 播完升华 → 按钮移到音乐开关旁并改名「再播完结动画」
      window.__celOn = false;
      const b = document.getElementById('confetti-btn');
      if(b){
        b.classList.add('left'); b.textContent = '🎬 再播完结动画';
        const m = document.getElementById('music-float'); // 紧挨音乐开关右缘、底部对齐（更低）
        if(m){ const r = m.getBoundingClientRect(); b.style.left = Math.round(r.right + 10)+'px'; b.style.bottom = Math.round(window.innerHeight - r.bottom)+'px'; }
      }
    });
  }, 3500);
}
// 终末之诗：文字自底向上滚动如字幕条，播完淡出回到主页面
function playEndingPoem(done){
  const ov = document.getElementById('poem'); if(!ov){ done && done(); return; }
  const track = document.getElementById('poem-track');
  ov.classList.add('show');
  const H = track.scrollHeight;
  const dur = Math.max(12000, 7000 + H*0.6);
  const t0 = performance.now();
  (function frame(){
    let p = (performance.now()-t0)/dur; if(p>1) p = 1;
    track.style.transform = `translateY(${ innerHeight - p*(innerHeight + H) }px)`;
    if(p < 1) requestAnimationFrame(frame);
    else setTimeout(()=>{ ov.classList.remove('show'); done && done(); }, 1800);
  })();
}
// 素材图片从上方掉落（纸牌游戏「红心当空」式：随机左右、旋转、飘摆）
function startCardRain(){
  let rain = document.getElementById('card-rain');
  if(!rain){ rain = document.createElement('div'); rain.id = 'card-rain'; document.body.appendChild(rain); }
  const urls = [];
  MOTIFS.forEach(m=>{ const u = motifThumbURL(m.n, '#f0d68a', '#e8455f'); if(u) urls.push(u); });
  const emos = ['🌸','❄️','🎭','🪡','⭐','🌼','🪷'];
  const mk = () => {
    const c = document.createElement('div'); c.className = 'rain-card';
    if(urls.length && Math.random()<0.55){ c.style.backgroundImage = `url(${urls[Math.floor(Math.random()*urls.length)]})`; }
    else { c.textContent = emos[Math.floor(Math.random()*emos.length)]; }
    const s = 36 + Math.random()*56;
    c.style.width = s+'px'; c.style.height = s+'px';
    c.style.left = (Math.random()*96)+'%';
    c.style.animationDuration = (3.4 + Math.random()*1.8)+'s';
    c.style.animationDelay = (Math.random()*0.8)+'s';
    c.style.setProperty('--sway', (Math.random()*70-35)+'deg');
    c.addEventListener('animationend', ()=>{ if(c.parentNode) c.parentNode.removeChild(c); });
    rain.appendChild(c);
  };
  for(let i=0;i<14;i++) mk(); // 初始批次：数量少 → 不密集
  let t = 0;
  const iv = setInterval(()=>{ if(t++>10){ clearInterval(iv); return; } mk(); }, 250); // 持续补洒至约2.5s
  setTimeout(()=>{ clearInterval(iv); const r = document.getElementById('card-rain'); if(r) r.querySelectorAll('.rain-card').forEach(c=>c.parentNode&&c.parentNode.removeChild(c)); }, 3900);
}
// 烟花：自下向上发射、于上方绽放（金色/绯红/藕荷粒子，带重力拖尾）
function startFireworks(){
  const cv = document.getElementById('confetti-canvas'); if(!cv) return;
  const ctx = cv.getContext('2d');
  let W, H, dpr;
  const rsz = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W*dpr; cv.height = H*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
  };
  rsz(); window.addEventListener('resize', rsz);
  cv.classList.add('show'); cv.classList.remove('hide');
  const parts = [];
  const palette = ['#ffd27a', '#ff7a9e', '#8a7bff', '#ff9d3c'];
  const burst = (x, y) => {
    const n = 24 + Math.floor(Math.random()*14);
    const spd = 1.7 + Math.random()*1.4;
    const col = palette[Math.floor(Math.random()*palette.length)];
    for(let i=0;i<n;i++){
      const a = (i/n)*Math.PI*2 + Math.random()*0.35;
      const v = spd*(0.6 + Math.random()*0.9);
      parts.push({ x, y, vx: Math.cos(a)*v, vy: Math.sin(a)*v,
        life: 1, decay: 0.012 + Math.random()*0.014, col, sz: 2 + Math.random()*2.4 });
    }
  };
  const spawn = setInterval(()=>{ burst(W*(0.15+Math.random()*0.7), H*(0.15+Math.random()*0.5)); }, 300);
  let raf;
  const tick = () => {
    ctx.clearRect(0, 0, W, H);
    for(let i=parts.length-1;i>=0;i--){
      const p = parts[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.045; p.life -= p.decay;
      if(p.life <= 0 || p.y > H){ parts.splice(i,1); continue; }
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.col;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if(window.__celOn) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  setTimeout(()=>{
    clearInterval(spawn); if(raf) cancelAnimationFrame(raf);
    ctx.clearRect(0, 0, W, H);
    cv.classList.remove('show'); cv.classList.add('hide');
    window.removeEventListener('resize', rsz);
  }, 3300);
}

function showIntro(){
  showModal({title:'辽韵三萃 · 一脉辽纹 三艺共生', sub:'基于纹样同源理论的辽宁满族非遗活态传承沉浸式3D交互H5',
    body:`<p><span class="highlight">主题立意</span>：同一套满族民俗纹样，分别流淌在<b>新宾剪纸、岫岩皮影、辽阳满族刺绣</b>三种载体之上——不是三项非遗的简单拼凑，而是<span class="highlight">"同源纹样，不同载体演绎"</span>：剪纸为源、皮影转韵、刺绣赋彩。</p>
    <p><span class="highlight">纹样粒子流转引擎</span>（核心技术创新）：纹样拆解为数千金红粒子，跨载体迁移重组——剪纸团花化粒飘散，重聚为皮影镂刻轮廓，再织作刺绣丝线针脚，特效即文化。</p>
    <p><span class="highlight">技术亮点</span>：① WebGL轻量化3D方案，低配手机浏览器直接运行，无需下载APP；② 低面数模型+贴图/粒子shader，兼顾视觉与性能；③ 三展区松耦合模块化架构，可持续接入辽宁其他非遗。</p>
    <p><span class="highlight">社会价值</span>：面向中小学非遗美育课堂（45分钟完整交互课程流），支持手机浏览器扫码直达；用户创作纹样可生成手机壁纸、民俗明信片等数字文创；可服务于辽宁本地博物馆线上数字展与非遗研学。</p>
    <div class="ref-list"><b>参考文献 · 来源依据</b>
      <li>辽宁省非物质文化遗产名录 · 岫岩皮影戏/新宾满族剪纸/辽阳满族刺绣申报档案</li>
      <li>中国非物质文化遗产网 · 国家级非遗代表性项目名录</li>
      <li>王纯信《满族民间美术》· 乌丙安《民俗学原理》</li>
      <li>岫岩满族自治县/新宾满族自治县/辽阳地方志 · 民俗卷</li></div>`});
}

// 文化和数据价值（创新实验室 · 详情弹窗）
function showValueReport(){
  showModal({title:'文化与数据价值 · 社会落地', sub:'传承人语录 · 美育课堂 · 数字文创 · 参考文献',
    body:`<p><span class="highlight">传承人语录</span>（口述整理）</p>
    <div class="master-quote"><q>一口叙说千古事，双手对舞百万兵。</q><span class="quote-from">岫岩皮影艺人班传语录</span></div>
    <div class="master-quote"><q>心里有样，手上有样；剪纸不用稿，样在心头绕。</q><span class="quote-from">新宾满族剪纸传承人</span></div>
    <div class="master-quote"><q>枕头顶上的花，是姑娘心里的话。</q><span class="quote-from">辽阳满族刺绣老绣娘</span></div>
    <p><span class="highlight">美育课堂应用设想</span>：面向中小学非遗美育课，45分钟完成"认知纹样 → 刻绘创作 → 载体流转 → 成果导出"完整教学闭环；规划示范基地20所，预计年覆盖学生1.2万人次。</p>
    <p><span class="highlight">传播落地</span>：H5轻量化免下载，手机浏览器扫码直达（文创工坊生成分享码）；可嵌入辽宁本地博物馆线上数字展、非遗研学课程平台。</p>
    <p><span class="highlight">数字文创产出</span>：用户创作纹样一键导出手机壁纸 / 民俗明信片 / 短剧海报 / 数字证书，形成"可带走的非遗记忆"。</p>
    <div class="ref-list"><b>参考文献</b>
      <li>辽宁省非物质文化遗产名录（三项目申报档案）</li>
      <li>中国非物质文化遗产网 · 国家级名录</li>
      <li>王纯信《满族民间美术》</li>
      <li>乌丙安《民俗学原理》</li>
      <li>岫岩/新宾/辽阳地方志 · 民俗卷</li></div>`});
}

function showToast(msg){
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(()=>toast.classList.remove('show'), 2500);
}

function showHotspotLabel(obj, x, y){
  let label = document.getElementById('hotspot-label');
  if(!label){
    label = document.createElement('div');
    label.id = 'hotspot-label';
    label.className = 'hotspot-label';
    document.body.appendChild(label);
  }
  let text = '';
  if(obj.userData.type === 'puppet') text = '点击苏醒 / 开演剧目';
  else if(obj.userData.type === 'hotspot') text = obj.userData.data.title;
  else if(obj.userData.type === 'papercut') text = obj.userData.name;
  else if(obj.userData.type === 'centerpaper') text = '点击旋转 · 同步换装';
  else if(obj.userData.type === 'storypanel') text = obj.userData.name;
  else if(obj.userData.type === 'embroidery') text = obj.userData.name + ' · 点击递进交互';
  else if(obj.userData.type === 'embneedle') text = '虚拟刺绣演示 · 穿针走线';
  else if(obj.userData.type === 'embstory') text = obj.userData.name;
  else if(obj.userData.type === 'dblpillow') text = '满绣双面枕顶 · 点击翻面探索';
  else if(obj.userData.type === 'hangpaper') text = '点击查看 · 满族挂签';
  else if(obj.userData.type === 'prop') text = (PROP_KNOWLEDGE[obj.userData.propId]||{}).title || '非遗小知识';
  label.textContent = text;
  label.style.left = x + 'px';
  label.style.top = (y - 15) + 'px';
  label.style.opacity = '1';
}

function hideHotspotLabel(){
  const label = document.getElementById('hotspot-label');
  if(label) label.style.opacity = '0';
}

// 按钮波纹效果
document.querySelectorAll('.ctrl-btn').forEach(btn=>{
  btn.addEventListener('click', function(e){
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
    this.appendChild(ripple);
    setTimeout(()=>ripple.remove(), 600);
  });
});

// ===== 窗口调整 =====
function onResize(){
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ===== 加载即叙事：加载进度条覆盖在开场动画上，不再空等 =====
function simulateLoading(){
  let progress = 0;
  const bar = document.getElementById('opening-load-bar');
  const pct = document.getElementById('opening-load-pct');
  const lo = document.getElementById('opening-load');
  const interval = setInterval(()=>{
    progress += Math.random()*12 + 3;
    if(progress >= 100){
      progress = 100;
      clearInterval(interval);
      setTimeout(()=>{ if(lo) lo.classList.add('finish'); }, 400);
      // 背景音乐：首次交互即自动播放（浏览器策略要求手势）
      const bgmAutoStart = ()=>{
        if(!BGM.playing){
          startBGM('paper');
          const btn = document.getElementById('btn-bgm');
          const label = document.getElementById('bgm-label');
          if(btn) btn.classList.add('active');
          if(label) label.textContent = '音乐播放中';
        }
        document.removeEventListener('click', bgmAutoStart);
        document.removeEventListener('keydown', bgmAutoStart);
        document.removeEventListener('touchstart', bgmAutoStart);
      };
      document.addEventListener('click', bgmAutoStart);
      document.addEventListener('keydown', bgmAutoStart);
      document.addEventListener('touchstart', bgmAutoStart);
    }
    if(bar) bar.style.width = progress + '%';
    if(pct) pct.textContent = Math.floor(progress) + '%';
  }, 150);
}

// ===== 启动 =====
window.addEventListener('load', ()=>{
  // 加载即叙事：隐藏整屏旧加载页，开场动画与加载进度同时进行，无空等
  const ls = document.getElementById('loading-screen');
  if(ls) ls.classList.add('hide');
  initThree();
  buildNav();
  markVisited(0);
  showKnowledge(SCENE_DATA.paper.intro, false);
  loadGroupVideo('paper'); // 默认预载剪纸板块视频
  animate();
  // 开篇叙事：一源三流（同源纹样分化为三门非遗）→ 结束后进厅
  playOpeningNarrative(()=>{
    showToast('欢迎来到辽韵三萃 · 底部「纹样流转」选母题一键切换纸、皮、布三载体');
    setTimeout(()=>showIntro(), 700);
  });
  simulateLoading();
  // 全场景物件知识绑定（点击任意物件弹出相关知识）
  bindSceneProps();
  // 创新实验室（十大创新）初始化
  initLab();
  // 皮影开演特效（篝火光晕/火星粒子）初始化
  initStagePerformFx();
  // 传承人语录 + 纹样民俗寓意 注入知识库
  initCulture();
});

// 键盘快捷键
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape'){ closeModal(); closePuzzle(); closeStitch(); closeManip(); closeCarve(); closeThread(); closeQuiz(); closeLab(); closeGen(); closeRestore(); closeTopo(); closeCodes(); closeFlow(); closeAsm(); closeDrama(); closeEmbGame(); closeShop(); closeGroupVideo(); }
  if(e.key === ' '){ e.preventDefault(); toggleRoam(); }
  if(e.key === 'Tab'){ e.preventDefault(); toggleScene(); }
});

/* ============================================================
   【新增】全场景物件知识系统（点击任意物件弹出相关知识）
   ============================================================ */
const PROP_KNOWLEDGE = {
  screen:{title:'皮影影窗（亮子）',sub:'一张白幕 · 千军万马',
    body:`<p>影窗俗称<span class="highlight">"亮子"</span>，是皮影戏的舞台核心，旧时用白布或白纸绷成，灯光从幕后照射，皮影贴幕而动，观众在幕前看"电影"般的影像。</p>
    <p>"一口叙说千古事，双手对舞百万兵"——艺人在幕后操纵、演唱、伴奏，全靠这张幕布完成虚实相生的<span class="highlight">光影魔法</span>。</p>`},
  curtain:{title:'戏台侧幕帷幔',sub:'红绸垂落 · 古戏新风',
    body:`<p>皮影戏台两侧的<span class="highlight">红绸帷幔</span>，既遮挡后台艺人走动，也限定观众视线，让光影聚焦于影窗之中。</p>
    <p>帷幔上的绣金纹样常与剪纸、刺绣同源——同一个团花，纸上可剪、布上可绣、帷幔上可镶边。</p>`},
  lantern:{title:'戏台红灯笼',sub:'火光灯影 · 皮影之源',
    body:`<p>皮影最早用<span class="highlight">油灯、蜡烛</span>照明，后改灯泡、LED。灯笼既是戏台装饰，更点明皮影本质：<span class="highlight">灯与影的艺术</span>。</p>
    <p>岫岩皮影讲究"灯下看影"，光源位置与亮度直接决定影人成像的清晰度，灯光师是幕后无名英雄。</p>`},
  stage:{title:'岫岩皮影戏台',sub:'五尺戏台 · 方寸乾坤',
    body:`<p>传统皮影戏台多为<span class="highlight">临时搭建</span>：木杆撑架、席棚围挡、白布作幕。台高一丈，幕宽不过五尺，却上演过《杨家将》《封神榜》等千本大戏。</p>
    <p>庙会、宅院、田间，一处空地即可成台，皮影因此被称为<span class="highlight">"最轻便的剧场"</span>。</p>`},
  shelf:{title:'剪纸展架',sub:'一纸千刻 · 层层见巧',
    body:`<p>展架上陈列的满族剪纸以<span class="highlight">红纸镂刻</span>为主，构图饱满、线线相连。满族剪纸不用底稿"随手剪"的功夫，被称为心中的纹样库。</p>
    <p>这些纹样同时也是<span class="highlight">皮影雕刻与刺绣的母本</span>——先有纸样，后有皮影与绣品，三非遗一脉同源。</p>`},
  cabinet:{title:'剪纸展柜',sub:'光影陈列 · 纸韵流芳',
    body:`<p>展柜采用<span class="highlight">透光玻璃</span>设计，让红剪纸在暗色空间中如灯箱般透亮，模拟剪纸贴窗后"阳光透窗"的原始观赏方式。</p>
    <p>新宾满族剪纸2008年列入国家级非遗名录，被誉为满族文化的<span class="highlight">"活化石"</span>。</p>`},
  hangpaper:{title:'满族挂签',sub:'五彩门楣 · 驱邪纳福',
    body:`<p>挂签（挂旗）是满族年俗剪纸的独特形式：五色纸刻成条形，上端吉祥纹样、下端流苏穗，贴于<span class="highlight">门楣、窗楣、神龛</span>之上。</p>
    <p>五色对应<span class="highlight">五行</span>，寓意驱邪纳福。微风拂过，挂签飘动，被称为"会跳舞的剪纸"。</p>`},
  board:{title:'枕头顶展示板',sub:'满族女红 · 集大成者',
    body:`<p>展示板集中陈列满族<span class="highlight">枕头顶刺绣</span>：方寸之间绣花鸟、人物、吉祥文字，是满族姑娘陪嫁与"比绣"技艺的舞台。</p>
    <p>每一块枕顶都先<span class="highlight">剪出纸样</span>、再绷布施针——剪纸是纹样母源，刺绣是织物定格。</p>`},
  table:{title:'丝布展台',sub:'蚕丝锦缎 · 绣品之基',
    body:`<p>展台铺陈的<span class="highlight">真丝锦缎</span>是满族刺绣的主要底布。缎面光滑致密，最能承载盘金绣的富丽与打籽绣的立体。</p>
    <p>旧时辽东"以锦为贵"，嫁妆中绣缎多寡、针脚疏密，是衡量家门女红的重要标尺。</p>`},
  silkTop:{title:'蚕丝展布',sub:'一缕蚕丝 · 千年锦绣',
    body:`<p>丝布经纬细密、光泽柔和，是<span class="highlight">刺绣的画布</span>。满族绣娘常以靛蓝、绛红丝线在缎面上运针，针脚藏于丝理之间。</p>
    <p>本展厅的丝布展台可近距离观察绣品<span class="highlight">凹凸纹理</span>与丝线反光的微妙变化。</p>`},
  pedestal:{title:'萨满图腾基座',sub:'神谕有形 · 织物为凭',
    body:`<p>中央基座陈列<span class="highlight">萨满图腾绣品</span>：柳枝始母神、神鹊乌鸦、蟒神虎神，多绣于神衣神幡，是沟通人神的"织物神谕"。</p>
    <p>其图腾纹样与剪纸萨满纹、皮影神怪造型<span class="highlight">三位一体</span>，共同构成满族精神艺术谱系。</p>`},
  paperwall:{title:'新宾剪纸展厅',sub:'纸上乾坤 · 满韵遗风',
    body:`<p>展厅墙面仿照满族老宅<span class="highlight">"糊纸格"</span>设计，红剪纸满铺如年节窗棂。新宾满族剪纸以萨满文化为核心，题材涵盖祭祀、年俗、图腾。</p>
    <p>点击墙上任意剪纸可触发三非遗联动：<span class="highlight">纹样同步皮影换装与刺绣绣纹</span>。</p>`},
  embwall:{title:'辽阳满族刺绣展厅',sub:'针尖丹青 · 织物春秋',
    body:`<p>刺绣展厅以暗色织物为底，金色展架托举绣品，模拟"绣坊夜灯下施针"的沉浸氛围。辽阳满族刺绣以<span class="highlight">枕头顶、荷包、服饰绣片</span>最负盛名。</p>
    <p>点击展品触发递进交互：绣品抬起 → 科普讲解 → 镜头自动对焦。</p>`},
};

// 按几何特征为环境物件挂载知识（不改动原场景构建逻辑）
function bindSceneProps(){
  const tag = (o, propId, arr)=>{
    if(!o || !o.isMesh || o.userData.type) return;
    o.userData.type = 'prop';
    o.userData.propId = propId;
    o.userData.name = PROP_KNOWLEDGE[propId].title;
    if(arr) arr.push(o);
  };
  const param = o => (o.geometry && o.geometry.parameters) || {};
  if(puppetSceneGroup){
    puppetSceneGroup.traverse(o=>{
      if(!o.isMesh) return;
      const p = param(o);
      if(o.geometry.type === 'SphereGeometry') tag(o, 'lantern', puppetObjects);
      else if(o.geometry.type === 'PlaneGeometry' && p.width===10 && p.height===6) tag(o, 'screen', puppetObjects);
      else if(o.geometry.type === 'PlaneGeometry' && p.width===3 && p.height===7) tag(o, 'curtain', puppetObjects);
      else if(o.geometry.type === 'BoxGeometry' && p.width===16) tag(o, 'stage', puppetObjects);
    });
  }
  if(paperSceneGroup){
    paperSceneGroup.traverse(o=>{
      if(!o.isMesh) return;
      const p = param(o);
      if(o.geometry.type === 'BoxGeometry' && p.width===5 && p.height===3) tag(o, 'cabinet', paperObjects);
      else if(o.geometry.type === 'BoxGeometry' && p.width===4 && p.height===0.15) tag(o, 'shelf', paperObjects);
      else if(o.geometry.type === 'PlaneGeometry' && p.width===30 && p.height===12) tag(o, 'paperwall', paperObjects);
    });
  }
  if(embSceneGroup){
    embSceneGroup.traverse(o=>{
      if(!o.isMesh) return;
      const p = param(o);
      if(o.geometry.type === 'BoxGeometry' && p.width===8.4) tag(o, 'board', embObjects);
      else if(o.geometry.type === 'BoxGeometry' && p.width===4 && p.height===0.9) tag(o, 'table', embObjects);
      else if(o.geometry.type === 'PlaneGeometry' && p.width===4.2 && p.height===2) tag(o, 'silkTop', embObjects);
      else if(o.geometry.type === 'CylinderGeometry' && p.height===0.9) tag(o, 'pedestal', embObjects);
      else if(o.geometry.type === 'PlaneGeometry' && p.width===30 && p.height===12) tag(o, 'embwall', embObjects);
    });
  }
}

/* ============================================================
   游戏1 · 皮影操纵模拟器（实时拖杆驱动骨骼 + 动态投影 + 金轨迹 + 纪念卡）
   ============================================================ */
const MANIP = {
  inited:false, open:false, raf:0, canvas:null, ctx:null,
  rods:[
    {x:150, y:330, hx:150, hy:330, drag:false, val:0, kind:'lift', label:'抬手表演杆'},
    {x:490, y:330, hx:490, hy:330, drag:false, val:0, kind:'turn', label:'转身操纵杆'},
  ],
  lift:0, turn:0, trail:[], parts:[],
  taskLift:0, taskTurn:0, doneLift:false, doneTurn:false, tunePlayed:false,
  pup:null, shad:null, T:0
};
const MANIP_W = 640, MANIP_H = 420;

function openManip(){
  document.getElementById('manip-overlay').classList.add('show');
  MANIP.open = true;
  MANIP.canvas = document.getElementById('manip-canvas');
  MANIP.ctx = MANIP.canvas.getContext('2d');
  if(!MANIP.inited){ bindManipEvents(); MANIP.inited = true; }
  // 懒初始化离屏人偶层
  if(!MANIP.pup){
    MANIP.pup = document.createElement('canvas'); MANIP.pup.width = 160; MANIP.pup.height = 320;
    MANIP.shad = document.createElement('canvas'); MANIP.shad.width = 160; MANIP.shad.height = 320;
  }
  updateManipChips();
  cancelAnimationFrame(MANIP.raf);
  manipLoop();
}
function closeManip(){
  document.getElementById('manip-overlay').classList.remove('show');
  MANIP.open = false;
  cancelAnimationFrame(MANIP.raf);
}
function resetManip(){
  MANIP.rods.forEach(r=>{ r.x=r.hx; r.y=r.hy; r.val=0; r.drag=false; });
  MANIP.lift = 0; MANIP.turn = 0; MANIP.trail = []; MANIP.parts = [];
  MANIP.taskLift = 0; MANIP.taskTurn = 0;
  MANIP.doneLift = false; MANIP.doneTurn = false; MANIP.tunePlayed = false;
  document.getElementById('manip-card-btn').style.display = 'none';
  updateManipChips();
  showToast('操纵杆已复位 · 拖动金色杆头重新表演');
}
function updateManipChips(){
  document.getElementById('manip-t1').classList.toggle('done', MANIP.doneLift);
  document.getElementById('manip-t2').classList.toggle('done', MANIP.doneTurn);
  if(MANIP.doneLift && MANIP.doneTurn){
    document.getElementById('manip-card-btn').style.display = '';
    unlockCode('ying');
  }
}

function bindManipEvents(){
  const c = MANIP.canvas;
  const pos = e=>{
    const r = c.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return {x:(p.clientX-r.left)*MANIP_W/r.width, y:(p.clientY-r.top)*MANIP_H/r.height};
  };
  function down(e){
    const pt = pos(e);
    let hit = null;
    MANIP.rods.forEach(r=>{ if(Math.hypot(pt.x-r.x, pt.y-r.y) < 34) hit = r; });
    if(hit){
      hit.drag = true;
      c.classList.add('dragging');
      e.preventDefault();
    }
  }
  function move(e){
    const pt = pos(e);
    MANIP.rods.forEach(r=>{
      if(!r.drag) return;
      if(r.kind === 'lift'){
        r.y = Math.max(90, Math.min(390, pt.y));
        r.val = (r.hy - r.y) / (r.hy - 100);   // 上拉为正
        MANIP.lift = Math.max(0, Math.min(1, r.val));
      } else {
        r.x = Math.max(280, Math.min(600, pt.x));
        r.val = (r.x - r.hx) / 90;
        MANIP.turn = Math.max(-1, Math.min(1, r.val));
      }
      // 金色轨迹流光
      MANIP.trail.push({x:r.x, y:r.y, life:1});
      if(Math.random() < 0.5) MANIP.parts.push({
        x:r.x, y:r.y, vx:(Math.random()-.5)*1.6, vy:(Math.random()-.5)*1.6-0.6,
        life:1, size:1.5+Math.random()*2.5, c:Math.random()<0.7?'#F0D68A':'#E8455F'
      });
      e.preventDefault();
    });
  }
  function up(){
    MANIP.rods.forEach(r=>{ r.drag = false; });
    c.classList.remove('dragging');
  }
  c.addEventListener('mousedown', down);
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);
  c.addEventListener('touchstart', down, {passive:false});
  c.addEventListener('touchmove', move, {passive:false});
  c.addEventListener('touchend', up);
}

// 关节式皮影人偶（离屏绘制，供本体/影子复用）
function drawManipPuppet(ctx, lift, turn){
  const W = 160, H = 320, cx = W/2;
  ctx.clearRect(0,0,W,H);
  const skin = '#F3E2BC', edge = '#5C1A1B';
  const tw = Math.cos(turn * 0.9);           // 转身压扁系数
  ctx.save();
  ctx.translate(cx, 0);
  ctx.scale(Math.max(0.42, Math.abs(tw)), 1);
  ctx.lineWidth = 2.5; ctx.strokeStyle = edge;
  const limb = (sx, sy, a1, a2, len1, len2, w)=>{
    ctx.lineCap = 'round';
    ctx.strokeStyle = skin; ctx.lineWidth = w;
    const ex = sx + Math.sin(a1)*len1, ey = sy + Math.cos(a1)*len1;
    const hx = ex + Math.sin(a1+a2)*len2, hy = ey + Math.cos(a1+a2)*len2;
    ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.lineTo(hx,hy); ctx.stroke();
    ctx.strokeStyle = edge; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.lineTo(hx,hy); ctx.stroke();
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(hx,hy,4.5,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = edge; ctx.lineWidth = 1; ctx.stroke();
  };
  // 双腿
  limb(-13, 208, Math.PI*(0.06), Math.PI*0.1, 52, 48, 9);
  limb(13, 208, Math.PI*(-0.06), Math.PI*(-0.1), 52, 48, 9);
  // 双臂（lift 抬起 → 基角从下垂转到前举）
  const armA = 0.18 + lift * 1.5;
  limb(-24, 118, Math.PI - armA, -0.35, 48, 42, 8);
  limb(24, 118, armA, 0.35, 48, 42, 8);
  // 躯干（袍身）
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(-22, 96); ctx.lineTo(22, 96);
  ctx.lineTo(27, 214); ctx.lineTo(-27, 214);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // 腰带（纹样源：剪纸纹样以金线镶于袍身）
  ctx.fillStyle = '#D4A843';
  ctx.fillRect(-25, 138, 50, 7);
  // 领口饰纹
  ctx.strokeStyle = '#C41E3A'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-14, 100); ctx.lineTo(0, 112); ctx.lineTo(14, 100); ctx.stroke();
  ctx.strokeStyle = edge; ctx.lineWidth = 2.5;
  // 头（梢子帽 · 武将）
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(0, 66, 21, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = edge;
  ctx.beginPath();
  ctx.moveTo(-23, 56); ctx.lineTo(0, 30); ctx.lineTo(23, 56); ctx.lineTo(16, 62); ctx.lineTo(-16, 62);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#C41E3A';
  ctx.beginPath(); ctx.arc(0, 44, 4, 0, Math.PI*2); ctx.fill();
  // 眼（侧脸时偏移）
  const exo = turn * 5;
  ctx.fillStyle = edge;
  ctx.beginPath(); ctx.arc(-6+exo, 66, 2.2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(6+exo, 66, 2.2, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

function manipLoop(){
  if(!MANIP.open) return;
  const ctx = MANIP.ctx, T = (MANIP.T += 0.016);
  // 任务判定（持续保持触发）
  if(MANIP.lift > 0.72){ if(++MANIP.taskLift > 42 && !MANIP.doneLift){
    MANIP.doneLift = true; updateManipChips(); goldBoom('解锁抬手 · 皮影唱段片段');
    playPuppetTune();
  }} else MANIP.taskLift = Math.max(0, MANIP.taskLift-2);
  if(Math.abs(MANIP.turn) > 0.62){ if(++MANIP.taskTurn > 42 && !MANIP.doneTurn){
    MANIP.doneTurn = true; updateManipChips(); goldBoom('解锁转身 · 影调过门解锁');
    playPuppetTune();
  }} else MANIP.taskTurn = Math.max(0, MANIP.taskTurn-2);

  // ---- 背景：幕布 + 戏台氛围 ----
  const g = ctx.createLinearGradient(0,0,0,MANIP_H);
  g.addColorStop(0,'#241a20'); g.addColorStop(.5,'#33222a'); g.addColorStop(1,'#1a1016');
  ctx.fillStyle = g; ctx.fillRect(0,0,MANIP_W,MANIP_H);
  // 幕布（中央亮区）
  const sg = ctx.createRadialGradient(320, 190, 40, 320, 200, 270);
  sg.addColorStop(0,'rgba(245,230,200,.34)'); sg.addColorStop(.7,'rgba(245,230,200,.13)'); sg.addColorStop(1,'rgba(245,230,200,0)');
  ctx.fillStyle = sg; ctx.fillRect(60, 20, 520, 380);
  ctx.strokeStyle = 'rgba(212,168,67,.5)'; ctx.lineWidth = 3;
  ctx.strokeRect(60, 20, 520, 380);
  // 幕布顶横批
  ctx.fillStyle = 'rgba(92,26,27,.85)'; ctx.fillRect(60, 20, 520, 26);
  ctx.fillStyle = '#F0D68A'; ctx.font = '14px "Noto Serif SC",serif'; ctx.textAlign = 'center';
  ctx.fillText('一  口  叙  说  千  古  事  ·  双  手  对  舞  百  万  兵', 320, 39);

  // ---- 投影影子（实时跟随骨骼形变 + 边缘虚化） ----
  const pc = MANIP.pup.getContext('2d');
  drawManipPuppet(pc, MANIP.lift, MANIP.turn);
  const sc = MANIP.shad.getContext('2d');
  sc.clearRect(0,0,160,320);
  sc.drawImage(MANIP.pup, 0, 0);
  sc.globalCompositeOperation = 'source-atop';
  sc.fillStyle = '#0d0503'; sc.fillRect(0,0,160,320);
  sc.globalCompositeOperation = 'source-over';
  ctx.save();
  ctx.filter = 'blur(5px)';
  ctx.globalAlpha = 0.4 + MANIP.lift*0.12;
  const shX = 320 + MANIP.turn*16, shY = 330;
  ctx.translate(shX, shY);
  ctx.scale(1.05 + MANIP.turn*0.06, 1.1);
  ctx.drawImage(MANIP.shad, -80, -302);
  ctx.restore();
  ctx.filter = 'none';

  // ---- 皮影本体 ----
  ctx.save();
  ctx.translate(320, 330);
  const wob = Math.sin(T*1.6)*0.02;
  ctx.rotate(wob);
  ctx.drawImage(MANIP.pup, -80, -302);
  ctx.restore();

  // ---- 操纵杆 + 金色轨迹流光 ----
  MANIP.trail.forEach(p=>{ p.life -= 0.045; });
  MANIP.trail = MANIP.trail.filter(p=>p.life > 0);
  ctx.save();
  ctx.lineCap = 'round';
  for(let i=1;i<MANIP.trail.length;i++){
    const p0 = MANIP.trail[i-1], p1 = MANIP.trail[i];
    ctx.strokeStyle = `rgba(240,214,138,${p1.life*0.85})`;
    ctx.lineWidth = 1 + p1.life*4;
    ctx.shadowColor = '#D4A843'; ctx.shadowBlur = 10*p1.life;
    ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
  }
  ctx.restore();
  MANIP.rods.forEach((r,i)=>{
    // 杆身（连向皮影方向）
    ctx.strokeStyle = 'rgba(212,168,67,.75)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(r.x, r.y);
    ctx.lineTo(i===0 ? 270 : 370, 210); ctx.stroke();
    // 原位虚线圈
    ctx.setLineDash([4,4]); ctx.strokeStyle = 'rgba(212,168,67,.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(r.hx, r.hy, 26, 0, Math.PI*2); ctx.stroke();
    ctx.setLineDash([]);
    // 手柄（鎏金圆钮）
    const rg = ctx.createRadialGradient(r.x-5, r.y-5, 2, r.x, r.y, 22);
    rg.addColorStop(0,'#FFF3CE'); rg.addColorStop(.55,'#D4A843'); rg.addColorStop(1,'#8B1428');
    ctx.fillStyle = rg;
    ctx.shadowColor = r.drag ? '#F0D68A' : 'rgba(212,168,67,.5)';
    ctx.shadowBlur = r.drag ? 26 : 12;
    ctx.beginPath(); ctx.arc(r.x, r.y, r.drag?24:20, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#3a1010'; ctx.font = 'bold 13px "Noto Sans SC",sans-serif';
    ctx.fillText(i===0?'抬':'转', r.x, r.y+5);
  });

  // ---- 金粒粒子 ----
  MANIP.parts.forEach(p=>{
    p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.life -= 0.03;
  });
  MANIP.parts = MANIP.parts.filter(p=>p.life > 0);
  MANIP.parts.forEach(p=>{
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.c;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
  });
  ctx.globalAlpha = 1;

  // ---- 底部操作提示 ----
  ctx.fillStyle = 'rgba(240,214,138,.6)'; ctx.font = '12px "Noto Sans SC",sans-serif';
  const tip1 = MANIP.doneLift ? '✔ 抬手已完成' : `↑ 上拉左杆抬手 ${(MANIP.taskLift/42*100)|0}%`;
  const tip2 = MANIP.doneTurn ? '✔ 转身已完成' : `↔ 左右拖右杆转身 ${(MANIP.taskTurn/42*100)|0}%`;
  ctx.textAlign = 'left';  ctx.fillText(tip1, 90, 405);
  ctx.textAlign = 'right'; ctx.fillText(tip2, 550, 405);

  MANIP.raf = requestAnimationFrame(manipLoop);
}

function goldBoom(msg){
  const gf = document.getElementById('gold-flash');
  gf.classList.remove('boom'); void gf.offsetWidth; gf.classList.add('boom');
  showToast(msg);
}

// 解锁的皮影音频片段（WebAudio 合成辽南影调五声短句 + 锣点）
function playPuppetTune(){
  try{
    if(!STATE.audioCtx) STATE.audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    const ac = STATE.audioCtx, t0 = ac.currentTime + 0.05;
    [523.25, 587.33, 659.25, 783.99, 880, 783.99, 659.25, 523.25].forEach((f,i)=>{
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      const ts = t0 + i*0.22;
      g.gain.setValueAtTime(0.0001, ts);
      g.gain.linearRampToValueAtTime(0.14, ts+0.03);
      g.gain.exponentialRampToValueAtTime(0.001, ts+0.42);
      o.connect(g); g.connect(ac.destination);
      o.start(ts); o.stop(ts+0.46);
    });
    // 锣点余韵
    [0, 0.9].forEach(dt=>{
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(720, t0+dt);
      o.frequency.exponentialRampToValueAtTime(180, t0+dt+0.5);
      g.gain.setValueAtTime(0.12, t0+dt);
      g.gain.exponentialRampToValueAtTime(0.001, t0+dt+0.55);
      o.connect(g); g.connect(ac.destination);
      o.start(t0+dt); o.stop(t0+dt+0.6);
    });
  }catch(e){}
}

// 数字皮影纪念卡（可截图保存）
function makeManipCard(){
  const card = document.createElement('canvas');
  card.width = 720; card.height = 940;
  const ctx = card.getContext('2d');
  const g = ctx.createLinearGradient(0,0,720,940);
  g.addColorStop(0,'#14102a'); g.addColorStop(.5,'#1e1430'); g.addColorStop(1,'#120d24');
  ctx.fillStyle = g; ctx.fillRect(0,0,720,940);
  ctx.strokeStyle = '#D4A843'; ctx.lineWidth = 6; ctx.strokeRect(22,22,676,896);
  ctx.lineWidth = 2; ctx.strokeRect(38,38,644,864);
  [[46,46],[674,46],[46,894],[674,894]].forEach(([x,y])=>{
    ctx.save(); ctx.translate(x,y);
    for(let i=0;i<3;i++){ ctx.strokeRect(-22+i*7,-22+i*7,44-i*14,44-i*14); }
    ctx.restore();
  });
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#F0D68A';
  ctx.font = '900 46px "Noto Serif SC",serif';
  ctx.shadowColor = 'rgba(212,168,67,.6)'; ctx.shadowBlur = 18;
  ctx.fillText('皮影操纵 · 数字纪念卡', 360, 96);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(240,214,138,.75)';
  ctx.font = '22px "Noto Sans SC",sans-serif';
  ctx.fillText('辽韵三萃 · 鞍山岫岩皮影戏', 360, 148);
  // 影窗舞台
  ctx.fillStyle = '#221820'; ctx.fillRect(70, 190, 580, 520);
  const sg = ctx.createRadialGradient(360, 430, 60, 360, 440, 320);
  sg.addColorStop(0,'rgba(245,230,200,.35)'); sg.addColorStop(1,'rgba(245,230,200,.05)');
  ctx.fillStyle = sg; ctx.fillRect(70, 190, 580, 520);
  ctx.strokeStyle = 'rgba(212,168,67,.6)'; ctx.lineWidth = 3;
  ctx.strokeRect(70, 190, 580, 520);
  // 绘制最终姿态皮影
  const pc = document.createElement('canvas'); pc.width = 160; pc.height = 320;
  drawManipPuppet(pc.getContext('2d'), Math.max(MANIP.lift, 0.9), MANIP.turn);
  ctx.save();
  ctx.filter = 'blur(6px)'; ctx.globalAlpha = .45;
  ctx.translate(382, 448); ctx.scale(1.35, 1.4);
  ctx.drawImage(pc, -80, -160);
  ctx.restore(); ctx.filter = 'none'; ctx.globalAlpha = 1;
  ctx.translate(352, 440); ctx.scale(1.6, 1.65);
  ctx.drawImage(pc, -80, -160);
  ctx.setTransform(1,0,0,1,0,0);
  const now = new Date();
  ctx.fillStyle = 'rgba(240,214,138,.85)';
  ctx.font = '20px "Noto Sans SC",sans-serif';
  ctx.fillText(`指尖操纵皮影纪念 · ${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日`, 360, 756);
  ctx.fillStyle = 'rgba(240,214,138,.6)';
  ctx.font = '17px "Noto Sans SC",sans-serif';
  ctx.fillText('驴皮为形 · 灯光为魂 · 五尺影窗演尽千古事', 360, 790);
  ctx.save();
  ctx.translate(360, 845); ctx.rotate(-0.06);
  ctx.fillStyle = '#C41E3A'; ctx.fillRect(-64, -32, 128, 64);
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3; ctx.strokeRect(-56, -24, 112, 48);
  ctx.fillStyle = '#FFF6E8'; ctx.font = '900 26px "Noto Serif SC",serif';
  ctx.fillText('辽韵三萃', 0, 2);
  ctx.restore();
  const a = document.createElement('a');
  a.download = '辽韵三萃-皮影操纵纪念卡.png';
  a.href = card.toDataURL('image/png');
  a.click();
  goldBoom('数字纪念卡已生成 · 已开始下载保存');
}

/* ============================================================
   游戏2 · 剪纸刻绘解谜（刻刀镂空 + 红线扣分 + 纸絮粒子 + 同步刺绣展厅）
   ============================================================ */
const CARVE = {
  inited:false, open:false, raf:0, canvas:null, ctx:null,
  key:'shaman', score:100, done:false, T:0, lastDeduct:0,
  blackPts:[], redPts:[], total:0, doneCnt:0,
  parts:[], cutting:false, lastPos:null,
  paperC:null, holeC:null, workC:null
};
const CARVE_S = 520;

// 纹样路径点生成（黑色可刻带 + 红色禁区线）
function buildCarvePattern(key){
  const pts = [], red = [];
  const line = (x1,y1,x2,y2,step=8)=>{
    const d = Math.hypot(x2-x1, y2-y1), n = Math.max(2, Math.round(d/step));
    for(let i=0;i<=n;i++) pts.push({x:x1+(x2-x1)*i/n, y:y1+(y2-y1)*i/n, done:false});
  };
  const circle = (cx,cy,r,step=9)=>{
    const n = Math.max(8, Math.round(Math.PI*2*r/step));
    for(let i=0;i<n;i++){
      const a = i*Math.PI*2/n;
      pts.push({x:cx+Math.cos(a)*r, y:cy+Math.sin(a)*r, done:false});
    }
  };
  const rect = (x1,y1,x2,y2,step=8)=>{
    line(x1,y1,x2,y1,step); line(x2,y1,x2,y2,step); line(x2,y2,x1,y2,step); line(x1,y2,x1,y1,step);
  };
  if(key === 'shaman'){
    circle(260, 158, 34);
    line(260, 192, 172, 352); line(260, 192, 348, 352); line(172, 352, 348, 352);
    line(212, 248, 148, 214); line(308, 248, 372, 214);
    for(let i=0;i<6;i++){
      const a = -Math.PI/2 + (i-2.5)*0.42;
      line(260+Math.cos(a)*40, 158+Math.sin(a)*40, 260+Math.cos(a)*74, 158+Math.sin(a)*74, 7);
    }
    line(200, 352, 200, 396); line(320, 352, 320, 396);
    rect(96, 96, 424, 424);                      // 外框
    rect(64, 64, 456, 456, 12);                  // 红线禁区
  } else {
    rect(140, 116, 380, 404);                    // 福字外框
    circle(260, 260, 128);                       // 中央圆
    // 福字笔画（描边像素采样 → 点阵刻线）
    const off = document.createElement('canvas'); off.width = off.height = CARVE_S;
    const oc = off.getContext('2d');
    oc.font = 'bold 190px "Noto Serif SC",serif';
    oc.textAlign = 'center'; oc.textBaseline = 'middle';
    oc.strokeStyle = '#000'; oc.lineWidth = 3;
    oc.strokeText('福', 260, 268);
    const data = oc.getImageData(0,0,CARVE_S,CARVE_S).data;
    for(let y=150; y<400; y+=8){
      for(let x=160; x<364; x+=8){
        if(data[(y*CARVE_S+x)*4+3] > 100){
          pts.push({x, y, done:false});
        }
      }
    }
    rect(64, 64, 456, 456, 12);                  // 红线禁区
  }
  CARVE.blackPts = pts;
  CARVE.redPts = red.concat(buildRedPts(key));
  CARVE.total = pts.length;
  CARVE.doneCnt = 0;
}
function buildRedPts(key){
  const red = [];
  const ring = (x1,y1,x2,y2,step=10)=>{
    const d = Math.hypot(x2-x1,y2-y1), n = Math.max(2, Math.round(d/step));
    for(let i=0;i<=n;i++) red.push({x:x1+(x2-x1)*i/n, y:y1+(y2-y1)*i/n});
  };
  if(key === 'shaman'){ ring(64,64,456,64); ring(456,64,456,456); ring(456,456,64,456); ring(64,456,64,64); }
  else { ring(64,64,456,64); ring(456,64,456,456); ring(456,456,64,456); ring(64,456,64,64); }
  return red;
}

function openCarve(){
  document.getElementById('carve-overlay').classList.add('show');
  CARVE.open = true;
  CARVE.canvas = document.getElementById('carve-canvas');
  CARVE.ctx = CARVE.canvas.getContext('2d');
  if(!CARVE.inited){ bindCarveEvents(); CARVE.inited = true; }
  if(!CARVE.paperC){
    CARVE.paperC = document.createElement('canvas'); CARVE.paperC.width = CARVE.paperC.height = CARVE_S;
    CARVE.holeC  = document.createElement('canvas'); CARVE.holeC.width  = CARVE.holeC.height  = CARVE_S;
    CARVE.workC  = document.createElement('canvas'); CARVE.workC.width  = CARVE.workC.height  = CARVE_S;
  }
  initCarve(CARVE.key);
}
function closeCarve(){
  document.getElementById('carve-overlay').classList.remove('show');
  CARVE.open = false;
  cancelAnimationFrame(CARVE.raf);
}
function initCarve(key){
  CARVE.key = key;
  CARVE.score = 100; CARVE.done = false; CARVE.parts = [];
  CARVE.cutting = false; CARVE.lastPos = null;
  CARVE.hoverPt = null; CARVE.fuzz = 0;
  buildCarvePattern(key);
  drawCarvePaper();
  const hc = CARVE.holeC.getContext('2d');
  hc.globalCompositeOperation = 'source-over';
  hc.clearRect(0,0,CARVE_S,CARVE_S);
  hc.fillStyle = '#fff'; hc.fillRect(0,0,CARVE_S,CARVE_S);
  hc.globalCompositeOperation = 'destination-out';
  document.getElementById('carve-p1').classList.toggle('tool-btn-active', key==='shaman');
  document.getElementById('carve-p2').classList.toggle('tool-btn-active', key==='fu');
  updateCarveUI();
  // 启动/重启渲染循环
  cancelAnimationFrame(CARVE.raf);
  if(CARVE.open) carveLoop();
  showToast(`已载入「${key==='shaman'?'萨满纹样':'福字年俗'}」 · 沿黑色纹样运刀`);
}
function updateCarveUI(){
  document.getElementById('carve-bar').style.width = (CARVE.doneCnt/Math.max(1,CARVE.total)*100)+'%';
  const sc = document.getElementById('carve-score');
  sc.textContent = CARVE.score + '分';
}

// 预绘红纸底 + 黑纹样线 + 红色禁区线
function drawCarvePaper(){
  const c = CARVE.paperC.getContext('2d');
  const g = c.createLinearGradient(0,0,CARVE_S,CARVE_S);
  g.addColorStop(0,'#C41E3A'); g.addColorStop(.5,'#D22845'); g.addColorStop(1,'#A81630');
  c.fillStyle = g; c.fillRect(0,0,CARVE_S,CARVE_S);
  // 纸纤维
  for(let i=0;i<900;i++){
    c.fillStyle = `rgba(255,255,255,${Math.random()*0.05})`;
    c.fillRect(Math.random()*CARVE_S, Math.random()*CARVE_S, 1.5, 1.5);
  }
  // 黑色纹样带
  c.fillStyle = '#26150F';
  CARVE.blackPts.forEach(p=>{ c.beginPath(); c.arc(p.x, p.y, 7, 0, Math.PI*2); c.fill(); });
  // 红色警戒线（虚线闪烁感）
  c.strokeStyle = 'rgba(255,80,60,.95)'; c.lineWidth = 4; c.setLineDash([14,8]);
  CARVE.redPts.forEach((p,i)=>{
    if(i < CARVE.redPts.length-1 && Math.hypot(CARVE.redPts[i+1].x-p.x, CARVE.redPts[i+1].y-p.y) < 14){
      c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(CARVE.redPts[i+1].x, CARVE.redPts[i+1].y); c.stroke();
    }
  });
  c.setLineDash([]);
  c.fillStyle = 'rgba(255,120,90,.95)'; c.font = 'bold 15px "Noto Sans SC",sans-serif'; c.textAlign = 'center';
  c.fillText('红 线 禁 刻 区', 260, 50);
}

function bindCarveEvents(){
  const c = CARVE.canvas;
  const pos = e=>{
    const r = c.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return {x:(p.clientX-r.left)*CARVE_S/r.width, y:(p.clientY-r.top)*CARVE_S/r.height};
  };
  function cut(pt){
    // 有效刻绘：命中未完成黑纹样点
    CARVE.blackPts.forEach(p=>{
      if(!p.done && Math.hypot(pt.x-p.x, pt.y-p.y) < 15){
        p.done = true; CARVE.doneCnt++;
        // 镂空擦除
        const hc = CARVE.holeC.getContext('2d');
        hc.beginPath(); hc.arc(p.x, p.y, 11, 0, Math.PI*2); hc.fill();
        // 纸絮粒子
        for(let i=0;i<2;i++) CARVE.parts.push({
          x:p.x, y:p.y, vx:(Math.random()-.5)*1.8, vy:0.4+Math.random()*1.2,
          life:1, size:1+Math.random()*2.2, c:Math.random()<0.6?'#E8455F':'#F0D68A', type:'floss'
        });
      }
    });
    // 刻到红线 → 扣分
    if(CARVE.redPts.some(p=>Math.hypot(pt.x-p.x, pt.y-p.y) < 13)){
      const now = Date.now();
      if(now - CARVE.lastDeduct > 350){
        CARVE.lastDeduct = now;
        CARVE.score = Math.max(0, CARVE.score - 2);
        const sc = document.getElementById('carve-score');
        sc.classList.remove('deduct'); void sc.offsetWidth; sc.classList.add('deduct');
        for(let i=0;i<4;i++) CARVE.parts.push({
          x:pt.x, y:pt.y, vx:(Math.random()-.5)*2.4, vy:(Math.random()-.5)*2.4,
          life:1, size:1.5+Math.random()*2, c:'#FF5252', type:'spark'
        });
        if(!CARVE._warn || Date.now()-CARVE._warn > 2000){
          CARVE._warn = Date.now();
          showToast('刻到红线禁区 · 扣 2 分！沿黑色纹样运刀');
        }
      }
    }
    // 刀痕微光（镂空位置金边提示）
    CARVE.lastPos = pt;
    updateCarveUI();
    // 完成判定
    if(!CARVE.done && CARVE.doneCnt >= CARVE.total*0.92) carveSuccess();
  }
  function down(e){
    CARVE.cutting = true;
    cut(pos(e));
    e.preventDefault();
  }
  function move(e){
    const pt0 = pos(e);
    // 悬浮刀感预提示：接近黑色纹样时刀光微亮（不运刀也知落刀点）
    if(!CARVE.cutting){
      CARVE.hoverPt = CARVE.blackPts.find(p=>!p.done && Math.hypot(pt0.x-p.x, pt0.y-p.y) < 16) ? pt0 : null;
      return;
    }
    const pt = pt0;
    // 插值补点（快速滑动不断线）
    if(CARVE.lastPos){
      const d = Math.hypot(pt.x-CARVE.lastPos.x, pt.y-CARVE.lastPos.y);
      const n = Math.min(12, Math.ceil(d/6));
      for(let i=1;i<=n;i++) cut({x:CARVE.lastPos.x+(pt.x-CARVE.lastPos.x)*i/n, y:CARVE.lastPos.y+(pt.y-CARVE.lastPos.y)*i/n});
    } else cut(pt);
    CARVE.lastPos = pt;
    e.preventDefault();
  }
  function up(){ CARVE.cutting = false; CARVE.lastPos = null; }
  c.addEventListener('mousedown', down);
  c.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);
  c.addEventListener('touchstart', down, {passive:false});
  c.addEventListener('touchmove', move, {passive:false});
  c.addEventListener('touchend', up);
}

function carveSuccess(){
  CARVE.done = true;
  CARVE.fuzz = 1;   // 纸缘绒毛扰动
  CARVE.hoverPt = null;
  goldBoom('剪纸刻绘完成 · 纹样已同步刺绣展厅！');
  // 纹样母体流转链路：刻绘完成 = 该母题"诞生"
  const bornIdx = CARVE.key === 'shaman' ? 2 : 1;
  STATE.flow.born[bornIdx] = true;
  STATE.flow.sel = bornIdx;
  updateBottomBarState();
  for(let i=0;i<70;i++){
    const a = Math.random()*Math.PI*2, sp = 1.5+Math.random()*4;
    CARVE.parts.push({x:260, y:260, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-1.5,
      life:1, size:1.5+Math.random()*2.5, c:Math.random()<0.6?'#F0D68A':'#E8455F', type:'spark'});
  }
  // 三非遗联动：刻好的纹样 → 刺绣展厅绣纹
  applyEmbroidery(CARVE.key==='shaman' ? 2 : 1);
  unlockCode('ke');
  setTimeout(()=>{
    showToast('联动生效 · 切换到刺绣展厅可见同款绣纹');
  }, 1200);
}

function carveLoop(){
  if(!CARVE.open) return;
  const ctx = CARVE.ctx, T = (CARVE.T += 0.016);
  // 案台底
  const bg = ctx.createLinearGradient(0,0,CARVE_S,CARVE_S);
  bg.addColorStop(0,'#1a1210'); bg.addColorStop(1,'#241a14');
  ctx.fillStyle = bg; ctx.fillRect(0,0,CARVE_S,CARVE_S);
  // 合成：红纸 × 镂空遮罩（铺满画布，与点击判定坐标一致）
  const wc = CARVE.workC.getContext('2d');
  wc.globalCompositeOperation = 'source-over';
  wc.clearRect(0,0,CARVE_S,CARVE_S);
  wc.drawImage(CARVE.paperC, 0, 0);
  wc.globalCompositeOperation = 'destination-in';
  wc.drawImage(CARVE.holeC, 0, 0);
  wc.globalCompositeOperation = 'source-over';
  ctx.drawImage(CARVE.workC, 0, 0);
  // 多层纸张景深暗角
  const vg = ctx.createRadialGradient(260,260,210,260,260,385);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.5)');
  ctx.fillStyle = vg; ctx.fillRect(0,0,CARVE_S,CARVE_S);
  // 金边描边流光（沿已完成刻点）
  if(CARVE.doneCnt > 0){
    ctx.save();
    ctx.lineWidth = 2;
    const ph = (T*2)%(Math.PI*2);
    CARVE.blackPts.forEach((p,i)=>{
      if(!p.done) return;
      const a = 0.35 + 0.4*Math.sin(ph + i*0.35);
      ctx.strokeStyle = `rgba(240,214,138,${a})`;
      ctx.shadowColor = '#F0D68A'; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI*2); ctx.stroke();
    });
    ctx.restore();
  }
  // 纸张绒毛纹理扰动（刻成后纸缘细绒起伏，随时间消散）
  if(CARVE.fuzz > 0){
    CARVE.fuzz = Math.max(0, CARVE.fuzz - 0.004);
    ctx.save();
    ctx.strokeStyle = `rgba(255,224,205,${0.4*CARVE.fuzz})`;
    ctx.lineWidth = 1;
    CARVE.blackPts.forEach(p=>{
      if(!p.done) return;
      for(let k=0;k<3;k++){
        const a = Math.random()*Math.PI*2, r0 = 11 + Math.random()*5;
        ctx.beginPath();
        ctx.arc(p.x + Math.cos(a)*r0, p.y + Math.sin(a)*r0, 1.5 + Math.random()*2.5, a, a + 0.9 + Math.sin(T*9+k)*0.2);
        ctx.stroke();
      }
    });
    ctx.restore();
  }
  // 刻刀光标
  if(CARVE.lastPos && CARVE.cutting){
    ctx.strokeStyle = '#F0D68A'; ctx.lineWidth = 2;
    ctx.shadowColor = '#F0D68A'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(CARVE.lastPos.x, CARVE.lastPos.y, 15, 0, Math.PI*2); ctx.stroke();
    ctx.shadowBlur = 0;
  } else if(CARVE.hoverPt && !CARVE.cutting && !CARVE.done){
    // 悬浮刀感预提示（落刀点微光）
    const hp = 0.5 + 0.5*Math.sin(T*6);
    ctx.strokeStyle = `rgba(240,214,138,${0.3 + hp*0.45})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(CARVE.hoverPt.x, CARVE.hoverPt.y, 10 + hp*3, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = `rgba(240,214,138,${0.5 + hp*0.4})`;
    ctx.beginPath(); ctx.arc(CARVE.hoverPt.x, CARVE.hoverPt.y, 2.2, 0, Math.PI*2); ctx.fill();
  }
  // 粒子
  CARVE.parts.forEach(p=>{
    p.x += p.vx; p.y += p.vy;
    if(p.type === 'floss'){ p.vy += 0.05; p.vx *= 0.99; }
    p.life -= 0.022;
  });
  CARVE.parts = CARVE.parts.filter(p=>p.life > 0);
  CARVE.parts.forEach(p=>{
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.c;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    if(p.type === 'floss' && Math.random() < 0.3){
      ctx.fillRect(p.x+2, p.y-4, 1.2, 5);
    }
  });
  ctx.globalAlpha = 1;
  // 状态文字
  ctx.fillStyle = 'rgba(240,214,138,.75)'; ctx.font = '13px "Noto Sans SC",sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(CARVE.done ? '✔ 刻绘完成 · 完美镂空！' : `进度 ${(CARVE.doneCnt/Math.max(1,CARVE.total)*100)|0}% · 刻刀：鼠标按住沿黑纹滑动`, 30, CARVE_S-14);
  CARVE.raf = requestAnimationFrame(carveLoop);
}

/* ============================================================
   游戏3 · 满族刺绣走线工坊（引导点走线 + 丝线流光 + 织物凸起 + 同步皮影）
   ============================================================ */
const THREAD = {
  inited:false, open:false, raf:0, canvas:null, ctx:null,
  patIdx:0, guide:[], cur:0, stitched:[], trail:[], parts:[],
  mouse:null, done:false, T:0
};
const THREAD_S = 520;
const THREAD_PATS = ['团花缠枝', '萨满神纹', '连年有鱼', '福字绵长'];

function buildThreadPath(idx){
  const pts = [];
  const cx = 260, cy = 258, push = (x,y)=>pts.push({x, y});
  const arc = (ax,ay,r,a0,a1,step=0.16)=>{
    for(let a=a0; a<=a1; a+=step) push(ax+Math.cos(a)*r, ay+Math.sin(a)*r);
  };
  const line = (x1,y1,x2,y2,step=9)=>{
    const d = Math.hypot(x2-x1,y2-y1), n = Math.max(2, Math.round(d/step));
    for(let i=0;i<=n;i++) push(x1+(x2-x1)*i/n, y1+(y2-y1)*i/n);
  };
  const rect = (x1,y1,x2,y2)=>{ line(x1,y1,x2,y1); line(x2,y1,x2,y2); line(x2,y2,x1,y2); line(x1,y2,x1,y1); };
  if(idx === 0){            // 团花缠枝：同心三环 + 八瓣
    arc(cx,cy,52,0,Math.PI*2); arc(cx,cy,100,0,Math.PI*2); arc(cx,cy,148,0,Math.PI*2);
    for(let i=0;i<8;i++){
      const a = i*Math.PI/4;
      arc(cx+Math.cos(a)*76, cy+Math.sin(a)*76, 26, a-0.9, a+0.9);
    }
  } else if(idx === 1){     // 萨满神纹
    arc(cx, cy-108, 34, 0, Math.PI*2);
    line(cx, cy-74, cx-88, cy+96); line(cx, cy-74, cx+88, cy+96); line(cx-88, cy+96, cx+88, cy+96);
    line(cx-44, cy+2, cx-116, cy-30); line(cx+44, cy+2, cx+116, cy-30);
  } else if(idx === 2){     // 连年有鱼
    for(let a=0; a<=Math.PI*2; a+=0.14) push(cx+Math.cos(a)*118, cy+Math.sin(a)*62);
    line(cx+110, cy, cx+162, cy-40); line(cx+110, cy, cx+162, cy+40); line(cx+162, cy-40, cx+162, cy+40);
    arc(cx-42, cy-12, 6, 0, Math.PI*2, 0.35);
    for(let a=0.2; a<=Math.PI-0.2; a+=0.18) push(cx-8+Math.cos(a)*74, cy+26+Math.sin(a)*40);
  } else {                  // 福字绵长：外框 + 简笔福
    rect(140, 118, 380, 398);
    line(180, 176, 340, 176);
    line(260, 148, 260, 372);
    rect(196, 216, 324, 300);
    line(196, 258, 324, 258);
    line(150, 398, 370, 398);
  }
  return pts;
}

function openThread(){
  document.getElementById('thread-overlay').classList.add('show');
  THREAD.open = true;
  THREAD.canvas = document.getElementById('thread-canvas');
  THREAD.ctx = THREAD.canvas.getContext('2d');
  if(!THREAD.inited){ bindThreadEvents(); THREAD.inited = true; }
  // 依附母体：走线工坊复用流转台当前选定的剪纸纹样
  if(STATE.flow.sel >= 0 && THREAD.patIdx !== FLOW_THREAD_MAP[STATE.flow.sel]) initThread(FLOW_THREAD_MAP[STATE.flow.sel]);
  else if(!THREAD.guide.length) initThread(0);
  cancelAnimationFrame(THREAD.raf);
  threadLoop();
}
function closeThread(){
  document.getElementById('thread-overlay').classList.remove('show');
  THREAD.open = false;
  cancelAnimationFrame(THREAD.raf);
}
function resetThread(){
  initThread((THREAD.patIdx+1) % THREAD_PATS.length);
}
function initThread(idx){
  THREAD.patIdx = idx;
  THREAD.guide = buildThreadPath(idx);
  THREAD.cur = 0; THREAD.stitched = []; THREAD.trail = []; THREAD.parts = [];
  THREAD.done = false; THREAD.mouse = null;
  document.getElementById('thread-save').style.display = 'none';
  document.getElementById('thread-sync').style.display = 'none';
  updateThreadUI();
  showToast(`新纹样「${THREAD_PATS[idx]}」 · 沿金色引导点移动鼠标走线`);
}
function updateThreadUI(){
  const pct = Math.round(THREAD.cur/Math.max(1,THREAD.guide.length)*100);
  document.getElementById('thread-step').textContent = `走线 ${pct}% · ${THREAD_PATS[THREAD.patIdx]}`;
  document.getElementById('thread-step').classList.toggle('done', THREAD.done);
}

function bindThreadEvents(){
  const c = THREAD.canvas;
  const pos = e=>{
    const r = c.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return {x:(p.clientX-r.left)*THREAD_S/r.width, y:(p.clientY-r.top)*THREAD_S/r.height};
  };
  function move(e){
    const pt = pos(e);
    THREAD.mouse = pt;
    THREAD.trail.push({x:pt.x, y:pt.y, life:1});
    // 缝合判定：靠近当前引导点
    if(!THREAD.done && THREAD.cur < THREAD.guide.length){
      const g = THREAD.guide[THREAD.cur];
      if(Math.hypot(pt.x-g.x, pt.y-g.y) < 17){
        THREAD.stitched.push(g);
        THREAD.cur++;
        // 彩丝粒子飘散
        for(let i=0;i<3;i++) THREAD.parts.push({
          x:g.x, y:g.y, vx:(Math.random()-.5)*2.2, vy:(Math.random()-.5)*2.2-0.5,
          life:1, size:1.2+Math.random()*2,
          c:['#E8455F','#7EC8A9','#6FA8DC','#C77DBA','#F0D68A','#FF8C42'][Math.floor(Math.random()*6)]
        });
        if(THREAD.cur >= THREAD.guide.length) threadSuccess();
        updateThreadUI();
      }
    }
    e.preventDefault();
  }
  c.addEventListener('mousemove', move);
  c.addEventListener('touchmove', move, {passive:false});
}

function threadSuccess(){
  THREAD.done = true;
  THREAD.wrinkle = 1;                                  // 布料褶皱抖动能量
  THREAD.ripples = [{r:14, life:1}, {r:-46, life:1}];  // 金色涟漪双环
  goldBoom('枕头顶绣成 · 一针一线皆功夫！');
  for(let i=0;i<70;i++){
    const a = Math.random()*Math.PI*2, sp = 1.5+Math.random()*4;
    THREAD.parts.push({x:260, y:258, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-1.5,
      life:1, size:1.5+Math.random()*2.5, c:Math.random()<0.5?'#F0D68A':'#E8455F'});
  }
  document.getElementById('thread-save').style.display = '';
  document.getElementById('thread-sync').style.display = '';
  unlockCode('xian');
  // 联动：绣纹样式同步刺绣展厅（以走线纹样驱动）
  applyEmbroidery(THREAD.patIdx);
}

function drawThreadFabric(ctx){
  // 枕顶绣布：织物经纬 + 光泽 + 金边
  const g = ctx.createLinearGradient(0,60,0,THREAD_S-60);
  g.addColorStop(0,'#241a33'); g.addColorStop(.5,'#2c2040'); g.addColorStop(1,'#1c1428');
  ctx.fillStyle = g; ctx.fillRect(60, 60, 400, 400);
  for(let y=62; y<THREAD_S-62; y+=7){
    ctx.fillStyle = 'rgba(240,214,138,.05)';
    ctx.fillRect(60, y, 400, 1);
  }
  for(let x=62; x<THREAD_S-62; x+=7){
    ctx.fillStyle = 'rgba(240,214,138,.04)';
    ctx.fillRect(x, 60, 1, 400);
  }
  const sg = ctx.createLinearGradient(0, 120, 0, 380);
  sg.addColorStop(0,'rgba(255,240,214,0)'); sg.addColorStop(.5,'rgba(255,240,214,.09)'); sg.addColorStop(1,'rgba(255,240,214,0)');
  ctx.fillStyle = sg; ctx.fillRect(60, 60, 400, 400);
  // 枕顶圆角金边 + 回纹角
  ctx.strokeStyle = '#D4A843'; ctx.lineWidth = 5;
  rrect(ctx, 60, 60, 400, 400, 26); ctx.stroke();
  ctx.lineWidth = 1.5;
  rrect(ctx, 78, 78, 364, 364, 18); ctx.stroke();
  ctx.strokeStyle = 'rgba(212,168,67,.85)'; ctx.lineWidth = 2.5;
  [[92,92],[428,92],[92,428],[428,428]].forEach(([x,y])=>{
    ctx.save(); ctx.translate(x,y);
    for(let i=0;i<3;i++){ ctx.strokeRect(-15+i*5,-15+i*5,30-i*10,30-i*10); }
    ctx.restore();
  });
  ctx.fillStyle = 'rgba(240,214,138,.85)'; ctx.font = '13px "Noto Serif SC",serif'; ctx.textAlign = 'center';
  ctx.fillText('满 族 枕 头 顶 · 走 线 工 坊', 260, 46);
}

function threadLoop(){
  if(!THREAD.open) return;
  const ctx = THREAD.ctx, T = (THREAD.T += 0.016);
  // 背景
  const bg = ctx.createLinearGradient(0,0,THREAD_S,THREAD_S);
  bg.addColorStop(0,'#141020'); bg.addColorStop(1,'#0f0c1a');
  ctx.fillStyle = bg; ctx.fillRect(0,0,THREAD_S,THREAD_S);
  // 织物：完成后短暂褶皱抖动（切片波动渲染，模拟布料回弹）
  if(THREAD.wrinkle > 0.01){
    if(!THREAD.fabC){
      THREAD.fabC = document.createElement('canvas');
      THREAD.fabC.width = THREAD.fabC.height = THREAD_S;
      drawThreadFabric(THREAD.fabC.getContext('2d'));
    }
    for(let y=0; y<THREAD_S; y+=4){
      const off = Math.sin(y*0.05 + THREAD.T*13) * 2.6 * THREAD.wrinkle * Math.sin(Math.PI*y/THREAD_S);
      ctx.drawImage(THREAD.fabC, 0, y, THREAD_S, 4, off, y, THREAD_S, 4);
    }
    THREAD.wrinkle = Math.max(0, THREAD.wrinkle - 0.0035);
  } else {
    if(!THREAD.fabC){
      THREAD.fabC = document.createElement('canvas');
      THREAD.fabC.width = THREAD.fabC.height = THREAD_S;
      drawThreadFabric(THREAD.fabC.getContext('2d'));
    }
    ctx.drawImage(THREAD.fabC, 0, 0);
  }
  // 完成金色涟漪（布料起伏余韵）
  if(THREAD.ripples && THREAD.ripples.length){
    THREAD.ripples.forEach(rp=>{
      if(rp.life <= 0) return;
      if(rp.r < 0) rp.r += 3.4;
      else rp.r += 3.4;
      rp.life -= 0.014;
      const al = Math.max(0, rp.life) * 0.55;
      ctx.strokeStyle = `rgba(240,214,138,${al})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.ellipse(260, 258, Math.abs(rp.r), Math.abs(rp.r)*0.8, 0, 0, Math.PI*2); ctx.stroke();
    });
    THREAD.ripples = THREAD.ripples.filter(rp=>rp.life > 0);
  }

  // 已缝绣线（双层凹凸 + 丝线流光）
  if(THREAD.stitched.length > 1){
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const path = ()=>{
      ctx.beginPath();
      ctx.moveTo(THREAD.stitched[0].x, THREAD.stitched[0].y);
      for(let i=1;i<THREAD.stitched.length;i++) ctx.lineTo(THREAD.stitched[i].x, THREAD.stitched[i].y);
    };
    // 织物凹陷阴影层
    ctx.strokeStyle = 'rgba(10,6,18,.6)'; ctx.lineWidth = 7;
    ctx.translate(1.2, 2); path(); ctx.stroke();
    ctx.translate(-1.2, -2);
    // 主线（随进度渐变彩线）
    const prog = THREAD.cur/Math.max(1, THREAD.guide.length);
    const hue = 340 - prog*160;
    ctx.strokeStyle = `hsl(${hue},68%,58%)`; ctx.lineWidth = 4.5;
    path(); ctx.stroke();
    // 高光层（凹凸感）
    ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.4;
    ctx.translate(-0.8, -1.4); path(); ctx.stroke();
    ctx.translate(0.8, 1.4);
    // 针脚刻痕
    ctx.strokeStyle = 'rgba(20,12,26,.5)'; ctx.lineWidth = 1;
    for(let i=3;i<THREAD.stitched.length;i+=4){
      const p0 = THREAD.stitched[i-1], p1 = THREAD.stitched[i];
      const dx = p1.x-p0.x, dy = p1.y-p0.y, d = Math.hypot(dx,dy)||1;
      ctx.beginPath();
      ctx.moveTo(p1.x-dy/d*3, p1.y+dx/d*3);
      ctx.lineTo(p1.x+dy/d*3, p1.y-dx/d*3);
      ctx.stroke();
    }
    ctx.restore();
    // 丝线高光斑点（布料漫反射高光 · 沿绣线游走）
    if(THREAD.stitched.length > 6){
      const gi = Math.floor((T*26) % THREAD.stitched.length);
      const gp = THREAD.stitched[gi];
      const gg = ctx.createRadialGradient(gp.x, gp.y-1, 0, gp.x, gp.y-1, 8);
      gg.addColorStop(0, 'rgba(255,255,255,.85)');
      gg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = gg;
      ctx.beginPath(); ctx.arc(gp.x, gp.y-1, 8, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }
  }

  // 引导点（未缝点呼吸脉冲 · 当前点高亮光环）
  THREAD.guide.forEach((g,i)=>{
    if(i < THREAD.cur) return;
    const isCur = i === THREAD.cur;
    const pulse = 0.5 + 0.5*Math.sin(T*4 + i*0.5);
    ctx.fillStyle = isCur ? '#F0D68A' : 'rgba(212,168,67,.4)';
    ctx.beginPath(); ctx.arc(g.x, g.y, isCur ? 4+pulse*2.5 : 2.5, 0, Math.PI*2); ctx.fill();
    if(isCur){
      ctx.strokeStyle = `rgba(240,214,138,${0.35+pulse*0.45})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(g.x, g.y, 12+pulse*5, 0, Math.PI*2); ctx.stroke();
    }
  });

  // 针 + 引导张力线（针随鼠标）
  if(THREAD.mouse && !THREAD.done){
    const m = THREAD.mouse;
    const last = THREAD.stitched[THREAD.stitched.length-1] || {x:260, y:258};
    ctx.setLineDash([4,5]);
    ctx.strokeStyle = 'rgba(240,214,138,.4)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(m.x, m.y); ctx.stroke();
    ctx.setLineDash([]);
    // 银针
    ctx.save();
    ctx.translate(m.x, m.y); ctx.rotate(T*1.4);
    ctx.strokeStyle = '#D8D8E0'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(13, 0); ctx.stroke();
    ctx.strokeStyle = '#8B1428'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(16.5, 0, 3.2, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
  }

  // 针线拖尾流光
  THREAD.trail.forEach(p=>{ p.life -= 0.05; });
  THREAD.trail = THREAD.trail.filter(p=>p.life > 0);
  for(let i=1;i<THREAD.trail.length;i++){
    const p0 = THREAD.trail[i-1], p1 = THREAD.trail[i];
    const hue = (T*90 + i*6) % 360;
    ctx.strokeStyle = `hsla(${hue},75%,66%,${p1.life*0.6})`;
    ctx.lineWidth = 1.5 + p1.life*2;
    ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
  }

  // 彩丝粒子
  THREAD.parts.forEach(p=>{
    p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.life -= 0.026;
  });
  THREAD.parts = THREAD.parts.filter(p=>p.life > 0);
  THREAD.parts.forEach(p=>{
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.c;
    ctx.fillRect(p.x, p.y, p.size, p.size+1);
  });
  ctx.globalAlpha = 1;

  if(THREAD.done){
    ctx.fillStyle = '#F0D68A'; ctx.font = 'bold 16px "Noto Serif SC",serif'; ctx.textAlign = 'center';
    ctx.fillText('✔ 绣 纹 已 成 · 可保存或同步皮影服饰', 260, THREAD_S-16);
  }
  THREAD.raf = requestAnimationFrame(threadLoop);
}

// 保存枕顶绣品卡片
function makeThreadCard(){
  // 强制绘制最终帧
  const snap = document.createElement('canvas');
  snap.width = snap.height = THREAD_S;
  const sc = snap.getContext('2d');
  const bg = sc.createLinearGradient(0,0,THREAD_S,THREAD_S);
  bg.addColorStop(0,'#141020'); bg.addColorStop(1,'#0f0c1a');
  sc.fillStyle = bg; sc.fillRect(0,0,THREAD_S,THREAD_S);
  drawThreadFabric(sc);
  const ctx0 = THREAD.ctx;
  THREAD.ctx = sc;
  // 重绘绣线（复用主循环绘制逻辑，锁定 mouse=null）
  const savedMouse = THREAD.mouse, savedOpen = THREAD.open;
  THREAD.mouse = null; THREAD.open = true;
  threadDrawStitches(sc);
  THREAD.mouse = savedMouse; THREAD.open = savedOpen;
  THREAD.ctx = ctx0;
  const card = document.createElement('canvas');
  card.width = 720; card.height = 940;
  const ctx = card.getContext('2d');
  const g = ctx.createLinearGradient(0,0,720,940);
  g.addColorStop(0,'#14102a'); g.addColorStop(.5,'#1c1436'); g.addColorStop(1,'#120d24');
  ctx.fillStyle = g; ctx.fillRect(0,0,720,940);
  ctx.strokeStyle = '#D4A843'; ctx.lineWidth = 6; ctx.strokeRect(22,22,676,896);
  ctx.lineWidth = 2; ctx.strokeRect(38,38,644,864);
  [[46,46],[674,46],[46,894],[674,894]].forEach(([x,y])=>{
    ctx.save(); ctx.translate(x,y);
    for(let i=0;i<3;i++){ ctx.strokeRect(-22+i*7,-22+i*7,44-i*14,44-i*14); }
    ctx.restore();
  });
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#F0D68A';
  ctx.font = '900 46px "Noto Serif SC",serif';
  ctx.shadowColor = 'rgba(212,168,67,.6)'; ctx.shadowBlur = 18;
  ctx.fillText('枕顶绣品 · 数字纪念卡', 360, 96);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(240,214,138,.75)';
  ctx.font = '22px "Noto Sans SC",sans-serif';
  ctx.fillText('辽韵三萃 · 满族刺绣走线工坊', 360, 148);
  ctx.drawImage(snap, 100, 190, 520, 520);
  const now = new Date();
  ctx.fillStyle = 'rgba(240,214,138,.85)';
  ctx.font = '20px "Noto Sans SC",sans-serif';
  ctx.fillText(`「${THREAD_PATS[THREAD.patIdx]}」走线绣成 · ${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日`, 360, 742);
  ctx.fillStyle = 'rgba(240,214,138,.6)';
  ctx.font = '17px "Noto Sans SC",sans-serif';
  ctx.fillText('先剪纸样 · 再依样施针 · 剪纸是刺绣的纹样母本', 360, 778);
  ctx.save();
  ctx.translate(360, 845); ctx.rotate(-0.06);
  ctx.fillStyle = '#C41E3A'; ctx.fillRect(-64, -32, 128, 64);
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3; ctx.strokeRect(-56, -24, 112, 48);
  ctx.fillStyle = '#FFF6E8'; ctx.font = '900 26px "Noto Serif SC",serif';
  ctx.fillText('辽韵三萃', 0, 2);
  ctx.restore();
  const a = document.createElement('a');
  a.download = '辽韵三萃-枕顶绣品纪念卡.png';
  a.href = card.toDataURL('image/png');
  a.click();
  goldBoom('枕顶绣品卡已生成 · 已开始下载保存');
}

// 抽出绣线绘制（供保存卡片复用）
function threadDrawStitches(ctx){
  if(THREAD.stitched.length < 2) return;
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const path = ()=>{
    ctx.beginPath();
    ctx.moveTo(THREAD.stitched[0].x, THREAD.stitched[0].y);
    for(let i=1;i<THREAD.stitched.length;i++) ctx.lineTo(THREAD.stitched[i].x, THREAD.stitched[i].y);
  };
  ctx.strokeStyle = 'rgba(10,6,18,.6)'; ctx.lineWidth = 7;
  ctx.translate(1.2, 2); path(); ctx.stroke();
  ctx.translate(-1.2, -2);
  const prog = 1;
  const hue = 340 - prog*160;
  ctx.strokeStyle = `hsl(${hue},68%,58%)`; ctx.lineWidth = 4.5;
  path(); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.4;
  ctx.translate(-0.8, -1.4); path(); ctx.stroke();
  ctx.restore();
}

// 一键同步：亲手绣纹 → 皮影服饰贴图（三非遗联动闭环）
function syncThreadToPuppet(){
  if(!THREAD.done || THREAD.stitched.length < 2){
    showToast('先沿引导点绣完一块纹样再同步');
    return;
  }
  // 绘制干净绣纹底图（透明底，仅绣线）
  const pat = document.createElement('canvas');
  pat.width = pat.height = 512;
  const pc = pat.getContext('2d');
  pc.save();
  pc.translate(256-260, 256-258);   // 坐标平移到画布中心
  pc.lineJoin = 'round'; pc.lineCap = 'round';
  const path = ()=>{
    pc.beginPath();
    pc.moveTo(THREAD.stitched[0].x, THREAD.stitched[0].y);
    for(let i=1;i<THREAD.stitched.length;i++) pc.lineTo(THREAD.stitched[i].x, THREAD.stitched[i].y);
  };
  pc.strokeStyle = 'rgba(10,6,18,.55)'; pc.lineWidth = 12;
  pc.translate(2, 3); path(); pc.stroke();
  pc.translate(-2, -3);
  pc.strokeStyle = 'hsl(300,68%,58%)'; pc.lineWidth = 8;
  path(); pc.stroke();
  pc.strokeStyle = 'rgba(255,255,255,.4)'; pc.lineWidth = 2.6;
  pc.translate(-1.4, -2.2); path(); pc.stroke();
  pc.restore();
  // 合成人偶贴图：皮影形 + 绣纹 source-atop（保持人偶轮廓）
  puppetObjects.forEach(p=>{
    const u = p.userData;
    if(u.type !== 'puppet') return;
    const tex = makeTexture((ctx,w,h)=>{
      drawPuppetFigure(ctx, w, h, u.figIndex);
      ctx.globalCompositeOperation = 'source-atop';
      ctx.globalAlpha = 0.88;
      ctx.drawImage(pat, 0, 0, w, h);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }, 256, 512);
    p.material.map = tex;
    p.material.needsUpdate = true;
    u.costumePulse = 1;
  });
  STATE.costumePattern = 'thread-custom';
  closeThread();
  gotoScene('puppet');
  goldBoom('三非遗联动 · 亲手绣纹已穿上皮影戏服！');
}

/* ============================================================
   游戏4 · 非遗纹样溯源挑战（拖拽答题 + 科普讲解 + 文化逻辑验证）
   ============================================================ */
const QUIZ = {inited:false, open:false, idx:0, score:0, picked:null, ghost:null, lock:false};

const QUIZ_ITEMS = [
  {name:'金团花纹', draw:'tuanhua', origin:'paper',
   why:'团花是三非遗共用的经典母题——最早由新宾满族剪纸剪出纸样，皮影匠人依样雕刻驴皮服饰，绣娘依样施针。剪纸是纹样母源。'},
  {name:'萨满神纹', draw:'shaman', origin:'paper',
   why:'萨满纹样最早见诸满族萨满祭祀剪纸：神帽、神衣、腰铃以红纸镂刻，悬于神杆沟通人神；后成为皮影神怪造型与图腾刺绣的粉本。'},
  {name:'枕顶花卉纹', draw:'flower', origin:'paper',
   why:'满族"比绣"习俗：姑娘先剪出花样纸样，绷于枕顶布面再依样施针——先有纸样后有绣品，剪纸是枕顶刺绣的纹样母本。'},
  {name:'连年有余鱼纹', draw:'fish', origin:'paper',
   why:'"连年有余"（莲花鲤鱼）是满族年俗剪纸的经典题材，谐音吉祥；皮影腰饰、刺绣荷包上的鱼纹皆源自这张红纸母样。'},
  {name:'打籽绣籽点纹', draw:'seed', origin:'emb',
   why:'打籽绣是满族刺绣特有针法：线结成籽、立体如雕。但籽点排出的团花轮廓，母本仍是剪纸花样——工艺是刺绣的，纹样源自剪纸。'},
  {name:'皮影镂空刀口', draw:'knife', origin:'puppet',
   why:'刮皮镂空是皮影雕刻特有工艺：数千刀刻出一个头像。但镂出的窗花式纹样设计大量借鉴剪纸——刀法是皮影的，图样源自剪纸。'},
];
const QUIZ_SLOTS = [
  {key:'puppet', ico:'🎭', name:'皮影戏台'},
  {key:'paper',  ico:'✂',  name:'剪纸展厅'},
  {key:'emb',    ico:'🪡', name:'刺绣展厅'},
];

function openQuiz(){
  document.getElementById('quiz-overlay').classList.add('show');
  QUIZ.open = true;
  QUIZ.idx = 0; QUIZ.score = 0; QUIZ.lock = false; QUIZ.picked = null;
  renderQuizQ();
}
function closeQuiz(){
  document.getElementById('quiz-overlay').classList.remove('show');
  QUIZ.open = false;
  if(QUIZ.ghost){ QUIZ.ghost.remove(); QUIZ.ghost = null; }
}

function drawQuizPattern(canvas, key){
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height, cx = w/2, cy = h/2;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = 'rgba(13,13,26,.6)'; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle = 'rgba(212,168,67,.4)'; ctx.lineWidth = 2;
  ctx.strokeRect(4,4,w-8,h-8);
  const r = w*0.3;
  try{
    if(key === 'tuanhua') MOTIFS[0].draw(ctx, cx, cy, r, '#F0D68A', '#E8455F');
    else if(key === 'shaman') MOTIFS[2].draw(ctx, cx, cy, r*1.1, '#F0D68A', '#E8455F');
    else if(key === 'flower') MOTIFS_PLUS[7].draw(ctx, cx, cy, r, '#F0D68A', '#7EC8A9');
    else if(key === 'fish') MOTIFS[3].draw(ctx, cx, cy, r, '#F0D68A', '#E8455F');
    else if(key === 'seed'){
      ctx.strokeStyle = '#F0D68A'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, r*0.9, 0, Math.PI*2); ctx.stroke();
      for(let ring=0; ring<3; ring++){
        const rr = r*(0.3+ring*0.3);
        for(let i=0;i<10;i++){
          const a = i*Math.PI/5 + ring*0.3;
          ctx.fillStyle = ring%2 ? '#E8455F' : '#F0D68A';
          ctx.beginPath(); ctx.arc(cx+Math.cos(a)*rr, cy+Math.sin(a)*rr, 3.4, 0, Math.PI*2); ctx.fill();
          ctx.strokeStyle = 'rgba(20,12,26,.6)'; ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    } else if(key === 'knife'){
      // 皮影头饰轮廓 + 镂空刀口
      ctx.fillStyle = 'rgba(92,26,27,.9)';
      ctx.beginPath();
      ctx.moveTo(cx-22, cy+40); ctx.lineTo(cx-30, cy-6);
      ctx.arc(cx, cy-6, 30, Math.PI, 0);
      ctx.lineTo(cx+22, cy+40); ctx.closePath(); ctx.fill();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath(); ctx.arc(cx-10, cy-12, 7, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+12, cy-4, 5, 0, Math.PI*2); ctx.fill();
      for(let i=0;i<5;i++){
        ctx.beginPath(); ctx.ellipse(cx, cy+18, 14, 4-i*0.6, 0, 0, Math.PI*2); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#F0D68A'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx-22, cy+40); ctx.lineTo(cx-30, cy-6);
      ctx.arc(cx, cy-6, 30, Math.PI, 0); ctx.lineTo(cx+22, cy+40); ctx.stroke();
    }
  }catch(e){}
}

function renderQuizQ(){
  const stage = document.getElementById('quiz-stage');
  const item = QUIZ_ITEMS[QUIZ.idx];
  document.getElementById('quiz-progress').textContent = `第 ${QUIZ.idx+1}/${QUIZ_ITEMS.length} 题`;
  document.getElementById('quiz-score').textContent = `得分 ${QUIZ.score}`;
  stage.innerHTML = '';
  // 题干
  const q = document.createElement('div');
  q.className = 'quiz-q';
  q.innerHTML = `纹样 <b>「${item.name}」</b> 最早起源于哪一项辽宁非遗？拖动卡片匹配`;
  stage.appendChild(q);
  // 纹样卡 + 槽位
  const row = document.createElement('div');
  row.className = 'quiz-row';
  const card = document.createElement('div');
  card.className = 'quiz-card';
  const cv = document.createElement('canvas');
  cv.width = cv.height = 110;
  drawQuizPattern(cv, item.draw);
  card.appendChild(cv);
  const cap = document.createElement('small');
  cap.textContent = item.name + ' · 拖我';
  card.appendChild(cap);
  row.appendChild(card);
  const slots = document.createElement('div');
  slots.className = 'quiz-slots';
  QUIZ_SLOTS.forEach(s=>{
    const el = document.createElement('div');
    el.className = 'quiz-slot';
    el.dataset.key = s.key;
    el.innerHTML = `<span class="slot-ico">${s.ico}</span><span class="slot-name">${s.name}</span>`;
    el.addEventListener('click', ()=>{
      if(QUIZ.picked && !QUIZ.lock) answerQuiz(el);
    });
    slots.appendChild(el);
  });
  row.appendChild(slots);
  stage.appendChild(row);
  // 反馈区
  const fb = document.createElement('div');
  fb.className = 'quiz-feedback';
  fb.id = 'quiz-feedback';
  stage.appendChild(fb);
  bindQuizDrag(card, cv);
}

function bindQuizDrag(card, cv){
  card.addEventListener('pointerdown', e=>{
    if(QUIZ.lock) return;
    QUIZ.picked = card;
    card.classList.add('picked');
    // 拖拽幽灵卡
    const ghost = document.createElement('div');
    ghost.className = 'quiz-card drag-ghost';
    const g = document.createElement('canvas');
    g.width = cv.width; g.height = cv.height;
    g.getContext('2d').drawImage(cv, 0, 0);
    ghost.appendChild(g);
    document.body.appendChild(ghost);
    ghost.style.left = e.clientX + 'px';
    ghost.style.top = e.clientY + 'px';
    QUIZ.ghost = ghost;
    e.preventDefault();
  });
  card.addEventListener('click', ()=>{
    // 点击选中（配合点击槽位）
    if(!QUIZ.lock){
      document.querySelectorAll('.quiz-card').forEach(c=>c.classList.remove('picked'));
      card.classList.add('picked');
      QUIZ.picked = card;
    }
  });
}

document.addEventListener('pointermove', e=>{
  if(!QUIZ.ghost) return;
  QUIZ.ghost.style.left = e.clientX + 'px';
  QUIZ.ghost.style.top = e.clientY + 'px';
  document.querySelectorAll('.quiz-slot').forEach(s=>{
    const r = s.getBoundingClientRect();
    const over = e.clientX>r.left && e.clientX<r.right && e.clientY>r.top && e.clientY<r.bottom;
    s.classList.toggle('over', over);
  });
});

document.addEventListener('pointerup', e=>{
  if(!QUIZ.ghost) return;
  let hit = null;
  document.querySelectorAll('.quiz-slot').forEach(s=>{
    const r = s.getBoundingClientRect();
    if(e.clientX>r.left && e.clientX<r.right && e.clientY>r.top && e.clientY<r.bottom) hit = s;
  });
  QUIZ.ghost.remove(); QUIZ.ghost = null;
  if(hit && QUIZ.picked && !QUIZ.lock) answerQuiz(hit);
});

function answerQuiz(slot){
  const item = QUIZ_ITEMS[QUIZ.idx];
  const fb = document.getElementById('quiz-feedback');
  const right = slot.dataset.key === item.origin;
  QUIZ.lock = true;
  if(right){
    slot.classList.add('right');
    QUIZ.score += 10;
    document.getElementById('quiz-score').textContent = `得分 ${QUIZ.score}`;
    fb.innerHTML = `<b style="color:#7EC8A9">✔ 答对 +10！</b>${item.why}`;
    goldBoom(`溯源成功 · 「${item.name}」源自${QUIZ_SLOTS.find(s=>s.key===item.origin).name}`);
    // 探索加成：答对一题计入一次探索提醒
    updateExplore();
  } else {
    slot.classList.add('wrong');
    fb.innerHTML = `<b style="color:#FF5252">✘ 再想想…</b>${item.why}`;
    showToast('答错不要紧 · 溯源讲解已给出');
  }
  fb.classList.add('show');
  setTimeout(()=>{
    slot.classList.remove('right','wrong');
    fb.classList.remove('show');
    QUIZ.picked = null; QUIZ.lock = false;
    QUIZ.idx++;
    if(QUIZ.idx >= QUIZ_ITEMS.length) quizFinish();
    else renderQuizQ();
  }, right ? 2600 : 3400);
}

function quizFinish(){
  unlockCode('shuo');
  goldBoom(`溯源挑战完成 · 得分 ${QUIZ.score}！`);
  setTimeout(()=>{
    showModal({
      title:'成就 · 纹样溯源大师', sub:'验证"剪纸是纹样母源"的文化逻辑',
      body:`<p>本挑战 6 道纹样题中，<span class="highlight">4 道母源指向满族剪纸</span>：团花纹、萨满神纹、枕顶花卉、连年有余——皆"先剪出纸样，再雕于驴皮、绣于织物"。</p>
      <p>打籽绣与皮影镂空虽是<span class="highlight">刺绣、皮影的特有工艺</span>，但纹样图式仍取法剪纸母本。这正是辽宁非遗的完整链条：<span class="highlight">剪纸是纹样源头，皮影是动态演绎，刺绣是织物定格</span>。</p>
      <p>你的得分：<b class="highlight">${QUIZ.score} / ${QUIZ_ITEMS.length*10}</b> ${QUIZ.score>=50?'· 溯源大师！':'· 再挑战一次，冲击满分！'}</p>`
    });
  }, 900);
}

/* ============================================================
   【核心交互】纹样母体 · 载体流转台（一主两辅架构核心）
   剪纸=纹样母体 → 一键流转映射 皮影皮偶雕刻 / 刺绣织物纹样
   流转链路：纹样诞生(剪纸) → 皮影演绎 → 刺绣织造
   形态可视化：同一母题以 红纸镂刻/驴皮镂雕/织物走线 三态渲染
   ============================================================ */
const FLOW = { inited:false, morphing:false, raf:0 };
const FLOW_NAMES = ['团花', '福字', '萨满', '连年有余'];
const FLOW_CARRIERS = [
  {key:'paper',  name:'剪纸 · 纸', tag:'新宾剪纸 · 红纸镂刻'},
  {key:'puppet', name:'皮影 · 皮', tag:'岫岩皮影 · 驴皮镂雕'},
  {key:'emb',    name:'刺绣 · 布', tag:'辽阳刺绣 · 织物走线'},
];
// MOTIFS 索引 → 走线工坊 THREAD_PATS 索引（团花/福字/萨满/连年有余 → 团花缠枝/萨满神纹/连年有鱼/福字绵长）
const FLOW_THREAD_MAP = [0, 3, 1, 2];

function openFlow(){
  document.getElementById('flow-overlay').classList.add('show');
  if(!FLOW.inited){ buildFlowUI(); FLOW.inited = true; }
  syncFlowSelection();
  drawFlowPreviews();
  renderFlowChain();
}
function closeFlow(){
  document.getElementById('flow-overlay').classList.remove('show');
}

// ===== 底栏载体变体按钮置灰逻辑（无活动纹样时禁用） =====
function updateBottomBarState(){
  const has = STATE.flow.sel >= 0;
  ['btn-drama','btn-weave'].forEach(id=>{
    const b = document.getElementById(id);
    if(b) b.classList.toggle('ctrl-disabled', !has);
  });
}
// 皮影剧目演绎（辅）：复用剪纸纹样生成皮偶 → 开演剧目
function playPuppetDrama(){
  if(STATE.flow.sel < 0){
    showToast('请先完成刻绘剪纸或选定一款剪纸纹样');
    return;
  }
  if(STATE.switching) return;
  const pat = STATE.flow.sel;
  applyCostume(pat);
  STATE.flow.puppet[pat] = true;
  switchScene('puppet', ()=>{
    showToast(`皮影演绎 · 「${FLOW_NAMES[pat]}」纹样映射皮偶 · 同源剧目开演`);
    const p = puppetObjects.find(o=>o.userData.type === 'puppet');
    if(p && p.userData.animState !== 'perform'){
      p.userData.animState = 'perform';
      p.userData.costumePulse = 1;
      activateStoryPanel(p.userData.role);
      showKnowledge(STORY_DATA[p.userData.role]);
    }
    checkFlowComplete(pat);
  });
}
// 刺绣走线（辅）：复用剪纸纹样 → 打开走线工坊
function playEmbroideryWeave(){
  if(STATE.flow.sel < 0){
    showToast('请先完成刻绘剪纸或选定一款剪纸纹样');
    return;
  }
  if(STATE.switching) return;
  const pat = STATE.flow.sel;
  applyEmbroidery(pat);
  STATE.flow.emb[pat] = true;
  switchScene('emb', ()=>{
    openThread();
    showToast(`刺绣走线 · 「${FLOW_NAMES[pat]}」纹样轮廓同步 · 沿金线穿针走线`);
    checkFlowComplete(pat);
  });
}


// 构建面板：母体纹样选择卡 + 三载体形态预览
function buildFlowUI(){
  const mats = document.getElementById('flow-mats');
  mats.innerHTML = '';
  MOTIFS.forEach((m,i)=>{
    const card = document.createElement('div');
    card.className = 'flow-mat-card';
    card.id = 'flow-mat-' + i;
    card.onclick = ()=>selectFlowPattern(i);
    const cv = document.createElement('canvas'); cv.width = cv.height = 76;
    try{ m.draw(cv.getContext('2d'), 38, 38, 27, '#F0D68A', '#E8455F'); }catch(e){}
    card.appendChild(cv);
    const b = document.createElement('b'); b.textContent = FLOW_NAMES[i]; card.appendChild(b);
    mats.appendChild(card);
  });
  const prevs = document.getElementById('flow-prevs');
  prevs.innerHTML = '';
  FLOW_CARRIERS.forEach(c=>{
    const cell = document.createElement('div'); cell.className = 'flow-prev-cell';
    const cv = document.createElement('canvas'); cv.width = cv.height = 150;
    cv.id = 'flow-cv-' + c.key;
    cell.appendChild(cv);
    const b = document.createElement('b'); b.textContent = c.name; cell.appendChild(b);
    const s = document.createElement('small'); s.textContent = c.tag; cell.appendChild(s);
    prevs.appendChild(cell);
  });
}

// 选中母体纹样（与场景内剪纸点击/刻绘完成互相同步）
function selectFlowPattern(i){
  STATE.flow.sel = i;
  syncFlowSelection();
  drawFlowPreviews();
  renderFlowChain();
  updateBottomBarState();
  showToast(`已选母体纹样「${FLOW_NAMES[i]}」 · 可一键流转到皮影或刺绣载体`);
}
function syncFlowSelection(){
  MOTIFS.forEach((_,i)=>{
    const el = document.getElementById('flow-mat-' + i);
    if(el) el.classList.toggle('sel', i === STATE.flow.sel);
  });
}

// 三载体形态预览：同一母题在 纸 / 皮 / 布 上的工艺形态变化
function drawFlowPreviews(){
  const sel = STATE.flow.sel;
  FLOW_CARRIERS.forEach(c=>{
    const cv = document.getElementById('flow-cv-' + c.key);
    if(!cv) return;
    const x = cv.getContext('2d'), S = cv.width, cx = S/2, cy = S/2;
    x.clearRect(0, 0, S, S);
    x.save();
    x.beginPath(); x.arc(cx, cy, S/2-3, 0, Math.PI*2); x.clip();
    if(sel < 0){
      x.fillStyle = '#161221'; x.fillRect(0, 0, S, S);
      x.fillStyle = 'rgba(240,214,138,.4)';
      x.font = '13px "Noto Sans SC",sans-serif'; x.textAlign = 'center';
      x.fillText('先选中上方母体纹样', cx, cy);
      x.restore(); return;
    }
    const m = MOTIFS[sel];
    if(c.key === 'paper'){
      // 红纸镂刻：红纸底 + 纸纤维 + 白色镂空纹
      const g = x.createLinearGradient(0, 0, S, S);
      g.addColorStop(0, '#C41E3A'); g.addColorStop(1, '#A81630');
      x.fillStyle = g; x.fillRect(0, 0, S, S);
      for(let i = 0; i < 140; i++){
        x.fillStyle = `rgba(255,255,255,${Math.random()*0.06})`;
        x.fillRect(Math.random()*S, Math.random()*S, 1.4, 1.4);
      }
      m.draw(x, cx, cy, S*0.30, 'rgba(255,244,228,.95)', 'rgba(255,244,228,.55)');
    } else if(c.key === 'puppet'){
      // 驴皮镂雕：半透驴皮底 + 深褐雕刻线 + 关节钉 + 透光晕
      const g = x.createLinearGradient(0, 0, S, S);
      g.addColorStop(0, '#E8C08A'); g.addColorStop(1, '#C89355');
      x.fillStyle = g; x.fillRect(0, 0, S, S);
      const lg = x.createRadialGradient(cx, cy, 10, cx, cy, S/2);
      lg.addColorStop(0, 'rgba(255,240,200,.5)'); lg.addColorStop(1, 'rgba(120,70,20,.18)');
      x.fillStyle = lg; x.fillRect(0, 0, S, S);
      m.draw(x, cx, cy, S*0.30, '#5A3418', '#7A4A20');
      [[cx, S*0.16],[S*0.22, cy],[S*0.78, cy],[cx, S*0.84]].forEach(([px, py])=>{
        x.setLineDash([]);
        x.fillStyle = '#3A2410'; x.beginPath(); x.arc(px, py, 3.6, 0, Math.PI*2); x.fill();
        x.fillStyle = '#F0D68A'; x.beginPath(); x.arc(px, py, 1.4, 0, Math.PI*2); x.fill();
      });
    } else {
      // 织物走线：暗织物底 + 编织纹 + 金线针脚纹样
      x.fillStyle = '#221530'; x.fillRect(0, 0, S, S);
      x.strokeStyle = 'rgba(212,168,67,.10)'; x.lineWidth = 1;
      for(let i = 6; i < S; i += 9){
        x.beginPath(); x.moveTo(i, 0); x.lineTo(i, S); x.stroke();
        x.beginPath(); x.moveTo(0, i); x.lineTo(S, i); x.stroke();
      }
      const lg = x.createRadialGradient(cx, cy, 8, cx, cy, S/2);
      lg.addColorStop(0, 'rgba(232,69,95,.16)'); lg.addColorStop(1, 'rgba(0,0,0,.3)');
      x.fillStyle = lg; x.fillRect(0, 0, S, S);
      m.draw(x, cx, cy, S*0.30, '#F0D68A', '#E8455F');
    }
    x.restore();
    // 圆形金边
    x.setLineDash([]);
    x.strokeStyle = 'rgba(212,168,67,.65)'; x.lineWidth = 2;
    x.beginPath(); x.arc(cx, cy, S/2-3, 0, Math.PI*2); x.stroke();
  });
}

// 流转链路徽章：纹样诞生 → 皮影演绎 → 刺绣织造
function renderFlowChain(){
  const el = document.getElementById('flow-chain');
  const sel = STATE.flow.sel;
  const born = sel >= 0 && STATE.flow.born[sel];
  const pp = sel >= 0 && STATE.flow.puppet[sel];
  const eb = sel >= 0 && STATE.flow.emb[sel];
  const steps = [
    {on:born, t:'① 纹样诞生', s:'剪纸刻绘 · 母题成型'},
    {on:pp,   t:'② 皮影演绎', s:'同纹映射皮偶开演'},
    {on:eb,   t:'③ 刺绣织造', s:'同纹织物走线定格'},
  ];
  el.innerHTML = steps.map(s=>
    `<span class="flow-step${s.on?' on':''}">${s.t}<small>${s.on ? s.s + ' ✔' : s.s}</small></span>`
  ).join('<i class="flow-arrow">➤</i>');
  const tip = document.getElementById('flow-tip');
  if(tip){
    if(sel < 0) tip.textContent = '请先选中一款母体纹样';
    else if(!born) tip.textContent = `「${FLOW_NAMES[sel]}」尚未诞生 · 回剪纸展厅点击该纹样剪纸或完成刻绘`;
    else tip.textContent = `「${FLOW_NAMES[sel]}」流转链路 ${[born,pp,eb].filter(Boolean).length}/3 步 · 集齐达成"一源三态"`;
  }
}

// 同源知识讲解（三者纹样同源、民俗同根）
function showFlowKnowledge(){
  showKnowledge({title:'一源三态 · 纹样为何同源', sub:'剪纸为底稿 · 皮影刺绣输出图样',
    body:`<p>新宾剪纸、岫岩皮影、辽阳刺绣根植于<span class="highlight">同一片满族民俗土壤</span>，共用团花、福字、萨满神纹、连年有余等<span class="highlight">同源民俗纹样</span>。</p>
    <p>历史上手艺人<span class="highlight">图样互相借鉴流转</span>：剪纸艺人的纸样是皮影雕镂的"底稿"，也是刺绣施针的"花样母本"——同一团花母题，<span class="highlight">纸上可剪、皮上可雕、布上可绣</span>。</p>
    <p>本项目据此确立<span class="highlight">"一主两辅"</span>架构：剪纸为纹样母体（主核心），皮影、刺绣为同源纹样的载体变体（辅助模块），演示一套纹样如何在三种载体中演变出三种辽宁非遗技艺。</p>`});
}

// 一键流转：形态变化可视化 → 三幕式转场 → 到达后自动映射开演/走针
function flowTo(target){
  if(STATE.flow.sel < 0){ showToast('请先选中一款母体纹样'); return; }
  if(STATE.switching || FLOW.morphing) return;
  const pat = STATE.flow.sel;
  closeFlow();
  playFlowMorph(target, ()=>{
    if(target === 'puppet'){
      applyCostume(pat);
      STATE.flow.puppet[pat] = true;
      switchScene('puppet', ()=>{
        showToast(`纹样流转 · 「${FLOW_NAMES[pat]}」已映射皮影皮偶 · 同源剧目开演`);
        const p = puppetObjects.find(o=>o.userData.type === 'puppet');
        if(p && p.userData.animState !== 'perform'){
          p.userData.animState = 'perform';
          p.userData.costumePulse = 1;
          activateStoryPanel(p.userData.role);
          showKnowledge(STORY_DATA[p.userData.role]);
        }
        checkFlowComplete(pat);
      });
    } else {
      applyEmbroidery(pat);
      STATE.flow.emb[pat] = true;
      switchScene('emb', ()=>{
        showToast(`纹样流转 · 「${FLOW_NAMES[pat]}」已映射刺绣织物 · 金针沿纹走线`);
        const tgt = embObjects.find(o=>o.userData.kind === 'totem') ||
                    embObjects.find(o=>o.userData.type === 'embroidery');
        if(tgt) playNeedleAnim(tgt);
        checkFlowComplete(pat);
      });
    }
  });
}

// 链路完成 → 解锁「一源三态」纹样密码
function checkFlowComplete(pat){
  const f = STATE.flow;
  if(f.born[pat] && f.puppet[pat] && f.emb[pat]){
    unlockCode('flow');
    goldBoom(`一源三态达成 · 「${FLOW_NAMES[pat]}」贯穿纸、皮、布三载体！`);
  }
}

// 形态流转特效：母题由红纸镂刻 → 目标载体工艺形态 渐变演绎
// ★ 纹样粒子流转引擎：母题拆解 → 数千金红粒子漩涡迁移 → 载体轮廓重组
function playFlowMorph(target, done){
  const wrap = document.getElementById('morph-overlay');
  const cv = document.getElementById('morph-canvas');
  const cap = document.getElementById('morph-cap');
  const x = cv.getContext('2d');
  const W = cv.width, H = cv.height, cx = W/2, cy = H/2;
  const sel = STATE.flow.sel, m = MOTIFS[sel];
  const toName = target === 'puppet' ? '驴皮镂雕' : '织物走线';
  cap.textContent = `「${FLOW_NAMES[sel]}」纹样 · 红纸镂刻 → ${toName}`;
  FLOW.morphing = true;
  wrap.classList.add('show');
  const t0 = performance.now(), DUR = 2500;

  // —— 粒子采样：源轮廓 & 目标轮廓（同一母题，不同载体配色） ——
  const SAMP = 132;
  const R0 = Math.min(W, H) * 0.42;
  const K = (R0 * 0.62) / (SAMP * 0.30);
  const pts = sampleMotifPoints((c,px,py,r,c1,c2)=>m.draw(c,px,py,r,c1,c2), SAMP, 2, 860);
  const P = pts.map((p,i)=>{
    const a = Math.random()*Math.PI*2;
    const tp = pts[(i*7 + 13) % pts.length];
    return {
      sx: cx + (p.x - SAMP/2)*K,  sy: cy + (p.y - SAMP/2)*K,
      tx: cx + (tp.x - SAMP/2)*K, ty: cy + (tp.y - SAMP/2)*K,
      wx: cx + Math.cos(a)*(56 + Math.random()*100),
      wy: cy + Math.sin(a)*(56 + Math.random()*100),
      ph: Math.random()*Math.PI*2, sz: 1.1 + Math.random()*2.2,
      col: target === 'puppet'
        ? (Math.random() < 0.6 ? '240,214,138' : '226,178,110')
        : (Math.random() < 0.42 ? '240,214,138' : (Math.random() < 0.5 ? '232,69,95' : '126,200,169')),
    };
  });

  cancelAnimationFrame(FLOW.raf);
  (function frame(now){
    const t = Math.min(1, (now - t0) / DUR);
    x.clearRect(0, 0, W, H);
    const R = Math.min(W, H) * 0.42;
    // 底形态（红纸镂刻）→ 目标形态（皮/布），中段交叉渐变
    const split = target === 'puppet' ? 0.5 : 0.42;
    x.save(); x.translate(cx, cy); x.rotate(t * 0.6); x.translate(-cx, -cy);
    if(t < split + 0.18){
      x.save(); x.globalAlpha = Math.min(1, (split + 0.18 - t) / 0.18) * 0.85;
      x.beginPath(); x.arc(cx, cy, R, 0, Math.PI*2); x.clip();
      x.fillStyle = '#C41E3A'; x.fillRect(cx-R, cy-R, R*2, R*2);
      m.draw(x, cx, cy, R*0.62, 'rgba(255,244,228,.95)', 'rgba(255,244,228,.5)');
      x.restore();
    }
    if(t > split - 0.18){
      x.save(); x.globalAlpha = Math.min(1, (t - (split - 0.18)) / 0.18);
      x.beginPath(); x.arc(cx, cy, R, 0, Math.PI*2); x.clip();
      if(target === 'puppet'){
        const g = x.createLinearGradient(cx-R, cy-R, cx+R, cy+R);
        g.addColorStop(0, '#E8C08A'); g.addColorStop(1, '#C89355');
        x.fillStyle = g; x.fillRect(cx-R, cy-R, R*2, R*2);
        m.draw(x, cx, cy, R*0.62, '#5A3418', '#7A4A20');
        [[cx, cy-R*0.72],[cx-R*0.72, cy],[cx+R*0.72, cy],[cx, cy+R*0.72]].forEach(([px, py])=>{
          x.fillStyle = '#3A2410'; x.beginPath(); x.arc(px, py, 6, 0, Math.PI*2); x.fill();
          x.fillStyle = '#F0D68A'; x.beginPath(); x.arc(px, py, 2.2, 0, Math.PI*2); x.fill();
        });
      } else {
        x.fillStyle = '#221530'; x.fillRect(cx-R, cy-R, R*2, R*2);
        x.strokeStyle = 'rgba(212,168,67,.14)'; x.lineWidth = 1;
        for(let i = 6; i < R*2; i += 9){
          x.beginPath(); x.moveTo(cx-R+i, cy-R); x.lineTo(cx-R+i, cy+R); x.stroke();
          x.beginPath(); x.moveTo(cx-R, cy-R+i); x.lineTo(cx+R, cy-R+i); x.stroke();
        }
        m.draw(x, cx, cy, R*0.62, '#F0D68A', '#E8455F');
      }
      x.restore();
    }
    x.restore();
    // ===== 粒子层：拆解(0-0.3) → 漩涡迁移(0.3-0.62) → 载体重组(0.62-1) =====
    x.save();
    x.globalCompositeOperation = 'lighter';
    const rot = t * 0.6, cosR = Math.cos(rot), sinR = Math.sin(rot);
    const shake = t < 0.3 ? t / 0.3 : 1;
    for(let i=0;i<P.length;i++){
      const p = P[i];
      let px, py, al;
      if(t < 0.32){                       // ① 源形态碎裂抖动
        const j = (0.32 - t) * 7;
        px = p.sx + Math.sin(p.ph + t*22)*j;
        py = p.sy + Math.cos(p.ph*1.7 + t*19)*j;
        al = 0.9;
      } else if(t < 0.62){                // ② 漩涡迁移（工艺流）
        const k = (t - 0.32) / 0.30, e = k*k*(3-2*k);
        const mx = p.sx + (p.wx - p.sx)*e, my = p.sy + (p.wy - p.sy)*e;
        const ang = Math.sin(p.ph + k*7) * 0.55 * (1-k);
        px = cx + (mx-cx)*Math.cos(ang) - (my-cy)*Math.sin(ang);
        py = cy + (mx-cx)*Math.sin(ang) + (my-cy)*Math.cos(ang);
        al = 0.95;
      } else {                            // ③ 目标轮廓重组
        const k = (t - 0.62) / 0.38, e = 1 - Math.pow(1-k, 3);
        px = p.wx + (p.tx - p.wx)*e;
        py = p.wy + (p.ty - p.wy)*e;
        al = 1 - k*0.6;
      }
      // 与形态层同速旋转
      const rx = px - cx, ry = py - cy;
      const fx2 = cx + rx*cosR - ry*sinR, fy2 = cy + rx*sinR + ry*cosR;
      x.globalAlpha = Math.max(0, al * (0.55 + 0.45*Math.sin(p.ph + t*26)));
      x.fillStyle = `rgba(${p.col},1)`;
      x.beginPath(); x.arc(fx2, fy2, p.sz*(0.7 + shake*0.5), 0, Math.PI*2); x.fill();
    }
    x.restore(); x.globalAlpha = 1;
    // 圆形金边 + 扫光
    x.setLineDash([]);
    x.strokeStyle = 'rgba(212,168,67,.8)'; x.lineWidth = 3;
    x.beginPath(); x.arc(cx, cy, R, 0, Math.PI*2); x.stroke();
    const sy = cy - R + t * R * 2;
    const sg = x.createLinearGradient(0, sy-26, 0, sy+26);
    sg.addColorStop(0, 'rgba(240,214,138,0)');
    sg.addColorStop(.5, `rgba(240,214,138,${0.5 * Math.sin(t * Math.PI)})`);
    sg.addColorStop(1, 'rgba(240,214,138,0)');
    x.fillStyle = sg; x.fillRect(cx-R, sy-26, R*2, 52);
    if(t < 1){ FLOW.raf = requestAnimationFrame(frame); }
    else {
      setTimeout(()=>{
        wrap.classList.remove('show');
        FLOW.morphing = false;
        done();
      }, 320);
    }
  })(t0);
}

/* ============================================================
   创新实验室 · 十大顶级创新（AI生成/时序演变/四季/声光频谱/
   文物修复/拓扑映射/电影运镜/视差叠层/织物物理/纹样密码册）
   ============================================================ */
const LAB = {
  era:-1, season:-1, cinema:true, parallax:true, audioReactive:true,
  analyser:null, freqData:null, lights:[],
  genCv:null, genImg:null, genParts:[], genSweep:-1, genT:0, genRaf:0,
  restCv:null, restKind:'paper', restClean:null, restDmg:null, restHoles:[],
  restDown:false, restParts:[], restRaf:0, restT:0,
  topoOpen:false, topoT:0, topoRaf:0,
  seasonPts:null, seasonSprite:null,
  cloth:null, ray:null, ptr:new THREE.Vector2(-9,-9), clothDown:false,
  codes:new Set(),
};
const CODE_DEFS = [
  {id:'pin',   name:'拼窗巧手', motif:0, how:'完成「拼窗花」'},
  {id:'ying',  name:'影人操纵', motif:2, how:'皮影操纵完成抬手+转身'},
  {id:'ke',    name:'母源刻刀', motif:1, how:'完成剪纸刻绘镂空'},
  {id:'xian',  name:'一针一线', motif:3, how:'走线工坊绣完枕顶'},
  {id:'shuo',  name:'溯源之眼', motif:0, how:'纹样溯源挑战通关'},
  {id:'xiu',   name:'绣样拼贴', motif:7, how:'保存绣样拼贴作品'},
  {id:'ai',    name:'智能纹样', motif:3, how:'AI生成纹样并应用'},
  {id:'era',   name:'时光旅行', motif:2, how:'时序演变一键换代'},
  {id:'season',name:'四季轮转', motif:7, how:'开启四季辽韵氛围'},
  {id:'fix',   name:'文物医师', motif:1, how:'修复一件非遗文物'},
  {id:'topo',  name:'曲面映射', motif:0, how:'体验拓扑曲面映射'},
  {id:'sound', name:'声光共振', motif:3, how:'开启声光频谱联动'},
  {id:'flow',  name:'一源三态', motif:0, how:'完成纹样母体三载体流转链路'},
  {id:'pingtu',  name:'纹样复原', motif:1, how:'「纹样溯源拼图」复原一款民俗纹样'},
  {id:'juchang', name:'小剧场班主', motif:2, how:'「皮影小剧场」排演短剧并生成海报'},
  {id:'xiuweng', name:'闯关绣娘', motif:3, how:'「绣纹闯关」通关解锁高级色板'},
];
function unlockCode(id){
  if(LAB.codes.has(id)) return;
  const d = CODE_DEFS.find(c=>c.id===id);
  if(!d) return;
  LAB.codes.add(id);
  goldBoom(`解锁纹样密码 · 「${d.name}」`);
  const badge = document.getElementById('lab-badge');
  if(badge) badge.textContent = `${LAB.codes.size}/${CODE_DEFS.length}`;
}
// 纹样统一取用（0-3 基础，4+ 扩展盘）
function motifDraw(i){
  const src = i < MOTIFS.length ? MOTIFS : MOTIFS_PLUS;
  return src[i] || MOTIFS[0];
}
// AI创作/修复文物 入藏展柜的知识条目
PROP_KNOWLEDGE.genArt = {title:'用户创作数字藏品', sub:'AI纹样生成 / 文物修复成果',
  body:`<p>这件展品来自<span class="highlight">你的亲手创作</span>：或是上传辽宁风景照片后由轮廓提取算法生成的专属满族剪纸纹样，或是涂抹修复完成的数字文物。</p>
  <p>现实素材 → 传统纹样 → 三展厅实时可视化，正是<span class="highlight">"AI+非遗数字化"</span>的创作闭环。</p>`};

// ---------- 公共：灯光捕获 / 换色 ----------
function tintLights(hex){
  LAB.lights.forEach(L=>{ try{ L.l.color.set(hex); }catch(e){} });
}

// ---------- 公共：纹样贴皮影（复用服饰合成管线） ----------
function applyTexToPuppets(patCanvas, alpha=0.88){
  puppetObjects.forEach(p=>{
    const u = p.userData;
    if(u.type !== 'puppet') return;
    p.material.map = makeTexture((ctx,w,h)=>{
      drawPuppetFigure(ctx, w, h, u.figIndex||0);
      ctx.globalCompositeOperation = 'source-atop';
      ctx.globalAlpha = alpha;
      ctx.drawImage(patCanvas, 0, 0, w, h);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }, 256, 512);
    p.material.needsUpdate = true;
    u.costumePulse = 1;
  });
}

// ---------- 初始化 ----------
function initLab(){
  // 捕获灯光（声光联动 / 时代 / 四季换色）
  scene.traverse(o=>{ if(o.isLight) LAB.lights.push({l:o, i:o.intensity, c:o.color.clone()}); });
  // 视差叠层：前景窗花剪影（运行时生成，零图片依赖）
  (function buildFg(){
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 640;
    const x = c.getContext('2d');
    x.strokeStyle = 'rgba(10,6,14,0.85)'; x.fillStyle = 'rgba(10,6,14,0.85)';
    const corner = (cx, cy, rot)=>{
      x.save(); x.translate(cx, cy); x.rotate(rot);
      for(let i=0;i<3;i++){ const s=90-i*26; x.lineWidth=5; x.strokeRect(-s/2,-s/2,s,s); }
      x.beginPath();
      for(let a=0;a<Math.PI*2;a+=Math.PI/8){
        const r = 62 + (a*8/Math.PI%2)*13;
        x.lineTo(Math.cos(a)*r, Math.sin(a)*r);
      }
      x.closePath(); x.fill();
      x.restore();
    };
    corner(74,74,Math.PI/4); corner(950,74,-Math.PI/2+Math.PI/4);
    corner(74,566,-Math.PI/4); corner(950,566,Math.PI/4);
    // 顶部悬垂挂签剪影
    for(let i=0;i<7;i++){
      const px = 150+i*120;
      x.fillRect(px-2, 0, 4, 46);
      x.beginPath(); x.moveTo(px-16, 46); x.lineTo(px+16, 46); x.lineTo(px+11, 96); x.lineTo(px-11, 96);
      x.closePath(); x.fill();
      x.fillRect(px-8, 96, 16, 3);
    }
    document.getElementById('fg-layer').style.backgroundImage = `url(${c.toDataURL('image/png')})`;
  })();
  // 视差：鼠标三层错位（前景反向、中景正向 → 电影景深）
  window.addEventListener('pointermove', e=>{
    if(!LAB.parallax) return;
    const nx = e.clientX/window.innerWidth - 0.5, ny = e.clientY/window.innerHeight - 0.5;
    const fg = document.getElementById('fg-layer'), mg = document.getElementById('mg-layer');
    if(fg) fg.style.transform = `translate3d(${nx*-26}px, ${ny*-16}px, 0)`;
    if(mg) mg.style.transform = `translate3d(${nx*14}px, ${ny*9}px, 0)`;
  });
  // 指针（织物物理射线用）
  renderer.domElement.addEventListener('pointermove', e=>{
    const r = renderer.domElement.getBoundingClientRect();
    LAB.ptr.set((e.clientX-r.left)/r.width*2-1, -((e.clientY-r.top)/r.height*2-1));
  });
  renderer.domElement.addEventListener('pointerdown', ()=>{ LAB.clothDown = true; });
  window.addEventListener('pointerup', ()=>{ LAB.clothDown = false; });
  LAB.ray = new THREE.Raycaster();
  // 织物物理：刺绣展厅丝布展台 → 细分网格 + 按压凹陷 + 回弹
  const silk = embObjects.find(o=>o.userData && o.userData.propId==='silkTop');
  if(silk){
    const g = new THREE.PlaneGeometry(4.2, 2, 26, 14);
    silk.geometry.dispose();
    silk.geometry = g;
    const pos = g.attributes.position;
    LAB.cloth = {mesh:silk, base:new Float32Array(pos.array), vel:new Float32Array(pos.count), t:0};
  }
  LAB.genCv = document.getElementById('gen-canvas');
  LAB.restCv = document.getElementById('rest-canvas');
}

// ---------- 主循环挂钩（每帧） ----------
function labFrame(delta, elapsed){
  // === 声光频谱联动 ===
  if(BGM.playing && LAB.analyser && LAB.audioReactive){
    LAB.analyser.getByteFrequencyData(LAB.freqData);
    let bass = 0, mid = 0;
    for(let i=1;i<8;i++) bass += LAB.freqData[i];
    for(let i=8;i<30;i++) mid += LAB.freqData[i];
    bass /= 7*255; mid /= 22*255;
    STATE.beat = Math.max(STATE.beat, bass*0.9);
    drawSpectrum();
    LAB.lights.forEach(L=>{ L.l.intensity = L.i*(1 + bass*0.6 + mid*0.18); });
  } else {
    LAB.lights.forEach(L=>{ L.l.intensity += (L.i - L.l.intensity)*0.06; });
    const sp = document.getElementById('spectrum-panel');
    if(sp.classList.contains('show') && !BGM.playing) sp.classList.remove('show');
  }
  // === 智能镜头叙事（对焦展示期内自动运镜，用户一抓即让位） ===
  if(STATE.cinema && LAB.cinema && STATE.focusReturnAt !== null && !focusTween.active && !STATE.isRoaming){
    const c = STATE.cinema; c.t += delta; const T = c.t;
    if(c.style === 'dolly'){
      camera.position.set(
        c.pos.x + Math.sin(T*0.8)*0.8,
        c.pos.y + Math.sin(T*0.5)*0.28,
        c.pos.z + Math.sin(T*0.42)*1.15);
      controls.target.set(c.tgt.x, c.tgt.y + Math.sin(T*0.6)*0.1, c.tgt.z);
    } else if(c.style === 'orbit'){
      const r0 = c.pos.distanceTo(c.tgt), a = T*0.28 + Math.atan2(c.pos.x-c.tgt.x, c.pos.z-c.tgt.z);
      camera.position.set(c.tgt.x + Math.sin(a)*r0, c.pos.y + Math.sin(T*0.4)*0.5, c.tgt.z + Math.cos(a)*r0);
      controls.target.copy(c.tgt);
    } else {
      camera.position.set(c.pos.x + Math.sin(T*0.7)*0.3, c.pos.y + Math.sin(T*0.9)*0.16, c.pos.z + Math.cos(T*0.55)*0.34);
      controls.target.set(c.tgt.x + Math.sin(T*0.5)*0.06, c.tgt.y, c.tgt.z);
    }
  }
  // === 四季粒子（四季行为全异：摇曳/游曳/打旋/直落） ===
  if(LAB.seasonPts && LAB.seasonPts.visible){
    const P = LAB.seasonPts, sIdx = LAB.season, s = SEASONS[sIdx];
    LAB.seasonFade = Math.min(1, (LAB.seasonFade||0) + delta*1.2);
    const fade = LAB.seasonFade;
    // 萤火虫：双批次反相呼吸明灭
    P.material.opacity = (s.firefly ? (0.55+0.45*Math.sin(elapsed*2.1)) : 0.95) * fade;
    const twin = P.userData.twin;
    if(twin){
      twin.visible = true;
      twin.material.opacity = (0.55+0.45*Math.sin(elapsed*2.1+Math.PI)) * fade;
    }
    const arr = P.geometry.attributes.position.array;
    const n = arr.length/3, ph = P.userData.phase;
    if(s.firefly){          // 夏 · 空间游走（不落地）
      for(let k=0;k<n;k++){
        const i = k*3, p0 = ph[k];
        arr[i]   += Math.sin(elapsed*0.5+p0)*delta*0.9;
        arr[i+1] += Math.cos(elapsed*0.36+p0*1.7)*delta*0.5;
        arr[i+2] += Math.sin(elapsed*0.42+p0*0.6)*delta*0.7;
        if(arr[i+1] < 0.4) arr[i+1] = 0.4;
        if(arr[i+1] > 14) arr[i+1] = 14;
        if(arr[i] > 18) arr[i] = -18; else if(arr[i] < -18) arr[i] = 18;
        if(arr[i+2] > 13) arr[i+2] = -13; else if(arr[i+2] < -13) arr[i+2] = 13;
      }
      if(twin){
        const ta = twin.geometry.attributes.position.array;
        for(let k=0;k<ta.length;k+=3){
          ta[k]   += Math.cos(elapsed*0.44+k)*delta*0.8;
          ta[k+1] += Math.sin(elapsed*0.32+k*1.3)*delta*0.5;
          ta[k+2] += Math.cos(elapsed*0.38+k*0.7)*delta*0.6;
          if(ta[k+1] < 0.4) ta[k+1] = 0.4;
          if(ta[k+1] > 14) ta[k+1] = 14;
          if(ta[k] > 18) ta[k] = -18; else if(ta[k] < -18) ta[k] = 18;
          if(ta[k+2] > 13) ta[k+2] = -13; else if(ta[k+2] < -13) ta[k+2] = 13;
        }
        twin.geometry.attributes.position.needsUpdate = true;
      }
    } else {                // 春 / 秋 / 冬 · 飘落类（速度分层）
      const sp = s.speed;
      for(let k=0;k<n;k++){
        const i = k*3, p0 = ph[k];
        arr[i+1] -= sp*delta*(0.65 + 0.7*((k*37)%10)/10);   // 个体速度差 → 纵深层次
        if(sIdx === 0){       // 春 · 花瓣大幅摇曳
          arr[i]   += Math.sin(elapsed*1.3+p0+arr[i+1]*0.35)*delta*1.5;
          arr[i+2] += Math.cos(elapsed*0.9+p0)*delta*0.4;
        } else if(sIdx === 2){// 秋 · 落叶打旋 + 定向风
          arr[i]   += (Math.sin(elapsed*0.85+p0)*1.1+1.5)*delta;
          arr[i+2] += Math.cos(elapsed*0.7+p0)*delta*0.55;
        } else {              // 冬 · 雪轻摆直落
          arr[i]   += Math.sin(elapsed*0.7+p0)*delta*0.4;
        }
        if(arr[i+1] < 0){ arr[i+1] = 14; arr[i] = (Math.random()-0.5)*36; arr[i+2] = (Math.random()-0.5)*26; }
      }
    }
    P.geometry.attributes.position.needsUpdate = true;
  }
  // === 织物物理（按压凹陷 + 弹簧回弹 + 丝线流光） ===
  if(LAB.cloth && STATE.currentScene === 'emb'){
    const cl = LAB.cloth, pos = cl.mesh.geometry.attributes.position;
    LAB.ray.setFromCamera(LAB.ptr, camera);
    const hit = LAB.ray.intersectObject(cl.mesh)[0];
    let hx = null, hy = null, amp = 0;
    if(hit && LAB.ptr.x > -2){
      const lp = cl.mesh.worldToLocal(hit.point.clone());
      hx = lp.x; hy = lp.y; amp = LAB.clothDown ? 0.26 : 0.07;
    }
    const arr = pos.array, base = cl.base, vel = cl.vel;
    for(let i=0;i<pos.count;i++){
      const bx = base[i*3], by = base[i*3+1];
      let target = 0;
      if(hx !== null){
        const d2 = (bx-hx)*(bx-hx) + (by-hy)*(by-hy);
        target = amp*Math.exp(-d2*7);
      }
      const z = arr[i*3+2];
      vel[i] += ((target - z)*22 - vel[i]*4.2)*delta;
      arr[i*3+2] = z + vel[i]*delta;
    }
    pos.needsUpdate = true;
    cl.t += delta;
    if(cl.t > 0.08){ cl.mesh.geometry.computeVertexNormals(); cl.t = 0; }
    // 丝线流光折射：播放音乐时布面贴图缓移
    if(BGM.playing && cl.mesh.material.map){
      cl.mesh.material.map.offset.x = Math.sin(elapsed*0.6)*0.015;
      cl.mesh.material.map.offset.y = Math.cos(elapsed*0.4)*0.01;
    }
  }
  // === AI 生成动画帧 / 修复动画帧 ===
  genFrame(delta);
  restFrame(delta);
}

// ---------- 声音频谱绘制 ----------
function drawSpectrum(){
  const panel = document.getElementById('spectrum-panel');
  if(!panel.classList.contains('show')) panel.classList.add('show');
  const cv = document.getElementById('spectrum-cv'), x = cv.getContext('2d');
  const W = cv.width, H = cv.height, n = 28, bw = W/n;
  x.clearRect(0,0,W,H);
  for(let i=0;i<n;i++){
    const v = (LAB.freqData[i*2]||0)/255;
    const h = Math.max(2, v*(H-16));
    const g = x.createLinearGradient(0, H-8-h, 0, H-8);
    g.addColorStop(0,'#F0D68A'); g.addColorStop(1,'#C41E3A');
    x.fillStyle = g;
    x.fillRect(i*bw+2, H-8-h, bw-4, h);
    x.fillStyle = 'rgba(240,214,138,.25)';
    x.fillRect(i*bw+2, H-6, bw-4, 2);
  }
}

// ---------- 实验室面板 ----------
function openLab(){ document.getElementById('lab-overlay').classList.add('show'); }
function closeLab(){ document.getElementById('lab-overlay').classList.remove('show'); }
function toggleCinema(){
  LAB.cinema = !LAB.cinema;
  document.getElementById('cin-btn').textContent = '运镜：' + (LAB.cinema?'开':'关');
  showToast(LAB.cinema ? '智能镜头叙事已开启 · 对焦展品自动电影运镜' : '已切回手动运镜');
}
function toggleParallax(){
  LAB.parallax = !LAB.parallax;
  document.body.classList.toggle('no-parallax', !LAB.parallax);
  document.getElementById('par-btn').textContent = '视差：' + (LAB.parallax?'开':'关');
}

// ---------- ① AI 纹样生成 ----------
function openGen(){
  document.getElementById('gen-overlay').classList.add('show');
  if(!LAB.genImg){
    const x = LAB.genCv.getContext('2d');
    x.fillStyle = '#F5E6C8'; x.fillRect(0,0,440,440);
    x.fillStyle = 'rgba(92,26,27,.55)'; x.font = '16px "Noto Sans SC",sans-serif'; x.textAlign = 'center';
    x.fillText('① 选择一张辽宁风景/民俗照片', 220, 200);
    x.fillText('轮廓将自动提取 · 对称生成满族剪纸纹样', 220, 228);
  }
}
function closeGen(){
  document.getElementById('gen-overlay').classList.remove('show');
  cancelAnimationFrame(LAB.genRaf);
}
function genFromFile(input){
  const file = input.files && input.files[0];
  if(!file) return;
  input.value = '';
  const rd = new FileReader();
  rd.onload = ()=>{ const img = new Image(); img.onload = ()=>generatePattern(img); img.src = rd.result; };
  rd.readAsDataURL(file);
}
function regenGen(){ if(LAB._lastImg) generatePattern(LAB._lastImg, true); else showToast('先选择一张照片'); }
function generatePattern(img, alt){
  LAB._lastImg = img;
  const S = 110;
  const off = document.createElement('canvas'); off.width = off.height = S;
  const ox = off.getContext('2d');
  // cover 裁剪
  const sc = Math.max(S/img.width, S/img.height);
  ox.drawImage(img, (S-img.width*sc)/2, (S-img.height*sc)/2, img.width*sc, img.height*sc);
  const src = ox.getImageData(0,0,S,S).data;
  // 灰度
  const gray = new Float32Array(S*S);
  for(let i=0;i<S*S;i++) gray[i] = src[i*4]*0.299 + src[i*4+1]*0.587 + src[i*4+2]*0.114;
  // Sobel 轮廓提取
  const mag = new Float32Array(S*S);
  for(let y=1;y<S-1;y++) for(let x=1;x<S-1;x++){
    const i = y*S+x;
    const gx = -gray[i-S-1]-2*gray[i-1]-gray[i+S-1] + gray[i-S+1]+2*gray[i+1]+gray[i+S+1];
    const gy = -gray[i-S-1]-2*gray[i-S]-gray[i-S+1] + gray[i+S-1]+2*gray[i+S]+gray[i+S+1];
    mag[i] = Math.hypot(gx, gy);
  }
  let avg = 0; for(let i=0;i<S*S;i++) avg += mag[i]; avg /= S*S;
  const th = Math.max(60, avg*(alt?2.6:1.9));
  // 二值 + 左右镜像对称（满族剪纸对称美学）
  const mask = new Uint8Array(S*S);
  for(let y=2;y<S-2;y++) for(let x=2;x<S-2;x++){
    const i = y*S+x, j = y*S+(S-1-x);
    const v = mag[i] > th ? 1 : 0;
    mask[i] = v; mask[j] = mask[j] || v;
  }
  // 密度抽稀（避免糊成一片）
  for(let y=0;y<S;y+=2) for(let x=0;x<S;x++) mask[y*S+x+ (y%4?1:0)] = mask[y*S+x] && mask[(y+1)*S+x] ? 1 : mask[y*S+x];
  // 渲染红纸剪纸
  const pc = document.createElement('canvas'); pc.width = pc.height = 512;
  const px = pc.getContext('2d');
  const g = px.createLinearGradient(0,0,512,512);
  g.addColorStop(0,'#C41E3A'); g.addColorStop(1,'#A81630');
  px.fillStyle = g; px.fillRect(0,0,512,512);
  px.fillStyle = '#F5E6C8';
  const cell = 512/S;
  for(let y=0;y<S;y++) for(let x=0;x<S;x++){
    if(mask[y*S+x]) px.fillRect(x*cell, y*cell, cell+0.5, cell+0.5);
  }
  // 外框 + 角花 + 挂穗（剪纸装裱感）
  px.strokeStyle = '#7A0F22'; px.lineWidth = 14; px.strokeRect(7,7,498,498);
  px.strokeStyle = '#F5E6C8'; px.lineWidth = 4; px.strokeRect(26,26,460,460);
  [[40,40],[472,40],[40,472],[472,472]].forEach(([cx2,cy2])=>{
    px.save(); px.translate(cx2,cy2);
    px.fillStyle = '#F5E6C8';
    for(let i=0;i<3;i++){ px.save(); px.rotate(Math.PI/4 + i*0.5); px.fillRect(-30+i*8,-4,60-i*16,8); px.restore(); }
    px.restore();
  });
  LAB.genImg = pc;
  // 聚合动画：粒子从四周汇聚成纹 + 金线扫光
  LAB.genParts = [];
  for(let i=0;i<170;i++){
    const a = Math.random()*Math.PI*2, r = 300+Math.random()*160;
    LAB.genParts.push({x:220+Math.cos(a)*r*0.8, y:220+Math.sin(a)*r*0.8, tx:40+Math.random()*400, ty:40+Math.random()*400, life:1});
  }
  LAB.genSweep = 0; LAB.genT = 0;
  cancelAnimationFrame(LAB.genRaf);
  genRaf();
  showToast('轮廓提取完成 · 专属满族剪纸纹样已生成');
}
function genRaf(){
  LAB.genRaf = requestAnimationFrame(genRaf);
  genFrame(0.016);
}
function genFrame(delta){
  if(!document.getElementById('gen-overlay').classList.contains('show') || !LAB.genImg) return;
  const x = LAB.genCv.getContext('2d');
  LAB.genT += delta;
  x.clearRect(0,0,440,440);
  x.drawImage(LAB.genImg, 0, 0, 440, 440);
  // 粒子聚合成纹
  if(LAB.genParts.length){
    x.fillStyle = '#F0D68A';
    LAB.genParts.forEach(p=>{
      p.x += (p.tx-p.x)*0.06; p.y += (p.ty-p.y)*0.06; p.life -= 0.008;
      x.globalAlpha = Math.max(0, p.life)*0.9;
      x.fillRect(p.x, p.y, 2.4, 2.4);
    });
    x.globalAlpha = 1;
    if(LAB.genT > 2.4) LAB.genParts = [];
  }
  // 金线编织扫光
  if(LAB.genSweep >= 0 && LAB.genSweep < 1.35){
    LAB.genSweep += delta*0.85;
    const sx = LAB.genSweep*500 - 30;
    const lg = x.createLinearGradient(sx-70,0,sx+30,0);
    lg.addColorStop(0,'rgba(240,214,138,0)');
    lg.addColorStop(.5,'rgba(240,214,138,.5)');
    lg.addColorStop(1,'rgba(240,214,138,0)');
    x.fillStyle = lg;
    x.save(); x.translate(sx,220); x.rotate(-0.35); x.translate(-sx,-220);
    x.fillRect(sx-160, -40, 200, 560);
    x.restore();
    if(LAB.genSweep >= 1.35) LAB.genSweep = -1;
  }
}
function applyGen(target){
  if(!LAB.genImg){ showToast('先生成一枚专属纹样'); return; }
  unlockCode('ai');
  if(target === 'puppet'){
    applyTexToPuppets(LAB.genImg);
    gotoScene('puppet');
    goldBoom('AI纹样已穿上皮影戏服！');
  } else if(target === 'emb'){
    embObjects.forEach(o=>{
      const u = o.userData;
      if(u.type !== 'embroidery') return;
      u.mesh.material.map = makeTexture((ctx,w,h)=>{
        try{
          const base = embTexture(u.kind, Math.max(0, STATE.embroideryPattern));
          if(base && base.image) ctx.drawImage(base.image, 0, 0, w, h);
        }catch(e){ ctx.fillStyle = '#5C1A1B'; ctx.fillRect(0,0,w,h); }
        ctx.globalCompositeOperation = 'source-atop';
        ctx.globalAlpha = 0.9;
        ctx.drawImage(LAB.genImg, w*0.14, h*0.14, w*0.72, h*0.72);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }, 512, 512);
      u.mesh.material.needsUpdate = true;
      u.pulse = 1;
    });
    gotoScene('emb');
    goldBoom('AI纹样已化作刺绣绣纹！');
  } else {
    // 入藏剪纸展板：场景内新增"用户创作"悬浮剪纸
    const tex = new THREE.CanvasTexture(LAB.genImg);
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 2.6),
      new THREE.MeshBasicMaterial({map:tex, transparent:true, side:THREE.DoubleSide}));
    m.position.set(0, 3.4, -2.5);
    m.userData = {type:'prop', propId:'genArt', name:'AI用户创作纹样'};
    paperSceneGroup.add(m);
    paperObjects.push(m);
    gotoScene('paper');
    goldBoom('AI纹样已入藏剪纸展板 · 你的原创非遗作品！');
  }
}

// ---------- ② 时序演变 ----------
const ERAS = [
  {name:'上古 · 摹初纹', sub:'简拙神秘 · 纹样初生', main:'#9A7E4E', sub2:'#5C4A32', light:'#C9B084'},
  {name:'清代 · 满剪纹', sub:'母源大成 · 满韵定格', main:'#C41E3A', sub2:'#8B1428', light:'#E8B84B'},
  {name:'近代 · 皮影纹', sub:'驴皮演绎 · 灯影流转', main:'#D4A843', sub2:'#7A3A20', light:'#F0D68A'},
  {name:'现代 · 国潮纹', sub:'锦绣新生 · 古艺今风', main:'#FF5F7E', sub2:'#7EC8A9', light:'#FFD97A'},
];
function eraPatternCanvas(idx){
  const e = ERAS[idx], c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  try{ motifDraw([0,1,2,7][idx]).draw(x, 128, 128, 86, e.main, e.sub2); }catch(err){}
  x.strokeStyle = e.main; x.lineWidth = 5; x.globalAlpha = 0.7;
  x.beginPath(); x.arc(128,128,118,0,Math.PI*2); x.stroke();
  x.globalAlpha = 1;
  return c;
}
function cycleEra(){
  LAB.era = (LAB.era+1) % ERAS.length;
  const e = ERAS[LAB.era];
  // 皮影换装（时代配色纹样）
  applyTexToPuppets(eraPatternCanvas(LAB.era), 0.82);
  // 刺绣绣纹换代
  applyEmbroidery(LAB.era);
  // 灯光时代色温
  tintLights(e.light);
  document.getElementById('era-chip').textContent = e.name;
  unlockCode('era');
  goldBoom(`时序演变 → ${e.name}`);
  showToast(`${e.sub} · 皮影/刺绣/灯光已一键换代`);
}

// ---------- ⑤ 四季辽韵 ----------
const SEASONS = [
  {name:'春 · 花信', desc:'樱花瓣随风摇曳', bg:0x241226, fog:0x33203A, light:'#FFD9E8', part:'#FFC4DC', size:0.36, count:320, speed:1.1},
  {name:'夏 · 萤川', desc:'萤火虫明灭游曳', bg:0x0A1810, fog:0x12261A, light:'#BFF0C9', part:'#D8FFA6', size:0.52, count:130, speed:0, firefly:true},
  {name:'秋 · 金落', desc:'金叶打旋随风飘落', bg:0x221406, fog:0x33200D, light:'#FFD9A0', part:'#F5B84E', size:0.44, count:280, speed:2.6},
  {name:'冬 · 辽雪', desc:'六角雪簌簌而落', bg:0x0D1322, fog:0x1A2338, light:'#CFD8FF', part:'#F2F7FF', size:0.24, count:520, speed:3.4},
];
// 四季特征贴图（128px 手绘：樱瓣缺口 / 萤火虫躯体 / 锯齿叶脉 / 六角雪晶）
function seasonSprite(idx){
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  x.translate(64,64);
  if(idx === 0){        // 春 · 樱花瓣（带瓣缺的心形，粉白渐变）
    x.rotate(0.5);
    const g = x.createLinearGradient(0,-32,0,30);
    g.addColorStop(0,'#FFE3EF'); g.addColorStop(.55,'#FFA8CC'); g.addColorStop(1,'#F77EB3');
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(0,-30);
    x.bezierCurveTo(22,-26, 26,6, 9,24);
    x.lineTo(0,15);          // 瓣尖缺口
    x.lineTo(-9,24);
    x.bezierCurveTo(-26,6, -22,-26, 0,-30);
    x.closePath(); x.fill();
    x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 2; x.stroke();
    x.fillStyle = 'rgba(255,255,255,.5)';
    x.beginPath(); x.ellipse(-6,-12,7,4,-0.5,0,Math.PI*2); x.fill();
  } else if(idx === 1){ // 夏 · 萤火虫（发光躯体+外光晕）
    const glow = x.createRadialGradient(0,8,4,0,8,60);
    glow.addColorStop(0,'rgba(226,255,170,.85)');
    glow.addColorStop(.4,'rgba(190,255,130,.30)');
    glow.addColorStop(1,'rgba(190,255,130,0)');
    x.fillStyle = glow; x.fillRect(-64,-64,128,128);
    x.fillStyle = 'rgba(255,255,255,.30)';            // 双翅
    x.beginPath(); x.ellipse(-11,-4,8,17,-0.45,0,Math.PI*2); x.fill();
    x.beginPath(); x.ellipse(11,-4,8,17,0.45,0,Math.PI*2); x.fill();
    x.fillStyle = '#4A3B22';                          // 头
    x.beginPath(); x.arc(0,-22,8,0,Math.PI*2); x.fill();
    const body = x.createLinearGradient(0,-16,0,18);  // 躯干
    body.addColorStop(0,'#6B532E'); body.addColorStop(1,'#41321B');
    x.fillStyle = body;
    x.beginPath(); x.ellipse(0,0,10,17,0,0,Math.PI*2); x.fill();
    const abd = x.createRadialGradient(0,20,1,0,20,12); // 发光腹部
    abd.addColorStop(0,'#FDFFE8'); abd.addColorStop(.45,'#E2FFAA'); abd.addColorStop(1,'rgba(226,255,170,.15)');
    x.fillStyle = abd;
    x.beginPath(); x.ellipse(0,19,8,10,0,0,Math.PI*2); x.fill();
    x.fillStyle = 'rgba(255,255,240,.5)';             // 触角
    x.fillRect(-2,-36,1.6,8); x.fillRect(1,-36,1.6,8);
  } else if(idx === 2){ // 秋 · 金叶（锯齿轮廓+叶脉）
    x.rotate(-0.35);
    const g = x.createLinearGradient(-20,-30,20,30);
    g.addColorStop(0,'#FFD36B'); g.addColorStop(.55,'#F0A040'); g.addColorStop(1,'#C95E22');
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(0,-34);
    x.quadraticCurveTo(20,-26, 24,-6);
    x.quadraticCurveTo(26,12, 7,28);
    x.lineTo(0,24);
    x.lineTo(-7,28);
    x.quadraticCurveTo(-26,12, -24,-6);
    x.quadraticCurveTo(-20,-26, 0,-34);
    x.closePath(); x.fill();
    x.strokeStyle = 'rgba(122,58,20,.85)'; x.lineWidth = 2.4;   // 主脉+侧脉
    x.beginPath(); x.moveTo(0,-30); x.lineTo(0,30); x.stroke();
    x.lineWidth = 1.5;
    for(let i=0;i<4;i++){
      const y = -20+i*11;
      x.beginPath(); x.moveTo(0,y); x.lineTo(13,y-6); x.stroke();
      x.beginPath(); x.moveTo(0,y); x.lineTo(-13,y-6); x.stroke();
    }
    x.strokeStyle = '#7A3A14'; x.lineWidth = 3;                  // 叶柄
    x.beginPath(); x.moveTo(0,30); x.lineTo(0,40); x.stroke();
  } else {              // 冬 · 六角雪晶
    const glow = x.createRadialGradient(0,0,2,0,0,26);
    glow.addColorStop(0,'rgba(255,255,255,.5)'); glow.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle = glow; x.fillRect(-30,-30,60,60);
    x.strokeStyle = 'rgba(255,255,255,.95)'; x.lineWidth = 3;
    x.lineCap = 'round';
    for(let a=0;a<6;a++){
      x.save(); x.rotate(a*Math.PI/3);
      x.beginPath(); x.moveTo(0,0); x.lineTo(0,-44); x.stroke();  // 主枝
      x.lineWidth = 2;
      x.beginPath(); x.moveTo(0,-18); x.lineTo(-9,-28); x.stroke(); // 侧杈
      x.beginPath(); x.moveTo(0,-18); x.lineTo(9,-28); x.stroke();
      x.beginPath(); x.moveTo(0,-32); x.lineTo(-6,-40); x.stroke();
      x.beginPath(); x.moveTo(0,-32); x.lineTo(6,-40); x.stroke();
      x.lineWidth = 3;
      x.restore();
    }
    x.fillStyle = '#fff';
    x.beginPath(); x.arc(0,0,4,0,Math.PI*2); x.fill();
  }
  return new THREE.CanvasTexture(c);
}
function applySeason(i){
  document.querySelectorAll('#season-chips .tool-btn').forEach((b,k)=>b.classList.toggle('tool-btn-active', k===i && LAB.season!==i));
  if(LAB.season === i){ // 再点一次恢复原貌
    LAB.season = -1;
    scene.background.set(0x2E1424);
    scene.fog.color.set(0x281220);
    LAB.lights.forEach(L=>L.l.color.copy(L.c));
    if(LAB.seasonPts){
      LAB.seasonPts.visible = false;
      if(LAB.seasonPts.userData.twin) LAB.seasonPts.userData.twin.visible = false;
    }
    showToast('已恢复馆藏原貌');
    return;
  }
  LAB.season = i;
  const s = SEASONS[i];
  scene.background.set(s.bg);
  scene.fog.color.set(s.fog);
  tintLights(s.light);
  // 粒子系统按季节重建（数量/大小/贴图/行为全异）
  if(LAB.seasonPts){
    scene.remove(LAB.seasonPts);
    LAB.seasonPts.geometry.dispose();
    if(LAB.seasonPts.userData.twin){
      scene.remove(LAB.seasonPts.userData.twin);
      LAB.seasonPts.userData.twin.geometry.dispose();
    }
    LAB.seasonPts = null;
  }
  const buildPts = count=>{
    const geo = new THREE.BufferGeometry();
    const arr = new Float32Array(count*3);
    for(let k=0;k<count;k++){
      arr[k*3] = (Math.random()-0.5)*36;
      arr[k*3+1] = Math.random()*14;
      arr[k*3+2] = (Math.random()-0.5)*26;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(arr,3));
    return geo;
  };
  const mat = new THREE.PointsMaterial({
    size:s.size, map:seasonSprite(i), transparent:true, opacity:0,
    depthWrite:false, sizeAttenuation:true});
  LAB.seasonPts = new THREE.Points(buildPts(s.count), mat);
  const phase = new Float32Array(s.count);
  for(let k=0;k<phase.length;k++) phase[k] = Math.random()*Math.PI*2;
  LAB.seasonPts.userData = {
    phase,
    baseOpacity: s.firefly ? 1 : 0.95,
    twin: null,
  };
  scene.add(LAB.seasonPts);
  // 萤火虫专属：第二批次错峰明灭，营造此起彼伏的流萤
  if(s.firefly){
    const twin = new THREE.Points(buildPts(s.count), new THREE.PointsMaterial({
      size:s.size*0.85, map:seasonSprite(1), transparent:true, opacity:0,
      depthWrite:false, sizeAttenuation:true}));
    twin.userData = {phase:new Float32Array(s.count).map(()=>Math.random()*Math.PI*2), baseOpacity:1, twin:null};
    LAB.seasonPts.userData.twin = twin;
    scene.add(twin);
  }
  LAB.seasonFade = 0; // 渐显
  LAB.seasonPts.visible = true;
  unlockCode('season');
  goldBoom(`四季辽韵 · ${s.name}`);
  showToast(`${s.name} — ${s.desc} · 全域换季（再点一次恢复）`);
}

// ---------- ④ 声光频谱联动 ----------
function toggleAudioReactive(){
  LAB.audioReactive = !LAB.audioReactive;
  document.getElementById('ar-btn').textContent = LAB.audioReactive ? '关闭联动' : '开启联动';
  if(LAB.audioReactive){
    if(BGM.playing){
      document.getElementById('ar-chip').textContent = '五维同步中';
      unlockCode('sound');
      goldBoom('声光共振 · 音乐驱动全场特效');
    } else {
      document.getElementById('ar-chip').textContent = '待播放音乐';
      showToast('联动已就绪 · 点击底部「背景音乐」即可五维同步');
    }
  } else {
    document.getElementById('ar-chip').textContent = '已关闭';
  }
}

// ---------- ⑥ 文物修复 ----------
const REST_DEFS = {
  paper:{chip:'rest-p', name:'残破满剪', art:c=>drawRestPaper(c), holes:9},
  puppet:{chip:'rest-f', name:'褪色皮影', art:c=>{ const x=c.getContext('2d'); x.save(); x.translate(130,50); x.scale(1.12,1.06); drawPuppetFigure(x,160,320,1); x.restore(); }, holes:10},
  emb:{chip:'rest-e', name:'破损枕顶', art:c=>drawRestEmb(c), holes:11},
};
function drawRestPaper(c){
  const x = c.getContext('2d');
  x.fillStyle = '#C41E3A'; x.fillRect(0,0,440,440);
  x.fillStyle = '#F5E6C8';
  try{ MOTIFS[0].draw(x, 220, 220, 130, '#F5E6C8', '#FFD9E0'); }catch(e){}
  x.strokeStyle = '#F5E6C8'; x.lineWidth = 8; x.strokeRect(20,20,400,400);
}
function drawRestEmb(c){
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0,0,440,440);
  g.addColorStop(0,'#241A33'); g.addColorStop(1,'#2C2040');
  x.fillStyle = g; x.fillRect(0,0,440,440);
  for(let r=0;r<3;r++) for(let k=0;k<3;k++){
    try{ MOTIFS_PLUS[[3,5,7][r]].draw(x, 86+k*134, 86+r*134, 46, '#F0D68A', '#E8455F'); }catch(e){}  }
  x.strokeStyle = '#D4A843'; x.lineWidth = 6; x.strokeRect(10,10,420,420);
}
function openRestore(){
  document.getElementById('restore-overlay').classList.add('show');
  initRestore(LAB.restKind);
}
function closeRestore(){
  document.getElementById('restore-overlay').classList.remove('show');
  cancelAnimationFrame(LAB.restRaf);
}
function initRestore(kind){
  LAB.restKind = kind;
  Object.keys(REST_DEFS).forEach(k=>document.getElementById(REST_DEFS[k].chip).classList.toggle('tool-btn-active', k===kind));
  const def = REST_DEFS[kind];
  const cv = LAB.restCv, S = 440;
  cv.width = cv.height = S;
  // 干净原画
  const clean = document.createElement('canvas'); clean.width = clean.height = S;
  def.art(clean);
  // 损伤层：孔洞 + 褪色
  const dmg = document.createElement('canvas'); dmg.width = dmg.height = S;
  const dx = dmg.getContext('2d');
  dx.drawImage(clean, 0, 0);
  dx.globalCompositeOperation = 'destination-out';
  LAB.restHoles = [];
  for(let i=0;i<def.holes;i++){
    const hx = 70+Math.random()*300, hy = 70+Math.random()*300, hr = 22+Math.random()*22;
    dx.beginPath(); dx.arc(hx, hy, hr, 0, Math.PI*2); dx.fill();
    LAB.restHoles.push({x:hx, y:hy, ok:false});
  }
  // 划痕
  for(let i=0;i<5;i++){
    dx.lineWidth = 3;
    dx.beginPath();
    const sx = Math.random()*S, sy = Math.random()*S;
    dx.moveTo(sx, sy);
    dx.lineTo(sx+(Math.random()-0.5)*160, sy+(Math.random()-0.5)*160);
    dx.stroke();
  }
  dx.globalCompositeOperation = 'source-atop';
  dx.fillStyle = 'rgba(216,206,180,.5)'; dx.fillRect(0,0,S,S); // 褪色
  dx.globalCompositeOperation = 'source-over';
  LAB.restClean = clean; LAB.restDmg = dmg;
  LAB.restParts = [];
  if(!LAB.restBound){
    LAB.restBound = true;
    const pos = e=>{
      const r = cv.getBoundingClientRect(), p = e.touches ? e.touches[0] : e;
      return {x:(p.clientX-r.left)*S/r.width, y:(p.clientY-r.top)*S/r.height};
    };
    let painting = false;
    const paint = pt=>{
      const dx2 = LAB.restDmg.getContext('2d');
      dx2.globalCompositeOperation = 'destination-out';
      dx2.beginPath(); dx2.arc(pt.x, pt.y, 24, 0, Math.PI*2); dx2.fill();
      dx2.globalCompositeOperation = 'source-over';
      LAB.restParts.push({x:pt.x, y:pt.y, life:1});
      LAB.restHoles.forEach(h=>{
        if(!h.ok && Math.hypot(pt.x-h.x, pt.y-h.y) < 40){
          h.ok = true;
          for(let i=0;i<10;i++){
            const a = Math.random()*Math.PI*2;
            LAB.restParts.push({x:h.x, y:h.y, vx:Math.cos(a)*2, vy:Math.sin(a)*2, life:1});
          }
        }
      });
      const done = LAB.restHoles.filter(h=>h.ok).length;
      document.getElementById('rest-bar').style.width = (done/LAB.restHoles.length*100)+'%';
      if(done >= LAB.restHoles.length && !LAB.restDone){
        LAB.restDone = true;
        restComplete();
      }
    };
    cv.addEventListener('pointerdown', e=>{ painting = true; paint(pos(e)); e.preventDefault(); });
    cv.addEventListener('pointermove', e=>{ if(painting) paint(pos(e)); });
    window.addEventListener('pointerup', ()=>painting = false);
  }
  LAB.restDone = false;
  document.getElementById('rest-bar').style.width = '0%';
  cancelAnimationFrame(LAB.restRaf);
  restRaf();
  showToast(`已取出「${def.name}」 · 按住鼠标涂抹残缺处`);
}
function restRaf(){ LAB.restRaf = requestAnimationFrame(restRaf); restFrame(0.016); }
function restFrame(delta){
  if(!document.getElementById('restore-overlay').classList.contains('show')) return;
  LAB.restT += delta;
  const x = LAB.restCv.getContext('2d');
  x.clearRect(0,0,440,440);
  x.drawImage(LAB.restClean, 0, 0);
  x.drawImage(LAB.restDmg, 0, 0);
  // 修复金辉 + 粒子
  LAB.restParts.forEach(p=>{
    if(p.vx !== undefined){ p.x += p.vx; p.y += p.vy; p.vy += 0.05; }
    p.life -= 0.03;
  });
  LAB.restParts = LAB.restParts.filter(p=>p.life > 0);
  LAB.restParts.forEach(p=>{
    x.globalAlpha = Math.max(0, p.life);
    x.fillStyle = '#F0D68A';
    x.shadowColor = '#F0D68A'; x.shadowBlur = 8;
    x.beginPath(); x.arc(p.x, p.y, p.vx!==undefined?2.2:5, 0, Math.PI*2); x.fill();
  });
  x.shadowBlur = 0; x.globalAlpha = 1;
  if(LAB.restDone){
    const pulse = 0.5+0.5*Math.sin(LAB.restT*4);
    x.strokeStyle = `rgba(240,214,138,${0.4+pulse*0.5})`;
    x.lineWidth = 6; x.strokeRect(6,6,428,428);
    x.fillStyle = '#F0D68A'; x.font = 'bold 17px "Noto Serif SC",serif'; x.textAlign = 'center';
    x.fillText('✔ 文物重生 · 鎏金复位', 220, 430);
  }
}
function restComplete(){
  unlockCode('fix');
  goldBoom(`「${REST_DEFS[LAB.restKind].name}」修复完成 · 文物重生！`);
  // 数字文物回归展区
  addArtToScene(LAB.restKind, LAB.restClean, '修复回归文物');
}

// 场景入藏（AI纹样 / 修复文物 共用）
function addArtToScene(kind, artCv, label){
  const tex = new THREE.CanvasTexture(artCv);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 2.4),
    new THREE.MeshBasicMaterial({map:tex, transparent:true, side:THREE.DoubleSide}));
  const group = kind === 'paper' ? paperSceneGroup : kind === 'puppet' ? puppetSceneGroup : embSceneGroup;
  const arr = kind === 'paper' ? paperObjects : kind === 'puppet' ? puppetObjects : embObjects;
  const off = (arr.filter(o=>o.userData && o.userData.propId==='genArt').length)*0.8;
  m.position.set(3.4+off, 3.2, -3);
  m.userData = {type:'prop', propId:'genArt', name:label};
  group.add(m);
  arr.push(m);
  const wp = new THREE.Vector3();
  m.getWorldPosition(wp);
  spawnGoldBurst(wp, 16);
}

// ---------- ⑦ 拓扑曲面映射 ----------
function openTopo(){
  document.getElementById('topo-overlay').classList.add('show');
  LAB.topoOpen = true;
  cancelAnimationFrame(LAB.topoRaf);
  topoRaf();
}
function closeTopo(){
  document.getElementById('topo-overlay').classList.remove('show');
  LAB.topoOpen = false;
  cancelAnimationFrame(LAB.topoRaf);
}
function topoRaf(){
  if(!LAB.topoOpen) return;
  LAB.topoRaf = requestAnimationFrame(topoRaf);
  LAB.topoT += 0.016;
  const cv = document.getElementById('topo-canvas'), x = cv.getContext('2d');
  const W = cv.width, H = cv.height, T = LAB.topoT;
  x.fillStyle = '#120D1E'; x.fillRect(0,0,W,H);
  // 平面纹样（左）
  const pat = eraPatternCanvas(1);
  x.drawImage(pat, 40, 70, 160, 160);
  x.strokeStyle = 'rgba(212,168,67,.5)'; x.lineWidth = 1.5; x.strokeRect(40,70,160,160);
  x.fillStyle = 'rgba(240,214,138,.75)'; x.font = '13px "Noto Sans SC",sans-serif'; x.textAlign = 'center';
  x.fillText('二维母本纹样', 120, 256);
  // 映射箭头
  x.fillStyle = 'rgba(240,214,138,.85)';
  x.fillText('拓扑映射 →', 255, 155);
  // 曲面网格（右）
  const gx0 = 330, gy0 = 150, gw = 160, gh = 150;
  const rows = 14, cols = 16;
  x.lineWidth = 1;
  for(let r=0;r<=rows;r++){
    x.beginPath();
    for(let c2=0;c2<=cols;c2++){
      const u = c2/cols, v = r/rows;
      const p = topoPoint(u, v, gx0, gy0, gw, gh, T);
      c2 ? x.lineTo(p.x, p.y) : x.moveTo(p.x, p.y);
    }
    x.strokeStyle = 'rgba(212,168,67,.35)';
    x.stroke();
  }
  for(let c2=0;c2<=cols;c2++){
    x.beginPath();
    for(let r=0;r<=rows;r++){
      const u = c2/cols, v = r/rows;
      const p = topoPoint(u, v, gx0, gy0, gw, gh, T);
      r ? x.lineTo(p.x, p.y) : x.moveTo(p.x, p.y);
    }
    x.stroke();
  }
  // 纹样逐格贴上曲面（逐格形变 = 拓扑映射可视化）
  const cellW = 1/8, cellH = 1/8;
  for(let r=0;r<8;r++) for(let c2=0;c2<8;c2++){
    const u0 = c2*cellW, v0 = r*cellH;
    const p00 = topoPoint(u0, v0, gx0, gy0, gw, gh, T);
    const p10 = topoPoint(u0+cellW, v0, gx0, gy0, gw, gh, T);
    const p01 = topoPoint(u0, v0+cellH, gx0, gy0, gw, gh, T);
    const p11 = topoPoint(u0+cellW, v0+cellH, gx0, gy0, gw, gh, T);
    const shade = 0.35 + 0.65*Math.abs(Math.cos((u0+cellW/2)*Math.PI));
    x.save();
    x.beginPath();
    x.moveTo(p00.x, p00.y); x.lineTo(p10.x, p10.y); x.lineTo(p11.x, p11.y); x.lineTo(p01.x, p01.y);
    x.closePath(); x.clip();
    x.globalAlpha = 0.55 + shade*0.45;
    const sx = (c2/8)*160, sy = (r/8)*160;
    x.drawImage(pat, 40+sx, 70+sy, 20, 20, gx0, gy0-75, gw, gh);
    x.globalAlpha = shade;
    x.fillStyle = '#000'; x.fillRect(gx0, gy0-75, gw, gh);
    x.restore();
  }
  x.globalAlpha = 1;
  x.fillStyle = 'rgba(240,214,138,.75)';
  x.fillText('三维皮影曲面 · 实时形变贴合', gx0+gw/2, 256);
}
function topoPoint(u, v, gx0, gy0, gw, gh, T){
  // 圆柱鼓曲面 + 呼吸波动
  const bulge = Math.sin(u*Math.PI);
  const x = gx0 + u*gw;
  const y = gy0 + v*gh - bulge*46 + Math.sin(T*1.4 + u*6)*3;
  const z = bulge;
  return {x: x + Math.sin(T*0.8)*4*z, y};
}
function applyTopo(){
  let bent = 0;
  puppetObjects.forEach(p=>{
    const u = p.userData;
    if(u.type !== 'puppet') return;
    if(!u.bent){
      const g = p.geometry.clone();
      g.computeBoundingBox();
      const bb = g.boundingBox, span = Math.max(0.001, bb.max.x-bb.min.x);
      const pos = g.attributes.position;
      for(let i=0;i<pos.count;i++){
        const uu = (pos.getX(i)-bb.min.x)/span;
        pos.setZ(i, Math.sin(uu*Math.PI)*0.22);
      }
      pos.needsUpdate = true;
      g.computeVertexNormals();
      p.geometry.dispose();
      p.geometry = g;
      u.bent = true;
    }
    bent++;
  });
  if(!bent){ showToast('当前展厅无皮影 · 请先切换到皮影戏台'); return; }
  applyTexToPuppets(eraPatternCanvas(1), 0.85);
  unlockCode('topo');
  gotoScene('puppet');
  goldBoom('拓扑映射完成 · 二维纹样已智能贴合皮影曲面');
}

// ---------- ⑨ 纹样密码册 + 数字证书 ----------
function openCodes(){
  document.getElementById('codes-overlay').classList.add('show');
  renderCodes();
}
function closeCodes(){ document.getElementById('codes-overlay').classList.remove('show'); }
function renderCodes(){
  document.getElementById('codes-progress').textContent = `已收集 ${LAB.codes.size}/${CODE_DEFS.length} 枚纹样密码`;
  const grid = document.getElementById('codes-grid');
  grid.innerHTML = '';
  CODE_DEFS.forEach(d=>{
    const on = LAB.codes.has(d.id);
    const cell = document.createElement('div');
    cell.className = 'code-cell' + (on ? ' on' : ' locked');
    if(on){
      const cv = document.createElement('canvas');
      cv.width = cv.height = 96;
      try{ motifDraw(d.motif).draw(cv.getContext('2d'), 48, 48, 30, '#F0D68A', '#E8455F'); }catch(e){}
      cell.appendChild(cv);
      const b = document.createElement('b'); b.textContent = d.name; cell.appendChild(b);
    } else {
      const q = document.createElement('div');
      q.style.cssText = 'height:56px;display:flex;align-items:center;justify-content:center;font-size:26px;color:rgba(212,168,67,.35)';
      q.textContent = '?';
      cell.appendChild(q);
      const b = document.createElement('b'); b.textContent = '未解锁'; cell.appendChild(b);
      const s = document.createElement('small'); s.textContent = d.how; cell.appendChild(s);
    }
    grid.appendChild(cell);
  });
}
function makeCertificate(){
  const card = document.createElement('canvas');
  card.width = 1000; card.height = 700;
  const x = card.getContext('2d');
  const g = x.createLinearGradient(0,0,1000,700);
  g.addColorStop(0,'#14102a'); g.addColorStop(.5,'#1e1430'); g.addColorStop(1,'#120d24');
  x.fillStyle = g; x.fillRect(0,0,1000,700);
  x.strokeStyle = '#D4A843'; x.lineWidth = 8; x.strokeRect(20,20,960,660);
  x.lineWidth = 2; x.strokeRect(36,36,928,628);
  [[44,44],[956,44],[44,656],[956,656]].forEach(([px,py])=>{
    x.save(); x.translate(px,py);
    for(let i=0;i<3;i++) x.strokeRect(-20+i*6,-20+i*6,40-i*12,40-i*12);
    x.restore();
  });
  x.textAlign = 'center';
  x.fillStyle = '#F0D68A';
  x.font = '900 52px "Noto Serif SC",serif';
  x.shadowColor = 'rgba(212,168,67,.6)'; x.shadowBlur = 20;
  x.fillText('辽韵三萃 · 非遗纹样数字证书', 500, 100);
  x.shadowBlur = 0;
  x.font = '20px "Noto Sans SC",sans-serif';
  x.fillStyle = 'rgba(240,214,138,.8)';
  x.fillText('辽宁皮影 × 满族剪纸 × 满族刺绣 · 纹样密码鉴藏', 500, 140);
  // 已解锁密码 + 纹样
  const got = CODE_DEFS.filter(d=>LAB.codes.has(d.id));
  const per = Math.ceil(got.length/2) || 1;
  got.forEach((d,i)=>{
    const col = i < per ? 0 : 1, row = i % per;
    const cx0 = 280 + col*340, cy0 = 205 + row*74;
    const cv = document.createElement('canvas'); cv.width = cv.height = 96;
    try{ motifDraw(d.motif).draw(cv.getContext('2d'), 48, 48, 30, '#F0D68A', '#E8455F'); }catch(e){}
    x.drawImage(cv, cx0-66, cy0-30, 60, 60);
    x.textAlign = 'left';
    x.fillStyle = '#F0D68A'; x.font = '600 19px "Noto Serif SC",serif';
    x.fillText(d.name, cx0+4, cy0-2);
    x.fillStyle = 'rgba(237,228,211,.6)'; x.font = '12px "Noto Sans SC",sans-serif';
    x.fillText(d.how, cx0+4, cy0+20);
    x.textAlign = 'center';
  });
  if(!got.length){
    x.fillStyle = 'rgba(237,228,211,.5)'; x.font = '16px "Noto Sans SC",sans-serif';
    x.fillText('尚无解锁密码 · 完成【创新实验室】玩法收集纹样密码', 500, 320);
  }
  // 防伪纹样条（辽韵三萃专属）
  const stripY = 590;
  x.save();
  x.globalAlpha = 0.8;
  for(let i=0;i<10;i++){
    const cv = document.createElement('canvas'); cv.width = cv.height = 72;
    try{ MOTIFS[[0,1,2,3,7][i%5]].draw(cv.getContext('2d'), 36, 36, 22, i%2?'#D4A843':'#C41E3A', '#F0D68A'); }catch(e){}
    x.save();
    x.translate(120+i*84, stripY);
    x.rotate(((i*37)%20-10)/60);
    x.drawImage(cv, -30, -30, 60, 60);
    x.restore();
  }
  x.restore();
  x.fillStyle = 'rgba(240,214,138,.55)'; x.font = '11px "Noto Sans SC",sans-serif';
  const serial = 'LYSC-' + Array.from(LAB.codes).map(c=>c.charCodeAt(0)%36).join('').padEnd(6,'0').slice(0,6).toUpperCase();
  x.fillText(`防伪纹样条 · 编号 ${serial} · 探索进度 ${STATE.visited.size}/${NAV_ITEMS.length}`, 500, 640);
  const now = new Date();
  x.fillStyle = 'rgba(240,214,138,.8)'; x.font = '15px "Noto Sans SC",sans-serif';
  x.fillText(`签发于 ${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 · 辽韵三萃沉浸式非遗数字展馆`, 500, 172);
  const a = document.createElement('a');
  a.download = '辽韵三萃-非遗纹样数字证书.png';
  a.href = card.toDataURL('image/png');
  a.click();
  goldBoom('防伪数字证书已生成 · 已开始下载保存');
}

/* ============================================================
   《辽韵三萃》国奖冲刺升级模块
   开篇叙事 / 粒子采样 / 舞台特效 / 纹样投递 / 三大新游戏 /
   数字文创工坊 / 传承人语录注入 / 引导提示
   ============================================================ */

// ---------- 公共：引导提示（一次性 · 长显示，降低上手门槛） ----------
const GUIDED = new Set();
function showGuide(key, msg){
  if(GUIDED.has(key)) return;
  GUIDED.add(key);
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  clearTimeout(toast._gtimer);
  toast._gtimer = setTimeout(()=>toast.classList.remove('show'), 4600);
}
function toggleHintCard(){
  const el = document.getElementById('hint-card');
  if(el) el.classList.toggle('open');
}

// ---------- 公共：纹样轮廓粒子采样（开篇/流转/拼图共用） ----------
function sampleMotifPoints(drawFn, size = 150, step = 2, maxN = 640){
  try{
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const c = cv.getContext('2d');
    drawFn(c, size/2, size/2, size*0.30, '#ffffff', '#ffffff');
    const data = c.getImageData(0, 0, size, size).data;
    const pts = [];
    for(let y=0; y<size; y+=step){
      for(let xx=0; xx<size; xx+=step){
        if(data[(y*size+xx)*4+3] > 110) pts.push({x:xx, y:yySafe(y)});
      }
    }
    function yySafe(v){ return v; }
    // 打散顺序
    for(let i=pts.length-1; i>0; i--){
      const j = (Math.random()*(i+1))|0;
      const tp = pts[i]; pts[i] = pts[j]; pts[j] = tp;
    }
    return pts.slice(0, maxN);
  }catch(e){ return []; }
}

// ---------- 开篇叙事动画：一源三流（同源纹样分化为三门非遗） ----------
const OPEN_FX = {running:false, raf:0, pts:null, puppetCv:null, done:null};
function playOpeningNarrative(done){
  const ov = document.getElementById('opening-overlay');
  if(!ov){ if(done) done(); return; }
  if(OPEN_FX.running){ OPEN_FX.done = done; return; }
  OPEN_FX.running = true;
  OPEN_FX.done = done;
  const cv = document.getElementById('opening-canvas');
  const cap = document.getElementById('opening-caption');
  const brand = ov.querySelector('.opening-brand');
  const x = cv.getContext('2d');
  cv.width = window.innerWidth; cv.height = window.innerHeight;
  const W = cv.width, H = cv.height;
  ov.classList.remove('leave');
  ov.classList.add('show');
  if(brand){ brand.style.display = ''; brand.classList.add('show'); }
  if(!OPEN_FX.pts) OPEN_FX.pts = sampleMotifPoints(MOTIFS[0].draw, 150, 2, 620);
  if(!OPEN_FX.puppetCv){
    const pc = document.createElement('canvas');
    pc.width = 120; pc.height = 280;
    try{ drawPuppetFigure(pc.getContext('2d'), 120, 280, 0); }catch(e){}
    OPEN_FX.puppetCv = pc;
  }
  const base = OPEN_FX.pts;
  const cx = W/2, cy = H*0.42;
  const K = Math.min(W, H) * 0.0034;
  const miniK = K * 0.5;
  const DUR = 9400;
  const t0 = performance.now();
  const targets = [
    {x: cx - W*0.28, y: cy + H*0.15},
    {x: cx,          y: cy + H*0.16},
    {x: cx + W*0.28, y: cy + H*0.15},
  ];
  const cols = ['232,69,95', '226,178,110', '126,200,169'];
  const P = base.map((p,i)=>({
    ex: Math.random()*W,
    ey: Math.random() < 0.5 ? -30 : H + 30,
    ox: (p.x - 75) * K,  oy: (p.y - 75) * K,
    mxx: (p.x - 75) * miniK, myy: (p.y - 75) * miniK,
    stream: i % 3,
    ph: Math.random()*Math.PI*2, sz: 1 + Math.random()*2,
  }));
  const CAPS = [
    [500, 3100, '一脉辽纹 · 同源共生'],
    [3500, 5200, '同一套满族民俗纹样'],
    [5500, 7300, '流入剪纸 · 皮影 · 刺绣三种载体'],
    [7500, 9400, '三艺共生 · 辽韵三萃'],
  ];
  let capIdx = -1;
  cancelAnimationFrame(OPEN_FX.raf);
  OPEN_FX.raf = requestAnimationFrame(function frame(now){
    const t = now - t0;
    const k = Math.min(1, t / DUR);
    x.clearRect(0, 0, W, H);
    // 粒子
    P.forEach(p=>{
      let px, py, al, cl;
      if(t < 1900){                          // ① 金粒汇聚成花
        const q = Math.min(1, t/1900), e = 1 - Math.pow(1-q, 3);
        px = p.ex + (cx + p.ox - p.ex)*e;
        py = p.ey + (cy + p.oy - p.ey)*e;
        cl = '240,214,138'; al = 0.25 + e*0.65;
      } else if(t < 3600){                   // ② 团花定型 · 流光旋转
        const rot = (t-1900)*0.0006;
        const rr = Math.hypot(p.ox, p.oy), a0 = Math.atan2(p.oy, p.ox) + rot;
        px = cx + Math.cos(a0)*rr; py = cy + Math.sin(a0)*rr;
        cl = '240,214,138'; al = 0.9;
      } else if(t < 6300){                   // ③ 一源三流 · 分裂迁移
        const q = Math.min(1, (t-3600)/2400), e = q*q*(3-2*q);
        const tg = targets[p.stream];
        const gx = tg.x + p.mxx, gy = tg.y + p.myy;
        const mx = cx + p.ox + (gx - (cx+p.ox))*e;
        const my = cy + p.oy + (gy - (cy+p.oy))*e;
        const sw2 = Math.sin(p.ph + q*9) * 42 * (1-e);
        px = mx + Math.cos(q*7 + p.ph)*sw2;
        py = my + Math.sin(q*7 + p.ph)*sw2;
        cl = cols[p.stream]; al = 0.95;
      } else {                               // ④ 三载体成型 · 渐隐推进入厅
        const tg = targets[p.stream];
        px = tg.x + p.mxx; py = tg.y + p.myy;
        cl = cols[p.stream]; al = 0.95 - k*0.7;
      }
      x.globalAlpha = Math.max(0, al * (0.6 + 0.4*Math.sin(p.ph + t*0.012)));
      x.fillStyle = `rgba(${cl},1)`;
      x.beginPath(); x.arc(px, py, p.sz, 0, Math.PI*2); x.fill();
    });
    x.globalAlpha = 1;
    // 中央团花红笺底（②阶段呼吸）
    if(t > 1500 && t < 4400){
      const a2 = Math.sin((t-1500)/2900*Math.PI) * 0.8;
      x.save(); x.globalAlpha = a2;
      x.translate(cx, cy); x.rotate((t-1900)*0.0006);
      x.fillStyle = 'rgba(196,30,58,.3)';
      x.beginPath(); x.arc(0, 0, Math.min(W,H)*0.165, 0, Math.PI*2); x.fill();
      x.strokeStyle = 'rgba(240,214,138,.5)'; x.lineWidth = 2;
      x.beginPath(); x.arc(0, 0, Math.min(W,H)*0.165, 0, Math.PI*2); x.stroke();
      x.restore();
    }
    // 三载体成型小样
    if(t > 5600) drawOpeningEmblems(x, targets, Math.min(W,H)*0.15, Math.min(1, (t-5600)/900), t);
    // 字幕
    let ci = -1;
    for(let i=0;i<CAPS.length;i++) if(t >= CAPS[i][0] && t < CAPS[i][1]) ci = i;
    if(ci !== capIdx){
      capIdx = ci;
      if(ci < 0){ cap.classList.remove('show'); }
      else{
        cap.textContent = CAPS[ci][2];
        cap.classList.remove('show'); void cap.offsetWidth; cap.classList.add('show');
      }
    }
    // 尾段：整体渐隐推进
    if(t > 7800){
      const q = Math.min(1, (t-7800)/1600);
      ov.style.background = `rgba(5,3,9,${q*0.92})`;
    }
    if(t < DUR){ OPEN_FX.raf = requestAnimationFrame(frame); }
    else finishOpening();
  });
}
// 三载体成型小样：剪纸红笺 / 皮影镂刻 / 刺绣针脚环
function drawOpeningEmblems(x, targets, r, a, t){
  x.save(); x.globalAlpha = a;
  // ① 剪纸 · 纹样源头（左）
  let tg = targets[0];
  x.save(); x.translate(tg.x, tg.y); x.rotate(Math.sin(t*0.0007)*0.05);
  x.fillStyle = 'rgba(196,30,58,.94)';
  rrect(x, -r*1.12, -r*1.12, r*2.24, r*2.24, r*0.2); x.fill();
  x.strokeStyle = 'rgba(240,214,138,.8)'; x.lineWidth = 2;
  rrect(x, -r*1.12, -r*1.12, r*2.24, r*2.24, r*0.2); x.stroke();
  try{ MOTIFS[0].draw(x, 0, 0, r*0.58, '#FFF3E0', 'rgba(255,243,224,.7)'); }catch(e){}
  x.restore();
  // ② 皮影 · 转刻皮料（中）
  tg = targets[1];
  x.save(); x.translate(tg.x, tg.y); x.rotate(Math.sin(t*0.0006+1)*0.05);
  const g = x.createLinearGradient(-r, -r, r, r);
  g.addColorStop(0, '#E8C08A'); g.addColorStop(1, '#C89355');
  x.fillStyle = g;
  rrect(x, -r*0.86, -r*1.12, r*1.72, r*2.24, r*0.2); x.fill();
  x.strokeStyle = 'rgba(90,52,24,.7)'; x.lineWidth = 2;
  rrect(x, -r*0.86, -r*1.12, r*1.72, r*2.24, r*0.2); x.stroke();
  if(OPEN_FX.puppetCv) x.drawImage(OPEN_FX.puppetCv, -r*0.62, -r*1.02, r*1.24, r*2.9 - r*0.62);
  x.restore();
  // ③ 刺绣 · 织绣成纹（右）
  tg = targets[2];
  x.save(); x.translate(tg.x, tg.y); x.rotate(Math.sin(t*0.0008+2)*0.05);
  const g2 = x.createLinearGradient(-r, -r, r, r);
  g2.addColorStop(0, '#2c2040'); g2.addColorStop(1, '#1c1428');
  x.fillStyle = g2;
  rrect(x, -r*1.12, -r*1.12, r*2.24, r*2.24, r*0.2); x.fill();
  x.strokeStyle = 'rgba(212,168,67,.75)'; x.lineWidth = 2;
  rrect(x, -r*1.12, -r*1.12, r*2.24, r*2.24, r*0.2); x.stroke();
  x.setLineDash([5,4]);
  x.strokeStyle = '#F0D68A'; x.lineWidth = 2.4;
  for(let i=0;i<3;i++){
    x.beginPath(); x.arc(0, 0, r*(0.3 + i*0.28), 0, Math.PI*2); x.stroke();
  }
  x.setLineDash([]);
  x.fillStyle = '#E8455F';
  for(let i=0;i<8;i++){
    const a8 = i*Math.PI/4;
    x.beginPath(); x.arc(Math.cos(a8)*r*0.86, Math.sin(a8)*r*0.86, r*0.06, 0, Math.PI*2); x.fill();
  }
  x.restore();
  // 标注
  x.font = '13px "Noto Sans SC",sans-serif';
  x.textAlign = 'center';
  x.fillStyle = 'rgba(240,214,138,.92)';
  x.fillText('剪纸 · 纹样源头', targets[0].x, targets[0].y + r*1.55);
  x.fillText('皮影 · 转刻皮料', targets[1].x, targets[1].y + r*1.55);
  x.fillText('刺绣 · 织绣成纹', targets[2].x, targets[2].y + r*1.55);
  x.restore();
}
function finishOpening(){
  const ov = document.getElementById('opening-overlay');
  const cap = document.getElementById('opening-caption');
  OPEN_FX.running = false;
  if(cap) cap.classList.remove('show');
  const brand = ov && ov.querySelector('.opening-brand');
  // 开场 logo 飞入左上角顶部栏（成功启动飞行则延后隐藏品牌块）
  const flying = flyLogoToCorner();
  if(brand && !flying) brand.classList.remove('show');
  if(ov){
    ov.classList.remove('show');
    ov.classList.add('leave');
    ov.style.background = '';
    setTimeout(()=>ov.classList.remove('leave'), 900);
  }
  const d = OPEN_FX.done;
  OPEN_FX.done = null;
  if(d) d();
}
// 开场完整版 logo → 飞向左上角顶部栏图标（缩放 + 位移 + 末端淡出）
function flyLogoToCorner(){
  const brand = document.querySelector('.opening-brand');
  const logo = brand && brand.querySelector('.ob-logo');
  const icon = document.querySelector('.brand-icon');
  if(!logo || !icon) return false;
  const sr = logo.getBoundingClientRect();
  const tr = icon.getBoundingClientRect();
  if(!sr.width || !tr.width) return false;
  const dx = (tr.left + tr.width/2) - (sr.left + sr.width/2);
  const dy = (tr.top + tr.height/2) - (sr.top + sr.height/2);
  const s = tr.width / sr.width;
  brand.querySelectorAll('.ob-title,.ob-sub').forEach(el=>{
    el.animate([{opacity:1},{opacity:0}], {duration:520, easing:'ease-in', fill:'forwards'});
  });
  const corner = 'translate('+dx+'px,'+dy+'px)';
  const anim = logo.animate([
    {transform:'translate(0,0) scale(1)', opacity:1, easing:'cubic-bezier(.55,0,.3,1)'},
    {transform:corner+' scale('+s+')', opacity:1, offset:.78},
    {transform:corner+' scale('+(s*1.14)+')', opacity:1, offset:.85, easing:'ease-out'},
    {transform:corner+' scale('+(s*0.92)+')', opacity:1, offset:.92, easing:'ease-in'},
    {transform:corner+' scale('+s+')', opacity:1, offset:.97, easing:'ease-out'},
    {transform:corner+' scale('+s+')', opacity:0, offset:1}
  ], {duration:1100, fill:'forwards'});
  anim.onfinish = ()=>{
    brand.classList.remove('show');
    brand.style.display = 'none';
    logo.style.display = '';
  };
  return true;
}
function skipOpening(){
  if(!OPEN_FX.running) return;
  cancelAnimationFrame(OPEN_FX.raf);
  finishOpening();
}

// ---------- 皮影开演特效：篝火光晕 + 火星粒子 + 镂空透彩光 ----------
const STAGE_FX = {fire:null, ember:null, emberVel:null};
function initStagePerformFx(){
  if(typeof puppetSceneGroup === 'undefined' || !puppetSceneGroup || STAGE_FX.fire) return;
  const fire = new THREE.PointLight(0xff9a3d, 0, 22, 2);
  fire.position.set(0, 3.4, -1.6);
  puppetSceneGroup.add(fire);
  STAGE_FX.fire = fire;
  const n = 80, pos = new Float32Array(n*3), vel = new Float32Array(n);
  for(let i=0;i<n;i++){
    pos[i*3]   = (Math.random()-0.5)*8;
    pos[i*3+1] = 1.2 + Math.random()*6;
    pos[i*3+2] = -3.4 + Math.random()*2.6;
    vel[i] = 0.25 + Math.random()*0.55;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const ember = new THREE.Points(geo, new THREE.PointsMaterial({
    color:0xffb066, size:0.12, transparent:true, opacity:0.9,
    map:threadSpriteTexture(), blending:THREE.AdditiveBlending, depthWrite:false}));
  ember.visible = false;
  puppetSceneGroup.add(ember);
  STAGE_FX.ember = ember;
  STAGE_FX.emberVel = vel;
}
function updateStagePerformFx(delta, elapsed){
  if(!STAGE_FX.fire) return;
  const perf = STATE.currentScene === 'puppet' &&
    puppetObjects.some(o=>o.userData.type === 'puppet' && o.userData.animState === 'perform');
  const target = perf ? 1.35 + Math.sin(elapsed*11)*0.4 + Math.sin(elapsed*23+1.7)*0.22 : 0;
  STAGE_FX.fire.intensity += (target - STAGE_FX.fire.intensity) * 0.1;
  if(STAGE_FX.ember) STAGE_FX.ember.visible = perf;
  if(perf){
    if(STAGE_FX.ember){
      const arr = STAGE_FX.ember.geometry.attributes.position.array;
      for(let i=0;i<STAGE_FX.emberVel.length;i++){
        arr[i*3+1] += STAGE_FX.emberVel[i]*delta;
        arr[i*3]   += Math.sin(elapsed*2.4 + i)*delta*0.16;
        if(arr[i*3+1] > 7.6) arr[i*3+1] = 1.2;
      }
      STAGE_FX.ember.geometry.attributes.position.needsUpdate = true;
    }
    // 镂空缝隙透出彩光（色相流转）
    puppetObjects.forEach(o=>{
      const u = o.userData;
      if(u.type !== 'puppet' || !u.glow) return;
      u.glow.material.color.setHSL(((elapsed*40 + (u.phase0||0)*57) % 360)/360, 0.72, 0.62);
    });
  } else {
    puppetObjects.forEach(o=>{
      const u = o.userData;
      if(u.type === 'puppet' && u.glow) u.glow.material.color.set(0xffffff);
    });
  }
}

// ---------- 跨展区纹样投递（粒子飞递 → 双展厅自动生成载体展品） ----------
const DELIVER_FX = {cv:null, running:false};
const DELIVERED = {puppet:null, emb:null};
function makeDeliverCanvas(){
  const cv = document.createElement('canvas');
  cv.id = 'deliver-canvas';
  cv.style.cssText = 'position:fixed;inset:0;z-index:950;pointer-events:none;display:none;';
  document.body.appendChild(cv);
  return cv;
}
function deliverPattern(){
  if(STATE.flow.sel < 0){
    showGuide('deliverNeed', '请先在【纹样母体·新宾满族剪纸】选取或刻绘一款纹样，再进行纹样投递');
    return;
  }
  if(STATE.switching || FLOW.morphing || DELIVER_FX.running) return;
  const pat = STATE.flow.sel;
  closeFlow();
  DELIVER_FX.running = true;
  const cv = DELIVER_FX.cv || (DELIVER_FX.cv = makeDeliverCanvas());
  cv.style.display = 'block';
  cv.width = window.innerWidth; cv.height = window.innerHeight;
  const x = cv.getContext('2d');
  const W = cv.width, H = cv.height, cx = W/2, cy = H*0.45;
  const pts = sampleMotifPoints(MOTIFS[pat].draw, 120, 2, 420);
  const t0 = performance.now(), DUR = 1900;
  const dsts = [
    {x: W*0.09, y: H*0.28, cpx: W*0.2,  cpy: H*0.02},
    {x: W*0.91, y: H*0.28, cpx: W*0.8,  cpy: H*0.02},
  ];
  (function frame(now){
    const t = Math.min(1, (now - t0)/DUR);
    x.clearRect(0, 0, W, H);
    x.globalCompositeOperation = 'lighter';
    pts.forEach((p,i)=>{
      const d = dsts[i % 2];
      const sx = cx + (p.x - 60)*2.1, sy = cy + (p.y - 60)*2.1;
      const e = t*t*(3-2*t), b0 = 1-e;
      const bx = b0*b0*sx + 2*b0*e*d.cpx + e*e*d.x;
      const by = b0*b0*sy + 2*b0*e*d.cpy + e*e*d.y;
      x.globalAlpha = (1 - e*0.5) * (0.55 + 0.45*Math.sin(i + t*22));
      x.fillStyle = i % 3 ? 'rgba(240,214,138,1)' : 'rgba(232,69,95,1)';
      x.beginPath(); x.arc(bx, by, 1.3 + Math.random()*1.5, 0, Math.PI*2); x.fill();
    });
    x.globalAlpha = 1;
    x.globalCompositeOperation = 'source-over';
    if(t < 1){ requestAnimationFrame(frame); }
    else{
      cv.style.display = 'none';
      DELIVER_FX.running = false;
      // 双展厅同步生成同源载体版本
      applyCostume(pat);  STATE.flow.puppet[pat] = true;
      applyEmbroidery(pat); STATE.flow.emb[pat] = true;
      ensureDeliveredMesh('puppet', pat);
      ensureDeliveredMesh('emb', pat);
      updateBottomBarState();
      checkFlowComplete(pat);
      goldBoom(`纹样投递完成 · 「${FLOW_NAMES[pat]}」已在皮影展厅与刺绣展厅生成同源载体展品！`);
    }
  })(t0);
}
function ensureDeliveredMesh(hall, pat){
  const group = hall === 'puppet' ? puppetSceneGroup : embSceneGroup;
  const arr = hall === 'puppet' ? puppetObjects : embObjects;
  let m = DELIVERED[hall];
  if(!m){
    m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.4),
      new THREE.MeshBasicMaterial({transparent:true, opacity:0.97, side:THREE.DoubleSide}));
    if(hall === 'puppet'){ m.position.set(8.8, 4.4, 0.6); m.rotation.y = -Math.PI/2.6; }
    else { m.position.set(-8.8, 4.4, 0.6); m.rotation.y = Math.PI/2.6; }
    m.userData = {type:'prop', propId:'deliveredArt', baseY:4.4, phase:Math.random()*6};
    group.add(m);
    arr.push(m);
    DELIVERED[hall] = m;
  }
  m.material.map = makeTexture((ctx,w,h)=>{
    const g = ctx.createLinearGradient(0,0,w,h);
    if(hall === 'puppet'){ g.addColorStop(0,'#E8C08A'); g.addColorStop(1,'#B8882E'); }
    else { g.addColorStop(0,'#2c2040'); g.addColorStop(1,'#1c1428'); }
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = 'rgba(212,168,67,.9)'; ctx.lineWidth = 6; ctx.strokeRect(4,4,w-8,h-8);
    try{ MOTIFS[pat].draw(ctx, w/2, h*0.4, w*0.3,
      hall === 'puppet' ? '#5A3418' : '#F0D68A',
      hall === 'puppet' ? '#7A4A20' : '#E8455F'); }catch(e){}
    ctx.fillStyle = 'rgba(240,214,138,.95)';
    ctx.font = '17px "Noto Serif SC",serif'; ctx.textAlign = 'center';
    ctx.fillText('纹样投递 · ' + FLOW_NAMES[pat], w/2, h*0.88);
  }, 256, 340);
  m.material.needsUpdate = true;
}
function updateDeliveredFx(elapsed){
  ['puppet','emb'].forEach(k=>{
    const m = DELIVERED[k];
    if(m && m.userData) m.position.y = m.userData.baseY + Math.sin(elapsed*1.4 + m.userData.phase)*0.12;
  });
}

// ---------- 拼窗花成果贴墙（剪纸展厅墙面星光） ----------
let WALL_FLOWER = null;
function placeWindowFlowerOnWall(){
  if(!paperSceneGroup) return;
  if(!WALL_FLOWER){
    WALL_FLOWER = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.8),
      new THREE.MeshBasicMaterial({transparent:true, opacity:0.98, side:THREE.DoubleSide}));
    WALL_FLOWER.position.set(5.4, 4.8, 1.5);
    WALL_FLOWER.rotation.y = -0.5;
    WALL_FLOWER.userData = {type:'prop', propId:'wallFlower', baseY:4.8, phase:0};
    paperSceneGroup.add(WALL_FLOWER);
    paperObjects.push(WALL_FLOWER);
  }
  WALL_FLOWER.material.map = makeTexture((ctx,w,h)=>{
    ctx.fillStyle = '#1c1420'; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = 'rgba(212,168,67,.75)';
    ctx.lineWidth = 5; ctx.strokeRect(8,8,w-16,h-16);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(w/2,8); ctx.lineTo(w/2,h-8);
    ctx.moveTo(8,h/2); ctx.lineTo(w-8,h/2); ctx.stroke();
    try{ MOTIFS[0].draw(ctx, w/2, h/2, w*0.33, '#E8455F', '#C41E3A'); }catch(e){}
  }, 256, 256);
  WALL_FLOWER.material.needsUpdate = true;
  spawnGoldBurst(new THREE.Vector3(5.4, 4.8, 2.2), 42);
  goldBoom('窗花已贴上剪纸展厅墙面 · 金色星光洒满展窗！');
}

// ---------- 游戏1：纹样溯源拼图（3D碎片复原） ----------
const ASM = {open:false, inited:false, raf:0, canvas:null, ctx:null, pat:0,
  pieces:[], drag:null, off:{x:0,y:0}, parts:[], done:false, T:0};
const ASM_SLOTS = [[52,74],[260,46],[468,76],[40,260],[480,262],[56,460],[260,482],[464,458],[152,152]];
function openAsm(){
  document.getElementById('asm-overlay').classList.add('show');
  ASM.open = true;
  ASM.canvas = document.getElementById('asm-canvas');
  ASM.ctx = ASM.canvas.getContext('2d');
  if(!ASM.inited){ bindAsmEvents(); ASM.inited = true; }
  initAsm(STATE.flow.sel >= 0 ? STATE.flow.sel : 0);
  showGuide('asm', '破碎的民俗纹样 · 拖拽3D碎片到正确格位复原，即可解锁该纹样的流转权');
  cancelAnimationFrame(ASM.raf);
  asmLoop();
}
function closeAsm(){
  document.getElementById('asm-overlay').classList.remove('show');
  ASM.open = false;
  ASM.drag = null;
  cancelAnimationFrame(ASM.raf);
}
function initAsm(pat){
  ASM.pat = ((pat % 4) + 4) % 4;
  ASM.done = false;
  ASM.pieces = [];
  ASM.parts = [];
  ASM.drag = null;
  ['asm-m0','asm-m1','asm-m2','asm-m3'].forEach((id,i)=>{
    const el = document.getElementById(id);
    if(el) el.classList.toggle('tool-btn-active', i === ASM.pat);
  });
  // 源图：红纸底 + 母题
  const src = document.createElement('canvas');
  src.width = src.height = 390;
  const sx = src.getContext('2d');
  const g = sx.createLinearGradient(0,0,390,390);
  g.addColorStop(0,'#C41E3A'); g.addColorStop(1,'#8B1428');
  sx.fillStyle = g; sx.fillRect(0,0,390,390);
  try{ MOTIFS[ASM.pat].draw(sx, 195, 195, 126, '#FFF3E0', 'rgba(255,243,224,.75)'); }catch(e){}
  sx.strokeStyle = 'rgba(212,168,67,.85)'; sx.lineWidth = 6;
  sx.strokeRect(3,3,384,384);
  ASM.src = src;
  // 3×3 碎片（目标网格中心对齐画布中心）
  const slots = ASM_SLOTS.slice();
  for(let i=slots.length-1;i>0;i--){
    const j = (Math.random()*(i+1))|0;
    const tp = slots[i]; slots[i] = slots[j]; slots[j] = tp;
  }
  let n = 0;
  for(let r=0;r<3;r++){
    for(let c=0;c<3;c++){
      const slot = slots[n];
      ASM.pieces.push({
        sx:c*130, sy:r*130,
        tx:65 + c*130, ty:65 + r*130,
        x:slot[0], y:slot[1],
        ph:Math.random()*6, placed:false,
      });
      n++;
    }
  }
  updateAsmCount();
  const tip = document.getElementById('asm-tip');
  if(tip) tip.textContent = `「${FLOW_NAMES[ASM.pat]}」纹样碎裂 · 拖拽碎片复原`;
}
function updateAsmCount(){
  const n = ASM.pieces.filter(p=>p.placed).length;
  const el = document.getElementById('asm-count');
  if(el) el.textContent = `已复原 ${n}/9`;
}
function bindAsmEvents(){
  const c = ASM.canvas;
  const pos = e=>{
    const r = c.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return {x:(t.clientX - r.left)*(c.width/r.width), y:(t.clientY - r.top)*(c.height/r.height)};
  };
  function pick(pt){
    for(let i=ASM.pieces.length-1;i>=0;i--){
      const p = ASM.pieces[i];
      if(!p.placed && Math.abs(pt.x-p.x) < 66 && Math.abs(pt.y-p.y) < 66) return p;
    }
    return null;
  }
  function down(e){
    const pt = pos(e);
    const p = pick(pt);
    if(p){
      ASM.drag = p;
      ASM.off = {x:pt.x-p.x, y:pt.y-p.y};
      c.classList.add('dragging');
      e.preventDefault();
    }
  }
  function move(e){
    if(!ASM.drag) return;
    const pt = pos(e);
    ASM.drag.x = pt.x - ASM.off.x;
    ASM.drag.y = pt.y - ASM.off.y;
    e.preventDefault();
  }
  function up(){
    const p = ASM.drag;
    if(!p) return;
    ASM.canvas.classList.remove('dragging');
    if(Math.hypot(p.x-p.tx, p.y-p.ty) < 36){
      p.x = p.tx; p.y = p.ty; p.placed = true;
      for(let i=0;i<18;i++){
        const a = Math.random()*Math.PI*2, sp = 1+Math.random()*3;
        ASM.parts.push({x:p.tx, y:p.ty, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp,
          life:1, size:1.5+Math.random()*2.4, c:Math.random()<0.6?'#F0D68A':'#E8455F'});
      }
      updateAsmCount();
      if(ASM.pieces.every(q=>q.placed) && !ASM.done) asmSuccess();
    }
    ASM.drag = null;
  }
  c.addEventListener('mousedown', down);
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);
  c.addEventListener('touchstart', down, {passive:false});
  c.addEventListener('touchmove', move, {passive:false});
  c.addEventListener('touchend', up);
}
function asmSuccess(){
  ASM.done = true;
  goldBoom(`「${FLOW_NAMES[ASM.pat]}」纹样复原成功 · 已解锁流转权，可在纹样流转中使用！`);
  for(let i=0;i<80;i++){
    const a = Math.random()*Math.PI*2, sp = 1.5+Math.random()*4.5;
    ASM.parts.push({x:260, y:260, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-1.5,
      life:1, size:1.5+Math.random()*2.6, c:Math.random()<0.6?'#F0D68A':'#E8455F'});
  }
  // 通关奖励：解锁该纹样（母体诞生）→ 可导出到皮影、刺绣使用
  STATE.flow.born[ASM.pat] = true;
  STATE.flow.sel = ASM.pat;
  updateBottomBarState();
  unlockCode('pingtu');
  const tip = document.getElementById('asm-tip');
  if(tip) tip.textContent = '✔ 复原完成 · 纹样已解锁，底部「纹样流转」可投递到皮影/刺绣展厅';
}
function asmLoop(){
  if(!ASM.open) return;
  const ctx = ASM.ctx, T = (ASM.T += 0.016);
  const bg = ctx.createLinearGradient(0,0,520,520);
  bg.addColorStop(0,'#141020'); bg.addColorStop(1,'#0f0c1a');
  ctx.fillStyle = bg; ctx.fillRect(0,0,520,520);
  // 幽灵目标网格
  if(ASM.src){
    ctx.save(); ctx.globalAlpha = 0.14;
    ctx.drawImage(ASM.src, 65, 65);
    ctx.restore();
    ctx.strokeStyle = 'rgba(212,168,67,.4)'; ctx.lineWidth = 1.5;
    ctx.setLineDash([7,6]);
    for(let i=0;i<=3;i++){
      ctx.beginPath(); ctx.moveTo(65+i*130, 65); ctx.lineTo(65+i*130, 455); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(65, 65+i*130); ctx.lineTo(455, 65+i*130); ctx.stroke();
    }
    ctx.setLineDash([]);
  }
  // 碎片（3D悬浮感：投影 + 浮动 + 微转）
  const drawPiece = (p, dragging)=>{
    ctx.save();
    const bob = p.placed ? 0 : Math.sin(T*2 + p.ph)*6;
    ctx.translate(p.x, p.y + bob);
    ctx.rotate(p.placed ? 0 : Math.sin(T*1.4 + p.ph)*0.035);
    if(dragging){ ctx.scale(1.1, 1.1); }
    ctx.shadowColor = 'rgba(0,0,0,.65)';
    ctx.shadowBlur = dragging ? 24 : 12;
    ctx.shadowOffsetY = dragging ? 10 : 5;
    ctx.drawImage(ASM.src, p.sx, p.sy, 130, 130, -65, -65, 130, 130);
    ctx.restore();
  };
  ASM.pieces.forEach(p=>{ if(!p.placed && p !== ASM.drag) drawPiece(p, false); });
  if(ASM.drag) drawPiece(ASM.drag, true);
  ASM.pieces.forEach(p=>{ if(p.placed) drawPiece(p, false); });
  // 金粒融合粒子
  ASM.parts.forEach(p=>{ p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life -= 0.024; });
  ASM.parts = ASM.parts.filter(p=>p.life > 0);
  ASM.parts.forEach(p=>{
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.c;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
  });
  ctx.globalAlpha = 1;
  if(ASM.done){
    ctx.fillStyle = '#F0D68A'; ctx.font = 'bold 16px "Noto Serif SC",serif'; ctx.textAlign = 'center';
    ctx.fillText('✔ 纹样复原成功 · 已解锁流转权', 260, 505);
  }
  ASM.raf = requestAnimationFrame(asmLoop);
}

// ---------- 游戏2：皮影排演小剧场（编排 + 开演 + 海报） ----------
const DRAMA = {open:false, inited:false, raf:0, canvas:null, ctx:null, story:0,
  cast:[], drag:null, dragOff:{x:0,y:0}, moved:0, orderMax:2,
  playing:false, pt:0, lastT:0, posterReady:false, T:0};
const DRAMA_STORIES = [
  {name:'满族过大年', lines:['腊月廿三 · 祭灶剪窗花','影人登台 · 拜年贺岁','连年有余 · 岁岁平安']},
  {name:'萨满祈福', lines:['神鼓声起 · 焚香请神','影人绕场 · 祈福纳吉','风调雨顺 · 阖家安康']},
];
const DRAMA_ROLES = ['武将','文生','旦角'];
const DRAMA_PUP_CVS = [];
function openDrama(){
  document.getElementById('drama-overlay').classList.add('show');
  DRAMA.open = true;
  DRAMA.canvas = document.getElementById('drama-canvas');
  DRAMA.ctx = DRAMA.canvas.getContext('2d');
  if(!DRAMA.inited){ initDramaCast(); bindDramaEvents(); DRAMA.inited = true; }
  selectDramaStory(DRAMA.story);
  showGuide('drama', '拖拽皮影排布走位 · 点击皮影切换出场顺序 · 「一键开演」后可生成短剧海报');
  DRAMA.lastT = performance.now();
  cancelAnimationFrame(DRAMA.raf);
  dramaLoop();
}
function closeDrama(){
  document.getElementById('drama-overlay').classList.remove('show');
  DRAMA.open = false;
  DRAMA.drag = null;
  cancelAnimationFrame(DRAMA.raf);
}
function initDramaCast(){
  if(!DRAMA_PUP_CVS.length){
    for(let f=0;f<3;f++){
      const c = document.createElement('canvas');
      c.width = 130; c.height = 320;
      try{ drawPuppetFigure(c.getContext('2d'), 130, 320, f); }catch(e){}
      DRAMA_PUP_CVS.push(c);
    }
  }
  DRAMA.cast = [0,1,2].map(i=>({
    fig:i, x:170 + i*150, y:210, order:i, inShow:true,
  }));
  DRAMA.orderMax = 2;
  updateDramaOrderChip();
}
function updateDramaOrderChip(){
  const el = document.getElementById('drama-order');
  if(!el) return;
  const seq = DRAMA.cast.slice().sort((a,b)=>a.order-b.order)
    .map(p=>DRAMA_ROLES[p.fig]).join('→');
  el.textContent = '出场：' + seq;
}
// 重排：恢复初始走位与出场顺序（停止演出中的剧目）
function resetDramaStage(){
  if(DRAMA.playing){ DRAMA.playing = false; const pb = document.getElementById('drama-play-btn'); if(pb) pb.textContent = '▶ 一键开演'; }
  DRAMA.drag = null;
  DRAMA.posterReady = false;
  const pb2 = document.getElementById('drama-poster-btn');
  if(pb2) pb2.style.display = 'none';
  initDramaCast();
  showGuide('drama', '舞台已重排 · 拖拽皮影走位 · 点击皮影切换出场顺序 · 「一键开演」生成短剧海报');
}
function selectDramaStory(s){
  DRAMA.story = s;
  ['drama-s0','drama-s1'].forEach((id,i)=>{
    const el = document.getElementById(id);
    if(el) el.classList.toggle('tool-btn-active', i === s);
  });
  DRAMA.playing = false;
  DRAMA.posterReady = false;
  const pb = document.getElementById('drama-poster-btn');
  if(pb) pb.style.display = 'none';
}
function bindDramaEvents(){
  const c = DRAMA.canvas;
  const pos = e=>{
    const r = c.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return {x:(t.clientX - r.left)*(c.width/r.width), y:(t.clientY - r.top)*(c.height/r.height)};
  };
  function down(e){
    if(DRAMA.playing) return;
    const pt = pos(e);
    for(let i=DRAMA.cast.length-1;i>=0;i--){
      const p = DRAMA.cast[i];
      if(Math.abs(pt.x-p.x) < 62 && Math.abs(pt.y-p.y) < 105){
        DRAMA.drag = p;
        DRAMA.dragOff = {x:pt.x-p.x, y:pt.y-p.y};
        DRAMA.moved = 0;
        e.preventDefault();
        return;
      }
    }
  }
  function move(e){
    if(!DRAMA.drag) return;
    const pt = pos(e);
    DRAMA.moved += Math.abs(pt.x - (DRAMA.drag.x + DRAMA.dragOff.x)) + Math.abs(pt.y - (DRAMA.drag.y + DRAMA.dragOff.y));
    DRAMA.drag.x = Math.max(70, Math.min(570, pt.x - DRAMA.dragOff.x));
    DRAMA.drag.y = Math.max(140, Math.min(300, pt.y - DRAMA.dragOff.y));
    e.preventDefault();
  }
  function up(){
    const p = DRAMA.drag;
    if(!p) return;
    // 点击（未拖动）→ 切换出场顺序（排到末位）
    if(DRAMA.moved < 8){
      p.order = ++DRAMA.orderMax;
      updateDramaOrderChip();
      showToast(`「${DRAMA_ROLES[p.fig]}」调整为第 ${DRAMA.cast.filter(q=>q.order<=p.order).length} 位出场`);
    }
    DRAMA.drag = null;
  }
  c.addEventListener('mousedown', down);
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);
  c.addEventListener('touchstart', down, {passive:false});
  c.addEventListener('touchmove', move, {passive:false});
  c.addEventListener('touchend', up);
}
function playDramaShow(){
  if(DRAMA.playing) return;
  DRAMA.playing = true;
  DRAMA.pt = 0;
  DRAMA.posterReady = false;
  const pb = document.getElementById('drama-poster-btn');
  if(pb) pb.style.display = 'none';
  showToast('开演！三非遗同源纹样皮影 · 民俗小剧场');
}
function dramaLoop(){
  if(!DRAMA.open) return;
  const ctx = DRAMA.ctx;
  const now = performance.now();
  const dt = Math.min(0.05, (now - DRAMA.lastT)/1000);
  DRAMA.lastT = now;
  DRAMA.T += dt;
  if(DRAMA.playing){
    DRAMA.pt += dt;
    if(DRAMA.pt > 3*2.4 + 1.8){
      DRAMA.playing = false;
      DRAMA.posterReady = true;
      const pb = document.getElementById('drama-poster-btn');
      if(pb) pb.style.display = '';
      goldBoom('排演完成 · 可生成专属短剧海报！');
    }
  }
  const W = 640, H = 400;
  const st = DRAMA_STORIES[DRAMA.story];
  // 背景
  const bg = ctx.createLinearGradient(0,0,W,H);
  bg.addColorStop(0,'#0e0a16'); bg.addColorStop(1,'#120b12');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
  // 幕布后篝火光晕（演出时炽亮抖动）
  const fire = DRAMA.playing ? 0.55 + Math.sin(DRAMA.T*11)*0.14 + Math.sin(DRAMA.T*23)*0.07 : 0.3;
  const fg = ctx.createRadialGradient(W/2, 330, 12, W/2, 330, 240);
  fg.addColorStop(0, `rgba(255,150,60,${fire*0.55})`);
  fg.addColorStop(0.5, `rgba(255,110,40,${fire*0.2})`);
  fg.addColorStop(1, 'rgba(255,110,40,0)');
  ctx.fillStyle = fg; ctx.fillRect(0,0,W,H);
  // 白幕（影窗）
  const scrX = 130, scrY = 56, scrW = 380, scrH = 240;
  const flick = DRAMA.playing ? 0.93 + Math.sin(DRAMA.T*17)*0.03 : 0.9;
  ctx.fillStyle = `rgba(246,238,218,${flick})`;
  ctx.fillRect(scrX, scrY, scrW, scrH);
  ctx.strokeStyle = '#D4A843'; ctx.lineWidth = 6;
  ctx.strokeRect(scrX-4, scrY-4, scrW+8, scrH+8);
  // 侧幕帷幔
  ctx.fillStyle = '#8B1428';
  ctx.beginPath();
  ctx.moveTo(0,0); ctx.lineTo(150,0); ctx.lineTo(108,56); ctx.lineTo(108,320); ctx.lineTo(0,340);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W,0); ctx.lineTo(W-150,0); ctx.lineTo(W-108,56); ctx.lineTo(W-108,320); ctx.lineTo(W,340);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(240,214,138,.35)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(108,56); ctx.lineTo(108,320); ctx.moveTo(W-108,56); ctx.lineTo(W-108,320); ctx.stroke();
  // 皮影（演出时按出场顺序依次登台）
  ctx.save();
  ctx.beginPath(); ctx.rect(scrX, scrY, scrW, scrH); ctx.clip();
  const seq = DRAMA.cast.slice().sort((a,b)=>a.order-b.order);
  seq.forEach((p, si)=>{
    let px = p.x, py = p.y, sc = 0.62;
    if(DRAMA.playing){
      const enterAt = si*2.4;
      if(DRAMA.pt < enterAt) return;
      const q = Math.min(1, (DRAMA.pt - enterAt)/1.2), e = 1 - Math.pow(1-q, 3);
      const fromX = si % 2 ? scrX + scrW + 60 : scrX - 60;
      px = fromX + (p.x - fromX)*e;
      if(q >= 1) py = p.y + Math.sin(DRAMA.T*3 + si)*6;
      if(DRAMA.pt < enterAt + 0.9 && Math.floor(DRAMA.pt*2) % 2 === 0) sc = 0.66;
    }
    const bobY = DRAMA.playing ? 0 : Math.sin(DRAMA.T*1.8 + si)*4;
    ctx.save();
    ctx.translate(px, py + bobY);
    ctx.scale(sc, sc);
    ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
    ctx.drawImage(DRAMA_PUP_CVS[p.fig], -65, -160);
    ctx.restore();
    // 出场序号徽章
    ctx.save();
    ctx.translate(px, py - 128);
    ctx.fillStyle = 'rgba(13,13,26,.85)';
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#F0D68A'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#F0D68A'; ctx.font = 'bold 14px "Noto Sans SC",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(si+1), 0, 1);
    ctx.restore();
  });
  ctx.restore();
  // 台面
  ctx.fillStyle = '#241014';
  ctx.fillRect(0, 340, W, 60);
  ctx.strokeStyle = 'rgba(212,168,67,.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 340); ctx.lineTo(W, 340); ctx.stroke();
  // 字幕
  ctx.fillStyle = 'rgba(13,13,26,.8)';
  ctx.fillRect(150, 348, 340, 40);
  ctx.strokeStyle = 'rgba(212,168,67,.5)'; ctx.strokeRect(150, 348, 340, 40);
  ctx.fillStyle = '#F0D68A';
  ctx.font = '15px "Noto Serif SC",serif'; ctx.textAlign = 'center';
  if(DRAMA.playing){
    const li = Math.min(2, Math.floor(DRAMA.pt/2.4));
    ctx.fillText(st.lines[li], W/2, 374);
  } else {
    ctx.fillText(DRAMA.posterReady ? '✔ 排演完成 · 可生成短剧海报' : `${st.name} · 拖拽皮影排布走位`, W/2, 374);
  }
  DRAMA.raf = requestAnimationFrame(dramaLoop);
}
function makeDramaPoster(){
  const card = document.createElement('canvas');
  card.width = 900; card.height = 1200;
  const x = card.getContext('2d');
  const g = x.createLinearGradient(0,0,900,1200);
  g.addColorStop(0,'#14102a'); g.addColorStop(.5,'#1e1430'); g.addColorStop(1,'#120d24');
  x.fillStyle = g; x.fillRect(0,0,900,1200);
  x.strokeStyle = '#D4A843'; x.lineWidth = 7; x.strokeRect(22,22,856,1156);
  x.lineWidth = 2; x.strokeRect(38,38,824,1124);
  [[46,46],[854,46],[46,1154],[854,1154]].forEach(([px,py])=>{
    x.save(); x.translate(px,py);
    for(let i=0;i<3;i++) x.strokeRect(-20+i*6,-20+i*6,40-i*12,40-i*12);
    x.restore();
  });
  x.textAlign = 'center';
  x.fillStyle = '#F0D68A';
  x.font = '900 52px "Noto Serif SC",serif';
  x.shadowColor = 'rgba(212,168,67,.55)'; x.shadowBlur = 16;
  x.fillText('皮影排演小剧场', 450, 118);
  x.shadowBlur = 0;
  x.font = '30px "Noto Serif SC",serif';
  x.fillStyle = '#E8455F';
  x.fillText(`《${DRAMA_STORIES[DRAMA.story].name}》`, 450, 176);
  x.font = '17px "Noto Sans SC",sans-serif';
  x.fillStyle = 'rgba(237,228,211,.7)';
  x.fillText('一脉辽纹 · 三艺共生 —— 同源纹样皮影演绎', 450, 214);
  // 剧场实况快照
  x.drawImage(DRAMA.canvas, 60, 250, 780, 488);
  x.strokeStyle = 'rgba(212,168,67,.6)'; x.lineWidth = 3;
  x.strokeRect(60, 250, 780, 488);
  // 剧目台词
  const lines = DRAMA_STORIES[DRAMA.story].lines;
  x.font = '24px "Noto Serif SC",serif';
  x.fillStyle = 'rgba(240,214,138,.92)';
  lines.forEach((ln,i)=>x.fillText(`${'一二三'[i]} · ${ln}`, 450, 810 + i*54));
  // 纹样装饰条
  for(let i=0;i<5;i++){
    const cv = document.createElement('canvas');
    cv.width = cv.height = 72;
    try{ MOTIFS[[0,1,2,3,7][i]].draw(cv.getContext('2d'), 36, 36, 22, '#F0D68A', '#E8455F'); }catch(e){}
    x.drawImage(cv, 210 + i*100, 980, 62, 62);
  }
  // 印章
  x.save();
  x.translate(760, 1040); x.rotate(-0.12);
  x.fillStyle = 'rgba(196,30,58,.92)';
  rrect(x, -52, -52, 104, 104, 10); x.fill();
  x.fillStyle = '#FFF3E0'; x.font = '900 40px "Noto Serif SC",serif';
  x.fillText('辽韵', 0, 14);
  x.restore();
  x.font = '15px "Noto Sans SC",sans-serif';
  x.fillStyle = 'rgba(237,228,211,.6)';
  x.fillText('辽韵三萃 · 辽宁非遗沉浸式3D交互H5 · 我的民俗小剧场作品', 450, 1120);
  const a = document.createElement('a');
  a.download = '辽韵三萃-皮影小剧场海报.png';
  a.href = card.toDataURL('image/png');
  a.click();
  unlockCode('juchang');
  goldBoom('短剧海报已生成 · 已开始下载保存');
}

// ---------- 游戏3：绣纹闯关（轨迹运针 + 杂线躲避 + 高级色板） ----------
const EG = {open:false, inited:false, raf:0, canvas:null, ctx:null,
  path:[], cur:0, lives:3, hazards:[], parts:[], player:null,
  inv:0, done:false, T:0, shakeT:0};
const EG_PREMIUM = ['#D4A843','#8B5A2B','#4E7A9B','#9C3D54'];
function buildEGPath(){
  const pts = [];
  for(let a=0; a<=Math.PI*4 + 0.001; a+=0.085){
    const r = 146*(0.55 + 0.45*Math.sin(a*1.25));
    pts.push({x:260 + Math.cos(a)*r, y:256 + Math.sin(a)*r*0.94});
  }
  return pts;
}
function openEmbGame(){
  document.getElementById('embgame-overlay').classList.add('show');
  EG.open = true;
  EG.canvas = document.getElementById('eg-canvas');
  EG.ctx = EG.canvas.getContext('2d');
  if(!EG.inited){ bindEGEvents(); EG.inited = true; }
  initEmbGame();
  showGuide('eg', '沿金色引导点运针 · 躲避游走的红色杂线 · 通关解锁满族高级配色色板');
  cancelAnimationFrame(EG.raf);
  egLoop();
}
function closeEmbGame(){
  document.getElementById('embgame-overlay').classList.remove('show');
  EG.open = false;
  cancelAnimationFrame(EG.raf);
}
function initEmbGame(){
  EG.path = buildEGPath();
  EG.cur = 0;
  EG.lives = 3;
  EG.parts = [];
  EG.inv = 0;
  EG.done = false;
  EG.player = {x:EG.path[0].x, y:EG.path[0].y};
  EG.hazards = [0,1,2].map(i=>({
    x: 120 + i*140, y: 120 + (i%2)*260,
    vx: (Math.random()<0.5?-1:1)*(0.9+Math.random()*0.9),
    vy: (Math.random()<0.5?-1:1)*(0.9+Math.random()*0.9),
    ph: Math.random()*6,
  }));
  updateEGChips();
  const tip = document.getElementById('eg-tip');
  if(tip) tip.textContent = '按住鼠标沿金点运针 · 碰到红色杂线扣一颗心';
}
function updateEGChips(){
  const life = document.getElementById('eg-life');
  if(life) life.textContent = '❤'.repeat(EG.lives) + '🖤'.repeat(3-EG.lives);
  const step = document.getElementById('eg-step');
  if(step) step.textContent = `运针 ${Math.round(EG.cur/Math.max(1,EG.path.length)*100)}%`;
}
function bindEGEvents(){
  const c = EG.canvas;
  const pos = e=>{
    const r = c.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return {x:(t.clientX - r.left)*(c.width/r.width), y:(t.clientY - r.top)*(c.height/r.height)};
  };
  function move(e){
    const pt = pos(e);
    if(!EG.player || EG.done) { EG.player = pt; return; }
    EG.player = pt;
    // 运针判定
    if(EG.cur < EG.path.length){
      const g = EG.path[EG.cur];
      if(Math.hypot(pt.x-g.x, pt.y-g.y) < 17){
        EG.cur++;
        for(let i=0;i<3;i++){
          EG.parts.push({x:g.x, y:g.y, vx:(Math.random()-.5)*2, vy:(Math.random()-.5)*2-0.6,
            life:1, size:1.2+Math.random()*2, c:Math.random()<0.5?'#F0D68A':'#E8455F'});
        }
        updateEGChips();
        if(EG.cur >= EG.path.length) egSuccess();
      }
    }
    // 杂线碰撞
    if(EG.inv <= 0 && !EG.done){
      for(const hz of EG.hazards){
        if(Math.hypot(pt.x-hz.x, pt.y-hz.y) < 16){
          EG.lives--;
          EG.inv = 1.3;
          EG.shakeT = 0.35;
          EG.cur = Math.max(0, EG.cur - 12);
          for(let i=0;i<14;i++){
            EG.parts.push({x:pt.x, y:pt.y, vx:(Math.random()-.5)*4, vy:(Math.random()-.5)*4,
              life:1, size:1.6+Math.random()*2, c:'#FF5252'});
          }
          updateEGChips();
          if(EG.lives <= 0){
            showToast('别灰心 · 绣针被杂线缠住了，重新运针再试一次！');
            EG.lives = 3;
            EG.cur = 0;
            EG.inv = 1.6;
            updateEGChips();
          } else {
            showToast(`杂线缠针！剩余 ❤${EG.lives} · 避开红线继续`);
          }
          break;
        }
      }
    }
    e.preventDefault();
  }
  c.addEventListener('mousemove', move);
  c.addEventListener('touchmove', move, {passive:false});
}
function egSuccess(){
  EG.done = true;
  goldBoom('绣纹闯关通关 · 解锁满族高级配色色板！');
  for(let i=0;i<80;i++){
    const a = Math.random()*Math.PI*2, sp = 1.5+Math.random()*4.5;
    EG.parts.push({x:260, y:256, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-1.5,
      life:1, size:1.5+Math.random()*2.6, c:Math.random()<0.6?'#F0D68A':'#E8455F'});
  }
  if(!STATE.premiumPalette){
    STATE.premiumPalette = true;
    STITCH_ACCENTS.push(...EG_PREMIUM);
    buildStitchPaletteRefresh();
  }
  unlockCode('xiuweng');
  const tip = document.getElementById('eg-tip');
  if(tip) tip.textContent = '✔ 通关！满族高级色板已解锁 · 「纹样拼贴」可用新配色';
}
function buildStitchPaletteRefresh(){
  const pal = document.getElementById('stitch-palette');
  if(!pal || !STITCH.inited) return;
  pal.innerHTML = '';
  buildStitchPalette();
}
function egLoop(){
  if(!EG.open) return;
  const ctx = EG.ctx, T = (EG.T += 0.016);
  // 织物底（复用走线工坊布料）
  const bg = ctx.createLinearGradient(0,0,520,520);
  bg.addColorStop(0,'#141020'); bg.addColorStop(1,'#0f0c1a');
  ctx.fillStyle = bg; ctx.fillRect(0,0,520,520);
  drawThreadFabric(ctx);
  // 受击抖动
  if(EG.shakeT > 0){
    EG.shakeT -= 0.016;
    ctx.save();
    ctx.translate((Math.random()-0.5)*7*EG.shakeT*3, (Math.random()-0.5)*7*EG.shakeT*3);
  }
  // 引导轨迹（金色）+ 已绣线
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.setLineDash([2,7]);
  ctx.strokeStyle = 'rgba(212,168,67,.45)'; ctx.lineWidth = 3;
  ctx.beginPath();
  EG.path.forEach((p,i)=>{ i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y); });
  ctx.stroke();
  ctx.setLineDash([]);
  if(EG.cur > 1){
    const prog = EG.cur/EG.path.length;
    const hue = 340 - prog*160;
    ctx.strokeStyle = `hsl(${hue},68%,58%)`; ctx.lineWidth = 4.5;
    ctx.beginPath();
    for(let i=0;i<EG.cur;i++){ const p=EG.path[i]; i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.4;
    ctx.beginPath();
    for(let i=0;i<EG.cur;i++){ const p=EG.path[i]; i ? ctx.lineTo(p.x-0.8,p.y-1.4) : ctx.moveTo(p.x-0.8,p.y-1.4); }
    ctx.stroke();
  }
  // 当前针点脉冲
  if(EG.cur < EG.path.length && !EG.done){
    const g = EG.path[EG.cur];
    const pulse = 0.5 + 0.5*Math.sin(T*5);
    ctx.fillStyle = '#F0D68A';
    ctx.beginPath(); ctx.arc(g.x, g.y, 4+pulse*2, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = `rgba(240,214,138,${0.3+pulse*0.5})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(g.x, g.y, 13+pulse*6, 0, Math.PI*2); ctx.stroke();
  }
  // 杂线（红色游走丝线）
  EG.hazards.forEach(hz=>{
    hz.x += hz.vx; hz.y += hz.vy;
    if(hz.x < 46 || hz.x > 474) hz.vx *= -1;
    if(hz.y < 46 || hz.y > 474) hz.vy *= -1;
    const wob = Math.sin(T*6 + hz.ph)*3;
    ctx.strokeStyle = 'rgba(255,82,82,.9)'; ctx.lineWidth = 3;
    ctx.shadowColor = '#FF5252'; ctx.shadowBlur = 10;
    ctx.beginPath();
    for(let k=-1;k<=1;k++){
      ctx.moveTo(hz.x - 16, hz.y + k*7 + wob);
      ctx.quadraticCurveTo(hz.x, hz.y + k*7 - wob, hz.x + 16, hz.y + k*7 + wob);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  });
  // 绣针（玩家）
  if(EG.player && !EG.done){
    const inv = EG.inv > 0;
    if(EG.inv > 0) EG.inv -= 0.016;
    ctx.save();
    ctx.globalAlpha = inv && Math.floor(T*14)%2 === 0 ? 0.3 : 1;
    ctx.translate(EG.player.x, EG.player.y); ctx.rotate(T*1.6);
    ctx.strokeStyle = '#D8D8E0'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(14, 0); ctx.stroke();
    ctx.strokeStyle = '#8B1428'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(17.5, 0, 3.4, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
  }
  // 粒子
  EG.parts.forEach(p=>{ p.x += p.vx; p.y += p.vy; p.vy += 0.045; p.life -= 0.026; });
  EG.parts = EG.parts.filter(p=>p.life > 0);
  EG.parts.forEach(p=>{
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.c;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });
  ctx.globalAlpha = 1;
  if(EG.shakeT > 0) ctx.restore();
  if(EG.done){
    ctx.fillStyle = '#F0D68A'; ctx.font = 'bold 16px "Noto Serif SC",serif'; ctx.textAlign = 'center';
    ctx.fillText('✔ 通关！满族高级配色色板已解锁', 260, 505);
  }
  EG.raf = requestAnimationFrame(egLoop);
}

// ---------- 数字文创工坊（壁纸 / 明信片 / 二维码分享卡） ----------
function openShop(){
  document.getElementById('shop-overlay').classList.add('show');
  drawShopPreview();
  showGuide('shop', '你的创作纹样可一键生成手机壁纸 / 民俗明信片 / 二维码分享卡 —— 可带走的数字文创');
}
function closeShop(){
  document.getElementById('shop-overlay').classList.remove('show');
}
function shopPatternIdx(){
  return STATE.flow.sel >= 0 ? STATE.flow.sel : 0;
}
function drawShopPreview(){
  const cv = document.getElementById('shop-preview');
  if(!cv) return;
  const x = cv.getContext('2d');
  const pat = shopPatternIdx();
  const g = x.createLinearGradient(0,0,300,200);
  g.addColorStop(0,'#1e1430'); g.addColorStop(1,'#120d24');
  x.fillStyle = g; x.fillRect(0,0,300,200);
  const rg = x.createRadialGradient(150,100,10,150,100,150);
  rg.addColorStop(0,'rgba(212,168,67,.18)'); rg.addColorStop(1,'rgba(212,168,67,0)');
  x.fillStyle = rg; x.fillRect(0,0,300,200);
  try{ motifDraw(pat).draw(x, 88, 100, 54, '#F0D68A', '#E8455F'); }catch(e){}
  x.fillStyle = '#F0D68A'; x.font = '700 20px "Noto Serif SC",serif'; x.textAlign = 'left';
  x.fillText('辽韵三萃', 168, 82);
  x.font = '12px "Noto Sans SC",sans-serif';
  x.fillStyle = 'rgba(237,228,211,.8)';
  x.fillText('一脉辽纹 · 三艺共生', 168, 110);
  x.fillText(`纹样：「${FLOW_NAMES[pat]}」`, 168, 134);
  x.strokeStyle = 'rgba(212,168,67,.55)'; x.lineWidth = 1.5;
  x.strokeRect(5,5,290,190);
}
function downloadCanvas(cv, name){
  const a = document.createElement('a');
  a.download = name;
  a.href = cv.toDataURL('image/png');
  a.click();
}
function makeWallpaper(){
  const pat = shopPatternIdx();
  const cv = document.createElement('canvas');
  cv.width = 1080; cv.height = 1920;
  const x = cv.getContext('2d');
  const g = x.createLinearGradient(0,0,0,1920);
  g.addColorStop(0,'#1a1128'); g.addColorStop(.5,'#1e1430'); g.addColorStop(1,'#0f0a1a');
  x.fillStyle = g; x.fillRect(0,0,1080,1920);
  const rg = x.createRadialGradient(540,860,60,540,860,720);
  rg.addColorStop(0,'rgba(212,168,67,.2)'); rg.addColorStop(1,'rgba(212,168,67,0)');
  x.fillStyle = rg; x.fillRect(0,0,1080,1920);
  x.strokeStyle = 'rgba(212,168,67,.5)'; x.lineWidth = 3;
  x.strokeRect(36,36,1008,1848);
  x.lineWidth = 1; x.strokeRect(52,52,976,1816);
  [[60,60],[1020,60],[60,1860],[1020,1860]].forEach(([px,py])=>{
    x.save(); x.translate(px,py);
    for(let i=0;i<3;i++) x.strokeRect(-24+i*7,-24+i*7,48-i*14,48-i*14);
    x.restore();
  });
  x.textAlign = 'center';
  x.fillStyle = '#F0D68A';
  x.font = '900 84px "Noto Serif SC",serif';
  x.shadowColor = 'rgba(212,168,67,.5)'; x.shadowBlur = 22;
  x.fillText('辽韵三萃', 540, 240);
  x.shadowBlur = 0;
  x.font = '30px "Noto Sans SC",sans-serif';
  x.fillStyle = 'rgba(237,228,211,.75)';
  x.fillText('一 脉 辽 纹 · 三 艺 共 生', 540, 310);
  // 主纹样
  const mcv = document.createElement('canvas');
  mcv.width = mcv.height = 640;
  try{ motifDraw(pat).draw(mcv.getContext('2d'), 320, 320, 190, '#F0D68A', '#E8455F'); }catch(e){}
  x.drawImage(mcv, 220, 560);
  x.fillStyle = '#E8455F'; x.font = '600 40px "Noto Serif SC",serif';
  x.fillText(`「${FLOW_NAMES[pat]}」`, 540, 1330);
  x.font = '26px "Noto Sans SC",sans-serif';
  x.fillStyle = 'rgba(237,228,211,.7)';
  x.fillText('剪纸为源 · 皮影转韵 · 刺绣赋彩', 540, 1400);
  x.fillText('我的非遗数字文创 · 辽宁满族纹样', 540, 1460);
  x.font = '20px "Noto Sans SC",sans-serif';
  x.fillStyle = 'rgba(212,168,67,.55)';
  const serial = 'LYSC-' + Date.now().toString(36).toUpperCase().slice(-6);
  x.fillText(`辽韵三萃 · 数字文创编号 ${serial}`, 540, 1800);
  downloadCanvas(cv, '辽韵三萃-手机壁纸.png');
  goldBoom('手机壁纸已生成 · 已开始下载保存');
}
function makePostcard(){
  const pat = shopPatternIdx();
  const cv = document.createElement('canvas');
  cv.width = 1050; cv.height = 750;
  const x = cv.getContext('2d');
  // 米色纸底 + 暗红晕边
  const g = x.createLinearGradient(0,0,1050,750);
  g.addColorStop(0,'#F5EBD8'); g.addColorStop(1,'#EDDFC4');
  x.fillStyle = g; x.fillRect(0,0,1050,750);
  const rg = x.createRadialGradient(525,375,80,525,375,700);
  rg.addColorStop(0,'rgba(196,30,58,0)'); rg.addColorStop(1,'rgba(196,30,58,.14)');
  x.fillStyle = rg; x.fillRect(0,0,1050,750);
  x.strokeStyle = '#8B1428'; x.lineWidth = 5;
  x.strokeRect(26,26,998,698);
  x.lineWidth = 1.5; x.strokeRect(40,40,970,670);
  // 主纹样
  const mcv = document.createElement('canvas');
  mcv.width = mcv.height = 420;
  const mc = mcv.getContext('2d');
  mc.fillStyle = '#C41E3A';
  mc.beginPath(); mc.arc(210,210,204,0,Math.PI*2); mc.fill();
  try{ MOTIFS[pat].draw(mc, 210, 210, 128, '#FFF3E0', '#FFD9E0'); }catch(e){}
  x.drawImage(mcv, 90, 190);
  // 右侧文字区
  x.textAlign = 'left';
  x.fillStyle = '#8B1428';
  x.font = '900 56px "Noto Serif SC",serif';
  x.fillText('辽韵三萃', 570, 180);
  x.font = '600 30px "Noto Serif SC",serif';
  x.fillStyle = '#5A3418';
  x.fillText('一脉辽纹，三艺共生', 570, 250);
  x.font = '22px "Noto Sans SC",sans-serif';
  x.fillStyle = '#6B4A2E';
  const msg = [
    `这枚「${FLOW_NAMES[pat]}」纹样诞生于`,
    '新宾满族剪纸的纹样母体，',
    '曾在岫岩皮影上流转成影，',
    '又在辽阳满族刺绣里织彩成纹。',
    '—— 来自辽宁非遗沉浸式3D展馆',
  ];
  msg.forEach((ln,i)=>x.fillText(ln, 570, 330 + i*44));
  // 邮票（纹样小票）
  x.save();
  x.translate(880, 120); x.rotate(0.06);
  x.fillStyle = '#F0D68A';
  x.fillRect(-56,-66,112,132);
  x.strokeStyle = '#8B1428'; x.lineWidth = 2;
  x.setLineDash([4,3]); x.strokeRect(-48,-58,96,116); x.setLineDash([]);
  try{ MOTIFS[pat].draw(x, 0, 0, 36, '#C41E3A', '#8B1428'); }catch(e){}
  x.fillStyle = '#5A3418'; x.font = '11px "Noto Sans SC",sans-serif'; x.textAlign = 'center';
  x.fillText('辽韵三萃 · 非遗纪念', 0, 56);
  x.restore();
  // 底部分隔虚线 + 落款
  x.setLineDash([10,8]);
  x.strokeStyle = 'rgba(139,20,40,.4)'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(60, 640); x.lineTo(990, 640); x.stroke();
  x.setLineDash([]);
  x.textAlign = 'center';
  x.font = '18px "Noto Sans SC",sans-serif';
  x.fillStyle = '#8B1428';
  x.fillText('剪纸为源 · 皮影转韵 · 刺绣赋彩 —— 辽宁三非遗数字文创明信片', 525, 686);
  downloadCanvas(cv, '辽韵三萃-民俗明信片.png');
  goldBoom('民俗明信片已生成 · 已开始下载保存');
}
function makeShareCard(){
  const cv = document.createElement('canvas');
  cv.width = 1000; cv.height = 620;
  const x = cv.getContext('2d');
  const g = x.createLinearGradient(0,0,1000,620);
  g.addColorStop(0,'#14102a'); g.addColorStop(1,'#1e1430');
  x.fillStyle = g; x.fillRect(0,0,1000,620);
  x.strokeStyle = '#D4A843'; x.lineWidth = 5;
  x.strokeRect(18,18,964,584);
  x.textAlign = 'left';
  x.fillStyle = '#F0D68A';
  x.font = '900 54px "Noto Serif SC",serif';
  x.fillText('辽韵三萃 · 非遗沉浸H5', 70, 140);
  x.font = '24px "Noto Sans SC",sans-serif';
  x.fillStyle = 'rgba(237,228,211,.85)';
  x.fillText('基于纹样同源理论的辽宁满族非遗', 70, 210);
  x.fillText('活态传承沉浸式3D交互展馆', 70, 248);
  x.fillStyle = '#E8455F';
  x.font = '600 28px "Noto Serif SC",serif';
  x.fillText('剪纸为源 · 皮影转韵 · 刺绣赋彩', 70, 330);
  x.font = '18px "Noto Sans SC",sans-serif';
  x.fillStyle = 'rgba(237,228,211,.6)';
  x.fillText('手机扫码 · 浏览器直接打开 · 免下载APP', 70, 400);
  x.fillText('中小学非遗美育课堂 · 博物馆线上数字展', 70, 434);
  // 二维码
  const qx = 660, qy = 120, qs = 280;
  x.fillStyle = '#F0D68A';
  rrect(x, qx-16, qy-16, qs+32, qs+32, 14); x.fill();
  let qrOK = false;
  try{
    if(typeof qrcode === 'function'){
      const qr = qrcode(0, 'M');
      qr.addData(location.href);
      qr.make();
      const img = new Image();
      img.onload = ()=>{
        x.drawImage(img, qx, qy, qs, qs);
        x.fillStyle = 'rgba(237,228,211,.65)';
        x.font = '13px "Noto Sans SC",sans-serif'; x.textAlign = 'center';
        x.fillText('扫码直达 · 辽韵三萃', qx+qs/2, qy+qs+44);
      };
      img.src = qr.createDataURL(qs*2, 0);
      qrOK = true;
    }
  }catch(e){}
  if(!qrOK){
    x.fillStyle = '#0D0D1A';
    x.font = '13px "Noto Sans SC",sans-serif'; x.textAlign = 'center';
    x.fillText('链接地址：', qx+qs/2, qy+60);
    const url = location.href;
    for(let i=0;i<Math.ceil(url.length/22);i++){
      x.fillText(url.slice(i*22, (i+1)*22), qx+qs/2, qy+90+i*22);
    }
  }
  x.textAlign = 'center';
  x.fillStyle = 'rgba(212,168,67,.6)';
  x.font = '14px "Noto Sans SC",sans-serif';
  x.fillText('辽韵三萃 · 辽宁非遗数字化传播', 500, 570);
  downloadCanvas(cv, '辽韵三萃-分享卡.png');
  goldBoom('二维码分享卡已生成 · 扫码即可在手机浏览器打开');
}

// ---------- 传承人语录 + 纹样民俗寓意 注入 ----------
const MASTER_QUOTES = {
  puppet:{q:'一口叙说千古事，双手对舞百万兵。', from:'岫岩皮影艺人班传语录 · 口述整理'},
  paper:{q:'心里有样，手上有样；剪纸不用稿，样在心头绕。', from:'新宾满族剪纸传承人 · 口述整理'},
  emb:{q:'枕头顶上的花，是姑娘心里的话。', from:'辽阳满族刺绣老绣娘 · 口述整理'},
};
function initCulture(){
  if(typeof SCENE_DATA === 'undefined') return;
  Object.keys(MASTER_QUOTES).forEach(k=>{
    const q = MASTER_QUOTES[k];
    (SCENE_DATA[k].hotspots||[]).forEach(h=>{
      if(h._cultured) return;
      h.body += `<div class="master-quote"><q>${q.q}</q><span class="quote-from">${q.from}</span></div>`;
      h._cultured = true;
    });
  });
  const tag = (scene, id, means)=>{
    const h = SCENE_DATA[scene] && SCENE_DATA[scene].hotspots.find(x=>x.id===id);
    if(h && !h._means){
      h.body = `<div>${means.split('·').map(m=>`<span class="motif-mean">${m.trim()}</span>`).join('')}</div>` + h.body;
      h._means = true;
    }
  };
  tag('paper','window','团花 · 团圆美满 · 鱼 · 年年有余 · 蝶恋花 · 福禄双至');
  tag('paper','custom','福字 · 纳福迎祥 · 挂签 · 五行驱邪纳福');
  tag('paper','shaman','萨满神纹 · 通神护佑 · 神鼓 · 沟通天地');
  tag('emb','pillow','并蒂莲 · 佳偶同心 · 蝙蝠 · 福在眼前');
  // 投递展品 / 贴墙窗花 知识条目
  if(typeof PROP_KNOWLEDGE !== 'undefined'){
    PROP_KNOWLEDGE.deliveredArt = {title:'纹样投递展品', sub:'跨展区联动 · 同源纹样载体生成',
      body:`<p>这件展品来自<span class="highlight">「纹样投递」</span>跨展区联动：你在任一展厅创作的纹样，化粒子飞递到另外两个展厅，自动生成对应载体版本。</p>
      <p>这正是本项目的核心主题——<span class="highlight">同一纹样在纸、皮、布三种载体上同源共生</span>。</p>`};
    PROP_KNOWLEDGE.wallFlower = {title:'观众窗花作品', sub:'拼窗花成果 · 上墙展示',
      body:`<p>这是参与者在<span class="highlight">「拼窗花」</span>游戏中亲手拼出并贴上墙面的窗花作品。</p>
      <p>贴窗花是满族春节年俗：家家户户窗棂贴红，<span class="highlight">寓意吉祥如意、辞旧迎新</span>。</p>`};
  }
}

// ---------- 底部收纳簇下拉 ----------
function toggleDrop(trigger){
  const dd = trigger.closest('.dropdown');
  if(!dd) return;
  const wasOpen = dd.classList.contains('open');
  document.querySelectorAll('#bottom-bar .dropdown.open').forEach(x=>x.classList.remove('open'));
  if(!wasOpen) dd.classList.add('open');
}
document.addEventListener('click', e=>{
  if(!e.target.closest('.dropdown'))
    document.querySelectorAll('#bottom-bar .dropdown.open').forEach(x=>x.classList.remove('open'));
});
document.addEventListener('keydown', e=>{
  if(e.key === 'Escape')
    document.querySelectorAll('#bottom-bar .dropdown.open').forEach(x=>x.classList.remove('open'));
});
