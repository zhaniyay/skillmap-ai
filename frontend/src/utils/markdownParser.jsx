import React from 'react';

/**
 * Simple Markdown parser for GPT responses
 * Handles common formatting like **bold**, *italic*, and basic line breaks
 */
export const parseMarkdown = (text) => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Simple approach: process the text sequentially
  const parts = [];
  let remainingText = text;
  let key = 0;

  while (remainingText.length > 0) {
    // Check for bold text **text**
    const boldMatch = remainingText.match(/^(.*?)\*\*(.*?)\*\*(.*)/s);
    if (boldMatch) {
      const [, before, boldContent, after] = boldMatch;
      
      // Add text before bold
      if (before) {
        parts.push(<span key={key++}>{before}</span>);
      }
      
      // Add bold text
      parts.push(
        <strong key={key++} className="font-bold">
          {boldContent}
        </strong>
      );
      
      remainingText = after;
      continue;
    }

    // Check for italic text *text*
    const italicMatch = remainingText.match(/^(.*?)\*(.*?)\*(.*)/s);
    if (italicMatch) {
      const [, before, italicContent, after] = italicMatch;
      
      // Add text before italic
      if (before) {
        parts.push(<span key={key++}>{before}</span>);
      }
      
      // Add italic text
      parts.push(
        <em key={key++} className="italic">
          {italicContent}
        </em>
      );
      
      remainingText = after;
      continue;
    }

    // Check for code `text`
    const codeMatch = remainingText.match(/^(.*?)`(.*?)`(.*)/s);
    if (codeMatch) {
      const [, before, codeContent, after] = codeMatch;
      
      // Add text before code
      if (before) {
        parts.push(<span key={key++}>{before}</span>);
      }
      
      // Add code text
      parts.push(
        <code key={key++} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
          {codeContent}
        </code>
      );
      
      remainingText = after;
      continue;
    }

    // No more markdown patterns found, add remaining text
    parts.push(<span key={key++}>{remainingText}</span>);
    break;
  }

  return parts.length === 1 ? parts[0] : <span>{parts}</span>;
};

/**
 * Component wrapper for rendering markdown text
 */
export const MarkdownText = ({ children, className = '' }) => {
  const parsedContent = parseMarkdown(children);
  
  return (
    <span className={className}>
      {parsedContent}
    </span>
  );
};

export default MarkdownText;
