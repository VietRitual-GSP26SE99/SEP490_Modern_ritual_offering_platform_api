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

export const showPrompt = async (options: {
  title: string;
  text?: string;
  inputPlaceholder?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}) => {
  return Swal.fire({
    title: options.title,
    text: options.text,
    input: 'textarea',
    inputPlaceholder: options.inputPlaceholder || 'Nhập nội dung...',
    inputAttributes: {
      'aria-label': options.inputPlaceholder || 'Nhập nội dung'
    },
    showCancelButton: true,
    confirmButtonColor: '#8B4513',
    cancelButtonColor: '#64748b',
    confirmButtonText: options.confirmButtonText || 'Xác nhận',
    cancelButtonText: options.cancelButtonText || 'Hủy',
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'rounded-lg font-bold px-6 py-3',
      cancelButton: 'rounded-lg font-bold px-6 py-3',
      input: 'rounded-xl p-4 border-gray-300 focus:border-[#8B4513] focus:ring-[#8B4513]'
    }
  });
};

export const showSelectPrompt = async (options: {
  title: string;
  text?: string;
  inputOptions: Record<string, string>;
  inputPlaceholder?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}) => {
  return Swal.fire({
    title: options.title,
    text: options.text,
    input: 'select',
    inputOptions: options.inputOptions,
    inputPlaceholder: options.inputPlaceholder || 'Chọn một lý do...',
    showCancelButton: true,
    confirmButtonColor: '#8B4513',
    confirmButtonText: options.confirmButtonText || 'Xác nhận',
    cancelButtonColor: '#64748b',
    cancelButtonText: options.cancelButtonText || 'Hủy',
    inputValidator: (value) => {
      if (!value) {
        return 'Vui lòng chọn một tùy chọn!';
      }
    },
    didOpen: (popup) => {
      // Adjust input wrapper
      const inputWrapper = popup.querySelector('.swal2-input-swal2-input') as HTMLElement;
      if (inputWrapper) {
        inputWrapper.style.margin = '0 !important';
        inputWrapper.style.padding = '0 !important';
      }

      const selectInput = popup.querySelector('select') as HTMLSelectElement;
      if (selectInput) {
        selectInput.style.cssText = `
          width: calc(100% - 32px) !important;
          margin: 0 16px !important;
          padding: 12px 40px 12px 16px !important;
          border: 2px solid #E5E7EB !important;
          border-radius: 12px !important;
          font-size: 15px !important;
          background-color: #ffffff !important;
          cursor: pointer !important;
          transition: border-color 0.3s ease !important;
          appearance: none !important;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238B4513' d='M1 4l5 4 5-4'/%3E%3C/svg%3E") !important;
          background-repeat: no-repeat !important;
          background-position: right 12px center !important;
          box-sizing: border-box !important;
        `;
        selectInput.addEventListener('focus', () => {
          selectInput.style.borderColor = '#8B4513 !important';
          selectInput.style.boxShadow = '0 0 0 3px rgba(139, 69, 19, 0.1) !important';
        });
        selectInput.addEventListener('blur', () => {
          selectInput.style.borderColor = '#E5E7EB !important';
          selectInput.style.boxShadow = 'none !important';
        });
      }
    },
    customClass: {
      popup: 'rounded-2xl shadow-lg',
      title: 'font-bold text-lg',
      htmlContainer: 'swal2-html-container text-center',
      confirmButton: 'rounded-lg font-bold px-6 py-3 bg-[#8B4513] hover:bg-[#6d3410] transition',
      cancelButton: 'rounded-lg font-bold px-6 py-3 bg-gray-400 hover:bg-gray-500 transition'
    }
  });
};

export default {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  confirm: showConfirm,
  message: showMessage,
  prompt: showPrompt,
  selectPrompt: showSelectPrompt
};
