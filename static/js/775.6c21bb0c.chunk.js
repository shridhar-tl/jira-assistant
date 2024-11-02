"use strict";(globalThis.webpackChunkjira_assistant=globalThis.webpackChunkjira_assistant||[]).push([[775],{7359:(e,t,s)=>{s.d(t,{A:()=>d});s(9950);var i=s(7426),l=s(847),n=s.n(l),o=s(787),r=s(8874),a=s(5674),c=s(4414);class h extends i.Ay{constructor(e,t,s){super(e,`Bulk import - [${t}]`,s),this.fileSelected=()=>{const e=this.fileSelector,t=e.files[0];if(t){if(!t.name.endsWith(".csv"))return this.$message.warning("Unknown file selected to import. Select a valid file to import"),void(e.value="");n().parse(t,{header:!0,transformHeader:this.transformHeader,skipEmptyLines:"greedy",complete:e=>{const{data:t}=e;t&&t.length||this.$message.warning("No rows found to import","No records exists"),this.processData(t)}})}e.value=""},this.getTicketLink=e=>(0,c.jsx)(a.A,{className:"link",href:this.$userutils.getTicketUrl(e),children:e}),this.setFileSelector=e=>this.fileSelector=e,this.chooseFileForImport=()=>this.fileSelector.click(),(0,r.WQ)(this,"UserUtilsService"),this.isGadget=!1,this.hideRefresh=!0}formatDate(e){return e instanceof Date?this.$userutils.formatDateTime(e):e}renderCustomActions(){return(0,c.jsxs)(c.Fragment,{children:[(0,c.jsx)("input",{ref:this.setFileSelector,type:"file",className:"hide",accept:".csv,.json, .xlsx",onChange:this.fileSelected}),(0,c.jsx)(o.$n,{text:!0,icon:"fa fa-upload",onClick:this.chooseFileForImport,title:"Choose file to import"})]})}}const d=h},1775:(e,t,s)=>{s.r(t),s.d(t,{default:()=>X});var i=s(9950),l=s(8738),n=s.n(l);const o=i.createContext({}),r=o.Provider;function a(e){return e?Array.isArray(e)?e.map(a):e instanceof Date?new Date(e.getTime()):"object"===typeof e?{...e}:e:e}function c(e){e.stopPropagation(),e.preventDefault()}var h=s(4414);class d extends i.PureComponent{constructor(...e){super(...e),this.cellType="cell",this.elementType="td",this.state={},this.editable=()=>!1!==this.props.column.editable&&!1!==this.props.column[`${this.cellType}Editable`],this.beingEdit=()=>{if(!this.editable())return;const{column:e,data:t}=this.props;this.setState({editing:!0,newValue:(null===t||void 0===t?void 0:t[e.field])||""}),this.context.beginEdit(this.props.rowIndex,this.props.index)},this.endEdit=()=>this.setNewValue(this.state.newValue),this.cancelEdit=()=>{this.context.endEdit(null,-2),this.setState({editing:!1,newValue:""})},this.setNewValue=e=>{this.context.endEdit(e,this.props.rowIndex,this.props.index),this.setState({editing:!1,newValue:""})},this.getDisplayControl=e=>{const{column:t,data:s,index:i,rowIndex:l}=this.props,n=t[`${this.cellType}Template`];return n?n(t,s,i,l,e):function(e){return e?(e instanceof Date&&e.toString(),e):e}(s[t.field])},this.setFocus=e=>null===e||void 0===e?void 0:e.focus(),this.getEditor=()=>{const{column:e,data:t,index:s,rowIndex:i}=this.props;let l=e[`${this.cellType}EditorTemplate`];return l&&(l=l(t,e,i,s,this.setNewValue,this.cancelEdit)),void 0!==l?l:(0,h.jsx)("input",{ref:this.setFocus,type:"text",className:"string-editor",value:this.state.newValue,onBlur:this.endEdit,onChange:this.valueChanged,onKeyDown:this.editorKeyDown})},this.editorKeyDown=e=>{const{which:t,keyCode:s=t}=e;13===s?this.endEdit(e):27===s&&this.cancelEdit()},this.valueChanged=e=>this.setState({newValue:e.target.value}),this.onMouseDown=e=>this.editable()&&this.context.beginSelect(this.props.rowIndex,this.props.index),this.onMouseUp=e=>this.context.endSelect(this.props.rowIndex,this.props.index),this.onMouseOver=e=>this.context.onSelecting(this.props.rowIndex,this.props.index),this.onRepeaterDoubleClick=e=>{c(e),this.context.repeatSelectedCells()},this.resizePrevious=e=>{c(e),this.context.beginResize(this.props.index-1,e)},this.resize=e=>{c(e),this.context.beginResize(this.props.index,e)},this.setTDRef=e=>this.td=e}render(){const e=this.elementType,{className:t,domProps:s,isLastCell:i,index:l}=this.props,{editing:o}=this.state,r={className:t},a=!o&&this.getDisplayControl(r);return(0,h.jsxs)(e,{ref:this.setTDRef,className:r.className,...s,onDoubleClick:this.beingEdit,onMouseDown:this.onMouseDown,onMouseUp:this.onMouseUp,onMouseOver:this.onMouseOver,children:[!o&&l>0&&"header"===this.cellType&&(0,h.jsx)("div",{className:"h-resizer-l",onMouseDown:this.resizePrevious}),!o&&i&&"cell"===this.cellType&&this.editable()&&(0,h.jsx)("div",{className:n()("cell-repeater",!!a&&"with-data"),onDoubleClick:this.onRepeaterDoubleClick,onMouseDown:c,onMouseUp:c,children:"\xa0"}),o?this.getEditor():a,!o&&"header"===this.cellType&&(0,h.jsx)("div",{className:"h-resizer-r",onMouseDown:this.resize})]})}}d.contextType=o;const u=d;class p extends u{constructor(...e){super(...e),this.cellType="cell"}}p.cellType="cell";class m extends u{constructor(...e){super(...e),this.cellType="header",this.elementType="th",this.getDisplayControl=()=>{const{column:e}=this.props;return e.headerTemplate?e.headerTemplate(e,this.index):e.displayText||e.field}}}m.setWidth=!0,m.cellType="header";class g extends u{constructor(...e){super(...e),this.cellType="footer",this.getDisplayControl=()=>null}}g.setWidth=!0,g.cellType="footer";class C extends i.PureComponent{constructor(...e){super(...e),this.state={startRow:0,startCell:0,endRow:0,endCell:0},this.handleDocumentMouseMove=e=>{if(!(this.resizingColumn>=0))return;const t=e.pageX-this.pageX,{rows:s,onChange:i}=this.props;let{columns:l}=this.props;l=[...l];const n={...l[this.resizingColumn]};l[this.resizingColumn]=n,n.width=this.colWidth+t,n.width<15?n.width=15:n.width>800&&(n.width=800),i&&i(s,l)},this.handleDocumentMouseUp=e=>{delete this.resizingColumn,delete this.pageX},this.contextAPI={beginSelect:(e,t)=>{this.state.editing||this.setState({isSelecting:!0,startRow:e,startCell:t,endRow:e,endCell:t})},endSelect:(e,t)=>{this.state.isSelecting&&this.setState({isSelecting:!1,endRow:e,endCell:t})},onSelecting:(e,t)=>{this.state.isSelecting&&this.setState({endRow:e,endCell:t})},beginEdit:(e,t)=>{this.setState({editing:!0,editingRow:e,editingCell:t})},endEdit:(e,t,s)=>{var i;const{columns:l,onChange:n,onHeaderChange:o}=this.props;let{rows:r}=this.props;if(-1===t){const t={...l[s],field:e};delete t.displayText,o&&o(t,s)}else if(t>=0){r=[...r];const i={...r[t]};r[t]=i;i[l[s].field]=e,n&&n(r,l,t,s)}this.setState({editing:!1,editingRow:-2,editingCell:-2}),null===(i=this.table)||void 0===i||i.focus()},repeatSelectedCells:()=>{const{rowStart:e,rowEnd:t,cellStart:s,cellEnd:i}=this.getOrderedSelection(),{columns:l,onChange:n}=this.props;let{rows:o}=this.props;if(t!==o.length-1){o=[...o];for(let n=s;n<=i;n++)this.repeatRowData(o,l,e,t,n);n&&n(o,l),this.setState({startRow:e,endRow:o.length-1})}},beginResize:(e,t)=>{this.resizingColumn=e,this.pageX=t.pageX,this.colWidth=this.props.columns[e].width||140}},this.getSelectionState=(e,t,s)=>{const{editing:i,copied:l}=this.state;if(s&&!l)return{};const{rowStart:n,cellStart:o,rowEnd:r,cellEnd:a}=this.getOrderedSelection(s&&l);let c=a;if(i){c+=2;const e=this.props.columns.length;c>=e&&(c=e-1)}const h=e>=n&&e<=r,d=t>=o&&t<=c,u=h&&d,p=n-1===e,m=r+1===e,g=o-1===t,C=c+1===t,{startRow:f,startCell:w}=s?l:this.state,x=s?"copy":"sel";return{isSelected:u,className:u||p||m||g||C?{[s?"copied":"selected"]:u,[`${x}-start`]:e===f&&t===w,[`${x}-top`]:d&&(n===e||m),[`${x}-right`]:h&&(a===t||c===t||g),[`${x}-bottom`]:d&&(r===e||p),[`${x}-left`]:h&&(o===t||C)}:"",isLastCell:c===t&&r===e}},this.keyDown=e=>{if(this.state.editing)return;const{which:t,keyCode:s=t,ctrlKey:i,shiftKey:l}=e;let{startRow:n,startCell:o,endRow:r,endCell:a}=this.state,c=!1;const{columns:h,rows:d}=this.props;39===s?o<h.length-1&&(l?a=i?h.length-1:a+1:(o=i?h.length-1:o+1,a=o,r=n),c=!0):37===s?o>0&&(l?a=i?0:a-1:(o=i?0:o-1,a=o,r=n),c=!0):38===s?n>-1&&(l?r=i?0:r-1:(n=i?0:n-1,r=n,a=o),c=!0):40===s||13===s?n<d.length&&(l?r=i?d.length-1:r+1:(n=i?d.length-1:n+1,r=n,a=o),c=!0):46===s?this.clearSelectedCells(d,h):i&&67===s?this.initCopyCells():i&&88===s?this.initCopyCells(!0):i&&86===s&&this.beginPaste(),c&&(r<-1?r=-1:r>d.length&&(r=d.length),a<0?a=0:a>h.length-1&&(a=h.length-1),this.setState({startRow:n,startCell:o,endRow:r,endCell:a}))},this.cellRenderer=this.getCellRenderer(p),this.setTableRef=e=>this.table=e}componentDidMount(){document.addEventListener("mousemove",this.handleDocumentMouseMove),document.addEventListener("mouseup",this.handleDocumentMouseUp)}componentWillUnmount(){document.removeEventListener("mousemove",this.handleDocumentMouseMove),document.removeEventListener("mouseup",this.handleDocumentMouseUp)}repeatRowData(e,t,s,i,l){const{field:n}=t[l];for(let o=i+1,r=s;o<e.length;o++)e[o]={...e[o],[n]:a(e[r++][n])},r>i&&(r=s)}clearSelectedCells(e,t){e=[...e];const{rowStart:s,rowEnd:i,cellStart:l,cellEnd:n}=this.getOrderedSelection();for(let r=s;r<=i;r++){const s={...e[r]};e[r]=s;for(let e=l;e<=n;e++){const{field:i}=t[e];delete s[i]}}const{onChange:o}=this.props;o&&o(e,t)}initCopyCells(e){const{startRow:t,startCell:s,endRow:i,endCell:l}=this.state;this.setState({copied:{cut:e,startRow:t,startCell:s,endRow:i,endCell:l}})}beginPaste(){const{copied:e}=this.state;if(!e)return;const{columns:t}=this.props;let{rows:s}=this.props;s=[...s];const{rowStart:i,cellStart:l,rowEnd:n,cellEnd:o}=this.getOrderedSelection(e);for(let a=l;a<=o;a++){const{editable:e,headerEditable:i,cellEditable:n,footerEditable:r}=t[a];if(!e)return;if(!i&&-1===l)return;if(!r&&(l===s.length||o===s.length))return;if(!n&&(l>=0&&l<s.length||o>=0&&o<s.length))return}const{cut:r}=e,c=[];for(let h=i;h<=n;h++){let e=s[h];r&&(e={...e},s[h]=e);const i=[];for(let s=l;s<=o;s++){const{field:l}=t[s];let n=e[l];r?delete e[l]:n=a(n),i.push(n)}c.push(i)}this.pasteData(s,t,c)}pasteData(e,t,s){var i;const{rowStart:l,cellStart:n}=this.getOrderedSelection();let o=n+s[0].length-1;o>=t.length&&(o=t.length-1);const r=t.slice(n,o+1).map((e=>e.field));let a=l;for(let d=0;d<s.length;d++,a++){const t={...e[a]};e[a]=t;const i=s[d];for(let e=0;e<i.length;e++){const s=r[e],l=i[e];t[s]=l}}const{onChange:c}=this.props;c&&c(e,t);const h={startRow:l,startCell:n,endRow:a,endCell:o};null!==(i=this.state.copied)&&void 0!==i&&i.cut&&(h.copied=null),this.setState(h)}getOrderedSelection(e){const{startRow:t,startCell:s,endRow:i,endCell:l}=e||this.state;return{rowStart:t<=i?t:i,cellStart:s<=l?s:l,rowEnd:t<=i?i:t,cellEnd:s<=l?l:s}}getCellRenderer(e){return(t,s)=>{const{editingRow:i,editingCell:l}=this.state;let{editing:o}=this.state;return i!==s&&(o=!1),(i,r)=>{let a;if(o)if(l===r)a={colSpan:3};else if(r>l&&r<l+3)return null;const c=this.getSelectionState(s,r),d=this.getSelectionState(s,r,!0);return d.isSelected&&(c.className={...c.className,...d.className}),c.className=n()(c.className),e.setWidth&&(a||(a={}),a.style={width:`${i.width||140}px`,...i.style}),(0,h.jsx)(e,{index:r,rowIndex:s,data:t,column:i,...c,domProps:a},r)}}}render(){const{tabIndex:e=1,columns:t,rows:s,showFooter:i,width:l,height:o,noRowMessage:a,getRowHeaderClassName:c,className:d}=this.props,u=this.props.columns.reduce(((e,t)=>e+(t.width||140)+2),19);return(0,h.jsx)(r,{value:this.contextAPI,children:(0,h.jsx)("div",{className:n()("src-editable-grid-container",d),style:{width:l,height:o},children:(0,h.jsxs)("table",{ref:this.setTableRef,className:"src-editable-grid",style:{width:u},cellSpacing:"0",cellPadding:"0",onKeyDown:this.keyDown,tabIndex:e,children:[(0,h.jsx)("thead",{children:(0,h.jsxs)("tr",{className:"src-h-row",children:[(0,h.jsx)("th",{className:"src-status-cell",children:"#"}),t.map(this.getCellRenderer(m)(void 0,-1))]})}),(0,h.jsxs)("tbody",{children:[!(null!==s&&void 0!==s&&s.length)&&(0,h.jsx)("tr",{children:(0,h.jsx)("td",{colSpan:t.length+1,children:a})}),null===s||void 0===s?void 0:s.map(((e,s)=>(0,h.jsxs)("tr",{className:"src-row",children:[(0,h.jsx)("th",{className:n()("src-status-cell",c(e,s)),children:s+1}),t.map(this.cellRenderer(e,s))]},s)))]}),!!i&&(0,h.jsx)("tfoot",{children:(0,h.jsxs)("tr",{className:"src-f-row",children:[(0,h.jsx)("th",{className:"src-status-cell",children:"#"}),t.map(this.getCellRenderer(g)(void 0,s.length))]})})]})})})}}const f=C;var w=s(787),x=s(8874);const v={fontSize:12,margin:"10px 10px 0 0"};class y extends i.PureComponent{constructor(...e){super(...e),this.validateKeys=e=>{const{keyCode:t}=e;13===t?this.onBlur(e):27===t&&this.onChange(null,!1)},this.getItem=e=>({value:e}),this.setFocus=()=>this.onFocus=!0,this.onBlur=e=>{if(!this.isShowing)if(this.props.multiple)if(e.currentTarget.value){const t=[...this.props.value,this.getItem(e.currentTarget.value)];this.onChange({value:t},!0)}else this.onChange(this.props.value,!1);else this.onChange(this.getItem(e.currentTarget.value),!0);this.onFocus=!1},this.onChange=(e,t)=>this.props.onChange(e,t),this.onSelect=({value:e})=>{const{value:t,displayText:s,iconUrl:i}=e,l={value:t,displayText:s,avatarUrl:i};if(this.props.multiple){const e=[...this.props.value,l];this.onChange({value:e},!0)}else this.onChange(l,!0)},this.onShow=()=>this.isShowing=!0,this.onHide=()=>{this.isShowing=!1,this.onFocus||this.onChange(null,!1)},this.renderTemplate=e=>(0,h.jsxs)("span",{style:v,children:[!!e.iconUrl&&(0,h.jsx)(w._V,{src:e.iconUrl})," ",e.label]})}render(){const{value:e,placeholder:t=this.placeholder,className:s,multiple:i}=this.props;return(0,h.jsx)(w.j9,{value:e,displayField:"value",className:s,multiple:i,placeholder:t,dataset:this.search,maxLength:20,autoFocus:!0,onKeyUp:this.validateKeys,onSelect:this.onSelect,forceSelection:this.forceSelection,onShow:this.onShow,onHide:this.onHide,onBlur:this.onBlur,onFocus:this.setFocus,children:this.renderTemplate})}}const S=y;const j=class extends S{constructor(e){super(e),this.search=async e=>(await this.$jira.searchIssueForPicker(e,{currentJQL:""})).map((e=>({value:e.key,label:`${e.key} - ${e.summaryText}`,iconUrl:e.img}))),(0,x.WQ)(this,"JiraService"),this.placeholder="Enter Jira Issue key"}};const T=class extends S{constructor(e){super(e),this.getItem=e=>{const t=e.trim().toLowerCase(),s=this.projects.filter((e=>e.value.toLowerCase()===t))[0];return s?{value:s.value,displayText:s.displayText,avatarUrl:s.iconUrl}:{value:e}},this.search=e=>{const t=e.toLowerCase();return this.projects.filter((e=>e.label.toLowerCase().indexOf(t)>-1))},(0,x.WQ)(this,"JiraService","CacheService"),this.placeholder="Enter Project key",this.loadProjects()}loadProjects(){this.projects=[];const e=this.$cache.session.get("projectsForEditor");e?this.projects=e:this.$jira.getProjects().then((e=>{this.projects=e.map((e=>({value:e.key,displayText:e.name,label:`${e.key} - ${e.name}`,iconUrl:e.avatarUrls["16x16"]||e.avatarUrls["24x24"]}))),this.$cache.session.set("projectsForEditor",this.projects,10)}))}};const k=class extends S{constructor(...e){super(...e),this.forceSelection=!0,this.search=e=>{const t=e.toLowerCase(),{dataset:s}=this.props;return s.filter((e=>`${e.key} - ${e.name}`.toLowerCase().indexOf(t)>-1)).map((e=>{const{id:t,key:s,name:i,iconUrl:l}=e;return{value:s||t,label:s?`${s} - ${i}`:i,displayText:i,iconUrl:l}}))}}};class D extends i.PureComponent{constructor(e){super(e),this.editorKeyDown=e=>{const{keyCode:t}=e;13===t?this.onBlur(e):27===t&&this.onChange(this.props.value,!1)},this.onBlur=e=>this.onChange(e.currentTarget.value,!0),this.onChange=(e,t)=>this.props.onChange({value:e},t),this.setFocus=e=>null===e||void 0===e?void 0:e.focus(),this.valueChanged=e=>this.setState({newValue:e.currentTarget.value}),this.state={newValue:e.value}}render(){const{placeholder:e="Enter value"}=this.props;return(0,h.jsx)("input",{ref:this.setFocus,type:"text",className:"string-editor",placeholder:e,onBlur:this.onBlur,onKeyDown:this.editorKeyDown})}}const b=D;var N=s(7359),E=s(7192);const R="issuekey",I="parent",$="project",U="issuetype",F="assignee",M="reporter",L="timetracking.originalEstimate",B="timetracking.remainingEstimate",A={issuekey:R,ticketno:R,ticket:R,issue:R,key:R,id:R,project:$,projectkey:$,projectid:$,parent:I,parentkey:I,parentticket:I,parentticketno:I,parentissue:I,parentid:I,status:"status",issuestatus:"status",summary:"summary",priority:"priority",resolution:"resolution",description:"description",estimate:L,originalestimate:L,initialestimate:L,remaining:B,remainingestimate:B,currentestimate:B,assignee:F,assignto:F,assignedto:F,reporter:M,reported:M,reportedby:M,issuetype:U,type:U,label:"labels"};class V extends i.PureComponent{render(){const{isLoading:e,selectedCount:t,clearImportData:s,importIssues:i}=this.props,l=`Import ${t||""} Issues`;return(0,h.jsx)("div",{className:"pnl-footer",children:(0,h.jsxs)("div",{className:"float-end",children:[(0,h.jsx)(w.$n,{text:!0,type:"info",icon:"fa fa-list",label:"Clear",disabled:e,onClick:s}),(0,h.jsx)(w.$n,{type:"primary",icon:"fa fa-upload",disabled:e||!(t>0),label:l,onClick:i})]})})}}const P=V;var W=s(8947);class H extends i.PureComponent{constructor(e){super(e),this.editorKeyDown=e=>{const{keyCode:t}=e;27===t&&(this.onBlur(),c(e))},this.onBlur=e=>this.onChange(this.props.value,!1),this.onChange=(e,t)=>{const s=e?{value:e,displayText:this.format(e)}:{clearValue:!0};this.props.onChange(s,t)},this.valueChanged=e=>this.onChange(e,!0),(0,x.WQ)(this,"UserUtilsService");const{formatDateTime:t,formatDate:s}=this.$userutils;this.format=e.showTime?t:s}render(){const{placeholder:e="Choose a date",value:t,showTime:s}=this.props;return(0,h.jsx)(w.lr,{className:"ja-date-editor",value:t,autoFocus:!0,showTime:s,placeholder:e,onChange:this.valueChanged,onKeyDown:this.editorKeyDown,onBlur:this.onBlur,allowClear:!0})}}const z=H;var K=s(5674);const O=["selected","issuekey","delete","clone","importStatus"],Q={key:j,project:T,date:z,datetime:z};class J extends N.A{constructor(e){super(e,"Issue","fa fa-ticket"),this.getSelectedCount=e=>e.filter((e=>e.selected)).length,this.toggleAllRows=()=>{let{importData:e,selectAll:t}=this.state;t=!t,e=e.map((e=>((e={...e}).selected=!e.disabled&&t,e))),this.setState({importData:e,selectAll:t,selectedCount:this.getSelectedCount(e)})},this.toggleSelection=(e,t)=>{if(e.disabled)return;const s=this.toggleCheckBox(e,t,"selected"),i=this.getSelectedCount(s);this.setState({selectAll:i>0,selectedCount:i})},this.toggleCheckBox=(e,t,s)=>{e={...e,[s]:!e[s]};let{importData:i}=this.state;return i=[...i],i[t]=e,this.setState({importData:i}),i},this.renderSelectorHeader=()=>(0,h.jsx)(w.Sc,{checked:this.state.selectAll,onChange:this.toggleAllRows}),this.renderSelectorBody=(e,t,s,i)=>{var l;return(0,h.jsx)(w.Sc,{checked:t.selected,disabled:!t.selected&&(null===(l=t.importStatus)||void 0===l?void 0:l.hasError),onChange:()=>this.toggleSelection(t,i)})},this.renderDeleteBody=(e,t,s,i)=>t.issuekey.value&&!t.issuekey.error&&(0,h.jsx)(w.Sc,{checked:t.delete,disabled:t.clone,onChange:()=>this.toggleCheckBox(t,i,"delete")}),this.renderCloneBody=(e,t,s,i)=>t.issuekey.value&&!t.issuekey.error&&(0,h.jsx)(w.Sc,{checked:t.clone,disabled:t.delete,onChange:()=>this.toggleCheckBox(t,i,"clone")}),this.renderImportStatus=(e,t)=>{const s=t.importStatus||{hasError:!0};return s.hasError?(0,h.jsxs)("span",{children:[(0,h.jsx)("span",{className:"fa fa-exclamation-triangle msg-error",title:s.error||"Has error in one or more fields"})," Error"]}):s.hasWarning&&s.warning?(0,h.jsxs)("span",{children:[(0,h.jsx)("span",{className:"fa fa-exclamation-triangle msg-warning",title:s.warning})," Warning"]}):s.imported?(0,h.jsx)("span",{children:"Imported"}):t.selected?t.delete?(0,h.jsx)("span",{children:"Will Delete"}):t.clone?(0,h.jsx)("span",{children:"Will Clone"}):(0,h.jsx)("span",{children:"Will Import"}):(0,h.jsx)("span",{children:"Not Selected"})},this.renderIssueCells=({field:e},t,s,i,l)=>{let o=t[e];if(!o||"string"===typeof o)return o||"";const r=o.clearValue;let a=!0;return r||!o.jiraValue||!t.delete&&o.value?a&&(!o.value&&!r||"issuekey"===e&&!t.clone)&&(a=!1):(a=!1,o=Array.isArray(o.jiraValue)||"string"===typeof o.jiraValue?{value:o.jiraValue,error:o.error}:{...o.jiraValue,error:o.error}),a&&(l.className=n()(l.className,"data-modified")),this.renderCellContent(e,o,r)},this.invalidHeaderTemplate=e=>(0,h.jsxs)("span",{children:[e.field," ",(0,h.jsx)("span",{className:"fa fa-exclamation-triangle msg-error",title:"Unknown field. This will not be imported."})]}),this.unsupportedFieldTemplate=e=>(0,h.jsxs)("span",{children:[e.field," ",(0,h.jsx)("span",{className:"fa fa-exclamation-triangle msg-error",title:"Unsupported field. This will not be imported."})]}),this.setFocus=e=>null===e||void 0===e?void 0:e.focus(),this.renderCellEditor=(e,t,s,i,l,n)=>{const{fieldType:o}=t,r=e[t.field];let a,c=Q[o];const d="datetime"===o;!c&&null!==r&&void 0!==r&&r.allowedValues?(c=k,a=r.allowedValues):c||(c=b);let u=null===r||void 0===r?void 0:r.value;return u||null!==r&&void 0!==r&&r.clearValue||(u=null===r||void 0===r?void 0:r.jiraValue,"object"===typeof u&&(u=u.value)),(0,h.jsx)(c,{value:u,onChange:(e,i)=>this.valueChanged(e,i,n,t,s),dataset:a,multiple:!(null===r||void 0===r||!r.isArray),showTime:d})},this.valueChanged=async(e,t,s,i,l)=>{if(t){let{importData:t}=this.state;const s={...t[l]};t=[...t];const n={...s[i.field]};delete n.value,delete n.displayText,delete n.avatarUrl,s[i.field]={...n,...e};const{columns:o,addedFields:r}=this.state;t[l]=await this.$ticket.validateIssueForImport(s,o,r,!1,this.defaultColSettings),this.setState({importData:t})}s()},this.clearImportData=()=>{this.setState({columns:null,importData:null,selectedCount:null})},this.importIssues=async()=>{const{columns:e,addedFields:t}=this.state;let{importData:s}=this.state;s=[...s],this.setState({isLoading:!0,uploading:!0});const i=e.filter((e=>!O.includes(e.field))),l=s.findAllIndex((e=>e.selected));try{await l.mapAsync((async e=>{const l={...s[e]};s[e]=l,await this.$ticket.importIssue(l,i,t)}))}finally{this.setState({isLoading:!1,uploading:!1,importData:s})}},this.className="import-issue",(0,x.WQ)(this,"JiraService","TicketService","MessageService","UserUtilsService"),this.defaultColSettings={cellTemplate:this.renderIssueCells,cellEditorTemplate:this.renderCellEditor},this.defaultColumns=(0,W.Hy)({selected:{headerTemplate:this.renderSelectorHeader,cellTemplate:this.renderSelectorBody},importStatus:{cellTemplate:this.renderImportStatus},clone:{cellTemplate:this.renderCloneBody},delete:{cellTemplate:this.renderDeleteBody}},this.defaultColSettings),this.state={columns:this.defaultColumns,importData:[]},this.$jira.getCustomFields().then((e=>{var t;this.customFields=e,this.colMapping=e.reduce(((e,t)=>(e[t.id]=t,e)),{}),this.transformHeader=(t=e,e=>{if(!e||"string"!==typeof e)return null;e=e.replace(/[ "]/g,"").toLowerCase();let s=A[e]||null;if(!s){const i=t.first((t=>t.id.toLowerCase()===e||t.name.replace(/ /g,"").toLowerCase()===e||t.clauseNames&&t.clauseNames.some((t=>t.replace(/ /g,"").toLowerCase()===e))));i&&(s=i.id)}return s||e})}))}async processData(e){this.setState({isLoading:!0});const t=(0,E.oW)(e,this.colMapping,this.defaultColumns,this.invalidHeaderTemplate,this.unsupportedFieldTemplate,this.defaultColSettings),s=await this.$ticket.validateIssuesForImport(t,this.defaultColSettings);s.selectedCount=this.getSelectedCount(s.importData),s.selectAll=s.selectedCount>0,s.isLoading=!1,this.setState(s)}getRowHeaderClassName(e,t){return e.importStatus.hasError?"error-row":"valid-row"}renderCellContent(e,t,s){const i=(e,t)=>(0,h.jsxs)("span",{className:t>=0&&"link badge rounded-pill skin-bg-font margin-r-5",children:[!!e.avatarUrl&&(0,h.jsx)(w._V,{className:"margin-r-5",src:e.avatarUrl,alt:e.displayText,style:{width:"16px",height:"16px"}}),e.displayText||e.value||"",!!s&&(0,h.jsx)("span",{className:"data-null",children:"null"}),!!e.error&&(0,h.jsx)("span",{className:"fa fa-exclamation-triangle msg-error margin-l-5",title:e.error}),!!e.warning&&(0,h.jsx)("span",{className:"fa fa-exclamation-triangle msg-warning margin-l-5",title:e.warning})]});return"issuekey"!==e&&"parent"!==e||t.error?Array.isArray(t.value)?t.value.map(i):i(t):(0,h.jsx)(K.A,{href:this.$userutils.getTicketUrl(t.value),children:t.displayText||t.value})}renderFooter(){const{isLoading:e,selectedCount:t}=this.state;return(0,h.jsx)(P,{isLoading:e,selectedCount:t,clearImportData:this.clearImportData,importIssues:this.importIssues})}render(){const{columns:e,importData:t}=this.state;return super.renderBase((0,h.jsx)(f,{columns:e,rows:t,noRowMessage:W.x0,getRowHeaderClassName:this.getRowHeaderClassName,height:"calc(100vh - 152px)"}))}}const X=J}}]);