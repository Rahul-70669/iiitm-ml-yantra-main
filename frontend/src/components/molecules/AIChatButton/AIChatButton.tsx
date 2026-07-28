import React from 'react'
import Icon from '../../atoms/Icon'

export interface AIChatButtonProps {
    onClick: () => void
    hasNotification?: boolean
}

export const AIChatButton: React.FC<AIChatButtonProps> = ({ onClick, hasNotification = false }) => {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-content shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-30 flex items-center justify-center group"
            title="AI Assistant"
        >
            <Icon name="smart_toy" className="text-3xl group-hover:animate-pulse" />

            {hasNotification && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-error rounded-full animate-ping" />
            )}
            {hasNotification && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-error rounded-full" />
            )}
        </button>
    )
}

export default AIChatButton
