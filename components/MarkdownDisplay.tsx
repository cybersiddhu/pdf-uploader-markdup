
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownDisplayProps {
  content: string;
  fileName: string;
}

export const MarkdownDisplay: React.FC<MarkdownDisplayProps> = ({ content, fileName }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
       <div className="p-4 border-b border-slate-200 bg-slate-50">
        <p className="font-mono text-sm text-slate-600 truncate">{fileName}</p>
      </div>
      <article className="prose prose-slate max-w-none p-6 overflow-y-auto flex-grow">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
        </ReactMarkdown>
      </article>
    </div>
  );
};
