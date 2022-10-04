"use strict";(globalThis.webpackChunkjira_assistant=globalThis.webpackChunkjira_assistant||[]).push([[238],{5443:(e,s,t)=>{t.r(s),t.d(s,{default:()=>W});var i=t(7313),a=t(2135),n=t(6698),r=t(1519);var o=t(232),l=t(6444),c=t(3682),d=t(4616),h=t(1783),u=t(6848),p=t(6417);const m=[{videoId:"xNYNXWUgCeA",module:"Dashboard",route:"dashboard"},{videoId:"TxNH1HQtiX0",module:"Worklog report",route:"userdaywise"},{videoId:"6hAOtUm1lUk",module:"Worklog import",route:"import/worklog"},{videoId:"EFgXFqrGuTI",module:"Issue import",route:"import/issue"},{videoId:"HMyBkaZ09Xw",module:"Report builder",route:"advanced"}],g=[{startAt:290,videoId:"f2aBSXzbYuA",module:"Calendar",route:"calendar"},{startAt:713,videoId:"f2aBSXzbYuA",module:"Custom report",route:"customgrouped"},{startAt:1069,videoId:"f2aBSXzbYuA",module:"Settings",route:"settings"},{startAt:1147,videoId:"f2aBSXzbYuA",module:"Feedback",route:"feedback"}];class k extends h.Z{constructor(e){super(e),this.playPrev=()=>{let{index:e}=this.state;e-=1;const s=this.getVideoUrl(this.videoList[e],"Video view previous");this.setState({url:s,index:e})},this.playNext=()=>{let{index:e}=this.state;e+=1;const s=this.getVideoUrl(this.videoList[e],"Video view next");this.setState({url:s,index:e})},this.style={width:"87vw",height:"95vh"},this.className="video-help",this.videoList=[...m],this.setVideoUrl()}setVideoUrl(){const e=this.props.location.pathname.substring(2);let s=m.first((s=>~e.indexOf(s.route)));s||(s=g.first((s=>~e.indexOf(s.route))),s||(s=g[0]),this.videoList.push(s)),this.state.url=this.getVideoUrl(s),this.state.index=this.videoList.indexOf(s)}getVideoUrl(e,s){return this.$analytics.trackEvent(s||"Video help viewed",l.Jk.HeaderActions,`Video Help: ${e.module}`),`https://www.youtube.com/embed/${e.videoId}?rel=0&autoplay=1&showinfo=0&cc_load_policy=1&start=${e.startAt||0}`}render(){const{url:e,index:s}=this.state;return super.renderBase((0,p.jsxs)("div",{className:"video-help",children:[s>0&&(0,p.jsx)("div",{className:"nav-icon left",onClick:this.playPrev,children:(0,p.jsx)("span",{className:"fa fa-angle-left",title:"Play previous video"})}),(0,p.jsx)("iframe",{src:e,id:"ifVideoHelp",title:"Video Help",style:{width:"87vw",height:"95vh"},frameBorder:0,allowFullScreen:!0}),s+1<this.videoList.length&&(0,p.jsx)("div",{className:"nav-icon right",onClick:this.playNext,children:(0,p.jsx)("span",{className:"fa fa-angle-right",title:"Play next video"})})]}))}}const x=(0,u.E)(k);class f extends i.PureComponent{constructor(e){super(e),this.skinSelected=e=>{const s=e.currentTarget,t=s.attributes.skin.value;this.setSkin(t),document.body.querySelector("#divSkins .selected").classList.remove("selected"),s.classList.add("selected")},(0,d.f3)(this,"SettingsService","AnalyticsService")}async componentDidMount(){var e,s;this.selectedSkin=await this.$settings.get("skin")||"skin-blue",null===(e=document.body.querySelector(`#divSkins [skin="${this.selectedSkin}"]`))||void 0===e||null===(s=e.classList)||void 0===s||s.add("selected")}setSkin(e){const s=e;if(this.selectedSkin===e)return;const t=document.body.classList;t.remove(this.selectedSkin),this.skinClass=s,this.selectedSkin=e,this.$settings.set("skin",e),t.add(this.selectedSkin),this.$analytics.trackEvent("Skin changed",l.Jk.HeaderActions,e)}render(){return(0,p.jsxs)("div",{className:"skin-items",id:"divSkins",children:[(0,p.jsx)("div",{title:"blue",skin:"skin-blue",onClick:this.skinSelected,style:{borderColor:"#367fa9",backgroundColor:"#3c8dbc"},children:"B"}),(0,p.jsx)("div",{title:"purple",skin:"skin-purple",onClick:this.skinSelected,style:{borderColor:"#555299",backgroundColor:"#605ca8"},children:"P"}),(0,p.jsx)("div",{title:"violet",skin:"skin-violet",onClick:this.skinSelected,style:{borderColor:"#7a4889",backgroundColor:"#9055A2"},children:"V"}),(0,p.jsx)("div",{title:"sea",skin:"skin-sea",onClick:this.skinSelected,style:{borderColor:"#2d7776",backgroundColor:"#379392"},children:"S"}),(0,p.jsx)("div",{title:"green",skin:"skin-green",onClick:this.skinSelected,style:{borderColor:"#008d4c",backgroundColor:"#00a65a"},children:"G"}),(0,p.jsx)("div",{title:"green",skin:"skin-green2",onClick:this.skinSelected,style:{borderColor:"#2b954b",backgroundColor:"#33b35a"},children:"G"}),(0,p.jsx)("div",{title:"red",skin:"skin-red",onClick:this.skinSelected,style:{borderColor:"#d73925",backgroundColor:"#dd4b39"},children:"R"}),(0,p.jsx)("div",{title:"yellow",skin:"skin-yellow",onClick:this.skinSelected,style:{borderColor:"#e08e0b",backgroundColor:"#f39c12"},children:"Y"}),(0,p.jsx)("div",{title:"pink",skin:"skin-pink",onClick:this.skinSelected,style:{borderColor:"#ec2f6c",backgroundColor:"#ef5285"},children:"P"}),(0,p.jsx)("div",{title:"meadow",skin:"skin-meadow",onClick:this.skinSelected,style:{borderColor:"#1caf9a",backgroundColor:"#8cc1a2"},children:"M"}),(0,p.jsx)("div",{skin:"skin-blue2",onClick:this.skinSelected,style:{borderColor:"#557a95",backgroundColor:"#7395ae"},children:"B"}),(0,p.jsx)("div",{skin:"skin-cust8",onClick:this.skinSelected,style:{borderColor:"#64485c",backgroundColor:"#83677b"},children:"M"}),(0,p.jsx)("div",{skin:"skin-green3",onClick:this.skinSelected,style:{borderColor:"#40561a",backgroundColor:"#729a2e"},children:"B"}),(0,p.jsx)("div",{skin:"skin-cust2",onClick:this.skinSelected,style:{borderColor:"#5d5c61",backgroundColor:"#379683"},children:"G"}),(0,p.jsx)("div",{skin:"skin-cust5",onClick:this.skinSelected,style:{borderColor:"#7e685a",backgroundColor:"#afd275"},children:"G"}),(0,p.jsx)("div",{skin:"skin-cust3",onClick:this.skinSelected,style:{borderColor:"#ffe400",backgroundColor:"#747474"},children:"G"}),(0,p.jsx)("div",{title:"dark",skin:"skin-dark",onClick:this.skinSelected,style:{borderColor:"rgba(0,0,0,0.2)",backgroundColor:"#2f353a"},children:"D"})]})}}const b=f;var v=t(7544),j=t(4711),w=t(5991),C=t(6552);class S extends i.PureComponent{constructor(e){super(e),(0,d.f3)(this,"UserUtilsService")}getDescription(e,s){let t,i=e;return"object"===typeof e&&(t=e.id,i=e.text),(0,p.jsxs)("li",{children:[!!t&&(0,p.jsxs)("a",{href:`https://github.com/shridhar-tl/jira-assistant/issues/${t}`,target:"_blank",rel:"noopener noreferrer",children:["#",t," - "]}),i]},s)}render(){const{updates:e}=this.props;return(0,p.jsx)("div",{className:"release-history",children:e.map(((e,s)=>(0,p.jsxs)("div",{className:"release",children:[(0,p.jsx)("span",{className:"version-no",children:e.version}),e.publishDate&&(0,p.jsxs)("span",{children:[" (published: ",(0,p.jsx)("b",{children:this.$userutils.formatDate(e.publishDate)}),")"]}),!e.publishDate&&e.expectedOn&&(0,p.jsxs)("span",{children:[" (expected: ",(0,p.jsx)("b",{children:this.$userutils.formatDate(e.expectedOn)}),")"]}),e.availableNow&&(0,p.jsx)("span",{className:"badge badge-"+(e.isBeta?"warning":"success"),title:"Download this version from web store",children:"now available"}),(0,p.jsx)("span",{className:"changelog-header",children:"Changelog:"}),(0,p.jsx)("ul",{className:"changelogs",children:e.whatsnew.map(this.getDescription)}),e.bugs&&e.bugs.length>0&&(0,p.jsxs)(p.Fragment,{children:[(0,p.jsx)("span",{className:"changelog-header",children:"Bugs:"}),(0,p.jsx)("ul",{className:"changelogs",children:e.bugs.map(this.getDescription)})]})]},s)))})}}const N=S;var y=t(714);class A extends i.PureComponent{render(){return function(e){if(!e||"string"!==typeof e)return e;const s=[];let t=null,i=0;for(;t=L.exec(e);){const a=t[0],n=t.index;s.push(e.substring(i,n));const r=a.startsWith("#")?(0,y.BZ)(a):a;s.push((0,p.jsx)("a",{href:r,target:"_blank",rel:"noreferrer",onClick:T,children:a})),i=n+a.length}i<e.length&&s.push(e.substring(i));return s.length?s:e}(this.props.message)}}const U=A,L=/#\d+|(https?):\/\/(www\.)?[a-z0-9.:].*?(?<!\.\.?)(?=\s|[.]$|$)/g;function T(e){e.stopPropagation()}class I extends i.PureComponent{constructor(e){super(e),this.readMessage=e=>{let s=e.message,t=null;"versionInfo"===e.type?(t={width:"600px"},s=(0,p.jsx)(N,{updates:this.state.updates_info})):s=(0,p.jsx)(U,{message:s});const i=()=>this.markRead(e,!0);C.Z.alert(s,e.title,t).then(i,i)},this.markRead=(e,s)=>{if(!e.read){e.read=!0,this.$noti.markRead(e);const t=s?"Viewed":"Mark as read";this.trackAnalytics(e,t),this.setState((e=>({unread:(e.unread||1)-1})))}},this.trackViewList=()=>{const{total:e,unread:s}=this.state;this.$analytics.trackEvent("Messages: List viewed","Messages",`Messages: Total: ${e}, Unread: ${s}`)},(0,w.f3)(this,"NotificationService","AnalyticsService","UserUtilsService","UtilsService");const{updates_info:s,list:t,total:i,unread:a}=e.notifications;this.state={updates_info:s,list:t,total:i,unread:a}}trackAnalytics(e,s){this.$analytics.trackEvent(("versionInfo"===e.type?"Update Info: ":"Message: ")+s,"Messages",`Message Id: ${e.id}`)}render(){const{list:e,total:s,unread:t}=this.state;return e&&e.length?(0,p.jsxs)(n.OB,{nav:!0,direction:"down",children:[(0,p.jsxs)(n.Z_,{nav:!0,onClick:this.trackViewList,children:[(0,p.jsx)("i",{className:"fa fa-bell"}),t>0&&(0,p.jsx)("span",{className:"badge badge-danger",children:t})]}),(0,p.jsxs)(n.h_,{end:!0,className:"messages",children:[(0,p.jsx)(n.hP,{header:!0,tag:"div",children:(0,p.jsx)("div",{className:"text-center",children:(0,p.jsxs)("strong",{children:["You have ",t||s," ",t?"unread":""," messages"]})})}),e.map(((e,s)=>(0,p.jsx)(E,{message:e,onOpen:this.readMessage,onRead:this.markRead,cut:this.$utils.cut},s)))]})]}):null}}const R=I;class E extends i.PureComponent{constructor(){super(...arguments),this.readMessage=()=>this.props.onOpen(this.props.message),this.markRead=()=>this.props.onRead(this.props.message)}render(){const{message:e,cut:s}=this.props;return(0,p.jsxs)(n.hP,{tag:"div",title:"Click to view this message",children:[!e.read&&(0,p.jsx)("small",{className:"float-right mt-0",onClick:this.markRead,title:"Click to mark this message as read",children:(0,p.jsx)("span",{className:"fa fa-eye mark-read"})}),(0,p.jsxs)("div",{className:"text-truncate"+(e.read?"":" font-weight-bold"),onClick:this.readMessage,children:[e.important&&(0,p.jsx)("span",{className:"fa fa-exclamation text-danger"})," ",e.title]}),(0,p.jsx)("div",{className:"small text-muted message",onClick:this.readMessage,children:(0,p.jsx)(U,{message:s(e.message,175,!0)})})]})}}var J=t(2251);class P extends i.PureComponent{constructor(e){super(e),this.trackViewList=()=>{const{total:e}=this.state;this.$analytics.trackEvent("Jira Updates: List viewed","Updates",`Updates: Total: ${e}`)},(0,w.f3)(this,"JiraUpdatesService","AnalyticsService","UtilsService"),this.state={}}componentDidMount(){this.$jupdates.getRescentUpdates().then((e=>{this.setState(e)}))}trackAnalytics(e,s){this.$analytics.trackEvent(("versionInfo"===e.type?"Update Info: ":"Message: ")+s,"Messages",`Message Id: ${e.id}`)}render(){const{list:e,total:s,ticketCount:t}=this.state;return e&&e.length?(0,p.jsxs)(n.OB,{nav:!0,direction:"down",children:[(0,p.jsxs)(n.Z_,{nav:!0,onClick:this.trackViewList,children:[(0,p.jsx)("i",{className:"fa fa-comments"}),s>0&&(0,p.jsx)("span",{className:"badge badge-warning",children:s})]}),(0,p.jsxs)(n.h_,{right:!0,className:"jira-notifications",children:[(0,p.jsx)(n.hP,{header:!0,tag:"div",children:(0,p.jsx)("div",{className:"text-center",children:(0,p.jsxs)("strong",{children:["You have ",s," updates on ",t," issues"]})})}),(0,p.jsx)("div",{className:"noti-messages",children:e.map(((e,s)=>(0,p.jsx)(V,{message:e,cut:this.$utils.cut},s)))})]})]}):null}}const D=P;class V extends i.PureComponent{render(){const{message:e,cut:s}=this.props;return(0,p.jsxs)(n.hP,{tag:"a",title:"Click to view this ticket in jira",href:e.href,target:"_blank",children:[(0,p.jsxs)("div",{className:"text-truncate font-weight-bold",title:e.summary,children:[e.key," - ",s(e.summary,100,!0)]}),e.updates.map(((e,s)=>{let{date:t,author:i,field:a,fromString:n,toString:r}=e;return(0,p.jsxs)("div",{className:"small text-muted message",children:[(0,p.jsx)(J.H,{tag:"span",className:"user-display",user:i}),(0,p.jsxs)("span",{children:[" updated ",a," from ",n," to ",r," "]}),(0,p.jsx)(J.qm,{tag:"span",className:"date-display",date:t,quick:!0})]},s)}))]})}}var B=t(9149);const Y=B.xn?{btnText:"Extn",btnTooltip:"Go back to extension",launchText:"Launch Extension",switchText:"Switch back",launchTooltip:"Launch Jira Assistant extension once",switchTooltip:"Switch back to Jira Assistant extension"}:{btnText:"Web",btnTooltip:"Checkout Jira Assistant Web",launchText:"Launch JA Web",switchText:"Switch to JA Web",launchTooltip:"Launch latest Jira Assistant Web version once",switchTooltip:"Switch to Web version. You can come back later any time."};class $ extends i.PureComponent{constructor(e){super(e),this.switchToWeb=async()=>{await this.$settings.set("useWebVersion",!B.xn||null),window.location.href=this.getLaunchPath()},this.state={switched:!1},(0,d.f3)(this,"SettingsService","AppBrowserService")}async componentDidMount(){if(this.usingExtn=B.xn&&"1"===localStorage.getItem("authType"),B.xn){const e=await this.$jaBrowserExtn.getLaunchUrl("index.html");this.setState({launchUrl:e})}else this.setState({launchUrl:c.fL});const e=await this.$settings.get("useWebVersion");this.setState({switched:e})}getLaunchPath(){const e=this.props.location.pathname;return`${this.state.launchUrl}#${e}`}showOptions(){const{switched:e,launchUrl:s}=this.state;return!!s&&(B.RX||this.usingExtn&&e)}render(){if(!this.showOptions())return null;const e=this.getLaunchPath();return(0,p.jsx)(n.JL,{className:"d-md-down-none margin-r-5",navbar:!0,children:(0,p.jsxs)(n.OB,{nav:!0,direction:"down",children:[(0,p.jsx)(n.Z_,{nav:!0,children:(0,p.jsxs)("span",{className:"btn btn-success web-try",title:Y.btnTooltip,children:[" ",(0,p.jsx)("i",{className:"fa fa-external-link"})," ",(0,p.jsx)("strong",{children:Y.btnText})]})}),(0,p.jsxs)(n.h_,{left:!0,children:[(0,p.jsx)(n.hP,{header:!0,tag:"div",className:"text-center",children:(0,p.jsx)("strong",{children:"Jira Assistant Web"})}),(0,p.jsxs)(n.hP,{tag:"a",href:e,target:"_blank",title:Y.launchTooltip,children:[(0,p.jsx)("i",{className:"fa fa-external-link"})," ",Y.launchText]}),(0,p.jsxs)(n.hP,{tag:"button",title:Y.switchTooltip,onClick:this.switchToWeb,children:[(0,p.jsx)("i",{className:"fa fa-plug"})," ",Y.switchText]})]})]})})}}const G=(0,u.E)($);var z=t(5863),H=t(4074),M=t(3972);class Q extends i.PureComponent{constructor(e){super(e),this.showEditor=()=>this.setState({showEditor:!0}),this.hideDialog=()=>this.setState({showEditor:!1}),this.trackerUpdated=e=>{this.context.setUpdates(e),this.hideDialog()},(0,d.f3)(this,"UserUtilsService"),this.state={showEditor:!1}}render(){const e=this.context.getElapsedTimeInSecs();return e?(0,p.jsxs)("div",{className:"timer-ctl",children:[(0,p.jsx)("a",{className:"ticket-no link",href:this.$userutils.getTicketUrl(e.key),target:"_blank",rel:"noreferrer noopener",children:e.key}),(0,p.jsx)(O,{isRunning:e.isRunning,lapse:e.lapse,title:e.description},`${e.key}_${e.isRunning?"R":"S"}`),!e.isRunning&&(0,p.jsx)("span",{className:"fa fa-play",title:"Resume time tracking",onClick:this.context.resumeTimer}),e.isRunning&&(0,p.jsx)("span",{className:"fa fa-pause",title:"Pause time tracking",onClick:this.context.pauseTimer}),(0,p.jsx)("span",{className:"fa fa-stop",title:"Stop time tracking and create worklog entry",onClick:this.context.stopTimer}),(0,p.jsx)("span",{className:"fa fa-edit",title:"Edit working comment",onClick:this.showEditor}),this.state.showEditor&&(0,p.jsx)(M.Z,{editTracker:!0,onDone:this.trackerUpdated,onHide:this.hideDialog})]}):null}}Q.contextType=H.a2;const X=Q;class O extends i.PureComponent{constructor(e){super(e),this.state=this.getDisplayTime(e)}componentDidMount(){this.props.isRunning&&(this.token=setInterval((()=>this.setState(this.getDisplayTime)),1e3))}getDisplayTime(e){let{lapse:s}=e;s+=1;const t=Math.floor(s/3600),i=Math.floor(s%3600/60),a=Math.floor(s%60);let n;return n=t?`${t.pad(2)}:${i.pad(2)}:${a.pad(2)}`:i?`${i.pad(2)}:${a.pad(2)}`:`${a.pad(2)}s`,{lapse:s,display:n}}componentWillUnmount(){this.token&&clearInterval(this.token)}render(){return(0,p.jsx)("span",{className:"time-lapsed",title:this.props.title,children:this.state.display})}}class Z extends i.PureComponent{constructor(e){super(e),this.trackShare=()=>this.$analytics.trackEvent("Share option viewed",l.Jk.HeaderActions),this.showYoutubeHelp=()=>this.setState({showYoutubeVideo:!0}),this.hideYoutube=()=>this.setState({showYoutubeVideo:!1}),this.showVersionInfo=e=>{var s;e.preventDefault();const t=null===(s=this.state.notifications)||void 0===s?void 0:s.updates_info;t&&C.Z.alert((0,p.jsx)(N,{updates:t}),"Updates info",{width:"600px"}).then()},(0,d.f3)(this,"AppBrowserService","SessionService","NotificationService","AnalyticsService");const s=this.$session.CurrentUser;this.disableNotification=s.disableDevNotification,this.disableJiraUpdates=s.disableJiraUpdates,this.userId=s.userId,this.currentJiraInstance=(0,j._P)(s.jiraUrl),this.state={},this.versionNumber=B.xn?"WEB":`v ${o.Hm}`}componentDidMount(){this.$noti.getNotifications().then((e=>this.setState({notifications:e})),(e=>{console.error("Error fetching notifications: ",e)})),this.siteUrl=c.ov,this.ratingUrl=this.$jaBrowserExtn.getStoreUrl(!0),this.storeUrl=this.$jaBrowserExtn.getStoreUrl();const e=encodeURIComponent('Check out "Jira Assistant" in web store'),s=encodeURIComponent(`Check out "Jira Assistant", a open source extension / add-on for your browser from below url:\n\nChrome users: ${c.Fq}?utm_source%3Dgmail#\n\nFirefox users: ${c.Z_}\n\nEdge users: ${c.oP}\n\nOpera users: ${c.El}\n\nFor source code or to know more about the extension visit: ${c.ov}\n\n\nThis would help you to track your worklog and generate reports from Jira easily with lots of customizations. Also has lot more features like Google Calendar integration, Jira comment & meeting + worklog notifications, Worklog, Sprint and custom report generations, etc..`),t=encodeURIComponent(this.storeUrl);this.gMailShare=`https://mail.google.com/mail/u/0/?view=cm&tf=1&fs=1&su=${e}&body=${s}`,this.linkedInShare=`https://www.linkedin.com/shareArticle?mini=true&url=${t}&title=${e}&summary=${s}&source=`,this.fackbookShare=`https://www.facebook.com/sharer/sharer.php?u=${this.storeUrl}&title=${e}&description=${s}`,this.twitterShare=`https://twitter.com/intent/tweet?text=${s}`,this.$session.CurrentUser.hideDonateMenu&&document.body.classList.add("no-donation")}render(){const{ratingUrl:e,gMailShare:s,linkedInShare:t,fackbookShare:o,twitterShare:l,state:{showYoutubeVideo:c,notifications:d}}=this,{version:h,isBeta:u}=(null===d||void 0===d?void 0:d.updatesAvailable)||{};return(0,p.jsxs)(i.Fragment,{children:[(0,p.jsx)(r.NB,{className:"d-lg-none quick-view-hide",display:"md",mobile:!0,children:(0,p.jsx)("span",{className:"fa fa-bars"})}),(0,p.jsxs)("a",{href:this.siteUrl,className:"navbar-brand",target:"_blank",rel:"noopener noreferrer",children:[(0,p.jsx)("img",{src:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAId0lEQVR4Ae1XA3hdzRa9c050fMPatq2n2rbd/qqt/LHrxnVQ27bxV0FtxE6arDdn3s37an14nO+73rP3mj1rrZlr+Lcf/x+ANQGMBd9CGxr7RD5waK/wet8mIencReliWpbWDTDy78cb5aw8rcurNMXjdZrikp2ntQKMlj9cmCYYFPVQ3rspVExa3N4W7kWawdG+K3walMDBvdIVQKv8TnHxySt1VsRy6WXocNvckJE2uZtXSQ/jUtThNJ/ZdxQ3OtDCQ+/ckw9vDBDSlrR0gKvWBn3IYhQj56GQ2xhPZiJ0spKVkqcOzp+XB631hiDppYtNQ/QgyzDA4Au3ElVwYLd0kwH9euECepK6UfflbRv8aeG/FoCr0gHdSQAKcJdBuLsw0AdPHyPI7widoGYn56rD2FzYcC+TFdcVA2zQiyyhcfdZ3K/mE7DWSczMBgP61ZUXO3dBPujX2RZuSnt04wJhz12lyWLBcTGw4O6gOn8QP/Mz4V6mAnZulGIArbZpy2TKka2+LYqhrmEXm6OD7UY74T/EGq9TFS8aw38RQCbU7msd5dRp5qPpiq+wBPTBihOasAJ3HH7GRlgyXMbhA9L9xDR1KGA0N4Evc+GSeNOrQlVUIMdZvA6iIdmOhc2LIeaRvI3GKF8EQNs5dPVENXsA50knP4AlF4UG/F6U5E8xIFXIYbjVKIsbsdJzwNjlXQUAWg/Kl9R5Uk8o3E0KOhqEAi9FTsO9fC2cvyhe0Tv8lS3QmmwKkZ442zXAYN4Nv5n/jCCrmuhoFkoB3EMZcgqeVWvg6g3xKmAs8s7WWbxIVJYt62dEf+Jj4kk065w1+QML7Npi/w7hGY2r+zUOCFRGUzavlJ6Ez1Zz1rtLmN9eRk9+IQNQkFyGY7EmOHFciKKxZd+ZV+bsefG6V7nKqEoOs9ZTAOxhQR8TrUZiw1IhFdC6fAsRBWo6jVNz1ZFZUHesc5TyRpjNYgpQaWvn2nTCvq2CvgX135Ffv4glQvpsoR8k7hYrXIM/AIX7g80bwjti1Qw5Nz1P/e07zUjrtjlQSJsgjqB8iGaPCeIw0O+SAa2tCbDV0zglZFnPfPndZYW9LWagBH+ada4DCYJ/fxtdCcE03gawsQBsybd0o/GeTcKrWcZukLnb4GjyUebTsN5VzHwLtZ8pptLJU+Idr9I1GPspACrV/Thg+VfU4vcwAPXJDng3LY5bD6U395/Je2IeS0FJGWofwKh+DUDNA7utHk+zbQeV3GLtHGzmiLXz5Rwq2RF6TA60kes9xcwZVsNgxd1hAAaYe8Ldsghamq0BIy9HyetQAx4dVfi3LI3lrYthjbcc9zJRnfU1ALX377B6MsOmI20rA4BhZnNBeZGdDXW4roRHr5QDC9vZoQsJYsU17gbmWnbFUNkSQ8zdYWDcuY5fzZzQl1uImoZ9aG0Ig2epGjh6WLyXf/Bw9GHUzwD6avUOB5rujhRez9R6QfrnFkxFmLuYAWi/PnujeoZ6CNm+tg1RijvNilXgjyHIojdmWwykHYhgXqCT0ow+6O+sIzKJwjybbtgZbpWor1J9k6wOv3RN2nP2nHg6+oHsT1VQywSg4+YgnYTDGQHNabKfhdHY5M8ktXzbGumJq01jtObD6G9RzHxEqhR76qIC3Q7OVDz/odLuVCZHMcTgBe9qZXHqtHTDEJeq/rLKQ47zqV4B3mUbYGFne5w9Jx8GjKVpm8escRRzRplNp8liGRFnGXtg70YhjkovMmy+nDnEzJGtKt94TKtk8QKNN+OimC/UpMR0F3rCq2JlrOhrgx2R0v3kDHqQXbkhnfatXQ4tDREoSi5iOj8GwTPk7Mw81T0uTVm3YpAR3clSkxFdglORpjhxTLgLaAGRfmL2LMthrJBe3IG7hKbcFnQmKzCKnwEni1Eoxx8HUwK3C87li+PgcSHrdYoSTsnbQndQw7kLQpRHxXooQi6wI/SvJAI+jQoi9rGccCNKSvaqUhp1CZMTapF98K1bBjdjpJO0A0tXO4m5U8zHwoK1PxbjzBfAr1oRBI+0RshcEW617dGSW8/mFifn4FaqHi5cEB8DxjqG/HHnvnR8UbPiaEy2svY5cJfhJvbA4mEi/IYJcLTqx5it/9abLMLy/tagnVn/PEHZtqyrHTqRYPabHXcNTtatsSXCKjMlR92Z8lY9F/SLggEcUwJT0Ry1G3aECXGA9mdD/kjKUl2CJyrZE/hJzLf1Y7QSfxTTzcdTJo9EVf4g20MdxAKxJyKXMRd0Pk+PXs9y1cDMh5nNLtqdUrgRLZ0BjCUBrX/kIiFjouVolpenOcaaTcWa+VJOFtSR72q9zrFj0g3vCqXp3q1iraQFWVut6IMCYvrvQQLhXb8wrt2SjwPauG1rhLi5Snd29DLz4TzhP0JFXLriART9h4fsFJ442rWCDXedgexIAuA/2AavUpUF7wLg07LVsRuDxSTfYlXRlxLOlk4wXb+YnDqQNfAtXBObVorx2dAG5EDtH+YkpY8yn8nidKAzxIHYuJzJs1v+vfLydfGEd9WKqEn0Lj5Ee0MolvSyw4tkZd6HjifT283MbWHiG7/mBeGkdcBIiznoZ+6GmeJQeFMiRgZIyfGp6jwaK+RCaxPuKSVNtxgBe3Id9Q17mbOdPCle149mk7nxr5KVOcvHazlzLXuiH3GHi/EvWO8jJ2RC7fwp2xWzcrXuN6Ll3TvWiy82usuZkb8r2ZuXiYlnzknnUzLVUflXKt2CqVfs821DL60FW8KzeF2EzFIyXiSos969ftO44tdvKavDfKR4eoPO3BggPbv/RHECjOqX/gs4UIm1pCjHpUOdQF2xp375eP/6ZWPIydOaXr8t7z24W3hFPf3h45eKN40p8MkrPrSuaTQfzdWKLeLfafx//B38GFSYe2D4tAAAAABJRU5ErkJggg==",width:"24",height:"24",alt:"Jira Assistant",className:"navbar-brand-minimized"}),(0,p.jsxs)("span",{className:"navbar-brand-full",children:["Jira Assistant ",(0,p.jsx)("span",{className:"v-info badge badge-success",onClick:this.showVersionInfo,children:this.versionNumber})]})]}),(0,p.jsx)(r.NB,{className:"d-md-down-none quick-view-hide",display:"lg",children:(0,p.jsx)("span",{className:"fa fa-bars"})}),(0,p.jsx)("button",{className:"navbar-toggler quick-view-show",children:(0,p.jsx)("a",{href:"/index.html",target:"_blank",title:"Open in new tab",children:(0,p.jsx)("span",{className:"fa fa-external-link"})})}),(0,p.jsx)(a.NavLink,{to:`/${this.userId}/contribute`,className:"btn-donate",title:"Would you like to contribute / compensate us for the effort we put in development of this tool? Click to know more",children:(0,p.jsx)("img",{src:"/assets/donate.png",width:"145",className:"margin-r-5",alt:"Donate us"})}),(0,p.jsx)(X,{}),(0,p.jsxs)(n.JL,{className:"ml-auto",navbar:!0,children:[(0,p.jsx)(z.Z,{children:e=>(0,p.jsx)(v.Z,{instance:this.currentJiraInstance,onLogout:this.props.onLogout,onImport:e})}),!B.yX&&(0,p.jsx)(G,{}),!!h&&(0,p.jsxs)("span",{className:"update-available badge badge-"+(u?"warning":"success"),title:`Jira Assist ${u?"BETA ":""}v${h} is now available. Click to know more.`,onClick:this.showVersionInfo,children:[(0,p.jsx)("i",{className:"fa fa-download"})," Updates available"]}),!this.disableJiraUpdates&&(0,p.jsx)(D,{}),!this.disableNotification&&d&&(0,p.jsx)(R,{notifications:d}),(0,p.jsx)(n.LY,{className:"d-md-down-none",children:(0,p.jsx)("span",{className:"nav-link",onClick:this.showYoutubeHelp,children:(0,p.jsx)("i",{className:"fa fa-youtube-play"})})}),(0,p.jsxs)(n.OB,{nav:!0,direction:"down",children:[(0,p.jsx)(n.Z_,{nav:!0,children:(0,p.jsx)("i",{className:"fa fa-adjust"})}),(0,p.jsx)(n.h_,{end:!0,children:(0,p.jsx)(b,{})})]}),(0,p.jsxs)(n.OB,{nav:!0,direction:"down",onClick:this.trackShare,children:[(0,p.jsx)(n.Z_,{nav:!0,children:(0,p.jsx)("i",{className:"fa fa-share-alt"})}),(0,p.jsxs)(n.h_,{end:!0,children:[(0,p.jsx)(n.hP,{header:!0,tag:"div",className:"text-center",children:(0,p.jsx)("strong",{className:"share-header-text",children:"Share or rate this tool"})}),(0,p.jsxs)("div",{className:"share-items",children:[(0,p.jsx)("a",{href:e,target:"_blank",rel:"noopener noreferrer",title:"Click to rate this tool or add a comment in chrome web store",children:(0,p.jsx)("i",{className:"fa fa-star pull-left"})}),(0,p.jsx)("a",{href:s,target:"_blank",rel:"noopener noreferrer",title:"Share with GMail",children:(0,p.jsx)("i",{className:"fa fa-envelope pull-left"})}),(0,p.jsx)("a",{href:t,target:"_blank",rel:"noopener noreferrer",title:"Share with Linked in",children:(0,p.jsx)("i",{className:"fa fa-linkedin-square pull-left"})}),(0,p.jsx)("a",{href:o,target:"_blank",rel:"noopener noreferrer",title:"Share with Facebook",children:(0,p.jsx)("i",{className:"fa fa-facebook-square pull-left"})}),(0,p.jsx)("a",{href:l,target:"_blank",rel:"noopener noreferrer",title:"Share with Twitter",children:(0,p.jsx)("i",{className:"fa fa-twitter-square pull-left"})})]})]})]}),(0,p.jsx)(n.LY,{className:"d-md-down-none",children:(0,p.jsx)(a.NavLink,{to:`/${this.userId}/contactus`,className:"nav-link",children:(0,p.jsx)("i",{className:"fa fa-phone",title:"Contact us"})})})]}),c&&(0,p.jsx)(x,{onHide:this.hideYoutube})]})}}const W=Z}}]);