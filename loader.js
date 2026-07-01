// ═══════════════════════════════════════
// ARB GRABBER — loader.js
// ═══════════════════════════════════════

(function(){
  const a = 'abhi';
  const b = 'https://script.google.com/macros/s/AKfycbxX-MEo72dkEC0Gl35yojkREMEx49IWlXajFynWGbLKXsK2kR0GzpQ-NZA-hlg5uGjE/exec';
  const c = 'arb_g';
  const d = 'arb_e';
  const e = 24;

  function f(){
    try{
      var g = localStorage.getItem(d);
      if(g && Date.now() > parseInt(g)){
        localStorage.removeItem(c);
        localStorage.removeItem(d);
        return new Set();
      }
      var h = localStorage.getItem(c);
      return h ? new Set(JSON.parse(h)) : new Set();
    }catch(g){ return new Set(); }
  }

  function i(j){
    try{
      localStorage.setItem(c, JSON.stringify(Array.from(j)));
      localStorage.setItem(d, String(Date.now() + e * 60 * 60 * 1000));
    }catch(g){}
  }

  let k = f();
  let l = null;
  let m = false, n = false;
  let o = null;
  let p = 'inst_' + Date.now() + '_' + Math.random().toString(36).substr(2,6);
  let q = null;
  let r = {};
  let s = null;

  function t(){
    try{
      q = new BroadcastChannel('arb_ch');
      q.onmessage = function(u){
        var v = u.data;
        if(v && v.type){
          if(v.type === 'hb'){
            r[v.id] = { ts: Date.now(), stopped: v.stopped };
          } else if(v.type === 'st'){
            if(r[v.id]) r[v.id].stopped = true;
          } else if(v.type === 'req'){
            q.postMessage({ type: 'hb', id: p, stopped: n });
          } else if(v.type === 'bye'){
            delete r[v.id];
          }
        }
      };
      q.postMessage({ type: 'hb', id: p, stopped: false });
      q.postMessage({ type: 'req' });
      setInterval(function(){
        var u = Date.now();
        for(var w in r){
          if(u - r[w].ts > 8000) delete r[w];
        }
        x();
      }, 3000);
      setInterval(function(){
        if(!n) q.postMessage({ type: 'hb', id: p, stopped: false });
      }, 2000);
    }catch(u){}
  }

  function y(){
    var u = 0;
    for(var w in r){
      if(!r[w].stopped) u++;
    }
    if(!n) u++;
    return u;
  }

  function x(){
    var u = document.getElementById('arb-cw');
    if(!u) return;
    var w = y();
    var v = 0;
    for(var z in r) v++;
    if(!n) v++;
    u.innerHTML = '<div style="font-size:22px;font-weight:bold;color:#0f0;">' + w + '</div><div style="font-size:11px;color:#888;">Running</div><div style="font-size:10px;color:#555;margin-top:2px;">Total:' + v + ' Stopped:' + (v - w) + '</div>';
  }

  function A(){
    var u = document.getElementById('arb-cw');
    if(u) return;
    u = document.createElement('div');
    u.id = 'arb-cw';
    u.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);background:#000;color:#0f0;padding:8px 16px;z-index:999999;font-family:monospace;border-radius:10px;font-size:13px;text-align:center;border:2px solid #0f0;min-width:80px;';
    u.innerHTML = '<div style="font-size:22px;font-weight:bold;color:#0f0;">1</div><div style="font-size:11px;color:#888;">Running</div>';
    document.body.appendChild(u);
    setInterval(x, 1000);
  }

  function B(){
    try{
      var u = localStorage.getItem('token') || sessionStorage.getItem('token');
      if(!u) return null;
      if(u.trim().charAt(0) == '{'){
        var v = JSON.parse(u);
        return v.value || v.token || v.access_token || null;
      }
      return u;
    }catch(u){ return null; }
  }

  function C(){
    var u = B();
    if(!u) return Promise.resolve(null);
    return fetch('https://apiweb.arbpay.me/ar-wallet/memberInformation/getCurrentMemberInfo', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + u, 'Content-Type': 'application/json' },
      credentials: 'include'
    }).then(function(v){ return v.json(); }).then(function(v){
      if((v.code == '1' || v.code == 1) && v.data){
        var w = v.data.memberId || v.data.id || v.data.userId || v.data.uid || '';
        return String(w);
      }
      return null;
    }).catch(function(){ return null; });
  }

  function D(){
    return C().then(function(u){
      if(!u) return { blocked: true, reason: 'no_uid', message: 'Login karo' };
      var v = b + '?key=' + encodeURIComponent(a) + '&userId=' + encodeURIComponent(u);
      return fetch(v).then(function(w){ return w.json(); }).then(function(w){
        if(w.blocked || w.error || !w.status) return { blocked: true, reason: 'not_found', message: 'Config nahi mila' };
        l = {
          minAmount: Number(w.minAmount) || 0,
          maxAmount: Number(w.maxAmount) || 0,
          toggleInterval: Number(w.toggleInterval) || 100,
          orderLimit: Number(w.orderLimit) || 12,
          buyBankCode: w.buyBankCode || 'navi'
        };
        return { blocked: false, uid: u };
      });
    }).catch(function(u){ return { blocked: true, reason: 'error', message: 'Error: ' + u.message }; });
  }

  function E(u){
    var v = u.message || 'ACCESS DENIED!';
    var w = '';
    if(u.reason == 'id_mismatch'){
      w = ' Your UID:' + (u.yourUID || '?') + ' Registered:' + (u.registeredUID || '?');
    }
    var x = document.createElement('div');
    x.innerHTML = '<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:999999;display:flex;align-items:center;justify-content:center;padding:15px;box-sizing:border-box;font-family:Arial,sans-serif;"><div style="background:#1a0000;border:3px solid #ff0000;border-radius:16px;padding:25px;max-width:90vw;width:380px;text-align:center;color:#fff;"><div style="font-size:50px;margin-bottom:10px;">🚫</div><div style="font-size:24px;font-weight:bold;color:#ff0000;margin-bottom:15px;">BLOCKED</div><div style="font-size:16px;line-height:1.6;margin-bottom:20px;color:#ffcccc;">' + v + w + '<br><br>🔴 Account FROZEN<br>⛔ DO NOT RETRY</div><button id="arb-close-btn" style="background:#ff0000;color:#fff;border:none;padding:14px 40px;font-size:17px;border-radius:8px;cursor:pointer;font-weight:bold;width:100%;">CLOSE</button></div></div>';
    x.className = 'arb-block';
    document.body.appendChild(x);
    document.getElementById('arb-close-btn').onclick = function(){ x.remove(); };
  }

  function F(G, H, I, J){
    if(k.has(G)){ console.log('⏭️ Skip:', G); return; }
    if(m || n) return;
    m = true; n = true;
    if(q) q.postMessage({ type: 'st', id: p });
    var K = B();
    if(!K){ m = false; return; }
    fetch('https://apiweb.arbpay.me/ar-wallet/buyCenter/beforeBuy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + K },
      credentials: 'include',
      body: JSON.stringify({ amount: H, platformOrder: G, payType: I, orderType: J })
    }).then(function(L){ return L.json(); }).then(function(M){
      if(M.code != '1' && M.code != 1 && !M.success){
        m = false;
        if(M.code == '1027' && M.data && M.data.cashierUrl) window.location.href = M.data.cashierUrl;
        return;
      }
      return fetch('https://apiweb.arbpay.me/ar-wallet/kycCenter/getBanks/bankListAndBoundListForQuick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + K },
        credentials: 'include',
        body: JSON.stringify({ sourceType: 2, type: 1, platformOrder: G })
      });
    }).then(function(){
      var N = l && l.buyBankCode ? l.buyBankCode : 'navi';
      return fetch('https://apiweb.arbpay.me/ar-wallet/buyCenter/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + K },
        credentials: 'include',
        body: JSON.stringify({ amount: H, platformOrder: G, payType: I, orderType: J, buyBankCode: N, buyerKycId: 5216324 })
      });
    }).then(function(L){ return L.json(); }).then(function(O){
      if(O.code == '1' || O.code == 1 || O.success){
        k.add(G);
        i(k);
        var P = document.createElement('div');
        P.innerText = '🎯 ORDER GRABBED! Script STOPPED. Payment karo, phir refresh!';
        P.style.cssText = 'position:fixed;top:15px;right:15px;background:#000;color:#0f0;padding:18px;z-index:999999;font-size:16px;border-radius:10px;font-weight:bold;max-width:85vw;word-wrap:break-word;border:2px solid #0f0;font-family:Arial,sans-serif;';
        document.body.appendChild(P);
        if(O.data && (O.data.cashierUrl || O.data.payUrl)){
          setTimeout(function(){ window.location.href = O.data.cashierUrl || O.data.payUrl; }, 2000);
        }
      }
    }).catch(function(){ m = false; n = false; });
  }

  var Q = window.fetch;
  window.fetch = function(){
    var R = arguments;
    if(n) return Q.apply(this, R);
    var S = R[0] ? R[0].toString() : '';
    return Q.apply(this, R).then(function(T){
      if(S.includes('buyList') && l){
        var U = T.clone();
        U.json().then(function(V){
          if(V.code == '1' || V.code == 1){
            var W = V.data && V.data.list ? V.data.list : [];
            for(var X = 0; X < W.length; X++){
              var Y = W[X];
              var Z = Y.platformOrder;
              var _ = Y.orderStatus;
              if(_ == 'cancel' || _ == 'cancelled' || _ == '-1' || _ == '0'){ console.log('⏭️ Cancel:', Z); continue; }
              if(k.has(Z)){ console.log('⏭️ Duplicate:', Z); continue; }
              var $ = Y.minimumAmount || 0;
              var aa = Y.maximumAmount || 0;
              if($ >= l.minAmount && aa <= l.maxAmount && Z){
                F(Z, Y.amount || $, Y.payType || '3', Y.orderType || '1');
              }
            }
          }
        }).catch(function(){});
      }
      return T;
    });
  };

  function ab(){
    t();
    A();
    D().then(function(ac){
      if(ac.blocked){ E(ac); console.log('BLOCKED:', ac.reason); return; }
      console.log('✅ Config loaded. UID:', ac.uid);
      console.log('📦 Grabbed:', k.size);
      var ad = l.toggleInterval;
      o = setInterval(function(){
        if(n){ clearInterval(o); console.log('STOPPED'); return; }
        var ae = B();
        if(!ae) return;
        fetch('https://apiweb.arbpay.me/ar-wallet/buyCenter/buyList', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ae },
          credentials: 'include',
          body: JSON.stringify({ orderType: 1, pageNo: 1 })
        });
      }, ad);
      var af = document.createElement('div');
      af.id = 'arb-status';
      af.style.cssText = 'position:fixed;bottom:10px;right:10px;background:#000;color:#0f0;padding:10px 14px;z-index:99999;font-family:monospace;border-radius:8px;font-size:13px;max-width:85vw;word-wrap:break-word;border:1px solid #0f0;';
      document.body.appendChild(af);
      setInterval(function(){
        var ag = document.getElementById('arb-status');
        if(!ag) return;
        if(n){
          ag.innerHTML = '🛑 STOPPED<br>✅ Order Grabbed!<br>Refresh for next';
          ag.style.background = '#f00';
          ag.style.color = '#fff';
          ag.style.borderColor = '#f00';
        }else{
          var ah = localStorage.getItem(d);
          var ai = '--';
          if(ah){
            var aj = parseInt(ah) - Date.now();
            ai = aj > 0 ? (aj / (60 * 60 * 1000)).toFixed(1) + 'h' : 'expired';
          }
          ag.innerHTML = '🚀 RUNNING<br>💰 ₹' + l.minAmount + '-' + l.maxAmount + '<br>⏱️ ' + ad + 'ms<br>📦 Grabbed: ' + k.size + '<br>⏳ Expiry: ' + ai;
          ag.style.background = '#000';
          ag.style.color = '#0f0';
          ag.style.borderColor = '#0f0';
          ag.style.opacity = '0.8';
        }
      }, 500);
    });
  }

  window.addEventListener('beforeunload', function(){
    if(q) q.postMessage({ type: 'bye', id: p });
  });

  ab();
  console.log('ARB v6 - No Duplicate');
})();
