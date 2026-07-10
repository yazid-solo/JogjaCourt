function Qc(e,t){for(var n=0;n<t.length;n++){const a=t[n];if(typeof a!="string"&&!Array.isArray(a)){for(const s in a)if(s!=="default"&&!(s in e)){const l=Object.getOwnPropertyDescriptor(a,s);l&&Object.defineProperty(e,s,l.get?l:{enumerable:!0,get:()=>a[s]})}}}return Object.freeze(Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}))}(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))a(s);new MutationObserver(s=>{for(const l of s)if(l.type==="childList")for(const i of l.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&a(i)}).observe(document,{childList:!0,subtree:!0});function n(s){const l={};return s.integrity&&(l.integrity=s.integrity),s.referrerPolicy&&(l.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?l.credentials="include":s.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function a(s){if(s.ep)return;s.ep=!0;const l=n(s);fetch(s.href,l)}})();const qc="http://127.0.0.1:8000";window.addEventListener("error",function(e){const t=document.createElement("div");t.style="position:fixed;top:0;left:0;width:100%;background:red;color:white;z-index:9999;padding:10px;font-size:12px;word-break:break-all;",t.innerText=`JS CRASH: ${e.message} di ${e.filename}:${e.lineno}`,document.body.prepend(t)});window.addEventListener("unhandledrejection",function(e){const t=document.createElement("div");t.style="position:fixed;top:40px;left:0;width:100%;background:darkred;color:white;z-index:9999;padding:10px;font-size:12px;word-break:break-all;",t.innerText=`PROMISE HANG: ${e.reason}`,document.body.prepend(t)});const Yc={async request(e,t={}){const n=`${qc}${e}`,a={"Content-Type":"application/json",...t.headers},s=localStorage.getItem("token");s&&(a.Authorization=`Bearer ${s}`),t.body instanceof FormData&&delete a["Content-Type"];let l;try{l=await fetch(n,{...t,headers:a})}catch{throw new Error("Tidak dapat terhubung ke server. Pastikan backend sudah berjalan (uvicorn app.main:app --reload).")}if(l.status===401){localStorage.removeItem("token"),localStorage.removeItem("user");const o=window.location.pathname.includes("/admin/");throw window.location.href=o?"../login.html":"login.html",new Error("Sesi berakhir. Silakan login ulang.")}if(!l.ok){const o=await l.json().catch(()=>({}));throw new Error(o.detail||`Error ${l.status}: Terjadi kesalahan pada server`)}const i=l.headers.get("content-type");return!i||!i.includes("application/json")?{}:l.json()},async get(e){return this.request(e,{method:"GET"})},async post(e,t){return this.request(e,{method:"POST",body:t instanceof FormData?t:JSON.stringify(t)})},async put(e,t){return this.request(e,{method:"PUT",body:t instanceof FormData?t:JSON.stringify(t)})},async patch(e,t){return this.request(e,{method:"PATCH",body:t instanceof FormData?t:JSON.stringify(t)})},async delete(e){return this.request(e,{method:"DELETE"})}};document.addEventListener("DOMContentLoaded",async()=>{try{const e=await Yc.get("/settings/public");if(!Array.isArray(e))return;let t="",n=!1;e.forEach(s=>{s.key==="maintenance_mode"&&s.value==="true"&&(n=!0),s.key==="global_marquee"&&(t=s.value),s.key==="cs_whatsapp"&&document.querySelectorAll(".cs-whatsapp-target").forEach(l=>{l.textContent=s.value||"-",l.tagName==="A"&&s.value&&(l.href=`https://wa.me/${s.value.replace(/\D/g,"")}`)}),s.key==="cs_email"&&document.querySelectorAll(".cs-email-target").forEach(l=>{l.textContent=s.value||"-",l.tagName==="A"&&s.value&&(l.href=`mailto:${s.value}`)})});const a=window.location.pathname.includes("/admin/");if(n&&!a){document.body.innerHTML=`
                <div style="display:flex; height:100vh; width:100%; align-items:center; justify-content:center; background:#0a0a0a; color:white; font-family:Inter, sans-serif; text-align:center; padding:20px;">
                    <div>
                        <h1 style="color:#D4AF37; font-size:32px; margin-bottom:10px; font-weight:800; tracking:widest;">UNDER MAINTENANCE</h1>
                        <p style="color:#888;">JogjaCourt saat ini sedang dalam pemeliharaan sistem. Silakan kembali beberapa saat lagi.</p>
                        <a href="admin/login.html" style="color:#333; font-size:12px; margin-top:50px; display:inline-block; text-decoration:none;">Admin Login</a>
                    </div>
                </div>
            `;return}if(t&&!a){const s=`
                <div style="background-color: #D4AF37; color: #000; font-weight: 800; font-size: 13px; padding: 6px 0; width: 100%; z-index: 9999; position: relative; text-transform: uppercase; letter-spacing: 1px;">
                    <marquee scrollamount="6">${t}</marquee>
                </div>
            `;document.body.insertAdjacentHTML("afterbegin",s)}}catch(e){console.warn("Could not load global settings:",e)}});const Fe={login:async(e,t,n=!1)=>{const a=new FormData;a.append("username",e),a.append("password",t);const s=n?`${API_BASE_URL}/auth/login?remember=true`:`${API_BASE_URL}/auth/login`,l=await fetch(s,{method:"POST",body:a});if(!l.ok){const o=await l.json().catch(()=>({}));throw new Error(o.detail||"Email atau password salah")}const i=await l.json();return localStorage.setItem("token",i.access_token),localStorage.setItem("user",JSON.stringify(i.user)),i.user},register:async(e,t,n,a=null)=>{const s={name:e,email:t,password:n};return a&&(s.phone=a),await api.post("/auth/register",s)},registerMitra:async(e,t,n,a=null,s=null,l=null)=>{const i={name:e,email:t,password:n};return a&&(i.phone=a),s&&(i.mitra_gor_name=s),l&&(i.mitra_gor_address=l),await api.post("/auth/register/mitra",i)},upgradeMitra:async(e,t)=>{const n={mitra_gor_name:e,mitra_gor_address:t},a=await api.post("/users/me/mitra-request",n);return localStorage.setItem("user",JSON.stringify(a)),a},logout:()=>{localStorage.removeItem("token"),localStorage.removeItem("user");const e=window.location.pathname.includes("/admin/");window.location.href=e?"../login.html":"login.html"},getUser:()=>{try{const e=localStorage.getItem("user");return e?JSON.parse(e):null}catch{return null}},isAuthenticated:()=>!!localStorage.getItem("token")&&!!Fe.getUser(),isSuperAdmin:()=>{const e=Fe.getUser();return e&&e.role==="super_admin"},requireAuth:()=>{if(!Fe.isAuthenticated())throw Fe.logout(),new Error("Not authenticated")},requireRole:e=>{if(!Fe.isAuthenticated())throw Fe.logout(),new Error("Not authenticated");const t=Fe.getUser();if(!t||!e.includes(t.role)){alert("Akses Ditolak! Anda tidak memiliki izin untuk halaman ini.");const n=window.location.pathname.includes("/admin/");throw window.location.href=n?"../index.html":"index.html",new Error("Access denied")}}};document.addEventListener("DOMContentLoaded",()=>{const e=document.getElementById("userMenu"),t=document.getElementById("loginBtn");if(e&&t)if(Fe.isAuthenticated()){t.classList.add("hidden"),e.classList.remove("hidden");const a=Fe.getUser(),s=document.getElementById("userNameDisplay");if(s&&(s.textContent=a.name),a.profile_image){const o=document.querySelectorAll(".nav-avatar-icon"),d=document.querySelectorAll(".nav-avatar-img");o.forEach(c=>c.classList.add("hidden")),d.forEach(c=>{c.src=a.profile_image,c.classList.remove("hidden")})}if(a.role==="admin"||a.role==="super_admin"){const o=document.getElementById("adminLink");o&&o.classList.remove("hidden");const d=document.getElementById("mobileAdminLink");d&&d.classList.remove("hidden"),document.querySelectorAll('a[href="my-bookings.html"]').forEach(c=>c.classList.add("hidden"))}const l=document.getElementById("mobileGuestMenu"),i=document.getElementById("mobileAuthMenu");l&&i&&(l.classList.add("hidden"),i.classList.remove("hidden"))}else t.classList.remove("hidden"),e.classList.add("hidden");document.querySelectorAll("#logoutBtn, .logoutBtn").forEach(a=>{a.addEventListener("click",s=>{s.preventDefault(),Fe.logout()})})});function Xc(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}var bo={exports:{}},pa={},No={exports:{}},T={};/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var sr=Symbol.for("react.element"),Zc=Symbol.for("react.portal"),eu=Symbol.for("react.fragment"),tu=Symbol.for("react.strict_mode"),nu=Symbol.for("react.profiler"),ru=Symbol.for("react.provider"),au=Symbol.for("react.context"),su=Symbol.for("react.forward_ref"),lu=Symbol.for("react.suspense"),iu=Symbol.for("react.memo"),ou=Symbol.for("react.lazy"),ni=Symbol.iterator;function du(e){return e===null||typeof e!="object"?null:(e=ni&&e[ni]||e["@@iterator"],typeof e=="function"?e:null)}var So={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},Co=Object.assign,Eo={};function pn(e,t,n){this.props=e,this.context=t,this.refs=Eo,this.updater=n||So}pn.prototype.isReactComponent={};pn.prototype.setState=function(e,t){if(typeof e!="object"&&typeof e!="function"&&e!=null)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,e,t,"setState")};pn.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,"forceUpdate")};function Lo(){}Lo.prototype=pn.prototype;function al(e,t,n){this.props=e,this.context=t,this.refs=Eo,this.updater=n||So}var sl=al.prototype=new Lo;sl.constructor=al;Co(sl,pn.prototype);sl.isPureReactComponent=!0;var ri=Array.isArray,Bo=Object.prototype.hasOwnProperty,ll={current:null},Io={key:!0,ref:!0,__self:!0,__source:!0};function _o(e,t,n){var a,s={},l=null,i=null;if(t!=null)for(a in t.ref!==void 0&&(i=t.ref),t.key!==void 0&&(l=""+t.key),t)Bo.call(t,a)&&!Io.hasOwnProperty(a)&&(s[a]=t[a]);var o=arguments.length-2;if(o===1)s.children=n;else if(1<o){for(var d=Array(o),c=0;c<o;c++)d[c]=arguments[c+2];s.children=d}if(e&&e.defaultProps)for(a in o=e.defaultProps,o)s[a]===void 0&&(s[a]=o[a]);return{$$typeof:sr,type:e,key:l,ref:i,props:s,_owner:ll.current}}function cu(e,t){return{$$typeof:sr,type:e.type,key:t,ref:e.ref,props:e.props,_owner:e._owner}}function il(e){return typeof e=="object"&&e!==null&&e.$$typeof===sr}function uu(e){var t={"=":"=0",":":"=2"};return"$"+e.replace(/[=:]/g,function(n){return t[n]})}var ai=/\/+/g;function Ma(e,t){return typeof e=="object"&&e!==null&&e.key!=null?uu(""+e.key):t.toString(36)}function Ir(e,t,n,a,s){var l=typeof e;(l==="undefined"||l==="boolean")&&(e=null);var i=!1;if(e===null)i=!0;else switch(l){case"string":case"number":i=!0;break;case"object":switch(e.$$typeof){case sr:case Zc:i=!0}}if(i)return i=e,s=s(i),e=a===""?"."+Ma(i,0):a,ri(s)?(n="",e!=null&&(n=e.replace(ai,"$&/")+"/"),Ir(s,t,n,"",function(c){return c})):s!=null&&(il(s)&&(s=cu(s,n+(!s.key||i&&i.key===s.key?"":(""+s.key).replace(ai,"$&/")+"/")+e)),t.push(s)),1;if(i=0,a=a===""?".":a+":",ri(e))for(var o=0;o<e.length;o++){l=e[o];var d=a+Ma(l,o);i+=Ir(l,t,n,d,s)}else if(d=du(e),typeof d=="function")for(e=d.call(e),o=0;!(l=e.next()).done;)l=l.value,d=a+Ma(l,o++),i+=Ir(l,t,n,d,s);else if(l==="object")throw t=String(e),Error("Objects are not valid as a React child (found: "+(t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t)+"). If you meant to render a collection of children, use an array instead.");return i}function pr(e,t,n){if(e==null)return e;var a=[],s=0;return Ir(e,a,"","",function(l){return t.call(n,l,s++)}),a}function mu(e){if(e._status===-1){var t=e._result;t=t(),t.then(function(n){(e._status===0||e._status===-1)&&(e._status=1,e._result=n)},function(n){(e._status===0||e._status===-1)&&(e._status=2,e._result=n)}),e._status===-1&&(e._status=0,e._result=t)}if(e._status===1)return e._result.default;throw e._result}var ce={current:null},_r={transition:null},pu={ReactCurrentDispatcher:ce,ReactCurrentBatchConfig:_r,ReactCurrentOwner:ll};function To(){throw Error("act(...) is not supported in production builds of React.")}T.Children={map:pr,forEach:function(e,t,n){pr(e,function(){t.apply(this,arguments)},n)},count:function(e){var t=0;return pr(e,function(){t++}),t},toArray:function(e){return pr(e,function(t){return t})||[]},only:function(e){if(!il(e))throw Error("React.Children.only expected to receive a single React element child.");return e}};T.Component=pn;T.Fragment=eu;T.Profiler=nu;T.PureComponent=al;T.StrictMode=tu;T.Suspense=lu;T.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=pu;T.act=To;T.cloneElement=function(e,t,n){if(e==null)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+e+".");var a=Co({},e.props),s=e.key,l=e.ref,i=e._owner;if(t!=null){if(t.ref!==void 0&&(l=t.ref,i=ll.current),t.key!==void 0&&(s=""+t.key),e.type&&e.type.defaultProps)var o=e.type.defaultProps;for(d in t)Bo.call(t,d)&&!Io.hasOwnProperty(d)&&(a[d]=t[d]===void 0&&o!==void 0?o[d]:t[d])}var d=arguments.length-2;if(d===1)a.children=n;else if(1<d){o=Array(d);for(var c=0;c<d;c++)o[c]=arguments[c+2];a.children=o}return{$$typeof:sr,type:e.type,key:s,ref:l,props:a,_owner:i}};T.createContext=function(e){return e={$$typeof:au,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null},e.Provider={$$typeof:ru,_context:e},e.Consumer=e};T.createElement=_o;T.createFactory=function(e){var t=_o.bind(null,e);return t.type=e,t};T.createRef=function(){return{current:null}};T.forwardRef=function(e){return{$$typeof:su,render:e}};T.isValidElement=il;T.lazy=function(e){return{$$typeof:ou,_payload:{_status:-1,_result:e},_init:mu}};T.memo=function(e,t){return{$$typeof:iu,type:e,compare:t===void 0?null:t}};T.startTransition=function(e){var t=_r.transition;_r.transition={};try{e()}finally{_r.transition=t}};T.unstable_act=To;T.useCallback=function(e,t){return ce.current.useCallback(e,t)};T.useContext=function(e){return ce.current.useContext(e)};T.useDebugValue=function(){};T.useDeferredValue=function(e){return ce.current.useDeferredValue(e)};T.useEffect=function(e,t){return ce.current.useEffect(e,t)};T.useId=function(){return ce.current.useId()};T.useImperativeHandle=function(e,t,n){return ce.current.useImperativeHandle(e,t,n)};T.useInsertionEffect=function(e,t){return ce.current.useInsertionEffect(e,t)};T.useLayoutEffect=function(e,t){return ce.current.useLayoutEffect(e,t)};T.useMemo=function(e,t){return ce.current.useMemo(e,t)};T.useReducer=function(e,t,n){return ce.current.useReducer(e,t,n)};T.useRef=function(e){return ce.current.useRef(e)};T.useState=function(e){return ce.current.useState(e)};T.useSyncExternalStore=function(e,t,n){return ce.current.useSyncExternalStore(e,t,n)};T.useTransition=function(){return ce.current.useTransition()};T.version="18.3.1";No.exports=T;var j=No.exports;const Po=Xc(j),fu=Qc({__proto__:null,default:Po},[j]);/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var hu=j,xu=Symbol.for("react.element"),gu=Symbol.for("react.fragment"),vu=Object.prototype.hasOwnProperty,yu=hu.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,wu={key:!0,ref:!0,__self:!0,__source:!0};function Mo(e,t,n){var a,s={},l=null,i=null;n!==void 0&&(l=""+n),t.key!==void 0&&(l=""+t.key),t.ref!==void 0&&(i=t.ref);for(a in t)vu.call(t,a)&&!wu.hasOwnProperty(a)&&(s[a]=t[a]);if(e&&e.defaultProps)for(a in t=e.defaultProps,t)s[a]===void 0&&(s[a]=t[a]);return{$$typeof:xu,type:e,key:l,ref:i,props:s,_owner:yu.current}}pa.Fragment=gu;pa.jsx=Mo;pa.jsxs=Mo;bo.exports=pa;var r=bo.exports,is={},zo={exports:{}},je={},Ao={exports:{}},Ro={};/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */(function(e){function t(C,I){var _=C.length;C.push(I);e:for(;0<_;){var V=_-1>>>1,Y=C[V];if(0<s(Y,I))C[V]=I,C[_]=Y,_=V;else break e}}function n(C){return C.length===0?null:C[0]}function a(C){if(C.length===0)return null;var I=C[0],_=C.pop();if(_!==I){C[0]=_;e:for(var V=0,Y=C.length,ur=Y>>>1;V<ur;){var jt=2*(V+1)-1,Pa=C[jt],bt=jt+1,mr=C[bt];if(0>s(Pa,_))bt<Y&&0>s(mr,Pa)?(C[V]=mr,C[bt]=_,V=bt):(C[V]=Pa,C[jt]=_,V=jt);else if(bt<Y&&0>s(mr,_))C[V]=mr,C[bt]=_,V=bt;else break e}}return I}function s(C,I){var _=C.sortIndex-I.sortIndex;return _!==0?_:C.id-I.id}if(typeof performance=="object"&&typeof performance.now=="function"){var l=performance;e.unstable_now=function(){return l.now()}}else{var i=Date,o=i.now();e.unstable_now=function(){return i.now()-o}}var d=[],c=[],h=1,f=null,x=3,w=!1,y=!1,v=!1,b=typeof setTimeout=="function"?setTimeout:null,m=typeof clearTimeout=="function"?clearTimeout:null,u=typeof setImmediate<"u"?setImmediate:null;typeof navigator<"u"&&navigator.scheduling!==void 0&&navigator.scheduling.isInputPending!==void 0&&navigator.scheduling.isInputPending.bind(navigator.scheduling);function p(C){for(var I=n(c);I!==null;){if(I.callback===null)a(c);else if(I.startTime<=C)a(c),I.sortIndex=I.expirationTime,t(d,I);else break;I=n(c)}}function g(C){if(v=!1,p(C),!y)if(n(d)!==null)y=!0,_a(N);else{var I=n(c);I!==null&&Ta(g,I.startTime-C)}}function N(C,I){y=!1,v&&(v=!1,m(B),B=-1),w=!0;var _=x;try{for(p(I),f=n(d);f!==null&&(!(f.expirationTime>I)||C&&!Ie());){var V=f.callback;if(typeof V=="function"){f.callback=null,x=f.priorityLevel;var Y=V(f.expirationTime<=I);I=e.unstable_now(),typeof Y=="function"?f.callback=Y:f===n(d)&&a(d),p(I)}else a(d);f=n(d)}if(f!==null)var ur=!0;else{var jt=n(c);jt!==null&&Ta(g,jt.startTime-I),ur=!1}return ur}finally{f=null,x=_,w=!1}}var E=!1,L=null,B=-1,H=5,P=-1;function Ie(){return!(e.unstable_now()-P<H)}function gn(){if(L!==null){var C=e.unstable_now();P=C;var I=!0;try{I=L(!0,C)}finally{I?vn():(E=!1,L=null)}}else E=!1}var vn;if(typeof u=="function")vn=function(){u(gn)};else if(typeof MessageChannel<"u"){var ti=new MessageChannel,Kc=ti.port2;ti.port1.onmessage=gn,vn=function(){Kc.postMessage(null)}}else vn=function(){b(gn,0)};function _a(C){L=C,E||(E=!0,vn())}function Ta(C,I){B=b(function(){C(e.unstable_now())},I)}e.unstable_IdlePriority=5,e.unstable_ImmediatePriority=1,e.unstable_LowPriority=4,e.unstable_NormalPriority=3,e.unstable_Profiling=null,e.unstable_UserBlockingPriority=2,e.unstable_cancelCallback=function(C){C.callback=null},e.unstable_continueExecution=function(){y||w||(y=!0,_a(N))},e.unstable_forceFrameRate=function(C){0>C||125<C?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):H=0<C?Math.floor(1e3/C):5},e.unstable_getCurrentPriorityLevel=function(){return x},e.unstable_getFirstCallbackNode=function(){return n(d)},e.unstable_next=function(C){switch(x){case 1:case 2:case 3:var I=3;break;default:I=x}var _=x;x=I;try{return C()}finally{x=_}},e.unstable_pauseExecution=function(){},e.unstable_requestPaint=function(){},e.unstable_runWithPriority=function(C,I){switch(C){case 1:case 2:case 3:case 4:case 5:break;default:C=3}var _=x;x=C;try{return I()}finally{x=_}},e.unstable_scheduleCallback=function(C,I,_){var V=e.unstable_now();switch(typeof _=="object"&&_!==null?(_=_.delay,_=typeof _=="number"&&0<_?V+_:V):_=V,C){case 1:var Y=-1;break;case 2:Y=250;break;case 5:Y=1073741823;break;case 4:Y=1e4;break;default:Y=5e3}return Y=_+Y,C={id:h++,callback:I,priorityLevel:C,startTime:_,expirationTime:Y,sortIndex:-1},_>V?(C.sortIndex=_,t(c,C),n(d)===null&&C===n(c)&&(v?(m(B),B=-1):v=!0,Ta(g,_-V))):(C.sortIndex=Y,t(d,C),y||w||(y=!0,_a(N))),C},e.unstable_shouldYield=Ie,e.unstable_wrapCallback=function(C){var I=x;return function(){var _=x;x=I;try{return C.apply(this,arguments)}finally{x=_}}}})(Ro);Ao.exports=Ro;var ku=Ao.exports;/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var ju=j,ke=ku;function k(e){for(var t="https://reactjs.org/docs/error-decoder.html?invariant="+e,n=1;n<arguments.length;n++)t+="&args[]="+encodeURIComponent(arguments[n]);return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}var Do=new Set,Fn={};function At(e,t){sn(e,t),sn(e+"Capture",t)}function sn(e,t){for(Fn[e]=t,e=0;e<t.length;e++)Do.add(t[e])}var Qe=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),os=Object.prototype.hasOwnProperty,bu=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,si={},li={};function Nu(e){return os.call(li,e)?!0:os.call(si,e)?!1:bu.test(e)?li[e]=!0:(si[e]=!0,!1)}function Su(e,t,n,a){if(n!==null&&n.type===0)return!1;switch(typeof t){case"function":case"symbol":return!0;case"boolean":return a?!1:n!==null?!n.acceptsBooleans:(e=e.toLowerCase().slice(0,5),e!=="data-"&&e!=="aria-");default:return!1}}function Cu(e,t,n,a){if(t===null||typeof t>"u"||Su(e,t,n,a))return!0;if(a)return!1;if(n!==null)switch(n.type){case 3:return!t;case 4:return t===!1;case 5:return isNaN(t);case 6:return isNaN(t)||1>t}return!1}function ue(e,t,n,a,s,l,i){this.acceptsBooleans=t===2||t===3||t===4,this.attributeName=a,this.attributeNamespace=s,this.mustUseProperty=n,this.propertyName=e,this.type=t,this.sanitizeURL=l,this.removeEmptyString=i}var ne={};"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e){ne[e]=new ue(e,0,!1,e,null,!1,!1)});[["acceptCharset","accept-charset"],["className","class"],["htmlFor","for"],["httpEquiv","http-equiv"]].forEach(function(e){var t=e[0];ne[t]=new ue(t,1,!1,e[1],null,!1,!1)});["contentEditable","draggable","spellCheck","value"].forEach(function(e){ne[e]=new ue(e,2,!1,e.toLowerCase(),null,!1,!1)});["autoReverse","externalResourcesRequired","focusable","preserveAlpha"].forEach(function(e){ne[e]=new ue(e,2,!1,e,null,!1,!1)});"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e){ne[e]=new ue(e,3,!1,e.toLowerCase(),null,!1,!1)});["checked","multiple","muted","selected"].forEach(function(e){ne[e]=new ue(e,3,!0,e,null,!1,!1)});["capture","download"].forEach(function(e){ne[e]=new ue(e,4,!1,e,null,!1,!1)});["cols","rows","size","span"].forEach(function(e){ne[e]=new ue(e,6,!1,e,null,!1,!1)});["rowSpan","start"].forEach(function(e){ne[e]=new ue(e,5,!1,e.toLowerCase(),null,!1,!1)});var ol=/[\-:]([a-z])/g;function dl(e){return e[1].toUpperCase()}"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e){var t=e.replace(ol,dl);ne[t]=new ue(t,1,!1,e,null,!1,!1)});"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e){var t=e.replace(ol,dl);ne[t]=new ue(t,1,!1,e,"http://www.w3.org/1999/xlink",!1,!1)});["xml:base","xml:lang","xml:space"].forEach(function(e){var t=e.replace(ol,dl);ne[t]=new ue(t,1,!1,e,"http://www.w3.org/XML/1998/namespace",!1,!1)});["tabIndex","crossOrigin"].forEach(function(e){ne[e]=new ue(e,1,!1,e.toLowerCase(),null,!1,!1)});ne.xlinkHref=new ue("xlinkHref",1,!1,"xlink:href","http://www.w3.org/1999/xlink",!0,!1);["src","href","action","formAction"].forEach(function(e){ne[e]=new ue(e,1,!1,e.toLowerCase(),null,!0,!0)});function cl(e,t,n,a){var s=ne.hasOwnProperty(t)?ne[t]:null;(s!==null?s.type!==0:a||!(2<t.length)||t[0]!=="o"&&t[0]!=="O"||t[1]!=="n"&&t[1]!=="N")&&(Cu(t,n,s,a)&&(n=null),a||s===null?Nu(t)&&(n===null?e.removeAttribute(t):e.setAttribute(t,""+n)):s.mustUseProperty?e[s.propertyName]=n===null?s.type===3?!1:"":n:(t=s.attributeName,a=s.attributeNamespace,n===null?e.removeAttribute(t):(s=s.type,n=s===3||s===4&&n===!0?"":""+n,a?e.setAttributeNS(a,t,n):e.setAttribute(t,n))))}var Ze=ju.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,fr=Symbol.for("react.element"),Ut=Symbol.for("react.portal"),$t=Symbol.for("react.fragment"),ul=Symbol.for("react.strict_mode"),ds=Symbol.for("react.profiler"),Oo=Symbol.for("react.provider"),Fo=Symbol.for("react.context"),ml=Symbol.for("react.forward_ref"),cs=Symbol.for("react.suspense"),us=Symbol.for("react.suspense_list"),pl=Symbol.for("react.memo"),tt=Symbol.for("react.lazy"),Uo=Symbol.for("react.offscreen"),ii=Symbol.iterator;function yn(e){return e===null||typeof e!="object"?null:(e=ii&&e[ii]||e["@@iterator"],typeof e=="function"?e:null)}var $=Object.assign,za;function En(e){if(za===void 0)try{throw Error()}catch(n){var t=n.stack.trim().match(/\n( *(at )?)/);za=t&&t[1]||""}return`
`+za+e}var Aa=!1;function Ra(e,t){if(!e||Aa)return"";Aa=!0;var n=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{if(t)if(t=function(){throw Error()},Object.defineProperty(t.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(t,[])}catch(c){var a=c}Reflect.construct(e,[],t)}else{try{t.call()}catch(c){a=c}e.call(t.prototype)}else{try{throw Error()}catch(c){a=c}e()}}catch(c){if(c&&a&&typeof c.stack=="string"){for(var s=c.stack.split(`
`),l=a.stack.split(`
`),i=s.length-1,o=l.length-1;1<=i&&0<=o&&s[i]!==l[o];)o--;for(;1<=i&&0<=o;i--,o--)if(s[i]!==l[o]){if(i!==1||o!==1)do if(i--,o--,0>o||s[i]!==l[o]){var d=`
`+s[i].replace(" at new "," at ");return e.displayName&&d.includes("<anonymous>")&&(d=d.replace("<anonymous>",e.displayName)),d}while(1<=i&&0<=o);break}}}finally{Aa=!1,Error.prepareStackTrace=n}return(e=e?e.displayName||e.name:"")?En(e):""}function Eu(e){switch(e.tag){case 5:return En(e.type);case 16:return En("Lazy");case 13:return En("Suspense");case 19:return En("SuspenseList");case 0:case 2:case 15:return e=Ra(e.type,!1),e;case 11:return e=Ra(e.type.render,!1),e;case 1:return e=Ra(e.type,!0),e;default:return""}}function ms(e){if(e==null)return null;if(typeof e=="function")return e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case $t:return"Fragment";case Ut:return"Portal";case ds:return"Profiler";case ul:return"StrictMode";case cs:return"Suspense";case us:return"SuspenseList"}if(typeof e=="object")switch(e.$$typeof){case Fo:return(e.displayName||"Context")+".Consumer";case Oo:return(e._context.displayName||"Context")+".Provider";case ml:var t=e.render;return e=e.displayName,e||(e=t.displayName||t.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case pl:return t=e.displayName||null,t!==null?t:ms(e.type)||"Memo";case tt:t=e._payload,e=e._init;try{return ms(e(t))}catch{}}return null}function Lu(e){var t=e.type;switch(e.tag){case 24:return"Cache";case 9:return(t.displayName||"Context")+".Consumer";case 10:return(t._context.displayName||"Context")+".Provider";case 18:return"DehydratedFragment";case 11:return e=t.render,e=e.displayName||e.name||"",t.displayName||(e!==""?"ForwardRef("+e+")":"ForwardRef");case 7:return"Fragment";case 5:return t;case 4:return"Portal";case 3:return"Root";case 6:return"Text";case 16:return ms(t);case 8:return t===ul?"StrictMode":"Mode";case 22:return"Offscreen";case 12:return"Profiler";case 21:return"Scope";case 13:return"Suspense";case 19:return"SuspenseList";case 25:return"TracingMarker";case 1:case 0:case 17:case 2:case 14:case 15:if(typeof t=="function")return t.displayName||t.name||null;if(typeof t=="string")return t}return null}function gt(e){switch(typeof e){case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function $o(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(t==="checkbox"||t==="radio")}function Bu(e){var t=$o(e)?"checked":"value",n=Object.getOwnPropertyDescriptor(e.constructor.prototype,t),a=""+e[t];if(!e.hasOwnProperty(t)&&typeof n<"u"&&typeof n.get=="function"&&typeof n.set=="function"){var s=n.get,l=n.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return s.call(this)},set:function(i){a=""+i,l.call(this,i)}}),Object.defineProperty(e,t,{enumerable:n.enumerable}),{getValue:function(){return a},setValue:function(i){a=""+i},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function hr(e){e._valueTracker||(e._valueTracker=Bu(e))}function Wo(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var n=t.getValue(),a="";return e&&(a=$o(e)?e.checked?"true":"false":e.value),e=a,e!==n?(t.setValue(e),!0):!1}function $r(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}function ps(e,t){var n=t.checked;return $({},t,{defaultChecked:void 0,defaultValue:void 0,value:void 0,checked:n??e._wrapperState.initialChecked})}function oi(e,t){var n=t.defaultValue==null?"":t.defaultValue,a=t.checked!=null?t.checked:t.defaultChecked;n=gt(t.value!=null?t.value:n),e._wrapperState={initialChecked:a,initialValue:n,controlled:t.type==="checkbox"||t.type==="radio"?t.checked!=null:t.value!=null}}function Ho(e,t){t=t.checked,t!=null&&cl(e,"checked",t,!1)}function fs(e,t){Ho(e,t);var n=gt(t.value),a=t.type;if(n!=null)a==="number"?(n===0&&e.value===""||e.value!=n)&&(e.value=""+n):e.value!==""+n&&(e.value=""+n);else if(a==="submit"||a==="reset"){e.removeAttribute("value");return}t.hasOwnProperty("value")?hs(e,t.type,n):t.hasOwnProperty("defaultValue")&&hs(e,t.type,gt(t.defaultValue)),t.checked==null&&t.defaultChecked!=null&&(e.defaultChecked=!!t.defaultChecked)}function di(e,t,n){if(t.hasOwnProperty("value")||t.hasOwnProperty("defaultValue")){var a=t.type;if(!(a!=="submit"&&a!=="reset"||t.value!==void 0&&t.value!==null))return;t=""+e._wrapperState.initialValue,n||t===e.value||(e.value=t),e.defaultValue=t}n=e.name,n!==""&&(e.name=""),e.defaultChecked=!!e._wrapperState.initialChecked,n!==""&&(e.name=n)}function hs(e,t,n){(t!=="number"||$r(e.ownerDocument)!==e)&&(n==null?e.defaultValue=""+e._wrapperState.initialValue:e.defaultValue!==""+n&&(e.defaultValue=""+n))}var Ln=Array.isArray;function Zt(e,t,n,a){if(e=e.options,t){t={};for(var s=0;s<n.length;s++)t["$"+n[s]]=!0;for(n=0;n<e.length;n++)s=t.hasOwnProperty("$"+e[n].value),e[n].selected!==s&&(e[n].selected=s),s&&a&&(e[n].defaultSelected=!0)}else{for(n=""+gt(n),t=null,s=0;s<e.length;s++){if(e[s].value===n){e[s].selected=!0,a&&(e[s].defaultSelected=!0);return}t!==null||e[s].disabled||(t=e[s])}t!==null&&(t.selected=!0)}}function xs(e,t){if(t.dangerouslySetInnerHTML!=null)throw Error(k(91));return $({},t,{value:void 0,defaultValue:void 0,children:""+e._wrapperState.initialValue})}function ci(e,t){var n=t.value;if(n==null){if(n=t.children,t=t.defaultValue,n!=null){if(t!=null)throw Error(k(92));if(Ln(n)){if(1<n.length)throw Error(k(93));n=n[0]}t=n}t==null&&(t=""),n=t}e._wrapperState={initialValue:gt(n)}}function Vo(e,t){var n=gt(t.value),a=gt(t.defaultValue);n!=null&&(n=""+n,n!==e.value&&(e.value=n),t.defaultValue==null&&e.defaultValue!==n&&(e.defaultValue=n)),a!=null&&(e.defaultValue=""+a)}function ui(e){var t=e.textContent;t===e._wrapperState.initialValue&&t!==""&&t!==null&&(e.value=t)}function Go(e){switch(e){case"svg":return"http://www.w3.org/2000/svg";case"math":return"http://www.w3.org/1998/Math/MathML";default:return"http://www.w3.org/1999/xhtml"}}function gs(e,t){return e==null||e==="http://www.w3.org/1999/xhtml"?Go(t):e==="http://www.w3.org/2000/svg"&&t==="foreignObject"?"http://www.w3.org/1999/xhtml":e}var xr,Jo=function(e){return typeof MSApp<"u"&&MSApp.execUnsafeLocalFunction?function(t,n,a,s){MSApp.execUnsafeLocalFunction(function(){return e(t,n,a,s)})}:e}(function(e,t){if(e.namespaceURI!=="http://www.w3.org/2000/svg"||"innerHTML"in e)e.innerHTML=t;else{for(xr=xr||document.createElement("div"),xr.innerHTML="<svg>"+t.valueOf().toString()+"</svg>",t=xr.firstChild;e.firstChild;)e.removeChild(e.firstChild);for(;t.firstChild;)e.appendChild(t.firstChild)}});function Un(e,t){if(t){var n=e.firstChild;if(n&&n===e.lastChild&&n.nodeType===3){n.nodeValue=t;return}}e.textContent=t}var _n={animationIterationCount:!0,aspectRatio:!0,borderImageOutset:!0,borderImageSlice:!0,borderImageWidth:!0,boxFlex:!0,boxFlexGroup:!0,boxOrdinalGroup:!0,columnCount:!0,columns:!0,flex:!0,flexGrow:!0,flexPositive:!0,flexShrink:!0,flexNegative:!0,flexOrder:!0,gridArea:!0,gridRow:!0,gridRowEnd:!0,gridRowSpan:!0,gridRowStart:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnSpan:!0,gridColumnStart:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,tabSize:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeDasharray:!0,strokeDashoffset:!0,strokeMiterlimit:!0,strokeOpacity:!0,strokeWidth:!0},Iu=["Webkit","ms","Moz","O"];Object.keys(_n).forEach(function(e){Iu.forEach(function(t){t=t+e.charAt(0).toUpperCase()+e.substring(1),_n[t]=_n[e]})});function Ko(e,t,n){return t==null||typeof t=="boolean"||t===""?"":n||typeof t!="number"||t===0||_n.hasOwnProperty(e)&&_n[e]?(""+t).trim():t+"px"}function Qo(e,t){e=e.style;for(var n in t)if(t.hasOwnProperty(n)){var a=n.indexOf("--")===0,s=Ko(n,t[n],a);n==="float"&&(n="cssFloat"),a?e.setProperty(n,s):e[n]=s}}var _u=$({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function vs(e,t){if(t){if(_u[e]&&(t.children!=null||t.dangerouslySetInnerHTML!=null))throw Error(k(137,e));if(t.dangerouslySetInnerHTML!=null){if(t.children!=null)throw Error(k(60));if(typeof t.dangerouslySetInnerHTML!="object"||!("__html"in t.dangerouslySetInnerHTML))throw Error(k(61))}if(t.style!=null&&typeof t.style!="object")throw Error(k(62))}}function ys(e,t){if(e.indexOf("-")===-1)return typeof t.is=="string";switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var ws=null;function fl(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var ks=null,en=null,tn=null;function mi(e){if(e=or(e)){if(typeof ks!="function")throw Error(k(280));var t=e.stateNode;t&&(t=va(t),ks(e.stateNode,e.type,t))}}function qo(e){en?tn?tn.push(e):tn=[e]:en=e}function Yo(){if(en){var e=en,t=tn;if(tn=en=null,mi(e),t)for(e=0;e<t.length;e++)mi(t[e])}}function Xo(e,t){return e(t)}function Zo(){}var Da=!1;function ed(e,t,n){if(Da)return e(t,n);Da=!0;try{return Xo(e,t,n)}finally{Da=!1,(en!==null||tn!==null)&&(Zo(),Yo())}}function $n(e,t){var n=e.stateNode;if(n===null)return null;var a=va(n);if(a===null)return null;n=a[t];e:switch(t){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(a=!a.disabled)||(e=e.type,a=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!a;break e;default:e=!1}if(e)return null;if(n&&typeof n!="function")throw Error(k(231,t,typeof n));return n}var js=!1;if(Qe)try{var wn={};Object.defineProperty(wn,"passive",{get:function(){js=!0}}),window.addEventListener("test",wn,wn),window.removeEventListener("test",wn,wn)}catch{js=!1}function Tu(e,t,n,a,s,l,i,o,d){var c=Array.prototype.slice.call(arguments,3);try{t.apply(n,c)}catch(h){this.onError(h)}}var Tn=!1,Wr=null,Hr=!1,bs=null,Pu={onError:function(e){Tn=!0,Wr=e}};function Mu(e,t,n,a,s,l,i,o,d){Tn=!1,Wr=null,Tu.apply(Pu,arguments)}function zu(e,t,n,a,s,l,i,o,d){if(Mu.apply(this,arguments),Tn){if(Tn){var c=Wr;Tn=!1,Wr=null}else throw Error(k(198));Hr||(Hr=!0,bs=c)}}function Rt(e){var t=e,n=e;if(e.alternate)for(;t.return;)t=t.return;else{e=t;do t=e,t.flags&4098&&(n=t.return),e=t.return;while(e)}return t.tag===3?n:null}function td(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function pi(e){if(Rt(e)!==e)throw Error(k(188))}function Au(e){var t=e.alternate;if(!t){if(t=Rt(e),t===null)throw Error(k(188));return t!==e?null:e}for(var n=e,a=t;;){var s=n.return;if(s===null)break;var l=s.alternate;if(l===null){if(a=s.return,a!==null){n=a;continue}break}if(s.child===l.child){for(l=s.child;l;){if(l===n)return pi(s),e;if(l===a)return pi(s),t;l=l.sibling}throw Error(k(188))}if(n.return!==a.return)n=s,a=l;else{for(var i=!1,o=s.child;o;){if(o===n){i=!0,n=s,a=l;break}if(o===a){i=!0,a=s,n=l;break}o=o.sibling}if(!i){for(o=l.child;o;){if(o===n){i=!0,n=l,a=s;break}if(o===a){i=!0,a=l,n=s;break}o=o.sibling}if(!i)throw Error(k(189))}}if(n.alternate!==a)throw Error(k(190))}if(n.tag!==3)throw Error(k(188));return n.stateNode.current===n?e:t}function nd(e){return e=Au(e),e!==null?rd(e):null}function rd(e){if(e.tag===5||e.tag===6)return e;for(e=e.child;e!==null;){var t=rd(e);if(t!==null)return t;e=e.sibling}return null}var ad=ke.unstable_scheduleCallback,fi=ke.unstable_cancelCallback,Ru=ke.unstable_shouldYield,Du=ke.unstable_requestPaint,G=ke.unstable_now,Ou=ke.unstable_getCurrentPriorityLevel,hl=ke.unstable_ImmediatePriority,sd=ke.unstable_UserBlockingPriority,Vr=ke.unstable_NormalPriority,Fu=ke.unstable_LowPriority,ld=ke.unstable_IdlePriority,fa=null,$e=null;function Uu(e){if($e&&typeof $e.onCommitFiberRoot=="function")try{$e.onCommitFiberRoot(fa,e,void 0,(e.current.flags&128)===128)}catch{}}var ze=Math.clz32?Math.clz32:Hu,$u=Math.log,Wu=Math.LN2;function Hu(e){return e>>>=0,e===0?32:31-($u(e)/Wu|0)|0}var gr=64,vr=4194304;function Bn(e){switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return e&4194240;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return e&130023424;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 1073741824;default:return e}}function Gr(e,t){var n=e.pendingLanes;if(n===0)return 0;var a=0,s=e.suspendedLanes,l=e.pingedLanes,i=n&268435455;if(i!==0){var o=i&~s;o!==0?a=Bn(o):(l&=i,l!==0&&(a=Bn(l)))}else i=n&~s,i!==0?a=Bn(i):l!==0&&(a=Bn(l));if(a===0)return 0;if(t!==0&&t!==a&&!(t&s)&&(s=a&-a,l=t&-t,s>=l||s===16&&(l&4194240)!==0))return t;if(a&4&&(a|=n&16),t=e.entangledLanes,t!==0)for(e=e.entanglements,t&=a;0<t;)n=31-ze(t),s=1<<n,a|=e[n],t&=~s;return a}function Vu(e,t){switch(e){case 1:case 2:case 4:return t+250;case 8:case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return-1;case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function Gu(e,t){for(var n=e.suspendedLanes,a=e.pingedLanes,s=e.expirationTimes,l=e.pendingLanes;0<l;){var i=31-ze(l),o=1<<i,d=s[i];d===-1?(!(o&n)||o&a)&&(s[i]=Vu(o,t)):d<=t&&(e.expiredLanes|=o),l&=~o}}function Ns(e){return e=e.pendingLanes&-1073741825,e!==0?e:e&1073741824?1073741824:0}function id(){var e=gr;return gr<<=1,!(gr&4194240)&&(gr=64),e}function Oa(e){for(var t=[],n=0;31>n;n++)t.push(e);return t}function lr(e,t,n){e.pendingLanes|=t,t!==536870912&&(e.suspendedLanes=0,e.pingedLanes=0),e=e.eventTimes,t=31-ze(t),e[t]=n}function Ju(e,t){var n=e.pendingLanes&~t;e.pendingLanes=t,e.suspendedLanes=0,e.pingedLanes=0,e.expiredLanes&=t,e.mutableReadLanes&=t,e.entangledLanes&=t,t=e.entanglements;var a=e.eventTimes;for(e=e.expirationTimes;0<n;){var s=31-ze(n),l=1<<s;t[s]=0,a[s]=-1,e[s]=-1,n&=~l}}function xl(e,t){var n=e.entangledLanes|=t;for(e=e.entanglements;n;){var a=31-ze(n),s=1<<a;s&t|e[a]&t&&(e[a]|=t),n&=~s}}var z=0;function od(e){return e&=-e,1<e?4<e?e&268435455?16:536870912:4:1}var dd,gl,cd,ud,md,Ss=!1,yr=[],ot=null,dt=null,ct=null,Wn=new Map,Hn=new Map,rt=[],Ku="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");function hi(e,t){switch(e){case"focusin":case"focusout":ot=null;break;case"dragenter":case"dragleave":dt=null;break;case"mouseover":case"mouseout":ct=null;break;case"pointerover":case"pointerout":Wn.delete(t.pointerId);break;case"gotpointercapture":case"lostpointercapture":Hn.delete(t.pointerId)}}function kn(e,t,n,a,s,l){return e===null||e.nativeEvent!==l?(e={blockedOn:t,domEventName:n,eventSystemFlags:a,nativeEvent:l,targetContainers:[s]},t!==null&&(t=or(t),t!==null&&gl(t)),e):(e.eventSystemFlags|=a,t=e.targetContainers,s!==null&&t.indexOf(s)===-1&&t.push(s),e)}function Qu(e,t,n,a,s){switch(t){case"focusin":return ot=kn(ot,e,t,n,a,s),!0;case"dragenter":return dt=kn(dt,e,t,n,a,s),!0;case"mouseover":return ct=kn(ct,e,t,n,a,s),!0;case"pointerover":var l=s.pointerId;return Wn.set(l,kn(Wn.get(l)||null,e,t,n,a,s)),!0;case"gotpointercapture":return l=s.pointerId,Hn.set(l,kn(Hn.get(l)||null,e,t,n,a,s)),!0}return!1}function pd(e){var t=Ct(e.target);if(t!==null){var n=Rt(t);if(n!==null){if(t=n.tag,t===13){if(t=td(n),t!==null){e.blockedOn=t,md(e.priority,function(){cd(n)});return}}else if(t===3&&n.stateNode.current.memoizedState.isDehydrated){e.blockedOn=n.tag===3?n.stateNode.containerInfo:null;return}}}e.blockedOn=null}function Tr(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var n=Cs(e.domEventName,e.eventSystemFlags,t[0],e.nativeEvent);if(n===null){n=e.nativeEvent;var a=new n.constructor(n.type,n);ws=a,n.target.dispatchEvent(a),ws=null}else return t=or(n),t!==null&&gl(t),e.blockedOn=n,!1;t.shift()}return!0}function xi(e,t,n){Tr(e)&&n.delete(t)}function qu(){Ss=!1,ot!==null&&Tr(ot)&&(ot=null),dt!==null&&Tr(dt)&&(dt=null),ct!==null&&Tr(ct)&&(ct=null),Wn.forEach(xi),Hn.forEach(xi)}function jn(e,t){e.blockedOn===t&&(e.blockedOn=null,Ss||(Ss=!0,ke.unstable_scheduleCallback(ke.unstable_NormalPriority,qu)))}function Vn(e){function t(s){return jn(s,e)}if(0<yr.length){jn(yr[0],e);for(var n=1;n<yr.length;n++){var a=yr[n];a.blockedOn===e&&(a.blockedOn=null)}}for(ot!==null&&jn(ot,e),dt!==null&&jn(dt,e),ct!==null&&jn(ct,e),Wn.forEach(t),Hn.forEach(t),n=0;n<rt.length;n++)a=rt[n],a.blockedOn===e&&(a.blockedOn=null);for(;0<rt.length&&(n=rt[0],n.blockedOn===null);)pd(n),n.blockedOn===null&&rt.shift()}var nn=Ze.ReactCurrentBatchConfig,Jr=!0;function Yu(e,t,n,a){var s=z,l=nn.transition;nn.transition=null;try{z=1,vl(e,t,n,a)}finally{z=s,nn.transition=l}}function Xu(e,t,n,a){var s=z,l=nn.transition;nn.transition=null;try{z=4,vl(e,t,n,a)}finally{z=s,nn.transition=l}}function vl(e,t,n,a){if(Jr){var s=Cs(e,t,n,a);if(s===null)Qa(e,t,a,Kr,n),hi(e,a);else if(Qu(s,e,t,n,a))a.stopPropagation();else if(hi(e,a),t&4&&-1<Ku.indexOf(e)){for(;s!==null;){var l=or(s);if(l!==null&&dd(l),l=Cs(e,t,n,a),l===null&&Qa(e,t,a,Kr,n),l===s)break;s=l}s!==null&&a.stopPropagation()}else Qa(e,t,a,null,n)}}var Kr=null;function Cs(e,t,n,a){if(Kr=null,e=fl(a),e=Ct(e),e!==null)if(t=Rt(e),t===null)e=null;else if(n=t.tag,n===13){if(e=td(t),e!==null)return e;e=null}else if(n===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null);return Kr=e,null}function fd(e){switch(e){case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 1;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"toggle":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 4;case"message":switch(Ou()){case hl:return 1;case sd:return 4;case Vr:case Fu:return 16;case ld:return 536870912;default:return 16}default:return 16}}var st=null,yl=null,Pr=null;function hd(){if(Pr)return Pr;var e,t=yl,n=t.length,a,s="value"in st?st.value:st.textContent,l=s.length;for(e=0;e<n&&t[e]===s[e];e++);var i=n-e;for(a=1;a<=i&&t[n-a]===s[l-a];a++);return Pr=s.slice(e,1<a?1-a:void 0)}function Mr(e){var t=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function wr(){return!0}function gi(){return!1}function be(e){function t(n,a,s,l,i){this._reactName=n,this._targetInst=s,this.type=a,this.nativeEvent=l,this.target=i,this.currentTarget=null;for(var o in e)e.hasOwnProperty(o)&&(n=e[o],this[o]=n?n(l):l[o]);return this.isDefaultPrevented=(l.defaultPrevented!=null?l.defaultPrevented:l.returnValue===!1)?wr:gi,this.isPropagationStopped=gi,this}return $(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var n=this.nativeEvent;n&&(n.preventDefault?n.preventDefault():typeof n.returnValue!="unknown"&&(n.returnValue=!1),this.isDefaultPrevented=wr)},stopPropagation:function(){var n=this.nativeEvent;n&&(n.stopPropagation?n.stopPropagation():typeof n.cancelBubble!="unknown"&&(n.cancelBubble=!0),this.isPropagationStopped=wr)},persist:function(){},isPersistent:wr}),t}var fn={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},wl=be(fn),ir=$({},fn,{view:0,detail:0}),Zu=be(ir),Fa,Ua,bn,ha=$({},ir,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:kl,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==bn&&(bn&&e.type==="mousemove"?(Fa=e.screenX-bn.screenX,Ua=e.screenY-bn.screenY):Ua=Fa=0,bn=e),Fa)},movementY:function(e){return"movementY"in e?e.movementY:Ua}}),vi=be(ha),em=$({},ha,{dataTransfer:0}),tm=be(em),nm=$({},ir,{relatedTarget:0}),$a=be(nm),rm=$({},fn,{animationName:0,elapsedTime:0,pseudoElement:0}),am=be(rm),sm=$({},fn,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),lm=be(sm),im=$({},fn,{data:0}),yi=be(im),om={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},dm={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},cm={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function um(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=cm[e])?!!t[e]:!1}function kl(){return um}var mm=$({},ir,{key:function(e){if(e.key){var t=om[e.key]||e.key;if(t!=="Unidentified")return t}return e.type==="keypress"?(e=Mr(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?dm[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:kl,charCode:function(e){return e.type==="keypress"?Mr(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?Mr(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),pm=be(mm),fm=$({},ha,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),wi=be(fm),hm=$({},ir,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:kl}),xm=be(hm),gm=$({},fn,{propertyName:0,elapsedTime:0,pseudoElement:0}),vm=be(gm),ym=$({},ha,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),wm=be(ym),km=[9,13,27,32],jl=Qe&&"CompositionEvent"in window,Pn=null;Qe&&"documentMode"in document&&(Pn=document.documentMode);var jm=Qe&&"TextEvent"in window&&!Pn,xd=Qe&&(!jl||Pn&&8<Pn&&11>=Pn),ki=" ",ji=!1;function gd(e,t){switch(e){case"keyup":return km.indexOf(t.keyCode)!==-1;case"keydown":return t.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function vd(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var Wt=!1;function bm(e,t){switch(e){case"compositionend":return vd(t);case"keypress":return t.which!==32?null:(ji=!0,ki);case"textInput":return e=t.data,e===ki&&ji?null:e;default:return null}}function Nm(e,t){if(Wt)return e==="compositionend"||!jl&&gd(e,t)?(e=hd(),Pr=yl=st=null,Wt=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case"compositionend":return xd&&t.locale!=="ko"?null:t.data;default:return null}}var Sm={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function bi(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t==="input"?!!Sm[e.type]:t==="textarea"}function yd(e,t,n,a){qo(a),t=Qr(t,"onChange"),0<t.length&&(n=new wl("onChange","change",null,n,a),e.push({event:n,listeners:t}))}var Mn=null,Gn=null;function Cm(e){Id(e,0)}function xa(e){var t=Gt(e);if(Wo(t))return e}function Em(e,t){if(e==="change")return t}var wd=!1;if(Qe){var Wa;if(Qe){var Ha="oninput"in document;if(!Ha){var Ni=document.createElement("div");Ni.setAttribute("oninput","return;"),Ha=typeof Ni.oninput=="function"}Wa=Ha}else Wa=!1;wd=Wa&&(!document.documentMode||9<document.documentMode)}function Si(){Mn&&(Mn.detachEvent("onpropertychange",kd),Gn=Mn=null)}function kd(e){if(e.propertyName==="value"&&xa(Gn)){var t=[];yd(t,Gn,e,fl(e)),ed(Cm,t)}}function Lm(e,t,n){e==="focusin"?(Si(),Mn=t,Gn=n,Mn.attachEvent("onpropertychange",kd)):e==="focusout"&&Si()}function Bm(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return xa(Gn)}function Im(e,t){if(e==="click")return xa(t)}function _m(e,t){if(e==="input"||e==="change")return xa(t)}function Tm(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var Re=typeof Object.is=="function"?Object.is:Tm;function Jn(e,t){if(Re(e,t))return!0;if(typeof e!="object"||e===null||typeof t!="object"||t===null)return!1;var n=Object.keys(e),a=Object.keys(t);if(n.length!==a.length)return!1;for(a=0;a<n.length;a++){var s=n[a];if(!os.call(t,s)||!Re(e[s],t[s]))return!1}return!0}function Ci(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function Ei(e,t){var n=Ci(e);e=0;for(var a;n;){if(n.nodeType===3){if(a=e+n.textContent.length,e<=t&&a>=t)return{node:n,offset:t-e};e=a}e:{for(;n;){if(n.nextSibling){n=n.nextSibling;break e}n=n.parentNode}n=void 0}n=Ci(n)}}function jd(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?jd(e,t.parentNode):"contains"in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function bd(){for(var e=window,t=$r();t instanceof e.HTMLIFrameElement;){try{var n=typeof t.contentWindow.location.href=="string"}catch{n=!1}if(n)e=t.contentWindow;else break;t=$r(e.document)}return t}function bl(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||t==="textarea"||e.contentEditable==="true")}function Pm(e){var t=bd(),n=e.focusedElem,a=e.selectionRange;if(t!==n&&n&&n.ownerDocument&&jd(n.ownerDocument.documentElement,n)){if(a!==null&&bl(n)){if(t=a.start,e=a.end,e===void 0&&(e=t),"selectionStart"in n)n.selectionStart=t,n.selectionEnd=Math.min(e,n.value.length);else if(e=(t=n.ownerDocument||document)&&t.defaultView||window,e.getSelection){e=e.getSelection();var s=n.textContent.length,l=Math.min(a.start,s);a=a.end===void 0?l:Math.min(a.end,s),!e.extend&&l>a&&(s=a,a=l,l=s),s=Ei(n,l);var i=Ei(n,a);s&&i&&(e.rangeCount!==1||e.anchorNode!==s.node||e.anchorOffset!==s.offset||e.focusNode!==i.node||e.focusOffset!==i.offset)&&(t=t.createRange(),t.setStart(s.node,s.offset),e.removeAllRanges(),l>a?(e.addRange(t),e.extend(i.node,i.offset)):(t.setEnd(i.node,i.offset),e.addRange(t)))}}for(t=[],e=n;e=e.parentNode;)e.nodeType===1&&t.push({element:e,left:e.scrollLeft,top:e.scrollTop});for(typeof n.focus=="function"&&n.focus(),n=0;n<t.length;n++)e=t[n],e.element.scrollLeft=e.left,e.element.scrollTop=e.top}}var Mm=Qe&&"documentMode"in document&&11>=document.documentMode,Ht=null,Es=null,zn=null,Ls=!1;function Li(e,t,n){var a=n.window===n?n.document:n.nodeType===9?n:n.ownerDocument;Ls||Ht==null||Ht!==$r(a)||(a=Ht,"selectionStart"in a&&bl(a)?a={start:a.selectionStart,end:a.selectionEnd}:(a=(a.ownerDocument&&a.ownerDocument.defaultView||window).getSelection(),a={anchorNode:a.anchorNode,anchorOffset:a.anchorOffset,focusNode:a.focusNode,focusOffset:a.focusOffset}),zn&&Jn(zn,a)||(zn=a,a=Qr(Es,"onSelect"),0<a.length&&(t=new wl("onSelect","select",null,t,n),e.push({event:t,listeners:a}),t.target=Ht)))}function kr(e,t){var n={};return n[e.toLowerCase()]=t.toLowerCase(),n["Webkit"+e]="webkit"+t,n["Moz"+e]="moz"+t,n}var Vt={animationend:kr("Animation","AnimationEnd"),animationiteration:kr("Animation","AnimationIteration"),animationstart:kr("Animation","AnimationStart"),transitionend:kr("Transition","TransitionEnd")},Va={},Nd={};Qe&&(Nd=document.createElement("div").style,"AnimationEvent"in window||(delete Vt.animationend.animation,delete Vt.animationiteration.animation,delete Vt.animationstart.animation),"TransitionEvent"in window||delete Vt.transitionend.transition);function ga(e){if(Va[e])return Va[e];if(!Vt[e])return e;var t=Vt[e],n;for(n in t)if(t.hasOwnProperty(n)&&n in Nd)return Va[e]=t[n];return e}var Sd=ga("animationend"),Cd=ga("animationiteration"),Ed=ga("animationstart"),Ld=ga("transitionend"),Bd=new Map,Bi="abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");function yt(e,t){Bd.set(e,t),At(t,[e])}for(var Ga=0;Ga<Bi.length;Ga++){var Ja=Bi[Ga],zm=Ja.toLowerCase(),Am=Ja[0].toUpperCase()+Ja.slice(1);yt(zm,"on"+Am)}yt(Sd,"onAnimationEnd");yt(Cd,"onAnimationIteration");yt(Ed,"onAnimationStart");yt("dblclick","onDoubleClick");yt("focusin","onFocus");yt("focusout","onBlur");yt(Ld,"onTransitionEnd");sn("onMouseEnter",["mouseout","mouseover"]);sn("onMouseLeave",["mouseout","mouseover"]);sn("onPointerEnter",["pointerout","pointerover"]);sn("onPointerLeave",["pointerout","pointerover"]);At("onChange","change click focusin focusout input keydown keyup selectionchange".split(" "));At("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));At("onBeforeInput",["compositionend","keypress","textInput","paste"]);At("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" "));At("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" "));At("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var In="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),Rm=new Set("cancel close invalid load scroll toggle".split(" ").concat(In));function Ii(e,t,n){var a=e.type||"unknown-event";e.currentTarget=n,zu(a,t,void 0,e),e.currentTarget=null}function Id(e,t){t=(t&4)!==0;for(var n=0;n<e.length;n++){var a=e[n],s=a.event;a=a.listeners;e:{var l=void 0;if(t)for(var i=a.length-1;0<=i;i--){var o=a[i],d=o.instance,c=o.currentTarget;if(o=o.listener,d!==l&&s.isPropagationStopped())break e;Ii(s,o,c),l=d}else for(i=0;i<a.length;i++){if(o=a[i],d=o.instance,c=o.currentTarget,o=o.listener,d!==l&&s.isPropagationStopped())break e;Ii(s,o,c),l=d}}}if(Hr)throw e=bs,Hr=!1,bs=null,e}function R(e,t){var n=t[Ps];n===void 0&&(n=t[Ps]=new Set);var a=e+"__bubble";n.has(a)||(_d(t,e,2,!1),n.add(a))}function Ka(e,t,n){var a=0;t&&(a|=4),_d(n,e,a,t)}var jr="_reactListening"+Math.random().toString(36).slice(2);function Kn(e){if(!e[jr]){e[jr]=!0,Do.forEach(function(n){n!=="selectionchange"&&(Rm.has(n)||Ka(n,!1,e),Ka(n,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[jr]||(t[jr]=!0,Ka("selectionchange",!1,t))}}function _d(e,t,n,a){switch(fd(t)){case 1:var s=Yu;break;case 4:s=Xu;break;default:s=vl}n=s.bind(null,t,n,e),s=void 0,!js||t!=="touchstart"&&t!=="touchmove"&&t!=="wheel"||(s=!0),a?s!==void 0?e.addEventListener(t,n,{capture:!0,passive:s}):e.addEventListener(t,n,!0):s!==void 0?e.addEventListener(t,n,{passive:s}):e.addEventListener(t,n,!1)}function Qa(e,t,n,a,s){var l=a;if(!(t&1)&&!(t&2)&&a!==null)e:for(;;){if(a===null)return;var i=a.tag;if(i===3||i===4){var o=a.stateNode.containerInfo;if(o===s||o.nodeType===8&&o.parentNode===s)break;if(i===4)for(i=a.return;i!==null;){var d=i.tag;if((d===3||d===4)&&(d=i.stateNode.containerInfo,d===s||d.nodeType===8&&d.parentNode===s))return;i=i.return}for(;o!==null;){if(i=Ct(o),i===null)return;if(d=i.tag,d===5||d===6){a=l=i;continue e}o=o.parentNode}}a=a.return}ed(function(){var c=l,h=fl(n),f=[];e:{var x=Bd.get(e);if(x!==void 0){var w=wl,y=e;switch(e){case"keypress":if(Mr(n)===0)break e;case"keydown":case"keyup":w=pm;break;case"focusin":y="focus",w=$a;break;case"focusout":y="blur",w=$a;break;case"beforeblur":case"afterblur":w=$a;break;case"click":if(n.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":w=vi;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":w=tm;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":w=xm;break;case Sd:case Cd:case Ed:w=am;break;case Ld:w=vm;break;case"scroll":w=Zu;break;case"wheel":w=wm;break;case"copy":case"cut":case"paste":w=lm;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":w=wi}var v=(t&4)!==0,b=!v&&e==="scroll",m=v?x!==null?x+"Capture":null:x;v=[];for(var u=c,p;u!==null;){p=u;var g=p.stateNode;if(p.tag===5&&g!==null&&(p=g,m!==null&&(g=$n(u,m),g!=null&&v.push(Qn(u,g,p)))),b)break;u=u.return}0<v.length&&(x=new w(x,y,null,n,h),f.push({event:x,listeners:v}))}}if(!(t&7)){e:{if(x=e==="mouseover"||e==="pointerover",w=e==="mouseout"||e==="pointerout",x&&n!==ws&&(y=n.relatedTarget||n.fromElement)&&(Ct(y)||y[qe]))break e;if((w||x)&&(x=h.window===h?h:(x=h.ownerDocument)?x.defaultView||x.parentWindow:window,w?(y=n.relatedTarget||n.toElement,w=c,y=y?Ct(y):null,y!==null&&(b=Rt(y),y!==b||y.tag!==5&&y.tag!==6)&&(y=null)):(w=null,y=c),w!==y)){if(v=vi,g="onMouseLeave",m="onMouseEnter",u="mouse",(e==="pointerout"||e==="pointerover")&&(v=wi,g="onPointerLeave",m="onPointerEnter",u="pointer"),b=w==null?x:Gt(w),p=y==null?x:Gt(y),x=new v(g,u+"leave",w,n,h),x.target=b,x.relatedTarget=p,g=null,Ct(h)===c&&(v=new v(m,u+"enter",y,n,h),v.target=p,v.relatedTarget=b,g=v),b=g,w&&y)t:{for(v=w,m=y,u=0,p=v;p;p=Ft(p))u++;for(p=0,g=m;g;g=Ft(g))p++;for(;0<u-p;)v=Ft(v),u--;for(;0<p-u;)m=Ft(m),p--;for(;u--;){if(v===m||m!==null&&v===m.alternate)break t;v=Ft(v),m=Ft(m)}v=null}else v=null;w!==null&&_i(f,x,w,v,!1),y!==null&&b!==null&&_i(f,b,y,v,!0)}}e:{if(x=c?Gt(c):window,w=x.nodeName&&x.nodeName.toLowerCase(),w==="select"||w==="input"&&x.type==="file")var N=Em;else if(bi(x))if(wd)N=_m;else{N=Bm;var E=Lm}else(w=x.nodeName)&&w.toLowerCase()==="input"&&(x.type==="checkbox"||x.type==="radio")&&(N=Im);if(N&&(N=N(e,c))){yd(f,N,n,h);break e}E&&E(e,x,c),e==="focusout"&&(E=x._wrapperState)&&E.controlled&&x.type==="number"&&hs(x,"number",x.value)}switch(E=c?Gt(c):window,e){case"focusin":(bi(E)||E.contentEditable==="true")&&(Ht=E,Es=c,zn=null);break;case"focusout":zn=Es=Ht=null;break;case"mousedown":Ls=!0;break;case"contextmenu":case"mouseup":case"dragend":Ls=!1,Li(f,n,h);break;case"selectionchange":if(Mm)break;case"keydown":case"keyup":Li(f,n,h)}var L;if(jl)e:{switch(e){case"compositionstart":var B="onCompositionStart";break e;case"compositionend":B="onCompositionEnd";break e;case"compositionupdate":B="onCompositionUpdate";break e}B=void 0}else Wt?gd(e,n)&&(B="onCompositionEnd"):e==="keydown"&&n.keyCode===229&&(B="onCompositionStart");B&&(xd&&n.locale!=="ko"&&(Wt||B!=="onCompositionStart"?B==="onCompositionEnd"&&Wt&&(L=hd()):(st=h,yl="value"in st?st.value:st.textContent,Wt=!0)),E=Qr(c,B),0<E.length&&(B=new yi(B,e,null,n,h),f.push({event:B,listeners:E}),L?B.data=L:(L=vd(n),L!==null&&(B.data=L)))),(L=jm?bm(e,n):Nm(e,n))&&(c=Qr(c,"onBeforeInput"),0<c.length&&(h=new yi("onBeforeInput","beforeinput",null,n,h),f.push({event:h,listeners:c}),h.data=L))}Id(f,t)})}function Qn(e,t,n){return{instance:e,listener:t,currentTarget:n}}function Qr(e,t){for(var n=t+"Capture",a=[];e!==null;){var s=e,l=s.stateNode;s.tag===5&&l!==null&&(s=l,l=$n(e,n),l!=null&&a.unshift(Qn(e,l,s)),l=$n(e,t),l!=null&&a.push(Qn(e,l,s))),e=e.return}return a}function Ft(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5);return e||null}function _i(e,t,n,a,s){for(var l=t._reactName,i=[];n!==null&&n!==a;){var o=n,d=o.alternate,c=o.stateNode;if(d!==null&&d===a)break;o.tag===5&&c!==null&&(o=c,s?(d=$n(n,l),d!=null&&i.unshift(Qn(n,d,o))):s||(d=$n(n,l),d!=null&&i.push(Qn(n,d,o)))),n=n.return}i.length!==0&&e.push({event:t,listeners:i})}var Dm=/\r\n?/g,Om=/\u0000|\uFFFD/g;function Ti(e){return(typeof e=="string"?e:""+e).replace(Dm,`
`).replace(Om,"")}function br(e,t,n){if(t=Ti(t),Ti(e)!==t&&n)throw Error(k(425))}function qr(){}var Bs=null,Is=null;function _s(e,t){return e==="textarea"||e==="noscript"||typeof t.children=="string"||typeof t.children=="number"||typeof t.dangerouslySetInnerHTML=="object"&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var Ts=typeof setTimeout=="function"?setTimeout:void 0,Fm=typeof clearTimeout=="function"?clearTimeout:void 0,Pi=typeof Promise=="function"?Promise:void 0,Um=typeof queueMicrotask=="function"?queueMicrotask:typeof Pi<"u"?function(e){return Pi.resolve(null).then(e).catch($m)}:Ts;function $m(e){setTimeout(function(){throw e})}function qa(e,t){var n=t,a=0;do{var s=n.nextSibling;if(e.removeChild(n),s&&s.nodeType===8)if(n=s.data,n==="/$"){if(a===0){e.removeChild(s),Vn(t);return}a--}else n!=="$"&&n!=="$?"&&n!=="$!"||a++;n=s}while(n);Vn(t)}function ut(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t==="$"||t==="$!"||t==="$?")break;if(t==="/$")return null}}return e}function Mi(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n==="$"||n==="$!"||n==="$?"){if(t===0)return e;t--}else n==="/$"&&t++}e=e.previousSibling}return null}var hn=Math.random().toString(36).slice(2),Ue="__reactFiber$"+hn,qn="__reactProps$"+hn,qe="__reactContainer$"+hn,Ps="__reactEvents$"+hn,Wm="__reactListeners$"+hn,Hm="__reactHandles$"+hn;function Ct(e){var t=e[Ue];if(t)return t;for(var n=e.parentNode;n;){if(t=n[qe]||n[Ue]){if(n=t.alternate,t.child!==null||n!==null&&n.child!==null)for(e=Mi(e);e!==null;){if(n=e[Ue])return n;e=Mi(e)}return t}e=n,n=e.parentNode}return null}function or(e){return e=e[Ue]||e[qe],!e||e.tag!==5&&e.tag!==6&&e.tag!==13&&e.tag!==3?null:e}function Gt(e){if(e.tag===5||e.tag===6)return e.stateNode;throw Error(k(33))}function va(e){return e[qn]||null}var Ms=[],Jt=-1;function wt(e){return{current:e}}function D(e){0>Jt||(e.current=Ms[Jt],Ms[Jt]=null,Jt--)}function A(e,t){Jt++,Ms[Jt]=e.current,e.current=t}var vt={},le=wt(vt),fe=wt(!1),_t=vt;function ln(e,t){var n=e.type.contextTypes;if(!n)return vt;var a=e.stateNode;if(a&&a.__reactInternalMemoizedUnmaskedChildContext===t)return a.__reactInternalMemoizedMaskedChildContext;var s={},l;for(l in n)s[l]=t[l];return a&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=t,e.__reactInternalMemoizedMaskedChildContext=s),s}function he(e){return e=e.childContextTypes,e!=null}function Yr(){D(fe),D(le)}function zi(e,t,n){if(le.current!==vt)throw Error(k(168));A(le,t),A(fe,n)}function Td(e,t,n){var a=e.stateNode;if(t=t.childContextTypes,typeof a.getChildContext!="function")return n;a=a.getChildContext();for(var s in a)if(!(s in t))throw Error(k(108,Lu(e)||"Unknown",s));return $({},n,a)}function Xr(e){return e=(e=e.stateNode)&&e.__reactInternalMemoizedMergedChildContext||vt,_t=le.current,A(le,e),A(fe,fe.current),!0}function Ai(e,t,n){var a=e.stateNode;if(!a)throw Error(k(169));n?(e=Td(e,t,_t),a.__reactInternalMemoizedMergedChildContext=e,D(fe),D(le),A(le,e)):D(fe),A(fe,n)}var Ve=null,ya=!1,Ya=!1;function Pd(e){Ve===null?Ve=[e]:Ve.push(e)}function Vm(e){ya=!0,Pd(e)}function kt(){if(!Ya&&Ve!==null){Ya=!0;var e=0,t=z;try{var n=Ve;for(z=1;e<n.length;e++){var a=n[e];do a=a(!0);while(a!==null)}Ve=null,ya=!1}catch(s){throw Ve!==null&&(Ve=Ve.slice(e+1)),ad(hl,kt),s}finally{z=t,Ya=!1}}return null}var Kt=[],Qt=0,Zr=null,ea=0,Ne=[],Se=0,Tt=null,Ge=1,Je="";function Nt(e,t){Kt[Qt++]=ea,Kt[Qt++]=Zr,Zr=e,ea=t}function Md(e,t,n){Ne[Se++]=Ge,Ne[Se++]=Je,Ne[Se++]=Tt,Tt=e;var a=Ge;e=Je;var s=32-ze(a)-1;a&=~(1<<s),n+=1;var l=32-ze(t)+s;if(30<l){var i=s-s%5;l=(a&(1<<i)-1).toString(32),a>>=i,s-=i,Ge=1<<32-ze(t)+s|n<<s|a,Je=l+e}else Ge=1<<l|n<<s|a,Je=e}function Nl(e){e.return!==null&&(Nt(e,1),Md(e,1,0))}function Sl(e){for(;e===Zr;)Zr=Kt[--Qt],Kt[Qt]=null,ea=Kt[--Qt],Kt[Qt]=null;for(;e===Tt;)Tt=Ne[--Se],Ne[Se]=null,Je=Ne[--Se],Ne[Se]=null,Ge=Ne[--Se],Ne[Se]=null}var we=null,ye=null,O=!1,Me=null;function zd(e,t){var n=Ce(5,null,null,0);n.elementType="DELETED",n.stateNode=t,n.return=e,t=e.deletions,t===null?(e.deletions=[n],e.flags|=16):t.push(n)}function Ri(e,t){switch(e.tag){case 5:var n=e.type;return t=t.nodeType!==1||n.toLowerCase()!==t.nodeName.toLowerCase()?null:t,t!==null?(e.stateNode=t,we=e,ye=ut(t.firstChild),!0):!1;case 6:return t=e.pendingProps===""||t.nodeType!==3?null:t,t!==null?(e.stateNode=t,we=e,ye=null,!0):!1;case 13:return t=t.nodeType!==8?null:t,t!==null?(n=Tt!==null?{id:Ge,overflow:Je}:null,e.memoizedState={dehydrated:t,treeContext:n,retryLane:1073741824},n=Ce(18,null,null,0),n.stateNode=t,n.return=e,e.child=n,we=e,ye=null,!0):!1;default:return!1}}function zs(e){return(e.mode&1)!==0&&(e.flags&128)===0}function As(e){if(O){var t=ye;if(t){var n=t;if(!Ri(e,t)){if(zs(e))throw Error(k(418));t=ut(n.nextSibling);var a=we;t&&Ri(e,t)?zd(a,n):(e.flags=e.flags&-4097|2,O=!1,we=e)}}else{if(zs(e))throw Error(k(418));e.flags=e.flags&-4097|2,O=!1,we=e}}}function Di(e){for(e=e.return;e!==null&&e.tag!==5&&e.tag!==3&&e.tag!==13;)e=e.return;we=e}function Nr(e){if(e!==we)return!1;if(!O)return Di(e),O=!0,!1;var t;if((t=e.tag!==3)&&!(t=e.tag!==5)&&(t=e.type,t=t!=="head"&&t!=="body"&&!_s(e.type,e.memoizedProps)),t&&(t=ye)){if(zs(e))throw Ad(),Error(k(418));for(;t;)zd(e,t),t=ut(t.nextSibling)}if(Di(e),e.tag===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(k(317));e:{for(e=e.nextSibling,t=0;e;){if(e.nodeType===8){var n=e.data;if(n==="/$"){if(t===0){ye=ut(e.nextSibling);break e}t--}else n!=="$"&&n!=="$!"&&n!=="$?"||t++}e=e.nextSibling}ye=null}}else ye=we?ut(e.stateNode.nextSibling):null;return!0}function Ad(){for(var e=ye;e;)e=ut(e.nextSibling)}function on(){ye=we=null,O=!1}function Cl(e){Me===null?Me=[e]:Me.push(e)}var Gm=Ze.ReactCurrentBatchConfig;function Nn(e,t,n){if(e=n.ref,e!==null&&typeof e!="function"&&typeof e!="object"){if(n._owner){if(n=n._owner,n){if(n.tag!==1)throw Error(k(309));var a=n.stateNode}if(!a)throw Error(k(147,e));var s=a,l=""+e;return t!==null&&t.ref!==null&&typeof t.ref=="function"&&t.ref._stringRef===l?t.ref:(t=function(i){var o=s.refs;i===null?delete o[l]:o[l]=i},t._stringRef=l,t)}if(typeof e!="string")throw Error(k(284));if(!n._owner)throw Error(k(290,e))}return e}function Sr(e,t){throw e=Object.prototype.toString.call(t),Error(k(31,e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e))}function Oi(e){var t=e._init;return t(e._payload)}function Rd(e){function t(m,u){if(e){var p=m.deletions;p===null?(m.deletions=[u],m.flags|=16):p.push(u)}}function n(m,u){if(!e)return null;for(;u!==null;)t(m,u),u=u.sibling;return null}function a(m,u){for(m=new Map;u!==null;)u.key!==null?m.set(u.key,u):m.set(u.index,u),u=u.sibling;return m}function s(m,u){return m=ht(m,u),m.index=0,m.sibling=null,m}function l(m,u,p){return m.index=p,e?(p=m.alternate,p!==null?(p=p.index,p<u?(m.flags|=2,u):p):(m.flags|=2,u)):(m.flags|=1048576,u)}function i(m){return e&&m.alternate===null&&(m.flags|=2),m}function o(m,u,p,g){return u===null||u.tag!==6?(u=as(p,m.mode,g),u.return=m,u):(u=s(u,p),u.return=m,u)}function d(m,u,p,g){var N=p.type;return N===$t?h(m,u,p.props.children,g,p.key):u!==null&&(u.elementType===N||typeof N=="object"&&N!==null&&N.$$typeof===tt&&Oi(N)===u.type)?(g=s(u,p.props),g.ref=Nn(m,u,p),g.return=m,g):(g=Ur(p.type,p.key,p.props,null,m.mode,g),g.ref=Nn(m,u,p),g.return=m,g)}function c(m,u,p,g){return u===null||u.tag!==4||u.stateNode.containerInfo!==p.containerInfo||u.stateNode.implementation!==p.implementation?(u=ss(p,m.mode,g),u.return=m,u):(u=s(u,p.children||[]),u.return=m,u)}function h(m,u,p,g,N){return u===null||u.tag!==7?(u=It(p,m.mode,g,N),u.return=m,u):(u=s(u,p),u.return=m,u)}function f(m,u,p){if(typeof u=="string"&&u!==""||typeof u=="number")return u=as(""+u,m.mode,p),u.return=m,u;if(typeof u=="object"&&u!==null){switch(u.$$typeof){case fr:return p=Ur(u.type,u.key,u.props,null,m.mode,p),p.ref=Nn(m,null,u),p.return=m,p;case Ut:return u=ss(u,m.mode,p),u.return=m,u;case tt:var g=u._init;return f(m,g(u._payload),p)}if(Ln(u)||yn(u))return u=It(u,m.mode,p,null),u.return=m,u;Sr(m,u)}return null}function x(m,u,p,g){var N=u!==null?u.key:null;if(typeof p=="string"&&p!==""||typeof p=="number")return N!==null?null:o(m,u,""+p,g);if(typeof p=="object"&&p!==null){switch(p.$$typeof){case fr:return p.key===N?d(m,u,p,g):null;case Ut:return p.key===N?c(m,u,p,g):null;case tt:return N=p._init,x(m,u,N(p._payload),g)}if(Ln(p)||yn(p))return N!==null?null:h(m,u,p,g,null);Sr(m,p)}return null}function w(m,u,p,g,N){if(typeof g=="string"&&g!==""||typeof g=="number")return m=m.get(p)||null,o(u,m,""+g,N);if(typeof g=="object"&&g!==null){switch(g.$$typeof){case fr:return m=m.get(g.key===null?p:g.key)||null,d(u,m,g,N);case Ut:return m=m.get(g.key===null?p:g.key)||null,c(u,m,g,N);case tt:var E=g._init;return w(m,u,p,E(g._payload),N)}if(Ln(g)||yn(g))return m=m.get(p)||null,h(u,m,g,N,null);Sr(u,g)}return null}function y(m,u,p,g){for(var N=null,E=null,L=u,B=u=0,H=null;L!==null&&B<p.length;B++){L.index>B?(H=L,L=null):H=L.sibling;var P=x(m,L,p[B],g);if(P===null){L===null&&(L=H);break}e&&L&&P.alternate===null&&t(m,L),u=l(P,u,B),E===null?N=P:E.sibling=P,E=P,L=H}if(B===p.length)return n(m,L),O&&Nt(m,B),N;if(L===null){for(;B<p.length;B++)L=f(m,p[B],g),L!==null&&(u=l(L,u,B),E===null?N=L:E.sibling=L,E=L);return O&&Nt(m,B),N}for(L=a(m,L);B<p.length;B++)H=w(L,m,B,p[B],g),H!==null&&(e&&H.alternate!==null&&L.delete(H.key===null?B:H.key),u=l(H,u,B),E===null?N=H:E.sibling=H,E=H);return e&&L.forEach(function(Ie){return t(m,Ie)}),O&&Nt(m,B),N}function v(m,u,p,g){var N=yn(p);if(typeof N!="function")throw Error(k(150));if(p=N.call(p),p==null)throw Error(k(151));for(var E=N=null,L=u,B=u=0,H=null,P=p.next();L!==null&&!P.done;B++,P=p.next()){L.index>B?(H=L,L=null):H=L.sibling;var Ie=x(m,L,P.value,g);if(Ie===null){L===null&&(L=H);break}e&&L&&Ie.alternate===null&&t(m,L),u=l(Ie,u,B),E===null?N=Ie:E.sibling=Ie,E=Ie,L=H}if(P.done)return n(m,L),O&&Nt(m,B),N;if(L===null){for(;!P.done;B++,P=p.next())P=f(m,P.value,g),P!==null&&(u=l(P,u,B),E===null?N=P:E.sibling=P,E=P);return O&&Nt(m,B),N}for(L=a(m,L);!P.done;B++,P=p.next())P=w(L,m,B,P.value,g),P!==null&&(e&&P.alternate!==null&&L.delete(P.key===null?B:P.key),u=l(P,u,B),E===null?N=P:E.sibling=P,E=P);return e&&L.forEach(function(gn){return t(m,gn)}),O&&Nt(m,B),N}function b(m,u,p,g){if(typeof p=="object"&&p!==null&&p.type===$t&&p.key===null&&(p=p.props.children),typeof p=="object"&&p!==null){switch(p.$$typeof){case fr:e:{for(var N=p.key,E=u;E!==null;){if(E.key===N){if(N=p.type,N===$t){if(E.tag===7){n(m,E.sibling),u=s(E,p.props.children),u.return=m,m=u;break e}}else if(E.elementType===N||typeof N=="object"&&N!==null&&N.$$typeof===tt&&Oi(N)===E.type){n(m,E.sibling),u=s(E,p.props),u.ref=Nn(m,E,p),u.return=m,m=u;break e}n(m,E);break}else t(m,E);E=E.sibling}p.type===$t?(u=It(p.props.children,m.mode,g,p.key),u.return=m,m=u):(g=Ur(p.type,p.key,p.props,null,m.mode,g),g.ref=Nn(m,u,p),g.return=m,m=g)}return i(m);case Ut:e:{for(E=p.key;u!==null;){if(u.key===E)if(u.tag===4&&u.stateNode.containerInfo===p.containerInfo&&u.stateNode.implementation===p.implementation){n(m,u.sibling),u=s(u,p.children||[]),u.return=m,m=u;break e}else{n(m,u);break}else t(m,u);u=u.sibling}u=ss(p,m.mode,g),u.return=m,m=u}return i(m);case tt:return E=p._init,b(m,u,E(p._payload),g)}if(Ln(p))return y(m,u,p,g);if(yn(p))return v(m,u,p,g);Sr(m,p)}return typeof p=="string"&&p!==""||typeof p=="number"?(p=""+p,u!==null&&u.tag===6?(n(m,u.sibling),u=s(u,p),u.return=m,m=u):(n(m,u),u=as(p,m.mode,g),u.return=m,m=u),i(m)):n(m,u)}return b}var dn=Rd(!0),Dd=Rd(!1),ta=wt(null),na=null,qt=null,El=null;function Ll(){El=qt=na=null}function Bl(e){var t=ta.current;D(ta),e._currentValue=t}function Rs(e,t,n){for(;e!==null;){var a=e.alternate;if((e.childLanes&t)!==t?(e.childLanes|=t,a!==null&&(a.childLanes|=t)):a!==null&&(a.childLanes&t)!==t&&(a.childLanes|=t),e===n)break;e=e.return}}function rn(e,t){na=e,El=qt=null,e=e.dependencies,e!==null&&e.firstContext!==null&&(e.lanes&t&&(pe=!0),e.firstContext=null)}function Le(e){var t=e._currentValue;if(El!==e)if(e={context:e,memoizedValue:t,next:null},qt===null){if(na===null)throw Error(k(308));qt=e,na.dependencies={lanes:0,firstContext:e}}else qt=qt.next=e;return t}var Et=null;function Il(e){Et===null?Et=[e]:Et.push(e)}function Od(e,t,n,a){var s=t.interleaved;return s===null?(n.next=n,Il(t)):(n.next=s.next,s.next=n),t.interleaved=n,Ye(e,a)}function Ye(e,t){e.lanes|=t;var n=e.alternate;for(n!==null&&(n.lanes|=t),n=e,e=e.return;e!==null;)e.childLanes|=t,n=e.alternate,n!==null&&(n.childLanes|=t),n=e,e=e.return;return n.tag===3?n.stateNode:null}var nt=!1;function _l(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,interleaved:null,lanes:0},effects:null}}function Fd(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,effects:e.effects})}function Ke(e,t){return{eventTime:e,lane:t,tag:0,payload:null,callback:null,next:null}}function mt(e,t,n){var a=e.updateQueue;if(a===null)return null;if(a=a.shared,M&2){var s=a.pending;return s===null?t.next=t:(t.next=s.next,s.next=t),a.pending=t,Ye(e,n)}return s=a.interleaved,s===null?(t.next=t,Il(a)):(t.next=s.next,s.next=t),a.interleaved=t,Ye(e,n)}function zr(e,t,n){if(t=t.updateQueue,t!==null&&(t=t.shared,(n&4194240)!==0)){var a=t.lanes;a&=e.pendingLanes,n|=a,t.lanes=n,xl(e,n)}}function Fi(e,t){var n=e.updateQueue,a=e.alternate;if(a!==null&&(a=a.updateQueue,n===a)){var s=null,l=null;if(n=n.firstBaseUpdate,n!==null){do{var i={eventTime:n.eventTime,lane:n.lane,tag:n.tag,payload:n.payload,callback:n.callback,next:null};l===null?s=l=i:l=l.next=i,n=n.next}while(n!==null);l===null?s=l=t:l=l.next=t}else s=l=t;n={baseState:a.baseState,firstBaseUpdate:s,lastBaseUpdate:l,shared:a.shared,effects:a.effects},e.updateQueue=n;return}e=n.lastBaseUpdate,e===null?n.firstBaseUpdate=t:e.next=t,n.lastBaseUpdate=t}function ra(e,t,n,a){var s=e.updateQueue;nt=!1;var l=s.firstBaseUpdate,i=s.lastBaseUpdate,o=s.shared.pending;if(o!==null){s.shared.pending=null;var d=o,c=d.next;d.next=null,i===null?l=c:i.next=c,i=d;var h=e.alternate;h!==null&&(h=h.updateQueue,o=h.lastBaseUpdate,o!==i&&(o===null?h.firstBaseUpdate=c:o.next=c,h.lastBaseUpdate=d))}if(l!==null){var f=s.baseState;i=0,h=c=d=null,o=l;do{var x=o.lane,w=o.eventTime;if((a&x)===x){h!==null&&(h=h.next={eventTime:w,lane:0,tag:o.tag,payload:o.payload,callback:o.callback,next:null});e:{var y=e,v=o;switch(x=t,w=n,v.tag){case 1:if(y=v.payload,typeof y=="function"){f=y.call(w,f,x);break e}f=y;break e;case 3:y.flags=y.flags&-65537|128;case 0:if(y=v.payload,x=typeof y=="function"?y.call(w,f,x):y,x==null)break e;f=$({},f,x);break e;case 2:nt=!0}}o.callback!==null&&o.lane!==0&&(e.flags|=64,x=s.effects,x===null?s.effects=[o]:x.push(o))}else w={eventTime:w,lane:x,tag:o.tag,payload:o.payload,callback:o.callback,next:null},h===null?(c=h=w,d=f):h=h.next=w,i|=x;if(o=o.next,o===null){if(o=s.shared.pending,o===null)break;x=o,o=x.next,x.next=null,s.lastBaseUpdate=x,s.shared.pending=null}}while(!0);if(h===null&&(d=f),s.baseState=d,s.firstBaseUpdate=c,s.lastBaseUpdate=h,t=s.shared.interleaved,t!==null){s=t;do i|=s.lane,s=s.next;while(s!==t)}else l===null&&(s.shared.lanes=0);Mt|=i,e.lanes=i,e.memoizedState=f}}function Ui(e,t,n){if(e=t.effects,t.effects=null,e!==null)for(t=0;t<e.length;t++){var a=e[t],s=a.callback;if(s!==null){if(a.callback=null,a=n,typeof s!="function")throw Error(k(191,s));s.call(a)}}}var dr={},We=wt(dr),Yn=wt(dr),Xn=wt(dr);function Lt(e){if(e===dr)throw Error(k(174));return e}function Tl(e,t){switch(A(Xn,t),A(Yn,e),A(We,dr),e=t.nodeType,e){case 9:case 11:t=(t=t.documentElement)?t.namespaceURI:gs(null,"");break;default:e=e===8?t.parentNode:t,t=e.namespaceURI||null,e=e.tagName,t=gs(t,e)}D(We),A(We,t)}function cn(){D(We),D(Yn),D(Xn)}function Ud(e){Lt(Xn.current);var t=Lt(We.current),n=gs(t,e.type);t!==n&&(A(Yn,e),A(We,n))}function Pl(e){Yn.current===e&&(D(We),D(Yn))}var F=wt(0);function aa(e){for(var t=e;t!==null;){if(t.tag===13){var n=t.memoizedState;if(n!==null&&(n=n.dehydrated,n===null||n.data==="$?"||n.data==="$!"))return t}else if(t.tag===19&&t.memoizedProps.revealOrder!==void 0){if(t.flags&128)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}var Xa=[];function Ml(){for(var e=0;e<Xa.length;e++)Xa[e]._workInProgressVersionPrimary=null;Xa.length=0}var Ar=Ze.ReactCurrentDispatcher,Za=Ze.ReactCurrentBatchConfig,Pt=0,U=null,Q=null,X=null,sa=!1,An=!1,Zn=0,Jm=0;function re(){throw Error(k(321))}function zl(e,t){if(t===null)return!1;for(var n=0;n<t.length&&n<e.length;n++)if(!Re(e[n],t[n]))return!1;return!0}function Al(e,t,n,a,s,l){if(Pt=l,U=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,Ar.current=e===null||e.memoizedState===null?Ym:Xm,e=n(a,s),An){l=0;do{if(An=!1,Zn=0,25<=l)throw Error(k(301));l+=1,X=Q=null,t.updateQueue=null,Ar.current=Zm,e=n(a,s)}while(An)}if(Ar.current=la,t=Q!==null&&Q.next!==null,Pt=0,X=Q=U=null,sa=!1,t)throw Error(k(300));return e}function Rl(){var e=Zn!==0;return Zn=0,e}function Oe(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return X===null?U.memoizedState=X=e:X=X.next=e,X}function Be(){if(Q===null){var e=U.alternate;e=e!==null?e.memoizedState:null}else e=Q.next;var t=X===null?U.memoizedState:X.next;if(t!==null)X=t,Q=e;else{if(e===null)throw Error(k(310));Q=e,e={memoizedState:Q.memoizedState,baseState:Q.baseState,baseQueue:Q.baseQueue,queue:Q.queue,next:null},X===null?U.memoizedState=X=e:X=X.next=e}return X}function er(e,t){return typeof t=="function"?t(e):t}function es(e){var t=Be(),n=t.queue;if(n===null)throw Error(k(311));n.lastRenderedReducer=e;var a=Q,s=a.baseQueue,l=n.pending;if(l!==null){if(s!==null){var i=s.next;s.next=l.next,l.next=i}a.baseQueue=s=l,n.pending=null}if(s!==null){l=s.next,a=a.baseState;var o=i=null,d=null,c=l;do{var h=c.lane;if((Pt&h)===h)d!==null&&(d=d.next={lane:0,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null}),a=c.hasEagerState?c.eagerState:e(a,c.action);else{var f={lane:h,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null};d===null?(o=d=f,i=a):d=d.next=f,U.lanes|=h,Mt|=h}c=c.next}while(c!==null&&c!==l);d===null?i=a:d.next=o,Re(a,t.memoizedState)||(pe=!0),t.memoizedState=a,t.baseState=i,t.baseQueue=d,n.lastRenderedState=a}if(e=n.interleaved,e!==null){s=e;do l=s.lane,U.lanes|=l,Mt|=l,s=s.next;while(s!==e)}else s===null&&(n.lanes=0);return[t.memoizedState,n.dispatch]}function ts(e){var t=Be(),n=t.queue;if(n===null)throw Error(k(311));n.lastRenderedReducer=e;var a=n.dispatch,s=n.pending,l=t.memoizedState;if(s!==null){n.pending=null;var i=s=s.next;do l=e(l,i.action),i=i.next;while(i!==s);Re(l,t.memoizedState)||(pe=!0),t.memoizedState=l,t.baseQueue===null&&(t.baseState=l),n.lastRenderedState=l}return[l,a]}function $d(){}function Wd(e,t){var n=U,a=Be(),s=t(),l=!Re(a.memoizedState,s);if(l&&(a.memoizedState=s,pe=!0),a=a.queue,Dl(Gd.bind(null,n,a,e),[e]),a.getSnapshot!==t||l||X!==null&&X.memoizedState.tag&1){if(n.flags|=2048,tr(9,Vd.bind(null,n,a,s,t),void 0,null),Z===null)throw Error(k(349));Pt&30||Hd(n,t,s)}return s}function Hd(e,t,n){e.flags|=16384,e={getSnapshot:t,value:n},t=U.updateQueue,t===null?(t={lastEffect:null,stores:null},U.updateQueue=t,t.stores=[e]):(n=t.stores,n===null?t.stores=[e]:n.push(e))}function Vd(e,t,n,a){t.value=n,t.getSnapshot=a,Jd(t)&&Kd(e)}function Gd(e,t,n){return n(function(){Jd(t)&&Kd(e)})}function Jd(e){var t=e.getSnapshot;e=e.value;try{var n=t();return!Re(e,n)}catch{return!0}}function Kd(e){var t=Ye(e,1);t!==null&&Ae(t,e,1,-1)}function $i(e){var t=Oe();return typeof e=="function"&&(e=e()),t.memoizedState=t.baseState=e,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:er,lastRenderedState:e},t.queue=e,e=e.dispatch=qm.bind(null,U,e),[t.memoizedState,e]}function tr(e,t,n,a){return e={tag:e,create:t,destroy:n,deps:a,next:null},t=U.updateQueue,t===null?(t={lastEffect:null,stores:null},U.updateQueue=t,t.lastEffect=e.next=e):(n=t.lastEffect,n===null?t.lastEffect=e.next=e:(a=n.next,n.next=e,e.next=a,t.lastEffect=e)),e}function Qd(){return Be().memoizedState}function Rr(e,t,n,a){var s=Oe();U.flags|=e,s.memoizedState=tr(1|t,n,void 0,a===void 0?null:a)}function wa(e,t,n,a){var s=Be();a=a===void 0?null:a;var l=void 0;if(Q!==null){var i=Q.memoizedState;if(l=i.destroy,a!==null&&zl(a,i.deps)){s.memoizedState=tr(t,n,l,a);return}}U.flags|=e,s.memoizedState=tr(1|t,n,l,a)}function Wi(e,t){return Rr(8390656,8,e,t)}function Dl(e,t){return wa(2048,8,e,t)}function qd(e,t){return wa(4,2,e,t)}function Yd(e,t){return wa(4,4,e,t)}function Xd(e,t){if(typeof t=="function")return e=e(),t(e),function(){t(null)};if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function Zd(e,t,n){return n=n!=null?n.concat([e]):null,wa(4,4,Xd.bind(null,t,e),n)}function Ol(){}function ec(e,t){var n=Be();t=t===void 0?null:t;var a=n.memoizedState;return a!==null&&t!==null&&zl(t,a[1])?a[0]:(n.memoizedState=[e,t],e)}function tc(e,t){var n=Be();t=t===void 0?null:t;var a=n.memoizedState;return a!==null&&t!==null&&zl(t,a[1])?a[0]:(e=e(),n.memoizedState=[e,t],e)}function nc(e,t,n){return Pt&21?(Re(n,t)||(n=id(),U.lanes|=n,Mt|=n,e.baseState=!0),t):(e.baseState&&(e.baseState=!1,pe=!0),e.memoizedState=n)}function Km(e,t){var n=z;z=n!==0&&4>n?n:4,e(!0);var a=Za.transition;Za.transition={};try{e(!1),t()}finally{z=n,Za.transition=a}}function rc(){return Be().memoizedState}function Qm(e,t,n){var a=ft(e);if(n={lane:a,action:n,hasEagerState:!1,eagerState:null,next:null},ac(e))sc(t,n);else if(n=Od(e,t,n,a),n!==null){var s=de();Ae(n,e,a,s),lc(n,t,a)}}function qm(e,t,n){var a=ft(e),s={lane:a,action:n,hasEagerState:!1,eagerState:null,next:null};if(ac(e))sc(t,s);else{var l=e.alternate;if(e.lanes===0&&(l===null||l.lanes===0)&&(l=t.lastRenderedReducer,l!==null))try{var i=t.lastRenderedState,o=l(i,n);if(s.hasEagerState=!0,s.eagerState=o,Re(o,i)){var d=t.interleaved;d===null?(s.next=s,Il(t)):(s.next=d.next,d.next=s),t.interleaved=s;return}}catch{}finally{}n=Od(e,t,s,a),n!==null&&(s=de(),Ae(n,e,a,s),lc(n,t,a))}}function ac(e){var t=e.alternate;return e===U||t!==null&&t===U}function sc(e,t){An=sa=!0;var n=e.pending;n===null?t.next=t:(t.next=n.next,n.next=t),e.pending=t}function lc(e,t,n){if(n&4194240){var a=t.lanes;a&=e.pendingLanes,n|=a,t.lanes=n,xl(e,n)}}var la={readContext:Le,useCallback:re,useContext:re,useEffect:re,useImperativeHandle:re,useInsertionEffect:re,useLayoutEffect:re,useMemo:re,useReducer:re,useRef:re,useState:re,useDebugValue:re,useDeferredValue:re,useTransition:re,useMutableSource:re,useSyncExternalStore:re,useId:re,unstable_isNewReconciler:!1},Ym={readContext:Le,useCallback:function(e,t){return Oe().memoizedState=[e,t===void 0?null:t],e},useContext:Le,useEffect:Wi,useImperativeHandle:function(e,t,n){return n=n!=null?n.concat([e]):null,Rr(4194308,4,Xd.bind(null,t,e),n)},useLayoutEffect:function(e,t){return Rr(4194308,4,e,t)},useInsertionEffect:function(e,t){return Rr(4,2,e,t)},useMemo:function(e,t){var n=Oe();return t=t===void 0?null:t,e=e(),n.memoizedState=[e,t],e},useReducer:function(e,t,n){var a=Oe();return t=n!==void 0?n(t):t,a.memoizedState=a.baseState=t,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:t},a.queue=e,e=e.dispatch=Qm.bind(null,U,e),[a.memoizedState,e]},useRef:function(e){var t=Oe();return e={current:e},t.memoizedState=e},useState:$i,useDebugValue:Ol,useDeferredValue:function(e){return Oe().memoizedState=e},useTransition:function(){var e=$i(!1),t=e[0];return e=Km.bind(null,e[1]),Oe().memoizedState=e,[t,e]},useMutableSource:function(){},useSyncExternalStore:function(e,t,n){var a=U,s=Oe();if(O){if(n===void 0)throw Error(k(407));n=n()}else{if(n=t(),Z===null)throw Error(k(349));Pt&30||Hd(a,t,n)}s.memoizedState=n;var l={value:n,getSnapshot:t};return s.queue=l,Wi(Gd.bind(null,a,l,e),[e]),a.flags|=2048,tr(9,Vd.bind(null,a,l,n,t),void 0,null),n},useId:function(){var e=Oe(),t=Z.identifierPrefix;if(O){var n=Je,a=Ge;n=(a&~(1<<32-ze(a)-1)).toString(32)+n,t=":"+t+"R"+n,n=Zn++,0<n&&(t+="H"+n.toString(32)),t+=":"}else n=Jm++,t=":"+t+"r"+n.toString(32)+":";return e.memoizedState=t},unstable_isNewReconciler:!1},Xm={readContext:Le,useCallback:ec,useContext:Le,useEffect:Dl,useImperativeHandle:Zd,useInsertionEffect:qd,useLayoutEffect:Yd,useMemo:tc,useReducer:es,useRef:Qd,useState:function(){return es(er)},useDebugValue:Ol,useDeferredValue:function(e){var t=Be();return nc(t,Q.memoizedState,e)},useTransition:function(){var e=es(er)[0],t=Be().memoizedState;return[e,t]},useMutableSource:$d,useSyncExternalStore:Wd,useId:rc,unstable_isNewReconciler:!1},Zm={readContext:Le,useCallback:ec,useContext:Le,useEffect:Dl,useImperativeHandle:Zd,useInsertionEffect:qd,useLayoutEffect:Yd,useMemo:tc,useReducer:ts,useRef:Qd,useState:function(){return ts(er)},useDebugValue:Ol,useDeferredValue:function(e){var t=Be();return Q===null?t.memoizedState=e:nc(t,Q.memoizedState,e)},useTransition:function(){var e=ts(er)[0],t=Be().memoizedState;return[e,t]},useMutableSource:$d,useSyncExternalStore:Wd,useId:rc,unstable_isNewReconciler:!1};function Te(e,t){if(e&&e.defaultProps){t=$({},t),e=e.defaultProps;for(var n in e)t[n]===void 0&&(t[n]=e[n]);return t}return t}function Ds(e,t,n,a){t=e.memoizedState,n=n(a,t),n=n==null?t:$({},t,n),e.memoizedState=n,e.lanes===0&&(e.updateQueue.baseState=n)}var ka={isMounted:function(e){return(e=e._reactInternals)?Rt(e)===e:!1},enqueueSetState:function(e,t,n){e=e._reactInternals;var a=de(),s=ft(e),l=Ke(a,s);l.payload=t,n!=null&&(l.callback=n),t=mt(e,l,s),t!==null&&(Ae(t,e,s,a),zr(t,e,s))},enqueueReplaceState:function(e,t,n){e=e._reactInternals;var a=de(),s=ft(e),l=Ke(a,s);l.tag=1,l.payload=t,n!=null&&(l.callback=n),t=mt(e,l,s),t!==null&&(Ae(t,e,s,a),zr(t,e,s))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var n=de(),a=ft(e),s=Ke(n,a);s.tag=2,t!=null&&(s.callback=t),t=mt(e,s,a),t!==null&&(Ae(t,e,a,n),zr(t,e,a))}};function Hi(e,t,n,a,s,l,i){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(a,l,i):t.prototype&&t.prototype.isPureReactComponent?!Jn(n,a)||!Jn(s,l):!0}function ic(e,t,n){var a=!1,s=vt,l=t.contextType;return typeof l=="object"&&l!==null?l=Le(l):(s=he(t)?_t:le.current,a=t.contextTypes,l=(a=a!=null)?ln(e,s):vt),t=new t(n,l),e.memoizedState=t.state!==null&&t.state!==void 0?t.state:null,t.updater=ka,e.stateNode=t,t._reactInternals=e,a&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=s,e.__reactInternalMemoizedMaskedChildContext=l),t}function Vi(e,t,n,a){e=t.state,typeof t.componentWillReceiveProps=="function"&&t.componentWillReceiveProps(n,a),typeof t.UNSAFE_componentWillReceiveProps=="function"&&t.UNSAFE_componentWillReceiveProps(n,a),t.state!==e&&ka.enqueueReplaceState(t,t.state,null)}function Os(e,t,n,a){var s=e.stateNode;s.props=n,s.state=e.memoizedState,s.refs={},_l(e);var l=t.contextType;typeof l=="object"&&l!==null?s.context=Le(l):(l=he(t)?_t:le.current,s.context=ln(e,l)),s.state=e.memoizedState,l=t.getDerivedStateFromProps,typeof l=="function"&&(Ds(e,t,l,n),s.state=e.memoizedState),typeof t.getDerivedStateFromProps=="function"||typeof s.getSnapshotBeforeUpdate=="function"||typeof s.UNSAFE_componentWillMount!="function"&&typeof s.componentWillMount!="function"||(t=s.state,typeof s.componentWillMount=="function"&&s.componentWillMount(),typeof s.UNSAFE_componentWillMount=="function"&&s.UNSAFE_componentWillMount(),t!==s.state&&ka.enqueueReplaceState(s,s.state,null),ra(e,n,s,a),s.state=e.memoizedState),typeof s.componentDidMount=="function"&&(e.flags|=4194308)}function un(e,t){try{var n="",a=t;do n+=Eu(a),a=a.return;while(a);var s=n}catch(l){s=`
Error generating stack: `+l.message+`
`+l.stack}return{value:e,source:t,stack:s,digest:null}}function ns(e,t,n){return{value:e,source:null,stack:n??null,digest:t??null}}function Fs(e,t){try{console.error(t.value)}catch(n){setTimeout(function(){throw n})}}var ep=typeof WeakMap=="function"?WeakMap:Map;function oc(e,t,n){n=Ke(-1,n),n.tag=3,n.payload={element:null};var a=t.value;return n.callback=function(){oa||(oa=!0,qs=a),Fs(e,t)},n}function dc(e,t,n){n=Ke(-1,n),n.tag=3;var a=e.type.getDerivedStateFromError;if(typeof a=="function"){var s=t.value;n.payload=function(){return a(s)},n.callback=function(){Fs(e,t)}}var l=e.stateNode;return l!==null&&typeof l.componentDidCatch=="function"&&(n.callback=function(){Fs(e,t),typeof a!="function"&&(pt===null?pt=new Set([this]):pt.add(this));var i=t.stack;this.componentDidCatch(t.value,{componentStack:i!==null?i:""})}),n}function Gi(e,t,n){var a=e.pingCache;if(a===null){a=e.pingCache=new ep;var s=new Set;a.set(t,s)}else s=a.get(t),s===void 0&&(s=new Set,a.set(t,s));s.has(n)||(s.add(n),e=fp.bind(null,e,t,n),t.then(e,e))}function Ji(e){do{var t;if((t=e.tag===13)&&(t=e.memoizedState,t=t!==null?t.dehydrated!==null:!0),t)return e;e=e.return}while(e!==null);return null}function Ki(e,t,n,a,s){return e.mode&1?(e.flags|=65536,e.lanes=s,e):(e===t?e.flags|=65536:(e.flags|=128,n.flags|=131072,n.flags&=-52805,n.tag===1&&(n.alternate===null?n.tag=17:(t=Ke(-1,1),t.tag=2,mt(n,t,1))),n.lanes|=1),e)}var tp=Ze.ReactCurrentOwner,pe=!1;function oe(e,t,n,a){t.child=e===null?Dd(t,null,n,a):dn(t,e.child,n,a)}function Qi(e,t,n,a,s){n=n.render;var l=t.ref;return rn(t,s),a=Al(e,t,n,a,l,s),n=Rl(),e!==null&&!pe?(t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~s,Xe(e,t,s)):(O&&n&&Nl(t),t.flags|=1,oe(e,t,a,s),t.child)}function qi(e,t,n,a,s){if(e===null){var l=n.type;return typeof l=="function"&&!Jl(l)&&l.defaultProps===void 0&&n.compare===null&&n.defaultProps===void 0?(t.tag=15,t.type=l,cc(e,t,l,a,s)):(e=Ur(n.type,null,a,t,t.mode,s),e.ref=t.ref,e.return=t,t.child=e)}if(l=e.child,!(e.lanes&s)){var i=l.memoizedProps;if(n=n.compare,n=n!==null?n:Jn,n(i,a)&&e.ref===t.ref)return Xe(e,t,s)}return t.flags|=1,e=ht(l,a),e.ref=t.ref,e.return=t,t.child=e}function cc(e,t,n,a,s){if(e!==null){var l=e.memoizedProps;if(Jn(l,a)&&e.ref===t.ref)if(pe=!1,t.pendingProps=a=l,(e.lanes&s)!==0)e.flags&131072&&(pe=!0);else return t.lanes=e.lanes,Xe(e,t,s)}return Us(e,t,n,a,s)}function uc(e,t,n){var a=t.pendingProps,s=a.children,l=e!==null?e.memoizedState:null;if(a.mode==="hidden")if(!(t.mode&1))t.memoizedState={baseLanes:0,cachePool:null,transitions:null},A(Xt,ve),ve|=n;else{if(!(n&1073741824))return e=l!==null?l.baseLanes|n:n,t.lanes=t.childLanes=1073741824,t.memoizedState={baseLanes:e,cachePool:null,transitions:null},t.updateQueue=null,A(Xt,ve),ve|=e,null;t.memoizedState={baseLanes:0,cachePool:null,transitions:null},a=l!==null?l.baseLanes:n,A(Xt,ve),ve|=a}else l!==null?(a=l.baseLanes|n,t.memoizedState=null):a=n,A(Xt,ve),ve|=a;return oe(e,t,s,n),t.child}function mc(e,t){var n=t.ref;(e===null&&n!==null||e!==null&&e.ref!==n)&&(t.flags|=512,t.flags|=2097152)}function Us(e,t,n,a,s){var l=he(n)?_t:le.current;return l=ln(t,l),rn(t,s),n=Al(e,t,n,a,l,s),a=Rl(),e!==null&&!pe?(t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~s,Xe(e,t,s)):(O&&a&&Nl(t),t.flags|=1,oe(e,t,n,s),t.child)}function Yi(e,t,n,a,s){if(he(n)){var l=!0;Xr(t)}else l=!1;if(rn(t,s),t.stateNode===null)Dr(e,t),ic(t,n,a),Os(t,n,a,s),a=!0;else if(e===null){var i=t.stateNode,o=t.memoizedProps;i.props=o;var d=i.context,c=n.contextType;typeof c=="object"&&c!==null?c=Le(c):(c=he(n)?_t:le.current,c=ln(t,c));var h=n.getDerivedStateFromProps,f=typeof h=="function"||typeof i.getSnapshotBeforeUpdate=="function";f||typeof i.UNSAFE_componentWillReceiveProps!="function"&&typeof i.componentWillReceiveProps!="function"||(o!==a||d!==c)&&Vi(t,i,a,c),nt=!1;var x=t.memoizedState;i.state=x,ra(t,a,i,s),d=t.memoizedState,o!==a||x!==d||fe.current||nt?(typeof h=="function"&&(Ds(t,n,h,a),d=t.memoizedState),(o=nt||Hi(t,n,o,a,x,d,c))?(f||typeof i.UNSAFE_componentWillMount!="function"&&typeof i.componentWillMount!="function"||(typeof i.componentWillMount=="function"&&i.componentWillMount(),typeof i.UNSAFE_componentWillMount=="function"&&i.UNSAFE_componentWillMount()),typeof i.componentDidMount=="function"&&(t.flags|=4194308)):(typeof i.componentDidMount=="function"&&(t.flags|=4194308),t.memoizedProps=a,t.memoizedState=d),i.props=a,i.state=d,i.context=c,a=o):(typeof i.componentDidMount=="function"&&(t.flags|=4194308),a=!1)}else{i=t.stateNode,Fd(e,t),o=t.memoizedProps,c=t.type===t.elementType?o:Te(t.type,o),i.props=c,f=t.pendingProps,x=i.context,d=n.contextType,typeof d=="object"&&d!==null?d=Le(d):(d=he(n)?_t:le.current,d=ln(t,d));var w=n.getDerivedStateFromProps;(h=typeof w=="function"||typeof i.getSnapshotBeforeUpdate=="function")||typeof i.UNSAFE_componentWillReceiveProps!="function"&&typeof i.componentWillReceiveProps!="function"||(o!==f||x!==d)&&Vi(t,i,a,d),nt=!1,x=t.memoizedState,i.state=x,ra(t,a,i,s);var y=t.memoizedState;o!==f||x!==y||fe.current||nt?(typeof w=="function"&&(Ds(t,n,w,a),y=t.memoizedState),(c=nt||Hi(t,n,c,a,x,y,d)||!1)?(h||typeof i.UNSAFE_componentWillUpdate!="function"&&typeof i.componentWillUpdate!="function"||(typeof i.componentWillUpdate=="function"&&i.componentWillUpdate(a,y,d),typeof i.UNSAFE_componentWillUpdate=="function"&&i.UNSAFE_componentWillUpdate(a,y,d)),typeof i.componentDidUpdate=="function"&&(t.flags|=4),typeof i.getSnapshotBeforeUpdate=="function"&&(t.flags|=1024)):(typeof i.componentDidUpdate!="function"||o===e.memoizedProps&&x===e.memoizedState||(t.flags|=4),typeof i.getSnapshotBeforeUpdate!="function"||o===e.memoizedProps&&x===e.memoizedState||(t.flags|=1024),t.memoizedProps=a,t.memoizedState=y),i.props=a,i.state=y,i.context=d,a=c):(typeof i.componentDidUpdate!="function"||o===e.memoizedProps&&x===e.memoizedState||(t.flags|=4),typeof i.getSnapshotBeforeUpdate!="function"||o===e.memoizedProps&&x===e.memoizedState||(t.flags|=1024),a=!1)}return $s(e,t,n,a,l,s)}function $s(e,t,n,a,s,l){mc(e,t);var i=(t.flags&128)!==0;if(!a&&!i)return s&&Ai(t,n,!1),Xe(e,t,l);a=t.stateNode,tp.current=t;var o=i&&typeof n.getDerivedStateFromError!="function"?null:a.render();return t.flags|=1,e!==null&&i?(t.child=dn(t,e.child,null,l),t.child=dn(t,null,o,l)):oe(e,t,o,l),t.memoizedState=a.state,s&&Ai(t,n,!0),t.child}function pc(e){var t=e.stateNode;t.pendingContext?zi(e,t.pendingContext,t.pendingContext!==t.context):t.context&&zi(e,t.context,!1),Tl(e,t.containerInfo)}function Xi(e,t,n,a,s){return on(),Cl(s),t.flags|=256,oe(e,t,n,a),t.child}var Ws={dehydrated:null,treeContext:null,retryLane:0};function Hs(e){return{baseLanes:e,cachePool:null,transitions:null}}function fc(e,t,n){var a=t.pendingProps,s=F.current,l=!1,i=(t.flags&128)!==0,o;if((o=i)||(o=e!==null&&e.memoizedState===null?!1:(s&2)!==0),o?(l=!0,t.flags&=-129):(e===null||e.memoizedState!==null)&&(s|=1),A(F,s&1),e===null)return As(t),e=t.memoizedState,e!==null&&(e=e.dehydrated,e!==null)?(t.mode&1?e.data==="$!"?t.lanes=8:t.lanes=1073741824:t.lanes=1,null):(i=a.children,e=a.fallback,l?(a=t.mode,l=t.child,i={mode:"hidden",children:i},!(a&1)&&l!==null?(l.childLanes=0,l.pendingProps=i):l=Na(i,a,0,null),e=It(e,a,n,null),l.return=t,e.return=t,l.sibling=e,t.child=l,t.child.memoizedState=Hs(n),t.memoizedState=Ws,e):Fl(t,i));if(s=e.memoizedState,s!==null&&(o=s.dehydrated,o!==null))return np(e,t,i,a,o,s,n);if(l){l=a.fallback,i=t.mode,s=e.child,o=s.sibling;var d={mode:"hidden",children:a.children};return!(i&1)&&t.child!==s?(a=t.child,a.childLanes=0,a.pendingProps=d,t.deletions=null):(a=ht(s,d),a.subtreeFlags=s.subtreeFlags&14680064),o!==null?l=ht(o,l):(l=It(l,i,n,null),l.flags|=2),l.return=t,a.return=t,a.sibling=l,t.child=a,a=l,l=t.child,i=e.child.memoizedState,i=i===null?Hs(n):{baseLanes:i.baseLanes|n,cachePool:null,transitions:i.transitions},l.memoizedState=i,l.childLanes=e.childLanes&~n,t.memoizedState=Ws,a}return l=e.child,e=l.sibling,a=ht(l,{mode:"visible",children:a.children}),!(t.mode&1)&&(a.lanes=n),a.return=t,a.sibling=null,e!==null&&(n=t.deletions,n===null?(t.deletions=[e],t.flags|=16):n.push(e)),t.child=a,t.memoizedState=null,a}function Fl(e,t){return t=Na({mode:"visible",children:t},e.mode,0,null),t.return=e,e.child=t}function Cr(e,t,n,a){return a!==null&&Cl(a),dn(t,e.child,null,n),e=Fl(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function np(e,t,n,a,s,l,i){if(n)return t.flags&256?(t.flags&=-257,a=ns(Error(k(422))),Cr(e,t,i,a)):t.memoizedState!==null?(t.child=e.child,t.flags|=128,null):(l=a.fallback,s=t.mode,a=Na({mode:"visible",children:a.children},s,0,null),l=It(l,s,i,null),l.flags|=2,a.return=t,l.return=t,a.sibling=l,t.child=a,t.mode&1&&dn(t,e.child,null,i),t.child.memoizedState=Hs(i),t.memoizedState=Ws,l);if(!(t.mode&1))return Cr(e,t,i,null);if(s.data==="$!"){if(a=s.nextSibling&&s.nextSibling.dataset,a)var o=a.dgst;return a=o,l=Error(k(419)),a=ns(l,a,void 0),Cr(e,t,i,a)}if(o=(i&e.childLanes)!==0,pe||o){if(a=Z,a!==null){switch(i&-i){case 4:s=2;break;case 16:s=8;break;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:s=32;break;case 536870912:s=268435456;break;default:s=0}s=s&(a.suspendedLanes|i)?0:s,s!==0&&s!==l.retryLane&&(l.retryLane=s,Ye(e,s),Ae(a,e,s,-1))}return Gl(),a=ns(Error(k(421))),Cr(e,t,i,a)}return s.data==="$?"?(t.flags|=128,t.child=e.child,t=hp.bind(null,e),s._reactRetry=t,null):(e=l.treeContext,ye=ut(s.nextSibling),we=t,O=!0,Me=null,e!==null&&(Ne[Se++]=Ge,Ne[Se++]=Je,Ne[Se++]=Tt,Ge=e.id,Je=e.overflow,Tt=t),t=Fl(t,a.children),t.flags|=4096,t)}function Zi(e,t,n){e.lanes|=t;var a=e.alternate;a!==null&&(a.lanes|=t),Rs(e.return,t,n)}function rs(e,t,n,a,s){var l=e.memoizedState;l===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:a,tail:n,tailMode:s}:(l.isBackwards=t,l.rendering=null,l.renderingStartTime=0,l.last=a,l.tail=n,l.tailMode=s)}function hc(e,t,n){var a=t.pendingProps,s=a.revealOrder,l=a.tail;if(oe(e,t,a.children,n),a=F.current,a&2)a=a&1|2,t.flags|=128;else{if(e!==null&&e.flags&128)e:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&Zi(e,n,t);else if(e.tag===19)Zi(e,n,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break e;for(;e.sibling===null;){if(e.return===null||e.return===t)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}a&=1}if(A(F,a),!(t.mode&1))t.memoizedState=null;else switch(s){case"forwards":for(n=t.child,s=null;n!==null;)e=n.alternate,e!==null&&aa(e)===null&&(s=n),n=n.sibling;n=s,n===null?(s=t.child,t.child=null):(s=n.sibling,n.sibling=null),rs(t,!1,s,n,l);break;case"backwards":for(n=null,s=t.child,t.child=null;s!==null;){if(e=s.alternate,e!==null&&aa(e)===null){t.child=s;break}e=s.sibling,s.sibling=n,n=s,s=e}rs(t,!0,n,null,l);break;case"together":rs(t,!1,null,null,void 0);break;default:t.memoizedState=null}return t.child}function Dr(e,t){!(t.mode&1)&&e!==null&&(e.alternate=null,t.alternate=null,t.flags|=2)}function Xe(e,t,n){if(e!==null&&(t.dependencies=e.dependencies),Mt|=t.lanes,!(n&t.childLanes))return null;if(e!==null&&t.child!==e.child)throw Error(k(153));if(t.child!==null){for(e=t.child,n=ht(e,e.pendingProps),t.child=n,n.return=t;e.sibling!==null;)e=e.sibling,n=n.sibling=ht(e,e.pendingProps),n.return=t;n.sibling=null}return t.child}function rp(e,t,n){switch(t.tag){case 3:pc(t),on();break;case 5:Ud(t);break;case 1:he(t.type)&&Xr(t);break;case 4:Tl(t,t.stateNode.containerInfo);break;case 10:var a=t.type._context,s=t.memoizedProps.value;A(ta,a._currentValue),a._currentValue=s;break;case 13:if(a=t.memoizedState,a!==null)return a.dehydrated!==null?(A(F,F.current&1),t.flags|=128,null):n&t.child.childLanes?fc(e,t,n):(A(F,F.current&1),e=Xe(e,t,n),e!==null?e.sibling:null);A(F,F.current&1);break;case 19:if(a=(n&t.childLanes)!==0,e.flags&128){if(a)return hc(e,t,n);t.flags|=128}if(s=t.memoizedState,s!==null&&(s.rendering=null,s.tail=null,s.lastEffect=null),A(F,F.current),a)break;return null;case 22:case 23:return t.lanes=0,uc(e,t,n)}return Xe(e,t,n)}var xc,Vs,gc,vc;xc=function(e,t){for(var n=t.child;n!==null;){if(n.tag===5||n.tag===6)e.appendChild(n.stateNode);else if(n.tag!==4&&n.child!==null){n.child.return=n,n=n.child;continue}if(n===t)break;for(;n.sibling===null;){if(n.return===null||n.return===t)return;n=n.return}n.sibling.return=n.return,n=n.sibling}};Vs=function(){};gc=function(e,t,n,a){var s=e.memoizedProps;if(s!==a){e=t.stateNode,Lt(We.current);var l=null;switch(n){case"input":s=ps(e,s),a=ps(e,a),l=[];break;case"select":s=$({},s,{value:void 0}),a=$({},a,{value:void 0}),l=[];break;case"textarea":s=xs(e,s),a=xs(e,a),l=[];break;default:typeof s.onClick!="function"&&typeof a.onClick=="function"&&(e.onclick=qr)}vs(n,a);var i;n=null;for(c in s)if(!a.hasOwnProperty(c)&&s.hasOwnProperty(c)&&s[c]!=null)if(c==="style"){var o=s[c];for(i in o)o.hasOwnProperty(i)&&(n||(n={}),n[i]="")}else c!=="dangerouslySetInnerHTML"&&c!=="children"&&c!=="suppressContentEditableWarning"&&c!=="suppressHydrationWarning"&&c!=="autoFocus"&&(Fn.hasOwnProperty(c)?l||(l=[]):(l=l||[]).push(c,null));for(c in a){var d=a[c];if(o=s!=null?s[c]:void 0,a.hasOwnProperty(c)&&d!==o&&(d!=null||o!=null))if(c==="style")if(o){for(i in o)!o.hasOwnProperty(i)||d&&d.hasOwnProperty(i)||(n||(n={}),n[i]="");for(i in d)d.hasOwnProperty(i)&&o[i]!==d[i]&&(n||(n={}),n[i]=d[i])}else n||(l||(l=[]),l.push(c,n)),n=d;else c==="dangerouslySetInnerHTML"?(d=d?d.__html:void 0,o=o?o.__html:void 0,d!=null&&o!==d&&(l=l||[]).push(c,d)):c==="children"?typeof d!="string"&&typeof d!="number"||(l=l||[]).push(c,""+d):c!=="suppressContentEditableWarning"&&c!=="suppressHydrationWarning"&&(Fn.hasOwnProperty(c)?(d!=null&&c==="onScroll"&&R("scroll",e),l||o===d||(l=[])):(l=l||[]).push(c,d))}n&&(l=l||[]).push("style",n);var c=l;(t.updateQueue=c)&&(t.flags|=4)}};vc=function(e,t,n,a){n!==a&&(t.flags|=4)};function Sn(e,t){if(!O)switch(e.tailMode){case"hidden":t=e.tail;for(var n=null;t!==null;)t.alternate!==null&&(n=t),t=t.sibling;n===null?e.tail=null:n.sibling=null;break;case"collapsed":n=e.tail;for(var a=null;n!==null;)n.alternate!==null&&(a=n),n=n.sibling;a===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:a.sibling=null}}function ae(e){var t=e.alternate!==null&&e.alternate.child===e.child,n=0,a=0;if(t)for(var s=e.child;s!==null;)n|=s.lanes|s.childLanes,a|=s.subtreeFlags&14680064,a|=s.flags&14680064,s.return=e,s=s.sibling;else for(s=e.child;s!==null;)n|=s.lanes|s.childLanes,a|=s.subtreeFlags,a|=s.flags,s.return=e,s=s.sibling;return e.subtreeFlags|=a,e.childLanes=n,t}function ap(e,t,n){var a=t.pendingProps;switch(Sl(t),t.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return ae(t),null;case 1:return he(t.type)&&Yr(),ae(t),null;case 3:return a=t.stateNode,cn(),D(fe),D(le),Ml(),a.pendingContext&&(a.context=a.pendingContext,a.pendingContext=null),(e===null||e.child===null)&&(Nr(t)?t.flags|=4:e===null||e.memoizedState.isDehydrated&&!(t.flags&256)||(t.flags|=1024,Me!==null&&(Zs(Me),Me=null))),Vs(e,t),ae(t),null;case 5:Pl(t);var s=Lt(Xn.current);if(n=t.type,e!==null&&t.stateNode!=null)gc(e,t,n,a,s),e.ref!==t.ref&&(t.flags|=512,t.flags|=2097152);else{if(!a){if(t.stateNode===null)throw Error(k(166));return ae(t),null}if(e=Lt(We.current),Nr(t)){a=t.stateNode,n=t.type;var l=t.memoizedProps;switch(a[Ue]=t,a[qn]=l,e=(t.mode&1)!==0,n){case"dialog":R("cancel",a),R("close",a);break;case"iframe":case"object":case"embed":R("load",a);break;case"video":case"audio":for(s=0;s<In.length;s++)R(In[s],a);break;case"source":R("error",a);break;case"img":case"image":case"link":R("error",a),R("load",a);break;case"details":R("toggle",a);break;case"input":oi(a,l),R("invalid",a);break;case"select":a._wrapperState={wasMultiple:!!l.multiple},R("invalid",a);break;case"textarea":ci(a,l),R("invalid",a)}vs(n,l),s=null;for(var i in l)if(l.hasOwnProperty(i)){var o=l[i];i==="children"?typeof o=="string"?a.textContent!==o&&(l.suppressHydrationWarning!==!0&&br(a.textContent,o,e),s=["children",o]):typeof o=="number"&&a.textContent!==""+o&&(l.suppressHydrationWarning!==!0&&br(a.textContent,o,e),s=["children",""+o]):Fn.hasOwnProperty(i)&&o!=null&&i==="onScroll"&&R("scroll",a)}switch(n){case"input":hr(a),di(a,l,!0);break;case"textarea":hr(a),ui(a);break;case"select":case"option":break;default:typeof l.onClick=="function"&&(a.onclick=qr)}a=s,t.updateQueue=a,a!==null&&(t.flags|=4)}else{i=s.nodeType===9?s:s.ownerDocument,e==="http://www.w3.org/1999/xhtml"&&(e=Go(n)),e==="http://www.w3.org/1999/xhtml"?n==="script"?(e=i.createElement("div"),e.innerHTML="<script><\/script>",e=e.removeChild(e.firstChild)):typeof a.is=="string"?e=i.createElement(n,{is:a.is}):(e=i.createElement(n),n==="select"&&(i=e,a.multiple?i.multiple=!0:a.size&&(i.size=a.size))):e=i.createElementNS(e,n),e[Ue]=t,e[qn]=a,xc(e,t,!1,!1),t.stateNode=e;e:{switch(i=ys(n,a),n){case"dialog":R("cancel",e),R("close",e),s=a;break;case"iframe":case"object":case"embed":R("load",e),s=a;break;case"video":case"audio":for(s=0;s<In.length;s++)R(In[s],e);s=a;break;case"source":R("error",e),s=a;break;case"img":case"image":case"link":R("error",e),R("load",e),s=a;break;case"details":R("toggle",e),s=a;break;case"input":oi(e,a),s=ps(e,a),R("invalid",e);break;case"option":s=a;break;case"select":e._wrapperState={wasMultiple:!!a.multiple},s=$({},a,{value:void 0}),R("invalid",e);break;case"textarea":ci(e,a),s=xs(e,a),R("invalid",e);break;default:s=a}vs(n,s),o=s;for(l in o)if(o.hasOwnProperty(l)){var d=o[l];l==="style"?Qo(e,d):l==="dangerouslySetInnerHTML"?(d=d?d.__html:void 0,d!=null&&Jo(e,d)):l==="children"?typeof d=="string"?(n!=="textarea"||d!=="")&&Un(e,d):typeof d=="number"&&Un(e,""+d):l!=="suppressContentEditableWarning"&&l!=="suppressHydrationWarning"&&l!=="autoFocus"&&(Fn.hasOwnProperty(l)?d!=null&&l==="onScroll"&&R("scroll",e):d!=null&&cl(e,l,d,i))}switch(n){case"input":hr(e),di(e,a,!1);break;case"textarea":hr(e),ui(e);break;case"option":a.value!=null&&e.setAttribute("value",""+gt(a.value));break;case"select":e.multiple=!!a.multiple,l=a.value,l!=null?Zt(e,!!a.multiple,l,!1):a.defaultValue!=null&&Zt(e,!!a.multiple,a.defaultValue,!0);break;default:typeof s.onClick=="function"&&(e.onclick=qr)}switch(n){case"button":case"input":case"select":case"textarea":a=!!a.autoFocus;break e;case"img":a=!0;break e;default:a=!1}}a&&(t.flags|=4)}t.ref!==null&&(t.flags|=512,t.flags|=2097152)}return ae(t),null;case 6:if(e&&t.stateNode!=null)vc(e,t,e.memoizedProps,a);else{if(typeof a!="string"&&t.stateNode===null)throw Error(k(166));if(n=Lt(Xn.current),Lt(We.current),Nr(t)){if(a=t.stateNode,n=t.memoizedProps,a[Ue]=t,(l=a.nodeValue!==n)&&(e=we,e!==null))switch(e.tag){case 3:br(a.nodeValue,n,(e.mode&1)!==0);break;case 5:e.memoizedProps.suppressHydrationWarning!==!0&&br(a.nodeValue,n,(e.mode&1)!==0)}l&&(t.flags|=4)}else a=(n.nodeType===9?n:n.ownerDocument).createTextNode(a),a[Ue]=t,t.stateNode=a}return ae(t),null;case 13:if(D(F),a=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(O&&ye!==null&&t.mode&1&&!(t.flags&128))Ad(),on(),t.flags|=98560,l=!1;else if(l=Nr(t),a!==null&&a.dehydrated!==null){if(e===null){if(!l)throw Error(k(318));if(l=t.memoizedState,l=l!==null?l.dehydrated:null,!l)throw Error(k(317));l[Ue]=t}else on(),!(t.flags&128)&&(t.memoizedState=null),t.flags|=4;ae(t),l=!1}else Me!==null&&(Zs(Me),Me=null),l=!0;if(!l)return t.flags&65536?t:null}return t.flags&128?(t.lanes=n,t):(a=a!==null,a!==(e!==null&&e.memoizedState!==null)&&a&&(t.child.flags|=8192,t.mode&1&&(e===null||F.current&1?q===0&&(q=3):Gl())),t.updateQueue!==null&&(t.flags|=4),ae(t),null);case 4:return cn(),Vs(e,t),e===null&&Kn(t.stateNode.containerInfo),ae(t),null;case 10:return Bl(t.type._context),ae(t),null;case 17:return he(t.type)&&Yr(),ae(t),null;case 19:if(D(F),l=t.memoizedState,l===null)return ae(t),null;if(a=(t.flags&128)!==0,i=l.rendering,i===null)if(a)Sn(l,!1);else{if(q!==0||e!==null&&e.flags&128)for(e=t.child;e!==null;){if(i=aa(e),i!==null){for(t.flags|=128,Sn(l,!1),a=i.updateQueue,a!==null&&(t.updateQueue=a,t.flags|=4),t.subtreeFlags=0,a=n,n=t.child;n!==null;)l=n,e=a,l.flags&=14680066,i=l.alternate,i===null?(l.childLanes=0,l.lanes=e,l.child=null,l.subtreeFlags=0,l.memoizedProps=null,l.memoizedState=null,l.updateQueue=null,l.dependencies=null,l.stateNode=null):(l.childLanes=i.childLanes,l.lanes=i.lanes,l.child=i.child,l.subtreeFlags=0,l.deletions=null,l.memoizedProps=i.memoizedProps,l.memoizedState=i.memoizedState,l.updateQueue=i.updateQueue,l.type=i.type,e=i.dependencies,l.dependencies=e===null?null:{lanes:e.lanes,firstContext:e.firstContext}),n=n.sibling;return A(F,F.current&1|2),t.child}e=e.sibling}l.tail!==null&&G()>mn&&(t.flags|=128,a=!0,Sn(l,!1),t.lanes=4194304)}else{if(!a)if(e=aa(i),e!==null){if(t.flags|=128,a=!0,n=e.updateQueue,n!==null&&(t.updateQueue=n,t.flags|=4),Sn(l,!0),l.tail===null&&l.tailMode==="hidden"&&!i.alternate&&!O)return ae(t),null}else 2*G()-l.renderingStartTime>mn&&n!==1073741824&&(t.flags|=128,a=!0,Sn(l,!1),t.lanes=4194304);l.isBackwards?(i.sibling=t.child,t.child=i):(n=l.last,n!==null?n.sibling=i:t.child=i,l.last=i)}return l.tail!==null?(t=l.tail,l.rendering=t,l.tail=t.sibling,l.renderingStartTime=G(),t.sibling=null,n=F.current,A(F,a?n&1|2:n&1),t):(ae(t),null);case 22:case 23:return Vl(),a=t.memoizedState!==null,e!==null&&e.memoizedState!==null!==a&&(t.flags|=8192),a&&t.mode&1?ve&1073741824&&(ae(t),t.subtreeFlags&6&&(t.flags|=8192)):ae(t),null;case 24:return null;case 25:return null}throw Error(k(156,t.tag))}function sp(e,t){switch(Sl(t),t.tag){case 1:return he(t.type)&&Yr(),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return cn(),D(fe),D(le),Ml(),e=t.flags,e&65536&&!(e&128)?(t.flags=e&-65537|128,t):null;case 5:return Pl(t),null;case 13:if(D(F),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error(k(340));on()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return D(F),null;case 4:return cn(),null;case 10:return Bl(t.type._context),null;case 22:case 23:return Vl(),null;case 24:return null;default:return null}}var Er=!1,se=!1,lp=typeof WeakSet=="function"?WeakSet:Set,S=null;function Yt(e,t){var n=e.ref;if(n!==null)if(typeof n=="function")try{n(null)}catch(a){W(e,t,a)}else n.current=null}function Gs(e,t,n){try{n()}catch(a){W(e,t,a)}}var eo=!1;function ip(e,t){if(Bs=Jr,e=bd(),bl(e)){if("selectionStart"in e)var n={start:e.selectionStart,end:e.selectionEnd};else e:{n=(n=e.ownerDocument)&&n.defaultView||window;var a=n.getSelection&&n.getSelection();if(a&&a.rangeCount!==0){n=a.anchorNode;var s=a.anchorOffset,l=a.focusNode;a=a.focusOffset;try{n.nodeType,l.nodeType}catch{n=null;break e}var i=0,o=-1,d=-1,c=0,h=0,f=e,x=null;t:for(;;){for(var w;f!==n||s!==0&&f.nodeType!==3||(o=i+s),f!==l||a!==0&&f.nodeType!==3||(d=i+a),f.nodeType===3&&(i+=f.nodeValue.length),(w=f.firstChild)!==null;)x=f,f=w;for(;;){if(f===e)break t;if(x===n&&++c===s&&(o=i),x===l&&++h===a&&(d=i),(w=f.nextSibling)!==null)break;f=x,x=f.parentNode}f=w}n=o===-1||d===-1?null:{start:o,end:d}}else n=null}n=n||{start:0,end:0}}else n=null;for(Is={focusedElem:e,selectionRange:n},Jr=!1,S=t;S!==null;)if(t=S,e=t.child,(t.subtreeFlags&1028)!==0&&e!==null)e.return=t,S=e;else for(;S!==null;){t=S;try{var y=t.alternate;if(t.flags&1024)switch(t.tag){case 0:case 11:case 15:break;case 1:if(y!==null){var v=y.memoizedProps,b=y.memoizedState,m=t.stateNode,u=m.getSnapshotBeforeUpdate(t.elementType===t.type?v:Te(t.type,v),b);m.__reactInternalSnapshotBeforeUpdate=u}break;case 3:var p=t.stateNode.containerInfo;p.nodeType===1?p.textContent="":p.nodeType===9&&p.documentElement&&p.removeChild(p.documentElement);break;case 5:case 6:case 4:case 17:break;default:throw Error(k(163))}}catch(g){W(t,t.return,g)}if(e=t.sibling,e!==null){e.return=t.return,S=e;break}S=t.return}return y=eo,eo=!1,y}function Rn(e,t,n){var a=t.updateQueue;if(a=a!==null?a.lastEffect:null,a!==null){var s=a=a.next;do{if((s.tag&e)===e){var l=s.destroy;s.destroy=void 0,l!==void 0&&Gs(t,n,l)}s=s.next}while(s!==a)}}function ja(e,t){if(t=t.updateQueue,t=t!==null?t.lastEffect:null,t!==null){var n=t=t.next;do{if((n.tag&e)===e){var a=n.create;n.destroy=a()}n=n.next}while(n!==t)}}function Js(e){var t=e.ref;if(t!==null){var n=e.stateNode;switch(e.tag){case 5:e=n;break;default:e=n}typeof t=="function"?t(e):t.current=e}}function yc(e){var t=e.alternate;t!==null&&(e.alternate=null,yc(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&(delete t[Ue],delete t[qn],delete t[Ps],delete t[Wm],delete t[Hm])),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}function wc(e){return e.tag===5||e.tag===3||e.tag===4}function to(e){e:for(;;){for(;e.sibling===null;){if(e.return===null||wc(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.flags&2||e.child===null||e.tag===4)continue e;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function Ks(e,t,n){var a=e.tag;if(a===5||a===6)e=e.stateNode,t?n.nodeType===8?n.parentNode.insertBefore(e,t):n.insertBefore(e,t):(n.nodeType===8?(t=n.parentNode,t.insertBefore(e,n)):(t=n,t.appendChild(e)),n=n._reactRootContainer,n!=null||t.onclick!==null||(t.onclick=qr));else if(a!==4&&(e=e.child,e!==null))for(Ks(e,t,n),e=e.sibling;e!==null;)Ks(e,t,n),e=e.sibling}function Qs(e,t,n){var a=e.tag;if(a===5||a===6)e=e.stateNode,t?n.insertBefore(e,t):n.appendChild(e);else if(a!==4&&(e=e.child,e!==null))for(Qs(e,t,n),e=e.sibling;e!==null;)Qs(e,t,n),e=e.sibling}var ee=null,Pe=!1;function et(e,t,n){for(n=n.child;n!==null;)kc(e,t,n),n=n.sibling}function kc(e,t,n){if($e&&typeof $e.onCommitFiberUnmount=="function")try{$e.onCommitFiberUnmount(fa,n)}catch{}switch(n.tag){case 5:se||Yt(n,t);case 6:var a=ee,s=Pe;ee=null,et(e,t,n),ee=a,Pe=s,ee!==null&&(Pe?(e=ee,n=n.stateNode,e.nodeType===8?e.parentNode.removeChild(n):e.removeChild(n)):ee.removeChild(n.stateNode));break;case 18:ee!==null&&(Pe?(e=ee,n=n.stateNode,e.nodeType===8?qa(e.parentNode,n):e.nodeType===1&&qa(e,n),Vn(e)):qa(ee,n.stateNode));break;case 4:a=ee,s=Pe,ee=n.stateNode.containerInfo,Pe=!0,et(e,t,n),ee=a,Pe=s;break;case 0:case 11:case 14:case 15:if(!se&&(a=n.updateQueue,a!==null&&(a=a.lastEffect,a!==null))){s=a=a.next;do{var l=s,i=l.destroy;l=l.tag,i!==void 0&&(l&2||l&4)&&Gs(n,t,i),s=s.next}while(s!==a)}et(e,t,n);break;case 1:if(!se&&(Yt(n,t),a=n.stateNode,typeof a.componentWillUnmount=="function"))try{a.props=n.memoizedProps,a.state=n.memoizedState,a.componentWillUnmount()}catch(o){W(n,t,o)}et(e,t,n);break;case 21:et(e,t,n);break;case 22:n.mode&1?(se=(a=se)||n.memoizedState!==null,et(e,t,n),se=a):et(e,t,n);break;default:et(e,t,n)}}function no(e){var t=e.updateQueue;if(t!==null){e.updateQueue=null;var n=e.stateNode;n===null&&(n=e.stateNode=new lp),t.forEach(function(a){var s=xp.bind(null,e,a);n.has(a)||(n.add(a),a.then(s,s))})}}function _e(e,t){var n=t.deletions;if(n!==null)for(var a=0;a<n.length;a++){var s=n[a];try{var l=e,i=t,o=i;e:for(;o!==null;){switch(o.tag){case 5:ee=o.stateNode,Pe=!1;break e;case 3:ee=o.stateNode.containerInfo,Pe=!0;break e;case 4:ee=o.stateNode.containerInfo,Pe=!0;break e}o=o.return}if(ee===null)throw Error(k(160));kc(l,i,s),ee=null,Pe=!1;var d=s.alternate;d!==null&&(d.return=null),s.return=null}catch(c){W(s,t,c)}}if(t.subtreeFlags&12854)for(t=t.child;t!==null;)jc(t,e),t=t.sibling}function jc(e,t){var n=e.alternate,a=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:if(_e(t,e),De(e),a&4){try{Rn(3,e,e.return),ja(3,e)}catch(v){W(e,e.return,v)}try{Rn(5,e,e.return)}catch(v){W(e,e.return,v)}}break;case 1:_e(t,e),De(e),a&512&&n!==null&&Yt(n,n.return);break;case 5:if(_e(t,e),De(e),a&512&&n!==null&&Yt(n,n.return),e.flags&32){var s=e.stateNode;try{Un(s,"")}catch(v){W(e,e.return,v)}}if(a&4&&(s=e.stateNode,s!=null)){var l=e.memoizedProps,i=n!==null?n.memoizedProps:l,o=e.type,d=e.updateQueue;if(e.updateQueue=null,d!==null)try{o==="input"&&l.type==="radio"&&l.name!=null&&Ho(s,l),ys(o,i);var c=ys(o,l);for(i=0;i<d.length;i+=2){var h=d[i],f=d[i+1];h==="style"?Qo(s,f):h==="dangerouslySetInnerHTML"?Jo(s,f):h==="children"?Un(s,f):cl(s,h,f,c)}switch(o){case"input":fs(s,l);break;case"textarea":Vo(s,l);break;case"select":var x=s._wrapperState.wasMultiple;s._wrapperState.wasMultiple=!!l.multiple;var w=l.value;w!=null?Zt(s,!!l.multiple,w,!1):x!==!!l.multiple&&(l.defaultValue!=null?Zt(s,!!l.multiple,l.defaultValue,!0):Zt(s,!!l.multiple,l.multiple?[]:"",!1))}s[qn]=l}catch(v){W(e,e.return,v)}}break;case 6:if(_e(t,e),De(e),a&4){if(e.stateNode===null)throw Error(k(162));s=e.stateNode,l=e.memoizedProps;try{s.nodeValue=l}catch(v){W(e,e.return,v)}}break;case 3:if(_e(t,e),De(e),a&4&&n!==null&&n.memoizedState.isDehydrated)try{Vn(t.containerInfo)}catch(v){W(e,e.return,v)}break;case 4:_e(t,e),De(e);break;case 13:_e(t,e),De(e),s=e.child,s.flags&8192&&(l=s.memoizedState!==null,s.stateNode.isHidden=l,!l||s.alternate!==null&&s.alternate.memoizedState!==null||(Wl=G())),a&4&&no(e);break;case 22:if(h=n!==null&&n.memoizedState!==null,e.mode&1?(se=(c=se)||h,_e(t,e),se=c):_e(t,e),De(e),a&8192){if(c=e.memoizedState!==null,(e.stateNode.isHidden=c)&&!h&&e.mode&1)for(S=e,h=e.child;h!==null;){for(f=S=h;S!==null;){switch(x=S,w=x.child,x.tag){case 0:case 11:case 14:case 15:Rn(4,x,x.return);break;case 1:Yt(x,x.return);var y=x.stateNode;if(typeof y.componentWillUnmount=="function"){a=x,n=x.return;try{t=a,y.props=t.memoizedProps,y.state=t.memoizedState,y.componentWillUnmount()}catch(v){W(a,n,v)}}break;case 5:Yt(x,x.return);break;case 22:if(x.memoizedState!==null){ao(f);continue}}w!==null?(w.return=x,S=w):ao(f)}h=h.sibling}e:for(h=null,f=e;;){if(f.tag===5){if(h===null){h=f;try{s=f.stateNode,c?(l=s.style,typeof l.setProperty=="function"?l.setProperty("display","none","important"):l.display="none"):(o=f.stateNode,d=f.memoizedProps.style,i=d!=null&&d.hasOwnProperty("display")?d.display:null,o.style.display=Ko("display",i))}catch(v){W(e,e.return,v)}}}else if(f.tag===6){if(h===null)try{f.stateNode.nodeValue=c?"":f.memoizedProps}catch(v){W(e,e.return,v)}}else if((f.tag!==22&&f.tag!==23||f.memoizedState===null||f===e)&&f.child!==null){f.child.return=f,f=f.child;continue}if(f===e)break e;for(;f.sibling===null;){if(f.return===null||f.return===e)break e;h===f&&(h=null),f=f.return}h===f&&(h=null),f.sibling.return=f.return,f=f.sibling}}break;case 19:_e(t,e),De(e),a&4&&no(e);break;case 21:break;default:_e(t,e),De(e)}}function De(e){var t=e.flags;if(t&2){try{e:{for(var n=e.return;n!==null;){if(wc(n)){var a=n;break e}n=n.return}throw Error(k(160))}switch(a.tag){case 5:var s=a.stateNode;a.flags&32&&(Un(s,""),a.flags&=-33);var l=to(e);Qs(e,l,s);break;case 3:case 4:var i=a.stateNode.containerInfo,o=to(e);Ks(e,o,i);break;default:throw Error(k(161))}}catch(d){W(e,e.return,d)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function op(e,t,n){S=e,bc(e)}function bc(e,t,n){for(var a=(e.mode&1)!==0;S!==null;){var s=S,l=s.child;if(s.tag===22&&a){var i=s.memoizedState!==null||Er;if(!i){var o=s.alternate,d=o!==null&&o.memoizedState!==null||se;o=Er;var c=se;if(Er=i,(se=d)&&!c)for(S=s;S!==null;)i=S,d=i.child,i.tag===22&&i.memoizedState!==null?so(s):d!==null?(d.return=i,S=d):so(s);for(;l!==null;)S=l,bc(l),l=l.sibling;S=s,Er=o,se=c}ro(e)}else s.subtreeFlags&8772&&l!==null?(l.return=s,S=l):ro(e)}}function ro(e){for(;S!==null;){var t=S;if(t.flags&8772){var n=t.alternate;try{if(t.flags&8772)switch(t.tag){case 0:case 11:case 15:se||ja(5,t);break;case 1:var a=t.stateNode;if(t.flags&4&&!se)if(n===null)a.componentDidMount();else{var s=t.elementType===t.type?n.memoizedProps:Te(t.type,n.memoizedProps);a.componentDidUpdate(s,n.memoizedState,a.__reactInternalSnapshotBeforeUpdate)}var l=t.updateQueue;l!==null&&Ui(t,l,a);break;case 3:var i=t.updateQueue;if(i!==null){if(n=null,t.child!==null)switch(t.child.tag){case 5:n=t.child.stateNode;break;case 1:n=t.child.stateNode}Ui(t,i,n)}break;case 5:var o=t.stateNode;if(n===null&&t.flags&4){n=o;var d=t.memoizedProps;switch(t.type){case"button":case"input":case"select":case"textarea":d.autoFocus&&n.focus();break;case"img":d.src&&(n.src=d.src)}}break;case 6:break;case 4:break;case 12:break;case 13:if(t.memoizedState===null){var c=t.alternate;if(c!==null){var h=c.memoizedState;if(h!==null){var f=h.dehydrated;f!==null&&Vn(f)}}}break;case 19:case 17:case 21:case 22:case 23:case 25:break;default:throw Error(k(163))}se||t.flags&512&&Js(t)}catch(x){W(t,t.return,x)}}if(t===e){S=null;break}if(n=t.sibling,n!==null){n.return=t.return,S=n;break}S=t.return}}function ao(e){for(;S!==null;){var t=S;if(t===e){S=null;break}var n=t.sibling;if(n!==null){n.return=t.return,S=n;break}S=t.return}}function so(e){for(;S!==null;){var t=S;try{switch(t.tag){case 0:case 11:case 15:var n=t.return;try{ja(4,t)}catch(d){W(t,n,d)}break;case 1:var a=t.stateNode;if(typeof a.componentDidMount=="function"){var s=t.return;try{a.componentDidMount()}catch(d){W(t,s,d)}}var l=t.return;try{Js(t)}catch(d){W(t,l,d)}break;case 5:var i=t.return;try{Js(t)}catch(d){W(t,i,d)}}}catch(d){W(t,t.return,d)}if(t===e){S=null;break}var o=t.sibling;if(o!==null){o.return=t.return,S=o;break}S=t.return}}var dp=Math.ceil,ia=Ze.ReactCurrentDispatcher,Ul=Ze.ReactCurrentOwner,Ee=Ze.ReactCurrentBatchConfig,M=0,Z=null,J=null,te=0,ve=0,Xt=wt(0),q=0,nr=null,Mt=0,ba=0,$l=0,Dn=null,me=null,Wl=0,mn=1/0,He=null,oa=!1,qs=null,pt=null,Lr=!1,lt=null,da=0,On=0,Ys=null,Or=-1,Fr=0;function de(){return M&6?G():Or!==-1?Or:Or=G()}function ft(e){return e.mode&1?M&2&&te!==0?te&-te:Gm.transition!==null?(Fr===0&&(Fr=id()),Fr):(e=z,e!==0||(e=window.event,e=e===void 0?16:fd(e.type)),e):1}function Ae(e,t,n,a){if(50<On)throw On=0,Ys=null,Error(k(185));lr(e,n,a),(!(M&2)||e!==Z)&&(e===Z&&(!(M&2)&&(ba|=n),q===4&&at(e,te)),xe(e,a),n===1&&M===0&&!(t.mode&1)&&(mn=G()+500,ya&&kt()))}function xe(e,t){var n=e.callbackNode;Gu(e,t);var a=Gr(e,e===Z?te:0);if(a===0)n!==null&&fi(n),e.callbackNode=null,e.callbackPriority=0;else if(t=a&-a,e.callbackPriority!==t){if(n!=null&&fi(n),t===1)e.tag===0?Vm(lo.bind(null,e)):Pd(lo.bind(null,e)),Um(function(){!(M&6)&&kt()}),n=null;else{switch(od(a)){case 1:n=hl;break;case 4:n=sd;break;case 16:n=Vr;break;case 536870912:n=ld;break;default:n=Vr}n=_c(n,Nc.bind(null,e))}e.callbackPriority=t,e.callbackNode=n}}function Nc(e,t){if(Or=-1,Fr=0,M&6)throw Error(k(327));var n=e.callbackNode;if(an()&&e.callbackNode!==n)return null;var a=Gr(e,e===Z?te:0);if(a===0)return null;if(a&30||a&e.expiredLanes||t)t=ca(e,a);else{t=a;var s=M;M|=2;var l=Cc();(Z!==e||te!==t)&&(He=null,mn=G()+500,Bt(e,t));do try{mp();break}catch(o){Sc(e,o)}while(!0);Ll(),ia.current=l,M=s,J!==null?t=0:(Z=null,te=0,t=q)}if(t!==0){if(t===2&&(s=Ns(e),s!==0&&(a=s,t=Xs(e,s))),t===1)throw n=nr,Bt(e,0),at(e,a),xe(e,G()),n;if(t===6)at(e,a);else{if(s=e.current.alternate,!(a&30)&&!cp(s)&&(t=ca(e,a),t===2&&(l=Ns(e),l!==0&&(a=l,t=Xs(e,l))),t===1))throw n=nr,Bt(e,0),at(e,a),xe(e,G()),n;switch(e.finishedWork=s,e.finishedLanes=a,t){case 0:case 1:throw Error(k(345));case 2:St(e,me,He);break;case 3:if(at(e,a),(a&130023424)===a&&(t=Wl+500-G(),10<t)){if(Gr(e,0)!==0)break;if(s=e.suspendedLanes,(s&a)!==a){de(),e.pingedLanes|=e.suspendedLanes&s;break}e.timeoutHandle=Ts(St.bind(null,e,me,He),t);break}St(e,me,He);break;case 4:if(at(e,a),(a&4194240)===a)break;for(t=e.eventTimes,s=-1;0<a;){var i=31-ze(a);l=1<<i,i=t[i],i>s&&(s=i),a&=~l}if(a=s,a=G()-a,a=(120>a?120:480>a?480:1080>a?1080:1920>a?1920:3e3>a?3e3:4320>a?4320:1960*dp(a/1960))-a,10<a){e.timeoutHandle=Ts(St.bind(null,e,me,He),a);break}St(e,me,He);break;case 5:St(e,me,He);break;default:throw Error(k(329))}}}return xe(e,G()),e.callbackNode===n?Nc.bind(null,e):null}function Xs(e,t){var n=Dn;return e.current.memoizedState.isDehydrated&&(Bt(e,t).flags|=256),e=ca(e,t),e!==2&&(t=me,me=n,t!==null&&Zs(t)),e}function Zs(e){me===null?me=e:me.push.apply(me,e)}function cp(e){for(var t=e;;){if(t.flags&16384){var n=t.updateQueue;if(n!==null&&(n=n.stores,n!==null))for(var a=0;a<n.length;a++){var s=n[a],l=s.getSnapshot;s=s.value;try{if(!Re(l(),s))return!1}catch{return!1}}}if(n=t.child,t.subtreeFlags&16384&&n!==null)n.return=t,t=n;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function at(e,t){for(t&=~$l,t&=~ba,e.suspendedLanes|=t,e.pingedLanes&=~t,e=e.expirationTimes;0<t;){var n=31-ze(t),a=1<<n;e[n]=-1,t&=~a}}function lo(e){if(M&6)throw Error(k(327));an();var t=Gr(e,0);if(!(t&1))return xe(e,G()),null;var n=ca(e,t);if(e.tag!==0&&n===2){var a=Ns(e);a!==0&&(t=a,n=Xs(e,a))}if(n===1)throw n=nr,Bt(e,0),at(e,t),xe(e,G()),n;if(n===6)throw Error(k(345));return e.finishedWork=e.current.alternate,e.finishedLanes=t,St(e,me,He),xe(e,G()),null}function Hl(e,t){var n=M;M|=1;try{return e(t)}finally{M=n,M===0&&(mn=G()+500,ya&&kt())}}function zt(e){lt!==null&&lt.tag===0&&!(M&6)&&an();var t=M;M|=1;var n=Ee.transition,a=z;try{if(Ee.transition=null,z=1,e)return e()}finally{z=a,Ee.transition=n,M=t,!(M&6)&&kt()}}function Vl(){ve=Xt.current,D(Xt)}function Bt(e,t){e.finishedWork=null,e.finishedLanes=0;var n=e.timeoutHandle;if(n!==-1&&(e.timeoutHandle=-1,Fm(n)),J!==null)for(n=J.return;n!==null;){var a=n;switch(Sl(a),a.tag){case 1:a=a.type.childContextTypes,a!=null&&Yr();break;case 3:cn(),D(fe),D(le),Ml();break;case 5:Pl(a);break;case 4:cn();break;case 13:D(F);break;case 19:D(F);break;case 10:Bl(a.type._context);break;case 22:case 23:Vl()}n=n.return}if(Z=e,J=e=ht(e.current,null),te=ve=t,q=0,nr=null,$l=ba=Mt=0,me=Dn=null,Et!==null){for(t=0;t<Et.length;t++)if(n=Et[t],a=n.interleaved,a!==null){n.interleaved=null;var s=a.next,l=n.pending;if(l!==null){var i=l.next;l.next=s,a.next=i}n.pending=a}Et=null}return e}function Sc(e,t){do{var n=J;try{if(Ll(),Ar.current=la,sa){for(var a=U.memoizedState;a!==null;){var s=a.queue;s!==null&&(s.pending=null),a=a.next}sa=!1}if(Pt=0,X=Q=U=null,An=!1,Zn=0,Ul.current=null,n===null||n.return===null){q=1,nr=t,J=null;break}e:{var l=e,i=n.return,o=n,d=t;if(t=te,o.flags|=32768,d!==null&&typeof d=="object"&&typeof d.then=="function"){var c=d,h=o,f=h.tag;if(!(h.mode&1)&&(f===0||f===11||f===15)){var x=h.alternate;x?(h.updateQueue=x.updateQueue,h.memoizedState=x.memoizedState,h.lanes=x.lanes):(h.updateQueue=null,h.memoizedState=null)}var w=Ji(i);if(w!==null){w.flags&=-257,Ki(w,i,o,l,t),w.mode&1&&Gi(l,c,t),t=w,d=c;var y=t.updateQueue;if(y===null){var v=new Set;v.add(d),t.updateQueue=v}else y.add(d);break e}else{if(!(t&1)){Gi(l,c,t),Gl();break e}d=Error(k(426))}}else if(O&&o.mode&1){var b=Ji(i);if(b!==null){!(b.flags&65536)&&(b.flags|=256),Ki(b,i,o,l,t),Cl(un(d,o));break e}}l=d=un(d,o),q!==4&&(q=2),Dn===null?Dn=[l]:Dn.push(l),l=i;do{switch(l.tag){case 3:l.flags|=65536,t&=-t,l.lanes|=t;var m=oc(l,d,t);Fi(l,m);break e;case 1:o=d;var u=l.type,p=l.stateNode;if(!(l.flags&128)&&(typeof u.getDerivedStateFromError=="function"||p!==null&&typeof p.componentDidCatch=="function"&&(pt===null||!pt.has(p)))){l.flags|=65536,t&=-t,l.lanes|=t;var g=dc(l,o,t);Fi(l,g);break e}}l=l.return}while(l!==null)}Lc(n)}catch(N){t=N,J===n&&n!==null&&(J=n=n.return);continue}break}while(!0)}function Cc(){var e=ia.current;return ia.current=la,e===null?la:e}function Gl(){(q===0||q===3||q===2)&&(q=4),Z===null||!(Mt&268435455)&&!(ba&268435455)||at(Z,te)}function ca(e,t){var n=M;M|=2;var a=Cc();(Z!==e||te!==t)&&(He=null,Bt(e,t));do try{up();break}catch(s){Sc(e,s)}while(!0);if(Ll(),M=n,ia.current=a,J!==null)throw Error(k(261));return Z=null,te=0,q}function up(){for(;J!==null;)Ec(J)}function mp(){for(;J!==null&&!Ru();)Ec(J)}function Ec(e){var t=Ic(e.alternate,e,ve);e.memoizedProps=e.pendingProps,t===null?Lc(e):J=t,Ul.current=null}function Lc(e){var t=e;do{var n=t.alternate;if(e=t.return,t.flags&32768){if(n=sp(n,t),n!==null){n.flags&=32767,J=n;return}if(e!==null)e.flags|=32768,e.subtreeFlags=0,e.deletions=null;else{q=6,J=null;return}}else if(n=ap(n,t,ve),n!==null){J=n;return}if(t=t.sibling,t!==null){J=t;return}J=t=e}while(t!==null);q===0&&(q=5)}function St(e,t,n){var a=z,s=Ee.transition;try{Ee.transition=null,z=1,pp(e,t,n,a)}finally{Ee.transition=s,z=a}return null}function pp(e,t,n,a){do an();while(lt!==null);if(M&6)throw Error(k(327));n=e.finishedWork;var s=e.finishedLanes;if(n===null)return null;if(e.finishedWork=null,e.finishedLanes=0,n===e.current)throw Error(k(177));e.callbackNode=null,e.callbackPriority=0;var l=n.lanes|n.childLanes;if(Ju(e,l),e===Z&&(J=Z=null,te=0),!(n.subtreeFlags&2064)&&!(n.flags&2064)||Lr||(Lr=!0,_c(Vr,function(){return an(),null})),l=(n.flags&15990)!==0,n.subtreeFlags&15990||l){l=Ee.transition,Ee.transition=null;var i=z;z=1;var o=M;M|=4,Ul.current=null,ip(e,n),jc(n,e),Pm(Is),Jr=!!Bs,Is=Bs=null,e.current=n,op(n),Du(),M=o,z=i,Ee.transition=l}else e.current=n;if(Lr&&(Lr=!1,lt=e,da=s),l=e.pendingLanes,l===0&&(pt=null),Uu(n.stateNode),xe(e,G()),t!==null)for(a=e.onRecoverableError,n=0;n<t.length;n++)s=t[n],a(s.value,{componentStack:s.stack,digest:s.digest});if(oa)throw oa=!1,e=qs,qs=null,e;return da&1&&e.tag!==0&&an(),l=e.pendingLanes,l&1?e===Ys?On++:(On=0,Ys=e):On=0,kt(),null}function an(){if(lt!==null){var e=od(da),t=Ee.transition,n=z;try{if(Ee.transition=null,z=16>e?16:e,lt===null)var a=!1;else{if(e=lt,lt=null,da=0,M&6)throw Error(k(331));var s=M;for(M|=4,S=e.current;S!==null;){var l=S,i=l.child;if(S.flags&16){var o=l.deletions;if(o!==null){for(var d=0;d<o.length;d++){var c=o[d];for(S=c;S!==null;){var h=S;switch(h.tag){case 0:case 11:case 15:Rn(8,h,l)}var f=h.child;if(f!==null)f.return=h,S=f;else for(;S!==null;){h=S;var x=h.sibling,w=h.return;if(yc(h),h===c){S=null;break}if(x!==null){x.return=w,S=x;break}S=w}}}var y=l.alternate;if(y!==null){var v=y.child;if(v!==null){y.child=null;do{var b=v.sibling;v.sibling=null,v=b}while(v!==null)}}S=l}}if(l.subtreeFlags&2064&&i!==null)i.return=l,S=i;else e:for(;S!==null;){if(l=S,l.flags&2048)switch(l.tag){case 0:case 11:case 15:Rn(9,l,l.return)}var m=l.sibling;if(m!==null){m.return=l.return,S=m;break e}S=l.return}}var u=e.current;for(S=u;S!==null;){i=S;var p=i.child;if(i.subtreeFlags&2064&&p!==null)p.return=i,S=p;else e:for(i=u;S!==null;){if(o=S,o.flags&2048)try{switch(o.tag){case 0:case 11:case 15:ja(9,o)}}catch(N){W(o,o.return,N)}if(o===i){S=null;break e}var g=o.sibling;if(g!==null){g.return=o.return,S=g;break e}S=o.return}}if(M=s,kt(),$e&&typeof $e.onPostCommitFiberRoot=="function")try{$e.onPostCommitFiberRoot(fa,e)}catch{}a=!0}return a}finally{z=n,Ee.transition=t}}return!1}function io(e,t,n){t=un(n,t),t=oc(e,t,1),e=mt(e,t,1),t=de(),e!==null&&(lr(e,1,t),xe(e,t))}function W(e,t,n){if(e.tag===3)io(e,e,n);else for(;t!==null;){if(t.tag===3){io(t,e,n);break}else if(t.tag===1){var a=t.stateNode;if(typeof t.type.getDerivedStateFromError=="function"||typeof a.componentDidCatch=="function"&&(pt===null||!pt.has(a))){e=un(n,e),e=dc(t,e,1),t=mt(t,e,1),e=de(),t!==null&&(lr(t,1,e),xe(t,e));break}}t=t.return}}function fp(e,t,n){var a=e.pingCache;a!==null&&a.delete(t),t=de(),e.pingedLanes|=e.suspendedLanes&n,Z===e&&(te&n)===n&&(q===4||q===3&&(te&130023424)===te&&500>G()-Wl?Bt(e,0):$l|=n),xe(e,t)}function Bc(e,t){t===0&&(e.mode&1?(t=vr,vr<<=1,!(vr&130023424)&&(vr=4194304)):t=1);var n=de();e=Ye(e,t),e!==null&&(lr(e,t,n),xe(e,n))}function hp(e){var t=e.memoizedState,n=0;t!==null&&(n=t.retryLane),Bc(e,n)}function xp(e,t){var n=0;switch(e.tag){case 13:var a=e.stateNode,s=e.memoizedState;s!==null&&(n=s.retryLane);break;case 19:a=e.stateNode;break;default:throw Error(k(314))}a!==null&&a.delete(t),Bc(e,n)}var Ic;Ic=function(e,t,n){if(e!==null)if(e.memoizedProps!==t.pendingProps||fe.current)pe=!0;else{if(!(e.lanes&n)&&!(t.flags&128))return pe=!1,rp(e,t,n);pe=!!(e.flags&131072)}else pe=!1,O&&t.flags&1048576&&Md(t,ea,t.index);switch(t.lanes=0,t.tag){case 2:var a=t.type;Dr(e,t),e=t.pendingProps;var s=ln(t,le.current);rn(t,n),s=Al(null,t,a,e,s,n);var l=Rl();return t.flags|=1,typeof s=="object"&&s!==null&&typeof s.render=="function"&&s.$$typeof===void 0?(t.tag=1,t.memoizedState=null,t.updateQueue=null,he(a)?(l=!0,Xr(t)):l=!1,t.memoizedState=s.state!==null&&s.state!==void 0?s.state:null,_l(t),s.updater=ka,t.stateNode=s,s._reactInternals=t,Os(t,a,e,n),t=$s(null,t,a,!0,l,n)):(t.tag=0,O&&l&&Nl(t),oe(null,t,s,n),t=t.child),t;case 16:a=t.elementType;e:{switch(Dr(e,t),e=t.pendingProps,s=a._init,a=s(a._payload),t.type=a,s=t.tag=vp(a),e=Te(a,e),s){case 0:t=Us(null,t,a,e,n);break e;case 1:t=Yi(null,t,a,e,n);break e;case 11:t=Qi(null,t,a,e,n);break e;case 14:t=qi(null,t,a,Te(a.type,e),n);break e}throw Error(k(306,a,""))}return t;case 0:return a=t.type,s=t.pendingProps,s=t.elementType===a?s:Te(a,s),Us(e,t,a,s,n);case 1:return a=t.type,s=t.pendingProps,s=t.elementType===a?s:Te(a,s),Yi(e,t,a,s,n);case 3:e:{if(pc(t),e===null)throw Error(k(387));a=t.pendingProps,l=t.memoizedState,s=l.element,Fd(e,t),ra(t,a,null,n);var i=t.memoizedState;if(a=i.element,l.isDehydrated)if(l={element:a,isDehydrated:!1,cache:i.cache,pendingSuspenseBoundaries:i.pendingSuspenseBoundaries,transitions:i.transitions},t.updateQueue.baseState=l,t.memoizedState=l,t.flags&256){s=un(Error(k(423)),t),t=Xi(e,t,a,n,s);break e}else if(a!==s){s=un(Error(k(424)),t),t=Xi(e,t,a,n,s);break e}else for(ye=ut(t.stateNode.containerInfo.firstChild),we=t,O=!0,Me=null,n=Dd(t,null,a,n),t.child=n;n;)n.flags=n.flags&-3|4096,n=n.sibling;else{if(on(),a===s){t=Xe(e,t,n);break e}oe(e,t,a,n)}t=t.child}return t;case 5:return Ud(t),e===null&&As(t),a=t.type,s=t.pendingProps,l=e!==null?e.memoizedProps:null,i=s.children,_s(a,s)?i=null:l!==null&&_s(a,l)&&(t.flags|=32),mc(e,t),oe(e,t,i,n),t.child;case 6:return e===null&&As(t),null;case 13:return fc(e,t,n);case 4:return Tl(t,t.stateNode.containerInfo),a=t.pendingProps,e===null?t.child=dn(t,null,a,n):oe(e,t,a,n),t.child;case 11:return a=t.type,s=t.pendingProps,s=t.elementType===a?s:Te(a,s),Qi(e,t,a,s,n);case 7:return oe(e,t,t.pendingProps,n),t.child;case 8:return oe(e,t,t.pendingProps.children,n),t.child;case 12:return oe(e,t,t.pendingProps.children,n),t.child;case 10:e:{if(a=t.type._context,s=t.pendingProps,l=t.memoizedProps,i=s.value,A(ta,a._currentValue),a._currentValue=i,l!==null)if(Re(l.value,i)){if(l.children===s.children&&!fe.current){t=Xe(e,t,n);break e}}else for(l=t.child,l!==null&&(l.return=t);l!==null;){var o=l.dependencies;if(o!==null){i=l.child;for(var d=o.firstContext;d!==null;){if(d.context===a){if(l.tag===1){d=Ke(-1,n&-n),d.tag=2;var c=l.updateQueue;if(c!==null){c=c.shared;var h=c.pending;h===null?d.next=d:(d.next=h.next,h.next=d),c.pending=d}}l.lanes|=n,d=l.alternate,d!==null&&(d.lanes|=n),Rs(l.return,n,t),o.lanes|=n;break}d=d.next}}else if(l.tag===10)i=l.type===t.type?null:l.child;else if(l.tag===18){if(i=l.return,i===null)throw Error(k(341));i.lanes|=n,o=i.alternate,o!==null&&(o.lanes|=n),Rs(i,n,t),i=l.sibling}else i=l.child;if(i!==null)i.return=l;else for(i=l;i!==null;){if(i===t){i=null;break}if(l=i.sibling,l!==null){l.return=i.return,i=l;break}i=i.return}l=i}oe(e,t,s.children,n),t=t.child}return t;case 9:return s=t.type,a=t.pendingProps.children,rn(t,n),s=Le(s),a=a(s),t.flags|=1,oe(e,t,a,n),t.child;case 14:return a=t.type,s=Te(a,t.pendingProps),s=Te(a.type,s),qi(e,t,a,s,n);case 15:return cc(e,t,t.type,t.pendingProps,n);case 17:return a=t.type,s=t.pendingProps,s=t.elementType===a?s:Te(a,s),Dr(e,t),t.tag=1,he(a)?(e=!0,Xr(t)):e=!1,rn(t,n),ic(t,a,s),Os(t,a,s,n),$s(null,t,a,!0,e,n);case 19:return hc(e,t,n);case 22:return uc(e,t,n)}throw Error(k(156,t.tag))};function _c(e,t){return ad(e,t)}function gp(e,t,n,a){this.tag=e,this.key=n,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=a,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function Ce(e,t,n,a){return new gp(e,t,n,a)}function Jl(e){return e=e.prototype,!(!e||!e.isReactComponent)}function vp(e){if(typeof e=="function")return Jl(e)?1:0;if(e!=null){if(e=e.$$typeof,e===ml)return 11;if(e===pl)return 14}return 2}function ht(e,t){var n=e.alternate;return n===null?(n=Ce(e.tag,t,e.key,e.mode),n.elementType=e.elementType,n.type=e.type,n.stateNode=e.stateNode,n.alternate=e,e.alternate=n):(n.pendingProps=t,n.type=e.type,n.flags=0,n.subtreeFlags=0,n.deletions=null),n.flags=e.flags&14680064,n.childLanes=e.childLanes,n.lanes=e.lanes,n.child=e.child,n.memoizedProps=e.memoizedProps,n.memoizedState=e.memoizedState,n.updateQueue=e.updateQueue,t=e.dependencies,n.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},n.sibling=e.sibling,n.index=e.index,n.ref=e.ref,n}function Ur(e,t,n,a,s,l){var i=2;if(a=e,typeof e=="function")Jl(e)&&(i=1);else if(typeof e=="string")i=5;else e:switch(e){case $t:return It(n.children,s,l,t);case ul:i=8,s|=8;break;case ds:return e=Ce(12,n,t,s|2),e.elementType=ds,e.lanes=l,e;case cs:return e=Ce(13,n,t,s),e.elementType=cs,e.lanes=l,e;case us:return e=Ce(19,n,t,s),e.elementType=us,e.lanes=l,e;case Uo:return Na(n,s,l,t);default:if(typeof e=="object"&&e!==null)switch(e.$$typeof){case Oo:i=10;break e;case Fo:i=9;break e;case ml:i=11;break e;case pl:i=14;break e;case tt:i=16,a=null;break e}throw Error(k(130,e==null?e:typeof e,""))}return t=Ce(i,n,t,s),t.elementType=e,t.type=a,t.lanes=l,t}function It(e,t,n,a){return e=Ce(7,e,a,t),e.lanes=n,e}function Na(e,t,n,a){return e=Ce(22,e,a,t),e.elementType=Uo,e.lanes=n,e.stateNode={isHidden:!1},e}function as(e,t,n){return e=Ce(6,e,null,t),e.lanes=n,e}function ss(e,t,n){return t=Ce(4,e.children!==null?e.children:[],e.key,t),t.lanes=n,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}function yp(e,t,n,a,s){this.tag=t,this.containerInfo=e,this.finishedWork=this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.pendingContext=this.context=null,this.callbackPriority=0,this.eventTimes=Oa(0),this.expirationTimes=Oa(-1),this.entangledLanes=this.finishedLanes=this.mutableReadLanes=this.expiredLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=Oa(0),this.identifierPrefix=a,this.onRecoverableError=s,this.mutableSourceEagerHydrationData=null}function Kl(e,t,n,a,s,l,i,o,d){return e=new yp(e,t,n,o,d),t===1?(t=1,l===!0&&(t|=8)):t=0,l=Ce(3,null,null,t),e.current=l,l.stateNode=e,l.memoizedState={element:a,isDehydrated:n,cache:null,transitions:null,pendingSuspenseBoundaries:null},_l(l),e}function wp(e,t,n){var a=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:Ut,key:a==null?null:""+a,children:e,containerInfo:t,implementation:n}}function Tc(e){if(!e)return vt;e=e._reactInternals;e:{if(Rt(e)!==e||e.tag!==1)throw Error(k(170));var t=e;do{switch(t.tag){case 3:t=t.stateNode.context;break e;case 1:if(he(t.type)){t=t.stateNode.__reactInternalMemoizedMergedChildContext;break e}}t=t.return}while(t!==null);throw Error(k(171))}if(e.tag===1){var n=e.type;if(he(n))return Td(e,n,t)}return t}function Pc(e,t,n,a,s,l,i,o,d){return e=Kl(n,a,!0,e,s,l,i,o,d),e.context=Tc(null),n=e.current,a=de(),s=ft(n),l=Ke(a,s),l.callback=t??null,mt(n,l,s),e.current.lanes=s,lr(e,s,a),xe(e,a),e}function Sa(e,t,n,a){var s=t.current,l=de(),i=ft(s);return n=Tc(n),t.context===null?t.context=n:t.pendingContext=n,t=Ke(l,i),t.payload={element:e},a=a===void 0?null:a,a!==null&&(t.callback=a),e=mt(s,t,i),e!==null&&(Ae(e,s,i,l),zr(e,s,i)),i}function ua(e){if(e=e.current,!e.child)return null;switch(e.child.tag){case 5:return e.child.stateNode;default:return e.child.stateNode}}function oo(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var n=e.retryLane;e.retryLane=n!==0&&n<t?n:t}}function Ql(e,t){oo(e,t),(e=e.alternate)&&oo(e,t)}function kp(){return null}var Mc=typeof reportError=="function"?reportError:function(e){console.error(e)};function ql(e){this._internalRoot=e}Ca.prototype.render=ql.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error(k(409));Sa(e,t,null,null)};Ca.prototype.unmount=ql.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;zt(function(){Sa(null,e,null,null)}),t[qe]=null}};function Ca(e){this._internalRoot=e}Ca.prototype.unstable_scheduleHydration=function(e){if(e){var t=ud();e={blockedOn:null,target:e,priority:t};for(var n=0;n<rt.length&&t!==0&&t<rt[n].priority;n++);rt.splice(n,0,e),n===0&&pd(e)}};function Yl(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function Ea(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11&&(e.nodeType!==8||e.nodeValue!==" react-mount-point-unstable "))}function co(){}function jp(e,t,n,a,s){if(s){if(typeof a=="function"){var l=a;a=function(){var c=ua(i);l.call(c)}}var i=Pc(t,a,e,0,null,!1,!1,"",co);return e._reactRootContainer=i,e[qe]=i.current,Kn(e.nodeType===8?e.parentNode:e),zt(),i}for(;s=e.lastChild;)e.removeChild(s);if(typeof a=="function"){var o=a;a=function(){var c=ua(d);o.call(c)}}var d=Kl(e,0,!1,null,null,!1,!1,"",co);return e._reactRootContainer=d,e[qe]=d.current,Kn(e.nodeType===8?e.parentNode:e),zt(function(){Sa(t,d,n,a)}),d}function La(e,t,n,a,s){var l=n._reactRootContainer;if(l){var i=l;if(typeof s=="function"){var o=s;s=function(){var d=ua(i);o.call(d)}}Sa(t,i,e,s)}else i=jp(n,t,e,s,a);return ua(i)}dd=function(e){switch(e.tag){case 3:var t=e.stateNode;if(t.current.memoizedState.isDehydrated){var n=Bn(t.pendingLanes);n!==0&&(xl(t,n|1),xe(t,G()),!(M&6)&&(mn=G()+500,kt()))}break;case 13:zt(function(){var a=Ye(e,1);if(a!==null){var s=de();Ae(a,e,1,s)}}),Ql(e,1)}};gl=function(e){if(e.tag===13){var t=Ye(e,134217728);if(t!==null){var n=de();Ae(t,e,134217728,n)}Ql(e,134217728)}};cd=function(e){if(e.tag===13){var t=ft(e),n=Ye(e,t);if(n!==null){var a=de();Ae(n,e,t,a)}Ql(e,t)}};ud=function(){return z};md=function(e,t){var n=z;try{return z=e,t()}finally{z=n}};ks=function(e,t,n){switch(t){case"input":if(fs(e,n),t=n.name,n.type==="radio"&&t!=null){for(n=e;n.parentNode;)n=n.parentNode;for(n=n.querySelectorAll("input[name="+JSON.stringify(""+t)+'][type="radio"]'),t=0;t<n.length;t++){var a=n[t];if(a!==e&&a.form===e.form){var s=va(a);if(!s)throw Error(k(90));Wo(a),fs(a,s)}}}break;case"textarea":Vo(e,n);break;case"select":t=n.value,t!=null&&Zt(e,!!n.multiple,t,!1)}};Xo=Hl;Zo=zt;var bp={usingClientEntryPoint:!1,Events:[or,Gt,va,qo,Yo,Hl]},Cn={findFiberByHostInstance:Ct,bundleType:0,version:"18.3.1",rendererPackageName:"react-dom"},Np={bundleType:Cn.bundleType,version:Cn.version,rendererPackageName:Cn.rendererPackageName,rendererConfig:Cn.rendererConfig,overrideHookState:null,overrideHookStateDeletePath:null,overrideHookStateRenamePath:null,overrideProps:null,overridePropsDeletePath:null,overridePropsRenamePath:null,setErrorHandler:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:Ze.ReactCurrentDispatcher,findHostInstanceByFiber:function(e){return e=nd(e),e===null?null:e.stateNode},findFiberByHostInstance:Cn.findFiberByHostInstance||kp,findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null,reconcilerVersion:"18.3.1-next-f1338f8080-20240426"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var Br=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!Br.isDisabled&&Br.supportsFiber)try{fa=Br.inject(Np),$e=Br}catch{}}je.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=bp;je.createPortal=function(e,t){var n=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!Yl(t))throw Error(k(200));return wp(e,t,null,n)};je.createRoot=function(e,t){if(!Yl(e))throw Error(k(299));var n=!1,a="",s=Mc;return t!=null&&(t.unstable_strictMode===!0&&(n=!0),t.identifierPrefix!==void 0&&(a=t.identifierPrefix),t.onRecoverableError!==void 0&&(s=t.onRecoverableError)),t=Kl(e,1,!1,null,null,n,!1,a,s),e[qe]=t.current,Kn(e.nodeType===8?e.parentNode:e),new ql(t)};je.findDOMNode=function(e){if(e==null)return null;if(e.nodeType===1)return e;var t=e._reactInternals;if(t===void 0)throw typeof e.render=="function"?Error(k(188)):(e=Object.keys(e).join(","),Error(k(268,e)));return e=nd(t),e=e===null?null:e.stateNode,e};je.flushSync=function(e){return zt(e)};je.hydrate=function(e,t,n){if(!Ea(t))throw Error(k(200));return La(null,e,t,!0,n)};je.hydrateRoot=function(e,t,n){if(!Yl(e))throw Error(k(405));var a=n!=null&&n.hydratedSources||null,s=!1,l="",i=Mc;if(n!=null&&(n.unstable_strictMode===!0&&(s=!0),n.identifierPrefix!==void 0&&(l=n.identifierPrefix),n.onRecoverableError!==void 0&&(i=n.onRecoverableError)),t=Pc(t,null,e,1,n??null,s,!1,l,i),e[qe]=t.current,Kn(e),a)for(e=0;e<a.length;e++)n=a[e],s=n._getVersion,s=s(n._source),t.mutableSourceEagerHydrationData==null?t.mutableSourceEagerHydrationData=[n,s]:t.mutableSourceEagerHydrationData.push(n,s);return new Ca(t)};je.render=function(e,t,n){if(!Ea(t))throw Error(k(200));return La(null,e,t,!1,n)};je.unmountComponentAtNode=function(e){if(!Ea(e))throw Error(k(40));return e._reactRootContainer?(zt(function(){La(null,null,e,!1,function(){e._reactRootContainer=null,e[qe]=null})}),!0):!1};je.unstable_batchedUpdates=Hl;je.unstable_renderSubtreeIntoContainer=function(e,t,n,a){if(!Ea(n))throw Error(k(200));if(e==null||e._reactInternals===void 0)throw Error(k(38));return La(e,t,n,!1,a)};je.version="18.3.1-next-f1338f8080-20240426";function zc(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(zc)}catch(e){console.error(e)}}zc(),zo.exports=je;var Sp=zo.exports,uo=Sp;is.createRoot=uo.createRoot,is.hydrateRoot=uo.hydrateRoot;/**
 * @remix-run/router v1.23.3
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */function rr(){return rr=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var a in n)({}).hasOwnProperty.call(n,a)&&(e[a]=n[a])}return e},rr.apply(null,arguments)}var it;(function(e){e.Pop="POP",e.Push="PUSH",e.Replace="REPLACE"})(it||(it={}));const mo="popstate";function Cp(e){e===void 0&&(e={});function t(a,s){let{pathname:l,search:i,hash:o}=a.location;return el("",{pathname:l,search:i,hash:o},s.state&&s.state.usr||null,s.state&&s.state.key||"default")}function n(a,s){return typeof s=="string"?s:ma(s)}return Lp(t,n,null,e)}function K(e,t){if(e===!1||e===null||typeof e>"u")throw new Error(t)}function Xl(e,t){if(!e){typeof console<"u"&&console.warn(t);try{throw new Error(t)}catch{}}}function Ep(){return Math.random().toString(36).substr(2,8)}function po(e,t){return{usr:e.state,key:e.key,idx:t}}function el(e,t,n,a){return n===void 0&&(n=null),rr({pathname:typeof e=="string"?e:e.pathname,search:"",hash:""},typeof t=="string"?xn(t):t,{state:n,key:t&&t.key||a||Ep()})}function ma(e){let{pathname:t="/",search:n="",hash:a=""}=e;return n&&n!=="?"&&(t+=n.charAt(0)==="?"?n:"?"+n),a&&a!=="#"&&(t+=a.charAt(0)==="#"?a:"#"+a),t}function xn(e){let t={};if(e){let n=e.indexOf("#");n>=0&&(t.hash=e.substr(n),e=e.substr(0,n));let a=e.indexOf("?");a>=0&&(t.search=e.substr(a),e=e.substr(0,a)),e&&(t.pathname=e)}return t}function Lp(e,t,n,a){a===void 0&&(a={});let{window:s=document.defaultView,v5Compat:l=!1}=a,i=s.history,o=it.Pop,d=null,c=h();c==null&&(c=0,i.replaceState(rr({},i.state,{idx:c}),""));function h(){return(i.state||{idx:null}).idx}function f(){o=it.Pop;let b=h(),m=b==null?null:b-c;c=b,d&&d({action:o,location:v.location,delta:m})}function x(b,m){o=it.Push;let u=el(v.location,b,m);c=h()+1;let p=po(u,c),g=v.createHref(u);try{i.pushState(p,"",g)}catch(N){if(N instanceof DOMException&&N.name==="DataCloneError")throw N;s.location.assign(g)}l&&d&&d({action:o,location:v.location,delta:1})}function w(b,m){o=it.Replace;let u=el(v.location,b,m);c=h();let p=po(u,c),g=v.createHref(u);i.replaceState(p,"",g),l&&d&&d({action:o,location:v.location,delta:0})}function y(b){let m=s.location.origin!=="null"?s.location.origin:s.location.href,u=typeof b=="string"?b:ma(b);return u=u.replace(/ $/,"%20"),K(m,"No window.location.(origin|href) available to create URL for href: "+u),new URL(u,m)}let v={get action(){return o},get location(){return e(s,i)},listen(b){if(d)throw new Error("A history only accepts one active listener");return s.addEventListener(mo,f),d=b,()=>{s.removeEventListener(mo,f),d=null}},createHref(b){return t(s,b)},createURL:y,encodeLocation(b){let m=y(b);return{pathname:m.pathname,search:m.search,hash:m.hash}},push:x,replace:w,go(b){return i.go(b)}};return v}var fo;(function(e){e.data="data",e.deferred="deferred",e.redirect="redirect",e.error="error"})(fo||(fo={}));function Bp(e,t,n){return n===void 0&&(n="/"),Ip(e,t,n)}function Ip(e,t,n,a){let s=typeof t=="string"?xn(t):t,l=Zl(s.pathname||"/",n);if(l==null)return null;let i=Ac(e);_p(i);let o=null,d=Wp(l);for(let c=0;o==null&&c<i.length;++c)o=Fp(i[c],d);return o}function Ac(e,t,n,a){t===void 0&&(t=[]),n===void 0&&(n=[]),a===void 0&&(a="");let s=(l,i,o)=>{let d={relativePath:o===void 0?l.path||"":o,caseSensitive:l.caseSensitive===!0,childrenIndex:i,route:l};d.relativePath.startsWith("/")&&(K(d.relativePath.startsWith(a),'Absolute route path "'+d.relativePath+'" nested under path '+('"'+a+'" is not valid. An absolute child route path ')+"must start with the combined path of all its parent routes."),d.relativePath=d.relativePath.slice(a.length));let c=xt([a,d.relativePath]),h=n.concat(d);l.children&&l.children.length>0&&(K(l.index!==!0,"Index routes must not have child routes. Please remove "+('all child routes from route path "'+c+'".')),Ac(l.children,t,h,c)),!(l.path==null&&!l.index)&&t.push({path:c,score:Dp(c,l.index),routesMeta:h})};return e.forEach((l,i)=>{var o;if(l.path===""||!((o=l.path)!=null&&o.includes("?")))s(l,i);else for(let d of Rc(l.path))s(l,i,d)}),t}function Rc(e){let t=e.split("/");if(t.length===0)return[];let[n,...a]=t,s=n.endsWith("?"),l=n.replace(/\?$/,"");if(a.length===0)return s?[l,""]:[l];let i=Rc(a.join("/")),o=[];return o.push(...i.map(d=>d===""?l:[l,d].join("/"))),s&&o.push(...i),o.map(d=>e.startsWith("/")&&d===""?"/":d)}function _p(e){e.sort((t,n)=>t.score!==n.score?n.score-t.score:Op(t.routesMeta.map(a=>a.childrenIndex),n.routesMeta.map(a=>a.childrenIndex)))}const Tp=/^:[\w-]+$/,Pp=3,Mp=2,zp=1,Ap=10,Rp=-2,ho=e=>e==="*";function Dp(e,t){let n=e.split("/"),a=n.length;return n.some(ho)&&(a+=Rp),t&&(a+=Mp),n.filter(s=>!ho(s)).reduce((s,l)=>s+(Tp.test(l)?Pp:l===""?zp:Ap),a)}function Op(e,t){return e.length===t.length&&e.slice(0,-1).every((a,s)=>a===t[s])?e[e.length-1]-t[t.length-1]:0}function Fp(e,t,n){let{routesMeta:a}=e,s={},l="/",i=[];for(let o=0;o<a.length;++o){let d=a[o],c=o===a.length-1,h=l==="/"?t:t.slice(l.length)||"/",f=Up({path:d.relativePath,caseSensitive:d.caseSensitive,end:c},h),x=d.route;if(!f)return null;Object.assign(s,f.params),i.push({params:s,pathname:xt([l,f.pathname]),pathnameBase:Kp(xt([l,f.pathnameBase])),route:x}),f.pathnameBase!=="/"&&(l=xt([l,f.pathnameBase]))}return i}function Up(e,t){typeof e=="string"&&(e={path:e,caseSensitive:!1,end:!0});let[n,a]=$p(e.path,e.caseSensitive,e.end),s=t.match(n);if(!s)return null;let l=s[0],i=l.replace(/(.)\/+$/,"$1"),o=s.slice(1);return{params:a.reduce((c,h,f)=>{let{paramName:x,isOptional:w}=h;if(x==="*"){let v=o[f]||"";i=l.slice(0,l.length-v.length).replace(/(.)\/+$/,"$1")}const y=o[f];return w&&!y?c[x]=void 0:c[x]=(y||"").replace(/%2F/g,"/"),c},{}),pathname:l,pathnameBase:i,pattern:e}}function $p(e,t,n){t===void 0&&(t=!1),n===void 0&&(n=!0),Xl(e==="*"||!e.endsWith("*")||e.endsWith("/*"),'Route path "'+e+'" will be treated as if it were '+('"'+e.replace(/\*$/,"/*")+'" because the `*` character must ')+"always follow a `/` in the pattern. To get rid of this warning, "+('please change the route path to "'+e.replace(/\*$/,"/*")+'".'));let a=[],s="^"+e.replace(/\/*\*?$/,"").replace(/^\/*/,"/").replace(/[\\.*+^${}|()[\]]/g,"\\$&").replace(/\/:([\w-]+)(\?)?/g,(i,o,d)=>(a.push({paramName:o,isOptional:d!=null}),d?"/?([^\\/]+)?":"/([^\\/]+)"));return e.endsWith("*")?(a.push({paramName:"*"}),s+=e==="*"||e==="/*"?"(.*)$":"(?:\\/(.+)|\\/*)$"):n?s+="\\/*$":e!==""&&e!=="/"&&(s+="(?:(?=\\/|$))"),[new RegExp(s,t?void 0:"i"),a]}function Wp(e){try{return e.split("/").map(t=>decodeURIComponent(t).replace(/\//g,"%2F")).join("/")}catch(t){return Xl(!1,'The URL path "'+e+'" could not be decoded because it is is a malformed URL segment. This is probably due to a bad percent '+("encoding ("+t+").")),e}}function Zl(e,t){if(t==="/")return e;if(!e.toLowerCase().startsWith(t.toLowerCase()))return null;let n=t.endsWith("/")?t.length-1:t.length,a=e.charAt(n);return a&&a!=="/"?null:e.slice(n)||"/"}const Hp=/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i,Vp=e=>Hp.test(e);function Gp(e,t){t===void 0&&(t="/");let{pathname:n,search:a="",hash:s=""}=typeof e=="string"?xn(e):e,l;if(n)if(Vp(n))l=n;else{if(n.includes("//")){let i=n;n=Fc(n),Xl(!1,"Pathnames cannot have embedded double slashes - normalizing "+(i+" -> "+n))}n.startsWith("/")?l=xo(n.substring(1),"/"):l=xo(n,t)}else l=t;return{pathname:l,search:Qp(a),hash:qp(s)}}function xo(e,t){let n=t.replace(/\/+$/,"").split("/");return e.split("/").forEach(s=>{s===".."?n.length>1&&n.pop():s!=="."&&n.push(s)}),n.length>1?n.join("/"):"/"}function ls(e,t,n,a){return"Cannot include a '"+e+"' character in a manually specified "+("`to."+t+"` field ["+JSON.stringify(a)+"].  Please separate it out to the ")+("`to."+n+"` field. Alternatively you may provide the full path as ")+'a string in <Link to="..."> and the router will parse it for you.'}function Jp(e){return e.filter((t,n)=>n===0||t.route.path&&t.route.path.length>0)}function Dc(e,t){let n=Jp(e);return t?n.map((a,s)=>s===n.length-1?a.pathname:a.pathnameBase):n.map(a=>a.pathnameBase)}function Oc(e,t,n,a){a===void 0&&(a=!1);let s;typeof e=="string"?s=xn(e):(s=rr({},e),K(!s.pathname||!s.pathname.includes("?"),ls("?","pathname","search",s)),K(!s.pathname||!s.pathname.includes("#"),ls("#","pathname","hash",s)),K(!s.search||!s.search.includes("#"),ls("#","search","hash",s)));let l=e===""||s.pathname==="",i=l?"/":s.pathname,o;if(i==null)o=n;else{let f=t.length-1;if(!a&&i.startsWith("..")){let x=i.split("/");for(;x[0]==="..";)x.shift(),f-=1;s.pathname=x.join("/")}o=f>=0?t[f]:"/"}let d=Gp(s,o),c=i&&i!=="/"&&i.endsWith("/"),h=(l||i===".")&&n.endsWith("/");return!d.pathname.endsWith("/")&&(c||h)&&(d.pathname+="/"),d}const Fc=e=>e.replace(/\/\/+/g,"/"),xt=e=>Fc(e.join("/")),Kp=e=>e.replace(/\/+$/,"").replace(/^\/*/,"/"),Qp=e=>!e||e==="?"?"":e.startsWith("?")?e:"?"+e,qp=e=>!e||e==="#"?"":e.startsWith("#")?e:"#"+e;function Yp(e){return e!=null&&typeof e.status=="number"&&typeof e.statusText=="string"&&typeof e.internal=="boolean"&&"data"in e}const Uc=["post","put","patch","delete"];new Set(Uc);const Xp=["get",...Uc];new Set(Xp);/**
 * React Router v6.30.4
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */function ar(){return ar=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var a in n)({}).hasOwnProperty.call(n,a)&&(e[a]=n[a])}return e},ar.apply(null,arguments)}const ei=j.createContext(null),Zp=j.createContext(null),Dt=j.createContext(null),Ba=j.createContext(null),Ot=j.createContext({outlet:null,matches:[],isDataRoute:!1}),$c=j.createContext(null);function ef(e,t){let{relative:n}=t===void 0?{}:t;cr()||K(!1);let{basename:a,navigator:s}=j.useContext(Dt),{hash:l,pathname:i,search:o}=Hc(e,{relative:n}),d=i;return a!=="/"&&(d=i==="/"?a:xt([a,i])),s.createHref({pathname:d,search:o,hash:l})}function cr(){return j.useContext(Ba)!=null}function Ia(){return cr()||K(!1),j.useContext(Ba).location}function Wc(e){j.useContext(Dt).static||j.useLayoutEffect(e)}function ge(){let{isDataRoute:e}=j.useContext(Ot);return e?ff():tf()}function tf(){cr()||K(!1);let e=j.useContext(ei),{basename:t,future:n,navigator:a}=j.useContext(Dt),{matches:s}=j.useContext(Ot),{pathname:l}=Ia(),i=JSON.stringify(Dc(s,n.v7_relativeSplatPath)),o=j.useRef(!1);return Wc(()=>{o.current=!0}),j.useCallback(function(c,h){if(h===void 0&&(h={}),!o.current)return;if(typeof c=="number"){a.go(c);return}let f=Oc(c,JSON.parse(i),l,h.relative==="path");e==null&&t!=="/"&&(f.pathname=f.pathname==="/"?t:xt([t,f.pathname])),(h.replace?a.replace:a.push)(f,h.state,h)},[t,a,i,l,e])}function Hc(e,t){let{relative:n}=t===void 0?{}:t,{future:a}=j.useContext(Dt),{matches:s}=j.useContext(Ot),{pathname:l}=Ia(),i=JSON.stringify(Dc(s,a.v7_relativeSplatPath));return j.useMemo(()=>Oc(e,JSON.parse(i),l,n==="path"),[e,i,l,n])}function nf(e,t){return rf(e,t)}function rf(e,t,n,a){cr()||K(!1);let{navigator:s}=j.useContext(Dt),{matches:l}=j.useContext(Ot),i=l[l.length-1],o=i?i.params:{};i&&i.pathname;let d=i?i.pathnameBase:"/";i&&i.route;let c=Ia(),h;if(t){var f;let b=typeof t=="string"?xn(t):t;d==="/"||(f=b.pathname)!=null&&f.startsWith(d)||K(!1),h=b}else h=c;let x=h.pathname||"/",w=x;if(d!=="/"){let b=d.replace(/^\//,"").split("/");w="/"+x.replace(/^\//,"").split("/").slice(b.length).join("/")}let y=Bp(e,{pathname:w}),v=df(y&&y.map(b=>Object.assign({},b,{params:Object.assign({},o,b.params),pathname:xt([d,s.encodeLocation?s.encodeLocation(b.pathname).pathname:b.pathname]),pathnameBase:b.pathnameBase==="/"?d:xt([d,s.encodeLocation?s.encodeLocation(b.pathnameBase).pathname:b.pathnameBase])})),l,n,a);return t&&v?j.createElement(Ba.Provider,{value:{location:ar({pathname:"/",search:"",hash:"",state:null,key:"default"},h),navigationType:it.Pop}},v):v}function af(){let e=pf(),t=Yp(e)?e.status+" "+e.statusText:e instanceof Error?e.message:JSON.stringify(e),n=e instanceof Error?e.stack:null,s={padding:"0.5rem",backgroundColor:"rgba(200,200,200, 0.5)"};return j.createElement(j.Fragment,null,j.createElement("h2",null,"Unexpected Application Error!"),j.createElement("h3",{style:{fontStyle:"italic"}},t),n?j.createElement("pre",{style:s},n):null,null)}const sf=j.createElement(af,null);class lf extends j.Component{constructor(t){super(t),this.state={location:t.location,revalidation:t.revalidation,error:t.error}}static getDerivedStateFromError(t){return{error:t}}static getDerivedStateFromProps(t,n){return n.location!==t.location||n.revalidation!=="idle"&&t.revalidation==="idle"?{error:t.error,location:t.location,revalidation:t.revalidation}:{error:t.error!==void 0?t.error:n.error,location:n.location,revalidation:t.revalidation||n.revalidation}}componentDidCatch(t,n){console.error("React Router caught the following error during render",t,n)}render(){return this.state.error!==void 0?j.createElement(Ot.Provider,{value:this.props.routeContext},j.createElement($c.Provider,{value:this.state.error,children:this.props.component})):this.props.children}}function of(e){let{routeContext:t,match:n,children:a}=e,s=j.useContext(ei);return s&&s.static&&s.staticContext&&(n.route.errorElement||n.route.ErrorBoundary)&&(s.staticContext._deepestRenderedBoundaryId=n.route.id),j.createElement(Ot.Provider,{value:t},a)}function df(e,t,n,a){var s;if(t===void 0&&(t=[]),n===void 0&&(n=null),a===void 0&&(a=null),e==null){var l;if(!n)return null;if(n.errors)e=n.matches;else if((l=a)!=null&&l.v7_partialHydration&&t.length===0&&!n.initialized&&n.matches.length>0)e=n.matches;else return null}let i=e,o=(s=n)==null?void 0:s.errors;if(o!=null){let h=i.findIndex(f=>f.route.id&&(o==null?void 0:o[f.route.id])!==void 0);h>=0||K(!1),i=i.slice(0,Math.min(i.length,h+1))}let d=!1,c=-1;if(n&&a&&a.v7_partialHydration)for(let h=0;h<i.length;h++){let f=i[h];if((f.route.HydrateFallback||f.route.hydrateFallbackElement)&&(c=h),f.route.id){let{loaderData:x,errors:w}=n,y=f.route.loader&&x[f.route.id]===void 0&&(!w||w[f.route.id]===void 0);if(f.route.lazy||y){d=!0,c>=0?i=i.slice(0,c+1):i=[i[0]];break}}}return i.reduceRight((h,f,x)=>{let w,y=!1,v=null,b=null;n&&(w=o&&f.route.id?o[f.route.id]:void 0,v=f.route.errorElement||sf,d&&(c<0&&x===0?(hf("route-fallback"),y=!0,b=null):c===x&&(y=!0,b=f.route.hydrateFallbackElement||null)));let m=t.concat(i.slice(0,x+1)),u=()=>{let p;return w?p=v:y?p=b:f.route.Component?p=j.createElement(f.route.Component,null):f.route.element?p=f.route.element:p=h,j.createElement(of,{match:f,routeContext:{outlet:h,matches:m,isDataRoute:n!=null},children:p})};return n&&(f.route.ErrorBoundary||f.route.errorElement||x===0)?j.createElement(lf,{location:n.location,revalidation:n.revalidation,component:v,error:w,children:u(),routeContext:{outlet:null,matches:m,isDataRoute:!0}}):u()},null)}var Vc=function(e){return e.UseBlocker="useBlocker",e.UseRevalidator="useRevalidator",e.UseNavigateStable="useNavigate",e}(Vc||{}),Gc=function(e){return e.UseBlocker="useBlocker",e.UseLoaderData="useLoaderData",e.UseActionData="useActionData",e.UseRouteError="useRouteError",e.UseNavigation="useNavigation",e.UseRouteLoaderData="useRouteLoaderData",e.UseMatches="useMatches",e.UseRevalidator="useRevalidator",e.UseNavigateStable="useNavigate",e.UseRouteId="useRouteId",e}(Gc||{});function cf(e){let t=j.useContext(ei);return t||K(!1),t}function uf(e){let t=j.useContext(Zp);return t||K(!1),t}function mf(e){let t=j.useContext(Ot);return t||K(!1),t}function Jc(e){let t=mf(),n=t.matches[t.matches.length-1];return n.route.id||K(!1),n.route.id}function pf(){var e;let t=j.useContext($c),n=uf(),a=Jc();return t!==void 0?t:(e=n.errors)==null?void 0:e[a]}function ff(){let{router:e}=cf(Vc.UseNavigateStable),t=Jc(Gc.UseNavigateStable),n=j.useRef(!1);return Wc(()=>{n.current=!0}),j.useCallback(function(s,l){l===void 0&&(l={}),n.current&&(typeof s=="number"?e.navigate(s):e.navigate(s,ar({fromRouteId:t},l)))},[e,t])}const go={};function hf(e,t,n){go[e]||(go[e]=!0)}function xf(e,t){e==null||e.v7_startTransition,e==null||e.v7_relativeSplatPath}function ie(e){K(!1)}function gf(e){let{basename:t="/",children:n=null,location:a,navigationType:s=it.Pop,navigator:l,static:i=!1,future:o}=e;cr()&&K(!1);let d=t.replace(/^\/*/,"/"),c=j.useMemo(()=>({basename:d,navigator:l,static:i,future:ar({v7_relativeSplatPath:!1},o)}),[d,o,l,i]);typeof a=="string"&&(a=xn(a));let{pathname:h="/",search:f="",hash:x="",state:w=null,key:y="default"}=a,v=j.useMemo(()=>{let b=Zl(h,d);return b==null?null:{location:{pathname:b,search:f,hash:x,state:w,key:y},navigationType:s}},[d,h,f,x,w,y,s]);return v==null?null:j.createElement(Dt.Provider,{value:c},j.createElement(Ba.Provider,{children:n,value:v}))}function vf(e){let{children:t,location:n}=e;return nf(tl(t),n)}new Promise(()=>{});function tl(e,t){t===void 0&&(t=[]);let n=[];return j.Children.forEach(e,(a,s)=>{if(!j.isValidElement(a))return;let l=[...t,s];if(a.type===j.Fragment){n.push.apply(n,tl(a.props.children,l));return}a.type!==ie&&K(!1),!a.props.index||!a.props.children||K(!1);let i={id:a.props.id||l.join("-"),caseSensitive:a.props.caseSensitive,element:a.props.element,Component:a.props.Component,index:a.props.index,path:a.props.path,loader:a.props.loader,action:a.props.action,errorElement:a.props.errorElement,ErrorBoundary:a.props.ErrorBoundary,hasErrorBoundary:a.props.ErrorBoundary!=null||a.props.errorElement!=null,shouldRevalidate:a.props.shouldRevalidate,handle:a.props.handle,lazy:a.props.lazy};a.props.children&&(i.children=tl(a.props.children,l)),n.push(i)}),n}/**
 * React Router DOM v6.30.4
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */function nl(){return nl=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var a in n)({}).hasOwnProperty.call(n,a)&&(e[a]=n[a])}return e},nl.apply(null,arguments)}function yf(e,t){if(e==null)return{};var n={};for(var a in e)if({}.hasOwnProperty.call(e,a)){if(t.indexOf(a)!==-1)continue;n[a]=e[a]}return n}function wf(e){return!!(e.metaKey||e.altKey||e.ctrlKey||e.shiftKey)}function kf(e,t){return e.button===0&&(!t||t==="_self")&&!wf(e)}const jf=["onClick","relative","reloadDocument","replace","state","target","to","preventScrollReset","viewTransition"],bf="6";try{window.__reactRouterVersion=bf}catch{}const Nf="startTransition",vo=fu[Nf];function Sf(e){let{basename:t,children:n,future:a,window:s}=e,l=j.useRef();l.current==null&&(l.current=Cp({window:s,v5Compat:!0}));let i=l.current,[o,d]=j.useState({action:i.action,location:i.location}),{v7_startTransition:c}=a||{},h=j.useCallback(f=>{c&&vo?vo(()=>d(f)):d(f)},[d,c]);return j.useLayoutEffect(()=>i.listen(h),[i,h]),j.useEffect(()=>xf(a),[a]),j.createElement(gf,{basename:t,children:n,location:o.location,navigationType:o.action,navigator:i,future:a})}const Cf=typeof window<"u"&&typeof window.document<"u"&&typeof window.document.createElement<"u",Ef=/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i,rl=j.forwardRef(function(t,n){let{onClick:a,relative:s,reloadDocument:l,replace:i,state:o,target:d,to:c,preventScrollReset:h,viewTransition:f}=t,x=yf(t,jf),{basename:w}=j.useContext(Dt),y,v=!1;if(typeof c=="string"&&Ef.test(c)&&(y=c,Cf))try{let p=new URL(window.location.href),g=c.startsWith("//")?new URL(p.protocol+c):new URL(c),N=Zl(g.pathname,w);g.origin===p.origin&&N!=null?c=N+g.search+g.hash:v=!0}catch{}let b=ef(c,{relative:s}),m=Lf(c,{replace:i,state:o,target:d,preventScrollReset:h,relative:s,viewTransition:f});function u(p){a&&a(p),p.defaultPrevented||m(p)}return j.createElement("a",nl({},x,{href:y||b,onClick:v||l?a:u,ref:n,target:d}))});var yo;(function(e){e.UseScrollRestoration="useScrollRestoration",e.UseSubmit="useSubmit",e.UseSubmitFetcher="useSubmitFetcher",e.UseFetcher="useFetcher",e.useViewTransitionState="useViewTransitionState"})(yo||(yo={}));var wo;(function(e){e.UseFetcher="useFetcher",e.UseFetchers="useFetchers",e.UseScrollRestoration="useScrollRestoration"})(wo||(wo={}));function Lf(e,t){let{target:n,replace:a,state:s,preventScrollReset:l,relative:i,viewTransition:o}=t===void 0?{}:t,d=ge(),c=Ia(),h=Hc(e,{relative:i});return j.useCallback(f=>{if(kf(f,n)){f.preventDefault();let x=a!==void 0?a:ma(c)===ma(h);d(e,{replace:x,state:s,preventScrollReset:l,relative:i,viewTransition:o})}},[c,d,h,a,s,n,e,l,i,o])}function ko(){return r.jsxs("div",{className:"gahar-logo-btn",onClick:()=>window.location.href="/",children:[r.jsx("img",{src:"/assets/logo.png",alt:"JogjaCourt Logo",className:"gahar-logo-img"}),r.jsx("div",{className:"gahar-logo-text",children:r.jsxs("span",{className:"gahar-logo-title",children:["JOGJA",r.jsx("span",{className:"text-brand",children:"COURT"})]})})]})}function jo(){ge();const[e,t]=j.useState({areas:"—",venues:"—",courts:"—"});return j.useEffect(()=>{(async()=>{try{if(window.api){const[a,s,l]=await Promise.all([window.api.get("/venues"),window.api.get("/courts"),window.api.get("/locations")]);t({areas:(l==null?void 0:l.length)||5,venues:(a==null?void 0:a.length)||15,courts:(s==null?void 0:s.length)||50})}else t({areas:5,venues:15,courts:50})}catch(a){console.error("Failed to load stats",a)}})()},[]),j.useEffect(()=>{const n=document.createElement("script");return n.innerHTML=`
        // Navbar scroll effect
        window.addEventListener('scroll', () => {
            document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
        });

        // Show notification bell if authenticated
        if (auth.isAuthenticated()) {
            const bellWrap = document.getElementById('notifBellWrap');
            if (bellWrap) bellWrap.classList.remove('hidden');
            if (typeof Notifications !== 'undefined') Notifications.init();
        }

        // Load live stats from API
        (async () => {
            try {
                const [areas, venues, courts] = await Promise.all([
                    api.get('/areas'),
                    api.get('/venues'),
                    api.get('/courts')
                ]);

                const animateCount = (el, target) => {
                    el.classList.remove('stat-loading');
                    let current = 0;
                    const step = Math.max(1, Math.floor(target / 20));
                    const timer = setInterval(() => {
                        current = Math.min(current + step, target);
                        el.textContent = current;
                        if (current >= target) clearInterval(timer);
                    }, 40);
                };

                animateCount(document.getElementById('statAreas'), areas.length);
                animateCount(document.getElementById('statVenues'), venues.length);
                animateCount(document.getElementById('statCourts'), courts.length);
            } catch (e) {
                document.getElementById('statRow').style.display = 'none';
            }
        })();

        // Scroll Reveal Animation
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

        // Close mobile menu when clicking anchor links
        document.querySelectorAll('#mobileMenu a[href^="#"]').forEach(link => {
            link.addEventListener('click', () => {
                document.getElementById('mobileMenu').classList.remove('open');
            });
        });
    

        // === GAHAR 3D PARALLAX SCROLL ENGINE ===
        document.addEventListener('DOMContentLoaded', () => {
            const isMobile = window.matchMedia('(max-width: 768px)').matches;

            if (!isMobile) {
                gsap.registerPlugin(ScrollTrigger);

                const showcase = document.getElementById('parallax-showcase');
                const motion   = document.getElementById('parallaxMotion');
                const row1     = document.getElementById('pxRow1');
                const row2     = document.getElementById('pxRow2');
                const row3     = document.getElementById('pxRow3');
                const row4     = document.getElementById('pxRow4');

                if (showcase && motion) {
                    const tl = gsap.timeline({
                        scrollTrigger: {
                            trigger: showcase,
                            start: 'top top',
                            end: 'bottom top',
                            scrub: 1.5 // Memberikan efek "soft delay" (halus) selama 1.5 detik saat discroll
                        }
                    });

                    // 3D rotation unwind: starts tilted, ends flat
                    tl.fromTo(motion, {
                        rotateX: 25, rotateZ: -15, translateY: -200, opacity: 0.3, scale: 0.9
                    }, {
                        rotateX: 0, rotateZ: 0, translateY: 0, opacity: 1, scale: 1,
                        ease: 'power1.inOut', duration: 1
                    }, 0);

                    // Row translations: alternate directions
                    tl.fromTo(row1, { x: 200 },  { x: -600,  ease: 'power1.inOut', duration: 1 }, 0);
                    tl.fromTo(row2, { x: -200 }, { x: 400,   ease: 'power1.inOut', duration: 1 }, 0);
                    tl.fromTo(row3, { x: 300 },  { x: -500,  ease: 'power1.inOut', duration: 1 }, 0);
                    tl.fromTo(row4, { x: -300 }, { x: 500,   ease: 'power1.inOut', duration: 1 }, 0);

                    // Animate title slightly for more depth
                    const titleOverlay = document.getElementById('parallaxTitle');
                    if(titleOverlay) {
                        tl.fromTo(titleOverlay, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, ease: 'power2.out', duration: 0.4 }, 0);
                    }
                }

                // --- HERO EXIT 2D ANIMATION ---
                const heroInner = document.getElementById('heroInner');
                const heroSection = document.getElementById('heroSection');
                if(heroInner && heroSection) {
                    gsap.to(heroInner, {
                        scrollTrigger: {
                            trigger: heroSection,
                            start: 'top top',
                            end: 'bottom top',
                            scrub: 1.5
                        },
                        y: 150,
                        ease: 'none',
                        force3D: true
                    });
                }

                // --- MARQUEE CARD REVEAL ANIMATION ---
                gsap.fromTo('.reveal-card', 
                    { opacity: 0, scale: 0.5, rotationY: 15 },
                    {
                        scrollTrigger: {
                            trigger: '#features',
                            start: 'top 80%',
                            toggleActions: 'play none none none'
                        },
                        opacity: 1,
                        scale: 1,
                        rotationY: 0,
                        duration: 1.0,
                        stagger: 0.1,
                        ease: 'back.out(1.5)',
                        clearProps: 'all',
                        onComplete: () => {
                            const track = document.querySelector('.marquee-track');
                            if(track) track.style.animationPlayState = 'running';
                        }
                    }
                );

                // --- CINEMATIC FOOTER GSAP ANIMATIONS ---
                const footerWrap = document.getElementById('cinematicFooterWrap');
                const footerGiantText = document.getElementById('footerGiantText');
                const footerHeading = document.getElementById('footerHeading');
                const footerLinks = document.getElementById('footerLinks');

                if(footerWrap && footerGiantText) {
                    gsap.fromTo(footerGiantText,
                        { y: '15vh', scale: 0.8, opacity: 0 },
                        {
                            y: '0vh', scale: 1, opacity: 1,
                            ease: 'power1.out',
                            scrollTrigger: {
                                trigger: footerWrap,
                                start: 'top 80%',
                                end: 'bottom bottom',
                                scrub: 1.5
                            }
                        }
                    );
                }

                if(footerWrap && footerHeading && footerLinks) {
                    gsap.fromTo([footerHeading, footerLinks],
                        { y: 60, opacity: 0 },
                        {
                            y: 0, opacity: 1,
                            stagger: 0.2,
                            ease: 'power3.out',
                            scrollTrigger: {
                                trigger: footerWrap,
                                start: 'top 45%',
                                end: 'bottom bottom',
                                scrub: 1.5
                            }
                        }
                    );
                }

                // --- MAGNETIC PILL HOVER EFFECT ---
                document.querySelectorAll('.magnetic-pill').forEach(pill => {
                    pill.addEventListener('mousemove', (e) => {
                        const rect = pill.getBoundingClientRect();
                        const x = e.clientX - rect.left - rect.width / 2;
                        const y = e.clientY - rect.top - rect.height / 2;
                        gsap.to(pill, {
                            x: x * 0.3, y: y * 0.3,
                            rotationX: -y * 0.08, rotationY: x * 0.08,
                            scale: 1.05,
                            ease: 'power2.out', duration: 0.4
                        });
                    });
                    pill.addEventListener('mouseleave', () => {
                        gsap.to(pill, {
                            x: 0, y: 0, rotationX: 0, rotationY: 0, scale: 1,
                            ease: 'elastic.out(1, 0.3)', duration: 1.2
                        });
                    });
                });

                // Lenis Smooth Scroll
                const lenis = new Lenis({
                    duration: 1.35,
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                    smoothTouch: false,
                    touchMultiplier: 2
                });
                lenis.on('scroll', ScrollTrigger.update);
                gsap.ticker.add((time) => { lenis.raf(time * 1000); });
            } else {
                // If mobile, just play the marquee normally since GSAP scrollTrigger is disabled
                const track = document.querySelector('.marquee-track');
                if(track) track.style.animationPlayState = 'running';
                
                // Show feature cards instantly on mobile
                document.querySelectorAll('.reveal-card').forEach(el => {
                    el.style.opacity = '1';
                    el.style.transform = 'none';
                });
            }
        });
    

        // === STAGGER TESTIMONIALS LOGIC ===
        document.addEventListener('DOMContentLoaded', () => {
            const rawTestimonials = [];

            let testimonialsList = [...rawTestimonials];
            let cardSize = window.matchMedia("(min-width: 640px)").matches ? 365 : 290;
            const container = document.getElementById('staggerContainer');
            
            if (!container) return;

            // Check auth for button
            if (typeof auth !== 'undefined' && auth.isAuthenticated()) {
                const btnContainer = document.getElementById('reviewActionContainer');
                if (btnContainer) btnContainer.classList.remove('hidden');
            }

            // Fetch dynamic testimonials
            async function fetchDynamicTestimonials() {
                try {
                    const data = await api.get('/testimonials/public');
                    if (data && data.length > 0) {
                        testimonialsList = data.map(t => ({
                            testimonial: t.content,
                            by: t.user_name,
                            imgSrc: t.user_profile_image || '',
                            tempId: Math.random()
                        }));
                        renderCards();
                    }
                } catch (e) {
                    console.log("Using fallback testimonials.");
                }
            }
            fetchDynamicTestimonials();

            const updateSize = () => {
                const matches = window.matchMedia("(min-width: 640px)").matches;
                cardSize = matches ? 365 : 290;
                renderCards();
            };
            window.addEventListener("resize", updateSize);

            const handleMove = (steps) => {
                if (steps > 0) {
                    for (let i = 0; i < steps; i++) {
                        const item = testimonialsList.shift();
                        testimonialsList.push({ ...item, tempId: Math.random() });
                    }
                } else {
                    for (let i = 0; i > steps; i--) {
                        const item = testimonialsList.pop();
                        testimonialsList.unshift({ ...item, tempId: Math.random() });
                    }
                }
                renderCards();
            };

            document.getElementById('prevTestimonial').addEventListener('click', () => handleMove(-1));
            document.getElementById('nextTestimonial').addEventListener('click', () => handleMove(1));

            // Setup a wrapper to hold cards so buttons stay on top easily
            const cardsWrapper = document.createElement('div');
            cardsWrapper.style.position = 'absolute';
            cardsWrapper.style.inset = '0';
            cardsWrapper.style.pointerEvents = 'none'; // let clicks pass to cards
            container.insertBefore(cardsWrapper, container.firstChild);

            function renderCards() {
                cardsWrapper.innerHTML = ''; // Clear old cards
                
                testimonialsList.forEach((testimonial, index) => {
                    const position = testimonialsList.length % 2
                        ? index - Math.floor(testimonialsList.length / 2)
                        : index - testimonialsList.length / 2;
                        
                    const isCenter = position === 0;

                    const card = document.createElement('div');
                    card.className = \`stagger-card \${isCenter ? 'is-center' : ''}\`;
                    card.style.width = \`\${cardSize}px\`;
                    card.style.height = \`\${cardSize}px\`;
                    card.style.clipPath = \`polygon(50px 0%, calc(100% - 50px) 0%, 100% 50px, 100% 100%, calc(100% - 50px) 100%, 50px 100%, 0 100%, 0 0)\`;
                    
                    const translateX = (cardSize / 1.5) * position;
                    const translateY = isCenter ? -65 : (position % 2 !== 0 ? 15 : -15);
                    const rotate = isCenter ? 0 : (position % 2 !== 0 ? 2.5 : -2.5);
                    
                    card.style.transform = \`translate(-50%, -50%) translateX(\${translateX}px) translateY(\${translateY}px) rotate(\${rotate}deg)\`;
                    card.style.pointerEvents = 'auto'; // Re-enable clicks for the card
                    
                    card.addEventListener('click', () => handleMove(position));

                    card.innerHTML = \`
                        <span class="corner-fold"></span>
                        \${testimonial.imgSrc ? \`<img src="\${testimonial.imgSrc}" alt="\${testimonial.by.split(',')[0]}" class="mb-4 h-14 w-14 rounded-full object-cover object-top" style="box-shadow: 3px 3px 0px #111; background: #222;" />\` : ''}
                        <h3 class="text-base sm:text-lg font-medium mb-2 \${isCenter ? 'text-white' : 'text-gray-300'}">"\${testimonial.testimonial}"</h3>
                        <p class="absolute bottom-8 left-8 right-8 mt-2 text-sm italic \${isCenter ? 'text-brand' : 'text-gray-500'}">- \${testimonial.by}</p>
                    \`;
                    
                    cardsWrapper.appendChild(card);
                });
            }

            renderCards();
        });

        // Review Form Function
        async function showReviewForm() {
            if (typeof auth === 'undefined' || !auth.isAuthenticated()) {
                Swal.fire({ title: 'Akses Ditolak', text: 'Silakan login terlebih dahulu.', icon: 'warning', background: '#161616', color: '#fff' });
                return;
            }

            const { value: formValues } = await Swal.fire({
                title: 'Tulis Ulasan',
                html:
                    '<div class="mb-4 text-left"><label class="text-xs text-gray-400 uppercase tracking-widest block mb-2">Rating</label>' +
                    '<div id="swal-stars" class="flex gap-2 my-2">' +
                        '<svg data-value="1" xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 cursor-pointer star-icon text-gray-600 fill-transparent transition-colors" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' +
                        '<svg data-value="2" xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 cursor-pointer star-icon text-gray-600 fill-transparent transition-colors" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' +
                        '<svg data-value="3" xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 cursor-pointer star-icon text-gray-600 fill-transparent transition-colors" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' +
                        '<svg data-value="4" xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 cursor-pointer star-icon text-gray-600 fill-transparent transition-colors" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' +
                        '<svg data-value="5" xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 cursor-pointer star-icon text-gray-600 fill-transparent transition-colors" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' +
                    '</div>' +
                    '<input type="hidden" id="swal-rating" value="0">' +
                    '</div>' +
                    '<div class="text-left"><label class="text-xs text-gray-400 uppercase tracking-widest block mb-2">Ulasan Anda</label>' +
                    '<textarea id="swal-content" rows="4" class="w-full bg-[#111] border border-gray-700 text-white p-3 rounded resize-none" placeholder="Ceritakan pengalaman Anda..."></textarea></div>',
                didOpen: () => {
                    const stars = document.querySelectorAll('.star-icon');
                    const input = document.getElementById('swal-rating');
                    stars.forEach(star => {
                        star.addEventListener('click', (e) => {
                            // CurrentTarget properly targets the svg not the inner polygon
                            const val = parseInt(e.currentTarget.getAttribute('data-value'));
                            input.value = val;
                            stars.forEach((s, idx) => {
                                if (idx < val) {
                                    s.classList.add('text-yellow-500', 'fill-current');
                                    s.classList.remove('text-gray-600', 'fill-transparent');
                                } else {
                                    s.classList.remove('text-yellow-500', 'fill-current');
                                    s.classList.add('text-gray-600', 'fill-transparent');
                                }
                            });
                        });
                    });
                },
                focusConfirm: false,
                showCancelButton: true,
                confirmButtonText: 'Kirim Ulasan',
                cancelButtonText: 'Batal',
                background: '#161616',
                color: '#fff',
                confirmButtonColor: '#D4AF37',
                cancelButtonColor: '#333',
                preConfirm: () => {
                    const rating = parseInt(document.getElementById('swal-rating').value);
                    const content = document.getElementById('swal-content').value;

                    if (rating === 0) {
                        Swal.showValidationMessage('Silakan pilih rating (bintang) terlebih dahulu.');
                        return false;
                    }
                    if (!content || content.length < 5) {
                        Swal.showValidationMessage('Ulasan terlalu pendek (minimal 5 karakter).');
                        return false;
                    }

                    return { rating, content };
                }
            });

            if (formValues) {
                try {
                    await api.post('/testimonials', formValues);
                    Swal.fire({
                        title: 'Terkirim!',
                        text: 'Terima kasih atas ulasan Anda. Testimoni Anda telah berhasil dipublikasikan!',
                        icon: 'success',
                        background: '#161616',
                        color: '#fff',
                        confirmButtonColor: '#D4AF37'
                    }).then(() => {
                        window.location.reload(); // Reload to show the new testimonial immediately
                    });
                } catch (e) {
                    Swal.fire({ title: 'Gagal Mengirim', text: e.message, icon: 'error', background: '#161616', color: '#fff' });
                }
            }
        }
    
`,document.body.appendChild(n),()=>{document.body.removeChild(n)}},[]),r.jsxs(r.Fragment,{children:[r.jsxs("nav",{id:"navbar",className:"fixed w-full z-50 transition-all duration-300",style:{background:"rgba(5,5,5,0.6)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderBottom:"1px solid rgba(255,255,255,0.04)"},children:[r.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:r.jsxs("div",{className:"flex justify-between items-center py-4 sm:py-5",children:[r.jsxs("div",{className:"gahar-logo-btn",onClick:"window.location.href='index.html'",children:[r.jsx("img",{src:"assets/logo.png",alt:"JogjaCourt Logo",className:"gahar-logo-img"}),r.jsx("div",{className:"gahar-logo-text",children:r.jsxs("span",{className:"gahar-logo-title",children:["JOGJA",r.jsx("span",{className:"text-brand",children:"COURT"})]})})]}),r.jsxs("div",{className:"hidden md:flex items-center gap-8",children:[r.jsxs("a",{href:"locations.html",className:"text-gray-400 hover:text-white text-sm font-medium tracking-wide transition-colors flex items-center gap-1.5",children:[r.jsxs("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",strokeWidth:"2",viewBox:"0 0 24 24",children:[r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"}),r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 11a3 3 0 11-6 0 3 3 0 016 0z"})]}),"Cari GOR"]}),r.jsx("a",{href:"#features",className:"text-gray-400 hover:text-white text-sm font-medium tracking-wide transition-colors",children:"Keunggulan"}),r.jsx("a",{href:"#how-it-works",className:"text-gray-400 hover:text-white text-sm font-medium tracking-wide transition-colors",children:"Cara Booking"}),r.jsxs("div",{id:"loginBtn",className:"flex items-center gap-3",children:[r.jsx("a",{href:"login.html",className:"text-gray-300 hover:text-white text-sm font-medium transition-colors",children:"Masuk"}),r.jsx("a",{href:"register.html",className:"cta-btn text-black px-5 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider",children:"Daftar Gratis"})]}),r.jsx("div",{id:"notifBellWrap",className:"hidden relative",children:r.jsxs("button",{className:"notif-toggle-btn p-2 rounded-lg hover:bg-white/5 transition-colors relative",onClick:"Notifications.toggleDropdown(event)",children:[r.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",className:"w-5 h-5 text-gray-400 hover:text-white transition-colors",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[r.jsx("path",{d:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"}),r.jsx("path",{d:"M10.3 21a1.94 1.94 0 0 0 3.4 0"})]}),r.jsx("span",{className:"notif-badge",children:"0"})]})}),r.jsxs("div",{id:"userMenu",className:"hidden relative group",children:[r.jsxs("button",{className:"flex items-center gap-2 bg-dark-card border border-dark-border px-4 py-2 rounded-xl hover:border-brand/40 transition-all",children:[r.jsxs("div",{className:"w-7 h-7 bg-brand/20 rounded-full flex items-center justify-center overflow-hidden",children:[r.jsx("svg",{className:"w-4 h-4 text-brand nav-avatar-icon",fill:"none",stroke:"currentColor",strokeWidth:"2",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"})}),r.jsx("img",{src:"",className:"w-full h-full object-cover hidden nav-avatar-img",alt:"User Avatar"})]}),r.jsx("span",{id:"userNameDisplay",className:"text-sm font-medium text-white",children:"User"}),r.jsx("svg",{className:"w-4 h-4 text-gray-400",fill:"none",stroke:"currentColor",strokeWidth:"2",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M19 9l-7 7-7-7"})})]}),r.jsxs("div",{className:"absolute right-0 mt-2 w-52 glass-strong rounded-xl shadow-2xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-dark-border",children:[r.jsxs("a",{href:"profile.html",className:"flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-brand transition-colors",children:[r.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",strokeWidth:"2",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"})}),"Profil Akun"]}),r.jsxs("a",{href:"my-bookings.html",className:"flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-brand transition-colors",children:[r.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",strokeWidth:"2",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"})}),"Riwayat Booking"]}),r.jsxs("a",{href:"admin/dashboard.html",id:"adminLink",className:"hidden flex items-center gap-2 px-4 py-2.5 text-sm text-brand hover:bg-brand/10 font-semibold transition-colors",children:[r.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",strokeWidth:"2",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"})}),"Admin Panel"]}),r.jsx("hr",{className:"border-dark-border my-1"}),r.jsxs("button",{id:"logoutBtn",className:"w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/10 transition-colors",children:[r.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",strokeWidth:"2",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"})}),"Keluar"]})]})]})]}),r.jsx("button",{id:"hamburger",className:"md:hidden p-2 text-gray-400 hover:text-white transition-colors",onClick:"document.getElementById('mobileMenu').classList.toggle('open')",children:r.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",className:"w-7 h-7",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"2",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M4 6h16M4 12h16M4 18h16"})})})]})}),r.jsxs("div",{id:"mobileMenu",className:"md:hidden bg-dark-surface/95 backdrop-blur-xl border-t border-dark-border px-5 py-5 space-y-2",children:[r.jsxs("a",{href:"locations.html",className:"flex items-center gap-3 text-gray-300 hover:text-brand py-3 text-sm font-medium rounded-lg px-3 hover:bg-white/5 transition-all",children:[r.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",strokeWidth:"2",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"})}),"Cari GOR"]}),r.jsxs("a",{href:"#features",className:"flex items-center gap-3 text-gray-300 hover:text-brand py-3 text-sm font-medium rounded-lg px-3 hover:bg-white/5 transition-all",children:[r.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",strokeWidth:"2",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M13 10V3L4 14h7v7l9-11h-7z"})}),"Keunggulan"]}),r.jsxs("a",{href:"#how-it-works",className:"flex items-center gap-3 text-gray-300 hover:text-brand py-3 text-sm font-medium rounded-lg px-3 hover:bg-white/5 transition-all",children:[r.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",strokeWidth:"2",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M9 5l7 7-7 7"})}),"Cara Booking"]}),r.jsx("hr",{className:"border-dark-border my-2"}),r.jsxs("div",{id:"mobileGuestMenu",className:"space-y-2",children:[r.jsx("a",{href:"login.html",className:"block text-gray-300 hover:text-brand py-3 text-sm font-medium rounded-lg px-3 hover:bg-white/5 transition-all",children:"Masuk"}),r.jsx("a",{href:"register.html",className:"block bg-brand text-black text-center py-3 rounded-xl font-bold text-sm mt-2",children:"Daftar Gratis"})]}),r.jsxs("div",{id:"mobileAuthMenu",className:"hidden space-y-2",children:[r.jsxs("a",{href:"profile.html",className:"flex items-center gap-3 text-gray-300 hover:text-brand py-3 text-sm font-medium rounded-lg px-3 hover:bg-white/5 transition-all",children:[r.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",strokeWidth:"2",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"})}),"Profil Akun"]}),r.jsxs("a",{href:"my-bookings.html",className:"flex items-center gap-3 text-gray-300 hover:text-brand py-3 text-sm font-medium rounded-lg px-3 hover:bg-white/5 transition-all",children:[r.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",strokeWidth:"2",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"})}),"Riwayat Booking"]}),r.jsxs("a",{href:"admin/dashboard.html",id:"mobileAdminLink",className:"hidden flex items-center gap-3 text-brand hover:text-white py-3 text-sm font-bold rounded-lg px-3 hover:bg-brand/10 transition-all",children:[r.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",strokeWidth:"2",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"})}),"Admin Panel"]}),r.jsxs("button",{className:"logoutBtn w-full flex items-center gap-3 text-red-400 hover:text-red-300 py-3 text-sm font-medium rounded-lg px-3 hover:bg-red-900/10 transition-all",children:[r.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",strokeWidth:"2",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"})}),"Keluar"]})]})]})]}),r.jsxs("section",{className:"hero-section relative overflow-hidden min-h-screen",id:"heroSection",children:[r.jsx("div",{className:"glow-orb",style:{width:"700px",height:"700px",background:"rgba(212,175,55,0.035)",top:"5%",left:"-15%"}}),r.jsx("div",{className:"glow-orb",style:{width:"500px",height:"500px",background:"rgba(212,175,55,0.025)",bottom:"10%",right:"-10%"}}),r.jsx("div",{className:"glow-orb",style:{width:"300px",height:"300px",background:"rgba(212,175,55,0.02)",top:"40%",right:"20%"}}),r.jsx("div",{id:"heroContentWrapper",className:"w-full relative z-10 pt-32 sm:pt-40",style:{perspective:"1200px"},children:r.jsx("div",{id:"heroInner",className:"max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10 w-full",style:{transformStyle:"preserve-3d",willChange:"transform, opacity"},children:r.jsxs("div",{className:"max-w-3xl lg:max-w-4xl pb-16 sm:pb-24",children:[r.jsxs("div",{className:"inline-flex items-center gap-2.5 badge-pill px-5 py-2.5 rounded-full mb-8 sm:mb-10 fade-up delay-1",children:[r.jsx("div",{className:"w-2 h-2 bg-brand rounded-full animate-pulse"}),r.jsx("span",{className:"text-brand text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em]",children:"Cara Baru Booking Lapangan di Jogja"})]}),r.jsxs("h1",{className:"font-display tracking-wide text-white uppercase leading-[0.9] mb-6 sm:mb-8 fade-up delay-2",style:{fontSize:"clamp(3rem, 10vw, 7.5rem)"},children:["Cari Lapangan.",r.jsx("br",{}),r.jsx("span",{className:"text-brand neon-text",children:"Langsung Gas Mabar."})]}),r.jsx("p",{className:"text-sm sm:text-base md:text-lg text-gray-400 font-light mb-10 sm:mb-12 max-w-xl sm:max-w-2xl leading-relaxed fade-up delay-3",children:"Udah semangat mau main tapi pusing cari GOR yang kosong? Tenang, di JogjaCourt kamu bisa pantau jadwal, pilih lapangan favorit, dan amankan slot mabarmu. Bebas ribet, tanpa drama nunggu balasan admin."}),r.jsxs("div",{id:"statRow",className:"flex gap-0 mb-10 sm:mb-12 flex-wrap fade-up delay-3",children:[r.jsxs("div",{className:"stat-item pr-6 sm:pr-8 mr-6 sm:mr-8",children:[r.jsxs("p",{className:"text-3xl sm:text-4xl font-display text-brand",children:[e.areas,"+"]}),r.jsx("p",{className:"text-[9px] sm:text-[10px] text-gray-600 uppercase tracking-[0.15em] mt-1.5",children:"Daerah Aktif"})]}),r.jsxs("div",{className:"stat-item pr-6 sm:pr-8 mr-6 sm:mr-8",children:[r.jsxs("p",{className:"text-3xl sm:text-4xl font-display text-white",children:[e.venues,"+"]}),r.jsx("p",{className:"text-[9px] sm:text-[10px] text-gray-600 uppercase tracking-[0.15em] mt-1.5",children:"GOR Terdaftar"})]}),r.jsxs("div",{className:"stat-item",children:[r.jsxs("p",{className:"text-3xl sm:text-4xl font-display text-white",children:[e.courts,"+"]}),r.jsx("p",{className:"text-[9px] sm:text-[10px] text-gray-600 uppercase tracking-[0.15em] mt-1.5",children:"Lapangan Siap Main"})]})]}),r.jsxs("div",{className:"flex flex-col sm:flex-row gap-3 sm:gap-4 fade-up delay-4",children:[r.jsxs("a",{href:"locations.html",className:"cta-btn px-8 sm:px-10 py-4 rounded-xl uppercase tracking-widest text-sm flex items-center justify-center gap-2.5",children:[r.jsx("svg",{className:"w-5 h-5",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"2.5",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M13 10V3L4 14h7v7l9-11h-7z"})}),"Booking Sekarang"]}),r.jsxs("a",{href:"#how-it-works",className:"btn-outline px-8 sm:px-10 py-4 rounded-xl font-semibold uppercase tracking-widest text-sm flex items-center justify-center gap-2",children:["Lihat Cara Booking",r.jsx("svg",{className:"w-4 h-4",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"2",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M19 9l-7 7-7-7"})})]})]})]})})}),r.jsxs("div",{className:"absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-10 hidden sm:flex",children:[r.jsx("span",{className:"text-[9px] uppercase tracking-[0.3em] text-gray-600",children:"Scroll"}),r.jsx("div",{className:"w-px h-10 bg-gradient-to-b from-transparent via-brand/30 to-transparent"}),r.jsx("div",{className:"scroll-dot"})]})]}),r.jsx("section",{className:"parallax-showcase",id:"parallax-showcase",children:r.jsxs("div",{className:"parallax-sticky",children:[r.jsxs("div",{className:"parallax-title-overlay",id:"parallaxTitle",children:[r.jsx("div",{className:"subtitle",children:"Pilihan Lapangan Terbaik"}),r.jsxs("h2",{className:"title",children:["Bikin Mabarmu",r.jsx("br",{}),r.jsx("span",{className:"text-brand",children:"Makin Seru & Nyaman"})]})]}),r.jsxs("div",{className:"parallax-motion",id:"parallaxMotion",children:[r.jsxs("div",{className:"parallax-row",id:"pxRow1",children:[r.jsxs("div",{className:"parallax-img-wrap",children:[r.jsx("img",{src:"assets/bg-badminton-1.jpg",alt:"Lapangan 1"}),r.jsx("div",{className:"parallax-overlay",children:r.jsx("span",{children:"Lapangan Indoor"})})]}),r.jsxs("div",{className:"parallax-img-wrap",children:[r.jsx("img",{src:"assets/bg-badminton-2.jpg",alt:"Lapangan 2"}),r.jsx("div",{className:"parallax-overlay",children:r.jsx("span",{children:"Smash Court"})})]}),r.jsxs("div",{className:"parallax-img-wrap",children:[r.jsx("img",{src:"assets/bg-badminton-3.jpg",alt:"Lapangan 3"}),r.jsx("div",{className:"parallax-overlay",children:r.jsx("span",{children:"Net Profesional"})})]}),r.jsxs("div",{className:"parallax-img-wrap",children:[r.jsx("img",{src:"assets/bg-badminton-4.jpg",alt:"Lapangan 4"}),r.jsx("div",{className:"parallax-overlay",children:r.jsx("span",{children:"Premium Court"})})]}),r.jsxs("div",{className:"parallax-img-wrap",children:[r.jsx("img",{src:"assets/bg-1.jpg",alt:"Court 1"}),r.jsx("div",{className:"parallax-overlay",children:r.jsx("span",{children:"GOR Pilihan"})})]})]}),r.jsxs("div",{className:"parallax-row",id:"pxRow2",children:[r.jsxs("div",{className:"parallax-img-wrap",children:[r.jsx("img",{src:"assets/bg-badminton-5.jpg",alt:"Lapangan 5"}),r.jsx("div",{className:"parallax-overlay",children:r.jsx("span",{children:"Lantai BWF"})})]}),r.jsxs("div",{className:"parallax-img-wrap",children:[r.jsx("img",{src:"assets/bg-badminton-6.jpg",alt:"Lapangan 6"}),r.jsx("div",{className:"parallax-overlay",children:r.jsx("span",{children:"Shuttle Arena"})})]}),r.jsxs("div",{className:"parallax-img-wrap",children:[r.jsx("img",{src:"assets/bg-badminton-7.jpg",alt:"Lapangan 7"}),r.jsx("div",{className:"parallax-overlay",children:r.jsx("span",{children:"Multi Court"})})]}),r.jsxs("div",{className:"parallax-img-wrap",children:[r.jsx("img",{src:"assets/bg-badminton-8.jpg",alt:"Lapangan 8"}),r.jsx("div",{className:"parallax-overlay",children:r.jsx("span",{children:"LED Lighting"})})]}),r.jsxs("div",{className:"parallax-img-wrap",children:[r.jsx("img",{src:"assets/bg-2.jpg",alt:"Court 2"}),r.jsx("div",{className:"parallax-overlay",children:r.jsx("span",{children:"Arena Jogja"})})]})]}),r.jsxs("div",{className:"parallax-row",id:"pxRow3",children:[r.jsxs("div",{className:"parallax-img-wrap",children:[r.jsx("img",{src:"assets/bg-3.jpg",alt:"Court 3"}),r.jsx("div",{className:"parallax-overlay",children:r.jsx("span",{children:"Karpet Pro"})})]}),r.jsxs("div",{className:"parallax-img-wrap",children:[r.jsx("img",{src:"assets/bg-4.jpg",alt:"Court 4"}),r.jsx("div",{className:"parallax-overlay",children:r.jsx("span",{children:"AC Indoor"})})]}),r.jsxs("div",{className:"parallax-img-wrap",children:[r.jsx("img",{src:"assets/bg-5.jpg",alt:"Court 5"}),r.jsx("div",{className:"parallax-overlay",children:r.jsx("span",{children:"Jogja Sport"})})]}),r.jsxs("div",{className:"parallax-img-wrap",children:[r.jsx("img",{src:"assets/bg-6.jpg",alt:"Court 6"}),r.jsx("div",{className:"parallax-overlay",children:r.jsx("span",{children:"Open Court"})})]}),r.jsxs("div",{className:"parallax-img-wrap",children:[r.jsx("img",{src:"assets/bg-badminton-9.png",alt:"Lapangan 9"}),r.jsx("div",{className:"parallax-overlay",children:r.jsx("span",{children:"Full Arena"})})]})]}),r.jsxs("div",{className:"parallax-row",id:"pxRow4",children:[r.jsxs("div",{className:"parallax-img-wrap",children:[r.jsx("img",{src:"assets/bg-7.jpg",alt:"Court 7"}),r.jsx("div",{className:"parallax-overlay",children:r.jsx("span",{children:"Night Court"})})]}),r.jsxs("div",{className:"parallax-img-wrap",children:[r.jsx("img",{src:"assets/bg-8.jpg",alt:"Court 8"}),r.jsx("div",{className:"parallax-overlay",children:r.jsx("span",{children:"Turnamen Hall"})})]}),r.jsxs("div",{className:"parallax-img-wrap",children:[r.jsx("img",{src:"assets/bg-badminton-0.png",alt:"Lapangan 0"}),r.jsx("div",{className:"parallax-overlay",children:r.jsx("span",{children:"Main Court"})})]}),r.jsxs("div",{className:"parallax-img-wrap",children:[r.jsx("img",{src:"assets/bg-badminton-1.jpg",alt:"Lapangan 1b"}),r.jsx("div",{className:"parallax-overlay",children:r.jsx("span",{children:"VIP Court"})})]}),r.jsxs("div",{className:"parallax-img-wrap",children:[r.jsx("img",{src:"assets/bg-badminton-4.jpg",alt:"Lapangan 4b"}),r.jsx("div",{className:"parallax-overlay",children:r.jsx("span",{children:"Champion Court"})})]})]})]})]})}),r.jsxs("section",{id:"features",className:"section-dark py-20 sm:py-28 relative",children:[r.jsx("div",{className:"glow-orb",style:{width:"500px",height:"500px",background:"rgba(212,175,55,0.02)",top:"50%",left:"50%",transform:"translate(-50%,-50%)"}}),r.jsxs("div",{className:"max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10",children:[r.jsxs("div",{className:"text-center mb-14 sm:mb-20 reveal",children:[r.jsxs("div",{className:"inline-flex items-center gap-2 mb-4",children:[r.jsx("div",{className:"w-8 h-px bg-brand/40"}),r.jsx("span",{className:"text-brand text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em]",children:"Kelebihan Kami"}),r.jsx("div",{className:"w-8 h-px bg-brand/40"})]}),r.jsxs("h2",{className:"text-3xl sm:text-4xl md:text-5xl font-display tracking-widest mt-3 mb-4 sm:mb-5",children:["Kenapa Harus Pesan",r.jsx("br",{className:"sm:hidden"})," Di Sini?"]}),r.jsx("p",{className:"text-gray-600 text-sm max-w-md mx-auto",children:"Bukan sekadar booking biasa. Nikmati berbagai kemudahan biar kamu bisa fokus mabar, bukan ngurusin jadwal."})]}),r.jsx("div",{className:"marquee-wrapper",children:r.jsxs("div",{className:"marquee-track",children:[r.jsxs("div",{className:"feature-card reveal-card p-6 sm:p-8 rounded-2xl",children:[r.jsx("div",{className:"icon-box feature-icon w-14 h-14 rounded-2xl flex items-center justify-center mb-5 sm:mb-6",children:r.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"#D4AF37",strokeWidth:"2",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"})})}),r.jsx("h3",{className:"text-base sm:text-lg font-bold text-white mb-2 sm:mb-3",children:"Slot Terkunci Otomatis"}),r.jsx("p",{className:"text-gray-500 leading-relaxed text-sm",children:"Saat Anda memilih jadwal, slot lapangan langsung terkunci selama 15 menit demi menghindari pemesanan ganda. Adil dan transparan."})]}),r.jsxs("div",{className:"feature-card reveal-card p-6 sm:p-8 rounded-2xl",style:{borderColor:"rgba(212,175,55,0.2)",background:"linear-gradient(145deg,rgba(212,175,55,0.04),#0e0e0e 60%)"},children:[r.jsxs("div",{className:"flex justify-between items-start mb-5 sm:mb-6",children:[r.jsx("div",{className:"icon-box feature-icon w-14 h-14 rounded-2xl flex items-center justify-center",children:r.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"#D4AF37",strokeWidth:"2",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"})})}),r.jsx("span",{className:"text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] text-black bg-brand px-2.5 py-1 rounded-full",children:"Unggulan"})]}),r.jsx("h3",{className:"text-base sm:text-lg font-bold text-white mb-2 sm:mb-3",children:"Tarif Transparan & Jujur"}),r.jsx("p",{className:"text-gray-500 leading-relaxed text-sm",children:"Tarif Regular dan Peak Hour terhitung otomatis secara presisi. Tidak ada biaya tambahan tersembunyi yang membingungkan Anda."})]}),r.jsxs("div",{className:"feature-card reveal-card p-6 sm:p-8 rounded-2xl",children:[r.jsx("div",{className:"icon-box feature-icon w-14 h-14 rounded-2xl flex items-center justify-center mb-5 sm:mb-6",children:r.jsxs("svg",{className:"w-6 h-6",fill:"none",stroke:"#D4AF37",strokeWidth:"2",viewBox:"0 0 24 24",children:[r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"}),r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 11a3 3 0 11-6 0 3 3 0 016 0z"})]})}),r.jsx("h3",{className:"text-base sm:text-lg font-bold text-white mb-2 sm:mb-3",children:"Jangkau Seluruh Yogyakarta"}),r.jsx("p",{className:"text-gray-500 leading-relaxed text-sm",children:"Temukan GOR pilihan dari Sleman hingga Bantul. Dilengkapi informasi foto lapangan aktual, kontak admin, dan peta navigasi."})]}),r.jsxs("div",{className:"feature-card reveal-card p-6 sm:p-8 rounded-2xl",children:[r.jsx("div",{className:"icon-box feature-icon w-14 h-14 rounded-2xl flex items-center justify-center mb-5 sm:mb-6",children:r.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"#D4AF37",strokeWidth:"2",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"})})}),r.jsx("h3",{className:"text-base sm:text-lg font-bold text-white mb-2 sm:mb-3",children:"Konfirmasi Pembayaran Cepat"}),r.jsx("p",{className:"text-gray-500 leading-relaxed text-sm",children:"Unggah bukti transfer langsung dari ponsel Anda. Admin GOR memverifikasi pembayaran secara real-time demi kelancaran jadwal bermain Anda."})]}),r.jsxs("div",{className:"feature-card reveal-card p-6 sm:p-8 rounded-2xl",children:[r.jsx("div",{className:"icon-box feature-icon w-14 h-14 rounded-2xl flex items-center justify-center mb-5 sm:mb-6",children:r.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"#D4AF37",strokeWidth:"2",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"})})}),r.jsx("h3",{className:"text-base sm:text-lg font-bold text-white mb-2 sm:mb-3",children:"Data Aman & Terenkripsi"}),r.jsx("p",{className:"text-gray-500 leading-relaxed text-sm",children:"Seluruh informasi profil dan riwayat pesanan Anda terlindungi dengan standar keamanan tinggi. Anda cukup fokus meraih poin!"})]}),r.jsxs("div",{className:"feature-card reveal-card p-6 sm:p-8 rounded-2xl",children:[r.jsx("div",{className:"icon-box feature-icon w-14 h-14 rounded-2xl flex items-center justify-center mb-5 sm:mb-6",children:r.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"#D4AF37",strokeWidth:"2",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"})})}),r.jsx("h3",{className:"text-base sm:text-lg font-bold text-white mb-2 sm:mb-3",children:"Optimal di Semua Perangkat"}),r.jsx("p",{className:"text-gray-500 leading-relaxed text-sm",children:"Nikmati antarmuka responsif yang sangat mulus di smartphone maupun laptop. Pesan kapan saja dan di mana saja dengan mudah."})]}),r.jsxs("div",{className:"feature-card reveal-card p-6 sm:p-8 rounded-2xl",children:[r.jsx("div",{className:"icon-box feature-icon w-14 h-14 rounded-2xl flex items-center justify-center mb-5 sm:mb-6",children:r.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"#D4AF37",strokeWidth:"2",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"})})}),r.jsx("h3",{className:"text-base sm:text-lg font-bold text-white mb-2 sm:mb-3",children:"Slot Terkunci Otomatis"}),r.jsx("p",{className:"text-gray-500 leading-relaxed text-sm",children:"Saat Anda memilih jadwal, slot lapangan langsung terkunci selama 15 menit demi menghindari pemesanan ganda. Adil dan transparan."})]}),r.jsxs("div",{className:"feature-card reveal-card p-6 sm:p-8 rounded-2xl",style:{borderColor:"rgba(212,175,55,0.2)",background:"linear-gradient(145deg,rgba(212,175,55,0.04),#0e0e0e 60%)"},children:[r.jsxs("div",{className:"flex justify-between items-start mb-5 sm:mb-6",children:[r.jsx("div",{className:"icon-box feature-icon w-14 h-14 rounded-2xl flex items-center justify-center",children:r.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"#D4AF37",strokeWidth:"2",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"})})}),r.jsx("span",{className:"text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] text-black bg-brand px-2.5 py-1 rounded-full",children:"Unggulan"})]}),r.jsx("h3",{className:"text-base sm:text-lg font-bold text-white mb-2 sm:mb-3",children:"Tarif Transparan & Jujur"}),r.jsx("p",{className:"text-gray-500 leading-relaxed text-sm",children:"Tarif Regular dan Peak Hour terhitung otomatis secara presisi. Tidak ada biaya tambahan tersembunyi yang membingungkan Anda."})]}),r.jsxs("div",{className:"feature-card reveal-card p-6 sm:p-8 rounded-2xl",children:[r.jsx("div",{className:"icon-box feature-icon w-14 h-14 rounded-2xl flex items-center justify-center mb-5 sm:mb-6",children:r.jsxs("svg",{className:"w-6 h-6",fill:"none",stroke:"#D4AF37",strokeWidth:"2",viewBox:"0 0 24 24",children:[r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"}),r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 11a3 3 0 11-6 0 3 3 0 016 0z"})]})}),r.jsx("h3",{className:"text-base sm:text-lg font-bold text-white mb-2 sm:mb-3",children:"Jangkau Seluruh Yogyakarta"}),r.jsx("p",{className:"text-gray-500 leading-relaxed text-sm",children:"Temukan GOR pilihan dari Sleman hingga Bantul. Dilengkapi informasi foto lapangan aktual, kontak admin, dan peta navigasi."})]}),r.jsxs("div",{className:"feature-card reveal-card p-6 sm:p-8 rounded-2xl",children:[r.jsx("div",{className:"icon-box feature-icon w-14 h-14 rounded-2xl flex items-center justify-center mb-5 sm:mb-6",children:r.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"#D4AF37",strokeWidth:"2",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"})})}),r.jsx("h3",{className:"text-base sm:text-lg font-bold text-white mb-2 sm:mb-3",children:"Konfirmasi Pembayaran Cepat"}),r.jsx("p",{className:"text-gray-500 leading-relaxed text-sm",children:"Unggah bukti transfer langsung dari ponsel Anda. Admin GOR memverifikasi pembayaran secara real-time demi kelancaran jadwal bermain Anda."})]}),r.jsxs("div",{className:"feature-card reveal-card p-6 sm:p-8 rounded-2xl",children:[r.jsx("div",{className:"icon-box feature-icon w-14 h-14 rounded-2xl flex items-center justify-center mb-5 sm:mb-6",children:r.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"#D4AF37",strokeWidth:"2",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"})})}),r.jsx("h3",{className:"text-base sm:text-lg font-bold text-white mb-2 sm:mb-3",children:"Data Aman & Terenkripsi"}),r.jsx("p",{className:"text-gray-500 leading-relaxed text-sm",children:"Seluruh informasi profil dan riwayat pesanan Anda terlindungi dengan standar keamanan tinggi. Anda cukup fokus meraih poin!"})]}),r.jsxs("div",{className:"feature-card reveal-card p-6 sm:p-8 rounded-2xl",children:[r.jsx("div",{className:"icon-box feature-icon w-14 h-14 rounded-2xl flex items-center justify-center mb-5 sm:mb-6",children:r.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"#D4AF37",strokeWidth:"2",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"})})}),r.jsx("h3",{className:"text-base sm:text-lg font-bold text-white mb-2 sm:mb-3",children:"Optimal di Semua Perangkat"}),r.jsx("p",{className:"text-gray-500 leading-relaxed text-sm",children:"Nikmati antarmuka responsif yang sangat mulus di smartphone maupun laptop. Pesan kapan saja dan di mana saja dengan mudah."})]})]})})]})]}),r.jsxs("section",{id:"how-it-works",className:"section-surface py-20 sm:py-28 relative overflow-hidden",children:[r.jsx("div",{className:"absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-brand/5 to-transparent"}),r.jsxs("div",{className:"max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10",children:[r.jsxs("div",{className:"text-center mb-14 sm:mb-20 reveal",children:[r.jsxs("div",{className:"inline-flex items-center gap-2 mb-4",children:[r.jsx("div",{className:"w-8 h-px bg-brand/40"}),r.jsx("span",{className:"text-brand text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em]",children:"Nggak Pake Ribet"}),r.jsx("div",{className:"w-8 h-px bg-brand/40"})]}),r.jsxs("h2",{className:"text-3xl sm:text-4xl md:text-5xl font-display tracking-widest mt-3 mb-4 sm:mb-5",children:["Cuma Butuh 4 Langkah",r.jsx("br",{className:"sm:hidden"})," Buat Mabar"]}),r.jsx("p",{className:"text-gray-600 text-sm max-w-md mx-auto",children:"Dari awal buka web sampai siap smash di lapangan, semuanya kelar cuma dalam hitungan menit."})]}),r.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-start",children:[r.jsxs("div",{className:"step-card text-center reveal",children:[r.jsxs("div",{className:"macos-align",children:[r.jsx("span",{className:"macos-btn macos-red"}),r.jsx("span",{className:"macos-btn macos-yellow"}),r.jsx("span",{className:"macos-btn macos-green"})]}),r.jsx("h3",{className:"font-bold text-white mb-4 mt-1 text-lg uppercase tracking-wider",style:{textShadow:"-5px 5px 10px rgba(0,0,0,0.5)"},children:"Bikin Akun"}),r.jsx("div",{className:"icon-box w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex-shrink-0 flex items-center justify-center mx-auto mb-4",children:r.jsx("svg",{className:"w-5 h-5 sm:w-6 sm:h-6",fill:"none",stroke:"#D4AF37",strokeWidth:"2",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"})})}),r.jsx("p",{className:"text-gray-400 text-sm leading-relaxed mt-auto",children:"Daftar gratis kurang dari 30 detik. Cuma butuh nama, email, dan password saja."})]}),r.jsxs("div",{className:"step-card text-center reveal",children:[r.jsxs("div",{className:"macos-align",children:[r.jsx("span",{className:"macos-btn macos-red"}),r.jsx("span",{className:"macos-btn macos-yellow"}),r.jsx("span",{className:"macos-btn macos-green"})]}),r.jsx("h3",{className:"font-bold text-white mb-4 mt-1 text-lg uppercase tracking-wider",style:{textShadow:"-5px 5px 10px rgba(0,0,0,0.5)"},children:"Cari Lapangan"}),r.jsx("div",{className:"icon-box w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex-shrink-0 flex items-center justify-center mx-auto mb-4",children:r.jsx("svg",{className:"w-5 h-5 sm:w-6 sm:h-6",fill:"none",stroke:"#D4AF37",strokeWidth:"2",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"})})}),r.jsx("p",{className:"text-gray-400 text-sm leading-relaxed mt-auto",children:"Pilih GOR favoritmu di sekitar Jogja. Bisa sekalian ngintip foto lapangannya dulu."})]}),r.jsxs("div",{className:"step-card text-center reveal",children:[r.jsxs("div",{className:"macos-align",children:[r.jsx("span",{className:"macos-btn macos-red"}),r.jsx("span",{className:"macos-btn macos-yellow"}),r.jsx("span",{className:"macos-btn macos-green"})]}),r.jsx("h3",{className:"font-bold text-white mb-4 mt-1 text-lg uppercase tracking-wider",style:{textShadow:"-5px 5px 10px rgba(0,0,0,0.5)"},children:"Amankan Slot"}),r.jsx("div",{className:"icon-box w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex-shrink-0 flex items-center justify-center mx-auto mb-4",children:r.jsx("svg",{className:"w-5 h-5 sm:w-6 sm:h-6",fill:"none",stroke:"#D4AF37",strokeWidth:"2",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"})})}),r.jsx("p",{className:"text-gray-400 text-sm leading-relaxed mt-auto",children:"Cek jadwal kosong secara live, lalu amankan jam mabar yang paling pas buat kamu dan rombongan."})]}),r.jsxs("div",{className:"step-card text-center reveal",style:{borderColor:"rgba(212,175,55,0.15)"},children:[r.jsxs("div",{className:"macos-align",children:[r.jsx("span",{className:"macos-btn macos-red"}),r.jsx("span",{className:"macos-btn macos-yellow"}),r.jsx("span",{className:"macos-btn macos-green"})]}),r.jsx("h3",{className:"font-bold text-white mb-4 mt-1 text-lg uppercase tracking-wider",style:{textShadow:"-5px 5px 10px rgba(0,0,0,0.5)"},children:"Bayar & Beres"}),r.jsx("div",{className:"icon-box w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex-shrink-0 flex items-center justify-center mx-auto mb-4",children:r.jsx("svg",{className:"w-5 h-5 sm:w-6 sm:h-6",fill:"none",stroke:"#D4AF37",strokeWidth:"2",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"})})}),r.jsx("p",{className:"text-gray-400 text-sm leading-relaxed mt-auto",children:"Tinggal upload bukti bayar, tunggu di-acc admin, dan lapangan siap digeber!"})]})]}),r.jsx("div",{className:"text-center mt-12 sm:mt-16 reveal",children:r.jsxs("a",{href:"register.html",className:"cta-btn px-8 sm:px-10 py-4 rounded-xl uppercase tracking-widest text-sm inline-flex items-center gap-3",children:["Cobain Booking Sekarang",r.jsx("svg",{className:"w-5 h-5",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"2.5",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M9 5l7 7-7 7"})})]})})]})]}),r.jsxs("section",{id:"testimonials",className:"py-20 sm:py-28 relative overflow-hidden",children:[r.jsxs("div",{className:"text-center mb-10 reveal",children:[r.jsxs("div",{className:"inline-flex items-center gap-2 mb-4",children:[r.jsx("div",{className:"w-8 h-px bg-brand/40"}),r.jsx("span",{className:"text-brand text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em]",children:"Kata Anak Badminton"}),r.jsx("div",{className:"w-8 h-px bg-brand/40"})]}),r.jsxs("h2",{className:"text-3xl sm:text-4xl md:text-5xl font-display tracking-widest mt-3 mb-4",children:["Apa Kata ",r.jsx("span",{className:"text-brand",children:"Mereka?"})]}),r.jsx("p",{className:"text-gray-500 text-sm max-w-md mx-auto",children:"Review jujur dari para sobat mabar yang udah ngerasain gampangnya pesan lapangan di sini."})]}),r.jsx("div",{className:"testimonial-container",id:"staggerContainer",children:r.jsxs("div",{className:"testimonial-nav",children:[r.jsx("button",{id:"prevTestimonial",className:"testimonial-btn","aria-label":"Sebelumnya",children:r.jsx("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:r.jsx("path",{d:"m15 18-6-6 6-6"})})}),r.jsx("button",{id:"nextTestimonial",className:"testimonial-btn","aria-label":"Selanjutnya",children:r.jsx("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:r.jsx("path",{d:"m9 18 6-6-6-6"})})})]})}),r.jsx("div",{id:"reviewActionContainer",className:"text-center mt-12 hidden relative z-20",children:r.jsxs("button",{onClick:"showReviewForm()",className:"btn-outline px-6 py-3 rounded-xl font-semibold uppercase tracking-widest text-sm inline-flex items-center gap-2",children:[r.jsx("svg",{className:"w-4 h-4",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"2",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"})}),"Ikut Kasih Ulasan"]})})]}),r.jsxs("section",{className:"cta-section py-20 sm:py-28 relative overflow-hidden",children:[r.jsx("div",{className:"glow-orb",style:{width:"400px",height:"400px",background:"rgba(212,175,55,0.03)",top:"-20%",left:"50%",transform:"translateX(-50%)"}}),r.jsxs("div",{className:"max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 text-center relative z-10 reveal",children:[r.jsx("div",{className:"coin-wrapper",onClick:"window.location.href='index.html'",children:r.jsxs("div",{className:"gahar-coin",children:[r.jsx("div",{className:"coin-layer",style:{transform:"translateZ(7px)"}}),r.jsx("div",{className:"coin-layer",style:{transform:"translateZ(5px)"}}),r.jsx("div",{className:"coin-layer",style:{transform:"translateZ(3px)"}}),r.jsx("div",{className:"coin-layer",style:{transform:"translateZ(1px)"}}),r.jsx("div",{className:"coin-layer",style:{transform:"translateZ(-1px)"}}),r.jsx("div",{className:"coin-layer",style:{transform:"translateZ(-3px)"}}),r.jsx("div",{className:"coin-layer",style:{transform:"translateZ(-5px)"}}),r.jsx("div",{className:"coin-layer",style:{transform:"translateZ(-7px)"}}),r.jsx("div",{className:"coin-face coin-front",children:r.jsx("img",{src:"assets/logo.png",className:"gahar-coin-img",alt:"JogjaCourt Front"})}),r.jsx("div",{className:"coin-face coin-back",children:r.jsx("img",{src:"assets/logo.png",className:"gahar-coin-img",alt:"JogjaCourt Back"})})]})}),r.jsxs("h2",{className:"text-3xl sm:text-4xl md:text-5xl font-display tracking-widest mb-4 sm:mb-6",children:["Udah Nemu ",r.jsx("span",{className:"text-brand",children:"Lawan Mabar?"})]}),r.jsx("p",{className:"text-gray-500 text-sm sm:text-base max-w-lg mx-auto mb-8 sm:mb-10 leading-relaxed",children:"Ayo join ribuan anak badminton Jogja lainnya yang udah move on dari cara booking kuno. Lapangan favoritmu nungguin, lho!"}),r.jsxs("div",{className:"flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center",children:[r.jsxs("a",{href:"locations.html",className:"cta-btn px-8 sm:px-10 py-4 rounded-xl uppercase tracking-widest text-sm flex items-center justify-center gap-2.5",children:[r.jsx("svg",{className:"w-5 h-5",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"2.5",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"})}),"Cari Lapangan Kosong"]}),r.jsxs("a",{href:"register.html",className:"btn-outline px-8 sm:px-10 py-4 rounded-xl font-semibold uppercase tracking-widest text-sm flex items-center justify-center gap-2",children:["Bikin Akun Gratis",r.jsx("svg",{className:"w-4 h-4",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"2",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M9 5l7 7-7 7"})})]})]})]})]}),r.jsx("div",{id:"cinematicFooterWrap",className:"relative w-full",style:{height:"100vh",clipPath:"polygon(0% 0, 100% 0%, 100% 100%, 0 100%)"},children:r.jsxs("footer",{className:"fixed bottom-0 left-0 w-full flex flex-col",style:{height:"100vh",background:"#030303"},children:[r.jsx("div",{className:"cinematic-footer-aurora",style:{position:"absolute",left:"50%",top:"50%",width:"80vw",height:"60vh",transform:"translate(-50%,-50%)",borderRadius:"50%",pointerEvents:"none",zIndex:"0"}}),r.jsx("div",{className:"cinematic-footer-grid",style:{position:"absolute",inset:"0",zIndex:"0",pointerEvents:"none"}}),r.jsx("div",{id:"footerGiantText",className:"cinematic-giant-text",style:{position:"absolute",top:"55%",left:"50%",transform:"translate(-50%, -50%)",whiteSpace:"nowrap",zIndex:"0",pointerEvents:"none",userSelect:"none"},children:"JOGJACOURT"}),r.jsx("div",{className:"flex-shrink-0",style:{position:"relative",marginTop:"8.5rem",width:"100%",overflow:"hidden",borderTop:"1px solid rgba(212,175,55,0.08)",borderBottom:"1px solid rgba(212,175,55,0.08)",background:"rgba(5,5,5,0.6)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",padding:"0.75rem 0",zIndex:"10",transform:"rotate(-2deg) scale(1.1)"},children:r.jsxs("div",{className:"cinematic-marquee-track",style:{display:"flex",width:"max-content"},children:[r.jsxs("div",{className:"flex items-center gap-8 sm:gap-12 px-6",style:{fontSize:"0.7rem",fontWeight:"700",letterSpacing:"0.3em",textTransform:"uppercase",color:"rgba(255,255,255,0.25)"},children:[r.jsx("span",{children:"Booking Instan"})," ",r.jsx("span",{style:{color:"rgba(212,175,55,0.4)"},children:"✦"}),r.jsx("span",{children:"Konfirmasi Real-Time"})," ",r.jsx("span",{style:{color:"rgba(212,175,55,0.4)"},children:"✦"}),r.jsx("span",{children:"Harga Transparan"})," ",r.jsx("span",{style:{color:"rgba(212,175,55,0.4)"},children:"✦"}),r.jsx("span",{children:"GOR Terpercaya"})," ",r.jsx("span",{style:{color:"rgba(212,175,55,0.4)"},children:"✦"}),r.jsx("span",{children:"Yogyakarta #1"})," ",r.jsx("span",{style:{color:"rgba(212,175,55,0.4)"},children:"✦"}),r.jsx("span",{children:"Jadwal Fleksibel"})," ",r.jsx("span",{style:{color:"rgba(212,175,55,0.4)"},children:"✦"}),r.jsx("span",{children:"Aman & Mudah"})," ",r.jsx("span",{style:{color:"rgba(212,175,55,0.4)"},children:"✦"})]}),r.jsxs("div",{className:"flex items-center gap-8 sm:gap-12 px-6",style:{fontSize:"0.7rem",fontWeight:"700",letterSpacing:"0.3em",textTransform:"uppercase",color:"rgba(255,255,255,0.25)"},children:[r.jsx("span",{children:"Booking Instan"})," ",r.jsx("span",{style:{color:"rgba(212,175,55,0.4)"},children:"✦"}),r.jsx("span",{children:"Konfirmasi Real-Time"})," ",r.jsx("span",{style:{color:"rgba(212,175,55,0.4)"},children:"✦"}),r.jsx("span",{children:"Harga Transparan"})," ",r.jsx("span",{style:{color:"rgba(212,175,55,0.4)"},children:"✦"}),r.jsx("span",{children:"GOR Terpercaya"})," ",r.jsx("span",{style:{color:"rgba(212,175,55,0.4)"},children:"✦"}),r.jsx("span",{children:"Yogyakarta #1"})," ",r.jsx("span",{style:{color:"rgba(212,175,55,0.4)"},children:"✦"}),r.jsx("span",{children:"Jadwal Fleksibel"})," ",r.jsx("span",{style:{color:"rgba(212,175,55,0.4)"},children:"✦"}),r.jsx("span",{children:"Aman & Mudah"})," ",r.jsx("span",{style:{color:"rgba(212,175,55,0.4)"},children:"✦"})]})]})}),r.jsxs("div",{className:"relative z-10 flex flex-col items-center px-5 sm:px-6 w-full max-w-5xl mx-auto pt-6 pb-2 my-auto overflow-y-auto min-h-0",style:{scrollbarWidth:"none"},children:[r.jsxs("h2",{id:"footerHeading",className:"cinematic-footer-heading text-center mb-2",style:{fontFamily:'"Bebas Neue",cursive',fontSize:"clamp(1.8rem,5vw,4rem)",letterSpacing:"0.05em",lineHeight:"0.95"},children:["Siap Main ",r.jsx("span",{style:{color:"#D4AF37"},children:"Hari Ini?"})]}),r.jsx("p",{className:"text-gray-500 text-xs sm:text-sm max-w-lg mx-auto mb-4 text-center leading-relaxed",style:{opacity:"0.7"},children:"Teman mabar barumu di Jogja. Cari lapangan kosong dan booking instan tanpa harus repot bolak-balik nanya admin."}),r.jsxs("div",{id:"footerLinks",className:"flex flex-col items-center gap-2 w-full",children:[r.jsxs("div",{className:"flex flex-wrap justify-center gap-3 w-full",children:[r.jsxs("a",{href:"locations.html",className:"cinematic-glass-pill magnetic-pill px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-bold text-sm flex items-center gap-2.5 group",style:{color:"#fff"},children:[r.jsxs("svg",{className:"w-4 h-4",style:{color:"rgba(212,175,55,0.7)",transition:"color 0.3s"},fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"2.5",children:[r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"}),r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 11a3 3 0 11-6 0 3 3 0 016 0z"})]}),"Cari GOR Terdekat"]}),r.jsxs("a",{href:"register.html",className:"cinematic-glass-pill magnetic-pill px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-bold text-sm flex items-center gap-2.5 group",style:{color:"#fff"},children:[r.jsx("svg",{className:"w-4 h-4",style:{color:"rgba(212,175,55,0.7)",transition:"color 0.3s"},fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"2.5",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M13 10V3L4 14h7v7l9-11h-7z"})}),"Booking Sekarang"]})]}),r.jsxs("div",{className:"flex flex-wrap justify-center gap-3 sm:gap-4 w-full mt-2",children:[r.jsx("a",{href:"login.html",className:"cinematic-glass-pill-sm magnetic-pill px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-medium",style:{color:"rgba(255,255,255,0.45)"},children:"Masuk"}),r.jsx("a",{href:"register.html",className:"cinematic-glass-pill-sm magnetic-pill px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-medium",style:{color:"rgba(255,255,255,0.45)"},children:"Daftar"}),r.jsx("a",{href:"my-bookings.html",className:"cinematic-glass-pill-sm magnetic-pill px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-medium",style:{color:"rgba(255,255,255,0.45)"},children:"Riwayat Booking"}),r.jsx("a",{href:"admin/dashboard.html",className:"cinematic-glass-pill-sm magnetic-pill px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-medium",style:{color:"rgba(255,255,255,0.45)"},children:"Admin Panel"})]}),r.jsxs("div",{className:"flex flex-wrap justify-center gap-3 sm:gap-4 w-full mt-3",style:{paddingTop:"0.75rem",borderTop:"1px solid rgba(255,255,255,0.04)"},children:[r.jsxs("a",{href:"https://wa.me/6281915680315",target:"_blank",rel:"noopener noreferrer",className:"cinematic-glass-pill magnetic-pill px-6 sm:px-8 py-3 sm:py-3.5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2.5 group",style:{color:"rgba(255,255,255,0.6)"},children:[r.jsx("svg",{className:"w-4 h-4",style:{color:"#D4AF37",transition:"transform 0.3s"},fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"2",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"})}),"081915680315"]}),r.jsxs("a",{href:"https://mail.google.com/mail/?view=cm&fs=1&to=muhzee16@gmail.com",target:"_blank",rel:"noopener noreferrer",className:"cinematic-glass-pill magnetic-pill px-6 sm:px-8 py-3 sm:py-3.5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2.5 group",style:{color:"rgba(255,255,255,0.6)"},children:[r.jsx("svg",{className:"w-4 h-4",style:{color:"#D4AF37",transition:"transform 0.3s"},fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"2",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"})}),"muhzee16@gmail.com"]})]})]})]}),r.jsxs("div",{className:"relative z-20 w-full pb-4 sm:pb-5 px-5 sm:px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-5 flex-shrink-0",children:[r.jsx("div",{style:{color:"rgba(255,255,255,0.2)",fontSize:"0.6rem",fontWeight:"600",letterSpacing:"0.15em",textTransform:"uppercase"},className:"order-2 md:order-1",children:"© 2026 JogjaCourt. Hak cipta dilindungi."}),r.jsxs("div",{className:"flex items-center gap-3 sm:gap-4 order-1 md:order-2",children:[r.jsxs("div",{className:"cinematic-glass-pill-sm px-5 sm:px-6 py-2.5 sm:py-3 rounded-full flex items-center gap-2 cursor-default",style:{border:"1px solid rgba(255,255,255,0.06)"},children:[r.jsx("span",{style:{color:"rgba(255,255,255,0.3)",fontSize:"0.6rem",fontWeight:"700",letterSpacing:"0.15em",textTransform:"uppercase"},children:"Dibuat dengan"}),r.jsx("span",{className:"cinematic-heartbeat",style:{fontSize:"0.9rem"},children:"❤"}),r.jsx("span",{style:{color:"rgba(255,255,255,0.3)",fontSize:"0.6rem",fontWeight:"700",letterSpacing:"0.15em",textTransform:"uppercase"},children:"di"}),r.jsx("span",{style:{color:"#D4AF37",fontWeight:"900",fontSize:"0.75rem",letterSpacing:"0.02em",marginLeft:"2px"},children:"Yogyakarta"})]}),r.jsx("button",{onClick:()=>window.scrollTo({top:0,behavior:"smooth"}),className:"cinematic-glass-pill magnetic-pill w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center group",style:{color:"rgba(255,255,255,0.3)"},"aria-label":"Kembali ke atas",children:r.jsx("svg",{className:"w-5 h-5",style:{transition:"transform 0.3s"},fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M5 10l7-7m0 0l7 7m-7-7v18"})})})]})]})]})})]})}function Bf(){const e=ge(),[t,n]=j.useState(!1),[a,s]=j.useState(!1),[l,i]=j.useState(""),[o,d]=j.useState({venues:15,courts:50});j.useEffect(()=>{(async()=>{try{if(window.api){const[f,x]=await Promise.all([window.api.get("/venues"),window.api.get("/courts")]);d({venues:(f==null?void 0:f.length)||15,courts:(x==null?void 0:x.length)||50})}}catch(f){console.error("Failed to load stats",f)}})()},[]);const c=async h=>{h.preventDefault(),s(!0),i("");try{const f=h.target.email.value,x=h.target.password.value,w=h.target.rememberMe.checked,y=await window.auth.login(f,x,w);y.role==="admin"||y.role==="super_admin"?window.location.href="admin/dashboard.html":y.mitra_status==="pending"?(i("Pengajuan Mitra Anda sedang menunggu persetujuan Super Admin."),setTimeout(()=>{e("/")},3e3)):e("/")}catch(f){i(f.message||"Email atau password salah.")}finally{s(!1)}};return r.jsxs("div",{className:"unified-layout",children:[r.jsx("div",{className:"unified-bg"}),r.jsx("div",{className:"fixed top-6 left-6 z-50",children:r.jsx(rl,{to:"/",className:"w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 hover:border-brand hover:bg-brand/10 transition-colors group",children:r.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",className:"w-5 h-5 text-gray-400 group-hover:text-brand transition-colors",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"2",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 19l-7-7 7-7"})})})}),r.jsx("div",{className:"orb-1 absolute top-[15%] left-[20%] w-[300px] h-[300px] bg-brand/10 rounded-full blur-[100px] z-[1] pointer-events-none"}),r.jsx("div",{className:"orb-2 absolute bottom-[20%] right-[20%] w-[250px] h-[250px] bg-brand/8 rounded-full blur-[80px] z-[1] pointer-events-none"}),r.jsxs("div",{className:"relative z-10 w-full max-w-5xl flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-16",children:[r.jsxs("div",{className:"hidden lg:block flex-1 fade-up text-left",children:[r.jsx("div",{className:"cursor-pointer w-fit mb-8",children:r.jsx(ko,{})}),r.jsxs("h2",{className:"font-display text-5xl xl:text-6xl text-white leading-[0.95] mb-6",children:["Siap",r.jsx("br",{}),"Mabar",r.jsx("br",{}),r.jsx("span",{className:"text-brand",children:"Hari Ini?"})]}),r.jsx("p",{className:"text-white/60 text-base leading-relaxed max-w-md",children:"Yuk masuk ke akunmu. Amankan jadwal lapangannya sebelum keduluan tim sebelah!"}),r.jsxs("div",{className:"flex gap-6 mt-8 border-t border-white/10 pt-6",children:[r.jsxs("div",{children:[r.jsxs("p",{className:"text-brand font-display text-3xl",children:[o.venues,"+"]}),r.jsx("p",{className:"text-white/40 text-[10px] uppercase tracking-wider mt-1 font-bold",children:"GOR Mitra"})]}),r.jsx("div",{className:"w-px bg-white/10"}),r.jsxs("div",{children:[r.jsxs("p",{className:"text-brand font-display text-3xl",children:[o.courts,"+"]}),r.jsx("p",{className:"text-white/40 text-[10px] uppercase tracking-wider mt-1 font-bold",children:"Lapangan"})]}),r.jsx("div",{className:"w-px bg-white/10"}),r.jsxs("div",{children:[r.jsx("p",{className:"text-brand font-display text-3xl",children:"24/7"}),r.jsx("p",{className:"text-white/40 text-[10px] uppercase tracking-wider mt-1 font-bold",children:"Booking Aktif"})]})]})]}),r.jsxs("div",{className:"w-full max-w-[400px] fade-up delay-1 relative mx-auto lg:mx-0",children:[r.jsx("div",{className:"lg:hidden text-center mb-6",children:r.jsx(ko,{})}),r.jsxs("div",{className:"glass-card",children:[r.jsxs("div",{className:"mb-5",children:[r.jsx("p",{className:"text-brand text-[10px] font-semibold uppercase tracking-[0.2em] mb-1",children:"Selamat Datang"}),r.jsx("h1",{className:"text-2xl sm:text-3xl font-extrabold text-white leading-tight",children:"Masuk ke Akun"})]}),l&&r.jsxs("div",{className:"bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-xl text-sm mb-4 flex items-center gap-3",children:[r.jsx("svg",{className:"w-5 h-5 flex-shrink-0",fill:"currentColor",viewBox:"0 0 20 20",children:r.jsx("path",{fillRule:"evenodd",d:"M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z",clipRule:"evenodd"})}),r.jsx("span",{children:l})]}),r.jsxs("form",{onSubmit:c,children:[r.jsxs("div",{className:"input-group",children:[r.jsx("input",{type:"email",id:"email",name:"email",required:!0,placeholder:" ",className:"input-field",autoComplete:"email"}),r.jsx("label",{className:"float-label",children:"Alamat Email"}),r.jsx("svg",{className:"input-icon w-[18px] h-[18px]",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"1.8",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"})})]}),r.jsxs("div",{className:"input-group",children:[r.jsx("input",{type:t?"text":"password",id:"password",name:"password",required:!0,placeholder:" ",className:"input-field !pr-11",autoComplete:"current-password"}),r.jsx("label",{className:"float-label",children:"Password"}),r.jsx("svg",{className:"input-icon w-[18px] h-[18px]",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"1.8",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"})}),r.jsx("button",{type:"button",onClick:()=>n(!t),className:"absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors z-10",children:t?r.jsxs("svg",{className:"w-[18px] h-[18px]",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"1.8",children:[r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 12a3 3 0 11-6 0 3 3 0 016 0z"}),r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"})]}):r.jsx("svg",{className:"w-[18px] h-[18px]",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"1.8",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18"})})})]}),r.jsxs("div",{className:"flex items-center justify-between mb-3",children:[r.jsxs("label",{className:"custom-check text-sm text-white/40 hover:text-white/60 transition-colors",children:[r.jsx("input",{type:"checkbox",id:"rememberMe",name:"rememberMe"}),r.jsx("div",{className:"check-box",children:r.jsx("svg",{className:"w-3 h-3",fill:"none",viewBox:"0 0 24 24",stroke:"#000",strokeWidth:"3",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M5 13l4 4L19 7"})})}),"Ingat Saya"]}),r.jsx("a",{href:"/forgot-password.html",className:"text-sm text-brand hover:text-brand-light transition-colors font-medium",children:"Lupa Password?"})]}),r.jsx("button",{type:"submit",disabled:a,className:"btn-primary",children:a?r.jsx("svg",{className:"spinner-svg",viewBox:"0 0 50 50",children:r.jsx("circle",{cx:"25",cy:"25",r:"20",fill:"none",strokeWidth:"5"})}):r.jsx("span",{className:"btn-text",children:"Masuk Sekarang"})})]}),r.jsx("div",{className:"divider",children:r.jsx("span",{className:"text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]",children:"Atau dengan"})}),r.jsx("div",{className:"w-full flex justify-center mt-4 mb-2",children:r.jsx("div",{id:"googleButtonContainer",children:r.jsx("p",{className:"text-[10px] text-white/40 text-center w-full py-2",children:"Google Login akan dimuat..."})})}),r.jsxs("p",{className:"text-center text-xs text-white/30 mt-5",children:["Belum punya akun? ",r.jsx(rl,{to:"/register.html",className:"text-brand font-semibold hover:text-brand-light transition-colors",children:"Daftar gratis →"})]})]})]})]})]})}function If(){const e=ge(),[t,n]=j.useState(!1),[a,s]=j.useState(!1),[l,i]=j.useState(""),[o,d]=j.useState(!1),[c,h]=j.useState(""),[f,x]=j.useState({courts:50});j.useEffect(()=>{(async()=>{try{if(window.api){const b=await window.api.get("/courts");x({courts:(b==null?void 0:b.length)||50})}}catch(b){console.error("Failed to load stats",b)}})()},[]);const w=v=>{const b=v.target.value;b.length===0?h(""):b.length<6?h("strength-weak"):b.length<8||!/\d/.test(b)?h("strength-medium"):h("strength-strong")},y=async v=>{v.preventDefault(),s(!0),i(""),d(!1);try{const b=v.target.name.value,m=v.target.email.value,u=v.target.phone.value,p=v.target.password.value;window.auth&&await window.auth.register(b,m,u,p),d(!0),setTimeout(()=>{e("/login.html")},2e3)}catch(b){i(b.message||"Pendaftaran gagal.")}finally{s(!1)}};return r.jsxs(r.Fragment,{children:[r.jsx("div",{className:"unified-bg"}),r.jsx("div",{className:"fixed top-6 left-6 z-50",children:r.jsx("a",{href:"javascript:history.back()",className:"w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 hover:border-brand hover:bg-brand/10 transition-colors group",children:r.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",className:"w-5 h-5 text-gray-400 group-hover:text-brand transition-colors",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"2",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 19l-7-7 7-7"})})})}),r.jsxs("div",{className:"unified-layout",children:[r.jsx("div",{className:"orb-1 absolute top-[15%] left-[20%] w-[300px] h-[300px] bg-brand/10 rounded-full blur-[100px] z-[1] pointer-events-none"}),r.jsx("div",{className:"orb-2 absolute bottom-[20%] right-[20%] w-[250px] h-[250px] bg-brand/8 rounded-full blur-[80px] z-[1] pointer-events-none"}),r.jsxs("div",{className:"relative z-10 w-full max-w-5xl flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-16",children:[r.jsxs("div",{className:"hidden lg:block flex-1 fade-up text-left",children:[r.jsx("div",{className:"cursor-pointer w-fit mb-8",onClick:"window.location.href='index.html'",children:r.jsxs("div",{className:"gahar-logo-btn",onClick:"window.location.href='index.html'",children:[r.jsx("img",{src:"assets/logo.png",alt:"JogjaCourt Logo",className:"gahar-logo-img"}),r.jsx("div",{className:"gahar-logo-text",children:r.jsxs("span",{className:"gahar-logo-title",children:["JOGJA",r.jsx("span",{className:"text-brand",children:"COURT"})]})})]})}),r.jsxs("h2",{className:"font-display text-5xl xl:text-6xl text-white leading-[0.95] mb-6",children:["Gabung",r.jsx("br",{}),"Sirkel Mabar",r.jsx("br",{}),r.jsx("span",{className:"text-brand",children:"Anak Jogja."})]}),r.jsx("p",{className:"text-white/60 text-base leading-relaxed max-w-md",children:"Dapatkan akses ke ratusan lapangan terbaik, booking kilat, dan bebas atur jadwal mabarmu sesuka hati."}),r.jsxs("div",{className:"mt-8 space-y-4 text-left max-w-sm border-t border-white/10 pt-6",children:[r.jsxs("div",{className:"flex items-center gap-3",children:[r.jsx("div",{className:"w-8 h-8 rounded-lg bg-brand/10 border border-brand/30 flex items-center justify-center flex-shrink-0",children:r.jsx("svg",{className:"w-4 h-4 text-brand",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"2",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M13 10V3L4 14h7v7l9-11h-7z"})})}),r.jsx("span",{className:"text-white/70 font-medium text-sm",children:"Booking instan tanpa nunggu balasan admin"})]}),r.jsxs("div",{className:"flex items-center gap-3",children:[r.jsx("div",{className:"w-8 h-8 rounded-lg bg-brand/10 border border-brand/30 flex items-center justify-center flex-shrink-0",children:r.jsx("svg",{className:"w-4 h-4 text-brand",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"2",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"})})}),r.jsx("span",{className:"text-white/70 font-medium text-sm",children:"Pembayaran gampang & aman banget"})]}),r.jsxs("div",{className:"flex items-center gap-3",children:[r.jsx("div",{className:"w-8 h-8 rounded-lg bg-brand/10 border border-brand/30 flex items-center justify-center flex-shrink-0",children:r.jsxs("svg",{className:"w-4 h-4 text-brand",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"2",children:[r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"}),r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 11a3 3 0 11-6 0 3 3 0 016 0z"})]})}),r.jsxs("span",{className:"text-white/70 font-medium text-sm",children:["Tersedia ",r.jsx("span",{id:"statCourts",children:f.courts}),"+ lapangan favorit se-Jogja"]})]})]})]}),r.jsxs("div",{className:"w-full max-w-[400px] fade-up fade-up-d1 relative mx-auto lg:mx-0",children:[r.jsx("div",{className:"lg:hidden text-center mb-6",children:r.jsxs("div",{className:"gahar-logo-btn",onClick:"window.location.href='index.html'",children:[r.jsx("img",{src:"assets/logo.png",alt:"JogjaCourt Logo",className:"gahar-logo-img"}),r.jsx("div",{className:"gahar-logo-text",children:r.jsxs("span",{className:"gahar-logo-title",children:["JOGJA",r.jsx("span",{className:"text-brand",children:"COURT"})]})})]})}),r.jsxs("div",{className:"glass-card",children:[r.jsxs("div",{className:"mb-5",children:[r.jsx("p",{className:"text-brand text-[10px] font-semibold uppercase tracking-[0.2em] mb-1",children:"Mulai Sekarang"}),r.jsx("h1",{className:"text-2xl sm:text-3xl font-extrabold text-white leading-tight",children:"Buat Akun Baru"})]}),l&&r.jsxs("div",{className:"bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-xl text-sm mb-4 flex items-center gap-3",children:[r.jsx("svg",{className:"w-5 h-5 flex-shrink-0",fill:"currentColor",viewBox:"0 0 20 20",children:r.jsx("path",{fillRule:"evenodd",d:"M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z",clipRule:"evenodd"})}),r.jsx("span",{children:l})]}),o&&r.jsxs("div",{className:"bg-brand/10 border border-brand/20 text-brand px-4 py-2.5 rounded-xl text-sm mb-4 flex items-center gap-3",children:[r.jsx("svg",{className:"w-5 h-5 flex-shrink-0",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"2",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"})}),r.jsx("span",{children:"Pendaftaran berhasil! Mengalihkan..."})]}),r.jsxs("form",{onSubmit:y,children:[r.jsxs("div",{className:"input-group",children:[r.jsx("input",{type:"text",id:"name",required:!0,placeholder:" ",className:"input-field",autocomplete:"name"}),r.jsx("label",{className:"float-label",children:"Nama Lengkap"}),r.jsx("svg",{className:"input-icon w-[18px] h-[18px]",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"1.8",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"})})]}),r.jsxs("div",{className:"input-group",children:[r.jsx("input",{type:"email",id:"email",required:!0,placeholder:" ",className:"input-field",autocomplete:"email"}),r.jsx("label",{className:"float-label",children:"Alamat Email"}),r.jsx("svg",{className:"input-icon w-[18px] h-[18px]",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"1.8",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"})})]}),r.jsxs("div",{className:"input-group",children:[r.jsx("input",{type:"tel",id:"phone",placeholder:" ",className:"input-field",autocomplete:"tel"}),r.jsx("label",{className:"float-label",children:"WhatsApp (Opsional)"}),r.jsx("svg",{className:"input-icon w-[18px] h-[18px]",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"1.8",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"})})]}),r.jsxs("div",{className:"mb-3",children:[r.jsxs("div",{className:"input-group !mb-0",children:[r.jsx("input",{type:t?"text":"password",id:"password",name:"password",required:!0,minLength:"6",placeholder:" ",className:"input-field !pr-11",autoComplete:"new-password",onChange:w}),r.jsx("label",{className:"float-label",children:"Password"}),r.jsx("svg",{className:"input-icon w-[18px] h-[18px]",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"1.8",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"})}),r.jsx("button",{type:"button",onClick:()=>n(!t),className:"absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors z-10",children:t?r.jsxs("svg",{className:"w-[18px] h-[18px]",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"1.8",children:[r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 12a3 3 0 11-6 0 3 3 0 016 0z"}),r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"})]}):r.jsx("svg",{className:"w-[18px] h-[18px]",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"1.8",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18"})})})]}),r.jsxs("div",{className:`strength-track ${c}`,children:[r.jsx("div",{className:"strength-segment seg-1"}),r.jsx("div",{className:"strength-segment seg-2"}),r.jsx("div",{className:"strength-segment seg-3"})]})]}),r.jsx("button",{type:"submit",disabled:a,className:"btn-primary",children:a?r.jsx("svg",{className:"spinner-svg",viewBox:"0 0 50 50",children:r.jsx("circle",{cx:"25",cy:"25",r:"20",fill:"none",strokeWidth:"5"})}):r.jsx("span",{className:"btn-text",children:"Daftar Sekarang"})})]}),r.jsx("div",{className:"divider",children:r.jsx("span",{className:"text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]",children:"Atau dengan"})}),r.jsx("div",{className:"w-full flex justify-center mt-4 mb-2",children:r.jsx("div",{id:"googleButtonContainer"})}),r.jsxs("p",{className:"text-center text-xs text-white/30 mt-5",children:["Sudah punya akun? ",r.jsx(rl,{to:"/login.html",className:"text-brand font-semibold hover:text-brand-light transition-colors",children:"Masuk →"})]})]})]})]})]})]})}function _f(){return ge(),j.useEffect(()=>{const e=document.createElement("script");return e.innerHTML=`
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
        auth.requireAuth();

        const urlParams = new URLSearchParams(window.location.search);
        const bookingId = urlParams.get('id');
        if (!bookingId) window.location.href = 'locations.html';

        let bookingData = null;
        let countdownInterval;
        const formatRp = n => 'Rp ' + Number(n).toLocaleString('id-ID');

        async function loadBooking() {
            try {
                // Gunakan endpoint GET /bookings/{id} — real, bukan dari list
                bookingData = await api.get(\`/bookings/\${bookingId}\`);

                if (bookingData.status !== 'pending') {
                    window.location.href = 'my-bookings.html';
                    return;
                }

                document.getElementById('bCourt').textContent = bookingData.court?.name || '—';
                document.getElementById('bDate').textContent = new Date(bookingData.booking_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                let bTypeLabel = bookingData.booking_type === 'monthly' ? ' <span class="text-xs ml-2 bg-brand/20 text-brand px-2 py-0.5 rounded uppercase tracking-widest">Sewa Bulanan</span>' : '';
                document.getElementById('bTime').innerHTML = \`\${bookingData.start_time.substring(0, 5)} – \${bookingData.end_time.substring(0, 5)} WIB\${bTypeLabel}\`;
                document.getElementById('bTotal').textContent = formatRp(bookingData.total_price);

                document.getElementById('loadingState').classList.add('hidden');
                document.getElementById('pageContent').classList.remove('hidden');

                if (bookingData.expires_at) startTimer(bookingData.expires_at);
            } catch (error) {
                alert(error.message || 'Booking tidak ditemukan');
                window.location.href = 'my-bookings.html';
            }
        }

        function startTimer(expiresAtIso) {
            const expireDate = new Date(expiresAtIso.endsWith('Z') ? expiresAtIso : expiresAtIso + 'Z');
            countdownInterval = setInterval(() => {
                const diff = expireDate - new Date();
                if (diff <= 0) {
                    clearInterval(countdownInterval);
                    document.getElementById('timer').textContent = '00:00';
                    alert('Waktu pembayaran habis. Pesanan dibatalkan.');
                    window.location.href = 'locations.html';
                    return;
                }
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                document.getElementById('timer').textContent = \`\${String(m).padStart(2, '0')}:\${String(s).padStart(2, '0')}\`;
            }, 1000);
        }

        const methodSelect = document.getElementById('method');
        const bankDetails = document.getElementById('bankDetails');
        const onlineLogos = document.getElementById('onlineLogos');
        const submitBtn = document.getElementById('submitBtn');

        methodSelect.addEventListener('change', (e) => {
            if (e.target.value === 'cash') {
                bankDetails.classList.add('hidden');
                onlineLogos.classList.add('hidden');
                submitBtn.textContent = 'Konfirmasi Bayar di Tempat';
            } else {
                bankDetails.classList.add('hidden'); // Xendit doesn't need manual bank transfer
                onlineLogos.classList.remove('hidden');
                submitBtn.textContent = 'Bayar Sekarang (Xendit)';
            }
        });

        // Inisialisasi tampilan awal
        bankDetails.classList.add('hidden'); // Sembunyikan rekening manual
        onlineLogos.classList.remove('hidden');
        submitBtn.textContent = 'Bayar Sekarang (Xendit)';

        document.getElementById('paymentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('submitBtn');
            const errEl = document.getElementById('errorMsg');
            errEl.classList.add('hidden');

            const methodVal = document.getElementById('method').value;

            if (methodVal === 'online') {
                btn.textContent = 'Memproses...';
                btn.disabled = true;
                try {
                    const resp = await api.post(\`/payments/\${bookingId}/xendit-invoice\`);
                    if (resp.invoice_url === "simulated_success") {
                        clearInterval(countdownInterval);
                        alert('Pembayaran BERHASIL (Mode Simulasi Xendit)!');
                        window.location.href = 'my-bookings.html';
                    } else {
                        // Redirect ke Xendit Checkout
                        window.location.href = resp.invoice_url;
                    }
                } catch (error) {
                    errEl.textContent = error.message;
                    errEl.classList.remove('hidden');
                    btn.textContent = 'Bayar Sekarang';
                    btn.disabled = false;
                }
            } else if (methodVal === 'cash') {
                const formData = new FormData();
                formData.append('method', 'cash');
                formData.append('amount', bookingData.total_price);
                // Tidak ada file untuk cash

                btn.textContent = 'Memproses...';
                btn.disabled = true;

                try {
                    await api.post(\`/payments/\${bookingId}/upload-proof\`, formData);
                    clearInterval(countdownInterval);
                    alert('Booking berhasil! Silakan bayar cash saat tiba di lokasi sebelum bermain.');
                    window.location.href = 'my-bookings.html';
                } catch (error) {
                    errEl.textContent = error.message;
                    errEl.classList.remove('hidden');
                    btn.textContent = 'Konfirmasi Bayar di Tempat';
                    btn.disabled = false;
                }
            }
        });

        loadBooking();
    
`,document.body.appendChild(e),()=>{document.body.contains(e)&&document.body.removeChild(e)}},[]),r.jsxs(r.Fragment,{children:[r.jsx("nav",{className:"fixed w-full z-50 bg-dark border-b border-dark-border",children:r.jsxs("div",{className:"max-w-3xl mx-auto px-4 h-16 flex justify-between items-center",children:[r.jsxs("div",{className:"gahar-logo-btn",onClick:"window.location.href='index.html'",children:[r.jsx("img",{src:"assets/logo.png",alt:"JogjaCourt Logo",className:"gahar-logo-img"}),r.jsx("div",{className:"gahar-logo-text",children:r.jsxs("span",{className:"gahar-logo-title",children:["JOGJA",r.jsx("span",{className:"text-brand",children:"COURT"})]})})]}),r.jsxs("a",{href:"my-bookings.html",className:"text-xs text-gray-400 hover:text-white flex items-center gap-1",children:[r.jsx("i",{"data-lucide":"arrow-left",className:"w-4 h-4"})," Riwayat Pesanan"]})]})}),r.jsxs("div",{className:"pt-24 pb-20 max-w-3xl mx-auto px-4 sm:px-6",children:[r.jsx("div",{id:"loadingState",className:"flex justify-center items-center py-20",children:r.jsxs("div",{className:"pl",style:{fontSize:"0.35rem",margin:"0 auto"},children:[r.jsx("div",{className:"pl__dot"}),r.jsx("div",{className:"pl__dot"}),r.jsx("div",{className:"pl__dot"}),r.jsx("div",{className:"pl__dot"}),r.jsx("div",{className:"pl__dot"}),r.jsx("div",{className:"pl__dot"}),r.jsx("div",{className:"pl__dot"}),r.jsx("div",{className:"pl__dot"}),r.jsx("div",{className:"pl__dot"}),r.jsx("div",{className:"pl__dot"}),r.jsx("div",{className:"pl__dot"}),r.jsx("div",{className:"pl__dot"}),r.jsx("div",{className:"pl__text",children:"Loading..."})]})}),r.jsxs("div",{id:"pageContent",className:"hidden",children:[r.jsxs("div",{className:"mb-6 flex items-center gap-4",children:[r.jsx("a",{href:"javascript:history.back()",className:"w-10 h-10 glass-panel rounded-full flex items-center justify-center border border-white/5 hover:border-brand transition-colors group",children:r.jsx("i",{"data-lucide":"arrow-left",className:"w-5 h-5 text-gray-400 group-hover:text-brand transition-colors"})}),r.jsx("div",{children:r.jsxs("h1",{className:"text-3xl font-display uppercase tracking-widest mb-1",children:["Selesaikan ",r.jsx("span",{className:"text-brand",children:"Pembayaran"})]})})]}),r.jsxs("div",{className:"bg-yellow-900/10 border border-yellow-500/30 rounded-xl p-5 mb-8 flex items-start gap-4 shadow-[0_0_20px_rgba(234,179,8,0.15)] relative overflow-hidden",children:[r.jsx("div",{className:"absolute top-0 left-0 w-1 h-full bg-yellow-500"}),r.jsx("i",{"data-lucide":"clock",className:"text-yellow-500 w-6 h-6 flex-shrink-0 animate-pulse mt-0.5"}),r.jsxs("div",{children:[r.jsxs("p",{className:"text-yellow-500 font-medium",children:["Selesaikan pembayaran dalam ",r.jsx("span",{id:"timer",className:"font-bold text-xl tracking-wider mx-1",children:"15:00"})]}),r.jsx("p",{className:"text-yellow-600/80 text-sm mt-1",children:"Slot dikunci untuk Anda. Jika waktu habis, pesanan dibatalkan otomatis."})]})]}),r.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6",children:[r.jsxs("div",{className:"glass-panel rounded-xl p-6 h-max",children:[r.jsx("h2",{className:"text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-dark-border pb-3 mb-4",children:"Detail Pesanan"}),r.jsxs("div",{className:"space-y-4",children:[r.jsxs("div",{children:[r.jsx("p",{className:"text-xs text-gray-500",children:"Lapangan"}),r.jsx("p",{id:"bCourt",className:"font-semibold text-white",children:"-"})]}),r.jsxs("div",{children:[r.jsx("p",{className:"text-xs text-gray-500",children:"Tanggal"}),r.jsx("p",{id:"bDate",className:"font-medium text-lg",children:"-"})]}),r.jsxs("div",{children:[r.jsx("p",{className:"text-xs text-gray-500",children:"Waktu Main"}),r.jsx("p",{id:"bTime",className:"font-medium text-lg text-brand",children:"-"})]}),r.jsxs("div",{className:"border-t border-dark-border pt-5 mt-2",children:[r.jsx("p",{className:"text-xs text-gray-500 mb-1",children:"Total Tagihan"}),r.jsx("p",{id:"bTotal",className:"font-display tracking-wider font-bold text-4xl bg-clip-text text-transparent bg-gradient-to-r from-brand to-green-400",children:"-"})]})]})]}),r.jsxs("div",{className:"glass-panel rounded-xl p-6",children:[r.jsx("h2",{className:"text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-dark-border pb-3 mb-4",children:"Upload Bukti Pembayaran"}),r.jsxs("div",{id:"bankDetails",className:"bg-dark/50 p-5 rounded-xl border border-white/5 mb-6 shadow-inner relative overflow-hidden group",children:[r.jsx("div",{className:"absolute -right-10 -top-10 w-32 h-32 bg-brand/5 rounded-full blur-2xl group-hover:bg-brand/10 transition-colors"}),r.jsx("p",{className:"text-xs text-gray-500 mb-2 uppercase tracking-widest",children:"Rekening Tujuan"}),r.jsxs("p",{className:"text-2xl font-display tracking-widest font-bold text-white flex items-center gap-3",children:[r.jsx("i",{"data-lucide":"building-2",className:"w-5 h-5 text-gray-500"})," BCA — 8723 1122 3344"]}),r.jsx("p",{className:"text-xs text-brand uppercase tracking-wider mt-2 font-bold",children:"A/N ARENA BOOKING"})]}),r.jsx("div",{id:"errorMsg",className:"hidden bg-red-900/30 border border-red-500/50 text-red-400 p-3 rounded text-sm mb-4"}),r.jsxs("form",{id:"paymentForm",className:"space-y-4",children:[r.jsxs("div",{children:[r.jsx("label",{className:"block text-xs text-gray-400 mb-1 uppercase tracking-widest",children:"Metode Bayar *"}),r.jsxs("select",{id:"method",required:!0,className:"form-input w-full px-3 py-2.5 rounded cursor-pointer",children:[r.jsx("option",{value:"online",children:"Bayar Online (Otomatis)"}),r.jsx("option",{value:"cash",children:"Cash di Tempat"})]}),r.jsxs("div",{id:"onlineLogos",className:"flex items-center gap-3 mt-3 px-1 border border-brand/20 bg-brand/5 p-2 rounded flex-wrap",children:[r.jsx("i",{"data-lucide":"shield-check",className:"text-brand w-4 h-4"}),r.jsx("span",{className:"text-[10px] text-gray-400 font-bold uppercase tracking-widest",children:"Didukung oleh Xendit: QRIS, E-Wallet, VA, Kartu Kredit."})]})]}),r.jsx("div",{id:"proofUploadWrapper",className:"hidden"}),r.jsx("button",{type:"submit",id:"submitBtn",className:"w-full bg-brand text-black py-3 rounded font-bold uppercase tracking-widest hover:bg-white transition-colors mt-2",children:"Kirim Bukti Pembayaran"})]})]})]})]})]})]})}function Tf(){return ge(),j.useEffect(()=>{const e=document.createElement("script");return e.innerHTML=`
        if (typeof Notifications !== 'undefined') Notifications.init();
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
        auth.requireAuth();
        
        // Show bell if authenticated
        if (typeof auth !== 'undefined' && auth.isAuthenticated()) {
            const bellWrap = document.getElementById('notifBellWrap');
            if (bellWrap) bellWrap.classList.remove('hidden');
        }

        const urlParams = new URLSearchParams(window.location.search);
        const venueId = urlParams.get('venue_id');
        const venueName = urlParams.get('venue_name');

        if (!venueId) window.location.href = 'locations.html';
        if (venueName) document.getElementById('venueTitle').textContent = venueName;

        // Setup DatePicker
        const datePicker = document.getElementById('datePicker');
        const customDateBtn = document.getElementById('customDateBtn');
        const fp = flatpickr(datePicker, {
            dateFormat: "Y-m-d",
            minDate: "today",
            defaultDate: "today",
            locale: "id",
            disableMobile: "true",
            onChange: function(selectedDates, dateStr, instance) {
                generateDateCards(new Date(), 14); // refresh visual selection
                loadData();
            }
        });

        customDateBtn.addEventListener('click', () => {
            fp.open();
        });

        // Generate Horizontal Date Scroller
        function generateDateCards(startDate, count = 14) {
            const container = document.getElementById('dateScroller');
            container.innerHTML = '';
            
            const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
            
            // Adjust to local timezone string
            const tzoffset = (new Date()).getTimezoneOffset() * 60000;
            const todayStr = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
            
            const selectedVal = datePicker.value || todayStr;
            
            for(let i=0; i<count; i++) {
                const d = new Date(startDate);
                d.setDate(d.getDate() + i);
                
                const d_tz = new Date(d.getTime() - tzoffset);
                const dateStr = d_tz.toISOString().split('T')[0];
                
                const dayName = days[d.getDay()];
                const dateNum = d.getDate();
                const monthName = months[d.getMonth()];
                
                const isSelected = selectedVal === dateStr;
                
                const btn = document.createElement('button');
                btn.className = \`flex-shrink-0 flex flex-col items-center justify-center w-[72px] h-[84px] rounded-xl border transition-all \${isSelected ? 'bg-brand border-brand text-black shadow-[0_0_15px_rgba(212,175,55,0.3)] transform scale-105' : 'bg-dark-surface border-dark-border text-gray-400 hover:border-brand/50 hover:text-white'}\`;
                
                btn.innerHTML = \`
                    <span class="text-[10px] font-bold uppercase tracking-widest \${isSelected ? 'text-black/70' : 'text-gray-500'} mb-1">\${dateStr === todayStr ? 'Hari Ini' : dayName}</span>
                    <span class="text-2xl font-display leading-none \${isSelected ? 'text-black' : 'text-white'}">\${dateNum}</span>
                    <span class="text-[10px] mt-1 \${isSelected ? 'text-black/70' : 'text-gray-500'}">\${monthName}</span>
                \`;
                
                btn.onclick = () => {
                    fp.setDate(dateStr, true);
                };
                
                container.appendChild(btn);
            }
        }

        document.getElementById('btnPrevDate').addEventListener('click', () => {
            document.getElementById('dateScroller').scrollBy({left: -200, behavior: 'smooth'});
        });
        document.getElementById('btnNextDate').addEventListener('click', () => {
            document.getElementById('dateScroller').scrollBy({left: 200, behavior: 'smooth'});
        });

        generateDateCards(new Date(), 14);

        let allCourts = [];
        let selectedCourtId = null;
        let selectedSlots = [];
        let totalAmount = 0;
        let currentRentalType = 'hourly';
        let isLoading = false;

        // Utility format Rupiah
        const formatRp = (num) => 'Rp ' + Number(num).toLocaleString('id-ID');

        async function loadData() {
            if (isLoading) return;
            isLoading = true;
            document.getElementById('loadingState').classList.remove('hidden');
            document.getElementById('courtsContainer').classList.add('hidden');
            
            try {
                // Fetch venue detail and courts
                const [venueDetail, courts] = await Promise.all([
                    api.get(\`/venues/\${venueId}\`),
                    api.get(\`/venues/\${venueId}/courts\`)
                ]);
                
                if (venueDetail && venueDetail.description) {
                    const descEl = document.getElementById('venueDescription');
                    descEl.textContent = venueDetail.description;
                    descEl.classList.remove('hidden');
                }

                allCourts = courts;
                
                if (allCourts.length === 0) {
                    document.getElementById('loadingState').classList.add('hidden');
                    document.getElementById('emptyState').classList.remove('hidden');
                    return;
                }

                await renderCourts();
            } catch (error) {
                alert(error.message);
            } finally {
                isLoading = false;
            }
        }

        async function renderCourts() {
            const container = document.getElementById('courtsContainer');
            container.innerHTML = '';
            
            const dateVal = datePicker.value;
            
            // Get current local time for comparing past slots
            const now = new Date();
            const tzoffset = now.getTimezoneOffset() * 60000;
            const todayStr = (new Date(now.getTime() - tzoffset)).toISOString().split('T')[0];
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTimeStr = \`\${currentHour.toString().padStart(2, '0')}:\${currentMinute.toString().padStart(2, '0')}\`;
            
            // Fetch all availability data in parallel
            const availabilityPromises = allCourts.map(court => 
                api.get(\`/courts/\${court.id}/availability?date_req=\${dateVal}\`)
                    .then(data => ({ court, data }))
                    .catch(e => {
                        console.error("Error fetching availability", e);
                        return { court, data: null };
                    })
            );
            
            const results = await Promise.all(availabilityPromises);

            for (const {court, data: availabilityData} of results) {
                if (!availabilityData) continue;

                const courtEl = document.createElement('div');
                courtEl.className = 'court-card p-6 rounded-xl';
                
                let slotsHtml = '';
                availabilityData.slots.forEach(slot => {
                    const startH = slot.start_time.substring(0,5);
                    
                    let isBooked = !slot.is_available;
                    
                    // Disable past slots if the date is today
                    if (dateVal === todayStr && startH <= currentTimeStr) {
                        isBooked = true;
                    }
                    
                    const priceRp = formatRp(slot.price);
                    const btnClass = isBooked ? 'booked' : 'available border-gray-600 hover:text-white text-gray-300';
                    
                    slotsHtml += \`
                        <button 
                            class="slot-btn rounded-xl py-3 px-2 flex flex-col items-center justify-center text-sm \${btnClass}"
                            \${isBooked ? 'disabled' : ''}
                            data-court="\${court.id}"
                            data-start="\${slot.start_time}"
                            onclick="toggleSlot('\${court.id}', '\${slot.start_time}', '\${slot.end_time}', \${slot.price}, this)"
                        >
                            <span class="font-bold text-base tracking-wide \${isBooked ? 'text-gray-600' : 'text-gray-200'}">\${startH}</span>
                            <span class="text-[10px] mt-1 \${isBooked ? 'text-gray-700' : 'text-gray-400'}">\${priceRp}</span>
                            \${slot.is_peak ? \`<span class="text-[9px] \${isBooked ? 'text-gray-600 bg-gray-800' : 'text-brand bg-brand/10'} px-1.5 py-0.5 rounded mt-1 font-bold uppercase tracking-wider">Peak</span>\` : ''}
                        </button>
                    \`;
                });

                courtEl.innerHTML = \`
                    <div class="flex justify-between items-start mb-6">
                        <div>
                            <h3 class="text-2xl font-bold text-white flex items-center gap-2">
                                \${court.name}
                            </h3>
                            <p class="text-gray-400 text-sm mt-1">
                                Reguler: <span class="text-white">\${formatRp(court.price_regular)}/jam</span> 
                                \${court.price_peak > court.price_regular ? \`| Peak: <span class="text-brand">\${formatRp(court.price_peak)}/jam</span>\` : ''}
                            </p>
                            \${court.price_monthly ? \`<p class="text-gray-500 text-xs mt-1">Sewa Bulanan: <span class="text-brand">\${formatRp(court.price_monthly)} / bulan</span></p>\` : ''}
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3">
                        \${slotsHtml}
                    </div>
                \`;
                container.appendChild(courtEl);
            }
            
            document.getElementById('loadingState').classList.add('hidden');
            container.classList.remove('hidden');
            
            // Reset selection when re-rendered
            selectedSlots = [];
            selectedCourtId = null;
            updateCheckoutBar();
        }

        window.changeDuration = function(delta) {
            if (selectedSlots.length === 0) return;
            selectedSlots.sort((a,b) => a.start.localeCompare(b.start));
            
            if (delta === 1) {
                const lastSlot = selectedSlots[selectedSlots.length - 1];
                const nextStart = lastSlot.end;
                const nextBtn = document.querySelector(\`.slot-btn[data-court="\${selectedCourtId}"][data-start="\${nextStart}"]\`);
                
                if (!nextBtn) {
                    alert("Jam berikutnya tidak tersedia atau di luar jam operasional.");
                    return;
                }
                if (nextBtn.disabled) {
                    alert("Jam berikutnya sudah dibooking orang lain.");
                    return;
                }
                nextBtn.click();
            } else if (delta === -1) {
                if (selectedSlots.length <= 1) return;
                const lastSlot = selectedSlots[selectedSlots.length - 1];
                const lastBtn = document.querySelector(\`.slot-btn[data-court="\${selectedCourtId}"][data-start="\${lastSlot.start}"]\`);
                if (lastBtn) {
                    lastBtn.click();
                }
            }
        };

        window.toggleSlot = function(courtId, start, end, price, btnEl) {
            // If user selects a different court, reset everything
            if (selectedCourtId && selectedCourtId !== courtId) {
                alert("Anda hanya bisa memesan 1 lapangan dalam satu transaksi. Silakan batalkan pilihan sebelumnya.");
                return;
            }
            
            selectedCourtId = courtId;
            
            // Check if already selected
            const index = selectedSlots.findIndex(s => s.start === start);
            if (index > -1) {
                // Deselect
                selectedSlots.splice(index, 1);
                btnEl.classList.remove('selected');
                btnEl.classList.add('available', 'border-gray-600', 'text-gray-300');
                if (selectedSlots.length === 0) selectedCourtId = null;
            } else {
                // Select
                selectedSlots.push({start, end, price});
                btnEl.classList.remove('available', 'border-gray-600', 'text-gray-300');
                btnEl.classList.add('selected');
            }
            
            updateCheckoutBar();
        };

        function updateCheckoutBar() {
            const bar = document.getElementById('checkoutBar');
            const rentalTypeContainer = document.getElementById('rentalTypeContainer');
            const rentalTypeSelect = document.getElementById('rentalTypeSelect');
            
            if (selectedSlots.length > 0) {
                const court = allCourts.find(c => c.id === selectedCourtId);
                
                if (court && court.price_monthly) {
                    rentalTypeContainer.classList.remove('hidden');
                } else {
                    rentalTypeContainer.classList.add('hidden');
                    currentRentalType = 'hourly';
                    rentalTypeSelect.value = 'hourly';
                }
                
                if (currentRentalType === 'monthly') {
                    totalAmount = selectedSlots.length * Number(court.price_monthly);
                } else {
                    totalAmount = selectedSlots.reduce((sum, slot) => sum + Number(slot.price), 0);
                }
                
                document.getElementById('totalPrice').textContent = formatRp(totalAmount);
                document.getElementById('durationCounter').textContent = selectedSlots.length;
                bar.classList.remove('translate-y-[150%]');
                if (typeof lucide !== 'undefined') { lucide.createIcons(); }
            } else {
                bar.classList.add('translate-y-[150%]');
            }
        }
        
        document.getElementById('rentalTypeSelect').addEventListener('change', (e) => {
            currentRentalType = e.target.value;
            updateCheckoutBar();
        });

        document.getElementById('bookBtn').addEventListener('click', async () => {
            if (selectedSlots.length === 0) return;
            
            // Sort slots to ensure continuity
            selectedSlots.sort((a,b) => a.start.localeCompare(b.start));
            
            // Check if selected slots are continuous
            let isContinuous = true;
            for (let i = 0; i < selectedSlots.length - 1; i++) {
                if (selectedSlots[i].end !== selectedSlots[i+1].start) {
                    isContinuous = false;
                    break;
                }
            }
            
            if (!isContinuous) {
                alert("Harap pilih jadwal jam yang saling berurutan (contoh: 11:00, 12:00) dalam satu pesanan. Jika ingin jam terpisah, buat pesanan baru.");
                return;
            }
            
            const start_time = selectedSlots[0].start;
            const end_time = selectedSlots[selectedSlots.length-1].end;
            
            const payload = {
                court_id: selectedCourtId,
                booking_type: currentRentalType,
                booking_date: datePicker.value,
                start_time: start_time,
                end_time: end_time
            };

            const btn = document.getElementById('bookBtn');
            btn.innerHTML = 'Memproses...';
            btn.disabled = true;

            try {
                const booking = await api.post('/bookings', payload);
                // Redirect to payment
                window.location.href = \`booking.html?id=\${booking.id}\`;
            } catch (error) {
                alert(error.message);
                btn.innerHTML = 'Lanjut Pesan';
                btn.disabled = false;
                // Reload data in case someone else took it
                loadData();
            }
        });

        loadData();
    
`,document.body.appendChild(e),()=>{document.body.contains(e)&&document.body.removeChild(e)}},[]),r.jsxs(r.Fragment,{children:[r.jsx("nav",{className:"fixed w-full z-50 bg-dark/90 backdrop-blur-md border-b border-dark-border",children:r.jsxs("div",{className:"max-w-7xl mx-auto px-4 h-16 flex justify-between items-center",children:[r.jsxs("div",{className:"gahar-logo-btn",onClick:"window.location.href='index.html'",children:[r.jsx("img",{src:"assets/logo.png",alt:"JogjaCourt Logo",className:"gahar-logo-img"}),r.jsx("div",{className:"gahar-logo-text",children:r.jsxs("span",{className:"gahar-logo-title",children:["JOGJA",r.jsx("span",{className:"text-brand",children:"COURT"})]})})]}),r.jsxs("div",{className:"flex items-center gap-4",children:[r.jsxs("a",{href:"javascript:history.back()",className:"text-sm font-medium text-gray-400 hover:text-white flex items-center",children:[r.jsx("i",{"data-lucide":"arrow-left",className:"w-4 h-4 mr-2"})," Kembali"]}),r.jsx("div",{id:"notifBellWrap",className:"hidden relative",children:r.jsxs("button",{className:"notif-toggle-btn p-2 rounded-lg hover:bg-white/5 transition-colors relative",onClick:"Notifications.toggleDropdown(event)",children:[r.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",className:"w-5 h-5 text-gray-400 hover:text-white transition-colors",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[r.jsx("path",{d:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"}),r.jsx("path",{d:"M10.3 21a1.94 1.94 0 0 0 3.4 0"})]}),r.jsx("span",{className:"notif-badge",children:"0"})]})})]})]})}),r.jsx("div",{className:"pt-24 pb-8 border-b border-dark-border bg-[#0d0d0d]",children:r.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:r.jsxs("div",{className:"mb-6 flex items-center gap-4",children:[r.jsx("a",{href:"javascript:history.back()",className:"w-10 h-10 bg-[#181818] rounded-full flex items-center justify-center border border-[#333] hover:border-brand transition-colors group",children:r.jsx("i",{"data-lucide":"arrow-left",className:"w-5 h-5 text-gray-400 group-hover:text-brand transition-colors"})}),r.jsxs("div",{children:[r.jsx("p",{className:"text-brand font-bold uppercase tracking-widest text-sm mb-1",children:"Pilihan Lapangan di"}),r.jsx("h1",{id:"venueTitle",className:"text-4xl md:text-5xl font-display tracking-widest uppercase mb-2",children:"Memuat..."}),r.jsx("p",{id:"venueDescription",className:"text-gray-400 text-sm max-w-3xl leading-relaxed hidden"})]})]})})}),r.jsx("div",{className:"border-b border-dark-border bg-[#121212] sticky top-16 z-40",children:r.jsxs("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3",children:[r.jsx("button",{id:"btnPrevDate",className:"p-2 text-gray-500 hover:text-white transition-colors bg-white/5 rounded-full hidden sm:block",children:r.jsx("i",{"data-lucide":"chevron-left",className:"w-5 h-5"})}),r.jsx("div",{id:"dateScroller",className:"flex-grow flex gap-3 overflow-x-auto hide-scrollbar pb-2 pt-1 scroll-smooth"}),r.jsx("button",{id:"btnNextDate",className:"p-2 text-gray-500 hover:text-white transition-colors bg-white/5 rounded-full hidden sm:block",children:r.jsx("i",{"data-lucide":"chevron-right",className:"w-5 h-5"})}),r.jsx("div",{className:"w-px h-8 bg-dark-border mx-2 hidden sm:block"}),r.jsxs("div",{className:"relative min-w-[40px]",children:[r.jsx("button",{id:"customDateBtn",className:"p-2 text-brand hover:bg-brand/10 transition-colors rounded-full border border-brand/30",title:"Pilih Tanggal Lain",children:r.jsx("i",{"data-lucide":"calendar",className:"w-5 h-5"})}),r.jsx("input",{type:"text",id:"datePicker",className:"absolute top-0 right-0 opacity-0 w-10 h-10 pointer-events-none"})]})]})}),r.jsxs("div",{className:"py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:[r.jsx("div",{id:"loadingState",className:"flex justify-center items-center py-20",children:r.jsxs("div",{className:"pl",style:{fontSize:"0.35rem",margin:"0 auto"},children:[r.jsx("div",{className:"pl__dot"}),r.jsx("div",{className:"pl__dot"}),r.jsx("div",{className:"pl__dot"}),r.jsx("div",{className:"pl__dot"}),r.jsx("div",{className:"pl__dot"}),r.jsx("div",{className:"pl__dot"}),r.jsx("div",{className:"pl__dot"}),r.jsx("div",{className:"pl__dot"}),r.jsx("div",{className:"pl__dot"}),r.jsx("div",{className:"pl__dot"}),r.jsx("div",{className:"pl__dot"}),r.jsx("div",{className:"pl__dot"}),r.jsx("div",{className:"pl__text",children:"Loading..."})]})}),r.jsx("div",{id:"courtsContainer",className:"space-y-8 hidden"}),r.jsxs("div",{id:"emptyState",className:"hidden text-center py-20",children:[r.jsx("i",{"data-lucide":"x-circle",className:"w-16 h-16 text-gray-600 mx-auto mb-4"}),r.jsx("h3",{className:"text-xl font-medium text-gray-400",children:"Belum ada lapangan yang aktif di GOR ini."})]})]}),r.jsx("div",{id:"checkoutBar",className:"fixed bottom-6 left-1/2 transform -translate-x-1/2 translate-y-[150%] w-[95%] max-w-4xl bg-[#111]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 transition-transform duration-500 z-50 shadow-[0_20px_50px_rgba(0,0,0,0.8)]",children:r.jsxs("div",{className:"flex flex-col md:flex-row justify-between items-center gap-4",children:[r.jsxs("div",{className:"flex items-center gap-4 w-full md:w-auto",children:[r.jsxs("div",{className:"bg-black/40 rounded-xl p-2 border border-white/5 flex items-center gap-4 w-full md:w-auto justify-between md:justify-start",children:[r.jsxs("div",{className:"pl-2",children:[r.jsx("p",{className:"text-gray-500 text-[10px] uppercase tracking-widest font-bold mb-0.5",children:"Durasi"}),r.jsxs("p",{className:"text-white font-medium text-sm",children:[r.jsx("span",{id:"durationCounter",children:"1"})," Jam"]})]}),r.jsxs("div",{className:"flex items-center bg-gray-900 rounded-lg border border-gray-700 overflow-hidden",children:[r.jsx("button",{onClick:"changeDuration(-1)",className:"w-10 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors",children:"-"}),r.jsx("div",{className:"w-px h-4 bg-gray-700"}),r.jsx("button",{onClick:"changeDuration(1)",className:"w-10 h-8 flex items-center justify-center text-brand hover:text-black hover:bg-brand transition-colors",children:"+"})]})]}),r.jsxs("div",{id:"rentalTypeContainer",className:"hidden",children:[r.jsx("p",{className:"text-gray-500 text-[10px] uppercase tracking-widest font-bold mb-1",children:"Tipe Sewa"}),r.jsxs("div",{className:"relative",children:[r.jsxs("select",{id:"rentalTypeSelect",className:"appearance-none bg-black/40 border border-white/10 rounded-lg text-white text-sm font-medium px-4 py-2 pr-10 outline-none focus:border-brand hover:border-white/20 transition-colors cursor-pointer",children:[r.jsx("option",{value:"hourly",children:"Harian"}),r.jsx("option",{value:"monthly",children:"Bulanan"})]}),r.jsx("i",{"data-lucide":"chevron-down",className:"w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"})]})]})]}),r.jsxs("div",{className:"flex items-center gap-5 w-full md:w-auto justify-between md:justify-end border-t border-white/5 md:border-0 pt-4 md:pt-0",children:[r.jsxs("div",{className:"text-left md:text-right",children:[r.jsx("p",{className:"text-gray-500 text-[10px] uppercase tracking-widest font-bold mb-0.5",children:"Total Biaya"}),r.jsx("p",{id:"totalPrice",className:"text-2xl font-display tracking-widest font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400",children:"Rp 0"})]}),r.jsxs("button",{id:"bookBtn",className:"bg-brand text-black px-6 py-3 font-bold uppercase tracking-widest rounded-xl hover:bg-white hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:-translate-y-0.5 transition-all flex items-center gap-2",children:["Pesan ",r.jsx("i",{"data-lucide":"arrow-right",className:"w-4 h-4"})]})]})]})})]})}function Pf(){return ge(),j.useEffect(()=>{const e=document.createElement("script");return e.innerHTML=`
        if (typeof Notifications !== 'undefined') Notifications.init();
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
        
        // Show bell if authenticated
        if (auth.isAuthenticated()) {
            const bellWrap = document.getElementById('notifBellWrap');
            if (bellWrap) bellWrap.classList.remove('hidden');
        }

        // Show user info if logged in
        if (auth.isAuthenticated()) {
            const user = auth.getUser();
            document.getElementById('userNameDisplay').textContent = user.name;
            document.getElementById('userNameDisplay').classList.remove('hidden');
            document.getElementById('profileLink').classList.remove('hidden');
            document.getElementById('myBookingsLink').classList.remove('hidden');
            document.getElementById('logoutBtn').classList.remove('hidden');
        }
        document.getElementById('logoutBtn')?.addEventListener('click', () => auth.logout());

        let allAreas = [];

        // Province icon map
        const provinceColors = {
            'D.I. Yogyakarta': '#D4AF37',
            'Jawa Tengah': '#3b82f6',
            'Jawa Barat': '#f97316',
            'Jawa Timur': '#8b5cf6',
            'DKI Jakarta': '#ef4444',
        };

        async function loadAreas() {
            try {
                allAreas = await api.get('/areas');
                renderAreas(allAreas);
            } catch (error) {
                document.getElementById('loadingState').innerHTML =
                    \`<div class="col-span-3 text-center py-20"><p class="text-red-400 text-sm">Gagal memuat daerah: \${error.message}</p><button onclick="loadAreas()" class="mt-4 text-brand text-sm hover:underline">Coba Lagi</button></div>\`;
            }
        }

        function renderAreas(areas) {
            document.getElementById('loadingState').classList.add('hidden');
            const grid = document.getElementById('areasGrid');
            const empty = document.getElementById('emptyState');

            if (areas.length === 0) {
                grid.classList.add('hidden');
                empty.classList.remove('hidden');
                return;
            }

            empty.classList.add('hidden');
            grid.classList.remove('hidden');

            grid.innerHTML = areas.map((area, i) => {
                const color = provinceColors[area.province] || '#D4AF37';
                return \`
                <div class="area-card rounded-2xl p-7 relative"
                     onclick="window.location.href='venues.html?area_id=\${area.id}&area_name=\${encodeURIComponent(area.name)}'">
                    <div class="absolute top-5 right-5 w-8 h-8 rounded-lg flex items-center justify-center" style="background: \${color}20; border: 1px solid \${color}40;">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="\${color}" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    </div>

                    <span class="text-[11px] font-bold uppercase tracking-widest mb-3 block" style="color: \${color}">\${area.province}</span>
                    <h3 class="text-2xl font-bold text-white mb-2">\${area.name}</h3>
                    <p class="text-gray-500 text-sm line-clamp-2 leading-relaxed mb-6">\${area.description || 'Temukan GOR terbaik di daerah ini.'}</p>

                    <div class="flex items-center text-sm font-semibold text-gray-400 arrow-icon">
                        <span>Lihat GOR tersedia</span>
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                    </div>
                </div>\`;
            }).join('');
        }

        // Search
        document.getElementById('searchInput').addEventListener('input', e => {
            const term = e.target.value.toLowerCase();
            renderAreas(allAreas.filter(a =>
                a.name.toLowerCase().includes(term) || a.province.toLowerCase().includes(term)
            ));
        });

        loadAreas();
    
`,document.body.appendChild(e),()=>{document.body.contains(e)&&document.body.removeChild(e)}},[]),r.jsxs(r.Fragment,{children:[r.jsx("nav",{className:"fixed w-full z-50",style:{background:"rgba(8,8,8,0.9)",backdropFilter:"blur(16px)",borderBottom:"1px solid #2a2a2a"},children:r.jsxs("div",{className:"max-w-7xl mx-auto px-4 h-16 flex justify-between items-center",children:[r.jsxs("div",{className:"gahar-logo-btn",onClick:"window.location.href='index.html'",children:[r.jsx("img",{src:"assets/logo.png",alt:"JogjaCourt Logo",className:"gahar-logo-img"}),r.jsx("div",{className:"gahar-logo-text",children:r.jsxs("span",{className:"gahar-logo-title",children:["JOGJA",r.jsx("span",{className:"text-brand",children:"COURT"})]})})]}),r.jsxs("div",{className:"flex items-center gap-4",children:[r.jsx("div",{id:"notifBellWrap",className:"hidden relative",children:r.jsxs("button",{className:"notif-toggle-btn p-2 rounded-lg hover:bg-white/5 transition-colors relative",onClick:"Notifications.toggleDropdown(event)",children:[r.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",className:"w-5 h-5 text-gray-400 hover:text-white transition-colors",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[r.jsx("path",{d:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"}),r.jsx("path",{d:"M10.3 21a1.94 1.94 0 0 0 3.4 0"})]}),r.jsx("span",{className:"notif-badge",children:"0"})]})}),r.jsx("span",{id:"userNameDisplay",className:"text-sm text-gray-400 hidden md:block"}),r.jsx("a",{href:"profile.html",id:"profileLink",className:"hidden text-xs text-gray-400 hover:text-brand transition-colors border border-dark-border px-3 py-1.5 rounded-lg",children:"Profil Akun"}),r.jsx("a",{href:"my-bookings.html",id:"myBookingsLink",className:"hidden text-xs text-gray-400 hover:text-brand transition-colors border border-dark-border px-3 py-1.5 rounded-lg",children:"Pesanan Saya"}),r.jsx("button",{id:"logoutBtn",className:"hidden text-xs text-red-400 hover:text-red-300 transition-colors",children:"Keluar"})]})]})}),r.jsxs("div",{className:"pt-28 pb-12 relative",children:[r.jsx("div",{className:"absolute top-0 right-0 w-96 h-96 bg-brand/3 rounded-full blur-[120px] pointer-events-none"}),r.jsxs("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10",children:[r.jsx("span",{className:"text-brand text-xs font-bold uppercase tracking-widest",children:"Langkah 1 dari 3"}),r.jsxs("h1",{className:"text-4xl md:text-6xl font-display tracking-widest uppercase mt-2 mb-3",children:["Pilih ",r.jsx("span",{className:"text-brand",children:"Daerah"})]}),r.jsx("p",{className:"text-gray-500 text-base mb-8",children:"Temukan GOR terbaik di kotamu. Pilih daerah terlebih dahulu."}),r.jsx("div",{className:"relative max-w-lg w-full mt-4",children:r.jsxs("div",{id:"poda",children:[r.jsx("div",{className:"search-glow"}),r.jsx("div",{className:"search-darkBorderBg"}),r.jsx("div",{className:"search-darkBorderBg"}),r.jsx("div",{className:"search-darkBorderBg"}),r.jsx("div",{className:"search-white"}),r.jsx("div",{className:"search-border"}),r.jsxs("div",{id:"main",children:[r.jsx("input",{id:"searchInput",placeholder:"Cari nama kabupaten atau kota...",type:"text",className:"search-input-field"}),r.jsx("div",{id:"input-mask"}),r.jsx("div",{id:"gold-mask"}),r.jsx("div",{className:"filterBorder"}),r.jsx("div",{id:"filter-icon",children:r.jsx("svg",{preserveAspectRatio:"none",height:"20",width:"20",viewBox:"4.8 4.56 14.832 15.408",fill:"none",children:r.jsx("path",{d:"M8.16 6.65002H15.83C16.47 6.65002 16.99 7.17002 16.99 7.81002V9.09002C16.99 9.56002 16.7 10.14 16.41 10.43L13.91 12.64C13.56 12.93 13.33 13.51 13.33 13.98V16.48C13.33 16.83 13.1 17.29 12.81 17.47L12 17.98C11.24 18.45 10.2 17.92 10.2 16.99V13.91C10.2 13.5 9.97 12.98 9.73 12.69L7.52 10.36C7.23 10.08 7 9.55002 7 9.20002V7.87002C7 7.17002 7.52 6.65002 8.16 6.65002Z",stroke:"#D4AF37",strokeWidth:"1",strokeLinecap:"round",strokeLinejoin:"round"})})}),r.jsx("div",{id:"search-icon",children:r.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"20",viewBox:"0 0 24 24",strokeWidth:"2",strokeLinejoin:"round",strokeLinecap:"round",height:"20",fill:"none",className:"feather feather-search",children:[r.jsx("circle",{stroke:"#D4AF37",r:"8",cy:"11",cx:"11"}),r.jsx("line",{stroke:"#D4AF37",y2:"16.65",y1:"22",x2:"16.65",x1:"22"})]})})]})]})})]})]}),r.jsxs("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20",children:[r.jsxs("div",{id:"loadingState",className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",children:[r.jsx("div",{className:"skeleton h-48"}),r.jsx("div",{className:"skeleton h-48"}),r.jsx("div",{className:"skeleton h-48"})]}),r.jsx("div",{id:"areasGrid",className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 hidden"}),r.jsxs("div",{id:"emptyState",className:"hidden text-center py-24",children:[r.jsx("div",{className:"w-20 h-20 bg-dark-card border border-dark-border rounded-full flex items-center justify-center mx-auto mb-4",children:r.jsx("i",{"data-lucide":"map-off",className:"w-8 h-8 text-gray-600"})}),r.jsx("h3",{className:"text-lg font-semibold text-gray-400 mb-2",children:"Tidak ada daerah ditemukan"}),r.jsx("p",{className:"text-gray-600 text-sm",children:"Coba kata kunci yang berbeda"})]})]})]})}function Mf(){return ge(),j.useEffect(()=>{const e=document.createElement("script");return e.innerHTML=`
        lucide.createIcons();

        // Step navigation
        function nextStep() {
            // Validate step 1
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const pass = document.getElementById('password').value;
            
            if(!name || !email || !pass) {
                const err = document.getElementById('errorMsg');
                document.getElementById('errorText').textContent = "Mohon lengkapi Nama, Email, dan Password sebelum lanjut.";
                err.classList.remove('hidden');
                return;
            }
            document.getElementById('errorMsg').classList.add('hidden');
            
            // Switch UI
            document.getElementById('step1-content').classList.add('hidden');
            document.getElementById('step1-content').classList.remove('opacity-100');
            
            const step2 = document.getElementById('step2-content');
            step2.classList.remove('hidden');
            setTimeout(() => step2.classList.replace('opacity-0', 'opacity-100'), 50);

            // Update Indicators
            document.getElementById('step1-indicator').classList.add('opacity-50');
            document.getElementById('step2-indicator').classList.remove('opacity-50');
            
            const s2n = document.getElementById('step2-number');
            s2n.className = "w-8 h-8 rounded-full bg-brand text-black flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(212,175,55,0.4)]";
            document.getElementById('step2-text').className = "text-sm font-semibold text-white hidden sm:block";
        }

        function prevStep() {
            document.getElementById('step2-content').classList.add('hidden');
            document.getElementById('step2-content').classList.replace('opacity-100', 'opacity-0');
            
            const step1 = document.getElementById('step1-content');
            step1.classList.remove('hidden');
            setTimeout(() => step1.classList.add('opacity-100'), 50);

            // Update Indicators
            document.getElementById('step2-indicator').classList.add('opacity-50');
            document.getElementById('step1-indicator').classList.remove('opacity-50');
            
            const s2n = document.getElementById('step2-number');
            s2n.className = "w-8 h-8 rounded-full bg-white/10 text-white/50 border border-white/20 flex items-center justify-center font-bold text-sm";
            document.getElementById('step2-text').className = "text-sm font-semibold text-white/50 hidden sm:block";
        }

        document.querySelectorAll('.toggle-pw').forEach(btn => {
            btn.addEventListener('click', function() {
                const target = document.getElementById(this.dataset.target);
                target.type = target.type === 'password' ? 'text' : 'password';
            });
        });

        const pwInput = document.getElementById('password');
        const meter = document.getElementById('strengthMeter');
        pwInput.addEventListener('input', () => {
            const val = pwInput.value;
            meter.className = 'strength-track absolute -bottom-3 left-0 right-0';
            if (val.length < 6) {
                meter.classList.add('strength-weak');
            } else if (val.length < 10 || !/d/.test(val) || !/[A-Z]/.test(val)) {
                meter.classList.add('strength-medium');
            } else {
                meter.classList.add('strength-strong');
            }
        });

        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('submitBtn');
            const btnText = btn.querySelector('.btn-text');
            const spinner = btn.querySelector('.spinner-svg');
            const errEl = document.getElementById('errorMsg');
            const errText = document.getElementById('errorText');
            
            btn.disabled = true; btnText.classList.add('hidden'); spinner.classList.remove('hidden');
            errEl.classList.add('hidden');

            try {
                if (auth.isAuthenticated()) {
                    await auth.upgradeMitra(
                        document.getElementById('gorName').value,
                        document.getElementById('gorAddress').value
                    );
                } else {
                    await auth.registerMitra(
                        document.getElementById('name').value,
                        document.getElementById('email').value,
                        document.getElementById('password').value,
                        document.getElementById('phone').value,
                        document.getElementById('gorName').value,
                        document.getElementById('gorAddress').value
                    );
                }

                document.getElementById('step1-content').classList.add('hidden');
                document.getElementById('step2-content').classList.add('hidden');
                document.getElementById('successMsg').classList.remove('hidden');
                
                setTimeout(() => {
                    window.location.href = auth.isAuthenticated() ? 'index.html' : 'login.html';
                }, 3000);
            } catch (error) {
                errText.textContent = error.message || 'Gagal mengirim pengajuan.';
                errEl.classList.remove('hidden');
                btn.disabled = false; btnText.classList.remove('hidden'); spinner.classList.add('hidden');
            }
        });

        // Initialize state for logged in user
        document.addEventListener('DOMContentLoaded', () => {
            if (auth.isAuthenticated()) {
                const user = auth.getUser();
                if (user.role !== 'customer') {
                    // Already an admin/super_admin
                    window.location.href = 'admin/dashboard.html';
                    return;
                }
                if (user.mitra_status === 'pending') {
                    const errEl = document.getElementById('errorMsg');
                    errEl.classList.remove('hidden');
                    errEl.classList.replace('bg-red-900/30', 'bg-yellow-900/30');
                    errEl.classList.replace('border-red-500/50', 'border-yellow-500/50');
                    errEl.classList.replace('text-red-400', 'text-yellow-400');
                    document.getElementById('errorText').textContent = "Pengajuan Mitra Anda sedang menunggu persetujuan Super Admin. Anda saat ini masih berstatus sebagai Pelanggan biasa.";
                    setTimeout(() => { window.location.href = 'index.html'; }, 4000);
                    return;
                }

                // If regular customer, prepopulate or skip Step 1
                document.getElementById('name').value = user.name;
                document.getElementById('email').value = user.email;
                document.getElementById('password').value = "dummy12345"; // so validation passes
                
                // Show notice in Step 2
                document.getElementById('loggedInNotice').classList.remove('hidden');

                // Jump to Step 2
                nextStep();
            }
            initGoogleSignIn();
        });

        async function handleGoogleCredentialResponse(response) {
            const idToken = response.credential;
            const errEl = document.getElementById('errorMsg');
            const errText = document.getElementById('errorText');
            errEl.classList.add('hidden');
            
            // To be robust for Google login inside step 1, 
            // the user might not have entered GOR info.
            // But we can pass it anyway if they somehow typed it, or we leave it empty.
            // If they login with Google, they'll be processed by backend.
            
            try {
                const gorName = document.getElementById('gorName').value || "Belum Diisi";
                const gorAddr = document.getElementById('gorAddress').value || "Belum Diisi";
                
                const res = await api.post('/auth/google', { 
                    token: idToken, 
                    is_mitra: true,
                    mitra_gor_name: gorName,
                    mitra_gor_address: gorAddr
                });
                
                localStorage.setItem('token', res.access_token);
                localStorage.setItem('user', JSON.stringify(res.user));
                
                if (res.user.role === 'admin' || res.user.role === 'super_admin') {
                    window.location.href = 'admin/dashboard.html';
                } else {
                    if (res.user.mitra_status === 'pending') {
                        errEl.classList.remove('hidden');
                        errEl.classList.replace('bg-red-900/30', 'bg-yellow-900/30');
                        errEl.classList.replace('border-red-500/50', 'border-yellow-500/50');
                        errEl.classList.replace('text-red-400', 'text-yellow-400');
                        errText.textContent = "Pengajuan Mitra sedang diverifikasi. Cek halaman admin Anda nanti.";
                        setTimeout(() => { window.location.href = 'index.html'; }, 3000);
                    } else {
                        window.location.href = 'index.html';
                    }
                }
            } catch (err) {
                errText.textContent = err.message || 'Daftar Google Gagal.';
                errEl.classList.remove('hidden');
            }
        }

        async function initGoogleSignIn(retryCount = 0) {
            try {
                if (typeof google === 'undefined' || !google.accounts) {
                    if (retryCount < 10) { setTimeout(() => initGoogleSignIn(retryCount + 1), 500); return; }
                }
                const config = await api.get('/auth/config');
                if (config.google_client_id && config.google_client_id !== "ISI_CLIENT_ID_GOOGLE_ANDA_DISINI.apps.googleusercontent.com") {
                    google.accounts.id.initialize({ client_id: config.google_client_id, callback: handleGoogleCredentialResponse });
                    const container = document.getElementById("googleButtonContainer");
                    google.accounts.id.renderButton(container, { theme: "filled_black", size: "large", width: 250, text: "signup_with", shape: "rectangular" });
                } else {
                    document.getElementById("googleButtonContainer").innerHTML = '<p class="text-[10px] text-white/40 text-center w-full py-2">Google Login belum dikonfigurasi.</p>';
                }
            } catch (err) {
                if (retryCount < 5) { setTimeout(() => initGoogleSignIn(retryCount + 1), 1000); return; }
            }
        }
        document.addEventListener('DOMContentLoaded', initGoogleSignIn);
    
`,document.body.appendChild(e),()=>{document.body.contains(e)&&document.body.removeChild(e)}},[]),r.jsxs(r.Fragment,{children:[r.jsx("div",{className:"unified-bg"}),r.jsx("div",{className:"fixed top-6 left-6 z-50",children:r.jsx("a",{href:"index.html",className:"w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 hover:border-brand hover:bg-brand/10 transition-colors group",children:r.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",className:"w-5 h-5 text-gray-400 group-hover:text-brand transition-colors",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"2",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 19l-7-7 7-7"})})})}),r.jsxs("div",{className:"min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 relative z-10",children:[r.jsx("div",{className:"orb-1 absolute top-[15%] left-[20%] w-[300px] h-[300px] bg-brand/10 rounded-full blur-[100px] z-[1] pointer-events-none"}),r.jsx("div",{className:"orb-2 absolute bottom-[20%] right-[20%] w-[250px] h-[250px] bg-brand/8 rounded-full blur-[80px] z-[1] pointer-events-none"}),r.jsxs("div",{className:"w-full max-w-3xl glass-card border border-white/10 shadow-2xl relative z-10 overflow-hidden fade-up",children:[r.jsxs("div",{className:"border-b border-white/5 bg-black/40 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4",children:[r.jsxs("div",{children:[r.jsx("h2",{className:"text-2xl font-bold text-white tracking-tight",children:"Form Verifikasi Mitra"}),r.jsx("p",{className:"text-sm text-gray-400 mt-1",children:"Lengkapi data di bawah untuk mendaftarkan GOR Anda."})]}),r.jsxs("div",{className:"gahar-logo-btn",onClick:"window.location.href='index.html'",children:[r.jsx("img",{src:"assets/logo.png",alt:"JogjaCourt Logo",className:"gahar-logo-img"}),r.jsx("div",{className:"gahar-logo-text",children:r.jsxs("span",{className:"gahar-logo-title",children:["JOGJA",r.jsx("span",{className:"text-brand",children:"COURT"})]})})]})]}),r.jsx("div",{className:"px-8 py-5 border-b border-white/5 bg-white/[0.02]",children:r.jsxs("div",{className:"flex items-center justify-center sm:justify-start gap-4 sm:gap-8",children:[r.jsxs("div",{className:"flex items-center gap-3 transition-opacity duration-300",id:"step1-indicator",children:[r.jsx("div",{className:"w-8 h-8 rounded-full bg-brand text-black flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(212,175,55,0.4)]",children:"1"}),r.jsx("span",{className:"text-sm font-semibold text-white hidden sm:block",children:"Informasi Akun"})]}),r.jsx("div",{className:"w-12 sm:w-20 h-px bg-white/20"}),r.jsxs("div",{className:"flex items-center gap-3 transition-opacity duration-300 opacity-50",id:"step2-indicator",children:[r.jsx("div",{className:"w-8 h-8 rounded-full bg-white/10 text-white/50 border border-white/20 flex items-center justify-center font-bold text-sm",id:"step2-number",children:"2"}),r.jsx("span",{className:"text-sm font-semibold text-white/50 hidden sm:block",id:"step2-text",children:"Data GOR"})]})]})}),r.jsxs("div",{className:"p-8",children:[r.jsxs("div",{id:"errorMsg",className:"hidden bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-3",children:[r.jsx("svg",{className:"w-5 h-5 flex-shrink-0",fill:"currentColor",viewBox:"0 0 20 20",children:r.jsx("path",{fillRule:"evenodd",d:"M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z",clipRule:"evenodd"})}),r.jsx("span",{id:"errorText",children:"-"})]}),r.jsxs("div",{id:"successMsg",className:"hidden bg-brand/10 border border-brand/20 text-brand px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-3",children:[r.jsx("svg",{className:"w-5 h-5 flex-shrink-0",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"2",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"})}),r.jsx("span",{children:"Pengajuan Mitra Berhasil! Menunggu persetujuan Super Admin."})]}),r.jsxs("form",{id:"registerForm",children:[r.jsxs("div",{id:"step1-content",className:"transition-all duration-500",children:[r.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6",children:[r.jsxs("div",{className:"input-group",children:[r.jsx("input",{type:"text",id:"name",required:!0,placeholder:" ",className:"input-field",autocomplete:"name"}),r.jsx("label",{className:"float-label",children:"Nama Lengkap PIC"})]}),r.jsxs("div",{className:"input-group",children:[r.jsx("input",{type:"email",id:"email",required:!0,placeholder:" ",className:"input-field",autocomplete:"email"}),r.jsx("label",{className:"float-label",children:"Alamat Email (Login)"})]}),r.jsxs("div",{className:"input-group",children:[r.jsx("input",{type:"tel",id:"phone",placeholder:" ",className:"input-field",autocomplete:"tel"}),r.jsx("label",{className:"float-label",children:"Nomor WhatsApp Aktif"})]}),r.jsxs("div",{className:"input-group !mb-0",children:[r.jsx("input",{type:"password",id:"password",required:!0,minlength:"6",placeholder:" ",className:"input-field !pr-11",autocomplete:"new-password"}),r.jsx("label",{className:"float-label",children:"Password"}),r.jsx("button",{type:"button",className:"toggle-pw absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors z-10","data-target":"password",children:r.jsxs("svg",{className:"w-[18px] h-[18px]",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"1.8",children:[r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 12a3 3 0 11-6 0 3 3 0 016 0z"}),r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"})]})}),r.jsxs("div",{className:"strength-track absolute -bottom-3 left-0 right-0",id:"strengthMeter",children:[r.jsx("div",{className:"strength-segment seg-1"}),r.jsx("div",{className:"strength-segment seg-2"}),r.jsx("div",{className:"strength-segment seg-3"})]})]})]}),r.jsx("div",{className:"divider mt-8 mb-6",children:r.jsx("span",{className:"text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]",children:"Atau Daftar Dengan"})}),r.jsx("div",{className:"w-full flex justify-center mb-8",children:r.jsx("div",{id:"googleButtonContainer"})}),r.jsx("div",{className:"flex justify-end pt-4 border-t border-white/5",children:r.jsx("button",{type:"button",onClick:"nextStep()",className:"btn-primary !w-auto px-8",children:r.jsx("span",{className:"btn-text flex items-center gap-2",children:"Lanjut ke Data GOR →"})})})]}),r.jsxs("div",{id:"step2-content",className:"hidden opacity-0 transition-all duration-500",children:[r.jsxs("div",{id:"loggedInNotice",className:"hidden bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-4 flex gap-4 items-center",children:[r.jsx("div",{className:"w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0",children:r.jsx("i",{"data-lucide":"check-circle",className:"w-4 h-4"})}),r.jsxs("div",{className:"text-sm text-emerald-400/90 leading-relaxed",children:[r.jsx("span",{className:"font-bold",children:"Informasi Akun Tersimpan."})," Karena Anda sudah login, Langkah 1 telah dilewati. Silakan langsung lengkapi data GOR Anda."]})]}),r.jsxs("div",{className:"bg-brand/5 border border-brand/20 rounded-xl p-4 mb-6 flex gap-4",children:[r.jsx("i",{"data-lucide":"info",className:"w-5 h-5 text-brand flex-shrink-0 mt-0.5"}),r.jsx("div",{className:"text-sm text-brand/90 leading-relaxed",children:"Pastikan informasi GOR sesuai dengan dokumen resmi. Tim kami akan melakukan verifikasi berdasarkan data yang Anda berikan."})]}),r.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6",children:[r.jsxs("div",{className:"md:col-span-2",children:[r.jsx("label",{className:"block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider",children:"Nama GOR (Resmi)"}),r.jsx("input",{type:"text",id:"gorName",className:"w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-brand transition-colors text-sm",placeholder:"Contoh: GOR Badminton Juara",required:!0})]}),r.jsxs("div",{className:"md:col-span-2",children:[r.jsx("label",{className:"block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider",children:"Alamat Lengkap GOR"}),r.jsx("textarea",{id:"gorAddress",rows:"3",className:"w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-brand transition-colors text-sm resize-none",placeholder:"Masukkan alamat lengkap beserta kode pos...",required:!0})]}),r.jsxs("div",{className:"md:col-span-2 border border-dashed border-white/20 rounded-xl p-6 text-center hover:bg-white/[0.02] transition-colors cursor-pointer",onClick:"alert('Ini adalah mock-up UI untuk fitur upload dokumen. Anda bisa skip bagian ini.')",children:[r.jsx("i",{"data-lucide":"upload-cloud",className:"w-8 h-8 text-gray-500 mx-auto mb-3"}),r.jsx("p",{className:"text-sm font-semibold text-white mb-1",children:"Upload Bukti Kepemilikan (Opsional)"}),r.jsx("p",{className:"text-xs text-gray-500",children:"Format PDF, JPG, atau PNG (Max 5MB)"})]})]}),r.jsxs("div",{className:"flex items-center justify-between pt-8 mt-6 border-t border-white/5",children:[r.jsx("button",{type:"button",onClick:"prevStep()",className:"text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2",children:"← Kembali"}),r.jsxs("button",{type:"submit",id:"submitBtn",className:"btn-primary !w-auto px-10",children:[r.jsx("span",{className:"btn-text",children:"Kirim Pengajuan"}),r.jsx("svg",{className:"spinner-svg hidden",viewBox:"0 0 50 50",children:r.jsx("circle",{cx:"25",cy:"25",r:"20",fill:"none",strokeWidth:"5"})})]})]})]})]})]}),r.jsx("div",{className:"bg-black/60 px-8 py-4 border-t border-white/5 text-center",children:r.jsxs("p",{className:"text-xs text-gray-500",children:["Sudah pernah mendaftar? ",r.jsx("a",{href:"login.html",className:"text-brand hover:underline",children:"Masuk di sini"})]})})]})]})]})}function zf(){return ge(),j.useEffect(()=>{const e=document.createElement("script");return e.innerHTML=`
        if (typeof Notifications !== 'undefined') Notifications.init();
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
        auth.requireRole(['customer']);

        const formatRp = n => 'Rp ' + Number(n).toLocaleString('id-ID');
        const statusLabel = { pending: 'Menunggu Bayar', confirmed: 'Dikonfirmasi', cancelled: 'Dibatalkan', completed: 'Selesai', expired: 'Kadaluarsa' };

        let allBookings = [];

        async function loadBookings() {
            try {
                allBookings = await api.get('/bookings');
                renderBookings(allBookings);
            } catch (error) {
                document.getElementById('loadingState').innerHTML = \`<p class="text-red-400">Gagal memuat: \${error.message}</p>\`;
            }
        }

        function filterStatus(status) {
            document.querySelectorAll('.tab-btn').forEach(btn => {
                const isActive = btn.dataset.status === status;
                btn.classList.toggle('active', isActive);
            });
            const filtered = status === 'all' ? allBookings : allBookings.filter(b => b.status === status);
            renderBookings(filtered);
        }

        function renderBookings(bookings) {
            const list = document.getElementById('bookingsList');
            document.getElementById('loadingState').classList.add('hidden');

            if (bookings.length === 0) {
                list.classList.add('hidden');
                document.getElementById('emptyState').classList.remove('hidden');
                return;
            }

            document.getElementById('emptyState').classList.add('hidden');
            list.classList.remove('hidden');

            list.innerHTML = bookings.map(b => {
                const createdDate = new Date(b.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace('.', ':') + ' WIB';
                const playDate = new Date(b.booking_date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

                let actionHtml = '';
                if (b.status === 'pending') {
                    actionHtml = \`
                        <div class="flex gap-2 flex-shrink-0 w-full lg:w-auto mt-4 lg:mt-0">
                            <button onclick="cancelBooking('\${b.id}')" class="flex-1 lg:flex-none text-xs px-4 py-2.5 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all font-bold uppercase tracking-widest flex items-center justify-center gap-2"><i data-lucide="x" class="w-4 h-4"></i> Batal</button>
                            <button onclick="window.location.href='booking.html?id=\${b.id}'" class="flex-1 lg:flex-none btn-neon text-xs px-6 py-2.5 rounded-lg flex items-center justify-center gap-2"><i data-lucide="credit-card" class="w-4 h-4"></i> Bayar</button>
                        </div>\`;
                } else if (b.status === 'confirmed') {
                    actionHtml = \`
                        <div class="flex flex-col items-end gap-3 w-full lg:w-auto mt-4 lg:mt-0">
                            <button onclick="showTicket('\${b.id}', '\${b.court?.venue?.name || 'JogjaCourt'}', '\${b.court?.name || 'Lapangan'}', '\${playDate}', '\${b.start_time.substring(0,5)}')" class="w-full lg:w-auto text-xs px-6 py-3 bg-[#111] border border-brand/40 text-brand rounded-lg hover:bg-brand hover:text-black hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2 font-bold uppercase tracking-widest">
                                <i data-lucide="ticket" class="w-4 h-4"></i> E-Ticket
                            </button>
                        </div>
                    \`;
                }

                return \`
                <div class="glass-card rounded-2xl p-6">
                    <div class="flex flex-col lg:flex-row justify-between gap-6">
                        <div class="flex-grow">
                            <div class="flex justify-between items-start mb-4">
                                <div class="badge-pill badge-\${b.status}">
                                    <div class="badge-dot"></div>
                                    \${statusLabel[b.status] || b.status}
                                </div>
                                <span class="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1"><i data-lucide="clock-3" class="w-3 h-3"></i> \${createdDate}</span>
                            </div>
                            
                            <div class="mb-5">
                                <div class="text-[10px] text-brand font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><i data-lucide="map-pin" class="w-3 h-3"></i> \${b.court?.venue?.name || '—'}</div>
                                <h3 class="text-2xl font-display tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">\${b.court?.name || '—'}</h3>
                            </div>
                            
                            <div class="inner-box inline-flex items-center gap-6 flex-wrap">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10"><i data-lucide="calendar" class="w-4 h-4 text-brand"></i></div>
                                    <div>
                                        <div class="text-[9px] text-gray-500 uppercase tracking-widest">Tanggal Main</div>
                                        <div class="text-sm font-bold text-white">\${playDate}</div>
                                    </div>
                                </div>
                                <div class="w-px h-8 bg-white/10 hidden sm:block"></div>
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10"><i data-lucide="clock" class="w-4 h-4 text-brand"></i></div>
                                    <div>
                                        <div class="text-[9px] text-gray-500 uppercase tracking-widest">Waktu</div>
                                        <div class="text-sm font-bold text-white">\${b.start_time.substring(0,5)} – \${b.end_time.substring(0,5)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="flex lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 border-white/10 pt-4 lg:pt-0 mt-4 lg:mt-0 gap-3 min-w-[200px]">
                            <div class="text-left lg:text-right w-full lg:w-auto">
                                <p class="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Total Pembayaran</p>
                                <p class="font-display text-3xl text-brand">\${formatRp(b.total_price)}</p>
                            </div>
                            \${actionHtml}
                        </div>
                    </div>
                </div>\`;
            }).join('');

            if (typeof lucide !== 'undefined') { lucide.createIcons(); }
        }

        window.cancelBooking = async function(id) {
            if (!confirm('Yakin ingin membatalkan booking ini?')) return;
            try {
                await api.put(\`/bookings/\${id}/cancel\`, {});
                await loadBookings();
            } catch (e) { alert(e.message); }
        };

        window.showTicket = function(id, venue, court, date, time) {
            document.getElementById('tVenue').textContent = venue;
            document.getElementById('tCourt').textContent = court;
            document.getElementById('tDate').textContent = date;
            document.getElementById('tTime').textContent = time;
            document.getElementById('tQR').src = \`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=JC-\${id}&format=png\`;
            document.getElementById('ticketModal').classList.remove('hidden');
        };

        window.closeTicket = function() {
            document.getElementById('ticketModal').classList.add('hidden');
        };

        window.downloadTicket = function() {
            const ticketEl = document.getElementById('ticketContent');
            html2canvas(ticketEl, {
                backgroundColor: '#111',
                scale: 2, // High resolution
                useCORS: true,
                allowTaint: false
            }).then(canvas => {
                const link = document.createElement('a');
                link.download = \`E-Tiket_\${document.getElementById('tDate').textContent}.png\`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            }).catch(err => {
                console.error("Error capturing ticket:", err);
                alert("Gagal mengunduh tiket. Coba lagi.");
            });
        };

        loadBookings();
    
`,document.body.appendChild(e),()=>{document.body.contains(e)&&document.body.removeChild(e)}},[]),r.jsxs(r.Fragment,{children:[r.jsx("nav",{className:"fixed w-full z-50 bg-dark/90 backdrop-blur-md border-b border-dark-border",children:r.jsxs("div",{className:"max-w-4xl mx-auto px-4 h-16 flex justify-between items-center",children:[r.jsxs("div",{className:"gahar-logo-btn",onClick:"window.location.href='index.html'",children:[r.jsx("img",{src:"assets/logo.png",alt:"JogjaCourt Logo",className:"gahar-logo-img"}),r.jsx("div",{className:"gahar-logo-text",children:r.jsxs("span",{className:"gahar-logo-title",children:["JOGJA",r.jsx("span",{className:"text-brand",children:"COURT"})]})})]}),r.jsxs("div",{className:"flex items-center gap-3",children:[r.jsx("a",{href:"locations.html",className:"text-sm font-bold text-brand border border-brand/50 px-4 py-2 rounded hover:bg-brand hover:text-black transition-colors",children:"+ Pesan Lapangan"}),r.jsx("div",{id:"notifBellWrap",className:"relative",children:r.jsxs("button",{className:"notif-toggle-btn p-2 rounded-lg hover:bg-white/5 transition-colors relative",onClick:"Notifications.toggleDropdown(event)",children:[r.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",className:"w-5 h-5 text-gray-400 hover:text-white transition-colors",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[r.jsx("path",{d:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"}),r.jsx("path",{d:"M10.3 21a1.94 1.94 0 0 0 3.4 0"})]}),r.jsx("span",{className:"notif-badge",children:"0"})]})})]})]})}),r.jsxs("div",{className:"pt-28 pb-20 max-w-4xl mx-auto px-4 sm:px-6",children:[r.jsxs("div",{className:"mb-6 flex items-center gap-4",children:[r.jsx("a",{href:"javascript:history.back()",className:"w-10 h-10 glass-card rounded-full flex items-center justify-center hover:border-brand transition-colors group",children:r.jsx("i",{"data-lucide":"arrow-left",className:"w-5 h-5 text-white/60 group-hover:text-brand transition-colors"})}),r.jsxs("div",{children:[r.jsxs("h1",{className:"text-4xl font-display uppercase tracking-widest mb-1",children:["Riwayat ",r.jsx("span",{className:"text-brand",children:"Pesanan"})]}),r.jsx("p",{className:"text-gray-400",children:"Pantau status booking dan pembayaran Anda."})]})]}),r.jsxs("div",{className:"flex gap-2 mb-8 bg-[#111] p-1.5 rounded-xl border border-[#222] inline-flex flex-wrap shadow-inner overflow-x-auto max-w-full hide-scrollbar",children:[r.jsx("button",{onClick:"filterStatus('all')",className:"tab-btn active whitespace-nowrap","data-status":"all",children:"Semua"}),r.jsx("button",{onClick:"filterStatus('pending')",className:"tab-btn whitespace-nowrap","data-status":"pending",children:"Pending"}),r.jsx("button",{onClick:"filterStatus('confirmed')",className:"tab-btn whitespace-nowrap","data-status":"confirmed",children:"Confirmed"}),r.jsx("button",{onClick:"filterStatus('completed')",className:"tab-btn whitespace-nowrap","data-status":"completed",children:"Selesai"}),r.jsx("button",{onClick:"filterStatus('cancelled')",className:"tab-btn whitespace-nowrap","data-status":"cancelled",children:"Dibatalkan"})]}),r.jsxs("div",{id:"loadingState",className:"flex flex-col gap-4 py-10",children:[r.jsxs("div",{className:"glass-card rounded-2xl p-6 animate-pulse h-40 flex flex-col justify-between",children:[r.jsx("div",{className:"w-1/4 h-4 bg-white/10 rounded"}),r.jsx("div",{className:"w-1/2 h-8 bg-white/10 rounded"}),r.jsx("div",{className:"w-1/3 h-6 bg-white/10 rounded mt-4"})]}),r.jsxs("div",{className:"glass-card rounded-2xl p-6 animate-pulse h-40 flex flex-col justify-between opacity-50",children:[r.jsx("div",{className:"w-1/3 h-4 bg-white/10 rounded"}),r.jsx("div",{className:"w-3/4 h-8 bg-white/10 rounded"}),r.jsx("div",{className:"w-1/4 h-6 bg-white/10 rounded mt-4"})]})]}),r.jsx("div",{id:"bookingsList",className:"space-y-6 hidden"}),r.jsxs("div",{id:"emptyState",className:"hidden glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center",children:[r.jsx("div",{className:"w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(212,175,55,0.15)]",children:r.jsx("i",{"data-lucide":"calendar-x-2",className:"w-10 h-10 text-brand"})}),r.jsx("h3",{className:"text-2xl font-display tracking-widest text-white mb-2",children:"Data Kosong"}),r.jsx("p",{className:"text-gray-400 mb-8 max-w-sm",children:"Anda belum memiliki riwayat pesanan dengan status ini."}),r.jsxs("a",{href:"locations.html",className:"btn-neon inline-flex items-center gap-2 uppercase tracking-widest text-sm",children:[r.jsx("i",{"data-lucide":"plus",className:"w-4 h-4"})," Booking Sekarang"]})]})]}),r.jsx("div",{id:"ticketModal",className:"fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm hidden flex items-center justify-center p-4",children:r.jsxs("div",{className:"w-full max-w-sm relative flex flex-col gap-4",children:[r.jsx("button",{onClick:"closeTicket()",className:"absolute -top-12 right-0 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors z-10",children:r.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",strokeWidth:"2",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M6 18L18 6M6 6l12 12"})})}),r.jsxs("div",{id:"ticketContent",className:"bg-[#111] border border-[#222] rounded-2xl overflow-hidden relative",children:[r.jsxs("div",{className:"p-6 text-center border-b border-[#222] relative",children:[r.jsx("div",{className:"absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-brand/20 blur-3xl rounded-full"}),r.jsx("h3",{className:"text-xl font-display tracking-widest text-brand uppercase mt-2",id:"tVenue",children:"GOR NAME"}),r.jsx("p",{className:"text-white font-medium",id:"tCourt",children:"Court Name"})]}),r.jsxs("div",{className:"p-6 relative",children:[r.jsx("div",{className:"absolute -top-3 -left-3 w-6 h-6 bg-black rounded-full border-r border-b border-[#222]"}),r.jsx("div",{className:"absolute -top-3 -right-3 w-6 h-6 bg-black rounded-full border-l border-b border-[#222]"}),r.jsxs("div",{className:"flex justify-between items-center mb-6",children:[r.jsxs("div",{children:[r.jsx("p",{className:"text-[10px] text-gray-500 uppercase tracking-widest mb-1",children:"Tanggal"}),r.jsx("p",{className:"text-sm text-white font-bold",id:"tDate",children:"Date"})]}),r.jsxs("div",{className:"text-right",children:[r.jsx("p",{className:"text-[10px] text-gray-500 uppercase tracking-widest mb-1",children:"Jam Main"}),r.jsx("p",{className:"text-sm text-brand font-bold",id:"tTime",children:"Time"})]})]}),r.jsx("div",{className:"bg-white p-3 rounded-xl flex justify-center mb-4",children:r.jsx("img",{id:"tQR",src:"",className:"w-32 h-32",crossorigin:"anonymous"})}),r.jsx("p",{className:"text-center text-[10px] text-gray-500 uppercase tracking-widest",children:"Tunjukkan QR Code ini ke Admin GOR"})]})]}),r.jsxs("button",{onClick:"downloadTicket()",className:"w-full bg-brand text-black font-bold uppercase tracking-widest py-3.5 rounded-xl hover:bg-white transition-colors shadow-[0_0_20px_rgba(212,175,55,0.3)] flex justify-center items-center gap-2",children:[r.jsx("i",{"data-lucide":"download",className:"w-5 h-5"})," Simpan ke Galeri"]})]})})]})}function Af(){return ge(),j.useEffect(()=>{const e=document.createElement("script");return e.innerHTML=`
        let notifications = [];
        let currentFilter = 'all';

        document.addEventListener('DOMContentLoaded', async () => {
            lucide.createIcons();
            auth.requireAuth();
            await fetchNotifications();
        });

        async function fetchNotifications() {
            try {
                notifications = await api.get('/notifications');
                renderNotifications();
            } catch (err) {
                console.error(err);
                alert("Gagal memuat notifikasi.");
            }
        }

        function getIconForNotif(title) {
            const t = title.toLowerCase();
            if (t.includes('berhasil') || t.includes('lunas')) {
                return { icon: 'check-circle', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' }; // emerald
            } else if (t.includes('batal') || t.includes('gagal') || t.includes('ditolak')) {
                return { icon: 'x-circle', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' }; // red
            } else if (t.includes('menunggu') || t.includes('pending')) {
                return { icon: 'clock', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' }; // amber
            } else {
                return { icon: 'info', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' }; // blue
            }
        }

        function renderNotifications() {
            const container = document.getElementById('notifContainer');
            const emptyState = document.getElementById('emptyState');
            const loadingState = document.getElementById('loadingState');
            
            loadingState.classList.add('hidden');

            let filtered = notifications;
            
            if (currentFilter === 'unread') {
                filtered = notifications.filter(n => !n.is_read);
            } else if (currentFilter === 'mitra') {
                filtered = notifications.filter(n => n.title.toLowerCase().includes('mitra') || n.related_entity_type === 'mitra_request');
            } else if (currentFilter === 'booking') {
                filtered = notifications.filter(n => n.related_entity_type === 'booking' || n.related_entity_type === 'payment' || n.title.toLowerCase().includes('booking') || n.title.toLowerCase().includes('pembayaran'));
            } else if (currentFilter === 'system') {
                filtered = notifications.filter(n => !n.related_entity_type || (!n.title.toLowerCase().includes('booking') && !n.title.toLowerCase().includes('pembayaran') && !n.title.toLowerCase().includes('mitra')));
            }

            if (filtered.length === 0) {
                emptyState.classList.remove('hidden');
                container.classList.add('hidden');
                return;
            }

            emptyState.classList.add('hidden');
            container.classList.remove('hidden');

            container.innerHTML = filtered.map(n => {
                const date = new Date(n.created_at).toLocaleString('id-ID', {day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit'});
                const style = getIconForNotif(n.title);
                const unreadCls = n.is_read ? '' : 'unread';
                const indicator = n.is_read ? '' : '<div class="unread-indicator"></div>';

                return \`
                    <div class="glass-card rounded-2xl p-5 flex items-start gap-5 notif-row \${unreadCls} cursor-pointer" onclick="handleNotifClick('\${n.id}', '\${n.related_entity_type}')">
                        <div class="icon-box" style="background: \${style.bg}; color: \${style.color}">
                            <i data-lucide="\${style.icon}" class="w-6 h-6"></i>
                        </div>
                        <div class="flex-1">
                            <div class="flex justify-between items-start mb-1">
                                <h3 class="font-bold text-white text-lg">\${n.title}</h3>
                                \${indicator}
                            </div>
                            <p class="text-gray-300 text-sm mb-3 leading-relaxed">\${n.message}</p>
                            <span class="text-xs text-gray-500 font-medium">\${date}</span>
                        </div>
                    </div>
                \`;
            }).join('');
            
            lucide.createIcons();
        }

        async function handleNotifClick(id, relatedType) {
            const notif = notifications.find(n => n.id === id);
            if (notif && !notif.is_read) {
                try {
                    await api.put(\`/notifications/\${id}/read\`);
                    notif.is_read = true;
                    renderNotifications(); // update ui
                } catch (e) {
                    console.error(e);
                }
            }
            
            // Navigation
            const inAdmin = window.location.pathname.includes('/admin/');
            const adminPrefix = inAdmin ? '' : 'admin/';
            if (relatedType === 'booking') {
                if (auth.getUser().role === 'customer') window.location.href = 'my-bookings.html';
                else window.location.href = adminPrefix + 'bookings.html';
            } else if (relatedType === 'payment') {
                if (auth.getUser().role === 'customer') window.location.href = 'my-bookings.html';
                else window.location.href = adminPrefix + 'payments.html';
            } else if (relatedType === 'mitra_request') {
                if (auth.getUser().role === 'super_admin') window.location.href = adminPrefix + 'users.html';
            }
        }

        async function markAllAsRead() {
            try {
                await api.put('/notifications/read-all');
                notifications.forEach(n => n.is_read = true);
                renderNotifications();
            } catch (err) {
                console.error(err);
            }
        }

        function filterNotif(type) {
            currentFilter = type;
            document.querySelectorAll('.tab-btn').forEach(btn => {
                if (btn.dataset.filter === type) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            renderNotifications();
        }
    
`,document.body.appendChild(e),()=>{document.body.contains(e)&&document.body.removeChild(e)}},[]),r.jsxs(r.Fragment,{children:[r.jsx("nav",{className:"fixed w-full z-50 bg-dark/90 backdrop-blur-md border-b border-dark-border",children:r.jsxs("div",{className:"max-w-4xl mx-auto px-4 h-16 flex justify-between items-center",children:[r.jsxs("div",{className:"gahar-logo-btn",onClick:"window.location.href='index.html'",children:[r.jsx("img",{src:"assets/logo.png",alt:"JogjaCourt Logo",className:"gahar-logo-img"}),r.jsx("div",{className:"gahar-logo-text",children:r.jsxs("span",{className:"gahar-logo-title",children:["JOGJA",r.jsx("span",{className:"text-brand",children:"COURT"})]})})]}),r.jsx("div",{className:"flex items-center gap-3",children:r.jsx("a",{href:"locations.html",className:"text-sm font-bold text-brand border border-brand/50 px-4 py-2 rounded hover:bg-brand hover:text-black transition-colors",children:"+ Pesan Lapangan"})})]})}),r.jsxs("div",{className:"pt-28 pb-20 max-w-4xl mx-auto px-4 sm:px-6",children:[r.jsxs("div",{className:"mb-8 flex items-center justify-between",children:[r.jsxs("div",{className:"flex items-center gap-4",children:[r.jsx("a",{href:"javascript:history.back()",className:"w-10 h-10 glass-card rounded-full flex items-center justify-center hover:border-brand transition-colors group",children:r.jsx("i",{"data-lucide":"arrow-left",className:"w-5 h-5 text-white/60 group-hover:text-brand transition-colors"})}),r.jsxs("div",{children:[r.jsxs("h1",{className:"text-4xl font-display uppercase tracking-widest mb-1",children:["Semua ",r.jsx("span",{className:"text-brand",children:"Notifikasi"})]}),r.jsx("p",{className:"text-gray-400",children:"Pemberitahuan terkait akun dan pesanan Anda."})]})]}),r.jsx("button",{onClick:"markAllAsRead()",className:"text-sm text-brand font-semibold hover:text-brand-light transition-colors px-4 py-2 rounded-lg bg-brand/10 hover:bg-brand/20",children:"Tandai Semua Dibaca"})]}),r.jsxs("div",{className:"flex gap-2 mb-8 bg-[#111] p-1.5 rounded-xl border border-[#222] inline-flex flex-wrap shadow-inner overflow-x-auto max-w-full hide-scrollbar",children:[r.jsx("button",{onClick:"filterNotif('all')",className:"tab-btn active whitespace-nowrap","data-filter":"all",children:"Semua"}),r.jsx("button",{onClick:"filterNotif('unread')",className:"tab-btn whitespace-nowrap","data-filter":"unread",children:"Belum Dibaca"}),r.jsx("button",{onClick:"filterNotif('mitra')",className:"tab-btn whitespace-nowrap","data-filter":"mitra",children:"Pengajuan Mitra"}),r.jsx("button",{onClick:"filterNotif('booking')",className:"tab-btn whitespace-nowrap","data-filter":"booking",children:"Booking & Pembayaran"}),r.jsx("button",{onClick:"filterNotif('system')",className:"tab-btn whitespace-nowrap","data-filter":"system",children:"Sistem"})]}),r.jsxs("div",{id:"loadingState",className:"flex flex-col gap-4 py-10",children:[r.jsxs("div",{className:"glass-card p-6 rounded-2xl animate-pulse flex gap-4",children:[r.jsx("div",{className:"w-12 h-12 bg-white/10 rounded-xl"}),r.jsxs("div",{className:"flex-1 space-y-3",children:[r.jsx("div",{className:"h-4 bg-white/10 rounded w-1/4"}),r.jsx("div",{className:"h-3 bg-white/10 rounded w-3/4"})]})]}),r.jsxs("div",{className:"glass-card p-6 rounded-2xl animate-pulse flex gap-4",children:[r.jsx("div",{className:"w-12 h-12 bg-white/10 rounded-xl"}),r.jsxs("div",{className:"flex-1 space-y-3",children:[r.jsx("div",{className:"h-4 bg-white/10 rounded w-1/4"}),r.jsx("div",{className:"h-3 bg-white/10 rounded w-3/4"})]})]})]}),r.jsxs("div",{id:"emptyState",className:"hidden text-center py-20 glass-card rounded-3xl mt-8",children:[r.jsx("div",{className:"w-20 h-20 bg-dark-surface rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5",children:r.jsx("i",{"data-lucide":"bell-off",className:"w-10 h-10 text-white/20"})}),r.jsx("h3",{className:"text-xl font-bold mb-2",children:"Belum Ada Notifikasi"}),r.jsx("p",{className:"text-gray-400 max-w-sm mx-auto",children:"Saat ini Anda tidak memiliki pemberitahuan baru."})]}),r.jsx("div",{id:"notifContainer",className:"space-y-4 hidden"})]})]})}function Rf(){return ge(),j.useEffect(()=>{const e=document.createElement("script");return e.innerHTML=`
        if (typeof Notifications !== 'undefined') Notifications.init();
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
        auth.requireAuth();

        // Show bell if authenticated
        if (typeof auth !== 'undefined' && auth.isAuthenticated()) {
            const bellWrap = document.getElementById('notifBellWrap');
            if (bellWrap) bellWrap.classList.remove('hidden');
        }

        async function loadProfile() {
            try {
                const user = await api.get('/auth/me');
                updateProfileUI(user);
            } catch (error) {
                console.error("Gagal memuat profil:", error);
                const localUser = JSON.parse(localStorage.getItem('user'));
                if (localUser) {
                    updateProfileUI(localUser);
                }
            }
        }

        function updateProfileUI(user) {
            // Inputs
            document.getElementById('profileName').value = user.name || '';
            document.getElementById('profileEmail').value = user.email || '';
            document.getElementById('profilePhone').value = user.phone || '';
            
            // Displays
            document.getElementById('displayName').textContent = user.name || 'Pengguna';
            document.getElementById('displayRole').textContent = user.role || 'customer';
            
            if (user.profile_image) {
                document.getElementById('avatarIcon').classList.add('hidden');
                document.getElementById('avatarImg').src = user.profile_image;
                document.getElementById('avatarImg').classList.remove('hidden');
            }
        }

        function handleAvatarClick() {
            const avatarImg = document.getElementById('avatarImg');
            const hasPhoto = !avatarImg.classList.contains('hidden') && avatarImg.src && !avatarImg.src.endsWith('profile.html');

            if (hasPhoto) {
                Swal.fire({
                    title: 'Opsi Foto Profil',
                    html: \`
                        <div class="flex flex-col gap-3 mt-4">
                            <button onclick="Swal.close(); viewProfileImage()" class="btn-primary py-3 rounded-lg flex items-center justify-center gap-2 bg-white/10 text-white border border-white/20 hover:bg-white/20"><i data-lucide="eye" class="w-5 h-5"></i> Lihat Foto</button>
                            <button onclick="Swal.close(); document.getElementById('profileImageUpload').click()" class="btn-primary py-3 rounded-lg flex items-center justify-center gap-2 !bg-[#E5C158] !text-black"><i data-lucide="upload" class="w-5 h-5"></i> Ubah Foto</button>
                            <button onclick="Swal.close(); deleteProfileImage()" class="btn-primary py-3 rounded-lg flex items-center justify-center gap-2 !bg-red-500/10 !text-red-500 border border-red-500/30 hover:!bg-red-500 hover:!text-white"><i data-lucide="trash-2" class="w-5 h-5"></i> Hapus Foto</button>
                        </div>
                    \`,
                    showConfirmButton: false,
                    background: '#111',
                    color: '#fff',
                    didOpen: () => { lucide.createIcons(); }
                });
            } else {
                document.getElementById('profileImageUpload').click();
            }
        }

        function viewProfileImage() {
            const src = document.getElementById('avatarImg').src;
            Swal.fire({
                imageUrl: src,
                imageAlt: 'Foto Profil',
                background: 'transparent',
                backdrop: 'rgba(0,0,0,0.9)',
                showConfirmButton: false,
                showCloseButton: true,
                customClass: { image: 'rounded-xl max-h-[80vh] object-contain', popup: 'bg-transparent shadow-none' }
            });
        }

        async function deleteProfileImage() {
            const { value: confirm } = await Swal.fire({
                title: 'Hapus Foto?',
                text: "Foto profil Anda akan dihapus.",
                icon: 'warning',
                showCancelButton: true,
                background: '#111',
                color: '#fff',
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#333',
                confirmButtonText: 'Ya, Hapus'
            });

            if (confirm) {
                try {
                    Swal.fire({ title: 'Menghapus...', background: '#111', color: '#fff', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                    await api.delete('/auth/me/profile-image');
                    
                    document.getElementById('avatarImg').src = '';
                    document.getElementById('avatarImg').classList.add('hidden');
                    document.getElementById('avatarIcon').classList.remove('hidden');

                    const localUser = JSON.parse(localStorage.getItem('user')) || {};
                    localUser.profile_image = null;
                    localStorage.setItem('user', JSON.stringify(localUser));

                    // Hide navbar avatar
                    const navAvatarIcons = document.querySelectorAll('.nav-avatar-icon');
                    const navAvatarImgs = document.querySelectorAll('.nav-avatar-img');
                    navAvatarIcons.forEach(icon => icon.classList.remove('hidden'));
                    navAvatarImgs.forEach(img => { img.src = ''; img.classList.add('hidden'); });

                    Swal.fire({ icon: 'success', title: 'Terhapus', background: '#111', color: '#fff', timer: 1500, showConfirmButton: false });
                } catch (e) {
                    Swal.fire({ icon: 'error', title: 'Gagal', text: e.message, background: '#111', color: '#fff' });
                }
            }
        }

        document.getElementById('profileImageUpload').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const uploadStatus = document.getElementById('uploadStatus');
            uploadStatus.classList.remove('hidden');

            const formData = new FormData();
            formData.append('file', file);

            try {
                // Ensure auth token is passed since api.js might not handle FormData perfectly in all cases,
                // But our api.js in JogjaCourt is already configured to handle FormData and Token properly.
                const response = await api.post('/auth/me/profile-image', formData);
                
                // Assuming response returns the updated user or { profile_image: "url" }
                const imageUrl = response.profile_image || response;
                
                // Update Image UI
                document.getElementById('avatarIcon').classList.add('hidden');
                document.getElementById('avatarImg').src = imageUrl;
                document.getElementById('avatarImg').classList.remove('hidden');

                // Update localStorage
                const localUser = JSON.parse(localStorage.getItem('user')) || {};
                localUser.profile_image = imageUrl;
                localStorage.setItem('user', JSON.stringify(localUser));

                Swal.fire({ 
                    icon: 'success', 
                    title: 'Berhasil', 
                    text: 'Foto profil berhasil diperbarui', 
                    timer: 1500, 
                    showConfirmButton: false,
                    background: '#111',
                    color: '#fff',
                    iconColor: '#E5C158'
                });
            } catch (error) {
                Swal.fire({ 
                    icon: 'error', 
                    title: 'Oops...', 
                    text: error.message,
                    background: '#111',
                    color: '#fff'
                });
            } finally {
                uploadStatus.classList.add('hidden');
                e.target.value = ''; // Reset input
            }
        });

        document.getElementById('updateProfileForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Menyimpan...';
            lucide.createIcons();
            
            const name = document.getElementById('profileName').value;
            const phone = document.getElementById('profilePhone').value;

            try {
                const updatedUser = await api.put('/auth/me', { name, phone });
                
                // Update local storage
                const localUser = JSON.parse(localStorage.getItem('user')) || {};
                localUser.name = updatedUser.name;
                localUser.phone = updatedUser.phone;
                localStorage.setItem('user', JSON.stringify(localUser));

                // Update Display Name
                document.getElementById('displayName').textContent = updatedUser.name;

                Swal.fire({ 
                    icon: 'success', 
                    title: 'Berhasil', 
                    text: 'Profil berhasil diperbarui.',
                    background: '#111',
                    color: '#fff',
                    iconColor: '#E5C158',
                    confirmButtonColor: '#E5C158'
                });
            } catch (error) {
                Swal.fire({ 
                    icon: 'error', 
                    title: 'Gagal', 
                    text: error.message || 'Gagal menyimpan profil',
                    background: '#111',
                    color: '#fff'
                });
            } finally {
                btn.innerHTML = originalText;
                lucide.createIcons();
            }
        });

        document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const current_password = document.getElementById('currentPassword').value;
            const new_password = document.getElementById('newPassword').value;
            const confirm_password = document.getElementById('confirmPassword').value;

            if (new_password !== confirm_password) {
                Swal.fire({ 
                    icon: 'error', 
                    title: 'Oops...', 
                    text: 'Konfirmasi password baru tidak cocok!',
                    background: '#111',
                    color: '#fff'
                });
                return;
            }

            const btn = e.target.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Menyimpan...';
            lucide.createIcons();

            try {
                await api.put('/auth/change-password', {
                    current_password,
                    new_password
                });
                
                Swal.fire({ 
                    icon: 'success', 
                    title: 'Berhasil', 
                    text: 'Password Anda telah diperbarui.',
                    background: '#111',
                    color: '#fff',
                    iconColor: '#E5C158',
                    confirmButtonColor: '#E5C158'
                });
                e.target.reset();
            } catch (error) {
                Swal.fire({ 
                    icon: 'error', 
                    title: 'Gagal', 
                    text: error.message || 'Gagal mengubah password',
                    background: '#111',
                    color: '#fff'
                });
            } finally {
                btn.innerHTML = originalText;
                lucide.createIcons();
            }
        });

        // Delete Account Logic
        async function confirmDeleteAccount() {
            const { value: confirmText } = await Swal.fire({
                title: 'Hapus Akun?',
                text: "Ketik 'HAPUS' untuk mengonfirmasi bahwa Anda mengerti tindakan ini permanen.",
                input: 'text',
                icon: 'warning',
                background: '#111',
                color: '#fff',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#333',
                confirmButtonText: 'Ya, Hapus Permanen',
                cancelButtonText: 'Batal',
                inputValidator: (value) => {
                    if (value !== 'HAPUS') {
                        return "Anda harus mengetik 'HAPUS' (huruf besar) untuk melanjutkan!"
                    }
                }
            });

            if (confirmText === 'HAPUS') {
                try {
                    Swal.fire({
                        title: 'Menghapus...',
                        text: 'Memproses permintaan Anda.',
                        background: '#111',
                        color: '#fff',
                        allowOutsideClick: false,
                        didOpen: () => { Swal.showLoading() }
                    });

                    await api.delete('/auth/me');
                    
                    await Swal.fire({ 
                        icon: 'success', 
                        title: 'Berhasil', 
                        text: 'Akun Anda telah dihapus secara permanen.',
                        background: '#111',
                        color: '#fff',
                        iconColor: '#E5C158',
                        confirmButtonColor: '#E5C158'
                    });
                    
                    auth.logout(); // Will clear storage and redirect
                } catch (error) {
                    Swal.fire({ 
                        icon: 'error', 
                        title: 'Gagal', 
                        text: error.message || 'Gagal menghapus akun',
                        background: '#111',
                        color: '#fff'
                    });
                }
            }
        }

        document.getElementById('logoutBtn').addEventListener('click', () => auth.logout());

        loadProfile();
    
`,document.body.appendChild(e),()=>{document.body.contains(e)&&document.body.removeChild(e)}},[]),r.jsxs(r.Fragment,{children:[r.jsx("nav",{className:"sticky top-0 z-50 glass-card rounded-none border-t-0 border-l-0 border-r-0 border-b border-white/5",children:r.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:r.jsxs("div",{className:"flex justify-between h-16 items-center",children:[r.jsxs("div",{className:"gahar-logo-btn",onClick:"window.location.href='index.html'",children:[r.jsx("img",{src:"assets/logo.png",alt:"JogjaCourt Logo",className:"gahar-logo-img"}),r.jsx("div",{className:"gahar-logo-text",children:r.jsxs("span",{className:"gahar-logo-title",children:["JOGJA",r.jsx("span",{className:"text-brand",children:"COURT"})]})})]}),r.jsxs("div",{className:"flex items-center gap-6",children:[r.jsx("a",{href:"my-bookings.html",className:"text-white/60 hover:text-white text-sm transition-colors hidden sm:block",children:"Riwayat Booking"}),r.jsxs("button",{id:"logoutBtn",className:"text-red-400 hover:text-red-300 text-sm flex items-center gap-1.5 transition-colors group",children:[r.jsx("i",{"data-lucide":"log-out",className:"w-4 h-4 group-hover:-translate-x-1 transition-transform"})," Keluar"]}),r.jsx("div",{id:"notifBellWrap",className:"hidden relative",children:r.jsxs("button",{className:"notif-toggle-btn p-2 rounded-lg hover:bg-white/5 transition-colors relative",onClick:"Notifications.toggleDropdown(event)",children:[r.jsx("i",{"data-lucide":"bell",className:"w-5 h-5 text-white/60 hover:text-white transition-colors"}),r.jsx("span",{className:"notif-badge absolute top-1 right-1 w-2 h-2 bg-brand rounded-full hidden"})]})})]})]})})}),r.jsxs("div",{className:"max-w-4xl mx-auto px-4 sm:px-6 mt-8 sm:mt-12",children:[r.jsxs("div",{className:"mb-8 flex items-center gap-4",children:[r.jsx("a",{href:"javascript:history.back()",className:"w-10 h-10 glass-card rounded-full flex items-center justify-center hover:border-brand transition-colors group",children:r.jsx("i",{"data-lucide":"arrow-left",className:"w-5 h-5 text-white/60 group-hover:text-brand transition-colors"})}),r.jsxs("div",{children:[r.jsx("h1",{className:"font-display text-3xl sm:text-4xl tracking-widest uppercase text-white drop-shadow-md",children:"Profil Saya"}),r.jsx("p",{className:"text-white/40 text-xs sm:text-sm",children:"Kelola informasi akun dan preferensi keamanan Anda."})]})]}),r.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-5 gap-6",children:[r.jsxs("div",{className:"lg:col-span-2 space-y-6",children:[r.jsxs("div",{className:"glass-card p-6 flex flex-col items-center text-center",children:[r.jsxs("div",{className:"relative cursor-pointer group mb-4",onClick:"handleAvatarClick()",children:[r.jsxs("div",{id:"avatarContainer",className:"avatar-container w-32 h-32 bg-white/5 rounded-full flex items-center justify-center overflow-hidden",children:[r.jsx("i",{id:"avatarIcon","data-lucide":"user",className:"w-12 h-12 text-white/20"}),r.jsx("img",{id:"avatarImg",src:"",className:"w-full h-full object-cover hidden",alt:"Profile"}),r.jsx("div",{className:"avatar-overlay",children:r.jsx("i",{"data-lucide":"camera",className:"w-8 h-8 text-white"})})]}),r.jsx("input",{type:"file",id:"profileImageUpload",className:"hidden",accept:"image/*"}),r.jsx("div",{id:"uploadStatus",className:"absolute -bottom-2 left-1/2 -translate-x-1/2 bg-brand text-black text-[10px] font-bold px-3 py-1 rounded-full hidden animate-bounce shadow-lg whitespace-nowrap",children:"Mengunggah..."})]}),r.jsx("h2",{id:"displayName",className:"text-xl font-bold text-white mb-1",children:"Loading..."}),r.jsx("div",{className:"flex items-center justify-center gap-2",children:r.jsx("span",{id:"displayRole",className:"text-[10px] uppercase tracking-widest text-brand border border-brand/30 bg-brand/10 px-2 py-0.5 rounded-full",children:"..."})}),r.jsx("p",{className:"text-[11px] text-white/40 mt-4 max-w-[200px] leading-relaxed",children:"Unggah foto profil yang jelas. Resolusi yang direkomendasikan adalah 500x500px."})]}),r.jsxs("div",{className:"glass-card p-5 relative overflow-hidden",children:[r.jsx("div",{className:"absolute -right-4 -bottom-4 opacity-5",children:r.jsx("i",{"data-lucide":"shield-check",className:"w-32 h-32"})}),r.jsxs("h3",{className:"text-sm font-bold text-white mb-3 flex items-center gap-2",children:[r.jsx("i",{"data-lucide":"info",className:"w-4 h-4 text-brand"})," Info Akun"]}),r.jsxs("ul",{className:"text-[11px] text-white/50 space-y-2 leading-relaxed relative z-10",children:[r.jsx("li",{children:"• Email Anda berfungsi sebagai identitas utama dan tidak dapat diubah secara mandiri."}),r.jsx("li",{children:"• Akun yang terdaftar menggunakan Google memiliki lencana verifikasi otomatis."}),r.jsx("li",{children:"• Hubungi Admin jika Anda perlu merubah Email atau Role."})]})]})]}),r.jsxs("div",{className:"lg:col-span-3 space-y-6",children:[r.jsxs("div",{className:"glass-card p-6 sm:p-8",children:[r.jsxs("h2",{className:"text-lg font-bold text-white mb-6 pb-4 border-b border-white/5 flex items-center gap-2",children:[r.jsx("i",{"data-lucide":"user-cog",className:"w-5 h-5 text-brand"})," Data Diri"]}),r.jsxs("form",{id:"updateProfileForm",className:"space-y-5",children:[r.jsxs("div",{className:"form-group",children:[r.jsx("label",{children:"Nama Lengkap"}),r.jsx("input",{type:"text",id:"profileName",required:!0,className:"input-dark",placeholder:"Masukkan nama lengkap",value:""})]}),r.jsxs("div",{className:"form-group",children:[r.jsx("label",{children:"Alamat Email"}),r.jsxs("div",{className:"relative",children:[r.jsx("i",{"data-lucide":"mail",className:"absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"}),r.jsx("input",{type:"email",id:"profileEmail",className:"input-dark pl-10",disabled:!0,value:""})]})]}),r.jsxs("div",{className:"form-group",children:[r.jsx("label",{children:"Nomor Telepon / WhatsApp"}),r.jsxs("div",{className:"relative",children:[r.jsx("i",{"data-lucide":"phone",className:"absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"}),r.jsx("input",{type:"text",id:"profilePhone",className:"input-dark pl-10",placeholder:"08xxxxxxxxxx",value:""})]})]}),r.jsx("div",{className:"pt-2 text-right",children:r.jsxs("button",{type:"submit",className:"btn-primary py-2.5 px-8 w-full sm:w-auto flex justify-center items-center gap-2 ml-auto",children:[r.jsx("i",{"data-lucide":"save",className:"w-4 h-4"})," Simpan Profil"]})})]})]}),r.jsxs("div",{className:"glass-card p-6 sm:p-8",children:[r.jsxs("h2",{className:"text-lg font-bold text-white mb-6 pb-4 border-b border-white/5 flex items-center gap-2",children:[r.jsx("i",{"data-lucide":"lock",className:"w-5 h-5 text-red-400"})," Keamanan Kata Sandi"]}),r.jsxs("form",{id:"changePasswordForm",className:"space-y-5",children:[r.jsxs("div",{className:"form-group relative",children:[r.jsx("label",{children:"Kata Sandi Saat Ini"}),r.jsx("input",{type:"password",id:"currentPassword",required:!0,className:"input-dark",placeholder:"Masukkan password lama"})]}),r.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-5",children:[r.jsxs("div",{className:"form-group relative",children:[r.jsx("label",{children:"Kata Sandi Baru"}),r.jsx("input",{type:"password",id:"newPassword",required:!0,minlength:"6",className:"input-dark",placeholder:"Minimal 6 karakter"})]}),r.jsxs("div",{className:"form-group relative",children:[r.jsx("label",{children:"Konfirmasi Sandi Baru"}),r.jsx("input",{type:"password",id:"confirmPassword",required:!0,minlength:"6",className:"input-dark",placeholder:"Ulangi password baru"})]})]}),r.jsx("div",{className:"pt-2 text-right",children:r.jsxs("button",{type:"submit",className:"btn-primary py-2.5 px-8 w-full sm:w-auto flex justify-center items-center gap-2 ml-auto",children:[r.jsx("i",{"data-lucide":"key",className:"w-4 h-4"})," Perbarui Sandi"]})})]})]}),r.jsxs("div",{className:"glass-card p-6 sm:p-8 border-red-500/20 hover:border-red-500/40 transition-colors relative overflow-hidden group",children:[r.jsx("div",{className:"absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity",children:r.jsx("i",{"data-lucide":"alert-triangle",className:"w-32 h-32 text-red-500"})}),r.jsxs("h2",{className:"text-lg font-bold text-red-500 mb-2 pb-2 border-b border-red-500/10 flex items-center gap-2",children:[r.jsx("i",{"data-lucide":"trash-2",className:"w-5 h-5"})," Zonasi Berbahaya"]}),r.jsxs("p",{className:"text-[11px] text-white/50 mb-5 max-w-md leading-relaxed",children:["Tindakan ini akan menghapus akun Anda beserta seluruh data pesanan lapangan secara permanen. Tindakan ini ",r.jsx("strong",{children:"tidak dapat dibatalkan"}),"."]}),r.jsx("button",{type:"button",onClick:"confirmDeleteAccount()",className:"btn-primary py-2.5 px-6 w-full sm:w-auto flex justify-center items-center gap-2 !bg-red-500/10 !text-red-500 border border-red-500/30 hover:!bg-red-500 hover:!text-white",children:"Hapus Akun Permanen"})]})]})]})]}),r.jsx("div",{className:"fixed top-[20%] left-[10%] w-[30vw] h-[30vw] bg-brand/5 rounded-full blur-[120px] pointer-events-none z-[-1]"}),r.jsx("div",{className:"fixed bottom-[10%] right-[5%] w-[25vw] h-[25vw] bg-brand/5 rounded-full blur-[100px] pointer-events-none z-[-1]"})]})}function Df(){return ge(),j.useEffect(()=>{const e=document.createElement("script");return e.innerHTML=`
        // Toggle passwords
        document.querySelectorAll('.toggle-pw').forEach(btn => {
            btn.addEventListener('click', function() {
                const t = document.getElementById(this.dataset.target);
                t.type = t.type === 'password' ? 'text' : 'password';
            });
        });

        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (!token) {
            document.getElementById('resetForm').innerHTML = \`
                <div class="text-center py-4">
                    <div class="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                        <svg class="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </div>
                    <p class="text-white/60 text-sm">Token tidak ditemukan. Silakan <a href="forgot-password.html" class="text-brand underline font-medium">minta link baru</a>.</p>
                </div>\`;
        }

        // Live Validation
        const pw = document.getElementById('password');
        const cpw = document.getElementById('confirm_password');
        const pwError = document.getElementById('pwError');
        
        if (cpw) {
            cpw.addEventListener('input', () => {
                if (pw.value !== cpw.value) {
                    pwError.classList.remove('hidden');
                    cpw.classList.add('input-error');
                } else {
                    pwError.classList.add('hidden');
                    cpw.classList.remove('input-error');
                }
            });
        }

        document.getElementById('resetForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            if (pw.value !== cpw.value) return;

            const btn = document.getElementById('submitBtn');
            const btnText = btn.querySelector('.btn-text');
            const spinner = btn.querySelector('.spinner-svg');
            const alertEl = document.getElementById('alertMsg');
            
            btn.disabled = true;
            btnText.classList.add('hidden');
            spinner.classList.remove('hidden');
            alertEl.classList.add('hidden');

            try {
                const response = await api.post('/auth/reset-password', { token, new_password: pw.value });
                alertEl.className = 'px-4 py-3 rounded-xl text-sm mb-5 bg-brand/10 border border-brand/20 text-brand';
                alertEl.innerHTML = \`\${response.message} <a href="login.html" class="underline font-bold text-white ml-2">Login &rarr;</a>\`;
                alertEl.classList.remove('hidden');
                document.getElementById('resetForm').classList.add('hidden');
            } catch (error) {
                alertEl.className = 'px-4 py-3 rounded-xl text-sm mb-5 bg-red-500/10 border border-red-500/20 text-red-400';
                alertEl.textContent = error.message || 'Token tidak valid atau sudah kadaluarsa.';
                alertEl.classList.remove('hidden');
            } finally {
                btn.disabled = false;
                btnText.classList.remove('hidden');
                spinner.classList.add('hidden');
            }
        });
    
`,document.body.appendChild(e),()=>{document.body.contains(e)&&document.body.removeChild(e)}},[]),r.jsxs(r.Fragment,{children:[r.jsx("div",{className:"orb-1 fixed top-[-15%] left-[-10%] w-[400px] h-[400px] bg-brand/8 rounded-full blur-[120px] pointer-events-none"}),r.jsx("div",{className:"orb-2 fixed bottom-[-15%] right-[-10%] w-[350px] h-[350px] bg-brand/5 rounded-full blur-[100px] pointer-events-none"}),r.jsx("div",{className:"fixed top-6 left-6 z-50",children:r.jsx("a",{href:"javascript:history.back()",className:"w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 hover:border-brand hover:bg-brand/10 transition-colors group",children:r.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",className:"w-5 h-5 text-gray-400 group-hover:text-brand transition-colors",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"2",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 19l-7-7 7-7"})})})}),r.jsxs("div",{className:"w-full max-w-[420px] relative z-10",children:[r.jsx("div",{className:"text-center mb-10 fade-up",children:r.jsxs("div",{className:"gahar-logo-btn",onClick:"window.location.href='index.html'",children:[r.jsx("img",{src:"assets/logo.png",alt:"JogjaCourt Logo",className:"gahar-logo-img"}),r.jsx("div",{className:"gahar-logo-text",children:r.jsxs("span",{className:"gahar-logo-title",children:["JOGJA",r.jsx("span",{className:"text-brand",children:"COURT"})]})})]})}),r.jsxs("div",{className:"glass-card rounded-2xl p-8 fade-up fade-up-d1",children:[r.jsx("div",{className:"w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mb-6 border border-brand/20",children:r.jsx("svg",{className:"w-7 h-7 text-brand",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"1.8",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"})})}),r.jsx("h1",{className:"text-2xl font-bold text-white mb-2",children:"Password Baru"}),r.jsx("p",{className:"text-white/40 text-sm mb-6 leading-relaxed",children:"Silakan masukkan password baru Anda. Pastikan kuat dan mudah diingat."}),r.jsx("div",{id:"alertMsg",className:"hidden px-4 py-3 rounded-xl text-sm mb-5"}),r.jsxs("form",{id:"resetForm",className:"space-y-4",children:[r.jsxs("div",{className:"input-group",children:[r.jsx("input",{type:"password",id:"password",required:!0,minlength:"6",placeholder:" ",className:"input-field !pr-11"}),r.jsx("label",{className:"float-label",children:"Password Baru"}),r.jsx("svg",{className:"input-icon w-[18px] h-[18px]",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"1.8",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"})}),r.jsx("button",{type:"button",className:"toggle-pw absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors z-10","data-target":"password",children:r.jsxs("svg",{className:"w-[18px] h-[18px]",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"1.8",children:[r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 12a3 3 0 11-6 0 3 3 0 016 0z"}),r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"})]})})]}),r.jsxs("div",{className:"input-group",children:[r.jsx("input",{type:"password",id:"confirm_password",required:!0,minlength:"6",placeholder:" ",className:"input-field !pr-11"}),r.jsx("label",{className:"float-label",children:"Konfirmasi Password"}),r.jsx("svg",{className:"input-icon w-[18px] h-[18px]",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"1.8",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"})}),r.jsx("button",{type:"button",className:"toggle-pw absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors z-10","data-target":"confirm_password",children:r.jsxs("svg",{className:"w-[18px] h-[18px]",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"1.8",children:[r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 12a3 3 0 11-6 0 3 3 0 016 0z"}),r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"})]})})]}),r.jsx("p",{id:"pwError",className:"text-red-400 text-xs hidden ml-1",children:"Password tidak cocok."}),r.jsxs("button",{type:"submit",id:"submitBtn",className:"btn-primary w-full mt-2",children:[r.jsx("span",{className:"btn-text",children:"Simpan Password Baru"}),r.jsx("svg",{className:"spinner-svg hidden",viewBox:"0 0 50 50",children:r.jsx("circle",{cx:"25",cy:"25",r:"20",fill:"none",strokeWidth:"5"})})]})]})]})]})]})}function Of(){return ge(),j.useEffect(()=>{const e=document.createElement("script");return e.innerHTML=`
        if (typeof Notifications !== 'undefined') Notifications.init();
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
        
        // Show bell if authenticated
        if (typeof auth !== 'undefined' && auth.isAuthenticated()) {
            const bellWrap = document.getElementById('notifBellWrap');
            if (bellWrap) bellWrap.classList.remove('hidden');
        }

        const urlParams = new URLSearchParams(window.location.search);
        const areaId = urlParams.get('area_id');
        const areaName = urlParams.get('area_name') || 'Daerah';

        if (!areaId) window.location.href = 'locations.html';

        // Set all area name references
        document.getElementById('areaNameBreadcrumb').textContent = areaName;
        document.getElementById('areaNameCrumb').textContent = areaName;
        document.getElementById('areaNameSub').textContent = areaName;
        document.title = \`GOR di \${areaName} | JogjaCourt\`;

        const VENUE_IMAGES = [
            'https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&w=700&q=80',
            'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=700&q=80',
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=700&q=80',
        ];

        async function loadVenues() {
            try {
                const venues = await api.get(\`/areas/\${areaId}/venues\`);
                renderVenues(venues);
            } catch (error) {
                document.getElementById('loadingState').innerHTML =
                    \`<div class="col-span-3 text-center py-20"><p class="text-red-400 text-sm">Gagal memuat: \${error.message}</p><button onclick="loadVenues()" class="mt-3 text-brand text-sm hover:underline">Coba Lagi</button></div>\`;
            }
        }

        function renderVenues(venues) {
            document.getElementById('loadingState').classList.add('hidden');
            const grid = document.getElementById('venuesGrid');
            const empty = document.getElementById('emptyState');

            if (venues.length === 0) {
                empty.classList.remove('hidden');
                return;
            }

            grid.classList.remove('hidden');
            grid.innerHTML = venues.map((venue, i) => {
                const img = venue.image_url || VENUE_IMAGES[i % VENUE_IMAGES.length];
                return \`
                <div class="venue-card rounded-2xl overflow-hidden flex flex-col"
                     onclick="window.location.href='courts.html?venue_id=\${venue.id}&venue_name=\${encodeURIComponent(venue.name)}'">
                    <!-- Image -->
                    <div class="relative h-52 overflow-hidden flex-shrink-0">
                        <img src="\${img}" alt="\${venue.name}" class="venue-img w-full h-full object-cover">
                        <div class="img-overlay absolute inset-0"></div>
                        <div class="absolute bottom-4 left-4">
                            <span class="text-[10px] font-bold uppercase tracking-widest text-brand border border-brand/40 bg-brand/10 px-2 py-1 rounded">GOR Aktif</span>
                        </div>
                    </div>

                    <!-- Info -->
                    <div class="p-6 flex flex-col flex-grow">
                        <h3 class="text-xl font-bold text-white mb-2">\${venue.name}</h3>

                        <div class="flex items-start gap-2 text-gray-500 text-sm mb-3">
                            <i data-lucide="map-pin" class="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-600"></i>
                            <span class="line-clamp-2">\${venue.address || 'Alamat belum tersedia'}</span>
                        </div>

                        \${venue.phone ? \`<div class="flex items-center gap-2 text-gray-500 text-sm mb-3"><i data-lucide="phone" class="w-4 h-4 text-gray-600"></i><span>\${venue.phone}</span></div>\` : ''}

                        <p class="text-gray-600 text-sm line-clamp-2 leading-relaxed mb-5">\${venue.description || ''}</p>

                        <div class="flex items-center justify-between mt-auto pt-4 border-t border-dark-border">
                            <span class="text-xs font-bold text-brand uppercase tracking-widest flex items-center gap-1">
                                Lihat Lapangan
                                <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                            </span>
                            \${venue.maps_url ? \`<a href="\${venue.maps_url}" target="_blank" onclick="event.stopPropagation()" class="flex items-center gap-1 text-xs text-gray-500 hover:text-brand transition-colors border border-dark-border px-2.5 py-1.5 rounded-lg"><i data-lucide="navigation" class="w-3.5 h-3.5"></i> Maps</a>\` : ''}
                        </div>
                    </div>
                </div>\`;
            }).join('');

            if (typeof lucide !== 'undefined') { lucide.createIcons(); }
        }

        loadVenues();
    
`,document.body.appendChild(e),()=>{document.body.contains(e)&&document.body.removeChild(e)}},[]),r.jsxs(r.Fragment,{children:[r.jsx("nav",{className:"fixed w-full z-50",style:{background:"rgba(8,8,8,0.9)",backdropFilter:"blur(16px)",borderBottom:"1px solid #2a2a2a"},children:r.jsxs("div",{className:"max-w-7xl mx-auto px-4 h-16 flex justify-between items-center",children:[r.jsxs("div",{className:"gahar-logo-btn",onClick:"window.location.href='index.html'",children:[r.jsx("img",{src:"assets/logo.png",alt:"JogjaCourt Logo",className:"gahar-logo-img"}),r.jsx("div",{className:"gahar-logo-text",children:r.jsxs("span",{className:"gahar-logo-title",children:["JOGJA",r.jsx("span",{className:"text-brand",children:"COURT"})]})})]}),r.jsxs("div",{className:"flex items-center gap-4 text-sm text-gray-500",children:[r.jsx("div",{id:"notifBellWrap",className:"hidden relative",children:r.jsxs("button",{className:"notif-toggle-btn p-2 rounded-lg hover:bg-white/5 transition-colors relative",onClick:"Notifications.toggleDropdown(event)",children:[r.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",className:"w-5 h-5 text-gray-400 hover:text-white transition-colors",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[r.jsx("path",{d:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"}),r.jsx("path",{d:"M10.3 21a1.94 1.94 0 0 0 3.4 0"})]}),r.jsx("span",{className:"notif-badge",children:"0"})]})}),r.jsxs("a",{href:"locations.html",className:"hover:text-brand transition-colors flex items-center gap-1",children:[r.jsx("i",{"data-lucide":"arrow-left",className:"w-4 h-4"}),r.jsx("span",{id:"areaNameBreadcrumb",className:"hidden sm:block",children:"Daerah"})]})]})]})}),r.jsxs("div",{className:"pt-28 pb-10 relative",children:[r.jsx("div",{className:"absolute top-0 right-0 w-80 h-80 bg-brand/3 rounded-full blur-[100px] pointer-events-none"}),r.jsxs("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10",children:[r.jsxs("div",{className:"flex items-center gap-2 text-xs text-gray-600 mb-4",children:[r.jsx("a",{href:"locations.html",className:"hover:text-brand transition-colors",children:"Daerah"}),r.jsx("i",{"data-lucide":"chevron-right",className:"w-3 h-3"}),r.jsx("span",{className:"text-brand font-bold",id:"areaNameCrumb",children:"..."})]}),r.jsx("span",{className:"text-brand text-xs font-bold uppercase tracking-widest",children:"Langkah 2 dari 3"}),r.jsxs("h1",{className:"text-4xl md:text-6xl font-display tracking-widest uppercase mt-2 mb-2",children:["Pilih ",r.jsx("span",{className:"text-brand",children:"GOR"})]}),r.jsxs("p",{className:"text-gray-500 text-sm mb-6",children:["Semua GOR aktif di ",r.jsx("span",{id:"areaNameSub",className:"text-white",children:"daerah ini"}),"."]}),r.jsx("div",{className:"relative max-w-lg w-full mt-4",children:r.jsxs("div",{id:"poda",children:[r.jsx("div",{className:"search-glow"}),r.jsx("div",{className:"search-darkBorderBg"}),r.jsx("div",{className:"search-darkBorderBg"}),r.jsx("div",{className:"search-darkBorderBg"}),r.jsx("div",{className:"search-white"}),r.jsx("div",{className:"search-border"}),r.jsxs("div",{id:"main",children:[r.jsx("input",{id:"searchInput",placeholder:"Cari nama GOR atau alamat...",type:"text",className:"search-input-field"}),r.jsx("div",{id:"input-mask"}),r.jsx("div",{id:"gold-mask"}),r.jsx("div",{className:"filterBorder"}),r.jsx("button",{id:"filter-icon",title:"Filter Fasilitas",onClick:"document.getElementById('filterDropdown').classList.toggle('hidden')",children:r.jsx("svg",{preserveAspectRatio:"none",height:"20",width:"20",viewBox:"4.8 4.56 14.832 15.408",fill:"none",children:r.jsx("path",{d:"M8.16 6.65002H15.83C16.47 6.65002 16.99 7.17002 16.99 7.81002V9.09002C16.99 9.56002 16.7 10.14 16.41 10.43L13.91 12.64C13.56 12.93 13.33 13.51 13.33 13.98V16.48C13.33 16.83 13.1 17.29 12.81 17.47L12 17.98C11.24 18.45 10.2 17.92 10.2 16.99V13.91C10.2 13.5 9.97 12.98 9.73 12.69L7.52 10.36C7.23 10.08 7 9.55002 7 9.20002V7.87002C7 7.17002 7.52 6.65002 8.16 6.65002Z",stroke:"#D4AF37",strokeWidth:"1",strokeLinecap:"round",strokeLinejoin:"round"})})}),r.jsxs("div",{id:"filterDropdown",className:"hidden absolute right-0 top-full mt-2 w-64 bg-[#111] border border-[#2a2a2a] rounded-xl p-4 shadow-2xl z-50",children:[r.jsx("h4",{className:"text-white font-bold mb-3 border-b border-[#2a2a2a] pb-2 text-sm",children:"Fasilitas"}),r.jsxs("div",{className:"space-y-2",children:[r.jsxs("label",{className:"flex items-center gap-2 text-gray-400 text-sm cursor-pointer hover:text-white",children:[r.jsx("input",{type:"checkbox",value:"wifi",className:"rounded border-gray-600 text-brand bg-transparent focus:ring-brand focus:ring-offset-gray-900"}),r.jsx("i",{"data-lucide":"wifi",className:"w-4 h-4"})," WiFi Gratis"]}),r.jsxs("label",{className:"flex items-center gap-2 text-gray-400 text-sm cursor-pointer hover:text-white",children:[r.jsx("input",{type:"checkbox",value:"parking",className:"rounded border-gray-600 text-brand bg-transparent focus:ring-brand focus:ring-offset-gray-900"}),r.jsx("i",{"data-lucide":"car",className:"w-4 h-4"})," Parkir Luas"]}),r.jsxs("label",{className:"flex items-center gap-2 text-gray-400 text-sm cursor-pointer hover:text-white",children:[r.jsx("input",{type:"checkbox",value:"canteen",className:"rounded border-gray-600 text-brand bg-transparent focus:ring-brand focus:ring-offset-gray-900"}),r.jsx("i",{"data-lucide":"coffee",className:"w-4 h-4"})," Kantin / Cafe"]}),r.jsxs("label",{className:"flex items-center gap-2 text-gray-400 text-sm cursor-pointer hover:text-white",children:[r.jsx("input",{type:"checkbox",value:"toilet",className:"rounded border-gray-600 text-brand bg-transparent focus:ring-brand focus:ring-offset-gray-900"}),r.jsx("i",{"data-lucide":"bath",className:"w-4 h-4"})," Toilet Bersih"]})]}),r.jsx("button",{onClick:"document.getElementById('filterDropdown').classList.add('hidden')",className:"w-full mt-4 bg-brand text-black font-bold py-2 rounded-lg hover:bg-yellow-500 transition-colors text-sm",children:"Terapkan Filter"})]}),r.jsx("div",{id:"search-icon",children:r.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"20",viewBox:"0 0 24 24",strokeWidth:"2",strokeLinejoin:"round",strokeLinecap:"round",height:"20",fill:"none",className:"feather feather-search",children:[r.jsx("circle",{stroke:"#D4AF37",r:"8",cy:"11",cx:"11"}),r.jsx("line",{stroke:"#D4AF37",y2:"16.65",y1:"22",x2:"16.65",x1:"22"})]})})]})]})})]})]}),r.jsxs("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20",children:[r.jsxs("div",{id:"loadingState",className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",children:[r.jsx("div",{className:"skeleton h-80"}),r.jsx("div",{className:"skeleton h-80"}),r.jsx("div",{className:"skeleton h-80"})]}),r.jsx("div",{id:"venuesGrid",className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 hidden"}),r.jsxs("div",{id:"emptyState",className:"hidden text-center py-24",children:[r.jsx("div",{className:"w-20 h-20 bg-dark-card border border-dark-border rounded-full flex items-center justify-center mx-auto mb-4",children:r.jsx("i",{"data-lucide":"building-x",className:"w-8 h-8 text-gray-600"})}),r.jsx("h3",{className:"text-lg font-semibold text-gray-400 mb-2",children:"Belum ada GOR di daerah ini"}),r.jsx("a",{href:"locations.html",className:"inline-block mt-4 text-brand text-sm hover:underline",children:"← Pilih daerah lain"})]})]})]})}function Ff(){return ge(),j.useEffect(()=>{const e=document.createElement("script");return e.innerHTML=`
        document.addEventListener('DOMContentLoaded', async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            
            const loading = document.getElementById('loadingState');
            const success = document.getElementById('successState');
            const err = document.getElementById('errorState');
            
            if (!token) {
                loading.classList.add('hidden');
                err.classList.remove('hidden');
                document.getElementById('errorMsg').textContent = 'Token verifikasi tidak ditemukan di URL.';
                return;
            }

            try {
                await new Promise(r => setTimeout(r, 1200));
                await api.post('/auth/verify-email', { token });
                loading.classList.add('hidden');
                success.classList.remove('hidden');
            } catch (error) {
                loading.classList.add('hidden');
                err.classList.remove('hidden');
                document.getElementById('errorMsg').textContent = error.message || 'Token tidak valid.';
            }
        });
    
`,document.body.appendChild(e),()=>{document.body.contains(e)&&document.body.removeChild(e)}},[]),r.jsxs(r.Fragment,{children:[r.jsx("div",{className:"orb-1 fixed top-[-15%] left-[-10%] w-[400px] h-[400px] bg-brand/8 rounded-full blur-[120px] pointer-events-none"}),r.jsx("div",{className:"orb-2 fixed bottom-[-15%] right-[-10%] w-[350px] h-[350px] bg-brand/5 rounded-full blur-[100px] pointer-events-none"}),r.jsxs("div",{className:"w-full max-w-[420px] relative z-10",children:[r.jsx("div",{className:"text-center mb-10 fade-up",children:r.jsxs("div",{className:"gahar-logo-btn",onClick:"window.location.href='index.html'",children:[r.jsx("img",{src:"assets/logo.png",alt:"JogjaCourt Logo",className:"gahar-logo-img"}),r.jsx("div",{className:"gahar-logo-text",children:r.jsxs("span",{className:"gahar-logo-title",children:["JOGJA",r.jsx("span",{className:"text-brand",children:"COURT"})]})})]})}),r.jsxs("div",{className:"glass-card rounded-2xl p-10 text-center fade-up fade-up-d1",children:[r.jsxs("div",{id:"loadingState",children:[r.jsx("div",{className:"w-16 h-16 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-6",children:r.jsxs("svg",{className:"animate-spin h-8 w-8 text-brand",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",children:[r.jsx("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4"}),r.jsx("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"})]})}),r.jsx("h1",{className:"text-2xl font-bold text-white mb-2",children:"Memverifikasi Email..."}),r.jsx("p",{className:"text-white/40 text-sm",children:"Mohon tunggu, kami sedang memvalidasi token Anda."})]}),r.jsxs("div",{id:"successState",className:"hidden",children:[r.jsx("div",{className:"success-pulse w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-6",children:r.jsx("svg",{className:"w-8 h-8",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"2",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M5 13l4 4L19 7"})})}),r.jsx("h1",{className:"text-2xl font-bold text-white mb-2",children:"Email Terverifikasi!"}),r.jsx("p",{className:"text-white/40 text-sm mb-8",children:"Terima kasih, akun Anda kini sepenuhnya aktif dan siap digunakan."}),r.jsx("a",{href:"login.html",className:"btn-primary",children:"Lanjut ke Login"})]}),r.jsxs("div",{id:"errorState",className:"hidden",children:[r.jsx("div",{className:"w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-6",children:r.jsx("svg",{className:"w-8 h-8",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"2",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M6 18L18 6M6 6l12 12"})})}),r.jsx("h1",{className:"text-2xl font-bold text-white mb-2",children:"Verifikasi Gagal"}),r.jsx("p",{id:"errorMsg",className:"text-white/40 text-sm mb-8",children:"Token tidak valid atau sudah kadaluarsa."}),r.jsx("a",{href:"index.html",className:"inline-block bg-white/5 border border-white/10 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors",children:"Kembali ke Beranda"})]})]})]})]})}function Uf(){return r.jsx(Sf,{children:r.jsxs(vf,{children:[r.jsx(ie,{path:"/",element:r.jsx(jo,{})}),r.jsx(ie,{path:"/index.html",element:r.jsx(jo,{})}),r.jsx(ie,{path:"/login.html",element:r.jsx(Bf,{})}),r.jsx(ie,{path:"/register.html",element:r.jsx(If,{})}),r.jsx(ie,{path:"/booking.html",element:r.jsx(_f,{})}),r.jsx(ie,{path:"/courts.html",element:r.jsx(Tf,{})}),r.jsx(ie,{path:"/locations.html",element:r.jsx(Pf,{})}),r.jsx(ie,{path:"/mitra-register.html",element:r.jsx(Mf,{})}),r.jsx(ie,{path:"/my-bookings.html",element:r.jsx(zf,{})}),r.jsx(ie,{path:"/notifications.html",element:r.jsx(Af,{})}),r.jsx(ie,{path:"/profile.html",element:r.jsx(Rf,{})}),r.jsx(ie,{path:"/reset-password.html",element:r.jsx(Df,{})}),r.jsx(ie,{path:"/venues.html",element:r.jsx(Of,{})}),r.jsx(ie,{path:"/verify-email.html",element:r.jsx(Ff,{})})]})})}is.createRoot(document.getElementById("root")).render(r.jsx(Po.StrictMode,{children:r.jsx(Uf,{})}));
