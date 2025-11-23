/**
 * Custom notification utility for Chrome extension context
 * Provides reliable toast notifications that work in injected content scripts
 */

/**
 * Custom notification function that creates a simple toast notification
 * Works reliably in Chrome extension context
 */
export const showCustomNotification = (title: string, message: string, type: 'success' | 'error' | 'warning') => {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#f6ffed' : type === 'error' ? '#fff2f0' : '#fffbe6'};
    border: 1px solid ${type === 'success' ? '#b7eb8f' : type === 'error' ? '#ffccc7' : '#ffe58f'};
    border-left: 4px solid ${type === 'success' ? '#52c41a' : type === 'error' ? '#ff4d4f' : '#faad14'};
    border-radius: 6px;
    padding: 16px;
    min-width: 300px;
    max-width: 400px;
    box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    transition: all 0.3s ease;
    opacity: 0;
    transform: translateX(100%);
  `;
  
  notification.innerHTML = `
    <div style="font-weight: 600; color: #262626; margin-bottom: 4px; font-size: 14px;">
      ${title}
    </div>
    <div style="color: #595959; font-size: 12px; line-height: 1.4;">
      ${message}
    </div>
  `;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  }, 10);
  
  // Remove after delay
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 4000);
};