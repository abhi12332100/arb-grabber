// ═══════════════════════════════════════
// ARB GRABBER — Complete Code
// ═══════════════════════════════════════

(function(){
  const USER_KEY = 'abhi';
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxX-MEo72dkEC0Gl35yojkREMEx49IWlXajFynWGbLKXsK2kR0GzpQ-NZA-hlg5uGjE/exec';
  const STORAGE_KEY = 'arb_g';
  const EXPIRY_KEY = 'arb_e';
  const EXPIRY_HOURS = 24;
  
  // ─── GRABBED ORDERS ───
  function getGrabbed(){
    try{
      var e = localStorage.getItem(EXPIRY_KEY);
      if(e && Date.now() > parseInt(e)){
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(EXPIRY_KEY);
        return new Set();
      }
      var s = localStorage.getItem(STORAGE_KEY);
      return s ? new Set(JSON.parse(s)) : new Set();
    }catch(e){ return new Set(); }
  }
  
  function saveGrabbed(o){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(o)));
      localStorage.setItem(EXPIRY_KEY, String(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000));
    }catch(e){}
  }
  
  let grabbedOrders = getGrabbed();
  let config = null;
  let f = false, g = false;
  let pt = null;
  
  // ─── TOKEN ───
  function getToken(){
    try{
      var r = localStorage.getItem('token') || sessionStorage.getItem('token');
      if(!r) return null;
      if(r.trim().charAt(0) == '{'){
        var p = JSON.parse(r);
        return p.value || p.token || p.access_token || null;
      }
      return r;
    }catch(e){ return null; }
  }
  
  // ─── UID ───
  function fetchUID(){
    var tk = getToken();
    if(!tk) return Promise.resolve(null);
    return fetch('https://apiweb.arbpay.me/ar-wallet/memberInformation/getCurrentMemberInfo',{
      method: 'GET',
      headers: { 'Authorization': 'Bearer '+tk, 'Content-Type': 'application/json' },
      credentials: 'include'
    }).then(function(r){ return r.json(); }).then(function(d){
      if((d.code == '1' || d.code == 1) && d.data){
        var uid = d.data.memberId || d.data.id || d.data.userId || d.data.uid || '';
        return String(uid);
      }
      return null;
    }).catch(function(){ return null; });
  }
  
  // ─── CONFIG ───
  function loadConfig(){
    return fetchUID().then(function(uid){
      if(!uid) return { blocked: true, reason: 'no_uid', message: 'Login karo' };
      var url = SCRIPT_URL + '?action=config&key=' + encodeURIComponent(USER_KEY) + '&userId=' + encodeURIComponent(uid);
      return fetch(url).then(function(r){ return r.json(); }).then(function(d){
        if(d.blocked || d.error || !d.status) return { blocked: true, reason: 'not_found', message: 'Config nahi mila' };
        config = {
          minAmount: Number(d.minAmount) || 0,
          maxAmount: Number(d.maxAmount) || 0,
          toggleInterval: Number(d.toggleInterval) || 100,
          orderLimit: Number(d.orderLimit) || 12,
          buyBankCode: d.buyBankCode || 'navi'
        };
        return { blocked: false, uid: uid };
      });
    }).catch(function(e){ return { blocked: true, reason: 'error', message: 'Error: '+e.message }; });
  }
  
  // ─── BLOCK WARNING ───
  function showBlock(d){
    var msg = d.message || 'ACCESS DENIED!';
    var extra = '';
    if(d.reason == 'id_mismatch') extra = ' Your UID:'+(d.yourUID||'?')+' Registered:'+(d.registeredUID||'?');
    var w = document.createElement('div');
    w.innerHTML = '<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:999999;display:flex;align-items:center;justify-content:center;padding:15px;font-family:Arial,sans-serif;"><div style="background:#1a0000;border:3px solid #ff0000;border-radius:16px;padding:25px;max-width:90vw;width:380px;text-align:center;color:#fff;"><div style="font-size:50px;">🚫</div><div style="font-size:24px;font-weight:bold;color:#ff0000;">BLOCKED</div><div style="font-size:16px;line-height:1.6;margin:20px 0;color:#ffcccc;">'+msg+extra+'<br><br>🔴 Account FROZEN</div><button id="arb-close-btn" style="background:#ff0000;color:#fff;border:none;padding:14px 40px;font-size:17px;border-radius:8px;cursor:pointer;font-weight:bold;width:100%;">CLOSE</button></div></div>';
    w.className = 'arb-block';
    document.body.appendChild(w);
    document.getElementById('arb-close-btn').onclick = function(){ w.remove(); };
  }
  
  // ─── ORDER GRAB ───
  function grabOrder(o, a, p, t){
    if(grabbedOrders.has(o)) return;
    if(g || f) return;
    g = true; f = true;
    var tk = getToken();
    if(!tk){ g = false; return; }
    
    var today = new Date().toISOString().split('T')[0];
    
    fetch('https://apiweb.arbpay.me/ar-wallet/buyCenter/beforeBuy',{
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer '+tk },
      credentials: 'include',
      body: JSON.stringify({ amount: a, platformOrder: o, payType: p, orderType: t })
    }).then(function(r){ return r.json(); }).then(function(d1){
      if(d1.code != '1' && d1.code != 1 && !d1.success){
        g = false;
        if(d1.code == '1027' && d1.data && d1.data.cashierUrl) window.location.href = d1.data.cashierUrl;
        return;
      }
      return fetch('https://apiweb.arbpay.me/ar-wallet/kycCenter/getBanks/bankListAndBoundListForQuick',{
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer '+tk },
        credentials: 'include',
        body: JSON.stringify({ sourceType: 2, type: 1, platformOrder: o })
      });
    }).then(function(){
      var bankCode = config && config.buyBankCode ? config.buyBankCode : 'navi';
      return fetch('https://apiweb.arbpay.me/ar-wallet/buyCenter/buy',{
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer '+tk },
        credentials: 'include',
        body: JSON.stringify({ amount: a, platformOrder: o, payType: p, orderType: t, buyBankCode: bankCode, buyerKycId: 5216324 })
      });
    }).then(function(r){ return r.json(); }).then(function(d3){
      if(d3.code == '1' || d3.code == 1 || d3.success){
        grabbedOrders.add(o);
        saveGrabbed(grabbedOrders);
        
        var d = document.createElement('div');
        d.innerText = '🎯 ORDER GRABBED! Payment karo, phir refresh!';
        d.style.cssText = 'position:fixed;top:15px;right:15px;background:#000;color:#0f0;padding:18px;z-index:999999;font-size:16px;border-radius:10px;font-weight:bold;border:2px solid #0f0;';
        document.body.appendChild(d);
        
        // ─── LOG TO SHEET ───
        fetchUID().then(function(uid){
          if(uid){
            fetch(SCRIPT_URL + '?action=logOrder&uid=' + uid + '&orderId=' + o + '&date=' + today + '&amount=' + a + '&status=8&utr=').catch(function(){});
          }
        });
        
        if(d3.data && (d3.data.cashierUrl || d3.data.payUrl)){
          setTimeout(function(){ window.location.href = d3.data.cashierUrl || d3.data.payUrl; }, 2000);
        }
      }
    }).catch(function(){ g = false; f = false; });
  }
  
  // ─── FETCH INTERCEPT ───
  var of = window.fetch;
  window.fetch = function(){
    var args = arguments;
    if(f) return of.apply(this, args);
    var url = args[0] ? args[0].toString() : '';
    return of.apply(this, args).then(function(r){
      if(url.includes('buyList') && config){
        var c = r.clone();
        c.json().then(function(d){
          if(d.code == '1' || d.code == 1){
            var list = d.data && d.data.list ? d.data.list : [];
            for(var i = 0; i < list.length; i++){
              var item = list[i];
              var orderId = item.platformOrder;
              var status = item.orderStatus;
              if(status == 'cancel' || status == 'cancelled' || status == '-1' || status == '0') continue;
              if(grabbedOrders.has(orderId)) continue;
              var minAmt = item.minimumAmount || 0;
              var maxAmt = item.maximumAmount || 0;
              if(minAmt >= config.minAmount && maxAmt <= config.maxAmount && orderId){
                grabOrder(orderId, item.amount || minAmt, item.payType || '3', item.orderType || '1');
              }
            }
          }
        }).catch(function(){});
      }
      return r;
    });
  };
  
  // ─── START ───
  function start(){
    loadConfig().then(function(check){
      if(check.blocked){ showBlock(check); return; }
      
      var interval = config.toggleInterval;
      pt = setInterval(function(){
        if(f){ clearInterval(pt); return; }
        var tk = getToken();
        if(!tk) return;
        fetch('https://apiweb.arbpay.me/ar-wallet/buyCenter/buyList',{
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer '+tk },
          credentials: 'include',
          body: JSON.stringify({ orderType: 1, pageNo: 1 })
        });
      }, interval);
      
      var sd = document.createElement('div');
      sd.id = 'arb-status';
      sd.style.cssText = 'position:fixed;bottom:10px;right:10px;background:#000;color:#0f0;padding:10px 14px;z-index:99999;font-family:monospace;border-radius:8px;font-size:13px;border:1px solid #0f0;';
      document.body.appendChild(sd);
      
      setInterval(function(){
        var el = document.getElementById('arb-status');
        if(!el) return;
        if(f){
          el.innerHTML = '🛑 STOPPED<br>✅ Order Grabbed!';
          el.style.background = '#f00';
          el.style.color = '#fff';
          el.style.borderColor = '#f00';
        }else{
          el.innerHTML = '🚀 RUNNING<br>💰 ₹'+config.minAmount+'-'+config.maxAmount+'<br>⏱️ '+interval+'ms<br>📦 Grabbed: '+grabbedOrders.size;
          el.style.background = '#000';
          el.style.color = '#0f0';
          el.style.borderColor = '#0f0';
          el.style.opacity = '0.8';
        }
      }, 500);
    });
  }
  
  start();
  console.log('🚀 ARB Grabber Loaded');
})();