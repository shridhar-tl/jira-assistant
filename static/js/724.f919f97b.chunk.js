"use strict";(globalThis.webpackChunkjira_assistant=globalThis.webpackChunkjira_assistant||[]).push([[724],{6367:(e,t,s)=>{s.d(t,{Z:()=>p});var i=s(7313),a=s(232),n=s(3682),o=s(794),r=s(3860),l=s(6417);const d=!1!==r.Z.modules.contactUs,c=!1!==r.Z.features.header.youtubeHelp,h=d||c;class u extends i.PureComponent{constructor(){super(...arguments),this.year=(new Date).getFullYear(),this.siteUrl=h?n.ov:void 0}render(){return(0,l.jsxs)("div",{className:"card-footer p-4",children:[(0,l.jsx)("div",{className:"pull-left",children:(0,l.jsxs)("span",{children:["\xa9 2016-",this.year," ",(0,l.jsx)(o.Z,{href:this.siteUrl,children:"Jira Assistant"})," v",a.Hm]})}),h&&(0,l.jsxs)("div",{className:"pull-right",style:{textAlign:"right"},children:[(0,l.jsxs)("span",{children:[(0,l.jsx)("i",{className:"fa fa-youtube"}),(0,l.jsx)(o.Z,{href:"https://www.youtube.com/embed/HsWq7cT3Qq0?rel=0&autoplay=1&showinfo=0&cc_load_policy=1",title:"Click to open YouTube video guiding you to setup Jira Assistant",children:" Help setup"})]})," |",(0,l.jsxs)("span",{children:[(0,l.jsx)("i",{className:"fa fa-phone margin-l-5"}),(0,l.jsx)(o.Z,{href:`${n.ky}?entry.1426640786=${a.Hm}&entry.972533768=${navigator.userAgent}`,title:"Click to report about any issues or ask a question",children:" Contact us"})]})]})]})}}const p=u},4724:(e,t,s)=>{s.r(t),s.d(t,{default:()=>g});var i=s(6123),a=s.n(i),n=s(7313),o=s(6552),r=s(3258),l=s(3682),d=s(2284),c=s(9149),h=s(6367),u=s(6848),p=s(6417);class x extends n.PureComponent{constructor(e){super(e),this.navigateToStore=()=>window.open(this.storeUrl),this.extnSelected=()=>{this.props.needIntegration?this.props.navigate("/integrate/extn"):this.props.onAuthTypeChosen("1")},this.basicAuthSelected=()=>this.props.navigate("/integrate/basic"),this.oAuthSelected=()=>{o.Z.yesNo((0,p.jsxs)("span",{children:["You will be redirected to Jira Cloud where you can Authorize Jira Assistant to access Jira API's.",(0,p.jsx)("br",{}),(0,p.jsx)("br",{}),"This is a one time activity and the authorization code would be stored in your browser cache which would be used in future for accessing Jira."]}),"Jira Cloud - OAuth2 Integration").then((()=>{document.location.href=(0,d.VM)({initSource:c.LD,authType:"2"})}))},this.storeUrl=l.P$[r.M]||l.ov}getExtensionMessage(){const{isExtnValid:e,extnUnavailable:t,needIntegration:s}=this.props;return t?(0,p.jsx)("div",{className:"auth-type-desc",children:"Please install Jira Assistant extension and ensure it is enabled. If you believe latest version is already installed and enabled, then please ensure service worker is running in the extension."}):e?s?(0,p.jsx)("div",{className:"auth-type-desc",children:"Required version of extension is already installed but you haven't yet integrated with Jira. Select this option to connect and integrate extension with Jira. Or, click JA icon in your browser to integrate with Jira first and then refresh this page again."}):(0,p.jsx)("div",{className:"auth-type-desc",children:"Required version of extension is already installed and ready to use. Select this option to connect with Jira Assistant extension and use latest features and bug fixes not yet available in the extension."}):(0,p.jsx)("div",{className:"auth-type-desc",children:"You are using old version of Jira Assistant extension. Some of the features are not supported until you update your extension to latest version. Please update the extension and refresh this page."})}getExtensionItem(){const{props:{extnUnavailable:e,isExtnValid:t}}=this,s=!e&&t;return(0,p.jsxs)(p.Fragment,{children:[e&&(0,p.jsx)("span",{className:"badge badge-success",onClick:this.navigateToStore,title:"Click to visit webstore and install the extension",children:"Install Extension"}),!e&&!t&&!s&&(0,p.jsx)("span",{className:"badge badge-success",onClick:this.navigateToStore,title:"Click to visit webstore and update the extension",children:"Update Extension"}),(0,p.jsxs)("div",{className:a()("auth-type",!s&&"disabled"),onClick:s?this.extnSelected:void 0,"data-test-id":"extn-auth",children:[(0,p.jsx)("div",{className:"auth-type-title",children:"Use Jira Assistant Extension"}),this.getExtensionMessage()]})]})}render(){return(0,p.jsx)("div",{className:"app auth-page flex-row align-items-center",children:(0,p.jsx)("div",{className:"container",children:(0,p.jsx)("div",{className:"row justify-content-center",children:(0,p.jsx)("div",{className:"col-md-6 no-padding no-margin",style:{maxWidth:480,minWidth:460},children:(0,p.jsxs)("div",{className:"card mx-4 no-padding no-margin",children:[(0,p.jsxs)("div",{className:"card-body p-4",children:[(0,p.jsx)("h1",{children:"Jira Assistant"}),(0,p.jsxs)("p",{className:"text-muted",children:["Choose the way you would like to ",(0,p.jsx)("strong",{children:"Integrate"})," with your Jira"]}),!c.yX&&this.getExtensionItem(),(0,p.jsxs)("div",{className:"auth-type",onClick:this.oAuthSelected,"data-test-id":"o-auth",children:[(0,p.jsx)("div",{className:"auth-type-title",children:"Use OAuth2 (Jira Cloud only)"}),(0,p.jsx)("div",{className:"auth-type-desc",children:"Using OAuth option will let authorize this tool to Integrate with Jira without need to store login credentials in this tool. This is more secured than using userid and password"})]}),(0,p.jsxs)("div",{className:"auth-type",onClick:this.basicAuthSelected,"data-test-id":"basic-auth",children:[(0,p.jsx)("div",{className:"auth-type-title",children:"Use User id and Password"}),(0,p.jsx)("div",{className:"auth-type-desc",children:"You can use your user id and password / api token to authenticate with Jira. On some cases this option may not work if you use single sign-on for logging in to Jira."})]})]}),(0,p.jsx)(h.Z,{})]})})})})})}}const g=(0,u.E)(x)}}]);