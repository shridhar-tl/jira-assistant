"use strict";(globalThis.webpackChunkjira_assistant=globalThis.webpackChunkjira_assistant||[]).push([[796],{530:(e,t,s)=>{s.d(t,{Ls:()=>c,O0:()=>l,tz:()=>h});var i=s(9950),n=s(3023),r=s(2519),a=s(4414);let o=()=>{};function l(e,t){e.preventDefault&&e.preventDefault(),o(e,t)}function c(){o()}class h extends i.PureComponent{constructor(...e){super(...e),this.state={contextItems:[]},this.setMenuRef=e=>this.menu=e,this.setContextMenuRef=e=>this.contextMenu=e}componentDidMount(){o=(e,t)=>{var s;if(!e)return this.menu.hide({}),void this.contextMenu.hide({});const i="contextmenu"===e.type;i||(t=t.filter((e=>!e.disabled||!e.items||0===e.items.length))),null!==(s=this.state.contextItems)&&void 0!==s&&s.length&&this.state.contextItems===t||this.setState({contextItems:t}),i?(this.menu.hide({}),this.contextMenu.show(e)):(this.contextMenu.hide({}),this.menu.toggle(e))}}render(){return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(n.W,{appendTo:document.body,model:this.state.contextItems,popup:!0,ref:this.setMenuRef}),(0,a.jsx)(r.t,{appendTo:document.body,model:this.state.contextItems,popup:!0,ref:this.setContextMenuRef})]})}}},6631:(e,t,s)=>{s.d(t,{A:()=>c});var i=s(9950),n=s(8922),r=s(8874),a=s(4414);const o="Selected file is invalid or is corrupted. Unable to load the file!";class l extends i.PureComponent{constructor(e){super(e),this.setFileSelector=e=>this.fileSelector=e,this.chooseFileForImport=e=>this.fileSelector.click(),this.fileSelected=()=>{const e=this.fileSelector,t=e.files[0];if(t){if(!t.name.endsWith(".jab"))return this.$message.warning("Unknown file selected to import. Select a valid Jira Assist Backup (*.jab) file"),void(e.value="");const s=new FileReader;s.readAsText(t,"UTF-8"),s.onload=async e=>{const t=e.target.result;let s;try{const e=(0,n.xS)(t);s=!0;const i=await this.$backup.importBackup(null===e||void 0===e?void 0:e.value,void 0,this.props.cleanImport);console.log("Import logs:",i),this.props.onImport&&this.props.onImport(),this.$message.success("Settings imported successfully. Check console logs for more details.")}catch(i){console.error("Backup import failed",i),s?this.$message.error(i.message):this.$message.error(o)}},s.onerror=e=>{this.$message.error(o)}}else this.$message.warning("Import operation cancelled");e.value=""},(0,r.WQ)(this,"BackupService","MessageService"),this.state={}}render(){return(0,a.jsxs)(a.Fragment,{children:[this.props.children(this.chooseFileForImport),(0,a.jsx)("input",{ref:this.setFileSelector,type:"file",className:"hide",accept:".jab",onChange:this.fileSelected})]})}}const c=l},1600:(e,t,s)=>{s.d(t,{A:()=>u});var i=s(9950),n=s(4190),r=s(2813),a=s(5674),o=s(9786),l=s(4414);const c=!1!==o.A.modules.contactUs,h=!1!==o.A.features.header.youtubeHelp,d=c||h;class p extends i.PureComponent{constructor(...e){super(...e),this.year=(new Date).getFullYear(),this.siteUrl=d?r.Jb:void 0}render(){return(0,l.jsxs)("div",{className:"card-footer p-4",children:[(0,l.jsx)("div",{className:"float-start",children:(0,l.jsxs)("span",{children:["\xa9 2016-",this.year," ",(0,l.jsx)(a.A,{href:this.siteUrl,children:"Jira Assistant"})," v",n.z2]})}),d&&(0,l.jsxs)("div",{className:"float-end",style:{textAlign:"right"},children:[(0,l.jsxs)("span",{children:[(0,l.jsx)("i",{className:"fa-brands fa-youtube"}),(0,l.jsx)(a.A,{href:"https://www.youtube.com/embed/HsWq7cT3Qq0?rel=0&autoplay=1&showinfo=0&cc_load_policy=1",title:"Click to open YouTube video guiding you to setup Jira Assistant",children:" Help setup"})]})," |",(0,l.jsxs)("span",{children:[(0,l.jsx)("i",{className:"fa fa-phone margin-l-5"}),(0,l.jsx)(a.A,{href:`${r.KS}?entry.1426640786=${n.z2}&entry.972533768=${navigator.userAgent}`,title:"Click to report about any issues or ask a question",children:" Contact us"})]})]})]})}}const u=p},9796:(e,t,s)=>{s.r(t),s.d(t,{default:()=>S});var i=s(9950),n=s(5654),r=s(530),a=s(5006),o=s(2696),l=s(9518),c=s(6631),h=s(1328),d=s(394),p=s(8669),u=s(2763),m=s(1600),g=s(2636),f=s(5620),x=s(9786),j=s(4414);const v={fontSize:"18px",position:"absolute",right:"20px",top:"35px",color:"#0000ff"},y=document.location.href.indexOf("?quick=true")>-1,b=y?{minHeight:"380px",maxHeight:"380px"}:{};class w extends i.PureComponent{constructor(e){super(e),this.showMenu=e=>(0,r.O0)(e,this.settingsMenu),this.setUploader=e=>{this.importSettings=e},this.integrate=()=>{const e=this.state.jiraUrl.trim().clearEnd("/").clearEnd("\\");this.tryIntegrate(e).catch((e=>this.$message.error(e.message,"Unknown error"))).finally((()=>this.setState({isLoading:!1})))},this.handleDBError=e=>(this.$message.error("Unable to save the changes. Verify if you have sufficient free space in your drive","Allocation failed"),-1),this.openDashboard=async e=>{if(!(e<=0)){try{await(0,u.LQ)("SELF","RELOAD",[],this.$message)}catch(t){console.error("Unable to reload BG Listeners",t)}await this.$settings.set("CurrentUserId",e),this.props.setAuthType?this.props.setAuthType("1"):(this.$jaBrowserExtn.openTab("/index.html"),window.close())}},this.onSettingsImport=()=>{f.zM?this.props.setAuthType("1"):y?(this.$jaBrowserExtn.openTab("/index.html"),window.close()):(0,f.Tp)()},this.openInNewTab=()=>this.$jaBrowserExtn.openTab("/index.html"),(0,a.WQ)(this,"AjaxService","StorageService","MessageService","SettingsService","AppBrowserService","SessionService","SettingsService","UserService"),this.state={jiraUrl:x.A.settings.defaultIntegratUrl||""},this.init()}async init(){this.settingsMenu=[{label:"Import Settings",icon:"fa fa-upload fs-16 margin-r-5",command:this.importBackup.bind(this)},{label:"Options",icon:"fa fa-cogs fs-16 margin-r-5",command:this.launchOptionsPage.bind(this)},{separator:!0},{label:"Use Jira OAuth",icon:"fa fa-external-link fs-16 margin-r-5",command:this.useOAuth.bind(this)},{label:"Use Basic Auth",icon:"fa fa-user fs-16 margin-r-5",command:()=>this.props.navigate("/integrate/basic/1")}],f.eD&&(this.state.jiraUrl||this.$jaBrowserExtn.getCurrentUrl().then((e=>{const t=this.getJiraRootUrl(e);t&&t.length>20&&t.startsWith("http")&&this.setState({jiraUrl:t})}),console.error))}launchOptionsPage(){this.$jaBrowserExtn.openTab(f.zM?"/options":"/index.html#/options")}importBackup(){this.importSettings&&this.importSettings()}useOAuth(){const e=(0,h.Ds)({initSource:f.yQ,authType:"1"});f.zM||!y?document.location.href=e:(this.$jaBrowserExtn.openTab(e,"JAOAuth2Win"),window.close())}getJiraRootUrl(e){return e.replace(/^(.*\/\/[^/?#]*).*$/,"$1")}async tryIntegrate(e){this.setState({jiraUrl:e}),this.$session.rootUrl=e,this.setState({isLoading:!0});const t=await this.$jaBrowserExtn.requestPermission(null,e);return delete this.$session.userId,this.$ajax.get(l.f.mySelf).then((t=>this.$user.createUser(t,e).then(this.openDashboard,this.handleDBError)),(s=>{if(401===(s=s||{}).status)this.$message.warning("You are not authenticated with Jira to integrate.","Unauthorized");else{var i;const s=null===(i=(0,d.Yo)(e))||void 0===i?void 0:i.clearEnd("/");if(s&&s!==e)p.A.yesNo(`"${e}" is not a valid Jira Api base path. Would you like to try with "${s}" instead?`,"Change URL").then((()=>{this.tryIntegrate(s)}));else if(t)this.$message.error("This is not a valid Jira server url or the server does not respond.","Unknown server");else{let e="Permission denied to access this Url. ";f.zM?e+="Try integrating directly from extension using JA icon or manually grant permission and retry.":e+="Manually grant permission and then retry. For more details, visit #214 in GitHub issue tracker.",this.$message.error(e,"Permission Denied")}}})).then((()=>this.setState({isLoading:!1})))}render(){const{integrate:e,state:{jiraUrl:t,isLoading:s}}=this;return(0,j.jsx)("div",{className:"app flex-row align-items-center",style:b,children:(0,j.jsx)("div",{className:"container",children:(0,j.jsx)("div",{className:"row justify-content-center",children:(0,j.jsx)("div",{className:"col-md-6 no-padding no-margin",style:{maxWidth:480,minWidth:460},children:(0,j.jsxs)("div",{className:"card mx-4 no-padding no-margin",children:[(0,j.jsxs)("div",{className:"card-body p-4",children:[(0,j.jsx)(c.A,{onImport:this.onSettingsImport,cleanImport:!0,children:this.setUploader}),(0,j.jsx)(r.tz,{}),(!n.A.isFirefox||!y)&&(0,j.jsx)("span",{className:"fa fa-cogs float-end pointer",style:v,onClick:this.showMenu,onContextMenu:this.showMenu,title:"Click to show more options"}),n.A.isFirefox&&y&&(0,j.jsx)("span",{className:"fa fa-external-link float-end pointer",style:v,onClick:this.openInNewTab,title:"Click to open in new tab and see more integration options"}),(0,j.jsx)("h1",{children:"Jira Assistant"}),(0,j.jsxs)("p",{className:"text-muted",children:[(0,j.jsx)("strong",{children:"Integrate"})," with your Jira account"]}),(0,j.jsxs)("div",{className:"input-group mb-3",children:[(0,j.jsx)("div",{className:"input-group-prepend",children:(0,j.jsx)("span",{className:"input-group-text",children:(0,j.jsx)("i",{className:"fa fa-external-link"})})}),(0,j.jsx)(o.fI,{className:"form-control",value:t,onChange:e=>this.setState({jiraUrl:e}),placeholder:"Jira root url (eg: https://jira.example.com)"})]}),(0,j.jsx)("p",{className:"text-muted",children:"Login to your Jira in current tab or provide the Url of your Jira server to integrate. Ensure you have already been authenticated in Jira before you click on Integrate button."}),(0,j.jsx)(o.$n,{type:"primary",className:"btn-block w-100pr",icon:"fa fa-unlock-alt",size:"small",isLoading:s,disabled:!t||s,onClick:e,label:"Integrate"})]}),(0,j.jsx)(m.A,{})]})})})})})}}const S=(0,g.y)(w)}}]);