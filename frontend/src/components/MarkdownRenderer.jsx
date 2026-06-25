import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "./CodeBlock";

const components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const isInline = !match && !className;

    if (isInline) {
      return <code className="inline-code" {...props}>{children}</code>;
    }

    return <CodeBlock language={match ? match[1] : "text"}>{children}</CodeBlock>;
  },

  a({ href, children, ...props }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="md-link" {...props}>
        {children}
      </a>
    );
  },

  table({ children }) {
    return (
      <div className="table-wrapper">
        <table>{children}</table>
      </div>
    );
  },
};

function MarkdownRenderer({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}

export default memo(MarkdownRenderer);
