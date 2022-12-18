import { PureComponent } from "react";
import { getGitHubIssueUrl } from "../constants/utils";
import Link from "../controls/Link";

class TextParser extends PureComponent {
    render() { return parseText(this.props.message); }
}

export default TextParser;

const text_parser = /#\d+|(https?):\/\/(www\.)?[a-z0-9.:].*?(?<!\.\.?)(?=\s|[.]$|$)/g;
function parseText(msg) {
    if (!msg || typeof msg !== 'string') {
        return msg;
    }

    const msgArr = [];
    let testResult = null;
    let startIdx = 0;

    while ((testResult = text_parser.exec(msg))) {
        const str = testResult[0];
        const idx = testResult.index;
        msgArr.push(msg.substring(startIdx, idx));
        const url = (str.startsWith('#')) ? getGitHubIssueUrl(str) : str;
        msgArr.push(<Link href={url}>{str}</Link>);
        startIdx = idx + str.length;
    }

    if (startIdx < msg.length) {
        msgArr.push(msg.substring(startIdx));
    }

    return msgArr.length ? msgArr : msg;
}
