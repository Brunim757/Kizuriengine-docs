
// sidebar: filtrar páginas
(function(){
  var input = document.getElementById('filter');
  if (!input) return;
  var links = Array.prototype.slice.call(document.querySelectorAll('#toc a'));
  input.addEventListener('input', function(){
    var q = input.value.toLowerCase();
    links.forEach(function(a){
      a.style.display = (q === '' || a.textContent.toLowerCase().indexOf(q) !== -1) ? '' : 'none';
    });
  });
})();

// sidebar: destaque por scroll
(function(){
  var links = Array.prototype.slice.call(document.querySelectorAll('#toc a'));
  var heads = Array.prototype.slice.call(document.querySelectorAll('article h2,article h3'));
  if (!heads.length) return;
  function setActive(id){
    links.forEach(function(a){
      a.classList.toggle('active', a.getAttribute('href') === '#' + id || a.getAttribute('href') === location.pathname.split('/').pop());
    });
  }
  function onScroll(){
    var pos = window.scrollY + 90, cur = heads[0].id;
    heads.forEach(function(h){ if (h.offsetTop <= pos) cur = h.id; });
    setActive(cur);
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
})();

// tema claro/escuro
(function(){
  var btn = document.getElementById('themeToggle');
  if (!btn) return;
  var saved = null;
  try { saved = localStorage.getItem('kizuri-theme'); } catch(e) {}
  if (saved === 'light') document.documentElement.dataset.theme = 'light';
  function update(){ btn.textContent = document.documentElement.dataset.theme === 'light' ? '🌙' : '☀️'; }
  update();
  btn.addEventListener('click', function(){
    var light = document.documentElement.dataset.theme === 'light';
    if (light) delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = 'light';
    try { localStorage.setItem('kizuri-theme', light ? 'dark' : 'light'); } catch(e) {}
    update();
  });
})();

// menu mobile
(function(){
  var burger = document.getElementById('burger');
  var overlay = document.getElementById('overlay');
  if (!burger) return;
  burger.addEventListener('click', function(){ document.body.classList.toggle('menu-open'); });
  if (overlay) overlay.addEventListener('click', function(){ document.body.classList.remove('menu-open'); });
})();

// impressão
(function(){
  var b = document.getElementById('printBtn');
  if (b) b.addEventListener('click', function(){ window.print(); });
})();

// copiar código
(function(){
  document.querySelectorAll('.codeblock').forEach(function(blk){
    var btn = blk.querySelector('.copy');
    var code = blk.querySelector('pre code');
    if (!btn || !code) return;
    btn.addEventListener('click', function(){
      navigator.clipboard.writeText(code.textContent).then(function(){
        btn.textContent = '✓';
        btn.classList.add('done');
        setTimeout(function(){ btn.textContent = '📋'; btn.classList.remove('done'); }, 1200);
      });
    });
  });
})();

// destaque de sintaxe
(function(){
  var RULES = {
    csharp: [
      [/\/\/.*|\/\*[\s\S]*?\*\//g, 'tok-com'],
      [/"(?:[^"\\]|\\.)*"/g, 'tok-str'],
      [/\b(?:public|private|protected|internal|static|sealed|abstract|class|struct|interface|enum|namespace|using|new|return|if|else|for|foreach|while|do|var|out|ref|in|override|virtual|readonly|const|this|base|void|int|float|double|bool|string|uint|yield|true|false|null|get|set)\b/g, 'tok-kw'],
      [/\b[A-Z][A-Za-z0-9_]*\b/g, 'tok-cls'],
      [/\b[0-9]+(?:\.[0-9]+)?f?\b/g, 'tok-num']
    ],
    cpp: [
      [/\/\/.*|\/\*[\s\S]*?\*\//g, 'tok-com'],
      [/"(?:[^"\\]|\\.)*"/g, 'tok-str'],
      [/\b(?:struct|class|namespace|using|public|private|static|void|int|float|bool|const|auto|return|new|if|else|for|while)\b/g, 'tok-kw'],
      [/\b[A-Z][A-Za-z0-9_]*\b/g, 'tok-cls'],
      [/\b[0-9]+(?:\.[0-9]+)?f?\b/g, 'tok-num']
    ],
    bash: [
      [/[#][^\n]*/g, 'tok-com'],
      [/"(?:[^"\\]|\\.)*"/g, 'tok-str'],
      [/\b(?:cd|cmake|build|run|preset|ls|mkdir|cp|mv|export|pip|python3)\b/g, 'tok-kw']
    ],
    glsl: [
      [/\/\/.*/g, 'tok-com'],
      [/\b(?:in|out|uniform|layout|vec2|vec3|vec4|mat4|float|int|bool|if|else|for|return|texture|discard)\b/g, 'tok-kw']
    ],
    json: [
      [/"(?:[^"\\]|\\.)*"(?=\s*:)/g, 'tok-kw'],
      [/"(?:[^"\\]|\\.)*"/g, 'tok-str'],
      [/\b-?[0-9.]+f?\b/g, 'tok-num']
    ],
    text: []
  };
  function escHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  document.querySelectorAll('pre code').forEach(function(el){
    var lang = (el.className.match(/language-(\w+)/) || [])[1] || '';
    var rules = RULES[lang] || [];
    if (!rules.length) return;
    var re = new RegExp(rules.map(function(r){ return r[0].source; }).join('|'), 'g');
    var map = rules.map(function(r){ return r[1]; });
    var out = '', last = 0, m;
    while ((m = re.exec(el.textContent)) !== null){
      var cls = '';
      for (var i = 0; i < rules.length; ++i) if (m[i + 1] !== undefined){ cls = map[i]; break; }
      out += escHtml(el.textContent.slice(last, m.index));
      out += '<span class="' + cls + '">' + escHtml(m[0]) + '</span>';
      last = re.lastIndex;
    }
    out += escHtml(el.textContent.slice(last));
    el.innerHTML = out;
  });
})();

// busca
(function(){
  var q = document.getElementById('q');
  var res = document.getElementById('results');
  if (!q || !res || typeof window.SEARCH_INDEX === 'undefined') return;
  function escHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function render(){
    var term = q.value.trim().toLowerCase();
    res.innerHTML = '';
    if (!term) return;
    var hits = 0;
    window.SEARCH_INDEX.forEach(function(page){
      if (!page.s.toLowerCase().includes(term)) return;
      hits++;
      var i = page.s.toLowerCase().indexOf(term);
      var start = Math.max(0, i - 60), len = Math.min(page.s.length - start, 220);
      var ctx = page.s.substr(start, len);
      if (start > 0) ctx = '…' + ctx;
      var d = document.createElement('div');
      d.className = 'hit';
      d.innerHTML = '<a href="' + page.u + '">' + escHtml(page.t) + '</a>' +
        '<span style="color:var(--text-faint);font-size:12px;margin-left:8px">' + escHtml(page.g) + '</span>' +
        '<p>' + ctx.replace(new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>') + '</p>';
      res.appendChild(d);
    });
    if (!hits) res.innerHTML = '<p style="color:var(--text-faint)">Nada encontrado para “' + escHtml(term) + '”.</p>';
  }
  q.addEventListener('input', render);
  var params = new URLSearchParams(location.search);
  if (params.get('q')){ q.value = params.get('q'); render(); }
})();
