"use strict";(globalThis.webpackChunkjira_assistant=globalThis.webpackChunkjira_assistant||[]).push([[431],{2812:(e,s,t)=>{t.r(s),t.d(s,{default:()=>J});var i,a,l=t(9950),n=t(8738),d=t.n(n),r=t(9786),o=t(1427),c=t(5006),h=t(394),g=t(2696),u=t(4922),j=t(4190),x=t(8669),p=t(5620),f=t(4414);const m=!1!==r.A.features.header.devUpdates,b=!1!==r.A.features.common.analytics,v=!1!==r.A.features.common.allowWebVersion,y=!1!==(null===(i=r.A.features)||void 0===i||null===(a=i.header)||void 0===a?void 0:a.jiraUpdates);class S extends l.PureComponent{constructor(e){super(e),this.setValue=(e,s,t)=>{let{users:i,intgUsers:a}=this.state;i=[...i];const l=i.indexOf(t);t={...t},i[l]=t,l>0&&(a=[...a],a[l-1]=t),"string"===typeof e&&(e="jiraUrl"===s?e.trim().clearEnd("/"):e.trim()||void 0),t[s]=e,void 0===t[s]&&delete t[s],this.setState({users:i,intgUsers:a})},this.saveSettings=()=>{const{users:e}=this.state;this.$user.saveGlobalSettings(e).then((()=>{this.loadSettings(),this.$message.success("Settings saved successfully. Some changes will reflect only after you refresh the page.")}))},this.toggleDelete=e=>{e.deleted?this.setValue(!1,"deleted",e):x.A.confirmDelete((0,f.jsxs)(f.Fragment,{children:["Are you sure to delete the selected integration? ",(0,f.jsx)("br",{}),(0,f.jsx)("br",{}),"This would also delete all the associated data like local Worklogs, Custom Reports, etc."]}),"Confirm delete integration",void 0,{waitFor:8}).then((()=>this.setValue(!0,"deleted",e)))},(0,c.WQ)(this,"UserService","SettingsService","MessageService"),this.state={users:[],intgUsers:[]}}componentDidMount(){this.loadSettings()}async loadSettings(){let e=await this.$user.getAllUsers();e=await Promise.all(e.map((async e=>{const{id:s,userId:t,jiraUrl:i,email:a,lastLogin:l}=e;return{id:s,userId:t,jiraUrl:i,email:a,lastLogin:l,...await this.$settings.getAllSettings(e.id,u.wh.Advanced)}}))),e[0].useWebVersion=await this.$settings.get("useWebVersion"),this.setState({users:e,intgUsers:e.slice(1)})}render(){const{state:{users:e,intgUsers:s}}=this;return(0,f.jsxs)("div",{className:"global-settings",children:[(0,f.jsxs)(o.ew,{children:[(0,f.jsx)("caption",{children:"Advanced settings"}),(0,f.jsxs)(o.D1,{children:[(0,f.jsxs)(o.lO,{children:[(0,f.jsx)(o.VP,{rowSpan:2,children:"Settings"}),(0,f.jsx)(o.VP,{colSpan:e.length,children:"Instances"})]}),(0,f.jsxs)(o.lO,{children:[(0,f.jsx)(o.VP,{children:"Default"}),s.map((e=>(0,f.jsxs)(o.VP,{children:[(0,h.UW)(e.jiraUrl),!p.mx&&(0,f.jsx)("span",{className:d()("fa float-end delete-account",e.deleted?"fa-undo":"fa-trash"),title:e.deleted?"Undo delete":"Delete this integration",onClick:()=>this.toggleDelete(e)})]},e.id)))]})]}),(0,f.jsxs)(o.vc,{children:[(0,f.jsxs)(o.lO,{children:[(0,f.jsx)("td",{children:"Integrated on"}),(0,f.jsx)("td",{children:"N/A"}),s.map((e=>(0,f.jsx)("td",{children:e.lastLogin.format("dd-MMM-yyyy HH:mm:ss")},e.id)))]}),(0,f.jsxs)(o.lO,{children:[(0,f.jsx)("td",{children:"Jira Server Url"}),(0,f.jsx)("td",{children:"N/A"}),s.map((e=>{var s;return(0,f.jsx)("td",{children:(0,f.jsx)(g.fI,{placeholder:"e.g. https://jira.companysite.com",value:null===(s=e.jiraUrl)||void 0===s?void 0:s.toString(),args:e,field:"jiraUrl",onChange:this.setValue,disabled:e.deleted})},e.id)}))]}),(0,f.jsxs)(o.lO,{children:[(0,f.jsx)("td",{children:"Jira User id"}),(0,f.jsx)("td",{children:"N/A"}),s.map((e=>(0,f.jsx)("td",{children:(0,f.jsx)(g.fI,{placeholder:"User id of Jira",value:e.userId,args:e,field:"userId",onChange:this.setValue,disabled:e.deleted})},e.id)))]}),(0,f.jsxs)(o.lO,{children:[(0,f.jsx)("td",{children:"Email id"}),(0,f.jsx)("td",{children:"N/A"}),s.map((e=>(0,f.jsx)("td",{children:(0,f.jsx)(g.fI,{placeholder:"Email id of Jira",value:e.email,args:e,field:"email",onChange:this.setValue,disabled:e.deleted})},e.id)))]}),(0,f.jsxs)(o.lO,{children:[(0,f.jsx)("td",{children:"Open tickets JQL"}),e.map((e=>(0,f.jsx)("td",{children:(0,f.jsx)(g.fI,{multiline:!0,placeholder:u.L6.openTicketsJQL,readOnly:e.id===j.gq,value:e.id===j.gq?u.L6.openTicketsJQL:e.openTicketsJQL||"",args:e,field:"openTicketsJQL",onChange:this.setValue,disabled:e.deleted})},e.id)))]}),(0,f.jsxs)(o.lO,{children:[(0,f.jsx)("td",{children:"Ticket suggestions JQL"}),(0,f.jsx)("td",{children:"N/A"}),s.map((e=>(0,f.jsx)("td",{children:(0,f.jsx)(g.fI,{multiline:!0,placeholder:"Provide custom JQL used to filter issues for picker",value:e.suggestionJQL||"",args:e,field:"suggestionJQL",onChange:this.setValue,disabled:e.deleted})},e.id)))]}),y&&(0,f.jsxs)(o.lO,{children:[(0,f.jsx)("td",{children:"Disable Jira issue updates"}),e.map((e=>(0,f.jsx)("td",{children:(0,f.jsx)(g.Sc,{checked:e.disableJiraUpdates,args:e,field:"disableJiraUpdates",onChange:this.setValue,disabled:e.deleted,label:"Disable Jira issue updates",title:"Do not show updates about changes for any issues happend in Jira"})},e.id)))]}),y&&(0,f.jsxs)(o.lO,{children:[(0,f.jsx)("td",{children:"Jira updates JQL (used to fetch updates from Jira)"}),e.map((e=>(0,f.jsx)("td",{children:(0,f.jsx)(g.fI,{multiline:!0,placeholder:u.L6.jiraUpdatesJQL,readOnly:e.id===j.gq,disabled:e.disableJiraUpdates||e.deleted,value:e.id===j.gq?u.L6.jiraUpdatesJQL:e.jiraUpdatesJQL||"",args:e,field:"jiraUpdatesJQL",onChange:this.setValue})},e.id)))]}),v&&!!e[0]&&(0,f.jsxs)(o.lO,{children:[(0,f.jsx)("td",{children:"Use Jira Assistant Web version"}),(0,f.jsx)("td",{colSpan:s.length+1,children:(0,f.jsx)(g.Sc,{checked:e[0].useWebVersion,args:e[0],field:"useWebVersion",onChange:this.setValue,label:"Opt to always use Web build with latest updates and fixes"})})]}),b&&!!e[0]&&(0,f.jsxs)(o.lO,{children:[(0,f.jsx)("td",{children:"Enable tracking user actions (Anonymous, Google Analytics)"}),(0,f.jsx)("td",{colSpan:s.length+1,children:(0,f.jsx)(g.Sc,{checked:!1!==e[0].enableAnalyticsLogging,args:e[0],field:"enableAnalyticsLogging",onChange:this.setValue,label:"Help developers to identify what features are being used much"})})]}),b&&!!e[0]&&(0,f.jsxs)(o.lO,{children:[(0,f.jsx)("td",{children:"Enable tracking exceptions (Anonymous)"}),(0,f.jsx)("td",{colSpan:s.length+1,children:(0,f.jsx)(g.Sc,{checked:!1!==e[0].enableExceptionLogging,args:e[0],field:"enableExceptionLogging",onChange:this.setValue,label:"Help developers to identify what errors occur for users and would help in fixing it soon"})})]}),m&&!!e[0]&&(0,f.jsxs)(o.lO,{children:[(0,f.jsx)("td",{children:"Disable notifications from developer"}),(0,f.jsx)("td",{colSpan:s.length+1,children:(0,f.jsx)(g.Sc,{checked:e[0].disableDevNotification,args:e[0],field:"disableDevNotification",onChange:this.setValue,label:"Do not show important information's and bug notifications from developer"})})]})]})]}),(0,f.jsxs)("div",{className:"footer",children:[(0,f.jsx)(g.$n,{className:"float-end",icon:"fa fa-save",label:"Save settings",type:"primary",onClick:this.saveSettings}),(0,f.jsx)("strong",{children:"Important Note:"}),(0,f.jsxs)("ul",{children:[(0,f.jsx)("li",{children:"In the table, the JQL under the 1st (Default) column is non-editable and serves as default information. You can modify the JQL for each integration, starting from the second column onward."}),(0,f.jsx)("li",{children:"Changing these settings may have consequences for application stability or data integrity. Please exercise caution when making adjustments."}),(0,f.jsx)("li",{children:"Some settings may require a refresh or reopening of Jira Assistant to take effect."})]})]})]})}}const J=S}}]);