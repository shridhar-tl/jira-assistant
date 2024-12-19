"use strict";(globalThis.webpackChunkjira_assistant=globalThis.webpackChunkjira_assistant||[]).push([[560],{8807:(e,t,s)=>{s.d(t,{A:()=>o});var n=s(9950);const o=function(e){const[t,s]=n.useState(null===e||void 0===e||e);return[t,n.useCallback((()=>s((e=>!e))),[s]),s]}},4401:(e,t,s)=>{s.d(t,{A:()=>g});var n=s(9950),o=s(8670),a=s(7348),i=s(6192),l=s(8738),r=s.n(l),c=s(530),d=s(4353),u=s(374),h=s(2285),p=s(5006),f=s(4922),m=(s(4432),s(4414));const g=function(e){const{title:t,iconClass:s,hideRefresh:l,gadgetHint:d,hideMenu:u,isLoading:f,customActions:g,onRefresh:v,settings:b}=e,y=n.useRef({}),j=!1!==e.isGadget,S=b||{fullWidth:!1,fullHeight:!1},[N,C]=(0,n.useState)(S.fullWidth||!1),[k,R]=(0,n.useState)(S.fullHeight||!1),[D,w]=(0,n.useState)(!1),A=n.useId();(0,n.useEffect)((()=>{b&&(C(b.fullWidth),R(b.fullHeight))}),[b]);const{$analytics:P}=(0,p.WQ)("AnalyticsService"),F=()=>{w(!D),D?document.body.classList.remove("fs-layout"):document.body.classList.add("fs-layout")},E=(t,s)=>{e.onAction&&e.onAction({type:t,data:s},e.model,e.index)};y.current.props=e,y.current.isGadget=j,y.current.fullWidth=N,y.current.fullHeight=k,y.current.isFullScreen=D,y.current.$analytics=P,y.current.setSizeOptions=(e,t)=>{S.fullWidth=e,S.fullHeight=t,C(e),R(t),$()},y.current.toggleFullScreen=F,y.current.performAction=E;const $=()=>{E(h.v.SettingsChanged,S)},H=e=>(0,c.O0)(e,x(y.current)),B=n.useCallback((e=>(0,c.O0)(e,x(y.current))),[]),{children:L,tabLayout:V,gadgetType:O}=e;if(V)return(0,m.jsx)(m.Fragment,{children:L});const G=N||!j,W=k||!j,T=r()("gadget",e.className,{docked:!j,"full-width":G&&!D,"full-height":W&&!D,"half-width":!G&&!D,"half-height":!W&&!D,"full-screen":D});return(0,m.jsxs)("div",{ref:t=>{y.current.rootEl=t;const{dropProps:{dropConnector:s}={}}=e;s&&s(t)},className:T,"data-test-id":O,children:[f&&(0,m.jsx)(i.aH,{}),(0,m.jsx)(o.Z,{header:(()=>{const{subTitle:n,draggableHandle:o}=e,r="gadget-header"+(o?" movable":"");return(0,m.jsxs)(m.Fragment,{children:[(0,m.jsxs)("div",{ref:o,className:r,onContextMenu:j?H:null,onDoubleClick:F,children:[(0,m.jsx)("i",{className:`fa ${s}`})," ",t," ",n&&(0,m.jsxs)("span",{children:[" - ",n]}),(0,m.jsxs)("div",{className:"float-end",children:[d?(0,m.jsxs)(m.Fragment,{children:[(0,m.jsx)(a.m,{target:`.icon-hint-${A}`,children:d}),(0,m.jsx)("i",{className:`fa fa-info-circle icon-hint icon-hint-${A}`,"data-pr-position":"bottom"})]}):null,g,!l&&(0,m.jsx)(i.$n,{text:!0,icon:"fa fa-refresh",disabled:f,onClick:c||v,title:"Refresh data"}),!u&&(0,m.jsx)(i.$n,{text:!0,icon:"fa fa-wrench",onClick:B})]})]}),(0,m.jsx)("div",{className:"clearfix"})]});var c})(),children:L})]})};function x(e){const{$analytics:t,performAction:s,isGadget:n,isFullScreen:o,fullWidth:a,fullHeight:i,rootEl:l,setSizeOptions:r,toggleFullScreen:c,props:{title:d,hideExport:p,hideCSVExport:m,hideXLSXExport:g,hidePDFExport:x}}=e,b=n?[{separator:!0},{label:"Full width",icon:`fa fa-${a?"check-":""}circle fs-16 margin-r-5`,command:()=>r(!a,i)},{label:"Full height",icon:`fa fa-${i?"check-":""}circle fs-16 margin-r-5`,command:()=>r(a,!i)},{separator:!0},{label:"Remove",icon:"fa fa-remove",command:()=>{t.trackEvent("Gadget removed",f.hB.GadgetActions,d),s(h.v.RemoveGadget)}}]:[],y=[];return p||(y.push({separator:!0}),m||y.push({label:"Export to CSV",icon:"fa fa-file-text",command:()=>v(u.A.CSV,d,l,t)}),g||y.push({label:"Export to Excel",icon:"fa fa-file-excel",command:()=>v(u.A.XLSX,d,l,t)}),x||y.push({label:"Export to PDF",icon:"fa fa-file-pdf",command:()=>v(u.A.PDF,d,l,t)})),[{label:"Toggle full screen",icon:"fa fa-"+(o?"compress":"expand"),command:()=>c()},...y,...b]}function v(e,t,s,n){const o=new d.L;o.fileName=t,o.format=e||e,o.element=s,n.trackEvent("Export data",f.hB.GadgetActions,o.format),o.export()}},9109:(e,t,s)=>{s.d(t,{A:()=>l});s(9950);var n=s(8738),o=s.n(n),a=s(6192),i=s(4414);const l=function({title:e,onBackClick:t,show:s,onHide:n,children:l,contentClassName:r,controls:c}){return(0,i.jsx)("div",{className:"side-bar-container "+(s?"open":"closed"),children:(0,i.jsxs)("div",{className:"site-bar-block",children:[(0,i.jsxs)("div",{className:"header"+(t?" ps-0":""),children:[(0,i.jsx)(a.$n,{className:"close-icon",icon:"fa fa-times",onClick:n,title:"Hide this block"}),c,t&&(0,i.jsx)(a.$n,{className:"back-icon float-start",icon:"fa fa-arrow-left",onClick:t,title:"Configure data source"}),(0,i.jsx)("h2",{className:"title",children:e})]}),(0,i.jsx)("div",{className:o()("site-bar-content",r),children:l})]})})}},5560:(e,t,s)=>{s.r(t),s.d(t,{default:()=>N});var n=s(9950),o=s(5006);const a="reports_SayDoRatioReport";var i=s(4401),l=s(9109),r=s(5459),c=s(6192),d=s(4414);const u=function({settings:e,show:t,onHide:s,onDone:o}){var a;const[i,u]=n.useState(e),h=n.useRef({});h.current.settings=i,h.current.onDone=o;const p=n.useCallback((e=>{const t={...h.current.settings,...e};u(t)}),[]),f=n.useCallback((e=>p({sprintBoards:e})),[p]),m=n.useCallback(((e,t)=>p({[t]:parseInt(e)||""})),[p]),g=n.useCallback((()=>h.current.onDone(h.current.settings)),[]),x=(null===i||void 0===i||null===(a=i.sprintBoards)||void 0===a?void 0:a.length)>0&&i.noOfSprints>=3&&i.noOfSprints<13&&i.velocitySprints>=3&&!!i.storyPointField;return(0,d.jsxs)(l.A,{show:t,onHide:s,title:"Report Config",controls:null,width:"500",contentClassName:"p-0",children:[(0,d.jsxs)("div",{className:"p-3",children:[(0,d.jsx)("label",{className:"font-bold pb-2 block",children:"Select Sprint Boards:"}),(0,d.jsx)(r.A,{value:i.sprintBoards,multiple:!0,onChange:f}),(0,d.jsx)("span",{className:"help-text block",children:"Select all the sprint boards for which you would like to view Say-Do Ratio report."})]}),(0,d.jsxs)("div",{className:"p-3",children:[(0,d.jsx)("label",{className:"font-bold pb-2 block",children:"Number of Sprints:"}),(0,d.jsx)(c.fI,{value:i.noOfSprints,field:"noOfSprints",onChange:m,maxLength:2}),(0,d.jsx)("span",{className:"help-text block",children:"Provide the number of sprints to be displayed in chart and table. Minimum value allowed is 3."})]}),(0,d.jsxs)("div",{className:"p-3",children:[(0,d.jsx)("label",{className:"font-bold pb-2 block",children:"Number of Sprints for velocity:"}),(0,d.jsx)(c.fI,{value:i.velocitySprints,field:"velocitySprints",onChange:m,maxLength:1}),(0,d.jsx)("span",{className:"help-text block",children:"Provide the number of sprints to be used for velocity calculation. The average completed story points count of all the sprints would be considered as velocity of each sprint. Minimum value allowed is 3."})]}),!(null!==i&&void 0!==i&&i.storyPointField)&&(0,d.jsxs)("div",{className:"p-3",children:[(0,d.jsx)("label",{className:"font-bold pb-2 block",children:"Story Points field unavailable:"}),'Select value for "Story Points field" under General settings -> "Default Values" tab. Report cannot be generated without having "Story Points field" configured.']}),(0,d.jsx)("div",{className:"p-3",children:(0,d.jsx)(c.$n,{className:"float-end me-2",icon:"fa fa-arrow-right",iconPos:"right",label:"Generate Report",disabled:!x,onClick:g,title:"Generated report for selected boards"})})]})};var h=s(8807),p=s(1427),f=s(3571);const m=getComputedStyle(document.documentElement),g=m.getPropertyValue("--text-color"),x=m.getPropertyValue("--text-color-secondary"),v=m.getPropertyValue("--surface-border");function b(e,t,s,n){return{maintainAspectRatio:!1,responsive:!0,plugins:{title:{display:!0,text:e,align:"center",font:{size:"16px"},padding:0},subtitle:{display:!0,text:t,padding:10},legend:{position:"bottom",labels:{color:g}}},scales:{x:{ticks:{color:x},grid:{color:v}},y:{min:s,max:n,ticks:{color:x},grid:{color:v}}}}}function y(e,t,s,n,o){return{label:s,data:e.map((({[t]:e})=>e)),fill:!1,borderColor:n,tension:.4,...o}}const j=function({board:e}){const{data:t,options:s}=n.useMemo((()=>{const{name:t,sprintList:s,averageCompleted:n}=e,o=s.filter(Boolean),a=o.map((e=>e.name)),i=[y(o,"velocity","Velocity","#4169E1",{borderDash:[5,5]}),y(o,"committedStoryPoints","Committed","#228B22"),y(o,"completedStoryPoints","Completed","#FF6347")];let l=7,r=7;for(const e of i)for(const t of e.data)t<l&&(l=t),t>r&&(r=t);return l<=2&&(l=0),{data:{labels:a,datasets:i},options:b(t,`Velocity: ${n}`,l,r+2)}}),[e]);return(0,d.jsx)("div",{className:"col-12 col-xl-6",children:(0,d.jsx)(f.t,{type:"line",data:t,options:s,height:"350px"})})};var S=s(2492);const N=function(){const[e,t]=n.useState(!1),[s,l]=(0,h.A)(!0),[r,f]=n.useState(function(){var e;const{$session:t}=(0,o.WQ)("SessionService"),s={sprintBoards:[],noOfSprints:6,velocitySprints:6,...t.pageSettings[a]||{}};return s.storyPointField=null===(e=t.CurrentUser.storyPointField)||void 0===e?void 0:e.id,s}()),[m,g]=n.useState([]),x=n.useRef({});x.current.settings=r,x.current.toggleEdit=l;const v=n.useCallback((async()=>{try{t(!0);const e=await async function(e){const{sprintBoards:t,noOfSprints:s,velocitySprints:n,storyPointField:i}=e,{$sprint:l,$config:r}=(0,o.WQ)("SprintService","SessionService","ConfigService"),c=[];for(const{id:o,name:a}of t){const{closedSprintLists:e,averageCommitted:t,averageCompleted:r,sayDoRatio:d}=await l.computeAverageSprintVelocity(o,n,i,s+n),u=e.slice(-s);for(;u.length<s;)u.splice(0,0,null);c.push({id:o,name:a,sprintList:u,averageCommitted:t,averageCompleted:r,sayDoRatio:d})}return await r.saveSettings(a,{sprintBoards:t,noOfSprints:s,velocitySprints:n}),c}(x.current.settings);g(e)}finally{t(!1)}}),[]);x.current.loadReportData=v;const b=n.useCallback((e=>{f(e),x.current.settings=e,x.current.loadReportData().then(x.current.toggleEdit)}),[]),y=(0,d.jsx)(c.$n,{type:"secondary",icon:"fa fa-edit",className:"mx-1",onClick:l,title:"Edit report configuration"});return(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(u,{settings:r,show:s,onHide:l,onDone:b}),(0,d.jsx)("div",{className:"page-container",children:(0,d.jsxs)(i.A,{title:"Say Do Ratio Report",isGadget:!1,isLoading:e,onRefresh:v,customActions:y,children:[(0,d.jsxs)(p.ew,{dataset:m,exportSheetName:"Say Do Ratio",containerStyle:{height:"auto",maxHeight:"70%"},children:[(0,d.jsx)(p.D1,{children:(0,d.jsxs)("tr",{children:[(0,d.jsx)(p.VP,{sortBy:"name",children:"Board Name"}),(0,d.jsx)(p.VP,{sortBy:"sayDoRatio",className:"text-center",children:"Average"}),k(r.noOfSprints,(e=>(0,d.jsxs)(p.VP,{className:"text-center",children:["Sprint ",e+1]},e)))]})}),(0,d.jsx)(p.vc,{className:"no-log-bg-hl",children:e=>(0,d.jsxs)("tr",{children:[(0,d.jsx)("td",{children:e.name}),e.sayDoRatio&&(0,d.jsxs)("td",{className:C(e.sayDoRatio),children:[e.sayDoRatio,"%",(0,d.jsx)(S.A,{value:e.sayDoRatio,maxHours:100})]}),!e.sayDoRatio&&(0,d.jsx)("td",{className:"text-center",children:"-"}),e.sprintList.map((e=>null!==e&&void 0!==e&&e.sayDoRatio?(0,d.jsxs)("td",{className:C(e.sayDoRatio),children:[e.sayDoRatio,"%",(0,d.jsx)(S.A,{value:parseInt(e.sayDoRatio),maxHours:100})]}):(0,d.jsx)("td",{className:"text-center",children:"-"})))]},e.id)}),(0,d.jsx)(p.QC,{span:7,children:"No data available."})]}),(0,d.jsx)("div",{className:"row m-0",children:null===m||void 0===m?void 0:m.map((e=>(0,d.jsx)(j,{board:e},e.id)))})]})})]})};function C(e){let t="log-good";return t=e>=85?"log-good":e>=70?"log-less":"log-high",`log-indi-cntr ${t}`}function k(e,t){const s=[];for(let n=0;n<e;n++)s.push(t(n));return s}}}]);