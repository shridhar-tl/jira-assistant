"use strict";(globalThis.webpackChunkjira_assistant=globalThis.webpackChunkjira_assistant||[]).push([[514],{119:(e,s,t)=>{t.r(s),t.d(s,{default:()=>U});var i,l,a=t(7313),n=t(6123),d=t.n(n),r=t(3860),o=t(1329),c=t(6310),h=t(2805),g=t(2725),u=t(6444),j=t(232),x=t(6552),p=t(9149),f=t(6417);const m=!1!==r.Z.features.header.devUpdates,b=!1!==r.Z.features.common.analytics,v=!1!==r.Z.features.common.allowWebVersion,y=!1!==(null===(i=r.Z.features)||void 0===i||null===(l=i.header)||void 0===l?void 0:l.jiraUpdates);class J extends a.PureComponent{constructor(e){super(e),this.setValue=(e,s,t)=>{let{users:i,intgUsers:l}=this.state;i=[...i];const a=i.indexOf(t);t={...t},i[a]=t,a>0&&(l=[...l],l[a-1]=t),"string"===typeof e&&(e="jiraUrl"===s?e.trim().clearEnd("/"):e.trim()||void 0),t[s]=e,void 0===t[s]&&delete t[s],this.setState({users:i,intgUsers:l})},this.saveSettings=()=>{const{users:e}=this.state;this.$user.saveGlobalSettings(e).then((()=>{this.loadSettings(),this.$message.success("Settings saved successfully. Some changes will reflect only after you refresh the page.")}))},this.toggleDelete=e=>{e.deleted?this.setValue(!1,"deleted",e):x.Z.confirmDelete((0,f.jsxs)(f.Fragment,{children:["Are you sure to delete the selected integration? ",(0,f.jsx)("br",{}),(0,f.jsx)("br",{}),"This would also delete all the associated data like local Worklogs, Custom Reports, etc."]}),"Confirm delete integration",void 0,{waitFor:8}).then((()=>this.setValue(!0,"deleted",e)))},(0,c.f3)(this,"UserService","SettingsService","MessageService"),this.state={users:[],intgUsers:[]}}componentDidMount(){this.loadSettings()}async loadSettings(){let e=await this.$user.getAllUsers();e=await Promise.all(e.map((async e=>{const{id:s,userId:t,jiraUrl:i,email:l,lastLogin:a}=e;return{id:s,userId:t,jiraUrl:i,email:l,lastLogin:a,...await this.$settings.getAllSettings(e.id,u.Jp.Advanced)}}))),e[0].useWebVersion=await this.$settings.get("useWebVersion"),this.setState({users:e,intgUsers:e.slice(1)})}render(){const{state:{users:e,intgUsers:s}}=this;return(0,f.jsxs)("div",{className:"global-settings",children:[(0,f.jsxs)(o.TT,{children:[(0,f.jsx)("caption",{children:"Advanced settings"}),(0,f.jsxs)(o.Et,{children:[(0,f.jsxs)(o.lE,{children:[(0,f.jsx)(o.sg,{rowSpan:2,children:"Settings"}),(0,f.jsx)(o.sg,{colSpan:e.length,children:"Instances"})]}),(0,f.jsxs)(o.lE,{children:[(0,f.jsx)(o.sg,{children:"Default"}),s.map((e=>(0,f.jsxs)(o.sg,{children:[(0,h._P)(e.jiraUrl),!p.KX&&(0,f.jsx)("span",{className:d()("fa pull-right delete-account",e.deleted?"fa-undo":"fa-trash"),title:e.deleted?"Undo delete":"Delete this integration",onClick:()=>this.toggleDelete(e)})]},e.id)))]})]}),(0,f.jsxs)(o.XP,{children:[(0,f.jsxs)(o.lE,{children:[(0,f.jsx)("td",{children:"Integrated on"}),(0,f.jsx)("td",{children:"N/A"}),s.map((e=>(0,f.jsx)("td",{children:e.lastLogin.format("dd-MMM-yyyy HH:mm:ss")},e.id)))]}),(0,f.jsxs)(o.lE,{children:[(0,f.jsx)("td",{children:"Jira Server Url"}),(0,f.jsx)("td",{children:"N/A"}),s.map((e=>{var s;return(0,f.jsx)("td",{children:(0,f.jsx)(g.zC,{placeholder:"e.g. https://jira.companysite.com",value:null===(s=e.jiraUrl)||void 0===s?void 0:s.toString(),args:e,field:"jiraUrl",onChange:this.setValue,disabled:e.deleted})},e.id)}))]}),(0,f.jsxs)(o.lE,{children:[(0,f.jsx)("td",{children:"Jira User id"}),(0,f.jsx)("td",{children:"N/A"}),s.map((e=>(0,f.jsx)("td",{children:(0,f.jsx)(g.zC,{placeholder:"User id of Jira",value:e.userId,args:e,field:"userId",onChange:this.setValue,disabled:e.deleted})},e.id)))]}),(0,f.jsxs)(o.lE,{children:[(0,f.jsx)("td",{children:"Email id"}),(0,f.jsx)("td",{children:"N/A"}),s.map((e=>(0,f.jsx)("td",{children:(0,f.jsx)(g.zC,{placeholder:"Email id of Jira",value:e.email,args:e,field:"email",onChange:this.setValue,disabled:e.deleted})},e.id)))]}),(0,f.jsxs)(o.lE,{children:[(0,f.jsx)("td",{children:"Open tickets JQL"}),e.map((e=>(0,f.jsx)("td",{children:(0,f.jsx)(g.zC,{multiline:!0,placeholder:u.he.openTicketsJQL,readOnly:e.id===j.rH,value:e.id===j.rH?u.he.openTicketsJQL:e.openTicketsJQL||"",args:e,field:"openTicketsJQL",onChange:this.setValue,disabled:e.deleted})},e.id)))]}),(0,f.jsxs)(o.lE,{children:[(0,f.jsx)("td",{children:"Ticket suggestions JQL"}),(0,f.jsx)("td",{children:"N/A"}),s.map((e=>(0,f.jsx)("td",{children:(0,f.jsx)(g.zC,{multiline:!0,placeholder:"Provide custom JQL used to filter issues for picker",value:e.suggestionJQL||"",args:e,field:"suggestionJQL",onChange:this.setValue,disabled:e.deleted})},e.id)))]}),y&&(0,f.jsxs)(o.lE,{children:[(0,f.jsx)("td",{children:"Disable Jira issue updates"}),e.map((e=>(0,f.jsx)("td",{children:(0,f.jsx)(g.XZ,{checked:e.disableJiraUpdates,args:e,field:"disableJiraUpdates",onChange:this.setValue,disabled:e.deleted,label:"Disable Jira issue updates",title:"Do not show updates about changes for any issues happend in Jira"})},e.id)))]}),y&&(0,f.jsxs)(o.lE,{children:[(0,f.jsx)("td",{children:"Jira updates JQL (used to fetch updates from Jira)"}),e.map((e=>(0,f.jsx)("td",{children:(0,f.jsx)(g.zC,{multiline:!0,placeholder:u.he.jiraUpdatesJQL,readOnly:e.id===j.rH,disabled:e.disableJiraUpdates||e.deleted,value:e.id===j.rH?u.he.jiraUpdatesJQL:e.jiraUpdatesJQL||"",args:e,field:"jiraUpdatesJQL",onChange:this.setValue})},e.id)))]}),v&&!!e[0]&&(0,f.jsxs)(o.lE,{children:[(0,f.jsx)("td",{children:"Use Jira Assistant Web version"}),(0,f.jsx)("td",{colSpan:s.length+1,children:(0,f.jsx)(g.XZ,{checked:e[0].useWebVersion,args:e[0],field:"useWebVersion",onChange:this.setValue,label:"Opt to always use Web build with latest updates and fixes"})})]}),b&&!!e[0]&&(0,f.jsxs)(o.lE,{children:[(0,f.jsx)("td",{children:"Enable tracking user actions (Anynmous, Google Analytics)"}),(0,f.jsx)("td",{colSpan:s.length+1,children:(0,f.jsx)(g.XZ,{checked:!1!==e[0].enableAnalyticsLogging,args:e[0],field:"enableAnalyticsLogging",onChange:this.setValue,label:"Help developers to identify what features are being used much"})})]}),b&&!!e[0]&&(0,f.jsxs)(o.lE,{children:[(0,f.jsx)("td",{children:"Enable tracking exceptions (Anynmous)"}),(0,f.jsx)("td",{colSpan:s.length+1,children:(0,f.jsx)(g.XZ,{checked:!1!==e[0].enableExceptionLogging,args:e[0],field:"enableExceptionLogging",onChange:this.setValue,label:"Help developers to identify what errors occur for users and would help in fixing it soon"})})]}),m&&!!e[0]&&(0,f.jsxs)(o.lE,{children:[(0,f.jsx)("td",{children:"Disable notifications from developer"}),(0,f.jsx)("td",{colSpan:s.length+1,children:(0,f.jsx)(g.XZ,{checked:e[0].disableDevNotification,args:e[0],field:"disableDevNotification",onChange:this.setValue,label:"Do not show important informations and bug notifications from developer"})})]})]})]}),(0,f.jsxs)("div",{className:"footer",children:[(0,f.jsx)(g.zx,{className:"pull-right",icon:"fa fa-save",label:"Save settings",type:"success",onClick:this.saveSettings}),(0,f.jsx)("strong",{children:"Note:"}),(0,f.jsx)("br",{}),"Changing these settings may cause application stability issues or lose in data. Be cautious with the changes you make.",(0,f.jsx)("br",{}),"Some settings would take effect only once you refresh/reopen Jira Assistant."]})]})}}const U=J}}]);