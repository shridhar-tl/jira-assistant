"use strict";(globalThis.webpackChunkjira_assistant=globalThis.webpackChunkjira_assistant||[]).push([[661],{2519:(e,n,t)=>{t.d(n,{t:()=>D});var r=t(9950),o=t(8535),i=t(9311),a=t(3582),u=t(3103),l=t(701),c=t(7323),s=t(797);function p(){return p=Object.assign?Object.assign.bind():function(e){for(var n=1;n<arguments.length;n++){var t=arguments[n];for(var r in t)({}).hasOwnProperty.call(t,r)&&(e[r]=t[r])}return e},p.apply(null,arguments)}var m=r.memo(r.forwardRef((function(e,n){var t=s.z.getPTI(e);return r.createElement("svg",p({ref:n,width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg"},t),r.createElement("path",{d:"M5.25 11.1728C5.14929 11.1694 5.05033 11.1455 4.9592 11.1025C4.86806 11.0595 4.78666 10.9984 4.72 10.9228C4.57955 10.7822 4.50066 10.5916 4.50066 10.3928C4.50066 10.1941 4.57955 10.0035 4.72 9.86283L7.72 6.86283L4.72 3.86283C4.66067 3.71882 4.64765 3.55991 4.68275 3.40816C4.71785 3.25642 4.79932 3.11936 4.91585 3.01602C5.03238 2.91268 5.17819 2.84819 5.33305 2.83149C5.4879 2.81479 5.64411 2.84671 5.78 2.92283L9.28 6.42283C9.42045 6.56346 9.49934 6.75408 9.49934 6.95283C9.49934 7.15158 9.42045 7.34221 9.28 7.48283L5.78 10.9228C5.71333 10.9984 5.63193 11.0595 5.5408 11.1025C5.44966 11.1455 5.35071 11.1694 5.25 11.1728Z",fill:"currentColor"}))})));m.displayName="AngleRightIcon";var f=t(233);function d(){return d=Object.assign?Object.assign.bind():function(e){for(var n=1;n<arguments.length;n++){var t=arguments[n];for(var r in t)({}).hasOwnProperty.call(t,r)&&(e[r]=t[r])}return e},d.apply(null,arguments)}function b(e){return b="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},b(e)}function y(e){var n=function(e,n){if("object"!=b(e)||!e)return e;var t=e[Symbol.toPrimitive];if(void 0!==t){var r=t.call(e,n||"default");if("object"!=b(r))return r;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===n?String:Number)(e)}(e,"string");return"symbol"==b(n)?n:n+""}function v(e,n,t){return(n=y(n))in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function x(e,n){(null==n||n>e.length)&&(n=e.length);for(var t=0,r=Array(n);t<n;t++)r[t]=e[t];return r}function g(e,n){return function(e){if(Array.isArray(e))return e}(e)||function(e,n){var t=null==e?null:"undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(null!=t){var r,o,i,a,u=[],l=!0,c=!1;try{if(i=(t=t.call(e)).next,0===n){if(Object(t)!==t)return;l=!1}else for(;!(l=(r=i.call(t)).done)&&(u.push(r.value),u.length!==n);l=!0);}catch(e){c=!0,o=e}finally{try{if(!l&&null!=t.return&&(a=t.return(),Object(a)!==a))return}finally{if(c)throw o}}return u}}(e,n)||function(e,n){if(e){if("string"==typeof e)return x(e,n);var t={}.toString.call(e).slice(8,-1);return"Object"===t&&e.constructor&&(t=e.constructor.name),"Map"===t||"Set"===t?Array.from(e):"Arguments"===t||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t)?x(e,n):void 0}}(e,n)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}var h={root:function(e){var n=e.context;return(0,c.xW)("p-contextmenu p-component",{"p-input-filled":n&&"filled"===n.inputStyle||"filled"===o.Ay.inputStyle,"p-ripple-disabled":n&&!1===n.ripple||!1===o.Ay.ripple})},menu:function(e){var n=e.menuProps;return(0,c.xW)({" p-contextmenu-root-list":n.root,"p-submenu-list":!n.root})},menuitem:function(e){var n=e.item,t=e.active,r=e.focused,o=e.disabled;return(0,c.xW)("p-menuitem",{"p-menuitem-active p-highlight":t,"p-focus":r,"p-disabled":o},n.className)},action:function(e){var n=e.item;return(0,c.xW)("p-menuitem-link",{"p-disabled":n.disabled})},content:"p-menuitem-content",icon:"p-menuitem-icon",submenuIcon:"p-submenu-icon",label:"p-menuitem-text",separator:"p-menuitem-separator",transition:"p-contextmenu",submenuTransition:"p-contextmenusub"},I=i.x.extend({defaultProps:{__TYPE:"ContextMenu",id:null,ariaLabel:null,ariaLabelledby:null,model:null,style:null,className:null,global:!1,autoZIndex:!0,baseZIndex:0,tabIndex:0,breakpoint:void 0,scrollHeight:"400px",appendTo:null,transitionOptions:null,onFocus:null,onBlur:null,onShow:null,onHide:null,submenuIcon:null,children:void 0},css:{classes:h,styles:"\n@layer primereact {\n    .p-contextmenu ul {\n        margin: 0;\n        padding: 0;\n        list-style: none;\n    }\n\n    .p-contextmenu .p-submenu-list {\n        position: absolute;\n        min-width: 100%;\n        z-index: 1;\n    }\n\n    .p-contextmenu .p-menuitem-link {\n        cursor: pointer;\n        display: flex;\n        align-items: center;\n        text-decoration: none;\n        overflow: hidden;\n        position: relative;\n    }\n\n    .p-contextmenu .p-menuitem-text {\n        line-height: 1;\n    }\n\n    .p-contextmenu .p-menuitem {\n        position: relative;\n    }\n\n    .p-contextmenu .p-menuitem-link .p-submenu-icon {\n        margin-left: auto;\n    }\n\n    .p-contextmenu-enter {\n        opacity: 0;\n    }\n\n    .p-contextmenu-enter-active {\n        opacity: 1;\n        transition: opacity 250ms;\n    }\n}\n"}});function E(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);n&&(r=r.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,r)}return t}function w(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?E(Object(t),!0).forEach((function(n){v(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):E(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}var k=r.memo(r.forwardRef((function(e,n){var t=(0,u.qV)(),o=r.useRef(null),i=e.root||!e.resetMenu,l=e.ptm,s=e.cx,p=function(n,t,r){return l(t,{hostName:e.hostName,context:{active:g(n),focused:E(n),disabled:I(n),index:r}})},b=function(){if(!e.isMobileMode){var n=o.current.parentElement,t=c.DV.getOffset(n),r=c.DV.getViewport(),i=o.current.offsetParent?o.current.offsetWidth:c.DV.getHiddenElementOuterWidth(o.current),a=c.DV.getOuterWidth(n.children[0]),u=parseInt(t.top,10)+o.current.offsetHeight-c.DV.getWindowScrollTop();u>r.height?o.current.style.top=r.height-u+"px":o.current.style.top="0px",parseInt(t.left,10)+a+i>r.width-c.DV.calculateScrollbarWidth()?o.current.style.left=-1*i+"px":o.current.style.left=a+"px"}};(0,u.w5)((function(){i&&b()}));var y=function(n){return"".concat(e.menuId,"_").concat(n.key)},x=function(e,n,t){return e&&e.item?c.BF.getItemValue(e.item[n],t):void 0},g=function(n){return e.activeItemPath&&e.activeItemPath.some((function(e){return e.key===n.key}))},h=function(e){return!1!==x(e,"visible")},I=function(e){return x(e,"disabled")},E=function(n){return e.focusedItemId===y(n)},S=function(e){return c.BF.isNotEmpty(e.items)},O=function(n){return n-e.model.slice(0,n).filter((function(e){return h(e)&&x(e,"separator")})).length+1};r.useImperativeHandle(n,(function(){return{props:e,getElement:function(){return o.current}}}));var D=function(n,o){if(!h(n))return null;var i=n.item,a=g(n),u=I(n),d=E(n),b=S(n),D=y(n),P=t({className:s("icon")},p(n,"icon",o)),N=c.Hj.getJSXIcon(i.icon,w({},P),{props:e.menuProps}),j=t({className:s("submenuIcon")},p(n,"submenuIcon",o)),C=t({className:s("label")},p(n,"label",o)),V=x(n,"items")&&c.Hj.getJSXIcon(e.submenuIcon||r.createElement(m,j),w({},j),{props:e.menuProps}),M=i.label&&r.createElement("span",C,i.label),A=function(n,t){return S(n)?r.createElement(k,{id:e.id+"_"+t,role:"menu",menuId:e.menuId,focusedItemId:e.focusedItemId,activeItemPath:e.activeItemPath,level:e.level+1,hostName:e.hostName,ariaLabelledby:y(n),menuProps:e.menuProps,model:n.items,resetMenu:!g(n),onLeafClick:e.onLeafClick,onItemClick:e.onItemClick,onItemMouseEnter:e.onItemMouseEnter,isMobileMode:e.isMobileMode,submenuIcon:e.submenuIcon,ptm:l,cx:s}):null}(n,o),L=t({href:i.url||"#","aria-hidden":!0,tabIndex:-1,className:s("action",{item:i}),target:i.target},p(n,"action",o)),T=r.createElement("a",L,N,M,V,r.createElement(f.n,null));if(i.template){var B={className:"p-menuitem-link",labelClassName:"p-menuitem-text",iconClassName:"p-menuitem-icon",submenuIconClassName:s("submenuIcon"),element:T,props:e,active:a};T=c.BF.getJSXElement(i.template,i,B)}var H=t({onClick:function(t){return function(n,t){var r=t.item;r.disabled?n.preventDefault():(r.command&&r.command({originalEvent:n,item:r}),e.onItemClick({originalEvent:n,processedItem:t,isFocus:!0}),r.items||e.onLeafClick(n),r.url||(n.preventDefault(),n.stopPropagation()))}(t,n)},onMouseEnter:function(t){return function(n,t){t.disabled||e.isMobileMode?n.preventDefault():e.onItemMouseEnter({originalEvent:n,processedItem:t})}(t,n)},className:s("content")},p(n,"content",o)),K=t(v({id:D,key:D,role:"menuitem","aria-label":i.label,"aria-disabled":u,"aria-expanded":b?a:void 0,"aria-haspopup":b&&!i.url?"menu":void 0,"aria-level":e.level+1,"aria-setsize":e.model.filter((function(e){return h(e)&&!x(e,"separator")})).length,"aria-posinset":O(o),"data-p-highlight":a,"data-p-focused":d,"data-p-disabled":u,className:s("menuitem",{item:i,active:a,focused:d,disabled:I(i)}),style:i.style},"key",D),p(n,"menuitem",o));return r.createElement("li",K,r.createElement("div",H,T),A)},P=function(n,o){return!1===n.visible?null:n.separator?function(n){var o=e.id+"_separator_"+n,i=t({id:o,key:o,className:s("separator"),role:"separator"},l("separator",{hostName:e.hostName}));return r.createElement("li",i)}(o):D(n,o)},N=e.model?e.model.map(P):null,j=t({className:s("menu",{menuProps:e}),onFocus:e.onFocus,onBlur:e.onBlur,onKeyDown:e.onKeyDown,"aria-label":e.ariaLabel,"aria-labelledby":e.ariaLabelledby,"aria-orientation":"vertical","aria-activedescendant":e.ariaActivedescendant,tabIndex:e.tabIndex,role:e.role},l("menu",{hostName:e.hostName})),C=t({classNames:s("submenuTransition"),in:i,timeout:{enter:0,exit:0},unmountOnExit:!0,onEnter:function(){b()}},l("menu.transition",{hostName:e.hostName}));return r.createElement(a.B,d({nodeRef:o},C),r.createElement("ul",d({ref:o},j),N))})));function S(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);n&&(r=r.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,r)}return t}function O(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?S(Object(t),!0).forEach((function(n){v(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):S(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}k.displayName="ContextMenuSub";var D=r.memo(r.forwardRef((function(e,n){var t=(0,u.qV)(),s=r.useContext(o.UM),p=I.getProps(e,s),m=g(r.useState(p.id),2),f=m[0],b=m[1],y=g(r.useState(!1),2),v=y[0],x=y[1],h=g(r.useState(!1),2),E=h[0],w=h[1],S=g(r.useState(!1),2),D=S[0],P=S[1],N=g(r.useState(null),2),j=N[0],C=N[1],V=g(r.useState(!1),2),M=V[0],A=V[1],L=g(r.useState(!1),2),T=L[0],B=L[1],H=g(r.useState({index:-1,level:0,parentKey:""}),2),K=H[0],F=H[1],W=g(r.useState(""),2),_=W[0],R=W[1],Z=g(r.useState([]),2),U=Z[0],$=Z[1],z=g(r.useState([]),2),Q=z[0],X=z[1],J=g(r.useState(null),2),Y=J[0],q=J[1],G=I.setMetaData({props:p,state:{id:f,visible:v,reshow:E,resetMenu:D,attributeSelector:j}}),ee=G.ptm,ne=G.cx,te=G.isUnstyled;(0,i.j)(I.css.styles,te,{name:"contextmenu"});var re=r.useRef(null),oe=r.useRef(null),ie=r.useRef(null),ae=r.useRef(""),ue=r.useRef(null),le=r.useRef(null),ce=(0,u.N$)("screen and (max-width: ".concat(p.breakpoint,")"),!!p.breakpoint),se=g((0,u.ML)({type:"click",listener:function(e){Pe(e)&&2!==e.button&&(he(e),P(!0))}}),2),pe=se[0],me=se[1],fe=g((0,u.ML)({type:"contextmenu",when:p.global,listener:function(e){ge(e)}}),1)[0],de=g((0,u.Ce)({listener:function(e){v&&!c.DV.isTouchDevice()&&he(e)}}),2),be=de[0],ye=de[1],ve=function(){if(!le.current){le.current=c.DV.createInlineStyle(s&&s.nonce||o.Ay.nonce,s&&s.styleContainer);var e="".concat(j),n="\n@media screen and (max-width: ".concat(p.breakpoint,") {\n    .p-contextmenu[").concat(e,"] > ul {\n        max-height: ").concat(p.scrollHeight,";\n        overflow: ").concat(p.scrollHeight?"auto":"",";\n    }\n\n    .p-contextmenu[").concat(e,"] .p-submenu-list {\n        position: relative;\n    }\n\n    .p-contextmenu[").concat(e,"] .p-menuitem-active > .p-submenu-list {\n        left: 0;\n        box-shadow: none;\n        border-radius: 0;\n        padding: 0 0 0 calc(var(--inline-spacing) * 2); /* @todo */\n    }\n\n    .p-contextmenu[").concat(e,"] .p-menuitem-active > .p-menuitem-link > .p-submenu-icon {\n        transform: rotate(-180deg);\n    }\n\n    .p-contextmenu[").concat(e,'] .p-submenu-icon:before {\n        content: "\\e930";\n    }\n}\n');le.current.innerHTML=n}},xe=function(){le.current=c.DV.removeInlineStyle(le.current)},ge=function(e){R([]),F({index:-1,level:0,parentKey:""}),e.stopPropagation(),e.preventDefault(),ie.current=e,v?w(!0):(x(!0),p.onShow&&p.onShow(ie.current)),Promise.resolve().then((function(){oe.current&&c.DV.focus(oe.current.getElement())}))},he=function(e){ie.current=e,x(!1),w(!1),R([]),F({index:-1,level:0,parentKey:""}),p.onHide&&p.onHide(ie.current)},Ie=function(){c.DV.addStyles(re.current,{position:"absolute"}),p.autoZIndex&&c.Q$.set("menu",re.current,s&&s.autoZIndex||o.Ay.autoZIndex,p.baseZIndex||s&&s.zIndex.menu||o.Ay.zIndex.menu),Se(ie.current),j&&p.breakpoint&&(re.current.setAttribute(j,""),ve())},Ee=function(){Ne()},we=function(){je(),c.Q$.clear(re.current)},ke=function(){c.Q$.clear(re.current),xe()},Se=function(e){if(e){var n=e.pageX+1,t=e.pageY+1,r=re.current.offsetParent?re.current.offsetWidth:c.DV.getHiddenElementOuterWidth(re.current),o=re.current.offsetParent?re.current.offsetHeight:c.DV.getHiddenElementOuterHeight(re.current),i=c.DV.getViewport();n+r-document.body.scrollLeft>i.width&&(n-=r),t+o-document.body.scrollTop>i.height&&(t-=o),n<document.body.scrollLeft&&(n=document.body.scrollLeft),t<document.body.scrollTop&&(t=document.body.scrollTop),re.current.style.left=n+"px",re.current.style.top=t+"px"}},Oe=r.useCallback((function(e,n){var t=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{},r=arguments.length>3&&void 0!==arguments[3]?arguments[3]:"",o=[];return e&&e.forEach((function(e,i){var a=(""!==r?r+"_":"")+i,u={item:e,index:i,level:n,separator:e.separator,key:a,parent:t,parentKey:r};u.items=Oe(e.items,n+1,u,a),o.push(u)})),o}),[]),De=function(e){P(!0),he(e),e.stopPropagation()},Pe=function(e){return re&&re.current&&!(re.current.isSameNode(e.target)||re.current.contains(e.target))},Ne=function(){be(),pe()},je=function(){ye(),me()};(0,u.uU)((function(){var e=(0,c._Y)();!f&&b(e),p.global&&fe(),p.breakpoint&&!j&&C(e)})),(0,u.w5)((function(){p.global&&fe()}),[p.global]),(0,u.w5)((function(){return j&&re.current&&(re.current.setAttribute(j,""),ve()),function(){xe()}}),[j,p.breakpoint]),(0,u.w5)((function(){v?(x(!1),w(!1),P(!0)):E||v||!D||ge(ie.current)}),[E]),r.useEffect((function(){var e=p.model||[],n=Oe(e,0,null,"");$(n)}),[p.model,Oe]),(0,u.w5)((function(){var e=-1!==K.index?"".concat(f).concat(c.BF.isNotEmpty(K.parentKey)?"_"+K.parentKey:"","_").concat(K.index):null;q(e)}),[K]),(0,u.w5)((function(){var e=_&&_.find((function(e){return e.key===K.parentKey})),n=e?e.items:U;X(n)}),[_,K]),(0,u.w5)((function(){if(T){var e=-1!==K.index?nn(K.index):un();Qe(e),R(_.filter((function(e){return e.parentKey!==K.parentKey}))),B(!1)}}),[T]),(0,u.l0)((function(){c.Q$.clear(re.current)})),r.useImperativeHandle(n,(function(){return{props:p,show:ge,hide:he,getElement:function(){return re.current}}}));var Ce=function(e){A(!0),F(-1!==K.index?K:{index:-1,level:0,parentKey:""}),p.onFocus&&p.onFocus(e)},Ve=function(e){A(!1),F({index:-1,level:0,parentKey:""}),ae.current="",ae.current="",p.onBlur&&p.onBlur(e)},Me=function(e){var n=e.metaKey||e.ctrlKey;switch(e.code){case"ArrowDown":Be(e);break;case"ArrowUp":He(e);break;case"ArrowLeft":Ke(e);break;case"ArrowRight":Fe(e);break;case"Home":We(e);break;case"End":_e(e);break;case"Space":Ze(e);break;case"Enter":case"NumpadEnter":Re(e);break;case"Escape":Ue(e);break;case"Tab":$e(e);break;case"PageDown":case"PageUp":case"Backspace":case"ShiftLeft":case"ShiftRight":break;default:!n&&c.BF.isPrintableCharacter(e.key)&&ze(e,e.key)}},Ae=function(e){var n=e.processedItem,t=e.isFocus,r=e.updateState,o=void 0===r||r;if(!c.BF.isEmpty(n)){var i=n.index,a=n.key,u=n.level,l=n.parentKey,s=n.items,p=c.BF.isNotEmpty(s),m=_.filter((function(e){return e.parentKey!==l&&e.parentKey!==a}));p&&o&&(m.push(n),x(!0)),F({index:i,level:u,parentKey:l}),R(m),t&&c.DV.focus(oe.current.getElement())}},Le=function(e){var n=e.processedItem,t=qe(n);if(rn(n)){var r=n.index,o=n.key,i=n.level,a=n.parentKey;R(_.filter((function(e){return o!==e.key&&o.startsWith(e.key)}))),F({index:r,level:i,parentKey:a}),c.DV.focus(oe.current.getElement())}else t?Ae(e):he()},Te=function(e){Ae(e)},Be=function(e){var n=-1!==K.index?nn(K.index):un();Qe(n),e.preventDefault()},He=function(e){if(e.altKey){if(-1!==K.index){var n=Q[K.index];!qe(n)&&Ae({originalEvent:e,processedItem:n})}e.preventDefault()}else{var t=-1!==K.index?tn(K.index):ln();Qe(t),e.preventDefault()}},Ke=function(e){var n=Q[K.index],t=_.find((function(e){return e.key===n.parentKey}));c.BF.isEmpty(n.parent)||(F({index:-1,parentKey:t?t.parentKey:""}),ae.current="",setTimeout((function(){return B(!0)}),0)),e.preventDefault()},Fe=function(e){var n=Q[K.index];qe(n)&&(Ae({originalEvent:e,processedItem:n}),F({index:-1,parentKey:n.key}),ae.current="",setTimeout((function(){return B(!0)}),0)),e.preventDefault()},We=function(e){Qe(on()),e.preventDefault()},_e=function(e){Qe(an()),e.preventDefault()},Re=function(e){if(-1!==K.index){var n=c.DV.findSingle(oe.current.getElement(),'li[id="'.concat("".concat(Y),'"]')),t=n&&c.DV.findSingle(n,'a[data-pc-section="action"]');t?t.click():n&&n.click();var r=Q[K.index];!qe(r)&&F(O(O({},K),{},{index:un()}))}e.preventDefault()},Ze=function(e){Re(e)},Ue=function(e){he(),F({focusedItemInfo:K,index:un()}),e.preventDefault()},$e=function(e){if(-1!==K.index){var n=Q[K.index];!qe(n)&&Ae({originalEvent:e,processedItem:n})}he()},ze=function(e,n){ae.current=ae.current||""+n;var t=-1,r=!1;return-1!==(t=-1!==K.index?-1===(t=Q.slice(K.index).findIndex((function(e){return en(e)})))?Q.slice(0,K.index).findIndex((function(e){return en(e)})):t+K.index:Q.findIndex((function(e){return en(e)})))&&(r=!0),-1===t&&-1===K.index&&(t=un()),-1!==t&&Qe(t),ue.current&&clearTimeout(ue.current),ue.current=setTimeout((function(){ae.current="",ue.current=null}),500),r},Qe=function(e){K.index!==e&&(F(O(O({},K),{},{index:e})),Xe())},Xe=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:-1,n=-1!==e?"".concat(f,"_").concat(e):Y,t=c.DV.findSingle(oe.current.getElement(),'li[id="'.concat(n,'"]'));t&&t.scrollIntoView&&t.scrollIntoView({block:"nearest",inline:"start"})},Je=function(e,n){return e?c.BF.getItemValue(e[n]):void 0},Ye=function(e){return e?(n=e.item,Je(n,"label")):void 0;var n},qe=function(e){return e&&c.BF.isNotEmpty(e.items)},Ge=function(e){return!!e&&(n=e.item,!Je(n,"disabled"))&&!function(e){return Je(e,"separator")}(e.item);var n},en=function(e){return Ge(e)&&Ye(e).toLocaleLowerCase().startsWith(ae.current.toLocaleLowerCase())},nn=function(e){var n=e<Q.length-1?Q.slice(e+1).findIndex((function(e){return Ge(e)})):-1;return n>-1?n+e+1:e},tn=function(e){var n=e>0?c.BF.findLastIndex(Q.slice(0,e),(function(e){return Ge(e)})):-1;return n>-1?n:e},rn=function(e){return _&&_.some((function(n){return n.key===e.key}))},on=function(){return Q.findIndex((function(e){return Ge(e)}))},an=function(){return c.BF.findLastIndex(Q,(function(e){return Ge(e)}))},un=function(){var e=cn();return e<0?on():e},ln=function(){var e=cn();return e<0?an():e},cn=function(){return Q.findIndex((function(e){return function(e){return Ge(e)&&rn(e)}(e)}))},sn=function(){var e=t({id:p.id,className:(0,c.xW)(p.className,ne("root",{context:s})),style:p.style,onClick:function(e){P(!1)},onMouseEnter:function(e){P(!1)}},I.getOtherProps(p),ee("root")),n=t({classNames:ne("transition"),in:v,timeout:{enter:250,exit:0},options:p.transitionOptions,unmountOnExit:!0,onEnter:Ie,onEntered:Ee,onExit:we,onExited:ke},ee("transition"));return r.createElement(a.B,d({nodeRef:re},n),r.createElement("div",d({ref:re},e),r.createElement(k,{ref:oe,ariaLabel:p.ariaLabel,ariaLabelledby:p.ariaLabelledby,activeItemPath:_,hostName:"ContextMenu",id:f+"_list",role:"menubar",tabIndex:p.tabIndex||0,ariaActivedescendant:M?Y:void 0,menuId:f,focusedItemId:M?Y:void 0,menuProps:p,model:U,level:0,root:!0,onItemClick:Le,onItemMouseEnter:Te,onFocus:Ce,onBlur:Ve,onKeyDown:Me,resetMenu:D,onLeafClick:De,isMobileMode:ce,submenuIcon:p.submenuIcon,ptm:ee,cx:ne})))}();return r.createElement(l.Z,{element:sn,appendTo:p.appendTo})})));D.displayName="ContextMenu"},3023:(e,n,t)=>{t.d(n,{W:()=>w});var r=t(9950),o=t(8535),i=t(9311),a=t(3582),u=t(3103),l=t(5031),c=t(701),s=t(233),p=t(7323);function m(e){return m="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},m(e)}function f(e){var n=function(e,n){if("object"!=m(e)||!e)return e;var t=e[Symbol.toPrimitive];if(void 0!==t){var r=t.call(e,n||"default");if("object"!=m(r))return r;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===n?String:Number)(e)}(e,"string");return"symbol"==m(n)?n:n+""}function d(e,n,t){return(n=f(n))in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function b(){return b=Object.assign?Object.assign.bind():function(e){for(var n=1;n<arguments.length;n++){var t=arguments[n];for(var r in t)({}).hasOwnProperty.call(t,r)&&(e[r]=t[r])}return e},b.apply(null,arguments)}function y(e,n){(null==n||n>e.length)&&(n=e.length);for(var t=0,r=Array(n);t<n;t++)r[t]=e[t];return r}function v(e,n){if(e){if("string"==typeof e)return y(e,n);var t={}.toString.call(e).slice(8,-1);return"Object"===t&&e.constructor&&(t=e.constructor.name),"Map"===t||"Set"===t?Array.from(e):"Arguments"===t||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t)?y(e,n):void 0}}function x(e){return function(e){if(Array.isArray(e))return y(e)}(e)||function(e){if("undefined"!=typeof Symbol&&null!=e[Symbol.iterator]||null!=e["@@iterator"])return Array.from(e)}(e)||v(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function g(e,n){return function(e){if(Array.isArray(e))return e}(e)||function(e,n){var t=null==e?null:"undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(null!=t){var r,o,i,a,u=[],l=!0,c=!1;try{if(i=(t=t.call(e)).next,0===n){if(Object(t)!==t)return;l=!1}else for(;!(l=(r=i.call(t)).done)&&(u.push(r.value),u.length!==n);l=!0);}catch(e){c=!0,o=e}finally{try{if(!l&&null!=t.return&&(a=t.return(),Object(a)!==a))return}finally{if(c)throw o}}return u}}(e,n)||v(e,n)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}var h={root:function(e){var n=e.props,t=e.context;return(0,p.xW)("p-menu p-component",{"p-menu-overlay":n.popup,"p-input-filled":t&&"filled"===t.inputStyle||"filled"===o.Ay.inputStyle,"p-ripple-disabled":t&&!1===t.ripple||!1===o.Ay.ripple})},menu:"p-menu-list p-reset",content:"p-menuitem-content",action:function(e){var n=e.item;return(0,p.xW)("p-menuitem-link",{"p-disabled":n.disabled})},menuitem:function(e){var n=e.focused;return(0,p.xW)("p-menuitem",{"p-focus":n})},submenuHeader:function(e){var n=e.submenu;return(0,p.xW)("p-submenu-header",{"p-disabled":n.disabled})},separator:"p-menu-separator",label:"p-menuitem-text",icon:"p-menuitem-icon",transition:"p-connected-overlay"},I=i.x.extend({defaultProps:{__TYPE:"Menu",id:null,ariaLabel:null,ariaLabelledBy:null,tabIndex:0,model:null,popup:!1,popupAlignment:"left",style:null,className:null,autoZIndex:!0,baseZIndex:0,appendTo:null,onFocus:null,onBlur:null,transitionOptions:null,onShow:null,onHide:null,children:void 0,closeOnEscape:!0},css:{classes:h,styles:"\n@layer primereact {\n    .p-menu-overlay {\n        position: absolute;\n        /* Github #3122: Prevent animation flickering  */\n        top: -9999px;\n        left: -9999px;\n    }\n\n    .p-menu ul {\n        margin: 0;\n        padding: 0;\n        list-style: none;\n    }\n\n    .p-menu .p-menuitem-link {\n        cursor: pointer;\n        display: flex;\n        align-items: center;\n        text-decoration: none;\n        overflow: hidden;\n        position: relative;\n    }\n\n    .p-menu .p-menuitem-text {\n        line-height: 1;\n    }\n}\n",inlineStyles:{submenuHeader:function(e){return e.submenu.style},menuitem:function(e){return e.item.style}}}});function E(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);n&&(r=r.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,r)}return t}var w=r.memo(r.forwardRef((function(e,n){var t=(0,u.qV)(),m=r.useContext(o.UM),f=I.getProps(e,m),y=g(r.useState(f.id),2),v=y[0],h=y[1],w=g(r.useState(!f.popup),2),k=w[0],S=w[1],O=g(r.useState(-1),2),D=O[0],P=O[1],N=g(r.useState(-1),2),j=N[0],C=N[1],V=g(r.useState(!1),2),M=V[0],A=V[1],L=I.setMetaData({props:f,state:{id:v,visible:k,focused:M}}),T=L.ptm,B=L.cx,H=L.sx,K=L.isUnstyled,F=function(e,n){return T(e,{context:n})};(0,i.j)(I.css.styles,K,{name:"menu"});var W=r.useRef(null),_=r.useRef(null),R=r.useRef(null),Z=!!(k&&f.popup&&f.closeOnEscape),U=(0,u.qb)("menu",Z);(0,u.ai)({callback:function(e){pe(e)},when:Z&&U,priority:[u.$i.MENU,U]});var $=g((0,u.ct)({target:R,overlay:W,listener:function(e,n){n.valid&&(pe(e),P(-1))},when:k}),2),z=$[0],Q=$[1],X=function(e,n,t){n.disabled?e.preventDefault():(n.command&&n.command({originalEvent:e,item:n}),f.popup&&pe(e),f.popup||D===t||P(t),n.url||(e.preventDefault(),e.stopPropagation()))},J=function(e){A(!0),f.popup||(-1!==j?(ue(j),C(-1)):ue(0)),f.onFocus&&f.onFocus(e)},Y=function(e){A(!1),P(-1),f.onBlur&&f.onBlur(e)},q=function(e){switch(e.code){case"ArrowDown":G(e);break;case"ArrowUp":ee(e);break;case"Home":ne(e);break;case"End":te(e);break;case"Enter":case"NumpadEnter":re(e);break;case"Space":oe(e);break;case"Escape":f.popup&&(p.DV.focus(R.current),pe(e));case"Tab":f.popup&&k&&pe(e)}},G=function(e){var n=ie(D);ue(n),e.preventDefault()},ee=function(e){if(e.altKey&&f.popup)p.DV.focus(R.current),pe(e),e.preventDefault();else{var n=ae(D);ue(n),e.preventDefault()}},ne=function(e){ue(0),e.preventDefault()},te=function(e){ue(p.DV.find(W.current,'li[data-pc-section="menuitem"][data-p-disabled="false"]').length-1),e.preventDefault()},re=function(e){var n=p.DV.findSingle(W.current,'li[id="'.concat("".concat(D),'"]')),t=n&&p.DV.findSingle(n,'a[data-pc-section="action"]');f.popup&&p.DV.focus(R.current),t?t.click():n&&n.click(),e.preventDefault()},oe=function(e){re(e)},ie=function(e){var n=x(p.DV.find(W.current,'li[data-pc-section="menuitem"][data-p-disabled="false"]')).findIndex((function(n){return n.id===e}));return n>-1?n+1:0},ae=function(e){var n=x(p.DV.find(W.current,'li[data-pc-section="menuitem"][data-p-disabled="false"]')).findIndex((function(n){return n.id===e}));return n>-1?n-1:0},ue=function(e){var n=p.DV.find(W.current,'li[data-pc-section="menuitem"][data-p-disabled="false"]'),t=e>=n.length?n.length-1:e<0?0:e;t>-1&&P(n[t].getAttribute("id"))},le=function(){return-1!==D?D:null},ce=function(e){f.popup&&(k?pe(e):se(e))},se=function(e){R.current=e.currentTarget,S(!0),f.onShow&&f.onShow(e)},pe=function(e){R.current=e.currentTarget,S(!1),f.onHide&&f.onHide(e)},me=function(){p.DV.addStyles(W.current,{position:"absolute",top:"0",left:"0"}),p.Q$.set("menu",W.current,m&&m.autoZIndex||o.Ay.autoZIndex,f.baseZIndex||m&&m.zIndex.menu||o.Ay.zIndex.menu),p.DV.absolutePosition(W.current,R.current,f.popupAlignment),f.popup&&(p.DV.focus(_.current),ue(0))},fe=function(){z()},de=function(){R.current=null,Q()},be=function(){p.Q$.clear(W.current)};(0,u.uU)((function(){v||h((0,p._Y)())})),(0,u.l0)((function(){p.Q$.clear(W.current)})),r.useImperativeHandle(n,(function(){return{props:f,toggle:ce,show:se,hide:pe,getElement:function(){return W.current},getTarget:function(){return R.current}}}));var ye=function(e,n){var o=arguments.length>2&&void 0!==arguments[2]?arguments[2]:null,i={item:e,index:n,parentId:o},a=(0,p.xW)("p-menuitem-link",{"p-disabled":e.disabled}),u=(0,p.xW)("p-menuitem-icon",e.icon),l=t({className:B("icon")},F("icon",i)),c=p.Hj.getJSXIcon(e.icon,function(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?E(Object(t),!0).forEach((function(n){d(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):E(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}({},l),{props:f}),m=t({className:B("label")},F("label",i)),y=e.label&&r.createElement("span",m,e.label),x=e.id||(o||v)+"_"+n,g=t({onClick:function(n){return X(n,e,x)},onMouseMove:function(e){return function(e,n){e&&f.popup&&D!==n&&P(n)}(e,x)},className:B("content")},F("content",i)),h=t({href:e.url||"#",className:B("action",{item:e}),onFocus:function(e){return e.stopPropagation()},target:e.target,tabIndex:"-1","aria-label":e.label,"aria-hidden":!0,"aria-disabled":e.disabled,"data-p-disabled":e.disabled},F("action",i)),I=r.createElement("div",g,r.createElement("a",h,c,y,r.createElement(s.n,null)));if(e.template){var w={onClick:function(n){return X(n,e,x)},className:a,tabIndex:"-1",labelClassName:"p-menuitem-text",iconClassName:u,element:I,props:f};I=p.BF.getJSXElement(e.template,e,w)}var k=t({id:x,className:(0,p.xW)(e.className,B("menuitem",{focused:D===x})),style:H("menuitem",{item:e}),role:"menuitem","aria-label":e.label,"aria-disabled":e.disabled,"data-p-focused":le()===x,"data-p-disabled":e.disabled||!1},F("menuitem",i));return r.createElement("li",b({},k,{key:x}),I)},ve=function(e,n){return!1===e.visible?null:e.separator?function(e,n){var o=v+"_separator_"+n,i=t({id:o,className:(0,p.xW)(e.className,B("separator")),role:"separator"},T("separator"));return r.createElement("li",b({},i,{key:o}))}(e,n):e.items?function(e,n){var o=v+"_sub_"+n,i=e.items.map((function(e,n){return ye(e,n,o)})),a=t({id:o,role:"none",className:(0,p.xW)(e.className,B("submenuHeader",{submenu:e})),style:H("submenuHeader",{submenu:e}),"data-p-disabled":e.disabled},T("submenuHeader"));return r.createElement(r.Fragment,{key:o},r.createElement("li",b({},a,{key:o}),e.label),i)}(e,n):ye(e,n)},xe=function(){if(f.model){var e=f.model.map(ve),n=t({className:(0,p.xW)(f.className,B("root",{context:m})),style:f.style,onClick:function(e){return n=e,void(f.popup&&l.s.emit("overlay-click",{originalEvent:n,target:R.current}));var n}},I.getOtherProps(f),T("root")),o=t({ref:_,className:B("menu"),id:v+"_list",tabIndex:f.tabIndex||"0",role:"menu","aria-label":f.ariaLabel,"aria-labelledby":f.ariaLabelledBy,"aria-activedescendant":M?le():void 0,onFocus:J,onKeyDown:q,onBlur:Y},T("menu")),i=t({classNames:B("transition"),in:k,timeout:{enter:120,exit:100},options:f.transitionOptions,unmountOnExit:!0,onEnter:me,onEntered:fe,onExit:de,onExited:be},T("transition"));return r.createElement(a.B,b({nodeRef:W},i),r.createElement("div",b({id:f.id,ref:W},n),r.createElement("ul",o,e)))}return null}();return f.popup?r.createElement(c.Z,{element:xe,appendTo:f.appendTo}):xe})));w.displayName="Menu"}}]);