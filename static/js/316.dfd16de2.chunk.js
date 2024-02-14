"use strict";(globalThis.webpackChunkjira_assistant=globalThis.webpackChunkjira_assistant||[]).push([[316],{1416:(e,t,s)=>{s.d(t,{c:()=>c});var i=s(9584),r=s(4048),a=s(4896),n=s(7884);const o="Selected file is invalid or is corrupted. Unable to load the file!";class l extends i.PureComponent{constructor(e){super(e),this.setFileSelector=e=>this.fileSelector=e,this.chooseFileForImport=e=>this.fileSelector.click(),this.fileSelected=()=>{const e=this.fileSelector,t=e.files[0];if(t){if(!t.name.endsWith(".jab"))return this.$message.warning("Unknown file selected to import. Select a valid Jira Assist Backup (*.jab) file"),void(e.value="");const s=new FileReader;s.readAsText(t,"UTF-8"),s.onload=async e=>{const t=e.target.result;let s;try{const e=(0,r.OC)(t);s=!0;const i=await this.$backup.importBackup(null===e||void 0===e?void 0:e.value,void 0,this.props.cleanImport);console.log("Import logs:",i),this.props.onImport&&this.props.onImport(),this.$message.success("Settings imported successfully. Check console logs for more details.")}catch(i){console.error("Backup import failed",i),s?this.$message.error(i.message):this.$message.error(o)}},s.onerror=e=>{this.$message.error(o)}}else this.$message.warning("Import operation cancelled");e.value=""},(0,a.uU)(this,"BackupService","MessageService"),this.state={}}render(){return(0,n.jsxs)(n.Fragment,{children:[this.props.children(this.chooseFileForImport),(0,n.jsx)("input",{ref:this.setFileSelector,type:"file",className:"hide",accept:".jab",onChange:this.fileSelected})]})}}const c=l},1456:(e,t,s)=>{s.d(t,{c:()=>u});var i=s(9584),r=s(9532),a=s(9288),n=s(2960),o=s(5792),l=s(7884);const c=!1!==o.default.modules.contactUs,h=!1!==o.default.features.header.youtubeHelp,d=c||h;class p extends i.PureComponent{constructor(...e){super(...e),this.year=(new Date).getFullYear(),this.siteUrl=d?a.yR:void 0}render(){return(0,l.jsxs)("div",{className:"card-footer p-4",children:[(0,l.jsx)("div",{className:"float-start",children:(0,l.jsxs)("span",{children:["\xa9 2016-",this.year," ",(0,l.jsx)(n.c,{href:this.siteUrl,children:"Jira Assistant"})," v",r.MT]})}),d&&(0,l.jsxs)("div",{className:"float-end",style:{textAlign:"right"},children:[(0,l.jsxs)("span",{children:[(0,l.jsx)("i",{className:"fa-brands fa-youtube"}),(0,l.jsx)(n.c,{href:"https://www.youtube.com/embed/HsWq7cT3Qq0?rel=0&autoplay=1&showinfo=0&cc_load_policy=1",title:"Click to open YouTube video guiding you to setup Jira Assistant",children:" Help setup"})]})," |",(0,l.jsxs)("span",{children:[(0,l.jsx)("i",{className:"fa fa-phone margin-l-5"}),(0,l.jsx)(n.c,{href:`${a.GE}?entry.1426640786=${r.MT}&entry.972533768=${navigator.userAgent}`,title:"Click to report about any issues or ask a question",children:" Contact us"})]})]})]})}}const u=p},5316:(e,t,s)=>{s.r(t),s.d(t,{default:()=>S});var i=s(9584),r=s(3472),a=s(5068),n=s(4324),o=s(9640),l=s(4832),c=s(1416),h=s(4644),d=s(9672),p=s(8724),u=s(4456),m=s(1456),g=s(9944),f=s(3460),x=s(5792),j=s(7884);const y={fontSize:"18px",position:"absolute",right:"20px",top:"35px",color:"#0000ff"},v=document.location.href.indexOf("?quick=true")>-1,b=v?{minHeight:"380px",maxHeight:"380px"}:{};class w extends i.PureComponent{constructor(e){super(e),this.showMenu=e=>(0,a._A)(e,this.settingsMenu),this.setUploader=e=>{this.importSettings=e},this.integrate=()=>{const e=this.state.jiraUrl.trim().clearEnd("/").clearEnd("\\");this.tryIntegrate(e).catch((e=>this.$message.error(e.message,"Unknown error"))).finally((()=>this.setState({isLoading:!1})))},this.handleDBError=e=>(this.$message.error("Unable to save the changes. Verify if you have sufficient free space in your drive","Allocation failed"),-1),this.openDashboard=async e=>{if(!(e<=0)){try{await(0,u.WI)("SELF","RELOAD",[],this.$message)}catch(t){console.error("Unable to reload BG Listeners",t)}await this.$settings.set("CurrentUserId",e),this.props.setAuthType?this.props.setAuthType("1"):(this.$jaBrowserExtn.openTab("/index.html"),window.close())}},this.onSettingsImport=()=>{f.wX?this.props.setAuthType("1"):v?(this.$jaBrowserExtn.openTab("/index.html"),window.close()):(0,f.C8)()},this.openInNewTab=()=>this.$jaBrowserExtn.openTab("/index.html"),(0,n.uU)(this,"AjaxService","StorageService","MessageService","SettingsService","AppBrowserService","SessionService","SettingsService","UserService"),this.state={jiraUrl:x.default.settings.defaultIntegratUrl||""},this.init()}async init(){this.settingsMenu=[{label:"Import Settings",icon:"fa fa-upload fs-16 margin-r-5",command:this.importBackup.bind(this)},{label:"Options",icon:"fa fa-cogs fs-16 margin-r-5",command:this.launchOptionsPage.bind(this)},{separator:!0},{label:"Use Jira OAuth",icon:"fa fa-external-link fs-16 margin-r-5",command:this.useOAuth.bind(this)},{label:"Use Basic Auth",icon:"fa fa-user fs-16 margin-r-5",command:()=>this.props.navigate("/integrate/basic/1")}],f.U1&&(this.state.jiraUrl||this.$jaBrowserExtn.getCurrentUrl().then((e=>{const t=this.getJiraRootUrl(e);t&&t.length>20&&t.startsWith("http")&&this.setState({jiraUrl:t})}),console.error))}launchOptionsPage(){this.$jaBrowserExtn.openTab(f.wX?"/options":"/index.html#/options")}importBackup(){this.importSettings&&this.importSettings()}useOAuth(){const e=(0,h._e)({initSource:f.GG,authType:"1"});f.wX||!v?document.location.href=e:(this.$jaBrowserExtn.openTab(e,"JAOAuth2Win"),window.close())}getJiraRootUrl(e){return e.replace(/^(.*\/\/[^/?#]*).*$/,"$1")}async tryIntegrate(e){this.setState({jiraUrl:e}),this.$session.rootUrl=e,this.setState({isLoading:!0});const t=await this.$jaBrowserExtn.requestPermission(null,e);return delete this.$session.userId,this.$ajax.get(l.U.mySelf).then((t=>this.$user.createUser(t,e).then(this.openDashboard,this.handleDBError)),(s=>{if(401===(s=s||{}).status)this.$message.warning("You are not authenticated with Jira to integrate.","Unauthorized");else{var i;const s=null===(i=(0,d.kn)(e))||void 0===i?void 0:i.clearEnd("/");if(s&&s!==e)p.c.yesNo(`"${e}" is not a valid Jira Api base path. Would you like to try with "${s}" instead?`,"Change URL").then((()=>{this.tryIntegrate(s)}));else if(t)this.$message.error("This is not a valid Jira server url or the server does not respond.","Unknown server");else{let e="Permission denied to access this Url. ";f.wX?e+="Try integrating directly from extension using JA icon or manually grant permission and retry.":e+="Manually grant permission and then retry. For more details, visit #214 in GitHub issue tracker.",this.$message.error(e,"Permission Denied")}}})).then((()=>this.setState({isLoading:!1})))}render(){const{integrate:e,state:{jiraUrl:t,isLoading:s}}=this;return(0,j.jsx)("div",{className:"app flex-row align-items-center",style:b,children:(0,j.jsx)("div",{className:"container",children:(0,j.jsx)("div",{className:"row justify-content-center",children:(0,j.jsx)("div",{className:"col-md-6 no-padding no-margin",style:{maxWidth:480,minWidth:460},children:(0,j.jsxs)("div",{className:"card mx-4 no-padding no-margin",children:[(0,j.jsxs)("div",{className:"card-body p-4",children:[(0,j.jsx)(c.c,{onImport:this.onSettingsImport,cleanImport:!0,children:this.setUploader}),(0,j.jsx)(a.SM,{}),(!r.c.isFirefox||!v)&&(0,j.jsx)("span",{className:"fa fa-cogs float-end pointer",style:y,onClick:this.showMenu,onContextMenu:this.showMenu,title:"Click to show more options"}),r.c.isFirefox&&v&&(0,j.jsx)("span",{className:"fa fa-external-link float-end pointer",style:y,onClick:this.openInNewTab,title:"Click to open in new tab and see more integration options"}),(0,j.jsx)("h1",{children:"Jira Assistant"}),(0,j.jsxs)("p",{className:"text-muted",children:[(0,j.jsx)("strong",{children:"Integrate"})," with your Jira account"]}),(0,j.jsxs)("div",{className:"input-group mb-3",children:[(0,j.jsx)("div",{className:"input-group-prepend",children:(0,j.jsx)("span",{className:"input-group-text",children:(0,j.jsx)("i",{className:"fa fa-external-link"})})}),(0,j.jsx)(o.SC,{className:"form-control",value:t,onChange:e=>this.setState({jiraUrl:e}),placeholder:"Jira root url (eg: https://jira.example.com)"})]}),(0,j.jsx)("p",{className:"text-muted",children:"Login to your Jira in current tab or provide the Url of your Jira server to integrate. Ensure you have already been authenticated in Jira before you click on Integrate button."}),(0,j.jsx)(o.q,{type:"primary",className:"btn-block w-100pr",icon:"fa fa-unlock-alt",size:"small",isLoading:s,disabled:!t||s,onClick:e,label:"Integrate"})]}),(0,j.jsx)(m.c,{})]})})})})})}}const S=(0,g.A)(w)}}]);