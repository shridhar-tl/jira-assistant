"use strict";(globalThis.webpackChunkjira_assistant=globalThis.webpackChunkjira_assistant||[]).push([[680,62],{3712:(e,t,s)=>{s.d(t,{ou:()=>x,iA:()=>g,_e:()=>h,gP:()=>p,mE:()=>u,qm:()=>m});var i=s(9584),n=s(6736),a=s.n(n),l=s(8384),r=s(7884);const o=(0,i.createContext)({}),d="sortChanged",c="dataChanged";class h extends i.PureComponent{constructor(e){super(e),this.sharedProps={getData:()=>this.state.dataset,sortBy:e=>{let{isDesc:t}=this.state;if(t=e===this.state.sortBy&&!t,!e)return this.state.sortBy;{let{dataset:s}=this.state;if(s){let i=!1;this.props.onSort&&(i=this.props.onSort(e,t)),i||(s=s.sortBy(e,t),this.setState({dataset:s,sortBy:e,isDesc:t}),this.eventEmitter.emit(d,e,t))}}},getSortedField:()=>{const{sortBy:e,isDesc:t}=this.state;return{sortBy:e,isDesc:t}},onDataChanged:e=>(this.eventEmitter.on(c,e),()=>this.eventEmitter.off(c,e)),onSortFieldChanged:e=>(this.eventEmitter.on(d,e),()=>this.eventEmitter.off(d,e)),getScrollTop:()=>{var e;return(null===(e=this.container)||void 0===e?void 0:e.scrollTop)||0}},this.setContainer=e=>this.container=e,this.eventEmitter=new l.EventEmitter,this.eventEmitter.setMaxListeners(400),this.actualDataset=e.dataset,this.state={dataset:e.dataset,sortBy:e.sortBy,isDesc:e.isDesc}}UNSAFE_componentWillReceiveProps(e){const{dataset:t,sortBy:s,isDesc:i}=e;t!==this.actualDataset&&(this.actualDataset=t,this.setState({dataset:t,sortBy:s,isDesc:i}),this.eventEmitter.emit(c,e.dataset)),s===this.state.sortBy&&i===this.state.isDesc||(this.setState({dataset:t,sortBy:s,isDesc:i}),this.eventEmitter.emit(d,s,i))}render(){const{className:e,style:t,children:s,exportable:i,exportSheetName:n,height:l}=this.props;return(0,r.jsx)("div",{className:a()("scroll-table-container",e),style:{height:l},ref:this.setContainer,children:(0,r.jsx)(o.Provider,{value:this.sharedProps,children:(0,r.jsx)("table",{ref:e=>this.table=e,"export-sheet-name":n,className:a()("scroll-table",e,!1!==i?"exportable":null),style:t,children:s})})})}}class u extends i.PureComponent{constructor(...e){super(...e),this.state={},this.setRef=e=>this.el=e}componentDidMount(){this.componentDidUpdate()}componentDidUpdate(){this.el.querySelectorAll("tr:not(:first-child)").forEach(((e,t)=>{const s=e.querySelectorAll("th");this.setScrollTop(s,31*(t+1))}))}setScrollTop(e,t){const s=this.context.getScrollTop();console.log("scroll top is ",s),e.forEach((e=>{const i=e.offsetTop&&s&&e.offsetTop>s?e.offsetTop-s:e.offsetTop;e.style.top=`${i||t}px`}))}render(){const{className:e,style:t,children:s}=this.props;return(0,r.jsx)("thead",{ref:this.setRef,className:e,style:t,children:s})}}u.contextType=o;class p extends i.PureComponent{componentDidMount(){this.cleanup=this.context.onSortFieldChanged(((e,t)=>{this.setState({sortBy:e,isDesc:t})}))}componentWillUnmount(){this.cleanup()}render(){const{children:e,className:t,style:s}=this.props,i=this.context.getData();let n=null;return i&&0===i.length?null:(n="function"===typeof e?i&&i.length>0&&i.map(e):e,(0,r.jsx)("tbody",{className:t,style:s,children:n}))}}p.contextType=o;class g extends i.PureComponent{constructor(...e){super(...e),this.state={hasRows:!1}}componentDidMount(){const e=this.context.getData();this.setState({hasRows:!(!e||!e.length)}),this.cleanup=this.context.onDataChanged((e=>this.setState({hasRows:!(!e||!e.length)})))}componentWillUnmount(){this.cleanup()}render(){if(this.state.hasRows)return null;const{children:e,span:t}=this.props;return(0,r.jsx)("tbody",{children:(0,r.jsx)("tr",{children:(0,r.jsx)("td",{colSpan:t,children:e})})})}}g.contextType=o;class m extends i.PureComponent{render(){return(0,r.jsx)("tr",{...this.props})}}m.contextType=o;class x extends i.PureComponent{constructor(...e){super(...e),this.state={},this.onClick=e=>{this.context.sortBy(this.props.sortBy)}}componentDidMount(){this.setState(this.context.getSortedField()),this.cleanup=this.context.onSortFieldChanged(((e,t)=>{this.setState({sortBy:e,isDesc:t})}))}componentWillUnmount(){this.cleanup()}render(){const{sortBy:e,isDesc:t}=this.state,{style:s,sortBy:i,children:n,noExport:a,rowSpan:l,colSpan:o,dragConnector:d}=this.props;let{className:c}=this.props;return c||(c=""),i&&(c+=" sortable"),(0,r.jsxs)("th",{ref:d,className:c,style:s,onClick:this.onClick,"no-export":a?"true":null,rowSpan:l,colSpan:o,children:[n," ",i?i===e?(0,r.jsx)("i",{className:"fa fa-sort-"+(t?"desc":"asc")}):(0,r.jsx)("i",{className:"fa fa-sort"}):null]})}}x.contextType=o},6680:(e,t,s)=>{s.r(t),s.d(t,{default:()=>C});var i,n,a=s(9584),l=s(6736),r=s.n(l),o=s(5792),d=s(3712),c=s(4324),h=s(9672),u=s(9640),p=s(4568),g=s(9532),m=s(8724),x=s(3460),j=s(7884);const f=!1!==o.default.features.header.devUpdates,y=!1!==o.default.features.common.analytics,S=!1!==o.default.features.common.allowWebVersion,v=!1!==(null===(i=o.default.features)||void 0===i||null===(n=i.header)||void 0===n?void 0:n.jiraUpdates);class b extends a.PureComponent{constructor(e){super(e),this.setValue=(e,t,s)=>{let{users:i,intgUsers:n}=this.state;i=[...i];const a=i.indexOf(s);s={...s},i[a]=s,a>0&&(n=[...n],n[a-1]=s),"string"===typeof e&&(e="jiraUrl"===t?e.trim().clearEnd("/"):e.trim()||void 0),s[t]=e,void 0===s[t]&&delete s[t],this.setState({users:i,intgUsers:n})},this.saveSettings=()=>{const{users:e}=this.state;this.$user.saveGlobalSettings(e).then((()=>{this.loadSettings(),this.$message.success("Settings saved successfully. Some changes will reflect only after you refresh the page.")}))},this.toggleDelete=e=>{e.deleted?this.setValue(!1,"deleted",e):m.c.confirmDelete((0,j.jsxs)(j.Fragment,{children:["Are you sure to delete the selected integration? ",(0,j.jsx)("br",{}),(0,j.jsx)("br",{}),"This would also delete all the associated data like local Worklogs, Custom Reports, etc."]}),"Confirm delete integration",void 0,{waitFor:8}).then((()=>this.setValue(!0,"deleted",e)))},(0,c.uU)(this,"UserService","SettingsService","MessageService"),this.state={users:[],intgUsers:[]}}componentDidMount(){this.loadSettings()}async loadSettings(){let e=await this.$user.getAllUsers();e=await Promise.all(e.map((async e=>{const{id:t,userId:s,jiraUrl:i,email:n,lastLogin:a}=e;return{id:t,userId:s,jiraUrl:i,email:n,lastLogin:a,...await this.$settings.getAllSettings(e.id,p.sV.Advanced)}}))),e[0].useWebVersion=await this.$settings.get("useWebVersion"),this.setState({users:e,intgUsers:e.slice(1)})}render(){const{state:{users:e,intgUsers:t}}=this;return(0,j.jsxs)("div",{className:"global-settings",children:[(0,j.jsxs)(d._e,{children:[(0,j.jsx)("caption",{children:"Advanced settings"}),(0,j.jsxs)(d.mE,{children:[(0,j.jsxs)(d.qm,{children:[(0,j.jsx)(d.ou,{rowSpan:2,children:"Settings"}),(0,j.jsx)(d.ou,{colSpan:e.length,children:"Instances"})]}),(0,j.jsxs)(d.qm,{children:[(0,j.jsx)(d.ou,{children:"Default"}),t.map((e=>(0,j.jsxs)(d.ou,{children:[(0,h.Sy)(e.jiraUrl),!x.q8&&(0,j.jsx)("span",{className:r()("fa float-end delete-account",e.deleted?"fa-undo":"fa-trash"),title:e.deleted?"Undo delete":"Delete this integration",onClick:()=>this.toggleDelete(e)})]},e.id)))]})]}),(0,j.jsxs)(d.gP,{children:[(0,j.jsxs)(d.qm,{children:[(0,j.jsx)("td",{children:"Integrated on"}),(0,j.jsx)("td",{children:"N/A"}),t.map((e=>(0,j.jsx)("td",{children:e.lastLogin.format("dd-MMM-yyyy HH:mm:ss")},e.id)))]}),(0,j.jsxs)(d.qm,{children:[(0,j.jsx)("td",{children:"Jira Server Url"}),(0,j.jsx)("td",{children:"N/A"}),t.map((e=>{var t;return(0,j.jsx)("td",{children:(0,j.jsx)(u.SC,{placeholder:"e.g. https://jira.companysite.com",value:null===(t=e.jiraUrl)||void 0===t?void 0:t.toString(),args:e,field:"jiraUrl",onChange:this.setValue,disabled:e.deleted})},e.id)}))]}),(0,j.jsxs)(d.qm,{children:[(0,j.jsx)("td",{children:"Jira User id"}),(0,j.jsx)("td",{children:"N/A"}),t.map((e=>(0,j.jsx)("td",{children:(0,j.jsx)(u.SC,{placeholder:"User id of Jira",value:e.userId,args:e,field:"userId",onChange:this.setValue,disabled:e.deleted})},e.id)))]}),(0,j.jsxs)(d.qm,{children:[(0,j.jsx)("td",{children:"Email id"}),(0,j.jsx)("td",{children:"N/A"}),t.map((e=>(0,j.jsx)("td",{children:(0,j.jsx)(u.SC,{placeholder:"Email id of Jira",value:e.email,args:e,field:"email",onChange:this.setValue,disabled:e.deleted})},e.id)))]}),(0,j.jsxs)(d.qm,{children:[(0,j.jsx)("td",{children:"Open tickets JQL"}),e.map((e=>(0,j.jsx)("td",{children:(0,j.jsx)(u.SC,{multiline:!0,placeholder:p.yu.openTicketsJQL,readOnly:e.id===g.uU,value:e.id===g.uU?p.yu.openTicketsJQL:e.openTicketsJQL||"",args:e,field:"openTicketsJQL",onChange:this.setValue,disabled:e.deleted})},e.id)))]}),(0,j.jsxs)(d.qm,{children:[(0,j.jsx)("td",{children:"Ticket suggestions JQL"}),(0,j.jsx)("td",{children:"N/A"}),t.map((e=>(0,j.jsx)("td",{children:(0,j.jsx)(u.SC,{multiline:!0,placeholder:"Provide custom JQL used to filter issues for picker",value:e.suggestionJQL||"",args:e,field:"suggestionJQL",onChange:this.setValue,disabled:e.deleted})},e.id)))]}),v&&(0,j.jsxs)(d.qm,{children:[(0,j.jsx)("td",{children:"Disable Jira issue updates"}),e.map((e=>(0,j.jsx)("td",{children:(0,j.jsx)(u.yw,{checked:e.disableJiraUpdates,args:e,field:"disableJiraUpdates",onChange:this.setValue,disabled:e.deleted,label:"Disable Jira issue updates",title:"Do not show updates about changes for any issues happend in Jira"})},e.id)))]}),v&&(0,j.jsxs)(d.qm,{children:[(0,j.jsx)("td",{children:"Jira updates JQL (used to fetch updates from Jira)"}),e.map((e=>(0,j.jsx)("td",{children:(0,j.jsx)(u.SC,{multiline:!0,placeholder:p.yu.jiraUpdatesJQL,readOnly:e.id===g.uU,disabled:e.disableJiraUpdates||e.deleted,value:e.id===g.uU?p.yu.jiraUpdatesJQL:e.jiraUpdatesJQL||"",args:e,field:"jiraUpdatesJQL",onChange:this.setValue})},e.id)))]}),S&&!!e[0]&&(0,j.jsxs)(d.qm,{children:[(0,j.jsx)("td",{children:"Use Jira Assistant Web version"}),(0,j.jsx)("td",{colSpan:t.length+1,children:(0,j.jsx)(u.yw,{checked:e[0].useWebVersion,args:e[0],field:"useWebVersion",onChange:this.setValue,label:"Opt to always use Web build with latest updates and fixes"})})]}),y&&!!e[0]&&(0,j.jsxs)(d.qm,{children:[(0,j.jsx)("td",{children:"Enable tracking user actions (Anonymous, Google Analytics)"}),(0,j.jsx)("td",{colSpan:t.length+1,children:(0,j.jsx)(u.yw,{checked:!1!==e[0].enableAnalyticsLogging,args:e[0],field:"enableAnalyticsLogging",onChange:this.setValue,label:"Help developers to identify what features are being used much"})})]}),y&&!!e[0]&&(0,j.jsxs)(d.qm,{children:[(0,j.jsx)("td",{children:"Enable tracking exceptions (Anonymous)"}),(0,j.jsx)("td",{colSpan:t.length+1,children:(0,j.jsx)(u.yw,{checked:!1!==e[0].enableExceptionLogging,args:e[0],field:"enableExceptionLogging",onChange:this.setValue,label:"Help developers to identify what errors occur for users and would help in fixing it soon"})})]}),f&&!!e[0]&&(0,j.jsxs)(d.qm,{children:[(0,j.jsx)("td",{children:"Disable notifications from developer"}),(0,j.jsx)("td",{colSpan:t.length+1,children:(0,j.jsx)(u.yw,{checked:e[0].disableDevNotification,args:e[0],field:"disableDevNotification",onChange:this.setValue,label:"Do not show important information's and bug notifications from developer"})})]})]})]}),(0,j.jsxs)("div",{className:"footer",children:[(0,j.jsx)(u.q,{className:"float-end",icon:"fa fa-save",label:"Save settings",type:"primary",onClick:this.saveSettings}),(0,j.jsx)("strong",{children:"Important Note:"}),(0,j.jsxs)("ul",{children:[(0,j.jsx)("li",{children:"In the table, the JQL under the 1st (Default) column is non-editable and serves as default information. You can modify the JQL for each integration, starting from the second column onward."}),(0,j.jsx)("li",{children:"Changing these settings may have consequences for application stability or data integrity. Please exercise caution when making adjustments."}),(0,j.jsx)("li",{children:"Some settings may require a refresh or reopening of Jira Assistant to take effect."})]})]})]})}}const C=b}}]);