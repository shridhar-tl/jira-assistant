"use strict";(globalThis.webpackChunkjira_assistant=globalThis.webpackChunkjira_assistant||[]).push([[648],{7268:(e,s,t)=>{t.r(s),t.d(s,{default:()=>d});var n=t(9584),o=t(4324),r=t(9532),a=t(7884);const i={minWidth:"100%",minHeight:"calc(100vh - 58px)",overflow:"auto",border:0};class c extends n.PureComponent{constructor(e){super(e),(0,o.uU)(this,"SessionService");const s=this.$session.CurrentUser;this.feedbackUrl=s.feedbackUrl.format([encodeURIComponent(s.displayName),encodeURIComponent(s.emailAddress),encodeURIComponent(r.MT),encodeURIComponent(navigator.userAgent)])}render(){return(0,a.jsx)("iframe",{src:this.feedbackUrl,title:"Contact Us",style:i})}}const d=c}}]);