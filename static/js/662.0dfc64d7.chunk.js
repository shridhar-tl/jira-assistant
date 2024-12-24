"use strict";(globalThis.webpackChunkjira_assistant=globalThis.webpackChunkjira_assistant||[]).push([[662],{8807:(e,t,s)=>{s.d(t,{A:()=>a});var i=s(9950);const a=function(e){const[t,s]=i.useState(null===e||void 0===e||e);return[t,i.useCallback((()=>s((e=>!e))),[s]),s]}},4401:(e,t,s)=>{s.d(t,{A:()=>f});var i=s(9950),a=s(8670),n=s(7348),l=s(6192),o=s(8738),r=s.n(o),c=s(530),d=s(4353),m=s(374),u=s(2285),h=s(5006),p=s(4922),x=(s(4432),s(4414));const f=function(e){const{title:t,iconClass:s,hideRefresh:o,gadgetHint:d,hideMenu:m,isLoading:p,customActions:f,onRefresh:g,settings:v}=e,j=i.useRef({}),b=!1!==e.isGadget,S=v||{fullWidth:!1,fullHeight:!1},[N,C]=(0,i.useState)(S.fullWidth||!1),[k,w]=(0,i.useState)(S.fullHeight||!1),[D,P]=(0,i.useState)(!1),R=i.useId();(0,i.useEffect)((()=>{v&&(C(v.fullWidth),w(v.fullHeight))}),[v]);const{$analytics:A}=(0,h.WQ)("AnalyticsService"),$=()=>{P(!D),D?document.body.classList.remove("fs-layout"):document.body.classList.add("fs-layout")},F=(t,s)=>{e.onAction&&e.onAction({type:t,data:s},e.model,e.index)};j.current.props=e,j.current.isGadget=b,j.current.fullWidth=N,j.current.fullHeight=k,j.current.isFullScreen=D,j.current.$analytics=A,j.current.setSizeOptions=(e,t)=>{S.fullWidth=e,S.fullHeight=t,C(e),w(t),T()},j.current.toggleFullScreen=$,j.current.performAction=F;const T=()=>{F(u.v.SettingsChanged,S)},V=e=>(0,c.O0)(e,y(j.current)),E=i.useCallback((e=>(0,c.O0)(e,y(j.current))),[]),{children:B,tabLayout:H,gadgetType:O}=e;if(H)return(0,x.jsx)(x.Fragment,{children:B});const L=N||!b,W=k||!b,G=r()("gadget",e.className,{docked:!b,"full-width":L&&!D,"full-height":W&&!D,"half-width":!L&&!D,"half-height":!W&&!D,"full-screen":D});return(0,x.jsxs)("div",{ref:t=>{j.current.rootEl=t;const{dropProps:{dropConnector:s}={}}=e;s&&s(t)},className:G,"data-test-id":O,children:[p&&(0,x.jsx)(l.aH,{}),(0,x.jsx)(a.Z,{header:(()=>{const{subTitle:i,draggableHandle:a}=e,r="gadget-header"+(a?" movable":"");return(0,x.jsxs)(x.Fragment,{children:[(0,x.jsxs)("div",{ref:a,className:r,onContextMenu:b?V:null,onDoubleClick:$,children:[(0,x.jsx)("i",{className:`fa ${s}`})," ",t," ",i&&(0,x.jsxs)("span",{children:[" - ",i]}),(0,x.jsxs)("div",{className:"float-end",children:[d?(0,x.jsxs)(x.Fragment,{children:[(0,x.jsx)(n.m,{target:`.icon-hint-${R}`,children:d}),(0,x.jsx)("i",{className:`fa fa-info-circle icon-hint icon-hint-${R}`,"data-pr-position":"bottom"})]}):null,f,!o&&(0,x.jsx)(l.$n,{text:!0,icon:"fa fa-refresh",disabled:p,onClick:c||g,title:"Refresh data"}),!m&&(0,x.jsx)(l.$n,{text:!0,icon:"fa fa-wrench",onClick:E})]})]}),(0,x.jsx)("div",{className:"clearfix"})]});var c})(),children:B})]})};function y(e){const{$analytics:t,performAction:s,isGadget:i,isFullScreen:a,fullWidth:n,fullHeight:l,rootEl:o,setSizeOptions:r,toggleFullScreen:c,props:{title:d,hideExport:h,hideCSVExport:x,hideXLSXExport:f,hidePDFExport:y}}=e,v=i?[{separator:!0},{label:"Full width",icon:`fa fa-${n?"check-":""}circle fs-16 margin-r-5`,command:()=>r(!n,l)},{label:"Full height",icon:`fa fa-${l?"check-":""}circle fs-16 margin-r-5`,command:()=>r(n,!l)},{separator:!0},{label:"Remove",icon:"fa fa-remove",command:()=>{t.trackEvent("Gadget removed",p.hB.GadgetActions,d),s(u.v.RemoveGadget)}}]:[],j=[];return h||(j.push({separator:!0}),x||j.push({label:"Export to CSV",icon:"fa fa-file-text",command:()=>g(m.A.CSV,d,o,t)}),f||j.push({label:"Export to Excel",icon:"fa fa-file-excel",command:()=>g(m.A.XLSX,d,o,t)}),y||j.push({label:"Export to PDF",icon:"fa fa-file-pdf",command:()=>g(m.A.PDF,d,o,t)})),[{label:"Toggle full screen",icon:"fa fa-"+(a?"compress":"expand"),command:()=>c()},...j,...v]}function g(e,t,s,i){const a=new d.L;a.fileName=t,a.format=e||e,a.element=s,i.trackEvent("Export data",p.hB.GadgetActions,a.format),a.export()}},9109:(e,t,s)=>{s.d(t,{A:()=>o});s(9950);var i=s(8738),a=s.n(i),n=s(6192),l=s(4414);const o=function({title:e,onBackClick:t,show:s,onHide:i,children:o,contentClassName:r,controls:c}){return(0,l.jsx)("div",{className:"side-bar-container "+(s?"open":"closed"),children:(0,l.jsxs)("div",{className:"site-bar-block",children:[(0,l.jsxs)("div",{className:"header"+(t?" ps-0":""),children:[(0,l.jsx)(n.$n,{className:"close-icon",icon:"fa fa-times",onClick:i,title:"Hide this block"}),c,t&&(0,l.jsx)(n.$n,{className:"back-icon float-start",icon:"fa fa-arrow-left",onClick:t,title:"Configure data source"}),(0,l.jsx)("h2",{className:"title",children:e})]}),(0,l.jsx)("div",{className:a()("site-bar-content",r),children:o})]})})}},3662:(e,t,s)=>{s.r(t),s.d(t,{default:()=>$});var i=s(9950),a=s(5006);const n="reports_SayDoRatioReport";var l=s(4401),o=s(5620),r=s(9109),c=s(5459),d=s(6192),m=s(4414);const u=function({settings:e,show:t,onHide:s,onDone:a}){var n;const[l,u]=i.useState(e),h=i.useRef({});h.current.settings=l,h.current.onDone=a;const p=i.useCallback((e=>{const t={...h.current.settings,...e};u(t)}),[]),x=i.useCallback((e=>p({sprintBoards:e})),[p]),f=i.useCallback(((e,t)=>p({[t]:parseInt(e)||""})),[p]),y=i.useCallback((()=>h.current.onDone(h.current.settings)),[]),g=(null===l||void 0===l||null===(n=l.sprintBoards)||void 0===n?void 0:n.length)>0&&l.noOfSprints>=3&&l.noOfSprints<13&&l.velocitySprints>=3&&!!l.storyPointField;return(0,m.jsxs)(r.A,{show:t,onHide:s,title:"Report Config",controls:null,width:"500",contentClassName:"p-0",children:[(0,m.jsxs)("div",{className:"p-3",children:[(0,m.jsx)("label",{className:"fw-bold pb-2 d-block",children:"Select Sprint Boards:"}),(0,m.jsx)(c.A,{value:l.sprintBoards,multiple:!0,onChange:x}),(0,m.jsx)("span",{className:"help-text d-block",children:"Select all the sprint boards for which you would like to view Say-Do Ratio report."})]}),(0,m.jsxs)("div",{className:"p-3",children:[(0,m.jsx)("label",{className:"fw-bold pb-2 d-block",children:"Number of Sprints:"}),(0,m.jsx)(d.fI,{value:l.noOfSprints,field:"noOfSprints",onChange:f,maxLength:2}),(0,m.jsx)("span",{className:"help-text d-block",children:"Provide the number of sprints to be displayed in chart and table. Minimum value allowed is 3."})]}),(0,m.jsxs)("div",{className:"p-3",children:[(0,m.jsx)("label",{className:"fw-bold pb-2 d-block",children:"Number of Sprints for velocity:"}),(0,m.jsx)(d.fI,{value:l.velocitySprints,field:"velocitySprints",onChange:f,maxLength:1}),(0,m.jsx)("span",{className:"help-text d-block",children:"Provide the number of sprints to be used for velocity calculation. The average completed story points count of all the sprints would be considered as velocity of each sprint. Minimum value allowed is 3."})]}),!(null!==l&&void 0!==l&&l.storyPointField)&&(0,m.jsxs)("div",{className:"p-3",children:[(0,m.jsx)("label",{className:"fw-bold pb-2 d-block msg-error",children:"Story Points field unavailable:"}),'Select value for "Story Points field" under General settings -> "Default Values" tab. Report cannot be generated without having "Story Points field" configured.']}),!o.mx&&(0,m.jsxs)("div",{className:"p-3",children:[(0,m.jsx)(d.Sc,{checked:!0,label:"Do not show issues removed from sprint as committed"}),(0,m.jsx)("div",{className:"help-text d-block mt-1",children:"If an issue is removed from sprint before closing it, then it would not be considered as committed which impacts Sa-Do-Ratio."})]}),(0,m.jsx)("div",{className:"p-3",children:(0,m.jsx)(d.Sc,{checked:!0,label:"Include non working days in cycle time calculation"})}),(0,m.jsx)("div",{className:"p-3",children:(0,m.jsx)(d.$n,{className:"float-end me-2",icon:"fa fa-arrow-right",iconPos:"right",label:"Generate Report",disabled:!g,onClick:y,title:"Generated report for selected boards"})})]})};var h=s(8807),p=s(1427),x=s(3571);const f=getComputedStyle(document.documentElement),y=f.getPropertyValue("--text-color"),g=f.getPropertyValue("--text-color-secondary"),v=f.getPropertyValue("--surface-border");function j(e,t,s,i){return{maintainAspectRatio:!1,responsive:!0,plugins:{title:{display:!0,text:e,align:"center",font:{size:"16px"},padding:0},subtitle:{display:!0,text:t,padding:10},legend:{position:"bottom",labels:{color:y}},tooltip:{mode:"index",intersect:!1,padding:12,boxPadding:6,callbacks:{title:e=>`Sprint: ${e[0].label}`,label:e=>`${e.dataset.label}: ${e.formattedValue} ${"y1"===e.dataset.yAxisID?"days":"points"}`},bodySpacing:10}},hover:{mode:"index",intersect:!1},scales:{x:{ticks:{color:g},grid:{color:v}},y:{title:{display:!0,text:"Story Points"},min:s,max:i,ticks:{color:g},grid:{color:v}},y1:{position:"right",title:{display:!0,text:"Cycle Time (Days)"},ticks:{color:g},grid:{drawOnChartArea:!1}}}}}function b(e,t,s,i,a){return{label:s,data:e.map((({[t]:e})=>e)),fill:!1,borderColor:i,tension:.4,...a}}function S(e){return{label:"Cycle Time",data:e.map((({averageCycleTime:e})=>e)),backgroundColor:"#FFD700",yAxisID:"y1",type:"bar"}}const N=function({board:e}){const{data:t,options:s}=i.useMemo((()=>{const{name:t,sprintList:s,velocity:i}=e,a=s.filter(Boolean),n=a.map((e=>e.name)),l=[b(a,"velocity","Velocity","#4169E1",{borderDash:[5,5]}),b(a,"committedStoryPoints","Committed","#FF6347"),b(a,"completedStoryPoints","Completed","#228B22"),S(a)];let o=7,r=7;for(const e of l)if("y1"!==e.yAxisID)for(const t of e.data)t<o&&(o=t),t>r&&(r=t);return o<=2?o=0:o-=1,{data:{labels:n,datasets:l},options:j(t,`Velocity: ${null!==i&&void 0!==i?i:"(Unavailable)"}`,o,r+2)}}),[e]);return(0,m.jsx)("div",{className:"col-12 col-xl-6 mb-4",children:(0,m.jsx)(x.t,{type:"line",data:t,options:s,height:"350px"})})};var C=s(2492),k=s(9051),w=s.n(k),D=s(6904);const P="D-MMM-YYYY h:mm A";const R=function({sprint:e,onClose:t}){const[s,n]=i.useState([]);return i.useEffect((()=>{const{issues:t}=e,s=A(t);n(s),(async()=>{const e=t.map((({key:e})=>e)),{$ticket:s}=(0,a.WQ)("TicketService"),i=await s.getTicketDetails(e,!1,["assignee","issuetype","priority","summary","status"]),l=A(t.map((e=>{const{fields:t}=i[e.key];return{...e,fields:{...e.fields,...t}}})));n(l)})()}),[e]),(0,m.jsxs)("div",{className:"sprint-info",children:[(0,m.jsxs)("div",{className:"sprint-info-header",children:[(0,m.jsx)("h2",{children:e.name}),(0,m.jsx)("span",{className:"close-icon fas fa-times",onClick:t})]}),(0,m.jsxs)("div",{className:"sprint-details",children:[(0,m.jsxs)("div",{className:"metric-item",children:[(0,m.jsx)("strong",{children:"Active during:"})," ",w()(e.startDate).format(P)," to ",w()(e.completeDate).format(P)]}),!!e.velocity&&(0,m.jsxs)("div",{className:"metric-item",children:[(0,m.jsx)("strong",{children:"Average Velocity:"})," ",e.velocity," (",parseFloat(e.velocityGrowth.toFixed(2)),"%)"]}),!!e.sayDoRatio&&(0,m.jsxs)("div",{className:"metric-item",children:[(0,m.jsx)("strong",{children:"Say Do Ratio:"})," ",e.sayDoRatio,"%"]}),!!e.averageCycleTime&&(0,m.jsxs)("div",{className:"metric-item",children:[(0,m.jsx)("strong",{children:"Cycle Time:"}),(0,m.jsx)(D.g4,{tag:"span",value:e.averageCycleTime,days:!0,inputType:"days"}),(0,m.jsxs)("span",{className:"ms-1",children:["(",e.cycleTimesIssuesCount," issues)"]})]})]}),s.map((e=>(0,m.jsxs)("div",{className:"issue-group",children:[(0,m.jsx)("h3",{children:e.title}),(0,m.jsxs)(p.ew,{dataset:e.issues,className:"issues-table",height:"calc(100vh - 560px)",children:[(0,m.jsx)(p.D1,{children:(0,m.jsxs)("tr",{children:[(0,m.jsx)(p.VP,{style:{width:"100px"},children:"Key"}),(0,m.jsx)(p.VP,{style:{maxWidth:"450px"},children:"Summary"}),(0,m.jsx)(p.VP,{style:{width:"150px"},children:"Priority"}),(0,m.jsx)(p.VP,{style:{width:"200px"},children:"Assignee"}),e.showCycleTime&&(0,m.jsx)(p.VP,{className:"text-center",style:{width:"70px",minWidth:"50px"},children:"Cycle Time"}),(0,m.jsx)(p.VP,{className:"text-center",style:{width:"70px",minWidth:"50px"},children:"Story Points"})]})}),(0,m.jsx)(p.vc,{children:e.issues.map((t=>(0,m.jsxs)("tr",{style:{backgroundColor:t.addedToSprint?"#fff3cd":""},children:[(0,m.jsxs)("td",{children:[(0,m.jsx)(D.Ek,{tag:"span",value:t}),t.addedToSprint&&(0,m.jsx)("span",{className:"ps-2",children:"*"})]}),(0,m.jsx)("td",{style:{maxWidth:"450px"},children:t.fields.summary}),(0,m.jsx)(D.mG,{value:t.fields.priority}),(0,m.jsx)(D.YP,{value:t.fields.assignee,settings:{showImage:!0}}),e.showCycleTime&&(0,m.jsx)("td",{className:"text-center",children:(0,m.jsx)(D.g4,{tag:"span",value:t.cycleTime,days:!0,inputType:"days"})}),(0,m.jsxs)("td",{className:"text-center",children:[!!t.initialStoryPoints&&(0,m.jsxs)("span",{className:"text-muted",children:[t.initialStoryPoints," ",(0,m.jsx)("span",{className:"fas fa-arrow-right mx-1"})]}),t.fields.storyPoints||"-"]})]},t.key)))})]})]},e.title)))]})};function A(e){return e.groupBy((e=>e.completed?"1Completed issues":e.completedOutside?"3Completed outside sprint":e.removedFromSprint?"4Removed from sprint":"2Issues not completed")).sortBy((e=>e.key)).map((({key:e,values:t})=>({title:`${e.substring(1)} (${t.length})`,showCycleTime:e.startsWith("1"),issues:t})))}const $=function(){const[e,t]=i.useState(!1),[s,o]=i.useState(),[r,c]=(0,h.A)(!0),[x,f]=i.useState(function(){var e;const{$session:t}=(0,a.WQ)("SessionService"),s={sprintBoards:[],noOfSprints:6,velocitySprints:6,...t.pageSettings[n]||{}};return s.storyPointField=null===(e=t.CurrentUser.storyPointField)||void 0===e?void 0:e.id,s}()),[y,g]=i.useState([]),v=i.useRef({});v.current.settings=x,v.current.toggleEdit=c;const j=i.useCallback((async()=>{try{t(!0);const e=await async function(e){var t;const{sprintBoards:s,noOfSprints:i,velocitySprints:l,storyPointField:o}=e,{$sprint:r,$jira:c,$config:d}=(0,a.WQ)("SprintService","JiraService","ConfigService"),m=null===(t=(await c.getCustomFields()).find((({name:e})=>"Sprint"===e)))||void 0===t?void 0:t.id,u=[];for(const{id:a,name:n}of s){const{closedSprintLists:e,...t}=await r.computeAverageSprintVelocity(a,l,o,m,i+l),s=e.slice(-i);for(;s.length<i;)s.splice(0,0,null);u.push({id:a,name:n,sprintList:s,...t})}return await d.saveSettings(n,{sprintBoards:s,noOfSprints:i,velocitySprints:l}),u}(v.current.settings);g(e)}finally{t(!1)}}),[]);v.current.loadReportData=j;const b=i.useCallback((e=>{f(e),v.current.settings=e,v.current.loadReportData().then(v.current.toggleEdit)}),[]),S=(0,m.jsx)(d.$n,{type:"secondary",icon:"fa fa-edit",className:"mx-1",onClick:c,title:"Edit report configuration"});return(0,m.jsxs)(m.Fragment,{children:[(0,m.jsx)(u,{settings:x,show:r,onHide:c,onDone:b}),(0,m.jsx)("div",{className:"page-container",children:(0,m.jsxs)(l.A,{title:"Say Do Ratio Report",isGadget:!1,isLoading:e,onRefresh:j,customActions:S,children:[(0,m.jsxs)(p.ew,{dataset:y,exportSheetName:"Say Do Ratio",containerStyle:{height:"auto",maxHeight:"70%"},children:[(0,m.jsx)(p.D1,{children:(0,m.jsxs)("tr",{children:[(0,m.jsx)(p.VP,{sortBy:"name",children:"Board Name"}),(0,m.jsx)(p.VP,{sortBy:"velocity",className:"text-center",children:"Velocity"}),(0,m.jsx)(p.VP,{sortBy:"sayDoRatio",className:"text-center",children:"Say-Do-Ratio"}),(0,m.jsx)(p.VP,{sortBy:"averageCycleTime",className:"text-center",children:"Cycle Time"}),T(x.noOfSprints,(e=>{const t=x.noOfSprints===e+1?"Last sprint (n-1)":"Sprint n"+(e-x.noOfSprints);return(0,m.jsx)(p.VP,{className:"text-center",children:t},e)}))]})}),(0,m.jsx)(p.vc,{className:"no-log-bg-hl",children:e=>{var t;return(0,m.jsxs)("tr",{children:[(0,m.jsx)("td",{children:e.name}),(0,m.jsxs)("td",{className:"text-center",children:[e.velocity||"-"," ",!!e.velocity&&(0,m.jsxs)("span",{children:["(",parseFloat((null===(t=e.velocityGrowth)||void 0===t?void 0:t.toFixed(2))||0),"%)"]})]}),e.sayDoRatio&&(0,m.jsxs)("td",{className:F(e.sayDoRatio),children:[e.sayDoRatio,"%",(0,m.jsx)(C.A,{value:e.sayDoRatio,maxHours:100})]}),!e.sayDoRatio&&(0,m.jsx)("td",{className:"text-center",children:"-"}),(0,m.jsx)("td",{className:"text-center",children:e.averageCycleTime?`${e.averageCycleTime} days`:"-"}),e.sprintList.map((e=>null!==e&&void 0!==e&&e.sayDoRatio?(0,m.jsxs)("td",{className:F(e.sayDoRatio,e===s),onClick:()=>o(e),children:[(0,m.jsx)("span",{className:"fas fa-info-circle float-end"}),e.sayDoRatio,"%",(0,m.jsx)(C.A,{value:parseInt(e.sayDoRatio),maxHours:100})]},e.id):(0,m.jsx)("td",{className:"text-center",children:"-"})))]},e.id)}}),!(null!==y&&void 0!==y&&y.length)&&(0,m.jsx)(p.QC,{span:7,children:"No data available."})]}),s&&(0,m.jsx)("div",{className:"row m-0 mt-3",children:(0,m.jsx)(R,{sprint:s,onClose:()=>o(null)})}),(0,m.jsx)("div",{className:"row m-0 mt-3",children:null===y||void 0===y?void 0:y.map((e=>(0,m.jsx)(N,{board:e},e.id)))})]})})]})};function F(e,t){let s="log-good";return s=e>=85?"log-good":e>=70?"log-less":"log-high",`log-indi-cntr ${s}${t?" selected":""}`}function T(e,t){const s=[];for(let i=0;i<e;i++)s.push(t(i));return s}}}]);