import Swal from 'sweetalert2';

// Custom toast configuration
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

// Toast utility functions
export const showSuccess = (message: string) => {
  return Toast.fire({
    icon: 'success',
    title: message
  });
};

export const showError = (message: string) => {
  return Toast.fire({
    icon: 'error',
    title: message
  });
};

export const showWarning = (message: string) => {
  return Toast.fire({
    icon: 'warning',
    title: message
  });
};

export const showInfo = (message: string) => {
  return Toast.fire({
    icon: 'info',
    title: message
  });
};

// For confirmation dialogs (not toast)
export const showConfirm = async (options: {
  title: string;
  text?: string;
  icon?: 'warning' | 'question' | 'info';
  confirmButtonText?: string;
  cancelButtonText?: string;
}) => {
  return Swal.fire({
    title: options.title,
    text: options.text,
    icon: options.icon || 'question',
    showCancelButton: true,
    confirmButtonColor: '#8B4513',
    cancelButtonColor: '#64748b',
    confirmButtonText: options.confirmButtonText || 'Xác nhận',
    cancelButtonText: options.cancelButtonText || 'Hủy',
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'rounded-lg font-bold px-6 py-3',
      cancelButton: 'rounded-lg font-bold px-6 py-3'
    }
  });
};

// For longer messages or multi-line content (modal instead of toast)
export const showMessage = (options: {
  title: string;
  html?: string;
  text?: string;
  icon?: 'success' | 'error' | 'warning' | 'info' | 'question';
  confirmButtonText?: string;
}) => {
  return Swal.fire({
    title: options.title,
    html: options.html,
    text: options.text,
    icon: options.icon || 'info',
    confirmButtonColor: '#8B4513',
    confirmButtonText: options.confirmButtonText || 'OK',
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'rounded-lg font-bold px-6 py-3'
    }
  });
};

export default {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  confirm: showConfirm,
  message: showMessage
};
