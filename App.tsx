
import React, { useState, useCallback } from 'react';
import type { Chat } from '@google/genai';
import { FileUpload } from './components/FileUpload';
import { MarkdownDisplay } from './components/MarkdownDisplay';
import { Chatbot } from './components/Chatbot';
import { Loader } from './components/Loader';
import { extractTextFromPdf } from './services/pdfService';
import { convertToMarkdown, startChatSession, sendMessageToChat } from './services/geminiService';
import type { ChatMessage } from './types';

type AppState = 'initial' | 'processing' | 'processed' | 'error';

export default function App() {
  const [appState, setAppState] = useState<AppState>('initial');
  const [fileName, setFileName] = useState<string>('');
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isBotTyping, setIsBotTyping] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return;

    setAppState('processing');
    setFileName(file.name);
    setError('');
    setMarkdownContent('');
    setChatMessages([]);
    setChatSession(null);

    try {
      const extractedText = await extractTextFromPdf(file);
      if (!extractedText) {
        throw new Error('Could not extract text from the PDF.');
      }

      const md = await convertToMarkdown(extractedText);
      setMarkdownContent(md);

      const session = startChatSession(extractedText);
      setChatSession(session);
      setChatMessages([
        {
          role: 'bot',
          text: `Hello! I've analyzed the document "${file.name}". Feel free to ask me anything about its content.`,
        },
      ]);
      setAppState('processed');
    } catch (err) {
      console.error('Processing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to process the PDF. ${errorMessage}`);
      setAppState('error');
    }
  }, []);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!chatSession || isBotTyping) return;

    const userMessage: ChatMessage = { role: 'user', text: message };
    setChatMessages((prev) => [...prev, userMessage]);
    setIsBotTyping(true);

    try {
      const botResponseText = await sendMessageToChat(chatSession, message);
      const botMessage: ChatMessage = { role: 'bot', text: botResponseText };
      setChatMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        role: 'bot',
        text: 'Sorry, I encountered an error. Please try again.',
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsBotTyping(false);
    }
  }, [chatSession, isBotTyping]);
  
  const resetApp = () => {
    setAppState('initial');
    setFileName('');
    setMarkdownContent('');
    setChatSession(null);
    setChatMessages([]);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
            PDF Insight Chat
          </h1>
          <p className="mt-2 text-lg text-slate-600 max-w-2xl mx-auto">
            Upload a PDF, see its content as Markdown, and chat with an AI to get answers.
          </p>
        </header>

        <main>
          {appState === 'initial' && <FileUpload onFileSelect={handleFileSelect} />}

          {appState === 'processing' && (
            <Loader message={`Processing "${fileName}"... This may take a moment.`} />
          )}
          
          {appState === 'error' && (
             <div className="text-center p-8 bg-white rounded-lg shadow-lg animate-fadeIn">
              <h2 className="text-2xl font-semibold text-red-600 mb-4">An Error Occurred</h2>
              <p className="text-slate-600 mb-6">{error}</p>
              <button onClick={resetApp} className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg shadow hover:bg-indigo-700 transition-colors duration-200">
                Try Again
              </button>
            </div>
          )}

          {appState === 'processed' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-900">Document Content</h2>
                    <button onClick={resetApp} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                        Upload New PDF
                    </button>
                </div>
                <MarkdownDisplay content={markdownContent} fileName={fileName} />
              </div>
              <div className="flex flex-col">
                 <h2 className="text-2xl font-bold text-slate-900 mb-4">Chat Assistant</h2>
                <Chatbot
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  isTyping={isBotTyping}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
