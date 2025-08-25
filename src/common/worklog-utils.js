export function stringifyComment(comment) {
  if (!comment || typeof comment === "string") {
    return comment;
  }

  if (comment.content) {
    return extractDescription(comment.content);
  }
}

function extractDescription(content) {
    if (!content) { return ''; }
    if (!Array.isArray(content) && content.content) {
        content = content.content;
    }

  if (!content || !Array.isArray(content)) {
    return "";
  }

  const lines = [];

  function extractTextFromNode(node) {
    if (!node) {
      return "";
    }
    if (node.type === "text") {
      return node.text || "";
    }
    if (node.content) {
      return node.content.map(extractTextFromNode).join("");
    }
    return "";
  }

  for (const block of content) {
    switch (block.type) {
      case "paragraph":
      case "blockquote":
      case "panel":
      case "heading":
      case "codeBlock":
        lines.push(extractTextFromNode(block));
        break;

      case "bulletList":
      case "orderedList":
        for (const item of block.content ?? []) {
          if (item.type === "listItem") {
            const itemText =
              item.content?.map(extractTextFromNode).join("") || "";
            lines.push(itemText);
          }
        }
        break;

      default:
        lines.push(extractTextFromNode(block));
        break;
    }
  }

  return lines
    .filter((line) => line.trim().length > 0)
    .join("\n")
    .trim();
}