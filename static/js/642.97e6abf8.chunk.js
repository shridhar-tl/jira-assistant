"use strict";(globalThis.webpackChunkjira_assistant=globalThis.webpackChunkjira_assistant||[]).push([[642],{3642:(e,s,t)=>{t.r(s),t.d(s,{default:()=>d});var n=t(7313),o=t(6310),r=t(232),a=t(6417);const i={minWidth:"100%",minHeight:"calc(100vh - 58px)",overflow:"auto",border:0};class c extends n.PureComponent{constructor(e){super(e),(0,o.f3)(this,"SessionService");const s=this.$session.CurrentUser;this.feedbackUrl=s.feedbackUrl.format([encodeURIComponent(s.displayName),encodeURIComponent(s.emailAddress),encodeURIComponent(r.Hm),encodeURIComponent(navigator.userAgent)])}render(){return(0,a.jsx)("iframe",{src:this.feedbackUrl,title:"Contact Us",style:i})}}const d=c}}]);