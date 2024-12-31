"use strict";(globalThis.webpackChunkjira_assistant=globalThis.webpackChunkjira_assistant||[]).push([[151],{6328:(e,t,s)=>{s.d(t,{A:()=>n});s(9950);var i=s(640),r=s(6778),a=s(4414);class o extends i.A{constructor(e){super(e,"Save Report As"),this.nameChanged=e=>this.setState({newQueryName:e}),this.copyChanged=e=>this.setState({copyQuery:e}),this.done=()=>{const{newQueryName:e,copyQuery:t}=this.state;this.props.onChange(e,t)},this.style={width:"350px"},this.state={showDialog:!0,newQueryName:e.queryName||"",copyQuery:!1}}getFooter(){const{state:{newQueryName:e}}=this;return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(r.$n,{text:!0,type:"secondary",label:"Cancel",onClick:this.onHide}),(0,a.jsx)(r.$n,{type:"primary",icon:"fa fa-save",label:"Save",disabled:!e||e.length<3,onClick:this.done})]})}render(){const{props:{allowCopy:e},state:{newQueryName:t,copyQuery:s}}=this;return super.renderBase((0,a.jsxs)("div",{className:"pad-15",children:[(0,a.jsx)("label",{children:"Report Name"}),(0,a.jsx)("div",{children:(0,a.jsx)(r.fI,{value:t,onChange:this.nameChanged,style:{width:"100%"}})}),e&&(0,a.jsx)("div",{children:(0,a.jsx)(r.Sc,{checked:s,onChange:this.copyChanged,label:"Save as new report"})})]}))}}const n=o},9151:(e,t,s)=>{s.r(t),s.d(t,{default:()=>q});var i=s(9950),r=s(8874),a=s(2591),o=s(8855),n=s(6778),l=s(1427),d=s(4414);class p extends i.PureComponent{constructor(){super(),this.displayFieldAdded=e=>{e&&!e.items&&this.props.onChange(e,this.jiraFields[e])},(0,r.WQ)(this,"JiraService","MessageService","AnalyticsService"),this.state={fields:[]},this.loadCustomFields()}async loadCustomFields(){const e=await this.$jira.getCustomFields(),t={};this.jiraFields=t;let s=[],i=[];for(const r of e)r.label=r.name+(r.name.toLowerCase()!==r.id.toLowerCase()?` (${r.id})`:""),r.value=r.id,t[r.id]=r,r.custom?i.push(r):s.push(r);s=s.orderBy((e=>e.name)),i=i.orderBy((e=>e.name)),this.setState({fields:[{label:"Basic Fields",items:s},{label:"Custom Fields",items:i}]})}render(){const{fields:e}=this.state;return(0,d.jsxs)(n.aL,{dataset:e,value:"",style:{width:"100%"},placeholder:"Choose a column to add to the list",group:!0,displayField:"name",valueField:"id",dataKey:"id",filterPlaceholder:"Type the field name to filter",onChange:this.displayFieldAdded,children:[e=>(0,d.jsx)("span",{children:e.name}),e=>(0,d.jsx)("strong",{children:e.label})]})}}const h=p;var c=s(2122);function u(e,t){const s={};switch(e){case"user":case"parent":case"thumbnail":case"statusCategory":case"project":case"resolution":case"issuetype":case"watches":case"priority":case"status":case"progress":case"timetracking":case"votes":s.knownObj=!0;case"string":case"date":case"datetime":case"issuerestriction":case"option":s.type=e;break;default:s.type=t}return s}var y=s(8615);class f extends i.PureComponent{constructor(...e){super(...e),this.state={expression:""},this.fieldAdded=(e,t)=>{const{fields:s,onChange:i}=this.props;i(s.concat(function(e){const{id:t,name:s,custom:i,schema:{system:r,items:a,custom:o,type:n=(i?"(Unsupported)":t)}={}}=e,l={id:c.kk.generate(),field:t,name:s,custom:i,type:n};if("issuekey"===t)return l.type="string",l;switch(n){case"comments-page":case"securitylevel":l.knownObj=!0,l.type=r;break;case"option-with-child":l.type=n;break;case"number":switch(r){case"timeoriginalestimate":case"aggregatetimespent":case"aggregatetimeoriginalestimate":case"timespent":case"timeestimate":case"aggregatetimeestimate":l.type="seconds";break;case"workratio":l.type=r;break;default:l.type=n}break;case"array":if(l.isArray=!0,e.custom)if("numeric"===a)l.type=a;else if("json"===a&&(null===o||void 0===o?void 0:o.indexOf("sprint"))>-1)l.type="sprint";else{const{type:e,knownObj:t}=u(a,o);l.type=e,l.knownObj=t}else switch(r){case"versions":case"fixVersions":case"attachment":case"components":case"issuelinks":case"subtasks":l.knownObj=!0,l.type=a||r;break;case"worklog":l.type=a||r,l.isArray=!1;break;case"labels":l.type=a||r;break;default:l.type=JSON.stringify(e)}break;default:const{type:t,knownObj:s}=u(n,null);t?(l.type=t,l.knownObj=s):(null===o||void 0===o?void 0:o.indexOf("epic-link"))>-1?l.type="epicLink":i&&(l.type=o)}return l}(t)))},this.removeField=e=>{const{fields:t,onChange:s}=this.props;s(t.filter(((t,s)=>s!==e)))},this.headerChanged=(e,t)=>{let{fields:s}=this.props;s=[...s];let i=s[t];i={...i},s[t]=i,i.header=e,this.props.onChange(s)},this.editExpression=e=>{let{fields:t}=this.props,s=t[e];const i=s.expr||"";this.setState({expression:i}),y.A.alert((0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(n.fI,{className:"expr-editor",multiline:!0,placeholder:"Provide JavaScript expression (e.g. this.name or this - Fields.timespent + Fields.aggregatetimespent)",value:i,onChange:e=>this.setState({expression:e})}),(0,d.jsx)("span",{children:'Provide JavaScript expression to print a value. You can use "this" to refer to the current field and "Fields" variable to refer to the object containing all the fields.'})]}),"Edit Expression",{width:"600px"}).then((()=>{const{expression:i}=this.state;(i||"")!==(s.expr||"")&&(s={...s},s.expr=this.state.expression,s.expr||delete s.expr,t=[...t],t[e]=s,this.props.onChange(t))}))},this.toggleDisplay=(e,t)=>{let{fields:s}=this.props;s=[...s],s[e]={...s[e],hide:t},this.props.onChange(s)},this.getControls=(e,t,{draggable:{dragRef:s},droppable:{dropRef:i}})=>(0,d.jsx)(m,{dragHandle:s,dropConnector:i,field:e,index:t,onRemove:this.removeField,editExpression:this.editExpression,updateHeader:this.headerChanged,toggleDisplay:this.toggleDisplay},t)}render(){const{fields:e,onChange:t}=this.props;return(0,d.jsxs)(l.ew,{className:"display-fields",children:[(0,d.jsx)(l.D1,{children:(0,d.jsxs)("tr",{children:[(0,d.jsx)("th",{children:"#"}),(0,d.jsx)("th",{children:"Jira Field"}),(0,d.jsx)("th",{children:"Type"}),(0,d.jsx)("th",{children:"Hide"}),(0,d.jsx)("th",{children:"Header Text"}),(0,d.jsx)("th",{children:"Use Expr."}),(0,d.jsx)("th",{children:"Remove"})]})}),(0,d.jsx)(n.L1,{useDragRef:!0,useDropRef:!0,tagName:"tbody",items:e,defaultItemType:"field",onChange:t,itemTemplate:this.getControls}),(0,d.jsx)("tfoot",{children:(0,d.jsxs)("tr",{children:[(0,d.jsx)("td",{className:"data-center",children:e.length+1}),(0,d.jsx)("td",{children:(0,d.jsx)(h,{onChange:this.fieldAdded})}),(0,d.jsx)("td",{colSpan:"5",children:"Note: Select the column from the list to add it as output"})]})})]})}}class m extends i.PureComponent{constructor(e){super(e),this.remove=()=>this.props.onRemove(this.props.index),this.editExpression=()=>this.props.editExpression(this.props.index),this.toggleDisplay=e=>this.props.toggleDisplay(this.props.index,e),this.updateHeader=()=>{var e;let{header:t}=this.state;t=(null===(e=t)||void 0===e?void 0:e.trim())||void 0,this.props.updateHeader(t,this.props.index)},this.headerChanged=e=>this.setState({header:e}),this.state={header:e.field.header}}UNSAFE_componentWillReceiveProps(e){this.setState({header:e.field.header})}render(){const{dragHandle:e,dropConnector:t,index:s,field:i,field:{name:r,field:a,type:o,isArray:l,knownObj:p,expr:h}}=this.props,{header:c}=this.state;return(0,d.jsxs)("tr",{ref:t,children:[(0,d.jsx)("td",{className:"data-center",ref:e,children:s+1}),(0,d.jsxs)("td",{children:[r," (",a,")"]}),(p||o)&&(0,d.jsxs)("td",{children:[o," ",!!l&&"(multiple)"]}),(0,d.jsx)("td",{className:"data-center",children:(0,d.jsx)(n.Sc,{checked:i.hide,onChange:this.toggleDisplay,title:"Hide this field in display and use this property only from expression of other fields"})}),(0,d.jsx)("td",{children:i.hide?"(not applicable)":(0,d.jsx)(n.fI,{value:c,placeholder:r,onChange:this.headerChanged,onBlur:this.updateHeader})}),!p&&!o&&(0,d.jsx)("td",{children:JSON.stringify(i)}),!i.hide&&(0,d.jsx)("td",{className:"data-center",children:h?(0,d.jsx)("span",{className:"fa fa-edit",onClick:this.editExpression,title:"Click to edit the expression"}):(0,d.jsx)(n.Sc,{checked:!1,onChange:this.editExpression,title:"Click to add an expression"})}),!!i.hide&&(0,d.jsx)("td",{}),(0,d.jsx)("td",{className:"data-center",children:(0,d.jsx)("span",{className:"fa fa-times",onClick:this.remove})})]})}}const g=f;var v=s(7426);class x extends v.Ay{constructor(e){super(e,"Query Editor","fa-filter"),this.displayFieldChanged=e=>this.props.onChange({...this.props.query,fields:e}),this.jqlChanged=e=>this.props.onChange({...this.props.query,jql:e}),this.className="query-editor-gadget",this.isGadget=!1,this.hideMenu=!0,this.hideRefresh=!0}renderFooter(){const{query:{id:e,isSystemQuery:t},deleteQuery:s,showSaveDialog:i,saveAs:r,viewReport:a,allowSave:o}=this.props,l=this.isSaveEnabled(),p=e>0;return(0,d.jsxs)("div",{className:"pnl-footer",children:[e&&(0,d.jsxs)("div",{className:"float-start",children:[(0,d.jsx)(n.$n,{icon:"fa fa-trash",className:"margin-r-8",label:"Delete Query",type:"danger",onClick:s}),(0,d.jsx)(n.$n,{icon:"fa fa-save",label:"Save Query As",type:"success",disabled:!l,onClick:i})]}),(0,d.jsxs)("div",{className:"float-end",children:[(0,d.jsx)(n.$n,{icon:"fa fa-save",className:"margin-r-8",label:"Save Query",type:"success",disabled:!l||t||!o,onClick:p?r:i}),(0,d.jsx)(n.$n,{icon:"fa fa-list",label:"View Report",type:"info",disabled:!l,onClick:a})]})]})}renderCustomActions(){const{reportsList:e,reportId:t}=this.props;return e&&0!==e.length?(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(n.aL,{dataset:e,value:t,valueField:"value",onChange:this.props.querySelected,placeholder:"Select a report to edit"}),(0,d.jsx)(n.$n,{icon:"fa fa-plus",onClick:this.props.initModel,label:"New query"})]}):null}isSaveEnabled(){var e,t;const{query:{jql:s,fields:i}}=this.props;return(null===s||void 0===s||null===(e=s.trim())||void 0===e?void 0:e.length)>10&&(null===i||void 0===i||null===(t=i.filter((e=>!e.hide)))||void 0===t?void 0:t.length)>=1}render(){const{query:{fields:e,jql:t}}=this.props;return super.renderBase((0,d.jsx)("div",{className:"query-editor",children:(0,d.jsxs)(a.J,{panelContainerClassName:"p-0",children:[(0,d.jsx)(a.K,{header:"How to use",children:(0,d.jsxs)("div",{className:"pad-8",children:[(0,d.jsx)("strong",{children:"Filter (JQL):"})," JQL (Jira Query Language) is a powerful tool for filtering and extracting data from Jira. To learn more about JQL, you can refer to the Atlassian documentation.",(0,d.jsx)("br",{}),(0,d.jsx)("br",{}),(0,d.jsx)("strong",{children:"Display Settings:"})," In the Display Settings tab, you can select and retrieve specific fields needed for your report generation. Only the fields you select here will be pulled from Jira. You can also use expressions for each field to control how the data is presented. If certain fields are not required as columns in the report but are needed within expressions for other fields, you can hide them.",(0,d.jsx)("br",{}),(0,d.jsx)("br",{}),(0,d.jsx)("strong",{children:"Expressions:"}),(0,d.jsxs)("ul",{children:[(0,d.jsx)("li",{children:"You can use any valid JavaScript expression syntax in expressions."}),(0,d.jsx)("li",{children:'To access the current field, use "this." and to access all available fields, use the "Fields" object (e.g., Fields.summary, Fields.created.name).'}),(0,d.jsx)("li",{children:"Only the fields selected under Display Settings tab can be used in expressions; other fields will not be available. Therefore, ensure you add all required fields before using them in expressions."}),(0,d.jsx)("li",{children:"Some native functions and custom utility functions are available within expressions."}),(0,d.jsx)("li",{children:"If an object is returned by the expression, it is converted to JSON and displayed within the cell."})]}),(0,d.jsx)("strong",{children:"Native libraries:"}),(0,d.jsxs)("ul",{children:[(0,d.jsx)("li",{children:"Some native functions are available for direct use in expressions."}),(0,d.jsx)("li",{children:"Available Functions List: parseInt, parseFloat, isNaN, Math.*, Date, Number"})]}),(0,d.jsx)("strong",{children:"Utility functions:"}),(0,d.jsxs)("ul",{children:[(0,d.jsx)("li",{children:'A set of custom utility functions is available under the "Utils" object in expressions. These functions can be called as follows: "Utils.formatDate(Fields.created)" within expressions.'}),(0,d.jsxs)("li",{children:[(0,d.jsx)("strong",{children:"Available Functions List:"}),(0,d.jsxs)("ul",{children:[(0,d.jsxs)("li",{children:[(0,d.jsx)("strong",{children:"formatDate, formatTime, formatDateTime:"})," Accepts a date object and returns a formatted date as a string."]}),(0,d.jsxs)("li",{children:[(0,d.jsx)("strong",{children:"formatSecs:"})," Accepts the number of seconds and returns it in a readable format."]}),(0,d.jsxs)("li",{children:[(0,d.jsx)("strong",{children:"formatMS:"})," Accepts the number of milliseconds and returns it in a readable format."]})]})]})]})]})}),(0,d.jsx)(a.K,{header:"Filter (JQL)",children:(0,d.jsx)(o.A,{jql:t,onChange:this.jqlChanged})}),(0,d.jsx)(a.K,{header:"Display Settings",children:(0,d.jsx)(g,{fields:e,onChange:this.displayFieldChanged})})]})}))}}const b=x;var j=s(6328),S=s(7988),w=s(4922),C=s(2636);class k extends i.PureComponent{constructor(e){super(),this.initModel=()=>this.querySelected(""),this.loadReport=async e=>{if(await this.fillQueriesList(e),!e)return;const t=await this.$report.getReportDefinition(e);this.setState({reportId:e,query:t,renderReport:!1})},this.fillQueriesList=async e=>{const t=(await this.$report.getReportsList()).filter((e=>"custom"===e.reportType)).map((e=>({value:e.id,label:e.queryName})));this.setState({reportId:e,reportsList:t})},this.querySelected=e=>{if(e){const{navigate:t}=this.props;t(`/${this.$session.userId}/reports/custom/${e}`)}else this.setState(this.getEmptyReport())},this.queryChanged=e=>this.setState({query:e,hasUnsavedChanges:!0}),this.deleteQuery=()=>{const{reportId:e,query:{queryName:t}}=this.state;y.A.confirmDelete(`Are you sure to delete the report named "${t}" permanently?`).then((()=>{this.$report.deleteSavedQuery(e).then((e=>{this.$message.success("Report deleted successfully!"),this.$analytics.trackEvent("Custom Report Deleted"),this.querySelected("")}))}))},this.viewReport=()=>{const{renderReport:e}=this.state;this.setState({renderReport:!e}),e||this.$analytics.trackEvent("Custom Report Preview",w.hB.UserActions)},this.showSaveDialog=()=>this.setState({showSaveDialog:!0}),this.saveAs=()=>this.saveQuery(this.state.query.queryName),this.hideSaveDialog=()=>this.setState({showSaveDialog:!1}),this.saveQuery=(e,t)=>{let{query:s}=this.state;s={...s};const i=s.queryName;let r=!1;s.queryName=e,t?(delete s.id,r=!0):i!==e&&(r=!0),this.$report.saveQuery(s).then((e=>{s.id=e,this.setState({showSaveDialog:!1,hasUnsavedChanges:!1,reportId:e,query:s}),this.$message.success("Report saved successfully!"),this.$analytics.trackEvent("Custom Report Saved"),r&&(this.fillQueriesList(e),t&&this.querySelected(e))}),(e=>{e&&e.message&&this.$message.error(e.message)}))},this.settingsChanged=e=>{let{query:t}=this.state;t={...t,settings:e},this.setState({query:t,hasUnsavedChanges:!0})},(0,r.WQ)(this,"ReportService","MessageService","AnalyticsService","SessionService");const t=this.getReportIdFromParams(e);this.state=this.getEmptyReport(t)}getReportIdFromParams(e){var t,s;let i=null===(t=e.match)||void 0===t||null===(s=t.params)||void 0===s?void 0:s.reportId;return i&&(i=parseInt(i)),i}componentDidMount(){this.loadReport(this.getReportIdFromParams(this.props))}UNSAFE_componentWillReceiveProps(e){const t=this.getReportIdFromParams(e);this.state.reportId!==t&&this.loadReport(t)}getEmptyReport(e=null){return{reportId:e,query:{jql:"",fields:[]}}}render(){const{reportId:e,query:t,renderReport:s,reportsList:i,showSaveDialog:r,hasUnsavedChanges:a}=this.state;return(0,d.jsxs)("div",{className:"custom-report",children:[!s&&(0,d.jsx)(b,{reportId:e,query:t,reportsList:i,onChange:this.queryChanged,querySelected:this.querySelected,deleteQuery:this.deleteQuery,viewReport:this.viewReport,showSaveDialog:this.showSaveDialog,saveAs:this.saveAs,allowSave:a,initModel:this.initModel}),s&&(0,d.jsx)(S.A,{isGadget:!1,query:t,settingsChanged:this.settingsChanged,onEditClicked:this.viewReport}),r&&(0,d.jsx)(j.A,{queryName:t.queryName,allowCopy:t.id>0,onHide:this.hideSaveDialog,onChange:this.saveQuery})]})}}const q=(0,C.y)(k)},7988:(e,t,s)=>{s.d(t,{A:()=>C});s(9950);var i=s(4452),r=s(6778),a=s(5674),o=s(7426),n=s(8874),l=s(6904),d=s(466),p=s.n(d),h=s(1858);const c={ecmaVersion:10,sourceType:"script",ecmaFeatures:{jsx:!1,globalReturn:!1,impliedStrict:!0}};function u(e){e.indexOf("\n")>-1&&(e=`(function () { ${e} }).call(this)`);try{var t;return null===(t=(0,h.qg)(e,c))||void 0===t?void 0:t.body[0]}catch(s){return s.toString()}}var y=s(5073);async function f(e,t){if(!e)return{};const s=(0,n.hd)("JiraService"),i=e.fields.map((e=>e.field)),r=await s.searchTickets(e.jql,i),a={utils:t},o=e.fields.filter((e=>!e.hide)).map(m.bind(a));a.fieldWithExpr=o.filter((e=>!!e.ast));const d=r.map(g.bind(a));if(a.hasWorklogs){const e=a.usersObj,t=Object.keys(e).map((t=>({field:t,displayText:e[t].displayName,type:"seconds",groupText:"Log Work",allowGrouping:!1,viewComponent:l.g4,props:{format:!1}})));t.push({field:"totalWorklog",displayText:"Total Log Work",type:"seconds",groupText:"Log Work",allowGrouping:!1,viewComponent:l.g4,props:{format:!1}});const s=o.findIndex((({field:e})=>"worklog"===e));o.splice(s,1,...t)}return{isLoading:!1,reportData:d,columnList:o,settings:e.settings}}function m(e){const{id:t,field:s,name:i,header:r=i,type:a,isArray:o,expr:n}=e,d={id:t,field:s,displayText:r,type:a,props:{},allowSorting:!o,allowGrouping:"summary"!==s&&"description"!==s};return n?(d.ast=u(n),d.exprField=s,d.field=t,d.viewComponent=l.qm):d.viewComponent=function(e,t,s){const{props:i}=t;switch(e){case"issuekey":return l.JA;case"epicLink":return i.hideContext=!0,l.JA;case"project":return t.fieldKey=`${t.field}.name`,l.qM;case"user":return t.fieldKey=`${t.field}.displayName`,l.YP;case"comment":return t.allowSorting=!1,l.pL;case"issuelinks":return l.EI;case"seconds":return l.g4;case"workratio":return i.converter=function(e){return-1===e?null:e},l.g4;case"timetracking":return l.n_;case"parent":return t.fieldKey=`${t.field}.key`,l.Ek;case"progress":case"aggregateprogress":return t.fieldKey=`${t.field}.percent`,l.ue;case"sprint":return l.Kb;case"attachment":return i.hrefProp="content",i.iconClass="fa-paperclip",i.tagProp="filename",l.Kb;case"component":return i.titleProp="description",l.Kb;case"version":return i.titleProp="releaseDate",l.Kb;case"option":return t.fieldKey=`${t.field}.value`,i.tagProp="value",l.Kb;case"votes":return t.fieldKey=`${t.field}.votes`,i.tagProp="votes",i.hideZero=!0,l.Kb;case"watches":return t.fieldKey=`${t.field}.watchCount`,i.tagProp="watchCount",i.hideZero=!0,l.Kb;case"date":case"datetime":return l.Hl;case"issuetype":case"status":case"priority":case"resolution":return t.fieldKey=`${t.field}.name`,l.mG;case"epicStatus":return i.textField="value",i.iconField="",t.fieldKey=`${t.field}.value`,l.mG;case"string":return s?(i.tagProp="",l.Kb):null;case"number":return l.qm;case"option-with-child":return y.A;default:return t.allowSorting=!1,t.allowGrouping=!1,l.qm}}("issuekey"===s?"issuekey":a,d,o),d.allowSorting||(d.allowGrouping=!1),d.allowGrouping&&function(e){const t=[{type:"check",label:"Issue count",prop:"showGroupCount",value:!0},{separator:!0}];switch(e.type){default:return;case"issuetype":case"status":case"priority":case"resolution":t.splice(1,1);break;case"string":t.push({type:"radio",label:"Show value",prop:"valueType",value:"value",default:!0}),t.push({type:"radio",label:"Show count",prop:"valueType",value:"count"}),t.push({type:"radio",label:"Distinct count",prop:"valueType",value:"distinct"});break;case"user":t[1]={type:"check",label:"Show Image",prop:"showImage"},t.push({separator:!0}),t.push({type:"radio",label:"Show name",prop:"valueType",value:"name",default:!0}),t.push({type:"radio",label:"Show email id",prop:"valueType",value:"email"}),t.push({type:"radio",label:"Show both",prop:"valueType",value:"both"});break;case"project":t.push({type:"radio",label:"Show name",prop:"valueType",value:"name"}),t.push({type:"radio",label:"Show key",prop:"valueType",value:"key",default:!0}),t.push({type:"radio",label:"Show both",prop:"valueType",value:"both"});break;case"parent":t[1]={type:"check",label:"Show status",prop:"showStatus",default:!0},t.push({separator:!0}),t.push({type:"radio",label:"Show key",prop:"valueType",value:"key",default:!0}),t.push({type:"radio",label:"Show summary",prop:"valueType",value:"summary"}),t.push({type:"radio",label:"Show both",prop:"valueType",value:"both"});break;case"date":case"datetime":t.push({type:"radio",label:"Friendly date",prop:"funcType",value:"friendly"}),t.push({type:"radio",label:"Group by year",prop:"funcType",value:"yyyy"}),t.push({type:"radio",label:"Group by month",prop:"funcType",value:"MMMM"}),t.push({type:"radio",label:"Group by both",prop:"funcType",value:"yyyy-MM (MMMM)",default:!0}),t.push({type:"radio",label:"Group by date",prop:"funcType",value:"yyyy-MM-dd"});break;case"number":case"seconds":t.push({type:"radio",label:"Group by field",prop:"funcType",value:"",default:!0}),t.push({type:"radio",label:"Sum of field",prop:"funcType",value:"sum"}),t.push({type:"radio",label:"Avg of field",prop:"funcType",value:"avg"}),t.push({type:"radio",label:"Count having value",prop:"funcType",value:"count"})}e.groupOptions=t}(d),d}function g(e){const t=e.fields;return t.issuekey=e.key,t.id=e.id,v.call(this,t),function(e){if(!e.comment)return;e.comment=e.comment.comments}(t),x.call(this,t),t}function v(e){if(!e.worklog)return;if(e.worklog=e.worklog.worklogs,!e.worklog.length)return void delete e.worklog;this.hasWorklogs=!0;const t=this.usersObj||{};this.usersObj=t;for(const s of e.worklog){const{author:i,timeSpentSeconds:r}=s,{accountId:a,emailAddress:o}=i,n=o||a;t[n]||(t[n]=i),e[n]=(e[n]||0)+r,e.totalWorklog=(e.totalWorklog||0)+r}}function x(e){if(this.fieldWithExpr.length)for(const s of this.fieldWithExpr)if("string"!==typeof s.ast)try{e[s.id]=b(s.ast,e[s.exprField],{Fields:e,Utils:this.utils})}catch(t){e[s.id]=`Error: ${(null===t||void 0===t?void 0:t.message)||t}`}else e[s.id]=s.ast}function b(e,t,s){const i=function(e,t){return p()(e,t)}(e,{this:t,...s,JSON:JSON,parseInt:parseInt,parseFloat:parseFloat,isNaN:isNaN,Math:Math,Number:Number,Date:Date,func:j.bind(this,s)});return function(e){if(e instanceof Date)return this.utils.formatDateTime(e);if("object"===typeof e&&!Array.isArray(e)){const t=Object.keys(e);return t.includes("type")&&t.includes("key")&&t.includes("props")?e:JSON.stringify(e)}return e}(i)}function j(e,t,s,i){if(!t)throw Error("No expression is passed to func. First argument should be an expression");if(s&&!Array.isArray(s))throw Error("Second argument should be an array of argument names used in expression");if(i&&"object"!==typeof i)throw Error("Third argument should be an object containing all the variables from current scope to be available for expression");const r=u(t);return i={...e,...i},function(){let e=arguments;return e=s.reduce(((t,s,i)=>(t[s]=e[i],t)),i),b(r,this,e)}}var S=s(4414);class w extends o.Ay{constructor(e){const{query:t}=e;super(e,(null===t||void 0===t?void 0:t.queryName)||"Custom report viewer","fa-clock"),this.toggleGroupOptions=()=>this.setState({hideGroups:!this.state.hideGroups}),this.refreshData=()=>this.loadData(this.props.query||this.state.query),this.loadData=async e=>{this.setState({isLoading:!0,hasError:!1});try{this.setState(await f(e,{formatDate:this.$userutils.formatDate,formatTime:this.$userutils.formatTime,formatDateTime:this.$userutils.formatDateTime,formatSecs:this.$utils.formatSecs,formatMS:this.$utils.formatTs,showAsLink:e=>(0,S.jsx)(a.A,{href:this.$userutils.getTicketUrl(e),children:e})}))}catch(t){this.setState({isLoading:!1,hasError:!0})}},this.tableSettingsChanged=e=>{this.settings={...this.settings,...e},this.isGadget?(this.saveSettings(),this.setState({settings:e})):this.props.settingsChanged(e)},(0,n.WQ)(this,"AnalyticsService","ReportService","JiraService","UtilsService","UserUtilsService"),this.state.isLoading=!0,this.state.hideGroups=this.isGadget}componentDidMount(){this.initWithProps(this.props)}renderCustomActions(e){return e?(0,S.jsx)(r.$n,{type:"success",title:"Click to toggle group options",icon:this.state.hideGroups?"fa fa-toggle-off":"fa fa-toggle-on",onClick:this.toggleGroupOptions}):(0,S.jsx)(r.$n,{type:"success",label:"Edit",title:"Click to edit the report",icon:"fa fa-edit",onClick:this.props.onEditClicked})}UNSAFE_componentWillReceiveProps(e){super.UNSAFE_componentWillReceiveProps(e),this.initWithProps(e)}initWithProps(e){const{query:t,reportId:s}=e;s?this.reportId!==s&&(this.reportId=s,this.loadReportDefinition(s)):t&&this.query!==t&&(this.query=t,this.loadReportData(t))}async loadReportDefinition(e){const t=await this.$report.getReportDefinition(e);this.title=(null===t||void 0===t?void 0:t.queryName)||"Custom report viewer",this.setState({query:t}),this.loadReportData(t)}loadReportData(e){this.settings={...e.settings,...this.settings},this.jql===e.jql&&this.fields===e.fields||(this.jql=e.jql,this.fields=e.fields,this.loadData(e))}render(){const{query:e}=this.props,{query:t=e}=this.state,{loading:s,reportData:r,columnList:a,settings:o,hasError:n,hideGroups:l}=this.state,{displayColumns:d,groupBy:p,groupFoldable:h,sortField:c,isDesc:u}=this.settings||o||{};return n?super.renderBase((0,S.jsx)("div",{className:"error-block",children:"Unable to load this report due to an error."})):s||!r?super.renderBase():super.renderBase((0,S.jsx)(i.A,{dataset:r,hideGroups:l,exportSheetName:t.queryName,columns:a,allowSorting:!0,onChange:this.tableSettingsChanged,displayColumns:d,groupBy:p,groupFoldable:h,sortField:c,isDesc:u,noRowsMessage:"No ticket details available"}))}}const C=w}}]);