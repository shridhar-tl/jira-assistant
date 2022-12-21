"use strict";(globalThis.webpackChunkjira_assistant=globalThis.webpackChunkjira_assistant||[]).push([[18],{7154:(e,t,s)=>{s.d(t,{T2:()=>a,ZP:()=>l});var i=s(6666),o=s(1404),n=s.n(o),r=s(4711);class l{constructor(){const e=new(n().Workbook);e.created=new Date,e.creator="Jira Assistant",e.lastModifiedBy="Jira Assistant",this.document=e}addTable(e){e=i(e);const t=this.normalizeSheetName(e.attr("export-sheet-name"));console.log("Exporting ",t),this.worksheet=this.document.addWorksheet(t),this.sheetOptions={mergeCells:[],width:{},styles:[],rowsToRemove:[],rowsToHide:[]},this.curRowNum=1;const s=e.find("> thead:not([exportignore]) > tr:not([exportignore])");this.prepareData(s),console.log("header rows",s.length);const o=e.find("> tbody:not([exportignore]) > tr:not([exportignore])");this.prepareData(o),console.log("bodyRows rows",o.length),this.worksheet.views=[{state:"frozen",xSplit:0,ySplit:s.length}],this.sheetOptions.mergeCells.forEach((e=>this.worksheet.mergeCells(e)));const n=this.sheetOptions.width;Object.keys(n).forEach((e=>{const t=this.worksheet.getColumn(e),s=parseFloat(n[e])/7.178;t.width=s})),this.sheetOptions.styles.forEach((e=>{const t=this.worksheet.getCell(e.key),s=e.style,i={};"left"!==s.textAlign&&(i.horizontal=s.textAlign),"left"!==s.verticalAlign&&(i.vertical=s.verticalAlign),t.alignment=i;const o=s.fontWeight||"";t.style.font={size:this.getFontSize(s.fontSize),bold:o.indexOf("bold")>-1||o>=550}})),this.sheetOptions.rowsToHide.forEach((e=>this.worksheet.getRow(e).hidden=!0)),this.sheetOptions.rowsToRemove.orderByDescending().forEach((e=>this.worksheet.spliceRows(e,1))),this.worksheet=null,this.sheetOptions=null,this.curRowNum=null}normalizeSheetName(e){return e?e.replace(/\[/g,"(").replace(/\]/g,")").replace(/:/g,"-").replace(/[?/\\]/g,""):e}trim(e){return e.replace(/^\s+|\s+$/gm,"")}getFontSize(e){return e?e.endsWith("px")?.75*parseInt(e.replace("px",""),10):e.endsWith("pt")?parseInt(e.replace("pt",""),10):e.endsWith("em")?.0833333*parseInt(e.replace("em",""),10):void 0:e}rgbaToHex(e){if(!e)return e;const t=e.substring(e.indexOf("(")).split(","),s=parseInt(this.trim(t[0].substring(1)),10),i=parseInt(this.trim(t[1]),10),o=parseInt(this.trim(t[2]),10);t[3]=t[3]||"1)";const n=parseFloat(this.trim(t[3].substring(0,t[3].length-1))).toFixed(2);return this.fixSize(s.toString(16))+this.fixSize(i.toString(16))+this.fixSize(o.toString(16))+this.fixSize((255*n).toString(16).substring(0,2))}fixSize(e){return 1===e.length?`0${e}`:e}prepareData(e){const t=this.worksheet,s=[];e.each(((e,o)=>{o=i(o);const n=this.getColArray(o,s);if(n){t.addRow(n).commit(),this.curRowNum++}}))}getColArray(e,t){const s=e.find("> th, > td"),o=[],n=!!e.attr("exportignore");return n&&this.sheetOptions.rowsToRemove.push(this.curRowNum),e.attr("exporthidden")&&this.sheetOptions.rowsToHide.push(this.curRowNum),s.each(((e,s)=>{for(;t[o.length]>0;)t[o.length]=t[o.length]-1,o[o.length]=null;let r=(s=i(s)).attr("exportValue");if(r||(r=s.text()),r&&!n){r=r.trim();switch(s.attr("exportType")){case"int":r=function(e){if(!e)return e;const t=parseInt(e,10);return isNaN(t)?e:t}(r);break;case"float":case"number":r=function(e){if(!e)return e;const t=parseFloat(e);return isNaN(t)?e:t}(r);break;case"date":r=h(r,!0);break;case"datetime":r=h(r,!1)}}o[o.length]=r;let l=s.attr("colspan")||1;const a=(s.attr("rowspan")||1)-1;a&&(t[o.length-1]=a);const c=this.numToChar(o.length),d=this.curRowNum;if(l>1||a>0){const e=this.numToChar(o.length+(l-1)),t=this.curRowNum+a;this.sheetOptions.mergeCells.push(`${c+d}:${e}${t}`)}if(!n){if(!l||l<2){const e=s.width();e>20&&(this.sheetOptions.width[c]=e)}this.sheetOptions.styles.push({key:c+d,style:window.getComputedStyle(s.get(0),null)})}for(;l>1;)l-=1,o[o.length]=null,a&&(t[o.length-1]=a)})),o}export(e){this.document.xlsx.writeBuffer().then((t=>{!function(e,t){const s=new FileReader;s.onload=function(i){(0,r.FA)(s.result,e.type,t)},s.readAsBinaryString(e)}(new Blob([t],{type:"application/octet-stream"}),`${e}.xlsx`)}))}charToNum(e){for(let t=0,s=1;t<s;t++,s++)e==this.numToChar(t)&&(s=t)}numToChar(e){const t=(e-1)%26,s=this.chr(65+t),i=parseInt((e-1)/26,10);return i>0?this.numToChar(i)+s:s}chr(e){return e>65535?(e-=65536,String.fromCharCode(55296+(e>>10),56320+(1023&e))):String.fromCharCode(e)}}const a={XLSX:"XLSX",CSV:"CSV",PDF:"PDF"};function h(e,t){if(!e)return e;const s=new Date(e);return isNaN(s.getTime())?e:s}},9311:(e,t,s)=>{s.d(t,{Xk:()=>f.X,ZP:()=>b,jn:()=>v});var i=s(7313),o=s(8915),n=s(2328),r=s(8041),l=s(9885),a=s(6123),h=s.n(a),c=s(1485),d=s(6666),u=s(5508),p=(s(8695),s(7154)),g=s(4711);class m{export(){this.format&&"XLSX"===this.format.toUpperCase()?this.exportToXlsx():this.format&&this.format===p.T2.PDF?this.exportToPDF():this.exportToCsv()}exportToXlsx(){const e=d(this.element),t=new p.ZP(p.T2.XLSX);e.find("table.exportable").each(((e,s)=>t.addTable(s))),t.export(this.fileName)}exportToCsv(){let e=d(this.element);e.is("table")||(e=e.find("table.exportable")),this.exportTable(e,e.attr("export-sheet-name")||this.fileName||"download")}exportToPDF(){const e=d(this.element).find("table.exportable:first-child"),t=e.attr("export-sheet-name")||this.fileName||"download",s=new u.default({orientation:"landscape",unit:"in",format:"a3"});s.autoTable({html:e.get(0)}),s.save(`${t}.pdf`)}exportTable(e,t){const s=[];let i=null;function o(e,t){const s=[];e.each(((e,i)=>{d(i).children("th,td").each(((i,o)=>{o=d(o);let n=s[e];for(n||(n=s[e]=[]);null!=n[i];)i++;const r=t[i];r&&r.noExport||(t[i]={noExport:o.is("[no-export]")||o.is(":hidden")&&!o.is("[force-export]")}),n[i]=function(e){const t={encode:!0,trim:!0};let s=e.attr("export-option");s=s&&s.length>10?d.extend(t,JSON.parse(s)):t;const i=e.find("[export-data]:first");let o=(e.attr("export-data")||i.attr("export-data")||i.text()||e.text()).replace(/\r?\n|\r/g," ");return s.trim&&(o=o.trim()),o.indexOf('"')>=0&&(o=o.replace(/"/g,'""')),s.encode&&o.indexOf(",")>=0&&(o=`"${o}"`),o}(o);let l=parseInt(o.attr("colspan"));for(;l>1;)n[i+l-1]="",l--;let a=parseInt(o.attr("rowspan"));for(;a>1;){let t=s[e+a-1];t||(t=s[e+a-1]=[]),t[i]="",a--}}))}));let i="";for(let n=0;n<s.length;n++){let e="";const r=s[n];for(let s=0;s<r.length;s++){var o;null!==(o=t[s])&&void 0!==o&&o.noExport||(e+=`,${r[s]||""}`)}i+=`${e.substring(1).replace(/\r?\n|\r/g," ")}\r\n`}return i}i="string"===typeof e?o(d(`#${e} thead:not([no-export]) tr:not([no-export]):visible`),s)+o(d(`#${e} tbody:visible tr:not([no-export]):visible`),s):o(e.find("thead:not([no-export]) tr:not([no-export]):visible"),s)+o(e.find("tbody:visible tr:not([no-export]):visible"),s),(0,g.ut)(i,t)}}var f=s(551),x=s(4916),w=s(6444),C=s(6417);const v=new r.EventEmitter;let S=0;class y extends i.PureComponent{constructor(e,t,s){super(e),this.eventReceived=e=>this.executeEvent(e),this.toggleFullScreen=()=>{let{isFullScreen:e}=this.state;e=!e,this.$analytics.trackEvent("Toggle full screen",w.Jk.GadgetActions,this.title,e),e?document.body.classList.add("fs-layout"):document.body.classList.remove("fs-layout"),this.columnResizeMode=e?"fit":"expand",this.setState({isFullScreen:e})},this.addWorklogOn=e=>{this.addWorklog({ticketNo:e})},this.removeGadget=()=>{this.$analytics.trackEvent("Gadget removed",w.Jk.GadgetActions,this.title),this.performAction(f.X.RemoveGadget)},this.exportData=e=>{const t=new m;t.fileName=this.title,t.format=e||this.exportFormat,t.element=this.el,this.$analytics.trackEvent("Export data",w.Jk.GadgetActions,t.format),t.export()},this.showGadgetGontextMenu=e=>(0,c.pT)(e,this.getContextMenu()),this.getHeader=()=>{const{title:e,subTitle:t,isGadget:s,props:{draggableHandle:i}}=this,o="gadget-header"+(i?" movable":"");return(0,C.jsxs)(C.Fragment,{children:[(0,C.jsxs)("div",{ref:i,className:o,onContextMenu:s?this.showGadgetGontextMenu:null,onDoubleClick:this.toggleFullScreen,children:[(0,C.jsx)("i",{className:`fa ${this.iconClass}`})," ",e," ",t&&(0,C.jsxs)("span",{children:[" - ",t]}),(0,C.jsxs)("div",{className:"pull-right",children:[this.getTooltipElement(),this.renderCustomActions&&this.renderCustomActions(s),!this.hideRefresh&&this.getRefreshButton(),!this.hideMenu&&(0,C.jsx)(l.Z,{icon:"fa fa-wrench",onClick:e=>(0,c.pT)(e,this.getContextMenu())})]})]}),(0,C.jsx)("div",{className:"clearfix"})]})},this.setRef=e=>{this.el=e;const{dropProps:{dropConnector:t}={}}=this.props;t&&t(e)},(0,x.f3)(this,"AnalyticsService"),this.instanceId=++S,this.title=t,this.iconClass=s,this.isGadget=!1!==e.isGadget,this.settings=e.settings||{fullWidth:!1,fullHeight:!1};const{fullWidth:i=!1,fullHeight:o=!1}=this.settings;this.state={fullWidth:i,fullHeight:o}}getContextMenu(){const{isFullScreen:e,fullWidth:t,fullHeight:s}=this.state,i=this.isGadget?[{separator:!0},{label:"Full width",icon:`fa fa-${t?"check-":""}circle fs-16 margin-r-5`,command:()=>this.setSizeOptions(!t,s)},{label:"Full height",icon:`fa fa-${s?"check-":""}circle fs-16 margin-r-5`,command:()=>this.setSizeOptions(t,!s)},{separator:!0},{label:"Remove",icon:"fa fa-remove",command:()=>this.removeGadget()}]:[],o=[];return this.hideExport||(o.push({separator:!0}),this.hideCSVExport||o.push({label:"Export to CSV",icon:"fa fa-file-text-o",disabled:!this.exportData,command:()=>this.exportData(p.T2.CSV)}),this.hideXLSXExport||o.push({label:"Export to Excel",icon:"fa fa-file-excel-o",disabled:!this.exportData,command:()=>this.exportData(p.T2.XLSX)}),this.hidePDFExport||o.push({label:"Export to PDF",icon:"fa fa-file-pdf-o",disabled:!this.exportData,command:()=>this.exportData(p.T2.PDF)})),[{label:"Toggle full screen",icon:"fa fa-"+(e?"compress":"expand"),command:()=>this.toggleFullScreen()},...o,...i]}componentDidMount(){this.isGadget&&(v.on("change",this.eventReceived),this.$analytics.trackEvent("Gadget loaded",w.Jk.GadgetActions,this.title)),this._isMounted=!0}componentWillUnmount(){v.off("change",this.eventReceived)}setSizeOptions(e,t){const{settings:s}=this;s.fullWidth=e,s.fullHeight=t,this.setState({fullWidth:e,fullHeight:t}),this.saveSettings()}UNSAFE_componentWillReceiveProps(e){if(this.settings!==e.settings){this.settings=e.settings||{};const{fullWidth:t,fullHeight:s}=this.settings;this.setState({fullWidth:t,fullHeight:s})}}performAction(e,t){const{onAction:s}=this.props;s&&s({type:e,data:t},this.props.model,this.props.index)}addWorklog(e){this.performAction(f.X.AddWorklog,e)}editWorklog(e){this.performAction(f.X.AddWorklog,{id:e})}saveSettings(){this.performAction(f.X.SettingsChanged,this.settings)}executeEvent(e){}getFullScreenButton(){if(this.isGadget)return null;const{state:{isFullScreen:e}}=this;return(0,C.jsx)(l.Z,{icon:e?"fa fa-compress":"fa fa-expand",onClick:this.toggleFullScreen,title:"Toggle full screen"})}getRefreshButton(e){const{disableRefresh:t,isLoading:s}=this.state;return(0,C.jsx)(l.Z,{icon:"fa fa-refresh",disabled:t||s,onClick:e||this.refreshData,title:"Refresh data"})}getTooltipElement(){return this.getHint?(0,C.jsxs)(C.Fragment,{children:[(0,C.jsx)(n.u,{target:`.icon-hint-${this.instanceId}`,children:this.getHint()}),(0,C.jsx)("i",{className:`fa fa-info-circle icon-hint icon-hint-${this.instanceId}`,"data-pr-position":"bottom"})]}):null}renderBase(e){const{fullWidth:t,fullHeight:s,isLoading:i,isFullScreen:n}=this.state,{isGadget:r,props:{tabLayout:l,gadgetType:a}}=this;if(l)return(0,C.jsxs)(C.Fragment,{children:[e,this.renderFooter&&this.renderFooter()]});const c=t||!r,d=s||!r,u=h()("gadget",this.className,{docked:!r,"full-width":c&&!n,"full-height":d&&!n,"half-width":!c&&!n,"half-height":!d&&!n,"full-screen":n});return(0,C.jsxs)("div",{ref:this.setRef,className:u,"data-test-id":a,children:[i&&(0,C.jsx)("div",{className:"data-loader",children:(0,C.jsx)("i",{className:"fa fa-refresh fa-spin"})}),(0,C.jsxs)(o.Panel,{header:this.getHeader(),children:[e,this.renderFooter&&this.renderFooter()]})]})}render(){return(0,C.jsx)("div",{ref:this.setRef,className:"gadget half-width half-height",children:(0,C.jsx)(o.Panel,{header:"Gadget Unavailable",children:(0,C.jsx)("div",{className:"pad-22",children:"This section contains an un-known gadget. Please report about this issue to have it fixed!"})})})}}const b=y},1499:(e,t,s)=>{s.d(t,{Z:()=>d});s(7313);var i=s(9311),o=s(3997),n=s.n(o),r=s(8933),l=s(4616),a=s(794),h=s(6417);class c extends i.ZP{constructor(e,t,s){super(e,`Bulk import - [${t}]`,s),this.fileSelected=()=>{const e=this.fileSelector,t=e.files[0];if(t){if(!t.name.endsWith(".csv"))return this.$message.warning("Unknown file selected to import. Select a valid file to import"),void(e.value="");n().parse(t,{header:!0,transformHeader:this.transformHeader,skipEmptyLines:"greedy",complete:e=>{const{data:t}=e;t&&t.length||this.$message.warning("No rows found to import","No records exists"),this.processData(t)}})}e.value=""},this.getTicketLink=e=>(0,h.jsx)(a.Z,{className:"link",href:this.$userutils.getTicketUrl(e),children:e}),this.setFileSelector=e=>this.fileSelector=e,this.chooseFileForImport=()=>this.fileSelector.click(),(0,l.f3)(this,"UserUtilsService"),this.isGadget=!1,this.hideRefresh=!0}formatDate(e){return e instanceof Date?this.$userutils.formatDateTime(e):e}renderCustomActions(){return(0,h.jsxs)(h.Fragment,{children:[(0,h.jsx)("input",{ref:this.setFileSelector,type:"file",className:"hide",accept:".csv,.json, .xlsx",onChange:this.fileSelected}),(0,h.jsx)(r.zx,{icon:"fa fa-upload",onClick:this.chooseFileForImport,title:"Choose file to import"})]})}}const d=c},9018:(e,t,s)=>{s.r(t),s.d(t,{default:()=>Z});var i=s(7313),o=s(6123),n=s.n(o);const r=i.createContext({}),l=r.Provider;function a(e){return e?Array.isArray(e)?e.map(a):e instanceof Date?new Date(e.getTime()):"object"===typeof e?{...e}:e:e}function h(e){e.stopPropagation(),e.preventDefault()}var c=s(6417);class d extends i.PureComponent{constructor(){super(...arguments),this.cellType="cell",this.elementType="td",this.state={},this.editable=()=>!1!==this.props.column.editable&&!1!==this.props.column[`${this.cellType}Editable`],this.beingEdit=()=>{if(!this.editable())return;const{column:e,data:t}=this.props;this.setState({editing:!0,newValue:(null===t||void 0===t?void 0:t[e.field])||""}),this.context.beginEdit(this.props.rowIndex,this.props.index)},this.endEdit=()=>this.setNewValue(this.state.newValue),this.cancelEdit=()=>{this.context.endEdit(null,-2),this.setState({editing:!1,newValue:""})},this.setNewValue=e=>{this.context.endEdit(e,this.props.rowIndex,this.props.index),this.setState({editing:!1,newValue:""})},this.getDisplayControl=e=>{const{column:t,data:s,index:i,rowIndex:o}=this.props,n=t[`${this.cellType}Template`];return n?n(t,s,i,o,e):function(e){return e?(e instanceof Date&&e.toString(),e):e}(s[t.field])},this.setFocus=e=>null===e||void 0===e?void 0:e.focus(),this.getEditor=()=>{const{column:e,data:t,index:s,rowIndex:i}=this.props;let o=e[`${this.cellType}EditorTemplate`];return o&&(o=o(t,e,i,s,this.setNewValue,this.cancelEdit)),void 0!==o?o:(0,c.jsx)("input",{ref:this.setFocus,type:"text",className:"string-editor",value:this.state.newValue,onBlur:this.endEdit,onChange:this.valueChanged,onKeyDown:this.editorKeyDown})},this.editorKeyDown=e=>{const{which:t,keyCode:s=t}=e;13===s?this.endEdit(e):27===s&&this.cancelEdit()},this.valueChanged=e=>this.setState({newValue:e.target.value}),this.onMouseDown=e=>this.editable()&&this.context.beginSelect(this.props.rowIndex,this.props.index),this.onMouseUp=e=>this.context.endSelect(this.props.rowIndex,this.props.index),this.onMouseOver=e=>this.context.onSelecting(this.props.rowIndex,this.props.index),this.onRepeaterDoubleClick=e=>{h(e),this.context.repeatSelectedCells()},this.resizePrevious=e=>{h(e),this.context.beginResize(this.props.index-1,e)},this.resize=e=>{h(e),this.context.beginResize(this.props.index,e)},this.setTDRef=e=>this.td=e}render(){const e=this.elementType,{className:t,domProps:s,isLastCell:i,index:o}=this.props,{editing:r}=this.state,l={className:t},a=!r&&this.getDisplayControl(l);return(0,c.jsxs)(e,{ref:this.setTDRef,className:l.className,...s,onDoubleClick:this.beingEdit,onMouseDown:this.onMouseDown,onMouseUp:this.onMouseUp,onMouseOver:this.onMouseOver,children:[!r&&o>0&&"header"===this.cellType&&(0,c.jsx)("div",{className:"h-resizer-l",onMouseDown:this.resizePrevious}),!r&&i&&"cell"===this.cellType&&this.editable()&&(0,c.jsx)("div",{className:n()("cell-repeater",!!a&&"with-data"),onDoubleClick:this.onRepeaterDoubleClick,onMouseDown:h,onMouseUp:h,children:"\xa0"}),r?this.getEditor():a,!r&&"header"===this.cellType&&(0,c.jsx)("div",{className:"h-resizer-r",onMouseDown:this.resize})]})}}d.contextType=r;const u=d;class p extends u{constructor(){super(...arguments),this.cellType="cell"}}p.cellType="cell";class g extends u{constructor(){super(...arguments),this.cellType="header",this.elementType="th",this.getDisplayControl=()=>{const{column:e}=this.props;return e.headerTemplate?e.headerTemplate(e,this.index):e.displayText||e.field}}}g.setWidth=!0,g.cellType="header";class m extends u{constructor(){super(...arguments),this.cellType="footer",this.getDisplayControl=()=>null}}m.setWidth=!0,m.cellType="footer";class f extends i.PureComponent{constructor(){super(...arguments),this.state={startRow:0,startCell:0,endRow:0,endCell:0},this.handleDocumentMouseMove=e=>{if(!(this.resizingColumn>=0))return;const t=e.pageX-this.pageX,{rows:s,onChange:i}=this.props;let{columns:o}=this.props;o=[...o];const n={...o[this.resizingColumn]};o[this.resizingColumn]=n,n.width=this.colWidth+t,n.width<15?n.width=15:n.width>800&&(n.width=800),i&&i(s,o)},this.handleDocumentMouseUp=e=>{delete this.resizingColumn,delete this.pageX},this.contextAPI={beginSelect:(e,t)=>{this.state.editing||this.setState({isSelecting:!0,startRow:e,startCell:t,endRow:e,endCell:t})},endSelect:(e,t)=>{this.state.isSelecting&&this.setState({isSelecting:!1,endRow:e,endCell:t})},onSelecting:(e,t)=>{this.state.isSelecting&&this.setState({endRow:e,endCell:t})},beginEdit:(e,t)=>{this.setState({editing:!0,editingRow:e,editingCell:t})},endEdit:(e,t,s)=>{var i;const{columns:o,onChange:n,onHeaderChange:r}=this.props;let{rows:l}=this.props;if(-1===t){const t={...o[s],field:e};delete t.displayText,r&&r(t,s)}else if(t>=0){l=[...l];const i={...l[t]};l[t]=i;i[o[s].field]=e,n&&n(l,o,t,s)}this.setState({editing:!1,editingRow:-2,editingCell:-2}),null===(i=this.table)||void 0===i||i.focus()},repeatSelectedCells:()=>{const{rowStart:e,rowEnd:t,cellStart:s,cellEnd:i}=this.getOrderedSelection(),{columns:o,onChange:n}=this.props;let{rows:r}=this.props;if(t!==r.length-1){r=[...r];for(let n=s;n<=i;n++)this.repeatRowData(r,o,e,t,n);n&&n(r,o),this.setState({startRow:e,endRow:r.length-1})}},beginResize:(e,t)=>{this.resizingColumn=e,this.pageX=t.pageX,this.colWidth=this.props.columns[e].width||140}},this.getSelectionState=(e,t,s)=>{const{editing:i,copied:o}=this.state;if(s&&!o)return{};const{rowStart:n,cellStart:r,rowEnd:l,cellEnd:a}=this.getOrderedSelection(s&&o);let h=a;if(i){h+=2;const e=this.props.columns.length;h>=e&&(h=e-1)}const c=e>=n&&e<=l,d=t>=r&&t<=h,u=c&&d,p=n-1===e,g=l+1===e,m=r-1===t,f=h+1===t,{startRow:x,startCell:w}=s?o:this.state,C=s?"copy":"sel";return{isSelected:u,className:u||p||g||m||f?{[s?"copied":"selected"]:u,[`${C}-start`]:e===x&&t===w,[`${C}-top`]:d&&(n===e||g),[`${C}-right`]:c&&(a===t||h===t||m),[`${C}-bottom`]:d&&(l===e||p),[`${C}-left`]:c&&(r===t||f)}:"",isLastCell:h===t&&l===e}},this.keyDown=e=>{if(this.state.editing)return;const{which:t,keyCode:s=t,ctrlKey:i,shiftKey:o}=e;let{startRow:n,startCell:r,endRow:l,endCell:a}=this.state,h=!1;const{columns:c,rows:d}=this.props;39===s?r<c.length-1&&(o?a=i?c.length-1:a+1:(r=i?c.length-1:r+1,a=r,l=n),h=!0):37===s?r>0&&(o?a=i?0:a-1:(r=i?0:r-1,a=r,l=n),h=!0):38===s?n>-1&&(o?l=i?0:l-1:(n=i?0:n-1,l=n,a=r),h=!0):40===s||13===s?n<d.length&&(o?l=i?d.length-1:l+1:(n=i?d.length-1:n+1,l=n,a=r),h=!0):46===s?this.clearSelectedCells(d,c):i&&67===s?this.initCopyCells():i&&88===s?this.initCopyCells(!0):i&&86===s&&this.beginPaste(),h&&(l<-1?l=-1:l>d.length&&(l=d.length),a<0?a=0:a>c.length-1&&(a=c.length-1),this.setState({startRow:n,startCell:r,endRow:l,endCell:a}))},this.cellRenderer=this.getCellRenderer(p),this.setTableRef=e=>this.table=e}componentDidMount(){document.addEventListener("mousemove",this.handleDocumentMouseMove),document.addEventListener("mouseup",this.handleDocumentMouseUp)}componentWillUnmount(){document.removeEventListener("mousemove",this.handleDocumentMouseMove),document.removeEventListener("mouseup",this.handleDocumentMouseUp)}repeatRowData(e,t,s,i,o){const{field:n}=t[o];for(let r=i+1,l=s;r<e.length;r++)e[r]={...e[r],[n]:a(e[l++][n])},l>i&&(l=s)}clearSelectedCells(e,t){e=[...e];const{rowStart:s,rowEnd:i,cellStart:o,cellEnd:n}=this.getOrderedSelection();for(let l=s;l<=i;l++){const s={...e[l]};e[l]=s;for(let e=o;e<=n;e++){const{field:i}=t[e];delete s[i]}}const{onChange:r}=this.props;r&&r(e,t)}initCopyCells(e){const{startRow:t,startCell:s,endRow:i,endCell:o}=this.state;this.setState({copied:{cut:e,startRow:t,startCell:s,endRow:i,endCell:o}})}beginPaste(){const{copied:e}=this.state;if(!e)return;const{columns:t}=this.props;let{rows:s}=this.props;s=[...s];const{rowStart:i,cellStart:o,rowEnd:n,cellEnd:r}=this.getOrderedSelection(e);for(let a=o;a<=r;a++){const{editable:e,headerEditable:i,cellEditable:n,footerEditable:l}=t[a];if(!e)return;if(!i&&-1===o)return;if(!l&&(o===s.length||r===s.length))return;if(!n&&(o>=0&&o<s.length||r>=0&&r<s.length))return}const{cut:l}=e,h=[];for(let c=i;c<=n;c++){let e=s[c];l&&(e={...e},s[c]=e);const i=[];for(let s=o;s<=r;s++){const{field:o}=t[s];let n=e[o];l?delete e[o]:n=a(n),i.push(n)}h.push(i)}this.pasteData(s,t,h)}pasteData(e,t,s){var i;const{rowStart:o,cellStart:n}=this.getOrderedSelection();let r=n+s[0].length-1;r>=t.length&&(r=t.length-1);const l=t.slice(n,r+1).map((e=>e.field));let a=o;for(let d=0;d<s.length;d++,a++){const t={...e[a]};e[a]=t;const i=s[d];for(let e=0;e<i.length;e++){const s=l[e],o=i[e];t[s]=o}}const{onChange:h}=this.props;h&&h(e,t);const c={startRow:o,startCell:n,endRow:a,endCell:r};null!==(i=this.state.copied)&&void 0!==i&&i.cut&&(c.copied=null),this.setState(c)}getOrderedSelection(e){const{startRow:t,startCell:s,endRow:i,endCell:o}=e||this.state;return{rowStart:t<=i?t:i,cellStart:s<=o?s:o,rowEnd:t<=i?i:t,cellEnd:s<=o?o:s}}getCellRenderer(e){return(t,s)=>{const{editingRow:i,editingCell:o}=this.state;let{editing:r}=this.state;return i!==s&&(r=!1),(i,l)=>{let a;if(r)if(o===l)a={colSpan:3};else if(l>o&&l<o+3)return null;const h=this.getSelectionState(s,l),d=this.getSelectionState(s,l,!0);return d.isSelected&&(h.className={...h.className,...d.className}),h.className=n()(h.className),e.setWidth&&(a||(a={}),a.style={width:`${i.width||140}px`,...i.style}),(0,c.jsx)(e,{index:l,rowIndex:s,data:t,column:i,...h,domProps:a},l)}}}render(){const{tabIndex:e=1,columns:t,rows:s,showFooter:i,width:o,height:r,noRowMessage:a,getRowHeaderClassName:h,className:d}=this.props,u=this.props.columns.reduce(((e,t)=>e+(t.width||140)+2),19);return(0,c.jsx)(l,{value:this.contextAPI,children:(0,c.jsx)("div",{className:n()("src-editable-grid-container",d),style:{width:o,height:r},children:(0,c.jsxs)("table",{ref:this.setTableRef,className:"src-editable-grid",style:{width:u},cellSpacing:"0",cellPadding:"0",onKeyDown:this.keyDown,tabIndex:e,children:[(0,c.jsx)("thead",{children:(0,c.jsxs)("tr",{className:"src-h-row",children:[(0,c.jsx)("th",{className:"src-status-cell",children:"#"}),t.map(this.getCellRenderer(g)(void 0,-1))]})}),(0,c.jsxs)("tbody",{children:[!(null!==s&&void 0!==s&&s.length)&&(0,c.jsx)("tr",{children:(0,c.jsx)("td",{colSpan:t.length+1,children:a})}),null===s||void 0===s?void 0:s.map(((e,s)=>(0,c.jsxs)("tr",{className:"src-row",children:[(0,c.jsx)("th",{className:n()("src-status-cell",h(e,s)),children:s+1}),t.map(this.cellRenderer(e,s))]},s)))]}),!!i&&(0,c.jsx)("tfoot",{children:(0,c.jsxs)("tr",{className:"src-f-row",children:[(0,c.jsx)("th",{className:"src-status-cell",children:"#"}),t.map(this.getCellRenderer(m)(void 0,s.length))]})})]})})})}}const x=f;var w=s(8933),C=s(4616);const v={fontSize:12,margin:"10px 10px 0 0"};class S extends i.PureComponent{constructor(){super(...arguments),this.validateKeys=e=>{const{keyCode:t}=e;13===t?this.onBlur(e):27===t&&this.onChange(null,!1)},this.getItem=e=>({value:e}),this.setFocus=()=>this.onFocus=!0,this.onBlur=e=>{if(!this.isShowing)if(this.props.multiple)if(e.currentTarget.value){const t=[...this.props.value,this.getItem(e.currentTarget.value)];this.onChange({value:t},!0)}else this.onChange(this.props.value,!1);else this.onChange(this.getItem(e.currentTarget.value),!0);this.onFocus=!1},this.onChange=(e,t)=>this.props.onChange(e,t),this.onSelect=e=>{let{value:t}=e;const{value:s,displayText:i,iconUrl:o}=t,n={value:s,displayText:i,avatarUrl:o};if(this.props.multiple){const e=[...this.props.value,n];this.onChange({value:e},!0)}else this.onChange(n,!0)},this.onShow=()=>this.isShowing=!0,this.onHide=()=>{this.isShowing=!1,this.onFocus||this.onChange(null,!1)},this.renderTemplate=e=>(0,c.jsxs)("span",{style:v,children:[!!e.iconUrl&&(0,c.jsx)(w.Ee,{src:e.iconUrl})," ",e.label]})}render(){const{value:e,placeholder:t=this.placeholder,className:s,multiple:i}=this.props;return(0,c.jsx)(w.Qc,{value:e,displayField:"value",className:s,multiple:i,placeholder:t,dataset:this.search,maxLength:20,autoFocus:!0,onKeyUp:this.validateKeys,onSelect:this.onSelect,forceSelection:this.forceSelection,onShow:this.onShow,onHide:this.onHide,onBlur:this.onBlur,onFocus:this.setFocus,children:this.renderTemplate})}}const y=S;const b=class extends y{constructor(e){super(e),this.search=async e=>this.$suggestion.getTicketSuggestion(e),(0,C.f3)(this,"SuggestionService"),this.placeholder="Enter Jira Issue key"}};const T=class extends y{constructor(e){super(e),this.getItem=e=>{const t=e.trim().toLowerCase(),s=this.projects.filter((e=>e.value.toLowerCase()===t))[0];return s?{value:s.value,displayText:s.displayText,avatarUrl:s.iconUrl}:{value:e}},this.search=e=>{const t=e.toLowerCase();return this.projects.filter((e=>e.label.toLowerCase().indexOf(t)>-1))},(0,C.f3)(this,"JiraService","CacheService"),this.placeholder="Enter Project key",this.loadProjects()}loadProjects(){this.projects=[];const e=this.$cache.session.get("projectsForEditor");e?this.projects=e:this.$jira.getProjects().then((e=>{this.projects=e.map((e=>({value:e.key,displayText:e.name,label:`${e.key} - ${e.name}`,iconUrl:e.avatarUrls["16x16"]||e.avatarUrls["24x24"]}))),this.$cache.session.set("projectsForEditor",this.projects,10)}))}};const j=class extends y{constructor(){super(...arguments),this.forceSelection=!0,this.search=e=>{const t=e.toLowerCase(),{dataset:s}=this.props;return s.filter((e=>`${e.key} - ${e.name}`.toLowerCase().indexOf(t)>-1)).map((e=>{const{id:t,key:s,name:i,iconUrl:o}=e;return{value:s||t,label:s?`${s} - ${i}`:i,displayText:i,iconUrl:o}}))}}};class k extends i.PureComponent{constructor(e){super(e),this.editorKeyDown=e=>{const{keyCode:t}=e;13===t?this.onBlur(e):27===t&&this.onChange(this.props.value,!1)},this.onBlur=e=>this.onChange(e.currentTarget.value,!0),this.onChange=(e,t)=>this.props.onChange({value:e},t),this.setFocus=e=>null===e||void 0===e?void 0:e.focus(),this.valueChanged=e=>this.setState({newValue:e.currentTarget.value}),this.state={newValue:e.value}}render(){const{placeholder:e="Enter value"}=this.props;return(0,c.jsx)("input",{ref:this.setFocus,type:"text",className:"string-editor",placeholder:e,onBlur:this.onBlur,onKeyDown:this.editorKeyDown})}}const D=k;var N=s(1499),E=s(5257);const R="issuekey",F="parent",I="project",$="issuetype",A="assignee",M="reporter",P="timetracking.originalEstimate",U="timetracking.remainingEstimate",L={issuekey:R,ticketno:R,ticket:R,issue:R,key:R,id:R,project:I,projectkey:I,projectid:I,parent:F,parentkey:F,parentticket:F,parentticketno:F,parentissue:F,parentid:F,status:"status",issuestatus:"status",summary:"summary",priority:"priority",resolution:"resolution",description:"description",estimate:P,originalestimate:P,initialestimate:P,remaining:U,remainingestimate:U,currentestimate:U,assignee:A,assignto:A,assignedto:A,reporter:M,reported:M,reportedby:M,issuetype:$,type:$,label:"labels"};class z extends i.PureComponent{render(){const{isLoading:e,selectedCount:t,clearImportData:s,importIssues:i}=this.props,o=`Import ${t||""} Issues`;return(0,c.jsx)("div",{className:"pnl-footer",children:(0,c.jsxs)("div",{className:"pull-right",children:[(0,c.jsx)(w.zx,{type:"info",icon:"fa fa-list",label:"Clear",disabled:e,onClick:s}),(0,c.jsx)(w.zx,{type:"success",icon:"fa fa-upload",disabled:e||!(t>0),label:o,onClick:i})]})})}}const W=z;var B=s(6441);class H extends i.PureComponent{constructor(e){super(e),this.editorKeyDown=e=>{const{keyCode:t}=e;27===t&&(this.onBlur(),h(e))},this.onBlur=e=>this.onChange(this.props.value,!1),this.onChange=(e,t)=>{const s=e?{value:e,displayText:this.format(e)}:{clearValue:!0};this.props.onChange(s,t)},this.valueChanged=e=>this.onChange(e,!0),(0,C.f3)(this,"UserUtilsService");const{formatDateTime:t,formatDate:s}=this.$userutils;this.format=e.showTime?t:s}render(){const{placeholder:e="Choose a date",value:t,showTime:s}=this.props;return(0,c.jsx)(w.Mt,{className:"ja-date-editor",value:t,autoFocus:!0,showTime:s,placeholder:e,onChange:this.valueChanged,onKeyDown:this.editorKeyDown,onBlur:this.onBlur,allowClear:!0})}}const O=H;var X=s(794);const V=["selected","issuekey","delete","clone","importStatus"],G={key:b,project:T,date:O,datetime:O};class K extends N.Z{constructor(e){super(e,"Issue","fa fa-ticket"),this.getSelectedCount=e=>e.filter((e=>e.selected)).length,this.toggleAllRows=()=>{let{importData:e,selectAll:t}=this.state;t=!t,e=e.map((e=>((e={...e}).selected=!e.disabled&&t,e))),this.setState({importData:e,selectAll:t,selectedCount:this.getSelectedCount(e)})},this.toggleSelection=(e,t)=>{if(e.disabled)return;const s=this.toggleCheckBox(e,t,"selected"),i=this.getSelectedCount(s);this.setState({selectAll:i>0,selectedCount:i})},this.toggleCheckBox=(e,t,s)=>{e={...e,[s]:!e[s]};let{importData:i}=this.state;return i=[...i],i[t]=e,this.setState({importData:i}),i},this.renderSelectorHeader=()=>(0,c.jsx)(w.XZ,{checked:this.state.selectAll,onChange:this.toggleAllRows}),this.renderSelectorBody=(e,t,s,i)=>{var o;return(0,c.jsx)(w.XZ,{checked:t.selected,disabled:!t.selected&&(null===(o=t.importStatus)||void 0===o?void 0:o.hasError),onChange:()=>this.toggleSelection(t,i)})},this.renderDeleteBody=(e,t,s,i)=>t.issuekey.value&&!t.issuekey.error&&(0,c.jsx)(w.XZ,{checked:t.delete,disabled:t.clone,onChange:()=>this.toggleCheckBox(t,i,"delete")}),this.renderCloneBody=(e,t,s,i)=>t.issuekey.value&&!t.issuekey.error&&(0,c.jsx)(w.XZ,{checked:t.clone,disabled:t.delete,onChange:()=>this.toggleCheckBox(t,i,"clone")}),this.renderImportStatus=(e,t)=>{const s=t.importStatus||{hasError:!0};return s.hasError?(0,c.jsxs)("span",{children:[(0,c.jsx)("span",{className:"fa fa-exclamation-triangle msg-error",title:s.error||"Has error in one or more fields"})," Error"]}):s.hasWarning&&s.warning?(0,c.jsxs)("span",{children:[(0,c.jsx)("span",{className:"fa fa-exclamation-triangle msg-warning",title:s.warning})," Warning"]}):s.imported?(0,c.jsx)("span",{children:"Imported"}):t.selected?t.delete?(0,c.jsx)("span",{children:"Will Delete"}):t.clone?(0,c.jsx)("span",{children:"Will Clone"}):(0,c.jsx)("span",{children:"Will Import"}):(0,c.jsx)("span",{children:"Not Selected"})},this.renderIssueCells=(e,t,s,i,o)=>{let{field:r}=e,l=t[r];if(!l||"string"===typeof l)return l||"";const a=l.clearValue;let h=!0;return a||!l.jiraValue||!t.delete&&l.value?h&&(!l.value&&!a||"issuekey"===r&&!t.clone)&&(h=!1):(h=!1,l=Array.isArray(l.jiraValue)||"string"===typeof l.jiraValue?{value:l.jiraValue,error:l.error}:{...l.jiraValue,error:l.error}),h&&(o.className=n()(o.className,"data-modified")),this.renderCellContent(r,l,a)},this.invalidHeaderTemplate=e=>(0,c.jsxs)("span",{children:[e.field," ",(0,c.jsx)("span",{className:"fa fa-exclamation-triangle msg-error",title:"Unknown field. This will not be imported."})]}),this.unsupportedFieldTemplate=e=>(0,c.jsxs)("span",{children:[e.field," ",(0,c.jsx)("span",{className:"fa fa-exclamation-triangle msg-error",title:"Unsupported field. This will not be imported."})]}),this.setFocus=e=>null===e||void 0===e?void 0:e.focus(),this.renderCellEditor=(e,t,s,i,o,n)=>{const{fieldType:r}=t,l=e[t.field];let a,h=G[r];const d="datetime"===r;!h&&null!==l&&void 0!==l&&l.allowedValues?(h=j,a=l.allowedValues):h||(h=D);let u=null===l||void 0===l?void 0:l.value;return u||null!==l&&void 0!==l&&l.clearValue||(u=null===l||void 0===l?void 0:l.jiraValue,"object"===typeof u&&(u=u.value)),(0,c.jsx)(h,{value:u,onChange:(e,i)=>this.valueChanged(e,i,n,t,s),dataset:a,multiple:!(null===l||void 0===l||!l.isArray),showTime:d})},this.valueChanged=async(e,t,s,i,o)=>{if(t){let{importData:t}=this.state;const s={...t[o]};t=[...t];const n={...s[i.field]};delete n.value,delete n.displayText,delete n.avatarUrl,s[i.field]={...n,...e};const{columns:r,addedFields:l}=this.state;t[o]=await this.$ticket.validateIssueForImport(s,r,l,!1,this.defaultColSettings),this.setState({importData:t})}s()},this.clearImportData=()=>{this.setState({columns:null,importData:null,selectedCount:null})},this.importIssues=async()=>{const{columns:e,addedFields:t}=this.state;let{importData:s}=this.state;s=[...s],this.setState({isLoading:!0,uploading:!0});const i=e.filter((e=>!V.includes(e.field))),o=s.findAllIndex((e=>e.selected));try{await o.mapAsync((async e=>{const o={...s[e]};s[e]=o,await this.$ticket.importIssue(o,i,t)}))}finally{this.setState({isLoading:!1,uploading:!1,importData:s})}},this.className="import-issue",(0,C.f3)(this,"JiraService","TicketService","MessageService","UserUtilsService"),this.defaultColSettings={cellTemplate:this.renderIssueCells,cellEditorTemplate:this.renderCellEditor},this.defaultColumns=(0,B.qC)({selected:{headerTemplate:this.renderSelectorHeader,cellTemplate:this.renderSelectorBody},importStatus:{cellTemplate:this.renderImportStatus},clone:{cellTemplate:this.renderCloneBody},delete:{cellTemplate:this.renderDeleteBody}},this.defaultColSettings),this.state={columns:this.defaultColumns,importData:[]},this.$jira.getCustomFields().then((e=>{var t;this.customFields=e,this.colMapping=e.reduce(((e,t)=>(e[t.id]=t,e)),{}),this.transformHeader=(t=e,e=>{e=e.replace(/ /g,"").toLowerCase();let s=L[e]||null;if(!s){const i=t.first((t=>t.id.toLowerCase()===e||t.name.replace(/ /g,"").toLowerCase()===e||t.clauseNames&&t.clauseNames.some((t=>t.replace(/ /g,"").toLowerCase()===e))));i&&(s=i.id)}return s||e})}))}async processData(e){this.setState({isLoading:!0});const t=(0,E.XA)(e,this.colMapping,this.defaultColumns,this.invalidHeaderTemplate,this.unsupportedFieldTemplate,this.defaultColSettings),s=await this.$ticket.validateIssuesForImport(t,this.defaultColSettings);s.selectedCount=this.getSelectedCount(s.importData),s.selectAll=s.selectedCount>0,s.isLoading=!1,this.setState(s)}getRowHeaderClassName(e,t){return e.importStatus.hasError?"error-row":"valid-row"}renderCellContent(e,t,s){const i=(e,t)=>(0,c.jsxs)("span",{className:t>=0&&"link badge badge-pill skin-bg-font margin-r-5",children:[!!e.avatarUrl&&(0,c.jsx)(w.Ee,{className:"margin-r-5",src:e.avatarUrl,alt:e.displayText,style:{width:"16px",height:"16px"}}),e.displayText||e.value||"",!!s&&(0,c.jsx)("span",{className:"data-null",children:"null"}),!!e.error&&(0,c.jsx)("span",{className:"fa fa-exclamation-triangle msg-error margin-l-5",title:e.error}),!!e.warning&&(0,c.jsx)("span",{className:"fa fa-exclamation-triangle msg-warning margin-l-5",title:e.warning})]});return"issuekey"!==e&&"parent"!==e||t.error?Array.isArray(t.value)?t.value.map(i):i(t):(0,c.jsx)(X.Z,{href:this.$userutils.getTicketUrl(t.value),children:t.displayText||t.value})}renderFooter(){const{isLoading:e,selectedCount:t}=this.state;return(0,c.jsx)(W,{isLoading:e,selectedCount:t,clearImportData:this.clearImportData,importIssues:this.importIssues})}render(){const{columns:e,importData:t}=this.state;return super.renderBase((0,c.jsx)(x,{columns:e,rows:t,noRowMessage:B.pU,getRowHeaderClassName:this.getRowHeaderClassName,height:"calc(100vh - 140px)"}))}}const Z=K}}]);