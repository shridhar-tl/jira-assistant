"use strict";(globalThis.webpackChunkjira_assistant=globalThis.webpackChunkjira_assistant||[]).push([[451],{2963:(e,s,a)=>{a.d(s,{i:()=>m});var t=a(9950),n=a(1219),o=a(6192),r=a(8874),i=a(4414);const l=[9,16,17,18,27,123],c=/^\b[A-Z][A-Z0-9_]+-[1-9][0-9]*$/gi;async function d(e,s){var a;if(!new RegExp(c).test(s))return;const{$session:t}=(0,r.WQ)("SessionService"),o=null===(a=t.CurrentUser.jiraUrl)||void 0===a?void 0:a.clearEnd("/");try{const[a]=await e.searchTickets(`key=${s}`);return{id:a.id,key:a.key,root:o,url:(0,n._8)(o,a.key),summary:a.fields.summary,summaryText:a.fields.summary,img:a.fields.issuetype.iconUrl}}catch(i){console.error("Invalid issue key provided in picker",i)}}const m=t.memo((function({value:e,disabled:s,useDisplay:a,returnObject:n,onPick:c,onInvalid:m,tabIndex:u,...h}){const f=(0,t.useRef)({}),[v,x]=(0,t.useState)(a&&!!e),[p,j]=(0,t.useState)(!(!a||!e)&&{key:e}),[I,N]=(0,t.useState)(!e),{$jira:g}=(0,r.WQ)("JiraService"),y=(e,s)=>{x(!1),!c||!e&&m&&s?m&&!e&&s&&m(s):c(n?e:null===e||void 0===e?void 0:e.key),e?a&&(j(e),N(!1)):(j(!1),N(!0))};(0,t.useEffect)((()=>{!a||!e||null!==p&&void 0!==p&&p.id&&e===p.key||async function(){const s=await d(g,e);y(s)}()}),[e]);const b=e=>{f.current.blurTimer&&(clearTimeout(f.current.blurTimer),delete f.current.blurTimer),y(e.value)},w=e=>{const s=e.target.value;s?f.current.blurTimer=setTimeout((async()=>{delete f.current.blurTimer,j({key:s}),x(!0);const e=await d(g,s);y(e)}),600):y("")},k=e=>{l.includes(e.keyCode)||N(!0)};return v&&a&&p?(0,i.jsxs)("div",{className:"sel-issue loading-data",title:"Please wait. Loading details...",children:[(0,i.jsx)("span",{className:"issue-key",children:p.key})," -",(0,i.jsx)("div",{className:"issue-summary",children:"Loading..."}),(0,i.jsx)("span",{className:"fa fa-spin fa-spinner"})]}):!I&&p&&a?(0,i.jsxs)("div",{className:"sel-issue"+(s?" disabled":""),tabIndex:u,onClick:s?void 0:k,onKeyDown:s?void 0:k,"data-test-id":"issue-key","data-issue-key":p.key,children:[(0,i.jsx)(o._V,{src:p.img,className:"margin-r-8"}),(0,i.jsx)("span",{className:"issue-key",children:p.key})," -",(0,i.jsx)("div",{className:"issue-summary",children:p.summaryText}),!s&&(0,i.jsx)("span",{className:"edit-key fa fa-pencil",title:"Click to edit issue"})]}):(0,i.jsx)(o.j9,{value:e,displayField:"value",dataset:g.lookupIssues,disabled:s,maxLength:20,onSelect:b,onBlur:w,autoFocus:!0,optionGroupChildren:"issues",optionGroupLabel:"label",valueField:"key",...h,children:e=>(0,i.jsxs)("span",{style:{fontSize:12,margin:"10px 10px 0 0"},children:[(0,i.jsx)(o._V,{src:e.img,alt:"",className:"margin-r-8"}),e.key," - ",e.summaryText]})})}))},451:(e,s,a)=>{a.r(s),a.d(s,{default:()=>Ue});var t=a(9950),n=a(607),o=a(4414);const r=(0,t.createContext)({}),i=r.Provider;let l=function(){},c=function(){};function d(e){l(e)}function m(e){const s=c();if(s)return e?s[e]:s}const u={hasExtensionSupport:!1,roomId:"",sid:"",created:0,currentIssueId:null,viewingIssueId:null,lastActivity:0,timer:0,waitingRoom:!1,moderatorId:"",members:[],issues:[],issuesMap:{},votes:[],votesMap:{},autoReveal:!1,showHalfScore:!0,maxPoints:89,showConfigs:!1},h=function({children:e,...s}){const[a,n]=(0,t.useState)((()=>({...u,...s})));return l=e=>n((s=>({...s,...e}))),c=()=>a,(0,o.jsx)(i,{value:a,children:e})},f=function(e,s,a){return a=a?Object.keys(a).reduce(((e,s)=>(e[s]=a[s](d,m),e)),{}):{},function(i){const l=(0,n.Zp)(),c=(0,t.useContext)(r),d=s?s(c,i):void 0;return(0,o.jsx)(e,{...d,...i,...a,navigate:l})}};var v=a(2813),x=a(4190),p=a(8738),j=a.n(p),I=a(2636),N=a(6192),g=a(5620),y=a(3582),b=a(815),w=a(6220),k=a(4356);const S=JSON.parse('{"apiKey":"AIzaSyDTmZ6jFnRXoWbm7xS09bBeYL7kGNxhU1M","authDomain":"optimum-rock-133908.firebaseapp.com","projectId":"optimum-rock-133908","storageBucket":"optimum-rock-133908.appspot.com","messagingSenderId":"692513716183","appId":"1:692513716183:web:ebf4a4dd0a1ca6f5bffd92","measurementId":"G-5EFPPF81EN"}');var C=a(9051),E=a.n(C);const R="poker",T="members",P="votes",V=(0,b.Wp)(S),L=(0,k.xI)(),M=(0,w.aU)(V);async function A(e,...s){const a=(0,w.H9)(M,R,...s);return await(0,w.BN)(a,e)}async function H(e,s){const{email:a=null,sid:t,name:n,avatarUrl:o=null}=s,r={id:t,name:n,email:a,avatarUrl:o};return await A(r,e,T,t),!0}async function F(e){await(0,k.p)(L,e)}async function $(){await(0,k.CI)(L)}function U(e,s){return(0,w.aQ)(e,(e=>{let a;"function"===typeof e.data?a={id:e.id,...e.data()}:"function"===typeof e.forEach&&(a=[],e.forEach((e=>a.push({id:e.id,...e.data()})))),s(a,e.metadata.hasPendingWrites)}))}async function D(e,s){const a=(0,w.H9)(M,R,e);await(0,w.mZ)(a,s)}async function _(e,s,a){const t=(0,w.wP)(M),n=(0,w.H9)(M,R,e);t.update(n,a),t.delete((0,w.H9)(M,R,e,P,s));const o=(0,w.H9)(M,R,e,P,a.currentIssueId);t.set(o,{id:a.currentIssueId,reveal:!1}),await t.commit()}var J=a(1328),O=a(8874);function B(e){const{sid:s,roomId:a}=e;localStorage.setItem("PRI",a),localStorage.setItem("SID",s)}async function Y(e,s){let a=J.$W;s&&(a+=`/${s}`);const{success:t,message:n,...o}=await function(e,s,a){return(0,O.WQ)({},"AjaxRequestService").$request.execute(e,s,a,{withCredentials:!1})}("POST",a,{email:e});if(!t)throw new Error(n);return o}function W(e){return e&&e.length?e.reduce(((e,s)=>(e[s.id]=s,e)),{}):{}}const q=()=>(Math.random()+1).toString(36).substring(7);function z(e,s){return async function(){const{roomId:e,currentIssueId:a}=s();await async function(e,s){const a=(0,w.H9)(M,R,e,P,s);return await(0,w.mZ)(a,{reveal:!0})}(e,a)}}function X(e,s){return async function(e){"number"!==typeof e&&(e=null);const{roomId:a,sid:t}=s();await async function(e,s,a){const t=(0,w.H9)(M,R,e,T,s);return await(0,w.mZ)(t,{avatarId:a})}(a,t,e)}}function Z(e){$();const s=`This room is closed${e?"":" by the moderator"}. Please close this window.`;y.l.alert(s,"Room Closed").then(G)}function G(){localStorage.removeItem("PRI"),localStorage.removeItem("SID"),window.close(),(0,g.Tp)("/poker")}const Q="\ud83d\udc4d",K="\ud83e\udd14",ee=["\ud83e\uddd1\u200d\ud83d\udcbb","\ud83e\udd84","\ud83d\udc3c","\ud83e\udd81","\ud83d\udc35","\ud83d\udc28","\ud83e\udd8a","\ud83d\udc31","\ud83d\udc2f","\ud83d\udc34","\ud83d\udc19","\ud83e\udd96","\ud83d\udc0b","\ud83d\udc38","\ud83d\udc14","\ud83d\udc2e","\ud83d\udc30","\ud83d\udc27","\ud83e\udda9","\ud83d\udc22","\ud83d\udc39","\ud83d\udc3b","\ud83d\udc23","\ud83d\udc29","\ud83d\udc36","\ud83d\udc69\u200d\ud83e\uddb0","\ud83e\uddb8","\ud83e\uddde","\ud83e\uddde\u200d\u2640\ufe0f"],se={1:[0,.5,1,2,3,5,8,13,21,34,55,89],2:[0,.5,1,2,3,5,8,13,20,40,100],3:["XXS","XS","S","M","L","XL","XXL"]},ae={1:se[1].map((e=>e>=3&&{value:e,label:e})).filter(Boolean),2:se[2].map((e=>e>=3&&{value:e,label:e})).filter(Boolean)};class te extends t.PureComponent{constructor(e){super(e),this.createRoom=async()=>{try{this.setState({isLoading:!0});const{roomId:e}=await this.props.createRoom(this.state);this.props.navigate(`/poker/${e}`)}catch(e){this.setState({isLoading:!1}),console.error(e)}},this.setValue=(e,s)=>{const a={...this.state,[s]:e};a.roomError=(a.roomName||"").length<3?"Room name is too short":null,a.emailError=(a.email||"").length<3?"Email is invalid":null,a.nameError=(a.name||"").length<3?"Name is too short":null,a.hasError=!(!a.roomError&&!a.nameError),this.setState(a)},this.state={scoreType:1,hasError:!0}}render(){const{isLoading:e,roomName:s,name:a,email:t,scoreType:n,roomError:r,nameError:i,hasError:l}=this.state;return(0,o.jsx)("div",{className:"poker-create",children:(0,o.jsx)("div",{className:"flex justify-content-center",children:(0,o.jsxs)("div",{className:"card",children:[(0,o.jsx)("h5",{className:"text-center",children:"Create New Room"}),(0,o.jsxs)("div",{className:"p-fluid",children:[(0,o.jsx)("div",{className:"field",children:(0,o.jsxs)("span",{className:"p-float-label",children:[(0,o.jsx)(N.fI,{id:"roomName",field:"roomName",value:s,maxLength:15,autoFocus:!0,className:j()({"p-invalid":r}),onChange:this.setValue}),(0,o.jsx)("label",{htmlFor:"roomName",className:j()({"p-error":!!r}),children:"Room Name*"})]})}),(0,o.jsx)("div",{className:"field",children:(0,o.jsxs)("span",{className:"p-float-label",children:[(0,o.jsx)(N.fI,{id:"name",value:a,field:"name",maxLength:15,className:j()({"p-invalid":i}),onChange:this.setValue}),(0,o.jsx)("label",{htmlFor:"name",className:j()({"p-error":!!i}),children:"Your Name*"})]})}),(0,o.jsx)("div",{className:"field",children:(0,o.jsxs)("span",{className:"p-float-label",children:[(0,o.jsx)(N.fI,{id:"email",value:t,field:"email",maxLength:80,className:j()({"p-invalid":i}),onChange:this.setValue}),(0,o.jsx)("label",{htmlFor:"email",className:j()({"p-error":!!i}),children:"Your Email*"})]})}),(0,o.jsx)("div",{children:(0,o.jsx)(N.a,{value:n,field:"scoreType",defaultValue:1,label:`Fibonacci (${se[1].join(", ")})`,onChange:this.setValue})}),(0,o.jsx)("div",{children:(0,o.jsx)(N.a,{value:n,field:"scoreType",defaultValue:2,label:`Short Fibonacci (${se[2].join(", ")})`,onChange:this.setValue})}),(0,o.jsx)("div",{children:(0,o.jsx)(N.a,{value:n,field:"scoreType",defaultValue:3,label:`T-Shirt (${se[3].join(", ")})`,onChange:this.setValue})}),(0,o.jsx)(N.$n,{label:"CREATE ROOM",className:"mt-2",disabled:l||e,onClick:this.createRoom,isLoading:e})]})]})})})}}const ne=(0,I.y)(f(te,null,{createRoom:function(e){return async function({email:s,roomName:a,name:t,scoreType:n,avatarUrl:o,avatarId:r}){const{token:i,sid:l,roomId:c}=await Y(s),d={token:i,sid:l,roomId:c,roomName:a,name:t,email:s,scoreType:n,avatarUrl:o,avatarId:r,showConfigs:!0};return B(d),await async function(e){const{roomId:s,roomName:a,sid:t,token:n,scoreType:o}=e,r=(new Date).getTime(),i={roomName:a,scoreType:o,moderatorId:t,autoReveal:!1,showHalfScore:2===parseInt(o),created:r,currentIssueId:null,lastActivity:(0,w.O5)(),exp:E()().add(12,"hours").toDate(),timer:0,waitingRoom:!1,issues:[]};return await F(n),await A(i,s),await H(s,e)}(d),e(d),d}}}));class oe extends t.PureComponent{constructor(e){var s,a;super(e),this.joinRoom=async()=>{try{this.setState({isLoading:!0});const{roomId:e,field:s,error:a}=await this.props.joinRoom(this.state);e?this.props.navigate(`/poker/${e}`):s&&a&&this.setState({isLoading:!1,[s]:a})}catch(e){this.setState({isLoading:!1}),console.error(e)}},this.setValue=(e,s)=>{const a={...this.state,[s]:e};a.roomError=(a.roomId||"").length<6?"Room id is too short":null,a.roomError||(a.roomError=/^[a-z0-9]*$/g.test(a.roomId)?null:"Enter room id, not room name."),a.nameError=(a.name||"").length<2?"Name is too short":null,a.emailError=(a.email||"").length<5?"Email is too short":null,a.hasError=!!(a.roomError||a.nameError||a.emailError),this.setState(a)},this.state={scoreType:1,hasError:!0,roomId:(null===(s=e.match)||void 0===s||null===(a=s.params)||void 0===a?void 0:a.roomId)||""}}componentDidMount(){this.props.loadAuthInfoFromCache(this.state.roomId)}render(){const{isLoading:e,roomId:s,name:a,email:t,roomError:n,nameError:r,emailError:i,hasError:l}=this.state;return(0,o.jsx)("div",{className:"poker-create",children:(0,o.jsx)("div",{className:"flex justify-content-center",children:(0,o.jsxs)("div",{className:"card",children:[(0,o.jsx)("h5",{className:"text-center",children:"Join Room"}),(0,o.jsxs)("div",{className:"p-fluid",children:[(0,o.jsxs)("div",{className:"field",children:[(0,o.jsxs)("span",{className:"p-float-label",children:[(0,o.jsx)(N.fI,{id:"roomId",field:"roomId",value:s,maxLength:15,autoFocus:!0,className:j()({"p-invalid":n}),onChange:this.setValue}),(0,o.jsx)("label",{htmlFor:"roomId",className:j()({"p-error":!!n}),children:"Room Id*"})]}),!!n&&(0,o.jsx)("span",{className:"p-error",children:n})]}),(0,o.jsxs)("div",{className:"field",children:[(0,o.jsxs)("span",{className:"p-float-label",children:[(0,o.jsx)(N.fI,{id:"name",value:a,field:"name",maxLength:15,className:j()({"p-invalid":r}),onChange:this.setValue}),(0,o.jsx)("label",{htmlFor:"name",className:j()({"p-error":!!r}),children:"Your Name*"})]}),!!r&&(0,o.jsx)("span",{className:"p-error",children:r})]}),(0,o.jsxs)("div",{className:"field",children:[(0,o.jsxs)("span",{className:"p-float-label",children:[(0,o.jsx)(N.fI,{id:"email",value:t,field:"email",maxLength:80,className:j()({"p-invalid":i}),onChange:this.setValue}),(0,o.jsx)("label",{htmlFor:"name",className:j()({"p-error":!!i}),children:"Your Email*"})]}),!!i&&(0,o.jsx)("span",{className:"p-error",children:i})]}),(0,o.jsx)(N.$n,{label:"JOIN ROOM",className:"mt-2",disabled:l||e,onClick:this.joinRoom,isLoading:e})]})]})})})}}const re=f((0,I.y)(oe),null,{joinRoom:function(e){return async function({email:s,roomId:a,name:t,avatarUrl:n,avatarId:o}){const{token:r,sid:i}=await Y(s,a),l={token:r,sid:i,roomId:a,name:t};B(l);const c={sid:i,roomId:a,name:t,email:s,avatarUrl:n,avatarId:o},d=await async function({token:e,roomId:s},a){return await F(e),(await(0,w.x7)((0,w.H9)(M,R,s))).data()?await H(s,a):(await $(),{field:"roomError",error:"Invalid room id or the room is already closed"})}(l,c);return null!==d&&void 0!==d&&d.field?d:(e(l),c)}},loadAuthInfoFromCache:function(e){return async function(s){if(!s)return;const a=await async function(e){const s={roomId:localStorage.getItem("PRI"),sid:localStorage.getItem("SID")};if(s.roomId===e)return s}(s);a?e(a):$()}}});var ie=a(5674);const le=function(){const{roomId:e}=(0,n.g)()||{};return(0,o.jsxs)("div",{className:"poker-start",children:[(0,o.jsx)("div",{className:"ja-header flex justify-content-center",children:(0,o.jsxs)("h1",{children:[(0,o.jsx)("img",{src:"/assets/icon_48.png",alt:""})," Jira Assistant - [Planning Poker]"]})}),(0,o.jsxs)("div",{className:"row"+(e?" justify-content-md-center":""),children:[!e&&(0,o.jsx)("div",{className:"col-lg-6",children:(0,o.jsx)(ne,{})}),(0,o.jsx)("div",{className:"col-lg-6",children:(0,o.jsx)(re,{})})]}),(0,o.jsxs)("div",{className:"footer",children:[(0,o.jsxs)("span",{className:"copyright flex justify-content-center",children:["\xa9 2016-",(new Date).getFullYear()," \xa0",(0,o.jsx)(ie.A,{href:v.Jb,children:"Jira Assistant "}),"\xa0v",x.z2]}),(0,o.jsx)("p",{className:"flex justify-content-center",children:"The privacy policy of Jira Assistant is not completely applicable for Poker. The details you provide here like your name, jira issue key, estimates, summary, etc., would be temporarily cached in JA server to serve across all the members. However, once you end the session, all the details would automatically be cleared from cache. By proceeding with using the poker, you agree to all the terms and conditions."})]})]})};var ce=a(7348),de=a(9083),me=a(843),ue=a(2963);function he({showConfigs:e,currentIssueId:s,viewingIssueId:a,issues:t,isModerator:n,hideSettings:r}){return(0,o.jsxs)(de.B,{className:"config-settings",visible:e,onHide:r,modal:!1,dismissable:!1,children:[(0,o.jsx)("h3",{children:"Issues List"}),(0,o.jsxs)("div",{className:"issues-collection",children:[(0,o.jsx)("div",{className:"list-header",children:"Issues List"}),(0,o.jsx)(ce.m,{className:"help-tooltip",target:".issue-list .issue"}),(0,o.jsxs)("div",{className:"issue-list",children:[(!t||!t.length)&&(0,o.jsx)("div",{className:"empty-list",children:"No issues added"}),t.map((e=>(0,o.jsx)(ve,{issue:e,selected:a===e.id,estimating:s===e.id},e.id)))]}),n&&(0,o.jsx)(xe,{})]}),n&&(0,o.jsx)(fe,{})]})}const fe=f((function({autoReveal:e,showHalfScore:s,maxPoints:a,scoreType:t,saveSettings:n}){return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)("h3",{children:"Settings"}),(0,o.jsxs)("div",{className:"poker-settings",children:[t<3&&(0,o.jsx)("div",{children:(0,o.jsx)(N.Sc,{checked:s,field:"showHalfScore",label:"Show 0.5 story point",onChange:n})}),(0,o.jsx)("div",{children:(0,o.jsx)(N.Sc,{checked:e,field:"autoReveal",label:"Auto reveal after voting",onChange:n})}),t<3&&(0,o.jsxs)("div",{children:[(0,o.jsx)("label",{children:"Max score"}),(0,o.jsx)(N.aL,{value:a,field:"maxPoints",dataset:ae[t],onChange:n})]})]})]})}),(({autoReveal:e,scoreType:s,showHalfScore:a,maxPoints:t})=>({autoReveal:e,scoreType:s,showHalfScore:a,maxPoints:t})),{saveSettings:function(e,s){return function(e,a){D(s("roomId"),{[a]:e})}}});const ve=f((function({issue:{id:e,key:s,icon:a,url:n,summary:r},selected:i,estimating:l,selectIssue:c,removeIssue:d}){const m=(0,t.useCallback)((a=>{!function(e){e.stopPropagation()}(a),y.l.confirmDelete(`Are you sure to delete "${s}"?`,"Delete issue").then((()=>d(e)))}),[s,e,d]);return(0,o.jsxs)("div",{className:"issue"+(i?" selected":""),onClick:()=>c(e),"data-pr-tooltip":r,children:[!l&&i&&(0,o.jsx)("span",{className:"fa fa-arrow-right icon-sel-ind"}),l&&(0,o.jsx)("span",{className:"fa fa-clock icon-sel-ind"}),(0,o.jsx)("span",{className:"fa fa-times",onClick:m}),(0,o.jsxs)("span",{className:"issue-info",children:[(0,o.jsx)(me.A,{src:a}),(0,o.jsxs)("span",{className:"key",children:[" ",s," "]}),(0,o.jsx)(ie.A,{href:n,children:(0,o.jsx)("span",{className:"fa fa-external-link"})})]})]})}),null,{selectIssue:function(e){return function(s){e({viewingIssueId:s})}},removeIssue:function(e,s){return async function(a){const{issues:t,roomId:n,currentIssueId:o,viewingIssueId:r}=s(),i=t.filter((e=>e.id!==a));var l;(await async function(e,s,a){const t={issues:s};a&&(t.currentIssueId=null),await D(e,t)}(n,i,o===a),r===a)&&e({viewingIssueId:null===(l=i[0])||void 0===l?void 0:l.id})}}}),xe=f((function({addNewIssue:e}){const[s,a]=(0,t.useState)(!1),n=(0,t.useCallback)((()=>a(!s)),[s]),r=(0,t.useCallback)((s=>{s&&(e(s),a(!1))}),[e,a]);return s?(0,o.jsxs)("div",{className:"add-key",children:[(0,o.jsx)("span",{onClick:n,className:"fa fa-times"}),(0,o.jsx)(ue.i,{value:"",className:"issue-picker",onPick:r,returnObject:!0})]}):(0,o.jsxs)("div",{className:"add-issue",onClick:n,children:[(0,o.jsx)("span",{className:"fa fa-plus"})," Add new issue"]})}),(({hasExtensionSupport:e})=>({hasExtensionSupport:e})),{addNewIssue:function(e,s){return async function(e){if(!e)return;"string"===typeof e&&(e={key:e});const{root:a,key:t,url:n,img:o,summaryText:r}=e,i={root:a,id:q(),key:t,url:n,icon:o,summary:r};await async function(e,s,a){const t={issues:(0,w.hq)(s)};a&&(t.currentIssueId=s.id),await D(e,t)}(s("roomId"),i,!1)}}}),pe=f(t.memo(he),(({issues:e,sid:s,moderatorId:a,currentIssueId:t,viewingIssueId:n,showConfigs:o})=>({issues:e,currentIssueId:t,viewingIssueId:n,showConfigs:o,isModerator:s===a})),{hideSettings:function(e){return function(){e({showConfigs:!1})}}});var je=a(5119);const Ie=function({allowVoting:e,min:s=0,max:a=89,value:t,showHalfScore:n,scoreType:r,submitVote:i}){let l=se[r];if(!l)return null;r<3&&(l=l.filter((e=>e>=s&&e<=a&&(n||.5!==e))));const c=l.map(((s,a)=>({icon:(0,o.jsx)(Ne,{className:"card-color-"+(a+a%2)/2,value:s,selected:t===s,submitVote:i,allowVoting:e},s)})));return c.push({label:"Not Sure",icon:(0,o.jsx)(Ne,{className:"card-other icon-red",icon:"fa fa-question",value:"?",selected:"?"===t,submitVote:i,allowVoting:e})},{label:"Break",icon:(0,o.jsx)(Ne,{className:"card-other icon-purple",icon:"fa fa-coffee",value:"~",selected:"~"===t,submitVote:i,allowVoting:e})}),(0,o.jsx)("div",{className:"cards-list"+(e?"":" disabled"),children:(0,o.jsx)(je.Y,{magnification:e,model:c,position:"bottom"})})},Ne=t.memo((function({className:e,value:s,icon:a,selected:t,allowVoting:n,submitVote:r}){return(0,o.jsxs)("div",{className:j()("card",e,{selected:t,"card-icon":!!a}),onClick:n?()=>r(s):void 0,children:[a&&(0,o.jsx)("div",{className:"card-content",children:(0,o.jsx)("div",{className:"card-val-icon",children:(0,o.jsx)("span",{className:a})})}),!a&&(0,o.jsxs)("div",{className:"card-content",children:[(0,o.jsx)("div",{className:"card-val-tl",children:s}),(0,o.jsx)("div",{className:"card-val-m",children:s}),(0,o.jsx)("div",{className:"card-val-br",children:s})]})]})})),ge=f(t.memo(Ie),(({votesMap:e,sid:s,currentIssueId:a,viewingIssueId:t,maxPoints:n,scoreType:o,showHalfScore:r})=>{var i;return{value:null===(i=e[t])||void 0===i?void 0:i[s],allowVoting:a&&a===t,max:n,scoreType:o,showHalfScore:r}}),{submitVote:function(e,s){return async function(a){var t;const{roomId:n,sid:o,currentIssueId:r,votesMap:i}=s(),l={...i};null!==l&&void 0!==l&&null!==(t=l[r])&&void 0!==t&&t.reveal||(await async function(e,s,a,t){const n=(0,w.wP)(M),o=(0,w.H9)(M,R,e,P,a);n.update(o,{[s]:t});const r=(0,w.H9)(M,R,e,T,s);n.update(r,{[`vote_${a}`]:!0}),await n.commit()}(n,o,r,a),l[r]={...l[r],[o]:a},e({votesMap:l}))}}}),ye=f((function({isModerator:e,estimating:s,revealVote:a,startEstimation:t,restartEstimation:n,copyUrl:r,exitRoom:i}){const l=[e&&{label:"Reveal scores",command:a,icon:()=>(0,o.jsx)("div",{className:"control-icon icon-reveal",children:(0,o.jsx)("span",{className:"fa fa-eye"})})},e&&!s&&{label:"Start estimating",command:t,icon:()=>(0,o.jsx)("div",{className:"control-icon icon-start",children:(0,o.jsx)("span",{className:"fa fa-play"})})},e&&s&&{label:"Restart estimation",command:n,icon:()=>(0,o.jsx)("div",{className:"control-icon icon-reset",children:(0,o.jsx)("span",{className:"fa fa-refresh"})})},{label:"Copy link to invite others",command:r,icon:()=>(0,o.jsx)("div",{className:"control-icon icon-invite",children:(0,o.jsx)("span",{className:"fa fa-link"})})},{label:e?"Close this room":"Exit",command:()=>y.l.yesNo(e?"Are you sure to close this room and clear all the data?":"Are you sure to leave this room?","Confirm exit").then(i),icon:()=>(0,o.jsx)("div",{className:"control-icon icon-exit",children:(0,o.jsx)("span",{className:"fa fa-sign-out"})})}].filter(Boolean);return(0,o.jsxs)("div",{className:"control-box",children:[(0,o.jsx)(ce.m,{className:"help-tooltip",target:".p-dock-action",my:"center+15 left-15",at:"top left"}),(0,o.jsx)(je.Y,{model:l,position:"right"})]})}),(({roomName:e,sid:s,moderatorId:a,currentIssueId:t,viewingIssueId:n})=>({roomName:e,issueId:n,estimating:n===t,isModerator:s===a})),{revealVote:z,startEstimation:function(e,s){return function(){const{roomId:e,viewingIssueId:a}=s();return _(e,a,{currentIssueId:a})}},restartEstimation:function(e,s){return function(){const{roomId:e,viewingIssueId:a,issues:t}=s(),n=q(),o=t.map((e=>e.id===a?{...e,id:n}:e));return _(e,a,{currentIssueId:n,issues:o})}},copyUrl:function(e,s){return function(){var e;const a=s("roomId");null!==(e=navigator.clipboard)&&void 0!==e&&e.writeText&&navigator.clipboard.writeText(`${v.V5}/poker/${a}`)}},exitRoom:function(e,s){return async function(){const{roomId:e,sid:a,moderatorId:t,votesMap:n,members:o}=s(),r=t===a;await async function(e,s,a){if(a){const s=(0,w.wP)(M);a.votesList.forEach((a=>s.delete((0,w.H9)(M,R,e,P,a)))),a.membersList.forEach((a=>s.delete((0,w.H9)(M,R,e,T,a)))),s.delete((0,w.H9)(M,R,e)),await s.commit()}else await(0,w.kd)((0,w.H9)(M,R,e,T,s));await $()}(e,a,r&&{votesList:Object.keys(n),membersList:o.map((({id:e})=>e))}),r?Z(r):G()}}});var be=a(1355);function we({avatarUrl:e,name:s,avatarId:a,onClick:n}){const r=a>0||0===a,i=r?ee[a]:"\ud83d\udc64",l=(0,o.jsx)(be.e,{label:i,shape:"circle",size:"xlarge",onClick:n}),[c,d]=(0,t.useState)({});if(!e||function(e){try{return new URL(e).pathname}catch(s){console.warn("Invalid URL Passed: ",e,s)}return""}(e).length<3)return l||null;const m=s=>d({avatarUrl:e,fallback:!0});return c.fallback&&c.avatarUrl===e||r?l:(0,o.jsx)(be.e,{image:e,shape:"circle",size:"xlarge",imageAlt:s,onImageError:m,onClick:n})}const ke=f(we,(({sid:e,members:s})=>s.filter((s=>s.id===e))[0]));const Se=t.memo((({members:e,votes:s,issueId:a,moderatorId:t})=>(0,o.jsx)("div",{className:"members-list",children:e.map((e=>(0,o.jsx)(Ce,{data:e,vote:s[e.id],issueId:a,isModerator:e.id===t},e.id)))}))),Ce=t.memo((function({data:e,vote:s,issueId:a,isModerator:t}){const{avatarUrl:n,avatarId:r,name:i,[`vote_${a}`]:l}=e,c=(!!s||0===s)&&"?"!==s&&"~"!==s;return(0,o.jsxs)("div",{className:"member"+(t?" moderator":""),children:[(0,o.jsx)(we,{avatarUrl:n,avatarId:r,name:i}),(0,o.jsxs)("div",{className:"member-state",children:["?"===s&&(0,o.jsx)("span",{className:"score fa fa-question"}),"~"===s&&(0,o.jsx)("span",{className:"score fa fa-coffee"}),c&&(0,o.jsx)("span",{className:"score",children:s}),!s&&!c&&(0,o.jsx)("span",{className:"state-logo",children:l?Q:K})]}),(0,o.jsx)("span",{className:"member-name",children:i})]})})),Ee=f(Se,(({viewingIssueId:e,members:s,votesMap:a,sid:t,moderatorId:n})=>({members:s,issueId:e,moderatorId:n,isModerator:t===n,votes:a[e]||{}})));var Re=a(3493);const Te=f((function({roomName:e,showSettings:s}){return(0,o.jsxs)("div",{className:"header",children:[(0,o.jsx)("span",{className:"fa fa-cogs",onClick:s}),(0,o.jsx)(Pe,{}),(0,o.jsx)("div",{className:"header-txt",children:(0,o.jsxs)("h1",{children:[(0,o.jsx)("img",{src:"/assets/icon_48.png",alt:""})," Poker - [",e,"]"]})})]})}),(({roomName:e})=>({roomName:e})),{setAvatar:X,showSettings:function(e){return function(){e({showConfigs:!0})}}}),Pe=f(t.memo((function({setAvatar:e}){const s=(0,t.useRef)(null),a=e=>s.current.toggle(e);return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(ke,{onClick:a}),(0,o.jsx)(Re.j,{className:"avatars-overlay",ref:s,showCloseIcon:!0,dismissable:!0,children:(0,o.jsxs)("div",{className:"panel-avarars",children:[(0,o.jsx)(ke,{avatarId:null,onClick:e}),ee.map(((s,t)=>(0,o.jsx)(we,{avatarId:t,onClick:s=>{e(t),a(s)}},t)))]})})]})})),null,{setAvatar:X});const Ve=function(){return(0,o.jsxs)("div",{className:"info-box",children:[(0,o.jsx)(Le,{}),(0,o.jsx)(Me,{})]})},Le=f((function({vote:{reveal:e,average:s,finalScore:a}}){return(0,o.jsxs)("div",{className:"est-info",children:[(0,o.jsxs)("div",{className:"block",children:[(0,o.jsx)("span",{className:"label",children:"Final score:"}),(0,o.jsx)("span",{className:"value",children:e?a:"N/A"})]}),(0,o.jsxs)("div",{className:"block",children:[(0,o.jsx)("span",{className:"label",children:"Average:"}),(0,o.jsx)("span",{className:"value",children:e?s:"N/A"})]}),(0,o.jsxs)("div",{className:"block",children:[(0,o.jsx)("span",{className:"label",children:"Status:"}),(0,o.jsx)("span",{className:"value fa fa-clock"})]})]})}),(({viewingIssueId:e,votesMap:s})=>({vote:s[e]||{}}))),Me=f(t.memo((function({issue:{key:e,icon:s,url:a,summary:t}={}}){return(0,o.jsxs)("div",{className:"issue-details",children:[(0,o.jsx)(N._V,{src:s}),(0,o.jsx)("span",{className:"issue-key",children:(0,o.jsxs)(ie.A,{href:a,children:[" ",e]})}),!!t&&(0,o.jsxs)("span",{className:"issue-summary",children:[" - ",t]})]})})),(({issuesMap:e,viewingIssueId:s})=>({issue:e[s]||{}})));class Ae extends t.PureComponent{componentDidMount(){this.unsubscribe=this.props.watchRoom(this.props.roomId)}componentWillUnmount(){"function"===typeof this.unsubscribe&&(this.unsubscribe(),this.unsubscribe=null)}render(){return(0,o.jsxs)("div",{children:[(0,o.jsx)(Te,{}),(0,o.jsx)(Ve,{}),(0,o.jsx)(Ee,{}),(0,o.jsx)(pe,{}),(0,o.jsx)(ye,{}),(0,o.jsx)(ge,{})]})}}const He=f(Ae,(e=>({roomId:e.roomId})),{watchRoom:function(e,s){return async function(a){const t=function(e,s){return U((0,w.H9)(M,R,e),s)}(a,(function(a){const{viewingIssueId:t,currentIssueId:n,sid:o,moderatorId:r}=s(),{currentIssueId:l,issues:c,moderatorId:d,created:m}=a,u=o===r;if(!d||!m)return i(),void(u||Z(u));t&&n&&n===l||(a.viewingIssueId=l),a.issuesMap=W(c),e(a)}));function n(e,a){const t=e.map((({id:e})=>e));return a.reduce(((e,s)=>{if(e[s.id]=s,s.reveal){const e=t.map((e=>s[e])).filter((e=>"number"===typeof e));s.average=e.avg(),s.maxVote=e.max()}return e}),s("votesMap"))}const o=function(e,s){return U((0,w.rJ)(M,R,e,T),s)}(a,(function(a){const{votes:t}=s(),o=n(a,t);e({members:a,membersMap:W(a),votesMap:o});const{moderatorId:r,sid:i,autoReveal:l,currentIssueId:c}=s();l&&r===i&&a.every((e=>!!e[`vote_${c}`]))&&z(e,s)()})),r=function(e,s){const a=(0,w.rJ)(M,R,e,P);return U((0,w.P)(a,(0,w._M)("reveal","==",!0)),s)}(a,(function(a){const{members:t}=s(),o=n(t,a);e({votes:a,votesMap:o})}));function i(){t(),o(),r()}return i}}});function Fe({roomId:e,match:{params:{roomId:s}={}}={}}){const a=s&&e?He:le;return(0,o.jsx)(a,{})}const $e=f((0,I.y)(t.memo(Fe)),(({roomId:e})=>({roomId:e}))),Ue=({hasExtensionSupport:e})=>(0,o.jsxs)(h,{hasExtensionSupport:e,children:[(0,o.jsx)("div",{className:"poker-fallback",children:"Your screensize is too small that Poker can't support. Please use a bigger screen"}),(0,o.jsx)("div",{className:"poker-container",children:(0,o.jsxs)(n.BV,{children:[(0,o.jsx)(n.qh,{path:":roomId",name:"Planning Poker",element:(0,o.jsx)($e,{})}),(0,o.jsx)(n.qh,{path:"/",name:"Join",element:(0,o.jsx)(le,{})})]})})]})}}]);