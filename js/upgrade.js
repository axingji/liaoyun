/* ================================================================
 * 《辽韵三萃》国奖拔高创新 · 升级脚本
 * 包含：游戏4纹样寓意 / 游戏5传承录 / 古今对照 / 基因档案 /
 *       传承人音频 / 模式切换+无障碍 / 流转引擎升级 / 特效升级
 * ================================================================ */
'use strict';

/* ===== 纹样基因档案数据 ===== */
const GENE_ARCHIVE = [
  {id:'tuanhua', name:'团花', meaning:'团圆美满 · 合家欢乐', origin:'满族春节窗花母题',
   paper:'圆形对称折剪 · 红纸镂刻', puppet:'团花镂空映射皮偶服饰', emb:'团花金线盘绕绣纹'},
  {id:'shaman', name:'萨满神纹', meaning:'通神护佑 · 沟通天地', origin:'萨满祭祀神纹',
   paper:'折剪神鼓与鸟纹 · 红纸', puppet:'神纹镂刻皮影神偶', emb:'神纹丝线平绣于神服'},
  {id:'fish', name:'连年有余', meaning:'年年有余 · 富足安康', origin:'渔猎民俗鱼纹',
   paper:'鱼形折剪 · 水波镂空', puppet:'鱼纹皮影游鱼角色', emb:'鱼纹锁绣绣于枕顶'},
  {id:'fu', name:'福字年俗', meaning:'纳福迎祥 · 辞旧迎新', origin:'满族春节挂签',
   paper:'福字方折剪 · 挂签形式', puppet:'福字皮影开演贺岁', emb:'福字盘金绣贺礼'},
];

/* ===== 传承人口述文本（WebAudio模拟8-15s） ===== */
const MASTER_AUDIO = {
  paper_window: {from:'新宾满族剪纸传承人', text:'团花要圆，剪刀要转。圆是团圆，转是转运。一折一剪，把福气和盼头都剪进去了。'},
  paper_shaman: {from:'萨满纹样传承人', text:'神纹不是画，是通天的路。鸟飞上天，鼓响通神。剪出来贴在窗上，就是请神护家。'},
  paper_custom: {from:'满族剪纸传承人', text:'福字挂签，五张一套。金纸红纸，贴在门楣。风一吹，福就来了。'},
  puppet_stage: {from:'岫岩皮影传承人', text:'皮影是光和影的戏。驴皮刻透，颜色染上，灯一亮，影子就活了。老辈人说，影子比人真。'},
  emb_pillow: {from:'辽阳满族刺绣传承人', text:'枕头顶绣花，是姑娘出嫁前必做的。一针一线，把心事绣进去。针脚要密，心意才真。'},
};

/* ===== 修复工坊残损文物数据 ===== */
const RESTORE_ITEMS = [
  {name:'残损团花', desc:'民国时期红纸团花剪纸 · 边缘残缺褪色', motif:'tuanhua', damage:0.55},
  {name:'褪色福字', desc:'清代满族福字挂签 · 矿物色彩严重褪失', motif:'fu', damage:0.45},
  {name:'污渍鱼纹', desc:'民间鱼纹剪纸样本 · 水渍污染纹样模糊', motif:'fish', damage:0.50},
];

/* ================================================================
 * 一、游戏4：纹样寓意图谱 · 解码满族民俗文化密码
 * 立意：满族纹样不是装饰，是文化密码。保护非遗不仅要保存"形"，更要传承"意"。
 * ================================================================ */
const MEANING = {
  canvas:null, ctx:null, raf:null,
  selected:null, connections:[], errors:[], particles:[],
  showResult:false, resultT:0, storyShown:-1, hover:null,
};

const MEANING_DATA = [
  {id:'tuanhua', name:'团花', meaning:'团圆美满 · 合家欢乐',
   story:'团花是满族春节窗花母题，圆形对称象征家族团圆。一折一剪，把新年的福气与盼头都剪进去，是满族人家过年最朴素的祈愿。'},
  {id:'shaman', name:'萨满神纹', meaning:'通神护佑 · 沟通天地',
   story:'萨满神纹不是装饰，是通天的路。鸟飞上天，鼓响通神。剪出来贴在窗上，就是请神护家，是满族萨满信仰的视觉密码。'},
  {id:'fish', name:'连年有余', meaning:'年年有余 · 富足安康',
   story:'鱼纹源自满族渔猎民俗，"鱼"谐音"余"。水波镂空衬托游鱼，寄托年年丰收、家有余庆的祈愿。'},
  {id:'fu', name:'福字年俗', meaning:'纳福迎祥 · 辞旧迎新',
   story:'福字挂签是满族春节门楣上的吉祥符号，五张一套，金纸红纸。风一吹福就来了，辞旧迎新的仪式感全在这一张纸里。'},
];

function openMeaning(){
  const ov = document.getElementById('meaning-overlay');
  if(!ov) return;
  ov.classList.add('show');
  MEANING.canvas = document.getElementById('meaning-canvas');
  MEANING.ctx = MEANING.canvas.getContext('2d');
  MEANING.selected = null;
  MEANING.connections = [];
  MEANING.errors = [];
  MEANING.particles = [];
  MEANING.showResult = false;
  MEANING.resultT = 0;
  MEANING.storyShown = -1;
  initMeaningInput();
  updateMeaningUI();
  if(!MEANING.raf) MEANING.raf = requestAnimationFrame(meaningLoop);
}
function closeMeaning(){
  const ov = document.getElementById('meaning-overlay');
  if(ov) ov.classList.remove('show');
  if(MEANING.raf){ cancelAnimationFrame(MEANING.raf); MEANING.raf = null; }
}
function updateMeaningUI(){
  const prog = document.getElementById('meaning-prog');
  if(prog) prog.textContent = `已连 ${MEANING.connections.length}/4`;
  const story = document.getElementById('meaning-story');
  if(story) story.style.display = MEANING.storyShown >= 0 ? '' : 'none';
  const tip = document.getElementById('meaning-tip');
  if(tip){
    if(MEANING.connections.length >= 4){
      tip.textContent = '全部纹样寓意解锁！图谱展示中 · 纹样基因已存入档案';
    } else if(MEANING.selected){
      const m = MEANING_DATA.find(d => d.id === MEANING.selected);
      tip.textContent = `已选「${m ? m.name : ''}」· 点击右侧对应寓意`;
    } else {
      tip.textContent = '点击左侧纹样 · 再点击右侧寓意 · 连对即解锁民俗故事';
    }
  }
}
function meaningLayout(){
  const W = MEANING.canvas.width, H = MEANING.canvas.height;
  const leftX = 20, rightX = W - 180;
  const cardH = 64, gap = 14;
  const totalH = 4 * cardH + 3 * gap;
  const startY = 50 + (H - 50 - totalH - 90) / 2;
  const motifs = MEANING_DATA.map((m, i) => ({
    ...m, x: leftX, y: startY + i * (cardH + gap), w: 160, h: cardH
  }));
  const shuffled = [3, 0, 2, 1];
  const meanings = shuffled.map((origIdx, i) => ({
    ...MEANING_DATA[origIdx], motifId: MEANING_DATA[origIdx].id,
    x: rightX, y: startY + i * (cardH + gap), w: 160, h: cardH
  }));
  return {motifs, meanings};
}
function meaningLoop(){
  if(!MEANING.ctx) return;
  const W = MEANING.canvas.width, H = MEANING.canvas.height;
  const x = MEANING.ctx;
  x.fillStyle = '#0d0d1a';
  x.fillRect(0, 0, W, H);
  if(MEANING.showResult){
    meaningDrawResult(x, W, H);
    MEANING.raf = requestAnimationFrame(meaningLoop);
    return;
  }
  const {motifs, meanings} = meaningLayout();
  // 列标题
  x.fillStyle = 'rgba(212,168,67,0.7)';
  x.font = 'bold 13px "Noto Serif SC"';
  x.textAlign = 'center';
  x.fillText('纹样母体', 100, 30);
  x.fillText('文化寓意', W - 100, 30);
  // 中间引导虚线区
  x.strokeStyle = 'rgba(212,168,67,0.12)';
  x.lineWidth = 1;
  x.setLineDash([4, 6]);
  x.beginPath();
  x.moveTo(190, 45); x.lineTo(W - 190, 45);
  x.lineTo(W - 190, H - 95);
  x.lineTo(190, H - 95);
  x.closePath();
  x.stroke();
  x.setLineDash([]);
  // 已完成连线（金色贝塞尔）
  for(const conn of MEANING.connections){
    const m = motifs.find(mo => mo.id === conn.motifId);
    const mn = meanings.find(mo => mo.id === conn.meaningId);
    if(m && mn){
      x.strokeStyle = 'rgba(212,168,67,0.7)';
      x.lineWidth = 3;
      x.beginPath();
      x.moveTo(m.x + m.w, m.y + m.h/2);
      const cpx1 = m.x + m.w + 60, cpx2 = mn.x - 60;
      x.bezierCurveTo(cpx1, m.y + m.h/2, cpx2, mn.y + mn.h/2, mn.x, mn.y + mn.h/2);
      x.stroke();
      x.strokeStyle = 'rgba(240,214,138,0.25)';
      x.lineWidth = 8;
      x.stroke();
    }
  }
  // 错误闪烁
  for(let i = MEANING.errors.length - 1; i >= 0; i--){
    const err = MEANING.errors[i];
    const age = (performance.now() - err.t0) / 800;
    if(age >= 1){ MEANING.errors.splice(i, 1); continue; }
    const m = motifs.find(mo => mo.id === err.motifId);
    const mn = meanings.find(mo => mo.id === err.meaningId);
    if(m && mn){
      const alpha = (1 - age) * (0.5 + 0.5 * Math.sin(age * Math.PI * 6));
      x.strokeStyle = `rgba(196,30,58,${alpha})`;
      x.lineWidth = 3;
      x.beginPath();
      x.moveTo(m.x + m.w, m.y + m.h/2);
      x.lineTo(mn.x, mn.y + mn.h/2);
      x.stroke();
    }
  }
  // 纹样卡片
  for(const m of motifs){
    const isConnected = MEANING.connections.some(c => c.motifId === m.id);
    const isSelected = MEANING.selected === m.id;
    meaningDrawMotifCard(x, m, isSelected, isConnected);
  }
  // 寓意卡片
  for(const mn of meanings){
    const isConnected = MEANING.connections.some(c => c.meaningId === mn.id);
    meaningDrawMeaningCard(x, mn, isConnected);
  }
  // 选中纹样到鼠标的虚线
  if(MEANING.selected && MEANING.hover){
    const m = motifs.find(mo => mo.id === MEANING.selected);
    if(m){
      x.strokeStyle = 'rgba(240,214,138,0.5)';
      x.lineWidth = 2;
      x.setLineDash([6, 4]);
      x.beginPath();
      x.moveTo(m.x + m.w, m.y + m.h/2);
      x.lineTo(MEANING.hover.x, MEANING.hover.y);
      x.stroke();
      x.setLineDash([]);
    }
  }
  // 粒子层
  x.save();
  x.globalCompositeOperation = 'lighter';
  for(let i = MEANING.particles.length - 1; i >= 0; i--){
    const p = MEANING.particles[i];
    p.x += p.vx; p.y += p.vy; p.vx *= 0.96; p.vy *= 0.96;
    p.life -= 0.02;
    if(p.life <= 0){ MEANING.particles.splice(i, 1); continue; }
    x.globalAlpha = p.life;
    x.fillStyle = `rgba(${p.col},1)`;
    x.beginPath();
    x.arc(p.x, p.y, p.sz, 0, Math.PI * 2);
    x.fill();
  }
  x.restore();
  x.globalAlpha = 1;
  // 民俗故事
  if(MEANING.storyShown >= 0){
    meaningDrawStory(x, W, H, MEANING_DATA[MEANING.storyShown]);
  }
  MEANING.raf = requestAnimationFrame(meaningLoop);
}
function meaningDrawMotifCard(x, m, isSelected, isConnected){
  x.save();
  const bg = isConnected ? 'rgba(126,200,169,0.15)' : 'rgba(22,22,42,0.7)';
  const border = isSelected ? '#F0D68A' : isConnected ? 'rgba(126,200,169,0.7)' : 'rgba(212,168,67,0.35)';
  x.fillStyle = bg;
  x.strokeStyle = border;
  x.lineWidth = isSelected ? 2.5 : 1.5;
  roundRect(x, m.x, m.y, m.w, m.h, 8);
  x.fill();
  x.stroke();
  const ix = m.x + 28, iy = m.y + m.h/2;
  x.fillStyle = isConnected ? 'rgba(126,200,169,0.9)' : 'rgba(196,30,58,0.85)';
  meaningDrawMotifIcon(x, m.id, ix, iy, 18);
  x.fillStyle = isConnected ? 'rgba(126,200,169,0.95)' : '#F0D68A';
  x.font = 'bold 13px "Noto Serif SC"';
  x.textAlign = 'left';
  x.fillText(m.name, m.x + 56, m.y + m.h/2 + 5);
  x.restore();
}
function meaningDrawMotifIcon(x, id, cx, cy, R){
  x.beginPath(); x.arc(cx, cy, R, 0, Math.PI*2); x.fill();
  x.strokeStyle = '#F0D68A'; x.lineWidth = 1.5;
  if(id === 'tuanhua'){
    for(let i=0;i<6;i++){
      const a = i*Math.PI/3;
      x.beginPath();
      x.moveTo(cx, cy);
      x.lineTo(cx+Math.cos(a)*R*0.85, cy+Math.sin(a)*R*0.85);
      x.stroke();
    }
    x.beginPath(); x.arc(cx, cy, R*0.4, 0, Math.PI*2); x.stroke();
  } else if(id === 'shaman'){
    x.beginPath();
    x.moveTo(cx, cy-R*0.6);
    x.quadraticCurveTo(cx+R*0.5, cy, cx, cy+R*0.6);
    x.quadraticCurveTo(cx-R*0.5, cy, cx, cy-R*0.6);
    x.stroke();
  } else if(id === 'fish'){
    x.beginPath();
    x.ellipse(cx, cy, R*0.6, R*0.35, 0, 0, Math.PI*2);
    x.stroke();
    x.beginPath();
    x.moveTo(cx+R*0.6, cy);
    x.lineTo(cx+R*0.9, cy-R*0.2);
    x.lineTo(cx+R*0.9, cy+R*0.2);
    x.closePath();
    x.stroke();
  } else if(id === 'fu'){
    x.strokeRect(cx-R*0.55, cy-R*0.55, R*1.1, R*1.1);
    x.fillStyle = '#F0D68A';
    x.font = `bold ${R*1.1}px "Noto Serif SC"`;
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('福', cx, cy);
    x.textBaseline = 'alphabetic';
  }
}
function meaningDrawMeaningCard(x, mn, isConnected){
  x.save();
  const bg = isConnected ? 'rgba(126,200,169,0.15)' : 'rgba(22,22,42,0.7)';
  const border = isConnected ? 'rgba(126,200,169,0.7)' : 'rgba(212,168,67,0.35)';
  x.fillStyle = bg;
  x.strokeStyle = border;
  x.lineWidth = 1.5;
  roundRect(x, mn.x, mn.y, mn.w, mn.h, 8);
  x.fill();
  x.stroke();
  x.fillStyle = isConnected ? 'rgba(126,200,169,0.95)' : '#EDE4D3';
  x.font = '12px "Noto Sans SC"';
  x.textAlign = 'center';
  const parts = mn.meaning.split(' · ');
  parts.forEach((p, i) => {
    x.fillText(p, mn.x + mn.w/2, mn.y + mn.h/2 + (i - (parts.length-1)/2) * 16);
  });
  x.restore();
}
function meaningDrawStory(x, W, H, m){
  const boxH = 75, boxY = H - boxH - 8;
  x.save();
  x.fillStyle = 'rgba(13,13,26,0.92)';
  x.strokeStyle = 'rgba(212,168,67,0.5)';
  x.lineWidth = 1.5;
  roundRect(x, 20, boxY, W - 40, boxH, 8);
  x.fill(); x.stroke();
  x.fillStyle = '#F0D68A';
  x.font = 'bold 12px "Noto Serif SC"';
  x.textAlign = 'left';
  x.fillText(`「${m.name}」民俗故事`, 32, boxY + 18);
  x.fillStyle = '#EDE4D3';
  x.font = '11px "Noto Sans SC"';
  meaningWrapText(x, m.story, 32, boxY + 38, W - 64, 15);
  x.restore();
}
function meaningWrapText(x, text, x0, y0, maxW, lh){
  const chars = text.split('');
  let line = '', y = y0;
  for(const ch of chars){
    const test = line + ch;
    if(x.measureText(test).width > maxW && line){
      x.fillText(line, x0, y);
      line = ch; y += lh;
    } else {
      line = test;
    }
  }
  if(line) x.fillText(line, x0, y);
}
function meaningDrawResult(x, W, H){
  MEANING.resultT = Math.min(1, MEANING.resultT + 0.012);
  const t = MEANING.resultT;
  x.fillStyle = '#0d0d1a';
  x.fillRect(0, 0, W, H);
  x.fillStyle = `rgba(240,214,138,${Math.min(1, t*2)})`;
  x.font = 'bold 20px "Noto Serif SC"';
  x.textAlign = 'center';
  x.fillText('纹样寓意 · 三艺映射图谱', W/2, 35);
  const colW = (W - 80) / 4;
  const colXs = [40, 40 + colW, 40 + colW*2, 40 + colW*3];
  const colNames = ['纹样母体', '剪纸载体', '皮影载体', '刺绣载体'];
  x.fillStyle = 'rgba(212,168,67,0.8)';
  x.font = 'bold 12px "Noto Serif SC"';
  colNames.forEach((n, i) => x.fillText(n, colXs[i] + colW/2, 65));
  for(let i = 0; i < 4; i++){
    const m = MEANING_DATA[i];
    const reveal = Math.max(0, Math.min(1, (t - i * 0.1) * 2));
    const y = 90 + i * 70;
    x.globalAlpha = reveal;
    x.fillStyle = 'rgba(196,30,58,0.85)';
    meaningDrawMotifIcon(x, m.id, colXs[0] + 30, y, 16);
    x.fillStyle = '#F0D68A';
    x.font = '11px "Noto Serif SC"';
    x.fillText(m.name, colXs[0] + 30, y + 28);
    x.strokeStyle = `rgba(212,168,67,${0.3 * reveal})`;
    x.lineWidth = 1;
    x.setLineDash([3, 3]);
    x.beginPath();
    x.moveTo(colXs[0] + 50, y);
    x.lineTo(colXs[1], y);
    x.moveTo(colXs[1] + colW, y);
    x.lineTo(colXs[2], y);
    x.moveTo(colXs[2] + colW, y);
    x.lineTo(colXs[3], y);
    x.stroke();
    x.setLineDash([]);
    x.fillStyle = 'rgba(196,30,58,0.6)';
    x.fillRect(colXs[1] + 10, y - 12, 20, 24);
    x.fillStyle = '#EDE4D3'; x.font = '9px sans-serif';
    x.fillText('纸', colXs[1] + 20, y + 4);
    x.fillStyle = 'rgba(212,168,67,0.6)';
    x.beginPath(); x.ellipse(colXs[2] + 20, y, 14, 10, 0, 0, Math.PI*2); x.fill();
    x.fillStyle = '#1a0a0a'; x.fillText('皮', colXs[2] + 20, y + 4);
    x.strokeStyle = 'rgba(126,200,169,0.7)'; x.lineWidth = 2;
    x.beginPath();
    for(let k = 0; k < 5; k++){
      x.moveTo(colXs[3] + 10 + k*5, y - 10);
      x.lineTo(colXs[3] + 10 + k*5, y + 10);
    }
    x.stroke();
    x.fillStyle = '#EDE4D3'; x.fillText('绣', colXs[3] + 20, y + 20);
    x.globalAlpha = 1;
  }
  if(t >= 0.9){
    x.fillStyle = `rgba(126,200,169,${(t-0.9)*10})`;
    x.font = 'bold 13px sans-serif';
    x.textAlign = 'center';
    x.fillText('✦ 纹样寓意解码完成 · 文化基因已存入档案 ✦', W/2, H - 15);
  }
  x.save();
  x.globalCompositeOperation = 'lighter';
  for(let i = MEANING.particles.length - 1; i >= 0; i--){
    const p = MEANING.particles[i];
    p.x += p.vx; p.y += p.vy; p.vx *= 0.96; p.vy *= 0.96;
    p.life -= 0.015;
    if(p.life <= 0){ MEANING.particles.splice(i, 1); continue; }
    x.globalAlpha = p.life;
    x.fillStyle = `rgba(${p.col},1)`;
    x.beginPath();
    x.arc(p.x, p.y, p.sz, 0, Math.PI*2);
    x.fill();
  }
  x.restore();
  x.globalAlpha = 1;
}
function meaningClick(p){
  const {motifs, meanings} = meaningLayout();
  for(const m of motifs){
    if(p.x >= m.x && p.x <= m.x + m.w && p.y >= m.y && p.y <= m.y + m.h){
      if(MEANING.connections.some(c => c.motifId === m.id)) return;
      MEANING.selected = m.id;
      updateMeaningUI();
      return;
    }
  }
  for(const mn of meanings){
    if(p.x >= mn.x && p.x <= mn.x + mn.w && p.y >= mn.y && p.y <= mn.y + mn.h){
      if(MEANING.connections.some(c => c.meaningId === mn.id)) return;
      if(!MEANING.selected){
        if(typeof showToast === 'function') showToast('请先在左侧选择一个纹样');
        return;
      }
      if(mn.motifId === MEANING.selected){
        MEANING.connections.push({motifId: MEANING.selected, meaningId: mn.id});
        const idx = MEANING_DATA.findIndex(m => m.id === MEANING.selected);
        MEANING.storyShown = idx;
        const m2 = motifs.find(mo => mo.id === MEANING.selected);
        for(let i = 0; i < 30; i++){
          const a = Math.random() * Math.PI * 2;
          MEANING.particles.push({
            x: m2.x + m2.w, y: m2.y + m2.h/2,
            vx: Math.cos(a) * (2 + Math.random()*3),
            vy: Math.sin(a) * (2 + Math.random()*3),
            col: Math.random() < 0.5 ? '240,214,138' : '212,168,67',
            sz: 1.5 + Math.random()*2, life: 1
          });
        }
        MEANING.selected = null;
        updateMeaningUI();
        if(MEANING.connections.length >= 4){
          setTimeout(()=>{
            MEANING.showResult = true;
            MEANING.resultT = 0;
            for(let i = 0; i < 80; i++){
              const a = Math.random() * Math.PI * 2;
              const r = Math.random() * 60;
              MEANING.particles.push({
                x: MEANING.canvas.width/2 + Math.cos(a)*r,
                y: MEANING.canvas.height/2 + Math.sin(a)*r,
                vx: Math.cos(a) * (3 + Math.random()*4),
                vy: Math.sin(a) * (3 + Math.random()*4),
                col: Math.random() < 0.5 ? '240,214,138' : '126,200,169',
                sz: 2 + Math.random()*2, life: 1
              });
            }
            if(typeof markExplore === 'function') markExplore('meaning_complete');
            if(typeof showToast === 'function') showToast('纹样寓意全部解锁！民俗文化基因已存入档案');
          }, 1500);
        }
      } else {
        MEANING.errors.push({motifId: MEANING.selected, meaningId: mn.id, t0: performance.now()});
        MEANING.selected = null;
        updateMeaningUI();
        if(typeof showToast === 'function') showToast('寓意不匹配 · 请重新选择');
      }
      return;
    }
  }
  if(MEANING.storyShown >= 0){
    MEANING.storyShown = -1;
  }
}
function initMeaningInput(){
  const cv = document.getElementById('meaning-canvas');
  if(!cv || cv._meaningBound) return;
  cv._meaningBound = true;
  function pos(e){
    const r = cv.getBoundingClientRect();
    const sx = cv.width / r.width, sy = cv.height / r.height;
    const t = e.touches ? e.touches[0] : e;
    return {x: (t.clientX - r.left) * sx, y: (t.clientY - r.top) * sy};
  }
  cv.addEventListener('pointerdown', e => { meaningClick(pos(e)); });
  cv.addEventListener('pointermove', e => { MEANING.hover = pos(e); });
  cv.addEventListener('pointerleave', () => { MEANING.hover = null; });
}
function roundRect(x, x0, y0, w, h, r){
  x.beginPath();
  x.moveTo(x0 + r, y0);
  x.arcTo(x0 + w, y0, x0 + w, y0 + h, r);
  x.arcTo(x0 + w, y0 + h, x0, y0 + h, r);
  x.arcTo(x0, y0 + h, x0, y0, r);
  x.arcTo(x0, y0, x0 + w, y0, r);
  x.closePath();
}

/* ================================================================
 * 二、游戏5：三艺传承录 · 非遗活态传承的时代抉择
 * 立意：非遗核心是"人"。"人随艺存，艺随人传"。传承需要每一代人的主动选择。
 * ================================================================ */
const CHRON = {
  canvas:null, ctx:null, raf:null,
  era: 0, treeGrowth: 0, particles: [],
  showResult: false, resultT: 0, optionHover: -1,
  feedback: '', feedbackT: 0,
};

const CHRON_ERAS = [
  {name:'清末民初', year:'1900s',
   crisis:'列强入侵 · 民俗凋敝 · 满族剪纸、皮影、刺绣面临断代危机',
   options:[
     {text:'收录纹样入民俗档案', correct:true, feedback:'先驱学者深入满族聚居地，抢救性记录纹样，为后世留存文化基因。'},
     {text:'禁止民间习俗活动', correct:false, feedback:'此举加剧非遗断代，纹样技艺在沉默中失传。'},
     {text:'改为机器量产复刻', correct:false, feedback:'机器复刻失去手艺灵魂，纹样背后的民俗记忆无法复制。'},
   ]},
  {name:'民国战乱', year:'1930s',
   crisis:'战火纷飞 · 匠人流离 · 传承谱系支离破碎',
   options:[
     {text:'家族口传心授延续', correct:true, feedback:'一代代绣娘、剪匠、影戏艺人，在动荡中坚持把技艺传给下一代。'},
     {text:'暂时封存不再传授', correct:false, feedback:'技艺一旦中断便难复原，封存意味着失传的开始。'},
     {text:'改学西方工艺替代', correct:false, feedback:'西方工艺无法承载满族民俗纹样的文化基因。'},
   ]},
  {name:'当代复兴', year:'2000s',
   crisis:'现代化冲击 · 年轻人疏离传统 · 非遗急需新活力',
   options:[
     {text:'非遗进校园 + 数字化记录', correct:true, feedback:'把剪纸、皮影、刺绣带进课堂，用数字技术永久保存纹样基因。'},
     {text:'只做博物馆陈列封存', correct:false, feedback:'博物馆陈列让非遗成为"标本"，失去活态传承的生命力。'},
     {text:'迎合市场大幅改造', correct:false, feedback:'过度商业化让纹样失去本真，文化基因被稀释。'},
   ]},
  {name:'未来传承', year:'2050s',
   crisis:'数字时代 · 如何让纹样基因活态再生？',
   options:[
     {text:'数字基因库 + 跨载体再生', correct:true, feedback:'建立纹样数字基因库，让同一文化基因在纸、皮、布载体活态再生——这正是"辽韵三萃"的使命。'},
     {text:'完全AI自动生成替代', correct:false, feedback:'AI替代了人，就失去"人随艺存"的灵魂，非遗核心是人的传承。'},
     {text:'放弃传统只做创新', correct:false, feedback:'没有根的创新是浮萍，纹样基因必须扎根传统才能再生。'},
   ]},
];

function openChronicle(){
  const ov = document.getElementById('chronicle-overlay');
  if(!ov) return;
  ov.classList.add('show');
  CHRON.canvas = document.getElementById('chron-canvas');
  CHRON.ctx = CHRON.canvas.getContext('2d');
  CHRON.era = 0;
  CHRON.treeGrowth = 0;
  CHRON.particles = [];
  CHRON.showResult = false;
  CHRON.resultT = 0;
  CHRON.feedback = '';
  CHRON.feedbackT = 0;
  CHRON.optionHover = -1;
  initChronicleInput();
  updateChronicleUI();
  if(!CHRON.raf) CHRON.raf = requestAnimationFrame(chronicleLoop);
}
function closeChronicle(){
  const ov = document.getElementById('chronicle-overlay');
  if(ov) ov.classList.remove('show');
  if(CHRON.raf){ cancelAnimationFrame(CHRON.raf); CHRON.raf = null; }
}
function updateChronicleUI(){
  const era = CHRON_ERAS[CHRON.era];
  const eraEl = document.getElementById('chron-era');
  if(eraEl) eraEl.textContent = `${era.name} · ${era.year}`;
  const treeEl = document.getElementById('chron-tree');
  if(treeEl) treeEl.textContent = `传承树 ${Math.round(CHRON.treeGrowth*100)}%`;
  for(let i = 0; i < 4; i++){
    const el = document.getElementById('chron-s' + (i+1));
    if(el){
      el.className = 'leap-stage';
      if(i < CHRON.era) el.classList.add('done');
      else if(i === CHRON.era) el.classList.add('on');
    }
  }
  const tip = document.getElementById('chron-tip');
  if(tip){
    if(CHRON.showResult){
      tip.textContent = '四时代传承完成！非遗活态传承脉络已铭刻';
    } else {
      tip.textContent = '点击右侧选项作出传承抉择 · 正确抉择让传承树成长';
    }
  }
}
function chronicleLoop(){
  if(!CHRON.ctx) return;
  const W = CHRON.canvas.width, H = CHRON.canvas.height;
  const x = CHRON.ctx;
  x.fillStyle = '#0d0d1a';
  x.fillRect(0, 0, W, H);
  if(CHRON.showResult){
    chronicleDrawResult(x, W, H);
    CHRON.raf = requestAnimationFrame(chronicleLoop);
    return;
  }
  chronicleDrawTree(x, 0, 0, W * 0.35, H, CHRON.treeGrowth);
  const panelX = W * 0.35;
  const panelW = W - panelX;
  chronicleDrawEraPanel(x, panelX, 0, panelW, H);
  if(CHRON.feedback && CHRON.feedbackT > 0){
    CHRON.feedbackT = Math.max(0, CHRON.feedbackT - 0.004);
    const alpha = Math.min(1, CHRON.feedbackT * 2);
    x.save();
    x.fillStyle = `rgba(13,13,26,${0.88 * alpha})`;
    x.strokeStyle = `rgba(212,168,67,${0.6 * alpha})`;
    x.lineWidth = 1.5;
    roundRect(x, panelX + 20, H - 85, panelW - 40, 65, 8);
    x.fill(); x.stroke();
    x.fillStyle = `rgba(240,214,138,${alpha})`;
    x.font = 'bold 11px "Noto Serif SC"';
    x.textAlign = 'left';
    x.fillText('传承人语：', panelX + 32, H - 66);
    x.fillStyle = `rgba(237,228,211,${alpha})`;
    x.font = '11px "Noto Sans SC"';
    meaningWrapText(x, CHRON.feedback, panelX + 32, H - 50, panelW - 64, 14);
    x.restore();
  }
  x.save();
  x.globalCompositeOperation = 'lighter';
  for(let i = CHRON.particles.length - 1; i >= 0; i--){
    const p = CHRON.particles[i];
    p.x += p.vx; p.y += p.vy; p.vx *= 0.96; p.vy *= 0.96;
    p.life -= 0.015;
    if(p.life <= 0){ CHRON.particles.splice(i, 1); continue; }
    x.globalAlpha = p.life;
    x.fillStyle = `rgba(${p.col},1)`;
    x.beginPath();
    x.arc(p.x, p.y, p.sz, 0, Math.PI*2);
    x.fill();
  }
  x.restore();
  x.globalAlpha = 1;
  CHRON.raf = requestAnimationFrame(chronicleLoop);
}
function chronicleDrawTree(x, x0, y0, w, h, growth){
  const cx = x0 + w/2;
  const groundY = y0 + h - 50;
  x.fillStyle = 'rgba(60,40,30,0.4)';
  x.fillRect(x0 + 20, groundY, w - 40, 20);
  const trunkH = (h - 110) * growth;
  const trunkTopY = groundY - trunkH;
  x.strokeStyle = 'rgba(92,26,27,0.9)';
  x.lineWidth = Math.max(4, 12 * growth);
  x.beginPath();
  x.moveTo(cx, groundY);
  x.lineTo(cx, trunkTopY);
  x.stroke();
  if(growth > 0.2){
    const leafR = 45 * growth;
    const branches = 5;
    for(let i = 0; i < branches; i++){
      const a = -Math.PI/2 + (i - (branches-1)/2) * 0.6;
      const bx = cx + Math.cos(a) * leafR;
      const by = trunkTopY + Math.sin(a) * leafR;
      x.strokeStyle = 'rgba(92,26,27,0.7)';
      x.lineWidth = 2;
      x.beginPath();
      x.moveTo(cx, trunkTopY);
      x.lineTo(bx, by);
      x.stroke();
      x.fillStyle = `rgba(126,200,169,${0.45 * growth})`;
      x.beginPath();
      x.arc(bx, by, 18 * growth, 0, Math.PI*2);
      x.fill();
    }
    x.fillStyle = `rgba(126,200,169,${0.5 * growth})`;
    x.beginPath();
    x.arc(cx, trunkTopY, 25 * growth, 0, Math.PI*2);
    x.fill();
  }
  x.fillStyle = 'rgba(212,168,67,0.6)';
  x.font = 'bold 12px "Noto Serif SC"';
  x.textAlign = 'center';
  x.fillText('传承树', cx, y0 + 20);
  const eraNames = ['清末', '民国', '当代', '未来'];
  for(let i = 0; i < 4; i++){
    const ex = x0 + 40 + i * (w - 80) / 3;
    x.fillStyle = i < CHRON.era ? 'rgba(126,200,169,0.9)' : (i === CHRON.era ? '#F0D68A' : 'rgba(212,168,67,0.4)');
    x.font = '10px "Noto Serif SC"';
    x.fillText(eraNames[i], ex, groundY + 35);
    x.beginPath();
    x.arc(ex, groundY + 15, 4, 0, Math.PI*2);
    x.fill();
  }
}
function chronicleDrawEraPanel(x, x0, y0, w, h){
  const era = CHRON_ERAS[CHRON.era];
  x.fillStyle = '#F0D68A';
  x.font = 'bold 18px "Noto Serif SC"';
  x.textAlign = 'center';
  x.fillText(`${era.name} · ${era.year}`, x0 + w/2, y0 + 28);
  x.fillStyle = 'rgba(196,30,58,0.9)';
  x.font = 'bold 12px "Noto Serif SC"';
  x.fillText('◆ 传承危机', x0 + w/2, y0 + 52);
  x.fillStyle = '#EDE4D3';
  x.font = '11px "Noto Sans SC"';
  meaningWrapText(x, era.crisis, x0 + 20, y0 + 70, w - 40, 16);
  const optY = y0 + 125;
  const optH = 48;
  const optGap = 10;
  x.fillStyle = 'rgba(212,168,67,0.7)';
  x.font = 'bold 12px "Noto Serif SC"';
  x.textAlign = 'center';
  x.fillText('▼ 作出你的传承抉择 ▼', x0 + w/2, optY - 8);
  era.options.forEach((opt, i) => {
    const oy = optY + i * (optH + optGap);
    const isHover = CHRON.optionHover === i;
    x.save();
    x.fillStyle = isHover ? 'rgba(212,168,67,0.2)' : 'rgba(22,22,42,0.7)';
    x.strokeStyle = isHover ? '#F0D68A' : 'rgba(212,168,67,0.35)';
    x.lineWidth = isHover ? 2 : 1.5;
    roundRect(x, x0 + 20, oy, w - 40, optH, 8);
    x.fill(); x.stroke();
    x.fillStyle = '#F0D68A';
    x.font = 'bold 14px "Noto Serif SC"';
    x.textAlign = 'left';
    x.fillText(['①','②','③'][i], x0 + 32, oy + optH/2 + 5);
    x.fillStyle = '#EDE4D3';
    x.font = '12px "Noto Sans SC"';
    x.textAlign = 'center';
    x.fillText(opt.text, x0 + w/2, oy + optH/2 + 5);
    x.restore();
  });
}
function chronicleChoose(idx){
  if(CHRON.showResult) return;
  const era = CHRON_ERAS[CHRON.era];
  const opt = era.options[idx];
  if(!opt) return;
  CHRON.feedback = opt.feedback;
  CHRON.feedbackT = 1;
  if(opt.correct){
    CHRON.treeGrowth = Math.min(1, CHRON.treeGrowth + 0.25);
    for(let i = 0; i < 40; i++){
      const a = Math.random() * Math.PI * 2;
      CHRON.particles.push({
        x: CHRON.canvas.width * 0.175, y: CHRON.canvas.height - 70,
        vx: Math.cos(a) * (2 + Math.random()*3),
        vy: Math.sin(a) * (2 + Math.random()*3) - 2,
        col: Math.random() < 0.5 ? '240,214,138' : '126,200,169',
        sz: 1.5 + Math.random()*2, life: 1
      });
    }
    if(typeof showToast === 'function') showToast(`传承树成长 · ${era.name}的抉择让非遗延续`);
    setTimeout(()=>{
      if(CHRON.era >= 3){
        CHRON.showResult = true;
        CHRON.resultT = 0;
        for(let i = 0; i < 100; i++){
          const a = Math.random() * Math.PI * 2;
          CHRON.particles.push({
            x: CHRON.canvas.width/2, y: CHRON.canvas.height/2,
            vx: Math.cos(a) * (3 + Math.random()*5),
            vy: Math.sin(a) * (3 + Math.random()*5),
            col: Math.random() < 0.5 ? '240,214,138' : '126,200,169',
            sz: 2 + Math.random()*2, life: 1
          });
        }
        if(typeof markExplore === 'function') markExplore('chronicle_complete');
        if(typeof showToast === 'function') showToast('四时代传承完成！非遗活态传承的脉络已铭刻');
        updateChronicleUI();
      } else {
        CHRON.era++;
        updateChronicleUI();
      }
    }, 2500);
  } else {
    CHRON.treeGrowth = Math.max(0, CHRON.treeGrowth - 0.05);
    for(let i = 0; i < 15; i++){
      const a = Math.random() * Math.PI * 2;
      CHRON.particles.push({
        x: CHRON.canvas.width * 0.175, y: CHRON.canvas.height - 90,
        vx: Math.cos(a) * 2, vy: Math.sin(a) * 2,
        col: '196,30,58', sz: 1 + Math.random()*1.5, life: 1
      });
    }
    if(typeof showToast === 'function') showToast('此抉择不利传承 · 请重新选择');
  }
}
function chronicleDrawResult(x, W, H){
  CHRON.resultT = Math.min(1, CHRON.resultT + 0.012);
  const t = CHRON.resultT;
  x.fillStyle = '#0d0d1a';
  x.fillRect(0, 0, W, H);
  x.fillStyle = `rgba(240,214,138,${Math.min(1, t*2)})`;
  x.font = 'bold 22px "Noto Serif SC"';
  x.textAlign = 'center';
  x.fillText('人随艺存 · 艺随人传', W/2, 40);
  const cx = W/2, cy = H/2 + 30;
  x.fillStyle = 'rgba(60,40,30,0.5)';
  x.beginPath();
  x.ellipse(cx, cy + 80, 80, 12, 0, 0, Math.PI*2);
  x.fill();
  x.strokeStyle = 'rgba(92,26,27,1)';
  x.lineWidth = 10;
  x.beginPath();
  x.moveTo(cx, cy + 80);
  x.lineTo(cx, cy - 60);
  x.stroke();
  const leafR = 60;
  const branches = 7;
  for(let i = 0; i < branches; i++){
    const a = -Math.PI/2 + (i - (branches-1)/2) * 0.5;
    const bx = cx + Math.cos(a) * leafR;
    const by = cy - 60 + Math.sin(a) * leafR;
    x.strokeStyle = 'rgba(92,26,27,0.8)';
    x.lineWidth = 3;
    x.beginPath();
    x.moveTo(cx, cy - 60);
    x.lineTo(bx, by);
    x.stroke();
    x.fillStyle = `rgba(126,200,169,${0.5 * t})`;
    x.beginPath();
    x.arc(bx, by, 22, 0, Math.PI*2);
    x.fill();
  }
  x.fillStyle = `rgba(126,200,169,${0.6 * t})`;
  x.beginPath();
  x.arc(cx, cy - 60, 30, 0, Math.PI*2);
  x.fill();
  const eraColors = ['rgba(196,30,58,0.8)', 'rgba(212,168,67,0.8)', 'rgba(126,200,169,0.8)', 'rgba(240,214,138,0.9)'];
  for(let i = 0; i < 4; i++){
    const ex = 80 + i * (W - 160) / 3;
    const ey = cy + 120;
    x.fillStyle = eraColors[i];
    x.globalAlpha = Math.min(1, (t - i*0.1) * 2);
    x.beginPath();
    x.arc(ex, ey, 6, 0, Math.PI*2);
    x.fill();
    x.font = '10px "Noto Serif SC"';
    x.fillStyle = '#EDE4D3';
    x.textAlign = 'center';
    x.fillText(CHRON_ERAS[i].name, ex, ey + 20);
  }
  x.globalAlpha = 1;
  if(t >= 0.9){
    x.fillStyle = `rgba(126,200,169,${(t-0.9)*10})`;
    x.font = 'bold 13px sans-serif';
    x.textAlign = 'center';
    x.fillText('✦ 非遗活态传承脉络已铭刻 · 纹样基因跨时代延续 ✦', W/2, H - 15);
  }
}
function initChronicleInput(){
  const cv = document.getElementById('chron-canvas');
  if(!cv || cv._chronBound) return;
  cv._chronBound = true;
  function pos(e){
    const r = cv.getBoundingClientRect();
    const sx = cv.width / r.width, sy = cv.height / r.height;
    const t = e.touches ? e.touches[0] : e;
    return {x: (t.clientX - r.left) * sx, y: (t.clientY - r.top) * sy};
  }
  cv.addEventListener('pointermove', e => {
    const p = pos(e);
    const W = cv.width;
    const panelX = W * 0.35;
    const panelW = W - panelX;
    const optY = 125;
    const optH = 48;
    const optGap = 10;
    CHRON.optionHover = -1;
    if(!CHRON.showResult){
      for(let i = 0; i < 3; i++){
        const oy = optY + i * (optH + optGap);
        if(p.x >= panelX + 20 && p.x <= panelX + panelW - 20 && p.y >= oy && p.y <= oy + optH){
          CHRON.optionHover = i;
          break;
        }
      }
    }
  });
  cv.addEventListener('pointerdown', e => {
    const p = pos(e);
    const W = cv.width;
    const panelX = W * 0.35;
    const panelW = W - panelX;
    const optY = 125;
    const optH = 48;
    const optGap = 10;
    if(!CHRON.showResult){
      for(let i = 0; i < 3; i++){
        const oy = optY + i * (optH + optGap);
        if(p.x >= panelX + 20 && p.x <= panelX + panelW - 20 && p.y >= oy && p.y <= oy + optH){
          chronicleChoose(i);
          break;
        }
      }
    }
  });
}

/* ================================================================
 * 三、古今对照叙事模块
 * ================================================================ */
const CMP = { canvasL:null, canvasR:null, ctxL:null, ctxR:null, item:0 };

function openCompare(){
  const ov = document.getElementById('compare-overlay');
  if(!ov) return;
  ov.classList.add('show');
  CMP.canvasL = document.getElementById('cmp-canvas-l');
  CMP.canvasR = document.getElementById('cmp-canvas-r');
  CMP.ctxL = CMP.canvasL.getContext('2d');
  CMP.ctxR = CMP.canvasR.getContext('2d');
  initCompare(0);
}
function closeCompare(){
  const ov = document.getElementById('compare-overlay');
  if(ov) ov.classList.remove('show');
}
function initCompare(idx){
  CMP.item = idx;
  const items = [
    {title:'古今对照 · 团花剪纸', sub:'左：博物馆藏民国团花 · 右：数字复刻3D纹样', desc:'数字化保存 · 濒危非遗虚拟复原'},
    {title:'古今对照 · 皮影人物', sub:'左：岫岩皮影博物馆藏 · 右：数字复刻皮偶', desc:'光影数字化 · 皮影戏虚拟演绎'},
    {title:'古今对照 · 刺绣枕顶', sub:'左：辽阳满族刺绣藏 · 右：数字复刻绣纹', desc:'针法数字化 · 丝线虚拟走线'},
  ];
  const it = items[idx] || items[0];
  document.getElementById('cmp-title').textContent = it.title;
  document.getElementById('cmp-sub').textContent = it.sub;
  document.getElementById('cmp-desc').textContent = it.desc;
  // 绘制左侧（老照片风格）
  drawCompareOld(CMP.ctxL, CMP.canvasL.width, CMP.canvasL.height, idx);
  // 绘制右侧（数字复刻）
  drawCompareNew(CMP.ctxR, CMP.canvasR.width, CMP.canvasR.height, idx);
  document.getElementById('cmp-slider').value = 50;
  updateCompareSlider(50);
}
function drawCompareOld(x, W, H, idx){
  // 老照片泛黄底
  x.fillStyle = '#3a2a1a'; x.fillRect(0,0,W,H);
  // 噪点
  for(let i=0;i<800;i++){
    x.fillStyle = `rgba(${180+Math.random()*40},${150+Math.random()*30},${100+Math.random()*20},${Math.random()*0.3})`;
    x.fillRect(Math.random()*W, Math.random()*H, 2, 2);
  }
  const cx = W/2, cy = H/2, R = Math.min(W,H)*0.3;
  // 粗糙残损纹样
  x.globalAlpha = 0.5; x.fillStyle = '#6a3020';
  x.beginPath(); x.arc(cx, cy, R, 0, Math.PI*2); x.fill();
  x.strokeStyle = 'rgba(100,60,30,0.6)'; x.lineWidth = 2;
  for(let i=0;i<6;i++){
    const a = i*Math.PI/3;
    x.beginPath(); x.moveTo(cx,cy); x.lineTo(cx+Math.cos(a)*R*0.8, cy+Math.sin(a)*R*0.8); x.stroke();
  }
  // 裂纹
  x.strokeStyle = 'rgba(40,20,10,0.4)'; x.lineWidth = 1;
  for(let i=0;i<3;i++){
    x.beginPath();
    x.moveTo(cx-R*0.5, cy-R*0.3+i*20);
    x.lineTo(cx+R*0.3, cy+R*0.2+i*15);
    x.stroke();
  }
  x.globalAlpha = 1;
  // 标签
  x.fillStyle = 'rgba(200,170,120,0.5)'; x.font = '10px serif'; x.textAlign = 'center';
  x.fillText('博物馆藏 · 民国时期', W/2, H-10);
}
function drawCompareNew(x, W, H, idx){
  // 数字化高对比底
  x.fillStyle = '#0d0d1a'; x.fillRect(0,0,W,H);
  const cx = W/2, cy = H/2, R = Math.min(W,H)*0.3;
  // 精细金线纹样
  x.strokeStyle = '#D4A843'; x.lineWidth = 2.5;
  x.beginPath(); x.arc(cx, cy, R*0.6, 0, Math.PI*2); x.stroke();
  x.beginPath(); x.arc(cx, cy, R*0.3, 0, Math.PI*2); x.stroke();
  for(let i=0;i<8;i++){
    const a = i*Math.PI/4;
    x.beginPath(); x.moveTo(cx, cy);
    x.lineTo(cx+Math.cos(a)*R*0.55, cy+Math.sin(a)*R*0.55); x.stroke();
  }
  // 粒子光效
  x.save(); x.globalCompositeOperation = 'lighter';
  for(let i=0;i<30;i++){
    const a = Math.random()*Math.PI*2, r = Math.random()*R;
    x.fillStyle = 'rgba(240,214,138,0.15)';
    x.beginPath(); x.arc(cx+Math.cos(a)*r, cy+Math.sin(a)*r, 1.5, 0, Math.PI*2); x.fill();
  }
  x.restore();
  x.fillStyle = 'rgba(240,214,138,0.5)'; x.font = '10px sans-serif'; x.textAlign = 'center';
  x.fillText('数字复刻 · 3D精雕', W/2, H-10);
}
function updateCompareSlider(val){
  const pct = val / 100;
  const right = document.getElementById('cmp-canvas-r');
  if(right) right.style.clipPath = `inset(0 0 0 ${pct*100}%)`;
}

/* ================================================================
 * 四、纹样基因档案面板
 * ================================================================ */
function toggleGeneArchive(){
  const el = document.getElementById('gene-archive');
  if(el) el.classList.toggle('collapsed');
}
function updateGeneArchive(scene){
  const el = document.getElementById('gene-archive');
  const body = document.getElementById('ga-body');
  if(!el || !body) return;
  el.style.display = '';
  // 根据场景过滤
  const filter = scene === 'puppet' ? 'puppet' : scene === 'emb' ? 'emb' : 'paper';
  body.innerHTML = GENE_ARCHIVE.map(g=>{
    return `<div class="ga-entry"><b>${g.name}</b>`+
      `<div class="ga-meaning">寓意：${g.meaning}</div>`+
      `<div class="ga-meaning">起源：${g.origin}</div>`+
      `<div class="ga-meaning">▶ 剪纸：${g.paper}</div>`+
      `<div class="ga-meaning">▶ 皮影：${g.puppet}</div>`+
      `<div class="ga-meaning">▶ 刺绣：${g.emb}</div></div>`;
  }).join('');
}

/* ================================================================
 * 五、传承人音频彩蛋
 * ================================================================ */
let _audioCtx2 = null;
function playMasterAudio(){
  const scene = typeof STATE !== 'undefined' && STATE.currentScene ? STATE.currentScene : 'paper';
  const sceneMap = { paper:'paper_window', puppet:'puppet_stage', emb:'emb_pillow' };
  let key = sceneMap[scene] || 'paper_window';
  // 如果有更具体的热点选择
  const data = MASTER_AUDIO[key];
  if(!data) return;
  // 用WebAudio合成模拟口述（暖音+颤音+五声）
  if(!_audioCtx2) _audioCtx2 = new (window.AudioContext || window.webkitAudioContext)();
  const ac = _audioCtx2;
  if(ac.state === 'suspended') ac.resume();
  // 清理旧节点
  if(window._masterAudioNodes){ window._masterAudioNodes.forEach(n=>{try{n.stop();}catch(e){}}); }
  const nodes = [];
  // 基频+谐波叠加模拟人声
  const baseFreq = 180;
  const harmonics = [1, 1.5, 2, 2.5, 3];
  const dur = 10;
  const masterGain = ac.createGain();
  masterGain.gain.setValueAtTime(0, ac.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.15, ac.currentTime + 0.5);
  masterGain.gain.linearRampToValueAtTime(0.12, ac.currentTime + dur - 1);
  masterGain.gain.linearRampToValueAtTime(0, ac.currentTime + dur);
  masterGain.connect(ac.destination);
  // 五声旋律
  const pentatonic = [0, 2, 4, 7, 9]; // C D E G A
  const noteDur = dur / 10;
  for(let n=0; n<10; n++){
    const semitone = pentatonic[n % pentatonic.length];
    const freq = baseFreq * Math.pow(2, semitone/12);
    const t0 = ac.currentTime + n * noteDur;
    harmonics.forEach((h, i)=>{
      const osc = ac.createOscillator();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq * h, t0);
      // 颤音
      const lfo = ac.createOscillator();
      lfo.frequency.value = 5 + Math.random()*2;
      const lfoGain = ac.createGain();
      lfoGain.gain.value = freq * 0.02;
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
      const g = ac.createGain();
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.6 / harmonics.length, t0 + 0.1);
      g.gain.linearRampToValueAtTime(0, t0 + noteDur * 0.9);
      osc.connect(g); g.connect(masterGain);
      osc.start(t0); lfo.start(t0);
      osc.stop(t0 + noteDur); lfo.stop(t0 + noteDur);
      nodes.push(osc, lfo);
    });
  }
  window._masterAudioNodes = nodes;
  // 显示文本
  const meta = document.getElementById('audio-meta');
  if(meta) meta.textContent = `—— ${data.from}`;
  // 口述文本显示
  if(typeof showToast === 'function') showToast(`「${data.text}」`);
  // 按钮状态
  const btn = document.getElementById('audio-play-btn');
  if(btn){ btn.textContent = '🔊 播放中...'; setTimeout(()=>{ if(btn) btn.textContent = '🔊 传承人口述'; }, dur*1000); }
}
function showAudioEgg(scene){
  const el = document.getElementById('audio-egg');
  if(!el) return;
  const sceneMap = { paper:'paper_window', puppet:'puppet_stage', emb:'emb_pillow' };
  if(sceneMap[scene]){
    el.style.display = '';
  } else {
    el.style.display = 'none';
  }
}

/* ================================================================
 * 六、研学/专家模式 + 无障碍适配
 * ================================================================ */
let _appMode = 'expert';
function openMode(){
  const ov = document.getElementById('mode-overlay');
  if(ov) ov.classList.add('show');
}
function closeMode(){
  const ov = document.getElementById('mode-overlay');
  if(ov) ov.classList.remove('show');
}
function setAppMode(mode){   // 研学/专家模式（原误名 setMode，覆盖了 script.js 的状态栏 setMode 导致状态文字失效 + 模式串扰）
  _appMode = mode;
  if(mode === 'study'){
    document.body.classList.add('study-mode');
    if(typeof showToast === 'function') showToast('📚 研学简易模式已启用 · 引导弹窗将自动显示');
    // 自动显示引导
    setTimeout(()=>{
      if(typeof showGuide === 'function') showGuide('study', '研学模式：点击展品跟随引导体验 · 每步有操作提示');
    }, 500);
  } else {
    document.body.classList.remove('study-mode');
    if(typeof showToast === 'function') showToast('🔬 专家深度模式已启用 · 高级参数已开放');
  }
}
function toggleA11y(type){
  switch(type){
    case 'largefont':
      document.body.classList.toggle('large-font');
      break;
    case 'narrate':
      if(document.getElementById('a11y-narrate').checked){
        if(typeof showToast === 'function') showToast('旁白朗读已启用 · 点击展品时将语音播报');
        window._narrate = true;
      } else {
        window._narrate = false;
      }
      break;
    case 'keyboard':
      window._keyboardNav = document.getElementById('a11y-keyboard').checked;
      break;
  }
}
// 旁白朗读
function narrate(text){
  if(!window._narrate || !text) return;
  if(!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN'; u.rate = 0.9; u.pitch = 1;
  speechSynthesis.speak(u);
}
// 键盘导航增强
function initKeyboardNav(){
  document.addEventListener('keydown', e=>{
    if(e.key === 'Tab' && window._keyboardNav !== false){
      // 高亮当前聚焦元素
      const focused = document.activeElement;
      if(focused && focused.classList){
        focused.classList.add('kb-focus');
      }
    }
    // 1-9数字键快速切换展区导航
    if(e.key >= '1' && e.key <= '9' && !e.ctrlKey && !e.metaKey){
      const items = document.querySelectorAll('.nav-item');
      const idx = parseInt(e.key) - 1;
      if(items[idx]) items[idx].click();
    }
    // Escape关闭弹窗
    if(e.key === 'Escape'){
      ['meaning-overlay','chronicle-overlay','compare-overlay','mode-overlay'].forEach(id=>{
        const el = document.getElementById(id);
        if(el && el.classList.contains('show')) el.classList.remove('show');
      });
    }
  });
}

/* ================================================================
 * 七、纹样流转引擎升级（镜头跟随粒子跨场景）
 * ================================================================ */
function playFlowMorphUpgraded(target, done){
  // 在原有playFlowMorph基础上增加镜头跟随效果
  if(typeof playFlowMorph === 'function'){
    // 镜头抖动模拟
    const container = document.getElementById('canvas-container');
    if(container){
      container.style.transition = 'transform 0.3s ease';
      container.style.transform = 'scale(0.98)';
      setTimeout(()=>{ container.style.transform = 'scale(1.02)'; }, 300);
      setTimeout(()=>{ container.style.transform = 'scale(1)'; container.style.transition = ''; }, 600);
    }
    playFlowMorph(target, done);
  } else if(done) done();
}

/* ================================================================
 * 八、刻纸物理模拟升级
 * ================================================================ */
function upgradeCarveEffect(p){
  // 纸屑飞溅粒子
  if(typeof CARVE !== 'undefined' && CARVE.cutting){
    if(!CARVE.chips) CARVE.chips = [];
    for(let i=0;i<3;i++){
      const a = Math.random()*Math.PI*2;
      CARVE.chips.push({x:p.x, y:p.y, vx:Math.cos(a)*(2+Math.random()*3),
        vy:Math.sin(a)*(2+Math.random()*3)-1, life:1, sz:1+Math.random()*2,
        col: Math.random()<0.5 ? '226,178,110' : '196,30,58'});
    }
  }
}
function carveLiftAnimation(){
  // 纸张揭起动画
  const cv = document.getElementById('carve-canvas');
  if(!cv) return;
  const x = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  let lift = 0;
  const t0 = performance.now();
  (function frame(){
    const t = (performance.now()-t0)/2000;
    if(t >= 1) return;
    lift = Math.sin(t*Math.PI) * 15;
    // 重绘纹样带浮起效果
    x.save();
    x.shadowColor = 'rgba(0,0,0,0.3)';
    x.shadowBlur = 10 + lift;
    x.shadowOffsetY = lift;
    x.restore();
    requestAnimationFrame(frame);
  })();
}

/* ================================================================
 * 九、拼窗花光影投影
 * ================================================================ */
function puzzleWallProjection(){
  if(typeof _S3 === 'undefined' || !_S3) return;
  const scene = typeof paperScene !== 'undefined' ? paperScene : null;
  if(!scene) return;
  // 在展厅墙面创建投影面
  const wallPositions = [
    {x:-6, y:3, z:-4, rx:0, ry:Math.PI/2},
    {x:6, y:3, z:-4, rx:0, ry:-Math.PI/2},
    {x:0, y:4, z:-8, rx:0, ry:0},
  ];
  wallPositions.forEach(pos=>{
    const geo = new _S3.PlaneGeometry(3, 3);
    const mat = new _S3.MeshBasicMaterial({
      color: 0xC41E3A, transparent:true, opacity:0.15,
      blending: _S3.AdditiveBlending, depthWrite:false
    });
    const mesh = new _S3.Mesh(geo, mat);
    mesh.position.set(pos.x, pos.y, pos.z);
    mesh.rotation.y = pos.ry;
    mesh.userData = {isProjection:true};
    scene.add(mesh);
    // 星光粒子
    const pGeo = new _S3.BufferGeometry();
    const pCount = 30;
    const positions = new Float32Array(pCount*3);
    for(let i=0;i<pCount;i++){
      positions[i*3] = pos.x + (Math.random()-0.5)*2.5;
      positions[i*3+1] = pos.y + (Math.random()-0.5)*2.5;
      positions[i*3+2] = pos.z + 0.1;
    }
    pGeo.setAttribute('position', new _S3.BufferAttribute(positions, 3));
    const pMat = new _S3.PointsMaterial({
      color:0xF0D68A, size:0.08, transparent:true, opacity:0.6,
      blending:_S3.AdditiveBlending, depthWrite:false
    });
    const points = new _S3.Points(pGeo, pMat);
    points.userData = {isProjectionStar:true, t:Math.random()*Math.PI*2};
    scene.add(points);
  });
  if(typeof showToast === 'function') showToast('窗花已上墙 · 展厅墙面投射剪纸光影');
}

/* ================================================================
 * 十、皮影实时光追阴影
 * ================================================================ */
function puppetRealtimeShadow(){
  // 在皮影canvas上模拟实时阴影投射
  const scene = typeof STATE !== 'undefined' ? STATE.currentScene : '';
  if(scene !== 'puppet' || !_S3) return;
  // 已有皮影mesh的阴影投射逻辑在render中处理
  // 这里添加幕布上的动态光效
  const puppetScene = typeof puppetScene !== 'undefined' ? puppetScene : null;
  if(!puppetScene) return;
  // 检查是否已有动态光源
  if(puppetScene.userData._dynLight) return;
  const light = new _S3.PointLight(0xFFD78A, 0.6, 15);
  light.position.set(0, 3, 4);
  light.userData = {isDynPuppetLight:true, t:0};
  puppetScene.add(light);
  puppetScene.userData._dynLight = light;
  // 篝火光晕
  const fireGeo = new _S3.BufferGeometry();
  const fireCount = 50;
  const firePos = new Float32Array(fireCount*3);
  for(let i=0;i<fireCount;i++){
    firePos[i*3] = (Math.random()-0.5)*3;
    firePos[i*3+1] = -1 + Math.random()*2;
    firePos[i*3+2] = 2 + Math.random()*0.5;
  }
  fireGeo.setAttribute('position', new _S3.BufferAttribute(firePos, 3));
  const fireMat = new _S3.PointsMaterial({
    color:0xFF6600, size:0.06, transparent:true, opacity:0.5,
    blending:_S3.AdditiveBlending, depthWrite:false
  });
  const fire = new _S3.Points(fireGeo, fireMat);
  fire.userData = {isFireParticles:true, t:0};
  puppetScene.add(fire);
}

/* ================================================================
 * 十一、皮影录制导出GIF
 * ================================================================ */
const REC = { recording:false, frames:[], raf:null, startTime:0 };
function toggleDramaRecord(){
  const cv = document.getElementById('drama-canvas');
  if(!cv) return;
  if(!REC.recording){
    REC.recording = true; REC.frames = []; REC.startTime = performance.now();
    const btn = document.getElementById('drama-rec-btn');
    if(btn) btn.textContent = '⏹ 停止录制';
    if(typeof showToast === 'function') showToast('开始录制皮影剧目 · 拖拽角色编排动作');
    recLoop();
  } else {
    REC.recording = false;
    const btn = document.getElementById('drama-rec-btn');
    if(btn) btn.textContent = '🔴 录制短片';
    exportDramaGIF();
  }
}
function recLoop(){
  if(!REC.recording) return;
  const cv = document.getElementById('drama-canvas');
  if(cv){
    try { REC.frames.push(cv.toDataURL('image/jpeg', 0.3)); } catch(e){}
    if(REC.frames.length > 120) REC.frames.shift(); // 最多4秒@30fps
  }
  REC.raf = requestAnimationFrame(recLoop);
}
function exportDramaGIF(){
  if(REC.frames.length < 5){
    if(typeof showToast === 'function') showToast('录制太短，请录制至少2秒');
    return;
  }
  // 生成GIF（简化版：导出第一帧为海报+序列说明）
  const cv = document.createElement('canvas');
  cv.width = 640; cv.height = 400;
  const x = cv.getContext('2d');
  // 合成导出图
  const img = new Image();
  img.onload = ()=>{
    x.fillStyle = '#0d0d1a'; x.fillRect(0,0,cv.width,cv.height);
    x.drawImage(img, 0, 0, cv.width, cv.height);
    x.fillStyle = 'rgba(0,0,0,0.6)'; x.fillRect(0, cv.height-40, cv.width, 40);
    x.fillStyle = '#F0D68A'; x.font = 'bold 14px sans-serif'; x.textAlign = 'center';
    x.fillText('辽韵三萃 · 皮影剧目短片 · ' + REC.frames.length + '帧', cv.width/2, cv.height-16);
    cv.toBlob(blob=>{
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `皮影剧目_${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      if(typeof showToast === 'function') showToast('皮影短片已导出！可带走自己创作的非遗皮影作品');
    });
  };
  img.src = REC.frames[0];
  if(typeof markExplore === 'function') markExplore('drama_record');
}

/* ================================================================
 * 十二、刺绣丝线物理模拟升级
 * ================================================================ */
function upgradeEmbThread(p, prev){
  // 丝线物理拖尾
  if(typeof THREAD !== 'undefined' && THREAD.stitching){
    if(!THREAD.silkTrail) THREAD.silkTrail = [];
    // 丝质高光点
    THREAD.silkTrail.push({
      x:p.x, y:p.y, life:1,
      glow: 0.3 + Math.random()*0.4,
      hue: 40 + Math.random()*20
    });
    if(THREAD.silkTrail.length > 80) THREAD.silkTrail.shift();
    // 毛絮粒子（走错时）
    if(THREAD.error){
      for(let i=0;i<4;i++){
        const a = Math.random()*Math.PI*2;
        if(!THREAD.fuzz) THREAD.fuzz = [];
        THREAD.fuzz.push({x:p.x, y:p.y, vx:Math.cos(a)*2, vy:Math.sin(a)*2,
          life:0.8, sz:1+Math.random()*1.5, col:'120,100,80'});
      }
    }
  }
}

/* ================================================================
 * 十三、探索进度系统升级 0/16 + CG解锁
 * ================================================================ */
const EXPLORE_16 = [
  {id:'visit_paper', name:'初访剪纸展厅'},
  {id:'visit_puppet', name:'初访皮影展厅'},
  {id:'visit_emb', name:'初访刺绣展厅'},
  {id:'carve_done', name:'完成刻绘剪纸'},
  {id:'puzzle_done', name:'完成拼窗花'},
  {id:'flow_first', name:'首次纹样流转'},
  {id:'deliver_first', name:'首次纹样投递'},
  {id:'asm_done', name:'纹样拼图通关'},
  {id:'drama_done', name:'皮影小剧场开演'},
  {id:'emb_game', name:'绣纹闯关通关'},
  {id:'meaning_complete', name:'纹样寓意解锁'},
  {id:'chronicle_complete', name:'传承录通关'},
  {id:'compare_view', name:'古今对照查看'},
  {id:'shop_export', name:'导出数字文创'},
  {id:'audio_listen', name:'聆听传承人口述'},
  {id:'mode_switch', name:'切换体验模式'},
];
function markExplore16(id){
  if(!window._explored16) window._explored16 = new Set();
  if(window._explored16.has(id)) return;
  window._explored16.add(id);
  const count = window._explored16.size;
  const el = document.getElementById('explore-count');
  if(el) el.textContent = count + '/16';
  const bar = document.getElementById('explore-bar');
  if(bar) bar.style.width = (count/16*100) + '%';
  // 解锁通知
  const item = EXPLORE_16.find(e=>e.id===id);
  if(item && typeof showToast === 'function') showToast(`探索进度 +1 · ${item.name} (${count}/16)`);
  // 全部解锁
  if(count >= 16){
    setTimeout(()=>{
      if(typeof showToast === 'function') showToast('🎉 全部16项探索完成！解锁三艺共生隐藏CG短片');
      playCGFinale();
    }, 1000);
  }
}
function playCGFinale(){
  const div = document.createElement('div');
  div.id = 'finale-overlay';
  div.style.cssText = 'position:fixed;inset:0;z-index:500;background:rgba(0,0,0,0.95);display:flex;align-items:center;justify-content:center;';
  div.innerHTML = '<canvas id="finale-canvas" width="800" height="450" style="border-radius:12px;box-shadow:0 0 80px rgba(212,168,67,0.3);"></canvas><div style="position:absolute;top:20px;right:30px;font-size:24px;color:#D4A843;cursor:pointer;" onclick="document.getElementById(\'finale-overlay\').remove()">✕</div>';
  document.body.appendChild(div);
  const cv = document.getElementById('finale-canvas');
  const x = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const t0 = performance.now(), DUR = 8000;
  (function frame(now){
    const t = Math.min(1, (now-t0)/DUR);
    x.fillStyle = '#0d0d1a'; x.fillRect(0,0,W,H);
    // 标题
    x.fillStyle = `rgba(240,214,138,${Math.min(1,t*2)})`;
    x.font = 'bold 28px "Noto Serif SC"'; x.textAlign = 'center';
    x.fillText('一脉辽纹 · 三艺共生', W/2, 45);
    // 三栏纹样演变
    const carriers = ['剪纸 · 红纸镂刻','皮影 · 驴皮镂雕','刺绣 · 丝线盘绣'];
    const colW = W/3;
    for(let i=0;i<3;i++){
      const cx = colW*i + colW/2, cy = H/2;
      const R = 80;
      const reveal = Math.max(0, Math.min(1, (t - i*0.15) * 2));
      // 背景
      const bgs = ['#3a0a0a','#2a1a0a','#1a0a2a'];
      x.globalAlpha = 0.4; x.fillStyle = bgs[i];
      x.beginPath(); x.arc(cx, cy, R+12, 0, Math.PI*2); x.fill();
      x.globalAlpha = 1;
      // 粒子聚合→成形
      for(let j=0;j<40;j++){
        const a = j*Math.PI*2/40 + t*1.5;
        const r = R * (1-reveal) * (0.5+Math.random()*0.5);
        x.fillStyle = `rgba(240,214,138,${0.25*(1-reveal)})`;
        x.beginPath(); x.arc(cx+Math.cos(a)*r, cy+Math.sin(a)*r, 1.5, 0, Math.PI*2); x.fill();
      }
      if(reveal > 0.2){
        x.globalAlpha = (reveal-0.2)/0.8;
        x.strokeStyle = '#D4A843'; x.lineWidth = 2.5;
        x.beginPath(); x.arc(cx, cy, R*0.55, 0, Math.PI*2); x.stroke();
        x.beginPath(); x.arc(cx, cy, R*0.28, 0, Math.PI*2); x.stroke();
        for(let k=0;k<6;k++){
          const a = k*Math.PI/3;
          x.beginPath(); x.moveTo(cx,cy);
          x.lineTo(cx+Math.cos(a)*R*0.5, cy+Math.sin(a)*R*0.5); x.stroke();
        }
        x.globalAlpha = 1;
      }
      x.fillStyle = `rgba(245,230,200,${reveal})`;
      x.font = '13px "Noto Serif SC"';
      x.fillText(carriers[i], cx, cy+R+25);
    }
    // 连接线
    x.strokeStyle = `rgba(212,168,67,${Math.sin(t*Math.PI)*0.4})`;
    x.lineWidth = 1; x.setLineDash([6,6]);
    x.beginPath(); x.moveTo(colW*0.5, H/2); x.lineTo(colW*1.5, H/2); x.stroke();
    x.beginPath(); x.moveTo(colW*1.5, H/2); x.lineTo(colW*2.5, H/2); x.stroke();
    x.setLineDash([]);
    if(t >= 0.9){
      x.fillStyle = `rgba(126,200,169,${(t-0.9)*10})`;
      x.font = 'bold 18px sans-serif';
      x.fillText('✦ 传统纹样基因 · 跨载体活态再生完成 ✦', W/2, H-25);
    }
    if(t < 1) requestAnimationFrame(frame);
  })(t0);
}

/* ================================================================
 * 初始化钩子
 * ================================================================ */
function initUpgrades(){
  // 初始化纹样寓意输入
  setTimeout(initMeaningInput, 100);
  // 初始化传承录输入
  setTimeout(initChronicleInput, 100);
  // 初始化键盘导航
  initKeyboardNav();
  // 劫持markExplore到16系统
  if(typeof markExplore === 'function'){
    const _old = markExplore;
    window.markExplore = function(id){
      _old(id);
      markExplore16(id);
    };
  } else {
    window.markExplore = markExplore16;
  }
  // 劫持showKnowledge显示音频彩蛋
  if(typeof showKnowledge === 'function'){
    const _oldSK = showKnowledge;
    window.showKnowledge = function(scene, id){
      _oldSK(scene, id);
      showAudioEgg(scene);
      updateGeneArchive(scene);
      // 旁白
      const kBody = document.getElementById('k-body');
      if(kBody && window._narrate){
        narrate(kBody.textContent.substring(0, 200));
      }
    };
  }
  // 在拼窗花完成后触发投影
  if(typeof closePuzzle === 'function'){
    const _oldCP = closePuzzle;
    window.closePuzzle = function(){
      _oldCP();
      puzzleWallProjection();
    };
  }
  // 在刻绘中添加纸屑
  if(typeof initCarve === 'function'){
    const _oldIC = initCarve;
    window.initCarve = function(motif){
      _oldIC(motif);
      if(!CARVE._upgraded){
        CARVE._upgraded = true;
      }
    };
  }
  // ===== F4 跨载体物理模拟视觉特效 =====
  setTimeout(function(){
    var hook = function(obj, loopKey, wrapFn){
      if(!obj || !obj[loopKey]) return;
      if(obj[loopKey + '_physics']) return;
      obj[loopKey + '_physics'] = obj[loopKey];
      obj[loopKey] = function(){
        obj[loopKey + '_physics']();
        wrapFn(obj);
      };
    };
    // 剪纸：纸张弯折抖动 + 刻痕撕裂毛边
    hook(window, 'carveLoop', function(){
      if(typeof CARVE === 'undefined' || !CARVE.open || !CARVE.ctx) return;
      var ctx = CARVE.ctx, T = CARVE.T;
      ctx.save();
      ctx.translate(Math.sin(T*2.3)*0.5, Math.cos(T*1.7)*0.3);
      ctx.strokeStyle = 'rgba(196,30,58,0.03)'; ctx.lineWidth = 1;
      for(var i=0;i<12;i++){
        var y = (CARVE_S/12)*i + Math.sin(T*3+i*0.5)*2;
        ctx.beginPath(); ctx.moveTo(10,y); ctx.bezierCurveTo(CARVE_S/3,y+Math.sin(T*2+i)*3,CARVE_S*2/3,y+Math.cos(T*2+i)*3,CARVE_S-10,y);
        ctx.stroke();
      }
      ctx.restore();
      if(CARVE.doneCnt > 5){
        ctx.save();
        ctx.strokeStyle = 'rgba(200,120,100,0.25)'; ctx.lineWidth = 0.8;
        CARVE.blackPts.forEach(function(p){
          if(!p.done) return;
          for(var k=0;k<2;k++){
            var a = Math.random()*Math.PI*2, r = 11 + Math.random()*4;
            var x1 = p.x + Math.cos(a)*r, y1 = p.y + Math.sin(a)*r;
            ctx.beginPath(); ctx.moveTo(x1,y1);
            ctx.lineTo(x1+Math.cos(a+Math.PI/2)*(2+Math.random()*3), y1+Math.sin(a+Math.PI/2)*(2+Math.random()*3));
            ctx.stroke();
          }
        });
        ctx.restore();
      }
    });
    // 皮影：皮料抖动 + 幕布透光纹理
    hook(window, 'manipLoop', function(){
      if(typeof MANIP === 'undefined' || !MANIP.open || !MANIP.ctx) return;
      var ctx = MANIP.ctx, T = MANIP.T;
      ctx.save();
      ctx.translate(320+Math.sin(T*13)*0.4+MANIP.turn*3, 330+Math.cos(T*11)*0.3+MANIP.lift*2);
      ctx.globalAlpha = 0.15 + Math.sin(T*4)*0.05; ctx.fillStyle = '#F0D68A';
      ctx.beginPath(); ctx.ellipse(0,-150,60,250,0,0,Math.PI*2); ctx.fill();
      ctx.restore();
      ctx.save(); ctx.globalAlpha=0.08; ctx.strokeStyle='#F0D68A'; ctx.lineWidth=0.5;
      for(var i=0;i<8;i++){
        var y=30+i*45; ctx.beginPath();
        for(var x=60;x<580;x+=12) ctx.lineTo(x, y+Math.sin(x*0.05+T*2+i)*2);
        ctx.stroke();
      }
      ctx.restore();
    });
    // 刺绣：丝线光泽 + 织物纤维纹理
    hook(window, 'threadLoop', function(){
      if(typeof THREAD === 'undefined' || !THREAD.open || !THREAD.ctx) return;
      var ctx = THREAD.ctx, T = THREAD.T;
      if(THREAD.stitched.length > 2){
        ctx.save(); ctx.fillStyle = '#FCE8A4';
        var step = Math.max(1, Math.floor(THREAD.stitched.length/30));
        for(var i=0;i<THREAD.stitched.length;i+=step){
          var p = THREAD.stitched[i], ph = (T*2+i*0.3)%(Math.PI*2);
          ctx.globalAlpha = (0.3+0.5*Math.abs(Math.sin(ph)))*0.6;
          ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
      }
      ctx.save(); ctx.globalAlpha=0.04; ctx.strokeStyle='#D4A843'; ctx.lineWidth=0.4;
      for(var x=0;x<THREAD_S;x+=8){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,THREAD_S);ctx.stroke();}
      for(var y=0;y<THREAD_S;y+=8){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(THREAD_S,y);ctx.stroke();}
      ctx.restore();
    });
    console.log('[物理特效] 剪纸弯折/皮影透光/刺绣光泽 注入完成');
  }, 500);
  console.log('[升级脚本] 初始化完成 · 含游戏4纹样寓意/游戏5传承录/古今对照/基因档案/音频/模式/无障碍');
}

// 页面加载后初始化
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', ()=>setTimeout(initUpgrades, 2000));
} else {
  setTimeout(initUpgrades, 2000);
}

/* ================================================================
 * 六大游戏深度升级
 * 1. 拼窗花 → 折剪工艺沉浸体验（折-剪-展完整工艺）
 * 2. 纹样拼图 → 纹样演化时间轴（复原+千年演变）
 * 3. 绣样拼贴 → 针法模拟（选针法真实走针）
 * 4. 皮影操纵 → 光影叙事（光源角度控制影子+默剧编排）
 * 5. 纹样溯源 → 族谱树（跨文化基因流动）
 * 6. 皮影小剧场 → 编剧幕次（多幕编剧+回放）
 * ================================================================ */

/* ===== 1. 拼窗花 → 折剪工艺沉浸体验 =====
 * 立意：满族剪纸核心技艺是"折-剪-展"。非遗传承的不是"拼图"，
 *       而是匠人手脑并用的折剪工艺本身。用户亲手折、剪、展，方知一纸千华。
 */
const FOLD = {
  open:false, canvas:null, ctx:null, raf:0,
  phase:'fold', foldType:0,
  foldNames:['对角折','四角折','六角折'],
  symmetries:[2,4,6],
  cuts:[], currentCut:null, particles:[],
  unfoldT:0, revealT:0, T:0, hover:null, bound:false,
};
const FOLD_CX = 260, FOLD_CY = 240;
const FOLD_FOLDS = [
  {name:'对角折', sym:2, desc:'一次对折 · 左右对称 · 团花基础'},
  {name:'四角折', sym:4, desc:'十字双折 · 四向对称 · 窗花经典'},
  {name:'六角折', sym:6, desc:'三折六瓣 · 六向对称 · 满族团花母题'},
];
function openPuzzle(){
  const ov = document.getElementById('puzzle-overlay');
  if(!ov) return;
  ov.classList.add('show');
  FOLD.open = true;
  FOLD.canvas = document.getElementById('puzzle-canvas');
  FOLD.ctx = FOLD.canvas.getContext('2d');
  FOLD.phase = 'fold';
  FOLD.foldType = 0;
  FOLD.cuts = [];
  FOLD.currentCut = null;
  FOLD.particles = [];
  FOLD.unfoldT = 0;
  FOLD.revealT = 0;
  // 动态更新标题（兼容HTML未更新的情况）
  const title = ov.querySelector('.puzzle-title');
  const sub = ov.querySelector('.puzzle-sub');
  if(title) title.textContent = '折剪窗花工艺';
  if(sub) sub.textContent = '选折叠方式 · 沿金线走剪镂空 · 展开成满族窗花';
  foldInjectUI();
  if(!FOLD.bound){ foldBindInput(); FOLD.bound = true; }
  cancelAnimationFrame(FOLD.raf);
  foldLoop();
  showGuide('puzzle','满族剪纸核心工艺：选折叠方式 → 沿引导线走剪镂空 → 展开成窗花');
}
function closePuzzle(){
  const ov = document.getElementById('puzzle-overlay');
  if(ov) ov.classList.remove('show');
  FOLD.open = false;
  FOLD.currentCut = null;
  cancelAnimationFrame(FOLD.raf);
  const ui = document.getElementById('fold-ui');
  if(ui) ui.remove();
}
function foldInjectUI(){
  let ui = document.getElementById('fold-ui');
  if(ui) ui.remove();
  ui = document.createElement('div');
  ui.id = 'fold-ui';
  ui.className = 'fold-ui';
  ui.innerHTML = `
    <div class="fold-steps">
      <span class="fold-step ${FOLD.phase==='fold'?'on':''}">① 选折叠</span>
      <span class="fold-step ${FOLD.phase==='cut'?'on':''}">② 走剪镂空</span>
      <span class="fold-step ${FOLD.phase==='unfold'?'on':''}">③ 展开成花</span>
    </div>
    <div class="fold-ctrl" id="fold-ctrl"></div>
    <div class="fold-tip" id="fold-tip">选择折叠方式开始</div>
  `;
  const box = document.querySelector('#puzzle-overlay .puzzle-box');
  if(box) box.insertBefore(ui, FOLD.canvas);
  foldUpdateCtrl();
}
function foldUpdateCtrl(){
  const ctrl = document.getElementById('fold-ctrl');
  const tip = document.getElementById('fold-tip');
  if(!ctrl) return;
  const steps = document.querySelectorAll('.fold-step');
  steps.forEach((s,i)=>{ s.classList.toggle('on',
    (FOLD.phase==='fold'&&i===0)||(FOLD.phase==='cut'&&i===1)||(FOLD.phase==='unfold'&&i===2)||(FOLD.phase==='reveal'&&i===2)); });
  if(FOLD.phase === 'fold'){
    ctrl.innerHTML = FOLD_FOLDS.map((f,i)=>
      `<button class="tool-btn ${i===FOLD.foldType?'tool-btn-active':''}" onclick="foldSelect(${i})">${f.name}</button>`
    ).join('') + `<button class="tool-btn fold-go" onclick="foldStartCut()">▶ 开始走剪</button>`;
    if(tip) tip.textContent = `当前：${FOLD_FOLDS[FOLD.foldType].name} · ${FOLD_FOLDS[FOLD.foldType].desc}`;
  } else if(FOLD.phase === 'cut'){
    ctrl.innerHTML = `<button class="tool-btn" onclick="foldUndo()">↩ 撤销</button>`
      + `<button class="tool-btn" onclick="foldClear()">清空</button>`
      + `<button class="tool-btn fold-go" onclick="foldUnfold()">▶ 展开窗花</button>`;
    if(tip) tip.textContent = FOLD.cuts.length>0
      ? `已剪 ${FOLD.cuts.length} 刀 · 沿折纸面拖动鼠标继续镂空 · 满意后点"展开窗花"`
      : `在红色折纸上拖动鼠标走剪 · 金线为引导 · 剪出镂空纹样`;
  } else if(FOLD.phase === 'reveal'){
    ctrl.innerHTML = `<button class="tool-btn" onclick="foldRestart()">↻ 再剪一扇</button>`
      + `<button class="tool-btn fold-go" onclick="foldPlaceOnWall()">✿ 贴上展厅墙面</button>`;
    if(tip) tip.textContent = '窗花已成 · 可贴上展厅墙面或再剪一扇';
  } else {
    ctrl.innerHTML = '';
    if(tip) tip.textContent = '展开中…';
  }
}
function foldSelect(i){ FOLD.foldType = i; foldUpdateCtrl(); }
function foldStartCut(){ FOLD.phase = 'cut'; foldUpdateCtrl(); }
function foldUndo(){ if(FOLD.cuts.length) FOLD.cuts.pop(); foldUpdateCtrl(); }
function foldClear(){ FOLD.cuts = []; foldUpdateCtrl(); }
function foldUnfold(){
  if(FOLD.cuts.length === 0){ showToast('请先在折纸上走剪至少一刀'); return; }
  FOLD.phase = 'unfold'; FOLD.unfoldT = 0; foldUpdateCtrl();
}
function foldRestart(){
  FOLD.phase = 'fold'; FOLD.cuts = []; FOLD.particles = []; FOLD.unfoldT = 0; foldUpdateCtrl();
}
function foldPlaceOnWall(){
  if(typeof unlockCode === 'function') unlockCode('pin');
  showToast('窗花已贴上展厅墙面 · 鎏金光影投射');
  closePuzzle();
  if(typeof puzzleWallProjection === 'function') puzzleWallProjection();
  if(typeof showModal === 'function'){
    showModal({title:'成就 · 折剪窗花', sub:'满族剪纸核心工艺沉浸体验',
      body:'你亲手完成了<b>折-剪-展</b>三步工艺。一折定对称，一剪镂千华，一展见窗花。这就是满族剪纸匠人代代相传的手脑并用之技。'});
  }
}
function foldBindInput(){
  const c = FOLD.canvas;
  const pos = e=>{
    const r = c.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return {x:(t.clientX-r.left)*(c.width/r.width), y:(t.clientY-r.top)*(c.height/r.height)};
  };
  function down(e){
    if(FOLD.phase !== 'cut') return;
    const pt = pos(e);
    FOLD.currentCut = {pts:[pt], t0:performance.now()};
    e.preventDefault();
  }
  function move(e){
    const pt = pos(e);
    FOLD.hover = pt;
    if(!FOLD.currentCut) return;
    const last = FOLD.currentCut.pts[FOLD.currentCut.pts.length-1];
    if(Math.hypot(pt.x-last.x, pt.y-last.y) > 3){
      FOLD.currentCut.pts.push(pt);
      // 金粉飞溅
      for(let i=0;i<3;i++){
        const a = Math.random()*Math.PI*2, sp = 0.5+Math.random()*2.5;
        FOLD.particles.push({x:pt.x, y:pt.y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-1,
          life:1, sz:1.5+Math.random()*2, c:Math.random()<0.6?'#F0D68A':'#E8455F'});
      }
    }
    e.preventDefault();
  }
  function up(){
    if(FOLD.currentCut && FOLD.currentCut.pts.length > 2){
      FOLD.cuts.push(FOLD.currentCut);
      foldUpdateCtrl();
    }
    FOLD.currentCut = null;
  }
  c.addEventListener('mousedown', down);
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);
  c.addEventListener('touchstart', down, {passive:false});
  c.addEventListener('touchmove', move, {passive:false});
  c.addEventListener('touchend', up);
}
function foldWedgeAngle(){ return Math.PI*2 / FOLD_FOLDS[FOLD.foldType].sym; }
function foldInWedge(pt){
  // 判断点是否在当前楔形区域内（以中心为原点，0度向右，向上为负y）
  const dx = pt.x - FOLD_CX, dy = pt.y - FOLD_CY;
  const r = Math.hypot(dx, dy);
  if(r > 175) return false;
  let ang = Math.atan2(dy, dx); // -PI..PI
  // 楔形区域：-wedge/2 .. +wedge/2 (即向上方)
  const wa = foldWedgeAngle();
  // 把角度归到 -PI..PI 然后看是否在 [-wa/2, wa/2] 范围（向上=负y，即角度=-PI/2附近）
  // 让楔形朝上：中心角度 = -PI/2
  let da = ang - (-Math.PI/2);
  while(da > Math.PI) da -= Math.PI*2;
  while(da < -Math.PI) da += Math.PI*2;
  return Math.abs(da) <= wa/2;
}
function foldDrawWedge(ctx, alpha){
  const sym = FOLD_FOLDS[FOLD.foldType].sym;
  const wa = Math.PI*2 / sym;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(FOLD_CX, FOLD_CY);
  ctx.arc(FOLD_CX, FOLD_CY, 175, -Math.PI/2 - wa/2, -Math.PI/2 + wa/2);
  ctx.closePath();
  ctx.clip();
  // 红纸渐变
  const g = ctx.createRadialGradient(FOLD_CX, FOLD_CY, 10, FOLD_CX, FOLD_CY, 175);
  g.addColorStop(0, '#E8455F'); g.addColorStop(0.7, '#C41E3A'); g.addColorStop(1, '#8B1428');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fillRect(FOLD_CX-180, FOLD_CY-180, 360, 360);
  ctx.globalAlpha = 1;
  // 织物纹理
  ctx.strokeStyle = 'rgba(245,230,200,0.04)';
  ctx.lineWidth = 1;
  for(let i=-180;i<180;i+=6){
    ctx.beginPath(); ctx.moveTo(FOLD_CX+i, FOLD_CY-180); ctx.lineTo(FOLD_CX+i, FOLD_CY+180); ctx.stroke();
  }
  ctx.restore();
}
function foldEraseCuts(ctx){
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for(const cut of FOLD.cuts){
    if(cut.pts.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(cut.pts[0].x, cut.pts[0].y);
    for(let i=1;i<cut.pts.length;i++) ctx.lineTo(cut.pts[i].x, cut.pts[i].y);
    ctx.stroke();
  }
  if(FOLD.currentCut && FOLD.currentCut.pts.length > 1){
    ctx.beginPath();
    ctx.moveTo(FOLD.currentCut.pts[0].x, FOLD.currentCut.pts[0].y);
    for(let i=1;i<FOLD.currentCut.pts.length;i++) ctx.lineTo(FOLD.currentCut.pts[i].x, FOLD.currentCut.pts[i].y);
    ctx.stroke();
  }
  ctx.restore();
}
function foldLoop(){
  if(!FOLD.open) return;
  const ctx = FOLD.ctx, W = FOLD.canvas.width, H = FOLD.canvas.height;
  FOLD.T += 0.016;
  // 背景
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#141020'); bg.addColorStop(1,'#0f0c1a');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
  const sym = FOLD_FOLDS[FOLD.foldType].sym;
  const wa = Math.PI*2 / sym;
  if(FOLD.phase === 'fold' || FOLD.phase === 'cut'){
    // 折叠纸楔形
    foldDrawWedge(ctx, 1);
    // 在楔形上镂空裁剪
    foldEraseCuts(ctx);
    // 折叠引导线（虚线）
    ctx.strokeStyle = 'rgba(240,214,138,0.35)'; ctx.lineWidth = 1.5;
    ctx.setLineDash([6,5]);
    // 对称轴
    for(let i=0;i<sym;i++){
      const a = -Math.PI/2 - wa/2 + i*wa;
      ctx.beginPath();
      ctx.moveTo(FOLD_CX, FOLD_CY);
      ctx.lineTo(FOLD_CX+Math.cos(a)*175, FOLD_CY+Math.sin(a)*175);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // 楔形边框
    ctx.strokeStyle = 'rgba(212,168,67,0.5)'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(FOLD_CX, FOLD_CY);
    ctx.arc(FOLD_CX, FOLD_CY, 175, -Math.PI/2 - wa/2, -Math.PI/2 + wa/2);
    ctx.closePath(); ctx.stroke();
    // 引导纹样（淡）
    if(FOLD.phase === 'fold' || FOLD.cuts.length === 0){
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.translate(FOLD_CX, FOLD_CY - 80);
      ctx.strokeStyle = '#F0D68A'; ctx.lineWidth = 2;
      const hints = [
        ()=>{ ctx.beginPath(); ctx.arc(0,0,30,0,Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.arc(0,0,12,0,Math.PI*2); ctx.stroke(); for(let i=0;i<4;i++){const a=i*Math.PI/2; ctx.beginPath(); ctx.moveTo(Math.cos(a)*20,Math.sin(a)*20); ctx.lineTo(Math.cos(a)*40,Math.sin(a)*40); ctx.stroke();} },
        ()=>{ ctx.beginPath(); ctx.moveTo(-30,20); ctx.quadraticCurveTo(0,-40,30,20); ctx.stroke(); ctx.beginPath(); ctx.arc(0,10,8,0,Math.PI*2); ctx.stroke(); },
        ()=>{ for(let i=0;i<3;i++){ ctx.beginPath(); ctx.ellipse(0,i*10-10,20-i*4,8,0,0,Math.PI*2); ctx.stroke(); } }
      ];
      hints[FOLD.foldType](); ctx.restore();
    }
    // 剪刀光标
    if(FOLD.phase === 'cut' && FOLD.hover && foldInWedge(FOLD.hover)){
      ctx.save();
      ctx.translate(FOLD.hover.x, FOLD.hover.y);
      ctx.strokeStyle = '#F0D68A'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0,0,6,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle = 'rgba(240,214,138,0.9)';
      ctx.font = '14px sans-serif'; ctx.textAlign='center';
      ctx.fillText('✂', 0, -12);
      ctx.restore();
    }
  } else if(FOLD.phase === 'unfold'){
    // 展开动画：从1个楔形 → 全圆
    FOLD.unfoldT += 0.016;
    const p = Math.min(1, FOLD.unfoldT / 1.6);
    const ease = 1 - Math.pow(1-p, 3);
    const curSym = sym; // 最终扇区数
    const shownSectors = 1 + (curSym - 1) * ease;
    ctx.save();
    ctx.translate(FOLD_CX, FOLD_CY);
    // 绘制展开的纸（多扇区）
    for(let s=0; s < Math.ceil(shownSectors); s++){
      const frac = Math.min(1, shownSectors - s);
      ctx.save();
      ctx.rotate(-Math.PI/2 - wa/2 + s*wa);
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.arc(0,0,175,0,wa*frac);
      ctx.closePath();
      ctx.clip();
      const g = ctx.createRadialGradient(0,0,10,0,0,175);
      g.addColorStop(0,'#E8455F'); g.addColorStop(0.7,'#C41E3A'); g.addColorStop(1,'#8B1428');
      ctx.fillStyle = g; ctx.fillRect(-180,-180,360,360);
      ctx.restore();
    }
    ctx.restore();
    // 在展开纸上镂空所有扇区的裁剪
    ctx.save();
    ctx.translate(FOLD_CX, FOLD_CY);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 7; ctx.lineCap='round'; ctx.lineJoin='round';
    for(let s=0; s<Math.ceil(shownSectors); s++){
      const frac = Math.min(1, shownSectors - s);
      if(frac < 0.3) continue;
      ctx.save();
      ctx.rotate(-Math.PI/2 - wa/2 + s*wa - (-Math.PI/2 - wa/2));
      // 旋转到第s扇区：相对原始楔形的旋转
      for(const cut of FOLD.cuts){
        if(cut.pts.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(cut.pts[0].x - FOLD_CX, cut.pts[0].y - FOLD_CY);
        for(let i=1;i<cut.pts.length;i++) ctx.lineTo(cut.pts[i].x - FOLD_CX, cut.pts[i].y - FOLD_CY);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
    // 展开金光
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(FOLD_CX,FOLD_CY,0,FOLD_CX,FOLD_CY,175);
    glow.addColorStop(0,`rgba(240,214,138,${0.3*(1-ease)})`);
    glow.addColorStop(1,'rgba(240,214,138,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(FOLD_CX,FOLD_CY,175,0,Math.PI*2); ctx.fill();
    ctx.restore();
    if(p >= 1){
      FOLD.phase = 'reveal'; FOLD.revealT = 0; foldUpdateCtrl();
      // 鎏金礼花
      for(let i=0;i<100;i++){
        const a=Math.random()*Math.PI*2, sp=2+Math.random()*6;
        FOLD.particles.push({x:FOLD_CX,y:FOLD_CY,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2,
          life:1.2,sz:2+Math.random()*3,c:Math.random()<0.6?'#F0D68A':(Math.random()<0.5?'#D4A843':'#E8455F')});
      }
      if(typeof goldBoom === 'function') goldBoom('窗花已成 · 一折一剪千华尽显');
    }
  } else if(FOLD.phase === 'reveal'){
    // 完整展开窗花
    ctx.save();
    ctx.translate(FOLD_CX, FOLD_CY);
    for(let s=0; s<sym; s++){
      ctx.save();
      ctx.rotate(-Math.PI/2 - wa/2 + s*wa);
      ctx.beginPath();
      ctx.moveTo(0,0); ctx.arc(0,0,175,0,wa); ctx.closePath(); ctx.clip();
      const g = ctx.createRadialGradient(0,0,10,0,0,175);
      g.addColorStop(0,'#E8455F'); g.addColorStop(0.7,'#C41E3A'); g.addColorStop(1,'#8B1428');
      ctx.fillStyle = g; ctx.fillRect(-180,-180,360,360);
      ctx.restore();
    }
    ctx.restore();
    // 镂空
    ctx.save();
    ctx.translate(FOLD_CX, FOLD_CY);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 7; ctx.lineCap='round'; ctx.lineJoin='round';
    for(let s=0; s<sym; s++){
      ctx.save();
      const baseAng = -Math.PI/2 - wa/2;
      ctx.rotate(baseAng + s*wa - baseAng);
      for(const cut of FOLD.cuts){
        if(cut.pts.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(cut.pts[0].x - FOLD_CX, cut.pts[0].y - FOLD_CY);
        for(let i=1;i<cut.pts.length;i++) ctx.lineTo(cut.pts[i].x - FOLD_CX, cut.pts[i].y - FOLD_CY);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
    // 金边光环
    FOLD.revealT += 0.016;
    const pulse = 0.5 + 0.5*Math.sin(FOLD.revealT*2);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(240,214,138,${0.3+0.2*pulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(FOLD_CX,FOLD_CY,177,0,Math.PI*2); ctx.stroke();
    ctx.restore();
  }
  // 粒子层
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for(let i=FOLD.particles.length-1;i>=0;i--){
    const p = FOLD.particles[i];
    p.x += p.vx; p.y += p.vy; p.vx *= 0.96; p.vy = p.vy*0.96 + 0.08;
    p.life -= 0.018;
    if(p.life <= 0){ FOLD.particles.splice(i,1); continue; }
    ctx.globalAlpha = Math.min(1, p.life);
    ctx.fillStyle = p.c;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.sz,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  FOLD.raf = requestAnimationFrame(foldLoop);
}

/* ===== 2. 纹样拼图 → 纹样演化时间轴 =====
 * 立意：非遗纹样不是凝固的化石，而是千年活态演化的文化基因。
 *       复原碎片后滑动时间轴，见证纹样从上古图腾→清代满化→近代融合→当代国潮的演变。
 */
const GENE = {
  open:false, canvas:null, ctx:null, raf:0,
  pat:0, pieces:[], drag:null, off:{x:0,y:0}, parts:[], done:false,
  era:0, eraT:0, eraTarget:0, T:0, showTimeline:false, bound:false,
};
const GENE_SLOTS = [[52,74],[260,46],[468,76],[40,260],[480,262],[56,460],[260,482],[464,458],[152,152]];
const GENE_ERAS = [
  {name:'上古图腾', year:'前2000-前221', desc:'原始纹样源于自然崇拜，鱼鸟日月为母题，线条粗犷神秘',
   palette:['#8B6F3F','#C9A961','#5C3A1E'], motif:'原始鱼纹 · 朴拙阴刻'},
  {name:'清代满化', year:'1644-1912', desc:'满族入关，渔猎纹样融合宫廷审美，对称团花成为窗花母题',
   palette:['#C41E3A','#8B1428','#D4A843'], motif:'满族团花 · 对称折剪'},
  {name:'近代融合', year:'1912-1949', desc:'民俗与洋风交汇，纹样加入西式卷草，色彩趋柔和',
   palette:['#7B4A8F','#C77DBA','#E8C4A0'], motif:'中西合璧 · 卷草团花'},
  {name:'当代国潮', year:'1949-今', desc:'非遗复兴，纹样数字化再生，金线几何重构传统母题',
   palette:['#D4A843','#F0D68A','#1A1A2E'], motif:'数字国潮 · 金线重构'},
];
function openAsm(){
  const ov = document.getElementById('asm-overlay');
  if(!ov) return;
  ov.classList.add('show');
  GENE.open = true;
  GENE.canvas = document.getElementById('asm-canvas');
  GENE.ctx = GENE.canvas.getContext('2d');
  // 动态更新标题
  const title = ov.querySelector('.puzzle-title');
  const sub = ov.querySelector('.puzzle-sub');
  if(title) title.textContent = '纹样基因演化';
  if(sub) sub.textContent = '3×3碎片复原 · 解锁千年演化时间轴 · 从上古图腾到当代国潮';
  if(!GENE.bound){ geneBindInput(); GENE.bound = true; }
  geneInit(STATE.flow && STATE.flow.sel >= 0 ? STATE.flow.sel : 0);
  cancelAnimationFrame(GENE.raf);
  geneLoop();
  showGuide('asm','复原纹样碎片 → 解锁后滑动时间轴 · 见证纹样千年活态演化');
}
function closeAsm(){
  const ov = document.getElementById('asm-overlay');
  if(ov) ov.classList.remove('show');
  GENE.open = false; GENE.drag = null;
  cancelAnimationFrame(GENE.raf);
  const tl = document.getElementById('gene-timeline');
  if(tl) tl.remove();
}
function geneInit(pat){
  GENE.pat = ((pat%4)+4)%4;
  GENE.done = false; GENE.pieces = []; GENE.parts = []; GENE.drag = null;
  GENE.era = 0; GENE.eraT = 0; GENE.eraTarget = 0; GENE.showTimeline = false;
  ['asm-m0','asm-m1','asm-m2','asm-m3'].forEach((id,i)=>{
    const el = document.getElementById(id);
    if(el) el.classList.toggle('tool-btn-active', i === GENE.pat);
  });
  const src = document.createElement('canvas');
  src.width = src.height = 390;
  const sx = src.getContext('2d');
  const g = sx.createLinearGradient(0,0,390,390);
  g.addColorStop(0,'#C41E3A'); g.addColorStop(1,'#8B1428');
  sx.fillStyle = g; sx.fillRect(0,0,390,390);
  try{ if(typeof MOTIFS!=='undefined') MOTIFS[GENE.pat].draw(sx,195,195,126,'#FFF3E0','rgba(255,243,224,.75)'); }catch(e){}
  sx.strokeStyle = 'rgba(212,168,67,.85)'; sx.lineWidth = 6; sx.strokeRect(3,3,384,384);
  GENE.src = src;
  const slots = GENE_SLOTS.slice();
  for(let i=slots.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; const tp=slots[i]; slots[i]=slots[j]; slots[j]=tp; }
  let n=0;
  for(let r=0;r<3;r++) for(let c=0;c<3;c++){
    const slot = slots[n];
    GENE.pieces.push({sx:c*130,sy:r*130,tx:65+c*130,ty:65+r*130,x:slot[0],y:slot[1],ph:Math.random()*6,placed:false});
    n++;
  }
  geneUpdateCount();
  const tip = document.getElementById('asm-tip');
  if(tip) tip.textContent = `「${FLOW_NAMES[GENE.pat]}」碎片碎裂 · 拖拽复原后解锁千年演变时间轴`;
  const tl = document.getElementById('gene-timeline');
  if(tl) tl.remove();
}
function geneUpdateCount(){
  const n = GENE.pieces.filter(p=>p.placed).length;
  const el = document.getElementById('asm-count');
  if(el) el.textContent = `已复原 ${n}/9`;
}
function geneBindInput(){
  const c = GENE.canvas;
  const pos = e=>{
    const r = c.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return {x:(t.clientX-r.left)*(c.width/r.width), y:(t.clientY-r.top)*(c.height/r.height)};
  };
  function pick(pt){
    for(let i=GENE.pieces.length-1;i>=0;i--){
      const p = GENE.pieces[i];
      if(!p.placed && Math.abs(pt.x-p.x)<66 && Math.abs(pt.y-p.y)<66) return p;
    }
    return null;
  }
  function down(e){
    if(GENE.done) return;
    const pt = pos(e);
    const p = pick(pt);
    if(p){ GENE.drag=p; GENE.off={x:pt.x-p.x,y:pt.y-p.y}; c.classList.add('dragging'); e.preventDefault(); }
  }
  function move(e){ if(!GENE.drag) return; const pt=pos(e); GENE.drag.x=pt.x-GENE.off.x; GENE.drag.y=pt.y-GENE.off.y; e.preventDefault(); }
  function up(){
    const p = GENE.drag; if(!p) return;
    GENE.canvas.classList.remove('dragging');
    if(Math.hypot(p.x-p.tx,p.y-p.ty)<36){
      p.x=p.tx; p.y=p.ty; p.placed=true;
      for(let i=0;i<18;i++){ const a=Math.random()*Math.PI*2,sp=1+Math.random()*3;
        GENE.parts.push({x:p.tx,y:p.ty,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,size:1.5+Math.random()*2.4,c:Math.random()<0.6?'#F0D68A':'#E8455F'}); }
      geneUpdateCount();
      if(GENE.pieces.every(q=>q.placed) && !GENE.done) geneSuccess();
    }
    GENE.drag = null;
  }
  c.addEventListener('mousedown',down);
  window.addEventListener('mousemove',move);
  window.addEventListener('mouseup',up);
  c.addEventListener('touchstart',down,{passive:false});
  c.addEventListener('touchmove',move,{passive:false});
  c.addEventListener('touchend',up);
}
function geneSuccess(){
  GENE.done = true; GENE.showTimeline = true;
  if(typeof goldBoom === 'function') goldBoom(`「${FLOW_NAMES[GENE.pat]}」纹样复原 · 千年演变时间轴已解锁`);
  for(let i=0;i<80;i++){ const a=Math.random()*Math.PI*2,sp=1.5+Math.random()*4.5;
    GENE.parts.push({x:260,y:260,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1.5,life:1,size:1.5+Math.random()*2.6,c:Math.random()<0.6?'#F0D68A':'#E8455F'}); }
  STATE.flow.born[GENE.pat] = true; STATE.flow.sel = GENE.pat;
  if(typeof updateBottomBarState === 'function') updateBottomBarState();
  if(typeof unlockCode === 'function') unlockCode('pingtu');
  const tip = document.getElementById('asm-tip');
  if(tip) tip.textContent = '✔ 复原完成 · 下方时间轴滑动可见纹样千年演变';
  geneInjectTimeline();
}
function geneInjectTimeline(){
  let tl = document.getElementById('gene-timeline');
  if(tl) tl.remove();
  tl = document.createElement('div');
  tl.id = 'gene-timeline';
  tl.className = 'gene-timeline';
  tl.innerHTML = `
    <div class="gene-eras">${GENE_ERAS.map((e,i)=>
      `<button class="gene-era-btn ${i===0?'on':''}" id="gene-era-${i}" onclick="geneSetEra(${i})">${e.name}</button>`
    ).join('')}</div>
    <input type="range" id="gene-slider" min="0" max="3" step="0.01" value="0" class="gene-slider" oninput="geneSlideEra(this.value)"/>
    <div class="gene-era-info" id="gene-era-info"></div>
  `;
  const box = document.querySelector('#asm-overlay .puzzle-box');
  if(box) box.insertBefore(tl, document.getElementById('asm-tip').parentElement);
  geneUpdateEraInfo();
}
function geneSetEra(i){ GENE.eraTarget = i; const s = document.getElementById('gene-slider'); if(s) s.value = i; document.querySelectorAll('.gene-era-btn').forEach((b,bi)=>b.classList.toggle('on',bi===i)); }
function geneSlideEra(v){ const i = Math.round(parseFloat(v)); document.querySelectorAll('.gene-era-btn').forEach((b,bi)=>b.classList.toggle('on',bi===i)); GENE.eraTarget = parseFloat(v); geneUpdateEraInfo(); }
function geneUpdateEraInfo(){
  const idx = Math.round(GENE.eraTarget);
  const e = GENE_ERAS[idx];
  const info = document.getElementById('gene-era-info');
  if(info && e) info.innerHTML = `<b>${e.name}</b> <span class="gene-year">${e.year}</span> · ${e.desc}`;
}
function geneDrawMotifEra(ctx, cx, cy, r, eraIdx){
  const e = GENE_ERAS[Math.max(0,Math.min(GENE_ERAS.length-1,eraIdx))];
  const c1 = e.palette[1], c2 = e.palette[0];
  ctx.save();
  if(eraIdx === 0){
    // 上古：粗犷阴刻鱼纹
    ctx.strokeStyle = c1; ctx.lineWidth = 4; ctx.lineCap='round';
    ctx.beginPath(); ctx.ellipse(cx,cy,r*0.6,r*0.3,0,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+r*0.55,cy); ctx.lineTo(cx+r*0.9,cy-r*0.25); ctx.lineTo(cx+r*0.9,cy+r*0.25); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(cx-r*0.3,cy-r*0.12,r*0.06,0,Math.PI*2); ctx.fill();
    for(let i=0;i<5;i++){ ctx.beginPath(); ctx.moveTo(cx-r*0.1+i*r*0.1,cy+r*0.3); ctx.lineTo(cx-r*0.1+i*r*0.1,cy+r*0.45); ctx.stroke(); }
  } else if(eraIdx === 1){
    // 清代满族团花
    try{ if(typeof MOTIFS!=='undefined') MOTIFS[GENE.pat].draw(ctx,cx,cy,r,c1,c2); }catch(e){}
  } else if(eraIdx === 2){
    // 近代中西合璧卷草
    ctx.strokeStyle = c1; ctx.lineWidth = 3;
    for(let i=0;i<4;i++){ const a=i*Math.PI/2;
      ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*r*0.2,cy+Math.sin(a)*r*0.2);
      ctx.bezierCurveTo(cx+Math.cos(a)*r*0.5,cy+Math.sin(a)*r*0.5-r*0.15, cx+Math.cos(a)*r*0.8,cy+Math.sin(a)*r*0.8+r*0.15, cx+Math.cos(a)*r*0.9,cy+Math.sin(a)*r*0.9);
      ctx.stroke();
    }
    ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(cx,cy,r*0.15,0,Math.PI*2); ctx.fill();
  } else {
    // 当代国潮金线
    ctx.strokeStyle = c1; ctx.lineWidth = 2;
    for(let i=0;i<6;i++){ const a=i*Math.PI/3;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx+Math.cos(a)*r*0.6,cy+Math.sin(a)*r*0.6,r*0.12,0,Math.PI*2); ctx.stroke();
    }
    ctx.strokeStyle = c2; ctx.beginPath(); ctx.arc(cx,cy,r*0.4,0,Math.PI*2); ctx.stroke();
  }
  ctx.restore();
}
function geneLoop(){
  if(!GENE.open) return;
  const ctx = GENE.ctx, T = (GENE.T += 0.016);
  const W = GENE.canvas.width, H = GENE.canvas.height;
  // 平滑era
  GENE.era += (GENE.eraTarget - GENE.era) * 0.12;
  geneUpdateEraInfo();
  const bg = ctx.createLinearGradient(0,0,W,H);
  bg.addColorStop(0,'#141020'); bg.addColorStop(1,'#0f0c1a');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
  if(GENE.showTimeline){
    // 演化展示：大纹样 + 年代
    const e1 = Math.floor(GENE.era), e2 = Math.min(GENE_ERAS.length-1, e1+1);
    const frac = GENE.era - e1;
    const eraIdx = GENE.era;
    // 背景大纹样
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.translate(260, 230);
    geneDrawMotifEra(ctx, 0, 0, 120, Math.round(eraIdx));
    ctx.restore();
    // 年代标签
    const e = GENE_ERAS[Math.round(eraIdx)];
    ctx.fillStyle = '#F0D68A'; ctx.font = 'bold 22px "Noto Serif SC",serif'; ctx.textAlign='center';
    ctx.fillText(e.name, 260, 50);
    ctx.fillStyle = 'rgba(245,230,200,0.7)'; ctx.font = '12px "Noto Sans SC"';
    ctx.fillText(e.year + ' · ' + e.motif, 260, 72);
    // 演化箭头（从左到右流动粒子）
    for(let i=0;i<GENE_ERAS.length;i++){
      const x = 60 + i*133;
      ctx.fillStyle = i===Math.round(eraIdx) ? '#F0D68A' : 'rgba(212,168,67,0.3)';
      ctx.beginPath(); ctx.arc(x, 410, i===Math.round(eraIdx)?6:4, 0, Math.PI*2); ctx.fill();
      if(i<GENE_ERAS.length-1){
        const flow = (T*0.5 + i*0.25) % 1;
        ctx.fillStyle = `rgba(240,214,138,${0.4*(1-flow)})`;
        ctx.beginPath(); ctx.arc(x+flow*133, 410, 2, 0, Math.PI*2); ctx.fill();
      }
    }
  } else {
    // 复原阶段
    if(GENE.src){
      ctx.save(); ctx.globalAlpha = 0.14; ctx.drawImage(GENE.src, 65, 65); ctx.restore();
      ctx.strokeStyle = 'rgba(212,168,67,.4)'; ctx.lineWidth = 1.5; ctx.setLineDash([7,6]);
      for(let i=0;i<=3;i++){ ctx.beginPath(); ctx.moveTo(65+i*130,65); ctx.lineTo(65+i*130,455); ctx.stroke(); ctx.beginPath(); ctx.moveTo(65,65+i*130); ctx.lineTo(455,65+i*130); ctx.stroke(); }
      ctx.setLineDash([]);
    }
    const drawPiece = (p, dragging)=>{
      ctx.save();
      const bob = p.placed ? 0 : Math.sin(T*2+p.ph)*6;
      ctx.translate(p.x, p.y+bob); ctx.rotate(p.placed?0:Math.sin(T*1.4+p.ph)*0.035);
      if(dragging) ctx.scale(1.1,1.1);
      ctx.shadowColor='rgba(0,0,0,.65)'; ctx.shadowBlur=dragging?24:12; ctx.shadowOffsetY=dragging?10:5;
      ctx.drawImage(GENE.src, p.sx, p.sy, 130, 130, -65, -65, 130, 130);
      ctx.restore();
    };
    GENE.pieces.forEach(p=>{ if(!p.placed && p!==GENE.drag) drawPiece(p,false); });
    if(GENE.drag) drawPiece(GENE.drag, true);
    GENE.pieces.forEach(p=>{ if(p.placed) drawPiece(p,false); });
  }
  // 粒子
  GENE.parts.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=0.05; p.life-=0.024; });
  GENE.parts = GENE.parts.filter(p=>p.life>0);
  GENE.parts.forEach(p=>{ ctx.globalAlpha=Math.max(0,p.life); ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill(); });
  ctx.globalAlpha = 1;
  GENE.raf = requestAnimationFrame(geneLoop);
}

/* ===== 3. 绣样拼贴 → 针法模拟 =====
 * 立意：刺绣非遗的核心是"针法"。平绣、锁绣、盘金、打籽各有千年传承。
 *       让用户选针法真实走针缝出纹样，方知"一针一线皆匠心"。
 */
const NDL = {
  open:false, canvas:null, ctx:null, raf:0,
  method:0, pat:0, stitches:[], currentStitch:null, progress:0,
  particles:[], T:0, hover:null, bound:false, done:false, revealT:0,
};
const NDL_W = 520, NDL_H = 360, NDL_CX = 260, NDL_CY = 180;
const NDL_METHODS = [
  {name:'平绣', desc:'基础针法 · 长短针平铺 · 满绣底色', color:'#E8455F', dash:[]},
  {name:'锁绣', desc:'环环相扣 · 古老锁边针 · 勾勒轮廓', color:'#7EC8A9', dash:[4,3]},
  {name:'盘金', desc:'金线盘绕 · 满族贵族绣 · 富丽堂皇', color:'#F0D68A', dash:[]},
  {name:'打籽', desc:'结粒打籽 · 立体点绣 · 花蕊点缀', color:'#C77DBA', dash:[]},
];
function openStitch(){
  const ov = document.getElementById('stitch-overlay');
  if(!ov) return;
  ov.classList.add('show');
  NDL.open = true;
  NDL.canvas = document.getElementById('stitch-canvas');
  NDL.ctx = NDL.canvas.getContext('2d');
  // 动态更新标题
  const title = ov.querySelector('.puzzle-title');
  const sub = ov.querySelector('.puzzle-sub');
  if(title) title.textContent = '满绣针法模拟';
  if(sub) sub.textContent = '选平绣/锁绣/盘金/打籽 · 沿纹样轮廓走针 · 一针一线皆匠心';
  NDL.method = 0; NDL.pat = 0;
  NDL.stitches = []; NDL.currentStitch = null; NDL.progress = 0;
  NDL.particles = []; NDL.done = false; NDL.revealT = 0;
  ndlInjectUI();
  if(!NDL.bound){ ndlBindInput(); NDL.bound = true; }
  cancelAnimationFrame(NDL.raf);
  ndlLoop();
  showGuide('stitch','选针法 → 选纹样 → 沿纹样轮廓拖动走针 · 真实模拟刺绣工艺');
}
function closeStitch(){
  const ov = document.getElementById('stitch-overlay');
  if(ov) ov.classList.remove('show');
  NDL.open = false; NDL.currentStitch = null;
  cancelAnimationFrame(NDL.raf);
  const ui = document.getElementById('ndl-ui');
  if(ui) ui.remove();
}
function ndlInjectUI(){
  let ui = document.getElementById('ndl-ui');
  if(ui) ui.remove();
  ui = document.createElement('div');
  ui.id = 'ndl-ui'; ui.className = 'ndl-ui';
  ui.innerHTML = `
    <div class="ndl-methods" id="ndl-methods"></div>
    <div class="ndl-motifs" id="ndl-motifs"></div>
    <div class="ndl-tip" id="ndl-tip">选择针法与纹样 · 沿纹样轮廓走针刺绣</div>
  `;
  const box = document.querySelector('#stitch-overlay .puzzle-box');
  const oldPalette = document.getElementById('stitch-palette');
  if(oldPalette) oldPalette.style.display = 'none';
  const oldTools = box ? box.querySelector('.stitch-tools') : null;
  if(oldTools) oldTools.style.display = 'none';
  if(box){
    const canvas = NDL.canvas;
    box.insertBefore(ui, canvas);
  }
  ndlUpdateMethods();
}
function ndlUpdateMethods(){
  const mc = document.getElementById('ndl-methods');
  if(mc) mc.innerHTML = NDL_METHODS.map((m,i)=>
    `<button class="tool-btn ${i===NDL.method?'tool-btn-active':''}" onclick="ndlSelectMethod(${i})">${m.name}</button>`).join('');
  const mt = document.getElementById('ndl-motifs');
  if(mt && typeof MOTIFS!=='undefined'){
    mt.innerHTML = MOTIFS.map((m,i)=>
      `<button class="tool-btn ${i===NDL.pat?'tool-btn-active':''}" onclick="ndlSelectPat(${i})">${m.n}</button>`).join('');
  }
  const tip = document.getElementById('ndl-tip');
  if(tip){
    const m = NDL_METHODS[NDL.method];
    if(NDL.done) tip.textContent = `✔ ${m.name}刺绣完成 · 一针一线皆匠心 · 可保存绣品`;
    else tip.textContent = `${m.name}：${m.desc} · 沿纹样金色轮廓拖动走针`;
  }
}
function ndlSelectMethod(i){ NDL.method = i; ndlUpdateMethods(); }
function ndlSelectPat(i){
  NDL.pat = i; NDL.stitches = []; NDL.progress = 0; NDL.done = false;
  ndlUpdateMethods();
}
function ndlBindInput(){
  const c = NDL.canvas;
  const pos = e=>{
    const r = c.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return {x:(t.clientX-r.left)*(NDL_W/r.width), y:(t.clientY-r.top)*(NDL_H/r.height)};
  };
  function down(e){
    if(NDL.done) return;
    const pt = pos(e);
    NDL.currentStitch = {pts:[pt], method:NDL.method};
    e.preventDefault();
  }
  function move(e){
    const pt = pos(e);
    NDL.hover = pt;
    if(!NDL.currentStitch) return;
    const last = NDL.currentStitch.pts[NDL.currentStitch.pts.length-1];
    if(Math.hypot(pt.x-last.x, pt.y-last.y) > 4){
      NDL.currentStitch.pts.push(pt);
      const col = NDL_METHODS[NDL.method].color;
      for(let i=0;i<2;i++){ const a=Math.random()*Math.PI*2,sp=0.5+Math.random()*1.5;
        NDL.particles.push({x:pt.x,y:pt.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-0.5,life:1,sz:1+Math.random()*1.5,c:col}); }
    }
    e.preventDefault();
  }
  function up(){
    if(NDL.currentStitch && NDL.currentStitch.pts.length > 2){
      NDL.stitches.push(NDL.currentStitch);
      NDL.progress = Math.min(1, NDL.stitches.length / 8);
      if(NDL.stitches.length >= 8 && !NDL.done) ndlSuccess();
      ndlUpdateMethods();
    }
    NDL.currentStitch = null;
  }
  c.addEventListener('mousedown',down);
  window.addEventListener('mousemove',move);
  window.addEventListener('mouseup',up);
  c.addEventListener('touchstart',down,{passive:false});
  c.addEventListener('touchmove',move,{passive:false});
  c.addEventListener('touchend',up);
}
function ndlSuccess(){
  NDL.done = true; NDL.revealT = 0;
  if(typeof goldBoom === 'function') goldBoom(`${NDL_METHODS[NDL.method].name}刺绣完成 · 针针见匠心`);
  for(let i=0;i<60;i++){ const a=Math.random()*Math.PI*2,sp=1.5+Math.random()*4;
    NDL.particles.push({x:NDL_CX,y:NDL_CY,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1.5,life:1,sz:1.5+Math.random()*2.5,c:Math.random()<0.6?'#F0D68A':'#E8455F'}); }
  ndlUpdateMethods();
}
function ndlDrawCloth(ctx){
  const g = ctx.createLinearGradient(0,0,0,NDL_H);
  g.addColorStop(0,'#1d1630'); g.addColorStop(.5,'#251a38'); g.addColorStop(1,'#1a1228');
  ctx.fillStyle = g; ctx.fillRect(0,0,NDL_W,NDL_H);
  for(let y=6;y<NDL_H;y+=8){ ctx.fillStyle='rgba(240,214,138,.04)'; ctx.fillRect(0,y,NDL_W,1); }
  for(let x=6;x<NDL_W;x+=8){ ctx.fillStyle='rgba(240,214,138,.03)'; ctx.fillRect(x,0,1,NDL_H); }
  const sg = ctx.createLinearGradient(0,NDL_H*0.3,0,NDL_H*0.7);
  sg.addColorStop(0,'rgba(255,255,255,.03)'); sg.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle = sg; ctx.fillRect(0,0,NDL_W,NDL_H);
}
function ndlDrawPatternGuide(ctx, alpha){
  ctx.save();
  ctx.globalAlpha = alpha;
  if(typeof MOTIFS!=='undefined'){
    MOTIFS[NDL.pat].draw(ctx, NDL_CX, NDL_CY, 80, 'rgba(240,214,138,0.4)', 'rgba(240,214,138,0.25)');
  }
  ctx.restore();
}
function ndlDrawStitch(ctx, st){
  const m = NDL_METHODS[st.method];
  ctx.save();
  ctx.strokeStyle = m.color;
  ctx.lineWidth = st.method===2 ? 3.5 : 2.5;  // 盘金粗
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if(m.dash.length) ctx.setLineDash(m.dash);
  if(st.method === 3){
    // 打籽：点阵
    ctx.setLineDash([]);
    ctx.fillStyle = m.color;
    st.pts.forEach((pt,i)=>{ if(i%2===0){ ctx.beginPath(); ctx.arc(pt.x,pt.y,3,0,Math.PI*2); ctx.fill(); } });
  } else if(st.method === 2){
    // 盘金：双线金光
    ctx.beginPath();
    ctx.moveTo(st.pts[0].x, st.pts[0].y);
    for(let i=1;i<st.pts.length;i++) ctx.lineTo(st.pts[i].x, st.pts[i].y);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,240,180,0.5)'; ctx.lineWidth = 1;
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(st.pts[0].x, st.pts[0].y);
    for(let i=1;i<st.pts.length;i++) ctx.lineTo(st.pts[i].x, st.pts[i].y);
    ctx.stroke();
    // 丝光高亮
    ctx.strokeStyle = `rgba(255,255,255,0.25)`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}
function ndlLoop(){
  if(!NDL.open) return;
  const ctx = NDL.ctx, T = (NDL.T += 0.016);
  ndlDrawCloth(ctx);
  // 纹样引导轮廓
  ndlDrawPatternGuide(ctx, NDL.done ? 0.15 : 0.35);
  // 已绣针脚
  NDL.stitches.forEach(st=> ndlDrawStitch(ctx, st));
  // 当前走针
  if(NDL.currentStitch && NDL.currentStitch.pts.length > 1) ndlDrawStitch(ctx, NDL.currentStitch);
  // 进度
  ctx.fillStyle = 'rgba(240,214,138,0.6)'; ctx.font = 'bold 12px "Noto Sans SC"';
  ctx.textAlign = 'left';
  const barW = 120, bx = NDL_W - barW - 14, by = NDL_H - 18;
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(bx, by, barW, 5);
  ctx.fillStyle = NDL_METHODS[NDL.method].color;
  ctx.fillRect(bx, by, barW * NDL.progress, 5);
  // 粒子
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for(let i=NDL.particles.length-1;i>=0;i--){
    const p = NDL.particles[i];
    p.x+=p.vx; p.y+=p.vy; p.vx*=0.95; p.vy=p.vy*0.95+0.05; p.life-=0.03;
    if(p.life<=0){ NDL.particles.splice(i,1); continue; }
    ctx.globalAlpha = p.life; ctx.fillStyle = p.c;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.sz,0,Math.PI*2); ctx.fill();
  }
  ctx.restore(); ctx.globalAlpha = 1;
  // 完成光晕
  if(NDL.done){
    NDL.revealT += 0.016;
    const pulse = 0.5 + 0.5*Math.sin(NDL.revealT*2);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(NDL_CX,NDL_CY,0,NDL_CX,NDL_CY,140);
    glow.addColorStop(0,`rgba(240,214,138,${0.2+0.1*pulse})`); glow.addColorStop(1,'rgba(240,214,138,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(NDL_CX,NDL_CY,140,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
  NDL.raf = requestAnimationFrame(ndlLoop);
}
function makeStitchCard(){
  if(!NDL.done){ showToast('请先完成刺绣'); return; }
  if(typeof makeManipCard === 'function'){
    // reuse download approach
  }
  const cv = document.createElement('canvas');
  cv.width = 520; cv.height = 360;
  const cx = cv.getContext('2d');
  ndlDrawCloth(cx);
  NDL.stitches.forEach(st=> ndlDrawStitch(cx, st));
  cx.fillStyle = '#F0D68A'; cx.font = 'bold 16px "Noto Serif SC",serif'; cx.textAlign='center';
  cx.fillText(`${NDL_METHODS[NDL.method].name}·${MOTIFS[NDL.pat].n}绣品`, NDL_CX, NDL_H-20);
  const a = document.createElement('a');
  a.download = `满绣-${NDL_METHODS[NDL.method].name}-${MOTIFS[NDL.pat].n}.png`;
  a.href = cv.toDataURL(); a.click();
  showToast('绣品已保存为数字文创卡片');
}

/* ===== 4. 皮影操纵 → 光影叙事 =====
 * 立意：皮影非遗的精髓是"光影为本"。光动则影变，影变则戏生。
 *       让用户操控光源角度编排默剧动作，体会"光影叙事"的非遗美学。
 */
const LIT = {
  open:false, canvas:null, ctx:null, raf:0,
  lightAngle:-0.3, actions:[], playing:false, playT:0, playIdx:0,
  puppetX:320, puppetY:240, armT:0, bodyT:0, stepT:0,
  T:0, bound:false, done:false,
};
const LIT_W = 640, LIT_H = 420;
const LIT_ACTIONS = [
  {key:'raise', name:'抬手', icon:'✋'},
  {key:'turn', name:'转身', icon:'🔄'},
  {key:'walk', name:'走步', icon:'🚶'},
  {key:'bow', name:'作揖', icon:'🙇'},
];
function openManip(){
  const ov = document.getElementById('manip-overlay');
  if(!ov) return;
  ov.classList.add('show');
  LIT.open = true;
  LIT.canvas = document.getElementById('manip-canvas');
  LIT.ctx = LIT.canvas.getContext('2d');
  // 动态更新标题
  const title = ov.querySelector('.puzzle-title');
  const sub = ov.querySelector('.puzzle-sub');
  if(title) title.textContent = '皮影光影叙事';
  if(sub) sub.textContent = '拖光源角度控制影子虚实 · 编排默剧动作序列 · 一光一影皆是戏';
  LIT.actions = []; LIT.playing = false; LIT.playIdx = 0; LIT.playT = 0;
  LIT.armT = 0; LIT.bodyT = 0; LIT.stepT = 0; LIT.lightAngle = -0.3; LIT.done = false;
  litInjectUI();
  if(!LIT.bound){ litBindInput(); LIT.bound = true; }
  cancelAnimationFrame(LIT.raf);
  litLoop();
  showGuide('manip','拖动光源角度滑块 · 点选动作编排默剧 · 开演看光影叙事');
}
function closeManip(){
  const ov = document.getElementById('manip-overlay');
  if(ov) ov.classList.remove('show');
  LIT.open = false;
  cancelAnimationFrame(LIT.raf);
  const ui = document.getElementById('lit-ui');
  if(ui) ui.remove();
}
function litInjectUI(){
  let ui = document.getElementById('lit-ui');
  if(ui) ui.remove();
  ui = document.createElement('div');
  ui.id = 'lit-ui'; ui.className = 'lit-ui';
  ui.innerHTML = `
    <div class="lit-actions" id="lit-actions"></div>
    <div class="lit-seq" id="lit-seq"><span class="lit-seq-label">动作序列：</span><span class="lit-seq-list" id="lit-seq-list">空</span></div>
    <div class="lit-light-ctrl">
      <span class="lit-light-label">光源角度</span>
      <input type="range" id="lit-slider" min="-1.2" max="1.2" step="0.02" value="-0.3" class="lit-slider" oninput="LIT.lightAngle=parseFloat(this.value)"/>
    </div>
    <div class="lit-tip" id="lit-tip">点选动作加入序列 → 开演</div>
  `;
  const box = document.querySelector('#manip-overlay .puzzle-box');
  const oldTasks = document.querySelector('#manip-overlay .manip-tasks');
  if(oldTasks) oldTasks.style.display = 'none';
  const oldFoot = box ? box.querySelector('.puzzle-foot') : null;
  if(oldFoot){ oldFoot.querySelectorAll('button').forEach(b=>{ if(b.onclick && b.getAttribute('onclick') && b.getAttribute('onclick').indexOf('resetManip')>=0) b.style.display='none'; }); }
  if(box){
    const canvas = LIT.canvas;
    box.insertBefore(ui, canvas);
  }
  litUpdateUI();
}
function litUpdateUI(){
  const ac = document.getElementById('lit-actions');
  if(ac) ac.innerHTML = LIT_ACTIONS.map((a,i)=>
    `<button class="tool-btn" onclick="litAddAction(${i})">${a.icon} ${a.name}</button>`).join('')
    + `<button class="tool-btn lit-go" onclick="litPlay()">▶ 开演</button>`
    + `<button class="tool-btn" onclick="litClearActions()">清空</button>`;
  const sl = document.getElementById('lit-seq-list');
  if(sl) sl.textContent = LIT.actions.length ? LIT.actions.map(i=>LIT_ACTIONS[i].name).join(' → ') : '空';
  const tip = document.getElementById('lit-tip');
  if(tip) tip.textContent = LIT.playing ? `开演中 · 第${LIT.playIdx+1}/${LIT.actions.length}幕` :
    LIT.actions.length ? `已编排${LIT.actions.length}个动作 · 拖光源角度 · 点开演` : '点选动作加入序列 → 开演';
}
function litAddAction(i){ LIT.actions.push(i); litUpdateUI(); }
function litClearActions(){ LIT.actions = []; LIT.playing = false; litUpdateUI(); }
function litPlay(){
  if(LIT.actions.length === 0){ showToast('请先编排至少一个动作'); return; }
  LIT.playing = true; LIT.playIdx = 0; LIT.playT = 0; litUpdateUI();
}
function litBindInput(){
  // 光源角度通过滑块控制，无需canvas绑定
}
function litDrawPuppet(ctx, cx, cy, armA, bodyRot, stepOff){
  ctx.save();
  ctx.translate(cx + stepOff, cy);
  ctx.rotate(bodyRot * 0.15);
  // 影人身体（镂空牛皮质感）
  const bodyG = ctx.createLinearGradient(0,-60,0,80);
  bodyG.addColorStop(0,'#8B6B3F'); bodyG.addColorStop(1,'#5C3A1E');
  ctx.fillStyle = bodyG;
  ctx.strokeStyle = '#D4A843'; ctx.lineWidth = 2;
  // 头
  ctx.beginPath(); ctx.arc(0,-55,18,0,Math.PI*2); ctx.fill(); ctx.stroke();
  // 身体
  ctx.beginPath();
  ctx.moveTo(-16,-35); ctx.lineTo(-20,50); ctx.lineTo(20,50); ctx.lineTo(16,-35);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // 镂空纹饰
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath(); ctx.arc(0,10,6,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0,30,10,4,0,0,Math.PI*2); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  // 手臂（可动）
  ctx.strokeStyle = '#D4A843'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  // 左臂
  ctx.save(); ctx.rotate(armA);
  ctx.beginPath(); ctx.moveTo(-14,-30); ctx.lineTo(-38,-30+armA*15); ctx.stroke();
  ctx.restore();
  // 右臂
  ctx.save(); ctx.rotate(-armA);
  ctx.beginPath(); ctx.moveTo(14,-30); ctx.lineTo(38,-30-armA*15); ctx.stroke();
  ctx.restore();
  // 腿
  ctx.beginPath(); ctx.moveTo(-8,50); ctx.lineTo(-10+stepOff*0.3,80); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8,50); ctx.lineTo(10-stepOff*0.3,80); ctx.stroke();
  ctx.restore();
}
function litDrawShadow(ctx, cx, cy, lightAngle, armA, bodyRot, stepOff){
  const shadowLen = 1.5 + Math.abs(Math.sin(lightAngle)) * 1.5;
  const shadowSkew = Math.tan(lightAngle * 0.8);
  ctx.save();
  ctx.translate(cx + stepOff + shadowSkew * 30, cy + 95);
  ctx.scale(1, -0.3);
  ctx.translate(0, -95);
  ctx.rotate(bodyRot * 0.15);
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#000';
  // 简化影子轮廓
  ctx.beginPath(); ctx.arc(0,-55,18,0,Math.PI*2); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-16,-35); ctx.lineTo(-20,50); ctx.lineTo(20,50); ctx.lineTo(16,-35); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.rotate(armA);
  ctx.beginPath(); ctx.moveTo(-14,-30); ctx.lineTo(-38,-30+armA*15); ctx.lineWidth=8; ctx.strokeStyle='#000'; ctx.stroke(); ctx.restore();
  ctx.save(); ctx.rotate(-armA);
  ctx.beginPath(); ctx.moveTo(14,-30); ctx.lineTo(38,-30-armA*15); ctx.lineWidth=8; ctx.strokeStyle='#000'; ctx.stroke(); ctx.restore();
  ctx.restore();
  ctx.globalAlpha = 1;
}
function litDrawLight(ctx){
  // 光源（右上角灯笼）
  const lx = LIT_W - 60 + Math.cos(LIT.lightAngle) * 20;
  const ly = 40 + Math.sin(LIT.lightAngle) * 30;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(lx, ly, 5, lx, ly, 80);
  g.addColorStop(0, 'rgba(255,215,138,0.7)'); g.addColorStop(1, 'rgba(255,215,138,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(lx, ly, 80, 0, Math.PI*2); ctx.fill();
  ctx.restore();
  // 光线（从光源到影人）
  ctx.save();
  ctx.strokeStyle = 'rgba(255,215,138,0.15)'; ctx.lineWidth = 1;
  for(let i=0;i<6;i++){
    const a = LIT.lightAngle + (i-2.5)*0.1;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + Math.cos(a+Math.PI)*200, ly + Math.sin(a+Math.PI)*200);
    ctx.stroke();
  }
  ctx.restore();
}
function litUpdatePuppet(dt){
  if(LIT.playing && LIT.actions.length > 0){
    LIT.playT += dt;
    const act = LIT_ACTIONS[LIT.actions[LIT.playIdx]];
    const dur = 1.5;
    const p = Math.min(1, LIT.playT / dur);
    const wave = Math.sin(p * Math.PI);
    if(act.key === 'raise') LIT.armT = wave * 1.2;
    else if(act.key === 'turn') LIT.bodyT = wave;
    else if(act.key === 'walk') LIT.stepT = Math.sin(p * Math.PI * 3) * 20;
    else if(act.key === 'bow') { LIT.bodyT = wave * 1.5; LIT.armT = wave * 0.5; }
    if(p >= 1){
      LIT.armT = 0; LIT.bodyT = 0; LIT.stepT = 0;
      LIT.playIdx++; LIT.playT = 0;
      if(LIT.playIdx >= LIT.actions.length){
        LIT.playing = false;
        if(!LIT.done){ LIT.done = true; litOnDone(); }
        litUpdateUI();
      }
    }
  }
}
function litOnDone(){
  if(typeof goldBoom === 'function') goldBoom('光影叙事完成 · 一光一影皆是戏');
  if(typeof unlockCode === 'function') unlockCode('manip');
  const btn = document.getElementById('manip-card-btn');
  if(btn) btn.style.display = '';
}
function litLoop(){
  if(!LIT.open) return;
  const ctx = LIT.ctx, dt = 0.016;
  LIT.T += dt;
  litUpdatePuppet(dt);
  // 背景：幕布
  const bg = ctx.createLinearGradient(0,0,0,LIT_H);
  bg.addColorStop(0,'#2a1a14'); bg.addColorStop(1,'#1a0e0a');
  ctx.fillStyle = bg; ctx.fillRect(0,0,LIT_W,LIT_H);
  // 幕布纹理
  ctx.fillStyle = 'rgba(245,230,200,0.03)';
  for(let y=0;y<LIT_H;y+=4) ctx.fillRect(0,y,LIT_W,1);
  // 光源
  litDrawLight(ctx);
  // 地面线
  ctx.strokeStyle = 'rgba(212,168,67,0.2)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, 335); ctx.lineTo(LIT_W, 335); ctx.stroke();
  // 影子（先画影子再画影人）
  litDrawShadow(ctx, LIT.puppetX, LIT.puppetY, LIT.lightAngle, LIT.armT, LIT.bodyT, LIT.stepT);
  // 影人
  litDrawPuppet(ctx, LIT.puppetX, LIT.puppetY, LIT.armT, LIT.bodyT, LIT.stepT);
  // 操作杆（金色）
  ctx.save();
  ctx.strokeStyle = 'rgba(240,214,138,0.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([3,3]);
  ctx.beginPath(); ctx.moveTo(LIT.puppetX + LIT.stepT, LIT.puppetY - 73); ctx.lineTo(LIT.puppetX + LIT.stepT - 30, LIT.puppetY - 110); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(LIT.puppetX + LIT.stepT, LIT.puppetY - 30); ctx.lineTo(LIT.puppetX + LIT.stepT + 40, LIT.puppetY - 60); ctx.stroke();
  ctx.restore();
  LIT.raf = requestAnimationFrame(litLoop);
}
function makeManipCard(){
  if(!LIT.done){ showToast('请先完成光影叙事'); return; }
  const cv = document.createElement('canvas');
  cv.width = 640; cv.height = 420;
  const cx = cv.getContext('2d');
  const bg = cx.createLinearGradient(0,0,0,420);
  bg.addColorStop(0,'#2a1a14'); bg.addColorStop(1,'#1a0e0a');
  cx.fillStyle = bg; cx.fillRect(0,0,640,420);
  litDrawLight(cx);
  litDrawShadow(cx, LIT.puppetX, LIT.puppetY, LIT.lightAngle, 0.6, 0, 0);
  litDrawPuppet(cx, LIT.puppetX, LIT.puppetY, 0.6, 0, 0);
  cx.fillStyle = '#F0D68A'; cx.font = 'bold 18px "Noto Serif SC",serif'; cx.textAlign='center';
  cx.fillText('光影叙事 · 岫岩皮影默剧', 320, 400);
  const a = document.createElement('a');
  a.download = '光影叙事-皮影默剧.png'; a.href = cv.toDataURL(); a.click();
  showToast('光影叙事纪念卡已保存');
}

/* ===== 5. 纹样溯源 → 族谱树 =====
 * 立意：非遗纹样的传承不是孤立的，而是跨民族、跨文化的基因流动。
 *       满族纹样源于渔猎图腾，融合汉族农耕纹样、萨满神纹，最终形成满族特色。
 *       拖纹样到族谱节点，揭示跨文化基因流动，可视化的活态传承谱系。
 */
const TREE = {
  open:false, raf:0, idx:0, score:0, placed:[], particles:[], T:0,
  canvas:null, ctx:null, dragItem:null, hover:null, bound:false, done:false,
};
const TREE_ITEMS = [
  {name:'鱼纹', draw:'fish', origin:'shaman', story:'鱼纹源于满族渔猎图腾，"鱼"谐音"余"，是连年有余母题的源头。'},
  {name:'团花', draw:'tuanhua', origin:'manchu', story:'团花是满族对称折剪的核心母题，象征团圆美满，受汉族团花影响融合而成。'},
  {name:'萨满神纹', draw:'shaman', origin:'shaman', story:'萨满神纹通天护佑，鸟鼓之纹源于满族萨满信仰，是独有的精神纹样。'},
  {name:'福字', draw:'fu', origin:'han', story:'福字挂签受汉族春节文化影响，满族入关后融合成为门楣吉祥符号。'},
];
const TREE_NODES = [
  {key:'shaman', name:'满族渔猎图腾', x:120, y:120, color:'#C9A961', items:[]},
  {key:'manchu', name:'满族民俗纹样', x:340, y:80, color:'#C41E3A', items:[]},
  {key:'han', name:'汉族农耕纹样', x:520, y:120, color:'#7B4A8F', items:[]},
  {key:'mixed', name:'满汉融合纹样', x:340, y:240, color:'#D4A843', items:[]},
];
function openQuiz(){
  const ov = document.getElementById('quiz-overlay');
  if(!ov) return;
  ov.classList.add('show');
  TREE.open = true; TREE.idx = 0; TREE.score = 0; TREE.placed = [];
  TREE.particles = []; TREE.done = false;
  // 注入canvas到quiz-stage
  let stage = document.getElementById('quiz-stage');
  if(stage){
    stage.innerHTML = '';
    const cv = document.createElement('canvas');
    cv.id = 'tree-canvas'; cv.width = 620; cv.height = 360;
    cv.style.maxWidth = '100%'; cv.style.height = 'auto';
    stage.appendChild(cv);
    TREE.canvas = cv; TREE.ctx = cv.getContext('2d');
    if(!TREE.bound){ treeBindInput(); TREE.bound = true; }
  }
  // 更新标题
  const title = ov.querySelector('.puzzle-title');
  if(title) title.textContent = '纹样族谱 · 跨文化基因溯源';
  const sub = ov.querySelector('.puzzle-sub');
  if(sub) sub.textContent = '拖动纹样到它所属的文化源头节点 · 揭示满族纹样的跨民族基因流动';
  const head = ov.querySelector('.quiz-head');
  if(head) head.innerHTML = `<span id="quiz-progress">已溯源 ${TREE.placed.length}/${TREE_ITEMS.length}</span><span id="quiz-score">得分 ${TREE.score}</span>`;
  cancelAnimationFrame(TREE.raf);
  treeLoop();
  showGuide('quiz','拖纹样卡片到族谱节点 · 连对揭示跨文化基因流动故事');
}
function closeQuiz(){
  const ov = document.getElementById('quiz-overlay');
  if(ov) ov.classList.remove('show');
  TREE.open = false;
  cancelAnimationFrame(TREE.raf);
}
function treeBindInput(){
  const c = TREE.canvas;
  const pos = e=>{
    const r = c.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return {x:(t.clientX-r.left)*(c.width/r.width), y:(t.clientY-r.top)*(c.height/r.height)};
  };
  function down(e){
    if(TREE.done) return;
    const pt = pos(e);
    // 检测是否点击未放置的纹样
    const itemX = 40 + TREE.idx * 0;
    const itemY = 320;
    // 纹样卡片在底部
    const card = treeItemRect(TREE.idx);
    if(pt.x >= card.x && pt.x <= card.x+card.w && pt.y >= card.y && pt.y <= card.y+card.h){
      TREE.dragItem = {idx: TREE.idx, x: pt.x, y: pt.y, ox: pt.x-card.x-card.w/2, oy: pt.y-card.y-card.h/2};
      e.preventDefault();
    }
  }
  function move(e){
    if(!TREE.dragItem) return;
    const pt = pos(e);
    TREE.dragItem.x = pt.x; TREE.dragItem.y = pt.y;
    e.preventDefault();
  }
  function up(){
    if(!TREE.dragItem) return;
    const pt = {x: TREE.dragItem.x, y: TREE.dragItem.y};
    const item = TREE_ITEMS[TREE.dragItem.idx];
    let hit = null;
    for(const n of TREE_NODES){
      if(Math.hypot(pt.x-n.x, pt.y-n.y) < 55){ hit = n; break; }
    }
    if(hit){
      if(hit.key === item.origin){
        TREE.placed.push(TREE.dragItem.idx);
        TREE.score += 25;
        hit.items.push(TREE.dragItem.idx);
        for(let i=0;i<30;i++){ const a=Math.random()*Math.PI*2,sp=1+Math.random()*3;
          TREE.particles.push({x:hit.x,y:hit.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1,life:1,sz:1.5+Math.random()*2,c:'#F0D68A'}); }
        if(typeof showToast === 'function') showToast('✓ 溯源正确！' + item.story);
        TREE.idx++;
        if(TREE.idx >= TREE_ITEMS.length) treeDone();
      } else {
        if(typeof showToast === 'function') showToast('✗ 源头不符 · 鱼纹属渔猎图腾，团花属满族民俗，福字受汉族影响');
        for(let i=0;i<15;i++){ const a=Math.random()*Math.PI*2,sp=1+Math.random()*2;
          TREE.particles.push({x:pt.x,y:pt.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:0.6,sz:1+Math.random()*1.5,c:'#C41E3A'}); }
      }
    }
    TREE.dragItem = null;
  }
  c.addEventListener('mousedown',down);
  window.addEventListener('mousemove',move);
  window.addEventListener('mouseup',up);
  c.addEventListener('touchstart',down,{passive:false});
  c.addEventListener('touchmove',move,{passive:false});
  c.addEventListener('touchend',up);
}
function treeItemRect(i){ return {x: 30 + i*145, y: 305, w: 120, h: 50}; }
function treeDone(){
  TREE.done = true;
  if(typeof goldBoom === 'function') goldBoom('纹样族谱完成 · 跨文化基因流动已揭示');
  if(typeof unlockCode === 'function') unlockCode('quiz');
}
function treeDrawItem(ctx, i, x, y){
  const item = TREE_ITEMS[i];
  ctx.save();
  ctx.fillStyle = 'rgba(22,22,42,0.8)';
  ctx.strokeStyle = 'rgba(212,168,67,0.5)'; ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, 120, 50, 6); ctx.fill(); ctx.stroke();
  // 纹样小图
  if(typeof MOTIFS !== 'undefined'){
    const mi = {fish:3, tuanhua:0, shaman:2, fu:1}[item.draw];
    try{ MOTIFS[mi].draw(ctx, x+25, y+25, 14, '#F0D68A', '#E8455F'); }catch(e){}
  }
  ctx.fillStyle = '#F0D68A'; ctx.font = 'bold 12px "Noto Serif SC"';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(item.name, x+50, y+25);
  ctx.restore();
}
function treeDrawNode(ctx, n){
  ctx.save();
  // 节点光晕
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(n.x, n.y, 5, n.x, n.y, 50);
  g.addColorStop(0, n.color+'55'); g.addColorStop(1, 'transparent');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.x, n.y, 50, 0, Math.PI*2); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  // 节点圆
  ctx.fillStyle = 'rgba(22,22,42,0.9)';
  ctx.strokeStyle = n.color; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(n.x, n.y, 38, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = n.color; ctx.font = 'bold 11px "Noto Serif SC"'; ctx.textAlign='center';
  ctx.fillText(n.name, n.x, n.y+55);
  // 已放置的纹样
  n.items.forEach((idx, i)=>{
    const a = (i / Math.max(1, n.items.length)) * Math.PI*2;
    treeDrawItem(ctx, idx, n.x + Math.cos(a)*22 - 60, n.y + Math.sin(a)*22 - 25);
  });
  ctx.restore();
}
function treeLoop(){
  if(!TREE.open || !TREE.ctx) return;
  const ctx = TREE.ctx, T = (TREE.T += 0.016);
  const W = TREE.canvas.width, H = TREE.canvas.height;
  ctx.fillStyle = '#0d0d1a'; ctx.fillRect(0,0,W,H);
  // 族谱连接线
  ctx.strokeStyle = 'rgba(212,168,67,0.2)'; ctx.lineWidth = 1.5;
  ctx.setLineDash([4,4]);
  // shaman → mixed, han → mixed, manchu → mixed
  const s = TREE_NODES[0], m = TREE_NODES[1], h = TREE_NODES[2], mx = TREE_NODES[3];
  ctx.beginPath(); ctx.moveTo(s.x,s.y); ctx.lineTo(mx.x,mx.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(m.x,m.y); ctx.lineTo(mx.x,mx.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(h.x,h.y); ctx.lineTo(mx.x,mx.y); ctx.stroke();
  ctx.setLineDash([]);
  // 流动粒子
  for(let i=0;i<3;i++){
    const flow = ((T*0.3 + i*0.33) % 1);
    const from = [s,m,h][i], to = mx;
    const px = from.x + (to.x-from.x)*flow, py = from.y + (to.y-from.y)*flow;
    ctx.fillStyle = 'rgba(240,214,138,0.6)';
    ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI*2); ctx.fill();
  }
  // 节点
  TREE_NODES.forEach(n=> treeDrawNode(ctx, n));
  // 底部纹样卡片
  if(TREE.idx < TREE_ITEMS.length && !TREE.done){
    treeDrawItem(ctx, TREE.idx, treeItemRect(TREE.idx).x, treeItemRect(TREE.idx).y);
    ctx.fillStyle = 'rgba(240,214,138,0.6)'; ctx.font = '11px "Noto Sans SC"'; ctx.textAlign='center';
    ctx.fillText('↑ 拖我到所属源头节点', treeItemRect(TREE.idx).x+60, 370);
  }
  // 拖拽中
  if(TREE.dragItem){
    treeDrawItem(ctx, TREE.dragItem.idx, TREE.dragItem.x-60, TREE.dragItem.y-25);
  }
  // 粒子
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(let i=TREE.particles.length-1;i>=0;i--){
    const p = TREE.particles[i];
    p.x+=p.vx; p.y+=p.vy; p.vy+=0.05; p.life-=0.025;
    if(p.life<=0){ TREE.particles.splice(i,1); continue; }
    ctx.globalAlpha = p.life; ctx.fillStyle = p.c;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.sz,0,Math.PI*2); ctx.fill();
  }
  ctx.restore(); ctx.globalAlpha = 1;
  // 完成
  if(TREE.done){
    ctx.fillStyle = 'rgba(240,214,138,0.9)'; ctx.font = 'bold 16px "Noto Serif SC"'; ctx.textAlign='center';
    ctx.fillText('✔ 族谱完成 · 满族纹样是跨民族基因流动的活态传承', W/2, 350);
  }
  TREE.raf = requestAnimationFrame(treeLoop);
}

/* ===== 6. 皮影小剧场 → 编剧幕次 =====
 * 立意：皮影非遗不只是"操纵"，更是"编剧叙事"。一台好戏需要幕次、台词、走位。
 *       让用户编写多幕剧本、安排走位、生成可回放剧目，体会非遗叙事技艺。
 */
const PLAY = {
  open:false, canvas:null, ctx:null, raf:0,
  scenes:[], curScene:0, playing:false, playT:0, recordFrames:[], recT:0,
  roles:[{name:'武将',x:200,y:200,arm:0},{name:'文生',x:320,y:200,arm:0},{name:'旦角',x:440,y:200,arm:0}],
  T:0, bound:false, done:false, dragRole:null, dragOff:{x:0,y:0},
};
const PLAY_TEMPLATES = [
  {name:'满族过大年', scenes:[
    {title:'第一幕 · 祭灶', lines:['腊月廿三，灶王爷上天', '剪纸贴窗，辞旧迎新']},
    {title:'第二幕 · 拜年', lines:['新春伊始，影人登台', '连年有余，岁岁平安']},
  ]},
  {name:'萨满祈福', scenes:[
    {title:'第一幕 · 请神', lines:['神鼓声起，焚香通天', '影人绕场，恭请神灵']},
    {title:'第二幕 · 纳吉', lines:['风调雨顺，阖家安康', '神纹护佑，福泽绵长']},
  ]},
];
function openDrama(){
  const ov = document.getElementById('drama-overlay');
  if(!ov) return;
  ov.classList.add('show');
  PLAY.open = true;
  PLAY.canvas = document.getElementById('drama-canvas');
  PLAY.ctx = PLAY.canvas.getContext('2d');
  // 动态更新标题
  const title = ov.querySelector('.puzzle-title');
  const sub = ov.querySelector('.puzzle-sub');
  if(title) title.textContent = '皮影编剧幕次';
  if(sub) sub.textContent = '编写多幕剧本 · 拖角色走位 · 开演录制生成可回放剧目';
  PLAY.scenes = JSON.parse(JSON.stringify(PLAY_TEMPLATES[0].scenes));
  PLAY.curScene = 0; PLAY.playing = false; PLAY.playT = 0;
  PLAY.recordFrames = []; PLAY.recT = 0; PLAY.done = false;
  PLAY.roles = [{name:'武将',x:200,y:220,arm:0},{name:'文生',x:320,y:220,arm:0},{name:'旦角',x:440,y:220,arm:0}];
  if(!PLAY.bound){ playBindInput(); PLAY.bound = true; }
  playInjectUI();
  cancelAnimationFrame(PLAY.raf);
  playLoop();
  showGuide('drama','编写幕次台词 → 拖角色走位 → 开演录制 → 生成可回放剧目');
}
function closeDrama(){
  const ov = document.getElementById('drama-overlay');
  if(ov) ov.classList.remove('show');
  PLAY.open = false; PLAY.dragRole = null;
  cancelAnimationFrame(PLAY.raf);
  const ui = document.getElementById('play-ui');
  if(ui) ui.remove();
}
function playInjectUI(){
  let ui = document.getElementById('play-ui');
  if(ui) ui.remove();
  ui = document.createElement('div');
  ui.id = 'play-ui'; ui.className = 'play-ui';
  ui.innerHTML = `
    <div class="play-scenes" id="play-scenes"></div>
    <div class="play-ctrl">
      <button class="tool-btn" onclick="playAddScene()">+ 加幕</button>
      <button class="tool-btn" onclick="playPrevScene()">‹ 上一幕</button>
      <span class="play-scene-label" id="play-scene-label">第一幕</span>
      <button class="tool-btn" onclick="playNextScene()">下一幕 ›</button>
      <button class="tool-btn lit-go" onclick="playShow()">▶ 开演录制</button>
      <button class="tool-btn" onclick="playReplay()">↺ 回放</button>
    </div>
    <div class="play-tip" id="play-tip">编写幕次台词 · 拖角色走位 · 开演录制生成可回放剧目</div>
  `;
  const box = document.querySelector('#drama-overlay .puzzle-box');
  const oldFoot = box ? box.querySelector('.puzzle-foot .stitch-tools') : null;
  if(oldFoot) oldFoot.style.display = 'none';
  if(box){
    box.insertBefore(ui, PLAY.canvas);
  }
  playUpdateUI();
}
function playUpdateUI(){
  const sc = document.getElementById('play-scenes');
  if(sc){
    sc.innerHTML = PLAY.scenes.map((s,i)=>
      `<div class="play-scene-card ${i===PLAY.curScene?'on':''}" onclick="playSelectScene(${i})">
        <b>${s.title}</b><small>${s.lines[0]}</small>
      </div>`).join('');
  }
  const lbl = document.getElementById('play-scene-label');
  if(lbl && PLAY.scenes[PLAY.curScene]) lbl.textContent = PLAY.scenes[PLAY.curScene].title;
  const tip = document.getElementById('play-tip');
  if(tip) tip.textContent = PLAY.playing ? `开演录制中 · ${PLAY.scenes[PLAY.curScene].title}` :
    PLAY.recordFrames.length ? `已录制 ${PLAY.recordFrames.length}帧 · 可回放` : '编写幕次台词 · 拖角色走位 · 开演录制';
}
function playSelectScene(i){ PLAY.curScene = i; playUpdateUI(); }
function playAddScene(){
  PLAY.scenes.push({title:`第${PLAY.scenes.length+1}幕 · 新幕`, lines:['（自定义台词）']});
  PLAY.curScene = PLAY.scenes.length-1; playUpdateUI();
}
function playPrevScene(){ if(PLAY.curScene>0){ PLAY.curScene--; playUpdateUI(); } }
function playNextScene(){ if(PLAY.curScene<PLAY.scenes.length-1){ PLAY.curScene++; playUpdateUI(); } }
function playShow(){
  if(PLAY.scenes.length === 0){ showToast('请先添加幕次'); return; }
  PLAY.playing = true; PLAY.playT = 0; PLAY.curScene = 0;
  PLAY.recordFrames = []; PLAY.recT = 0;
  playUpdateUI();
}
function playReplay(){
  if(PLAY.recordFrames.length === 0){ showToast('请先开演录制'); return; }
  PLAY.playing = true; PLAY.playT = 0; PLAY.recT = 0;
  playUpdateUI();
}
function playBindInput(){
  const c = PLAY.canvas;
  const pos = e=>{
    const r = c.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return {x:(t.clientX-r.left)*(c.width/r.width), y:(t.clientY-r.top)*(c.height/r.height)};
  };
  function down(e){
    if(PLAY.playing) return;
    const pt = pos(e);
    for(let i=PLAY.roles.length-1;i>=0;i--){
      const ro = PLAY.roles[i];
      if(Math.abs(pt.x-ro.x)<30 && Math.abs(pt.y-ro.y)<50){
        PLAY.dragRole = ro; PLAY.dragOff = {x:pt.x-ro.x, y:pt.y-ro.y};
        e.preventDefault(); return;
      }
    }
  }
  function move(e){
    if(!PLAY.dragRole) return;
    const pt = pos(e);
    PLAY.dragRole.x = Math.max(40, Math.min(600, pt.x-PLAY.dragOff.x));
    PLAY.dragRole.y = Math.max(150, Math.min(300, pt.y-PLAY.dragOff.y));
    e.preventDefault();
  }
  function up(){ PLAY.dragRole = null; }
  c.addEventListener('mousedown',down);
  window.addEventListener('mousemove',move);
  window.addEventListener('mouseup',up);
  c.addEventListener('touchstart',down,{passive:false});
  c.addEventListener('touchmove',move,{passive:false});
  c.addEventListener('touchend',up);
}
function playDrawRole(ctx, ro, T){
  ctx.save();
  ctx.translate(ro.x, ro.y);
  const bob = Math.sin(T*2 + ro.x*0.01)*3;
  ctx.translate(0, bob);
  const colors = {0:['#8B1428','#C41E3A'], 1:['#1a3a5c','#3a6a9c'], 2:['#5c2a4a','#8c4a7a']};
  const ci = {武将:0, 文生:1, 旦角:2}[ro.name] || 0;
  const [c1,c2] = colors[ci];
  // 头
  ctx.fillStyle = '#E8C4A0'; ctx.strokeStyle = c2; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0,-35,14,0,Math.PI*2); ctx.fill(); ctx.stroke();
  // 身体
  const g = ctx.createLinearGradient(0,-20,0,40);
  g.addColorStop(0,c1); g.addColorStop(1,c2);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-14,-20); ctx.lineTo(-16,38); ctx.lineTo(16,38); ctx.lineTo(14,-20);
  ctx.closePath(); ctx.fill();
  // 镂空纹饰
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath(); ctx.arc(0,8,5,0,Math.PI*2); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  // 手臂
  ctx.strokeStyle = c2; ctx.lineWidth = 2.5; ctx.lineCap='round';
  ctx.save(); ctx.rotate(ro.arm);
  ctx.beginPath(); ctx.moveTo(-12,-15); ctx.lineTo(-30,-15+ro.arm*10); ctx.stroke();
  ctx.restore();
  ctx.save(); ctx.rotate(-ro.arm);
  ctx.beginPath(); ctx.moveTo(12,-15); ctx.lineTo(30,-15-ro.arm*10); ctx.stroke();
  ctx.restore();
  // 名称
  ctx.fillStyle = '#F0D68A'; ctx.font = '10px "Noto Sans SC"'; ctx.textAlign='center';
  ctx.fillText(ro.name, 0, 55);
  ctx.restore();
}
function playDrawStage(ctx, T){
  const bg = ctx.createLinearGradient(0,0,0,400);
  bg.addColorStop(0,'#1a0e0a'); bg.addColorStop(1,'#0d0608');
  ctx.fillStyle = bg; ctx.fillRect(0,0,640,400);
  // 舞台幕布
  ctx.fillStyle = 'rgba(139,20,40,0.3)';
  ctx.fillRect(0,0,640,30);
  ctx.fillStyle = 'rgba(212,168,67,0.15)';
  for(let x=0;x<640;x+=20){ ctx.fillRect(x,28,10,2); }
  // 地面
  ctx.strokeStyle = 'rgba(212,168,67,0.2)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0,330); ctx.lineTo(640,330); ctx.stroke();
  // 篝火光
  ctx.save(); ctx.globalCompositeOperation='lighter';
  const fx = 80, fy = 200;
  const fg = ctx.createRadialGradient(fx,fy,5,fx,fy,60);
  fg.addColorStop(0,'rgba(255,180,80,0.4)'); fg.addColorStop(1,'transparent');
  ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(fx,fy,60,0,Math.PI*2); ctx.fill();
  ctx.restore();
  // 影窗框
  ctx.strokeStyle = 'rgba(212,168,67,0.4)'; ctx.lineWidth = 2;
  ctx.strokeRect(40, 80, 560, 250);
}
function playLoop(){
  if(!PLAY.open) return;
  const ctx = PLAY.ctx, T = (PLAY.T += 0.016);
  playDrawStage(ctx, T);
  // 字幕
  if(PLAY.scenes[PLAY.curScene]){
    const sc = PLAY.scenes[PLAY.curScene];
    ctx.fillStyle = 'rgba(13,13,26,0.7)';
    ctx.fillRect(40, 340, 560, 50);
    ctx.fillStyle = '#F0D68A'; ctx.font = 'bold 14px "Noto Serif SC"'; ctx.textAlign='center';
    ctx.fillText(sc.title, 320, 358);
    ctx.fillStyle = 'rgba(245,230,200,0.85)'; ctx.font = '12px "Noto Sans SC"';
    const line = sc.lines[0] || '';
    ctx.fillText(line, 320, 378);
  }
  // 角色
  if(PLAY.playing){
    PLAY.playT += 0.016;
    // 动画手臂
    PLAY.roles.forEach((ro,i)=>{
      ro.arm = Math.sin(PLAY.playT*2 + i)*0.4;
    });
    // 录制
    PLAY.recT += 0.016;
    if(PLAY.recT > 0.1){
      PLAY.recT = 0;
      PLAY.recordFrames.push(PLAY.roles.map(r=>({x:r.x,y:r.y,arm:r.arm})));
    }
    // 切幕
    if(PLAY.playT > 3){
      PLAY.curScene++;
      PLAY.playT = 0;
      if(PLAY.curScene >= PLAY.scenes.length){
        PLAY.playing = false;
        PLAY.curScene = PLAY.scenes.length-1;
        if(!PLAY.done){ PLAY.done = true; playOnDone(); }
        playUpdateUI();
      } else { playUpdateUI(); }
    }
  }
  PLAY.roles.forEach(ro=> playDrawRole(ctx, ro, T));
  // 录制指示
  if(PLAY.playing){
    ctx.fillStyle = '#E8455F'; ctx.beginPath(); ctx.arc(620,20,5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#F0D68A'; ctx.font = '10px "Noto Sans SC"'; ctx.textAlign='right';
    ctx.fillText('● 录制中 ' + PLAY.recordFrames.length + '帧', 610, 24);
  }
  PLAY.raf = requestAnimationFrame(playLoop);
}
function playOnDone(){
  if(typeof goldBoom === 'function') goldBoom('剧目录制完成 · 可回放 · 皮影叙事技艺已传承');
  const btn = document.getElementById('drama-poster-btn');
  if(btn) btn.style.display = '';
}
function selectDramaStory(i){
  PLAY.scenes = JSON.parse(JSON.stringify(PLAY_TEMPLATES[i].scenes));
  PLAY.curScene = 0; playUpdateUI();
  document.querySelectorAll('#drama-overlay .carve-head .tool-btn').forEach((b,bi)=>{
    if(b.id) b.classList.toggle('tool-btn-active', b.id === 'drama-s'+i);
  });
}
function resetDramaStage(){
  PLAY.roles = [{name:'武将',x:200,y:220,arm:0},{name:'文生',x:320,y:220,arm:0},{name:'旦角',x:440,y:220,arm:0}];
  PLAY.recordFrames = []; PLAY.done = false; playUpdateUI();
}
function toggleDramaRecord(){
  if(PLAY.recordFrames.length === 0){ showToast('请先点"开演录制"'); return; }
  playReplay();
}
function makeDramaPoster(){
  if(!PLAY.done && PLAY.recordFrames.length === 0){ showToast('请先开演录制剧目'); return; }
  const cv = document.createElement('canvas');
  cv.width = 640; cv.height = 400;
  const cx = cv.getContext('2d');
  playDrawStage(cx, 0);
  PLAY.roles.forEach(ro=> playDrawRole(cx, ro, 0));
  const sc = PLAY.scenes[PLAY.curScene] || PLAY.scenes[0];
  cx.fillStyle = 'rgba(13,13,26,0.7)'; cx.fillRect(40,340,560,50);
  cx.fillStyle = '#F0D68A'; cx.font = 'bold 14px "Noto Serif SC"'; cx.textAlign='center';
  cx.fillText(sc ? sc.title : '皮影剧目', 320, 358);
  cx.fillStyle = 'rgba(245,230,200,0.85)'; cx.font = '12px "Noto Sans SC"';
  cx.fillText(sc ? sc.lines[0] : '', 320, 378);
  const a = document.createElement('a');
  a.download = '皮影剧目-编剧海报.png'; a.href = cv.toDataURL(); a.click();
  showToast('剧目海报已保存');
}

/* ===== 兼容别名：旧按钮调用名映射到新升级函数 ===== */
function playDramaShow(){ playShow(); }
function initAsm(pat){ geneInit(pat); }
function resetManip(){
  LIT.actions = []; LIT.playing = false; LIT.done = false;
  LIT.armT = 0; LIT.bodyT = 0; LIT.stepT = 0; LIT.lightAngle = -0.3;
  const s = document.getElementById('lit-slider'); if(s) s.value = -0.3;
  litUpdateUI();
}
/* ================================================================
 * 七大扩展功能模块
 * F1 非遗工艺闯关剧情线（三关卡+徽章+进度）
 * F2 传承录完整落地（留言墙+非遗保护现状科普）
 * F3 古今对照滑条过渡（传统/现代纹样+实物vs3D重建）
 * F4 跨载体物理模拟（纸弯折/皮影抖动/丝线光泽）
 * ================================================================ */

/* ===== F1 非遗工艺闯关剧情线 ===== */
const STORY = {
  open:false, canvas:null, ctx:null, raf:0, T:0,
  sceneIdx:0, playing:false, done:false,
  actionT:0, currentPath:null, bound:false,
};
const STORY_SCENES = [
  {title:'第一幕 · 剪纸刻制', role:'剪纸匠人',
   narrative:'清末民初，辽地农家女坐在窗台前，红纸铺开，剪刀在手。\n你是她的徒弟，今天要刻出第一枚团花窗花。',
   knowledge:'剪纸工艺：一把剪刀、一张红纸，折剪对称团花。\n满族窗花必贴于除夕，求团圆美满。\n新宾满族剪纸已列为国家级非物质文化遗产。',
   act:'刻出一团花'},
  {title:'第二幕 · 皮影雕镂', role:'皮影艺人',
   narrative:'民国年间，战乱流离。你随皮影班行走辽西，\n驴皮在阳光下曝晒透影，刻刀在皮上划出龙纹。',
   knowledge:'皮影工艺：选驴皮→浸泡→刮净→阴干→刻镂→上色→缀结。\n岫岩皮影唱腔为辽南影调，配板胡锣鼓。\n2014年岫岩皮影列入国家级非遗名录。',
   act:'雕一皮影龙'},
  {title:'第三幕 · 刺绣走线', role:'满族绣娘',
   narrative:'当代辽绣工坊，暖光下绣娘指尖飞针。\n枕头顶上的团花，是满族姑娘出嫁前必绣的信物。',
   knowledge:'满族刺绣工艺：平绣打底、锁绣勾边、盘金点缀、打籽装饰。\n辽阳满族枕顶绣曾作为国礼赠送外宾。\n满族刺绣是中国四大名绣外独具特色的地域绣。',
   act:'绣一团花纹样'},
];

function openStory(){
  const ov = document.getElementById('story-overlay');
  if(!ov) return;
  ov.classList.add('show');
  STORY.open = true; STORY.sceneIdx = 0; STORY.playing = false; STORY.done = false;
  STORY.actionT = 0; STORY.currentPath = null;
  STORY.canvas = document.getElementById('story-canvas');
  STORY.ctx = STORY.canvas.getContext('2d');
  storyInjectUI();
  if(!STORY.bound){ bindStoryInput(); STORY.bound = true; }
  cancelAnimationFrame(STORY.raf);
  storyLoop();
  showGuide('story','化身辽地手艺人，依次完成三道非遗工艺关卡');
}
function closeStory(){
  const ov = document.getElementById('story-overlay');
  if(ov) ov.classList.remove('show');
  STORY.open = false; cancelAnimationFrame(STORY.raf);
}
function storyInjectUI(){
  let ui = document.getElementById('story-ui');
  if(ui) ui.remove();
  ui = document.createElement('div'); ui.id = 'story-ui'; ui.className = 'story-ui';
  const sc = STORY_SCENES[STORY.sceneIdx];
  ui.innerHTML = `
    <div class="story-progress">
      ${STORY_SCENES.map((s,i)=>`<span class="story-step ${i<STORY.sceneIdx?'done':i===STORY.sceneIdx?'on':''}">${i<STORY.sceneIdx?'✓':i+1}</span>`).join('<i class="flow-arrow">➤</i>')}
    </div>
    <div class="story-scene-title">${sc.title} · ${sc.role}</div>
    <div class="story-narrative">${sc.narrative.replace(/\n/g,'<br>')}</div>
    <div class="story-act-hint">🎯 点击下方"执行${sc.act}"按钮开始关卡</div>
  `;
  const box = document.querySelector('#story-overlay .puzzle-box');
  if(box) box.insertBefore(ui, document.getElementById('story-canvas'));
  const foot = document.getElementById('story-footer');
  if(foot){
    foot.innerHTML = `
      <span class="flow-tip" id="story-tip">当前：${sc.title} · ${sc.role}</span>
      <button class="tool-btn" id="story-do" onclick="storyDoLevel()">✦ 执行${sc.act}</button>
      ${STORY.sceneIdx > 0 ? `<button class="tool-btn" onclick="storyPrev()">← 上一幕</button>` : ''}
      <button class="modal-close puzzle-close" onclick="closeStory()">关 闭</button>
    `;
  }
}
function storyPrev(){
  if(STORY.sceneIdx > 0){ STORY.sceneIdx--; STORY.playing = false; storyInjectUI(); }
}
function storyDoLevel(){
  const sc = STORY_SCENES[STORY.sceneIdx];
  if(typeof showModal === 'function'){
    setTimeout(()=>{
      showModal({title:`${sc.role} · 非遗知识`, sub:sc.title,
        body:`<div class="story-knowledge">${sc.knowledge.replace(/\n/g,'<br>')}</div>
        <button class="tool-btn" onclick="closeModal();storyContinueLevel()">▶ 我学会了，继续</button>`});
    }, 100);
  } else { storyContinueLevel(); }
  if(typeof markExplore === 'function'){
    markExplore('story_' + ['carve','puppet','emb'][STORY.sceneIdx]);
  }
}
function storyContinueLevel(){
  STORY.playing = true; STORY.actionT = 0; STORY.currentPath = null;
  const btn = document.getElementById('story-do');
  if(btn){ btn.textContent = '🎬 演练中…'; btn.disabled = true; }
}
function bindStoryInput(){
  const canvas = document.getElementById('story-canvas');
  if(!canvas) return;
  const pos = e=>{
    const r = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return {x:(t.clientX-r.left)*(canvas.width/r.width), y:(t.clientY-r.top)*(canvas.height/r.height)};
  };
  function down(e){ if(!STORY.playing) return; STORY.currentPath = [pos(e)]; e.preventDefault(); }
  function move(e){ if(!STORY.playing || !STORY.currentPath) return; STORY.currentPath.push(pos(e)); e.preventDefault(); }
  function up(){
    if(!STORY.playing) return;
    STORY.actionT += 0.25; STORY.currentPath = null;
    if(STORY.actionT >= 1){ storyLevelDone(); }
  }
  canvas.addEventListener('mousedown', down);
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);
  canvas.addEventListener('touchstart', down, {passive:false});
  canvas.addEventListener('touchmove', move, {passive:false});
  canvas.addEventListener('touchend', up);
}
function storyLevelDone(){
  STORY.playing = false;
  const btn = document.getElementById('story-do');
  if(btn){ btn.textContent = '✓ 完成！'; btn.disabled = true; btn.classList.add('done'); }
  const sc = STORY_SCENES[STORY.sceneIdx];
  if(typeof goldBoom === 'function') goldBoom(`${sc.title} 通关！解锁非遗知识`);
  setTimeout(()=>{
    if(STORY.sceneIdx < STORY_SCENES.length - 1){
      STORY.sceneIdx++; STORY.actionT = 0; storyInjectUI();
    } else { STORY.done = true; storyOnDone(); }
  }, 1200);
}
function storyOnDone(){
  if(typeof goldBoom === 'function') goldBoom('🎉 三道非遗工艺全部通关！解锁限定纹样徽章');
  if(typeof markExplore === 'function') markExplore('story_all_done');
  setTimeout(()=>{
    if(typeof showModal === 'function'){
      showModal({title:'🏆 辽韵手艺人徽章', sub:'非遗工艺闯关通关纪念',
        body:`<div style="text-align:center;margin:20px 0;">
          <div style="width:120px;height:120px;margin:0 auto;border-radius:50%;background:linear-gradient(135deg,#C41E3A,#8B1428);border:3px solid #D4A843;box-shadow:0 0 30px rgba(212,168,67,.5);display:flex;align-items:center;justify-content:center;font-size:48px;">🎭</div>
          <b style="color:#F0D68A;font-size:18px;">辽韵手艺人</b>
          <p style="margin-top:10px;opacity:.8;font-size:13px;">你亲手走过了剪纸→皮影→刺绣三道关卡<br>一脉辽纹，三艺共生</p>
        </div>
        <button class="tool-btn" onclick="closeModal();closeStory()">收 藏 徽 章</button>`});
    }
  }, 800);
}
function storyDrawCanvas(){
  const ctx = STORY.ctx; if(!ctx) return;
  const W = STORY.canvas.width, H = STORY.canvas.height;
  const bg = ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#141020'); bg.addColorStop(1,'#0f0c1a');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
  const scene = STORY.sceneIdx;
  ctx.save();
  if(scene === 0){
    ctx.save(); ctx.translate(W/2, H/2-20);
    const scaleY = 1 + STORY.playing * 0.2 * Math.sin(STORY.T*8);
    ctx.scale(1, scaleY);
    ctx.fillStyle = '#C41E3A'; ctx.fillRect(-100,-80,200,160);
    ctx.strokeStyle = '#D4A843'; ctx.lineWidth = 2; ctx.strokeRect(-100,-80,200,160);
    ctx.restore();
    if(STORY.currentPath && STORY.currentPath.length > 1){
      ctx.save(); ctx.globalCompositeOperation='destination-out'; ctx.lineWidth = 10; ctx.strokeStyle='#000';
      ctx.beginPath(); ctx.moveTo(STORY.currentPath[0].x, STORY.currentPath[0].y);
      for(let i=1;i<STORY.currentPath.length;i++) ctx.lineTo(STORY.currentPath[i].x, STORY.currentPath[i].y);
      ctx.stroke(); ctx.restore();
    }
  } else if(scene === 1){
    ctx.save(); ctx.translate(W/2, H/2);
    ctx.strokeStyle = '#5C3A1E'; ctx.lineWidth = 14; ctx.lineCap='round';
    ctx.beginPath();
    for(let i=0;i<30;i++){
      const t = i/30;
      const x = Math.cos(t*Math.PI*2.5)*80;
      const y = Math.sin(t*Math.PI*2.5)*50 + Math.sin(t*6+STORY.T*STORY.playing*3)*10;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();
    ctx.fillStyle = '#5C3A1E';
    ctx.beginPath(); ctx.arc(60, -20, 12, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#F0D68A'; ctx.beginPath(); ctx.arc(65, -25, 3, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  } else {
    ctx.save(); ctx.translate(W/2, H/2);
    ctx.strokeStyle = '#2d1f42'; ctx.lineWidth = 1;
    for(let y=-100;y<100;y+=6){ ctx.fillStyle='rgba(240,214,138,.03)'; ctx.fillRect(-120,y,240,1); }
    try{ if(typeof MOTIFS!=='undefined') MOTIFS[0].draw(ctx, 0, 0, 80, '#E8455F', 'rgba(240,214,138,.3)'); }catch(e){}
    ctx.restore();
    if(STORY.currentPath && STORY.currentPath.length > 1){
      ctx.save(); ctx.strokeStyle='#F0D68A'; ctx.lineWidth=2; ctx.setLineDash([3,2]);
      ctx.beginPath(); ctx.moveTo(STORY.currentPath[0].x, STORY.currentPath[0].y);
      for(let i=1;i<STORY.currentPath.length;i++) ctx.lineTo(STORY.currentPath[i].x, STORY.currentPath[i].y);
      ctx.stroke(); ctx.restore();
    }
  }
  ctx.restore();
  if(STORY.playing){
    const barW = 200, bx = W/2-barW/2, by = H-30;
    ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.fillRect(bx, by, barW, 6);
    ctx.fillStyle='#F0D68A'; ctx.fillRect(bx, by, barW*Math.min(1,STORY.actionT), 6);
    ctx.fillStyle='rgba(240,214,138,0.7)'; ctx.font='11px sans-serif'; ctx.textAlign='center';
    ctx.fillText('在画布上拖动演练…', W/2, by-6);
  }
}
function storyLoop(){
  if(!STORY.open) return;
  STORY.T += 0.016;
  storyDrawCanvas();
  STORY.raf = requestAnimationFrame(storyLoop);
}

/* ===== F2 传承录完整落地（留言墙+非遗保护现状科普） ===== */
const CHRON2 = { messages:[], inited:false };
const HERITAGE_STATS = [
  {icon:'📉', title:'传承人老龄化', num:'78%', desc:'国家级非遗传承人平均年龄已超70岁，30岁以下传承人不足5%', color:'#E8455F'},
  {icon:'⚠️', title:'技艺断代风险', num:'43%', desc:'辽宁三大非遗（剪纸/皮影/刺绣）均面临青年不愿学的现实困境', color:'#FF8C42'},
  {icon:'🌐', title:'数字化保护', num:'1200+', desc:'已累计采集辽宁非遗视频/音频/实物1200余件，仍有大量未归档', color:'#D4A843'},
  {icon:'🎓', title:'进校园覆盖', num:'27所', desc:'辽宁省已在27所中小学开展非遗美育试点，年覆盖学生约10万人次', color:'#7EC8A9'},
];
const HERITAGE_ISSUE = [
  {title:'经费不足', body:'非遗保护专项资金投入远低于文物保护，许多基层传承人无固定经济来源'},
  {title:'市场萎缩', body:'传统皮影/刺绣/剪纸在现代生活中使用场景减少，传承人难以靠手艺维持生计'},
  {title:'认知断层', body:'年轻一代对辽宁满族非遗了解有限，文化认同需从娃娃抓起'},
];
const HERITAGE_ACTIONS = [
  '将非遗纳入中小学美育课程必修内容',
  '建立传承人补助制度，鼓励青年拜师学艺',
  '推动非遗与文创/潮玩/游戏跨界融合',
  '建设辽宁非遗数字档案与在线数据库',
];

function openChronicle2(){
  if(!document.getElementById('chron2-overlay')){ injectStoryOverlay(); }
  const ov = document.getElementById('chron2-overlay');
  if(!ov) return;
  ov.classList.add('show');
  if(!CHRON2.inited){
    try{ CHRON2.messages = JSON.parse(localStorage.getItem('ly_messages') || 'null') || [
      {name:'辽西游客', text:'岫岩皮影戏太震撼了！从小在电视上看，现场听板胡锣鼓完全不一样。', time:Date.now()-86400000},
      {name:'沈阳中学生', text:'我们学校开了剪纸选修课，我剪了个团花送给奶奶，她哭了。', time:Date.now()-86400000*2},
      {name:'传承研究者', text:'满族刺绣的盘金技法正在消失，呼吁更多人关注。', time:Date.now()-86400000*5},
    ]; }catch(e){ CHRON2.messages = []; }
    CHRON2.inited = true;
  }
  chron2Render();
}
function closeChronicle2(){
  const ov = document.getElementById('chron2-overlay');
  if(ov) ov.classList.remove('show');
}
function chron2Render(){
  const ov = document.getElementById('chron2-overlay');
  if(!ov) return;
  ov.innerHTML = '';
  ov.classList.add('show');
  const wrap = document.createElement('div');
  wrap.className = 'puzzle-box chron2-box';
  wrap.innerHTML = `
    <div class="puzzle-title">传承录 · 非遗保护现状</div>
    <div class="puzzle-sub">留言墙 + 科普辽宁非遗保护的现实困境与行动</div>
    <div class="chron2-tabs">
      <button class="chron2-tab on" data-tab="wall">🖊 留言墙</button>
      <button class="chron2-tab" data-tab="stats">📊 现状数据</button>
      <button class="chron2-tab" data-tab="issue">⚠️ 现实困境</button>
      <button class="chron2-tab" data-tab="action">✨ 我们能做什么</button>
    </div>
    <div class="chron2-body" id="chron2-body"></div>
    <div class="puzzle-foot"><button class="modal-close puzzle-close" onclick="closeChronicle2()">关 闭</button></div>
  `;
  ov.appendChild(wrap);
  wrap.querySelectorAll('.chron2-tab').forEach(btn=>{
    btn.onclick = ()=>{ wrap.querySelectorAll('.chron2-tab').forEach(b=>b.classList.remove('on')); btn.classList.add('on'); chron2ShowTab(btn.dataset.tab); };
  });
  chron2ShowTab('wall');
}
function chron2ShowTab(tab){
  const body = document.getElementById('chron2-body'); if(!body) return;
  if(tab === 'wall'){
    const msgs = [...CHRON2.messages].sort((a,b)=>b.time-a.time);
    body.innerHTML = `
      <div class="chron2-write">
        <input id="chron2-name" placeholder="你的名字 / 匿名" maxlength="20"/>
        <textarea id="chron2-text" placeholder="写下你对辽宁满族非遗的感受、记忆或呼吁…" rows="3" maxlength="200"></textarea>
        <button class="tool-btn" onclick="chron2Post()">✦ 提交留言</button>
      </div>
      <div class="chron2-msgs">
        ${msgs.map(m=>`<div class="chron2-msg"><div class="cm-header"><b>${m.name||'匿名'}</b><small>${new Date(m.time).toLocaleString('zh-CN')}</small></div><p>${m.text}</p></div>`).join('')}
      </div>`;
  } else if(tab === 'stats'){
    body.innerHTML = `<div class="chron2-stats">${HERITAGE_STATS.map(s=>`
      <div class="chron2-stat-card" style="border-left-color:${s.color}">
        <div class="cs-icon">${s.icon}</div>
        <div class="cs-num" style="color:${s.color}">${s.num}</div>
        <div class="cs-title">${s.title}</div>
        <div class="cs-desc">${s.desc}</div></div>`).join('')}
    </div><div class="chron2-source">📌 数据来源：辽宁省文旅厅 · 非遗保护中心2023年度报告</div>`;
  } else if(tab === 'issue'){
    body.innerHTML = `<div class="chron2-issues">${HERITAGE_ISSUE.map((i,idx)=>`
      <div class="chron2-issue"><div class="ci-num">${idx+1}</div><div class="ci-body"><b>${i.title}</b><p>${i.body}</p></div></div>`).join('')}
    </div><div class="chron2-quote"><q>非遗不是博物馆里的化石，而是活在当下的文化基因。保护它，就是守护我们来处的根。</q><small>—— 辽宁省非遗保护中心主任</small></div>`;
  } else if(tab === 'action'){
    body.innerHTML = `<div class="chron2-actions"><div class="chron2-action-title">💪 每个人都能做的事</div>
      ${HERITAGE_ACTIONS.map((a,idx)=>`<div class="chron2-action"><span class="ca-num">${idx+1}</span><p>${a}</p></div>`).join('')}
    </div><div class="chron2-share"><button class="tool-btn" onclick="showToast('已记录你的心意 · 谢谢关注非遗！')">✦ 我承诺关注非遗</button><small>你的每一次转发、每一次体验，都是在为非遗传承发声</small></div>`;
  }
}
function chron2Post(){
  const name = document.getElementById('chron2-name')?.value?.trim() || '匿名';
  const text = document.getElementById('chron2-text')?.value?.trim();
  if(!text){ showToast('请写下你的感受'); return; }
  CHRON2.messages.unshift({name, text, time:Date.now()});
  try{ localStorage.setItem('ly_messages', JSON.stringify(CHRON2.messages)); }catch(e){}
  chron2ShowTab('wall');
  showToast('留言已提交 · 谢谢你关注辽宁非遗');
  if(typeof markExplore === 'function') markExplore('chron2_write');
}

/* ===== F3 古今对照滑条过渡 ===== */
const CMP2 = { canvas:null, ctx:null, raf:0, slideX:0.5, T:0, open:false, bound:false, eraIdx:1, };
const CMP2_ERAS = [
  {name:'上古图腾', palette:['#8B6F3F','#C9A961']},
  {name:'清代满族团花', palette:['#C41E3A','#D4A843']},
  {name:'民国满汉融合', palette:['#7B4A8F','#C77DBA']},
  {name:'当代国潮重构', palette:['#D4A843','#F0D68A']},
];
function openCompare2(){
  if(!document.getElementById('compare2-overlay')){ injectStoryOverlay(); }
  const ov = document.getElementById('compare2-overlay'); if(!ov) return;
  ov.classList.add('show');
  CMP2.open = true; CMP2.slideX = 0.5; CMP2.eraIdx = 1; CMP2.T = 0;
  cmp2InjectUI();
  if(!CMP2.bound){ cmp2BindInput(); CMP2.bound = true; }
  cancelAnimationFrame(CMP2.raf); cmp2Loop();
  showGuide('cmp2','拖中间滑块对比传统古纹样与现代再设计');
}
function closeCompare2(){
  const ov = document.getElementById('compare2-overlay'); if(ov) ov.classList.remove('show');
  CMP2.open = false; cancelAnimationFrame(CMP2.raf);
}
function cmp2InjectUI(){
  let ui = document.getElementById('cmp2-ui'); if(ui) ui.remove();
  ui = document.createElement('div'); ui.id = 'cmp2-ui'; ui.className = 'cmp2-ui';
  ui.innerHTML = `<div class="cmp2-eras">${CMP2_ERAS.map((e,i)=>`<button class="tool-btn ${i===CMP2.eraIdx?'tool-btn-active':''}" onclick="cmp2SetEra(${i})">${e.name}</button>`).join('')}</div>`;
  const box = document.querySelector('#compare2-overlay .puzzle-box');
  if(box) box.insertBefore(ui, document.getElementById('cmp2-canvas'));
  const foot = document.getElementById('cmp2-footer');
  if(foot){ foot.innerHTML = `<span class="flow-tip">拖中间滑块 · 传统 ←→ 现代</span><button class="modal-close puzzle-close" onclick="closeCompare2()">关 闭</button>`; }
}
function cmp2SetEra(i){ CMP2.eraIdx = i; cmp2InjectUI(); }
function cmp2BindInput(){
  const cv = document.getElementById('cmp2-canvas'); if(!cv) return;
  const pos = e=>{ const r=cv.getBoundingClientRect(); const t=e.touches?e.touches[0]:e; return (t.clientX-r.left)/r.width; };
  let dragging = false;
  cv.addEventListener('mousedown',e=>{dragging=true;cmp2SetSlide(pos(e));e.preventDefault();});
  window.addEventListener('mousemove',e=>{if(dragging)cmp2SetSlide(pos(e));});
  window.addEventListener('mouseup',()=>dragging=false);
  cv.addEventListener('touchstart',e=>{dragging=true;cmp2SetSlide(pos(e));e.preventDefault();},{passive:false});
  cv.addEventListener('touchmove',e=>{if(dragging)cmp2SetSlide(pos(e));},{passive:false});
  cv.addEventListener('touchend',()=>dragging=false);
}
function cmp2SetSlide(v){ CMP2.slideX = Math.max(0.05, Math.min(0.95, v)); }
function cmp2Loop(){
  if(!CMP2.open) return;
  const ctx = CMP2.ctx;
  if(!ctx){ const cv=document.getElementById('cmp2-canvas'); if(cv){CMP2.canvas=cv;CMP2.ctx=cv.getContext('2d');}else{CMP2.raf=requestAnimationFrame(cmp2Loop);return;} }
  const W=CMP2.canvas.width, H=CMP2.canvas.height; CMP2.T+=0.016;
  // 传统
  ctx.fillStyle='#0d0d1a'; ctx.fillRect(0,0,W,H);
  const g1=ctx.createLinearGradient(0,0,W,H); g1.addColorStop(0,'#C41E3A'); g1.addColorStop(1,'#8B1428');
  ctx.fillStyle=g1; ctx.fillRect(0,0,W,H);
  ctx.save(); ctx.translate(W/2,H/2);
  try{ if(typeof MOTIFS!=='undefined') MOTIFS[CMP2.eraIdx].draw(ctx,0,0,120,'#F5E6C8','#D4A843'); }catch(e){}
  ctx.restore();
  ctx.strokeStyle='#D4A843'; ctx.lineWidth=4; ctx.strokeRect(8,8,W-16,H-16);
  ctx.fillStyle='rgba(240,214,138,0.9)'; ctx.font='bold 14px "Noto Serif SC"'; ctx.textAlign='center';
  ctx.fillText('传统古纹样 · '+CMP2_ERAS[CMP2.eraIdx].name, W/2, H-18);
  // 现代（右半）
  ctx.save();
  ctx.beginPath(); ctx.rect(W*CMP2.slideX, 0, W*(1-CMP2.slideX), H); ctx.clip();
  ctx.fillStyle='#0d0d1a'; ctx.fillRect(0,0,W,H);
  const g2=ctx.createLinearGradient(0,0,W,H); g2.addColorStop(0,'#1a1a2e'); g2.addColorStop(1,'#0d0d1a');
  ctx.fillStyle=g2; ctx.fillRect(0,0,W,H);
  ctx.save(); ctx.translate(W/2,H/2);
  const pal=CMP2_ERAS[CMP2.eraIdx].palette;
  ctx.strokeStyle=pal[0]; ctx.lineWidth=1.5;
  for(let i=0;i<8;i++){ const a=i*Math.PI/4+CMP2.T*0.3;
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*130,Math.sin(a)*130); ctx.stroke();
    ctx.beginPath(); ctx.arc(Math.cos(a)*90,Math.sin(a)*90,20,0,Math.PI*2); ctx.stroke(); }
  ctx.strokeStyle=pal[1]; ctx.lineWidth=1;
  ctx.beginPath(); ctx.arc(0,0,60,0,Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.arc(0,0,100,0,Math.PI*2); ctx.stroke();
  try{ if(typeof MOTIFS!=='undefined') MOTIFS[CMP2.eraIdx].draw(ctx,0,0,50,'#F0D68A','rgba(240,214,138,.3)'); }catch(e){}
  ctx.restore();
  const glow=ctx.createRadialGradient(W/2,H/2,10,W/2,H/2,200);
  glow.addColorStop(0,'rgba(240,214,138,0.15)'); glow.addColorStop(1,'transparent');
  ctx.fillStyle=glow; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='#F0D68A'; ctx.lineWidth=2; ctx.strokeRect(8,8,W-16,H-16);
  ctx.fillStyle='rgba(240,214,138,0.9)'; ctx.font='bold 14px "Noto Serif SC"'; ctx.textAlign='center';
  ctx.fillText('现代再设计 · 国潮重构', W/2, H-18);
  ctx.restore();
  // 分割线
  ctx.save(); ctx.strokeStyle='#F0D68A'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(W*CMP2.slideX,0); ctx.lineTo(W*CMP2.slideX,H); ctx.stroke();
  ctx.fillStyle='rgba(240,214,138,0.85)';
  const hx=W*CMP2.slideX, hy=H/2;
  ctx.beginPath(); ctx.arc(hx,hy,18,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#8B1428'; ctx.font='bold 16px sans-serif'; ctx.textAlign='center'; ctx.fillText('↔',hx,hy+5);
  ctx.restore();
  ctx.fillStyle='rgba(240,214,138,0.6)'; ctx.font='10px sans-serif';
  ctx.fillText('传统', W*CMP2.slideX-40, H-5); ctx.fillText('现代', W*CMP2.slideX+12, H-5);
  CMP2.raf=requestAnimationFrame(cmp2Loop);
}

/* ===== 注入HTML与按钮入口 ===== */
function injectStoryOverlay(){
  if(document.getElementById('story-overlay')) return;
  const box = document.createElement('div');
  box.innerHTML = `
    <div id="story-overlay" onclick="if(event.target===this)closeStory()">
      <div class="puzzle-box">
        <div class="puzzle-title">非遗工艺闯关 · 辽韵手艺人</div>
        <div class="puzzle-sub">化身辽地手艺人 · 依次完成剪纸刻制→皮影雕镂→刺绣走线 · 通关解锁限定徽章</div>
        <div id="story-ui"></div>
        <canvas id="story-canvas" width="520" height="380"></canvas>
        <div id="story-footer"></div>
      </div>
    </div>
    <div id="compare2-overlay" onclick="if(event.target===this)closeCompare2()">
      <div class="puzzle-box">
        <div class="puzzle-title">古今对照 · 传统vs现代</div>
        <div class="puzzle-sub">拖中间滑块 · 左看传统古纹样 · 右看现代再设计 · 直观见证非遗演变</div>
        <div id="cmp2-ui"></div>
        <canvas id="cmp2-canvas" width="520" height="380"></canvas>
        <div id="cmp2-footer"></div>
      </div>
    </div>
    <div id="chron2-overlay" onclick="if(event.target===this)closeChronicle2()"></div>
    <style>
    .story-ui{margin-bottom:10px;}
    .story-progress{display:flex;align-items:center;gap:4px;margin-bottom:8px;}
    .story-step{width:28px;height:28px;border-radius:50%;background:rgba(22,22,42,.7);border:1px solid rgba(212,168,67,.3);color:rgba(245,230,200,.6);font-size:12px;display:flex;align-items:center;justify-content:center;flex:none;}
    .story-step.on{background:linear-gradient(135deg,#C41E3A,#8B1428);border-color:rgba(240,214,138,.6);color:#F0D68A;}
    .story-step.done{background:rgba(126,200,169,.2);border-color:rgba(126,200,169,.5);color:#7EC8A9;}
    .story-scene-title{font-family:'Noto Serif SC';font-size:16px;color:#F0D68A;margin-bottom:6px;letter-spacing:2px;}
    .story-narrative{font-size:12px;line-height:1.8;color:rgba(245,230,200,.8);margin-bottom:8px;padding:8px;background:rgba(22,22,42,.6);border-left:2px solid #D4A843;border-radius:4px;}
    .story-act-hint{font-size:11px;color:rgba(240,214,138,.7);}
    .story-knowledge{font-size:13px;line-height:2;color:rgba(245,230,200,.9);padding:10px;background:rgba(22,22,42,.6);border-radius:6px;margin:10px 0;}
    .chron2-box{max-height:82vh;overflow-y:auto;}
    .chron2-tabs{display:flex;gap:4px;margin-bottom:10px;}
    .chron2-tab{flex:1;padding:6px 10px;border:1px solid rgba(212,168,67,.3);border-radius:6px;background:rgba(22,22,42,.6);color:rgba(245,230,200,.7);font-size:11px;cursor:pointer;}
    .chron2-tab.on{background:linear-gradient(135deg,#C41E3A,#8B1428);border-color:rgba(240,214,138,.5);color:#F0D68A;}
    .chron2-write input,.chron2-write textarea{width:100%;padding:8px;border:1px solid rgba(212,168,67,.2);border-radius:6px;background:rgba(22,22,42,.8);color:#EDE4D3;margin-bottom:6px;font-family:inherit;font-size:12px;}
    .chron2-msg{padding:10px;margin-bottom:8px;background:rgba(22,22,42,.6);border-radius:6px;border-left:2px solid rgba(212,168,67,.4);}
    .chron2-msg .cm-header{display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px;}
    .chron2-msg small{opacity:.5;}
    .chron2-msg p{font-size:12px;color:rgba(245,230,200,.85);line-height:1.7;}
    .chron2-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
    .chron2-stat-card{padding:12px;background:rgba(22,22,42,.6);border-radius:8px;border-left:3px solid #D4A843;}
    .chron2-stat-card .cs-icon{font-size:20px;margin-bottom:4px;}
    .chron2-stat-card .cs-num{font-size:24px;font-weight:700;font-family:'Noto Serif SC';}
    .chron2-stat-card .cs-title{font-size:12px;color:#F0D68A;margin:4px 0;}
    .chron2-stat-card .cs-desc{font-size:11px;color:rgba(245,230,200,.7);line-height:1.6;}
    .chron2-source{font-size:10px;opacity:.4;margin-top:8px;}
    .chron2-issue{display:flex;gap:10px;padding:12px;background:rgba(22,22,42,.6);border-radius:8px;margin-bottom:8px;align-items:flex-start;}
    .chron2-issue .ci-num{width:28px;height:28px;border-radius:50%;background:rgba(212,168,67,.15);border:1px solid rgba(212,168,67,.4);color:#F0D68A;display:flex;align-items:center;justify-content:center;font-weight:700;flex:none;}
    .chron2-issue b{display:block;color:#F0D68A;font-size:13px;margin-bottom:4px;}
    .chron2-issue p{font-size:12px;color:rgba(245,230,200,.8);line-height:1.7;}
    .chron2-quote{margin-top:12px;padding:14px;background:linear-gradient(135deg,rgba(196,30,58,.15),rgba(139,20,40,.2));border-radius:8px;text-align:center;}
    .chron2-quote q{font-size:13px;color:#F0D68A;font-style:normal;}
    .chron2-quote small{display:block;margin-top:6px;font-size:10px;opacity:.5;}
    .chron2-action-title{font-family:'Noto Serif SC';font-size:15px;color:#F0D68A;margin-bottom:10px;}
    .chron2-action{display:flex;gap:10px;padding:10px;background:rgba(22,22,42,.6);border-radius:6px;margin-bottom:6px;align-items:center;}
    .chron2-action .ca-num{width:24px;height:24px;border-radius:50%;background:#C41E3A;color:#F0D68A;display:flex;align-items:center;justify-content:center;font-size:11px;flex:none;}
    .chron2-action p{font-size:12px;color:rgba(245,230,200,.85);line-height:1.6;}
    .chron2-share{margin-top:14px;text-align:center;}
    .chron2-share small{display:block;margin-top:8px;font-size:11px;opacity:.5;}
    .cmp2-ui{margin-bottom:8px;}
    .cmp2-ui .tool-btn{font-size:11px;padding:4px 8px;}
    </style>
  `;
  document.body.appendChild(box);
}
document.addEventListener('DOMContentLoaded', ()=>setTimeout(injectStoryOverlay, 3000));

function injectStoryButtons(){
  if(document.getElementById('ctrl-chron2')) return;
  const bar = document.querySelector('#bottom-bar .btn-group:last-child');
  if(!bar) { setTimeout(injectStoryButtons, 500); return; }
  const chronBtn = document.createElement('button');
  chronBtn.className = 'ctrl-btn'; chronBtn.id = 'ctrl-chron2';
  chronBtn.innerHTML = '<span class="icon">📖</span>传承录';
  chronBtn.onclick = openChronicle2;
  const cmpBtn = document.createElement('button');
  cmpBtn.className = 'ctrl-btn'; cmpBtn.id = 'ctrl-cmp2';
  cmpBtn.innerHTML = '<span class="icon">📐</span>古今对照';
  cmpBtn.onclick = openCompare2;
  bar.appendChild(chronBtn); bar.appendChild(cmpBtn);
}
// 已停用：该注入会在底部栏末尾再加一组「传承录/古今对照」，与游戏下拉内的同名按钮重复（2026-09-09）
// document.addEventListener('DOMContentLoaded', ()=>setTimeout(injectStoryButtons, 4000));

/* ===== F4 跨载体物理模拟视觉特效 ===== */
function injectPhysicsEffects(){
  var hook = function(obj, loopKey, wrapFn){
    if(!obj || !obj[loopKey]) return;
    if(obj[loopKey + '_physics']) return;
    obj[loopKey + '_physics'] = obj[loopKey];
    obj[loopKey] = function(){
      obj[loopKey + '_physics']();
      wrapFn(obj);
    };
  };
  // 剪纸：纸张弯折抖动 + 刻痕撕裂毛边
  hook(window, 'carveLoop', function(){
    if(typeof CARVE === 'undefined' || !CARVE.open || !CARVE.ctx) return;
    var ctx = CARVE.ctx, T = CARVE.T;
    ctx.save();
    var dx = Math.sin(T*2.3)*0.5;
    var dy = Math.cos(T*1.7)*0.3;
    ctx.translate(dx, dy);
    ctx.strokeStyle = 'rgba(196,30,58,0.03)';
    ctx.lineWidth = 1;
    for(var i=0;i<12;i++){
      var y = (CARVE_S/12)*i + Math.sin(T*3+i*0.5)*2;
      ctx.beginPath(); ctx.moveTo(10,y); ctx.bezierCurveTo(CARVE_S/3,y+Math.sin(T*2+i)*3,CARVE_S*2/3,y+Math.cos(T*2+i)*3,CARVE_S-10,y);
      ctx.stroke();
    }
    ctx.restore();
    if(CARVE.doneCnt > 5){
      ctx.save();
      ctx.strokeStyle = 'rgba(200,120,100,0.25)';
      ctx.lineWidth = 0.8;
      CARVE.blackPts.forEach(function(p){
        if(!p.done) return;
        for(var k=0;k<2;k++){
          var a = Math.random()*Math.PI*2;
          var r = 11 + Math.random()*4;
          var x1 = p.x + Math.cos(a)*r, y1 = p.y + Math.sin(a)*r;
          var x2 = x1 + Math.cos(a+Math.PI/2)*(2+Math.random()*3);
          var y2 = y1 + Math.sin(a+Math.PI/2)*(2+Math.random()*3);
          ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
        }
      });
      ctx.restore();
    }
  });
  // 皮影：皮料抖动强化 + 幕布透光投影纹理
  hook(window, 'manipLoop', function(){
    if(typeof MANIP === 'undefined' || !MANIP.open || !MANIP.ctx) return;
    var ctx = MANIP.ctx, T = MANIP.T;
    ctx.save();
    ctx.translate(320, 330);
    var jitterX = Math.sin(T*13)*0.4 + MANIP.turn*3;
    var jitterY = Math.cos(T*11)*0.3 + MANIP.lift*2;
    ctx.translate(jitterX, jitterY);
    ctx.globalAlpha = 0.15 + Math.sin(T*4)*0.05;
    ctx.fillStyle = '#F0D68A';
    ctx.beginPath();
    ctx.ellipse(0, -150, 60, 250, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = '#F0D68A';
    ctx.lineWidth = 0.5;
    for(var i=0;i<8;i++){
      var y = 30 + i*45;
      ctx.beginPath();
      for(var x=60;x<580;x+=12){
        ctx.lineTo(x, y + Math.sin(x*0.05 + T*2 + i)*2);
      }
      ctx.stroke();
    }
    ctx.restore();
  });
  // 刺绣：丝线针脚光泽 + 织物纤维细节
  hook(window, 'threadLoop', function(){
    if(typeof THREAD === 'undefined' || !THREAD.open || !THREAD.ctx) return;
    var ctx = THREAD.ctx, T = THREAD.T;
    if(THREAD.stitched.length > 2){
      ctx.save();
      ctx.fillStyle = '#FCE8A4';
      var step = Math.max(1, Math.floor(THREAD.stitched.length/30));
      for(var i=0;i<THREAD.stitched.length;i+=step){
        var p = THREAD.stitched[i];
        var ph = (T*2 + i*0.3) % (Math.PI*2);
        var al = 0.3 + 0.5*Math.abs(Math.sin(ph));
        ctx.globalAlpha = al * 0.6;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = '#D4A843';
    ctx.lineWidth = 0.4;
    for(var x=0;x<THREAD_S;x+=8){
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,THREAD_S); ctx.stroke();
    }
    for(var y=0;y<THREAD_S;y+=8){
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(THREAD_S,y); ctx.stroke();
    }
    ctx.restore();
  });
  console.log('[物理特效] 剪纸弯折/皮影透光/刺绣光泽 注入完成');
}
// DOM加载后4秒注入
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(injectPhysicsEffects, 4000); });
} else {
  setTimeout(injectPhysicsEffects, 4000);
}

// ===== ⑫ 非遗总结 · 主题升华弹窗（终章） =====
function openFinale(){
  var ov = document.getElementById('summary-overlay'); if(!ov) return;
  // 生成金屑粒子（每次开启重建，营造鎏金氛围）
  var sp = document.getElementById('fn-sparkles');
  if(sp){
    sp.innerHTML = '';
    for(var i=0;i<22;i++){
      var d = document.createElement('i');
      d.style.left = (Math.random()*100)+'%';
      d.style.animationDuration = (5 + Math.random()*6)+'s';
      d.style.animationDelay = (Math.random()*5)+'s';
      var s = 2.5 + Math.random()*3.5;
      d.style.width = s+'px'; d.style.height = s+'px';
      sp.appendChild(d);
    }
  }
  // 重置分段渐显：先移除 show，强制回流后再加回，保证动画每次都重放
  ov.classList.remove('show');
  void ov.offsetWidth;
  ov.classList.add('show');
  var sc = ov.querySelector('.finale-scroll'); if(sc) sc.scrollTop = 0;
  // 鎏金成就闪光 + 轻提示
  var gf = document.getElementById('gold-flash');
  if(gf){ gf.classList.remove('boom'); void gf.offsetWidth; gf.classList.add('boom'); }
  if(typeof showToast === 'function') showToast('终章总结 · 一脉辽纹，三艺同辉');
}
function closeFinale(){
  var ov = document.getElementById('summary-overlay');
  if(ov) ov.classList.remove('show');
}

// ===== ⑬ 国潮质感包：金尘拖尾 / 打卡印章 / 知识卡卷轴渐展 =====
(function(){
  // 质感层容器（CSS 在 style.css：#gc-film / #gc-trail）
  if(!document.getElementById('gc-film')){
    var film = document.createElement('div'); film.id = 'gc-film'; document.body.appendChild(film);
    var cvs = document.createElement('canvas'); cvs.id = 'gc-trail'; document.body.appendChild(cvs);
  }
  var trail = document.getElementById('gc-trail'), ctx = trail ? trail.getContext('2d') : null;
  if(!ctx) return;
  var parts = [], last = {x:-99, y:-99};
  function resize(){ trail.width = innerWidth; trail.height = innerHeight; }
  resize(); window.addEventListener('resize', resize);
  function spawn(x, y){
    if(Math.hypot(x-last.x, y-last.y) < 14) return;   // 距离节流
    last = {x:x, y:y};
    for(var i=0;i<2;i++){
      parts.push({ x:x+(Math.random()*16-8), y:y+(Math.random()*16-8),
        vx:(Math.random()-.5)*.5, vy:-.35-Math.random()*.7,
        r:1+Math.random()*2.2, a:1, rot:Math.random()*Math.PI, gold:Math.random()<.75 });
    }
    if(parts.length > 90) parts.splice(0, parts.length-90);
  }
  window.addEventListener('mousemove', function(e){ spawn(e.clientX, e.clientY); }, {passive:true});
  window.addEventListener('touchmove', function(e){ var t=e.touches[0]; if(t) spawn(t.clientX, t.clientY); }, {passive:true});
  (function loop(){
    requestAnimationFrame(loop);
    ctx.clearRect(0, 0, trail.width, trail.height);
    for(var i=parts.length-1;i>=0;i--){
      var p = parts[i];
      p.x += p.vx; p.y += p.vy; p.a -= .016; p.rot += .04;
      if(p.a <= 0){ parts.splice(i,1); continue; }
      ctx.save();
      ctx.globalAlpha = Math.max(p.a, 0);
      ctx.fillStyle = p.gold ? '#F0D68A' : '#E8556A';
      ctx.shadowColor = p.gold ? 'rgba(240,214,138,.9)' : 'rgba(232,85,106,.9)';
      ctx.shadowBlur = 8;
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillRect(-p.r, -p.r, p.r*2, p.r*2);   // 小菱形金屑
      ctx.restore();
    }
  })();
  // 记录最近指针位置（印章落点）
  window.__gcLastPt = {x:innerWidth/2, y:innerHeight/2};
  window.addEventListener('pointerdown', function(e){ __gcLastPt = {x:e.clientX, y:e.clientY}; }, {passive:true});
  window.addEventListener('mousemove', function(e){ __gcLastPt = {x:e.clientX, y:e.clientY}; }, {passive:true});
  // 打卡鎏金印章：按知识标题落印（紙/影/繡/賞）
  window.popSeal = function(x, y, txt){
    var s = document.createElement('div'); s.className = 'gc-seal-pop';
    s.textContent = txt || '賞';
    s.style.left = (x != null ? x : __gcLastPt.x) + 'px';
    s.style.top  = (y != null ? y : __gcLastPt.y) + 'px';
    document.body.appendChild(s);
    setTimeout(function(){ s.remove(); }, 1300);
  };
  // 知识卡出现 = 打卡时刻：印章 + 卷轴渐展
  var _sk = window.showKnowledge;
  if(typeof _sk === 'function'){
    window.showKnowledge = function(data){
      _sk(data);
      var t = (data && data.title) || '';
      var seal = /剪纸|窗花/.test(t) ? '紙' : /皮影/.test(t) ? '影' : /刺绣|绣/.test(t) ? '繡' : '賞';
      popSeal(null, null, seal);
      var card = document.getElementById('knowledge-card');
      if(card){
        card.classList.remove('k-unfurl'); void card.offsetWidth;
        card.classList.add('k-unfurl');
        setTimeout(function(){ card.classList.remove('k-unfurl'); }, 900);
      }
    };
  }
})();

/* ================================================================
 * 地域对比 · 辽宁三艺 vs 各地（任务4：同门类横向对比，突显辽宁独特）
 * ================================================================ */
const REGION_DATA = [
  {art:'皮影', ln:'鞍山岫岩皮影', oth:'唐滦一带 · 冀东乐亭影系',
   imgLn:'imgs/region-piying-ln.jpg', imgOth:'imgs/region-piying-oth.jpg', rows:[
    {dim:'造型', ln:'粗犷豪放、线条简练明快；写实基础上高度概括，眉眼传神以辨忠奸；平视兼俯仰，二维造型出三维效果', oth:'同源于冀东滦州乐亭影调，造型一脉相承、较工整', unique:true,
     why:'为克服皮影人物忠奸难辨的不足，鞍山皮影着重在眼睛上做文章，形成独特定制'},
    {dim:'唱腔', ln:'乡土气息浓郁的板腔体音乐，传统唢呐、板胡伴奏', oth:'唐滦「掐嗓」唱法独特；平调、花调、悲调流派纷呈（受京剧、落子、大鼓、梆子浸润）', unique:true,
     why:'河北、北京、东北、山东各路唱腔同源乐亭影调，却各自成派，唐滦掐嗓尤为独特'},
    {dim:'流派源流', ln:'属滦州皮影派系，原以纸雕刻影人，后发展为羊皮刻影', oth:'各路皮影同源于冀东滦州乐亭影调', unique:false},
    {dim:'原料与工序', ln:'岫岩皮影选用驴皮，经选皮、制皮、画稿、熨平工序制成', oth:'皮影戏均以兽皮为原料', unique:false}
  ]},
  {art:'剪纸', ln:'新宾满族剪纸', oth:'陕北 · 山东高密 · 广东佛山',
   imgLn:'imgs/region-jianzhi-ln.jpg', imgOth:'imgs/region-jianzhi-oth.jpg',
   rows:[
    {dim:'技法', ln:'不描不画、不打底稿，即兴发挥一气呵成；以木炭、烟头或香头烫出点、线加强表现', oth:'各地多先描后剪，或以衬色、拼贴辅助（如佛山铜衬色）', unique:true,
     why:'「即兴下剪、一气呵成」是与多数地区「先描后剪」最大的分野'},
    {dim:'独有形式', ln:'吊线剪纸、立体组合剪纸——「嬷嬷人」可立可坐，是儿童游戏玩具', oth:'以平面窗花、贴饰为主', unique:true,
     why:'立体组合剪纸全国罕见，把剪纸从墙面带进了儿童游戏'},
    {dim:'题材', ln:'满族信仰与满族生活气息浓郁（萨满图腾、摇篮挂笺等）', oth:'陕北抓髻娃娃、窗花；江南花草鱼虫', unique:true,
     why:'题材直接源自满族信仰与生活，是东北独有的文化母题'},
    {dim:'风格', ln:'写形、写意、写神、写心；古朴、粗犷、浑厚、洗练', oth:'江南细腻玲珑、做工精巧', unique:true,
     why:'重神韵、重拙朴，与关内剪纸的纤细雅致形成鲜明对照'},
    {dim:'文字', ln:'常配满文题字、图文并茂', oth:'多用汉字题字或纯图样', unique:true,
     why:'满文题字是新宾剪纸的标志性特征，直接彰显满族民族身份'}
  ]},
  {art:'刺绣', ln:'辽阳满族刺绣', oth:'苏州苏绣 · 湖南湘绣 · 四川蜀绣',
   imgLn:'imgs/region-cixiu-ln.jpg', imgOth:'imgs/region-cixiu-oth.jpg', rows:[
    {dim:'用色', ln:'红黄蓝白黑五色，象征天、地、日、水、铁，对比强烈；岫岩善用「退晕法」过渡', oth:'苏绣淡雅柔和；蜀绣明丽华彩', unique:true,
     why:'五色象征体系是满族刺绣的标志，退晕法让浓烈用色过渡自然'},
    {dim:'针法', ln:'传统针法15种以上：平绣、盘金绣、包绣、锁绣、纳纱绣；盛京满绣更有立体绣法', oth:'苏绣双面绣；湘绣鬅毛针', unique:false},
    {dim:'纹样', ln:'花鸟鱼虫、人物故事、「福禄寿喜财」；保留「生命树」「嬷嬷人」萨满图案，构图「疏可跑马，密不透风」', oth:'文人画、花鸟山水题材', unique:true,
     why:'萨满图案与吉祥纹样并存，构图讲究疏密对比，是辽绣纹样的独有气质'},
    {dim:'风格', ln:'粗犷与细腻并存：保留女真人皮革补绣的拙朴感，吸收苏绣、鲁绣等汉族技艺', oth:'南方刺绣以细腻见长', unique:true,
     why:'同一幅绣品「北方大气、南方细腻」并存，是辽绣独有的融合面貌'}
  ]}
];
let REGION_TAB = 0;
function openRegion(){
  const ov = document.getElementById('region-overlay');
  if(!ov) return;
  ov.classList.add('show');
  renderRegionTabs();
  renderRegion(REGION_TAB);
  showGuide('region','逐行点开 · 对比辽宁与各地技艺的独特之处');
}
function closeRegion(){
  const ov = document.getElementById('region-overlay');
  if(ov) ov.classList.remove('show');
}
function renderRegionTabs(){
  const box = document.getElementById('region-tabs'); if(!box) return;
  box.innerHTML = REGION_DATA.map((d,i)=>
    `<button class="region-tab ${i===REGION_TAB?'on':''}" onclick="regionSetTab(${i})">${d.art}</button>`).join('');
}
function regionSetTab(i){
  REGION_TAB = i;
  renderRegionTabs();
  renderRegion(i);
}
function renderRegion(idx){
  const d = REGION_DATA[idx] || REGION_DATA[0];
  document.getElementById('region-ln-name').textContent = d.ln;
  document.getElementById('region-oth-name').textContent = d.oth;
  const box = document.getElementById('region-rows'); if(!box) return;
  box.innerHTML = `
    <div class="region-imgs">
      <figure class="region-img region-img-ln">
        <img src="${d.imgLn}" alt="辽宁${d.art}作品示例" loading="lazy">
        <figcaption>辽宁 · ${d.art}示例</figcaption>
      </figure>
      <figure class="region-img region-img-oth">
        <img src="${d.imgOth}" alt="各地${d.art}作品示例" loading="lazy">
        <figcaption>各地 · ${d.art}示例</figcaption>
      </figure>
    </div>` + d.rows.map((r,i)=>`
    <div class="region-row" style="transition-delay:${i*110}ms" onclick="toggleRegionRow(this)">
      <div class="region-dim">${r.dim}</div>
      <div class="region-cell region-cell-ln unique${r.why?' clickable':''}">
        <span class="region-badge region-badge-ln">辽宁</span>
        <p>${r.ln}</p>
        <em class="region-uni">✦ 独有</em>
      </div>
      <div class="region-cell region-cell-oth">
        <span class="region-badge region-badge-oth">各地</span>
        <p>${r.oth}</p>
      </div>
      ${r.why?`<div class="region-why"><b>独特缘由</b>${r.why}</div>`:''}
    </div>`).join('');
  box.classList.remove('rv');
  void box.offsetWidth;   // 强制回流 · 重启逐行揭示动画
  box.classList.add('rv');
}
function toggleRegionRow(row){
  if(!row.querySelector('.region-why')) return;
  row.classList.toggle('expanded');
}

/* ============================================================
   ⑭ 仙鹤导览员「鹤小雅」
   · 常驻页面，随展区切换解说三大非遗（解说文案复用 SCENE_DATA 网页原文）
   · 仙鹤左右各一枚游戏按钮：先弹玩法讲解，再进入游戏
   · 「全部玩法」帖汇总所有游戏的玩法介绍
   · 逛完三展区 → 解锁终章徽章 → 引导总结弹窗 → 传承誓约
   ============================================================ */
(function(){
  var guide = document.getElementById('he-guide');
  if(!guide) return;
  var $ = function(id){ return document.getElementById(id); };
  var bubble=$('he-bubble'), gamesPanel=$('he-games'), body=$('he-b-body'),
      greet=$('he-b-greet'), tag=$('he-b-tag'), foot=$('he-b-foot'),
      voiceBtn=$('he-voice-btn'), finBadge=$('he-fin-badge');

  var G = { scene:'paper', visited:{paper:true,puppet:false,emb:false}, revealed:false,
            mode:'talk', pending:null, audio:null, audioList:null, audioIdx:0 };
  var SCENE_LABEL = {paper:'剪纸', puppet:'皮影', emb:'刺绣'};
  var SCENE_TAG = {paper:'新宾满族剪纸', puppet:'岫岩皮影戏', emb:'辽阳满族刺绣'};
  var GREETS = {
    paper:'嗨，我是鹤小雅，「辽韵三萃」的导览员！辽宁有三门绝活——剪纸、皮影、刺绣，它们其实是同一种纹样的三生三世。先从「纹样母体」新宾满族剪纸看起吧。',
    puppet:'一张纸上的纹样，怎么就活了起来？随我到岫岩皮影戏台——同源纹样被刻上驴皮，灯光一打，便演尽了千年故事。',
    emb:'最后一站，纹样要在织物上安家。辽阳满绣的姑娘们先剪纸样、再飞针走线，看这根金线如何为纹样赋彩。'
  };
  var FIN_GREET = '三艺已览遍，一纸生纹、一皮转韵、一布赋彩。随我翻开终章，看看我们这代人，能为传承做些什么——';

  /* 每个展区仙鹤左右两枚主推游戏（点击先看玩法讲解） */
  var SCENE_GAMES = {
    paper:[
      {ico:'✎', name:'刻绘剪纸', fn:'openCarve', tip:'鼠标为刻刀 · 沿纹镂空',
        steps:['鼠标化作刻刀，按住左键沿黑色纹样滑动镂空。','刻痕超出红色引导线会扣分，满分 100 分。','可在「萨满纹样」「福字年俗」两套底稿间切换。','刻成的纹样会同步到刺绣展厅，成为绣纹母本。']},
      {ico:'✿', name:'拼窗花', fn:'openPuzzle', tip:'折叠走剪 · 展开成花',
        steps:['先选择纸张的折叠方式。','沿金色轨迹走剪镂空，共需拼合 7 片。','剪完轻轻展开，就是一幅完整满族窗花。','你的作品还会贴上展厅的窗花墙。']}
    ],
    puppet:[
      {ico:'💡', name:'皮影光影叙事', fn:'openManip', tip:'拖动光源 · 编排默剧',
        steps:['左右拖动光源，控制幕上影子的虚与实。','依次完成「① 抬手」「② 转身」两段默剧动作。','动作到位即可点亮任务签。','全部完成，领取专属数字纪念卡。']},
      {ico:'🎭', name:'皮影小剧场', fn:'openDrama', tip:'选剧走位 · 一键开演',
        steps:['选择剧目：满族过大年 或 萨满祈福。','拖动武将、文生、旦角到幕上排布出场次序。','点「一键开演」自动演出，还可录制短片。','收戏后生成一张属于你的短剧海报。']}
    ],
    emb:[
      {ico:'🧵', name:'走线工坊', fn:'openThread', tip:'沿点走线 · 绣成枕顶',
        steps:['沿金色引导点移动鼠标，虚拟针线随轨迹铺出绣线。','走完一整只枕头顶，绣品即告完成。','可保存绣品，也可一键同步到皮影人物服饰。','这就是剪纸纹样在织物上的最终落地。']},
      {ico:'🪡', name:'绣纹闯关', fn:'openEmbGame', tip:'运针躲线 · 三颗心通关',
        steps:['按住鼠标沿金色轨迹运针前行。','躲避游走的红色杂线，碰到一次扣一颗心，共三颗心。','坚持运针到终点即通关。','通关解锁满族高级配色色板。']}
    ]
  };

  /* 全部玩法帖（覆盖页面全部游戏/工坊） */
  var ALL_GAMES = [
    {group:'新宾满族剪纸 · 纸上生纹'},
    {ico:'✎', name:'刻绘剪纸', fn:'openCarve', how:'鼠标为刻刀沿黑色纹样镂空，刻出红线外扣分，刻成纹样同步刺绣展厅。'},
    {ico:'✿', name:'拼窗花', fn:'openPuzzle', how:'选择折叠方式，沿金线走剪镂空，7 片拼合展开成满族窗花。'},
    {group:'岫岩皮影 · 光影转韵'},
    {ico:'💡', name:'皮影光影叙事', fn:'openManip', how:'拖动光源角度控制影子虚实，完成抬手、转身默剧动作序列。'},
    {ico:'🎭', name:'皮影小剧场', fn:'openDrama', how:'选剧目、拖角色走位，一键开演，可录制短片并生成海报。'},
    {group:'辽阳满族刺绣 · 针线赋彩'},
    {ico:'🧵', name:'满族刺绣走线工坊', fn:'openThread', how:'沿金色引导点移动鼠标铺出绣线，绣完枕头顶并可同步皮影服饰。'},
    {ico:'🪡', name:'绣纹闯关', fn:'openEmbGame', how:'沿金色轨迹运针、躲开红色杂线，三颗心通关解锁高级色板。'},
    {ico:'❋', name:'满绣针法模拟', fn:'openStitch', how:'选平绣/锁绣/盘金/打籽针法，在绣布上拼贴纹样并生成文创卡片。'},
    {group:'三艺联动 · 通关探索'},
    {ico:'❖', name:'纹样流转（核心玩法）', fn:'openFlow', how:'选定剪纸母题，一键流转映射皮影皮偶与刺绣绣布，见证一源三态。'},
    {ico:'⿻', name:'纹样基因演化', fn:'openAsm', how:'拖动 3×3 悬浮碎片复原纹样，解锁从上古图腾到当代国潮的时间轴。'},
    {ico:'◆', name:'纹样溯源挑战', fn:'openQuiz', how:'拖动纹样卡片到它最早起源的展区，共 6 题，验证剪纸是纹样母源。'},
    {ico:'📜', name:'纹样寓意图谱', fn:'openMeaning', how:'左侧纹样连右侧寓意，连对 4 组即解锁满族民俗故事。'},
    {ico:'🌳', name:'三艺传承录', fn:'openChronicle', how:'跨越四个时代作出传承抉择，正确抉择让传承树枝繁叶茂。'},
    {ico:'📐', name:'古今对照', fn:'openCompare', how:'拖动滑块在真实文物与数字复刻间平滑对比，看濒危非遗虚拟复原。'},
    {ico:'🌐', name:'地域对比', fn:'openRegion', how:'逐行展开辽宁三艺与各地同类技艺的差异，金色高亮即为辽宁独有。'}
  ];

  /* ---------- 渲染：非遗解说（文案取自 SCENE_DATA intro 原文） ---------- */
  function renderTalk(scene){
    G.scene = scene; G.mode='talk'; G.pending=null;
    var data = (typeof SCENE_DATA!=='undefined') ? SCENE_DATA[scene] : null;
    showBubble();
    tag.textContent = SCENE_TAG[scene] || (data && data.name) || '';
    greet.textContent = GREETS[scene] || '';
    body.innerHTML = data
      ? '<h4>'+data.intro.title+'<small style="font-weight:400;font-size:11px;color:#9c6a44;margin-left:8px;">'+data.intro.sub+'</small></h4>' + data.intro.body
      : '<p>解说文案筹备中……</p>';
    body.scrollTop = 0;
    voiceBtn.style.display = '';
    renderFoot(scene);
    syncOrbs(scene);
  }
  /* 仅重绘底部按钮区（终章解锁时不覆盖寄语） */
  function renderFoot(scene){
    scene = scene || G.scene;
    /* 展区切换圆点 + 终章入口 */
    var allDone = G.visited.paper && G.visited.puppet && G.visited.emb;
    var html = '<span class="he-scene-dots">';
    ['paper','puppet','emb'].forEach(function(k){
      html += '<button class="he-dot'+(k===scene?' on':'')+(G.visited[k]?' done':'')+'" type="button" data-scene="'+k+'">'+SCENE_LABEL[k]+'</button>';
    });
    html += '</span>';
    if(allDone){
      html += '<button class="he-fin-cta" id="he-fin-go" type="button">✦ 终章总结 · 接过传承</button>';
    }
    foot.innerHTML = html;
    var dots = foot.querySelectorAll('.he-dot');
    dots.forEach(function(d){
      d.onclick = function(){
        stopHeVoice();
        if(typeof gotoScene==='function') gotoScene(d.getAttribute('data-scene'));
      };
    });
    var finGo = $('he-fin-go');
    if(finGo) finGo.onclick = function(){ if(typeof openFinale==='function') openFinale(); };
  }
  function renderFootFinale(){ renderFoot(G.scene); }

  /* ---------- 渲染：游戏玩法讲解 ---------- */
  function renderGame(side){
    var g = SCENE_GAMES[G.scene][side];
    G.mode='game'; G.pending=g;
    showBubble();
    tag.textContent = '玩法详解 · '+g.name;
    greet.textContent = '想玩「'+g.name+'」？不急，鹤小雅先给你讲讲怎么玩——';
    var html = '<h4>'+g.ico+' '+g.name+'<small style="font-weight:400;font-size:11px;color:#9c6a44;margin-left:8px;">'+g.tip+'</small></h4>';
    html += '<ul class="he-steps">';
    g.steps.forEach(function(s,i){ html += '<li><i>'+(i+1)+'</i>'+s+'</li>'; });
    html += '</ul>';
    body.innerHTML = html;
    body.scrollTop = 0;
    voiceBtn.style.display='none';
    foot.innerHTML =
      '<button class="he-back-talk" id="he-game-back" type="button">‹ 回来听非遗解说</button>' +
      '<button class="he-go-game" id="he-game-go" type="button">▶ 进入'+g.name+'</button>';
    $('he-game-back').onclick = function(){ renderTalk(G.scene); };
    $('he-game-go').onclick = function(){
      if(typeof window[g.fn]==='function'){ window[g.fn](); }
      else if(typeof showToast==='function') showToast('玩法即将开放');
    };
  }

  /* ---------- 左右游戏按钮随展区换名 ---------- */
  function syncOrbs(scene){
    var pair = SCENE_GAMES[scene];
    $('he-orb-l-ico').textContent = pair[0].ico;
    $('he-orb-l-name').textContent = pair[0].name;
    $('he-orb-r-ico').textContent = pair[1].ico;
    $('he-orb-r-name').textContent = pair[1].name;
  }

  /* ---------- 三者互斥：鹤小雅互动 ⇄ 右侧知识框 ⇄ 枕顶翻面卡 ---------- */
  function collapseKnowledgeAndFlip(){
    if(typeof collapseRightPanelSafe==='function') collapseRightPanelSafe();
    else{
      var rp = document.getElementById('right-panel');
      if(rp){ rp.classList.add('collapsed'); rp.classList.remove('open'); }
    }
    if(typeof FLIP!=='undefined' && FLIP && FLIP.open && typeof hideFlipPanel==='function'){
      hideFlipPanel();
    }
  }
  /* 全局：收起鹤小雅互动（供知识框/枕顶打开时互斥调用） */
  window.heGuideCollapse = function(){
    bubble.classList.add('hide');
    gamesPanel.hidden = true; gamesPanel.classList.remove('show');
    guide.classList.remove('games-open');
    stopHeVoice();
  };

  function showBubble(){
    gamesPanel.hidden = true; gamesPanel.classList.remove('show');
    guide.classList.remove('games-open');
    bubble.classList.remove('hide');
    /* 三者互斥：鹤小雅解说/玩法讲解打开 → 收起右侧知识框与枕顶 */
    collapseKnowledgeAndFlip();
  }

  /* ---------- 全部玩法面板 ---------- */
  function buildGamesPanel(){
    var html='';
    ALL_GAMES.forEach(function(it){
      if(it.group){ html += '<span class="he-g-group">'+it.group+'</span>'; return; }
      html += '<button class="he-g-item" type="button" data-fn="'+it.fn+'">' +
        '<span class="gi-ico">'+it.ico+'</span>' +
        '<span class="gi-txt"><span class="gi-name">'+it.name+'</span>' +
        '<span class="gi-how">'+it.how+'</span></span>' +
        '<span class="gi-go">进入 ›</span></button>';
    });
    $('he-g-list').innerHTML = html;
    $('he-g-list').querySelectorAll('.he-g-item').forEach(function(el){
      el.onclick = function(){
        var fn = el.getAttribute('data-fn');
        if(typeof window[fn]==='function') window[fn]();
      };
    });
  }
  function toggleGamesPanel(open){
    var willOpen = open!==undefined ? open : gamesPanel.hidden;
    if(willOpen){
      gamesPanel.hidden=false; gamesPanel.classList.add('show');
      bubble.classList.add('hide'); guide.classList.add('games-open');
      collapseKnowledgeAndFlip();
    }else{
      gamesPanel.hidden=true; gamesPanel.classList.remove('show');
      bubble.classList.remove('hide'); guide.classList.remove('games-open');
    }
  }

  /* ---------- 仙鹤语音讲解（优先站内录音，无录音用 TTS 兜底） ---------- */
  function stopHeVoice(){
    if(G.audio){ try{G.audio.pause();}catch(e){} G.audio=null; }
    if('speechSynthesis' in window) window.speechSynthesis.cancel();
    G.audioList=null;
    guide.classList.remove('speaking');
    voiceBtn.classList.remove('speaking');
  }
  function speakCurrent(){
    stopHeVoice();
    var data = (typeof SCENE_DATA!=='undefined') ? SCENE_DATA[G.scene] : null;
    if(!data) return;
    var srcs = (typeof VOICE_AUDIO!=='undefined' && VOICE_AUDIO[data.intro.title])
      ? [].concat(VOICE_AUDIO[data.intro.title]) : null;
    voiceBtn.classList.add('speaking'); guide.classList.add('speaking');
    if(srcs && srcs.length){
      G.audioList = srcs; G.audioIdx = 0;
      playNext();
    }else if('speechSynthesis' in window){
      var tmp=document.createElement('div'); tmp.innerHTML=data.intro.body;
      var text=data.intro.title+'。'+tmp.innerText.replace(/\s+/g,' ');
      var u=new SpeechSynthesisUtterance(text);
      u.lang='zh-CN'; u.rate=0.95;
      var voices=window.speechSynthesis.getVoices();
      var v=voices.filter(function(x){return /zh|Chinese/i.test(x.lang+x.name);})[0];
      if(v)u.voice=v;
      u.onend=u.onerror=function(){ guide.classList.remove('speaking'); voiceBtn.classList.remove('speaking'); };
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    }else{
      guide.classList.remove('speaking'); voiceBtn.classList.remove('speaking');
    }
  }
  function playNext(){
    if(!G.audioList){ return; }
    if(G.audioIdx >= G.audioList.length){
      stopHeVoice(); return;
    }
    var a = new Audio(G.audioList[G.audioIdx++]);
    G.audio = a;
    a.onended = function(){ G.audio=null; playNext(); };
    a.onerror = function(){ stopHeVoice(); };
    a.play().catch(function(){ stopHeVoice(); });
  }

  /* ---------- 终章解锁 ---------- */
  function checkFinaleUnlock(justUnlocked){
    var all = G.visited.paper && G.visited.puppet && G.visited.emb;
    if(all){
      finBadge.classList.add('unlocked');
      if(justUnlocked){
        guide.classList.add('happy');
        setTimeout(function(){ guide.classList.remove('happy'); }, 2000);
        greet.textContent = FIN_GREET;
        if(typeof showToast==='function') showToast('鹤小雅：三门非遗都逛遍啦 ✦ 终章已为你点亮');
        if(G.mode==='talk') renderFootFinale();
      }
    }else{
      finBadge.classList.remove('unlocked');
    }
  }

  /* ---------- 展区切换钩子：跟随解说每一项非遗 ---------- */
  if(typeof window.switchScene==='function'){
    var __origSwitch = window.switchScene;
    window.switchScene = function(name, cb){
      return __origSwitch(name, function(){
        try{ onGuideScene(name); }catch(e){ console.warn('鹤小雅导览异常', e); }
        if(cb) return cb();
      });
    };
  }
  function onGuideScene(name){
    if(!SCENE_GAMES[name]) return;
    var first = !G.visited[name];
    G.visited[name] = true;
    stopHeVoice();
    renderTalk(name);
    checkFinaleUnlock(first && G.visited.paper && G.visited.puppet && G.visited.emb);
  }

  /* ---------- 交互绑定 ---------- */
  $('he-b-close').onclick = function(){ bubble.classList.add('hide'); };
  $('he-crane').onclick = function(){
    stopHeVoice();
    if(!gamesPanel.hidden){ toggleGamesPanel(false); return; }
    if(bubble.classList.contains('hide') || G.mode!=='talk'){ renderTalk(G.scene); }
    else{ bubble.classList.add('hide'); }
  };
  voiceBtn.onclick = function(e){
    e.stopPropagation();
    if(voiceBtn.classList.contains('speaking')) stopHeVoice();
    else speakCurrent();
  };
  function bindOrb(id, side){
    $(id).onclick = function(){
      stopHeVoice();
      var orb = $(id);
      orb.classList.remove('pulse'); void orb.offsetWidth; orb.classList.add('pulse');
      renderGame(side);
    };
  }
  bindOrb('he-orb-l',0); bindOrb('he-orb-r',1);
  $('he-games-btn').onclick = function(){ toggleGamesPanel(); };
  $('he-g-back').onclick = function(){ toggleGamesPanel(false); };
  finBadge.onclick = function(e){
    e.stopPropagation();
    if(finBadge.classList.contains('unlocked')){
      if(typeof openFinale==='function') openFinale();
    }else{
      var left=[]; ['paper','puppet','emb'].forEach(function(k){ if(!G.visited[k]) left.push(SCENE_TAG[k]); });
      if(typeof showToast==='function') showToast('鹤小雅：再随我看看「'+left.join('、')+'」，终章就会开启');
      guide.classList.remove('happy'); void guide.offsetWidth; guide.classList.add('happy');
      setTimeout(function(){ guide.classList.remove('happy'); }, 1900);
    }
  };

  /* ---------- 图片加载失败 → 回退实时生成接口 ---------- */
  var craneImg = $('he-crane-img');
  craneImg.addEventListener('error', function(){
    if(craneImg.getAttribute('data-fb')) return;
    craneImg.setAttribute('data-fb','1');
    var p='cute 3D render cartoon red-crowned crane mascot, red crown white body black neck, waving wing, Chinese Manchu embroidered vest, white background';
    craneImg.src='https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt='+encodeURIComponent(p)+'&image_size=square_hd';
  }, {once:true});

  /* ---------- 开场动画结束后仙鹤登场 ---------- */
  function revealGuide(){
    if(G.revealed) return; G.revealed=true;
    guide.classList.add('show');
    buildGamesPanel();
    syncOrbs('paper');            // 游戏按钮预置剪纸展区玩法
    bubble.classList.add('hide'); // 初始状态：只显示右侧知识框，鹤小雅收起（点鹤小雅再开始解说）
  }
  var opening = document.getElementById('opening-overlay');
  if(opening){
    var mo = new MutationObserver(function(){
      if(!opening.classList.contains('show') && opening.classList.contains('leave')){
        mo.disconnect(); setTimeout(revealGuide, 650);
      }
    });
    mo.observe(opening,{attributes:true,attributeFilter:['class']});
    setTimeout(revealGuide, 16000); // 兜底
  }else{
    revealGuide();
  }

  /* ============================================================
     终章 · 传承誓约（钤印 + 鎏金 + 编号，引导用户把非遗传下去）
     ============================================================ */
  var PLEDGE_KEY='lysc_pledge_serial';
  var pledgeBox=$('fn-pledge'), pledgeBtn=$('fn-pledge-btn'), pledgeNum=$('fn-pledge-num');
  function pledgeSerial(){
    try{ return parseInt(localStorage.getItem(PLEDGE_KEY)||'0',10)||0; }catch(e){ return 0; }
  }
  function refreshPledge(){
    if(!pledgeBox) return;
    var n=pledgeSerial();
    if(n>0){ pledgeBox.classList.add('sealed'); }
    else if(pledgeNum){ pledgeNum.textContent='???'; }
  }
  if(pledgeBtn){
    refreshPledge();
    pledgeBtn.onclick=function(){
      if(pledgeBox.classList.contains('sealed')) return;
      var n;
      try{
        n = parseInt(localStorage.getItem(PLEDGE_KEY)||'0',10)||0;
        n = n>0 ? n : 1286 + Math.floor(Math.random()*7000);
        n = n + 1;
        localStorage.setItem(PLEDGE_KEY, String(n));
      }catch(e){ n = 1286 + Math.floor(Math.random()*7000); }
      pledgeNum.textContent = n;
      pledgeBox.classList.add('sealed');
      var gf=$('gold-flash');
      if(gf){ gf.classList.remove('boom'); void gf.offsetWidth; gf.classList.add('boom'); }
      if(typeof showToast==='function') showToast('誓约已钤印 · 传承有我，辽纹不息');
    };
    /* 每次打开终章：若已誓约，保持钤印态 */
    if(typeof window.openFinale==='function'){
      var __openFin = window.openFinale;
      window.openFinale = function(){
        __openFin();
        refreshPledge();
      };
    }
    if(typeof window.closeFinale==='function'){
      var __closeFin = window.closeFinale;
      window.closeFinale = function(){
        __closeFin();
        if(G.revealed && pledgeSerial()>0 && bubble){
          greet.textContent='誓约已钤印，从今往后你就是辽纹传薪人。一剪一影一针线，愿你带走它，也把它讲给更多人听——';
          body.innerHTML='<h4>✦ 传承有我</h4><p>人随艺存，艺随人传。<span class="highlight">非遗不在展柜里</span>，而在每一双愿意接过刻刀、针线与影人的手中。</p><p>把你做的窗花、演的皮影、绣的枕顶分享给身边人吧——<b>你此刻的指尖，就是它的明天。</b></p>';
          foot.innerHTML='<button class="he-fin-cta" id="he-fin-replay" type="button">↺ 再看一遍终章总结</button>';
          var rp=$('he-fin-replay'); if(rp) rp.onclick=function(){ if(typeof openFinale==='function') openFinale(); };
          showBubble();
        }
      };
    }
  }
  console.log('[仙鹤导览员] 鹤小雅已就位 · 三非遗解说/玩法讲解/终章传承');
})();

