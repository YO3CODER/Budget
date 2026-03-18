import { Info, CheckCircle, AlertCircle, AlertTriangle, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

interface NotificationProps {
  message: string
  type?: NotificationType
  duration?: number // en millisecondes
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center'
  showIcon?: boolean
  showCloseButton?: boolean
  onclose: () => void
}

const notificationStyles = {
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-500',
    progressColor: 'bg-blue-500'
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    iconColor: 'text-green-500',
    progressColor: 'bg-green-500'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-500',
    progressColor: 'bg-yellow-500'
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-500',
    progressColor: 'bg-red-500'
  }
}

const positionClasses = {
  'top-left': 'toast-top toast-left',
  'top-right': 'toast-top toast-right',
  'bottom-left': 'toast-bottom toast-left',
  'bottom-right': 'toast-bottom toast-right',
  'top-center': 'toast-top toast-center',
  'bottom-center': 'toast-bottom toast-center'
}

export const Notification: React.FC<NotificationProps> = ({ 
  message, 
  type = 'info',
  duration = 5000,
  position = 'bottom-left',
  showIcon = true,
  showCloseButton = true,
  onclose 
}) => {
  const [progress, setProgress] = useState(100)
  const [isPaused, setIsPaused] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  const styles = notificationStyles[type]
  const IconComponent = styles.icon

  // Gestion du timer avec pause au survol
  useEffect(() => {
    if (isPaused || isExiting) return

    const interval = 50 // Mise à jour toutes les 50ms
    const step = (interval / duration) * 100
    
    const timer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - step
        if (newProgress <= 0) {
          clearInterval(timer)
          handleClose()
          return 0
        }
        return newProgress
      })
    }, interval)

    return () => clearInterval(timer)
  }, [duration, isPaused, isExiting])

  // Animation de fermeture
  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onclose()
    }, 300) // Durée de l'animation de sortie
  }

  // Fermeture manuelle
  const handleManualClose = () => {
    handleClose()
  }

  return (
    <div className={`toast ${positionClasses[position]} z-50`}>
      <div 
        className={`
          alert p-0 shadow-lg border-l-4 ${styles.borderColor} ${styles.bgColor}
          transform transition-all duration-300 ease-in-out
          ${isExiting ? 'opacity-0 translate-y-2 scale-95' : 'opacity-100 translate-y-0 scale-100'}
        `}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Barre de progression */}
        <div 
          className={`h-1 ${styles.progressColor} transition-all duration-100 ease-linear rounded-t-lg`}
          style={{ width: `${progress}%` }}
        />

        <div className="p-3 flex items-start gap-2 relative">
          {/* Icône */}
          {showIcon && (
            <div className={`flex-shrink-0 ${styles.iconColor}`}>
              <IconComponent className="w-5 h-5" />
            </div>
          )}

          {/* Message */}
          <div className={`flex-1 text-sm ${styles.textColor} break-words`}>
            {message}
          </div>

          {/* Bouton de fermeture */}
          {showCloseButton && (
            <button
              onClick={handleManualClose}
              className={`
                flex-shrink-0 ml-2 p-1 rounded-full 
                ${styles.textColor} hover:bg-gray-200 
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400
              `}
              aria-label="Fermer la notification"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Indicateur de pause (optionnel) */}
        {isPaused && (
          <div className="px-3 pb-2">
            <span className={`text-xs ${styles.textColor} opacity-75`}>
              ⏸️ Pause - La notification reprendra dans {Math.ceil(progress * duration / 10000)}s
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// Hook personnalisé pour gérer les notifications
export const useNotification = () => {
  const [notifications, setNotifications] = useState<Array<{ id: string; props: NotificationProps }>>([])

  const showNotification = (
    message: string, 
    options?: Omit<NotificationProps, 'message' | 'onclose' | 'duration'> & { duration?: number }
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    
    const notification: { id: string; props: NotificationProps } = {
      id,
      props: {
        message,
        ...options,
        duration: options?.duration || 5000,
        onclose: () => {
          setNotifications(prev => prev.filter(n => n.id !== id))
        }
      }
    }

    setNotifications(prev => [...prev, notification])
    
    // Retourner l'id pour permettre la fermeture manuelle
    return id
  }

  const closeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const NotificationContainer = () => (
    <>
      {notifications.map(({ id, props }) => (
        <Notification key={id} {...props} />
      ))}
    </>
  )

  return {
    showNotification,
    closeNotification,
    clearAllNotifications,
    NotificationContainer,
    notifications
  }
}

export default Notification