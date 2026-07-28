import React, { useState, useRef, useEffect } from 'react'
import Icon from '../../atoms/Icon'
import apiClient from '../../../services/api'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'

export interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

export interface AIChatPanelProps {
    isOpen: boolean
    onClose: () => void
    sessionId: string | null
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ isOpen, onClose, sessionId }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '0',
            role: 'assistant',
            content: '👋 Hi! I\'m your ML Assistant. I can help you with:\n\n- **Dataset Analysis** - Get insights about your data\n- **Cleaning Recommendations** - Suggest best cleaning strategies\n- **Algorithm Suggestions** - Recommend ML models\n- **Q&A** - Answer your ML questions\n\nHow can I help you today?',
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || !sessionId) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setLoading(true)

        try {
            const response = await apiClient.chatWithAI(sessionId, input)

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.response,
                timestamp: new Date()
            }

            setMessages(prev => [...prev, assistantMessage])
        } catch (error: any) {
            toast.error(error.message || 'Failed to get response')

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '❌ Sorry, I encountered an error. Please try again.',
                timestamp: new Date()
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setLoading(false)
        }
    }

    const handleQuickAction = async (action: string) => {
        setInput(action)
        setTimeout(() => handleSend(), 100)
    }

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed right-0 top-0 h-screen w-full md:w-[500px] bg-base-100 z-50 shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-base-300">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Icon name="smart_toy" className="text-primary text-2xl" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">AI Assistant</h3>
                            <p className="text-xs text-base-content/70">Powered by Google Gemini</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm">
                        <Icon name="close" />
                    </button>
                </div>

                {/* Quick Actions */}
                {!sessionId ? (
                    <div className="p-4 bg-warning/10 border-b border-warning/20">
                        <p className="text-sm text-warning">
                            <Icon name="info" className="inline mr-1" />
                            Please upload a dataset to unlock AI features
                        </p>
                    </div>
                ) : (
                    <div className="p-4 border-b border-base-300">
                        <p className="text-xs text-base-content/70 mb-2">Quick Actions:</p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleQuickAction('Analyze my dataset')}
                                className="btn btn-xs btn-outline"
                                disabled={loading}
                            >
                                <Icon name="analytics" className="text-sm" />
                                Analyze Dataset
                            </button>
                            <button
                                onClick={() => handleQuickAction('Suggest cleaning steps')}
                                className="btn btn-xs btn-outline"
                                disabled={loading}
                            >
                                <Icon name="cleaning_services" className="text-sm" />
                                Cleaning Tips
                            </button>
                            <button
                                onClick={() => handleQuickAction('Recommend algorithms for my data')}
                                className="btn btn-xs btn-outline"
                                disabled={loading}
                            >
                                <Icon name="psychology" className="text-sm" />
                                Algorithm Advice
                            </button>
                        </div>
                    </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user'
                                    ? 'bg-primary text-primary-content'
                                    : 'bg-base-200'
                                    }`}
                            >
                                {message.role === 'assistant' ? (
                                    <div className="prose prose-sm max-w-none">
                                        <ReactMarkdown>{message.content}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                )}
                                <p className="text-xs opacity-70 mt-2">
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-base-200 rounded-lg p-3">
                                <div className="flex gap-1">
                                    <span className="loading loading-dots loading-sm"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-base-300">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="input input-bordered flex-1"
                            placeholder={sessionId ? "Ask me anything..." : "Upload a dataset first..."}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            disabled={!sessionId || loading}
                        />
                        <button
                            className="btn btn-primary btn-circle"
                            onClick={handleSend}
                            disabled={!input.trim() || !sessionId || loading}
                        >
                            <Icon name="send" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default AIChatPanel
